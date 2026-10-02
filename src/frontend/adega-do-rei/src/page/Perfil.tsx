import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Perfil() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  if (!usuario) return null;

  return (
    <div className="container-page py-10 max-w-2xl">
      <h1 className="font-serif text-3xl mb-1">{usuario.nome}</h1>
      <p className="text-muted mb-8">{usuario.email}</p>

      <div className="card p-6 space-y-3">
        <p><span className="text-muted">E-mail:</span> {usuario.email}</p>
        {usuario.cpf && <p><span className="text-muted">CPF:</span> {usuario.cpf}</p>}
        {usuario.dataNascimento && <p><span className="text-muted">Nascimento:</span> {usuario.dataNascimento}</p>}
        <p><span className="text-muted">Perfil:</span> {usuario.role === 'admin' ? 'Administrador' : 'Cliente'}</p>
      </div>

      <button className="btn-outline mt-6" onClick={() => { logout(); navigate('/'); }}>Sair da conta</button>
    </div>
  );
}
