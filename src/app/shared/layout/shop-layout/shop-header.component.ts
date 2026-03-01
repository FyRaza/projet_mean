import { Component, inject, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { CartService } from '../../services/cart.service';
import { Router } from '@angular/router';

interface NavItem {
  name: string;
  path: string;
  queryParams?: Record<string, string | number | boolean>;
  icon?: string;
}

interface CategoryItem {
  name: string;
  slug: string;
  icon: string;
}

@Component({
  selector: 'app-shop-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <header
      class="sticky top-0 z-50 transition-all duration-300"
      [class]="isScrolled()
        ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg shadow-lg'
        : 'bg-white dark:bg-gray-900'"
    >
      <!-- Top Bar -->
      <div class="hidden lg:block bg-brand-600 dark:bg-brand-700 text-white text-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-9">
            <div class="flex items-center gap-6">
              <span class="flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                +261 34 00 000 00
              </span>
              <span class="flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                contact&#64;centrecommercial.mg
              </span>
            </div>
            <div class="flex items-center gap-4">
              <span class="flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Antananarivo, Madagascar
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Header -->
      <div class="border-b border-gray-200 dark:border-gray-700/50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16 lg:h-20">
            <!-- Logo -->
            <a routerLink="/" class="flex items-center gap-3 group">
              <div class="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/30 group-hover:shadow-brand-500/50 transition-shadow">
                <svg class="w-6 h-6 lg:w-7 lg:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div class="hidden sm:block">
                <h1 class="text-lg lg:text-xl font-bold text-gray-900 dark:text-white leading-tight">
                  IAVOKO Centre Commercial
                </h1>
                <p class="text-xs text-gray-500 dark:text-gray-400">Votre marketplace local</p>
              </div>
            </a>

            <!-- Desktop Search Bar -->
            <div class="hidden lg:flex flex-1 max-w-xl mx-8">
              <div class="relative w-full">
                <input
                  type="text"
                  [(ngModel)]="searchQuery"
                  (keyup.enter)="performSearch()"
                  placeholder="Rechercher des produits, boutiques..."
                  class="w-full h-12 pl-12 pr-4 bg-gray-100 dark:bg-gray-800 border-2 border-transparent rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:bg-white dark:focus:bg-gray-700 focus:border-brand-500 focus:ring-0 transition-all"
                />
                <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                @if (searchQuery) {
                  <button
                    type="button"
                    (click)="searchQuery = ''"
                    class="absolute right-14 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                }
                <button
                  type="button"
                  (click)="performSearch()"
                  class="absolute right-2 top-1/2 -translate-y-1/2 px-4 h-8 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
                >
                  Rechercher
                </button>
              </div>
            </div>

            <!-- Right Section -->
            <div class="flex items-center gap-2 lg:gap-4">
              <!-- Mobile Search Toggle -->
              <button
                type="button"
                (click)="toggleSearch()"
                class="lg:hidden p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                aria-label="Rechercher"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              <!-- Theme Toggle -->
              <button
                type="button"
                (click)="toggleTheme()"
                class="p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                aria-label="Changer le theme"
              >
                @if ((theme$ | async) === 'dark') {
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                } @else {
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                }
              </button>

              <!-- Cart (visible uniquement si connecté) -->
              @if (isAuthenticated$ | async) {
                <a
                  routerLink="/cart"
                  class="relative p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                  aria-label="Panier"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  @if ((cartItemCount$ | async) || 0; as count) {
                    @if (count > 0) {
                      <span class="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-brand-600 rounded-full ring-2 ring-white dark:ring-gray-900">
                        {{ count > 99 ? '99+' : count }}
                      </span>
                    }
                  }
                </a>
              }

              <!-- Divider -->
              <div class="hidden lg:block w-px h-8 bg-gray-200 dark:bg-gray-700"></div>

              <!-- User Menu -->
              @if (isAuthenticated$ | async) {
                <div class="relative">
                  <button
                    type="button"
                    (click)="toggleUserMenu()"
                    class="flex items-center gap-2 p-1.5 pr-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                  >
                    <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center">
                      <span class="text-sm font-semibold text-white">
                        {{ (currentUser$ | async)?.firstName?.charAt(0) }}
                      </span>
                    </div>
                    <span class="hidden lg:block text-sm font-medium max-w-[100px] truncate">
                      {{ (currentUser$ | async)?.firstName }}
                    </span>
                    <svg class="hidden lg:block w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  @if (isUserMenuOpen) {
                    <div class="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 overflow-hidden">
                      <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <p class="text-sm font-semibold text-gray-900 dark:text-white">
                          {{ (currentUser$ | async)?.firstName }} {{ (currentUser$ | async)?.lastName }}
                        </p>
                        <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {{ (currentUser$ | async)?.email }}
                        </p>
                      </div>
                      <div class="py-1">
                        <a
                          routerLink="/account/profile"
                          (click)="closeUserMenu()"
                          class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Mon Profil
                        </a>
                        <a
                          routerLink="/account/orders"
                          (click)="closeUserMenu()"
                          class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                          Mes Commandes
                        </a>
                      </div>
                      <div class="border-t border-gray-200 dark:border-gray-700 py-1">
                        <button
                          type="button"
                          (click)="logout()"
                          class="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Déconnexion
                        </button>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="flex items-center gap-2">
                  <a
                    routerLink="/signin"
                    class="hidden sm:inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                  >
                    Connexion
                  </a>
                  <a
                    routerLink="/signup"
                    class="inline-flex items-center px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-brand-700 rounded-xl hover:from-brand-700 hover:to-brand-800 shadow-lg shadow-brand-500/30 hover:shadow-brand-500/40 transition-all"
                  >
                    <span class="hidden sm:inline">S'inscrire</span>
                    <span class="sm:hidden">Rejoindre</span>
                  </a>
                </div>
              }

              <!-- Mobile Menu Button -->
              <button
                type="button"
                (click)="toggleMobileMenu()"
                class="lg:hidden p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                aria-label="Menu"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  @if (isMobileMenuOpen) {
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  } @else {
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                  }
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Desktop Navigation -->
      <nav class="hidden lg:block bg-gray-50 dark:bg-gray-800/50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center gap-1 h-12">
            <!-- Categories Dropdown -->
            <div class="relative">
              <button
                type="button"
                (click)="toggleCategories()"
                class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
                </svg>
                Catégories
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              @if (isCategoriesOpen) {
                <div class="absolute left-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50">
                  @for (cat of categories; track cat.slug) {
                    <a
                      [routerLink]="['/products']"
                      [queryParams]="{ category: cat.slug }"
                      (click)="closeCategories()"
                      class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-600 dark:hover:text-brand-400"
                    >
                      <span class="text-lg">{{ cat.icon }}</span>
                      {{ cat.name }}
                    </a>
                  }
                </div>
              }
            </div>

            <div class="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>

            @for (item of navItems; track item.path) {
              <a
                [routerLink]="item.path"
                [queryParams]="item.queryParams"
                routerLinkActive="bg-white dark:bg-gray-700 text-brand-600 dark:text-brand-400 shadow-sm"
                [routerLinkActiveOptions]="{ exact: item.path === '/' }"
                class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white rounded-lg transition-all"
              >
                {{ item.name }}
              </a>
            }

            <div class="flex-1"></div>

            <!-- Special offers link -->
            <a
              routerLink="/products"
              [queryParams]="{ promo: true }"
              class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Offres du jour
            </a>
          </div>
        </div>
      </nav>

      <!-- Mobile Search Panel -->
      @if (isSearchOpen) {
        <div class="lg:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
          <div class="relative">
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (keyup.enter)="performSearch()"
              placeholder="Rechercher..."
              class="w-full h-12 pl-12 pr-4 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-brand-500"
              autofocus
            />
            <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      }

      <!-- Mobile Navigation -->
      @if (isMobileMenuOpen) {
        <div class="lg:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <!-- Categories Section -->
          <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Catégories</p>
            <div class="grid grid-cols-4 gap-2">
              @for (cat of categories; track cat.slug) {
                <a
                  [routerLink]="['/products']"
                  [queryParams]="{ category: cat.slug }"
                  (click)="closeMobileMenu()"
                  class="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <span class="text-xl">{{ cat.icon }}</span>
                  <span class="text-xs text-gray-600 dark:text-gray-400 text-center">{{ cat.name }}</span>
                </a>
              }
            </div>
          </div>

          <!-- Nav Links -->
          <nav class="px-4 py-3 space-y-1">
            @for (item of navItems; track item.path) {
              <a
                [routerLink]="item.path"
                [queryParams]="item.queryParams"
                routerLinkActive="text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20"
                [routerLinkActiveOptions]="{ exact: item.path === '/' }"
                (click)="closeMobileMenu()"
                class="flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
              >
                {{ item.name }}
              </a>
            }
            <a
              routerLink="/products"
              [queryParams]="{ promo: true }"
              (click)="closeMobileMenu()"
              class="flex items-center gap-3 px-4 py-3 text-base font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Offres du jour
            </a>
          </nav>

          <!-- Auth buttons for mobile -->
          @if (!(isAuthenticated$ | async)) {
            <div class="px-4 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <a
                routerLink="/signin"
                (click)="closeMobileMenu()"
                class="flex-1 py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Connexion
              </a>
              <a
                routerLink="/signup"
                (click)="closeMobileMenu()"
                class="flex-1 py-3 text-center text-sm font-semibold text-white bg-brand-600 rounded-xl hover:bg-brand-700"
              >
                S'inscrire
              </a>
            </div>
          }
        </div>
      }
    </header>
  `
})
export class ShopHeaderComponent {
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private cartService = inject(CartService);
  private router = inject(Router);

  navItems: NavItem[] = [
    { name: 'Accueil', path: '/' },
    { name: 'Boutiques', path: '/boutiques' },
    { name: 'Produits', path: '/products' },
    { name: 'Nouveautés', path: '/products', queryParams: { sort: 'newest' } }
  ];

  categories: CategoryItem[] = [
    { name: 'Vêtements', slug: 'vetements', icon: '👗' },
    { name: 'Électronique', slug: 'electronique', icon: '📱' },
    { name: 'Maison', slug: 'maison', icon: '🏠' },
    { name: 'Beauté', slug: 'beaute', icon: '💄' },
    { name: 'Sport', slug: 'sport', icon: '⚽' },
    { name: 'Alimentation', slug: 'alimentation', icon: '🍎' },
    { name: 'Livres', slug: 'livres', icon: '📚' },
    { name: 'Jouets', slug: 'jouets', icon: '🎮' }
  ];

  isAuthenticated$ = this.authService.isAuthenticated$;
  currentUser$ = this.authService.currentUser$;
  theme$ = this.themeService.theme$;
  cartItemCount$ = this.cartService.cartItemCount$;

  isScrolled = signal(false);
  isMobileMenuOpen = false;
  isUserMenuOpen = false;
  isSearchOpen = false;
  isCategoriesOpen = false;
  searchQuery = '';

  @HostListener('window:scroll')
  onWindowScroll() {
    this.isScrolled.set(window.scrollY > 20);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
      this.isUserMenuOpen = false;
      this.isCategoriesOpen = false;
    }
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    if (this.isMobileMenuOpen) {
      this.isSearchOpen = false;
    }
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
    this.isCategoriesOpen = false;
  }

  closeUserMenu(): void {
    this.isUserMenuOpen = false;
  }

  toggleSearch(): void {
    this.isSearchOpen = !this.isSearchOpen;
    if (this.isSearchOpen) {
      this.isMobileMenuOpen = false;
    }
  }

  toggleCategories(): void {
    this.isCategoriesOpen = !this.isCategoriesOpen;
    this.isUserMenuOpen = false;
  }

  closeCategories(): void {
    this.isCategoriesOpen = false;
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  performSearch(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/products'], {
        queryParams: { search: this.searchQuery.trim() }
      });
      this.isSearchOpen = false;
      this.closeMobileMenu();
    }
  }

  logout(): void {
    this.closeUserMenu();
    this.authService.logout();
  }
}
