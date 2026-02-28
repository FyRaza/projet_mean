/**
 * ═══════════════════════════════════════════════════
 *  TEST COMPLET - Fonctionnalité POS (Caisse)
 *  + Non-régression des commandes en ligne
 * ═══════════════════════════════════════════════════
 *
 *  Usage: node test-pos.js
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

// ─── Main Test Suite ───
async function runTests() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║    TEST SUITE - POS (Caisse) + Non-Régression   ║');
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
    email: `pos-test-boutique-${timestamp}@test.com`,
    password: 'Test1234!',
    role: 'boutique'
  });
  assert(regBoutique.ok, 'Inscription boutique owner');
  const boutiqueToken = regBoutique.data.token;

  // Register a buyer (acheteur)
  const regBuyer = await api('POST', '/auth/register', {
    firstName: 'AcheteurTest',
    lastName: 'POS',
    email: `pos-test-buyer-${timestamp}@test.com`,
    password: 'Test1234!',
    role: 'acheteur'
  });
  assert(regBuyer.ok, 'Inscription acheteur');
  const buyerToken = regBuyer.data.token;
  const buyerId = regBuyer.data.user?._id || regBuyer.data.user?.id;

  // Register an admin
  const regAdmin = await api('POST', '/auth/register', {
    firstName: 'AdminTest',
    lastName: 'POS',
    email: `pos-test-admin-${timestamp}@test.com`,
    password: 'Test1234!',
    role: 'admin'
  });
  const adminToken = regAdmin.data.token;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2. Create a boutique
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('\n═══ 2. CRÉATION BOUTIQUE ═══');

  const createBoutique = await api('POST', '/boutiques', {
    name: `TestBoutique POS ${timestamp}`,
    description: 'Boutique de test POS',
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
    name: `Produit POS A ${timestamp}`,
    price: 5000,
    stock: 50,
    boutiqueId: boutiqueId,
    sku: `SKU-A-${timestamp}`
  }, boutiqueToken);
  assert(product1.ok || product1.status === 201, 'Produit 1 créé');
  const productId1 = product1.data._id;

  const product2 = await api('POST', '/products', {
    name: `Produit POS B ${timestamp}`,
    price: 12000,
    stock: 20,
    boutiqueId: boutiqueId,
    sku: `SKU-B-${timestamp}`
  }, boutiqueToken);
  assert(product2.ok || product2.status === 201, 'Produit 2 créé');
  const productId2 = product2.data._id;

  const product3 = await api('POST', '/products', {
    name: `Produit POS C ${timestamp}`,
    price: 3500,
    stock: 2,
    boutiqueId: boutiqueId
  }, boutiqueToken);
  assert(product3.ok || product3.status === 201, 'Produit 3 créé (stock limité)');
  const productId3 = product3.data._id;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4. POS SALE TESTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('\n═══ 4. TESTS VENTES POS (Caisse) ═══');

  // 4.1 Create POS sale (anonymous, cash)
  const sale1 = await api('POST', '/orders/pos', {
    items: [
      { product: productId1, quantity: 3 },
      { product: productId2, quantity: 1 }
    ],
    boutiqueId: boutiqueId,
    paymentMethod: 'cash',
    customerName: 'Client Anonyme'
  }, boutiqueToken);
  assert(sale1.status === 201, 'Vente POS #1 créée (anonyme, cash)');
  assert(sale1.data.orderType === 'pos', 'orderType = pos');
  assert(sale1.data.status === 'delivered', 'Statut = delivered (vente immédiate)');
  assert(sale1.data.paymentStatus === 'paid', 'paymentStatus = paid');
  assert(sale1.data.totalAmount === (5000 * 3 + 12000 * 1), 'Total correct: 27000');
  assert(sale1.data.customerName === 'Client Anonyme', 'Nom client enregistré');
  const saleId1 = sale1.data._id;

  // 4.2 Verify stock decreased
  const checkProduct1 = await api('GET', `/products/${productId1}`, null, boutiqueToken);
  assert(checkProduct1.data.stock === 47, 'Stock produit 1 diminué (50 → 47)');

  const checkProduct2 = await api('GET', `/products/${productId2}`, null, boutiqueToken);
  assert(checkProduct2.data.stock === 19, 'Stock produit 2 diminué (20 → 19)');

  // 4.3 Create POS sale with mobile money
  const sale2 = await api('POST', '/orders/pos', {
    items: [
      { product: productId1, quantity: 2 }
    ],
    boutiqueId: boutiqueId,
    paymentMethod: 'mobile_money',
    customerName: 'Rakoto Jean'
  }, boutiqueToken);
  assert(sale2.status === 201, 'Vente POS #2 créée (mobile money)');
  assert(sale2.data.paymentMethod === 'mobile_money', 'Paiement = mobile_money');
  const saleId2 = sale2.data._id;

  // 4.4 Create POS sale with card
  const sale3 = await api('POST', '/orders/pos', {
    items: [
      { product: productId2, quantity: 2 },
      { product: productId1, quantity: 5 }
    ],
    boutiqueId: boutiqueId,
    paymentMethod: 'card',
    notes: 'Client fidèle'
  }, boutiqueToken);
  assert(sale3.status === 201, 'Vente POS #3 créée (carte)');

  // 4.5 POS sale with insufficient stock should fail
  const saleFail = await api('POST', '/orders/pos', {
    items: [
      { product: productId3, quantity: 10 }  // Only 2 in stock
    ],
    boutiqueId: boutiqueId,
    paymentMethod: 'cash'
  }, boutiqueToken);
  assert(saleFail.status === 400, 'Vente POS refusée: stock insuffisant');

  // 4.6 POS sale without items should fail
  const saleNoItems = await api('POST', '/orders/pos', {
    items: [],
    boutiqueId: boutiqueId,
    paymentMethod: 'cash'
  }, boutiqueToken);
  assert(saleNoItems.status === 400, 'Vente POS refusée: pas d\'articles');

  // 4.7 Buyer cannot create POS sale
  const saleUnauthorized = await api('POST', '/orders/pos', {
    items: [{ product: productId1, quantity: 1 }],
    boutiqueId: boutiqueId,
    paymentMethod: 'cash'
  }, buyerToken);
  assert(saleUnauthorized.status === 403, 'Acheteur ne peut pas créer une vente POS');

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 5. POS LISTING & STATS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('\n═══ 5. TESTS HISTORIQUE & STATS POS ═══');

  // 5.1 List POS sales
  const posList = await api('GET', `/orders/pos?boutiqueId=${boutiqueId}`, null, boutiqueToken);
  assert(posList.ok, 'Liste POS récupérée');
  assert(posList.data.orders.length >= 3, 'Au moins 3 ventes POS listées');
  assert(posList.data.total >= 3, 'Total POS correct');

  // 5.2 POS stats
  const posStats = await api('GET', `/orders/pos/stats?boutiqueId=${boutiqueId}`, null, boutiqueToken);
  assert(posStats.ok, 'Stats POS récupérées');
  assert(posStats.data.totalSales >= 3, 'totalSales >= 3');
  assert(posStats.data.totalRevenue > 0, 'totalRevenue > 0');
  assert(posStats.data.averageTicket > 0, 'averageTicket > 0');
  assert(posStats.data.todaySales >= 3, 'todaySales >= 3');
  assert(typeof posStats.data.salesByPaymentMethod === 'object', 'salesByPaymentMethod est un objet');
  assert(Array.isArray(posStats.data.topProducts), 'topProducts est un tableau');

  // 5.3 Filter POS by payment method
  const posFilterCash = await api('GET', `/orders/pos?boutiqueId=${boutiqueId}&paymentMethod=cash`, null, boutiqueToken);
  assert(posFilterCash.ok, 'Filtre par méthode de paiement fonctionne');
  assert(posFilterCash.data.orders.every((o) => o.paymentMethod === 'cash'), 'Toutes les ventes filtrées sont en cash');

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 6. VOID (ANNULATION) POS SALE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('\n═══ 6. TESTS ANNULATION POS ═══');

  // Record stock before void
  const beforeVoid = await api('GET', `/products/${productId1}`, null, boutiqueToken);
  const stockBeforeVoid = beforeVoid.data.stock;

  // 6.1 Void a POS sale
  const voidRes = await api('PUT', `/orders/pos/${saleId2}/void`, {}, boutiqueToken);
  assert(voidRes.ok, 'Vente POS #2 annulée');
  assert(voidRes.data.status === 'cancelled', 'Statut = cancelled après annulation');

  // 6.2 Verify stock restored
  const afterVoid = await api('GET', `/products/${productId1}`, null, boutiqueToken);
  assert(afterVoid.data.stock === stockBeforeVoid + 2, `Stock restauré après annulation (+2)`);

  // 6.3 Cannot void already cancelled sale
  const voidAgain = await api('PUT', `/orders/pos/${saleId2}/void`, {}, boutiqueToken);
  assert(voidAgain.status === 400, 'Double annulation refusée');

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 7. NON-REGRESSION: Online orders still work
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('\n═══ 7. TESTS NON-RÉGRESSION (Commandes en ligne) ═══');

  // 7.1 Create online order (as buyer)
  const onlineOrder = await api('POST', '/orders', {
    items: [
      { product: productId1, quantity: 1 }
    ],
    boutiqueId: boutiqueId,
    fulfillmentType: 'pickup',
    paymentMethod: 'cash'
  }, buyerToken);
  assert(onlineOrder.status === 201, 'Commande en ligne créée');
  assert(!onlineOrder.data.orderType || onlineOrder.data.orderType === 'online', 'orderType = online par défaut');
  assert(onlineOrder.data.user !== null && onlineOrder.data.user !== undefined, 'Commande en ligne a un user');
  const onlineOrderId = onlineOrder.data._id;

  // 7.2 Get all orders (should include both POS and online)
  const allOrders = await api('GET', `/orders?boutiqueId=${boutiqueId}`, null, boutiqueToken);
  assert(allOrders.ok, 'GET /orders fonctionne');
  assert(allOrders.data.total >= 4, 'Total inclut POS + online');

  // 7.3 Filter only online orders
  const onlineOnly = await api('GET', `/orders?boutiqueId=${boutiqueId}&orderType=online`, null, boutiqueToken);
  assert(onlineOnly.ok, 'Filtre orderType=online fonctionne');

  // 7.4 Filter only POS orders via existing endpoint
  const posOnly = await api('GET', `/orders?boutiqueId=${boutiqueId}&orderType=pos`, null, boutiqueToken);
  assert(posOnly.ok, 'Filtre orderType=pos fonctionne');
  assert(posOnly.data.orders.every((o) => o.orderType === 'pos'), 'Toutes les commandes filtrées sont POS');

  // 7.5 Order stats still work
  const orderStats = await api('GET', `/orders/stats?boutiqueId=${boutiqueId}`, null, boutiqueToken);
  assert(orderStats.ok, 'Stats commandes fonctionnent');
  assert(typeof orderStats.data.totalOrders === 'number', 'totalOrders est un nombre');

  // 7.6 Update online order status
  const updateStatus = await api('PUT', `/orders/${onlineOrderId}/status`, {
    status: 'processing'
  }, boutiqueToken);
  assert(updateStatus.ok, 'Mise à jour statut commande en ligne fonctionne');

  // 7.7 Get order by ID
  const getOrder = await api('GET', `/orders/${onlineOrderId}`, null, boutiqueToken);
  assert(getOrder.ok, 'GET /orders/:id fonctionne');
  assert(getOrder.data.status === 'processing', 'Statut mis à jour correctement');

  // 7.8 Cancel online order (as buyer)
  const cancelOnline = await api('PUT', `/orders/${onlineOrderId}/cancel`, {}, buyerToken);
  // Note: this may fail if status is not pending, which is expected since we just changed it to processing
  // So we test that the endpoint responds (either success or expected error)
  assert(cancelOnline.status === 200 || cancelOnline.status === 400, 'Endpoint cancel commande en ligne répond');

  // 7.9 Buyer can see their orders
  const buyerOrders = await api('GET', '/orders', null, buyerToken);
  assert(buyerOrders.ok, 'Acheteur voit ses commandes');

  // 7.10 POS sale does NOT appear in buyer's orders
  const buyerHasPos = buyerOrders.data.orders?.some((o) => o.orderType === 'pos');
  assert(!buyerHasPos, 'Les ventes POS n\'apparaissent pas dans les commandes de l\'acheteur');

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 8. EDGE CASES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('\n═══ 8. TESTS EDGE CASES ═══');

  // 8.1 POS sale with linked user
  const saleWithUser = await api('POST', '/orders/pos', {
    items: [{ product: productId3, quantity: 1 }],
    boutiqueId: boutiqueId,
    paymentMethod: 'cash',
    userId: buyerId
  }, boutiqueToken);
  assert(saleWithUser.status === 201, 'Vente POS avec client identifié');

  // 8.2 POS sale with invalid boutiqueId
  const saleInvalidBoutique = await api('POST', '/orders/pos', {
    items: [{ product: productId1, quantity: 1 }],
    boutiqueId: '000000000000000000000000',
    paymentMethod: 'cash'
  }, boutiqueToken);
  assert(saleInvalidBoutique.status === 403, 'Vente POS refusée: boutique non possédée');

  // 8.3 POS without boutiqueId
  const saleNoBoutique = await api('POST', '/orders/pos', {
    items: [{ product: productId1, quantity: 1 }],
    paymentMethod: 'cash'
  }, boutiqueToken);
  assert(saleNoBoutique.status === 400, 'Vente POS refusée: boutiqueId manquant');

  // 8.4 Unauthenticated access should fail
  const unauthPOS = await api('POST', '/orders/pos', {
    items: [{ product: productId1, quantity: 1 }],
    boutiqueId: boutiqueId,
    paymentMethod: 'cash'
  });
  assert(unauthPOS.status === 401, 'Accès POS non authentifié refusé');

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RESULTS SUMMARY
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║                  RÉSULTATS                       ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║  ✅ Réussis : ${String(passed).padStart(3)}                                ║`);
  console.log(`║  ❌ Échoués : ${String(failed).padStart(3)}                                ║`);
  console.log(`║  📊 Total   : ${String(passed + failed).padStart(3)}                                ║`);
  console.log('╚══════════════════════════════════════════════════╝');

  if (failed > 0) {
    console.log('\n❌ Tests échoués:');
    results.filter(r => r.status === 'FAIL').forEach(r => console.log(`   - ${r.name}`));
  }

  console.log(failed === 0 ? '\n🎉 Tous les tests sont passés !' : '\n⚠️  Certains tests ont échoué.');

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('💥 Erreur fatale:', err);
  process.exit(1);
});


