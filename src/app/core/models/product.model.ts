export type ProductStatus = 'draft' | 'active' | 'out_of_stock' | 'discontinued' | 'archived';

export interface Product {
  id: string;
  boutiqueId: string;
  boutiqueName?: string;
  boutiqueSlug?: string;
  categoryId?: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  sku?: string;
  barcode?: string;
  stock: number;
  lowStockThreshold: number;
  images: ProductImage[];
  status: ProductStatus;
  isFeatured: boolean;
  tags: string[];
  variants?: ProductVariant[];
  attributes?: ProductAttribute[];
  createdAt: Date;
  updatedAt: Date;
}

/** Returns the primary image URL from either format */
export function getProductPrimaryImage(product: Product): string {
  if (!product.images || product.images.length === 0) {
    return 'https://placehold.co/400x400?text=No+Image';
  }
  return product.images[0].url;
}

export interface ProductImage {
  id: string;
  url: string;
  alt?: string;
  position: number;
  isPrimary: boolean;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku?: string;
  price: number;
  stock: number;
  attributes: { [key: string]: string };
}

export interface ProductAttribute {
  name: string;
  value: string;
}

export interface ProductFilter {
  categoryId?: string;
  boutiqueId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  search?: string;
  tags?: string[];
  featured?: boolean;
  status?: ProductStatus;
  sortBy?: 'price_asc' | 'price_desc' | 'name' | 'newest' | 'popular';
  page?: number;
  limit?: number;
}

export interface PaginatedProducts {
  /** Products array (alias for items, for backend compatibility) */
  products?: Product[];
  /** Products array (original field name) */
  items?: Product[];
  total: number;
  page: number;
  limit?: number;
  pages?: number;
  totalPages?: number;
}

