import { LocalizedString } from './api';

export interface OrdersByStatusPoint {
  status: string;
  count: number;
}

export interface DashboardAlert {
  type: string;
  label: string;
  count: number;
}

export interface DashboardKpiSummary {
  // Sales
  today_sales: number;
  today_orders: number;
  week_sales: number;
  week_orders: number;
  month_sales: number;
  month_orders: number;
  // Customers
  customers_total: number;
  customers_new_today: number;
  customers_new_month: number;
  // Products
  total_products: number;
  active_products: number;
  // Derived
  average_order_value: number;
  orders_by_status: OrdersByStatusPoint[];
  alerts: DashboardAlert[];
}

export interface SalesTimelinePoint {
  date: string;
  sales: number;
  orders: number;
  cost: number;
  profit: number;
  revenue?: number;
}

export interface CategorySalesDistribution {
  category_id: number | string;
  category_name: string;
  total_sales: number;
  percentage: number;
}

export interface GovernorateSalesDistribution {
  governorate: string;
  orders_count: number;
  total_sales: number;
}

export interface BrandSalesDistribution {
  brand_name: string;
  total_sales: number;
  items_sold: number;
}

export interface TopSellingToy {
  id: number | string;
  name: LocalizedString | string;
  sku: string;
  image?: string;
  total_sold: number;
  revenue: number;
  current_stock: number;
}

export interface StagnantToy {
  id: number | string;
  name: LocalizedString | string;
  sku: string;
  image?: string;
  days_without_sale: number;
  stock_quantity: number;
  tied_up_capital: number;
}
