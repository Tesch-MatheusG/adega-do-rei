import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../services/authService';

export default function Cadastro() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nome: '', dataNascimento: '', cpf: '', email: '', senha: '', senha2: '', maior18: false });
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  function campo<K extends keyof typeof form>(chave: K, valor: typeof form[K]) {
    setForm((f) => ({ ...f, [chave]: valor }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro('');

    if (form.senha !== form.senha2) { setErro('As senhas não coincidem.'); return; }
    if (!form.maior18) { setErro('É necessário declarar que é maior de 18 anos.'); return; }

    setEnviando(true);
    try {
      await register({
        nome: form.nome,
        email: form.email,
        cpf: form.cpf,
        dataNascimento: form.dataNascimento, // input type="date" envia AAAA-MM-DD
        senha: form.senha,
      });
      navigate('/login', { state: { cadastroOk: true } });
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível criar a conta.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="container-page py-14 max-w-md">
      <p className="text-gold text-sm">Adega do Rei • Portal do Cliente</p>
      <h1 className="font-serif text-3xl mb-8">Criar Sua Conta</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="field-label" htmlFor="nome">Nome Completo</label>
          <input id="nome" className="input" required value={form.nome} onChange={(e) => campo('nome', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="field-label" htmlFor="nasc">Data de Nascimento</label>
            <input id="nasc" type="date" className="input" required value={form.dataNascimento} onChange={(e) => campo('dataNascimento', e.target.value)} />
          </div>
          <div>
            <label className="field-label" htmlFor="cpf">CPF</label>
            <input id="cpf" className="input" placeholder="000.000.000-00" required value={form.cpf} onChange={(e) => campo('cpf', e.target.value)} />
          </div>
        </div>
        <div>
          <label className="field-label" htmlFor="email">E-mail de Contato</label>
          <input id="email" type="email" className="input" required value={form.email} onChange={(e) => campo('email', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="field-label" htmlFor="senha">Senha de Acesso</label>
            <input id="senha" type="password" minLength={8} className="input" required value={form.senha} onChange={(e) => campo('senha', e.target.value)} />
          </div>
          <div>
            <label className="field-label" htmlFor="senha2">Confirmar Senha</label>
            <input id="senha2" type="password" className="input" required value={form.senha2} onChange={(e) => campo('senha2', e.target.value)} />
          </div>
        </div>
        <label className="flex items-start gap-2 text-sm text-muted">
          <input type="checkbox" className="mt-1" required checked={form.maior18} onChange={(e) => campo('maior18', e.target.checked)} />
          <span>Declaro que tenho <strong className="text-gold">mais de 18 anos</strong> e concordo com os Termos de Uso e Política de Privacidade da Adega.</span>
        </label>

        {erro && <p className="text-danger text-sm">{erro}</p>}

        <button type="submit" disabled={enviando} className="btn-primary btn-block">
          {enviando ? 'Criando conta...' : 'Criar Minha Conta'}
        </button>

        <p className="text-sm text-muted text-center">
          Já tem conta? <Link to="/login" className="text-gold hover:underline">Entrar</Link>
        </p>
      </form>
    </div>
  );
}
