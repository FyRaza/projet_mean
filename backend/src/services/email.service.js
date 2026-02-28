const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;

// Configuration du transporteur SMTP
const createTransporter = () => {
    // En développement, utiliser un service de test comme Ethereal Email
    if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
        // Pour les tests, on peut utiliser un compte de test
        // En production, utiliser les vraies credentials SMTP
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.ethereal.email',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    // Configuration SMTP de production
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true pour 465, false pour autres ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        tls: {
            rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== 'false'
        }
    });
};

// Charger un template HTML
const loadTemplate = async (templateName, variables = {}) => {
    try {
        const templatePath = path.join(__dirname, '..', 'templates', 'emails', `${templateName}.html`);
        let html = await fs.readFile(templatePath, 'utf-8');

        // Remplacer les variables dans le template
        Object.keys(variables).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            html = html.replace(regex, variables[key] || '');
        });

        return html;
    } catch (error) {
        console.error(`Error loading template ${templateName}:`, error);
        throw error;
    }
};

// Envoyer un email
const sendEmail = async ({ to, subject, html, text }) => {
    try {
        // Si SMTP n'est pas configuré, logger seulement en développement
        if (!process.env.SMTP_HOST && process.env.NODE_ENV === 'development') {
            console.log('📧 Email would be sent (SMTP not configured):');
            console.log(`   To: ${to}`);
            console.log(`   Subject: ${subject}`);
            return { success: true, messageId: 'dev-mode' };
        }

        if (!process.env.SMTP_HOST) {
            console.warn('⚠️  SMTP not configured. Email not sent.');
            return { success: false, error: 'SMTP not configured' };
        }

        const transporter = createTransporter();
        const info = await transporter.sendMail({
            from: `"${process.env.SMTP_FROM_NAME || 'Centre Commercial'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
            to,
            subject,
            html,
            text: text || subject
        });

        console.log(`✅ Email sent to ${to}: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Error sending email:', error);
        return { success: false, error: error.message };
    }
};

// Email de confirmation d'inscription
const sendWelcomeEmail = async (user) => {
    const html = await loadTemplate('welcome', {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role === 'acheteur' ? 'Acheteur' : user.role === 'boutique' ? 'Propriétaire de boutique' : 'Administrateur',
        appUrl: process.env.APP_BASE_URL || 'http://localhost:4200'
    });

    return await sendEmail({
        to: user.email,
        subject: `Bienvenue sur ${process.env.APP_NAME || 'Centre Commercial'} !`,
        html
    });
};

// Email de confirmation de commande
const sendOrderConfirmationEmail = async (order, user) => {
    // Générer le HTML de la liste des items
    let itemsListHtml = '';
    if (order.items && order.items.length > 0) {
        itemsListHtml = order.items.map(item => {
            const itemName = item.name || (item.product && (item.product.name || 'Produit')) || 'Produit';
            const quantity = item.quantity || 1;
            const price = item.price || 0;
            const total = price * quantity;
            
            return `
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">
                        <strong>${itemName}</strong>
                    </td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${quantity}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${price.toLocaleString('fr-FR')} Ar</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;"><strong>${total.toLocaleString('fr-FR')} Ar</strong></td>
                </tr>
            `;
        }).join('');
    }

    const orderDate = order.createdAt 
        ? new Date(order.createdAt).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
        : new Date().toLocaleDateString('fr-FR');

    const boutiqueName = (order.boutique && (order.boutique.name || 'Boutique')) || 'Boutique';
    const fulfillmentType = order.fulfillmentType === 'pickup' ? 'Retrait en boutique' : 'Livraison';
    
    let shippingAddressText = 'Retrait en boutique';
    if (order.fulfillmentType === 'delivery' && order.shippingAddress) {
        const parts = [];
        if (order.shippingAddress.street) parts.push(order.shippingAddress.street);
        if (order.shippingAddress.landmark) parts.push(order.shippingAddress.landmark);
        if (order.shippingAddress.city) parts.push(order.shippingAddress.city);
        shippingAddressText = parts.length > 0 ? parts.join(', ') : 'Adresse de livraison';
    }

    const html = await loadTemplate('order-confirmation', {
        firstName: user.firstName || 'Client',
        orderNumber: order._id ? order._id.toString().substring(0, 8).toUpperCase() : 'N/A',
        orderDate,
        boutiqueName,
        itemsList: itemsListHtml,
        subtotal: (order.totalAmount || 0).toLocaleString('fr-FR'),
        tax: ((order.totalAmount || 0) * 0.2).toLocaleString('fr-FR'),
        total: ((order.totalAmount || 0) * 1.2).toLocaleString('fr-FR'),
        fulfillmentType,
        shippingAddress: shippingAddressText,
        orderUrl: `${process.env.APP_BASE_URL || 'http://localhost:4200'}/account/orders/${order._id || ''}`,
        appUrl: process.env.APP_BASE_URL || 'http://localhost:4200'
    });

    return await sendEmail({
        to: user.email,
        subject: `Confirmation de commande #${order._id ? order._id.toString().substring(0, 8).toUpperCase() : 'N/A'}`,
        html
    });
};

// Email de notification de changement de statut de commande
const sendOrderStatusUpdateEmail = async (order, user, oldStatus, newStatus) => {
    const statusLabels = {
        pending: 'En attente',
        processing: 'En cours de traitement',
        shipped: 'Expédiée',
        delivered: 'Livrée',
        cancelled: 'Annulée'
    };

    // Message personnalisé selon le nouveau statut
    let statusMessage = '';
    let statusClass = 'status-pending';
    switch (newStatus) {
        case 'processing':
            statusMessage = 'Votre commande est maintenant en cours de préparation. Nous vous tiendrons informé de son avancement.';
            statusClass = 'status-processing';
            break;
        case 'shipped':
            statusMessage = 'Votre commande a été expédiée ! Elle devrait vous parvenir sous peu.';
            statusClass = 'status-shipped';
            break;
        case 'delivered':
            statusMessage = '🎉 Excellente nouvelle ! Votre commande a été livrée. Nous espérons que vous serez satisfait de votre achat.';
            statusClass = 'status-delivered';
            break;
        case 'cancelled':
            statusMessage = 'Votre commande a été annulée. Si vous avez des questions, n\'hésitez pas à nous contacter.';
            statusClass = 'status-cancelled';
            break;
        default:
            statusMessage = 'Le statut de votre commande a été mis à jour.';
    }

    const html = await loadTemplate('order-status-update', {
        firstName: user.firstName || 'Client',
        orderNumber: order._id ? order._id.toString().substring(0, 8).toUpperCase() : 'N/A',
        oldStatus: statusLabels[oldStatus] || oldStatus,
        newStatus: statusLabels[newStatus] || newStatus,
        statusClass,
        statusMessage,
        orderDate: order.createdAt 
            ? new Date(order.createdAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            })
            : new Date().toLocaleDateString('fr-FR'),
        total: ((order.totalAmount || 0) * 1.2).toLocaleString('fr-FR'),
        orderUrl: `${process.env.APP_BASE_URL || 'http://localhost:4200'}/account/orders/${order._id || ''}`,
        appUrl: process.env.APP_BASE_URL || 'http://localhost:4200'
    });

    return await sendEmail({
        to: user.email,
        subject: `Mise à jour de votre commande #${order._id ? order._id.toString().substring(0, 8).toUpperCase() : 'N/A'}`,
        html
    });
};

// Email de réinitialisation de mot de passe
const sendPasswordResetEmail = async (user, resetToken) => {
    const resetUrl = `${process.env.APP_BASE_URL || 'http://localhost:4200'}/reset-password?token=${resetToken}`;

    const html = await loadTemplate('password-reset', {
        firstName: user.firstName,
        resetUrl,
        expiresIn: '1 heure',
        appUrl: process.env.APP_BASE_URL || 'http://localhost:4200'
    });

    return await sendEmail({
        to: user.email,
        subject: 'Réinitialisation de votre mot de passe',
        html
    });
};

module.exports = {
    sendEmail,
    sendWelcomeEmail,
    sendOrderConfirmationEmail,
    sendOrderStatusUpdateEmail,
    sendPasswordResetEmail
};

