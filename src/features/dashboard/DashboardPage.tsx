import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  ShoppingCart,
  Users,
  AlertTriangle,
  TrendingUp,
  Package,
  Layers,
  MapPin,
  Clock,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { reportService } from '@/src/services/reportService';
import { orderService } from '@/src/services/orderService';
import StatCard from '@/src/components/charts/StatCard';
import ChartCard from '@/src/components/charts/ChartCard';
import StatusBadge from '@/src/components/common/StatusBadge';
import EmptyState from '@/src/components/common/EmptyState';
import { localizedText } from '@/src/lib/api-helpers';
import { formatCurrency, formatDate } from '@/src/lib/utils';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [timelinePeriod, setTimelinePeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const isAr = (localStorage.getItem('toy_admin_lang') || 'ar') === 'ar';

  // Queries
  const { data: summaryRes, isLoading: summaryLoading } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => reportService.getDashboardSummary(),
  });

  const { data: timelineRes, isLoading: timelineLoading } = useQuery({
    queryKey: ['dashboard', 'timeline', timelinePeriod],
    queryFn: () => reportService.getSalesTimeline(timelinePeriod),
  });

  const { data: topSellingRes } = useQuery({
    queryKey: ['dashboard', 'top-selling'],
    queryFn: () => reportService.getTopSellingToys(),
  });

  const { data: stagnantRes } = useQuery({
    queryKey: ['dashboard', 'stagnant'],
    queryFn: () => reportService.getStagnantToys(),
  });

  const { data: categorySalesRes } = useQuery({
    queryKey: ['dashboard', 'category-sales'],
    queryFn: () => reportService.getSalesByCategory(),
  });

  const { data: governorateSalesRes } = useQuery({
    queryKey: ['dashboard', 'governorate-sales'],
    queryFn: () => reportService.getSalesByGovernorate(),
  });

  const { data: recentOrdersRes } = useQuery({
    queryKey: ['dashboard', 'recent-orders'],
    queryFn: () => orderService.getOrders({ per_page: 5 }),
  });

  const summary = summaryRes?.data;
  const timeline = Array.isArray(timelineRes?.data) ? timelineRes.data : [];
  const topSelling = Array.isArray(topSellingRes?.data) ? topSellingRes.data : [];
  const stagnant = Array.isArray(stagnantRes?.data) ? stagnantRes.data : [];
  const categorySales = Array.isArray(categorySalesRes?.data) ? categorySalesRes.data : [];
  const governorateSales = Array.isArray(governorateSalesRes?.data) ? governorateSalesRes.data : [];
  const recentOrders = Array.isArray(recentOrdersRes?.data) ? recentOrdersRes.data : [];

  const pendingOrders =
    summary?.orders_by_status?.find((s) => s.status === 'pending')?.count ?? 0;
  const alertCount = (type: string) =>
    summary?.alerts?.find((a) => a.type === type)?.count ?? 0;

  const CATEGORY_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            لوحة معلومات المتجر
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            متابعة حية للمبيعات، حركة شحن الطلبات وتنبيهات ألعاب الأطفال
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/orders/create')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>إنشاء طلب يدوي</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/products/create')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Package className="w-3.5 h-3.5" />
            <span>إضافة لعبة جديدة</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="مبيعات اليوم"
          value={formatCurrency(summary?.today_sales || 0)}
          subtitle={`${summary?.today_orders || 0} طلب اليوم`}
          icon={DollarSign}
        />
        <StatCard
          title="مبيعات الأسبوع"
          value={formatCurrency(summary?.week_sales || 0)}
          subtitle={`${summary?.week_orders || 0} طلب هذا الأسبوع`}
          icon={TrendingUp}
        />
        <StatCard
          title="متوسط قيمة الطلب (AOV)"
          value={formatCurrency(summary?.average_order_value || 0)}
          subtitle="معدل مشتريات السلة للطفل"
          icon={ShoppingCart}
        />
        <StatCard
          title="عملاء جدد هذا الشهر"
          value={summary?.customers_new_month || 0}
          subtitle="أولياء أمور مسجلين جدد"
          icon={Users}
        />
      </div>

      {/* Second KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <p className="text-[11px] text-slate-500">إجمالي الطلبات (هذا الشهر)</p>
          <p className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
            {summary?.month_orders || 0}
          </p>
        </div>
        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <p className="text-[11px] text-slate-500">طلبات بانتظار التجهيز</p>
          <p className="text-lg font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-0.5">
            {pendingOrders}
          </p>
        </div>
        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <p className="text-[11px] text-slate-500">طلبات المرتجعات</p>
          <p className="text-lg font-bold font-mono tabular-nums text-purple-600 dark:text-purple-400 mt-0.5">
            {alertCount('pending_returns')}
          </p>
        </div>
        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <p className="text-[11px] text-slate-500">ألعاب أوشكت على النفاد</p>
          <p className="text-lg font-bold font-mono tabular-nums text-red-600 dark:text-red-400 mt-0.5">
            {alertCount('low_stock')}
          </p>
        </div>
      </div>

      {/* Sales Analytics Chart & Category Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Timeline Chart */}
        <div className="lg:col-span-2">
          <ChartCard
            title="مخطط الإيرادات والمبيعات والأرباح"
            subtitle="مقارنة المبيعات والتكلفة وصافي الهامش"
            action={
              <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                {(['7d', '30d', '90d', '1y'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setTimelinePeriod(p)}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                      timelinePeriod === p
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {p === '7d' ? '7 أيام' : p === '30d' ? '30 يوم' : p === '90d' ? '3 أشهر' : 'سنة'}
                  </button>
                ))}
              </div>
            }
          >
            <div className="h-[280px] w-full">
              {timeline.length === 0 ? (
                <EmptyState message="لا توجد بيانات للمخطط" description="لم تُسجّل أي مبيعات خلال هذه الفترة" />
              ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => `${val / 1000}k`}
                  />
                  <Tooltip
                    formatter={(value: any) => [`${Number(value).toLocaleString()} ج.م`]}
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    name="المبيعات"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSales)"
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    name="الأرباح الصافية"
                    stroke="#10B981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorProfit)"
                  />
                </AreaChart>
              </ResponsiveContainer>
              )}
            </div>
          </ChartCard>
        </div>

        {/* Categories Share */}
        <div className="lg:col-span-1">
          <ChartCard title="المبيعات حسب فئة الألعاب" subtitle="نسبة مساهمة كل فئة في إجمالي الإيرادات">
            <div className="h-[200px] w-full flex items-center justify-center">
              {categorySales.length === 0 ? (
                <EmptyState message="لا توجد بيانات للفئات" />
              ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categorySales}
                    dataKey="percentage"
                    nameKey="category_name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {categorySales.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => [`${value}%`, name]}
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              )}
            </div>

            <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto">
              {categorySales.map((cat, idx) => (
                <div key={cat.category_id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                    />
                    <span className="truncate text-slate-700 dark:text-slate-300">{cat.category_name}</span>
                  </div>
                  <span className="font-mono tabular-nums font-bold text-slate-800 dark:text-slate-200">
                    {cat.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      </div>

      {/* Tables Row: Best Sellers & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Toys */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">الأكثر مبيعاً</h3>
              <p className="text-xs text-slate-500">الألعاب الأكثر طلباً من قبل العائلات</p>
            </div>
            <button
              onClick={() => navigate('/reports')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>تقرير كامل</span>
              <ArrowRight className="w-3 h-3 rtl:rotate-180" />
            </button>
          </div>

          {topSelling.length === 0 ? (
            <EmptyState message="لا توجد بيانات مبيعات بعد" />
          ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {topSelling.map((toy) => (
              <div key={toy.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-sm shrink-0">
                    🧸
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {localizedText(toy.name, isAr ? 'ar' : 'en')}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">{toy.sku}</p>
                  </div>
                </div>

                <div className="text-end shrink-0">
                  <p className="text-xs font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                    {formatCurrency(toy.revenue)}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono tabular-nums">
                    بيع منها {toy.total_sold} قطعة
                  </p>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>

        {/* Recent Orders Feed */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">آخر الطلبات</h3>
              <p className="text-xs text-slate-500">حركة المبيعات والشحنات الحية</p>
            </div>
            <button
              onClick={() => navigate('/orders')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>كل الطلبات</span>
              <ArrowRight className="w-3 h-3 rtl:rotate-180" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentOrders.map((ord) => (
              <div
                key={ord.id}
                onClick={() => navigate(`/orders/${ord.id}`)}
                className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 px-2 rounded-lg cursor-pointer transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100 font-mono">
                      {ord.order_number}
                    </span>
                    <StatusBadge
                      label={
                        ord.status === 'processing'
                          ? 'جاري التجهيز'
                          : ord.status === 'shipped'
                          ? 'تم الشحن'
                          : ord.status === 'delivered'
                          ? 'تم التسليم'
                          : 'قيد الانتظار'
                      }
                      variant={
                        ord.status === 'delivered'
                          ? 'success'
                          : ord.status === 'shipped'
                          ? 'info'
                          : 'warning'
                      }
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {ord.customer_name} · {ord.shipping_address.governorate}
                  </p>
                </div>

                <div className="text-end shrink-0">
                  <p className="text-xs font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                    {formatCurrency(ord.total_amount)}
                  </p>
                  <p className="text-[10px] text-slate-400">{formatDate(ord.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Regional Sales by Governorate & Stagnant Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Governorate */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              المبيعات حسب المحافظات المصرية
            </h3>
          </div>
          {governorateSales.length === 0 ? (
            <EmptyState message="لا توجد بيانات للمحافظات" />
          ) : (
          <div className="space-y-3">
            {governorateSales.map((gov) => {
              const maxVal = governorateSales[0]?.total_sales || 1;
              const pct = Math.round((gov.total_sales / maxVal) * 100);
              return (
                <div key={gov.governorate} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {gov.governorate}
                    </span>
                    <span className="font-mono tabular-nums text-slate-600 dark:text-slate-400">
                      {formatCurrency(gov.total_sales)} ({gov.orders_count} طلب)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>

        {/* Stagnant Products (Capital Optimization) */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                منتجات راكدة (رأس مال معطّل)
              </h3>
            </div>
            <span className="text-xs text-slate-400">لم تُباع منذ 60+ يوم</span>
          </div>

          {stagnant.length === 0 ? (
            <EmptyState message="لا توجد منتجات راكدة" />
          ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {stagnant.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {localizedText(item.name, isAr ? 'ar' : 'en')}
                  </p>
                  <p className="text-[11px] text-amber-600 dark:text-amber-400">
                    راكد منذ {item.days_without_sale} يوم · متبقّي {item.stock_quantity} قطعة
                  </p>
                </div>
                <div className="text-end shrink-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
                    {formatCurrency(item.tied_up_capital)}
                  </p>
                  <button
                    onClick={() => navigate('/coupons')}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline mt-0.5"
                  >
                    إنشاء عرض ترويجي
                  </button>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
