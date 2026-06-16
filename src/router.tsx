import { createBrowserRouter } from 'react-router-dom'
import { MainLayout } from './layouts/MainLayout'
import { Home } from './pages/Home'
import {
  MenBottomsPage,
  MenMiscPage,
  MenPage,
  MenShoesPage,
  MenTopsPage,
} from './pages/men/MenPages'
import { NotFoundPage } from './pages/NotFoundPage'
import { ProductDetailPage } from './pages/products/ProductDetailPage'
import {
  ProductsAllPage,
  ProductsBestPage,
  ProductsNewPage,
  ProductsSalePage,
} from './pages/products/ProductsPages'
import { CartPage, LivePage, LoginPage, NoticesPage } from './pages/ServicePages'
import {
  WomenBottomsPage,
  WomenDressesPage,
  WomenMiscPage,
  WomenPage,
  WomenShoesPage,
  WomenTopsPage,
} from './pages/women/WomenPages'

export const router = createBrowserRouter([
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
          { path: ':slug', element: <ProductDetailPage /> },
        ],
      },
      { path: 'women', element: <WomenPage /> },
      { path: 'women/tops', element: <WomenTopsPage /> },
      { path: 'women/bottoms', element: <WomenBottomsPage /> },
      { path: 'women/dresses', element: <WomenDressesPage /> },
      { path: 'women/shoes', element: <WomenShoesPage /> },
      { path: 'women/misc', element: <WomenMiscPage /> },
      { path: 'men', element: <MenPage /> },
      { path: 'men/tops', element: <MenTopsPage /> },
      { path: 'men/bottoms', element: <MenBottomsPage /> },
      { path: 'men/shoes', element: <MenShoesPage /> },
      { path: 'men/misc', element: <MenMiscPage /> },
      { path: 'live', element: <LivePage /> },
      { path: 'cart', element: <CartPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'notices', element: <NoticesPage /> },
      { path: '404', element: <NotFoundPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
