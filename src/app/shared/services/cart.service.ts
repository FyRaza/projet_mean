import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, forkJoin } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { Cart, CartItem, CartSummary, AddToCartData } from '../../core/models/cart.model';
import { Product } from '../../core/models/product.model';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { OrderService } from './order.service';

export interface CartByBoutique {
  boutiqueId: string;
  boutiqueName: string;
  boutiqueSlug: string;
  items: CartItem[];
  subtotal: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private authService = inject(AuthService);
  private orderService = inject(OrderService);

  private readonly CART_KEY = 'venda_cart';

  private cartSubject = new BehaviorSubject<Cart | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  cart$ = this.cartSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();

  // Derived observables
  cartItems$ = this.cart$.pipe(map(cart => cart?.items || []));

  cartItemCount$ = this.cart$.pipe(
    map(cart => cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0)
  );

  boutiqueCount$ = this.cart$.pipe(
    map(cart => {
      if (!cart?.items.length) return 0;
      const uniqueBoutiques = new Set(cart.items.map(item => item.boutiqueId));
      return uniqueBoutiques.size;
    })
  );

  cartSummary$: Observable<CartSummary> = this.cart$.pipe(
    map(cart => {
      const subtotal = cart?.items.reduce((sum, item) => sum + item.totalPrice, 0) || 0;
      const tax = subtotal * 0.2; // 20% TVA
      return {
        itemCount: cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0,
        subtotal,
        tax,
        discount: 0,
        total: subtotal + tax
      };
    })
  );

  cartByBoutique$: Observable<CartByBoutique[]> = this.cart$.pipe(
    map(cart => {
      if (!cart?.items.length) return [];

      const boutiqueMap = new Map<string, CartByBoutique>();

      cart.items.forEach(item => {
        if (!boutiqueMap.has(item.boutiqueId)) {
          boutiqueMap.set(item.boutiqueId, {
            boutiqueId: item.boutiqueId,
            boutiqueName: item.boutiqueName,
            boutiqueSlug: item.product.slug?.split('/')[0] || item.boutiqueId,
            items: [],
            subtotal: 0
          });
        }

        const boutique = boutiqueMap.get(item.boutiqueId)!;
        boutique.items.push(item);
        boutique.subtotal += item.totalPrice;
      });

      return Array.from(boutiqueMap.values());
    })
  );

  constructor() {
    this.loadCart();

    // Clear cart on logout
    this.authService.currentUser$.subscribe(user => {
      if (!user) {
        // Keep cart in localStorage for guests, just update customerId reference
        const cart = this.cartSubject.value;
        if (cart) {
          cart.customerId = undefined;
          this.saveCart(cart);
        }
      }
    });
  }

  get cart(): Cart | null {
    return this.cartSubject.value;
  }

  get isEmpty(): boolean {
    return !this.cart?.items.length;
  }

  private loadCart(): void {
    const savedCart = localStorage.getItem('shopping_cart');
    if (savedCart) {
      try {
        const cart = JSON.parse(savedCart) as Cart;
        // Convert date strings back to Date objects
        cart.createdAt = new Date(cart.createdAt);
        cart.updatedAt = new Date(cart.updatedAt);
        cart.items.forEach(item => {
          item.addedAt = new Date(item.addedAt);
        });
        this.cartSubject.next(cart);
      } catch {
        this.initializeEmptyCart();
      }
    } else {
      this.initializeEmptyCart();
    }
  }

  private initializeEmptyCart(): void {
    const cart: Cart = {
      id: crypto.randomUUID(),
      customerId: this.authService.currentUser?.id,
      items: [],
      subtotal: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.cartSubject.next(cart);
    this.saveCart(cart);
  }

  private saveCart(cart: Cart): void {
    cart.updatedAt = new Date();
    cart.subtotal = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
    localStorage.setItem('shopping_cart', JSON.stringify(cart));
    this.cartSubject.next({ ...cart });
  }

  addToCart(product: Product, boutiqueName: string, quantity: number = 1, variantId?: string): Observable<CartItem> {
    this.loadingSubject.next(true);

    const cart = this.cart!;
    const existingItemIndex = cart.items.findIndex(
      item => item.productId === product.id && item.variantId === variantId
    );

    let cartItem: CartItem;

    if (existingItemIndex >= 0) {
      // Update existing item
      cart.items[existingItemIndex].quantity += quantity;
      cart.items[existingItemIndex].totalPrice =
        cart.items[existingItemIndex].quantity * cart.items[existingItemIndex].unitPrice;
      cartItem = cart.items[existingItemIndex];
    } else {
      // Add new item
      const variant = variantId ? product.variants?.find(v => v.id === variantId) : undefined;
      const price = variant?.price ?? product.price;

      cartItem = {
        id: crypto.randomUUID(),
        productId: product.id,
        product,
        boutiqueId: product.boutiqueId,
        boutiqueName,
        variantId,
        variantName: variant?.name,
        quantity,
        unitPrice: price,
        totalPrice: price * quantity,
        addedAt: new Date()
      };
      cart.items.push(cartItem);
    }

    this.saveCart(cart);
    this.loadingSubject.next(false);

    return of(cartItem);
  }

  updateQuantity(itemId: string, quantity: number): Observable<CartItem | null> {
    const cart = this.cart!;
    const itemIndex = cart.items.findIndex(item => item.id === itemId);

    if (itemIndex < 0) return of(null);

    if (quantity <= 0) {
      return this.removeItem(itemId).pipe(map(() => null));
    }

    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].totalPrice = cart.items[itemIndex].unitPrice * quantity;

    this.saveCart(cart);
    return of(cart.items[itemIndex]);
  }

  removeItem(itemId: string): Observable<boolean> {
    const cart = this.cart!;
    const initialLength = cart.items.length;
    cart.items = cart.items.filter(item => item.id !== itemId);

    if (cart.items.length < initialLength) {
      this.saveCart(cart);
      return of(true);
    }

    return of(false);
  }

  removeBoutiqueItems(boutiqueId: string): Observable<boolean> {
    const cart = this.cart!;
    const initialLength = cart.items.length;
    cart.items = cart.items.filter(item => item.boutiqueId !== boutiqueId);

    if (cart.items.length < initialLength) {
      this.saveCart(cart);
      return of(true);
    }

    return of(false);
  }

  clearCart(): Observable<boolean> {
    const cart = this.cart!;
    cart.items = [];
    this.saveCart(cart);
    return of(true);
  }

  // Check if a product is in the cart
  isInCart(productId: string, variantId?: string): boolean {
    return this.cart?.items.some(
      item => item.productId === productId && item.variantId === variantId
    ) || false;
  }

  // Get quantity of a product in cart
  getProductQuantity(productId: string, variantId?: string): number {
    const item = this.cart?.items.find(
      i => i.productId === productId && i.variantId === variantId
    );
    return item?.quantity || 0;
  }

  /**
   * Checkout: creates one order per boutique group via the backend API.
   * Requires the user to be authenticated (token injected by HttpInterceptor).
   * Returns an array of created order IDs.
   */
  checkout(options?: {
    fulfillmentType?: 'delivery' | 'pickup';
    notes?: string;
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
  }): Observable<string[]> {
    const cartByBoutique$ = this.cartByBoutique$;

    return new Observable<string[]>(observer => {
      let boutiqueGroups: CartByBoutique[] = [];
      const sub = cartByBoutique$.subscribe(groups => {
        boutiqueGroups = groups;
      });
      sub.unsubscribe();

      if (boutiqueGroups.length === 0) {
        observer.next([]);
        observer.complete();
        return;
      }

      const orderRequests = boutiqueGroups.map(group =>
        this.orderService.createOrder({
          items: group.items.map(item => ({
            product: item.productId,
            quantity: item.quantity
          })) as any, // Type assertion since cart items lack internal product ID shape expected by API
          boutiqueId: group.boutiqueId,
          fulfillmentType: options?.fulfillmentType || 'delivery',
          shippingAddress: options?.shippingAddress as any,
          notes: options?.notes,
          paymentMethod: options?.paymentMethod || 'cash'
        })
      );

      forkJoin(orderRequests).subscribe({
        next: (orders) => {
          // Clear cart after successful checkout
          this.clearCart().subscribe();
          observer.next(orders.map(o => (o as any)._id || o.id));
          observer.complete();
        },
        error: (err) => {
          observer.error(err);
        }
      });
    });
  }
}
