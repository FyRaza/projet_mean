import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../shared/services/admin.service';
import { Box, BoxStatus } from '../../../../core/models';
import { Boutique } from '../../../../core/models';

@Component({
  selector: 'app-box-assignment',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="flex items-center gap-3">
          <a routerLink="/admin/boxes" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </a>
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Attribution des Emplacements</h1>
            <p class="text-gray-500 dark:text-gray-400 mt-1">Associez les boutiques aux emplacements disponibles</p>
          </div>
        </div>
      </div>

      <!-- Stats Summary -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
              <svg class="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ availableBoxes.length }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Boxes disponibles</p>
            </div>
          </div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
              <svg class="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ reservedBoxes.length }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Boxes réservés</p>
            </div>
          </div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"/>
              </svg>
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ unassignedBoutiques.length }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Boutiques sans box</p>
            </div>
          </div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
              <svg class="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ pendingBoutiques.length }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">En attente validation</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Available Boxes -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div class="p-6 border-b border-gray-100 dark:border-gray-700">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Emplacements disponibles</h2>
              <div class="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
                @for (zone of ['Tous', 'A', 'B', 'C']; track zone) {
                  <button
                    (click)="filterZone = zone === 'Tous' ? '' : zone"
                    class="px-3 py-1.5 text-sm rounded-lg transition-all"
                    [class]="(filterZone === '' && zone === 'Tous') || filterZone === zone ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'"
                  >
                    {{ zone }}
                  </button>
                }
              </div>
            </div>
          </div>
          <div class="p-6 max-h-[500px] overflow-y-auto">
            @if (filteredAvailableBoxes.length === 0) {
              <div class="text-center py-8">
                <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                  </svg>
                </div>
                <p class="text-gray-500 dark:text-gray-400">Aucun emplacement disponible</p>
              </div>
            } @else {
              <div class="space-y-3">
                @for (box of filteredAvailableBoxes; track box.id) {
                  <div
                    class="p-4 rounded-xl border-2 transition-all cursor-pointer"
                    [class]="selectedBox?.id === box.id ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-gray-100 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-700'"
                    (click)="selectBox(box)"
                  >
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-3">
                        <div class="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm"
                          [class]="box.zone === 'A' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                                   box.zone === 'B' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' :
                                   'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'"
                        >
                          {{ box.code }}
                        </div>
                        <div>
                          <p class="font-medium text-gray-900 dark:text-white">{{ box.name }}</p>
                          <p class="text-sm text-gray-500 dark:text-gray-400">{{ box.area }} m²</p>
                        </div>
                      </div>
                      <div class="flex items-center gap-2">
                        @if (box.status === 'reserved') {
                          <span class="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">Réservé</span>
                        }
                        @if (selectedBox?.id === box.id) {
                          <div class="w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center">
                            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                            </svg>
                          </div>
                        }
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <!-- Boutiques Without Box -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div class="p-6 border-b border-gray-100 dark:border-gray-700">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Boutiques à attribuer</h2>
              <span class="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                {{ unassignedBoutiques.length }} en attente
              </span>
            </div>
          </div>
          <div class="p-6 max-h-[500px] overflow-y-auto">
            @if (unassignedBoutiques.length === 0) {
              <div class="text-center py-8">
                <div class="w-16 h-16 mx-auto mb-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                  <svg class="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <p class="text-gray-500 dark:text-gray-400">Toutes les boutiques ont un emplacement</p>
              </div>
            } @else {
              <div class="space-y-3">
                @for (boutique of unassignedBoutiques; track boutique.id) {
                  <div
                    class="p-4 rounded-xl border-2 transition-all cursor-pointer"
                    [class]="selectedBoutique?.id === boutique.id ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-gray-100 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-700'"
                    (click)="selectBoutique(boutique)"
                  >
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-3">
                        <img [src]="boutique.logo" [alt]="boutique.name" class="w-12 h-12 rounded-xl object-cover bg-gray-100 dark:bg-gray-700" />
                        <div>
                          <p class="font-medium text-gray-900 dark:text-white">{{ boutique.name }}</p>
                          <p class="text-sm text-gray-500 dark:text-gray-400">{{ boutique.contactEmail }}</p>
                        </div>
                      </div>
                      <div class="flex items-center gap-2">
                        @if (boutique.status === 'pending') {
                          <span class="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">En attente</span>
                        } @else {
                          <span class="px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">Active</span>
                        }
                        @if (selectedBoutique?.id === boutique.id) {
                          <div class="w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center">
                            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                            </svg>
                          </div>
                        }
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Assignment Action -->
      @if (selectedBox && selectedBoutique) {
        <div class="bg-gradient-to-r from-brand-500 to-purple-600 rounded-2xl p-6 text-white">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div class="flex items-center gap-4">
              <div class="flex items-center -space-x-2">
                <div class="w-14 h-14 rounded-xl flex items-center justify-center bg-white/20 backdrop-blur font-bold text-lg">
                  {{ selectedBox.code }}
                </div>
                <div class="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                  <svg class="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                  </svg>
                </div>
                <img [src]="selectedBoutique.logo" [alt]="selectedBoutique.name" class="w-14 h-14 rounded-xl object-cover border-2 border-white" />
              </div>
              <div>
                <p class="text-lg font-semibold">Attribuer l'emplacement</p>
                <p class="text-white/80">{{ selectedBox.name }} → {{ selectedBoutique.name }}</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <button
                (click)="clearSelection()"
                class="px-4 py-2.5 bg-white/20 backdrop-blur text-white rounded-xl hover:bg-white/30 transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                (click)="assignBox()"
                [disabled]="assigning"
                class="px-6 py-2.5 bg-white text-brand-600 rounded-xl hover:bg-gray-100 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
              >
                @if (assigning) {
                  <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                } @else {
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                }
                Confirmer l'attribution
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Currently Assigned Boxes -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div class="p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Attributions actuelles</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-gray-50 dark:bg-gray-700/50">
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Emplacement</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Boutique</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Surface</th>
                <th class="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              @for (box of occupiedBoxes; track box.id) {
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm"
                        [class]="box.zone === 'A' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                                 box.zone === 'B' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' :
                                 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'"
                      >
                        {{ box.code }}
                      </div>
                      <div>
                        <p class="font-medium text-gray-900 dark:text-white">{{ box.name }}</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400">Zone {{ box.zone }} · Étage {{ box.floor === 0 ? 'RDC' : box.floor }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <p class="font-medium text-gray-900 dark:text-white">{{ box.boutiqueName }}</p>
                  </td>
                  <td class="px-6 py-4">
                    <span class="text-gray-600 dark:text-gray-300">{{ box.area }} m²</span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <button
                      (click)="unassignBox(box)"
                      class="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      Retirer
                    </button>
                  </td>
                </tr>
              }
              @if (occupiedBoxes.length === 0) {
                <tr>
                  <td colspan="4" class="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    Aucune attribution pour le moment
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Success Toast -->
      @if (showSuccessToast) {
        <div class="fixed bottom-6 right-6 z-[60] animate-slide-up">
          <div class="bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span class="font-medium">{{ toastMessage }}</span>
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
export class BoxAssignmentComponent implements OnInit {
  private adminService = inject(AdminService);

  boxes: Box[] = [];
  boutiques: Boutique[] = [];
  selectedBox: Box | null = null;
  selectedBoutique: Boutique | null = null;
  filterZone = '';
  assigning = false;
  showSuccessToast = false;
  toastMessage = '';

  get availableBoxes(): Box[] {
    return this.boxes.filter(b => b.status === 'available' || b.status === 'reserved');
  }

  get filteredAvailableBoxes(): Box[] {
    let boxes = this.availableBoxes;
    if (this.filterZone) {
      boxes = boxes.filter(b => b.zone === this.filterZone);
    }
    return boxes;
  }

  get reservedBoxes(): Box[] {
    return this.boxes.filter(b => b.status === 'reserved');
  }

  get occupiedBoxes(): Box[] {
    return this.boxes.filter(b => b.status === 'occupied');
  }

  get unassignedBoutiques(): Boutique[] {
    const assignedBoutiqueIds = new Set(
      this.occupiedBoxes
        .map((box) => box.boutiqueId)
        .filter((id): id is string => !!id)
    );
    return this.boutiques.filter((b) => b.status === 'active' && !assignedBoutiqueIds.has(b.id));
  }

  get pendingBoutiques(): Boutique[] {
    return this.boutiques.filter(b => b.status === 'pending');
  }

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.adminService.getBoxes().subscribe(boxes => this.boxes = boxes);
    this.adminService.getBoutiques().subscribe(boutiques => this.boutiques = boutiques);
  }

  selectBox(box: Box): void {
    this.selectedBox = this.selectedBox?.id === box.id ? null : box;
  }

  selectBoutique(boutique: Boutique): void {
    this.selectedBoutique = this.selectedBoutique?.id === boutique.id ? null : boutique;
  }

  clearSelection(): void {
    this.selectedBox = null;
    this.selectedBoutique = null;
  }

  assignBox(): void {
    if (!this.selectedBox || !this.selectedBoutique) return;

    this.assigning = true;
    this.adminService.assignBox(this.selectedBox.id, this.selectedBoutique.id, this.selectedBoutique.name)
      .subscribe(() => {
        this.toastMessage = `${this.selectedBox!.name} attribué à ${this.selectedBoutique!.name}`;
        this.showToast();
        this.clearSelection();
        this.loadData();
        this.assigning = false;
      });
  }

  unassignBox(box: Box): void {
    if (confirm(`Retirer ${box.boutiqueName} de l'emplacement ${box.name} ?`)) {
      this.adminService.unassignBox(box.id).subscribe(() => {
        this.toastMessage = `Emplacement ${box.name} libéré`;
        this.showToast();
        this.loadData();
      });
    }
  }

  private showToast(): void {
    this.showSuccessToast = true;
    setTimeout(() => this.showSuccessToast = false, 3000);
  }
}
