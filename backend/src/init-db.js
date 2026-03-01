/**
 * Script d'initialisation automatique de la base de données
 * Exécute le seed-demo.js si la base est vide (premier démarrage)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
// Le seed-demo.js exporte directement la fonction runSeed

const MONGO_URI = process.env.MONGO_URI || 
    (process.env.MONGO_ROOT_USER && process.env.MONGO_ROOT_PASSWORD
        ? `mongodb://${process.env.MONGO_ROOT_USER}:${process.env.MONGO_ROOT_PASSWORD}@localhost:27017/mall_manage_db?authSource=admin`
        : 'mongodb://127.0.0.1:27017/mall_manage_db');

async function initializeDatabase() {
    try {
        console.log('\n🔍 Vérification de la base de données...');
        
        // Déterminer l'URI MongoDB selon l'environnement
        const isDocker = process.env.IS_DOCKER === 'true';
        let mongoUri = MONGO_URI;
        
        if (isDocker && process.env.MONGO_USERNAME && process.env.MONGO_PASSWORD) {
            mongoUri = `mongodb://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@mongo:27017/mall_manage_db?authSource=admin`;
        }

        // Connexion à MongoDB pour vérification
        await mongoose.connect(mongoUri);
        console.log('✅ Connexion MongoDB établie');

        // Vérifier si la base contient déjà des utilisateurs
        const userCount = await User.countDocuments();
        
        // Déconnecter avant d'exécuter le seed (seed-demo.js gère sa propre connexion)
        await mongoose.disconnect();
        
        if (userCount === 0) {
            console.log('📦 Base de données vide détectée');
            console.log('🌱 Exécution du seed de démonstration...\n');
            
            // Exécuter le seed (il gère sa propre connexion)
            const seedDemo = require('./seed-demo');
            await seedDemo();
            console.log('\n✅ Initialisation terminée avec succès !');
        } else {
            console.log(`✅ Base de données déjà initialisée (${userCount} utilisateurs trouvés)`);
        }
        return true;
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error.message);
        // Ne pas bloquer le démarrage si l'initialisation échoue
        return false;
    }
}

// Exécuter seulement si appelé directement
if (require.main === module) {
    initializeDatabase()
        .then((success) => {
            process.exit(success ? 0 : 1);
        })
        .catch((error) => {
            console.error('Erreur fatale:', error);
            process.exit(1);
        });
}

module.exports = initializeDatabase;

