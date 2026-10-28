import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Send, UserCheck, RefreshCw } from 'lucide-react';
import { ticketService } from '@/src/services/ticketService';
import { employeeService } from '@/src/services/employeeService';
import type { TicketStatus } from '@/src/types/ticket';
import StatusBadge from '@/src/components/common/StatusBadge';
import { formatDate } from '@/src/lib/utils';
import { toast } from 'sonner';

interface TicketDetailsModalProps {
  ticketId: number | string;
  isAr: boolean;
  onClose: () => void;
}

const STATUS_OPTIONS: { value: TicketStatus; ar: string; en: string }[] = [
  { value: 'open', ar: 'مفتوحة', en: 'Open' },
  { value: 'in_progress', ar: 'قيد التنفيذ', en: 'In progress' },
  { value: 'waiting_customer', ar: 'بانتظار العميل', en: 'Waiting customer' },
  { value: 'resolved', ar: 'محلولة', en: 'Resolved' },
  { value: 'closed', ar: 'مغلقة', en: 'Closed' },
];

const PRIORITY_STYLES: Record<string, { ar: string; en: string; cls: string }> = {
  low: { ar: 'منخفضة', en: 'Low', cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
  medium: { ar: 'متوسطة', en: 'Medium', cls: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300' },
  high: { ar: 'عالية', en: 'High', cls: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300' },
  urgent: { ar: 'عاجلة', en: 'Urgent', cls: 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300' },
};

export const TicketDetailsModal: React.FC<TicketDetailsModalProps> = ({ ticketId, isAr, onClose }) => {
  const queryClient = useQueryClient();
  const [reply, setReply] = useState('');
  const [status, setStatus] = useState<TicketStatus>('open');
  const [assignee, setAssignee] = useState('');

  const { data: ticket, isLoading, isError, refetch } = useQuery({
    queryKey: ['tickets', 'detail', ticketId],
    queryFn: () => ticketService.getTicket(ticketId),
  });

  const { data: employeesRes } = useQuery({
    queryKey: ['employees', 'list'],
    queryFn: () => employeeService.getEmployees(),
    staleTime: 5 * 60 * 1000,
  });
  const employees = employeesRes?.data || [];

  useEffect(() => {
    if (ticket) {
      setStatus(ticket.status);
      setAssignee(ticket.assigned_to != null ? String(ticket.assigned_to) : '');
    }
  }, [ticket]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['tickets', 'detail', ticketId] });
    queryClient.invalidateQueries({ queryKey: ['tickets', 'list'] });
    queryClient.invalidateQueries({ queryKey: ['tickets', 'counts'] });
  };

  const replyMutation = useMutation({
    mutationFn: () => ticketService.replyToTicket(ticketId, reply),
    onSuccess: () => {
      toast.success(isAr ? 'تم إرسال الرد للعميل' : 'Reply sent to customer');
      setReply('');
      invalidate();
    },
  });

  const statusMutation = useMutation({
    mutationFn: () => ticketService.updateStatus(ticketId, status),
    onSuccess: () => {
      toast.success(isAr ? 'تم تحديث حالة التذكرة' : 'Ticket status updated');
      invalidate();
    },
  });

  const assignMutation = useMutation({
    mutationFn: () => ticketService.assignTicket(ticketId, Number(assignee)),
    onSuccess: () => {
      toast.success(isAr ? 'تم تعيين التذكرة' : 'Ticket assigned');
      invalidate();
    },
  });

  const priority = PRIORITY_STYLES[ticket?.priority || 'medium'] || PRIORITY_STYLES.medium;
  const statusMeta = ticket ? STATUS_OPTIONS.find((s) => s.value === ticket.status) : undefined;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                {ticket?.ticket_number || `#${ticketId}`}
              </span>
              {ticket && (
                <>
                  <StatusBadge
                    label={statusMeta ? (isAr ? statusMeta.ar : statusMeta.en) : ticket.status}
                    variant={
                      ticket.status === 'resolved'
                        ? 'success'
                        : ticket.status === 'closed'
                          ? 'neutral'
                          : ticket.status === 'waiting_customer'
                            ? 'purple'
                            : ticket.status === 'in_progress'
                              ? 'info'
                              : 'warning'
                    }
                    dot
                  />
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${priority.cls}`}>
                    {isAr ? priority.ar : priority.en}
                  </span>
                </>
              )}
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-1 truncate">
              {ticket?.subject || (isLoading ? '...' : '')}
            </h3>
            {ticket && (
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isAr ? 'العميل' : 'Customer'}: {ticket.user?.name || '—'}
                {ticket.user?.email ? ` (${ticket.user.email})` : ''}
                {' · '}
                <span className="font-mono">{ticket.created_at ? formatDate(ticket.created_at) : '—'}</span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        {isError ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 p-8 text-center">
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              {isAr ? 'تعذر تحميل تفاصيل التذكرة' : 'Failed to load ticket details'}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="px-3 py-1.5 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              {isAr ? 'إعادة المحاولة' : 'Retry'}
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/60 dark:bg-slate-950/40">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <span className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {ticket?.messages?.length ? (
                  ticket.messages.map((msg) => {
                    const isStaff = msg.is_from_staff;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col max-w-[85%] ${isStaff ? 'ms-auto items-end' : 'me-auto items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-400">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {msg.user?.name || (isStaff ? (isAr ? 'فريق الدعم' : 'Support') : (isAr ? 'العميل' : 'Customer'))}
                          </span>
                          {isStaff && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                              {isAr ? 'فريق الدعم' : 'Staff'}
                            </span>
                          )}
                          <span>·</span>
                          <span className="font-mono">{msg.created_at ? formatDate(msg.created_at) : ''}</span>
                        </div>
                        <div
                          className={`p-3 rounded-xl leading-relaxed whitespace-pre-line ${
                            isStaff
                              ? 'bg-blue-600 text-white'
                              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {msg.message}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-slate-400 py-8">
                    {isAr ? 'لا توجد رسائل بعد' : 'No messages yet'}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Footer controls */}
        {!isError && (
          <div className="border-t border-slate-100 dark:border-slate-800 p-3 space-y-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!reply.trim()) return;
                replyMutation.mutate();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder={isAr ? 'اكتب ردك للعميل هنا...' : 'Type your reply to the customer...'}
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={replyMutation.isPending || !reply.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
              >
                {replyMutation.isPending ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>{isAr ? 'إرسال الرد' : 'Send'}</span>
              </button>
            </form>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex flex-1 items-center gap-2">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TicketStatus)}
                  className="flex-1 px-2.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {isAr ? s.ar : s.en}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => statusMutation.mutate()}
                  disabled={statusMutation.isPending || status === ticket?.status}
                  className="inline-flex items-center gap-1.5 px-3 py-2 font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${statusMutation.isPending ? 'animate-spin' : ''}`} />
                  <span>{isAr ? 'تحديث الحالة' : 'Update status'}</span>
                </button>
              </div>

              <div className="flex flex-1 items-center gap-2">
                <select
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  className="flex-1 px-2.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden"
                >
                  <option value="">{isAr ? 'غير معيّن' : 'Unassigned'}</option>
                  {employees.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => assignMutation.mutate()}
                  disabled={assignMutation.isPending || !assignee || Number(assignee) === ticket?.assigned_to}
                  className="inline-flex items-center gap-1.5 px-3 py-2 font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg disabled:opacity-50"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تعيين' : 'Assign'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketDetailsModal;
