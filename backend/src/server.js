require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const isProduction = process.env.NODE_ENV === 'production';
const jwtSecret = process.env.JWT_SECRET || '';

if (!jwtSecret) {
    console.warn('Warning: JWT_SECRET is not set. Authentication tokens will be insecure.');
}

if (isProduction && (!jwtSecret || jwtSecret.includes('change_me'))) {
    throw new Error('JWT_SECRET must be set to a strong value in production.');
}

// Connect to Database
connectDB().then(async () => {
    // Initialiser la base de données si elle est vide (premier démarrage)
    // Attendre un peu pour s'assurer que la connexion est stable
    setTimeout(async () => {
        if (process.env.AUTO_SEED === 'true' || process.env.AUTO_SEED === '1') {
            try {
                const initDb = require('./init-db');
                await initDb();
            } catch (error) {
                console.error('Erreur lors de l\'initialisation automatique:', error.message);
                // Ne pas bloquer le démarrage si l'initialisation échoue
            }
        }
    }, 2000);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
