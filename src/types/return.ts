import { LocalizedString } from './api';

export type ReturnStatus = 'pending' | 'approved' | 'rejected' | 'received';

export interface ReturnItem {
  id: number | string;
  order_item_id: number | string;
  product_name: LocalizedString;
  sku: string;
  image?: string;
  unit_price: number;
  quantity: number;
  reason: 'defective' | 'wrong_item' | 'not_as_described' | 'changed_mind';
  customer_note?: string;
  item_condition?: 'unopened' | 'opened' | 'damaged';
  photos?: string[];
}

export interface ReturnRequest {
  id: number | string;
  return_number: string;
  order_id: number | string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  status: ReturnStatus;
  items: ReturnItem[];
  refund_amount: number;
  reason?: string;
  description?: string;
  restock?: boolean;
  rejection_reason?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}
