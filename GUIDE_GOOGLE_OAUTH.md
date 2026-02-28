# 🔐 Guide de Configuration Google OAuth

Ce guide vous explique comment configurer l'authentification Google (OAuth 2.0) pour permettre aux utilisateurs de se connecter avec leur compte Google.

---

## 📋 Prérequis

- Un compte Google
- Accès à [Google Cloud Console](https://console.cloud.google.com/)

---

## 🚀 Configuration Backend

### Étape 1 : Créer un projet Google Cloud

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Cliquez sur le sélecteur de projet en haut
3. Cliquez sur **"Nouveau projet"**
4. Donnez un nom au projet (ex: "Centre Commercial")
5. Cliquez sur **"Créer"**

### Étape 2 : Activer l'API Google+ (OAuth)

1. Dans le menu latéral, allez dans **"APIs & Services"** → **"Library"**
2. Recherchez **"Google+ API"** ou **"People API"**
3. Cliquez sur **"Enable"** (Activer)

### Étape 3 : Configurer l'écran de consentement OAuth

1. Allez dans **"APIs & Services"** → **"OAuth consent screen"**
2. Choisissez **"External"** (pour les tests) ou **"Internal"** (si vous avez Google Workspace)
3. Remplissez les informations :
   - **App name** : Centre Commercial
   - **User support email** : votre email
   - **Developer contact information** : votre email
4. Cliquez sur **"Save and Continue"**
5. Sur la page **"Scopes"**, cliquez sur **"Save and Continue"**
6. Sur la page **"Test users"** (si External), vous pouvez ajouter des emails de test
7. Cliquez sur **"Save and Continue"** puis **"Back to Dashboard"**

### Étape 4 : Créer les identifiants OAuth

1. Allez dans **"APIs & Services"** → **"Credentials"**
2. Cliquez sur **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. Choisissez **"Web application"** comme type
4. Donnez un nom (ex: "Centre Commercial Web Client")
5. **Authorized JavaScript origins** :
   ```
   http://localhost:4200
   http://localhost:5000
   ```
   (Ajoutez votre domaine de production plus tard)
6. **Authorized redirect URIs** :
   ```
   http://localhost:4200
   ```
   (Ajoutez votre domaine de production plus tard)
7. Cliquez sur **"Create"**
8. **IMPORTANT** : Copiez le **Client ID** affiché (vous ne pourrez plus le voir après)

### Étape 5 : Configurer le fichier `.env`

Ajoutez le Client ID dans votre fichier `backend/.env` :

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=votre-client-id-google.apps.googleusercontent.com
```

**Exemple** :
```env
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
```

---

## 🎨 Configuration Frontend (Angular)

### Étape 1 : Installer Google Sign-In

Vous avez deux options :

#### Option A : Utiliser @abacritt/ngx-social-login (Recommandé)

```bash
npm install @abacritt/ngx-social-login
```

#### Option B : Utiliser directement Google Identity Services (Plus moderne)

Pas besoin d'installer, utilisez directement l'API Google.

### Étape 2 : Ajouter le script Google dans `index.html`

Ouvrez `src/index.html` et ajoutez avant `</head>` :

```html
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

### Étape 3 : Créer un service Google Auth

Créez `src/app/shared/services/google-auth.service.ts` :

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface GoogleAuthResponse {
  user: any;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class GoogleAuthService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl || 'http://localhost:5000/api';

  // Initialiser Google Sign-In
  initializeGoogleSignIn(clientId: string): void {
    // Cette fonction sera appelée après le chargement du script Google
    if (typeof window !== 'undefined' && (window as any).google) {
      (window as any).google.accounts.id.initialize({
        client_id: clientId,
        callback: this.handleCredentialResponse.bind(this)
      });
    }
  }

  // Gérer la réponse de Google
  private handleCredentialResponse(response: any): void {
    // Cette fonction sera appelée par le composant
    console.log('Google credential response:', response);
  }

  // Authentifier avec le token Google
  authenticateWithGoogle(idToken: string): Observable<GoogleAuthResponse> {
    return this.http.post<GoogleAuthResponse>(`${this.apiUrl}/auth/google`, {
      idToken
    });
  }

  // Rendre la fonction handleCredentialResponse accessible
  getHandleCredentialResponse() {
    return this.handleCredentialResponse.bind(this);
  }
}
```

### Étape 4 : Créer un composant de bouton Google Sign-In

Créez `src/app/shared/components/google-signin-button/google-signin-button.component.ts` :

```typescript
import { Component, OnInit, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleAuthService } from '../../../shared/services/google-auth.service';

@Component({
  selector: 'app-google-signin-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div id="google-signin-button" class="google-signin-container">
      <!-- Le bouton sera injecté ici par Google -->
    </div>
  `,
  styles: [`
    .google-signin-container {
      display: flex;
      justify-content: center;
      margin: 1rem 0;
    }
  `]
})
export class GoogleSigninButtonComponent implements OnInit {
  private googleAuthService = inject(GoogleAuthService);
  
  // Émettre l'événement quand l'authentification réussit
  onSuccess = output<{ user: any; token: string }>();
  onError = output<string>();

  ngOnInit(): void {
    // Attendre que le script Google soit chargé
    this.loadGoogleScript();
  }

  private loadGoogleScript(): void {
    if ((window as any).google) {
      this.renderButton();
    } else {
      // Attendre que le script soit chargé
      const checkGoogle = setInterval(() => {
        if ((window as any).google) {
          clearInterval(checkGoogle);
          this.renderButton();
        }
      }, 100);
    }
  }

  private renderButton(): void {
    const clientId = 'VOTRE_CLIENT_ID_GOOGLE'; // À remplacer par votre Client ID
    
    (window as any).google.accounts.id.initialize({
      client_id: clientId,
      callback: (response: any) => this.handleCredentialResponse(response)
    });

    (window as any).google.accounts.id.renderButton(
      document.getElementById('google-signin-button'),
      {
        theme: 'outline',
        size: 'large',
        width: 300,
        text: 'signin_with',
        locale: 'fr'
      }
    );
  }

  private handleCredentialResponse(response: any): void {
    if (response.credential) {
      this.googleAuthService.authenticateWithGoogle(response.credential)
        .subscribe({
          next: (result) => {
            // Sauvegarder le token
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.user));
            
            this.onSuccess.emit(result);
          },
          error: (error) => {
            console.error('Google auth error:', error);
            this.onError.emit(error.error?.message || 'Erreur d\'authentification Google');
          }
        });
    }
  }
}
```

### Étape 5 : Utiliser le bouton dans le composant de connexion

Dans `src/app/pages/auth-pages/sign-in/sign-in.component.ts`, ajoutez :

```typescript
import { GoogleSigninButtonComponent } from '../../../shared/components/google-signin-button/google-signin-button.component';

// Dans le template, ajoutez :
// <app-google-signin-button 
//   (onSuccess)="handleGoogleSuccess($event)"
//   (onError)="handleGoogleError($event)">
// </app-google-signin-button>
```

---

## 🔧 Configuration Alternative (Plus Simple)

Si vous préférez une approche plus simple, vous pouvez utiliser directement l'API Google dans votre composant :

```typescript
// Dans votre composant de connexion
signInWithGoogle(): void {
  (window as any).google.accounts.oauth2.initTokenClient({
    client_id: 'VOTRE_CLIENT_ID',
    scope: 'email profile',
    callback: (response: any) => {
      if (response.access_token) {
        // Utiliser l'access token pour obtenir les infos utilisateur
        this.getUserInfo(response.access_token);
      }
    }
  }).requestAccessToken();
}

getUserInfo(accessToken: string): void {
  // Appeler l'API Google pour obtenir les infos utilisateur
  // Puis envoyer au backend
}
```

---

## ✅ Test de l'Authentification

### Test 1 : Vérifier la configuration backend

1. Vérifiez que `GOOGLE_CLIENT_ID` est dans votre `.env`
2. Démarrez le serveur backend :
   ```bash
   cd backend
   npm run dev
   ```

### Test 2 : Tester avec Postman/Insomnia

1. Obtenez un token ID Google (depuis le frontend ou un outil de test)
2. Appelez `POST /api/auth/google` avec :
   ```json
   {
     "idToken": "votre-google-id-token"
   }
   ```
3. Vous devriez recevoir un JWT et les infos utilisateur

### Test 3 : Tester depuis le frontend

1. Ajoutez le bouton Google Sign-In dans votre page de connexion
2. Cliquez sur le bouton
3. Sélectionnez un compte Google
4. Vérifiez que vous êtes connecté

---

## 🔒 Sécurité

### ⚠️ Important

1. **Ne commitez JAMAIS votre Client ID** dans le code source
2. Utilisez des variables d'environnement pour le Client ID
3. En production, configurez les **Authorized JavaScript origins** avec votre domaine réel
4. Limitez les **Authorized redirect URIs** à vos domaines autorisés

### Variables d'environnement Angular

Créez `src/environments/environment.ts` :

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api',
  googleClientId: 'VOTRE_CLIENT_ID_GOOGLE'
};
```

Et `src/environments/environment.prod.ts` :

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://votre-domaine.com/api',
  googleClientId: 'VOTRE_CLIENT_ID_GOOGLE_PRODUCTION'
};
```

---

## 📝 Notes Importantes

1. **Client ID différent pour dev/prod** : Créez deux OAuth clients (un pour dev, un pour prod)
2. **Domaine de production** : N'oubliez pas d'ajouter votre domaine de production dans les Authorized origins
3. **Quota Google** : Google limite le nombre de requêtes OAuth par jour (généralement suffisant pour la plupart des applications)

---

## 🐛 Dépannage

### Erreur : "Invalid client"

- Vérifiez que le Client ID est correct dans `.env`
- Vérifiez que le Client ID correspond au projet Google Cloud

### Erreur : "Redirect URI mismatch"

- Vérifiez que l'URL dans Authorized redirect URIs correspond exactement à votre URL
- Les URLs doivent correspondre exactement (http vs https, avec/sans trailing slash)

### Le bouton Google ne s'affiche pas

- Vérifiez que le script Google est chargé dans `index.html`
- Vérifiez la console du navigateur pour les erreurs
- Attendez que le script soit complètement chargé avant d'initialiser

---

## 📚 Ressources

- [Google Identity Services Documentation](https://developers.google.com/identity/gsi/web)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)

---

**Besoin d'aide ?** Vérifiez les logs du serveur backend pour plus de détails sur les erreurs OAuth.

