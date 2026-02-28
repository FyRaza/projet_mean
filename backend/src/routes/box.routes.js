const express = require('express');
const router = express.Router();
const {
    getAllBoxes,
    getBoxById,
    createBox,
    updateBox,
    deleteBox,
    assignBoutique,
    unassignBoutique,
    getBoxStats
} = require('../controllers/box.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

/**
 * @swagger
 * /api/boxes:
 *   get:
 *     summary: Récupérer tous les emplacements (boxes)
 *     description: Retourne la liste de tous les emplacements du centre commercial avec filtres optionnels
 *     tags: [Boxes]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [available, occupied, reserved, maintenance]
 *         description: Filtrer par statut
 *       - in: query
 *         name: floor
 *         schema:
 *           type: integer
 *         description: Filtrer par étage
 *       - in: query
 *         name: zone
 *         schema:
 *           type: string
 *         description: Filtrer par zone (A, B, C, etc.)
 *     responses:
 *       200:
 *         description: Liste des emplacements
 */
router.get('/', getAllBoxes);

/**
 * @swagger
 * /api/boxes/stats:
 *   get:
 *     summary: Statistiques des emplacements
 *     description: Retourne les statistiques détaillées (occupancy, revenue, par zone/étage)
 *     tags: [Boxes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques complètes des emplacements
 */
router.get('/stats', protect, authorize('admin'), getBoxStats);

/**
 * @swagger
 * /api/boxes/{id}:
 *   get:
 *     summary: Récupérer un emplacement par ID
 *     tags: [Boxes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Détails de l'emplacement
 *       404:
 *         description: Emplacement non trouvé
 */
router.get('/:id', getBoxById);

/**
 * @swagger
 * /api/boxes:
 *   post:
 *     summary: Créer un nouvel emplacement
 *     description: Crée un nouvel emplacement dans le centre commercial (admin uniquement)
 *     tags: [Boxes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *               - floor
 *               - zone
 *               - area
 *               - monthlyRent
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Emplacement A-101"
 *               code:
 *                 type: string
 *                 example: "A-101"
 *               floor:
 *                 type: integer
 *                 example: 1
 *               zone:
 *                 type: string
 *                 example: "A"
 *               area:
 *                 type: number
 *                 description: Surface en m²
 *                 example: 45
 *               monthlyRent:
 *                 type: number
 *                 description: Loyer mensuel en Ariary
 *                 example: 1200000
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Vitrine", "Climatisation"]
 *     responses:
 *       201:
 *         description: Emplacement créé
 *       400:
 *         description: Code déjà existant
 */
router.post('/', protect, authorize('admin'), createBox);

/**
 * @swagger
 * /api/boxes/{id}:
 *   put:
 *     summary: Mettre à jour un emplacement
 *     tags: [Boxes]
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
 *             properties:
 *               name:
 *                 type: string
 *               floor:
 *                 type: integer
 *               zone:
 *                 type: string
 *               area:
 *                 type: number
 *               monthlyRent:
 *                 type: number
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [available, occupied, reserved, maintenance]
 *     responses:
 *       200:
 *         description: Emplacement mis à jour
 *       404:
 *         description: Emplacement non trouvé
 */
router.put('/:id', protect, authorize('admin'), updateBox);

/**
 * @swagger
 * /api/boxes/{id}:
 *   delete:
 *     summary: Supprimer un emplacement
 *     description: Supprime un emplacement. Impossible si le box est occupé.
 *     tags: [Boxes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Emplacement supprimé
 *       400:
 *         description: Impossible de supprimer un box occupé
 *       404:
 *         description: Emplacement non trouvé
 */
router.delete('/:id', protect, authorize('admin'), deleteBox);

/**
 * @swagger
 * /api/boxes/{id}/assign:
 *   put:
 *     summary: Attribuer une boutique à un emplacement
 *     description: Assigne une boutique existante à un emplacement libre
 *     tags: [Boxes]
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
 *               - boutiqueId
 *             properties:
 *               boutiqueId:
 *                 type: string
 *                 description: ID de la boutique à assigner
 *           example:
 *             boutiqueId: "60d0fe4f5311236168a109ca"
 *     responses:
 *       200:
 *         description: Boutique assignée avec succès
 *       400:
 *         description: Emplacement déjà occupé
 *       404:
 *         description: Emplacement ou boutique non trouvé
 */
router.put('/:id/assign', protect, authorize('admin'), assignBoutique);

/**
 * @swagger
 * /api/boxes/{id}/unassign:
 *   put:
 *     summary: Retirer la boutique d'un emplacement
 *     description: Libère un emplacement occupé
 *     tags: [Boxes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Boutique retirée, emplacement libéré
 *       404:
 *         description: Emplacement non trouvé
 */
router.put('/:id/unassign', protect, authorize('admin'), unassignBoutique);

module.exports = router;
