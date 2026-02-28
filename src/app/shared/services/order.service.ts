import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Order, OrderStatus, PaymentStatus, OrderFilter } from '../../core/models/order.model';
import { environment } from '../../../environments/environment';

export interface PaginatedOrders {
    orders: Order[];
    page: number;
    pages: number;
    total: number;
}

export interface CreateOrderPayload {
    items: { product: string; quantity: number }[];
    boutiqueId: string;
    fulfillmentType?: 'delivery' | 'pickup';
    paymentMethod?: string;
    shippingAddress?: {
        street: string;
        landmark?: string;
        city: string;
        postalCode: string;
        country: string;
        latitude?: number;
        longitude?: number;
    };
    notes?: string;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
    private http = inject(HttpClient);
    private readonly API_URL = `${environment.apiUrl}/orders`;

    // ─────────────────────────────────────────────
    // Fetch orders with filters
    // ─────────────────────────────────────────────
    getOrders(filter?: OrderFilter): Observable<PaginatedOrders> {
        let params = new HttpParams();
        if (filter?.status) params = params.set('status', filter.status);
        if (filter?.paymentStatus) params = params.set('paymentStatus', filter.paymentStatus);
        if (filter?.boutiqueId) params = params.set('boutiqueId', filter.boutiqueId);
        if (filter?.page) params = params.set('page', filter.page.toString());
        if (filter?.limit) params = params.set('limit', filter.limit.toString());
        if (filter?.dateFrom) params = params.set('dateFrom', filter.dateFrom.toISOString());
        if (filter?.dateTo) params = params.set('dateTo', filter.dateTo.toISOString());

        return this.http.get<any>(this.API_URL, { params }).pipe(
            map(res => ({
                orders: (res.orders || []).map((o: any) => this.mapOrder(o)),
                page: res.page || 1,
                pages: res.pages || 1,
                total: res.total || 0
            }))
        );
    }

    // ─────────────────────────────────────────────
    // Get single order
    // ─────────────────────────────────────────────
    getOrderById(id: string): Observable<Order> {
        return this.http.get<any>(`${this.API_URL}/${id}`).pipe(
            map(o => this.mapOrder(o))
        );
    }

    // ─────────────────────────────────────────────
    // Create order (checkout)
    // ─────────────────────────────────────────────
    createOrder(payload: CreateOrderPayload): Observable<Order> {
        return this.http.post<any>(this.API_URL, payload).pipe(
            map(o => this.mapOrder(o))
        );
    }

    // ─────────────────────────────────────────────
    // Update order status (boutique owner / admin)
    // ─────────────────────────────────────────────
    updateOrderStatus(orderId: string, status: OrderStatus): Observable<Order> {
        const backendStatus = status === 'confirmed' ? 'processing' : status;
        return this.http.put<any>(`${this.API_URL}/${orderId}/status`, { status: backendStatus }).pipe(
            map(o => this.mapOrder(o))
        );
    }

    // ─────────────────────────────────────────────
    // Cancel order (client only, pending orders)
    // ─────────────────────────────────────────────
    cancelOrder(orderId: string): Observable<Order> {
        return this.http.put<any>(`${this.API_URL}/${orderId}/cancel`, {}).pipe(
            map(o => this.mapOrder(o))
        );
    }

    // ─────────────────────────────────────────────
    // Update payment status (admin only)
    // ─────────────────────────────────────────────
    updatePaymentStatus(orderId: string, paymentStatus: PaymentStatus): Observable<Order> {
        return this.http.put<any>(`${this.API_URL}/${orderId}/payment`, { paymentStatus }).pipe(
            map(o => this.mapOrder(o))
        );
    }

    // ─────────────────────────────────────────────
    // Get order statistics
    // ─────────────────────────────────────────────
    getOrderStats(boutiqueId?: string): Observable<any> {
        let params = new HttpParams();
        if (boutiqueId) params = params.set('boutiqueId', boutiqueId);
        return this.http.get<any>(`${this.API_URL}/stats`, { params });
    }

    // ─────────────────────────────────────────────
    // Map backend response → frontend Order model
    // ─────────────────────────────────────────────
    private mapOrder(o: any): Order {
        const mappedStatus: OrderStatus =
            o.status === 'processing' ? 'confirmed' : (o.status as OrderStatus);

        return {
            id: o._id,
            orderNumber: o._id?.slice(-8).toUpperCase() || 'N/A',
            customerId: o.user?._id || o.user,
            customerName: o.user ? `${o.user.firstName || ''} ${o.user.lastName || ''}`.trim() : 'Client',
            customerEmail: o.user?.email || '',
            boutiqueId: o.boutique?._id || o.boutique,
            boutiqueName: o.boutique?.name || '',
            items: (o.items || []).map((item: any) => ({
                id: item._id,
                productId: item.product?._id || item.product,
                productName: item.name || item.product?.name || '',
                productImage: item.product?.images?.[0]?.url || item.product?.images?.[0] || undefined,
                quantity: item.quantity,
                unitPrice: item.price,
                totalPrice: item.price * item.quantity
            })),
            subtotal: o.totalAmount || 0,
            tax: 0,
            discount: 0,
            total: o.totalAmount || 0,
            status: mappedStatus,
            paymentStatus: o.paymentStatus as PaymentStatus,
            fulfillmentType: (o.fulfillmentType === 'pickup' ? 'pickup' : 'delivery'),
            shippingAddress: o.shippingAddress,
            notes: o.notes,
            statusHistory: [],
            createdAt: new Date(o.createdAt),
            updatedAt: new Date(o.updatedAt)
        };
    }
}
