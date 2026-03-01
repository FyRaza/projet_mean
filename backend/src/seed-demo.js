/**
 * ═══════════════════════════════════════════════════
 *  SEED COMPLET - Données de démonstration
 *  Usage: node src/seed-demo.js
 * ═══════════════════════════════════════════════════
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Boutique = require('./models/Boutique');
const Product = require('./models/Product');
const Order = require('./models/Order');
const Category = require('./models/Category');
const Box = require('./models/Box');

// Support Docker (avec auth) et local (sans auth)
const MONGO_URI = process.env.MONGO_URI || 
    (process.env.MONGO_ROOT_USER && process.env.MONGO_ROOT_PASSWORD
        ? `mongodb://${process.env.MONGO_ROOT_USER}:${process.env.MONGO_ROOT_PASSWORD}@localhost:27017/mall_manage_db?authSource=admin`
        : 'mongodb://127.0.0.1:27017/mall_manage_db');

function slugify(value) {
    return value
        .toLowerCase()
        .replace(/[àáâãäå]/g, 'a')
        .replace(/[éèêë]/g, 'e')
        .replace(/[ïî]/g, 'i')
        .replace(/[ôö]/g, 'o')
        .replace(/[ùûü]/g, 'u')
        .replace(/[ç]/g, 'c')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function generateUniqueSlug(baseSlug, Model, field = 'slug') {
    let slug = baseSlug;
    let counter = 0;
    while (await Model.findOne({ [field]: slug })) {
        counter++;
        slug = `${baseSlug}-${counter}`;
    }
    return slug;
}

/**
 * Génère des URLs d'images réelles basées sur le nom et la catégorie du produit
 * Utilise placeholder.com avec du texte personnalisé pour chaque type de produit
 * Cela garantit que les images correspondent visuellement au produit
 */
function getProductImages(productName, categoryName) {
    // Mapping de couleurs et textes par type de produit pour placeholder.com
    const imageMapping = {
        'Fashion Store': {
            'Chemise': { text: 'SHIRT', bg: '4A90E2', color: 'FFFFFF' },
            'Jean': { text: 'JEANS', bg: '2C3E50', color: 'FFFFFF' },
            'Robe': { text: 'DRESS', bg: 'E91E63', color: 'FFFFFF' },
            'Veste': { text: 'JACKET', bg: '795548', color: 'FFFFFF' },
            'Sneakers': { text: 'SNEAKERS', bg: 'FF5722', color: 'FFFFFF' },
            'Sac': { text: 'HANDBAG', bg: '8B4513', color: 'FFFFFF' },
            'Cravate': { text: 'TIE', bg: '1A1A1A', color: 'FFFFFF' },
            'Écharpe': { text: 'SCARF', bg: '9C27B0', color: 'FFFFFF' }
        },
        'TechZone': {
            'Smartphone': { text: 'PHONE', bg: '000000', color: 'FFFFFF' },
            'Laptop': { text: 'LAPTOP', bg: '37474F', color: 'FFFFFF' },
            'Écouteurs': { text: 'HEADPHONES', bg: '212121', color: 'FFFFFF' },
            'Montre': { text: 'SMARTWATCH', bg: '263238', color: 'FFFFFF' },
            'Tablette': { text: 'TABLET', bg: '455A64', color: 'FFFFFF' },
            'Enceinte': { text: 'SPEAKER', bg: '424242', color: 'FFFFFF' },
            'Chargeur': { text: 'CHARGER', bg: '616161', color: 'FFFFFF' },
            'Housse': { text: 'CASE', bg: '757575', color: 'FFFFFF' }
        },
        'Home Sweet Home': {
            'Canapé': { text: 'SOFA', bg: '8D6E63', color: 'FFFFFF' },
            'Table': { text: 'TABLE', bg: '6D4C41', color: 'FFFFFF' },
            'Lampe': { text: 'LAMP', bg: 'FFC107', color: '000000' },
            'Tapis': { text: 'RUG', bg: '795548', color: 'FFFFFF' },
            'Vase': { text: 'VASE', bg: 'E1BEE7', color: '000000' },
            'Coussin': { text: 'CUSHION', bg: 'FF9800', color: 'FFFFFF' },
            'Rideaux': { text: 'CURTAINS', bg: '9E9E9E', color: 'FFFFFF' },
            'Miroir': { text: 'MIRROR', bg: 'BDBDBD', color: '000000' }
        },
        'Beauty Paradise': {
            'Parfum': { text: 'PERFUME', bg: 'E91E63', color: 'FFFFFF' },
            'Crème': { text: 'CREAM', bg: 'FFF9C4', color: '000000' },
            'Rouge': { text: 'LIPSTICK', bg: 'F44336', color: 'FFFFFF' },
            'Mascara': { text: 'MASCARA', bg: '212121', color: 'FFFFFF' },
            'Shampooing': { text: 'SHAMPOO', bg: '2196F3', color: 'FFFFFF' },
            'Sérum': { text: 'SERUM', bg: '9C27B0', color: 'FFFFFF' },
            'Masque': { text: 'MASK', bg: '00BCD4', color: 'FFFFFF' },
            'Déodorant': { text: 'DEODORANT', bg: '4CAF50', color: 'FFFFFF' }
        },
        'Sport & Co': {
            'Raquette': { text: 'RACKET', bg: 'FF5722', color: 'FFFFFF' },
            'Ballon': { text: 'BALL', bg: '000000', color: 'FFFFFF' },
            'Vélo': { text: 'BIKE', bg: 'F44336', color: 'FFFFFF' },
            'Tapis': { text: 'YOGA MAT', bg: '4CAF50', color: 'FFFFFF' },
            'Haltères': { text: 'WEIGHTS', bg: '607D8B', color: 'FFFFFF' },
            'Chaussures': { text: 'RUNNING', bg: 'FF9800', color: 'FFFFFF' },
            'Sac': { text: 'SPORTS BAG', bg: '3F51B5', color: 'FFFFFF' },
            'Gourde': { text: 'BOTTLE', bg: '00BCD4', color: 'FFFFFF' }
        },
        'Bijoux Prestige': {
            'Bague': { text: 'RING', bg: 'FFD700', color: '000000' },
            'Collier': { text: 'NECKLACE', bg: 'C0C0C0', color: '000000' },
            'Boucles': { text: 'EARRINGS', bg: 'FFD700', color: '000000' },
            'Bracelet': { text: 'BRACELET', bg: 'C0C0C0', color: '000000' },
            'Montre': { text: 'WATCH', bg: '000000', color: 'FFD700' },
            'Pendentif': { text: 'PENDANT', bg: 'FFD700', color: '000000' },
            'Chaîne': { text: 'CHAIN', bg: 'C0C0C0', color: '000000' }
        }
    };

    // Trouver le mapping approprié
    let imageConfig = { text: 'PRODUCT', bg: 'CCCCCC', color: '000000' };
    const categoryMap = imageMapping[categoryName];
    if (categoryMap) {
        for (const [productType, config] of Object.entries(categoryMap)) {
            if (productName.includes(productType)) {
                imageConfig = config;
                break;
            }
        }
    }

    // Générer un seed basé sur le nom pour garantir la cohérence
    let seed = 0;
    for (let i = 0; i < productName.length; i++) {
        seed += productName.charCodeAt(i);
    }
    
    const imageCount = Math.random() > 0.7 ? 2 : 1;
    const images = [];
    
    for (let i = 0; i < imageCount; i++) {
        // Placehold.co avec texte et couleurs personnalisés
        // Format: https://placehold.co/600x600/{bg}/{color}?text={text}
        const text = i === 0 ? imageConfig.text : `${imageConfig.text} ${i + 1}`;
        images.push(`https://placehold.co/600x600/${imageConfig.bg}/${imageConfig.color}?text=${encodeURIComponent(text)}`);
    }

    return images;
}

async function runSeed() {
    try {
        console.log('\n╔══════════════════════════════════════════════════╗');
        console.log('║     GÉNÉRATION DONNÉES DE DÉMONSTRATION         ║');
        console.log('╚══════════════════════════════════════════════════╝\n');

        // Utiliser MONGO_URI de l'environnement (pour MongoDB Atlas en production)
        const mongoUri = process.env.MONGO_URI || MONGO_URI;
        await mongoose.connect(mongoUri);
        console.log('✅ MongoDB connecté\n');

        // Nettoyage
        console.log('🗑️  Nettoyage des collections...');
        await Order.deleteMany({});
        await Product.deleteMany({});
        await Box.deleteMany({});
        await Boutique.deleteMany({});
        await Category.deleteMany({});
        await User.deleteMany({});
        console.log('✅ Collections vidées\n');

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 1. UTILISATEURS
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        console.log('👥 Création des utilisateurs...');

        const admins = await User.create([
            { firstName: 'Super', lastName: 'Admin', email: 'admin@mall.mg', password: 'Admin1234!', role: 'admin', phone: '+261 34 00 000 01' },
            { firstName: 'Jean', lastName: 'Rakoto', email: 'admin2@mall.mg', password: 'Admin1234!', role: 'admin', phone: '+261 34 00 000 02' }
        ]);

        const boutiqueOwners = await User.create([
            { firstName: 'Marie', lastName: 'Martin', email: 'boutique1@mall.mg', password: 'Boutique1234!', role: 'boutique', phone: '+261 34 10 000 01' },
            { firstName: 'Sophie', lastName: 'Rasoa', email: 'boutique2@mall.mg', password: 'Boutique1234!', role: 'boutique', phone: '+261 34 10 000 02' },
            { firstName: 'Pierre', lastName: 'Rakoto', email: 'boutique3@mall.mg', password: 'Boutique1234!', role: 'boutique', phone: '+261 34 10 000 03' },
            { firstName: 'Lucie', lastName: 'Andrianina', email: 'boutique4@mall.mg', password: 'Boutique1234!', role: 'boutique', phone: '+261 34 10 000 04' },
            { firstName: 'Thomas', lastName: 'Rajaona', email: 'boutique5@mall.mg', password: 'Boutique1234!', role: 'boutique', phone: '+261 34 10 000 05' },
            { firstName: 'Emma', lastName: 'Razafy', email: 'boutique6@mall.mg', password: 'Boutique1234!', role: 'boutique', phone: '+261 34 10 000 06' }
        ]);

        const acheteurs = await User.create([
            { firstName: 'Jean', lastName: 'Dupont', email: 'client1@mall.mg', password: 'Client1234!', role: 'acheteur', phone: '+261 34 20 000 01' },
            { firstName: 'Sarah', lastName: 'Rakoto', email: 'client2@mall.mg', password: 'Client1234!', role: 'acheteur', phone: '+261 34 20 000 02' },
            { firstName: 'Marc', lastName: 'Rasoa', email: 'client3@mall.mg', password: 'Client1234!', role: 'acheteur', phone: '+261 34 20 000 03' },
            { firstName: 'Julie', lastName: 'Andrianina', email: 'client4@mall.mg', password: 'Client1234!', role: 'acheteur', phone: '+261 34 20 000 04' },
            { firstName: 'Paul', lastName: 'Rajaona', email: 'client5@mall.mg', password: 'Client1234!', role: 'acheteur', phone: '+261 34 20 000 05' },
            { firstName: 'Léa', lastName: 'Razafy', email: 'client6@mall.mg', password: 'Client1234!', role: 'acheteur', phone: '+261 34 20 000 06' },
            { firstName: 'Antoine', lastName: 'Randria', email: 'client7@mall.mg', password: 'Client1234!', role: 'acheteur', phone: '+261 34 20 000 07' },
            { firstName: 'Camille', lastName: 'Rakotomalala', email: 'client8@mall.mg', password: 'Client1234!', role: 'acheteur', phone: '+261 34 20 000 08' }
        ]);

        console.log(`✅ ${admins.length} admins créés`);
        console.log(`✅ ${boutiqueOwners.length} propriétaires de boutiques créés`);
        console.log(`✅ ${acheteurs.length} acheteurs créés\n`);

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 2. CATÉGORIES
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        console.log('📂 Création des catégories...');

        const categories = await Category.create([
            { name: 'Mode & Vêtements', slug: 'mode-vetements', description: 'Vêtements, chaussures, accessoires', type: 'product', isActive: true },
            { name: 'Électronique', slug: 'electronique', description: 'Smartphones, ordinateurs, gadgets', type: 'product', isActive: true },
            { name: 'Maison & Décoration', slug: 'maison-decoration', description: 'Meubles, décoration, ustensiles', type: 'product', isActive: true },
            { name: 'Beauté & Cosmétiques', slug: 'beaute-cosmetiques', description: 'Produits de beauté, parfums, soins', type: 'product', isActive: true },
            { name: 'Alimentation', slug: 'alimentation', description: 'Épicerie, boissons, produits frais', type: 'product', isActive: true },
            { name: 'Sport & Loisirs', slug: 'sport-loisirs', description: 'Équipements sportifs, jeux, livres', type: 'product', isActive: true },
            { name: 'Bijouterie', slug: 'bijouterie', description: 'Bijoux, montres, accessoires précieux', type: 'product', isActive: true },
            { name: 'Pharmacie', slug: 'pharmacie', description: 'Médicaments, produits de santé', type: 'product', isActive: true }
        ]);

        console.log(`✅ ${categories.length} catégories créées\n`);

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 3. BOUTIQUES
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        console.log('🏪 Création des boutiques...');

        const boutiquesData = [
            { name: 'Fashion Store', description: 'Boutique de mode tendance pour hommes et femmes', owner: boutiqueOwners[0], status: 'active', contactEmail: 'fashion@mall.mg', contactPhone: '+261 34 10 000 01' },
            { name: 'TechZone', description: 'Spécialiste en électronique et gadgets high-tech', owner: boutiqueOwners[1], status: 'active', contactEmail: 'tech@mall.mg', contactPhone: '+261 34 10 000 02' },
            { name: 'Home Sweet Home', description: 'Décoration et ameublement pour votre intérieur', owner: boutiqueOwners[2], status: 'active', contactEmail: 'home@mall.mg', contactPhone: '+261 34 10 000 03' },
            { name: 'Beauty Paradise', description: 'Produits de beauté et cosmétiques de qualité', owner: boutiqueOwners[3], status: 'active', contactEmail: 'beauty@mall.mg', contactPhone: '+261 34 10 000 04' },
            { name: 'Sport & Co', description: 'Équipements sportifs et articles de loisirs', owner: boutiqueOwners[4], status: 'active', contactEmail: 'sport@mall.mg', contactPhone: '+261 34 10 000 05' },
            { name: 'Bijoux Prestige', description: 'Bijouterie fine et montres de luxe', owner: boutiqueOwners[5], status: 'active', contactEmail: 'bijoux@mall.mg', contactPhone: '+261 34 10 000 06' },
            { name: 'Nouvelle Boutique', description: 'Boutique en attente de validation', owner: boutiqueOwners[0], status: 'pending', contactEmail: 'nouvelle@mall.mg', contactPhone: '+261 34 10 000 07' },
            { name: 'Boutique Inactive', description: 'Boutique temporairement fermée', owner: boutiqueOwners[1], status: 'inactive', contactEmail: 'inactive@mall.mg', contactPhone: '+261 34 10 000 08' }
        ];

        const boutiques = [];
        for (const data of boutiquesData) {
            const slug = await generateUniqueSlug(slugify(data.name), Boutique);
            const boutique = await Boutique.create({
                ...data,
                slug,
                categoryId: pickRandom(categories)._id.toString()
            });
            boutiques.push(boutique);
        }

        console.log(`✅ ${boutiques.length} boutiques créées`);
        console.log(`   - ${boutiques.filter(b => b.status === 'active').length} actives`);
        console.log(`   - ${boutiques.filter(b => b.status === 'pending').length} en attente`);
        console.log(`   - ${boutiques.filter(b => b.status === 'inactive').length} inactives\n`);

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 4. PRODUITS
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        console.log('📦 Création des produits...');

        const produitsData = {
            'Fashion Store': [
                { name: 'Chemise Lin Premium', price: 85000, stock: 25, sku: 'CHM-LIN-001', category: categories[0], tags: ['Nouveau', 'Lin', 'Été'], isFeatured: true },
                { name: 'Jean Slim Fit', price: 125000, stock: 40, sku: 'JEA-SLF-001', category: categories[0], tags: ['Tendance', 'Classique'], isFeatured: true },
                { name: 'Robe Midi Élégante', price: 195000, stock: 15, sku: 'ROB-MID-001', category: categories[0], tags: ['Élégant', 'Féminin'], isFeatured: false },
                { name: 'Veste en Cuir', price: 450000, stock: 8, sku: 'VES-CUI-001', category: categories[0], tags: ['Luxe', 'Cuir'], isFeatured: true },
                { name: 'Sneakers Sport', price: 175000, stock: 30, sku: 'SNK-SPT-001', category: categories[0], tags: ['Confort', 'Sport'], isFeatured: false },
                { name: 'Sac à Main Cuir', price: 220000, stock: 12, sku: 'SAC-CUI-001', category: categories[0], tags: ['Luxe', 'Cuir'], isFeatured: false },
                { name: 'Cravate Soie', price: 45000, stock: 50, sku: 'CRV-SOI-001', category: categories[0], tags: ['Formel', 'Soie'], isFeatured: false },
                { name: 'Écharpe Laine', price: 35000, stock: 60, sku: 'ECH-LAI-001', category: categories[0], tags: ['Hiver', 'Laine'], isFeatured: false }
            ],
            'TechZone': [
                { name: 'Smartphone Galaxy Pro', price: 850000, stock: 15, sku: 'SMP-GAL-001', category: categories[1], tags: ['Nouveau', 'Android'], isFeatured: true },
                { name: 'Laptop Ultrabook', price: 2500000, stock: 8, sku: 'LAP-ULT-001', category: categories[1], tags: ['Performance', 'Portable'], isFeatured: true },
                { name: 'Écouteurs Sans Fil', price: 125000, stock: 50, sku: 'ECN-SAN-001', category: categories[1], tags: ['Bluetooth', 'Qualité'], isFeatured: false },
                { name: 'Montre Connectée', price: 195000, stock: 25, sku: 'MNT-CON-001', category: categories[1], tags: ['Smart', 'Fitness'], isFeatured: true },
                { name: 'Tablette 10 pouces', price: 450000, stock: 12, sku: 'TAB-10P-001', category: categories[1], tags: ['Multimédia', 'Portable'], isFeatured: false },
                { name: 'Enceinte Bluetooth', price: 85000, stock: 40, sku: 'ENC-BLU-001', category: categories[1], tags: ['Audio', 'Portable'], isFeatured: false },
                { name: 'Chargeur Rapide', price: 25000, stock: 100, sku: 'CHG-RAP-001', category: categories[1], tags: ['Accessoire', 'Rapide'], isFeatured: false },
                { name: 'Housse Protection', price: 15000, stock: 80, sku: 'HOU-PRO-001', category: categories[1], tags: ['Protection', 'Accessoire'], isFeatured: false }
            ],
            'Home Sweet Home': [
                { name: 'Canapé 3 Places', price: 1250000, stock: 5, sku: 'CAN-3PL-001', category: categories[2], tags: ['Confort', 'Salon'], isFeatured: true },
                { name: 'Table Basse Moderne', price: 195000, stock: 10, sku: 'TAB-BAS-001', category: categories[2], tags: ['Moderne', 'Salon'], isFeatured: false },
                { name: 'Lampe Design', price: 85000, stock: 20, sku: 'LAM-DES-001', category: categories[2], tags: ['Design', 'Éclairage'], isFeatured: false },
                { name: 'Tapis Salon', price: 175000, stock: 8, sku: 'TAP-SAL-001', category: categories[2], tags: ['Décoration', 'Confort'], isFeatured: false },
                { name: 'Vase Décoratif', price: 45000, stock: 30, sku: 'VAS-DEC-001', category: categories[2], tags: ['Décoration', 'Élégant'], isFeatured: false },
                { name: 'Coussin Décoratif', price: 25000, stock: 50, sku: 'COU-DEC-001', category: categories[2], tags: ['Confort', 'Décoration'], isFeatured: false },
                { name: 'Rideaux Salon', price: 125000, stock: 15, sku: 'RID-SAL-001', category: categories[2], tags: ['Décoration', 'Intimité'], isFeatured: false },
                { name: 'Miroir Mural', price: 95000, stock: 12, sku: 'MIR-MUR-001', category: categories[2], tags: ['Décoration', 'Miroir'], isFeatured: false }
            ],
            'Beauty Paradise': [
                { name: 'Parfum Femme', price: 195000, stock: 20, sku: 'PRF-FEM-001', category: categories[3], tags: ['Parfum', 'Féminin'], isFeatured: true },
                { name: 'Crème Visage', price: 85000, stock: 40, sku: 'CRM-VIS-001', category: categories[3], tags: ['Soin', 'Visage'], isFeatured: false },
                { name: 'Rouge à Lèvres', price: 45000, stock: 60, sku: 'ROU-LEV-001', category: categories[3], tags: ['Maquillage', 'Lèvres'], isFeatured: false },
                { name: 'Mascara Volume', price: 35000, stock: 50, sku: 'MAS-VOL-001', category: categories[3], tags: ['Maquillage', 'Yeux'], isFeatured: false },
                { name: 'Shampooing Réparateur', price: 25000, stock: 80, sku: 'SHA-REP-001', category: categories[3], tags: ['Cheveux', 'Soin'], isFeatured: false },
                { name: 'Sérum Anti-Âge', price: 125000, stock: 25, sku: 'SER-ANT-001', category: categories[3], tags: ['Soin', 'Anti-âge'], isFeatured: true },
                { name: 'Masque Visage', price: 55000, stock: 35, sku: 'MSK-VIS-001', category: categories[3], tags: ['Soin', 'Masque'], isFeatured: false },
                { name: 'Déodorant Spray', price: 15000, stock: 100, sku: 'DEO-SPR-001', category: categories[3], tags: ['Hygiène', 'Spray'], isFeatured: false }
            ],
            'Sport & Co': [
                { name: 'Raquette Tennis', price: 195000, stock: 15, sku: 'RAQ-TEN-001', category: categories[5], tags: ['Tennis', 'Sport'], isFeatured: true },
                { name: 'Ballon Football', price: 45000, stock: 40, sku: 'BAL-FOO-001', category: categories[5], tags: ['Football', 'Sport'], isFeatured: false },
                { name: 'Vélo de Course', price: 1250000, stock: 5, sku: 'VEL-COU-001', category: categories[5], tags: ['Vélo', 'Sport'], isFeatured: true },
                { name: 'Tapis de Yoga', price: 35000, stock: 50, sku: 'TAP-YOG-001', category: categories[5], tags: ['Yoga', 'Fitness'], isFeatured: false },
                { name: 'Haltères 5kg', price: 85000, stock: 30, sku: 'HAL-5KG-001', category: categories[5], tags: ['Musculation', 'Fitness'], isFeatured: false },
                { name: 'Chaussures Running', price: 175000, stock: 20, sku: 'CHR-RUN-001', category: categories[5], tags: ['Running', 'Sport'], isFeatured: true },
                { name: 'Sac de Sport', price: 55000, stock: 35, sku: 'SAC-SPT-001', category: categories[5], tags: ['Accessoire', 'Sport'], isFeatured: false },
                { name: 'Gourde Isotherme', price: 25000, stock: 60, sku: 'GOU-ISO-001', category: categories[5], tags: ['Accessoire', 'Hydratation'], isFeatured: false }
            ],
            'Bijoux Prestige': [
                { name: 'Bague Or 18K', price: 850000, stock: 8, sku: 'BAG-OR1-001', category: categories[6], tags: ['Or', 'Luxe'], isFeatured: true },
                { name: 'Collier Perles', price: 450000, stock: 12, sku: 'COL-PER-001', category: categories[6], tags: ['Perles', 'Élégant'], isFeatured: true },
                { name: 'Boucles d\'Oreilles Diamant', price: 1250000, stock: 5, sku: 'BOU-DIA-001', category: categories[6], tags: ['Diamant', 'Luxe'], isFeatured: true },
                { name: 'Bracelet Argent', price: 195000, stock: 20, sku: 'BRA-ARG-001', category: categories[6], tags: ['Argent', 'Élégant'], isFeatured: false },
                { name: 'Montre Luxe', price: 2500000, stock: 6, sku: 'MNT-LUX-001', category: categories[6], tags: ['Luxe', 'Montre'], isFeatured: true },
                { name: 'Pendentif Or', price: 350000, stock: 15, sku: 'PEN-OR1-001', category: categories[6], tags: ['Or', 'Pendentif'], isFeatured: false },
                { name: 'Bague Argent', price: 125000, stock: 25, sku: 'BAG-ARG-001', category: categories[6], tags: ['Argent', 'Bague'], isFeatured: false },
                { name: 'Chaîne Or', price: 550000, stock: 10, sku: 'CHN-OR1-001', category: categories[6], tags: ['Or', 'Chaîne'], isFeatured: false }
            ]
        };

        const allProducts = [];
        for (const [boutiqueName, produits] of Object.entries(produitsData)) {
            const boutique = boutiques.find(b => b.name === boutiqueName);
            if (!boutique) continue;

            for (const prodData of produits) {
                const slug = await generateUniqueSlug(slugify(prodData.name), Product);
                // Générer des images réelles pour le produit
                const productImages = getProductImages(prodData.name, boutiqueName);
                if (!productImages || productImages.length === 0) {
                    console.warn(`⚠️  Aucune image générée pour: ${prodData.name}`);
                }
                const product = await Product.create({
                    name: prodData.name,
                    slug,
                    description: `${prodData.name} - Produit de qualité supérieure`,
                    shortDescription: `Découvrez ${prodData.name}`,
                    price: prodData.price,
                    compareAtPrice: Math.round(prodData.price * 1.3),
                    stock: prodData.stock,
                    lowStockThreshold: 5,
                    sku: prodData.sku,
                    category: prodData.category._id.toString(),
                    boutique: boutique._id,
                    tags: prodData.tags,
                    isFeatured: prodData.isFeatured,
                    status: prodData.stock > 0 ? 'active' : 'out_of_stock',
                    images: productImages || []
                });
                allProducts.push(product);
            }
        }

        console.log(`✅ ${allProducts.length} produits créés`);
        console.log(`   - ${allProducts.filter(p => p.isFeatured).length} produits mis en avant`);
        console.log(`   - ${allProducts.filter(p => p.stock < 10).length} produits en stock limité\n`);

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 5. BOXES (Emplacements)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        console.log('📦 Création des emplacements (boxes)...');

        const boxes = [];
        const zones = ['A', 'B', 'C', 'Food Court'];
        let boxCounter = 1;

        for (let floor = 1; floor <= 3; floor++) {
            for (const zone of zones) {
                for (let i = 1; i <= 5; i++) {
                    const code = `${zone}-${floor}${String(i).padStart(2, '0')}`;
                    const box = await Box.create({
                        name: code,
                        code,
                        floor,
                        zone,
                        area: randomInt(20, 50),
                        monthlyRent: randomInt(500000, 2000000),
                        status: boxCounter <= 6 ? 'occupied' : (boxCounter <= 8 ? 'reserved' : 'available'),
                        boutique: boxCounter <= 6 ? boutiques[boxCounter - 1]._id : null,
                        features: boxCounter % 2 === 0 ? ['Corner unit'] : []
                    });
                    boxes.push(box);
                    boxCounter++;
                }
            }
        }

        console.log(`✅ ${boxes.length} emplacements créés`);
        console.log(`   - ${boxes.filter(b => b.status === 'occupied').length} occupés`);
        console.log(`   - ${boxes.filter(b => b.status === 'reserved').length} réservés`);
        console.log(`   - ${boxes.filter(b => b.status === 'available').length} disponibles\n`);

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 6. COMMANDES EN LIGNE
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        console.log('🛒 Création des commandes en ligne...');

        const orderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        const paymentMethods = ['cash', 'cash_on_pickup', 'mobile_money', 'card'];
        const fulfillmentTypes = ['delivery', 'pickup'];

        const onlineOrders = [];
        const activeBoutiques = boutiques.filter(b => b.status === 'active');

        for (let i = 0; i < 30; i++) {
            const user = pickRandom(acheteurs);
            const boutique = pickRandom(activeBoutiques);
            const boutiqueProducts = allProducts.filter(p => String(p.boutique) === String(boutique._id) && p.stock > 0);

            if (boutiqueProducts.length === 0) continue;

            const numItems = randomInt(1, 4);
            const selectedProducts = [];
            for (let j = 0; j < numItems && j < boutiqueProducts.length; j++) {
                const product = pickRandom(boutiqueProducts.filter(p => !selectedProducts.includes(p)));
                if (product) {
                    selectedProducts.push(product);
                }
            }

            if (selectedProducts.length === 0) continue;

            const items = selectedProducts.map(p => ({
                product: p._id,
                quantity: randomInt(1, 3),
                price: p.price,
                name: p.name
            }));

            const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const status = pickRandom(orderStatuses);
            const paymentMethod = pickRandom(paymentMethods);
            const fulfillmentType = pickRandom(fulfillmentTypes);

            // Date aléatoire dans les 30 derniers jours
            const createdAt = randomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date());

            const order = await Order.create({
                user: user._id,
                items,
                boutique: boutique._id,
                totalAmount,
                status,
                paymentStatus: status === 'cancelled' ? 'failed' : (status === 'delivered' ? 'paid' : 'pending'),
                paymentMethod,
                fulfillmentType,
                shippingAddress: fulfillmentType === 'delivery' ? {
                    street: `${randomInt(1, 100)} Rue de la République`,
                    city: 'Antananarivo',
                    country: 'Madagascar',
                    postalCode: '101'
                } : undefined,
                notes: i % 5 === 0 ? 'Commande urgente' : undefined,
                createdAt,
                updatedAt: createdAt
            });

            onlineOrders.push(order);
        }

        console.log(`✅ ${onlineOrders.length} commandes en ligne créées`);
        console.log(`   - ${onlineOrders.filter(o => o.status === 'pending').length} en attente`);
        console.log(`   - ${onlineOrders.filter(o => o.status === 'processing').length} en traitement`);
        console.log(`   - ${onlineOrders.filter(o => o.status === 'delivered').length} livrées`);
        console.log(`   - ${onlineOrders.filter(o => o.status === 'cancelled').length} annulées\n`);

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 7. VENTES POS (CAISSE)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        console.log('💰 Création des ventes POS (caisse)...');

        const posOrders = [];
        const posPaymentMethods = ['cash', 'mobile_money', 'card'];

        for (let i = 0; i < 50; i++) {
            const boutique = pickRandom(activeBoutiques);
            const boutiqueProducts = allProducts.filter(p => String(p.boutique) === String(boutique._id) && p.stock > 0);
            if (boutiqueProducts.length === 0) continue;

            const numItems = randomInt(1, 5);
            const selectedProducts = [];
            for (let j = 0; j < numItems && j < boutiqueProducts.length; j++) {
                const product = pickRandom(boutiqueProducts.filter(p => !selectedProducts.includes(p)));
                if (product) selectedProducts.push(product);
            }
            if (selectedProducts.length === 0) continue;

            const items = selectedProducts.map(p => ({
                product: p._id,
                quantity: randomInt(1, 4),
                price: p.price,
                name: p.name
            }));

            const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const discountPercent = i % 10 === 0 ? randomInt(5, 20) : 0;
            const discountAmount = discountPercent > 0 ? Math.round(subtotal * discountPercent / 100) : 0;
            const afterDiscount = subtotal - discountAmount;
            const taxRate = i % 5 === 0 ? 20 : 0;
            const taxAmount = taxRate > 0 ? Math.round(afterDiscount * taxRate / 100) : 0;
            const totalAmount = afterDiscount + taxAmount;

            const paymentMethod = pickRandom(posPaymentMethods);
            const amountReceived = paymentMethod === 'cash' ? totalAmount + randomInt(0, 10000) : totalAmount;
            const changeGiven = paymentMethod === 'cash' ? amountReceived - totalAmount : 0;

            // Date aléatoire dans les 7 derniers jours
            const createdAt = randomDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date());

            // Générer numéro facture
            const dateStr = createdAt.toISOString().slice(0, 10).replace(/-/g, '');
            const todayStart = new Date(createdAt);
            todayStart.setHours(0, 0, 0, 0);
            const todayCount = await Order.countDocuments({
                orderType: 'pos',
                boutique: boutique._id,
                createdAt: { $gte: todayStart, $lt: new Date(createdAt.getTime() + 24 * 60 * 60 * 1000) }
            });
            const receiptNumber = `REC-${dateStr}-${String(todayCount + 1).padStart(4, '0')}`;

            const order = await Order.create({
                user: i % 3 === 0 ? pickRandom(acheteurs)._id : undefined,
                items,
                boutique: boutique._id,
                subtotal,
                discountAmount,
                discountPercent,
                taxAmount,
                taxRate,
                totalAmount,
                amountReceived: paymentMethod === 'cash' ? amountReceived : undefined,
                changeGiven: paymentMethod === 'cash' ? changeGiven : undefined,
                receiptNumber,
                orderType: 'pos',
                cashierId: boutique.owner,
                customerName: i % 3 === 0 ? undefined : `Client ${i + 1}`,
                fulfillmentType: 'pos',
                paymentMethod,
                paymentStatus: 'paid',
                status: 'delivered',
                createdAt,
                updatedAt: createdAt
            });

            posOrders.push(order);
        }

        console.log(`✅ ${posOrders.length} ventes POS créées`);
        console.log(`   - ${posOrders.filter(o => o.paymentMethod === 'cash').length} en espèces`);
        console.log(`   - ${posOrders.filter(o => o.paymentMethod === 'mobile_money').length} en mobile money`);
        console.log(`   - ${posOrders.filter(o => o.paymentMethod === 'card').length} en carte`);
        console.log(`   - ${posOrders.filter(o => o.discountAmount > 0).length} avec remise`);
        console.log(`   - ${posOrders.filter(o => o.taxAmount > 0).length} avec TVA\n`);

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // RÉSUMÉ FINAL
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        console.log('╔══════════════════════════════════════════════════╗');
        console.log('║          RÉSUMÉ DES DONNÉES CRÉÉES              ║');
        console.log('╠══════════════════════════════════════════════════╣');
        console.log(`║  👥 Utilisateurs      : ${admins.length + boutiqueOwners.length + acheteurs.length} (${admins.length} admin, ${boutiqueOwners.length} boutiques, ${acheteurs.length} acheteurs)`);
        console.log(`║  📂 Catégories       : ${categories.length}`);
        console.log(`║  🏪 Boutiques         : ${boutiques.length} (${boutiques.filter(b => b.status === 'active').length} actives)`);
        console.log(`║  📦 Produits          : ${allProducts.length}`);
        console.log(`║  📦 Emplacements      : ${boxes.length}`);
        console.log(`║  🛒 Commandes en ligne: ${onlineOrders.length}`);
        console.log(`║  💰 Ventes POS        : ${posOrders.length}`);
        console.log(`║  📊 Total commandes   : ${onlineOrders.length + posOrders.length}`);
        console.log('╚══════════════════════════════════════════════════╝\n');

        console.log('🔑 COMPTES DE TEST:');
        console.log('   Admin: admin@mall.mg / Admin1234!');
        console.log('   Boutique: boutique1@mall.mg / Boutique1234!');
        console.log('   Client: client1@mall.mg / Client1234!\n');

        console.log('✅ Seed terminé avec succès !\n');

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
}

// Exécuter seulement si appelé directement
if (require.main === module) {
    runSeed();
}

// Exporter la fonction pour utilisation dans init-db.js
module.exports = runSeed;

