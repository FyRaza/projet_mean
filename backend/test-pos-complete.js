/**
 * ═══════════════════════════════════════════════════
 *  TEST COMPLET - Fonctionnalité POS (Caisse) AVANCÉE
 *  Tests pour: remises, TVA, monnaie, facture, résumé caisse
 * ═══════════════════════════════════════════════════
 *
 *  Usage: node test-pos-complete.js
 *
 *  Prérequis: le backend doit être démarré sur localhost:5000
 */

const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

// ─── HTTP Helper ───
async function api(method, path, body, token) {
  const url = `${BASE_URL}${path}`;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data, ok: res.ok };
}

// ─── Test helpers ───
let passed = 0;
let failed = 0;
const results = [];

function assert(condition, testName) {
  if (condition) {
    passed++;
    results.push({ name: testName, status: 'PASS' });
    console.log(`  ✅ ${testName}`);
  } else {
    failed++;
    results.push({ name: testName, status: 'FAIL' });
    console.log(`  ❌ ${testName}`);
  }
}

function assertEqual(actual, expected, testName) {
  const condition = actual === expected;
  if (condition) {
    passed++;
    results.push({ name: testName, status: 'PASS' });
    console.log(`  ✅ ${testName} (${actual})`);
  } else {
    failed++;
    results.push({ name: testName, status: 'FAIL' });
    console.log(`  ❌ ${testName} - Attendu: ${expected}, Reçu: ${actual}`);
  }
}

function assertClose(actual, expected, tolerance, testName) {
  const diff = Math.abs(actual - expected);
  const condition = diff <= tolerance;
  if (condition) {
    passed++;
    results.push({ name: testName, status: 'PASS' });
    console.log(`  ✅ ${testName} (${actual} ≈ ${expected})`);
  } else {
    failed++;
    results.push({ name: testName, status: 'FAIL' });
    console.log(`  ❌ ${testName} - Attendu: ${expected} (±${tolerance}), Reçu: ${actual}`);
  }
}

// ─── Main Test Suite ───
async function runTests() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║  TEST SUITE - POS AVANCÉ (Remises, TVA, etc.)   ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1. SETUP: Register/Login users
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('═══ 1. SETUP ═══');

  const timestamp = Date.now();

  // Register a boutique owner
  const regBoutique = await api('POST', '/auth/register', {
    firstName: 'CaissierTest',
    lastName: 'POS',
    email: `pos-advanced-${timestamp}@test.com`,
    password: 'Test1234!',
    role: 'boutique'
  });
  assert(regBoutique.ok, 'Inscription boutique owner');
  const boutiqueToken = regBoutique.data.token;

  // Register an admin
  const regAdmin = await api('POST', '/auth/register', {
    firstName: 'AdminTest',
    lastName: 'POS',
    email: `pos-admin-${timestamp}@test.com`,
    password: 'Test1234!',
    role: 'admin'
  });
  const adminToken = regAdmin.data.token;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2. Create a boutique
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('\n═══ 2. CRÉATION BOUTIQUE ═══');

  const createBoutique = await api('POST', '/boutiques', {
    name: `TestBoutique POS Avancé ${timestamp}`,
    description: 'Boutique de test POS avancé',
    contactEmail: 'test@pos.com'
  }, boutiqueToken);
  assert(createBoutique.ok || createBoutique.status === 201, 'Création boutique');
  const boutiqueId = createBoutique.data._id || createBoutique.data.id;
  assert(!!boutiqueId, 'Boutique ID récupéré');

  // Activate boutique (as admin)
  if (adminToken) {
    await api('PUT', `/boutiques/${boutiqueId}`, { status: 'active' }, adminToken);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3. Create products
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('\n═══ 3. CRÉATION PRODUITS ═══');

  const product1 = await api('POST', '/products', {
    name: `Produit A ${timestamp}`,
    price: 10000,
    stock: 100,
    boutiqueId: boutiqueId,
    sku: `SKU-A-${timestamp}`
  }, boutiqueToken);
  assert(product1.ok || product1.status === 201, 'Produit 1 créé');
  const productId1 = product1.data._id;

  const product2 = await api('POST', '/products', {
    name: `Produit B ${timestamp}`,
    price: 5000,
    stock: 50,
    boutiqueId: boutiqueId,
    sku: `SKU-B-${timestamp}`
  }, boutiqueToken);
  assert(product2.ok || product2.status === 201, 'Produit 2 créé');
  const productId2 = product2.data._id;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4. TESTS REMISES (DISCOUNTS)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('\n═══ 4. TESTS REMISES ═══');

  // 4.1 Remise globale en pourcentage
  const saleWithGlobalDiscount = await api('POST', '/orders/pos', {
    items: [
      { product: productId1, quantity: 2 },  // 2 × 10000 = 20000
      { product: productId2, quantity: 1 }     // 1 × 5000 = 5000
    ],
    boutiqueId: boutiqueId,
    paymentMethod: 'cash',
    discountPercent: 10  // 10% de remise sur 25000 = 2500
  }, boutiqueToken);
  assert(saleWithGlobalDiscount.status === 201, 'Vente avec remise globale %');
  assertEqual(saleWithGlobalDiscount.data.subtotal, 25000, 'Sous-total = 25000');
  assertEqual(saleWithGlobalDiscount.data.discountPercent, 10, 'Remise % = 10');
  assertClose(saleWithGlobalDiscount.data.discountAmount, 2500, 1, 'Remise montant ≈ 2500');
  assertClose(saleWithGlobalDiscount.data.totalAmount, 22500, 1, 'Total après remise ≈ 22500');

  // 4.2 Remise globale en montant fixe
  const saleWithFixedDiscount = await api('POST', '/orders/pos', {
    items: [
      { product: productId1, quantity: 1 }  // 1 × 10000 = 10000
    ],
    boutiqueId: boutiqueId,
    paymentMethod: 'cash',
    discountAmount: 2000  // Remise fixe de 2000
  }, boutiqueToken);
  assert(saleWithFixedDiscount.status === 201, 'Vente avec remise fixe');
  assertEqual(saleWithFixedDiscount.data.subtotal, 10000, 'Sous-total = 10000');
  assertClose(saleWithFixedDiscount.data.discountAmount, 2000, 1, 'Remise = 2000');
  assertClose(saleWithFixedDiscount.data.totalAmount, 8000, 1, 'Total après remise = 8000');

  // 4.3 Remise par article (itemDiscounts)
  const saleWithItemDiscount = await api('POST', '/orders/pos', {
    items: [
      { product: productId1, quantity: 1 },  // 10000
      { product: productId2, quantity: 1 }   // 5000
    ],
    boutiqueId: boutiqueId,
    paymentMethod: 'cash',
    itemDiscounts: [
      {
        product: productId1,
        discountPercent: 20  // 20% sur produit 1 = 2000
      }
    ]
  }, boutiqueToken);
  assert(saleWithItemDiscount.status === 201, 'Vente avec remise par article');
  // Produit 1: 10000 - 20% = 8000, Produit 2: 5000
  assertClose(saleWithItemDiscount.data.subtotal, 13000, 1, 'Sous-total avec remise article ≈ 13000');
  assert(Array.isArray(saleWithItemDiscount.data.itemDiscounts), 'itemDiscounts est un tableau');
  assert(saleWithItemDiscount.data.itemDiscounts.length > 0, 'itemDiscounts contient des éléments');

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 5. TESTS TVA
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('\n═══ 5. TESTS TVA ═══');

  // 5.1 Vente avec TVA 20%
  const saleWithTax = await api('POST', '/orders/pos', {
    items: [
      { product: productId1, quantity: 1 }  // 10000
    ],
    boutiqueId: boutiqueId,
    paymentMethod: 'cash',
    taxRate: 20  // 20% TVA
  }, boutiqueToken);
  assert(saleWithTax.status === 201, 'Vente avec TVA');
  assertEqual(saleWithTax.data.subtotal, 10000, 'Sous-total = 10000');
  assertEqual(saleWithTax.data.taxRate, 20, 'Taux TVA = 20%');
  assertClose(saleWithTax.data.taxAmount, 2000, 1, 'TVA = 2000 (20% de 10000)');
  assertClose(saleWithTax.data.totalAmount, 12000, 1, 'Total avec TVA = 12000');

  // 5.2 Vente avec remise + TVA
  const saleWithDiscountAndTax = await api('POST', '/orders/pos', {
    items: [
      { product: productId1, quantity: 1 }  // 10000
    ],
    boutiqueId: boutiqueId,
    paymentMethod: 'cash',
    discountPercent: 10,  // 10% remise = 1000
    taxRate: 20           // 20% TVA sur (10000 - 1000) = 1800
  }, boutiqueToken);
  assert(saleWithDiscountAndTax.status === 201, 'Vente avec remise + TVA');
  assertEqual(saleWithDiscountAndTax.data.subtotal, 10000, 'Sous-total = 10000');
  assertClose(saleWithDiscountAndTax.data.discountAmount, 1000, 1, 'Remise = 1000');
  const afterDiscount = 10000 - 1000;  // 9000
  assertClose(saleWithDiscountAndTax.data.taxAmount, afterDiscount * 0.2, 1, 'TVA calculée après remise');
  assertClose(saleWithDiscountAndTax.data.totalAmount, afterDiscount * 1.2, 1, 'Total = (10000 - 1000) × 1.2');

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 6. TESTS MONNAIE (CASH CHANGE)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('\n═══ 6. TESTS MONNAIE ═══');

  // 6.1 Vente cash avec monnaie exacte
  const saleExactCash = await api('POST', '/orders/pos', {
    items: [
      { product: productId1, quantity: 1 }  // 10000
    ],
    boutiqueId: boutiqueId,
    paymentMethod: 'cash',
    amountReceived: 10000
  }, boutiqueToken);
  assert(saleExactCash.status === 201, 'Vente cash montant exact');
  assertEqual(saleExactCash.data.amountReceived, 10000, 'Montant reçu = 10000');
  assertEqual(saleExactCash.data.changeGiven, 0, 'Monnaie rendue = 0');

  // 6.2 Vente cash avec monnaie à rendre
  const saleWithChange = await api('POST', '/orders/pos', {
    items: [
      { product: productId1, quantity: 1 }  // 10000
    ],
    boutiqueId: boutiqueId,
    paymentMethod: 'cash',
    amountReceived: 15000
  }, boutiqueToken);
  assert(saleWithChange.status === 201, 'Vente cash avec monnaie');
  assertEqual(saleWithChange.data.amountReceived, 15000, 'Montant reçu = 15000');
  assertEqual(saleWithChange.data.changeGiven, 5000, 'Monnaie rendue = 5000');

  // 6.3 Vente mobile money (pas de monnaie)
  const saleMobileMoney = await api('POST', '/orders/pos', {
    items: [
      { product: productId1, quantity: 1 }  // 10000
    ],
    boutiqueId: boutiqueId,
    paymentMethod: 'mobile_money',
    amountReceived: 20000  // Should be ignored
  }, boutiqueToken);
  assert(saleMobileMoney.status === 201, 'Vente mobile money');
  // amountReceived and changeGiven should not be set for non-cash payments
  assert(saleMobileMoney.data.paymentMethod === 'mobile_money', 'Paiement = mobile_money');

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 7. TESTS NUMÉRO FACTURE (RECEIPT NUMBER)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('\n═══ 7. TESTS NUMÉRO FACTURE ═══');

  // 7.1 Vérifier que le numéro de facture est généré
  const sale1 = await api('POST', '/orders/pos', {
    items: [{ product: productId1, quantity: 1 }],
    boutiqueId: boutiqueId,
    paymentMethod: 'cash'
  }, boutiqueToken);
  assert(sale1.status === 201, 'Vente #1 créée');
  assert(!!sale1.data.receiptNumber, 'Numéro facture généré');
  assert(sale1.data.receiptNumber.startsWith('REC-'), 'Numéro facture commence par REC-');
  const receiptNum1 = sale1.data.receiptNumber;

  // 7.2 Vérifier que le numéro est séquentiel
  const sale2 = await api('POST', '/orders/pos', {
    items: [{ product: productId1, quantity: 1 }],
    boutiqueId: boutiqueId,
    paymentMethod: 'cash'
  }, boutiqueToken);
  assert(sale2.status === 201, 'Vente #2 créée');
  assert(!!sale2.data.receiptNumber, 'Numéro facture #2 généré');
  const receiptNum2 = sale2.data.receiptNumber;
  
  // Les numéros doivent être différents
  assert(receiptNum1 !== receiptNum2, 'Numéros facture différents');

  // 7.3 Format du numéro: REC-YYYYMMDD-NNNN
  const receiptMatch = receiptNum1.match(/^REC-(\d{8})-(\d{4})$/);
  assert(!!receiptMatch, `Format numéro facture correct: ${receiptNum1}`);
  if (receiptMatch) {
    const datePart = receiptMatch[1];
    const seqPart = receiptMatch[2];
    assert(datePart.length === 8, 'Partie date = 8 chiffres');
    assert(seqPart.length === 4, 'Partie séquentielle = 4 chiffres');
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 8. TESTS RÉSUMÉ CAISSE DU JOUR
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('\n═══ 8. TESTS RÉSUMÉ CAISSE DU JOUR ═══');

  // Créer quelques ventes supplémentaires pour le résumé
  await api('POST', '/orders/pos', {
    items: [{ product: productId2, quantity: 2 }],
    boutiqueId: boutiqueId,
    paymentMethod: 'mobile_money'
  }, boutiqueToken);

  await api('POST', '/orders/pos', {
    items: [{ product: productId1, quantity: 1 }],
    boutiqueId: boutiqueId,
    paymentMethod: 'card'
  }, boutiqueToken);

  // 8.1 Récupérer le résumé du jour
  const today = new Date().toISOString().slice(0, 10);
  const dailySummary = await api('GET', `/orders/pos/daily-summary?boutiqueId=${boutiqueId}`, null, boutiqueToken);
  assert(dailySummary.ok, 'Résumé caisse du jour récupéré');
  assert(!!dailySummary.data, 'Données résumé présentes');
  assertEqual(dailySummary.data.date, today, `Date résumé = ${today}`);

  // 8.2 Vérifier les KPIs
  assert(typeof dailySummary.data.totalSales === 'number', 'totalSales est un nombre');
  assert(dailySummary.data.totalSales >= 5, 'totalSales >= 5 (au moins nos ventes de test)');
  assert(typeof dailySummary.data.totalRevenue === 'number', 'totalRevenue est un nombre');
  assert(dailySummary.data.totalRevenue > 0, 'totalRevenue > 0');
  assert(typeof dailySummary.data.averageTicket === 'number', 'averageTicket est un nombre');
  assert(dailySummary.data.averageTicket > 0, 'averageTicket > 0');

  // 8.3 Vérifier le détail financier
  assert(typeof dailySummary.data.totalSubtotal === 'number', 'totalSubtotal présent');
  assert(typeof dailySummary.data.totalDiscount === 'number', 'totalDiscount présent');
  assert(typeof dailySummary.data.totalTax === 'number', 'totalTax présent');
  assert(dailySummary.data.totalSubtotal >= dailySummary.data.totalRevenue, 'Sous-total >= Revenue (logique)');

  // 8.4 Vérifier les ventes par mode de paiement
  assert(typeof dailySummary.data.byPaymentMethod === 'object', 'byPaymentMethod est un objet');
  const paymentMethods = Object.keys(dailySummary.data.byPaymentMethod);
  assert(paymentMethods.length > 0, 'Au moins un mode de paiement présent');
  
  // Vérifier que cash est présent
  if (dailySummary.data.byPaymentMethod.cash) {
    assert(typeof dailySummary.data.byPaymentMethod.cash.count === 'number', 'cash.count est un nombre');
    assert(typeof dailySummary.data.byPaymentMethod.cash.total === 'number', 'cash.total est un nombre');
  }

  // 8.5 Vérifier les ventes par heure
  assert(typeof dailySummary.data.byHour === 'object', 'byHour est un objet');

  // 8.6 Vérifier les heures d'ouverture/fermeture
  if (dailySummary.data.firstSaleTime) {
    assert(!!dailySummary.data.firstSaleTime, 'firstSaleTime présent');
  }
  if (dailySummary.data.lastSaleTime) {
    assert(!!dailySummary.data.lastSaleTime, 'lastSaleTime présent');
  }

  // 8.7 Vérifier la liste des ventes
  assert(Array.isArray(dailySummary.data.sales), 'sales est un tableau');
  assert(dailySummary.data.sales.length >= 5, 'Au moins 5 ventes dans la liste');
  
  // Vérifier la structure d'une vente dans le résumé
  if (dailySummary.data.sales.length > 0) {
    const firstSale = dailySummary.data.sales[0];
    assert(!!firstSale._id, 'Vente a un _id');
    assert(typeof firstSale.totalAmount === 'number', 'Vente a totalAmount');
    assert(typeof firstSale.itemCount === 'number', 'Vente a itemCount');
    assert(!!firstSale.paymentMethod, 'Vente a paymentMethod');
  }

  // 8.8 Test avec date spécifique
  const summaryWithDate = await api('GET', `/orders/pos/daily-summary?boutiqueId=${boutiqueId}&date=${today}`, null, boutiqueToken);
  assert(summaryWithDate.ok, 'Résumé avec date spécifique fonctionne');

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 9. TESTS COMBINAISONS COMPLEXES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('\n═══ 9. TESTS COMBINAISONS COMPLEXES ═══');

  // 9.1 Remise article + remise globale + TVA + monnaie
  const complexSale = await api('POST', '/orders/pos', {
    items: [
      { product: productId1, quantity: 2 },  // 2 × 10000 = 20000
      { product: productId2, quantity: 1 }   // 1 × 5000 = 5000
    ],
    boutiqueId: boutiqueId,
    paymentMethod: 'cash',
    itemDiscounts: [
      { product: productId1, discountPercent: 10 }  // 10% sur produit 1
    ],
    discountPercent: 5,  // 5% remise globale
    taxRate: 20,         // 20% TVA
    amountReceived: 30000,
    customerName: 'Client VIP'
  }, boutiqueToken);
  assert(complexSale.status === 201, 'Vente complexe créée');
  assert(!!complexSale.data.receiptNumber, 'Numéro facture présent');
  assert(complexSale.data.customerName === 'Client VIP', 'Nom client enregistré');
  assert(complexSale.data.amountReceived === 30000, 'Montant reçu = 30000');
  assert(complexSale.data.changeGiven > 0, 'Monnaie rendue > 0');
  assert(complexSale.data.taxAmount > 0, 'TVA calculée');
  assert(complexSale.data.discountAmount > 0, 'Remise calculée');

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 10. TESTS EDGE CASES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('\n═══ 10. TESTS EDGE CASES ═══');

  // 10.1 Remise 100% (gratuit)
  const freeSale = await api('POST', '/orders/pos', {
    items: [{ product: productId2, quantity: 1 }],
    boutiqueId: boutiqueId,
    paymentMethod: 'cash',
    discountPercent: 100
  }, boutiqueToken);
  assert(freeSale.status === 201, 'Vente gratuite (remise 100%)');
  assertClose(freeSale.data.totalAmount, 0, 1, 'Total = 0');

  // 10.2 Remise négative (doit être ignorée ou 0)
  const negativeDiscount = await api('POST', '/orders/pos', {
    items: [{ product: productId1, quantity: 1 }],
    boutiqueId: boutiqueId,
    paymentMethod: 'cash',
    discountPercent: -10
  }, boutiqueToken);
  assert(negativeDiscount.status === 201, 'Vente avec remise négative gérée');
  assert(negativeDiscount.data.discountAmount >= 0, 'Remise >= 0');

  // 10.3 TVA 0%
  const noTaxSale = await api('POST', '/orders/pos', {
    items: [{ product: productId1, quantity: 1 }],
    boutiqueId: boutiqueId,
    paymentMethod: 'cash',
    taxRate: 0
  }, boutiqueToken);
  assert(noTaxSale.status === 201, 'Vente sans TVA');
  assertEqual(noTaxSale.data.taxRate, 0, 'Taux TVA = 0');
  assertEqual(noTaxSale.data.taxAmount, 0, 'Montant TVA = 0');

  // 10.4 Montant reçu insuffisant (devrait quand même fonctionner côté backend, validation côté frontend)
  const insufficientCash = await api('POST', '/orders/pos', {
    items: [{ product: productId1, quantity: 1 }],  // 10000
    boutiqueId: boutiqueId,
    paymentMethod: 'cash',
    amountReceived: 5000  // Insuffisant
  }, boutiqueToken);
  // Le backend accepte mais le frontend devrait valider
  assert(insufficientCash.status === 201, 'Backend accepte montant insuffisant (validation frontend)');

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RESULTS SUMMARY
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║            RÉSULTATS TESTS AVANCÉS              ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║  ✅ Réussis : ${String(passed).padStart(3)}                                ║`);
  console.log(`║  ❌ Échoués : ${String(failed).padStart(3)}                                ║`);
  console.log(`║  📊 Total   : ${String(passed + failed).padStart(3)}                                ║`);
  console.log('╚══════════════════════════════════════════════════╝');

  if (failed > 0) {
    console.log('\n❌ Tests échoués:');
    results.filter(r => r.status === 'FAIL').forEach(r => console.log(`   - ${r.name}`));
  }

  console.log(failed === 0 ? '\n🎉 Tous les tests avancés sont passés !' : '\n⚠️  Certains tests ont échoué.');

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('💥 Erreur fatale:', err);
  process.exit(1);
});

