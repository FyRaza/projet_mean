import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../shared/services/auth.service';
import { AuthPageLayoutComponent } from '../../../shared/layout/auth-page-layout/auth-page-layout.component';
import { InputFieldComponent } from '../../../shared/components/form/input/input-field.component';
import { LabelComponent } from '../../../shared/components/form/label/label.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AuthPageLayoutComponent,
    InputFieldComponent,
    LabelComponent,
    ButtonComponent
  ],
  template: `
    <app-auth-page-layout>
      <div class="mx-auto w-full max-w-[570px] rounded-lg bg-white px-6 py-10 shadow-lg dark:bg-gray-800 sm:px-12 sm:py-16">
        <div class="mb-10">
          <h2 class="mb-3 text-2xl font-bold text-black dark:text-white sm:text-3xl">
            {{ hasToken ? 'Réinitialiser votre mot de passe' : 'Mot de passe oublié' }}
          </h2>
          <p class="text-base font-medium text-body-color">
            {{ hasToken 
              ? 'Entrez votre nouveau mot de passe ci-dessous' 
              : 'Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe' }}
          </p>
        </div>

        @if (hasToken) {
          <!-- Formulaire de réinitialisation avec token -->
          <form (ngSubmit)="onResetPassword($event)">
            <div class="mb-6">
              <app-label for="password">Nouveau mot de passe</app-label>
              <app-input-field
                id="password"
                type="password"
                [value]="password"
                (valueChange)="onPasswordChange($event)"
                name="password"
                placeholder="Entrez votre nouveau mot de passe"
                required
              />
            </div>

            <div class="mb-6">
              <app-label for="confirmPassword">Confirmer le mot de passe</app-label>
              <app-input-field
                id="confirmPassword"
                type="password"
                [value]="confirmPassword"
                (valueChange)="onConfirmPasswordChange($event)"
                name="confirmPassword"
                placeholder="Confirmez votre nouveau mot de passe"
                required
              />
            </div>

            @if (errorMessage) {
              <div class="mb-6 rounded-lg bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {{ errorMessage }}
              </div>
            }

            @if (successMessage) {
              <div class="mb-6 rounded-lg bg-green-50 p-4 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                {{ successMessage }}
              </div>
            }

            <div class="mb-10">
              <app-button
                type="submit"
                [disabled]="isLoading || !password || !confirmPassword || password !== confirmPassword"
                (btnClick)="onResetPassword($event)"
                class="w-full"
              >
                @if (isLoading) {
                  <span>Chargement...</span>
                } @else {
                  Réinitialiser le mot de passe
                }
              </app-button>
            </div>
          </form>
        } @else {
          <!-- Formulaire de demande de réinitialisation -->
          <form (ngSubmit)="onForgotPassword()">
            <div class="mb-6">
              <app-label for="email">Adresse email</app-label>
              <app-input-field
                id="email"
                type="email"
                [value]="email"
                (valueChange)="onEmailChange($event)"
                name="email"
                placeholder="Entrez votre adresse email"
                required
              />
            </div>

            @if (errorMessage) {
              <div class="mb-6 rounded-lg bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {{ errorMessage }}
              </div>
            }

            @if (successMessage) {
              <div class="mb-6 rounded-lg bg-green-50 p-4 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                {{ successMessage }}
              </div>
            }

            <div class="mb-10">
              <app-button
                type="submit"
                [disabled]="isLoading || !email || email.trim() === ''"
                (btnClick)="onForgotPassword()"
                class="w-full"
              >
                @if (isLoading) {
                  <span>Envoi en cours...</span>
                } @else {
                  Envoyer le lien de réinitialisation
                }
              </app-button>
            </div>
          </form>
        }

        <p class="text-center text-base font-medium text-body-color">
          Vous vous souvenez de votre mot de passe ?
          <a routerLink="/signin" class="text-primary hover:underline">
            Se connecter
          </a>
        </p>
      </div>
    </app-auth-page-layout>
  `,
  styles: ``
})
export class ResetPasswordComponent implements OnInit {
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  email = '';
  password = '';
  confirmPassword = '';
  token: string | null = null;
  hasToken = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {
    // Vérifier si un token est présent dans l'URL
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || null;
      this.hasToken = !!this.token;
    });
  }

  onEmailChange(value: string | number): void {
    this.email = String(value);
  }

  onPasswordChange(value: string | number): void {
    this.password = String(value);
  }

  onConfirmPasswordChange(value: string | number): void {
    this.confirmPassword = String(value);
  }

  onForgotPassword(): void {
    if (!this.email) {
      this.errorMessage = 'Veuillez entrer votre adresse email';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.forgotPassword(this.email).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = 'Un email de réinitialisation a été envoyé à votre adresse. Veuillez vérifier votre boîte de réception.';
        this.email = '';
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Une erreur est survenue. Veuillez réessayer.';
      }
    });
  }

  onResetPassword(event?: Event): void {
    // Empêcher la soumission par défaut du formulaire
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (!this.password || !this.confirmPassword) {
      this.errorMessage = 'Veuillez remplir tous les champs';
      this.successMessage = '';
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
      this.successMessage = '';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas';
      this.successMessage = '';
      return;
    }

    if (!this.token) {
      this.errorMessage = 'Token de réinitialisation manquant';
      this.successMessage = '';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.resetPassword(this.token, this.password).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = 'Votre mot de passe a été réinitialisé avec succès. Redirection vers la page de connexion...';
        setTimeout(() => {
          this.router.navigate(['/signin']);
        }, 2000);
      },
      error: (error) => {
        this.isLoading = false;
        // Conserver le token même en cas d'erreur
        this.hasToken = !!this.token;
        this.errorMessage = error.error?.message || 'Le lien de réinitialisation est invalide ou a expiré. Veuillez demander un nouveau lien.';
        this.successMessage = '';
      }
    });
  }
}

