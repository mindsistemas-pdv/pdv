import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { CashRegisterProvider } from './contexts/CashRegisterContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import MainLayout from './layouts/MainLayout'
import PDVPage from './pages/PDVPage'
import ProductsPage from './pages/ProductsPage'
import CashRegisterPage from './pages/CashRegisterPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CashRegisterProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/pdv" replace />} />
              <Route path="pdv" element={<PDVPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="cash-register" element={<CashRegisterPage />} />
            </Route>
          </Routes>
        </CashRegisterProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
