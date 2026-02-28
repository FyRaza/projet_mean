import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { PosService } from '../../../shared/services/pos.service';
import { BoutiqueOwnerService } from '../../../shared/services/boutique-owner.service';
import { PosSale, PosStats, PosFilters } from '../../../core/models/pos.model';

@Component({
  selector: 'app-pos-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <svg class="w-7 h-7 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Historique des ventes
          </h1>
          <p class="text-gray-500 dark:text-gray-400">Consultez toutes les ventes effectuées en caisse</p>
        </div>
        <a routerLink="/boutique/pos" class="px-4 py-2 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition-colors flex items-center gap-2 w-fit">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Nouvelle vente
        </a>
      </div>

      <!-- Stats Cards -->
      @if (stats()) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <p class="text-sm text-gray-500 dark:text-gray-400">Ventes totales</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">{{ stats()!.totalSales }}</p>
          </div>
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <p class="text-sm text-gray-500 dark:text-gray-400">Chiffre d'affaires</p>
            <p class="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{{ formatPrice(stats()!.totalRevenue) }}</p>
          </div>
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <p class="text-sm text-gray-500 dark:text-gray-400">Panier moyen</p>
            <p class="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{{ formatPrice(stats()!.averageTicket) }}</p>
          </div>
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <p class="text-sm text-gray-500 dark:text-gray-400">Ventes aujourd'hui</p>
            <p class="text-2xl font-bold text-brand-600 dark:text-brand-400 mt-1">{{ stats()!.todaySales }}</p>
            <p class="text-xs text-gray-400 mt-1">{{ formatPrice(stats()!.todayRevenue) }}</p>
          </div>
        </div>
      }

      <!-- Filters -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Date début</label>
            <input type="date" [(ngModel)]="filterDateFrom" (change)="loadSales()"
              class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Date fin</label>
            <input type="date" [(ngModel)]="filterDateTo" (change)="loadSales()"
              class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Paiement</label>
            <select [(ngModel)]="filterPaymentMethod" (change)="loadSales()"
              class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
              <option value="">Tous</option>
              <option value="cash">Espèces</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="card">Carte</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Recherche</label>
            <input type="text" [(ngModel)]="filterSearch" (input)="onSearchInput()" placeholder="Nom client..."
              class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
          </div>
        </div>
      </div>

      <!-- Sales Table -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-gray-50 dark:bg-gray-700/50">
                <th class="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Date</th>
                <th class="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">N° Vente</th>
                <th class="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Client</th>
                <th class="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Articles</th>
                <th class="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Total</th>
                <th class="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Paiement</th>
                <th class="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Statut</th>
                <th class="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              @for (sale of sales(); track sale._id) {
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td class="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    {{ sale.createdAt | date:'dd/MM/yy HH:mm' }}
                  </td>
                  <td class="px-4 py-3">
                    <span class="font-mono text-xs text-gray-500 dark:text-gray-400">{{ sale._id.slice(-8).toUpperCase() }}</span>
                  </td>
                  <td class="px-4 py-3 text-gray-900 dark:text-white">
                    @if (sale.user) {
                      {{ sale.user.firstName }} {{ sale.user.lastName }}
                    } @else if (sale.customerName) {
                      {{ sale.customerName }}
                    } @else {
                      <span class="text-gray-400 italic">Anonyme</span>
                    }
                  </td>
                  <td class="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {{ sale.items.length }} article(s)
                  </td>
                  <td class="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                    {{ formatPrice(sale.totalAmount) }}
                  </td>
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                      [class]="getPaymentBadgeClass(sale.paymentMethod)">
                      {{ getPaymentMethodLabel(sale.paymentMethod) }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                      [class]="getStatusBadgeClass(sale.status)">
                      {{ getStatusLabel(sale.status) }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                      <button (click)="viewDetails(sale)" class="text-brand-600 dark:text-brand-400 hover:underline text-xs">
                        Détails
                      </button>
                      @if (sale.status !== 'cancelled') {
                        <button (click)="voidSale(sale)" class="text-red-500 hover:text-red-700 text-xs">
                          Annuler
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="8" class="px-4 py-12 text-center text-gray-400">
                    Aucune vente trouvée
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        @if (totalPages() > 1) {
          <div class="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <span class="text-sm text-gray-500 dark:text-gray-400">
              Page {{ currentPage() }} / {{ totalPages() }} — {{ totalItems() }} ventes
            </span>
            <div class="flex gap-2">
              <button (click)="goToPage(currentPage() - 1)" [disabled]="currentPage() <= 1"
                class="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
                Précédent
              </button>
              <button (click)="goToPage(currentPage() + 1)" [disabled]="currentPage() >= totalPages()"
                class="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
                Suivant
              </button>
            </div>
          </div>
        }
      </div>
    </div>

    <!-- Sale Detail Modal -->
    @if (selectedSale()) {
      <div class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" (click)="selectedSale.set(null)">
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 max-h-[80vh] overflow-y-auto" (click)="$event.stopPropagation()">
          <div class="text-center mb-4">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">Détail de la vente</h3>
            <p class="text-xs text-gray-400">N° {{ selectedSale()!._id.slice(-8).toUpperCase() }}</p>
            <p class="text-xs text-gray-400">{{ selectedSale()!.createdAt | date:'dd/MM/yyyy HH:mm:ss' }}</p>
          </div>

          @if (selectedSale()!.customerName || selectedSale()!.user) {
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Client:
              @if (selectedSale()!.user) {
                {{ selectedSale()!.user!.firstName }} {{ selectedSale()!.user!.lastName }} ({{ selectedSale()!.user!.email }})
              } @else {
                {{ selectedSale()!.customerName }}
              }
            </p>
          }

          <div class="space-y-2 mb-4">
            @for (item of selectedSale()!.items; track $index) {
              <div class="flex justify-between text-sm py-1 border-b border-gray-100 dark:border-gray-700">
                <div>
                  <span class="text-gray-900 dark:text-white">{{ item.name }}</span>
                  <span class="text-gray-500 ml-1">x{{ item.quantity }}</span>
                  <span class="text-gray-400 ml-1 text-xs">({{ formatPrice(item.price) }}/u)</span>
                </div>
                <span class="font-medium text-gray-900 dark:text-white">{{ formatPrice(item.price * item.quantity) }}</span>
              </div>
            }
          </div>

          <div class="flex justify-between items-center mb-4 text-lg font-bold">
            <span class="text-gray-900 dark:text-white">TOTAL</span>
            <span class="text-brand-600 dark:text-brand-400">{{ formatPrice(selectedSale()!.totalAmount) }}</span>
          </div>

          <div class="text-sm text-gray-500 dark:text-gray-400 space-y-1 mb-4">
            <p>Paiement: {{ getPaymentMethodLabel(selectedSale()!.paymentMethod) }}</p>
            <p>Statut: {{ getStatusLabel(selectedSale()!.status) }}</p>
            @if (selectedSale()!.cashierId) {
              <p>Caissier: {{ selectedSale()!.cashierId!.firstName }} {{ selectedSale()!.cashierId!.lastName }}</p>
            }
            @if (selectedSale()!.notes) {
              <p>Notes: {{ selectedSale()!.notes }}</p>
            }
          </div>

          <button (click)="selectedSale.set(null)"
            class="w-full py-2 border border-gray-300 dark:border-gray-600 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
            Fermer
          </button>
        </div>
      </div>
    }
  `
})
export class PosHistoryComponent implements OnInit {
  private posService = inject(PosService);
  private boutiqueOwnerService = inject(BoutiqueOwnerService);

  boutiqueId = '';
  sales = signal<PosSale[]>([]);
  stats = signal<PosStats | null>(null);
  selectedSale = signal<PosSale | null>(null);

  currentPage = signal(1);
  totalPages = signal(1);
  totalItems = signal(0);

  filterDateFrom = '';
  filterDateTo = '';
  filterPaymentMethod = '';
  filterSearch = '';

  private searchTimeout: any;

  ngOnInit(): void {
    this.boutiqueOwnerService.getMyBoutique().subscribe({
      next: (boutique) => {
        if (boutique) {
          this.boutiqueId = boutique.id;
          this.loadSales();
          this.loadStats();
        }
      }
    });
  }

  loadSales(): void {
    if (!this.boutiqueId) return;

    const filters: PosFilters = {
      boutiqueId: this.boutiqueId,
      page: this.currentPage(),
      limit: 20,
      dateFrom: this.filterDateFrom || undefined,
      dateTo: this.filterDateTo || undefined,
      paymentMethod: this.filterPaymentMethod || undefined,
      search: this.filterSearch || undefined
    };

    this.posService.getPosSales(filters).subscribe({
      next: (result) => {
        this.sales.set(result.orders);
        this.totalPages.set(result.pages);
        this.totalItems.set(result.total);
      }
    });
  }

  loadStats(): void {
    if (!this.boutiqueId) return;
    this.posService.getPosStats(this.boutiqueId, this.filterDateFrom, this.filterDateTo).subscribe({
      next: (stats) => this.stats.set(stats)
    });
  }

  onSearchInput(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.loadSales(), 400);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadSales();
  }

  viewDetails(sale: PosSale): void {
    this.selectedSale.set(sale);
  }

  voidSale(sale: PosSale): void {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette vente ? Le stock sera restauré.')) return;

    this.posService.voidPosSale(sale._id).subscribe({
      next: () => {
        this.loadSales();
        this.loadStats();
      },
      error: (err) => {
        alert(err?.error?.message || 'Erreur lors de l\'annulation');
      }
    });
  }

  formatPrice(amount: number): string {
    return amount.toLocaleString('fr-FR') + ' Ar';
  }

  getPaymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      cash: 'Espèces',
      mobile_money: 'Mobile Money',
      card: 'Carte'
    };
    return labels[method] || method;
  }

  getPaymentBadgeClass(method: string): string {
    const classes: Record<string, string> = {
      cash: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      mobile_money: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      card: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
    };
    return classes[method] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      delivered: 'Complétée',
      cancelled: 'Annulée',
      pending: 'En attente'
    };
    return labels[status] || status;
  }

  getStatusBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    };
    return classes[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
}


