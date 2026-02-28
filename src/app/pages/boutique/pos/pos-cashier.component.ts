import { Component, OnInit, OnDestroy, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, debounceTime, switchMap, of } from 'rxjs';

import { PosService } from '../../../shared/services/pos.service';
import { BoutiqueOwnerService } from '../../../shared/services/boutique-owner.service';
import { PosCartItem, PosSaleData, PosSale, PosItemDiscount, PosDailySummary } from '../../../core/models/pos.model';
import { Product, getProductPrimaryImage } from '../../../core/models/product.model';

@Component({
  selector: 'app-pos-cashier',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './pos-cashier.component.html'
})
export class PosCashierComponent implements OnInit, OnDestroy {
  private posService = inject(PosService);
  private boutiqueOwnerService = inject(BoutiqueOwnerService);

  // Boutique
  boutiqueId = signal<string>('');
  boutiqueName = signal<string>('');

  // Product search
  searchQuery = '';
  searchResults = signal<Product[]>([]);
  isSearching = signal(false);
  showSearchResults = signal(false);
  private searchSubject = new Subject<string>();

  // Cart
  cartItems = signal<PosCartItem[]>([]);
  cartSubtotal = computed(() =>
    this.cartItems().reduce((sum, item) => sum + item.subtotal, 0)
  );
  cartItemCount = computed(() =>
    this.cartItems().reduce((sum, item) => sum + item.quantity, 0)
  );

  // Global discount
  globalDiscountPercent = signal(0);
  globalDiscountAmount = computed(() => {
    if (this.globalDiscountPercent() > 0) {
      return Math.round(this.cartSubtotal() * this.globalDiscountPercent() / 100);
    }
    return 0;
  });

  // Tax (TVA)
  taxRate = signal(0); // e.g. 20 for 20%
  taxAmount = computed(() => {
    const afterDiscount = this.cartSubtotal() - this.globalDiscountAmount();
    return this.taxRate() > 0 ? Math.round(afterDiscount * this.taxRate() / 100) : 0;
  });

  // Cart total
  cartTotal = computed(() => {
    return Math.max(0, this.cartSubtotal() - this.globalDiscountAmount() + this.taxAmount());
  });

  // Payment
  showPaymentModal = signal(false);
  paymentMethod = signal<'cash' | 'mobile_money' | 'card'>('cash');
  customerName = '';
  saleNotes = '';
  amountReceived = signal(0);
  changeToGive = computed(() => {
    if (this.paymentMethod() === 'cash' && this.amountReceived() > this.cartTotal()) {
      return this.amountReceived() - this.cartTotal();
    }
    return 0;
  });
  isAmountSufficient = computed(() => {
    if (this.paymentMethod() !== 'cash') return true;
    return this.amountReceived() >= this.cartTotal();
  });

  // Quick cash amounts for the cash pad
  quickCashAmounts = computed(() => {
    const total = this.cartTotal();
    if (total <= 0) return [];
    const amounts: number[] = [total]; // exact amount
    // Round up to common denominations
    const denominations = [100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000];
    for (const d of denominations) {
      if (d > total && !amounts.includes(d)) {
        amounts.push(d);
      }
      if (amounts.length >= 6) break;
    }
    return amounts;
  });

  // Receipt
  showReceipt = signal(false);
  lastSale = signal<PosSale | null>(null);

  // Daily summary
  showDailySummary = signal(false);
  dailySummary = signal<PosDailySummary | null>(null);
  dailySummaryLoading = signal(false);

  // Active tab: 'cashier' | 'summary'
  activeTab = signal<'cashier' | 'summary'>('cashier');

  // Item discount edit
  editingItemDiscount = signal<number | null>(null);

  // State
  isProcessing = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  // Keyboard shortcuts info
  showShortcuts = signal(false);

  ngOnInit(): void {
    // Load boutique info
    this.boutiqueOwnerService.getMyBoutique().subscribe({
      next: (boutique) => {
        if (boutique) {
          this.boutiqueId.set(boutique.id);
          this.boutiqueName.set(boutique.name);
          this.loadProducts('');
        }
      },
      error: () => {
        this.errorMessage.set('Impossible de charger les informations de la boutique');
      }
    });

    // Setup debounced search
    this.searchSubject.pipe(
      debounceTime(300),
      switchMap(query => {
        if (!this.boutiqueId()) return of([]);
        this.isSearching.set(true);
        return this.posService.searchProducts(this.boutiqueId(), query, 15);
      })
    ).subscribe({
      next: (products) => {
        this.searchResults.set(products);
        this.isSearching.set(false);
        this.showSearchResults.set(true);
      },
      error: () => {
        this.isSearching.set(false);
      }
    });
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }

  // ═══════════════════════════════════════════════
  // KEYBOARD SHORTCUTS
  // ═══════════════════════════════════════════════
  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    // Don't trigger shortcuts when typing in inputs
    const tag = (event.target as HTMLElement)?.tagName?.toLowerCase();
    const isInput = tag === 'input' || tag === 'textarea' || tag === 'select';

    // F1: Focus search
    if (event.key === 'F1') {
      event.preventDefault();
      const searchInput = document.querySelector<HTMLInputElement>('#pos-search-input');
      searchInput?.focus();
      return;
    }

    // F2: Open payment modal
    if (event.key === 'F2') {
      event.preventDefault();
      if (this.cartItems().length > 0 && !this.showPaymentModal() && !this.showReceipt()) {
        this.openPaymentModal();
      }
      return;
    }

    // F3: New sale
    if (event.key === 'F3') {
      event.preventDefault();
      this.newSale();
      return;
    }

    // F4: Toggle daily summary
    if (event.key === 'F4') {
      event.preventDefault();
      this.toggleDailySummary();
      return;
    }

    // Escape: Close modals
    if (event.key === 'Escape') {
      if (this.showPaymentModal()) {
        this.closePaymentModal();
      } else if (this.showReceipt()) {
        this.closeReceipt();
      } else if (this.showShortcuts()) {
        this.showShortcuts.set(false);
      }
      return;
    }

    // Enter in payment modal: confirm
    if (event.key === 'Enter' && this.showPaymentModal() && this.isAmountSufficient() && !this.isProcessing()) {
      event.preventDefault();
      this.confirmSale();
      return;
    }

    // F12: toggle shortcut help
    if (event.key === 'F12') {
      event.preventDefault();
      this.showShortcuts.set(!this.showShortcuts());
      return;
    }
  }

  // ─────────────────────────────────────────────
  // Search
  // ─────────────────────────────────────────────
  onSearchInput(): void {
    this.searchSubject.next(this.searchQuery);
  }

  loadProducts(query: string): void {
    if (!this.boutiqueId()) return;
    this.posService.searchProducts(this.boutiqueId(), query, 30).subscribe({
      next: (products) => this.searchResults.set(products)
    });
  }

  hideSearchResults(): void {
    setTimeout(() => this.showSearchResults.set(false), 200);
  }

  getProductImage(product: Product): string {
    return getProductPrimaryImage(product);
  }

  // ─────────────────────────────────────────────
  // Cart Management
  // ─────────────────────────────────────────────
  addToCart(product: Product): void {
    this.clearMessages();
    const items = [...this.cartItems()];
    const existing = items.find(item => item.productId === product.id);

    if (existing) {
      if (existing.quantity >= product.stock) {
        this.errorMessage.set(`Stock insuffisant pour "${product.name}" (max: ${product.stock})`);
        return;
      }
      existing.quantity++;
      existing.subtotal = existing.effectivePrice * existing.quantity;
    } else {
      if (product.stock <= 0) {
        this.errorMessage.set(`"${product.name}" est en rupture de stock`);
        return;
      }
      items.push({
        productId: product.id,
        productName: product.name,
        productImage: getProductPrimaryImage(product),
        sku: product.sku,
        price: product.price,
        discountPercent: 0,
        discountAmount: 0,
        effectivePrice: product.price,
        quantity: 1,
        stock: product.stock,
        subtotal: product.price
      });
    }
    this.cartItems.set(items);
    this.searchQuery = '';
    this.showSearchResults.set(false);
  }

  updateQuantity(index: number, delta: number): void {
    this.clearMessages();
    const items = [...this.cartItems()];
    const item = items[index];
    if (!item) return;

    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      items.splice(index, 1);
    } else if (newQty > item.stock) {
      this.errorMessage.set(`Stock insuffisant (max: ${item.stock})`);
      return;
    } else {
      item.quantity = newQty;
      item.subtotal = item.effectivePrice * item.quantity;
    }
    this.cartItems.set(items);
  }

  setQuantity(index: number, value: number): void {
    this.clearMessages();
    const items = [...this.cartItems()];
    const item = items[index];
    if (!item) return;

    if (value <= 0) {
      items.splice(index, 1);
    } else if (value > item.stock) {
      this.errorMessage.set(`Stock insuffisant (max: ${item.stock})`);
      item.quantity = item.stock;
      item.subtotal = item.effectivePrice * item.quantity;
    } else {
      item.quantity = value;
      item.subtotal = item.effectivePrice * item.quantity;
    }
    this.cartItems.set(items);
  }

  removeFromCart(index: number): void {
    const items = [...this.cartItems()];
    items.splice(index, 1);
    this.cartItems.set(items);
  }

  clearCart(): void {
    this.cartItems.set([]);
    this.globalDiscountPercent.set(0);
    this.taxRate.set(0);
    this.clearMessages();
  }

  // ─────────────────────────────────────────────
  // Item Discount
  // ─────────────────────────────────────────────
  toggleItemDiscount(index: number): void {
    this.editingItemDiscount.set(this.editingItemDiscount() === index ? null : index);
  }

  setItemDiscountPercent(index: number, percent: number): void {
    const items = [...this.cartItems()];
    const item = items[index];
    if (!item) return;

    const p = Math.max(0, Math.min(100, percent));
    item.discountPercent = p;
    item.discountAmount = Math.round(item.price * p / 100);
    item.effectivePrice = Math.max(0, item.price - item.discountAmount);
    item.subtotal = item.effectivePrice * item.quantity;
    this.cartItems.set(items);
  }

  // ─────────────────────────────────────────────
  // Global Discount
  // ─────────────────────────────────────────────
  setGlobalDiscount(percent: number): void {
    this.globalDiscountPercent.set(Math.max(0, Math.min(100, percent)));
  }

  // ─────────────────────────────────────────────
  // Tax
  // ─────────────────────────────────────────────
  setTaxRate(rate: number): void {
    this.taxRate.set(Math.max(0, Math.min(100, rate)));
  }

  // ─────────────────────────────────────────────
  // Payment
  // ─────────────────────────────────────────────
  openPaymentModal(): void {
    if (this.cartItems().length === 0) {
      this.errorMessage.set('Le panier est vide');
      return;
    }
    this.clearMessages();
    this.amountReceived.set(this.cartTotal());
    this.showPaymentModal.set(true);
  }

  closePaymentModal(): void {
    this.showPaymentModal.set(false);
  }

  selectPaymentMethod(method: 'cash' | 'mobile_money' | 'card'): void {
    this.paymentMethod.set(method);
    if (method !== 'cash') {
      this.amountReceived.set(this.cartTotal());
    }
  }

  setAmountReceived(amount: number): void {
    this.amountReceived.set(amount);
  }

  confirmSale(): void {
    if (this.isProcessing()) return;
    if (!this.isAmountSufficient()) {
      this.errorMessage.set('Montant insuffisant');
      return;
    }
    this.isProcessing.set(true);
    this.clearMessages();

    // Build item discounts
    const itemDiscounts: PosItemDiscount[] = this.cartItems()
      .filter(item => item.discountPercent > 0)
      .map(item => ({
        product: item.productId,
        discountPercent: item.discountPercent,
        discountAmount: item.discountAmount
      }));

    const saleData: PosSaleData = {
      items: this.cartItems().map(item => ({
        product: item.productId,
        quantity: item.quantity
      })),
      boutiqueId: this.boutiqueId(),
      paymentMethod: this.paymentMethod(),
      customerName: this.customerName.trim() || undefined,
      notes: this.saleNotes.trim() || undefined,
      discountPercent: this.globalDiscountPercent() || undefined,
      taxRate: this.taxRate() || undefined,
      amountReceived: this.paymentMethod() === 'cash' ? this.amountReceived() : undefined,
      itemDiscounts: itemDiscounts.length > 0 ? itemDiscounts : undefined
    };

    this.posService.createPosSale(saleData).subscribe({
      next: (sale) => {
        this.lastSale.set(sale);
        this.showPaymentModal.set(false);
        this.showReceipt.set(true);
        this.cartItems.set([]);
        this.customerName = '';
        this.saleNotes = '';
        this.globalDiscountPercent.set(0);
        this.taxRate.set(0);
        this.isProcessing.set(false);
        this.successMessage.set('Vente enregistrée avec succès !');
        // Refresh product list to get updated stock
        this.loadProducts('');
      },
      error: (err) => {
        this.isProcessing.set(false);
        this.errorMessage.set(err?.error?.message || 'Erreur lors de l\'enregistrement de la vente');
      }
    });
  }

  // ─────────────────────────────────────────────
  // Receipt
  // ─────────────────────────────────────────────
  closeReceipt(): void {
    this.showReceipt.set(false);
    this.lastSale.set(null);
  }

  printReceipt(): void {
    window.print();
  }

  newSale(): void {
    this.closeReceipt();
    this.clearCart();
    this.clearMessages();
    this.editingItemDiscount.set(null);
    // Focus search
    setTimeout(() => {
      const searchInput = document.querySelector<HTMLInputElement>('#pos-search-input');
      searchInput?.focus();
    }, 100);
  }

  // ─────────────────────────────────────────────
  // Daily Summary
  // ─────────────────────────────────────────────
  toggleDailySummary(): void {
    if (this.activeTab() === 'summary') {
      this.activeTab.set('cashier');
    } else {
      this.activeTab.set('summary');
      this.loadDailySummary();
    }
  }

  loadDailySummary(): void {
    if (!this.boutiqueId()) return;
    this.dailySummaryLoading.set(true);
    this.posService.getDailySummary(this.boutiqueId()).subscribe({
      next: (summary) => {
        this.dailySummary.set(summary);
        this.dailySummaryLoading.set(false);
      },
      error: () => {
        this.dailySummaryLoading.set(false);
        this.errorMessage.set('Erreur lors du chargement du résumé');
      }
    });
  }

  // ─────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────
  formatPrice(amount: number): string {
    return (amount || 0).toLocaleString('fr-FR') + ' Ar';
  }

  getPaymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      cash: 'Espèces',
      mobile_money: 'Mobile Money',
      card: 'Carte bancaire'
    };
    return labels[method] || method;
  }

  getPaymentMethodIcon(method: string): string {
    const icons: Record<string, string> = {
      cash: '💵',
      mobile_money: '📱',
      card: '💳'
    };
    return icons[method] || '💰';
  }

  private clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }
}
