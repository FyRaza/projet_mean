import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, forkJoin, map, of, switchMap, throwError } from 'rxjs';
import { Boutique, BoutiqueStatus, BoutiqueStats } from '../../core/models/boutique.model';
import { Box, BoxStatus } from '../../core/models/box.model';
import { Category, CategoryType } from '../../core/models/category.model';
import { environment } from '../../../environments/environment';

export interface DashboardStats {
  totalBoutiques: number;
  activeBoutiques: number;
  pendingBoutiques: number;
  totalBoxes: number;
  occupiedBoxes: number;
  availableBoxes: number;
  totalCategories: number;
  boutiquesChange: number;
  occupancyChange: number;
}

export interface RecentActivity {
  id: string;
  type: 'boutique_created' | 'boutique_validated' | 'box_assigned' | 'category_created' | 'boutique_updated';
  title: string;
  description: string;
  timestamp: Date;
  icon: string;
  color: string;
}

export interface BoxStats {
  total: number;
  available: number;
  occupied: number;
  reserved: number;
  maintenance: number;
  occupancyRate: number;
  totalMonthlyRevenue: number;
  byZone: { _id: string; total: number; occupied: number; available: number }[];
  byFloor: { _id: number; total: number; occupied: number; available: number }[];
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
}

export interface CreateBoutiqueWithOwnerPayload {
  boutiqueName: string;
  description?: string;
  categoryId?: string;
  phone?: string;
  ownerId?: string;
  ownerEmail: string;
  ownerPassword: string;
  ownerFirstName?: string;
  ownerLastName?: string;
}

export interface BoutiqueOwnerAccount {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  isActive: boolean;
}


@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private readonly API_URL = environment.apiUrl;

  // ─────────────────────────────────────────────
  // Dashboard
  // ─────────────────────────────────────────────
  getDashboardStats(): Observable<DashboardStats> {
    // Aggregate from multiple endpoints
    return new Observable<DashboardStats>(observer => {
      Promise.all([
        this.http.get<any[]>(`${this.API_URL}/boutiques`).toPromise(),
        this.http.get<BoxStats>(`${this.API_URL}/boxes/stats`).toPromise(),
        this.http.get<any[]>(`${this.API_URL}/categories`).toPromise()
      ]).then(([boutiques, boxStats, categories]) => {
        const boutiqueList = boutiques || [];
        const bs = boxStats || { total: 0, occupied: 0, available: 0 };
        const catList = categories || [];

        observer.next({
          totalBoutiques: boutiqueList.length,
          activeBoutiques: boutiqueList.filter((b: any) => b.status === 'active').length,
          pendingBoutiques: boutiqueList.filter((b: any) => b.status === 'pending').length,
          totalBoxes: bs.total,
          occupiedBoxes: bs.occupied,
          availableBoxes: bs.available,
          totalCategories: catList.length,
          boutiquesChange: 0,
          occupancyChange: 0
        });
        observer.complete();
      }).catch(err => {
        observer.error(err);
      });
    });
  }

  getRecentActivity(): Observable<RecentActivity[]> {
    // For now, derive from recent boutiques since we don't have an activity log endpoint
    return this.http.get<any[]>(`${this.API_URL}/boutiques`).pipe(
      map(boutiques => {
        return (boutiques || [])
          .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 5)
          .map((b: any, i: number) => ({
            id: b._id,
            type: b.status === 'pending' ? 'boutique_created' as const : 'boutique_validated' as const,
            title: b.status === 'pending' ? 'Boutique en attente' : 'Boutique active',
            description: `${b.name} — ${b.status}`,
            timestamp: new Date(b.updatedAt),
            icon: 'store',
            color: b.status === 'active' ? 'emerald' : 'blue'
          }));
      })
    );
  }

  // ─────────────────────────────────────────────
  // Boutiques
  // ─────────────────────────────────────────────
  getBoutiques(filter?: { status?: BoutiqueStatus; search?: string }): Observable<Boutique[]> {
    return forkJoin({
      boutiques: this.http.get<any[]>(`${this.API_URL}/boutiques`),
      boxes: this.http.get<any[]>(`${this.API_URL}/boxes`)
    }).pipe(
      map(({ boutiques, boxes }) => {
        const boxByBoutiqueId = new Map<string, string>();
        (boxes || []).forEach((box: any) => {
          if (box?.boutique?._id || box?.boutique) {
            const boutiqueId = box.boutique?._id || box.boutique;
            boxByBoutiqueId.set(String(boutiqueId), String(box._id));
          }
        });

        let result = (boutiques || []).map((b: any) => this.mapBoutique(b, boxByBoutiqueId));
        if (filter?.status) {
          result = result.filter(b => b.status === filter.status);
        }
        if (filter?.search) {
          const search = filter.search.toLowerCase();
          result = result.filter(b =>
            b.name.toLowerCase().includes(search) ||
            b.contactEmail.toLowerCase().includes(search)
          );
        }
        return result;
      })
    );
  }

  getBoutiqueById(id: string): Observable<Boutique | undefined> {
    return forkJoin({
      boutique: this.http.get<any>(`${this.API_URL}/boutiques/${id}`),
      boxes: this.http.get<any[]>(`${this.API_URL}/boxes`)
    }).pipe(
      map(({ boutique, boxes }) => {
        if (!boutique) return undefined;
        const assignedBox = (boxes || []).find((box: any) => {
          const bid = box?.boutique?._id || box?.boutique;
          return String(bid || '') === String(boutique._id);
        });
        return this.mapBoutique(boutique, undefined, assignedBox?._id);
      })
    );
  }

  getBoutiqueStats(id: string): Observable<BoutiqueStats> {
    const orderStats$ = this.http.get<OrderStats>(`${this.API_URL}/orders/stats?boutiqueId=${id}`);
    const productsTotal$ = this.http.get<any>(`${this.API_URL}/products`, {
      params: new HttpParams()
        .set('boutique', id)
        .set('page', '1')
        .set('limit', '1')
    });

    return forkJoin({
      stats: orderStats$,
      productsRes: productsTotal$
    }).pipe(
      map(({ stats, productsRes }) => ({
        totalProducts: Number(productsRes?.total || 0),
        totalOrders: stats?.totalOrders || 0,
        totalRevenue: stats?.totalRevenue || 0,
        pendingOrders: stats?.pendingOrders || 0,
        averageRating: 0,
        totalReviews: 0
      }))
    );
  }

  updateBoutiqueStatus(id: string, status: BoutiqueStatus): Observable<Boutique> {
    return this.http.put<any>(`${this.API_URL}/boutiques/${id}`, { status }).pipe(
      map(b => this.mapBoutique(b))
    );
  }

  createBoutique(data: Partial<Boutique>): Observable<Boutique> {
    return this.http.post<any>(`${this.API_URL}/boutiques`, data).pipe(
      map(b => this.mapBoutique(b))
    );
  }

  createBoutiqueWithOwner(data: CreateBoutiqueWithOwnerPayload): Observable<Boutique> {
    const firstName = data.ownerFirstName?.trim() || data.boutiqueName.trim().split(' ')[0] || 'Owner';
    const lastName = data.ownerLastName?.trim() || 'Boutique';
    const ownerEmail = data.ownerEmail.trim().toLowerCase();

    const createBoutiqueRequest = (ownerId?: string) =>
      this.http.post<any>(`${this.API_URL}/boutiques`, {
        name: data.boutiqueName,
        description: data.description,
        contactEmail: ownerEmail,
        contactPhone: data.phone,
        categoryId: data.categoryId,
        ownerId,
        status: 'active'
      });

    if (data.ownerId) {
      return createBoutiqueRequest(data.ownerId).pipe(
        map((b) => this.mapBoutique(b))
      );
    }

    return this.http.post<any>(`${this.API_URL}/auth/register`, {
      firstName,
      lastName,
      email: ownerEmail,
      password: data.ownerPassword,
      role: 'boutique',
      phone: data.phone
    }).pipe(
      map((authRes) => authRes?.user?.id as string | undefined),
      catchError((error) => {
        const message = String(error?.error?.message || '').toLowerCase();
        if (message.includes('already exists')) {
          // If owner account already exists, backend will resolve it from contactEmail.
          return of(undefined);
        }
        return throwError(() => error);
      }),
      switchMap((ownerId) => createBoutiqueRequest(ownerId)),
      map((b) => this.mapBoutique(b))
    );
  }

  getBoutiqueOwners(): Observable<BoutiqueOwnerAccount[]> {
    return this.http.get<any[]>(`${this.API_URL}/auth/boutique-owners`).pipe(
      map((users) => (users || []).map((u) => ({
        id: u._id,
        firstName: u.firstName || '',
        lastName: u.lastName || '',
        email: u.email || '',
        phone: u.phone || '',
        isActive: Boolean(u.isActive)
      })))
    );
  }

  deleteBoutique(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/boutiques/${id}`);
  }

  private mapBoutique(b: any, boxByBoutiqueId?: Map<string, string>, directBoxId?: string): Boutique {
    const resolvedBoxId =
      directBoxId ||
      (boxByBoutiqueId ? boxByBoutiqueId.get(String(b._id)) : undefined);

    return {
      id: b._id,
      name: b.name,
      slug: b.slug,
      description: b.description || '',
      logo: b.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(b.name)}&background=random&size=128`,
      ownerId: b.owner?._id || b.owner,
      categoryId: b.categoryId,
      boxId: resolvedBoxId,
      status: b.status,
      openingHours: [],
      contactEmail: b.contactEmail || '',
      contactPhone: b.contactPhone || '',
      createdAt: new Date(b.createdAt),
      updatedAt: new Date(b.updatedAt)
    };
  }

  // ─────────────────────────────────────────────
  // Boxes
  // ─────────────────────────────────────────────
  getBoxes(filter?: { status?: BoxStatus; floor?: number; zone?: string }): Observable<Box[]> {
    let params = new HttpParams();
    if (filter?.status) params = params.set('status', filter.status);
    if (filter?.floor !== undefined) params = params.set('floor', filter.floor.toString());
    if (filter?.zone) params = params.set('zone', filter.zone);

    return this.http.get<any[]>(`${this.API_URL}/boxes`, { params }).pipe(
      map(boxes => (boxes || []).map((b: any) => this.mapBox(b)))
    );
  }

  getBoxById(id: string): Observable<Box | undefined> {
    return this.http.get<any>(`${this.API_URL}/boxes/${id}`).pipe(
      map(b => b ? this.mapBox(b) : undefined)
    );
  }

  getBoxStats(): Observable<BoxStats> {
    return this.http.get<BoxStats>(`${this.API_URL}/boxes/stats`);
  }

  createBox(data: any): Observable<Box> {
    return this.http.post<any>(`${this.API_URL}/boxes`, data).pipe(
      map(b => this.mapBox(b))
    );
  }

  updateBox(id: string, data: any): Observable<Box> {
    return this.http.put<any>(`${this.API_URL}/boxes/${id}`, data).pipe(
      map(b => this.mapBox(b))
    );
  }

  deleteBox(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/boxes/${id}`);
  }

  assignBox(boxId: string, boutiqueId: string, boutiqueName?: string): Observable<Box> {
    return this.http.put<any>(`${this.API_URL}/boxes/${boxId}/assign`, { boutiqueId }).pipe(
      map(b => this.mapBox(b))
    );
  }

  unassignBox(boxId: string): Observable<Box> {
    return this.http.put<any>(`${this.API_URL}/boxes/${boxId}/unassign`, {}).pipe(
      map(b => this.mapBox(b))
    );
  }

  private mapBox(b: any): Box {
    return {
      id: b._id,
      name: b.name,
      code: b.code,
      floor: b.floor,
      zone: b.zone,
      area: b.area,
      monthlyRent: b.monthlyRent,
      status: b.status,
      boutiqueId: b.boutique?._id || b.boutique || undefined,
      boutiqueName: b.boutique?.name || undefined,
      features: b.features || [],
      createdAt: new Date(b.createdAt),
      updatedAt: new Date(b.updatedAt)
    };
  }

  // ─────────────────────────────────────────────
  // Categories
  // ─────────────────────────────────────────────
  getCategories(type?: CategoryType): Observable<Category[]> {
    let params = new HttpParams();
    if (type) params = params.set('type', type);

    return this.http.get<any[]>(`${this.API_URL}/categories`, { params }).pipe(
      map(cats => (cats || []).map((c: any) => this.mapCategory(c)))
    );
  }

  getCategoryById(id: string): Observable<Category | undefined> {
    return this.http.get<any>(`${this.API_URL}/categories/${id}`).pipe(
      map(c => c ? this.mapCategory(c) : undefined)
    );
  }

  getCategoryTree(type?: CategoryType): Observable<any[]> {
    let params = new HttpParams();
    if (type) params = params.set('type', type);
    return this.http.get<any[]>(`${this.API_URL}/categories/tree`, { params });
  }

  createCategory(data: Partial<Category>): Observable<Category> {
    return this.http.post<any>(`${this.API_URL}/categories`, data).pipe(
      map(c => this.mapCategory(c))
    );
  }

  updateCategory(id: string, data: Partial<Category>): Observable<Category> {
    return this.http.put<any>(`${this.API_URL}/categories/${id}`, data).pipe(
      map(c => this.mapCategory(c))
    );
  }

  deleteCategory(id: string): Observable<boolean> {
    return this.http.delete(`${this.API_URL}/categories/${id}`).pipe(
      map(() => true)
    );
  }

  toggleCategoryStatus(id: string): Observable<Category> {
    return this.http.patch<any>(`${this.API_URL}/categories/${id}/toggle`, {}).pipe(
      map(c => this.mapCategory(c))
    );
  }

  private mapCategory(c: any): Category {
    return {
      id: c._id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      icon: c.icon,
      type: c.type,
      parentId: c.parent?._id || c.parent || undefined,
      position: 0,
      isActive: c.isActive,
      productCount: 0,
      boutiqueCount: 0,
      createdAt: new Date(c.createdAt),
      updatedAt: new Date(c.updatedAt)
    };
  }

  // ─────────────────────────────────────────────
  // Order Stats (for dashboard)
  // ─────────────────────────────────────────────
  getOrderStats(boutiqueId?: string): Observable<OrderStats> {
    let params = new HttpParams();
    if (boutiqueId) params = params.set('boutiqueId', boutiqueId);
    return this.http.get<OrderStats>(`${this.API_URL}/orders/stats`, { params });
  }
}
