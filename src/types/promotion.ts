import { LocalizedString } from './api';

export type CouponType = 'percentage' | 'fixed' | 'free_shipping';

export interface Coupon {
  id: number | string;
  code: string;
  description?: LocalizedString;
  type: CouponType;
  value: number; // percentage or fixed amount
  min_order_value?: number;
  max_discount_amount?: number;
  usage_limit?: number;
  usage_count: number;
  usage_limit_per_user?: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  applicable_category_ids?: (number | string)[];
  applicable_product_ids?: (number | string)[];
  created_at?: string;
}

export interface FlashSaleItem {
  product_id: number | string;
  product_name: LocalizedString;
  original_price: number;
  sale_price: number;
  discount_percentage: number;
  allocated_quantity: number;
  sold_quantity: number;
}

export interface FlashSale {
  id: number | string;
  title: LocalizedString;
  banner?: string;
  start_at: string;
  end_at: string;
  is_active: boolean;
  items: FlashSaleItem[];
  created_at?: string;
}

export interface LoyaltySettings {
  is_enabled: boolean;
  points_per_egp: number; // e.g. 1 point for every 10 EGP
  point_value_egp: number; // e.g. 1 point = 0.1 EGP
  min_points_to_redeem: number;
  points_expiry_days: number;
  welcome_bonus_points: number;
}
