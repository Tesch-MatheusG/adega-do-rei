import { useState, type FormEvent } from 'react';
import { alterarSenha } from '../services/authService';

export default function AlterarSenhaForm({ onFechar }: { onFechar: () => void }) {
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setErro('');
    if (novaSenha !== confirmar) { setErro('A confirmação não coincide com a nova senha.'); return; }
    if (novaSenha.length < 8 || !/[A-Za-z]/.test(novaSenha) || !/\d/.test(novaSenha)) {
      setErro('A nova senha deve ter no mínimo 8 caracteres, com ao menos uma letra e um número.');
      return;
    }

    setEnviando(true);
    try {
      await alterarSenha(senhaAtual, novaSenha);
      setOk(true);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível alterar a senha.');
    } finally {
      setEnviando(false);
    }
  }

  if (ok) {
    return (
      <div className="card p-6 space-y-4">
        <p className="text-success">Senha alterada com sucesso.</p>
        <button className="btn-outline" onClick={onFechar}>Fechar</button>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="card p-6 space-y-4">
      <h2 className="font-serif text-xl">Alterar senha</h2>
      <div>
        <label className="field-label" htmlFor="senha-atual">Senha atual</label>
        <input id="senha-atual" type="password" className="input" required autoComplete="current-password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="field-label" htmlFor="nova-senha">Nova senha</label>
          <input id="nova-senha" type="password" minLength={8} className="input" required autoComplete="new-password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} />
        </div>
        <div>
          <label className="field-label" htmlFor="confirmar-senha">Confirmar nova senha</label>
          <input id="confirmar-senha" type="password" className="input" required autoComplete="new-password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} />
        </div>
      </div>
      <p className="text-xs text-muted">Mínimo de 8 caracteres, com ao menos uma letra e um número.</p>

      {erro && <p className="text-danger text-sm">{erro}</p>}

      <div className="flex gap-3">
        <button type="submit" className="btn-primary" disabled={enviando}>{enviando ? 'Salvando...' : 'Alterar senha'}</button>
        <button type="button" className="btn-outline" onClick={onFechar}>Cancelar</button>
      </div>
    </form>
  );
}
