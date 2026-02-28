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
connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
