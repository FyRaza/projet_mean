import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { PosCashierComponent } from './pos-cashier.component';
import { PosService } from '../../../shared/services/pos.service';
import { BoutiqueOwnerService } from '../../../shared/services/boutique-owner.service';
import { PosCartItem, PosSale } from '../../../core/models/pos.model';
import { Product } from '../../../core/models/product.model';

describe('PosCashierComponent', () => {
  let component: PosCashierComponent;
  let fixture: ComponentFixture<PosCashierComponent>;
  let posService: jasmine.SpyObj<PosService>;
  let boutiqueService: jasmine.SpyObj<BoutiqueOwnerService>;

  const mockBoutique = {
    id: 'boutique-123',
    name: 'Test Boutique',
    slug: 'test-boutique'
  };

  const mockProduct: Product = {
    id: 'product-1',
    name: 'Produit Test',
    slug: 'produit-test',
    description: '',
    price: 10000,
    stock: 50,
    sku: 'SKU-001',
    images: [],
    boutiqueId: 'boutique-123',
    tags: [],
    isFeatured: false,
    status: 'active',
    lowStockThreshold: 5,
    variants: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(async () => {
    const posServiceSpy = jasmine.createSpyObj('PosService', [
      'createPosSale',
      'getPosSales',
      'getPosStats',
      'getDailySummary',
      'searchProducts'
    ]);

    const boutiqueServiceSpy = jasmine.createSpyObj('BoutiqueOwnerService', [
      'getMyBoutique'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        PosCashierComponent,
        HttpClientTestingModule,
        RouterTestingModule,
        FormsModule
      ],
      providers: [
        { provide: PosService, useValue: posServiceSpy },
        { provide: BoutiqueOwnerService, useValue: boutiqueServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PosCashierComponent);
    component = fixture.componentInstance;
    posService = TestBed.inject(PosService) as jasmine.SpyObj<PosService>;
    boutiqueService = TestBed.inject(BoutiqueOwnerService) as jasmine.SpyObj<BoutiqueOwnerService>;

    // Setup default mocks
    boutiqueService.getMyBoutique.and.returnValue(of(mockBoutique));
    posService.searchProducts.and.returnValue(of([mockProduct]));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should load boutique info on init', () => {
      fixture.detectChanges();
      expect(boutiqueService.getMyBoutique).toHaveBeenCalled();
      expect(component.boutiqueId()).toBe('boutique-123');
      expect(component.boutiqueName()).toBe('Test Boutique');
    });

    it('should load products on init', () => {
      fixture.detectChanges();
      expect(posService.searchProducts).toHaveBeenCalledWith('boutique-123', '', 30);
    });
  });

  describe('Product Search', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should search products with debounce', (done) => {
      component.searchQuery = 'test';
      component.onSearchInput();
      
      setTimeout(() => {
        expect(posService.searchProducts).toHaveBeenCalled();
        done();
      }, 400);
    });

    it('should add product to cart', () => {
      const initialCartLength = component.cartItems().length;
      component.addToCart(mockProduct);
      
      expect(component.cartItems().length).toBe(initialCartLength + 1);
      expect(component.cartItems()[0].productId).toBe('product-1');
      expect(component.cartItems()[0].quantity).toBe(1);
    });

    it('should increment quantity if product already in cart', () => {
      component.addToCart(mockProduct);
      const initialQty = component.cartItems()[0].quantity;
      component.addToCart(mockProduct);
      
      expect(component.cartItems()[0].quantity).toBe(initialQty + 1);
    });

    it('should not add product if stock is 0', () => {
      const outOfStockProduct = { ...mockProduct, stock: 0 };
      component.addToCart(outOfStockProduct);
      
      expect(component.cartItems().length).toBe(0);
      expect(component.errorMessage()).toContain('rupture de stock');
    });
  });

  describe('Cart Management', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.addToCart(mockProduct);
    });

    it('should update quantity', () => {
      const initialQty = component.cartItems()[0].quantity;
      component.updateQuantity(0, 1);
      
      expect(component.cartItems()[0].quantity).toBe(initialQty + 1);
    });

    it('should remove item when quantity reaches 0', () => {
      component.updateQuantity(0, -1);
      
      expect(component.cartItems().length).toBe(0);
    });

    it('should not exceed stock limit', () => {
      component.setQuantity(0, 100); // More than stock (50)
      
      expect(component.cartItems()[0].quantity).toBe(50);
      expect(component.errorMessage()).toContain('Stock insuffisant');
    });

    it('should calculate subtotal correctly', () => {
      component.addToCart({ ...mockProduct, id: 'product-2', price: 5000 });
      component.setQuantity(0, 3); // 3 × 10000 = 30000
      component.setQuantity(1, 2); // 2 × 5000 = 10000
      
      expect(component.cartSubtotal()).toBe(40000);
    });

    it('should clear cart', () => {
      component.addToCart(mockProduct);
      component.clearCart();
      
      expect(component.cartItems().length).toBe(0);
      expect(component.globalDiscountPercent()).toBe(0);
      expect(component.taxRate()).toBe(0);
    });
  });

  describe('Discounts', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.addToCart(mockProduct);
      component.setQuantity(0, 2); // 2 × 10000 = 20000
    });

    it('should apply global discount percentage', () => {
      component.setGlobalDiscount(10); // 10% of 20000 = 2000
      
      expect(component.globalDiscountPercent()).toBe(10);
      expect(component.globalDiscountAmount()).toBe(2000);
      expect(component.cartTotal()).toBe(18000);
    });

    it('should apply item discount', () => {
      component.setItemDiscountPercent(0, 20); // 20% on product
      
      const item = component.cartItems()[0];
      expect(item.discountPercent).toBe(20);
      expect(item.discountAmount).toBe(2000); // 20% of 10000
      expect(item.effectivePrice).toBe(8000); // 10000 - 2000
      expect(item.subtotal).toBe(16000); // 8000 × 2
    });

    it('should calculate total with item discount and global discount', () => {
      component.setItemDiscountPercent(0, 10); // 10% on item: 10000 → 9000
      component.setQuantity(0, 2); // 2 × 9000 = 18000
      component.setGlobalDiscount(5); // 5% of 18000 = 900
      
      expect(component.cartSubtotal()).toBe(18000);
      expect(component.globalDiscountAmount()).toBe(900);
      expect(component.cartTotal()).toBe(17100);
    });
  });

  describe('Tax (TVA)', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.addToCart(mockProduct);
      component.setQuantity(0, 1); // 1 × 10000 = 10000
    });

    it('should apply tax rate', () => {
      component.setTaxRate(20); // 20% TVA
      
      expect(component.taxRate()).toBe(20);
      expect(component.taxAmount()).toBe(2000); // 20% of 10000
      expect(component.cartTotal()).toBe(12000);
    });

    it('should calculate tax after discount', () => {
      component.setGlobalDiscount(10); // 10% discount: 10000 → 9000
      component.setTaxRate(20); // 20% TVA on 9000
      
      expect(component.cartSubtotal()).toBe(10000);
      expect(component.globalDiscountAmount()).toBe(1000);
      expect(component.taxAmount()).toBe(1800); // 20% of 9000
      expect(component.cartTotal()).toBe(10800); // 9000 + 1800
    });
  });

  describe('Payment', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.addToCart(mockProduct);
      component.setQuantity(0, 1); // Total = 10000
    });

    it('should open payment modal', () => {
      component.openPaymentModal();
      
      expect(component.showPaymentModal()).toBe(true);
      expect(component.amountReceived()).toBe(10000); // Default to total
    });

    it('should not open payment modal if cart is empty', () => {
      component.clearCart();
      component.openPaymentModal();
      
      expect(component.showPaymentModal()).toBe(false);
      expect(component.errorMessage()).toContain('vide');
    });

    it('should calculate change for cash payment', () => {
      component.selectPaymentMethod('cash');
      component.setAmountReceived(15000);
      
      expect(component.changeToGive()).toBe(5000);
      expect(component.isAmountSufficient()).toBe(true);
    });

    it('should detect insufficient amount', () => {
      component.selectPaymentMethod('cash');
      component.setAmountReceived(5000);
      
      expect(component.isAmountSufficient()).toBe(false);
      expect(component.changeToGive()).toBe(0);
    });

    it('should not require change for non-cash payments', () => {
      component.selectPaymentMethod('mobile_money');
      
      expect(component.isAmountSufficient()).toBe(true);
      expect(component.changeToGive()).toBe(0);
    });

    it('should create sale with all data', () => {
      component.setGlobalDiscount(10);
      component.setTaxRate(20);
      component.selectPaymentMethod('cash');
      component.setAmountReceived(12000);
      component.customerName = 'Test Client';
      component.saleNotes = 'Test notes';

      const mockSale: PosSale = {
        _id: 'sale-123',
        items: [],
        subtotal: 10000,
        discountAmount: 1000,
        discountPercent: 10,
        taxAmount: 1800,
        taxRate: 20,
        totalAmount: 10800,
        amountReceived: 12000,
        changeGiven: 1200,
        receiptNumber: 'REC-20260301-0001',
        orderType: 'pos',
        paymentMethod: 'cash',
        paymentStatus: 'paid',
        status: 'delivered',
        customerName: 'Test Client',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      posService.createPosSale.and.returnValue(of(mockSale));

      component.confirmSale();

      expect(posService.createPosSale).toHaveBeenCalled();
      const callArgs = posService.createPosSale.calls.mostRecent().args[0];
      expect(callArgs.discountPercent).toBe(10);
      expect(callArgs.taxRate).toBe(20);
      expect(callArgs.amountReceived).toBe(12000);
      expect(callArgs.customerName).toBe('Test Client');
    });

    it('should handle sale creation error', () => {
      posService.createPosSale.and.returnValue(throwError(() => ({ error: { message: 'Erreur test' } })));
      
      component.confirmSale();
      
      expect(component.errorMessage()).toContain('Erreur');
      expect(component.isProcessing()).toBe(false);
    });
  });

  describe('Receipt', () => {
    it('should display receipt after successful sale', () => {
      const mockSale: PosSale = {
        _id: 'sale-123',
        items: [],
        subtotal: 10000,
        discountAmount: 0,
        discountPercent: 0,
        taxAmount: 0,
        taxRate: 0,
        totalAmount: 10000,
        amountReceived: 10000,
        changeGiven: 0,
        receiptNumber: 'REC-20260301-0001',
        orderType: 'pos',
        paymentMethod: 'cash',
        paymentStatus: 'paid',
        status: 'delivered',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      component.lastSale.set(mockSale);
      component.showReceipt.set(true);

      expect(component.showReceipt()).toBe(true);
      expect(component.lastSale()?.receiptNumber).toBe('REC-20260301-0001');
    });

    it('should start new sale', () => {
      component.addToCart(mockProduct);
      component.newSale();
      
      expect(component.cartItems().length).toBe(0);
      expect(component.showReceipt()).toBe(false);
      expect(component.lastSale()).toBeNull();
    });
  });

  describe('Daily Summary', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should load daily summary', () => {
      const mockSummary = {
        date: '2026-03-01',
        totalSales: 10,
        cancelledSales: 1,
        totalRevenue: 100000,
        totalSubtotal: 95000,
        totalDiscount: 5000,
        totalTax: 10000,
        averageTicket: 10000,
        byPaymentMethod: { cash: { count: 5, total: 50000 } },
        byHour: {},
        firstSaleTime: '2026-03-01T08:00:00Z',
        lastSaleTime: '2026-03-01T18:00:00Z',
        sales: []
      };

      posService.getDailySummary.and.returnValue(of(mockSummary));

      component.toggleDailySummary();

      expect(component.activeTab()).toBe('summary');
      expect(posService.getDailySummary).toHaveBeenCalledWith('boutique-123', undefined);
      expect(component.dailySummary()?.totalSales).toBe(10);
    });
  });

  describe('Keyboard Shortcuts', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should toggle shortcuts help with F12', () => {
      const event = new KeyboardEvent('keydown', { key: 'F12' });
      window.dispatchEvent(event);
      
      expect(component.showShortcuts()).toBe(true);
    });

    it('should close modals with Escape', () => {
      component.showPaymentModal.set(true);
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      window.dispatchEvent(event);
      
      expect(component.showPaymentModal()).toBe(false);
    });
  });

  describe('Helper Methods', () => {
    it('should format price correctly', () => {
      expect(component.formatPrice(10000)).toBe('10 000 Ar');
      expect(component.formatPrice(0)).toBe('0 Ar');
    });

    it('should get payment method label', () => {
      expect(component.getPaymentMethodLabel('cash')).toBe('Espèces');
      expect(component.getPaymentMethodLabel('mobile_money')).toBe('Mobile Money');
      expect(component.getPaymentMethodLabel('card')).toBe('Carte bancaire');
    });

    it('should get payment method icon', () => {
      expect(component.getPaymentMethodIcon('cash')).toBe('💵');
      expect(component.getPaymentMethodIcon('mobile_money')).toBe('📱');
      expect(component.getPaymentMethodIcon('card')).toBe('💳');
    });
  });
});

