import { Component, OnInit, AfterViewInit, OnDestroy, inject, output, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { environment } from '../../../../../environments/environment';

declare global {
  interface Window {
    google: any;
  }
}

@Component({
  selector: 'app-google-signin-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="google-signin-container">
      <div #googleButtonContainer class="google-button-wrapper"></div>
      @if (errorMessage) {
        <div class="error-message">{{ errorMessage }}</div>
      }
    </div>
  `,
  styles: [`
    .google-signin-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin: 1.5rem 0;
    }
    
    .google-button-wrapper {
      display: flex;
      justify-content: center;
      width: 100%;
      max-width: 300px;
    }
    
    .error-message {
      margin-top: 0.5rem;
      color: #ef4444;
      font-size: 0.875rem;
      text-align: center;
    }
  `]
})
export class GoogleSigninButtonComponent implements OnInit, AfterViewInit, OnDestroy {
  private authService = inject(AuthService);
  @ViewChild('googleButtonContainer', { static: false }) buttonContainer!: ElementRef;
  
  onSuccess = output<{ user: any; token: string }>();
  onError = output<string>();

  errorMessage = '';
  private clientId = environment.googleClientId;
  private initialized = false;

  ngOnInit(): void {
    if (!this.clientId) {
      console.warn('Google Client ID not configured in environment');
      this.errorMessage = 'Configuration Google manquante';
      return;
    }
  }

  ngAfterViewInit(): void {
    if (!this.clientId) {
      console.warn('Google Client ID not configured');
      this.errorMessage = 'Configuration Google manquante';
      return;
    }
    
    console.log('Google Sign-In Button: AfterViewInit, Client ID:', this.clientId);
    
    // Attendre un peu pour que le DOM soit complètement rendu
    setTimeout(() => {
      this.waitForGoogleScript();
    }, 100);
  }

  private waitForGoogleScript(): void {
    console.log('Google Sign-In Button: Waiting for Google script...');
    
    if (window.google && window.google.accounts && window.google.accounts.id) {
      console.log('Google script already loaded');
      this.initializeGoogleSignIn();
    } else {
      // Vérifier toutes les 100ms si le script est chargé
      let attempts = 0;
      const maxAttempts = 100; // 10 secondes max
      
      const checkInterval = setInterval(() => {
        attempts++;
        if (window.google && window.google.accounts && window.google.accounts.id) {
          clearInterval(checkInterval);
          console.log('Google script loaded after', attempts * 100, 'ms');
          this.initializeGoogleSignIn();
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          this.errorMessage = 'Erreur de chargement du service Google. Vérifiez votre connexion.';
          console.error('Google Identity Services script not loaded after', maxAttempts * 100, 'ms');
          console.error('window.google:', window.google);
        }
      }, 100);
    }
  }

  private initializeGoogleSignIn(): void {
    if (this.initialized) {
      console.log('Google Sign-In already initialized');
      return; // Éviter la double initialisation
    }

    try {
      if (!this.buttonContainer?.nativeElement) {
        console.warn('Button container not found, retrying...');
        // Réessayer après un court délai
        setTimeout(() => {
          if (!this.initialized) {
            this.initializeGoogleSignIn();
          }
        }, 200);
        return;
      }

      console.log('Initializing Google Sign-In with Client ID:', this.clientId);
      
      window.google.accounts.id.initialize({
        client_id: this.clientId,
        callback: (response: any) => {
          console.log('Google credential response received');
          this.handleCredentialResponse(response);
        }
      });

      // Rendre le bouton dans le conteneur
      console.log('Rendering Google button...');
      window.google.accounts.id.renderButton(this.buttonContainer.nativeElement, {
        theme: 'outline',
        size: 'large',
        width: 300,
        text: 'signin_with',
        locale: 'fr',
        shape: 'rectangular'
      });

      this.initialized = true;
      console.log('Google Sign-In button rendered successfully');
    } catch (error: any) {
      console.error('Error initializing Google Sign-In:', error);
      this.errorMessage = `Erreur d'initialisation Google: ${error.message || 'Erreur inconnue'}`;
      this.onError.emit(this.errorMessage);
    }
  }

  ngOnDestroy(): void {
    // Nettoyer si nécessaire
    if (this.buttonContainer?.nativeElement && window.google) {
      try {
        // Vider le conteneur
        this.buttonContainer.nativeElement.innerHTML = '';
      } catch (error) {
        console.error('Error cleaning up Google button:', error);
      }
    }
  }

  private handleCredentialResponse(response: any): void {
    if (!response.credential) {
      this.errorMessage = 'Aucune réponse de Google';
      this.onError.emit('Aucune réponse de Google');
      return;
    }

    this.errorMessage = '';
    
    // Appeler le backend pour authentifier
    this.authService.loginWithGoogle(response.credential).subscribe({
      next: (result: { user: any; token: string }) => {
        this.onSuccess.emit(result);
        // La redirection sera gérée par le composant parent
      },
      error: (error: any) => {
        console.error('Google auth error:', error);
        const errorMsg = error?.error?.message || 'Erreur d\'authentification Google';
        this.errorMessage = errorMsg;
        this.onError.emit(errorMsg);
      }
    });
  }
}

