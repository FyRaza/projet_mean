require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Boutique = require('./models/Boutique');
const Product = require('./models/Product');
const Order = require('./models/Order');
const Category = require('./models/Category');
const Box = require('./models/Box');

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

function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB connected');

        await Order.deleteMany({});
        await Product.deleteMany({});
        await Box.deleteMany({});
        await Boutique.deleteMany({});
        await Category.deleteMany({});
        await User.deleteMany({});
        console.log('Collections cleaned');

        // Users
        const users = await User.create([
            { firstName: 'Super', lastName: 'Admin', email: 'admin@mall.mg', password: 'Admin1234!', role: 'admin', phone: '+261340000001' },
            { firstName: 'Marie', lastName: 'Martin', email: 'boutique@mall.mg', password: 'Boutique1234!', role: 'boutique', phone: '+261340000002' },
            { firstName: 'Jean', lastName: 'Dupont', email: 'client@mall.mg', password: 'Client1234!', role: 'acheteur', phone: '+261340000003' },
            { firstName: 'Aina', lastName: 'Rabe', email: 'boutique2@mall.mg', password: 'Boutique1234!', role: 'boutique', phone: '+261340000004' },
            { firstName: 'Lova', lastName: 'Randria', email: 'boutique3@mall.mg', password: 'Boutique1234!', role: 'boutique', phone: '+261340000005' },
            { firstName: 'Kanto', lastName: 'Niry', email: 'client2@mall.mg', password: 'Client1234!', role: 'acheteur', phone: '+261340000006' },
            { firstName: 'Miora', lastName: 'Tiana', email: 'client3@mall.mg', password: 'Client1234!', role: 'acheteur', phone: '+261340000007' },
            { firstName: 'Hery', lastName: 'Solo', email: 'client4@mall.mg', password: 'Client1234!', role: 'acheteur', phone: '+261340000008' }
        ]);

        const adminUser = users.find((u) => u.role === 'admin');
        const boutiqueUsers = users.filter((u) => u.role === 'boutique');
        const clientUsers = users.filter((u) => u.role === 'acheteur');
        console.log(`${users.length} users created`);

        // Categories
        const productCategoryNames = [
            'Mode',
            'Electronique',
            'Maison',
            'Beaute',
            'Sport',
            'Alimentation',
            'Livres'
        ];
        const boutiqueCategoryNames = ['Pret-a-porter', 'High-Tech', 'Cosmetique', 'Food & Drinks'];

        const productCategories = await Category.create(
            productCategoryNames.map((name, i) => ({
                name,
                slug: slugify(name),
                description: `Categorie produit ${name}`,
                icon: `icon-${i + 1}`,
                type: 'product',
                isActive: true
            }))
        );

        const boutiqueCategories = await Category.create(
            boutiqueCategoryNames.map((name, i) => ({
                name,
                slug: slugify(name),
                description: `Categorie boutique ${name}`,
                icon: `shop-icon-${i + 1}`,
                type: 'boutique',
                isActive: true
            }))
        );
        console.log(`${productCategories.length + boutiqueCategories.length} categories created`);

        // Boutiques
        const boutiqueSeeds = [
            {
                name: 'Mode Elegance',
                description: 'Vetements modernes et tendances.',
                contactEmail: 'contact@mode-elegance.mg',
                contactPhone: '+261341112233',
                owner: boutiqueUsers[0]._id,
                status: 'active',
                categoryId: productCategories[0].slug
            },
            {
                name: 'Tech Planet',
                description: 'Gadgets et electronique grand public.',
                contactEmail: 'contact@techplanet.mg',
                contactPhone: '+261342223344',
                owner: boutiqueUsers[1]._id,
                status: 'active',
                categoryId: productCategories[1].slug
            },
            {
                name: 'Beauty Garden',
                description: 'Produits de beaute et soins.',
                contactEmail: 'contact@beautygarden.mg',
                contactPhone: '+261343334455',
                owner: boutiqueUsers[2]._id,
                status: 'pending',
                categoryId: productCategories[3].slug
            },
            {
                name: 'Sport Avenue',
                description: 'Equipements et accessoires sportifs.',
                contactEmail: 'contact@sportavenue.mg',
                contactPhone: '+261344445566',
                owner: boutiqueUsers[0]._id,
                status: 'active',
                categoryId: productCategories[4].slug
            }
        ];

        const boutiques = await Boutique.create(
            boutiqueSeeds.map((b) => ({
                ...b,
                slug: slugify(b.name),
                logo: `https://placehold.co/120x120?text=${encodeURIComponent(b.name)}`
            }))
        );
        console.log(`${boutiques.length} boutiques created`);

        // Boxes
        const zones = ['A', 'B', 'C', 'Food'];
        const boxDocs = [];
        for (let i = 1; i <= 24; i++) {
            const floor = i <= 8 ? 0 : i <= 16 ? 1 : 2;
            const zone = zones[i % zones.length];
            boxDocs.push({
                name: `${zone}-${100 + i}`,
                code: `BOX-${zone}-${100 + i}`,
                floor,
                zone,
                area: randomInt(18, 55),
                monthlyRent: randomInt(900000, 2800000),
                status: i % 7 === 0 ? 'maintenance' : i % 5 === 0 ? 'reserved' : 'available',
                features: ['wifi', 'camera', 'storage'].filter(() => Math.random() > 0.35)
            });
        }

        const boxes = await Box.create(boxDocs);
        for (let i = 0; i < boutiques.length; i++) {
            boxes[i].boutique = boutiques[i]._id;
            boxes[i].status = 'occupied';
            await boxes[i].save();
        }
        console.log(`${boxes.length} boxes created`);

        // Products
        const productNames = [
            'Chemise Premium',
            'Robe Soiree',
            'Casque Bluetooth',
            'Montre Connectee',
            'Lampe Design',
            'Set Soins Visage',
            'Chaussures Running',
            'Sac a Dos Urbain',
            'Clavier Mecanique',
            'Cafetiere Smart',
            'Parfum Floral',
            'Tapis Yoga'
        ];

        const productDocs = [];
        for (let i = 0; i < 36; i++) {
            const boutique = boutiques[i % boutiques.length];
            const baseName = productNames[i % productNames.length];
            const name = `${baseName} ${i + 1}`;
            const price = randomInt(25000, 490000);
            const stock = randomInt(0, 60);
            const category = pickRandom(productCategories);
            const status = stock === 0 ? 'out_of_stock' : i % 9 === 0 ? 'draft' : 'active';

            productDocs.push({
                name,
                slug: slugify(`${boutique.slug}-${name}`),
                description: `Description de test pour ${name}.`,
                shortDescription: `Resume ${name}`,
                price,
                compareAtPrice: Math.random() > 0.45 ? Math.round(price * 1.25) : undefined,
                stock,
                lowStockThreshold: randomInt(3, 10),
                images: [
                    `https://placehold.co/600x600?text=${encodeURIComponent(name)}`,
                    `https://placehold.co/600x600?text=${encodeURIComponent(`${name}-2`)}`
                ],
                category: category._id,
                boutique: boutique._id,
                tags: [category.slug, boutique.slug, i % 2 === 0 ? 'promo' : 'nouveau'],
                isFeatured: i % 6 === 0,
                sku: `SKU-${String(i + 1).padStart(4, '0')}`,
                status
            });
        }

        const products = await Product.create(productDocs);
        console.log(`${products.length} products created`);

        // Orders
        const orderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        const paymentStatuses = ['pending', 'paid', 'failed'];
        const orderDocs = [];

        for (let i = 0; i < 45; i++) {
            const client = clientUsers[i % clientUsers.length];
            const boutique = boutiques[i % boutiques.length];
            const boutiqueProducts = products.filter((p) => p.boutique.toString() === boutique._id.toString() && p.status !== 'draft');
            const itemCount = randomInt(1, 3);
            const chosen = [];

            while (chosen.length < itemCount && boutiqueProducts.length > 0) {
                const candidate = pickRandom(boutiqueProducts);
                if (!chosen.find((c) => c.product.toString() === candidate._id.toString())) {
                    const qty = randomInt(1, 3);
                    chosen.push({
                        product: candidate._id,
                        quantity: qty,
                        price: candidate.price,
                        name: candidate.name
                    });
                }
            }

            const totalAmount = chosen.reduce((sum, item) => sum + item.price * item.quantity, 0);
            const status = orderStatuses[i % orderStatuses.length];
            const paymentStatus = status === 'delivered' ? 'paid' : paymentStatuses[i % paymentStatuses.length];

            orderDocs.push({
                user: client._id,
                items: chosen,
                totalAmount,
                status,
                paymentStatus,
                boutique: boutique._id,
                shippingAddress: {
                    street: `${randomInt(1, 300)} Avenue de Test`,
                    city: pickRandom(['Antananarivo', 'Toamasina', 'Fianarantsoa', 'Mahajanga']),
                    postalCode: `${randomInt(100, 999)}`,
                    country: 'Madagascar'
                }
            });
        }

        const orders = await Order.create(orderDocs);
        console.log(`${orders.length} orders created`);

        console.log('\n========== TEST DATA READY ==========');
        console.log('Admin:       admin@mall.mg / Admin1234!');
        console.log('Boutique #1: boutique@mall.mg / Boutique1234!');
        console.log('Boutique #2: boutique2@mall.mg / Boutique1234!');
        console.log('Boutique #3: boutique3@mall.mg / Boutique1234!');
        console.log('Client #1:   client@mall.mg / Client1234!');
        console.log('Client #2:   client2@mall.mg / Client1234!');
        console.log('Client #3:   client3@mall.mg / Client1234!');
        console.log('Client #4:   client4@mall.mg / Client1234!');
        console.log('=====================================\n');
    } catch (error) {
        console.error('Seed failed:', error);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

run();
