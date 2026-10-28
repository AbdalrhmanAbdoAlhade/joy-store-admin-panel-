export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface ReviewUser {
  id: number | string;
  name: string;
}

export interface ReviewProduct {
  id: number | string;
  name: string;
}

export interface Review {
  id: number | string;
  product_id: number | string;
  user_id?: number | string | null;
  order_id?: number | string | null;
  rating: number;
  title?: string | null;
  body: string;
  is_verified_purchase: boolean;
  status: ReviewStatus;
  moderated_by?: number | string | null;
  created_at: string;
  updated_at?: string;
  user?: ReviewUser | null;
  product?: ReviewProduct | null;
}
