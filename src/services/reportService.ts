import apiClient, { ApiResponse } from '@/src/lib/axios';
import { unwrapEnvelope, toNumber, ensureArray } from '@/src/lib/api-helpers';
import {
  DashboardKpiSummary,
  SalesTimelinePoint,
  CategorySalesDistribution,
  GovernorateSalesDistribution,
  TopSellingToy,
  StagnantToy,
} from '@/src/types/report';

const EMPTY_SUMMARY: DashboardKpiSummary = {
  today_sales: 0,
  today_orders: 0,
  week_sales: 0,
  week_orders: 0,
  month_sales: 0,
  month_orders: 0,
  customers_total: 0,
  customers_new_today: 0,
  customers_new_month: 0,
  total_products: 0,
  active_products: 0,
  average_order_value: 0,
  orders_by_status: [],
  alerts: [],
};

function normalizeSummary(d: any): DashboardKpiSummary {
  const sales = d?.sales || {};
  const customers = d?.customers || {};
  const alerts = d?.alerts || {};
  return {
    today_sales: toNumber(sales?.today?.revenue),
    today_orders: toNumber(sales?.today?.orders),
    week_sales: toNumber(sales?.week?.revenue),
    week_orders: toNumber(sales?.week?.orders),
    month_sales: toNumber(sales?.month?.revenue),
    month_orders: toNumber(sales?.month?.orders),
    customers_total: toNumber(customers?.total),
    customers_new_today: toNumber(customers?.new_today),
    customers_new_month: toNumber(customers?.new_month),
    total_products: toNumber(d?.totals?.products),
    active_products: toNumber(d?.totals?.active_products),
    average_order_value: toNumber(d?.average_order_value),
    orders_by_status: Object.entries(d?.orders_by_status || {}).map(([status, count]) => ({
      status,
      count: toNumber(count),
    })),
    alerts: [
      { type: 'low_stock', label: 'ألعاب أوشكت على النفاد', count: toNumber(alerts?.low_stock_products) },
      { type: 'out_of_stock', label: 'ألعاب نفدت من المخزن', count: toNumber(alerts?.out_of_stock_products) },
      { type: 'pending_returns', label: 'طلبات مرتجعة معلقة', count: toNumber(alerts?.pending_returns) },
      { type: 'open_tickets', label: 'تذاكر دعم مفتوحة', count: toNumber(alerts?.open_tickets) },
      { type: 'pending_reviews', label: 'تقييمات بانتظار المراجعة', count: toNumber(alerts?.pending_reviews) },
    ],
  };
}

function normalizeTimelinePoint(p: any): SalesTimelinePoint {
  const revenue = toNumber(p?.revenue);
  return {
    date: p?.date ?? '',
    orders: toNumber(p?.orders),
    revenue,
    sales: revenue,
    cost: 0,
    profit: 0,
  };
}

export const reportService = {
  async getDashboardSummary(): Promise<ApiResponse<DashboardKpiSummary>> {
    try {
      const response = await apiClient.get<any>('admin/reports/dashboard-summary');
      return { success: true, data: normalizeSummary(unwrapEnvelope(response)) };
    } catch {
      return { success: true, data: EMPTY_SUMMARY };
    }
  },

  async getSalesTimeline(
    period: '7d' | '30d' | '90d' | '1y' = '30d'
  ): Promise<ApiResponse<SalesTimelinePoint[]>> {
    try {
      const response = await apiClient.get<any>(`admin/reports/sales-timeline?period=${period}`);
      const data = unwrapEnvelope(response);
      const points = ensureArray(data?.points ?? data?.timeline ?? data);
      return { success: true, data: points.map(normalizeTimelinePoint) };
    } catch {
      return { success: true, data: [] };
    }
  },

  async getSalesByCategory(): Promise<ApiResponse<CategorySalesDistribution[]>> {
    try {
      const response = await apiClient.get<any>('/admin/reports/sales-by-category');
      const data = unwrapEnvelope(response);
      const rows = ensureArray(data);
      return {
        success: true,
        data: rows.map((r: any) => ({
          category_id: r?.category_id ?? r?.id ?? '',
          category_name: r?.category_name ?? r?.name ?? '',
          total_sales: toNumber(r?.total_sales ?? r?.revenue),
          percentage: toNumber(r?.percentage),
        })),
      };
    } catch {
      return { success: true, data: [] };
    }
  },

  async getSalesByGovernorate(): Promise<ApiResponse<GovernorateSalesDistribution[]>> {
    try {
      const response = await apiClient.get<any>('admin/reports/sales-by-governorate');
      const data = unwrapEnvelope(response);
      const rows = ensureArray(data);
      return {
        success: true,
        data: rows.map((r: any) => ({
          governorate: r?.name ?? r?.governorate ?? '',
          orders_count: toNumber(r?.orders_count),
          total_sales: toNumber(r?.revenue ?? r?.total_sales),
        })),
      };
    } catch {
      return { success: true, data: [] };
    }
  },

  async getTopSellingToys(): Promise<ApiResponse<TopSellingToy[]>> {
    try {
      const response = await apiClient.get<any>('admin/reports/top-selling');
      const data = unwrapEnvelope(response);
      const rows = ensureArray(data);
      return {
        success: true,
        data: rows.map((r: any) => ({
          id: r?.product_id ?? r?.id ?? '',
          name: r?.name ?? '',
          sku: r?.sku ?? '',
          image: r?.image ?? undefined,
          total_sold: toNumber(r?.total_sold ?? r?.sold_count),
          revenue: toNumber(r?.revenue),
          current_stock: toNumber(r?.current_stock ?? r?.stock),
        })),
      };
    } catch {
      return { success: true, data: [] };
    }
  },

  async getStagnantToys(): Promise<ApiResponse<StagnantToy[]>> {
    try {
      const response = await apiClient.get<any>('admin/reports/stagnant-products');
      const data = unwrapEnvelope(response);
      const rows = ensureArray(data);
      return {
        success: true,
        data: rows.map((r: any) => ({
          id: r?.product_id ?? r?.id ?? '',
          name: r?.name ?? '',
          sku: r?.sku ?? '',
          image: r?.image ?? undefined,
          days_without_sale: toNumber(r?.days_since_last_sale ?? r?.days_without_sale),
          stock_quantity: toNumber(r?.stock ?? r?.stock_quantity),
          tied_up_capital: toNumber(r?.stock_value ?? r?.tied_up_capital),
        })),
      };
    } catch {
      return { success: true, data: [] };
    }
  },
};

export default reportService;
