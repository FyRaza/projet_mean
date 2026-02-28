import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Product, ProductImage } from '../../../../core/models/product.model';
import { BoutiqueOwnerService } from '../../../../shared/services/boutique-owner.service';
import { AdminService } from '../../../../shared/services/admin.service';
import { UploadService } from '../../../../shared/services/upload.service';

interface Category {
  id: string;
  name: string;
}

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div class="flex items-center gap-3 mb-1">
            <a routerLink="/boutique/products" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </a>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ isEditMode ? 'Modifier le produit' : 'Nouveau produit' }}
            </h1>
          </div>
          <p class="text-gray-500 dark:text-gray-400">
            {{ isEditMode ? 'Modifiez les informations de votre produit' : 'Ajoutez un nouveau produit a votre catalogue' }}
          </p>
        </div>
        <div class="flex items-center gap-3">
          <a routerLink="/boutique/products"
             class="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium">
            Annuler
          </a>
          <button
            (click)="saveAsDraft()"
            class="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium">
            Brouillon
          </button>
          <button
            (click)="saveAndPublish()"
            class="px-4 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium">
            {{ isEditMode ? 'Enregistrer' : 'Publier' }}
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Basic Info -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informations generales</h2>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nom du produit <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  [(ngModel)]="product.name"
                  placeholder="Ex: T-shirt Premium Coton Bio"
                  class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description <span class="text-red-500">*</span>
                </label>
                <textarea
                  [(ngModel)]="product.description"
                  rows="5"
                  placeholder="Decrivez votre produit en detail..."
                  class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                ></textarea>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {{ product.description?.length || 0 }}/1000 caracteres
                </p>
              </div>
            </div>
          </div>

          <!-- Images -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Images</h2>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              @for (image of productImages(); track image.id; let i = $index) {
                <div class="relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden group">
                  <img [src]="image.url" [alt]="'Image ' + (i + 1)" class="w-full h-full object-cover" />
                  <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    @if (!image.isPrimary) {
                      <button
                        (click)="setAsPrimary(image.id)"
                        class="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100"
                        title="Definir comme principale">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </button>
                    }
                    <button
                      (click)="removeImage(image.id)"
                      class="p-2 bg-white rounded-full text-red-600 hover:bg-gray-100"
                      title="Supprimer">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  @if (image.isPrimary) {
                    <span class="absolute top-2 left-2 px-2 py-1 text-xs font-medium bg-brand-600 text-white rounded">
                      Principale
                    </span>
                  }
                </div>
              }

              <!-- Add Image Button -->
              <button
                (click)="fileInput.click()"
                [disabled]="isUploading()"
                class="aspect-square border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                @if (isUploading()) {
                  <svg class="w-8 h-8 text-brand-500 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span class="text-sm text-brand-500">Upload...</span>
                } @else {
                  <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span class="text-sm text-gray-500 dark:text-gray-400">Ajouter</span>
                }
              </button>
              <input
                #fileInput
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                (change)="onFilesSelected($event)"
                class="hidden"
              />
            </div>

            <p class="text-sm text-gray-500 dark:text-gray-400">
              Formats acceptes: JPG, PNG, WebP. Taille max: 5 Mo. Recommande: 800x800px minimum.
            </p>
          </div>

          <!-- Pricing -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tarification</h2>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Prix de vente <span class="text-red-500">*</span>
                </label>
                <div class="relative">
                  <input
                    type="number"
                    [(ngModel)]="product.price"
                    min="0"
                    placeholder="0"
                    class="w-full pl-4 pr-12 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                  <span class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">Ar</span>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Prix compare (barre)
                </label>
                <div class="relative">
                  <input
                    type="number"
                    [(ngModel)]="product.compareAtPrice"
                    min="0"
                    placeholder="0"
                    class="w-full pl-4 pr-12 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                  <span class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">Ar</span>
                </div>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Laissez vide si pas de promotion
                </p>
              </div>
            </div>

            @if (product.compareAtPrice && product.price && product.compareAtPrice > product.price) {
              <div class="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p class="text-sm text-green-700 dark:text-green-400">
                  Reduction de {{ getDiscountPercent() }}% (-{{ product.compareAtPrice - product.price | number:'1.0-0' }} Ar)
                </p>
              </div>
            }
          </div>

          <!-- Inventory -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Inventaire</h2>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quantite en stock <span class="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  [(ngModel)]="product.stock"
                  min="0"
                  placeholder="0"
                  class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Seuil d'alerte stock faible
                </label>
                <input
                  type="number"
                  [(ngModel)]="product.lowStockThreshold"
                  min="0"
                  placeholder="5"
                  class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Alerte quand le stock atteint ce niveau
                </p>
              </div>
            </div>

            @if (product.stock !== undefined && product.stock <= 0) {
              <div class="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p class="text-sm text-red-700 dark:text-red-400">
                  Attention: Ce produit sera affiche comme "Rupture de stock"
                </p>
              </div>
            }
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Category -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Organisation</h2>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Categorie <span class="text-red-500">*</span>
                </label>
                <select
                  [(ngModel)]="product.categoryId"
                  class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent">
                  <option value="">Selectionner une categorie</option>
                  @for (cat of categories; track cat.id) {
                    <option [value]="cat.id">{{ cat.name }}</option>
                  }
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tags
                </label>
                <div class="flex flex-wrap gap-2 mb-2">
                  @for (tag of productTags(); track tag) {
                    <span class="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                      {{ tag }}
                      <button (click)="removeTag(tag)" class="hover:text-red-500">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  }
                </div>
                <div class="flex gap-2">
                  <input
                    type="text"
                    [(ngModel)]="newTag"
                    (keyup.enter)="addTag()"
                    placeholder="Ajouter un tag..."
                    class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
                  />
                  <button
                    (click)="addTag()"
                    class="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Featured -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Mise en avant</h2>

            <label class="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                [(ngModel)]="product.isFeatured"
                class="w-5 h-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <div>
                <p class="font-medium text-gray-900 dark:text-white">Produit vedette</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Afficher ce produit dans la section "En vedette"
                </p>
              </div>
            </label>
          </div>

          <!-- Preview Card -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Apercu</h2>

            <div class="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
              <div class="aspect-square bg-gray-100 dark:bg-gray-700">
                @if (productImages().length > 0) {
                  <img [src]="getPrimaryImage()" [alt]="product.name" class="w-full h-full object-cover" />
                } @else {
                  <div class="w-full h-full flex items-center justify-center">
                    <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                }
              </div>
              <div class="p-4">
                <h3 class="font-medium text-gray-900 dark:text-white truncate">
                  {{ product.name || 'Nom du produit' }}
                </h3>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-lg font-bold text-brand-600 dark:text-brand-400">
                    {{ (product.price || 0) | number:'1.0-0' }} Ar
                  </span>
                  @if (product.compareAtPrice && product.compareAtPrice > (product.price || 0)) {
                    <span class="text-sm text-gray-400 line-through">
                      {{ product.compareAtPrice | number:'1.0-0' }} Ar
                    </span>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Success Message -->
      @if (showSuccess()) {
        <div class="fixed bottom-6 right-6 px-6 py-4 bg-green-600 text-white rounded-lg shadow-lg flex items-center gap-3 animate-fade-in">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <span>Produit enregistre avec succes!</span>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
      animation: fade-in 0.3s ease-out;
    }
  `]
})
export class ProductFormComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private boutiqueOwnerService = inject(BoutiqueOwnerService);
  private adminService = inject(AdminService);
  private uploadService = inject(UploadService);

  isEditMode = false;
  productId: string | null = null;
  boutiqueId: string | null = null;
  showSuccess = signal(false);

  product: Partial<Product> = {
    name: '',
    description: '',
    price: undefined,
    compareAtPrice: undefined,
    stock: undefined,
    lowStockThreshold: 5,
    categoryId: '',
    status: 'draft',
    isFeatured: false,
    tags: []
  };

  productImages = signal<ProductImage[]>([]);
  productTags = signal<string[]>([]);
  newTag = '';

  categories: Category[] = [];

  isUploading = signal(false);
  uploadError = signal('');

  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.productId;
    this.loadCategories();
    this.loadMyBoutique();

    if (this.isEditMode && this.productId) {
      this.loadProduct(this.productId);
    }
  }

  private loadCategories(): void {
    this.adminService.getCategories('product' as any).subscribe({
      next: (categories) => {
        this.categories = categories.map((category) => ({ id: category.id, name: category.name }));
      },
      error: () => {
        this.adminService.getCategories().subscribe((categories) => {
          this.categories = categories.map((category) => ({ id: category.id, name: category.name }));
        });
      }
    });
  }

  private loadMyBoutique(): void {
    this.boutiqueOwnerService.getMyBoutique().subscribe((boutique) => {
      this.boutiqueId = boutique?.id || null;
    });
  }

  private loadProduct(id: string): void {
    this.boutiqueOwnerService.getProductById(id).subscribe({
      next: (product) => {
        this.product = { ...product };
        this.productImages.set((product.images as ProductImage[]) || []);
        this.productTags.set(product.tags || []);
      }
    });
  }

  addTag(): void {
    const tag = this.newTag.trim().toLowerCase();
    if (tag && !this.productTags().includes(tag)) {
      this.productTags.update(tags => [...tags, tag]);
      this.newTag = '';
    }
  }

  removeTag(tag: string): void {
    this.productTags.update(tags => tags.filter(t => t !== tag));
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const currentImages = this.productImages();
    const maxAllowed = 8 - currentImages.length;
    const files = Array.from(input.files).slice(0, maxAllowed);

    if (files.length === 0) {
      alert('Vous avez atteint le maximum de 8 images');
      return;
    }

    this.isUploading.set(true);
    this.uploadError.set('');

    if (files.length === 1) {
      this.uploadService.uploadImage(files[0], 'product').subscribe({
        next: (result) => {
          const newImage: ProductImage = {
            id: 'img-' + Date.now(),
            url: result.url,
            position: currentImages.length,
            isPrimary: currentImages.length === 0
          };
          this.productImages.update(images => [...images, newImage]);
          this.isUploading.set(false);
        },
        error: (err) => {
          this.isUploading.set(false);
          this.uploadError.set(err.error?.message || 'Erreur lors de l\'upload');
          alert('Erreur upload: ' + (err.error?.message || 'Erreur inconnue'));
        }
      });
    } else {
      this.uploadService.uploadMultipleImages(files, 'product').subscribe({
        next: (result) => {
          const newImages: ProductImage[] = result.images.map((img, index) => ({
            id: 'img-' + Date.now() + '-' + index,
            url: img.url,
            position: currentImages.length + index,
            isPrimary: currentImages.length === 0 && index === 0
          }));
          this.productImages.update(images => [...images, ...newImages]);
          this.isUploading.set(false);
        },
        error: (err) => {
          this.isUploading.set(false);
          this.uploadError.set(err.error?.message || 'Erreur lors de l\'upload');
          alert('Erreur upload: ' + (err.error?.message || 'Erreur inconnue'));
        }
      });
    }

    // Reset l'input file pour permettre de sélectionner le même fichier
    input.value = '';
  }

  removeImage(imageId: string): void {
    this.productImages.update(images => {
      const filtered = images.filter(img => img.id !== imageId);
      // If removed image was primary, set first remaining as primary
      if (filtered.length > 0 && !filtered.some(img => img.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
  }

  setAsPrimary(imageId: string): void {
    this.productImages.update(images =>
      images.map(img => ({
        ...img,
        isPrimary: img.id === imageId
      }))
    );
  }

  getPrimaryImage(): string {
    const primary = this.productImages().find(img => img.isPrimary);
    return primary?.url || this.productImages()[0]?.url || '';
  }

  getDiscountPercent(): number {
    if (!this.product.compareAtPrice || !this.product.price || this.product.compareAtPrice <= this.product.price) {
      return 0;
    }
    return Math.round((1 - this.product.price / this.product.compareAtPrice) * 100);
  }

  saveAsDraft(): void {
    this.product.status = 'draft';
    this.saveProduct();
  }

  saveAndPublish(): void {
    if (!this.validateProduct()) {
      return;
    }
    this.product.status = 'active';
    this.saveProduct();
  }

  private validateProduct(): boolean {
    if (!this.product.name?.trim()) {
      alert('Le nom du produit est requis');
      return false;
    }
    if (!this.product.description?.trim()) {
      alert('La description est requise');
      return false;
    }
    if (!this.product.price || this.product.price <= 0) {
      alert('Le prix doit etre superieur a 0');
      return false;
    }
    if (!this.product.categoryId) {
      alert('Veuillez selectionner une categorie');
      return false;
    }
    if (this.product.stock === undefined || this.product.stock < 0) {
      alert('La quantite en stock est requise');
      return false;
    }
    return true;
  }

  private saveProduct(): void {
    if (!this.isEditMode && !this.boutiqueId) {
      alert('Impossible de déterminer votre boutique.');
      return;
    }

    // Prepare product data
    const productData: Partial<Product> = {
      ...this.product,
      images: this.productImages(),
      tags: this.productTags(),
      slug: this.generateSlug(this.product.name || ''),
      updatedAt: new Date()
    };

    if (!this.isEditMode) {
      productData.id = 'prod-' + Date.now();
      productData.boutiqueId = 'bout-1'; // Current boutique
      productData.createdAt = new Date();
    }

    const payload = {
      name: productData.name || '',
      description: productData.description,
      price: productData.price || 0,
      compareAtPrice: productData.compareAtPrice,
      stock: productData.stock || 0,
      lowStockThreshold: productData.lowStockThreshold,
      categoryId: productData.categoryId,
      boutiqueId: this.boutiqueId || productData.boutiqueId || '',
      images: (this.productImages() || []).map((image) => image.url),
      tags: productData.tags || [],
      isFeatured: !!productData.isFeatured,
      status: ((productData.status === 'active' ||
        productData.status === 'draft' ||
        productData.status === 'out_of_stock' ||
        productData.status === 'archived')
        ? productData.status
        : 'draft') as 'active' | 'draft' | 'out_of_stock' | 'archived'
    };

    const request$ = this.isEditMode && this.productId
      ? this.boutiqueOwnerService.updateProduct(this.productId, payload)
      : this.boutiqueOwnerService.createProduct(payload as any);

    request$.subscribe({
      next: () => {
        this.showSuccess.set(true);
        setTimeout(() => {
          this.showSuccess.set(false);
          this.router.navigate(['/boutique/products']);
        }, 1200);
      }
    });
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}
