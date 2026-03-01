import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService, ProductWithBoutique } from '../../../shared/services/product.service';
import { AdminService } from '../../../shared/services/admin.service';
import { forkJoin } from 'rxjs';

interface FeaturedBoutique {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  productCount: number;
  image: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  productCount: number;
}

interface Testimonial {
  id: string;
  name: string;
  avatar: string;
  role: string;
  content: string;
  rating: number;
}

@Component({
  selector: 'app-shop-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <!-- Hero Section -->
    <section class="relative min-h-[600px] lg:min-h-[700px] flex items-center overflow-hidden">
      <!-- Background Image -->
      <div class="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&q=80"
          alt="Shopping"
          class="w-full h-full object-cover"
        />
        <div class="absolute inset-0 bg-gradient-to-r from-gray-900/90 via-gray-900/70 to-gray-900/40"></div>
      </div>

      <!-- Floating Elements -->
      <div class="absolute top-20 right-20 w-72 h-72 bg-brand-500/20 rounded-full blur-3xl hidden lg:block"></div>
      <div class="absolute bottom-20 left-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl hidden lg:block"></div>

      <!-- Content -->
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 w-full">
        <div class="max-w-2xl">
          <span class="inline-flex items-center gap-2 px-4 py-2 bg-brand-500/20 text-brand-300 text-sm font-medium rounded-full mb-6 backdrop-blur-sm border border-brand-500/30">
            <span class="w-2 h-2 bg-brand-400 rounded-full animate-pulse"></span>
            Nouveau - Plus de 10 boutiques disponibles
          </span>

          <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            Découvrez le meilleur du
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-purple-400">
              shopping local
            </span>
          </h1>

          <p class="text-lg sm:text-xl text-gray-300 mb-8 leading-relaxed">
            Des milliers de produits authentiques, des centaines de boutiques partenaires,
            et une expérience d'achat unique à Madagascar.
          </p>

          <div class="flex flex-col sm:flex-row gap-4 mb-12">
            <a
              routerLink="/products"
              class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold rounded-xl hover:from-brand-600 hover:to-brand-700 shadow-lg shadow-brand-500/30 transition-all group"
            >
              Explorer les produits
              <svg class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
            <a
              routerLink="/boutiques"
              class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white font-semibold rounded-xl backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Voir les boutiques
            </a>
          </div>

          <!-- Stats -->
          <div class="flex flex-wrap gap-8 lg:gap-12">
            <div>
              <p class="text-3xl lg:text-4xl font-bold text-white">{{ stats().boutiques }}</p>
              <p class="text-sm text-gray-400">Boutiques partenaires</p>
            </div>
            <div>
              <p class="text-3xl lg:text-4xl font-bold text-white">{{ stats().products }}</p>
              <p class="text-sm text-gray-400">Produits disponibles</p>
            </div>
            <div>
              <p class="text-3xl lg:text-4xl font-bold text-white">{{ stats().categories }}</p>
              <p class="text-sm text-gray-400">Categories actives</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Scroll indicator -->
      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center gap-2">
        <span class="text-xs text-gray-400 uppercase tracking-widest">Découvrir</span>
        <div class="w-6 h-10 rounded-full border-2 border-gray-400/50 flex items-start justify-center p-2">
          <div class="w-1.5 h-3 bg-gray-400 rounded-full animate-bounce"></div>
        </div>
      </div>
    </section>

    <!-- Categories Section -->
    <section class="py-16 lg:py-24 bg-white dark:bg-gray-900">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Explorez par catégorie
          </h2>
          <p class="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Trouvez rapidement ce que vous cherchez parmi nos nombreuses catégories
          </p>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6">
          @for (category of categories(); track category.id) {
            <a
              [routerLink]="['/products']"
              [queryParams]="{ category: category.slug }"
              class="group relative aspect-square rounded-2xl overflow-hidden"
            >
              <img
                [src]="category.image"
                [alt]="category.name"
                class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/40 to-transparent"></div>
              <div class="absolute inset-0 flex flex-col items-center justify-end p-4 text-center">
                <div class="w-12 h-12 mb-2 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  @switch (category.slug) {
                    @case ('vetements') {
                      <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6zM3 6h18M16 10a4 4 0 01-8 0" />
                      </svg>
                    }
                    @case ('electronique') {
                      <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    }
                    @case ('maison') {
                      <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    }
                    @case ('beaute') {
                      <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                      </svg>
                    }
                    @case ('sport') {
                      <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    }
                    @case ('alimentation') {
                      <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    }
                  }
                </div>
                <h3 class="text-white font-semibold text-sm lg:text-base">{{ category.name }}</h3>
                <p class="text-gray-300 text-xs">{{ category.productCount }} produits</p>
              </div>
            </a>
          }
        </div>
      </div>
    </section>

    <!-- Featured Boutiques -->
    <section class="py-16 lg:py-24 bg-gray-50 dark:bg-gray-800/50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-12">
          <div>
            <h2 class="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Boutiques vedettes
            </h2>
            <p class="text-lg text-gray-600 dark:text-gray-400">
              Les meilleures boutiques sélectionnées pour vous
            </p>
          </div>
          <a
            routerLink="/boutiques"
            class="inline-flex items-center gap-2 text-brand-600 dark:text-brand-400 font-semibold hover:gap-3 transition-all"
          >
            Voir toutes les boutiques
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          @for (boutique of featuredBoutiques(); track boutique.id) {
            <a
              [routerLink]="['/boutiques', boutique.slug]"
              class="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
            >
              <div class="relative h-48 overflow-hidden">
                <img
                  [src]="boutique.image"
                  [alt]="boutique.name"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div class="absolute top-4 right-4 px-3 py-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ boutique.category }}
                </div>
              </div>
              <div class="p-6">
                <div class="flex items-start justify-between mb-3">
                  <h3 class="text-xl font-bold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {{ boutique.name }}
                  </h3>
                </div>
                <p class="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-4">
                  {{ boutique.description }}
                </p>
                <div class="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                  <span class="text-sm text-gray-500 dark:text-gray-400">
                    {{ boutique.productCount }} produits
                  </span>
                  <span class="inline-flex items-center gap-1 text-brand-600 dark:text-brand-400 font-medium group-hover:gap-2 transition-all">
                    Visiter
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            </a>
          }
        </div>
      </div>
    </section>

    <!-- Featured Products -->
    <section class="py-16 lg:py-24 bg-white dark:bg-gray-900">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-12">
          <div>
            <h2 class="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Produits populaires
            </h2>
            <p class="text-lg text-gray-600 dark:text-gray-400">
              Les produits les plus appréciés par nos clients
            </p>
          </div>
          <a
            routerLink="/products"
            class="inline-flex items-center gap-2 text-brand-600 dark:text-brand-400 font-semibold hover:gap-3 transition-all"
          >
            Voir tous les produits
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          @for (product of featuredProducts(); track product.id) {
            <a
              [routerLink]="['/product', product.boutiqueSlug, product.slug]"
              class="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:border-brand-200 dark:hover:border-brand-800 transition-all duration-300"
            >
              <div class="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
                @if (product.images?.[0]?.url) {
                  <img
                    [src]="product.images[0].url"
                    [alt]="product.name"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                } @else {
                  <div class="w-full h-full flex items-center justify-center">
                    <svg class="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                }

                <!-- Badges -->
                <div class="absolute top-3 left-3 flex flex-col gap-2">
                  @if (product.compareAtPrice && product.compareAtPrice > product.price) {
                    <span class="px-2.5 py-1 text-xs font-bold text-white bg-red-500 rounded-lg">
                      -{{ getDiscountPercent(product) }}%
                    </span>
                  }
                  @if (product.stock <= 5 && product.stock > 0) {
                    <span class="px-2.5 py-1 text-xs font-bold text-amber-700 bg-amber-100 rounded-lg">
                      Stock limité
                    </span>
                  }
                </div>

                @if (product.stock <= 0) {
                  <div class="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                    <span class="px-4 py-2 bg-white text-gray-900 font-semibold rounded-lg">Rupture de stock</span>
                  </div>
                }

                <!-- Quick actions -->
                <div class="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    class="w-10 h-10 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center text-gray-700 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 hover:scale-110 transition-all"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div class="p-4">
                <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">{{ product.boutiqueName }}</p>
                <h3 class="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  {{ product.name }}
                </h3>
                <div class="flex items-center gap-2">
                  <span class="text-lg font-bold text-brand-600 dark:text-brand-400">
                    {{ product.price | number:'1.0-0' }} Ar
                  </span>
                  @if (product.compareAtPrice && product.compareAtPrice > product.price) {
                    <span class="text-sm text-gray-400 line-through">
                      {{ product.compareAtPrice | number:'1.0-0' }} Ar
                    </span>
                  }
                </div>
              </div>
            </a>
          }
        </div>
      </div>
    </section>

    <!-- Promo Banner -->
    <section class="py-16 lg:py-24 bg-gray-50 dark:bg-gray-800/50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="relative rounded-3xl overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600&q=80"
            alt="Promotions"
            class="w-full h-[400px] lg:h-[500px] object-cover"
          />
          <div class="absolute inset-0 bg-gradient-to-r from-purple-900/90 via-purple-800/80 to-transparent"></div>
          <div class="absolute inset-0 flex items-center">
            <div class="max-w-xl px-8 lg:px-16">
              <span class="inline-flex items-center gap-2 px-4 py-2 bg-white/20 text-white text-sm font-medium rounded-full mb-6 backdrop-blur-sm">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Offre limitée
              </span>
              <h2 class="text-3xl lg:text-5xl font-bold text-white mb-4">
                Soldes exceptionnelles jusqu'à -50%
              </h2>
              <p class="text-lg text-purple-100 mb-8">
                Profitez de remises incroyables sur une sélection de produits.
                Ne manquez pas cette occasion unique !
              </p>
              <a
                routerLink="/products"
                [queryParams]="{ promo: true }"
                class="inline-flex items-center gap-2 px-8 py-4 bg-white text-purple-700 font-semibold rounded-xl hover:bg-purple-50 shadow-lg transition-all group"
              >
                Découvrir les offres
                <svg class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-16 lg:py-24 bg-gray-50 dark:bg-gray-800/50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          @for (feature of features; track feature.title) {
            <div class="text-center">
              <div class="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-brand-500/20 to-brand-600/20 flex items-center justify-center">
                <svg class="w-8 h-8 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" [attr.d]="feature.icon" />
                </svg>
              </div>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">{{ feature.title }}</h3>
              <p class="text-gray-600 dark:text-gray-400">{{ feature.description }}</p>
            </div>
          }
        </div>
      </div>
    </section>

  `
})
export class ShopHomeComponent implements OnInit {
  private productService = inject(ProductService);
  private adminService = inject(AdminService);

  featuredBoutiques = signal<FeaturedBoutique[]>([]);
  featuredProducts = signal<ProductWithBoutique[]>([]);
  stats = signal({ boutiques: 0, products: 0, categories: 0 });

  newsletterEmail = '';
  newsletterSuccess = false;

  categories = signal<Category[]>([]);
  private categoryNameById = new Map<string, string>();
  private categoryImageBySlug: Record<string, string> = {
    vetements: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&q=80',
    electronique: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=400&q=80',
    maison: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80',
    beaute: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80',
    sport: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&q=80',
    alimentation: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80',
    jouets: 'https://images.unsplash.com/photo-1558877385-81a1c7e67d72?w=400&q=80',
    livres: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&q=80',
    default: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80'
  };

  testimonials: Testimonial[] = [
    {
      id: '1',
      name: 'Rakoto Andrianaivo',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
      role: 'Client fidèle',
      content: 'Une expérience d\'achat exceptionnelle ! Les produits sont de qualité et la livraison est toujours rapide. Je recommande vivement IAVOKO Centre Commercial.',
      rating: 5
    },
    {
      id: '2',
      name: 'Rasoa Nirina',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80',
      role: 'Acheteuse régulière',
      content: 'J\'adore la variété de boutiques disponibles. On trouve vraiment de tout et les prix sont très compétitifs. Le service client est également au top !',
      rating: 5
    },
    {
      id: '3',
      name: 'Jean Rakotonandrasana',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80',
      role: 'Nouveau client',
      content: 'Première commande et déjà convaincu ! L\'interface est intuitive et le processus d\'achat très simple. Hâte de découvrir d\'autres boutiques.',
      rating: 4
    }
  ];

  features = [
    {
      title: 'Livraison rapide',
      description: 'Recevez vos commandes en 24-48h dans tout Antananarivo',
      icon: 'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0'
    },
    {
      title: 'Paiement sécurisé',
      description: 'Transactions 100% sécurisées avec plusieurs moyens de paiement',
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
    },
    {
      title: 'Support 7j/7',
      description: 'Notre équipe est disponible tous les jours pour vous aider',
      icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z'
    }
  ];

  ngOnInit(): void {
    this.loadCategoriesAndStats();
    this.loadFeaturedProducts();
  }

  private loadFeaturedBoutiques(): void {
    this.productService.getFeaturedBoutiques(6).subscribe({
      next: (boutiques) => {
        this.featuredBoutiques.set(
          boutiques.map((boutique) => ({
            id: boutique.id,
            name: boutique.name,
            slug: boutique.slug,
            description: boutique.description || 'Découvrez cette boutique partenaire.',
            category: this.categoryNameById.get(boutique.categoryId || '') || 'Boutique',
            productCount: boutique.productCount,
            image: boutique.logo || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80'
          }))
        );
      },
      error: () => this.featuredBoutiques.set([])
    });
  }

  private loadFeaturedProducts(): void {
    this.productService.getFeaturedProducts(8).subscribe({
      next: (products) => {
        this.featuredProducts.set(products);
      }
    });
  }

  private loadCategoriesAndStats(): void {
    forkJoin({
      categories: this.adminService.getCategories('product' as any),
      products: this.productService.getAllProducts(),
      boutiques: this.productService.getBoutiques()
    }).subscribe({
      next: ({ categories, products, boutiques }) => {
        this.categoryNameById.clear();
        categories.forEach((category) => {
          this.categoryNameById.set(category.id, category.name);
        });

        const productCountByCategoryId = products.reduce<Record<string, number>>((acc, product) => {
          const categoryId = String(product.categoryId || '');
          if (!categoryId) return acc;
          acc[categoryId] = (acc[categoryId] || 0) + 1;
          return acc;
        }, {});

        const mappedCategories = categories.map((category) => ({
          id: category.id,
          name: category.name,
          slug: category.slug,
          image: this.categoryImageBySlug[category.slug] || this.categoryImageBySlug['default'],
          productCount: productCountByCategoryId[category.id] || 0
        }));
        this.categories.set(mappedCategories.slice(0, 6));

        this.stats.set({
          boutiques: boutiques.length,
          products: products.length,
          categories: mappedCategories.length
        });

        this.loadFeaturedBoutiques();
      },
      error: () => {
        this.categories.set([]);
        this.stats.set({ boutiques: 0, products: 0, categories: 0 });
        this.featuredBoutiques.set([]);
      }
    });
  }

  getDiscountPercent(product: ProductWithBoutique): number {
    if (!product.compareAtPrice || product.compareAtPrice <= product.price) return 0;
    return Math.round((1 - product.price / product.compareAtPrice) * 100);
  }

  subscribeNewsletter(): void {
    if (this.newsletterEmail) {
      this.newsletterSuccess = true;
      this.newsletterEmail = '';
      setTimeout(() => {
        this.newsletterSuccess = false;
      }, 5000);
    }
  }
}
