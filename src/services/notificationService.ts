export interface AdminNotification {
  id: string;
  type: 'order' | 'low_stock' | 'return' | 'ticket';
  title: string;
  message: string;
  read: boolean;
  link?: string;
  created_at: string;
}

export interface BroadcastNotificationPayload {
  title: string;
  body: string;
  target_audience: 'all' | 'buyers' | 'inactive';
  link_url?: string;
}

export interface NotificationsSummary {
  success: boolean;
  data: AdminNotification[];
  message?: string;
  meta: { total: number; unread: number };
}

// Notifications backend endpoint is not implemented yet (returns 404).
// The UI is a skeleton only, so this returns an empty stub instead of throwing.
export const notificationService = {
  async getNotifications(): Promise<NotificationsSummary> {
    return {
      success: true,
      data: [],
      meta: { total: 0, unread: 0 },
      message: 'الإشعارات غير متاحة حالياً',
    };
  },

  async markAsRead(id: string): Promise<{ success: boolean; message: string }> {
    void id;
    return { success: false, message: 'الإشعارات غير متاحة حالياً' };
  },

  async markAllAsRead(): Promise<{ success: boolean; message: string }> {
    return { success: false, message: 'الإشعارات غير متاحة حالياً' };
  },

  async sendBroadcast(payload: BroadcastNotificationPayload): Promise<{ success: boolean; message: string }> {
    void payload;
    return { success: false, message: 'خدمة الإشعارات غير متاحة حالياً' };
  },
};

export default notificationService;
