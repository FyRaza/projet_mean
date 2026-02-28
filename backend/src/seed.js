require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Boutique = require('./models/Boutique');
const Product = require('./models/Product');
const Category = require('./models/Category');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mall_manage_db';

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

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ MongoDB connecté');

        await User.deleteMany({});
        await Boutique.deleteMany({});
        await Product.deleteMany({});
        await Category.deleteMany({});
        console.log('🗑️  Collections vidées');

        const salt = await bcrypt.genSalt(10);

        const admin = await User.create({
            firstName: 'Super', lastName: 'Admin',
            email: 'admin@mall.mg',
            password: 'Admin1234!',
            role: 'admin', phone: '+261 34 00 000 01'
        });

        const boutiqueOwner = await User.create({
            firstName: 'Marie', lastName: 'Martin',
            email: 'boutique@mall.mg',
            password: 'Boutique1234!',
            role: 'boutique', phone: '+261 34 00 000 02'
        });

        await User.create({
            firstName: 'Jean', lastName: 'Dupont',
            email: 'client@mall.mg',
            password: 'Client1234!',
            role: 'acheteur', phone: '+261 34 00 000 03'
        });

        console.log('👥 3 utilisateurs créés');

        const boutique1 = await Boutique.create({
            name: 'Mode Élégance', slug: 'mode-elegance',
            description: 'Boutique de vêtements modernes et élégants.',
            contactEmail: 'contact@mode-elegance.mg',
            contactPhone: '+261 34 11 222 33',
            categoryId: 'cat-vetements',
            owner: boutiqueOwner._id, status: 'active'
        });

        const boutique2 = await Boutique.create({
            name: 'Tech & Gadgets', slug: 'tech-gadgets',
            description: 'Les dernières nouveautés en technologie.',
            contactEmail: 'contact@techgadgets.mg',
            contactPhone: '+261 34 22 333 44',
            categoryId: 'cat-electronique',
            owner: boutiqueOwner._id, status: 'active'
        });

        const boutique3 = await Boutique.create({
            name: 'Beauté & Soins', slug: 'beaute-soins',
            description: 'Produits de beauté naturels et bio.',
            contactEmail: 'contact@beautesoins.mg',
            contactPhone: '+261 34 33 444 55',
            categoryId: 'cat-beaute',
            owner: boutiqueOwner._id, status: 'pending'
        });

        // Categories
        const categoryNames = [
            'Vêtements',
            'Électronique',
            'Beauté & Soins',
            'Maison & Déco',
            'Sports & Loisirs',
            'Accessoires',
            'Livres & Culture',
            'Alimentation',
            'Jouets'
        ];
        const productCategories = await Category.insertMany(
            categoryNames.map((name) => ({
                name,
                slug: slugify(name),
                description: `Catégorie produit ${name}`,
                type: 'product',
                isActive: true
            }))
        );

        console.log('🏪 3 boutiques créées');

        await Product.insertMany([
            {
                name: 'Chemise Lin Premium', slug: 'chemise-lin-premium',
                description: 'Chemise en lin de haute qualité, parfaite pour les journées chaudes.',
                price: 85000, compareAtPrice: 120000, stock: 25, lowStockThreshold: 5,
                sku: 'CHM-LIN-001', boutique: boutique1._id,
                category: productCategories[0]._id,
                tags: ['Nouveau', 'Lin', 'Été'], status: 'active', isFeatured: true,
                images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&h=600&fit=crop']
            },
            {
                name: 'Robe Soirée Noire', slug: 'robe-soiree-noire',
                description: 'Magnifique robe de soirée noire, coupe élégante.',
                price: 195000, compareAtPrice: 250000, stock: 12, lowStockThreshold: 3,
                sku: 'ROB-SOI-002', boutique: boutique1._id,
                category: productCategories[0]._id,
                tags: ['Élégant', 'Soirée'], status: 'active', isFeatured: true,
                images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=600&fit=crop']
            },
            {
                name: 'Écouteurs Sans Fil Pro', slug: 'ecouteurs-sans-fil-pro',
                description: 'Écouteurs Bluetooth avec réduction de bruit. Autonomie 30h.',
                price: 320000, compareAtPrice: 400000, stock: 45, lowStockThreshold: 10,
                sku: 'ECO-PRO-003', boutique: boutique2._id,
                category: productCategories[1]._id,
                tags: ['Tech', 'Audio'], status: 'active', isFeatured: true,
                images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&h=600&fit=crop']
            },
            {
                name: 'Montre Connectée Sport', slug: 'montre-connectee-sport',
                description: 'Montre connectée GPS, 100+ modes sportifs. IPX7.',
                price: 450000, stock: 18, lowStockThreshold: 5,
                sku: 'MON-SPT-004', boutique: boutique2._id,
                category: productCategories[4]._id,
                tags: ['Sport', 'GPS'], status: 'active', isFeatured: false,
                images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop']
            },
            {
                name: 'Coffret Soins Visage', slug: 'coffret-soins-visage',
                description: 'Coffret bio complet : nettoyant, sérum, crème et masque.',
                price: 175000, compareAtPrice: 220000, stock: 30, lowStockThreshold: 8,
                sku: 'COF-SOI-005', boutique: boutique3._id,
                category: productCategories[2]._id,
                tags: ['Bio', 'Soins'], status: 'active', isFeatured: true,
                images: ['https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&h=600&fit=crop']
            },
            {
                name: 'Parfum Eau de Rose', slug: 'parfum-eau-de-rose',
                description: 'Parfum délicat rose, jasmin et musc. 100ml.',
                price: 125000, stock: 40, lowStockThreshold: 10,
                sku: 'PAR-ROS-006', boutique: boutique3._id,
                category: productCategories[2]._id,
                tags: ['Parfum', 'Rose'], status: 'active', isFeatured: false,
                images: ['https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&h=600&fit=crop']
            }
        ]);

        console.log('📦 6 produits créés');
        console.log('\n╔══════════════════════════════════════════════╗');
        console.log('║         ✅  SEED TERMINÉ AVEC SUCCÈS          ║');
        console.log('╠══════════════════════════════════════════════╣');
        console.log('║  COMPTES DE TEST :                           ║');
        console.log('║                                              ║');
        console.log('║  👑 Admin                                    ║');
        console.log('║     Email    : admin@mall.mg                 ║');
        console.log('║     Password : Admin1234!                    ║');
        console.log('║                                              ║');
        console.log('║  🏪 Boutique Owner                           ║');
        console.log('║     Email    : boutique@mall.mg              ║');
        console.log('║     Password : Boutique1234!                 ║');
        console.log('║                                              ║');
        console.log('║  🛒 Client / Acheteur                        ║');
        console.log('║     Email    : client@mall.mg                ║');
        console.log('║     Password : Client1234!                   ║');
        console.log('╚══════════════════════════════════════════════╝\n');

    } catch (err) {
        console.error('❌ Erreur seed :', err.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

seed();
