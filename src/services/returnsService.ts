import apiClient, { ApiResponse } from '@/src/lib/axios';
import { ReturnRequest, ReturnStatus, ReturnItem } from '@/src/types/return';
import { LocalizedString, TableQueryParams, PaginationMeta } from '@/src/types/api';
import { toNumber, ensureArray, cleanQueryParams, unwrapEnvelope } from '@/src/lib/api-helpers';

function toLocalizedString(value: any): LocalizedString {
  if (!value) return { ar: '', en: '' };
  if (typeof value === 'string') return { ar: value, en: value };
  return { ar: value.ar ?? value.en ?? '', en: value.en ?? value.ar ?? '' };
}

function normalizeReturnItem(i: any): ReturnItem {
  const product = i?.product ?? i?.order_item?.product ?? i?.variant?.product;
  const variant = i?.variant ?? i?.order_item?.variant;
  return {
    id: i?.id ?? '',
    order_item_id: i?.order_item_id ?? i?.order_item?.id ?? '',
    product_name: toLocalizedString(i?.product_name ?? product?.name ?? i?.name),
    sku: i?.sku ?? variant?.sku ?? product?.sku ?? '',
    image: i?.image ?? i?.image_url ?? product?.primary_image ?? undefined,
    unit_price: toNumber(i?.unit_price ?? i?.price ?? i?.order_item?.unit_price),
    quantity: toNumber(i?.quantity, 1),
    reason: i?.reason ?? 'changed_mind',
    customer_note: i?.customer_note ?? i?.note ?? undefined,
    item_condition: i?.item_condition ?? i?.condition ?? undefined,
    photos: ensureArray(i?.photos ?? i?.images),
  };
}

function normalizeStatus(status: any): ReturnStatus {
  if (status === 'item_received') return 'received';
  if (
    status === 'pending' ||
    status === 'approved' ||
    status === 'rejected' ||
    status === 'received'
  ) {
    return status;
  }
  return 'pending';
}

function normalizeReturn(r: any): ReturnRequest {
  const status = normalizeStatus(r?.status);
  const order = r?.order ?? {};
  const user = r?.user ?? {};
  return {
    id: r?.id ?? '',
    return_number: r?.return_number ?? '',
    order_id: r?.order_id ?? order?.id ?? '',
    order_number: order?.order_number ?? r?.order_number ?? '',
    customer_name: user?.name ?? r?.customer_name ?? '',
    customer_email: user?.email ?? r?.customer_email ?? '',
    customer_phone:
      order?.shipping_address?.phone ?? user?.phone ?? r?.customer_phone ?? '',
    status,
    items: ensureArray(r?.items).map(normalizeReturnItem),
    refund_amount: toNumber(r?.refund_amount),
    reason: r?.reason ?? undefined,
    description: r?.description ?? undefined,
    restock: typeof r?.restock === 'boolean' ? r.restock : undefined,
    rejection_reason:
      status === 'rejected' ? r?.admin_note ?? r?.rejection_reason : undefined,
    admin_notes: r?.admin_note ?? r?.admin_notes,
    created_at: r?.created_at ?? '',
    updated_at: r?.updated_at ?? '',
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

export const returnsService = {
  async getReturns(params?: TableQueryParams): Promise<ApiResponse<ReturnRequest[]>> {
    try {
      const response = await apiClient.get<any>('/staff/returns', {
        params: cleanQueryParams(params),
      });
      const raw = response.data || {};
      const rows = ensureArray(unwrapEnvelope(response));
      const data = rows.map(normalizeReturn);
      return { success: true, data, meta: buildMeta(raw?.meta ?? raw, data.length) };
    } catch {
      return {
        success: true,
        data: [],
        meta: { current_page: 1, last_page: 1, per_page: 10, total: 0 },
      };
    }
  },

  async updateReturnStatus(
    id: number | string,
    status: ReturnStatus,
    reason?: string,
    refundAmount?: number
  ): Promise<ApiResponse<ReturnRequest | undefined>> {
    let endpoint = `/staff/returns/${id}/status`;
    let payload: any = { status };

    if (status === 'approved') {
      endpoint = `/staff/returns/${id}/approve`;
      payload = {
        admin_note: reason || 'موافق على الإرجاع',
        restock: true,
        refund_amount: refundAmount ?? 0,
      };
    } else if (status === 'rejected') {
      endpoint = `/staff/returns/${id}/reject`;
      payload = { admin_note: reason || 'مرفوض' };
    } else if (status === 'received') {
      endpoint = `/staff/returns/${id}/receive`;
      payload = {};
    }

    const response = await apiClient.post<any>(endpoint, payload);
    const raw = response.data;
    const record = raw?.return ?? raw?.data ?? raw;
    return {
      success: true,
      message: 'تم تحديث حالة طلب المرتجع بنجاح',
      data: record ? normalizeReturn(record) : undefined,
    };
  },
};

export default returnsService;
