import apiClient from '@/src/lib/axios';
import { ensureArray, unwrapEnvelope, cleanQueryParams } from '@/src/lib/api-helpers';
import type { Ticket, TicketMessage, TicketPriority, TicketStatus } from '@/src/types/ticket';

export interface TicketsQuery {
  status?: TicketStatus;
  page?: number;
  per_page?: number;
}

export interface TicketsResult {
  items: Ticket[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
}

// Backend sends `is_staff` for messages (not `is_from_staff`) and can emit the
// extra `waiting_customer` status after a staff reply.
function normalizeMessage(m: any): TicketMessage {
  return {
    id: m?.id,
    ticket_id: m?.ticket_id,
    user_id: m?.user_id,
    message: m?.message ?? '',
    is_from_staff: Boolean(m?.is_from_staff ?? m?.is_staff),
    user: m?.user ? { id: m.user.id, name: m.user.name, avatar: m.user.avatar ?? null } : undefined,
    attachments: Array.isArray(m?.attachments) ? m.attachments : [],
    created_at: m?.created_at ?? '',
  };
}

const normalizeTicket = (t: any): Ticket => ({
  id: t?.id,
  ticket_number: t?.ticket_number ?? undefined,
  subject: t?.subject ?? '',
  status: (t?.status || 'open') as TicketStatus,
  priority: (t?.priority || 'medium') as TicketPriority,
  user_id: t?.user_id,
  assigned_to: t?.assigned_to ?? null,
  order_id: t?.order_id ?? null,
  user: t?.user
    ? { id: t.user.id, name: t.user.name, email: t.user.email, phone: t.user.phone }
    : undefined,
  assignee: t?.assignee ? { id: t.assignee.id, name: t.assignee.name } : null,
  messages: Array.isArray(t?.messages) ? t.messages.map(normalizeMessage) : undefined,
  messages_count:
    t?.messages_count ?? (Array.isArray(t?.messages) ? t.messages.length : undefined),
  last_reply_at: t?.last_reply_at ?? null,
  created_at: t?.created_at ?? '',
  updated_at: t?.updated_at ?? undefined,
});

export const ticketService = {
  getTickets: async (params?: TicketsQuery): Promise<TicketsResult> => {
    const res = await apiClient.get('/staff/tickets', { params: cleanQueryParams(params) });
    const raw = res.data || {};
    return {
      items: ensureArray(raw.data ?? raw).map(normalizeTicket),
      meta: {
        current_page: raw.current_page ?? 1,
        last_page: raw.last_page ?? 1,
        per_page: raw.per_page ?? 20,
        total: raw.total ?? 0,
      },
    };
  },

  getTicket: async (id: number | string): Promise<Ticket> => {
    const res = await apiClient.get(`/tickets/${id}`);
    return normalizeTicket(unwrapEnvelope(res));
  },

  updateStatus: async (id: number | string, status: TicketStatus) => {
    return apiClient.patch(`/staff/tickets/${id}/status`, { status });
  },

  assignTicket: async (id: number | string, assignedTo: number) => {
    return apiClient.post(`/staff/tickets/${id}/assign`, { assigned_to: assignedTo });
  },

  replyToTicket: async (id: number | string, message: string) => {
    return apiClient.post(`/tickets/${id}/reply`, { message });
  },
};

export default ticketService;
