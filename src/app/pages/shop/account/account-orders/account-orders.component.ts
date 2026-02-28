import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderService } from '../../../../shared/services/order.service';
import { Order, OrderStatus } from '../../../../core/models/order.model';
import { firstValueFrom } from 'rxjs';
import { CartService } from '../../../../shared/services/cart.service';
import { ProductService } from '../../../../shared/services/product.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-account-orders',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Mes Commandes</h1>
          <p class="text-gray-500 dark:text-gray-400 mt-1">Suivez vos commandes et consultez l'historique</p>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        @for (tab of statusTabs; track tab.value) {
          <button
            type="button"
            (click)="filterByStatus(tab.value)"
            class="px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors"
            [class]="activeFilter() === tab.value
              ? 'bg-brand-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'"
          >
            {{ tab.label }}
            @if (tab.value === null) {
              <span class="ml-1 px-1.5 py-0.5 text-xs rounded-full"
                [class]="activeFilter() === tab.value ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-600'">
                {{ orders().length }}
              </span>
            }
          </button>
        }
      </div>

      <!-- Orders List -->
      @if (filteredOrders().length > 0) {
        <div class="space-y-6">
          @for (order of filteredOrders(); track order.id) {
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <!-- Order Header -->
              <div class="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600 flex flex-wrap items-center justify-between gap-4">
                <div class="flex items-center gap-4">
                  <div>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Commande</p>
                    <p class="font-semibold text-gray-900 dark:text-white">{{ order.orderNumber }}</p>
                  </div>
                  <div class="hidden sm:block border-l border-gray-300 dark:border-gray-600 pl-4">
                    <p class="text-sm text-gray-500 dark:text-gray-400">Date</p>
                    <p class="font-medium text-gray-900 dark:text-white">{{ order.createdAt | date:'dd MMM yyyy' }}</p>
                  </div>
                  <div class="hidden md:block border-l border-gray-300 dark:border-gray-600 pl-4">
                    <p class="text-sm text-gray-500 dark:text-gray-400">Boutique</p>
                    <a [routerLink]="['/boutiques', order.boutiqueId]" class="font-medium text-brand-600 dark:text-brand-400 hover:underline">
                      {{ order.boutiqueName }}
                    </a>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <span [class]="getStatusClasses(order.status)">
                    {{ getStatusLabel(order.status) }}
                  </span>
                </div>
              </div>

              <!-- Order Items -->
              <div class="p-6">
                <div class="space-y-4">
                  @for (item of order.items; track item.id) {
                    <div class="flex items-center gap-4">
                      <div class="w-16 h-16 flex-shrink-0 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden">
                        @if (item.productImage) {
                          <img [src]="item.productImage" [alt]="item.productName" class="w-full h-full object-cover" />
                        } @else {
                          <div class="w-full h-full flex items-center justify-center">
                            <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        }
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="font-medium text-gray-900 dark:text-white truncate">{{ item.productName }}</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                          {{ item.quantity }} x {{ item.unitPrice | number:'1.2-2' }} Ar
                        </p>
                      </div>
                      <div class="text-right">
                        <p class="font-medium text-gray-900 dark:text-white">{{ item.totalPrice | number:'1.2-2' }} Ar</p>
                      </div>
                    </div>
                  }
                </div>

                <!-- Order Summary -->
                <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div class="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
                    <span>Sous-total</span>
                    <span>{{ order.subtotal | number:'1.2-2' }} Ar</span>
                  </div>
                  <div class="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
                    <span>TVA (20%)</span>
                    <span>{{ order.tax | number:'1.2-2' }} Ar</span>
                  </div>
                  <div class="flex justify-between text-lg font-bold text-gray-900 dark:text-white">
                    <span>Total</span>
                    <span>{{ order.total | number:'1.2-2' }} Ar</span>
                  </div>
                </div>

                <!-- Actions -->
                <div class="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    (click)="viewOrderDetails(order)"
                    class="px-4 py-2 text-sm font-medium text-brand-600 dark:text-brand-400 border border-brand-600 dark:border-brand-400 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                  >
                    Voir les details
                  </button>
                  @if (order.status === 'delivered') {
                    <button
                      type="button"
                      (click)="reorder(order)"
                      class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Commander a nouveau
                    </button>
                  }
                  @if (order.status === 'pending') {
                    <button
                      type="button"
                      (click)="cancelOrder(order)"
                      class="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-300 dark:border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      Annuler
                    </button>
                  }
                </div>
              </div>

              <!-- Order Timeline (for in-progress orders) -->
              @if (order.status !== 'delivered' && order.status !== 'cancelled') {
                <div class="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600">
                  <div class="flex items-center gap-4">
                    @for (step of orderSteps; track step.status; let i = $index; let last = $last) {
                      <div class="flex items-center gap-2" [class.flex-1]="!last">
                        <div
                          class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                          [class]="isStepComplete(order.status, step.status)
                            ? 'bg-brand-600 text-white'
                            : isStepCurrent(order.status, step.status)
                            ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 ring-2 ring-brand-600'
                            : 'bg-gray-200 dark:bg-gray-600 text-gray-400'"
                        >
                          @if (isStepComplete(order.status, step.status)) {
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                            </svg>
                          } @else {
                            <span class="text-sm font-medium">{{ i + 1 }}</span>
                          }
                        </div>
                        <span class="text-sm hidden sm:block"
                          [class]="isStepComplete(order.status, step.status) || isStepCurrent(order.status, step.status)
                            ? 'text-gray-900 dark:text-white font-medium'
                            : 'text-gray-500 dark:text-gray-400'">
                          {{ step.label }}
                        </span>
                        @if (!last) {
                          <div class="flex-1 h-0.5 mx-2"
                            [class]="isStepComplete(order.status, step.status)
                              ? 'bg-brand-600'
                              : 'bg-gray-200 dark:bg-gray-600'">
                          </div>
                        }
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>
      } @else {
        <!-- Empty State -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div class="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          @if (activeFilter()) {
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Aucune commande trouvee</h2>
            <p class="text-gray-500 dark:text-gray-400 mb-6">Aucune commande avec ce statut</p>
            <button
              type="button"
              (click)="filterByStatus(null)"
              class="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition-colors"
            >
              Voir toutes les commandes
            </button>
          } @else {
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Aucune commande</h2>
            <p class="text-gray-500 dark:text-gray-400 mb-6">Vous n'avez pas encore passe de commande</p>
            <a
              routerLink="/products"
              class="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition-colors"
            >
              Decouvrir les produits
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          }
        </div>
      }

      @if (selectedOrder(); as detail) {
        <div class="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50" (click)="closeOrderDetails()">
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto" (click)="$event.stopPropagation()">
            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Commande {{ detail.orderNumber }}</h3>
              <button type="button" (click)="closeOrderDetails()" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div class="p-6 space-y-4">
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div><p class="text-gray-500 dark:text-gray-400">Statut</p><p class="font-medium text-gray-900 dark:text-white">{{ getStatusLabel(detail.status) }}</p></div>
                <div><p class="text-gray-500 dark:text-gray-400">Paiement</p><p class="font-medium text-gray-900 dark:text-white">{{ detail.paymentStatus }}</p></div>
                <div><p class="text-gray-500 dark:text-gray-400">Date</p><p class="font-medium text-gray-900 dark:text-white">{{ detail.createdAt | date:'dd/MM/yyyy HH:mm' }}</p></div>
                <div><p class="text-gray-500 dark:text-gray-400">Total</p><p class="font-medium text-gray-900 dark:text-white">{{ detail.total | number:'1.2-2' }} Ar</p></div>
              </div>
              <div class="pt-2 border-t border-gray-200 dark:border-gray-700">
                <h4 class="font-semibold text-gray-900 dark:text-white mb-3">Articles</h4>
                <div class="space-y-3">
                  @for (item of detail.items; track item.id) {
                    <div class="flex items-center justify-between text-sm">
                      <p class="text-gray-700 dark:text-gray-300">{{ item.productName }} x{{ item.quantity }}</p>
                      <p class="font-medium text-gray-900 dark:text-white">{{ item.totalPrice | number:'1.2-2' }} Ar</p>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class AccountOrdersComponent implements OnInit {
  private orderService = inject(OrderService);
  private cartService = inject(CartService);
  private productService = inject(ProductService);
  private router = inject(Router);

  orders = signal<Order[]>([]);
  activeFilter = signal<OrderStatus | null>(null);
  selectedOrder = signal<Order | null>(null);

  statusTabs: { label: string; value: OrderStatus | null }[] = [
    { label: 'Toutes', value: null },
    { label: 'En attente', value: 'pending' },
    { label: 'Confirmées', value: 'confirmed' },
    { label: 'Expédiées', value: 'shipped' },
    { label: 'Livrées', value: 'delivered' },
    { label: 'Annulées', value: 'cancelled' },
    { label: 'Remboursées', value: 'refunded' }
  ];

  orderSteps = [
    { status: 'pending', label: 'En attente' },
    { status: 'confirmed', label: 'Confirmée' },
    { status: 'shipped', label: 'Expédiée' },
    { status: 'delivered', label: 'Livrée' }
  ];

  private statusOrder: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded'];

  ngOnInit(): void {
    this.loadOrders();
  }

  private async loadOrders(): Promise<void> {
    try {
      const allOrders: Order[] = [];
      let page = 1;
      let pages = 1;
      const limit = 100;

      do {
        const res = await firstValueFrom(this.orderService.getOrders({ page, limit }));
        allOrders.push(...(res.orders || []));
        pages = res.pages || 1;
        page += 1;
      } while (page <= pages);

      this.orders.set(allOrders);
    } catch (err) {
      console.error('Erreur lors du chargement des commandes', err);
      this.orders.set([]);
    }
  }

  filteredOrders = () => {
    const filter = this.activeFilter();
    if (!filter) return this.orders();
    return this.orders().filter(order => order.status === filter);
  };

  filterByStatus(status: OrderStatus | null): void {
    this.activeFilter.set(status);
  }

  getStatusLabel(status: OrderStatus): string {
    const labels: Record<OrderStatus, string> = {
      pending: 'En attente',
      confirmed: 'Confirmée',
      shipped: 'Expédiée',
      delivered: 'Livrée',
      cancelled: 'Annulée',
      refunded: 'Remboursée'
    };
    return labels[status] || status;
  }

  getStatusClasses(status: OrderStatus): string {
    const baseClasses = 'px-3 py-1 text-sm font-medium rounded-full';
    const statusClasses: Record<OrderStatus, string> = {
      pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
      confirmed: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      shipped: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
      delivered: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
      refunded: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
    };
    return `${baseClasses} ${statusClasses[status] || ''}`;
  }

  isStepComplete(currentStatus: OrderStatus, stepStatus: string): boolean {
    if (currentStatus === 'cancelled') return false;
    const currentIndex = this.statusOrder.indexOf(currentStatus);
    const stepIndex = this.statusOrder.indexOf(stepStatus as OrderStatus);
    return stepIndex < currentIndex;
  }

  isStepCurrent(currentStatus: OrderStatus, stepStatus: string): boolean {
    return currentStatus === stepStatus;
  }

  viewOrderDetails(order: Order): void {
    this.orderService.getOrderById(order.id).subscribe({
      next: (details) => this.selectedOrder.set(details),
      error: () => this.selectedOrder.set(order)
    });
  }

  closeOrderDetails(): void {
    this.selectedOrder.set(null);
  }

  cancelOrder(order: Order): void {
    // Vérifier que le statut est bien "pending"
    if (order.status !== 'pending') {
      alert('Impossible d\'annuler cette commande. Seules les commandes en attente peuvent être annulées.');
      return;
    }

    if (confirm('Voulez-vous vraiment annuler cette commande ?')) {
      this.orderService.cancelOrder(order.id).subscribe({
        next: (updatedOrder) => {
          const updatedOrders = this.orders().map(o =>
            o.id === order.id ? updatedOrder : o
          );
          this.orders.set(updatedOrders);
          alert('Commande annulée avec succès.');
        },
        error: (err) => {
          console.error(`Erreur lors de l'annulation`, err);
          const errorMessage = err.error?.message || 'Impossible d\'annuler la commande. Veuillez réessayer.';
          alert(errorMessage);
        }
      });
    }
  }

  async reorder(order: Order): Promise<void> {
    try {
      for (const item of order.items) {
        const product = await firstValueFrom(this.productService.getProductById(item.productId));
        if (product && product.stock > 0) {
          await firstValueFrom(this.cartService.addToCart(product as any, product.boutiqueName || order.boutiqueName, item.quantity));
        }
      }
      this.router.navigate(['/cart']);
    } catch (err) {
      console.error('Erreur lors de la recomposition du panier', err);
      alert('Impossible de commander a nouveau pour le moment.');
    }
  }
}
