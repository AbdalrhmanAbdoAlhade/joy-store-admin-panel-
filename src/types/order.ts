import { LocalizedString } from './api';

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'partially_refunded';

export interface OrderItem {
  id: number | string;
  product_id: number | string;
  variant_id?: number | string;
  product_name: LocalizedString;
  sku: string;
  image?: string;
  unit_price: number;
  cost_price?: number;
  quantity: number;
  total_price: number;
}

export interface ShippingAddress {
  recipient_name: string;
  phone: string;
  alt_phone?: string;
  governorate: string;
  city: string;
  address_line: string;
  building_no?: string;
  floor?: string;
  apartment?: string;
  postal_code?: string;
  notes?: string;
}

export interface OrderTimelineEvent {
  id: string;
  status: OrderStatus;
  title: string;
  note?: string;
  created_at: string;
  actor_name: string;
  actor_role: string;
}

export interface Order {
  id: number | string;
  order_number: string;
  customer_id?: number | string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  items: OrderItem[];
  
  // Statuses
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: string; // 'cod' | 'card' | 'wallet' | 'valu' | 'fawry'

  // Financials
  subtotal: number;
  shipping_fee: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  total?: number;
  items_count?: number;
  coupon_code?: string;

  // Shipping & Tracking
  shipping_address: ShippingAddress;
  governorate?: string;
  city?: string;
  shipping_method?: string;
  shipping_company?: string;
  tracking_number?: string;
  estimated_delivery?: string;

  // Notes & Timeline
  customer_notes?: string;
  admin_internal_notes?: string;
  timeline: OrderTimelineEvent[];

  // Payments
  payments?: PaymentEntry[];

  created_at: string;
  updated_at: string;
}

export interface PaymentEntry {
  id: number | string;
  method?: string;
  amount?: number;
  status?: string;
  created_at?: string;
}

export interface ManualOrderPayload {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  items: {
    product_id: number | string;
    variant_id?: number | string;
    quantity: number;
    unit_price: number;
  }[];
  shipping_address: ShippingAddress;
  shipping_fee: number;
  discount_amount?: number;
  coupon_code?: string;
  payment_method: string;
  admin_notes?: string;
}

export interface RefundPayload {
  order_id: number | string;
  amount: number;
  type: 'full' | 'partial';
  reason: string;
  restore_stock: boolean;
}
