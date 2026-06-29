import { RouterProvider } from 'react-router-dom'
import { AppErrorBoundary } from './components/common/AppErrorBoundary'
import { AdminAuthProvider } from './contexts/AdminAuthProvider'
import { router } from './router'

function App() {
  return (
    <AppErrorBoundary>
      <AdminAuthProvider>
        <RouterProvider router={router} />
      </AdminAuthProvider>
    </AppErrorBoundary>
  )
}

export default App
