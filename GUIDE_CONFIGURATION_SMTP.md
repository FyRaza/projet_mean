# 📧 Guide de Configuration SMTP

Ce guide vous explique comment configurer SMTP pour envoyer des emails transactionnels depuis votre application.

---

## 🚀 Méthode 1 : Configuration avec fichier `.env` (Recommandé pour développement)

### Étape 1 : Créer le fichier `.env`

Dans le dossier `backend/`, créez un fichier `.env` à partir de `.env.example` :

```bash
cd backend
cp .env.example .env
```

### Étape 2 : Configurer selon votre fournisseur

Ouvrez le fichier `.env` et remplissez les valeurs selon votre fournisseur SMTP (voir exemples ci-dessous).

---

## 📮 Configuration Gmail (Gratuit, Recommandé pour débuter)

### Avantages
- ✅ Gratuit
- ✅ Facile à configurer
- ✅ Fiable

### Inconvénients
- ⚠️ Limite de 500 emails/jour
- ⚠️ Nécessite un "App Password"

### Configuration

1. **Activez l'authentification à deux facteurs** sur votre compte Gmail :
   - Allez sur [myaccount.google.com](https://myaccount.google.com)
   - Sécurité → Authentification à deux facteurs → Activer

2. **Générez un "App Password"** :
   - Allez sur [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   - Sélectionnez "Autre (nom personnalisé)" → Tapez "Centre Commercial"
   - Cliquez sur "Générer"
   - **Copiez le mot de passe généré** (16 caractères sans espaces)

3. **Configurez votre `.env`** :

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx  # Le App Password généré (sans espaces)
SMTP_FROM_EMAIL=votre-email@gmail.com
SMTP_FROM_NAME=Centre Commercial
APP_BASE_URL=http://localhost:4200
APP_NAME=Centre Commercial
```

### ⚠️ Important
- Utilisez **un App Password**, pas votre mot de passe Gmail normal
- Si vous avez des espaces dans le App Password, supprimez-les

---

## 📮 Configuration Outlook / Hotmail

### Configuration

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-email@outlook.com
SMTP_PASS=votre-mot-de-passe-outlook
SMTP_FROM_EMAIL=votre-email@outlook.com
SMTP_FROM_NAME=Centre Commercial
```

---

## 📮 Configuration SendGrid (Recommandé pour production)

### Avantages
- ✅ 100 emails/jour gratuits
- ✅ Idéal pour la production
- ✅ Analytics et tracking

### Configuration

1. **Créez un compte** sur [sendgrid.com](https://sendgrid.com)

2. **Générez une API Key** :
   - Dashboard → Settings → API Keys
   - Create API Key → Donnez un nom (ex: "Centre Commercial")
   - Permissions : "Full Access" ou "Mail Send"
   - **Copiez la clé API** (affichée une seule fois !)

3. **Configurez votre `.env`** :

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=votre-api-key-sendgrid  # La clé API générée
SMTP_FROM_EMAIL=noreply@votre-domaine.com
SMTP_FROM_NAME=Centre Commercial
```

---

## 📮 Configuration Mailtrap (Pour tests en développement)

### Avantages
- ✅ Gratuit pour les tests
- ✅ Capture tous les emails sans les envoyer
- ✅ Parfait pour le développement

### Configuration

1. **Créez un compte** sur [mailtrap.io](https://mailtrap.io)

2. **Récupérez vos credentials** :
   - Inbox → SMTP Settings → Node.js - Nodemailer
   - Copiez les valeurs

3. **Configurez votre `.env`** :

```env
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=votre-username-mailtrap
SMTP_PASS=votre-password-mailtrap
SMTP_FROM_EMAIL=test@mailtrap.io
SMTP_FROM_NAME=Centre Commercial
```

---

## 🐳 Méthode 2 : Configuration avec Docker Compose

Si vous utilisez Docker, ajoutez les variables SMTP dans `docker-compose.yml` :

```yaml
backend:
  build:
    context: ./backend
    dockerfile: Dockerfile
  container_name: mall-backend
  restart: unless-stopped
  environment:
    NODE_ENV: production
    PORT: 5000
    MONGO_URI: mongodb://mongo:27017/mall_manage_db
    JWT_SECRET: ${JWT_SECRET:-replace_with_a_strong_secret}
    
    # Configuration SMTP
    SMTP_HOST: ${SMTP_HOST}
    SMTP_PORT: ${SMTP_PORT:-587}
    SMTP_SECURE: ${SMTP_SECURE:-false}
    SMTP_USER: ${SMTP_USER}
    SMTP_PASS: ${SMTP_PASS}
    SMTP_FROM_EMAIL: ${SMTP_FROM_EMAIL:-${SMTP_USER}}
    SMTP_FROM_NAME: ${SMTP_FROM_NAME:-Centre Commercial}
    APP_BASE_URL: ${APP_BASE_URL:-http://localhost:4200}
    APP_NAME: ${APP_NAME:-Centre Commercial}
```

Puis créez un fichier `.env` à la racine du projet avec vos valeurs.

---

## ✅ Vérification de la Configuration

### Test 1 : Vérifier que les variables sont chargées

Démarrez votre serveur backend et vérifiez les logs :

```bash
cd backend
npm run dev
```

Si SMTP n'est pas configuré, vous verrez :
```
⚠️  SMTP not configured. Email not sent.
```

Si SMTP est configuré, vous verrez lors d'un envoi :
```
✅ Email sent to user@example.com: <message-id>
```

### Test 2 : Tester l'envoi d'email

1. **Inscrivez un nouvel utilisateur** via l'API ou le frontend
2. **Vérifiez votre boîte email** (ou Mailtrap inbox si vous utilisez Mailtrap)
3. Vous devriez recevoir l'email de bienvenue

### Test 3 : Tester la réinitialisation de mot de passe

1. Appelez `POST /api/auth/forgot-password` avec un email valide
2. Vérifiez que l'email de réinitialisation est reçu
3. Cliquez sur le lien et testez la réinitialisation

---

## 🔧 Dépannage

### Problème : "Error: Invalid login"

**Solutions** :
- Vérifiez que `SMTP_USER` et `SMTP_PASS` sont corrects
- Pour Gmail, utilisez un **App Password**, pas votre mot de passe normal
- Vérifiez que l'authentification à deux facteurs est activée (Gmail)

### Problème : "Connection timeout"

**Solutions** :
- Vérifiez que `SMTP_HOST` et `SMTP_PORT` sont corrects
- Vérifiez votre connexion internet
- Vérifiez que votre firewall n'bloque pas le port SMTP

### Problème : "Certificate error"

**Solutions** :
- Vérifiez que `SMTP_SECURE` correspond au port utilisé
- Port 587 → `SMTP_SECURE=false` (TLS)
- Port 465 → `SMTP_SECURE=true` (SSL)

### Problème : Les emails ne partent pas mais pas d'erreur

**Solutions** :
- Vérifiez les logs du serveur backend
- En développement, si SMTP n'est pas configuré, les emails sont loggés en console
- Vérifiez votre dossier spam/courrier indésirable

---

## 📝 Exemple de fichier `.env` complet

```env
# SMTP Configuration (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=moncentrecommercial@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
SMTP_FROM_EMAIL=moncentrecommercial@gmail.com
SMTP_FROM_NAME=Centre Commercial

# Application
APP_BASE_URL=http://localhost:4200
APP_NAME=Centre Commercial

# Database
MONGO_URI=mongodb://localhost:27017/mall_manage_db

# Security
JWT_SECRET=mon_secret_jwt_tres_securise_123456
CORS_ORIGIN=http://localhost:4200

# Environment
NODE_ENV=development
PORT=5000
SWAGGER_ENABLED=true
```

---

## 🔒 Sécurité

### ⚠️ Important

1. **Ne commitez JAMAIS votre fichier `.env`** dans Git
2. Le fichier `.env` est déjà dans `.gitignore` (vérifiez-le)
3. En production, utilisez des variables d'environnement sécurisées
4. Ne partagez jamais vos credentials SMTP

### Pour la production

- Utilisez un service SMTP professionnel (SendGrid, AWS SES, Mailgun)
- Configurez les variables d'environnement directement sur votre serveur/hébergeur
- Activez les logs d'audit pour tracer les envois d'emails

---

## 📚 Ressources

- [Documentation NodeMailer](https://nodemailer.com/about/)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [SendGrid Documentation](https://docs.sendgrid.com/)
- [Mailtrap Documentation](https://mailtrap.io/docs/)

---

**Besoin d'aide ?** Vérifiez les logs du serveur backend pour plus de détails sur les erreurs SMTP.

