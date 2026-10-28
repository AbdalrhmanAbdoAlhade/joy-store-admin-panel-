export type TicketStatus = 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TicketMessage {
  id: number;
  ticket_id: number;
  user_id: number;
  message: string;
  is_from_staff: boolean;
  user?: { id: number; name: string; avatar?: string | null };
  attachments?: string[];
  created_at: string;
}

export interface Ticket {
  id: number;
  ticket_number?: string;
  subject: string;
  status: TicketStatus;
  priority?: TicketPriority;
  user_id: number;
  assigned_to?: number | null;
  order_id?: number | null;
  user?: { id: number; name: string; email?: string; phone?: string };
  assignee?: { id: number; name: string } | null;
  messages?: TicketMessage[];
  messages_count?: number;
  last_reply_at?: string | null;
  created_at: string;
  updated_at?: string;
}
