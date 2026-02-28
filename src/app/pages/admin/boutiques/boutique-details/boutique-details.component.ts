import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { AdminService } from '../../../../shared/services/admin.service';
import { Boutique, BoutiqueStatus, BoutiqueStats } from '../../../../core/models';

@Component({
  selector: 'app-admin-boutique-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div class="flex items-center gap-3">
          <a routerLink="/admin/boutiques" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </a>
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Détails de la boutique</h1>
            <p class="text-gray-500 dark:text-gray-400 mt-1">Gérez les informations et paramètres</p>
          </div>
        </div>
        @if (boutique) {
          <div class="flex items-center gap-3">
            <button
              (click)="toggleStatus()"
              class="px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors"
              [class]="boutique.status === 'active'
                ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100'
                : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100'"
            >
              {{ boutique.status === 'active' ? 'Désactiver' : 'Activer' }}
            </button>
          </div>
        }
      </div>

      @if (boutique) {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Left Column -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Profile Card -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
              <div class="h-32 bg-gradient-to-r from-brand-500 to-purple-600"></div>
              <div class="p-6 -mt-12">
                <div class="flex flex-col sm:flex-row sm:items-end gap-4">
                  <img [src]="boutique.logo" [alt]="boutique.name" class="w-24 h-24 rounded-2xl object-cover border-4 border-white dark:border-gray-800 shadow-lg bg-gray-100 dark:bg-gray-700" />
                  <div class="flex-1">
                    <div class="flex items-start justify-between">
                      <div>
                        <h2 class="text-xl font-bold text-gray-900 dark:text-white">{{ boutique.name }}</h2>
                        <p class="text-gray-500 dark:text-gray-400">{{ boutique.slug }}</p>
                      </div>
                      <span [class]="getStatusClasses(boutique.status)">{{ getStatusLabel(boutique.status) }}</span>
                    </div>
                  </div>
                </div>
                <p class="mt-4 text-gray-600 dark:text-gray-300">{{ boutique.description }}</p>
              </div>
            </div>

            <!-- Stats Cards -->
            @if (stats) {
              <div class="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div class="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                      <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                      </svg>
                    </div>
                    <div>
                      <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.totalProducts }}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">Produits</p>
                    </div>
                  </div>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
                      <svg class="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                      </svg>
                    </div>
                    <div>
                      <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.totalOrders }}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">Commandes</p>
                    </div>
                  </div>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                      <svg class="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                      </svg>
                    </div>
                    <div>
                      <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.averageRating | number:'1.1-1' }}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">{{ stats.totalReviews }} avis</p>
                    </div>
                  </div>
                </div>
              </div>
            }

            <!-- Opening Hours -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Horaires d'ouverture</h3>
              <div class="space-y-3">
                @for (hours of boutique.openingHours; track hours.dayOfWeek) {
                  <div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <span class="font-medium text-gray-700 dark:text-gray-300">{{ getDayName(hours.dayOfWeek) }}</span>
                    @if (hours.isClosed) {
                      <span class="text-gray-400 dark:text-gray-500">Fermé</span>
                    } @else {
                      <span class="text-gray-900 dark:text-white">{{ hours.openTime }} - {{ hours.closeTime }}</span>
                    }
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Right Column -->
          <div class="space-y-6">
            <!-- Contact Info -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact</h3>
              <div class="space-y-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                  </div>
                  <div class="min-w-0">
                    <p class="text-xs text-gray-500 dark:text-gray-400">Email</p>
                    <p class="text-gray-900 dark:text-white truncate">{{ boutique.contactEmail }}</p>
                  </div>
                </div>
                @if (boutique.contactPhone) {
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                      </svg>
                    </div>
                    <div>
                      <p class="text-xs text-gray-500 dark:text-gray-400">Téléphone</p>
                      <p class="text-gray-900 dark:text-white">{{ boutique.contactPhone }}</p>
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Box Assignment -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Emplacement</h3>
              @if (boutique.boxId) {
                <div class="flex items-center gap-4 p-4 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
                  <div class="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-800 flex items-center justify-center">
                    <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    </svg>
                  </div>
                  <div>
                    <p class="font-semibold text-purple-900 dark:text-purple-100">Box attribué</p>
                    <p class="text-sm text-purple-700 dark:text-purple-300">ID: {{ boutique.boxId }}</p>
                  </div>
                </div>
              } @else {
                <div class="text-center py-6">
                  <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    </svg>
                  </div>
                  <p class="text-gray-500 dark:text-gray-400 mb-4">Aucun emplacement attribué</p>
                  <a routerLink="/admin/boxes/assignment" class="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors text-sm font-medium">
                    Attribuer un box
                  </a>
                </div>
              }
            </div>

            <!-- Dates -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Historique</h3>
              <div class="space-y-3">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-gray-500 dark:text-gray-400">Créée le</span>
                  <span class="text-gray-900 dark:text-white">{{ boutique.createdAt | date:'dd/MM/yyyy' }}</span>
                </div>
                <div class="flex items-center justify-between text-sm">
                  <span class="text-gray-500 dark:text-gray-400">Modifiée le</span>
                  <span class="text-gray-900 dark:text-white">{{ boutique.updatedAt | date:'dd/MM/yyyy' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      }

      @if (!boutique) {
        <div class="flex items-center justify-center py-12">
          <svg class="w-8 h-8 animate-spin text-brand-600" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
        </div>
      }
    </div>
  `
})
export class AdminBoutiqueDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private adminService = inject(AdminService);

  boutique: Boutique | null = null;
  stats: BoutiqueStats | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadBoutique(id);
    }
  }

  private loadBoutique(id: string): void {
    this.adminService.getBoutiqueById(id).subscribe(boutique => {
      if (boutique) {
        this.boutique = boutique;
        this.loadStats(id);
      } else {
        this.router.navigate(['/admin/boutiques']);
      }
    });
  }

  private loadStats(id: string): void {
    this.adminService.getBoutiqueStats(id).subscribe(stats => {
      this.stats = stats;
    });
  }

  toggleStatus(): void {
    if (this.boutique) {
      const newStatus: BoutiqueStatus = this.boutique.status === 'active' ? 'inactive' : 'active';
      this.adminService.updateBoutiqueStatus(this.boutique.id, newStatus).subscribe(updated => {
        this.boutique = updated;
      });
    }
  }

  getDayName(day: number): string {
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    return days[day];
  }

  getStatusClasses(status: BoutiqueStatus): string {
    const base = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium';
    switch (status) {
      case 'active': return `${base} bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400`;
      case 'pending': return `${base} bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400`;
      case 'inactive': return `${base} bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400`;
      case 'suspended': return `${base} bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400`;
      default: return base;
    }
  }

  getStatusLabel(status: BoutiqueStatus): string {
    switch (status) {
      case 'active': return 'Actif';
      case 'pending': return 'En attente';
      case 'inactive': return 'Inactif';
      case 'suspended': return 'Suspendu';
      default: return status;
    }
  }
}
