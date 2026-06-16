import { Outlet } from 'react-router-dom'
import { ChatWidget } from '../components/chat'
import { Footer, Header } from '../components/layout'

export function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <ChatWidget />
    </div>
  )
}
