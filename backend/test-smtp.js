/**
 * Script de test pour vérifier la configuration SMTP
 * 
 * Usage: node test-smtp.js
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

const testSMTP = async () => {
    console.log('🔍 Vérification de la configuration SMTP...\n');

    // Vérifier les variables d'environnement
    const requiredVars = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
        console.error('❌ Variables d\'environnement manquantes:');
        missingVars.forEach(varName => console.error(`   - ${varName}`));
        console.error('\n💡 Créez un fichier .env dans le dossier backend/ avec ces variables.');
        console.error('   Voir GUIDE_CONFIGURATION_SMTP.md pour plus d\'informations.\n');
        process.exit(1);
    }

    console.log('✅ Variables d\'environnement trouvées:');
    console.log(`   SMTP_HOST: ${process.env.SMTP_HOST}`);
    console.log(`   SMTP_PORT: ${process.env.SMTP_PORT || '587'}`);
    console.log(`   SMTP_USER: ${process.env.SMTP_USER}`);
    console.log(`   SMTP_PASS: ${process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : 'non défini'}`);
    console.log(`   SMTP_FROM_EMAIL: ${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}`);
    console.log('');

    // Créer le transporteur
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        tls: {
            rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== 'false'
        }
    });

    // Tester la connexion
    console.log('🔌 Test de connexion au serveur SMTP...');
    try {
        await transporter.verify();
        console.log('✅ Connexion SMTP réussie !\n');
    } catch (error) {
        console.error('❌ Erreur de connexion SMTP:');
        console.error(`   ${error.message}\n`);
        
        if (error.code === 'EAUTH') {
            console.error('💡 Vérifiez vos identifiants SMTP_USER et SMTP_PASS');
            if (process.env.SMTP_HOST === 'smtp.gmail.com') {
                console.error('   Pour Gmail, utilisez un "App Password" et non votre mot de passe normal.');
            }
        } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
            console.error('💡 Vérifiez SMTP_HOST et SMTP_PORT');
        }
        
        process.exit(1);
    }

    // Tester l'envoi d'un email
    const testEmail = process.env.SMTP_USER; // Envoyer à soi-même par défaut
    console.log(`📧 Test d'envoi d'email à ${testEmail}...`);

    try {
        const info = await transporter.sendMail({
            from: `"${process.env.SMTP_FROM_NAME || 'Test SMTP'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
            to: testEmail,
            subject: 'Test SMTP - Centre Commercial',
            html: `
                <h2>✅ Test SMTP réussi !</h2>
                <p>Si vous recevez cet email, votre configuration SMTP fonctionne correctement.</p>
                <p><strong>Serveur:</strong> ${process.env.SMTP_HOST}</p>
                <p><strong>Date:</strong> ${new Date().toLocaleString('fr-FR')}</p>
            `,
            text: 'Test SMTP réussi ! Si vous recevez cet email, votre configuration SMTP fonctionne correctement.'
        });

        console.log('✅ Email envoyé avec succès !');
        console.log(`   Message ID: ${info.messageId}`);
        console.log(`   Vérifiez votre boîte email (et le dossier spam si nécessaire).\n`);
    } catch (error) {
        console.error('❌ Erreur lors de l\'envoi de l\'email:');
        console.error(`   ${error.message}\n`);
        process.exit(1);
    }

    console.log('🎉 Configuration SMTP validée avec succès !');
    console.log('   Vous pouvez maintenant utiliser le système d\'emails transactionnels.\n');
};

// Exécuter le test
testSMTP().catch(error => {
    console.error('❌ Erreur inattendue:', error);
    process.exit(1);
});

