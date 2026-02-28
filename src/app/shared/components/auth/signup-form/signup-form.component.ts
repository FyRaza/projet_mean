import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { LabelComponent } from '../../form/label/label.component';
import { CheckboxComponent } from '../../form/input/checkbox.component';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { RegisterData } from '../../../../core/models/user.model';
import { GoogleSigninButtonComponent } from '../google-signin-button/google-signin-button.component';


@Component({
  selector: 'app-signup-form',
  imports: [
    CommonModule,
    LabelComponent,
    CheckboxComponent,
    InputFieldComponent,
    RouterModule,
    FormsModule,
    GoogleSigninButtonComponent
],
  templateUrl: './signup-form.component.html',
  styles: ``
})
export class SignupFormComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  showPassword = false;
  isChecked = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  fname = '';
  lname = '';
  email = '';
  password = '';

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onFirstNameChange(value: string | number) {
    this.fname = value as string;
    this.errorMessage = '';
  }

  onLastNameChange(value: string | number) {
    this.lname = value as string;
    this.errorMessage = '';
  }

  onEmailChange(value: string | number) {
    this.email = value as string;
    this.errorMessage = '';
  }

  onPasswordChange(value: string | number) {
    this.password = value as string;
    this.errorMessage = '';
  }

  handleGoogleSuccess(result: { user: any; token: string }): void {
    this.errorMessage = '';
    this.successMessage = 'Inscription Google réussie ! Redirection...';
    setTimeout(() => {
      this.authService.navigateToDefaultRoute();
    }, 500);
  }

  handleGoogleError(error: string): void {
    this.errorMessage = error || 'Erreur d\'authentification Google';
    this.successMessage = '';
  }

  onXSignup() {
    this.errorMessage = 'Connexion X non configuree pour le moment.';
    this.successMessage = '';
  }

  onSignUp() {
    if (!this.fname.trim() || !this.lname.trim() || !this.email.trim() || !this.password.trim()) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires.';
      this.successMessage = '';
      return;
    }

    if (!this.isChecked) {
      this.errorMessage = 'Veuillez accepter les conditions pour continuer.';
      this.successMessage = '';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const payload: RegisterData = {
      firstName: this.fname.trim(),
      lastName: this.lname.trim(),
      email: this.email.trim().toLowerCase(),
      password: this.password,
      role: 'acheteur'
    };

    this.authService.register(payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Compte cree avec succes. Redirection...';
        setTimeout(() => {
          this.authService.navigateToDefaultRoute();
        }, 500);
      },
      error: (error) => {
        this.isLoading = false;
        this.successMessage = '';
        this.errorMessage = error?.error?.message || "Impossible de creer le compte.";
      }
    });
  }
}
