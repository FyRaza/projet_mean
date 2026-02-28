import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { BoutiqueOwnerService } from '../../../shared/services/boutique-owner.service';
import { OrderService } from '../../../shared/services/order.service';
import { AdminService } from '../../../shared/services/admin.service';
import { Product } from '../../../core/models/product.model';

interface DailyStat {
  date: string;
  orders: number;
  revenue: number;
  visitors: number;
}

interface TopProduct {
  id: string;
  name: string;
  image: string;
  sold: number;
  revenue: number;
}

@Component({
  selector: 'app-boutique-statistics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Statistiques</h1>
          <p class="text-gray-500 dark:text-gray-400 mt-1">Analysez les performances de votre boutique</p>
        </div>
        <div class="flex items-center gap-3">
          <select
            [(ngModel)]="selectedPeriod"
            (ngModelChange)="onPeriodChange()"
            class="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option value="7">7 derniers jours</option>
            <option value="30">30 derniers jours</option>
            <option value="90">3 derniers mois</option>
            <option value="365">Cette annee</option>
          </select>
          <button
            (click)="exportStatistics()"
            class="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exporter
          </button>
        </div>
      </div>

      <!-- Overview Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span
              class="text-sm font-medium flex items-center gap-1"
              [class]="trendClass(revenueTrend)">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  [attr.d]="trendIconPath(revenueTrend)" />
              </svg>
              {{ formatTrend(revenueTrend) }}
            </span>
          </div>
          <h3 class="text-3xl font-bold text-gray-900 dark:text-white">{{ totalRevenue | number:'1.0-0' }} Ar</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Chiffre d'affaires</p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <span
              class="text-sm font-medium flex items-center gap-1"
              [class]="trendClass(ordersTrend)">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  [attr.d]="trendIconPath(ordersTrend)" />
              </svg>
              {{ formatTrend(ordersTrend) }}
            </span>
          </div>
          <h3 class="text-3xl font-bold text-gray-900 dark:text-white">{{ totalOrders }}</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Commandes</p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <svg class="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span
              class="text-sm font-medium flex items-center gap-1"
              [class]="trendClass(conversionTrend)">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  [attr.d]="trendIconPath(conversionTrend)" />
              </svg>
              {{ formatTrend(conversionTrend) }}
            </span>
          </div>
          <h3 class="text-3xl font-bold text-gray-900 dark:text-white">{{ conversionRate }}%</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Taux de conversion</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Revenue Chart -->
        <div class="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Evolution des ventes</h2>
            <div class="flex items-center gap-4">
              <span class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span class="w-3 h-3 rounded-full bg-brand-500"></span>
                Revenus
              </span>
              <span class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span class="w-3 h-3 rounded-full bg-green-500"></span>
                Commandes
              </span>
            </div>
          </div>

          <!-- Simple Chart Visualization -->
          <div class="overflow-x-auto">
            <div class="h-64 flex items-end gap-2" [style.min-width.px]="chartMinWidth">
            @for (stat of dailyStats; track stat.date; let i = $index) {
              <div class="w-8 shrink-0 flex flex-col items-center gap-1">
                <div class="w-full flex flex-col items-center gap-1">
                  <div
                    class="w-full bg-brand-500 rounded-t"
                    [style.height.px]="(stat.revenue / maxRevenue) * 200"
                  ></div>
                  <div
                    class="w-3/4 bg-green-500 rounded-t"
                    [style.height.px]="(stat.orders / maxOrders) * 50"
                  ></div>
                </div>
                @if (shouldShowDateLabel(i)) {
                  <span class="text-[10px] text-gray-500 dark:text-gray-400 mt-2 whitespace-nowrap">{{ stat.date }}</span>
                } @else {
                  <span class="text-[10px] mt-2">&nbsp;</span>
                }
              </div>
            }
            </div>
          </div>
        </div>

        <!-- Top Products -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-6">Produits les plus vendus</h2>

          <div class="space-y-4">
            @for (product of topProducts; track product.id; let i = $index) {
              <div class="flex items-center gap-3">
                <span class="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300">
                  {{ i + 1 }}
                </span>
                <div class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden">
                  <img [src]="product.image" [alt]="product.name" class="w-full h-full object-cover" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-gray-900 dark:text-white truncate">{{ product.name }}</p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">{{ product.sold }} vendus</p>
                </div>
                <span class="font-medium text-gray-900 dark:text-white">{{ product.revenue | number:'1.0-0' }} Ar</span>
              </div>
            }
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Order Status Distribution -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-6">Repartition des commandes</h2>

          <div class="space-y-4">
            @for (status of orderStatusDistribution; track status.label) {
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="text-sm text-gray-600 dark:text-gray-300">{{ status.label }}</span>
                  <span class="text-sm font-medium text-gray-900 dark:text-white">{{ status.count }} ({{ status.percentage }}%)</span>
                </div>
                <div class="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full"
                    [class]="status.color"
                    [style.width.%]="status.percentage"
                  ></div>
                </div>
              </div>
            }
          </div>
        </div>

      <!-- Category Performance -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-6">Performance par categorie</h2>

        <div class="overflow-x-auto">
          <table class="min-w-full">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th class="py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Categorie</th>
                <th class="py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">Produits</th>
                <th class="py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">Ventes</th>
                <th class="py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">Revenus</th>
                <th class="py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">Croissance</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              @for (cat of categoryPerformance; track cat.name) {
                <tr>
                  <td class="py-4 font-medium text-gray-900 dark:text-white">{{ cat.name }}</td>
                  <td class="py-4 text-right text-gray-600 dark:text-gray-300">{{ cat.products }}</td>
                  <td class="py-4 text-right text-gray-600 dark:text-gray-300">{{ cat.sales }}</td>
                  <td class="py-4 text-right font-medium text-gray-900 dark:text-white">{{ cat.revenue | number:'1.0-0' }} Ar</td>
                  <td class="py-4 text-right">
                    <span [class]="cat.growth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                      {{ cat.growth >= 0 ? '+' : '' }}{{ cat.growth }}%
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class BoutiqueStatisticsComponent implements OnInit {
  private boutiqueOwnerService = inject(BoutiqueOwnerService);
  private orderService = inject(OrderService);
  private adminService = inject(AdminService);
  private boutiqueId: string | null = null;
  private allProducts: Product[] = [];
  private allOrders: any[] = [];

  selectedPeriod = '30';

  // Summary stats
  totalRevenue = 0;
  totalOrders = 0;
  conversionRate = 0;
  revenueTrend = 0;
  ordersTrend = 0;
  conversionTrend = 0;

  // Daily stats for chart
  dailyStats: DailyStat[] = [];

  get maxRevenue(): number {
    const max = Math.max(...this.dailyStats.map(s => s.revenue), 0);
    return max > 0 ? max : 1;
  }

  get maxOrders(): number {
    const max = Math.max(...this.dailyStats.map(s => s.orders), 0);
    return max > 0 ? max : 1;
  }

  get chartMinWidth(): number {
    return Math.max(this.dailyStats.length * 36, 640);
  }

  // Top products
  topProducts: TopProduct[] = [];

  // Order status distribution
  orderStatusDistribution = [
    { label: 'Livrees', count: 0, percentage: 0, color: 'bg-green-500' },
    { label: 'En preparation', count: 0, percentage: 0, color: 'bg-blue-500' },
    { label: 'En attente', count: 0, percentage: 0, color: 'bg-yellow-500' },
    { label: 'Annulees', count: 0, percentage: 0, color: 'bg-red-500' }
  ];

  // Category performance
  categoryPerformance: { name: string; products: number; sales: number; revenue: number; growth: number }[] = [];

  ngOnInit(): void {
    this.boutiqueOwnerService.getMyBoutique().subscribe({
      next: (boutique) => {
        this.boutiqueId = boutique?.id || null;
        if (!this.boutiqueId) return;
        this.loadData();
      }
    });
  }

  onPeriodChange(): void {
    this.computeDerivedStats();
  }

  private async loadData(): Promise<void> {
    if (!this.boutiqueId) return;
    try {
      const categories = await firstValueFrom(this.adminService.getCategories());
      const categoryMap = (categories || []).reduce<Record<string, string>>((acc, c) => {
        acc[c.id] = c.name;
        return acc;
      }, {});

      this.allProducts = await this.fetchAllProducts(this.boutiqueId);
      this.allOrders = await this.fetchAllOrders(this.boutiqueId);
      this.computeDerivedStats(categoryMap);
    } catch {
      this.allProducts = [];
      this.allOrders = [];
      this.computeDerivedStats();
    }
  }

  private computeDerivedStats(categoryMap: Record<string, string> = {}): void {
    const days = Number(this.selectedPeriod || '30');
    const now = new Date();
    const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const from = new Date(to);
    from.setDate(from.getDate() - (days - 1));
    from.setHours(0, 0, 0, 0);

    const previousTo = new Date(from);
    previousTo.setDate(previousTo.getDate() - 1);
    const previousFrom = new Date(previousTo);
    previousFrom.setDate(previousFrom.getDate() - (days - 1));

    const inRange = (date: Date, rangeStart: Date, rangeEnd: Date) => date >= rangeStart && date <= rangeEnd;
    const currentPeriod = this.allOrders.filter((o) => inRange(new Date(o.createdAt), from, to));
    const previousPeriod = this.allOrders.filter((o) => inRange(new Date(o.createdAt), previousFrom, previousTo));

    const previousRevenue = previousPeriod
      .filter((o) => o.status === 'delivered')
      .reduce((sum, o) => sum + (o.total || 0), 0);
    const previousOrders = previousPeriod.length;
    const previousDelivered = previousPeriod.filter((o) => o.status === 'delivered').length;
    const previousConversion = previousOrders ? (previousDelivered / previousOrders) * 100 : 0;

    const inPeriod = currentPeriod;
    this.totalOrders = inPeriod.length;
    this.totalRevenue = inPeriod
      .filter((o) => o.status === 'delivered')
      .reduce((sum, o) => sum + (o.total || 0), 0);

    const delivered = inPeriod.filter((o) => o.status === 'delivered').length;
    this.conversionRate = this.totalOrders ? Number(((delivered / this.totalOrders) * 100).toFixed(1)) : 0;
    this.revenueTrend = this.computePercentageChange(previousRevenue, this.totalRevenue);
    this.ordersTrend = this.computePercentageChange(previousOrders, this.totalOrders);
    this.conversionTrend = this.computePercentageChange(previousConversion, this.conversionRate);

    const byDay = new Map<string, { orders: number; revenue: number; visitors: number; customers: Set<string> }>();
    inPeriod.forEach((o) => {
      const d = new Date(o.createdAt);
      const key = this.dateKey(d);
      const existing = byDay.get(key) || { orders: 0, revenue: 0, visitors: 0, customers: new Set<string>() };
      existing.orders += 1;
      if (o.status === 'delivered') existing.revenue += o.total || 0;
      if (o.customerId) existing.customers.add(String(o.customerId));
      byDay.set(key, existing);
    });

    this.dailyStats = this.buildDateRange(from, to).map((date) => {
      const key = this.dateKey(date);
      const values = byDay.get(key);
      return {
        date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
        orders: values?.orders || 0,
        revenue: values?.revenue || 0,
        visitors: values?.customers.size || 0
      };
    });

    const statusCount = {
      delivered: inPeriod.filter((o) => o.status === 'delivered').length,
      processing: inPeriod.filter((o) => o.status === 'confirmed' || o.status === 'shipped').length,
      pending: inPeriod.filter((o) => o.status === 'pending').length,
      cancelled: inPeriod.filter((o) => o.status === 'cancelled').length
    };
    const total = Math.max(1, inPeriod.length);
    this.orderStatusDistribution = [
      { label: 'Livrees', count: statusCount.delivered, percentage: Math.round((statusCount.delivered / total) * 100), color: 'bg-green-500' },
      { label: 'En preparation', count: statusCount.processing, percentage: Math.round((statusCount.processing / total) * 100), color: 'bg-blue-500' },
      { label: 'En attente', count: statusCount.pending, percentage: Math.round((statusCount.pending / total) * 100), color: 'bg-yellow-500' },
      { label: 'Annulees', count: statusCount.cancelled, percentage: Math.round((statusCount.cancelled / total) * 100), color: 'bg-red-500' }
    ];

    const productStats = new Map<string, TopProduct>();
    inPeriod.forEach((order) => {
      (order.items || []).forEach((item: any) => {
        const id = item.productId || item.product?._id || item.product;
        const existing = productStats.get(id) || {
          id,
          name: item.productName || item.name || 'Produit',
          image: item.productImage || '',
          sold: 0,
          revenue: 0
        };
        existing.sold += item.quantity || 0;
        existing.revenue += (item.unitPrice || item.price || 0) * (item.quantity || 0);
        productStats.set(id, existing);
      });
    });
    this.topProducts = Array.from(productStats.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    const categoryAgg = new Map<string, { products: number; sales: number; revenue: number }>();
    this.allProducts.forEach((p) => {
      const catName = categoryMap[p.categoryId || ''] || 'Non classe';
      const existing = categoryAgg.get(catName) || { products: 0, sales: 0, revenue: 0 };
      existing.products += 1;
      categoryAgg.set(catName, existing);
    });
    inPeriod.forEach((order) => {
      (order.items || []).forEach((item: any) => {
        const product = this.allProducts.find((p) => p.id === (item.productId || item.product?._id || item.product));
        const catName = product ? (categoryMap[product.categoryId || ''] || 'Non classe') : 'Non classe';
        const existing = categoryAgg.get(catName) || { products: 0, sales: 0, revenue: 0 };
        existing.sales += item.quantity || 0;
        existing.revenue += (item.unitPrice || item.price || 0) * (item.quantity || 0);
        categoryAgg.set(catName, existing);
      });
    });
    this.categoryPerformance = Array.from(categoryAgg.entries()).map(([name, v]) => ({
      name,
      products: v.products,
      sales: v.sales,
      revenue: v.revenue,
      growth: 0
    })).sort((a, b) => b.revenue - a.revenue);

    const previousCategoryRevenue = this.computeCategoryRevenue(previousPeriod, categoryMap);
    const currentCategoryRevenue = this.computeCategoryRevenue(currentPeriod, categoryMap);
    this.categoryPerformance = this.categoryPerformance.map((cat) => ({
      ...cat,
      growth: this.computePercentageChange(previousCategoryRevenue[cat.name] || 0, currentCategoryRevenue[cat.name] || 0)
    }));
  }

  formatTrend(value: number): string {
    if (!isFinite(value) || value === 0) return '0.0%';
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  }

  shouldShowDateLabel(index: number): boolean {
    const total = this.dailyStats.length;
    if (total <= 10) return true;
    const step = Math.ceil(total / 10); // max ~10 labels visibles
    return index % step === 0 || index === total - 1;
  }

  trendClass(value: number): string {
    if (value > 0) return 'text-green-600 dark:text-green-400';
    if (value < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-500 dark:text-gray-400';
  }

  trendIconPath(value: number): string {
    if (value > 0) return 'M5 10l7-7m0 0l7 7m-7-7v18';
    if (value < 0) return 'M19 14l-7 7m0 0l-7-7m7 7V3';
    return 'M5 12h14';
  }

  exportStatistics(): void {
    const rows = this.dailyStats.map((s) => ({
      date: s.date,
      commandes: s.orders,
      revenus: s.revenue,
      clientsUniques: s.visitors
    }));

    const headers = ['Date', 'Commandes', 'Revenus (Ar)', 'Clients uniques'];
    const csvContent = [
      headers.join(','),
      ...rows.map((r) => [r.date, r.commandes, r.revenus, r.clientsUniques].join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const period = this.selectedPeriod || '30';
    link.href = url;
    link.download = `statistiques-boutique-${period}j.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private computePercentageChange(previous: number, current: number): number {
    if (!previous && !current) return 0;
    if (!previous) return 100;
    return Number((((current - previous) / previous) * 100).toFixed(1));
  }

  private dateKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private buildDateRange(from: Date, to: Date): Date[] {
    const range: Date[] = [];
    const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      range.push(new Date(d));
    }
    return range;
  }

  private computeCategoryRevenue(orders: any[], categoryMap: Record<string, string>): Record<string, number> {
    const revenueByCategory: Record<string, number> = {};
    orders.forEach((order) => {
      (order.items || []).forEach((item: any) => {
        const product = this.allProducts.find((p) => p.id === (item.productId || item.product?._id || item.product));
        const catName = product ? (categoryMap[product.categoryId || ''] || 'Non classe') : 'Non classe';
        revenueByCategory[catName] = (revenueByCategory[catName] || 0) + ((item.unitPrice || item.price || 0) * (item.quantity || 0));
      });
    });
    return revenueByCategory;
  }

  private async fetchAllOrders(boutiqueId: string): Promise<any[]> {
    const all: any[] = [];
    let page = 1;
    let pages = 1;
    const limit = 100;

    do {
      const res = await firstValueFrom(this.orderService.getOrders({ boutiqueId, page, limit }));
      const chunk = res?.orders || [];
      all.push(...chunk);
      pages = res?.pages || 1;
      page += 1;
    } while (page <= pages);

    return all;
  }

  private async fetchAllProducts(boutiqueId: string): Promise<Product[]> {
    const all: Product[] = [];
    let page = 1;
    let pages = 1;
    const limit = 100;

    do {
      const res = await firstValueFrom(this.boutiqueOwnerService.getBoutiqueProducts(boutiqueId, page, limit));
      const chunk = res?.products || [];
      all.push(...chunk);
      pages = res?.pages || 1;
      page += 1;
    } while (page <= pages);

    return all;
  }
}
