import { useState, type FormEvent } from 'react';
import { atualizarPerfil } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import type { Usuario } from '../types';

interface Props {
  usuario: Usuario;
  onFechar: () => void;
}

// Edita nome e e-mail. CPF e data de nascimento ficam bloqueados (verificação de maioridade).
export default function EditarPerfilForm({ usuario, onFechar }: Props) {
  const { atualizarUsuario } = useAuth();
  const [nome, setNome] = useState(usuario.nome);
  const [email, setEmail] = useState(usuario.email);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  const trocouEmail = email.trim().toLowerCase() !== usuario.email.toLowerCase();

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setErro('');
    if (trocouEmail && !senhaAtual) { setErro('Para alterar o e-mail, informe sua senha atual.'); return; }

    setEnviando(true);
    try {
      const atualizado = await atualizarPerfil({
        nome,
        email: email.trim(),
        ...(trocouEmail ? { senhaAtual } : {}),
      });
      atualizarUsuario(atualizado);
      onFechar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível salvar.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="card p-6 space-y-4">
      <h2 className="font-serif text-xl">Editar perfil</h2>

      <div>
        <label className="field-label" htmlFor="perfil-nome">Nome completo</label>
        <input id="perfil-nome" className="input" required minLength={3} maxLength={100} value={nome} onChange={(e) => setNome(e.target.value)} />
      </div>
      <div>
        <label className="field-label" htmlFor="perfil-email">E-mail</label>
        <input id="perfil-email" type="email" className="input" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <p className="text-xs text-muted mt-1">É o e-mail que você usa para entrar.</p>
      </div>
      {trocouEmail && (
        <div>
          <label className="field-label" htmlFor="perfil-senha-atual">Senha atual (para confirmar a troca do e-mail)</label>
          <input id="perfil-senha-atual" type="password" className="input" autoComplete="current-password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} />
        </div>
      )}
      <p className="text-xs text-muted">
        CPF e data de nascimento não podem ser alterados aqui, pois são usados para confirmar a maioridade.
        Para corrigi-los, fale com a adega.
      </p>

      {erro && <p className="text-danger text-sm">{erro}</p>}

      <div className="flex gap-3">
        <button type="submit" className="btn-primary" disabled={enviando}>{enviando ? 'Salvando...' : 'Salvar alterações'}</button>
        <button type="button" className="btn-outline" onClick={onFechar}>Cancelar</button>
      </div>
    </form>
  );
}
