import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Product } from '../../../../core/models/product.model';
import { BoutiqueOwnerService } from '../../../../shared/services/boutique-owner.service';
import { AdminService } from '../../../../shared/services/admin.service';
import { forkJoin } from 'rxjs';

type ProductStatus = 'all' | 'active' | 'draft' | 'out_of_stock';

@Component({
  selector: 'app-boutique-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Mes Produits</h1>
          <p class="text-gray-500 dark:text-gray-400 mt-1">Gerez votre catalogue de produits</p>
        </div>
        <a routerLink="/boutique/products/new"
           class="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Ajouter un produit
        </a>
      </div>

      <!-- Search and Filters -->
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
              placeholder="Rechercher un produit..."
              class="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          <!-- Category Filter -->
          <select
            [(ngModel)]="selectedCategory"
            class="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option value="">Toutes les categories</option>
            @for (cat of categories; track cat) {
              <option [value]="cat">{{ cat }}</option>
            }
          </select>

          <!-- Sort -->
          <select
            [(ngModel)]="sortBy"
            class="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option value="newest">Plus recents</option>
            <option value="oldest">Plus anciens</option>
            <option value="price_asc">Prix croissant</option>
            <option value="price_desc">Prix decroissant</option>
            <option value="stock_asc">Stock croissant</option>
            <option value="name">Nom A-Z</option>
          </select>
        </div>
      </div>

      <!-- Status Tabs -->
      <div class="flex gap-2 overflow-x-auto pb-2">
        @for (tab of statusTabs; track tab.value) {
          <button
            (click)="statusFilter.set(tab.value)"
            [class]="statusFilter() === tab.value
              ? 'px-4 py-2 rounded-lg font-medium bg-brand-600 text-white'
              : 'px-4 py-2 rounded-lg font-medium bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'"
          >
            {{ tab.label }}
            <span class="ml-2 px-2 py-0.5 text-xs rounded-full"
                  [class]="statusFilter() === tab.value ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'">
              {{ getStatusCount(tab.value) }}
            </span>
          </button>
        }
      </div>

      <!-- Products Table -->
      @if (filteredProducts().length > 0) {
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <!-- Bulk Actions -->
          @if (selectedProducts().length > 0) {
            <div class="px-6 py-3 bg-brand-50 dark:bg-brand-900/20 border-b border-brand-200 dark:border-brand-800 flex items-center gap-4">
              <span class="text-sm text-brand-700 dark:text-brand-300">
                {{ selectedProducts().length }} produit(s) selectionne(s)
              </span>
              <button (click)="bulkActivate()" class="text-sm text-brand-600 dark:text-brand-400 hover:underline">Activer</button>
              <button (click)="bulkDeactivate()" class="text-sm text-brand-600 dark:text-brand-400 hover:underline">Desactiver</button>
              <button (click)="bulkDelete()" class="text-sm text-red-600 dark:text-red-400 hover:underline">Supprimer</button>
            </div>
          }

          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th class="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      [checked]="allSelected()"
                      (change)="toggleSelectAll()"
                      class="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Produit</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Categorie</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Prix</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Stock</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Statut</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                @for (product of filteredProducts(); track product.id) {
                  <tr class="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td class="px-6 py-4">
                      <input
                        type="checkbox"
                        [checked]="isSelected(product.id)"
                        (change)="toggleSelect(product.id)"
                        class="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                      />
                    </td>
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                          @if (product.images?.[0]?.url) {
                            <img [src]="product.images[0].url" [alt]="product.name" class="w-full h-full object-cover" />
                          } @else {
                            <div class="w-full h-full flex items-center justify-center">
                              <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          }
                        </div>
                        <div class="min-w-0">
                          <p class="font-medium text-gray-900 dark:text-white truncate">{{ product.name }}</p>
                          <p class="text-sm text-gray-500 dark:text-gray-400">SKU: {{ product.id }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <span class="text-sm text-gray-600 dark:text-gray-300">{{ getCategoryName(product.categoryId) }}</span>
                    </td>
                    <td class="px-6 py-4">
                      <div>
                        <span class="font-medium text-gray-900 dark:text-white">{{ product.price | number:'1.0-0' }} Ar</span>
                        @if (product.compareAtPrice && product.compareAtPrice > product.price) {
                          <span class="text-sm text-gray-400 line-through ml-2">{{ product.compareAtPrice | number:'1.0-0' }} Ar</span>
                        }
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-2">
                        @if (product.stock <= 0) {
                          <span class="w-2 h-2 rounded-full bg-red-500"></span>
                          <span class="text-sm text-red-600 dark:text-red-400">Rupture</span>
                        } @else if (product.stock <= (product.lowStockThreshold || 5)) {
                          <span class="w-2 h-2 rounded-full bg-orange-500"></span>
                          <span class="text-sm text-orange-600 dark:text-orange-400">{{ product.stock }} (Faible)</span>
                        } @else {
                          <span class="w-2 h-2 rounded-full bg-green-500"></span>
                          <span class="text-sm text-gray-600 dark:text-gray-300">{{ product.stock }}</span>
                        }
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      @switch (product.status) {
                        @case ('active') {
                          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            Actif
                          </span>
                        }
                        @case ('draft') {
                          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                            Brouillon
                          </span>
                        }
                        @case ('out_of_stock') {
                          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                            Rupture
                          </span>
                        }
                      }
                    </td>
                    <td class="px-6 py-4">
                      <div class="flex items-center justify-end gap-2">
                        <a [routerLink]="['/boutique/products', product.id, 'edit']"
                           class="p-2 text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                           title="Modifier">
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </a>
                        <button
                          (click)="duplicateProduct(product)"
                          class="p-2 text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Dupliquer">
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                        <button
                          (click)="toggleProductStatus(product)"
                          class="p-2 text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          [title]="product.status === 'active' ? 'Desactiver' : 'Activer'">
                          @if (product.status === 'active') {
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                          } @else {
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                            </svg>
                          }
                        </button>
                        <button
                          (click)="deleteProduct(product)"
                          class="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Supprimer">
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
          <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Affichage de {{ (currentPage - 1) * itemsPerPage + 1 }} a {{ Math.min(currentPage * itemsPerPage, filteredProducts().length) }} sur {{ filteredProducts().length }} produits
            </p>
            <div class="flex items-center gap-2">
              <button
                (click)="previousPage()"
                [disabled]="currentPage === 1"
                class="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700">
                Precedent
              </button>
              @for (page of getVisiblePages(); track page) {
                <button
                  (click)="goToPage(page)"
                  [class]="page === currentPage
                    ? 'px-3 py-1.5 bg-brand-600 text-white rounded-lg text-sm'
                    : 'px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700'">
                  {{ page }}
                </button>
              }
              <button
                (click)="nextPage()"
                [disabled]="currentPage === totalPages"
                class="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700">
                Suivant
              </button>
            </div>
          </div>
        </div>
      } @else {
        <!-- Empty State -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          @if (searchQuery || selectedCategory || statusFilter() !== 'all') {
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Aucun produit trouve</h3>
            <p class="text-gray-500 dark:text-gray-400 mb-6">Essayez de modifier vos criteres de recherche</p>
            <button (click)="resetFilters()" class="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700">
              Reinitialiser les filtres
            </button>
          } @else {
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Aucun produit</h3>
            <p class="text-gray-500 dark:text-gray-400 mb-6">Commencez par ajouter votre premier produit</p>
            <a routerLink="/boutique/products/new" class="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Ajouter un produit
            </a>
          }
        </div>
      }
    </div>
  `
})
export class BoutiqueProductListComponent implements OnInit {
  Math = Math;
  private boutiqueOwnerService = inject(BoutiqueOwnerService);
  private adminService = inject(AdminService);
  private boutiqueId: string | null = null;

  // Filters
  searchQuery = '';
  selectedCategory = '';
  sortBy = 'newest';
  statusFilter = signal<ProductStatus>('all');

  // Selection
  selectedProducts = signal<string[]>([]);

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;

  statusTabs: { value: ProductStatus; label: string }[] = [
    { value: 'all', label: 'Tous' },
    { value: 'active', label: 'Actifs' },
    { value: 'draft', label: 'Brouillons' },
    { value: 'out_of_stock', label: 'Rupture' }
  ];

  categories = ['Mode', 'Electronique', 'Maison', 'Beaute', 'Sport', 'Alimentation'];

  categoryMap: Record<string, string> = {
    'cat-1': 'Mode',
    'cat-2': 'Electronique',
    'cat-3': 'Maison',
    'cat-4': 'Beaute',
    'cat-5': 'Sport',
    'cat-6': 'Alimentation'
  };

  ngOnInit(): void {
    this.products.set([]);
    this.loadCategories();
    this.boutiqueOwnerService.getMyBoutique().subscribe((boutique) => {
      this.boutiqueId = boutique?.id || null;
      if (this.boutiqueId) {
        this.loadProducts();
      }
    });
  }

  private loadProducts(): void {
    if (!this.boutiqueId) return;
    this.boutiqueOwnerService.getBoutiqueProducts(this.boutiqueId, 1, 200).subscribe({
      next: (res) => this.products.set(res.products || []),
      error: () => this.products.set([])
    });
  }

  private loadCategories(): void {
    this.adminService.getCategories().subscribe((categories) => {
      this.categoryMap = categories.reduce<Record<string, string>>((acc, category) => {
        acc[category.id] = category.name;
        return acc;
      }, {});
      this.categories = Array.from(new Set(categories.map((category) => category.name)));
    });
  }

  products = signal<Product[]>([]);

  filteredProducts = computed(() => {
    let result = this.products();

    // Status filter
    if (this.statusFilter() !== 'all') {
      result = result.filter(p => p.status === this.statusFilter());
    }

    // Search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.tags?.some(t => t.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (this.selectedCategory) {
      const catId = Object.keys(this.categoryMap).find(k => this.categoryMap[k] === this.selectedCategory);
      if (catId) {
        result = result.filter(p => p.categoryId === catId);
      }
    }

    // Sort
    switch (this.sortBy) {
      case 'newest':
        result = [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        result = [...result].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'price_asc':
        result = [...result].sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        result = [...result].sort((a, b) => b.price - a.price);
        break;
      case 'stock_asc':
        result = [...result].sort((a, b) => a.stock - b.stock);
        break;
      case 'name':
        result = [...result].sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return result;
  });

  get totalPages(): number {
    return Math.ceil(this.filteredProducts().length / this.itemsPerPage);
  }

  allSelected = computed(() => {
    const filtered = this.filteredProducts();
    return filtered.length > 0 && this.selectedProducts().length === filtered.length;
  });

  getStatusCount(status: ProductStatus): number {
    if (status === 'all') return this.products().length;
    return this.products().filter(p => p.status === status).length;
  }

  getCategoryName(categoryId?: string): string {
    if (!categoryId) return 'Non categorise';
    return this.categoryMap[categoryId] || 'Non categorise';
  }

  isSelected(productId: string): boolean {
    return this.selectedProducts().includes(productId);
  }

  toggleSelect(productId: string): void {
    this.selectedProducts.update(selected => {
      if (selected.includes(productId)) {
        return selected.filter(id => id !== productId);
      } else {
        return [...selected, productId];
      }
    });
  }

  toggleSelectAll(): void {
    if (this.allSelected()) {
      this.selectedProducts.set([]);
    } else {
      this.selectedProducts.set(this.filteredProducts().map(p => p.id));
    }
  }

  toggleProductStatus(product: Product): void {
    const nextStatus = product.status === 'active' ? 'draft' : 'active';
    this.boutiqueOwnerService.updateProduct(product.id, { status: nextStatus }).subscribe({
      next: (updated) => {
        this.products.update((products) => products.map((p) => p.id === product.id ? updated : p));
      }
    });
  }

  duplicateProduct(product: Product): void {
    if (!this.boutiqueId) return;
    this.boutiqueOwnerService.createProduct({
      name: `${product.name} (Copie)`,
      description: product.description,
      shortDescription: product.shortDescription,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      categoryId: product.categoryId,
      boutiqueId: this.boutiqueId,
      stock: product.stock,
      images: (product.images || []).map((image) => image.url),
      tags: product.tags || [],
      isFeatured: false,
      status: 'draft',
      lowStockThreshold: product.lowStockThreshold
    } as any).subscribe({
      next: (created) => this.products.update((products) => [created, ...products])
    });
  }

  deleteProduct(product: Product): void {
    if (confirm(`Etes-vous sur de vouloir supprimer "${product.name}" ?`)) {
      this.boutiqueOwnerService.deleteProduct(product.id).subscribe({
        next: () => {
          this.products.update(products => products.filter(p => p.id !== product.id));
          this.selectedProducts.update(selected => selected.filter(id => id !== product.id));
        }
      });
    }
  }

  bulkActivate(): void {
    const requests = this.selectedProducts().map((id) =>
      this.boutiqueOwnerService.updateProduct(id, { status: 'active' })
    );
    if (!requests.length) return;
    forkJoin(requests).subscribe({
      next: () => {
        this.loadProducts();
        this.selectedProducts.set([]);
      }
    });
  }

  bulkDeactivate(): void {
    const requests = this.selectedProducts().map((id) =>
      this.boutiqueOwnerService.updateProduct(id, { status: 'draft' })
    );
    if (!requests.length) return;
    forkJoin(requests).subscribe({
      next: () => {
        this.loadProducts();
        this.selectedProducts.set([]);
      }
    });
  }

  bulkDelete(): void {
    if (confirm(`Etes-vous sur de vouloir supprimer ${this.selectedProducts().length} produit(s) ?`)) {
      const requests = this.selectedProducts().map((id) => this.boutiqueOwnerService.deleteProduct(id));
      if (!requests.length) return;
      forkJoin(requests).subscribe({
        next: () => {
          this.loadProducts();
          this.selectedProducts.set([]);
        }
      });
    }
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedCategory = '';
    this.statusFilter.set('all');
    this.sortBy = 'newest';
  }

  // Pagination methods
  getVisiblePages(): number[] {
    const pages: number[] = [];
    const total = this.totalPages;
    const current = this.currentPage;

    if (total <= 5) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      if (current <= 3) {
        for (let i = 1; i <= 5; i++) pages.push(i);
      } else if (current >= total - 2) {
        for (let i = total - 4; i <= total; i++) pages.push(i);
      } else {
        for (let i = current - 2; i <= current + 2; i++) pages.push(i);
      }
    }

    return pages;
  }

  goToPage(page: number): void {
    this.currentPage = page;
  }

  previousPage(): void {
    if (this.currentPage > 1) this.currentPage--;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }
}
