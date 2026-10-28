import apiClient, { ApiResponse } from '@/src/lib/axios';
import { Review, ReviewStatus } from '@/src/types/review';
import { TableQueryParams } from '@/src/types/api';
import { toNumber, cleanQueryParams } from '@/src/lib/api-helpers';

export interface ReviewQueryParams extends TableQueryParams {
  status?: ReviewStatus;
}

function normalizeReview(r: any): Review {
  return {
    id: r?.id ?? '',
    product_id: r?.product_id ?? r?.product?.id ?? '',
    user_id: r?.user_id ?? r?.user?.id ?? null,
    order_id: r?.order_id ?? null,
    rating: toNumber(r?.rating),
    title: r?.title ?? null,
    body: r?.body ?? '',
    is_verified_purchase: Boolean(r?.is_verified_purchase),
    status: r?.status === 'approved' || r?.status === 'rejected' ? r.status : 'pending',
    moderated_by: r?.moderated_by ?? null,
    created_at: r?.created_at ?? '',
    updated_at: r?.updated_at ?? undefined,
    user: r?.user ? { id: r.user.id ?? '', name: r.user.name ?? '' } : null,
    product: r?.product ? { id: r.product.id ?? '', name: r.product.name ?? '' } : null,
  };
}

export const reviewService = {
  async getReviews(params?: ReviewQueryParams): Promise<ApiResponse<Review[]>> {
    const query = cleanQueryParams(params);
    const response = await apiClient.get<any>('/staff/reviews', { params: query });
    const res = response.data;
    const rows = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
    const data = rows.map(normalizeReview);

    const perPage = toNumber(res?.per_page ?? res?.meta?.per_page ?? (data.length || 20));
    const total = toNumber(res?.total ?? res?.meta?.total ?? data.length);
    const currentPage = toNumber(res?.current_page ?? res?.meta?.current_page ?? query.page ?? 1);
    const lastPage = toNumber(res?.last_page ?? res?.meta?.last_page ?? (perPage ? Math.ceil(total / perPage) : 1));

    return {
      success: true,
      data,
      meta: {
        current_page: currentPage,
        last_page: lastPage || 1,
        per_page: perPage,
        total,
      },
    };
  },

  async approveReview(id: number | string): Promise<ApiResponse<Review | undefined>> {
    const response = await apiClient.post<any>(`/staff/reviews/${id}/approve`);
    const res = response.data;
    const raw = res?.review ?? res?.data ?? undefined;
    return {
      success: true,
      message: res?.message ?? 'تم قبول التقييم',
      data: raw ? normalizeReview(raw) : undefined,
    };
  },

  async rejectReview(id: number | string): Promise<ApiResponse<Review | undefined>> {
    const response = await apiClient.post<any>(`/staff/reviews/${id}/reject`);
    const res = response.data;
    const raw = res?.review ?? res?.data ?? undefined;
    return {
      success: true,
      message: res?.message ?? 'تم رفض التقييم',
      data: raw ? normalizeReview(raw) : undefined,
    };
  },
};

export default reviewService;
