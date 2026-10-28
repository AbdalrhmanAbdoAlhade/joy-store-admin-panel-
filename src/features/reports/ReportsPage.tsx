import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Download, TrendingUp, DollarSign, Package, Calendar } from 'lucide-react';
import { reportService } from '@/src/services/reportService';
import EmptyState from '@/src/components/common/EmptyState';
import { formatCurrency } from '@/src/lib/utils';
import { toast } from 'sonner';

export const ReportsPage: React.FC = () => {
  const isAr = (localStorage.getItem('toy_admin_lang') || 'ar') === 'ar';
  const [reportType, setReportType] = useState<'sales' | 'profits' | 'products'>('sales');
  const [dateRange, setDateRange] = useState('30d');

  const { data: timelineRes, isLoading } = useQuery({
    queryKey: ['reports', 'timeline', dateRange],
    queryFn: () => reportService.getSalesTimeline('30d'),
  });

  const { data: topSellingRes } = useQuery({
    queryKey: ['reports', 'top-selling'],
    queryFn: () => reportService.getTopSellingToys(),
  });

  const timeline = Array.isArray(timelineRes?.data) ? timelineRes.data : [];
  const topSelling = Array.isArray(topSellingRes?.data) ? topSellingRes.data : [];
  void topSelling;

  const totalSales = timeline.reduce((acc, t) => acc + t.sales, 0);
  const totalCost = timeline.reduce((acc, t) => acc + t.cost, 0);
  const netProfit = totalSales - totalCost;
  const profitMargin = totalSales > 0 ? Math.round((netProfit / totalSales) * 100) : 0;

  const handleExportCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'التاريخ,المبيعات,التكلفة,الأرباح,عدد الطلبات\n' +
      timeline.map((t) => `${t.date},${t.sales},${t.cost},${t.profit},${t.orders}`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `toy_store_report_${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('تم تصدير ملف التقرير بتنسيق CSV بنجاح');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            التقارير المالية والتحليلات
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            تحليل هوامش الربح الحقيقية، تكاليف الألعاب، أداء المبيعات والتصدير
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>تصدير تقرير Excel / CSV</span>
        </button>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <p className="text-xs text-slate-500">إجمالي الإيرادات (المبيعات)</p>
          <p className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-1">
            {formatCurrency(totalSales)}
          </p>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <p className="text-xs text-slate-500">إجمالي تكلفة البضاعة (COGS)</p>
          <p className="text-xl font-bold font-mono tabular-nums text-slate-600 dark:text-slate-400 mt-1">
            {formatCurrency(totalCost)}
          </p>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <p className="text-xs text-slate-500">صافي الأرباح المحققة</p>
          <p className="text-xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(netProfit)}
          </p>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <p className="text-xs text-slate-500">متوسط هامش الربح الإجمالي</p>
          <p className="text-xl font-bold font-mono tabular-nums text-blue-600 dark:text-blue-400 mt-1">
            {profitMargin}%
          </p>
        </div>
      </div>

      {/* Breakdown Table */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            جدول التدفقات اليومية وهوامش الأرباح
          </h2>
          <span className="text-xs text-slate-400">آخر 30 يوماً</span>
        </div>

        {timeline.length === 0 ? (
          <EmptyState message="لا توجد بيانات للفترة المحددة" />
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500">
              <tr>
                <th className="px-4 py-2.5 text-start">التاريخ</th>
                <th className="px-4 py-2.5 text-start">عدد الطلبات</th>
                <th className="px-4 py-2.5 text-start">المبيعات</th>
                <th className="px-4 py-2.5 text-start">التكلفة الإجمالية</th>
                <th className="px-4 py-2.5 text-start">صافي الربح</th>
                <th className="px-4 py-2.5 text-start">نسبة الهامش</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {timeline.map((row, idx) => {
                const margin = row.sales > 0 ? Math.round((row.profit / row.sales) * 100) : 0;
                return (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono text-slate-800 dark:text-slate-200">
                      {row.date}
                    </td>
                    <td className="px-4 py-3 font-mono">{row.orders} طلب</td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(row.sales)}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500">
                      {formatCurrency(row.cost)}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-emerald-600">
                      {formatCurrency(row.profit)}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-blue-600">
                      {margin}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
