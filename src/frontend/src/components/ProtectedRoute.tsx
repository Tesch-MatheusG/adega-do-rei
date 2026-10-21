import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Exige apenas estar logado (qualquer papel).
export function ProtectedRoute() {
  const { usuario, carregando } = useAuth();
  const location = useLocation();

  if (carregando) return null; // evita "flash" de redirecionamento enquanto valida o token
  if (!usuario) return <Navigate to="/login" state={{ from: location }} replace />;
  return <Outlet />;
}

// Exige estar logado E ter papel "admin". Reforça no front o que o backend já bloqueia.
export function AdminRoute() {
  const { usuario, carregando } = useAuth();

  if (carregando) return null;
  if (!usuario) return <Navigate to="/login" replace />;
  if (usuario.role !== 'admin') return <Navigate to="/" replace />;
  return <Outlet />;
}
