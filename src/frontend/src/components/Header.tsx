import { NavLink, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm transition-colors ${isActive ? 'text-gold' : 'text-ink hover:text-gold'}`;

export default function Header() {
  const { usuario } = useAuth();
  const { contagem } = useCart();
  const location = useLocation();
  const naTelaDeLogin = location.pathname === '/login';

  return (
    <header className="border-b border-border">
      <div className="container-page h-16 flex items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="w-9 h-9 rounded-full bg-wine flex items-center justify-center font-serif text-lg text-gold-soft">R</span>
          <span>
            <span className="block font-serif text-lg leading-none">Adega do Rei</span>
            <span className="block text-[10px] tracking-wide text-muted leading-none mt-1">Bebidas Premium</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <NavLink to="/" end className={linkClass}>Início</NavLink>
          <NavLink to="/catalogo" className={linkClass}>Catálogo</NavLink>
          <NavLink to="/reservas" className={linkClass}>Reservas</NavLink>
          {usuario?.role === 'admin' && (
            <NavLink to="/admin" className={linkClass}>Painel Gestão</NavLink>
          )}
        </nav>

        <div className="flex items-center gap-4">
          <Link to="/reservas" className="relative" aria-label="Minha Adega (carrinho de reserva)">
            🛒
            {contagem > 0 && (
              <span className="absolute -top-2 -right-2 bg-wine text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {contagem}
              </span>
            )}
          </Link>
          {usuario ? (
            <Link to="/perfil" className="text-sm hover:text-gold">{usuario.nome.split(' ')[0]}</Link>
          ) : naTelaDeLogin ? (
            <Link to="/cadastro" className="btn-outline text-sm">Criar conta</Link>
          ) : (
            <Link to="/login" className="btn-outline text-sm">Entrar</Link>
          )}
        </div>
      </div>
    </header>
  );
}
