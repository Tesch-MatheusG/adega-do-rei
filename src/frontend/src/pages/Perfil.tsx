import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { formatarData } from '../lib/format';
import EditarPerfilForm from '../components/EditarPerfilForm';
import AlterarSenhaForm from '../components/AlterarSenhaForm';

export default function Perfil() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [modo, setModo] = useState<'ver' | 'editar' | 'senha'>('ver');

  if (!usuario) return null;

  return (
    <div className="container-page py-10 max-w-2xl">
      <h1 className="font-serif text-3xl mb-1">{usuario.nome}</h1>
      <p className="text-muted mb-8">{usuario.email}</p>

      {modo === 'editar' && <EditarPerfilForm usuario={usuario} onFechar={() => setModo('ver')} />}
      {modo === 'senha' && <AlterarSenhaForm onFechar={() => setModo('ver')} />}

      {modo === 'ver' && (
        <>
          <div className="card p-6 space-y-3">
            <p><span className="text-muted">E-mail:</span> {usuario.email}</p>
            {usuario.cpf && <p><span className="text-muted">CPF:</span> {usuario.cpf}</p>}
            {usuario.dataNascimento && <p><span className="text-muted">Nascimento:</span> {formatarData(usuario.dataNascimento)}</p>}
            <p><span className="text-muted">Perfil:</span> {usuario.role === 'admin' ? 'Administrador' : 'Cliente'}</p>
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            <button className="btn-primary" onClick={() => setModo('editar')}>Editar perfil</button>
            <button className="btn-outline" onClick={() => setModo('senha')}>Alterar senha</button>
            {usuario.role === 'cliente' && <Link to="/minhas-reservas" className="btn-outline">Minhas reservas</Link>}
            <button className="btn-outline" onClick={() => { logout(); navigate('/'); }}>Sair da conta</button>
          </div>
        </>
      )}
    </div>
  );
}
