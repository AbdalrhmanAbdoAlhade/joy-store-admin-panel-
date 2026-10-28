import { LocalizedString } from './api';

export type ProductStatus = 'draft' | 'active' | 'archived';

export interface ProductVariant {
  id?: number | string;
  sku: string;
  name: LocalizedString | string;
  price: number;
  sale_price?: number;
  cost_price?: number;
  stock: number;
  barcode?: string;
  image?: string;
  attributes?: Record<string, string>; // e.g. { color: "أزرق", size: "كبير" }
}

export interface ToySpecificFields {
  age_range_min?: number;
  age_range_max?: number;
  target_gender?: 'all' | 'boys' | 'girls' | 'unisex';
  materials?: string[]; // e.g. ["BPA-Free Plastic", "Wood", "Silicon"]
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    weight?: number; // in grams
    unit?: string;
  };
  requires_batteries: boolean;
  battery_type?: string;
  batteries_included?: boolean;
  choking_hazard: boolean;
  safety_warnings?: LocalizedString;
  certifications?: string[]; // e.g. ["EN71", "ASTM F963", "CE", "ISO 8124"]
  piece_count?: number;
}

export interface ProductImage {
  id: string | number;
  url: string;
  /** Underlying file for newly-dropped images (used to build multipart payloads). */
  file?: File;
  order: number;
  is_primary?: boolean;
}

export interface Product {
  id: number | string;
  name: LocalizedString | string;
  slug: string;
  description: LocalizedString | string;
  short_description?: LocalizedString;
  sku: string;
  barcode?: string;
  status: ProductStatus;
  price: number;
  discount_price?: number;
  cost_price: number;
  tax_rate?: number; // percentage e.g. 14%
  stock: number;
  low_stock_threshold: number;

  // Storefront flags
  is_featured?: boolean;
  is_new_arrival?: boolean;
  educational?: boolean;

  // Toy specific fields
  toy_details?: ToySpecificFields;

  // Taxonomy relations
  category_id?: number | string;
  category_ids?: (number | string)[];
  category?: Category;
  brand_id?: number | string;
  brand?: Brand;
  age_group_id?: number | string;
  age_group?: AgeGroup;
  tag_ids?: (number | string)[];
  tags?: Tag[];

  // Media
  images: ProductImage[];
  video_url?: string;

  // Variants & Bundles
  has_variants: boolean;
  variants?: ProductVariant[];
  related_product_ids?: (number | string)[];
  bundle_product_ids?: (number | string)[];

  // SEO
  meta_title?: LocalizedString;
  meta_description?: LocalizedString;
  meta_keywords?: string;

  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: number | string;
  name: LocalizedString | string;
  slug: string;
  description?: LocalizedString;
  icon?: string;
  image?: string;
  parent_id?: number | string | null;
  children?: Category[];
  order?: number;
  is_active: boolean;
  products_count?: number;
}

export interface Brand {
  id: number | string;
  name: string;
  slug: string;
  logo?: string;
  description?: LocalizedString;
  website?: string;
  is_active: boolean;
  products_count?: number;
}

export interface AgeGroup {
  id: number | string;
  name: LocalizedString | string;
  slug: string;
  min_age: number; // in months or years
  max_age: number;
  age_unit: 'months' | 'years';
  sort_order?: number;
  badge_color?: string;
  is_active: boolean;
  products_count?: number;
}

export interface Tag {
  id: number | string;
  name: LocalizedString | string;
  slug: string;
  color?: string;
  products_count?: number;
}
