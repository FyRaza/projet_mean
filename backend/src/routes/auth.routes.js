const express = require('express');
const router = express.Router();
const {
    register,
    login,
    getMe,
    updateMe,
    changeMyPassword,
    deleteMyAccount,
    getMyAddresses,
    addMyAddress,
    updateMyAddress,
    deleteMyAddress,
    getBoutiqueOwners
} = require('../controllers/auth.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Créer un nouveau compte utilisateur
 *     description: Inscrit un nouvel utilisateur. Par défaut, le rôle attribué est `acheteur`. Retourne le token JWT et les données de l'utilisateur.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           examples:
 *             Acheteur:
 *               summary: Inscription d'un client
 *               value:
 *                 firstName: "Jean"
 *                 lastName: "Dupont"
 *                 email: "jean.dupont@mail.com"
 *                 password: "motdepasse123"
 *                 role: "acheteur"
 *                 phone: "+261 34 00 000 00"
 *             Boutique:
 *               summary: Inscription d'un propriétaire de boutique
 *               value:
 *                 firstName: "Marie"
 *                 lastName: "Martin"
 *                 email: "marie.martin@shop.mg"
 *                 password: "monmotdepasse"
 *                 role: "boutique"
 *     responses:
 *       201:
 *         description: Inscription réussie
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Données invalides ou email déjà utilisé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error400'
 *             example:
 *               message: "User already exists"
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error500'
 */
router.post('/register', register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Se connecter à son compte
 *     description: Authentifie l'utilisateur avec son email et mot de passe. Retourne un token JWT valable 30 jours.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           examples:
 *             Admin:
 *               summary: Connexion en tant qu'admin
 *               value:
 *                 email: "admin@mall.mg"
 *                 password: "adminpassword"
 *             Acheteur:
 *               summary: Connexion en tant qu'acheteur
 *               value:
 *                 email: "jean.dupont@mail.com"
 *                 password: "motdepasse123"
 *     responses:
 *       200:
 *         description: Connexion réussie — copier le `token` pour s'authentifier dans Swagger (bouton Authorize 🔒)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Email ou mot de passe incorrect
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error401'
 *             example:
 *               message: "Invalid email or password"
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error500'
 */
router.post('/login', login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Récupérer le profil de l'utilisateur connecté
 *     description: Retourne les informations complètes de l'utilisateur actuellement authentifié (sans le mot de passe).
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil de l'utilisateur connecté
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Non authentifié — token manquant ou invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error401'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error500'
 */
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.put('/me/password', protect, changeMyPassword);
router.delete('/me', protect, deleteMyAccount);
router.get('/me/addresses', protect, getMyAddresses);
router.post('/me/addresses', protect, addMyAddress);
router.put('/me/addresses/:addressId', protect, updateMyAddress);
router.delete('/me/addresses/:addressId', protect, deleteMyAddress);
router.get('/boutique-owners', protect, authorize('admin'), getBoutiqueOwners);

module.exports = router;
