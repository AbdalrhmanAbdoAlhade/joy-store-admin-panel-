export type PermissionKey =
  | 'orders.view'
  | 'orders.update_status'
  | 'orders.create_manual'
  | 'products.manage'
  | 'inventory.manage'
  | 'reviews.moderate'
  | 'tickets.reply'
  | 'returns.manage'
  | 'coupons.view'
  | 'customers.manage'
  | 'reports.view'
  | 'settings.manage';

export interface PermissionDefinition {
  key: PermissionKey;
  label: { ar: string; en: string };
  category: { ar: string; en: string };
  description: { ar: string; en: string };
}

export interface Employee {
  id: number | string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'employee';
  is_active: boolean;
  permissions: PermissionKey[];
  avatar?: string;
  last_active_at?: string;
  created_at: string;
}

export const SYSTEM_PERMISSIONS: PermissionDefinition[] = [
  {
    key: 'orders.view',
    label: { ar: 'عرض الطلبات', en: 'View Orders' },
    category: { ar: 'المبيعات والطلبات', en: 'Sales & Orders' },
    description: { ar: 'الاطلاع على قائمة وتفاصيل الطلبات', en: 'Access orders list and details' },
  },
  {
    key: 'orders.update_status',
    label: { ar: 'تغيير حالة الطلب', en: 'Update Order Status' },
    category: { ar: 'المبيعات والطلبات', en: 'Sales & Orders' },
    description: { ar: 'تحديث حالة الشحن والتسليم والتجهيز', en: 'Change shipping and fulfillment state' },
  },
  {
    key: 'orders.create_manual',
    label: { ar: 'إنشاء طلب يدوي', en: 'Create Manual Order' },
    category: { ar: 'المبيعات والطلبات', en: 'Sales & Orders' },
    description: { ar: 'تسجيل طلبات هاتفية أو يدوية للعملاء', en: 'Create manual orders on behalf of customers' },
  },
  {
    key: 'products.manage',
    label: { ar: 'إدارة المنتجات', en: 'Manage Products' },
    category: { ar: 'الكتالوج والمخزون', en: 'Catalog & Inventory' },
    description: { ar: 'إضافة وتعديل وحذف ألعاب الأطفال والبيانات', en: 'Create, update, and archive products' },
  },
  {
    key: 'inventory.manage',
    label: { ar: 'إدارة المخزون', en: 'Manage Inventory' },
    category: { ar: 'الكتالوج والمخزون', en: 'Catalog & Inventory' },
    description: { ar: 'تسوية الأرصدة وحركات الجرد وتعديل الكميات', en: 'Adjust stock quantities and logs' },
  },
  {
    key: 'reviews.moderate',
    label: { ar: 'إدارة التقييمات والأسئلة', en: 'Moderate Reviews & Q&A' },
    category: { ar: 'خدمة العملاء', en: 'Customer Care' },
    description: { ar: 'قبول ورفض تقييمات الألعاب والرد على استفسارات الآباء', en: 'Approve reviews and answer questions' },
  },
  {
    key: 'tickets.reply',
    label: { ar: 'الرد على تذاكر الدعم', en: 'Reply to Tickets' },
    category: { ar: 'خدمة العملاء', en: 'Customer Care' },
    description: { ar: 'متابعة شكاوى واستفسارات أولياء الأمور', en: 'Respond to support tickets and assign staff' },
  },
  {
    key: 'returns.manage',
    label: { ar: 'إدارة طلبات المرتجعات', en: 'Manage Returns' },
    category: { ar: 'المبيعات والطلبات', en: 'Sales & Orders' },
    description: { ar: 'الموافقة على إرجاع الألعاب وإصدار الاسترداد', en: 'Review and approve return requests and refunds' },
  },
  {
    key: 'coupons.view',
    label: { ar: 'عرض كوبونات الخصم', en: 'View Coupons' },
    category: { ar: 'التسويق والعروض', en: 'Marketing & Promotions' },
    description: { ar: 'استعراض رموز الخصم والعروض الترويجية', en: 'Inspect promo codes and campaigns' },
  },
  {
    key: 'customers.manage',
    label: { ar: 'إدارة حسابات العملاء', en: 'Manage Customers' },
    category: { ar: 'خدمة العملاء', en: 'Customer Care' },
    description: { ar: 'حظر وتفعيل حسابات العملاء وتعديل النقاط', en: 'Activate/ban customers and adjust loyalty points' },
  },
  {
    key: 'reports.view',
    label: { ar: 'عرض التقارير والأرباح', en: 'View Reports' },
    category: { ar: 'التحليلات المالية', en: 'Analytics & Financials' },
    description: { ar: 'الاطلاع على تقارير الأرباح وتكاليف المنتجات', en: 'Inspect margins, cost prices, and revenue' },
  },
  {
    key: 'settings.manage',
    label: { ar: 'إدارة إعدادات المتجر', en: 'Manage Settings' },
    category: { ar: 'إعدادات النظام', en: 'System Settings' },
    description: { ar: 'تعديل سياسات المتجر والضرائب وبوابات الدفع', en: 'Configure store parameters and tax rates' },
  },
];
