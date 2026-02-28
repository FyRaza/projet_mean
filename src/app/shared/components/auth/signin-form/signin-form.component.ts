import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LabelComponent } from '../../form/label/label.component';
import { CheckboxComponent } from '../../form/input/checkbox.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { GoogleSigninButtonComponent } from '../google-signin-button/google-signin-button.component';

@Component({
  selector: 'app-signin-form',
  standalone: true,
  imports: [
    CommonModule,
    LabelComponent,
    CheckboxComponent,
    ButtonComponent,
    InputFieldComponent,
    RouterModule,
    FormsModule,
    GoogleSigninButtonComponent
  ],
  templateUrl: './signin-form.component.html',
  styles: ``
})
export class SigninFormComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  showPassword = false;
  isChecked = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  email = '';
  password = '';

  // Demo accounts (aligned with backend seed script)
  private demoAccounts: Record<string, { email: string; password: string; label: string }> = {
    admin: { email: 'admin@mall.mg', password: 'Admin1234!', label: 'Admin' },
    boutique: { email: 'boutique@mall.mg', password: 'Boutique1234!', label: 'Boutique' },
    client: { email: 'client@mall.mg', password: 'Client1234!', label: 'Client' }
  };

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onEmailChange(value: string | number) {
    this.email = value as string;
    this.errorMessage = '';
  }

  onPasswordChange(value: string | number) {
    this.password = value as string;
    this.errorMessage = '';
  }

  quickLogin(role: 'admin' | 'boutique' | 'client') {
    const account = this.demoAccounts[role];
    if (account) {
      this.email = account.email;
      this.password = account.password;
      this.successMessage = `Compte ${account.label} sélectionné`;
      this.errorMessage = '';

      // Auto-submit after a short delay
      setTimeout(() => {
        this.onSignIn();
      }, 500);
    }
  }

  onSignIn() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Veuillez remplir tous les champs';
      this.successMessage = '';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = 'Connexion réussie ! Redirection...';
        // Redirect based on user role
        setTimeout(() => {
          this.authService.navigateToDefaultRoute();
        }, 500);
      },
      error: (error) => {
        this.isLoading = false;
        this.successMessage = '';
        this.errorMessage = 'Email ou mot de passe incorrect';
        console.error('Login error:', error);
      }
    });
  }

  handleGoogleSuccess(result: { user: any; token: string }): void {
    this.errorMessage = '';
    this.successMessage = 'Connexion Google réussie ! Redirection...';
    setTimeout(() => {
      this.authService.navigateToDefaultRoute();
    }, 500);
  }

  handleGoogleError(error: string): void {
    this.errorMessage = error || 'Erreur d\'authentification Google';
    this.successMessage = '';
  }
}
