import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';

import Home from './pages/Home';
import Catalogo from './pages/Catalogo';
import ProdutoPage from './pages/Produto';
import Reservas from './pages/Reservas';
import Cadastro from './pages/Cadastro';
import Login from './pages/Login';
import Perfil from './pages/Perfil';

import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Estoque from './pages/admin/Estoque';
import NovoProduto from './pages/admin/NovoProduto';
import ReservasAdmin from './pages/admin/ReservasAdmin';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/produto/:id" element={<ProdutoPage />} />
          <Route path="/reservas" element={<Reservas />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/perfil" element={<Perfil />} />
          </Route>

          <Route path="/admin" element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="estoque" element={<Estoque />} />
              <Route path="novo-produto" element={<NovoProduto />} />
              <Route path="reservas" element={<ReservasAdmin />} />
            </Route>
          </Route>

          <Route path="*" element={<p className="container-page py-24 text-center text-muted">Página não encontrada.</p>} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
