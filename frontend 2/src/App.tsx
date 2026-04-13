import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { AdminPage } from './pages/AdminPage';
import { AuthPage } from './pages/AuthPage';
import { CartPage } from './pages/CartPage';
import { HomePage } from './pages/HomePage';
import { OrdersPage } from './pages/OrdersPage';
import { SupportPage } from './pages/SupportPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="auth" element={<AuthPage />} />
              <Route path="cart" element={<CartPage />} />
              <Route
                path="orders"
                element={
                  <ProtectedRoute>
                    <OrdersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="support"
                element={
                  <ProtectedRoute>
                    <SupportPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminPage />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
