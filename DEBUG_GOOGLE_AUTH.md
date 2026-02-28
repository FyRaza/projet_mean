# 🔍 Guide de Débogage - Authentification Google

## ✅ Corrections apportées

1. ✅ **Composant Google amélioré** avec meilleure gestion du timing
2. ✅ **Bouton Google ajouté dans SignUp** (remplace le bouton statique)
3. ✅ **Logs de débogage ajoutés** pour identifier les problèmes
4. ✅ **Gestion des erreurs améliorée**

## 🔍 Vérifications à faire

### 1. Vérifier la console du navigateur

Ouvrez la console (F12) et recherchez ces messages :

**Messages attendus si tout fonctionne :**
```
Google Sign-In Button: AfterViewInit, Client ID: 84325736611-...
Google Sign-In Button: Waiting for Google script...
Google script loaded after X ms
Initializing Google Sign-In with Client ID: 84325736611-...
Rendering Google button...
Google Sign-In button rendered successfully
```

**Si vous voyez des erreurs :**
- `Configuration Google manquante` → Vérifiez `environment.ts`
- `Google Identity Services script not loaded` → Le script Google ne se charge pas
- `Button container not found` → Problème de rendu Angular

### 2. Vérifier que le script Google est chargé

Dans la console, tapez :
```javascript
window.google
```

**Résultat attendu :** Un objet avec `accounts` et `id`

**Si `undefined` :**
- Le script Google ne s'est pas chargé
- Vérifiez votre connexion internet
- Vérifiez que le script est bien dans `index.html`

### 3. Vérifier le Client ID

Dans la console, tapez :
```javascript
window.google?.accounts?.id
```

**Résultat attendu :** Un objet avec des méthodes comme `initialize` et `renderButton`

### 4. Vérifier visuellement

Le bouton Google devrait apparaître comme un rectangle avec :
- Logo Google coloré
- Texte "Se connecter avec Google" (en français)
- Style outline (bordure)

**Si le bouton n'apparaît pas :**
- Vérifiez la console pour les erreurs
- Attendez quelques secondes (le script peut prendre du temps à charger)
- Rechargez la page (Ctrl+F5 pour forcer le rechargement)

## 🐛 Problèmes courants et solutions

### Problème 1 : Le bouton ne s'affiche pas du tout

**Causes possibles :**
1. Script Google non chargé
2. Client ID incorrect
3. Problème de timing (script chargé avant le composant)

**Solutions :**
1. Vérifiez la console pour les erreurs
2. Vérifiez que `window.google` existe dans la console
3. Rechargez la page (Ctrl+F5)
4. Vérifiez que le Client ID dans `environment.ts` correspond à celui dans Google Cloud Console

### Problème 2 : "Configuration Google manquante"

**Solution :**
Vérifiez que `googleClientId` est rempli dans `src/environments/environment.ts` :
```typescript
googleClientId: '84325736611-egnic0g66qi55rejqcelkgp0bcaie2st.apps.googleusercontent.com'
```

### Problème 3 : "Erreur de chargement du service Google"

**Causes possibles :**
1. Pas de connexion internet
2. Bloqueur de publicités bloque le script
3. Problème avec le CDN Google

**Solutions :**
1. Vérifiez votre connexion internet
2. Désactivez temporairement les bloqueurs de publicités
3. Vérifiez que `https://accounts.google.com/gsi/client` est accessible

### Problème 4 : Le bouton s'affiche mais ne fonctionne pas au clic

**Causes possibles :**
1. Client ID incorrect dans Google Cloud Console
2. Authorized JavaScript origins non configuré
3. Problème avec le callback

**Solutions :**
1. Vérifiez que le Client ID dans `.env` backend correspond à celui dans `environment.ts`
2. Dans Google Cloud Console, vérifiez que `http://localhost:4200` est dans **Authorized JavaScript origins**
3. Vérifiez la console pour les erreurs lors du clic

## 🧪 Test manuel

### Test 1 : Vérifier le script Google

Ouvrez la console et exécutez :
```javascript
// Vérifier que Google est chargé
console.log('Google loaded:', !!window.google);
console.log('Google accounts:', !!window.google?.accounts);
console.log('Google accounts.id:', !!window.google?.accounts?.id);
```

Tous doivent retourner `true`.

### Test 2 : Initialiser manuellement

Dans la console :
```javascript
window.google.accounts.id.initialize({
  client_id: '84325736611-egnic0g66qi55rejqcelkgp0bcaie2st.apps.googleusercontent.com',
  callback: (response) => {
    console.log('Google response:', response);
  }
});
```

Si cela fonctionne, le problème vient du composant Angular.

### Test 3 : Vérifier le conteneur

Dans la console :
```javascript
const container = document.querySelector('.google-button-wrapper');
console.log('Container found:', !!container);
console.log('Container element:', container);
```

## 📝 Checklist de débogage

- [ ] Le script Google est dans `index.html`
- [ ] Le Client ID est dans `environment.ts`
- [ ] Le Client ID correspond à celui dans Google Cloud Console
- [ ] `http://localhost:4200` est dans Authorized JavaScript origins
- [ ] Le backend est démarré
- [ ] Aucune erreur dans la console du navigateur
- [ ] `window.google` existe dans la console
- [ ] Le composant Google est bien importé dans signin-form et signup-form

## 🚀 Test rapide

1. **Démarrez le backend :**
   ```bash
   cd backend
   npm run dev
   ```

2. **Démarrez le frontend :**
   ```bash
   npm start
   ```

3. **Ouvrez** `http://localhost:4200/signin`

4. **Ouvrez la console** (F12)

5. **Recherchez** les messages de débogage commençant par "Google Sign-In Button:"

6. **Vérifiez** que le bouton Google apparaît

## 💡 Si rien ne fonctionne

1. **Videz le cache du navigateur** (Ctrl+Shift+Delete)
2. **Rechargez la page** (Ctrl+F5)
3. **Vérifiez les logs** dans la console
4. **Vérifiez les logs** du serveur backend
5. **Testez dans un autre navigateur** (Chrome, Firefox, Edge)

## 📞 Informations à fournir en cas de problème

Si le problème persiste, fournissez :
1. Les messages de la console du navigateur
2. Les erreurs du serveur backend
3. Une capture d'écran de la page
4. Le résultat de `window.google` dans la console

