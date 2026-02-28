import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService, BoutiqueOwnerAccount } from '../../../../shared/services/admin.service';
import { Box, Category } from '../../../../core/models';

@Component({
  selector: 'app-boutique-create',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex items-center gap-3">
        <a routerLink="/admin/boutiques" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </a>
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Créer une boutique</h1>
          <p class="text-gray-500 dark:text-gray-400 mt-1">Ajoutez une nouvelle boutique au centre commercial</p>
        </div>
      </div>

      <!-- Form -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Form -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Boutique Info -->
          <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-6">Informations de la boutique</h2>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nom de la boutique *</label>
                <input
                  type="text"
                  [(ngModel)]="formData.name"
                  class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-0 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                  placeholder="Ex: Fashion Store"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <textarea
                  [(ngModel)]="formData.description"
                  rows="3"
                  class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-0 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 resize-none"
                  placeholder="Description de la boutique..."
                ></textarea>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Catégorie *</label>
                <select
                  [(ngModel)]="formData.categoryId"
                  class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-0 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Sélectionner une catégorie</option>
                  @for (category of categories; track category.id) {
                    <option [value]="category.id">{{ category.name }}</option>
                  }
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Téléphone</label>
                <input
                  type="tel"
                  [(ngModel)]="formData.phone"
                  class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-0 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                  placeholder="+261 34 00 000 00"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Propriétaire existant (optionnel)
                </label>
                <select
                  [(ngModel)]="formData.ownerId"
                  class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-0 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Créer un nouveau propriétaire</option>
                  @for (owner of owners; track owner.id) {
                    <option [value]="owner.id">
                      {{ owner.firstName }} {{ owner.lastName }} - {{ owner.email }}
                    </option>
                  }
                </select>
                <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Si vous choisissez un propriétaire existant, les identifiants ci-dessous ne seront pas utilisés.
                </p>
              </div>
            </div>
          </div>

          <!-- Login Credentials -->
          <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-6">Identifiants de connexion</h2>
            <div class="space-y-4">
              @if (selectedOwner) {
                <div class="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-sm">
                  Propriétaire sélectionné: <span class="font-semibold">{{ selectedOwner.firstName }} {{ selectedOwner.lastName }}</span>
                  ({{ selectedOwner.email }})
                </div>
              } @else {
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email (identifiant) *</label>
                  <input
                    type="email"
                    [(ngModel)]="formData.email"
                    class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-0 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                    placeholder="boutique@exemple.com"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mot de passe *</label>
                  <div class="relative">
                    <input
                      [type]="showPassword ? 'text' : 'password'"
                      [(ngModel)]="formData.password"
                      class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-0 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 pr-12"
                      placeholder="Mot de passe"
                    />
                    <button
                      type="button"
                      (click)="showPassword = !showPassword"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      @if (showPassword) {
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                        </svg>
                      } @else {
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                        </svg>
                      }
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  (click)="generatePassword()"
                  class="text-sm text-brand-600 dark:text-brand-400 hover:underline"
                >
                  Générer un mot de passe
                </button>
              }
            </div>
          </div>
        </div>

        <!-- Sidebar - Box Assignment -->
        <div class="space-y-6">
          <!-- Box Selection -->
          <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Attribution d'emplacement</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Sélectionnez un emplacement disponible pour cette boutique (optionnel)</p>

            <!-- Zone Filter -->
            <div class="flex items-center gap-2 mb-4">
              @for (zone of ['Tous', 'A', 'B', 'C']; track zone) {
                <button
                  (click)="filterZone = zone === 'Tous' ? '' : zone"
                  class="px-3 py-1.5 text-sm rounded-lg transition-all"
                  [class]="(filterZone === '' && zone === 'Tous') || filterZone === zone ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'"
                >
                  {{ zone }}
                </button>
              }
            </div>

            <!-- Box List -->
            <div class="space-y-2 max-h-[300px] overflow-y-auto">
              @for (box of filteredBoxes; track box.id) {
                <button
                  type="button"
                  (click)="selectBox(box)"
                  class="w-full p-3 rounded-xl border-2 transition-all text-left"
                  [class]="selectedBox?.id === box.id ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-gray-100 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-700'"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm"
                        [class]="box.zone === 'A' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                                 box.zone === 'B' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' :
                                 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'"
                      >
                        {{ box.code }}
                      </div>
                      <div>
                        <p class="font-medium text-gray-900 dark:text-white text-sm">{{ box.name }}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">{{ box.area }} m²</p>
                      </div>
                    </div>
                    @if (selectedBox?.id === box.id) {
                      <div class="w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center">
                        <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                        </svg>
                      </div>
                    }
                  </div>
                </button>
              }
              @if (filteredBoxes.length === 0) {
                <div class="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
                  Aucun emplacement disponible
                </div>
              }
            </div>

            @if (selectedBox) {
              <button
                type="button"
                (click)="selectedBox = null"
                class="mt-4 w-full py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                Retirer la sélection
              </button>
            }
          </div>

          <!-- Summary -->
          <div class="bg-gradient-to-br from-brand-500 to-purple-600 rounded-2xl p-6 text-white">
            <h3 class="font-semibold mb-4">Résumé</h3>
            <div class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-white/80">Boutique</span>
                <span class="font-medium">{{ formData.name || '-' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-white/80">Email</span>
                <span class="font-medium">{{ formData.email || '-' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-white/80">Emplacement</span>
                <span class="font-medium">{{ selectedBox?.code || 'Non assigné' }}</span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-col gap-3">
            @if (errorMessage) {
              <div class="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
                {{ errorMessage }}
              </div>
            }
            <button
              (click)="createBoutique()"
              [disabled]="creating"
              class="w-full px-6 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              @if (creating) {
                <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              } @else {
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
              }
              Créer la boutique
            </button>
            <a
              routerLink="/admin/boutiques"
              class="w-full px-6 py-3 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-center"
            >
              Annuler
            </a>
          </div>
        </div>
      </div>

      <!-- Success Toast -->
      @if (showSuccessToast) {
        <div class="fixed bottom-6 right-6 z-[60] animate-slide-up">
          <div class="bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span class="font-medium">Boutique créée avec succès!</span>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes slide-up {
      from { transform: translateY(100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    .animate-slide-up {
      animation: slide-up 0.3s ease-out forwards;
    }
  `]
})
export class BoutiqueCreateComponent implements OnInit {
  private adminService = inject(AdminService);
  private router = inject(Router);

  categories: Category[] = [];
  boxes: Box[] = [];
  owners: BoutiqueOwnerAccount[] = [];
  selectedBox: Box | null = null;
  filterZone = '';
  showPassword = false;
  creating = false;
  showSuccessToast = false;
  errorMessage = '';

  formData = {
    name: '',
    description: '',
    categoryId: '',
    ownerId: '',
    email: '',
    password: '',
    phone: ''
  };

  get selectedOwner(): BoutiqueOwnerAccount | null {
    return this.owners.find((o) => o.id === this.formData.ownerId) || null;
  }

  get filteredBoxes(): Box[] {
    let boxes = this.boxes.filter(b => b.status === 'available');
    if (this.filterZone) {
      boxes = boxes.filter(b => b.zone === this.filterZone);
    }
    return boxes;
  }

  ngOnInit(): void {
    this.adminService.getCategories().subscribe(cats => this.categories = cats);
    this.adminService.getBoxes().subscribe(boxes => this.boxes = boxes);
    this.adminService.getBoutiqueOwners().subscribe({
      next: (owners) => this.owners = owners,
      error: () => this.owners = []
    });
  }

  selectBox(box: Box): void {
    this.selectedBox = this.selectedBox?.id === box.id ? null : box;
  }

  generatePassword(): void {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.formData.password = password;
    this.showPassword = true;
  }

  isFormValid(): boolean {
    return !!(
      this.formData.name.trim() &&
      this.formData.categoryId &&
      (this.formData.ownerId || (this.formData.email.trim() && this.formData.password.trim()))
    );
  }

  private getMissingRequiredFields(): string[] {
    const missing: string[] = [];
    if (!this.formData.name.trim()) missing.push('nom de la boutique');
    if (!this.formData.categoryId) missing.push('categorie');
    if (!this.formData.ownerId) {
      if (!this.formData.email.trim()) missing.push('email');
      if (!this.formData.password.trim()) missing.push('mot de passe');
    }
    return missing;
  }

  createBoutique(): void {
    const missing = this.getMissingRequiredFields();
    if (missing.length > 0) {
      this.errorMessage = `Veuillez renseigner: ${missing.join(', ')}.`;
      return;
    }

    this.creating = true;
    this.errorMessage = '';

    this.adminService.createBoutiqueWithOwner({
      boutiqueName: this.formData.name,
      description: this.formData.description,
      categoryId: this.formData.categoryId,
      phone: this.formData.phone,
      ownerId: this.formData.ownerId || undefined,
      ownerEmail: this.selectedOwner?.email || this.formData.email,
      ownerPassword: this.formData.password
    }).subscribe({
      next: (createdBoutique) => {
        if (this.selectedBox) {
          this.adminService.assignBox(this.selectedBox.id, createdBoutique.id, createdBoutique.name).subscribe({
            next: () => this.finishSuccess(),
            error: (err) => {
              this.creating = false;
              this.errorMessage = err?.error?.message || "Boutique créée, mais l'attribution du box a échoué.";
            }
          });
          return;
        }

        this.finishSuccess();
      },
      error: (err) => {
        this.creating = false;
        this.errorMessage = err?.error?.message || 'Impossible de créer la boutique.';
      }
    });
  }

  private finishSuccess(): void {
    this.creating = false;
    this.showSuccessToast = true;
    setTimeout(() => {
      this.showSuccessToast = false;
      this.router.navigate(['/admin/boutiques']);
    }, 1800);
  }
}
