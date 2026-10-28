import { LocalizedString } from './api';

export interface CustomerUser {
  id: number | string;
  name: string;
  email: string;
  phone?: string;
  status: 'active' | 'banned';
  is_verified?: boolean;
  orders_count?: number;
  total_spent?: number;
  loyalty_points: number;
  governorate?: string;
  roles?: string[];
  permissions?: string[];
  avatar?: string;
  created_at: string;
  last_login_at?: string;
}

export type ModerationStatus = 'pending' | 'approved' | 'rejected';

export interface ReviewItem {
  id: number | string;
  product_id: number | string;
  product_name: LocalizedString;
  product_image?: string;
  customer_name: string;
  customer_email?: string;
  rating: number; // 1 to 5
  comment: string;
  status: ModerationStatus;
  type: 'review' | 'qa';
  reply?: string;
  replied_at?: string;
  replied_by?: string;
  created_at: string;
}

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';

export interface TicketMessage {
  id: number | string;
  ticket_id: number | string;
  sender_name: string;
  sender_role: 'customer' | 'support' | 'admin';
  message: string;
  attachments?: string[];
  created_at: string;
}

export interface SupportTicket {
  id: number | string;
  ticket_number: string;
  customer_id?: number | string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  subject: string;
  category: 'order' | 'delivery' | 'payment' | 'defect' | 'general';
  priority: TicketPriority;
  status: TicketStatus;
  assigned_to_id?: number | string;
  assigned_to_name?: string;
  messages: TicketMessage[];
  created_at: string;
  updated_at: string;
}
