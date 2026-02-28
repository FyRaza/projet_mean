import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { BoutiqueOwnerService } from '../../../shared/services/boutique-owner.service';
import { OrderService } from '../../../shared/services/order.service';

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  totalProducts: number;
  activeProducts: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  items: number;
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: Date;
}

interface TopProduct {
  id: string;
  name: string;
  image: string;
  sales: number;
  stock: number;
}

@Component({
  selector: 'app-boutique-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Tableau de bord</h1>
          <p class="text-gray-500 dark:text-gray-400">Bienvenue dans votre espace boutique</p>
        </div>
        <div class="flex items-center gap-3">
          <a
            routerLink="/boutique/products/new"
            class="px-4 py-2 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition-colors flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Nouveau produit
          </a>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Pending Orders -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Commandes en attente</p>
              <p class="text-3xl font-bold text-gray-900 dark:text-white">{{ stats().pendingOrders }}</p>
            </div>
            <div class="w-12 h-12 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <svg class="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <a routerLink="/boutique/orders" class="mt-4 text-sm text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1">
            Voir les commandes
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        <!-- Total Orders -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Total commandes</p>
              <p class="text-3xl font-bold text-gray-900 dark:text-white">{{ stats().totalOrders }}</p>
            </div>
            <div class="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">
            <span class="text-green-600 dark:text-green-400">+12%</span> ce mois
          </p>
        </div>

        <!-- Products -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Produits actifs</p>
              <p class="text-3xl font-bold text-gray-900 dark:text-white">{{ stats().activeProducts }}</p>
            </div>
            <div class="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
          <a routerLink="/boutique/products" class="mt-4 text-sm text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1">
            Gerer les produits
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
        
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Recent Orders -->
        <div class="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Commandes recentes</h2>
            <a routerLink="/boutique/orders" class="text-sm text-brand-600 dark:text-brand-400 hover:underline">
              Voir tout
            </a>
          </div>
          <div class="divide-y divide-gray-200 dark:divide-gray-700">
            @for (order of recentOrders(); track order.id) {
              <div class="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-3">
                    <span class="font-medium text-gray-900 dark:text-white">{{ order.orderNumber }}</span>
                    <span [class]="getStatusClasses(order.status)">
                      {{ getStatusLabel(order.status) }}
                    </span>
                  </div>
                  <span class="text-sm text-gray-500 dark:text-gray-400">
                    {{ order.createdAt | date:'dd/MM HH:mm' }}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <div class="text-sm text-gray-600 dark:text-gray-400">
                    <span>{{ order.customerName }}</span>
                    <span class="mx-2">•</span>
                    <span>{{ order.items }} article(s)</span>
                  </div>
                  <span class="font-semibold text-gray-900 dark:text-white">
                    {{ order.total | number:'1.0-0' }} Ar
                  </span>
                </div>
                <div class="mt-2 flex items-center gap-2">
                  <a
                    [routerLink]="['/boutique/orders', order.id]"
                    class="text-sm text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    Voir details
                  </a>
                  @if (order.status === 'pending') {
                    <span class="text-gray-300 dark:text-gray-600">|</span>
                    <button
                      type="button"
                      (click)="confirmOrder(order.id)"
                      class="text-sm text-green-600 dark:text-green-400 hover:underline"
                    >
                      Confirmer
                    </button>
                  }
                </div>
              </div>
            } @empty {
              <div class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                Aucune commande recente
              </div>
            }
          </div>
        </div>

        <!-- Top Products -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Meilleurs Ventes</h2>
            <a routerLink="/boutique/products" class="text-sm text-brand-600 dark:text-brand-400 hover:underline">
              Voir tout
            </a>
          </div>
          <div class="divide-y divide-gray-200 dark:divide-gray-700">
            @for (product of topProducts(); track product.id; let i = $index) {
              <div class="px-6 py-4 flex items-center gap-4">
                <span class="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-400">
                  {{ i + 1 }}
                </span>
                <div class="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                  <img [src]="product.image" [alt]="product.name" class="w-full h-full object-cover" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-gray-900 dark:text-white truncate">{{ product.name }}</p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">{{ product.sales }} ventes</p>
                </div>
                <div class="text-right">
                  @if (product.stock <= 5) {
                    <span class="text-xs text-orange-600 dark:text-orange-400">Stock: {{ product.stock }}</span>
                  } @else {
                    <span class="text-xs text-gray-500 dark:text-gray-400">Stock: {{ product.stock }}</span>
                  }
                </div>
              </div>
            } @empty {
              <div class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                Aucun produit
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <a
          routerLink="/boutique/products/new"
          class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:border-brand-300 dark:hover:border-brand-600 transition-colors group"
        >
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center group-hover:bg-brand-200 dark:group-hover:bg-brand-900/50 transition-colors">
              <svg class="w-6 h-6 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <p class="font-semibold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                Ajouter un produit
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">Creer un nouveau produit</p>
            </div>
          </div>
        </a>

        <a
          routerLink="/boutique/orders"
          class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:border-brand-300 dark:hover:border-brand-600 transition-colors group"
        >
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center group-hover:bg-yellow-200 dark:group-hover:bg-yellow-900/50 transition-colors">
              <svg class="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p class="font-semibold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                Gerer les commandes
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ stats().pendingOrders }} en attente</p>
            </div>
          </div>
        </a>

        <a
          routerLink="/boutique/statistics"
          class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:border-brand-300 dark:hover:border-brand-600 transition-colors group"
        >
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
              <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p class="font-semibold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                Voir les statistiques
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">Analysez vos performances</p>
            </div>
          </div>
        </a>
      </div>
    </div>
  `
})
export class BoutiqueDashboardComponent implements OnInit {
  private boutiqueOwnerService = inject(BoutiqueOwnerService);
  private orderService = inject(OrderService);
  private boutiqueId: string | null = null;

  stats = signal<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    activeProducts: 0
  });

  recentOrders = signal<RecentOrder[]>([]);
  topProducts = signal<TopProduct[]>([]);

  ngOnInit(): void {
    this.boutiqueOwnerService.getMyBoutique().subscribe({
      next: (boutique) => {
        this.boutiqueId = boutique?.id || null;
        if (!this.boutiqueId) {
          this.stats.set({ totalOrders: 0, pendingOrders: 0, totalProducts: 0, activeProducts: 0 });
          this.recentOrders.set([]);
          this.topProducts.set([]);
          return;
        }
        this.loadDashboardData();
      },
      error: () => {
        this.stats.set({ totalOrders: 0, pendingOrders: 0, totalProducts: 0, activeProducts: 0 });
        this.recentOrders.set([]);
        this.topProducts.set([]);
      }
    });
  }

  private loadDashboardData(): void {
    if (!this.boutiqueId) return;
    forkJoin({
      orderStats: this.orderService.getOrderStats(this.boutiqueId),
      recentOrders: this.orderService.getOrders({ boutiqueId: this.boutiqueId, limit: 5, page: 1 }),
      products: this.boutiqueOwnerService.getBoutiqueProducts(this.boutiqueId, 1, 200)
    }).subscribe({
      next: ({ orderStats, recentOrders, products }) => {
        const productList = products?.products || [];
        const salesByProductId = new Map<string, number>();
        (recentOrders?.orders || []).forEach((order) => {
          order.items.forEach((item) => {
            salesByProductId.set(item.productId, (salesByProductId.get(item.productId) || 0) + item.quantity);
          });
        });
        this.stats.set({
          totalOrders: orderStats?.totalOrders || 0,
          pendingOrders: orderStats?.pendingOrders || 0,
          totalProducts: productList.length,
          activeProducts: productList.filter((p) => p.status === 'active').length
        });

        this.recentOrders.set(
          (recentOrders?.orders || []).slice(0, 5).map((order) => ({
            id: order.id,
            orderNumber: order.orderNumber,
            customerName: order.customerName || 'Client',
            items: order.items.reduce((sum, item) => sum + item.quantity, 0),
            total: order.total,
            status: order.status === 'refunded' ? 'cancelled' : order.status,
            createdAt: order.createdAt
          }))
        );

        this.topProducts.set(
          [...productList]
            .sort((a, b) => b.stock - a.stock)
            .slice(0, 5)
            .map((p) => ({
              id: p.id,
              name: p.name,
              image: p.images?.[0]?.url || '',
              sales: salesByProductId.get(p.id) || 0,
              stock: p.stock
            }))
        );
      },
      error: () => {
        this.stats.set({ totalOrders: 0, pendingOrders: 0, totalProducts: 0, activeProducts: 0 });
        this.recentOrders.set([]);
        this.topProducts.set([]);
      }
    });
  }

  getStatusLabel(status: RecentOrder['status']): string {
    const labels: Record<RecentOrder['status'], string> = {
      pending: 'En attente',
      confirmed: 'Confirmee',
      shipped: 'Expediee',
      delivered: 'Livree',
      cancelled: 'Annulee'
    };
    return labels[status];
  }

  getStatusClasses(status: RecentOrder['status']): string {
    const base = 'px-2 py-0.5 text-xs font-medium rounded-full';
    const classes: Record<RecentOrder['status'], string> = {
      pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
      confirmed: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      shipped: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
      delivered: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
    };
    return `${base} ${classes[status]}`;
  }

  confirmOrder(orderId: string): void {
    this.orderService.updateOrderStatus(orderId, 'confirmed').subscribe({
      next: () => this.loadDashboardData()
    });
  }
}
