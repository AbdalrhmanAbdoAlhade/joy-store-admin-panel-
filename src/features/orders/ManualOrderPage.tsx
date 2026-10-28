import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2, ShoppingCart, User } from 'lucide-react';
import { orderService } from '@/src/services/orderService';
import { productService } from '@/src/services/productService';
import { ManualOrderPayload } from '@/src/types/order';
import { localizedText } from '@/src/lib/api-helpers';
import { formatCurrency } from '@/src/lib/utils';
import { toast } from 'sonner';

export const ManualOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAr = (localStorage.getItem('toy_admin_lang') || 'ar') === 'ar';

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [governorate, setGovernorate] = useState('القاهرة');
  const [city, setCity] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [shippingFee, setShippingFee] = useState(50);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [adminNotes, setAdminNotes] = useState('');

  const [items, setItems] = useState<{ product_id: string | number; quantity: number; unit_price: number; name: string }[]>([]);

  const { data: productsRes } = useQuery({
    queryKey: ['products', 'all-for-order'],
    queryFn: () => productService.getProducts({ per_page: 50 }),
  });

  const products = productsRes?.data || [];

  const handleAddItem = (productId: string | number) => {
    const p = products.find((prod) => String(prod.id) === String(productId));
    if (!p) return;

    const existing = items.find((i) => String(i.product_id) === String(productId));
    if (existing) {
      setItems(items.map((i) => (String(i.product_id) === String(productId) ? { ...i, quantity: i.quantity + 1 } : i)));
    } else {
      setItems([
        ...items,
        {
          product_id: p.id,
          name: localizedText(p.name, isAr ? 'ar' : 'en'),
          quantity: 1,
          unit_price: p.discount_price || p.price,
        },
      ]);
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const subtotal = items.reduce((acc, i) => acc + i.unit_price * i.quantity, 0);
  const total = subtotal + Number(shippingFee);

  const createMutation = useMutation({
    mutationFn: (payload: ManualOrderPayload) => orderService.createManualOrder(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('تم إنشاء الطلب اليدوي بنجاح');
      navigate(`/orders/${res.data.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      toast.error('يرجى إدخال اسم العميل ورقم الهاتف');
      return;
    }
    if (items.length === 0) {
      toast.error('يرجى إضافة لعبة واحدة على الأقل للسلة');
      return;
    }

    createMutation.mutate({
      customer_name: customerName,
      customer_email: customerEmail || 'customer@toystore.com',
      customer_phone: customerPhone,
      items: items.map((i) => ({
        product_id: i.product_id,
        quantity: i.quantity,
        unit_price: i.unit_price,
      })),
      shipping_address: {
        recipient_name: customerName,
        phone: customerPhone,
        governorate,
        city: city || 'المدينة',
        address_line: addressLine || 'العنوان بالتفصيل',
      },
      shipping_fee: Number(shippingFee),
      payment_method: paymentMethod,
      admin_notes: adminNotes,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/orders')}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              إنشاء طلب يدوي جديد
            </h1>
            <p className="text-xs text-slate-500">
              تسجيل طلب هاتفي أو استثنائي لعميل من خلال لوحة الأدمن
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={createMutation.isPending}
          className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
        >
          {createMutation.isPending ? 'جاري الإنشاء...' : 'حفظ وإنشاء الطلب'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer & Address Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
              بيانات العميل وعنوان التوصيل
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">اسم العميل *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">رقم الهاتف *</label>
                <input
                  type="tel"
                  required
                  dir="ltr"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="01012345678"
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  dir="ltr"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">المحافظة</label>
                <select
                  value={governorate}
                  onChange={(e) => setGovernorate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden"
                >
                  <option value="القاهرة">القاهرة</option>
                  <option value="الجيزة">الجيزة</option>
                  <option value="الإسكندرية">الإسكندرية</option>
                  <option value="الدقهلية">الدقهلية</option>
                  <option value="الغربية">الغربية</option>
                  <option value="الشرقية">الشرقية</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">المدينة / الحي</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="مدينة نصر / المعادي"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">العنوان التفصيلي</label>
                <input
                  type="text"
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  placeholder="الشارع ورقم العمارة والشقة"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Items Selector */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
              إضافة ألعاب للطلب
            </h2>

            <div className="flex gap-2">
              <select
                id="product-select"
                className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden"
              >
                <option value="">اختر اللعبة من الكتالوج لإضافتها للسلة...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {localizedText(p.name)} - {formatCurrency(p.discount_price || p.price)} (متبقي {p.stock})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  const sel = document.getElementById('product-select') as HTMLSelectElement;
                  if (sel.value) handleAddItem(sel.value);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                إضافة
              </button>
            </div>

            {/* Selected Items List */}
            {items.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400">
                لم تتم إضافة أي ألعاب للسلة بعد.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{item.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {formatCurrency(item.unit_price)} للقطعة
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (item.quantity > 1) {
                              setItems(items.map((i, iIdx) => (iIdx === idx ? { ...i, quantity: i.quantity - 1 } : i)));
                            }
                          }}
                          className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 text-slate-600"
                        >
                          -
                        </button>
                        <span className="font-mono font-bold px-2">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setItems(items.map((i, iIdx) => (iIdx === idx ? { ...i, quantity: i.quantity + 1 } : i)));
                          }}
                          className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 text-slate-600"
                        >
                          +
                        </button>
                      </div>

                      <span className="font-mono font-bold w-20 text-end">
                        {formatCurrency(item.unit_price * item.quantity)}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Summary */}
        <div className="space-y-4">
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4 text-xs">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
              ملخص الحساب والدفع
            </h2>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">طريقة الدفع</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden"
              >
                <option value="cod">دفع عند الاستلام (COD)</option>
                <option value="credit_card">بطاقة بنكية (سداد مسبق)</option>
                <option value="vodafone_cash">محفظة فودافون كاش / إنستاباي</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">مصاريف الشحن (ج.م)</label>
              <input
                type="number"
                value={shippingFee}
                onChange={(e) => setShippingFee(Number(e.target.value))}
                className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>المجموع الفرعي:</span>
                <span className="font-mono">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>الشحن والتوصيل:</span>
                <span className="font-mono">{formatCurrency(shippingFee)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-slate-100 pt-2 border-t">
                <span>الإجمالي الكلي:</span>
                <span className="font-mono text-blue-600">{formatCurrency(total)}</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">ملاحظات داخلية</label>
              <textarea
                rows={2}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="طلب هاتف تم إنشاؤه عبر الدعم الفني"
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default ManualOrderPage;
