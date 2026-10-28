import apiClient, { ApiResponse } from '@/src/lib/axios';
import { CustomerUser, ReviewItem, SupportTicket, ModerationStatus, TicketStatus } from '@/src/types/customer';
import { TableQueryParams } from '@/src/types/api';
import { toNumber, ensureArray, cleanQueryParams } from '@/src/lib/api-helpers';

function normalizeUser(u: any): CustomerUser {
  return {
    id: u?.id ?? '',
    name: u?.name ?? '',
    email: u?.email ?? '',
    phone: u?.phone ?? undefined,
    status: u?.status === 'banned' ? 'banned' : 'active',
    is_verified: Boolean(u?.email_verified_at),
    loyalty_points: toNumber(u?.loyalty_points),
    roles: ensureArray(u?.roles),
    permissions: ensureArray(u?.permissions),
    avatar: u?.avatar ?? undefined,
    created_at: u?.created_at,
    last_login_at: u?.last_login_at,
  };
}

let mockUsers: CustomerUser[] = [
  {
    id: 101,
    name: 'أحمد محمود العوضي',
    email: 'ahmed.awadi@example.com',
    phone: '01012345678',
    status: 'active',
    is_verified: true,
    orders_count: 5,
    total_spent: 8450,
    loyalty_points: 350,
    governorate: 'القاهرة',
    created_at: '2025-11-10T10:00:00Z',
  },
  {
    id: 102,
    name: 'سارة إبراهيم الشناوي',
    email: 'sara.shennawy@example.com',
    phone: '01198765432',
    status: 'active',
    is_verified: true,
    orders_count: 2,
    total_spent: 2400,
    loyalty_points: 120,
    governorate: 'الجيزة',
    created_at: '2026-01-05T12:00:00Z',
  },
  {
    id: 103,
    name: 'محمود عبدالفتاح',
    email: 'mahmoud.fatah@example.com',
    phone: '01223344556',
    status: 'active',
    is_verified: false,
    orders_count: 1,
    total_spent: 2179,
    loyalty_points: 80,
    governorate: 'الإسكندرية',
    created_at: '2026-03-01T08:00:00Z',
  },
];

let mockReviews: ReviewItem[] = [
  {
    id: 1,
    product_id: 1,
    product_name: { ar: 'مجموعة ليجو قلعة المغامرات الإبداعية', en: 'Lego Creative Adventure Castle' },
    customer_name: 'أحمد محمود العوضي',
    rating: 5,
    comment: 'اللعبة ممتازة جداً وخامتها أصلية، ابني قعد يبني فيها 3 أيام ومبسوط جداً بها.',
    status: 'approved',
    type: 'review',
    created_at: '2026-03-12T10:00:00Z',
  },
  {
    id: 2,
    product_id: 3,
    product_name: { ar: 'سيارة دفع رباعي تحكم عن بعد 4WD', en: 'RC 4WD Monster Truck' },
    customer_name: 'أمير سامي',
    rating: 4,
    comment: 'هل البطارية معها شاحن USB وهل تتحمل الصدمات على الرمل؟',
    status: 'pending',
    type: 'qa',
    reply: 'نعم تشمل كابل شحن USB ذكي ومقاومة للرمال الخفيفة والأرضيات الوعرة.',
    created_at: '2026-03-14T15:00:00Z',
  },
];

let mockTickets: SupportTicket[] = [
  {
    id: 1,
    ticket_number: 'TCK-501',
    customer_id: 101,
    customer_name: 'أحمد محمود العوضي',
    customer_email: 'ahmed.awadi@example.com',
    customer_phone: '01012345678',
    subject: 'طلب إضافة تغليف هدية شريط أحمر للطلب #ORD-7740',
    category: 'order',
    priority: 'medium',
    status: 'resolved',
    assigned_to_name: 'عبدالرحمن محمد',
    messages: [
      { id: 1, ticket_id: 1, sender_name: 'أحمد محمود', sender_role: 'customer', message: 'لو سمحتم هل ممكن إضافة كارت تهنئة وتغليف هدية أحمر؟', created_at: '2026-03-15T09:40:00Z' },
      { id: 2, ticket_id: 1, sender_name: 'فريق دعم المتجر', sender_role: 'admin', message: 'أهلاً بك يا فندم! تم إبلاغ فريق التجهيز والتغليف بإضافة شريط أحمر وكارت هدية مجاناً.', created_at: '2026-03-15T10:15:00Z' },
    ],
    created_at: '2026-03-15T09:40:00Z',
    updated_at: '2026-03-15T10:15:00Z',
  },
];

export const customerService = {
  // Users
  async getUsers(params?: TableQueryParams): Promise<ApiResponse<CustomerUser[]>> {
    try {
      const response = await apiClient.get<any>('/admin/users', { params: cleanQueryParams(params) });
      const res = response.data;
      const rows = Array.isArray(res) ? res : ensureArray(res?.data);
      const data = rows.map(normalizeUser);
      return {
        success: true,
        data,
        meta: res?.meta || { current_page: 1, last_page: 1, per_page: data.length, total: data.length },
      };
    } catch {
      return {
        success: true,
        data: mockUsers.map(normalizeUser),
        meta: { current_page: 1, last_page: 1, per_page: 10, total: mockUsers.length },
      };
    }
  },

  async toggleUserBan(id: number | string, status: 'active' | 'banned'): Promise<ApiResponse<CustomerUser>> {
    try {
      const response = await apiClient.patch<any>(`/admin/users/${id}/status`, { status });
      const res = response.data;
      return { success: true, message: `تم ${status === 'banned' ? 'حظر' : 'تفعيل'} العميل بنجاح`, data: res.data || res };
    } catch {
      const idx = mockUsers.findIndex((u) => String(u.id) === String(id));
      if (idx !== -1) {
        mockUsers[idx].status = status;
        return { success: true, message: `تم ${status === 'banned' ? 'حظر' : 'تفعيل'} العميل بنجاح`, data: mockUsers[idx] };
      }
      throw new Error('User not found');
    }
  },

  // Reviews
  async getReviews(params?: TableQueryParams): Promise<ApiResponse<ReviewItem[]>> {
    try {
      const response = await apiClient.get<any>('/staff/reviews', { params: cleanQueryParams(params) });
      const res = response.data;
      return {
        success: true,
        data: Array.isArray(res) ? res : res.data || mockReviews,
        meta: res.meta || { current_page: 1, last_page: 1, per_page: 10, total: mockReviews.length },
      };
    } catch {
      return {
        success: true,
        data: mockReviews,
        meta: { current_page: 1, last_page: 1, per_page: 10, total: mockReviews.length },
      };
    }
  },

  async moderateReview(id: number | string, status: ModerationStatus, reply?: string): Promise<ApiResponse<ReviewItem>> {
    try {
      if (status === 'approved') {
        const response = await apiClient.post<any>(`/staff/reviews/${id}/approve`);
        return { success: true, message: 'تم قبول المراجعة', data: response.data };
      } else if (status === 'rejected') {
        const response = await apiClient.post<any>(`/staff/reviews/${id}/reject`);
        return { success: true, message: 'تم رفض المراجعة', data: response.data };
      }

      if (reply) {
        const response = await apiClient.post<any>(`/questions/${id}/answer`, { answer: reply });
        return { success: true, message: 'تم نشر الرد بنجاح', data: response.data };
      }

      return { success: true, data: mockReviews[0] };
    } catch {
      const idx = mockReviews.findIndex((r) => String(r.id) === String(id));
      if (idx !== -1) {
        mockReviews[idx].status = status;
        if (reply) {
          mockReviews[idx].reply = reply;
          mockReviews[idx].replied_at = new Date().toISOString();
        }
        return { success: true, message: 'تم تحديث حالة المراجعة والرد', data: mockReviews[idx] };
      }
      throw new Error('Review not found');
    }
  },

  // Tickets
  async getTickets(params?: TableQueryParams): Promise<ApiResponse<SupportTicket[]>> {
    try {
      const response = await apiClient.get<any>('/staff/tickets', { params: cleanQueryParams(params) });
      const res = response.data;
      return {
        success: true,
        data: Array.isArray(res) ? res : res.data || mockTickets,
        meta: res.meta || { current_page: 1, last_page: 1, per_page: 10, total: mockTickets.length },
      };
    } catch {
      return {
        success: true,
        data: mockTickets,
        meta: { current_page: 1, last_page: 1, per_page: 10, total: mockTickets.length },
      };
    }
  },

  async replyToTicket(ticketId: number | string, message: string): Promise<ApiResponse<SupportTicket>> {
    try {
      const response = await apiClient.post<any>(`/tickets/${ticketId}/reply`, { message });
      const res = response.data;
      return { success: true, message: 'تم إرسال الرد للعميل', data: res.data || res };
    } catch {
      const idx = mockTickets.findIndex((t) => String(t.id) === String(ticketId));
      if (idx !== -1) {
        mockTickets[idx].messages.push({
          id: Date.now(),
          ticket_id: ticketId,
          sender_name: 'أدمن المتجر',
          sender_role: 'admin',
          message,
          created_at: new Date().toISOString(),
        });
        return { success: true, message: 'تم إرسال الرد للعميل', data: mockTickets[idx] };
      }
      throw new Error('Ticket not found');
    }
  },

  async updateTicketStatus(ticketId: number | string, status: TicketStatus): Promise<ApiResponse<SupportTicket>> {
    try {
      const response = await apiClient.patch<any>(`/staff/tickets/${ticketId}/status`, { status });
      const res = response.data;
      return { success: true, message: 'تم تحديث حالة التذكرة', data: res.data || res };
    } catch {
      const idx = mockTickets.findIndex((t) => String(t.id) === String(ticketId));
      if (idx !== -1) {
        mockTickets[idx].status = status;
        return { success: true, message: 'تم تحديث حالة التذكرة', data: mockTickets[idx] };
      }
      throw new Error('Ticket not found');
    }
  },
};

export default customerService;
