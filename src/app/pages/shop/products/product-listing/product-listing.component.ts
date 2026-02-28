import { Component, inject, OnInit, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService, ProductWithBoutique } from '../../../../shared/services/product.service';
import { ProductFilter } from '../../../../core/models/product.model';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-product-listing',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
            @if (selectedCategoryName()) {
              {{ selectedCategoryName() }}
            } @else {
              Tous les produits
            }
          </h1>
          <p class="mt-1 text-gray-500 dark:text-gray-400">
            {{ totalProducts() }} produit(s) trouvé(s)
          </p>
        </div>

        <!-- Search & Sort (Desktop) -->
        <div class="flex items-center gap-4">
          <!-- Search -->
          <div class="relative">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (ngModelChange)="onSearchChange($event)"
              placeholder="Rechercher un produit..."
              class="pl-10 pr-4 py-2.5 w-64 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
            @if (searchQuery) {
              <button
                type="button"
                (click)="clearSearch()"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            }
          </div>

          <!-- Sort -->
          <select
            [(ngModel)]="sortBy"
            (ngModelChange)="onSortChange($event)"
            class="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          >
            <option value="popular">Popularité</option>
            <option value="newest">Nouveautés</option>
            <option value="price_asc">Prix croissant</option>
            <option value="price_desc">Prix décroissant</option>
            <option value="name">Nom A-Z</option>
          </select>

          <!-- Mobile Filter Toggle -->
          <button
            type="button"
            (click)="showFilters.set(!showFilters())"
            class="lg:hidden px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filtres
            @if (activeFiltersCount() > 0) {
              <span class="px-2 py-0.5 text-xs font-medium bg-brand-600 text-white rounded-full">
                {{ activeFiltersCount() }}
              </span>
            }
          </button>
        </div>
      </div>

      <div class="flex flex-col lg:flex-row gap-8">
        <!-- Sidebar Filters -->
        <aside
          class="lg:w-64 flex-shrink-0"
          [class.hidden]="!showFilters()"
          [class.lg:block]="true"
        >
          <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-6 sticky top-24">
            <!-- Categories -->
            <div>
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Catégories</h3>
              <div class="space-y-2">
                <button
                  type="button"
                  (click)="selectCategory(null)"
                  class="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
                  [class.bg-brand-50]="!selectedCategory()"
                  [class.dark:bg-brand-900/20]="!selectedCategory()"
                  [class.text-brand-700]="!selectedCategory()"
                  [class.dark:text-brand-400]="!selectedCategory()"
                  [class.font-medium]="!selectedCategory()"
                  [class.text-gray-600]="selectedCategory()"
                  [class.dark:text-gray-400]="selectedCategory()"
                  [class.hover:bg-gray-100]="selectedCategory()"
                  [class.dark:hover:bg-gray-700]="selectedCategory()"
                >
                  Toutes les catégories
                </button>
                @for (category of categories(); track category.id) {
                  <button
                    type="button"
                    (click)="selectCategory(category.id)"
                    class="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
                    [class.bg-brand-50]="selectedCategory() === category.id"
                    [class.dark:bg-brand-900/20]="selectedCategory() === category.id"
                    [class.text-brand-700]="selectedCategory() === category.id"
                    [class.dark:text-brand-400]="selectedCategory() === category.id"
                    [class.font-medium]="selectedCategory() === category.id"
                    [class.text-gray-600]="selectedCategory() !== category.id"
                    [class.dark:text-gray-400]="selectedCategory() !== category.id"
                    [class.hover:bg-gray-100]="selectedCategory() !== category.id"
                    [class.dark:hover:bg-gray-700]="selectedCategory() !== category.id"
                  >
                    {{ category.name }}
                  </button>
                }
              </div>
            </div>

            <!-- Price Range -->
            <div>
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Prix</h3>
              <div class="space-y-2">
                @for (range of priceRanges; track range.label) {
                  <label class="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="priceRange"
                      [value]="range.label"
                      [checked]="selectedPriceRange() === range.label"
                      (change)="selectPriceRange(range)"
                      class="w-4 h-4 text-brand-600 border-gray-300 dark:border-gray-600 focus:ring-brand-500"
                    />
                    <span class="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white">
                      {{ range.label }}
                    </span>
                  </label>
                }
                @if (selectedPriceRange()) {
                  <button
                    type="button"
                    (click)="clearPriceRange()"
                    class="text-sm text-brand-600 dark:text-brand-400 hover:underline mt-2"
                  >
                    Effacer le filtre prix
                  </button>
                }
              </div>
            </div>

            <!-- Stock Filter -->
            <div>
              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  [(ngModel)]="inStockOnly"
                  (ngModelChange)="onInStockChange($event)"
                  class="w-4 h-4 text-brand-600 border-gray-300 dark:border-gray-600 rounded focus:ring-brand-500"
                />
                <span class="text-sm text-gray-700 dark:text-gray-300">En stock uniquement</span>
              </label>
            </div>

            <!-- Clear All Filters -->
            @if (activeFiltersCount() > 0) {
              <button
                type="button"
                (click)="clearAllFilters()"
                class="w-full px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Effacer tous les filtres ({{ activeFiltersCount() }})
              </button>
            }
          </div>
        </aside>

        <!-- Products Grid -->
        <div class="flex-1">
          @if (isLoading()) {
            <!-- Loading State -->
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              @for (i of [1, 2, 3, 4, 5, 6, 7, 8]; track i) {
                <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse">
                  <div class="aspect-square bg-gray-200 dark:bg-gray-700"></div>
                  <div class="p-4 space-y-3">
                    <div class="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div class="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div class="h-5 w-1/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
              }
            </div>
          } @else if (products().length === 0) {
            <!-- Empty State -->
            <div class="text-center py-16">
              <div class="w-24 h-24 mx-auto mb-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Aucun produit trouvé</h3>
              <p class="text-gray-500 dark:text-gray-400 mb-6">
                Essayez de modifier vos filtres ou votre recherche
              </p>
              <button
                type="button"
                (click)="clearAllFilters()"
                class="px-6 py-2 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition-colors"
              >
                Effacer les filtres
              </button>
            </div>
          } @else {
            <!-- Products Grid -->
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              @for (product of products(); track product.id) {
                <a
                  [routerLink]="['/product', product.boutiqueSlug, product.slug]"
                  class="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:border-brand-300 dark:hover:border-brand-600 transition-all duration-300"
                >
                  <!-- Product Image -->
                  <div class="aspect-square relative overflow-hidden bg-gray-100 dark:bg-gray-700">
                    @if (product.images?.[0]?.url) {
                      <img
                        [src]="product.images[0].url"
                        [alt]="product.name"
                        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    } @else {
                      <div class="w-full h-full flex items-center justify-center">
                        <svg class="w-16 h-16 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    }

                    <!-- Badges -->
                    <div class="absolute top-2 left-2 flex flex-col gap-1">
                      @if (product.compareAtPrice && product.compareAtPrice > product.price) {
                        <span class="px-2 py-1 text-xs font-semibold bg-red-500 text-white rounded">
                          -{{ getDiscountPercent(product) }}%
                        </span>
                      }
                      @if (product.isFeatured) {
                        <span class="px-2 py-1 text-xs font-semibold bg-amber-500 text-white rounded">
                          Populaire
                        </span>
                      }
                    </div>

                    <!-- Out of Stock Overlay -->
                    @if (product.stock <= 0) {
                      <div class="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span class="px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium rounded-lg">
                          Rupture de stock
                        </span>
                      </div>
                    }

                    <!-- Quick View Button -->
                    <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                      <span class="px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-medium rounded-lg shadow-lg">
                        Voir le produit
                      </span>
                    </div>
                  </div>

                  <!-- Product Info -->
                  <div class="p-4">
                    <h3 class="font-medium text-gray-900 dark:text-white mb-1 line-clamp-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {{ product.name }}
                    </h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      {{ product.boutiqueName }}
                    </p>
                    <div class="flex items-baseline gap-2">
                      <span class="text-lg font-bold text-brand-600 dark:text-brand-400">
                        {{ product.price | number:'1.0-0' }} Ar
                      </span>
                      @if (product.compareAtPrice && product.compareAtPrice > product.price) {
                        <span class="text-sm text-gray-400 line-through">
                          {{ product.compareAtPrice | number:'1.0-0' }} Ar
                        </span>
                      }
                    </div>

                    <!-- Tags -->
                    @if (product.tags?.length) {
                      <div class="flex flex-wrap gap-1 mt-3">
                        @for (tag of product.tags.slice(0, 2); track tag) {
                          <span class="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                            {{ tag }}
                          </span>
                        }
                      </div>
                    }
                  </div>
                </a>
              }
            </div>

            <!-- Pagination -->
            @if (totalPages() > 1) {
              <div class="flex items-center justify-center gap-2 mt-10">
                <button
                  type="button"
                  (click)="goToPage(currentPage() - 1)"
                  [disabled]="currentPage() <= 1"
                  class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                @for (page of paginationPages(); track page) {
                  @if (page === '...') {
                    <span class="px-3 py-2 text-gray-400">...</span>
                  } @else {
                    <button
                      type="button"
                      (click)="goToPage(+page)"
                      class="px-4 py-2 rounded-lg font-medium transition-colors"
                      [class.bg-brand-600]="currentPage() === +page"
                      [class.text-white]="currentPage() === +page"
                      [class.border]="currentPage() !== +page"
                      [class.border-gray-300]="currentPage() !== +page"
                      [class.dark:border-gray-600]="currentPage() !== +page"
                      [class.text-gray-700]="currentPage() !== +page"
                      [class.dark:text-gray-300]="currentPage() !== +page"
                      [class.hover:bg-gray-50]="currentPage() !== +page"
                      [class.dark:hover:bg-gray-700]="currentPage() !== +page"
                    >
                      {{ page }}
                    </button>
                  }
                }

                <button
                  type="button"
                  (click)="goToPage(currentPage() + 1)"
                  [disabled]="currentPage() >= totalPages()"
                  class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            }
          }
        </div>
      </div>
    </div>
  `
})
export class ProductListingComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  // State
  products = signal<ProductWithBoutique[]>([]);
  isLoading = signal(true);
  showFilters = signal(false);

  // Filters
  searchQuery = '';
  sortBy: ProductFilter['sortBy'] = 'popular';
  selectedCategory = signal<string | null>(null);
  selectedPriceRange = signal<string | null>(null);
  inStockOnly = false;
  promoOnly = false;
  currentMinPrice: number | undefined;
  currentMaxPrice: number | undefined;

  // Pagination
  currentPage = signal(1);
  totalProducts = signal(0);
  totalPages = signal(1);
  readonly itemsPerPage = 12;

  // Data
  categories = this.productService.categories;
  priceRanges = this.productService.priceRanges;

  // Computed
  selectedCategoryName = computed(() => {
    const catId = this.selectedCategory();
    if (!catId) return null;
    const cat = this.categories().find(c => c.id === catId);
    return cat?.name || null;
  });

  activeFiltersCount = computed(() => {
    let count = 0;
    if (this.selectedCategory()) count++;
    if (this.selectedPriceRange()) count++;
    if (this.inStockOnly) count++;
    if (this.promoOnly) count++;
    if (this.searchQuery.trim()) count++;
    return count;
  });

  paginationPages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: (string | number)[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (current > 3) pages.push('...');

      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (current < total - 2) pages.push('...');
      pages.push(total);
    }

    return pages;
  });

  ngOnInit(): void {
    // Subscribe to search with debounce
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage.set(1);
      this.loadProducts();
    });

    this.productService.loadProductCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.initQueryParamsListener(),
        error: () => this.initQueryParamsListener()
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProducts(): void {
    this.isLoading.set(true);

    const filter: ProductFilter = {
      page: this.currentPage(),
      limit: this.itemsPerPage,
      sortBy: this.sortBy,
      search: this.searchQuery.trim() || undefined,
      categoryId: this.selectedCategory() || undefined,
      minPrice: this.currentMinPrice,
      maxPrice: this.currentMaxPrice === Infinity ? undefined : this.currentMaxPrice,
      inStock: this.inStockOnly || undefined,
      featured: this.promoOnly || undefined
    };

    this.productService.getProducts(filter).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (result) => {
        this.products.set(result.items);
        this.totalProducts.set(result.total);
        this.totalPages.set(result.totalPages || 1);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  onSearchChange(value: string): void {
    this.searchSubject.next(value);
    this.updateUrl();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchSubject.next('');
    this.updateUrl();
  }

  onSortChange(value: ProductFilter['sortBy']): void {
    this.sortBy = value;
    this.currentPage.set(1);
    this.loadProducts();
    this.updateUrl();
  }

  selectCategory(categoryId: string | null): void {
    this.selectedCategory.set(categoryId);
    this.currentPage.set(1);
    this.loadProducts();
    this.updateUrl();
  }

  selectPriceRange(range: { label: string; min: number; max: number }): void {
    this.selectedPriceRange.set(range.label);
    this.currentMinPrice = range.min;
    this.currentMaxPrice = range.max;
    this.currentPage.set(1);
    this.loadProducts();
    this.updateUrl();
  }

  clearPriceRange(): void {
    this.selectedPriceRange.set(null);
    this.currentMinPrice = undefined;
    this.currentMaxPrice = undefined;
    this.currentPage.set(1);
    this.loadProducts();
    this.updateUrl();
  }

  onInStockChange(value: boolean): void {
    this.inStockOnly = value;
    this.currentPage.set(1);
    this.loadProducts();
    this.updateUrl();
  }

  clearAllFilters(): void {
    this.searchQuery = '';
    this.sortBy = 'popular';
    this.selectedCategory.set(null);
    this.selectedPriceRange.set(null);
    this.currentMinPrice = undefined;
    this.currentMaxPrice = undefined;
    this.inStockOnly = false;
    this.promoOnly = false;
    this.currentPage.set(1);
    this.loadProducts();
    this.updateUrl();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getDiscountPercent(product: ProductWithBoutique): number {
    if (!product.compareAtPrice || product.compareAtPrice <= product.price) return 0;
    return Math.round((1 - product.price / product.compareAtPrice) * 100);
  }

  private updateUrl(): void {
    const queryParams: any = {};

    const selectedCat = this.selectedCategory();
    if (selectedCat) {
      const cat = this.categories().find(c => c.id === selectedCat);
      if (cat) queryParams.category = cat.slug;
    }

    if (this.searchQuery.trim()) {
      queryParams.search = this.searchQuery.trim();
    }

    if (this.sortBy !== 'popular') {
      queryParams.sort = this.sortBy;
    }

    if (this.currentMinPrice !== undefined) {
      queryParams.minPrice = this.currentMinPrice;
    } else {
      queryParams.minPrice = null;
    }

    if (this.currentMaxPrice !== undefined && this.currentMaxPrice !== Infinity) {
      queryParams.maxPrice = this.currentMaxPrice;
    } else {
      queryParams.maxPrice = null;
    }

    queryParams.inStock = this.inStockOnly ? 'true' : null;
    queryParams.promo = this.promoOnly ? 'true' : null;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      replaceUrl: true
    });
  }

  private initQueryParamsListener(): void {
    // Handle query params
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.selectedCategory.set(null);
      this.searchQuery = '';
      this.sortBy = 'popular';
      this.currentMinPrice = undefined;
      this.currentMaxPrice = undefined;
      this.selectedPriceRange.set(null);
      this.inStockOnly = false;
      this.promoOnly = false;

      // Handle category from URL
      if (params['category']) {
        const cat = this.categories().find(c => c.slug === params['category'] || c.id === params['category']);
        if (cat) {
          this.selectedCategory.set(cat.id);
        }
      }

      // Handle search from URL
      if (params['search']) {
        this.searchQuery = params['search'];
      }

      // Handle sort from URL
      if (params['sort']) {
        this.sortBy = params['sort'] as ProductFilter['sortBy'];
      }

      const minParam = params['minPrice'];
      const maxParam = params['maxPrice'];
      this.currentMinPrice = minParam !== undefined && minParam !== null && minParam !== '' && minParam !== 'null'
        ? Number(minParam)
        : undefined;
      this.currentMaxPrice = maxParam !== undefined && maxParam !== null && maxParam !== '' && maxParam !== 'null'
        ? Number(maxParam)
        : undefined;

      const activePriceRange = this.priceRanges.find((range) =>
        range.min === this.currentMinPrice &&
        (range.max === this.currentMaxPrice || (range.max === Infinity && this.currentMaxPrice === undefined))
      );
      this.selectedPriceRange.set(activePriceRange?.label || null);

      this.inStockOnly = params['inStock'] === 'true';
      this.promoOnly = params['promo'] === 'true';

      this.loadProducts();
    });
  }
}
