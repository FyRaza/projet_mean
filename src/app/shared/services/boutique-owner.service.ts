import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Boutique, BoutiqueStats } from '../../core/models/boutique.model';
import { Product, PaginatedProducts } from '../../core/models/product.model';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface BoutiqueProfileUpdateData {
    name?: string;
    description?: string;
    contactEmail?: string;
    contactPhone?: string;
    logo?: string;
    coverImage?: string;
    categoryId?: string;
}

export interface ProductFormData {
    name: string;
    price: number;
    description?: string;
    shortDescription?: string;
    categoryId?: string;
    boutiqueId: string;
    stock: number;
    images?: string[];
    tags?: string[];
    isFeatured?: boolean;
    sku?: string;
    compareAtPrice?: number;
    status?: 'active' | 'draft' | 'archived' | 'out_of_stock';
}

@Injectable({ providedIn: 'root' })
export class BoutiqueOwnerService {
    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private readonly API_URL = environment.apiUrl;

    // ─────────────────────────────────────────────
    // Boutique Profile (for the logged-in owner)
    // ─────────────────────────────────────────────

    /**
     * Get boutique for the currently logged-in boutique owner.
     * Fetches all boutiques and returns the first one owned by the user.
     */
    getMyBoutique(): Observable<Boutique | null> {
        return this.http.get<any[]>(`${this.API_URL}/boutiques`)
            .pipe(
                map(boutiques => {
                    if (!boutiques || boutiques.length === 0) return null;
                    const currentUserId = this.authService.currentUser?.id;
                    const owned = currentUserId
                        ? boutiques.find((b: any) => {
                            const ownerId = b?.owner?._id || b?.owner;
                            return String(ownerId) === String(currentUserId);
                        })
                        : null;
                    return owned ? this.mapBoutique(owned) : null;
                })
            );
    }

    getBoutiqueById(id: string): Observable<Boutique> {
        return this.http.get<any>(`${this.API_URL}/boutiques/${id}`)
            .pipe(map(b => this.mapBoutique(b)));
    }

    updateBoutiqueProfile(id: string, data: BoutiqueProfileUpdateData): Observable<Boutique> {
        return this.http.put<any>(`${this.API_URL}/boutiques/${id}`, data)
            .pipe(map(b => this.mapBoutique(b)));
    }

    getBoutiqueStats(id: string): Observable<BoutiqueStats> {
        return this.http.get<any>(`${this.API_URL}/orders/stats?boutiqueId=${id}`)
            .pipe(
                map(stats => ({
                    totalProducts: 0,
                    totalOrders: stats?.totalOrders || 0,
                    totalRevenue: stats?.totalRevenue || 0,
                    pendingOrders: stats?.pendingOrders || 0,
                    averageRating: 0,
                    totalReviews: 0
                }))
            );
    }

    private mapBoutique(b: any): Boutique {
        return {
            id: b._id,
            name: b.name,
            slug: b.slug,
            description: b.description || '',
            logo: b.logo,
            coverImage: b.coverImage,
            ownerId: b.owner?._id || b.owner,
            categoryId: b.categoryId,
            boxId: undefined,
            status: b.status,
            openingHours: b.openingHours || [],
            contactEmail: b.contactEmail || '',
            contactPhone: b.contactPhone,
            socialLinks: b.socialLinks,
            createdAt: new Date(b.createdAt),
            updatedAt: new Date(b.updatedAt)
        };
    }

    // ─────────────────────────────────────────────
    // Product Management
    // ─────────────────────────────────────────────

    getBoutiqueProducts(boutiqueId: string, page = 1, limit = 12, search?: string): Observable<PaginatedProducts> {
        let params = new HttpParams()
            .set('boutique', boutiqueId)
            .set('page', page.toString())
            .set('limit', limit.toString());
        if (search) params = params.set('keyword', search);

        return this.http.get<any>(`${this.API_URL}/products`, { params }).pipe(
            map(res => ({
                products: (res.products || []).map((p: any) => this.mapProduct(p)),
                page: res.page || 1,
                pages: res.pages || 1,
                total: res.total || 0
            }))
        );
    }

    getProductById(id: string): Observable<Product> {
        return this.http.get<any>(`${this.API_URL}/products/${id}`)
            .pipe(map(p => this.mapProduct(p)));
    }

    createProduct(data: ProductFormData): Observable<Product> {
        return this.http.post<any>(`${this.API_URL}/products`, data)
            .pipe(map(p => this.mapProduct(p)));
    }

    updateProduct(id: string, data: Partial<ProductFormData>): Observable<Product> {
        return this.http.put<any>(`${this.API_URL}/products/${id}`, data)
            .pipe(map(p => this.mapProduct(p)));
    }

    deleteProduct(id: string): Observable<boolean> {
        return this.http.delete(`${this.API_URL}/products/${id}`)
            .pipe(map(() => true));
    }

    private mapProduct(p: any): Product {
        return {
            id: p._id,
            name: p.name,
            slug: p.slug,
            description: p.description || '',
            shortDescription: p.shortDescription,
            price: p.price,
            compareAtPrice: p.compareAtPrice,
            images: this.normalizeImages(p.images),
            boutiqueId: p.boutique?._id || p.boutique,
            boutiqueName: p.boutique?.name,
            boutiqueSlug: p.boutique?.slug,
            categoryId: p.category?._id || p.category,
            stock: p.stock || 0,
            sku: p.sku,
            tags: p.tags || [],
            isFeatured: p.isFeatured || false,
            status: p.status || 'active',
            lowStockThreshold: p.lowStockThreshold || 5,
            variants: [],
            createdAt: new Date(p.createdAt),
            updatedAt: new Date(p.updatedAt)
        };
    }

    /** Convertit les images (string ou objet) en ProductImage[] */
    private normalizeImages(images: any[]): import('../../core/models/product.model').ProductImage[] {
        if (!images || !Array.isArray(images)) return [];
        return images.map((img: any, index: number) => {
            if (typeof img === 'string') {
                return { id: 'img-' + index, url: img, position: index, isPrimary: index === 0 };
            }
            return {
                id: img.id || img._id || 'img-' + index,
                url: img.url || img,
                alt: img.alt,
                position: img.position ?? index,
                isPrimary: img.isPrimary ?? (index === 0)
            };
        });
    }
}
