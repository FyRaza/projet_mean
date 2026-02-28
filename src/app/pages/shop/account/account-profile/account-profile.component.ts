import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../shared/services/auth.service';
import { User } from '../../../../core/models/user.model';
import { Router } from '@angular/router';

interface Address {
  id: string;
  label: string;
  fullName?: string;
  phone?: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

@Component({
  selector: 'app-account-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Mon Profil</h1>
          <p class="text-gray-500 dark:text-gray-400 mt-1">Gerez vos informations personnelles</p>
        </div>
      </div>

      @if (currentUser$ | async; as user) {
        <div class="space-y-6">
          <!-- Profile Card -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div class="p-6">
              <div class="flex items-center gap-6">
                <!-- Avatar -->
                <div class="relative">
                  <div class="w-24 h-24 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                    <span class="text-3xl font-bold text-brand-600 dark:text-brand-400">
                      {{ user.firstName?.charAt(0) }}{{ user.lastName?.charAt(0) }}
                    </span>
                  </div>
                  <button
                    type="button"
                    (click)="startEditingProfile(user)"
                    class="absolute bottom-0 right-0 p-2 bg-white dark:bg-gray-700 rounded-full shadow-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    <svg class="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>

                <!-- User Info -->
                <div class="flex-1">
                  <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                    {{ user.firstName }} {{ user.lastName }}
                  </h2>
                  <p class="text-gray-500 dark:text-gray-400">{{ user.email }}</p>
                  <div class="flex items-center gap-2 mt-2">
                    <span class="px-3 py-1 text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                      Compte actif
                    </span>
                    <span class="text-sm text-gray-500 dark:text-gray-400">
                      Membre depuis {{ user.createdAt | date:'MMMM yyyy' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Personal Information -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Informations personnelles</h3>
              @if (!isEditingProfile()) {
                <button
                  type="button"
                  (click)="startEditingProfile(user)"
                  class="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 flex items-center gap-1"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Modifier
                </button>
              }
            </div>

            <div class="p-6">
              @if (isEditingProfile()) {
                <form (ngSubmit)="saveProfile()" class="space-y-4">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prenom</label>
                      <input
                        type="text"
                        [(ngModel)]="profileForm.firstName"
                        name="firstName"
                        class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                        required
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom</label>
                      <input
                        type="text"
                        [(ngModel)]="profileForm.lastName"
                        name="lastName"
                        class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                    <input
                      type="email"
                      [(ngModel)]="profileForm.email"
                      name="email"
                      class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                      required
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telephone</label>
                    <input
                      type="tel"
                      [(ngModel)]="profileForm.phone"
                      name="phone"
                      class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    />
                  </div>

                  <div class="flex items-center gap-3 pt-4">
                    <button
                      type="submit"
                      [disabled]="isSaving()"
                      class="px-6 py-2.5 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50"
                    >
                      @if (isSaving()) {
                        <span class="flex items-center gap-2">
                          <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Enregistrement...
                        </span>
                      } @else {
                        Enregistrer
                      }
                    </button>
                    <button
                      type="button"
                      (click)="cancelEditingProfile()"
                      class="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              } @else {
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Prenom</p>
                    <p class="text-gray-900 dark:text-white font-medium">{{ user.firstName }}</p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Nom</p>
                    <p class="text-gray-900 dark:text-white font-medium">{{ user.lastName }}</p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Email</p>
                    <p class="text-gray-900 dark:text-white font-medium">{{ user.email }}</p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Telephone</p>
                    <p class="text-gray-900 dark:text-white font-medium">{{ user.phone || 'Non renseigne' }}</p>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Addresses -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Mes adresses</h3>
              <button
                type="button"
                (click)="addAddress()"
                class="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 flex items-center gap-1"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Ajouter
              </button>
            </div>

            <div class="p-6">
              @if (addresses().length > 0) {
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  @for (address of addresses(); track address.id) {
                    <div class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg relative">
                      @if (address.isDefault) {
                        <span class="absolute top-2 right-2 px-2 py-0.5 text-xs font-medium bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded">
                          Par defaut
                        </span>
                      }
                      <p class="font-medium text-gray-900 dark:text-white mb-1">{{ address.label }}</p>
                      <p class="text-sm text-gray-600 dark:text-gray-400">{{ address.street }}</p>
                      <p class="text-sm text-gray-600 dark:text-gray-400">{{ address.postalCode }} {{ address.city }}</p>
                      <p class="text-sm text-gray-600 dark:text-gray-400">{{ address.country }}</p>
                      <div class="flex items-center gap-3 mt-3">
                        <button type="button" (click)="editAddress(address)" class="text-sm text-brand-600 dark:text-brand-400 hover:underline">Modifier</button>
                        @if (!address.isDefault) {
                          <button type="button" (click)="setDefaultAddress(address)" class="text-sm text-gray-500 dark:text-gray-400 hover:underline">Definir par defaut</button>
                        }
                        <button type="button" (click)="deleteAddress(address)" class="text-sm text-red-600 dark:text-red-400 hover:underline">Supprimer</button>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="text-center py-8">
                  <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <p class="text-gray-500 dark:text-gray-400 mb-4">Aucune adresse enregistree</p>
                  <button
                    type="button"
                    (click)="addAddress()"
                    class="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition-colors"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Ajouter une adresse
                  </button>
                </div>
              }
            </div>
          </div>

          <!-- Security -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Securite</h3>
            </div>

            <div class="p-6 space-y-4">
              <div class="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">Mot de passe</p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Mettez a jour votre mot de passe de connexion</p>
                </div>
                <button
                  type="button"
                  (click)="changePassword()"
                  class="px-4 py-2 text-sm font-medium text-brand-600 dark:text-brand-400 border border-brand-600 dark:border-brand-400 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                >
                  Modifier
                </button>
              </div>

              <div class="flex items-center justify-between py-3">
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">Supprimer le compte</p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Supprimez definitivement votre compte et toutes les donnees associees</p>
                </div>
                <button
                  type="button"
                  (click)="deleteAccount()"
                  class="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-600 dark:border-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Success Message -->
      @if (showSuccessMessage()) {
        <div class="fixed bottom-4 right-4 flex items-center gap-3 px-6 py-4 bg-green-600 text-white rounded-lg shadow-lg">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <span>Profil mis a jour avec succes !</span>
        </div>
      }
    </div>
  `
})
export class AccountProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  currentUser$ = this.authService.currentUser$;

  isEditingProfile = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  showSuccessMessage = signal<boolean>(false);
  addresses = signal<Address[]>([]);

  profileForm = {
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  };

  ngOnInit(): void {
    this.loadAddresses();
  }

  private loadAddresses(): void {
    this.authService.getMyAddresses().subscribe({
      next: (addresses) => this.addresses.set(addresses as Address[]),
      error: () => this.addresses.set([])
    });
  }

  startEditingProfile(user: User): void {
    this.profileForm = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || ''
    };
    this.isEditingProfile.set(true);
  }

  cancelEditingProfile(): void {
    this.isEditingProfile.set(false);
  }

  saveProfile(): void {
    this.isSaving.set(true);

    this.authService.updateProfile({
      firstName: this.profileForm.firstName,
      lastName: this.profileForm.lastName,
      email: this.profileForm.email,
      phone: this.profileForm.phone
    }).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.isEditingProfile.set(false);
        this.showSuccessMessage.set(true);

        setTimeout(() => {
          this.showSuccessMessage.set(false);
        }, 3000);
      },
      error: () => {
        this.isSaving.set(false);
      }
    });
  }

  addAddress(): void {
    const label = prompt('Label de l’adresse (ex: Domicile, Bureau)') || 'Adresse';
    const street = prompt('Rue et quartier');
    const city = prompt('Ville');
    if (!street || !city) return;

    const postalCode = prompt('Code postal') || '';
    const country = prompt('Pays', 'Madagascar') || 'Madagascar';

    this.authService.addAddress({
      label,
      street,
      city,
      postalCode,
      country,
      isDefault: this.addresses().length === 0
    }).subscribe({
      next: () => this.loadAddresses()
    });
  }

  editAddress(address: Address): void {
    const street = prompt('Rue et quartier', address.street);
    const city = prompt('Ville', address.city);
    if (!street || !city) return;

    const label = prompt('Label', address.label) || address.label;
    const postalCode = prompt('Code postal', address.postalCode) || '';
    const country = prompt('Pays', address.country) || 'Madagascar';

    this.authService.updateAddress(address.id, {
      label,
      street,
      city,
      postalCode,
      country
    }).subscribe({
      next: () => this.loadAddresses()
    });
  }

  setDefaultAddress(address: Address): void {
    this.authService.updateAddress(address.id, { isDefault: true }).subscribe({
      next: () => this.loadAddresses()
    });
  }

  deleteAddress(address: Address): void {
    if (!confirm(`Supprimer l'adresse "${address.label}" ?`)) return;
    this.authService.deleteAddress(address.id).subscribe({
      next: () => this.loadAddresses()
    });
  }

  changePassword(): void {
    const currentPassword = prompt('Entrez votre mot de passe actuel');
    if (!currentPassword) return;
    const newPassword = prompt('Entrez votre nouveau mot de passe (min 6 caracteres)');
    if (!newPassword) return;

    this.authService.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        alert('Mot de passe mis a jour avec succes.');
      },
      error: (err) => {
        alert(err?.error?.message || 'Impossible de mettre a jour le mot de passe.');
      }
    });
  }

  deleteAccount(): void {
    if (!confirm('Voulez-vous vraiment supprimer votre compte ? Cette action est irreversible.')) return;
    this.authService.deleteMyAccount().subscribe({
      next: () => {
        this.authService.logout();
        this.router.navigate(['/']);
      },
      error: (err) => {
        alert(err?.error?.message || 'Impossible de supprimer le compte.');
      }
    });
  }
}
