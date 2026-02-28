const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const authRoutes = require('./routes/auth.routes');
const boutiqueRoutes = require('./routes/boutique.routes');
const productRoutes = require('./routes/product.routes');
const orderRoutes = require('./routes/order.routes');
const boxRoutes = require('./routes/box.routes');
const categoryRoutes = require('./routes/category.routes');

const app = express();

// Middleware
app.use(express.json());
const allowedOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
        // Allow non-browser clients (no origin) and allow all in dev if no CORS_ORIGIN is configured.
        if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
};

app.use(cors(corsOptions));
app.use(morgan('dev'));

// -----------------------------------------------
// Swagger UI — Documentation interactive de l'API
// -----------------------------------------------
const swaggerUiOptions = {
    customSiteTitle: '🏬 Mall API Docs',
    customCss: `
        .swagger-ui .topbar { background-color: #1a1a2e; }
        .swagger-ui .topbar a { color: #e94560; }
        .swagger-ui .topbar .download-url-wrapper { display: none; }
        .swagger-ui .info .title { color: #1a1a2e; }
        .swagger-ui .btn.authorize { background-color: #e94560; border-color: #e94560; }
        .swagger-ui .btn.authorize svg { fill: #fff; }
    `,
    customfavIcon: 'https://www.svgrepo.com/show/303264/mongodb-logo.svg',
    swaggerOptions: {
        persistAuthorization: true,   // Le token reste en mémoire après rafraîchissement
        displayRequestDuration: true, // Affiche la durée des requêtes
        docExpansion: 'list',         // Expand les listes par défaut
        filter: true,                 // Barre de recherche des endpoints
        showExtensions: true
    }
};

const isSwaggerEnabled = process.env.SWAGGER_ENABLED !== 'false';

if (isSwaggerEnabled) {
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
}

// Endpoint JSON brut de la spec OpenAPI (utile pour Postman, Insomnia, etc.)
app.get('/api/docs.json', (req, res) => {
    if (!isSwaggerEnabled) {
        return res.status(404).json({ message: 'API docs are disabled' });
    }
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

// -----------------------------------------------
// Base Route
// -----------------------------------------------
app.get('/', (req, res) => {
    const baseUrl = process.env.APP_BASE_URL || `${req.protocol}://${req.get('host')}`;

    res.json({
        message: '🏬 Welcome to Mall Management API',
        version: '1.0.0',
        documentation: isSwaggerEnabled ? `${baseUrl}/api/docs` : null,
        endpoints: {
            auth: '/api/auth',
            boutiques: '/api/boutiques',
            products: '/api/products',
            orders: '/api/orders',
            boxes: '/api/boxes',
            categories: '/api/categories'
        }
    });
});

// -----------------------------------------------
// API Routes
// -----------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/boutiques', boutiqueRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/boxes', boxRoutes);
app.use('/api/categories', categoryRoutes);

// -----------------------------------------------
// Error Handling Middleware
// -----------------------------------------------
app.use((err, req, res, next) => {
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({ message: err.message });
    }

    console.error(err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

module.exports = app;
