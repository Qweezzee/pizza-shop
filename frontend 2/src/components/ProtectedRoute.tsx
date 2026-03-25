import type { ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children, adminOnly = false }: { children: ReactElement; adminOnly?: boolean }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="empty-state">Загрузка...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (adminOnly && user.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return children;
}
