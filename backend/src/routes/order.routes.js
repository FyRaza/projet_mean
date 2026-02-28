const express = require('express');
const router = express.Router();
const {
    getAllOrders,
    getOrderById,
    createOrder,
    updateOrderStatus,
    cancelOrder,
    updatePaymentStatus,
    getOrderStats,
    createPosSale,
    getPosSales,
    getPosStats,
    getDailySummary,
    voidPosSale
} = require('../controllers/order.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// ═══════════════════════════════════════════════════
//   POS (Caisse) Routes — MUST be before /:id
// ═══════════════════════════════════════════════════

/**
 * @swagger
 * /api/orders/pos/stats:
 *   get:
 *     summary: Statistiques des ventes POS (Caisse)
 *     description: Retourne les statistiques de ventes en caisse (total, revenue, panier moyen, top produits, etc.)
 *     tags: [POS - Caisse]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: boutiqueId
 *         schema:
 *           type: string
 *         description: ID de la boutique
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Statistiques POS
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non autorisé
 */
router.get('/pos/stats', protect, authorize('admin', 'boutique'), getPosStats);

/**
 * @swagger
 * /api/orders/pos/daily-summary:
 *   get:
 *     summary: Résumé de caisse du jour
 *     description: Retourne le détail complet des ventes d'une journée (ouverture/fermeture de caisse)
 *     tags: [POS - Caisse]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: boutiqueId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Date du résumé (défaut = aujourd'hui)
 *     responses:
 *       200:
 *         description: Résumé de caisse
 */
router.get('/pos/daily-summary', protect, authorize('admin', 'boutique'), getDailySummary);

/**
 * @swagger
 * /api/orders/pos:
 *   get:
 *     summary: Lister les ventes POS (Caisse)
 *     description: Retourne la liste paginée des ventes en caisse pour la boutique
 *     tags: [POS - Caisse]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: boutiqueId
 *         schema:
 *           type: string
 *         description: ID de la boutique
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: paymentMethod
 *         schema:
 *           type: string
 *           enum: [cash, mobile_money, card]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Recherche par nom client ou ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Liste des ventes POS paginée
 *       401:
 *         description: Non authentifié
 */
router.get('/pos', protect, authorize('admin', 'boutique'), getPosSales);

/**
 * @swagger
 * /api/orders/pos:
 *   post:
 *     summary: Enregistrer une vente en caisse (POS)
 *     description: |
 *       Crée une vente en caisse. Le stock est décrémenté automatiquement.
 *       La vente est marquée comme payée et livrée immédiatement.
 *     tags: [POS - Caisse]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - boutiqueId
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     product:
 *                       type: string
 *                       description: ID du produit
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *               boutiqueId:
 *                 type: string
 *                 description: ID de la boutique
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, mobile_money, card]
 *                 default: cash
 *               customerName:
 *                 type: string
 *                 description: Nom du client (optionnel, pour ventes anonymes)
 *               userId:
 *                 type: string
 *                 description: ID du client enregistré (optionnel)
 *               notes:
 *                 type: string
 *           example:
 *             items:
 *               - product: "60d0fe4f5311236168a109ca"
 *                 quantity: 2
 *             boutiqueId: "60d0fe4f5311236168a109cb"
 *             paymentMethod: "cash"
 *             customerName: "Client anonyme"
 *     responses:
 *       201:
 *         description: Vente enregistrée avec succès
 *       400:
 *         description: Données invalides ou stock insuffisant
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non propriétaire de la boutique
 */
router.post('/pos', protect, authorize('boutique'), createPosSale);

/**
 * @swagger
 * /api/orders/pos/{id}/void:
 *   put:
 *     summary: Annuler une vente POS (remboursement)
 *     description: Annule une vente POS et restaure le stock automatiquement
 *     tags: [POS - Caisse]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la vente POS
 *     responses:
 *       200:
 *         description: Vente annulée avec succès
 *       400:
 *         description: La vente n'est pas une vente POS ou déjà annulée
 *       403:
 *         description: Non autorisé
 *       404:
 *         description: Vente introuvable
 */
router.put('/pos/:id/void', protect, authorize('admin', 'boutique'), voidPosSale);

// ═══════════════════════════════════════════════════
//   Online Order Routes (existing)
// ═══════════════════════════════════════════════════

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Récupérer les commandes
 *     description: |
 *       Retourne les commandes selon le rôle :
 *       - **admin** : toutes les commandes
 *       - **boutique** : commandes de sa boutique (passer `boutiqueId` en query)
 *       - **acheteur** : ses propres commandes uniquement
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, shipped, delivered, cancelled]
 *         description: Filtrer par statut de commande
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *           enum: [pending, paid, failed]
 *         description: Filtrer par statut de paiement
 *       - in: query
 *         name: orderType
 *         schema:
 *           type: string
 *           enum: [online, pos]
 *         description: Filtrer par type de commande
 *       - in: query
 *         name: boutiqueId
 *         schema:
 *           type: string
 *         description: ID de boutique (pour les propriétaires de boutiques)
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de début
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de fin
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Liste des commandes paginée
 *       401:
 *         description: Non authentifié
 */
router.get('/', protect, getAllOrders);

/**
 * @swagger
 * /api/orders/stats:
 *   get:
 *     summary: Statistiques des commandes
 *     description: Retourne les statistiques globales (total, pending, revenue, etc.)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: boutiqueId
 *         schema:
 *           type: string
 *         description: Filtrer les stats pour une boutique spécifique
 *     responses:
 *       200:
 *         description: Statistiques des commandes
 *       401:
 *         description: Non authentifié
 */
router.get('/stats', protect, authorize('admin', 'boutique'), getOrderStats);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Récupérer une commande par ID
 *     description: Retourne les détails complets d'une commande
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la commande
 *     responses:
 *       200:
 *         description: Détails de la commande
 *       404:
 *         description: Commande non trouvée
 *       401:
 *         description: Non authentifié
 */
router.get('/:id', protect, getOrderById);

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Créer une nouvelle commande (en ligne)
 *     description: Crée une commande en ligne. Vérifie le stock et le décrémente automatiquement.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - boutiqueId
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     product:
 *                       type: string
 *                       description: ID du produit
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *               boutiqueId:
 *                 type: string
 *                 description: ID de la boutique
 *               shippingAddress:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   postalCode:
 *                     type: string
 *                   country:
 *                     type: string
 *           example:
 *             items:
 *               - product: "60d0fe4f5311236168a109ca"
 *                 quantity: 2
 *             boutiqueId: "60d0fe4f5311236168a109cb"
 *             shippingAddress:
 *               street: "123 Rue Analakely"
 *               city: "Antananarivo"
 *               postalCode: "101"
 *               country: "Madagascar"
 *     responses:
 *       201:
 *         description: Commande créée avec succès
 *       400:
 *         description: Données invalides ou stock insuffisant
 *       401:
 *         description: Non authentifié
 */
router.post('/', protect, createOrder);

router.put('/:id/status', protect, authorize('admin', 'boutique'), updateOrderStatus);
router.put('/:id/cancel', protect, cancelOrder);
router.put('/:id/payment', protect, authorize('admin'), updatePaymentStatus);

module.exports = router;
