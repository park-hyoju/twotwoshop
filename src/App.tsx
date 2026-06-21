import { RouterProvider } from 'react-router-dom'
import { AdminAuthProvider } from './contexts/AdminAuthProvider'
import { router } from './router'

function App() {
  return (
    <AdminAuthProvider>
      <RouterProvider router={router} />
    </AdminAuthProvider>
  )
}

export default App
