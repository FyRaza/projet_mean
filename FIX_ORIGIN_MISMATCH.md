# 🔧 Correction de l'Erreur "origin_mismatch" Google OAuth

## ❌ Erreur Rencontrée

```
Erreur 400 : origin_mismatch
Accès bloqué : erreur d'autorisation
Vous ne pouvez pas vous connecter à cette appli, car elle ne respecte pas le règlement OAuth 2.0 de Google.
```

## 🔍 Cause du Problème

L'origine JavaScript `http://localhost` n'est pas enregistrée dans Google Cloud Console. Google OAuth exige que toutes les origines depuis lesquelles vous faites des requêtes soient explicitement autorisées.

## ✅ Solution : Ajouter l'Origine dans Google Cloud Console

### Étape 1 : Accéder à Google Cloud Console

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Sélectionnez votre projet
3. Allez dans **APIs & Services** > **Credentials**
4. Cliquez sur votre **OAuth 2.0 Client ID** (celui avec l'ID: `84325736611-egnic0g66qi55rejqcelkgp0bcaie2st`)

### Étape 2 : Ajouter les Origines JavaScript Autorisées

Dans la section **"Authorized JavaScript origins"**, vous devez ajouter :

```
http://localhost
http://localhost:80
http://127.0.0.1
http://127.0.0.1:80
```

**Important** :
- ✅ Utilisez `http://` (pas `https://`) pour le développement local
- ✅ N'ajoutez **PAS** de slash à la fin (`http://localhost` et non `http://localhost/`)
- ✅ Ajoutez les deux variantes (`localhost` et `127.0.0.1`) pour être sûr

### Étape 3 : Vérifier les URI de Redirection (si nécessaire)

Pour l'authentification Google avec ID Token (ce que nous utilisons), vous n'avez généralement **pas besoin** de configurer les "Authorized redirect URIs". Mais si vous en avez besoin, ajoutez :

```
http://localhost
http://localhost:80
```

### Étape 4 : Sauvegarder

1. Cliquez sur **"SAVE"** en bas de la page
2. Attendez quelques secondes pour que les changements soient propagés (généralement immédiat, mais peut prendre jusqu'à 5 minutes)

## 🧪 Tester Après la Configuration

1. **Videz le cache du navigateur** :
   - Appuyez sur `Ctrl + Shift + Delete`
   - Cochez "Images et fichiers en cache"
   - Cliquez sur "Effacer les données"

2. **Rechargez la page** :
   - Allez sur `http://localhost/signin`
   - Appuyez sur `Ctrl + F5` pour forcer le rechargement

3. **Testez à nouveau** :
   - Cliquez sur le bouton "Se connecter avec Google"
   - L'erreur `origin_mismatch` ne devrait plus apparaître

## 📝 Capture d'Écran de Référence

Dans Google Cloud Console, la section devrait ressembler à ceci :

```
Authorized JavaScript origins
┌─────────────────────────────────────┐
│ http://localhost                    │
│ http://localhost:80                 │
│ http://127.0.0.1                    │
│ http://127.0.0.1:80                 │
└─────────────────────────────────────┘
```

## ⚠️ Points Importants

### Pour le Développement Local
- ✅ Utilisez `http://localhost` (sans port si sur le port 80)
- ✅ Utilisez `http://localhost:4200` si vous testez avec `ng serve`
- ✅ Utilisez `http://localhost:3000` si vous testez sur un autre port

### Pour la Production
Quand vous déployez en production, vous devrez ajouter votre domaine de production :
- `https://votre-domaine.com`
- `https://www.votre-domaine.com`

**Important** : En production, utilisez **`https://`** (pas `http://`)

## 🔍 Vérification

Pour vérifier que la configuration est correcte :

1. **Dans Google Cloud Console** :
   - Vérifiez que `http://localhost` est bien dans la liste
   - Vérifiez qu'il n'y a pas de slash à la fin
   - Vérifiez qu'il n'y a pas d'espace

2. **Dans votre navigateur** :
   - Ouvrez la console (F12)
   - Allez dans l'onglet "Network"
   - Cliquez sur le bouton Google
   - Vérifiez que la requête vers Google utilise bien `http://localhost` comme origine

## 🐛 Si le Problème Persiste

### 1. Vérifier le Client ID
Assurez-vous que le Client ID dans votre code correspond à celui dans Google Cloud Console :
- Code : `84325736611-egnic0g66qi55rejqcelkgp0bcaie2st.apps.googleusercontent.com`
- Console : Vérifiez que c'est le même

### 2. Vérifier l'URL Actuelle
Dans la console du navigateur, vérifiez quelle URL est utilisée :
```javascript
console.log(window.location.origin);
// Devrait afficher: http://localhost
```

### 3. Attendre la Propagation
Les changements dans Google Cloud Console peuvent prendre quelques minutes à se propager. Attendez 2-5 minutes et réessayez.

### 4. Vérifier les Erreurs dans la Console
Ouvrez la console (F12) et recherchez les erreurs. Vous devriez voir quelque chose comme :
```
Google Sign-In Button: AfterViewInit, Client ID: 84325736611-...
```

## 📚 Documentation Officielle

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow)
- [Authorized JavaScript Origins](https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow#redirect-uri-loopback)

## ✅ Checklist

- [ ] Ajouté `http://localhost` dans Authorized JavaScript origins
- [ ] Ajouté `http://localhost:80` dans Authorized JavaScript origins
- [ ] Ajouté `http://127.0.0.1` dans Authorized JavaScript origins (optionnel mais recommandé)
- [ ] Cliqué sur "SAVE" dans Google Cloud Console
- [ ] Vidé le cache du navigateur
- [ ] Rechargé la page avec Ctrl+F5
- [ ] Testé à nouveau le bouton Google

Une fois ces étapes complétées, l'erreur `origin_mismatch` devrait être résolue ! 🎉

