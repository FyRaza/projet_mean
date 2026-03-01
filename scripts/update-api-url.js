/**
 * Script pour mettre à jour l'URL de l'API dans environment.prod.ts
 * Usage: node scripts/update-api-url.js https://votre-backend.up.railway.app/api
 */

const fs = require('fs');
const path = require('path');

const apiUrl = process.argv[2];

if (!apiUrl) {
    console.error('❌ Erreur: URL de l\'API requise');
    console.log('Usage: node scripts/update-api-url.js <API_URL>');
    console.log('Exemple: node scripts/update-api-url.js https://votre-app.up.railway.app/api');
    process.exit(1);
}

const envFile = path.join(__dirname, '../src/environments/environment.prod.ts');

try {
    let content = fs.readFileSync(envFile, 'utf8');
    
    // Remplacer l'URL de l'API
    content = content.replace(
        /apiUrl:\s*['"`][^'"`]*['"`]/,
        `apiUrl: '${apiUrl}'`
    );
    
    fs.writeFileSync(envFile, content, 'utf8');
    console.log(`✅ URL de l'API mise à jour: ${apiUrl}`);
} catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error.message);
    process.exit(1);
}

