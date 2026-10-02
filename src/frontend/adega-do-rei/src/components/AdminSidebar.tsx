import { NavLink } from 'react-router-dom';

const item = ({ isActive }: { isActive: boolean }) =>
  `block px-4 py-2.5 rounded text-sm transition-colors ${
    isActive ? 'bg-wine/20 text-gold' : 'text-muted hover:text-ink'
  }`;

export default function AdminSidebar() {
  return (
    <aside className="w-56 shrink-0 border-r border-border p-4">
      <p className="text-xs text-muted uppercase tracking-wide px-4 mb-2">Painel da Adega</p>
      <nav className="space-y-1">
        <NavLink to="/admin" end className={item}>Dashboard</NavLink>
        <NavLink to="/admin/estoque" className={item}>Controle de Estoque</NavLink>
        <NavLink to="/admin/reservas" className={item}>Pedidos / Reservas</NavLink>
      </nav>
    </aside>
  );
}
