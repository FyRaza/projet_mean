import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { OnInit, inject } from '@angular/core';
import { OrderService } from '../../../../shared/services/order.service';
import { Order, OrderStatus } from '../../../../core/models/order.model';
import { AuthService } from '../../../../shared/services/auth.service';

@Component({
  selector: 'app-boutique-order-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Commandes</h1>
          <p class="text-gray-500 dark:text-gray-400 mt-1">Gerez les commandes de votre boutique</p>
        </div>
        <div class="flex items-center gap-3">
          <button class="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exporter
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <svg class="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ getStatusCount('pending') }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">En attente</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ getStatusCount('delivered') }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">Livre</p>
            </div>
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
              placeholder="Rechercher par numero ou client..."
              class="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          <!-- Date Range -->
          <div class="flex items-center gap-2">
            <input
              type="date"
              [(ngModel)]="dateFrom"
              class="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <span class="text-gray-500">-</span>
            <input
              type="date"
              [(ngModel)]="dateTo"
              class="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      <!-- Status Tabs -->
      <div class="flex gap-2 overflow-x-auto pb-2">
        @for (tab of statusTabs; track tab.value) {
          <button
            (click)="statusFilter.set(tab.value)"
            [class]="statusFilter() === tab.value
              ? 'px-4 py-2 rounded-lg font-medium bg-brand-600 text-white whitespace-nowrap'
              : 'px-4 py-2 rounded-lg font-medium bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 whitespace-nowrap'"
          >
            {{ tab.label }}
            <span class="ml-2 px-2 py-0.5 text-xs rounded-full"
                  [class]="statusFilter() === tab.value ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'">
              {{ getStatusCount(tab.value) }}
            </span>
          </button>
        }
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
                @for (order of filteredOrders(); track order.id) {
                  <tr class="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td class="px-6 py-4">
                      <div>
                        <p class="font-medium text-gray-900 dark:text-white">{{ order.orderNumber }}</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400">Paiement : {{ order.paymentStatus }}</p>
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
                      <div class="flex items-center gap-2">
                        <span [class]="getStatusBadgeClass(order.status)">
                          {{ getStatusLabel(order.status) }}
                        </span>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <div>
                        <p class="text-sm text-gray-900 dark:text-white">{{ order.createdAt | date:'dd/MM/yyyy' }}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">{{ order.createdAt | date:'HH:mm' }}</p>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <div class="flex items-center justify-end gap-2">
                        <a [routerLink]="['/boutique/orders', order.id]"
                           class="p-2 text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                           title="Voir details">
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </a>
                        @if (order.status === 'pending') {
                          <button
                            (click)="confirmOrder(order)"
                            class="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                            title="Confirmer">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        }
                        @if (order.status !== 'delivered' && order.status !== 'cancelled') {
                          <button
                            (click)="showStatusMenu.set(showStatusMenu() === order.id ? null : order.id)"
                            class="p-2 text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors relative"
                            title="Changer statut">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>

                          @if (showStatusMenu() === order.id) {
                            <div class="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                              @for (status of getNextStatuses(order.status); track status.value) {
                                <button
                                  (click)="updateStatus(order, status.value)"
                                  class="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                                  {{ status.label }}
                                </button>
                              }
                              <hr class="my-1 border-gray-200 dark:border-gray-700" />
                              <button
                                (click)="updateStatus(order, 'cancelled')"
                                class="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                                Annuler la commande
                              </button>
                            </div>
                          }
                        }
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
              {{ filteredOrders().length }} commande(s)
            </p>
          </div>
        </div>
      } @else {
        <!-- Empty State -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          @if (searchQuery || statusFilter() !== 'all') {
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Aucune commande trouvee</h3>
            <p class="text-gray-500 dark:text-gray-400 mb-6">Essayez de modifier vos criteres de recherche</p>
            <button (click)="resetFilters()" class="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700">
              Reinitialiser les filtres
            </button>
          } @else {
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Aucune commande</h3>
            <p class="text-gray-500 dark:text-gray-400">Les nouvelles commandes apparaitront ici</p>
          }
        </div>
      }

      <!-- Success Toast -->
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
export class BoutiqueOrderListComponent implements OnInit {
  private orderService = inject(OrderService);
  private authService = inject(AuthService);

  searchQuery = '';
  dateFrom = '';
  dateTo = '';
  statusFilter = signal<OrderStatus | 'all'>('all');
  showStatusMenu = signal<string | null>(null);
  showToast = signal(false);
  toastMessage = signal('');

  statusTabs: { value: OrderStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'Toutes' },
    { value: 'pending', label: 'En attente' },
    { value: 'confirmed', label: 'Confirmées' },
    { value: 'shipped', label: 'Expédiées' },
    { value: 'delivered', label: 'Livrées' },
    { value: 'cancelled', label: 'Annulées' }
  ];

  orders = signal<Order[]>([]);

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    // Le filtre permet de charger par boutique, on va supposer que l'API filtre côté serveur si on le lui dit
    this.orderService.getOrders().subscribe({
      next: (res) => {
        this.orders.set(res.orders);
      },
      error: (err) => console.error(err)
    });
  }


  filteredOrders = computed(() => {
    let result = this.orders();

    // Status filter
    if (this.statusFilter() !== 'all') {
      result = result.filter(o => o.status === this.statusFilter());
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

    // Sort by date (newest first)
    result = [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return result;
  });

  getStatusCount(status: OrderStatus | 'all'): number {
    if (status === 'all') return this.orders().length;
    return this.orders().filter(o => o.status === status).length;
  }

  getTotalItems(order: Order): number {
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'pending': 'En attente',
      'confirmed': 'Confirmée',
      'shipped': 'Expédiée',
      'delivered': 'Livrée',
      'cancelled': 'Annulée'
    };
    return labels[status] || status;
  }

  getStatusBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      'pending': 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      'confirmed': 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'delivered': 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      'cancelled': 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    };
    return classes[status] || '';
  }

  getNextStatuses(currentStatus: string): { value: OrderStatus; label: string }[] {
    const workflow: Record<string, { value: OrderStatus; label: string }[]> = {
      'pending': [{ value: 'confirmed', label: 'Confirmer la commande' }],
      'confirmed': [{ value: 'shipped', label: 'Marquer comme expédiée' }],
      'shipped': [{ value: 'delivered', label: 'Marquer comme livrée' }]
    };
    return workflow[currentStatus] || [];
  }

  confirmOrder(order: Order): void {
    this.updateStatus(order, 'confirmed');
  }

  updateStatus(order: Order, newStatus: OrderStatus): void {
    this.orderService.updateOrderStatus(order.id, newStatus).subscribe({
      next: (updatedOrder) => {
        this.orders.update(orders =>
          orders.map(o => {
            if (o.id === order.id) {
              return { ...o, status: newStatus, updatedAt: new Date() };
            }
            return o;
          })
        );
        this.showStatusMenu.set(null);
        this.showNotification(`Commande ${order.orderNumber} mise à jour`);
      },
      error: (err) => {
        console.error('Erreur', err);
        alert('Impossible de mettre à jour le statut.');
      }
    });
  }

  showNotification(message: string): void {
    this.toastMessage.set(message);
    this.showToast.set(true);
    setTimeout(() => this.showToast.set(false), 3000);
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.statusFilter.set('all');
  }
}
