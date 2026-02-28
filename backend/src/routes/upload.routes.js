const express = require('express');
const router = express.Router();
const { uploadImage, uploadMultipleImages, deleteImage } = require('../controllers/upload.controller');
const { uploadSingle, uploadMultiple } = require('../middleware/upload.middleware');
const { protect } = require('../middleware/auth.middleware');

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Upload une image
 *     description: Upload une image vers Cloudinary avec redimensionnement automatique. Types supportés - product (800x800), logo (400x400), banner (1200x400).
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Fichier image (JPG, PNG, WebP, GIF). Max 5 Mo.
 *               type:
 *                 type: string
 *                 enum: [product, logo, banner]
 *                 default: product
 *                 description: Type d'image pour le redimensionnement automatique
 *     responses:
 *       201:
 *         description: Image uploadée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   description: URL sécurisée de l'image
 *                 publicId:
 *                   type: string
 *                   description: Identifiant Cloudinary pour suppression
 *                 width:
 *                   type: number
 *                 height:
 *                   type: number
 *                 format:
 *                   type: string
 *                 size:
 *                   type: number
 *       400:
 *         description: Fichier manquant ou format invalide
 *       500:
 *         description: Erreur serveur ou Cloudinary non configuré
 */
router.post('/', protect, uploadSingle, uploadImage);

/**
 * @swagger
 * /api/upload/multiple:
 *   post:
 *     summary: Upload plusieurs images
 *     description: Upload jusqu'à 8 images simultanément vers Cloudinary
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - images
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Fichiers images (max 8). JPG, PNG, WebP, GIF. Max 5 Mo chacun.
 *               type:
 *                 type: string
 *                 enum: [product, logo, banner]
 *                 default: product
 *     responses:
 *       201:
 *         description: Images uploadées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 images:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       url:
 *                         type: string
 *                       publicId:
 *                         type: string
 *                       width:
 *                         type: number
 *                       height:
 *                         type: number
 *       400:
 *         description: Fichiers manquants ou format invalide
 *       500:
 *         description: Erreur serveur
 */
router.post('/multiple', protect, uploadMultiple, uploadMultipleImages);

/**
 * @swagger
 * /api/upload:
 *   delete:
 *     summary: Supprimer une image
 *     description: Supprime une image de Cloudinary par son publicId
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - publicId
 *             properties:
 *               publicId:
 *                 type: string
 *                 description: L'identifiant public Cloudinary de l'image
 *     responses:
 *       200:
 *         description: Image supprimée
 *       400:
 *         description: publicId manquant
 *       500:
 *         description: Erreur serveur
 */
router.delete('/', protect, deleteImage);

module.exports = router;

