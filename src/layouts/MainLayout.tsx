import { Outlet } from 'react-router-dom'
import { ChatWidget } from '../components/chat'
import { Footer, Header } from '../components/layout'
import { CustomerAuthProvider } from '../contexts/CustomerAuthProvider'
import { CartProvider } from '../hooks/useCart'

export function MainLayout() {
  return (
    <CustomerAuthProvider>
      <CartProvider>
        <div className="flex min-h-screen flex-col bg-white">
          <Header />
          <main className="flex-1">
            <Outlet />
          </main>
          <Footer />
          <ChatWidget />
        </div>
      </CartProvider>
    </CustomerAuthProvider>
  )
}
