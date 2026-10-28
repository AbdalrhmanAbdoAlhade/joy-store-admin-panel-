import apiClient, { ApiResponse } from '@/src/lib/axios';
import { StockMovement, StockAdjustmentPayload, LowStockItem } from '@/src/types/inventory';
import { TableQueryParams, PaginationMeta } from '@/src/types/api';
import { toNumber, ensureArray, cleanQueryParams, unwrapEnvelope } from '@/src/lib/api-helpers';

function normalizeMovement(m: any): StockMovement {
  const product = m?.variant?.product ?? m?.product;
  const variant = m?.variant;
  return {
    id: m?.id ?? '',
    product_id: m?.product_id ?? product?.id ?? '',
    product_name: product?.name ?? m?.product_name ?? m?.name ?? '',
    variant_id: m?.product_variant_id ?? m?.variant_id ?? variant?.id,
    variant_name: variant?.name ?? m?.variant_name ?? undefined,
    sku: m?.sku ?? variant?.sku ?? '',
    type: m?.type ?? (toNumber(m?.quantity) >= 0 ? 'in' : 'out'),
    quantity: toNumber(m?.quantity),
    stock_before: toNumber(m?.quantity_before ?? m?.stock_before),
    stock_after: toNumber(m?.quantity_after ?? m?.stock_after ?? m?.stock),
    price: m?.price != null ? toNumber(m?.price) : undefined,
    reason: m?.reason ?? '',
    reference_type: m?.reference_type,
    reference_id: m?.reference_id,
    performed_by: m?.user?.name ?? m?.performed_by ?? 'النظام',
    created_at: m?.created_at ?? '',
  };
}

function normalizeLowStock(it: any): LowStockItem {
  const stock = toNumber(it?.stock ?? it?.available_stock);
  const lowStockThreshold = toNumber(it?.low_stock_threshold ?? it?.threshold, 5);
  return {
    id: it?.id ?? it?.variant_id ?? it?.product_id ?? '',
    product_id: it?.product_id ?? it?.product?.id,
    product_name: it?.product?.name ?? it?.product_name ?? it?.name ?? '',
    variant_name: it?.name ?? it?.variant?.name ?? 'افتراضي',
    price: it?.price != null ? toNumber(it?.price) : undefined,
    sku: it?.sku ?? it?.variant?.sku ?? '',
    stock,
    low_stock_threshold: lowStockThreshold,
    is_low_stock:
      typeof it?.is_low_stock === 'boolean' ? it.is_low_stock : stock <= lowStockThreshold,
    category_name: it?.category?.name ?? it?.category_name,
    reorder_suggested_qty: toNumber(
      it?.reorder_suggested_qty ?? Math.max(lowStockThreshold - stock, 0)
    ),
  };
}

function buildMeta(raw: any, fallbackTotal: number): PaginationMeta {
  return {
    current_page: toNumber(raw?.current_page, 1),
    last_page: toNumber(raw?.last_page, 1),
    per_page: toNumber(raw?.per_page, fallbackTotal || 10),
    total: toNumber(raw?.total, fallbackTotal),
  };
}

async function fetchInventoryItems(params?: TableQueryParams): Promise<ApiResponse<LowStockItem[]>> {
  try {
    const response = await apiClient.get<any>('/staff/inventory', {
      params: cleanQueryParams({ per_page: 100, ...params }),
    });
    const raw = response.data || {};
    const rows = ensureArray(unwrapEnvelope(response));
    const data = rows.map(normalizeLowStock);
    return { success: true, data, meta: buildMeta(raw, data.length) };
  } catch {
    return {
      success: true,
      data: [],
      meta: { current_page: 1, last_page: 1, per_page: 10, total: 0 },
    };
  }
}

export const inventoryService = {
  getInventoryItems(params?: TableQueryParams): Promise<ApiResponse<LowStockItem[]>> {
    return fetchInventoryItems(params);
  },

  getLowStockItems(): Promise<ApiResponse<LowStockItem[]>> {
    return fetchInventoryItems({ low_stock: 1 });
  },

  async getStockMovements(
    inventoryId: number | string,
    params?: TableQueryParams
  ): Promise<ApiResponse<StockMovement[]>> {
    try {
      const response = await apiClient.get<any>(`/staff/inventory/${inventoryId}/movements`, {
        params: cleanQueryParams(params),
      });
      const raw = response.data || {};
      const rows = ensureArray(unwrapEnvelope(response));
      const data = rows.map(normalizeMovement);
      return { success: true, data, meta: buildMeta(raw, data.length) };
    } catch {
      return {
        success: true,
        data: [],
        meta: { current_page: 1, last_page: 1, per_page: 10, total: 0 },
      };
    }
  },

  async adjustStock(payload: StockAdjustmentPayload): Promise<ApiResponse<StockMovement>> {
    const inventoryId = payload.variant_id ?? payload.product_id;
    const response = await apiClient.post<any>(`/staff/inventory/${inventoryId}/adjust`, {
      quantity: payload.type === 'decrement' ? -payload.quantity : payload.quantity,
      reason: payload.reason,
    });
    const raw = unwrapEnvelope(response) ?? response.data;
    return {
      success: true,
      message: 'تمت تسوية رصيد المخزن بنجاح',
      data: normalizeMovement(raw),
    };
  },
};

export default inventoryService;
