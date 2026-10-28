import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Package,
  Layers,
  Archive,
  ShoppingCart,
  Tags,
  Truck,
  CreditCard,
  RotateCcw,
  Star,
  MessageSquare,
  HelpCircle,
  Users,
  UserCheck,
  Shield,
  FileText,
  Image as ImageIcon,
  Bell,
  BarChart3,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  Boxes,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { JoyLogo } from '@/src/components/common/JoyLogo';
import { useAuthStore } from '@/src/stores/authStore';
import usePermission, { checkPermission } from '@/src/hooks/usePermission';

interface SidebarNavItemProps {
  name: string;
  path: string;
  icon: React.ElementType;
  permission?: string | null;
  collapsed: boolean;
}

const SidebarNavItem: React.FC<SidebarNavItemProps> = ({
  name,
  path,
  icon: Icon,
  permission,
  collapsed,
}) => {
  const allowed = usePermission(permission);

  if (!allowed) return null;

  return (
    <NavLink
      to={path}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
          isActive
            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/60'
        )
      }
      title={name}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {!collapsed && <span className="truncate">{name}</span>}
    </NavLink>
  );
};

export const Sidebar: React.FC = () => {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [collapsed, setCollapsed] = useState(false);

  const navSections = [
    {
      title: t('nav.dashboard'),
      items: [
        { name: t('nav.dashboard'), path: '/dashboard', icon: LayoutDashboard, permission: null },
      ],
    },
    {
      title: t('nav.catalog'),
      items: [
        { name: t('nav.products'), path: '/products', icon: Package, permission: 'products.manage' },
        { name: t('nav.categories'), path: '/categories', icon: Layers, permission: 'products.manage' },
        { name: t('nav.brands'), path: '/brands', icon: Boxes, permission: 'products.manage' },
        { name: t('nav.ageGroups'), path: '/age-groups', icon: Users, permission: 'products.manage' },
        { name: t('nav.inventory'), path: '/inventory', icon: Archive, permission: 'inventory.manage' },
      ],
    },
    {
      title: t('nav.orders'),
      items: [
        { name: t('nav.allOrders'), path: '/orders', icon: ShoppingCart, permission: 'orders.view' },
        { name: t('nav.returns'), path: '/returns', icon: RotateCcw, permission: 'returns.manage' },
        { name: t('nav.coupons'), path: '/coupons', icon: Tags, permission: 'coupons.view' },
        { name: t('nav.shipping'), path: '/shipping/zones', icon: Truck, permission: 'settings.manage' },
        { name: t('nav.payments'), path: '/payments/transactions', icon: CreditCard, permission: 'settings.manage' },
      ],
    },
    {
      title: t('nav.customers'),
      items: [
        { name: t('nav.users'), path: '/users', icon: Users, permission: 'customers.manage' },
        { name: t('nav.reviews'), path: '/reviews', icon: Star, permission: 'reviews.moderate' },
        { name: t('nav.tickets'), path: '/tickets', icon: MessageSquare, permission: 'tickets.reply' },
      ],
    },
    {
      title: t('nav.administration'),
      items: [
        { name: t('nav.employees'), path: '/employees', icon: UserCheck, permission: 'settings.manage' },
        { name: t('nav.roles'), path: '/roles', icon: Shield, permission: 'settings.manage' },
        { name: t('nav.reports'), path: '/reports', icon: BarChart3, permission: 'reports.view' },
        { name: t('nav.settings'), path: '/settings', icon: Settings, permission: 'settings.manage' },
        { name: t('nav.notifications'), path: '/notifications', icon: Bell, permission: null },
        { name: t('nav.activityLog'), path: '/activity-log', icon: History, permission: 'settings.manage' },
      ],
    },
    {
      title: t('nav.cms'),
      items: [
        { name: t('nav.banners'), path: '/cms/banners', icon: ImageIcon, permission: 'settings.manage' },
        { name: t('nav.pages'), path: '/cms/pages', icon: FileText, permission: 'settings.manage' },
        { name: t('nav.faqs'), path: '/cms/faqs', icon: HelpCircle, permission: 'settings.manage' },
      ],
    },
  ];

  const visibleSections = navSections.filter((sec) =>
    sec.items.some((item) => checkPermission(user, item.permission))
  );

  return (
    <aside
      className={cn(
        'bg-white dark:bg-slate-900 border-e border-slate-200 dark:border-slate-800 transition-all duration-200 flex flex-col shrink-0 select-none z-30',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Brand Zone */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
        {!collapsed && (
          <Link to="/dashboard" className="min-w-0 overflow-hidden">
            <JoyLogo size="md" showSlogan={true} />
          </Link>
        )}
        {collapsed && (
          <div className="w-full flex justify-center">
            <Link to="/dashboard">
              <JoyLogo size="sm" showSlogan={false} />
            </Link>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors',
            collapsed && 'hidden'
          )}
          title="طي القائمة"
        >
          {collapsed ? <ChevronRight className="w-4 h-4 rtl:rotate-180" /> : <ChevronLeft className="w-4 h-4 rtl:rotate-180" />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {visibleSections.map((sec, idx) => (
          <div key={idx} className="space-y-1">
            {!collapsed && (
              <div className="px-3 pb-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {sec.title}
              </div>
            )}
            {sec.items.map((item) => (
              <SidebarNavItem key={item.path} {...item} collapsed={collapsed} />
            ))}
          </div>
        ))}
      </div>

      {/* Expand Button when collapsed */}
      {collapsed && (
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex justify-center">
          <button
            onClick={() => setCollapsed(false)}
            className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
            title="توسيع القائمة"
          >
            <ChevronRight className="w-4 h-4 rtl:rotate-180" />
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
