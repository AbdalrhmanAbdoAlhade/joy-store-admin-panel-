import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Mail, Phone, Calendar } from 'lucide-react';
import { cmsService } from '@/src/services/cmsService';
import EmptyState from '@/src/components/common/EmptyState';
import { formatDate } from '@/src/lib/utils';

export const ContactMessagesPage: React.FC = () => {
  const { data: messagesRes, isLoading } = useQuery({
    queryKey: ['cms', 'messages'],
    queryFn: () => cmsService.getContactMessages(),
  });

  const messages = messagesRes?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          رسائل تواصل العملاء (Contact Inquiries)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          الرسائل الواردة من نموذج اتصل بنا، عروض الجملة للحضانات والمدارس
        </p>
      </div>

      {messages.length === 0 ? (
        <EmptyState message="لا توجد رسائل" description="خدمة رسائل التواصل غير متوفرة حالياً" />
      ) : (
      <div className="space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {msg.subject}
                </h3>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                  <span>من: {msg.sender_name}</span>
                  <span>·</span>
                  <span className="font-mono">{msg.sender_email}</span>
                  {msg.sender_phone && (
                    <>
                      <span>·</span>
                      <span className="font-mono" dir="ltr">{msg.sender_phone}</span>
                    </>
                  )}
                </div>
              </div>

              <span className="text-[10px] text-slate-400 font-mono">
                {formatDate(msg.created_at)}
              </span>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950 p-3 rounded-lg">
              {msg.message}
            </p>
          </div>
        ))}
      </div>
      )}
    </div>
  );
};

export default ContactMessagesPage;
