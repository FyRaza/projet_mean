import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BoutiqueOwnerService } from '../../../../shared/services/boutique-owner.service';
import { OrderService } from '../../../../shared/services/order.service';

type OrderStatus = 'delivered' | 'cancelled';

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  paymentMethod: string;
  shippingAddress: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  createdAt: Date;
  completedAt: Date;
  cancelReason?: string;
}

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Historique des commandes</h1>
          <p class="text-gray-500 dark:text-gray-400 mt-1">Consultez l'historique des commandes terminées</p>
        </div>
        <div class="flex items-center gap-3">
          <button
            (click)="exportOrders()"
            class="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exporter CSV
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ deliveredCount() }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">Livrées</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ cancelledCount() }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">Annulées</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
              <svg class="w-6 h-6 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ totalRevenue() | number:'1.0-0' }} Ar</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">Revenus totaux</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ averageOrderValue() | number:'1.0-0' }} Ar</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">Panier moyen</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Monthly Summary Chart -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Résumé mensuel</h3>
        <div class="grid grid-cols-6 gap-4">
          @for (month of monthlyStats(); track month.month) {
            <div class="text-center">
              <div class="relative h-32 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden mb-2">
                <div
                  class="absolute bottom-0 left-0 right-0 bg-green-500 dark:bg-green-600 transition-all"
                  [style.height.%]="month.deliveredPercent">
                </div>
                <div
                  class="absolute bottom-0 left-0 right-0 bg-red-400 dark:bg-red-500 transition-all"
                  [style.height.%]="month.cancelledPercent"
                  [style.bottom.%]="month.deliveredPercent">
                </div>
              </div>
              <p class="text-xs font-medium text-gray-600 dark:text-gray-400">{{ month.month }}</p>
              <p class="text-sm font-bold text-gray-900 dark:text-white">{{ month.total }}</p>
            </div>
          }
        </div>
        <div class="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded bg-green-500"></div>
            <span class="text-sm text-gray-600 dark:text-gray-400">Livrées</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded bg-red-400"></div>
            <span class="text-sm text-gray-600 dark:text-gray-400">Annulées</span>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div class="flex flex-col lg:flex-row gap-4">
          <!-- Search -->
          <div class="flex-1 relative">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Rechercher par numéro ou client..."
              class="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          <!-- Status Filter -->
          <select
            [(ngModel)]="statusFilter"
            class="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="delivered">Livrées uniquement</option>
            <option value="cancelled">Annulées uniquement</option>
          </select>

          <!-- Date Range -->
          <div class="flex items-center gap-2">
            <input
              type="date"
              [(ngModel)]="dateFrom"
              class="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <span class="text-gray-500">à</span>
            <input
              type="date"
              [(ngModel)]="dateTo"
              class="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <!-- Reset -->
          @if (hasFilters()) {
            <button
              (click)="resetFilters()"
              class="px-4 py-2.5 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              Effacer
            </button>
          }
        </div>
      </div>

      <!-- Orders Table -->
      @if (filteredOrders().length > 0) {
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Commande</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Client</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Articles</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Statut</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                @for (order of paginatedOrders(); track order.id) {
                  <tr class="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td class="px-6 py-4">
                      <div>
                        <p class="font-medium text-gray-900 dark:text-white">{{ order.orderNumber }}</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400">{{ order.paymentMethod }}</p>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <div>
                        <p class="font-medium text-gray-900 dark:text-white">{{ order.customerName }}</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400">{{ order.customerEmail }}</p>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-2">
                        <div class="flex -space-x-2">
                          @for (item of order.items.slice(0, 3); track item.id) {
                            <div class="w-8 h-8 rounded-lg border-2 border-white dark:border-gray-800 overflow-hidden">
                              <img [src]="item.productImage" [alt]="item.productName" class="w-full h-full object-cover" />
                            </div>
                          }
                          @if (order.items.length > 3) {
                            <div class="w-8 h-8 rounded-lg border-2 border-white dark:border-gray-800 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                              <span class="text-xs text-gray-600 dark:text-gray-300">+{{ order.items.length - 3 }}</span>
                            </div>
                          }
                        </div>
                        <span class="text-sm text-gray-500 dark:text-gray-400">{{ getTotalItems(order) }} articles</span>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <span class="font-medium text-gray-900 dark:text-white">{{ order.total | number:'1.0-0' }} Ar</span>
                    </td>
                    <td class="px-6 py-4">
                      <div>
                        <span [class]="getStatusBadgeClass(order.status)">
                          {{ getStatusLabel(order.status) }}
                        </span>
                        @if (order.cancelReason) {
                          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ order.cancelReason }}</p>
                        }
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <div>
                        <p class="text-sm text-gray-900 dark:text-white">{{ order.completedAt | date:'dd/MM/yyyy' }}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                          Créée le {{ order.createdAt | date:'dd/MM/yyyy' }}
                        </p>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <div class="flex items-center justify-end gap-2">
                        <a [routerLink]="['/boutique/orders', order.id]"
                           class="p-2 text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                           title="Voir détails">
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </a>
                        <button
                          (click)="printOrder(order)"
                          class="p-2 text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Imprimer">
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Affichage {{ startIndex() + 1 }} - {{ endIndex() }} sur {{ filteredOrders().length }} commandes
            </p>
            <div class="flex items-center gap-2">
              <button
                (click)="previousPage()"
                [disabled]="currentPage() === 1"
                class="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              @for (page of pages(); track page) {
                <button
                  (click)="goToPage(page)"
                  class="px-3 py-1.5 rounded-lg font-medium transition-colors"
                  [class.bg-brand-600]="currentPage() === page"
                  [class.text-white]="currentPage() === page"
                  [class.border]="currentPage() !== page"
                  [class.border-gray-300]="currentPage() !== page"
                  [class.dark:border-gray-600]="currentPage() !== page"
                  [class.text-gray-700]="currentPage() !== page"
                  [class.dark:text-gray-300]="currentPage() !== page"
                  [class.hover:bg-gray-50]="currentPage() !== page"
                  [class.dark:hover:bg-gray-700]="currentPage() !== page"
                >
                  {{ page }}
                </button>
              }
              <button
                (click)="nextPage()"
                [disabled]="currentPage() === totalPages()"
                class="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      } @else {
        <!-- Empty State -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          @if (hasFilters()) {
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Aucune commande trouvée</h3>
            <p class="text-gray-500 dark:text-gray-400 mb-6">Essayez de modifier vos critères de recherche</p>
            <button (click)="resetFilters()" class="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700">
              Réinitialiser les filtres
            </button>
          } @else {
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Aucun historique</h3>
            <p class="text-gray-500 dark:text-gray-400">Les commandes terminées apparaîtront ici</p>
          }
        </div>
      }

      <!-- Top Products Summary -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Top Selling Products -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Produits les plus vendus</h3>
          <div class="space-y-4">
            @for (product of topProducts(); track product.name; let i = $index) {
              <div class="flex items-center gap-4">
                <span class="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-sm font-bold flex items-center justify-center">
                  {{ i + 1 }}
                </span>
                <img [src]="product.image" [alt]="product.name" class="w-10 h-10 rounded-lg object-cover" />
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-gray-900 dark:text-white truncate">{{ product.name }}</p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">{{ product.quantity }} vendus</p>
                </div>
                <p class="font-semibold text-gray-900 dark:text-white">{{ product.revenue | number:'1.0-0' }} Ar</p>
              </div>
            }
          </div>
        </div>

        <!-- Top Customers -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Meilleurs clients</h3>
          <div class="space-y-4">
            @for (customer of topCustomers(); track customer.name; let i = $index) {
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-bold">
                  {{ customer.name.charAt(0) }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-gray-900 dark:text-white truncate">{{ customer.name }}</p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">{{ customer.orders }} commandes</p>
                </div>
                <p class="font-semibold text-gray-900 dark:text-white">{{ customer.total | number:'1.0-0' }} Ar</p>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Toast Notification -->
      @if (showToast()) {
        <div class="fixed bottom-6 right-6 px-6 py-4 bg-green-600 text-white rounded-lg shadow-lg flex items-center gap-3 z-50">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <span>{{ toastMessage() }}</span>
        </div>
      }
    </div>
  `
})
export class OrderHistoryComponent implements OnInit {
  private boutiqueOwnerService = inject(BoutiqueOwnerService);
  private orderService = inject(OrderService);
  private boutiqueId: string | null = null;

  searchQuery = '';
  statusFilter: 'all' | OrderStatus = 'all';
  dateFrom = '';
  dateTo = '';

  currentPage = signal(1);
  itemsPerPage = 10;

  showToast = signal(false);
  toastMessage = signal('');

  orders = signal<Order[]>([]);

  ngOnInit(): void {
    this.boutiqueOwnerService.getMyBoutique().subscribe({
      next: (boutique) => {
        this.boutiqueId = boutique?.id || null;
        if (!this.boutiqueId) return;
        this.loadOrders();
      }
    });
  }

  private loadOrders(): void {
    if (!this.boutiqueId) return;
    this.orderService.getOrders({ boutiqueId: this.boutiqueId, limit: 300, page: 1 }).subscribe({
      next: (res) => {
        const mapped = (res.orders || [])
          .filter((o) => o.status === 'delivered' || o.status === 'cancelled')
          .map((o) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            customerId: o.customerId,
            customerName: o.customerName,
            customerEmail: o.customerEmail,
            customerPhone: '',
            items: o.items.map((i) => ({
              id: i.id,
              productId: i.productId,
              productName: i.productName,
              productImage: i.productImage || '',
              quantity: i.quantity,
              price: i.unitPrice
            })),
            subtotal: o.subtotal,
            shipping: 0,
            total: o.total,
            status: o.status as OrderStatus,
            paymentMethod: o.paymentStatus || 'N/A',
            shippingAddress: o.shippingAddress || {
              street: '',
              city: '',
              postalCode: '',
              country: 'Madagascar'
            },
            createdAt: o.createdAt,
            completedAt: o.updatedAt,
            cancelReason: ''
          }));
        this.orders.set(mapped);
      },
      error: () => this.orders.set([])
    });
  }

  // Computed properties
  filteredOrders = computed(() => {
    let result = this.orders();

    // Status filter
    if (this.statusFilter !== 'all') {
      result = result.filter(o => o.status === this.statusFilter);
    }

    // Search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(o =>
        o.orderNumber.toLowerCase().includes(query) ||
        o.customerName.toLowerCase().includes(query) ||
        o.customerEmail.toLowerCase().includes(query)
      );
    }

    // Date filter
    if (this.dateFrom) {
      const from = new Date(this.dateFrom);
      result = result.filter(o => new Date(o.completedAt) >= from);
    }
    if (this.dateTo) {
      const to = new Date(this.dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter(o => new Date(o.completedAt) <= to);
    }

    // Sort by completed date (newest first)
    return [...result].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  });

  paginatedOrders = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    return this.filteredOrders().slice(start, start + this.itemsPerPage);
  });

  totalPages = computed(() => Math.ceil(this.filteredOrders().length / this.itemsPerPage));

  pages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) {
      pages.push(i);
    }

    return pages;
  });

  startIndex = computed(() => (this.currentPage() - 1) * this.itemsPerPage);

  endIndex = computed(() => Math.min(this.startIndex() + this.itemsPerPage, this.filteredOrders().length));

  deliveredCount = computed(() => this.orders().filter(o => o.status === 'delivered').length);

  cancelledCount = computed(() => this.orders().filter(o => o.status === 'cancelled').length);

  totalRevenue = computed(() =>
    this.orders()
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + o.total, 0)
  );

  averageOrderValue = computed(() => {
    const delivered = this.orders().filter(o => o.status === 'delivered');
    if (delivered.length === 0) return 0;
    return this.totalRevenue() / delivered.length;
  });

  monthlyStats = computed(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec'];
    const maxHeight = Math.max(1, ...months.map((monthName) => {
      const monthOrders = this.orders().filter((o) => months[new Date(o.completedAt).getMonth()] === monthName);
      return monthOrders.length;
    }));
    const stats = months.slice(-6).map(month => {
      const monthOrders = this.orders().filter((o) => months[new Date(o.completedAt).getMonth()] === month);
      const delivered = monthOrders.filter((o) => o.status === 'delivered').length;
      const cancelled = monthOrders.filter((o) => o.status === 'cancelled').length;
      const total = monthOrders.length;
      return {
        month,
        delivered,
        cancelled,
        total,
        deliveredPercent: (delivered / maxHeight) * 100,
        cancelledPercent: (cancelled / maxHeight) * 100
      };
    });
    return stats;
  });

  topProducts = computed(() => {
    const productMap = new Map<string, { name: string; image: string; quantity: number; revenue: number }>();

    this.orders()
      .filter(o => o.status === 'delivered')
      .forEach(order => {
        order.items.forEach(item => {
          const existing = productMap.get(item.productId) || {
            name: item.productName,
            image: item.productImage,
            quantity: 0,
            revenue: 0
          };
          existing.quantity += item.quantity;
          existing.revenue += item.price * item.quantity;
          productMap.set(item.productId, existing);
        });
      });

    return Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  });

  topCustomers = computed(() => {
    const customerMap = new Map<string, { name: string; orders: number; total: number }>();

    this.orders()
      .filter(o => o.status === 'delivered')
      .forEach(order => {
        const existing = customerMap.get(order.customerId) || {
          name: order.customerName,
          orders: 0,
          total: 0
        };
        existing.orders += 1;
        existing.total += order.total;
        customerMap.set(order.customerId, existing);
      });

    return Array.from(customerMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  });

  // Methods
  hasFilters(): boolean {
    return !!(this.searchQuery || this.statusFilter !== 'all' || this.dateFrom || this.dateTo);
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.statusFilter = 'all';
    this.dateFrom = '';
    this.dateTo = '';
    this.currentPage.set(1);
  }

  getTotalItems(order: Order): number {
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  getStatusLabel(status: OrderStatus): string {
    return status === 'delivered' ? 'Livrée' : 'Annulée';
  }

  getStatusBadgeClass(status: OrderStatus): string {
    return status === 'delivered'
      ? 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      : 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  exportOrders(): void {
    this.showNotification('Export CSV en cours de téléchargement...');
  }

  printOrder(order: Order): void {
    this.showNotification(`Impression de la commande ${order.orderNumber}...`);
  }

  showNotification(message: string): void {
    this.toastMessage.set(message);
    this.showToast.set(true);
    setTimeout(() => this.showToast.set(false), 3000);
  }
}
