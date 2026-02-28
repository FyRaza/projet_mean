import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, forkJoin, map, catchError, switchMap, tap } from 'rxjs';
import { Product, ProductFilter, PaginatedProducts } from '../../core/models/product.model';
import { environment } from '../../../environments/environment';

export interface ProductWithBoutique extends Product {
  boutiqueName: string;
  boutiqueSlug: string;
}

export interface BoutiquePublic {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  categoryId?: string;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/products`;
  private readonly BOUTIQUE_API_URL = `${environment.apiUrl}/boutiques`;
  private readonly CATEGORY_API_URL = `${environment.apiUrl}/categories`;

  // Categories for filtering (loaded from API)
  readonly categories = signal<Array<{ id: string; name: string; slug: string }>>([]);
  private readonly fallbackCategories = [
    { id: 'cat-vetements', name: 'Vêtements', slug: 'vetements' },
    { id: 'cat-electronique', name: 'Électronique', slug: 'electronique' },
    { id: 'cat-beaute', name: 'Beauté & Soins', slug: 'beaute' },
    { id: 'cat-maison', name: 'Maison & Déco', slug: 'maison' },
    { id: 'cat-sport', name: 'Sports & Loisirs', slug: 'sport' },
    { id: 'cat-accessoires', name: 'Accessoires', slug: 'accessoires' },
    { id: 'cat-livres', name: 'Livres & Culture', slug: 'livres' },
    { id: 'cat-alimentation', name: 'Alimentation', slug: 'alimentation' },
    { id: 'cat-jouets', name: 'Jouets', slug: 'jouets' }
  ];

  readonly priceRanges = [
    { label: 'Moins de 50 000 Ar', min: 0, max: 50000 },
    { label: '50 000 - 100 000 Ar', min: 50000, max: 100000 },
    { label: '100 000 - 200 000 Ar', min: 100000, max: 200000 },
    { label: '200 000 - 500 000 Ar', min: 200000, max: 500000 },
    { label: 'Plus de 500 000 Ar', min: 500000, max: Infinity }
  ];

  loadProductCategories(): Observable<Array<{ id: string; name: string; slug: string }>> {
    const params = new HttpParams().set('type', 'product').set('isActive', 'true');
    return this.http.get<any[]>(this.CATEGORY_API_URL, { params }).pipe(
      map((cats) => (cats || []).map((c) => ({
        id: c._id,
        name: c.name,
        slug: c.slug
      }))),
      tap((cats) => {
        if (cats.length > 0) {
          this.categories.set(cats);
        } else if (this.categories().length === 0) {
          this.categories.set(this.fallbackCategories);
        }
      }),
      catchError(() => {
        if (this.categories().length === 0) {
          this.categories.set(this.fallbackCategories);
        }
        return of(this.categories());
      })
    );
  }

  getAllProducts(): Observable<ProductWithBoutique[]> {
    const params = new HttpParams()
      .set('page', '1')
      .set('limit', '500')
      .set('status', 'active');
    return this.http.get<{ products: any[] }>(this.API_URL, { params }).pipe(
      map(response => response.products.map(p => this.mapBackendProduct(p)))
    );
  }

  getProducts(filter: ProductFilter = {}): Observable<PaginatedProducts & { items: ProductWithBoutique[] }> {
    let params = new HttpParams();
    if (filter.page) params = params.set('page', filter.page.toString());
    if (filter.limit) params = params.set('limit', filter.limit.toString());
    if (filter.search) params = params.set('keyword', filter.search);
    if (filter.categoryId) params = params.set('category', filter.categoryId);
    if (filter.boutiqueId) params = params.set('boutique', filter.boutiqueId);
    if (filter.minPrice !== undefined) params = params.set('minPrice', String(filter.minPrice));
    if (filter.maxPrice !== undefined) params = params.set('maxPrice', String(filter.maxPrice));
    if (filter.tags?.length) params = params.set('tags', filter.tags.join(','));
    if (filter.featured) params = params.set('featured', 'true');
    if (filter.status) params = params.set('status', filter.status);
    if (filter.inStock) params = params.set('inStock', 'true');

    const sortMap: Record<NonNullable<ProductFilter['sortBy']>, string> = {
      popular: '-createdAt',
      newest: '-createdAt',
      price_asc: 'price',
      price_desc: '-price',
      name: 'name'
    };
    if (filter.sortBy) {
      params = params.set('sort', sortMap[filter.sortBy]);
    }

    return this.http.get<{ products: any[], page: number, pages: number, total: number }>(this.API_URL, { params }).pipe(
      map(response => ({
        items: response.products.map(p => this.mapBackendProduct(p)),
        total: response.total || response.products.length * response.pages, // Fallback if total not returned
        page: response.page,
        limit: filter.limit || 12,
        totalPages: response.pages
      }))
    );
  }

  private mapBackendProduct(p: any): ProductWithBoutique {
    return {
      id: p._id,
      boutiqueId: p.boutique?._id || p.boutique,
      categoryId: p.category?._id || p.category,
      name: p.name,
      slug: p.slug,
      description: p.description,
      shortDescription: p.shortDescription,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      stock: p.stock,
      lowStockThreshold: p.lowStockThreshold,
      images: this.normalizeImages(p.images),
      status: p.status,
      isFeatured: p.isFeatured,
      tags: p.tags || [],
      sku: p.sku,
      createdAt: new Date(p.createdAt),
      updatedAt: new Date(p.updatedAt),
      boutiqueName: p.boutique?.name || '',
      boutiqueSlug: p.boutique?.slug || ''
    };
  }

  /** Convertit les images (string ou objet) en ProductImage[] */
  private normalizeImages(images: any[]): import('../../core/models/product.model').ProductImage[] {
    if (!images || !Array.isArray(images)) return [];
    return images.map((img: any, index: number) => {
      if (typeof img === 'string') {
        return { id: 'img-' + index, url: img, position: index, isPrimary: index === 0 };
      }
      // Déjà un objet ProductImage
      return {
        id: img.id || img._id || 'img-' + index,
        url: img.url || img,
        alt: img.alt,
        position: img.position ?? index,
        isPrimary: img.isPrimary ?? (index === 0)
      };
    });
  }

  getProductBySlug(boutiqueSlug: string, productSlug: string): Observable<ProductWithBoutique | null> {
    return this.http.get<any>(`${this.API_URL}/slug/${productSlug}`).pipe(
      map((product) => {
        const mapped = this.mapBackendProduct(product);
        return mapped.boutiqueSlug === boutiqueSlug ? mapped : null;
      }),
      catchError(() => of(null))
    );
  }

  getProductById(id: string): Observable<ProductWithBoutique | null> {
    return this.http.get<ProductWithBoutique>(`${this.API_URL}/${id}`).pipe(
      catchError(() => of(null))
    );
  }

  getFeaturedProducts(limit: number = 8): Observable<ProductWithBoutique[]> {
    return this.getAllProducts().pipe(
      map(products => products.filter(p => p.isFeatured).slice(0, limit))
    );
  }

  getProductsByBoutique(boutiqueSlug: string): Observable<ProductWithBoutique[]> {
    return this.getBoutiqueBySlug(boutiqueSlug).pipe(
      switchMap((boutique) => {
        if (!boutique) return of([]);
        const params = new HttpParams().set('boutique', boutique.id).set('limit', '100');
        return this.http.get<{ products: any[] }>(this.API_URL, { params }).pipe(
          map((response) => (response.products || []).map((p) => this.mapBackendProduct(p)))
        );
      })
    )
  }

  getRelatedProducts(productId: string, limit: number = 4): Observable<ProductWithBoutique[]> {
    return this.getProductById(productId).pipe(
      switchMap((current) => {
        if (!current) return of([]);
        const params = new HttpParams()
          .set('limit', String(Math.max(limit + 1, 6)))
          .set('sort', '-createdAt')
          .set('status', 'active');
        const withCategory = current.categoryId ? params.set('category', String(current.categoryId)) : params;

        return this.http.get<{ products: any[] }>(this.API_URL, { params: withCategory }).pipe(
          map((response) =>
            (response.products || [])
              .map((p) => this.mapBackendProduct(p))
              .filter((p) => p.id !== productId)
              .slice(0, limit)
          )
        );
      })
    );
  }

  getAllTags(): string[] {
    return ['Nouveau', 'Tendance', 'Promo', 'Bio', 'Luxe', 'Sport']; // Hardcoded or fetch unique from products
  }

  getBoutiques(): Observable<BoutiquePublic[]> {
    return this.http.get<any[]>(this.BOUTIQUE_API_URL).pipe(
      map((boutiques) => (boutiques || []).map((b) => ({
        id: b._id,
        name: b.name,
        slug: b.slug,
        description: b.description,
        logo: b.logo,
        categoryId: b.categoryId
      })))
    );
  }

  getBoutiqueBySlug(slug: string): Observable<BoutiquePublic | null> {
    return this.getBoutiques().pipe(
      map((boutiques) => boutiques.find((b) => b.slug === slug) || null)
    );
  }

  getFeaturedBoutiques(limit = 6): Observable<Array<BoutiquePublic & { productCount: number }>> {
    return forkJoin({
      boutiques: this.getBoutiques(),
      products: this.getAllProducts()
    }).pipe(
      map(({ boutiques, products }) => {
        return boutiques
          .map((boutique) => ({
            ...boutique,
            productCount: products.filter((p) => p.boutiqueId === boutique.id).length
          }))
          .sort((a, b) => b.productCount - a.productCount)
          .slice(0, limit);
      })
    );
  }
}
