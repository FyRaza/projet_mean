// ═══════════════════════════════════════════════════
//  POS (Point of Sale / Caisse) Models
// ═══════════════════════════════════════════════════

export interface PosCartItem {
  productId: string;
  productName: string;
  productImage?: string;
  sku?: string;
  price: number;          // Original price
  discountPercent: number; // Per-item discount %
  discountAmount: number;  // Computed discount amount
  effectivePrice: number;  // Price after per-item discount
  quantity: number;
  stock: number;           // Current stock level for validation
  subtotal: number;        // effectivePrice * quantity
}

export interface PosItemDiscount {
  product: string;
  discountPercent: number;
  discountAmount: number;
}

export interface PosSaleData {
  items: { product: string; quantity: number }[];
  boutiqueId: string;
  paymentMethod: 'cash' | 'mobile_money' | 'card';
  customerName?: string;
  userId?: string;
  notes?: string;
  // Discount & Tax
  discountPercent?: number;
  discountAmount?: number;
  taxRate?: number;
  amountReceived?: number;
  itemDiscounts?: PosItemDiscount[];
}

export interface PosSale {
  _id: string;
  items: PosSaleItem[];
  subtotal: number;
  discountAmount: number;
  discountPercent: number;
  taxAmount: number;
  taxRate: number;
  totalAmount: number;
  amountReceived: number;
  changeGiven: number;
  receiptNumber: string;
  orderType: 'pos';
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  customerName?: string;
  cashierId?: { _id: string; firstName: string; lastName: string };
  user?: { _id: string; firstName: string; lastName: string; email: string };
  boutique?: { _id: string; name: string; slug: string };
  itemDiscounts?: PosItemDiscount[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PosSaleItem {
  product: {
    _id: string;
    name: string;
    slug: string;
    images: string[];
    price: number;
  };
  quantity: number;
  price: number;
  name: string;
}

export interface PosStats {
  totalSales: number;
  totalRevenue: number;
  averageTicket: number;
  todaySales: number;
  todayRevenue: number;
  salesByPaymentMethod: {
    [method: string]: { count: number; total: number };
  };
  topProducts: {
    _id: string;
    name: string;
    totalQty: number;
    totalRevenue: number;
  }[];
}

export interface PosFilters {
  boutiqueId?: string;
  dateFrom?: string;
  dateTo?: string;
  paymentMethod?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedPosSales {
  orders: PosSale[];
  page: number;
  pages: number;
  total: number;
}

export interface PosDailySummary {
  date: string;
  totalSales: number;
  cancelledSales: number;
  totalRevenue: number;
  totalSubtotal: number;
  totalDiscount: number;
  totalTax: number;
  averageTicket: number;
  byPaymentMethod: { [method: string]: { count: number; total: number } };
  byHour: { [hour: string]: { count: number; total: number } };
  firstSaleTime: string | null;
  lastSaleTime: string | null;
  sales: PosDailySaleSummary[];
}

export interface PosDailySaleSummary {
  _id: string;
  receiptNumber: string;
  totalAmount: number;
  discountAmount: number;
  taxAmount: number;
  paymentMethod: string;
  customerName: string;
  status: string;
  itemCount: number;
  cashier: string | null;
  createdAt: string;
}
