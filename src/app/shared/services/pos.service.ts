import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PosSaleData,
  PosSale,
  PosStats,
  PosFilters,
  PaginatedPosSales,
  PosDailySummary
} from '../../core/models/pos.model';
import { Product, PaginatedProducts } from '../../core/models/product.model';

@Injectable({ providedIn: 'root' })
export class PosService {
  private http = inject(HttpClient);
  private readonly API_URL = environment.apiUrl;

  // ─────────────────────────────────────────────
  // Create a POS sale
  // ─────────────────────────────────────────────
  createPosSale(data: PosSaleData): Observable<PosSale> {
    return this.http.post<PosSale>(`${this.API_URL}/orders/pos`, data);
  }

  // ─────────────────────────────────────────────
  // Get POS sales list
  // ─────────────────────────────────────────────
  getPosSales(filters: PosFilters): Observable<PaginatedPosSales> {
    let params = new HttpParams();
    if (filters.boutiqueId) params = params.set('boutiqueId', filters.boutiqueId);
    if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params = params.set('dateTo', filters.dateTo);
    if (filters.paymentMethod) params = params.set('paymentMethod', filters.paymentMethod);
    if (filters.search) params = params.set('search', filters.search);
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());

    return this.http.get<PaginatedPosSales>(`${this.API_URL}/orders/pos`, { params });
  }

  // ─────────────────────────────────────────────
  // Get POS statistics
  // ─────────────────────────────────────────────
  getPosStats(boutiqueId: string, dateFrom?: string, dateTo?: string): Observable<PosStats> {
    let params = new HttpParams().set('boutiqueId', boutiqueId);
    if (dateFrom) params = params.set('dateFrom', dateFrom);
    if (dateTo) params = params.set('dateTo', dateTo);

    return this.http.get<PosStats>(`${this.API_URL}/orders/pos/stats`, { params });
  }

  // ─────────────────────────────────────────────
  // Get daily cash register summary
  // ─────────────────────────────────────────────
  getDailySummary(boutiqueId: string, date?: string): Observable<PosDailySummary> {
    let params = new HttpParams().set('boutiqueId', boutiqueId);
    if (date) params = params.set('date', date);
    return this.http.get<PosDailySummary>(`${this.API_URL}/orders/pos/daily-summary`, { params });
  }

  // ─────────────────────────────────────────────
  // Void (cancel) a POS sale
  // ─────────────────────────────────────────────
  voidPosSale(orderId: string): Observable<any> {
    return this.http.put(`${this.API_URL}/orders/pos/${orderId}/void`, {});
  }

  // ─────────────────────────────────────────────
  // Search products for POS (quick search)
  // ─────────────────────────────────────────────
  searchProducts(boutiqueId: string, query: string, limit = 20): Observable<Product[]> {
    let params = new HttpParams()
      .set('boutique', boutiqueId)
      .set('limit', limit.toString())
      .set('status', 'active');

    if (query) {
      params = params.set('keyword', query);
    }

    return this.http.get<any>(`${this.API_URL}/products`, { params }).pipe(
      map(res => (res.products || []).map((p: any) => this.mapProduct(p)))
    );
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
