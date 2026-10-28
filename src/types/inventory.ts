import { LocalizedString } from './api';

export type StockMovementType =
  | 'purchase'
  | 'sale'
  | 'return'
  | 'adjustment'
  | 'loss'
  | 'damage'
  | 'in'
  | 'out';

export interface StockMovement {
  id: number | string;
  product_id: number | string;
  product_name: LocalizedString | string;
  variant_id?: number | string;
  variant_name?: string;
  sku: string;
  type: StockMovementType;
  quantity: number; // positive or negative
  stock_before: number;
  stock_after: number;
  price?: number;
  reason: string;
  reference_type?: 'order' | 'manual' | 'return' | 'supplier';
  reference_id?: string;
  performed_by: string;
  created_at: string;
}

export interface StockAdjustmentPayload {
  product_id: number | string;
  variant_id?: number | string;
  type: 'set' | 'increment' | 'decrement';
  quantity: number;
  reason: string;
  notes?: string;
}

export interface LowStockItem {
  id: number | string;
  product_id?: number | string;
  product_name: LocalizedString | string;
  variant_name?: string;
  price?: number;
  sku: string;
  stock: number;
  low_stock_threshold: number;
  is_low_stock: boolean;
  category_name?: string;
  reorder_suggested_qty: number;
}
