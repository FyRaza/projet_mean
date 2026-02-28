# ✅ Test de l'Authentification Google

## Configuration terminée ✅

Tous les fichiers ont été configurés :
- ✅ Script Google ajouté dans `index.html`
- ✅ Service Google Auth créé
- ✅ Composant bouton Google Sign-In créé
- ✅ Intégré dans le formulaire de connexion
- ✅ Client ID configuré dans `environment.ts`

## 🚀 Comment tester

### 1. Démarrer le backend

```bash
cd backend
npm run dev
```

Le serveur doit démarrer sur `http://localhost:5000`

### 2. Démarrer le frontend

```bash
npm start
# ou
ng serve
```

Le frontend doit démarrer sur `http://localhost:4200`

### 3. Tester l'authentification Google

1. Allez sur `http://localhost:4200/signin`
2. Vous devriez voir le bouton **"Se connecter avec Google"** au-dessus du formulaire
3. Cliquez sur le bouton Google
4. Sélectionnez un compte Google
5. Autorisez l'application
6. Vous devriez être automatiquement connecté et redirigé selon votre rôle

## 🔍 Vérifications

### Si le bouton ne s'affiche pas :

1. **Vérifiez la console du navigateur** (F12)
   - Recherchez les erreurs liées à Google
   - Vérifiez que le script Google est chargé

2. **Vérifiez le Client ID** :
   - Ouvrez `src/environments/environment.ts`
   - Vérifiez que `googleClientId` est rempli

3. **Vérifiez Google Cloud Console** :
   - Les **Authorized JavaScript origins** doivent inclure `http://localhost:4200`
   - Les **Authorized redirect URIs** doivent inclure `http://localhost:4200`

### Si l'authentification échoue :

1. **Vérifiez les logs du backend** :
   - Regardez la console du serveur backend
   - Recherchez les erreurs liées à Google OAuth

2. **Vérifiez le Client ID dans `.env`** :
   ```bash
   cd backend
   # Vérifiez que GOOGLE_CLIENT_ID est présent dans .env
   ```

3. **Vérifiez que le Client ID correspond** :
   - Le Client ID dans `backend/.env` doit être le même que celui dans `src/environments/environment.ts`
   - Le Client ID dans Google Cloud Console doit correspondre

## 📝 Comportement attendu

### Nouvel utilisateur Google :
1. Clique sur "Se connecter avec Google"
2. Sélectionne un compte Google
3. Un compte est automatiquement créé avec :
   - Email : email du compte Google
   - Prénom/Nom : depuis le profil Google
   - Rôle : `acheteur` par défaut
   - `authProvider` : `google`
4. Email de bienvenue envoyé
5. Redirection vers la page d'accueil

### Utilisateur existant :
1. Clique sur "Se connecter avec Google"
2. Sélectionne un compte Google
3. Si l'email correspond à un compte existant :
   - Connexion automatique
   - Le `googleId` est mis à jour si absent
4. Redirection selon le rôle

## 🐛 Dépannage

### Erreur : "Configuration Google manquante"
- Vérifiez que `googleClientId` est rempli dans `environment.ts`

### Erreur : "Invalid Google token"
- Vérifiez que le Client ID dans `.env` backend correspond à celui dans `environment.ts`
- Vérifiez que le Client ID est correct dans Google Cloud Console

### Erreur : "Redirect URI mismatch"
- Dans Google Cloud Console, ajoutez `http://localhost:4200` dans **Authorized JavaScript origins**
- Ajoutez `http://localhost:4200` dans **Authorized redirect URIs**

### Le bouton ne s'affiche pas
- Attendez quelques secondes (le script Google peut prendre du temps à charger)
- Vérifiez la console du navigateur pour les erreurs
- Vérifiez que le script est bien dans `index.html`

## ✅ Checklist de test

- [ ] Le bouton Google s'affiche sur la page de connexion
- [ ] Le clic sur le bouton ouvre la popup Google
- [ ] La sélection d'un compte Google fonctionne
- [ ] L'autorisation fonctionne
- [ ] La connexion réussit
- [ ] La redirection fonctionne selon le rôle
- [ ] L'utilisateur est bien connecté (vérifier dans le header/navbar)
- [ ] Un nouvel utilisateur reçoit l'email de bienvenue

## 🎉 C'est prêt !

Si tous les tests passent, l'authentification Google est opérationnelle !

