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
      { path: 'products', element: <ProductsAllPage /> },
      { path: 'products/new', element: <ProductsNewPage /> },
      { path: 'products/best', element: <ProductsBestPage /> },
      { path: 'products/sale', element: <ProductsSalePage /> },
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
    ],
  },
])
