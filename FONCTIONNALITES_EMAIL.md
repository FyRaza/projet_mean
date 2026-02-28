# 📧 Fonctionnalités Utilisant l'Email dans le Projet

## ✅ Fonctionnalités Implémentées

Le projet utilise actuellement **4 types d'emails transactionnels** pour communiquer avec les utilisateurs :

---

## 1. 📬 Email de Bienvenue (Confirmation d'Inscription)

### **Quand est-il envoyé ?**
- ✅ Lors de l'inscription classique (`POST /api/auth/register`)
- ✅ Lors de la première connexion avec Google (`POST /api/auth/google`) - si c'est une nouvelle inscription

### **Contenu de l'email**
- Message de bienvenue personnalisé avec le prénom de l'utilisateur
- Informations sur le rôle (Acheteur, Propriétaire de boutique, Administrateur)
- Lien vers l'application

### **Fichier concerné**
- **Template** : `backend/src/templates/emails/welcome.html`
- **Service** : `backend/src/services/email.service.js` → `sendWelcomeEmail()`
- **Controller** : `backend/src/controllers/auth.controller.js` → `register()` et `googleAuth()`

### **Exemple de déclenchement**
```javascript
// Lors de l'inscription
POST /api/auth/register
{
  "firstName": "Jean",
  "lastName": "Dupont",
  "email": "jean.dupont@example.com",
  "password": "motdepasse123"
}
// → Email de bienvenue envoyé automatiquement
```

---

## 2. 🛒 Email de Confirmation de Commande

### **Quand est-il envoyé ?**
- ✅ Immédiatement après la création d'une commande (`POST /api/orders`)

### **Contenu de l'email**
- Numéro de commande
- Date de la commande
- Liste détaillée des produits commandés (nom, quantité, prix unitaire, total)
- Nom de la boutique
- Sous-total, taxes, total
- Type de livraison (Retrait en boutique ou Livraison)
- Adresse de livraison (si applicable)
- Lien vers les détails de la commande

### **Fichier concerné**
- **Template** : `backend/src/templates/emails/order-confirmation.html`
- **Service** : `backend/src/services/email.service.js` → `sendOrderConfirmationEmail()`
- **Controller** : `backend/src/controllers/order.controller.js` → `createOrder()`

### **Exemple de déclenchement**
```javascript
// Lors de la création d'une commande
POST /api/orders
{
  "items": [
    { "product": "product_id_1", "quantity": 2 },
    { "product": "product_id_2", "quantity": 1 }
  ],
  "boutiqueId": "boutique_id",
  "fulfillmentType": "delivery",
  "shippingAddress": { ... }
}
// → Email de confirmation envoyé automatiquement
```

---

## 3. 🔔 Email de Notification de Changement de Statut de Commande

### **Quand est-il envoyé ?**
- ✅ Lorsqu'un admin ou un propriétaire de boutique change le statut d'une commande (`PUT /api/orders/:id/status`)

### **Statuts possibles**
- `pending` → `processing` : "Votre commande est maintenant en cours de préparation"
- `processing` → `shipped` : "Votre commande a été expédiée !"
- `shipped` → `delivered` : "🎉 Excellente nouvelle ! Votre commande a été livrée"
- `*` → `cancelled` : "Votre commande a été annulée"

### **Contenu de l'email**
- Numéro de commande
- Ancien statut et nouveau statut
- Message personnalisé selon le nouveau statut
- Date de la commande
- Montant total
- Lien vers les détails de la commande

### **Fichier concerné**
- **Template** : `backend/src/templates/emails/order-status-update.html`
- **Service** : `backend/src/services/email.service.js` → `sendOrderStatusUpdateEmail()`
- **Controller** : `backend/src/controllers/order.controller.js` → `updateOrderStatus()`

### **Exemple de déclenchement**
```javascript
// Lors du changement de statut
PUT /api/orders/order_id/status
{
  "status": "shipped"
}
// → Email de notification envoyé automatiquement
```

---

## 4. 🔐 Email de Réinitialisation de Mot de Passe

### **Quand est-il envoyé ?**
- ✅ Lorsqu'un utilisateur demande la réinitialisation de son mot de passe (`POST /api/auth/forgot-password`)

### **Contenu de l'email**
- Message personnalisé avec le prénom
- Lien sécurisé de réinitialisation (valide 1 heure)
- Instructions pour réinitialiser le mot de passe
- Avertissement de sécurité si ce n'est pas vous qui avez fait la demande

### **Fichier concerné**
- **Template** : `backend/src/templates/emails/password-reset.html`
- **Service** : `backend/src/services/email.service.js` → `sendPasswordResetEmail()`
- **Controller** : `backend/src/controllers/auth.controller.js` → `forgotPassword()`

### **Exemple de déclenchement**
```javascript
// Lors de la demande de réinitialisation
POST /api/auth/forgot-password
{
  "email": "jean.dupont@example.com"
}
// → Email avec lien de réinitialisation envoyé automatiquement
```

---

## 📊 Résumé des Routes API Concernées

| Route | Méthode | Email Envoyé | Destinataire |
|-------|---------|--------------|--------------|
| `/api/auth/register` | POST | Bienvenue | Nouvel utilisateur |
| `/api/auth/google` | POST | Bienvenue | Nouvel utilisateur (si première connexion) |
| `/api/auth/forgot-password` | POST | Réinitialisation | Utilisateur demandeur |
| `/api/orders` | POST | Confirmation commande | Client qui a commandé |
| `/api/orders/:id/status` | PUT | Notification statut | Client propriétaire de la commande |

---

## 🔧 Configuration SMTP

Tous les emails sont envoyés via **NodeMailer** avec la configuration SMTP suivante :

- **Host** : `smtp.gmail.com`
- **Port** : `587`
- **User** : `finaritra.razakanary@gmail.com`
- **From Name** : `Centre Commercial`
- **From Email** : `finaritra.razakanary@gmail.com`

Configuration dans : `backend/.env`

---

## 📝 Templates HTML Disponibles

Tous les templates sont dans : `backend/src/templates/emails/`

1. ✅ `welcome.html` - Email de bienvenue
2. ✅ `order-confirmation.html` - Confirmation de commande
3. ✅ `order-status-update.html` - Notification de changement de statut
4. ✅ `password-reset.html` - Réinitialisation de mot de passe

---

## 🎯 Fonctionnalités Email Actuelles

### ✅ Implémentées et Fonctionnelles

1. ✅ **Confirmation d'inscription** - Envoyé automatiquement lors de l'inscription
2. ✅ **Confirmation de commande** - Envoyé avec récapitulatif complet
3. ✅ **Notification de changement de statut** - Envoyé à chaque changement
4. ✅ **Réinitialisation de mot de passe** - Envoyé avec lien sécurisé

### 💡 Fonctionnalités Email Potentielles (Non Implémentées)

Voici des suggestions d'emails supplémentaires qui pourraient être utiles :

1. **Email de confirmation de changement d'email**
   - Lorsqu'un utilisateur change son adresse email

2. **Email de notification de stock faible**
   - Pour les propriétaires de boutique quand un produit est en rupture de stock

3. **Email de rappel de panier abandonné**
   - Pour inciter les clients à finaliser leur commande

4. **Email de facture**
   - Envoi de la facture après paiement

5. **Email de notification boutique**
   - Notification aux propriétaires de boutique lors d'une nouvelle commande

6. **Email de newsletter**
   - Pour les promotions et nouveautés

7. **Email de confirmation de paiement**
   - Confirmation après un paiement réussi

8. **Email de notification d'expédition**
   - Avec numéro de suivi (si applicable)

---

## 🧪 Comment Tester les Emails

### 1. Tester l'Email de Bienvenue
```bash
# Créer un nouveau compte
POST http://localhost:5000/api/auth/register
{
  "firstName": "Test",
  "lastName": "User",
  "email": "test@example.com",
  "password": "password123"
}
```

### 2. Tester l'Email de Confirmation de Commande
```bash
# Créer une commande (nécessite d'être connecté)
POST http://localhost:5000/api/orders
# (avec token d'authentification)
```

### 3. Tester l'Email de Changement de Statut
```bash
# Changer le statut d'une commande (nécessite d'être admin ou propriétaire)
PUT http://localhost:5000/api/orders/ORDER_ID/status
{
  "status": "shipped"
}
```

### 4. Tester l'Email de Réinitialisation
```bash
# Demander la réinitialisation
POST http://localhost:5000/api/auth/forgot-password
{
  "email": "test@example.com"
}
```

---

## 📈 Statistiques et Logs

Tous les envois d'emails sont loggés dans la console :
- ✅ Succès : `✅ Email sent to email@example.com: messageId`
- ❌ Erreur : `❌ Error sending email: error message`

Les emails sont envoyés de manière **asynchrone** et ne bloquent pas les réponses API si l'envoi échoue.

---

## 🔒 Sécurité

- Les emails de réinitialisation de mot de passe contiennent un token valide **1 heure**
- Les tokens sont stockés de manière sécurisée dans la base de données
- Les emails sont envoyés uniquement aux adresses email vérifiées

---

**Date de mise à jour** : 28 Février 2026
**Status** : ✅ Toutes les fonctionnalités email sont opérationnelles

