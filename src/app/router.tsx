import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AdminLayout from '@/src/components/layout/AdminLayout';
import AdminRoute from './guards/AdminRoute';
import GuestRoute from './guards/GuestRoute';
import Forbidden from '@/src/pages/Forbidden';
import NotFoundPage from '@/src/pages/NotFoundPage';
import ComingSoonPage from '@/src/pages/ComingSoonPage';

// Lazy Loaded Pages
const LoginPage = lazy(() => import('@/src/features/auth/LoginPage'));
const DashboardPage = lazy(() => import('@/src/features/dashboard/DashboardPage'));
const ProductsListPage = lazy(() => import('@/src/features/products/ProductsListPage'));
const ProductFormPage = lazy(() => import('@/src/features/products/ProductFormPage'));
const CategoriesPage = lazy(() => import('@/src/features/taxonomy/CategoriesPage'));
const BrandsPage = lazy(() => import('@/src/features/taxonomy/BrandsPage'));
const AgeGroupsPage = lazy(() => import('@/src/features/taxonomy/AgeGroupsPage'));
const InventoryPage = lazy(() => import('@/src/features/inventory/InventoryPage'));
const OrdersListPage = lazy(() => import('@/src/features/orders/OrdersListPage'));
const OrderDetailPage = lazy(() => import('@/src/features/orders/OrderDetailPage'));
const ManualOrderPage = lazy(() => import('@/src/features/orders/ManualOrderPage'));
const ReturnsPage = lazy(() => import('@/src/features/returns/ReturnsPage'));
const CouponsPage = lazy(() => import('@/src/features/promotions/CouponsPage'));
const FlashSalesPage = lazy(() => import('@/src/features/promotions/FlashSalesPage'));
const ShippingZonesPage = lazy(() => import('@/src/features/shipping/ShippingZonesPage'));
const ShippingMethodsPage = lazy(() => import('@/src/features/shipping/ShippingMethodsPage'));
const PaymentGatewaysPage = lazy(() => import('@/src/features/payments/PaymentGatewaysPage'));
const TransactionsPage = lazy(() => import('@/src/features/payments/TransactionsPage'));
const ReviewsPage = lazy(() => import('@/src/features/reviews/ReviewsPage'));
const TicketsPage = lazy(() => import('@/src/features/tickets/TicketsPage'));
const UsersListPage = lazy(() => import('@/src/features/users/UsersListPage'));
const EmployeesPage = lazy(() => import('@/src/features/employees/EmployeesPage'));
const RolesPage = lazy(() => import('@/src/features/roles/RolesPage'));
const BannersPage = lazy(() => import('@/src/features/cms/BannersPage'));
const StaticPagesPage = lazy(() => import('@/src/features/cms/StaticPagesPage'));
const FaqsPage = lazy(() => import('@/src/features/cms/FaqsPage'));
const ReportsPage = lazy(() => import('@/src/features/reports/ReportsPage'));
const SettingsPage = lazy(() => import('@/src/features/settings/SettingsPage'));
const ProfilePage = lazy(() => import('@/src/features/profile/ProfilePage'));
const NotificationsPage = lazy(() => import('@/src/features/notifications/NotificationsPage'));
const ActivityLogPage = lazy(() => import('@/src/features/activity/ActivityLogPage'));

export const router = createBrowserRouter([
  // Guest Routes (e.g. Admin Login)
  {
    element: <GuestRoute />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
    ],
  },

  // Protected Admin Routes (Strict role === 'admin')
  {
    element: <AdminRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          {
            path: '/',
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: '/dashboard',
            element: <DashboardPage />,
          },
          // Catalog
          {
            path: '/products',
            element: <ProductsListPage />,
          },
          {
            path: '/products/create',
            element: <ProductFormPage />,
          },
          {
            path: '/products/:id/edit',
            element: <ProductFormPage />,
          },
          {
            path: '/categories',
            element: <CategoriesPage />,
          },
          {
            path: '/brands',
            element: <BrandsPage />,
          },
          {
            path: '/age-groups',
            element: <AgeGroupsPage />,
          },
          // /tags — backend endpoint not available
          {
            path: '/tags',
            element: <ComingSoonPage />,
          },
          {
            path: '/inventory',
            element: <InventoryPage />,
          },
          // Sales & Orders
          {
            path: '/orders',
            element: <OrdersListPage />,
          },
          {
            path: '/orders/create',
            element: <ManualOrderPage />,
          },
          {
            path: '/orders/:id',
            element: <OrderDetailPage />,
          },
          {
            path: '/returns',
            element: <ReturnsPage />,
          },
          {
            path: '/coupons',
            element: <CouponsPage />,
          },
          {
            path: '/flash-sales',
            element: <FlashSalesPage />,
          },
          {
            path: '/shipping/zones',
            element: <ShippingZonesPage />,
          },
          {
            path: '/shipping/methods',
            element: <ShippingMethodsPage />,
          },
          {
            path: '/payments/gateways',
            element: <PaymentGatewaysPage />,
          },
          {
            path: '/payments/transactions',
            element: <TransactionsPage />,
          },
          // Customers & Support
          {
            path: '/reviews',
            element: <ReviewsPage />,
          },
          {
            path: '/tickets',
            element: <TicketsPage />,
          },
          {
            path: '/users',
            element: <UsersListPage />,
          },
          // Administration
          {
            path: '/employees',
            element: <EmployeesPage />,
          },
          {
            path: '/roles',
            element: <RolesPage />,
          },
          {
            path: '/cms/banners',
            element: <BannersPage />,
          },
          {
            path: '/cms/pages',
            element: <StaticPagesPage />,
          },
          {
            path: '/cms/faqs',
            element: <FaqsPage />,
          },
          // /cms/contact-messages — backend endpoint not available
          {
            path: '/cms/contact-messages',
            element: <ComingSoonPage />,
          },
          // /notifications
          {
            path: '/notifications',
            element: <NotificationsPage />,
          },
          {
            path: '/reports',
            element: <ReportsPage />,
          },
          // /activity-log
          {
            path: '/activity-log',
            element: <ActivityLogPage />,
          },
          {
            path: '/settings',
            element: <SettingsPage />,
          },
          {
            path: '/profile',
            element: <ProfilePage />,
          },
        ],
      },
    ],
  },

  // Error Pages
  {
    path: '/forbidden',
    element: <Forbidden />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export default router;
