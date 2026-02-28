const express = require('express');
const router = express.Router();
const {
    getAllOrders,
    getOrderById,
    createOrder,
    updateOrderStatus,
    updatePaymentStatus,
    getOrderStats
} = require('../controllers/order.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

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
 *     summary: Créer une nouvelle commande
 *     description: Crée une commande. Vérifie le stock et le décrémente automatiquement.
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

/**
 * @swagger
 * /api/orders/{id}/status:
 *   put:
 *     summary: Mettre à jour le statut d'une commande
 *     description: Change le statut. Si annulation, le stock est restauré automatiquement.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, processing, shipped, delivered, cancelled]
 *           example:
 *             status: "processing"
 *     responses:
 *       200:
 *         description: Statut mis à jour
 *       400:
 *         description: Statut invalide
 *       404:
 *         description: Commande non trouvée
 */
router.put('/:id/status', protect, authorize('admin', 'boutique'), updateOrderStatus);

/**
 * @swagger
 * /api/orders/{id}/payment:
 *   put:
 *     summary: Mettre à jour le statut de paiement
 *     description: Change le statut de paiement d'une commande (admin uniquement)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentStatus
 *             properties:
 *               paymentStatus:
 *                 type: string
 *                 enum: [pending, paid, failed]
 *           example:
 *             paymentStatus: "paid"
 *     responses:
 *       200:
 *         description: Statut de paiement mis à jour
 *       404:
 *         description: Commande non trouvée
 */
router.put('/:id/payment', protect, authorize('admin'), updatePaymentStatus);

module.exports = router;
