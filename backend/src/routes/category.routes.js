const express = require('express');
const router = express.Router();
const {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategory,
    getCategoryTree
} = require('../controllers/category.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Récupérer toutes les catégories
 *     description: Retourne la liste de toutes les catégories avec filtres optionnels
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [product, boutique]
 *         description: Filtrer par type de catégorie
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filtrer par statut actif/inactif
 *     responses:
 *       200:
 *         description: Liste des catégories
 */
router.get('/', getAllCategories);

/**
 * @swagger
 * /api/categories/tree:
 *   get:
 *     summary: Récupérer l'arborescence des catégories
 *     description: Retourne les catégories organisées en arbre hiérarchique (parent → children)
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [product, boutique]
 *     responses:
 *       200:
 *         description: Arborescence des catégories
 */
router.get('/tree', getCategoryTree);

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Récupérer une catégorie par ID
 *     description: Retourne les détails d'une catégorie avec ses sous-catégories
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Détails de la catégorie avec sous-catégories
 *       404:
 *         description: Catégorie non trouvée
 */
router.get('/:id', getCategoryById);

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Créer une nouvelle catégorie
 *     description: |
 *       Crée une nouvelle catégorie. Le slug est généré automatiquement à partir du nom.
 *       Supporte les accents français (é, è, ê, à, ç, etc.)
 *     tags: [Categories]
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
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Mode & Vêtements"
 *               description:
 *                 type: string
 *                 example: "Vêtements, chaussures et accessoires de mode"
 *               icon:
 *                 type: string
 *                 example: "👕"
 *               type:
 *                 type: string
 *                 enum: [product, boutique]
 *                 example: "boutique"
 *               parent:
 *                 type: string
 *                 description: ID de la catégorie parente (optionnel)
 *     responses:
 *       201:
 *         description: Catégorie créée
 *       400:
 *         description: Slug déjà existant
 */
router.post('/', protect, authorize('admin'), createCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Mettre à jour une catégorie
 *     tags: [Categories]
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
 *               description:
 *                 type: string
 *               icon:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [product, boutique]
 *               parent:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Catégorie mise à jour
 *       404:
 *         description: Catégorie non trouvée
 */
router.put('/:id', protect, authorize('admin'), updateCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Supprimer une catégorie
 *     description: Supprime une catégorie. Échoue si des sous-catégories en dépendent.
 *     tags: [Categories]
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
 *         description: Catégorie supprimée
 *       400:
 *         description: Impossible de supprimer (sous-catégories dépendantes)
 *       404:
 *         description: Catégorie non trouvée
 */
router.delete('/:id', protect, authorize('admin'), deleteCategory);

/**
 * @swagger
 * /api/categories/{id}/toggle:
 *   patch:
 *     summary: Activer/Désactiver une catégorie
 *     description: Inverse le statut actif/inactif d'une catégorie
 *     tags: [Categories]
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
 *         description: Statut de la catégorie inversé
 *       404:
 *         description: Catégorie non trouvée
 */
router.patch('/:id/toggle', protect, authorize('admin'), toggleCategory);

module.exports = router;
