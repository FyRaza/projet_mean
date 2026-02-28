import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductService } from '../../../../shared/services/product.service';

interface BoutiqueCard {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo?: string;
  productCount: number;
}

@Component({
  selector: 'app-boutique-listing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">Toutes les boutiques</h1>
      @if (isLoading()) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (i of [1, 2, 3, 4, 5, 6]; track i) {
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
              <div class="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg mb-4"></div>
              <div class="h-5 w-2/3 bg-gray-100 dark:bg-gray-700 rounded mb-2"></div>
              <div class="h-4 w-full bg-gray-100 dark:bg-gray-700 rounded mb-4"></div>
            </div>
          }
        </div>
      } @else {
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @for (boutique of boutiques(); track boutique.id) {
          <a
            [routerLink]="['/boutiques', boutique.slug]"
            class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
          >
            <div class="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg mb-4 overflow-hidden flex items-center justify-center">
              @if (boutique.logo) {
                <img [src]="boutique.logo" [alt]="boutique.name" class="w-full h-full object-cover" />
              } @else {
                <span class="text-2xl font-bold text-gray-500 dark:text-gray-300">{{ boutique.name.charAt(0) }}</span>
              }
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">{{ boutique.name }}</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-1">{{ boutique.description || 'Boutique du centre commercial' }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-4">{{ boutique.productCount }} produit(s)</p>
            <span class="text-brand-600 dark:text-brand-400 text-sm font-medium">Voir la boutique &rarr;</span>
          </a>
        }
      </div>
      }
    </div>
  `
})
export class BoutiqueListingComponent implements OnInit {
  private productService = inject(ProductService);

  boutiques = signal<BoutiqueCard[]>([]);
  isLoading = signal(true);

  ngOnInit(): void {
    this.productService.getFeaturedBoutiques(100).subscribe({
      next: (boutiques) => {
        this.boutiques.set((boutiques || []).map((b) => ({
          id: b.id,
          name: b.name,
          slug: b.slug,
          description: b.description || '',
          logo: b.logo,
          productCount: b.productCount || 0
        })));
        this.isLoading.set(false);
      },
      error: () => {
        this.boutiques.set([]);
        this.isLoading.set(false);
      }
    });
  }
}
