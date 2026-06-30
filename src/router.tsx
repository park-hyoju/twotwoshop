import { Navigate, createBrowserRouter } from 'react-router-dom'
import { AdminAuthGate } from './components/admin/AdminAuthGate'
import { AdminGuestOnly } from './components/admin/AdminGuestOnly'
import { CustomerAuthGate } from './components/customer/CustomerAuthGate'
import { CustomerGuestOnly } from './components/customer/CustomerGuestOnly'
import { MainLayout } from './layouts/MainLayout'
import { AdminLayout } from './layouts/AdminLayout'
import {
  AdminBannersPage,
  AdminChatPage,
  AdminCustomersPage,
  AdminDashboardPage,
  AdminLivePage,
  AdminLoginPage,
  AdminNoticesPage,
  AdminOrdersPage,
  AdminProductsPage,
  AdminRestockNotificationsPage,
  AdminSettingsPage,
} from './pages/admin'
import { Home } from './pages/Home'
import { NotFoundPage } from './pages/NotFoundPage'
import { ProductDetailPage } from './pages/products/ProductDetailPage'
import {
  ProductsAllPage,
  ProductsBestPage,
  ProductsNewPage,
  ProductsSalePage,
} from './pages/products/ProductsPages'
import { CartPage, LivePage } from './pages/ServicePages'
import {
  MyAddressesPage,
  MyInquiriesPage,
  MyInquiryDetailPage,
  MyNotificationsPage,
  MyOrderDetailPage,
  MyOrdersPage,
  MyPage,
  MyProfileEditPage,
  MyRecentProductsPage,
} from './pages/mypage'
import { SignInPage, SignUpPage, ForgotPasswordPage, ResetPasswordPage } from './pages/auth'
import { NoticesListPage, NoticeDetailPage } from './pages/notices/NoticesPages'
import { PrivacyPage } from './pages/legal/PrivacyPage'
import { TermsPage } from './pages/legal/TermsPage'
import { CheckoutPage } from './pages/checkout/CheckoutPage'
import { OrderCompletePage } from './pages/order/OrderCompletePage'
import { ROUTES } from './lib/routes'
import {
  buildProductsNestedCategoryRoutes,
  buildRootCategoryRoutes,
} from './routing/storefrontCategoryRoutes'

export const router = createBrowserRouter([
  {
    path: '/admin/login',
    element: <AdminGuestOnly />,
    children: [{ index: true, element: <AdminLoginPage /> }],
  },
  {
    path: '/admin',
    element: <AdminAuthGate />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: 'dashboard', element: <AdminDashboardPage /> },
          { path: 'orders', element: <AdminOrdersPage /> },
          { path: 'products', element: <AdminProductsPage /> },
          { path: 'banners', element: <AdminBannersPage /> },
          { path: 'notices', element: <AdminNoticesPage /> },
          { path: 'restock-notifications', element: <AdminRestockNotificationsPage /> },
          { path: 'customers', element: <AdminCustomersPage /> },
          { path: 'live', element: <AdminLivePage /> },
          { path: 'chat', element: <AdminChatPage /> },
          { path: 'settings', element: <AdminSettingsPage /> },
        ],
      },
    ],
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Home /> },
      {
        path: 'products',
        children: [
          { index: true, element: <ProductsAllPage /> },
          { path: 'new', element: <ProductsNewPage /> },
          { path: 'best', element: <ProductsBestPage /> },
          { path: 'sale', element: <ProductsSalePage /> },
          ...buildProductsNestedCategoryRoutes(),
          { path: ':slug', element: <ProductDetailPage /> },
        ],
      },
      ...buildRootCategoryRoutes(),
      { path: 'live', element: <LivePage /> },
      { path: 'cart', element: <CartPage /> },
      { path: 'checkout', element: <CheckoutPage /> },
      { path: 'order-complete', element: <OrderCompletePage /> },
      {
        path: 'signin',
        element: <CustomerGuestOnly />,
        children: [{ index: true, element: <SignInPage /> }],
      },
      {
        path: 'signup',
        element: <CustomerGuestOnly />,
        children: [{ index: true, element: <SignUpPage /> }],
      },
      {
        path: 'forgot-password',
        element: <CustomerGuestOnly />,
        children: [{ index: true, element: <ForgotPasswordPage /> }],
      },
      { path: 'reset-password', element: <ResetPasswordPage /> },
      {
        path: 'mypage',
        element: <CustomerAuthGate />,
        children: [
          { index: true, element: <MyPage /> },
          { path: 'orders', element: <MyOrdersPage /> },
          { path: 'orders/:orderId', element: <MyOrderDetailPage /> },
          { path: 'addresses', element: <MyAddressesPage /> },
          { path: 'inquiries', element: <MyInquiriesPage /> },
          { path: 'inquiries/:inquiryId', element: <MyInquiryDetailPage /> },
          { path: 'profile', element: <MyProfileEditPage /> },
          { path: 'notifications', element: <MyNotificationsPage /> },
          { path: 'recent', element: <MyRecentProductsPage /> },
        ],
      },
      { path: 'login', element: <Navigate to={ROUTES.signin} replace /> },
      { path: 'notices', element: <NoticesListPage /> },
      { path: 'notices/:id', element: <NoticeDetailPage /> },
      { path: 'terms', element: <TermsPage /> },
      { path: 'privacy', element: <PrivacyPage /> },
      { path: '404', element: <NotFoundPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
