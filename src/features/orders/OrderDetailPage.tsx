import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Truck,
  Printer,
  RotateCcw,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  Mail,
  User,
  FileText,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { orderService } from '@/src/services/orderService';
import { Order, OrderStatus } from '@/src/types/order';
import StatusBadge from '@/src/components/common/StatusBadge';
import { localizedText } from '@/src/lib/api-helpers';
import { formatCurrency, formatDate } from '@/src/lib/utils';
import { toast } from 'sonner';

// Valid status transitions
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'returned'],
  delivered: ['returned'],
  cancelled: [],
  returned: [],
};

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAr = (localStorage.getItem('toy_admin_lang') || 'ar') === 'ar';

  // Tracking Modal State
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [courierCompany, setCourierCompany] = useState('Bosta Express');

  // Internal Note State
  const [adminNote, setAdminNote] = useState('');

  // Refund Modal State
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState(0);
  const [refundReason, setRefundReason] = useState('');

  const { data: orderRes, isLoading } = useQuery({
    queryKey: ['orders', 'detail', id],
    queryFn: () => orderService.getOrderById(id!),
  });

  const order = orderRes?.data;

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ status, note }: { status: OrderStatus; note?: string }) =>
      orderService.updateOrderStatus(id!, status, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('تم تحديث حالة الطلب بنجاح');
    },
  });

  const trackingMutation = useMutation({
    mutationFn: () => orderService.setTrackingNumber(id!, trackingNumber, courierCompany),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('تم حفظ رقم بوليصة الشحن');
      setTrackingModalOpen(false);
    },
  });

  const noteMutation = useMutation({
    mutationFn: () => orderService.addInternalNote(id!, adminNote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('تم حفظ الملاحظة الداخلية');
    },
  });

  const refundMutation = useMutation({
    mutationFn: () =>
      orderService.processRefund({
        order_id: id!,
        amount: refundAmount,
        type: refundAmount >= (order?.total_amount || 0) ? 'full' : 'partial',
        reason: refundReason,
        restore_stock: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('تم تسجيل الاسترداد وإرجاع الرصيد للمخزن');
      setRefundModalOpen(false);
    },
  });

  if (isLoading || !order) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const allowedNext = ALLOWED_TRANSITIONS[order.status] || [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/orders')}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-mono">
                {order.order_number}
              </h1>
              <StatusBadge
                label={
                  order.status === 'processing'
                    ? 'جاري التجهيز'
                    : order.status === 'shipped'
                    ? 'تم الشحن'
                    : order.status === 'delivered'
                    ? 'تم التسليم'
                    : order.status === 'cancelled'
                    ? 'ملغي'
                    : order.status === 'returned'
                    ? 'مرتجع'
                    : 'قيد الانتظار'
                }
                variant={
                  order.status === 'delivered'
                    ? 'success'
                    : order.status === 'shipped'
                    ? 'info'
                    : order.status === 'cancelled'
                    ? 'danger'
                    : 'warning'
                }
                dot
              />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              تاريخ الطلب: {formatDate(order.created_at)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>طباعة الفاتورة</span>
          </button>

          <button
            disabled
            title="قريباً"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-400 border border-slate-200 dark:border-slate-800 rounded-lg cursor-not-allowed"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>استرداد مالي (قريباً)</span>
          </button>

          {/* Status Transitions */}
          {allowedNext.map((nextStatus) => (
            <button
              key={nextStatus}
              onClick={() => updateStatusMutation.mutate({ status: nextStatus })}
              className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors text-white ${
                nextStatus === 'cancelled'
                  ? 'bg-red-600 hover:bg-red-700'
                  : nextStatus === 'shipped'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : nextStatus === 'delivered'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-slate-800 hover:bg-slate-900'
              }`}
            >
              تحويل إلى: {nextStatus === 'processing' ? 'تجهيز' : nextStatus === 'shipped' ? 'تم الشحن' : nextStatus === 'delivered' ? 'تم التسليم' : nextStatus === 'cancelled' ? 'إلغاء' : nextStatus}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Layout: Left Details, Right Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Items & Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items Table */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              الألعاب والمنتجات المطلوبة ({order.items.length})
            </h2>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {order.items.map((item) => (
                <div key={item.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-base shrink-0">
                      🧸
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {localizedText(item.product_name, isAr ? 'ar' : 'en')}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        كود: {item.sku} · الكمية: {item.quantity}
                      </p>
                    </div>
                  </div>

                  <div className="text-end font-mono">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                      {formatCurrency(item.total_price)}
                    </p>
                    <p className="text-[11px] text-slate-400 tabular-nums">
                      {formatCurrency(item.unit_price)} للقطعة
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Subtotals */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>قيمة المنتجات (Subtotal):</span>
                <span className="font-mono tabular-nums">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>مصاريف الشحن والتوصيل:</span>
                <span className="font-mono tabular-nums">{formatCurrency(order.shipping_fee)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>الخصم (كوبون: {order.coupon_code || 'PROMO'}):</span>
                  <span className="font-mono tabular-nums">-{formatCurrency(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>ضريبة القيمة المضافة:</span>
                <span className="font-mono tabular-nums">{formatCurrency(order.tax_amount)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-slate-100 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span>الإجمالي النهائي المستحق:</span>
                <span className="font-mono tabular-nums text-blue-600 dark:text-blue-400">
                  {formatCurrency(order.total_amount)}
                </span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              سجل تطور حالة الطلب (Order Timeline)
            </h2>

            <div className="relative ps-6 space-y-6 before:absolute before:start-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {order.timeline.map((event) => (
                <div key={event.id} className="relative">
                  <div className="absolute -start-6 top-1 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-white dark:ring-slate-900" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {event.title}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatDate(event.created_at)}
                      </span>
                    </div>
                    {event.note && (
                      <p className="text-xs text-slate-500 mt-0.5 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-md">
                        {event.note}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      بواسطة: {event.actor_name} ({event.actor_role})
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Internal Notes */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              ملاحظات فريق العمل والإدارة (سرية داخلية)
            </h2>
            <textarea
              rows={3}
              value={adminNote || order.admin_internal_notes || ''}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="أضف تعليمات خاصة بالتغليف أو توصيات للمندوب أو خدمة العملاء..."
              className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            <button
              disabled
              title="قريباً"
              className="px-3 py-1.5 text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-not-allowed"
            >
              حفظ الملاحظة (قريباً)
            </button>
          </div>
        </div>

        {/* Right 1 Col: Customer & Shipping */}
        <div className="space-y-6">
          {/* Customer Profile Card */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
              بيانات العميل (ولي الأمر)
            </h2>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
                {order.customer_name.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {order.customer_name}
                </p>
                <p className="text-[11px] text-slate-400">عميل مسجل</p>
              </div>
            </div>

            <div className="space-y-2 pt-2 text-xs">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span dir="ltr" className="font-mono">{order.customer_phone}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate">{order.customer_email}</span>
              </div>
            </div>
          </div>

          {/* Delivery & Tracking Card */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                عنوان الشحن والتوصيل
              </h2>
              <button
                disabled
                title="قريباً"
                className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 cursor-not-allowed"
              >
                <Truck className="w-3 h-3" />
                <span>تعيين بوليصة (قريباً)</span>
              </button>
            </div>

            <div className="text-xs space-y-2 text-slate-700 dark:text-slate-300">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">{order.shipping_address.governorate} · {order.shipping_address.city}</p>
                  <p className="text-slate-500 mt-0.5 leading-relaxed">
                    {order.shipping_address.address_line}
                  </p>
                </div>
              </div>

              {order.tracking_number && (
                <div className="mt-3 p-3 bg-blue-50/50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900/60">
                  <p className="text-[11px] text-blue-800 dark:text-blue-300 font-semibold">
                    شركة الشحن: {order.shipping_company}
                  </p>
                  <p className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                    رقم التتبع: {order.tracking_number}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Set Tracking Modal */}
      {trackingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              تعيين رقم بوليصة الشحن
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">شركة الشحن</label>
                <select
                  value={courierCompany}
                  onChange={(e) => setCourierCompany(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden"
                >
                  <option value="Bosta Express">بوسطة إكسبريس (Bosta)</option>
                  <option value="Mylerz">مايلرز (Mylerz)</option>
                  <option value="Aramex">أرامكس (Aramex)</option>
                  <option value="مندوب المتجر الخاص">مندوب المتجر الخاص</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">رقم التتبع الفريد</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="BST-1928374-EG"
                  className="w-full p-2 font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTrackingModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => trackingMutation.mutate()}
                  className="px-4 py-1.5 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  حفظ البوليصة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {refundModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              بدء عملية استرداد مالي (Refund)
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">المبلغ المراد استرداده (ج.م)</label>
                <input
                  type="number"
                  max={order.total_amount}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(Number(e.target.value))}
                  className="w-full p-2 font-mono font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">سبب الاسترداد</label>
                <input
                  type="text"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="إرجاع لعبة تالفة / إلغاء طلب قبل الشحن"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRefundModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => refundMutation.mutate()}
                  className="px-4 py-1.5 font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700"
                >
                  تأكيد الاسترداد
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailPage;
