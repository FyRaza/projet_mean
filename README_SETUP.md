# 🏬 Projet MEAN - IAVOKO Centre Commercial

## 📋 Description
Système complet de gestion pour IAVOKO Centre Commercial développé avec la stack MEAN (MongoDB, Express.js, Angular, Node.js).

## 🛠️ Technologies Utilisées

### Backend
- **Node.js** + **Express.js** - Serveur API REST
- **MongoDB** + **Mongoose** - Base de données NoSQL
- **JWT** - Authentification sécurisée
- **Bcrypt** - Hachage des mots de passe
- **Multer** - Gestion upload d'images

### Frontend
- **Angular 21** - Framework frontend
- **TailwindCSS** - Framework CSS
- **RxJS** - Programmation réactive
- **Angular Router** - Navigation

## 📁 Structure du Projet

```
projet_mean/
├── backend/              # API Node.js/Express
│   ├── src/
│   │   ├── controllers/  # Logique métier
│   │   ├── models/       # Schémas Mongoose
│   │   ├── routes/       # Routes API
│   │   ├── middleware/   # Middleware (auth, etc.)
│   │   ├── config/       # Configuration DB
│   │   ├── app.js        # Configuration Express
│   │   └── server.js     # Point d'entrée
│   ├── .env              # Variables d'environnement
│   └── package.json
│
├── src/                  # Application Angular
│   ├── app/
│   │   ├── core/         # Models, Guards
│   │   ├── shared/       # Services, Components partagés
│   │   └── pages/        # Pages de l'application
│   └── ...
└── package.json
```

## 🚀 Installation et Démarrage

### Prérequis
- **Node.js** v20.19+ ou v22.8+
- **npm** v10.8+
- **MongoDB** v7+ (en cours d'installation automatique)
- **Angular CLI** v21+

### 1. Installation des dépendances

#### Frontend
```bash
cd projet_mean
npm install
```

#### Backend
```bash
cd backend
npm install
```

### 2. Configuration de la Base de Données

**MongoDB** est en cours d'installation automatique via `winget`.

Une fois l'installation terminée :
```bash
# Démarrer MongoDB (Windows)
net start MongoDB

# OU manuellement
mongod
```

### 3. Configuration Backend

Le fichier `.env` est déjà configuré avec :
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/mall_manage_db
JWT_SECRET=supersecretkey_change_me_in_production
```

⚠️ **Important** : Changez `JWT_SECRET` en production !

### 4. Lancer l'Application

#### Terminal 1 - Backend
```bash
cd backend
npm run dev
```
Le serveur démarre sur `http://localhost:5000`

#### Terminal 2 - Frontend
```bash
cd ..
ng serve
# OU
npm start
```
L'application démarre sur `http://localhost:4200`

## 🔐 Comptes de Test

Pour tester l'authentification avec le backend (une fois MongoDB démarré) :

| Rôle | Email | Mot de passe | Accès |
|------|-------|--------------|-------|
| Admin | `admin@mall.mg` | `Admin1234!` | Dashboard Admin |
| Boutique | `boutique1@mall.mg` | `Boutique1234!` | Gestion Boutique + Caisse POS |
| Client | `client1@mall.mg` | `Client1234!` | Interface Client |

> 💡 **Note** : Pour générer les données de démonstration complètes, exécutez :
> ```bash
> docker exec mall-backend npm run seed:demo
> ```
> Cela créera 16 utilisateurs, 8 boutiques, 48 produits, 30 commandes en ligne et 50 ventes POS.

## 📡 API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Profil utilisateur (protégé)

### Boutiques
- `GET /api/boutiques` - Liste toutes les boutiques
- `GET /api/boutiques/:id` - Détails d'une boutique
- `POST /api/boutiques` - Créer une boutique (protégé)
- `PUT /api/boutiques/:id` - Modifier (protégé)
- `DELETE /api/boutiques/:id` - Supprimer (admin)

### Produits
- `GET /api/products` - Liste des produits (pagination)
- `GET /api/products/:id` - Détails produit
- `POST /api/products` - Créer un produit (protégé)
- `DELETE /api/products/:id` - Supprimer (protégé)

## 🎯 Fonctionnalités Actuelles

### ✅ Implémenté
- Architecture backend complète (Express + MongoDB)
- Authentification JWT avec 3 rôles (admin, boutique, acheteur)
- CRUD Boutiques
- CRUD Produits avec pagination
- Middleware de protection des routes
- Connexion Frontend-Backend via HttpClient
- Interface Angular moderne avec TailwindCSS

### 🚧 En Développement
- Gestion des emplacements (Box)
- Système de commandes
- Upload d'images produits
- Gestion du panier
- Statistiques et Dashboard analytics
- Filtres avancés produits (prix, catégorie)

## 🐛 Dépannage

### MongoDB ne démarre pas
```bash
# Vérifier l'installation
mongod --version

# Si non installé, installer manuellement
winget install MongoDB.Server
```

### Le frontend ne compile pas
```bash
# Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install
```

### Erreur de connexion Backend-Frontend
- Vérifier que le backend tourne sur le port 5000
- Vérifier CORS activé dans `backend/src/app.js`
- Vérifier l'URL dans les services Angular (`http://localhost:5000`)

## 📝 Notes Importantes

1. **TypeScript Strict Mode** est activé - Tous les types doivent être définis
2. **CORS** est configuré pour accepter toutes les origines en développement
3. Les **mots de passe** sont hachés avec bcrypt (10 rounds)
4. Les **tokens JWT** expirent après 30 jours

## 🔜 Prochaines Étapes

1. Terminer l'installation de MongoDB
2. Ajouter des données de test (seed)
3. Implémenter le système de commandes
4. Ajouter l'upload d'images avec Multer
5. Créer les statistiques admin
6. Déploiement (Heroku/Vercel + MongoDB Atlas)

## 👨‍💻 Développement

### Scripts disponibles

#### Frontend
- `npm start` - Démarre le serveur de dev
- `npm run build` - Build de production
- `npm test` - Lance les tests

#### Backend  
- `npm run dev` - Démarre avec nodemon (auto-reload)
- `npm start` - Démarre en production

## 📧 Support

Pour toute question, créez une issue sur le repository Git.
