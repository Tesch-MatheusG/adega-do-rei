import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [lembrar, setLembrar] = useState(false);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      await login(email, senha);
      const destino = (location.state as { from?: Location })?.from?.pathname ?? '/';
      navigate(destino, { replace: true });
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível entrar.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="container-page py-10">
      <div className="card grid md:grid-cols-2 overflow-hidden">
        {/* Lado esquerdo: imagem com frase de efeito, como no protótipo */}
        <div className="relative hidden md:block min-h-[560px]">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "linear-gradient(0deg, rgba(8,6,6,0.75), rgba(8,6,6,0.35)), url('https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1200&auto=format&fit=crop')" }}
          />
          <div className="relative h-full flex items-end p-10">
            <div>
              <h2 className="font-serif text-3xl leading-snug mb-2">
                Sua adega particular, sempre à sua espera.
              </h2>
              <p className="text-ink/80 text-sm max-w-xs">
                Entre para acompanhar suas reservas, rever favoritos e descobrir seleções
                escolhidas com nobreza e precisão.
              </p>
            </div>
          </div>
        </div>

        {/* Lado direito: formulário */}
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <p className="text-gold text-xs uppercase tracking-wide mb-2">Bem-vindo de volta</p>
          <h1 className="font-serif text-3xl mb-1">Acesse sua conta</h1>
          <p className="text-muted text-sm mb-8">Use seus dados para entrar no universo Adega do Rei.</p>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="field-label" htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="seuemail@exemplo.com.br"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="field-label" htmlFor="senha">Senha</label>
              <div className="relative">
                <input
                  id="senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Digite sua senha"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink text-sm"
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {mostrarSenha ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-muted">
                <input type="checkbox" checked={lembrar} onChange={(e) => setLembrar(e.target.checked)} />
                Lembrar de mim
              </label>
              <a href="#" className="text-gold hover:underline">Esqueceu sua senha?</a>
            </div>

            {erro && <p className="text-danger text-sm">{erro}</p>}

            <button type="submit" disabled={enviando} className="btn-primary btn-block">
              {enviando ? 'Entrando...' : 'Entrar'}
            </button>

            <p className="text-sm text-muted text-center">
              Ainda não faz parte da Adega?{' '}
              <Link to="/cadastro" className="text-gold hover:underline">Criar uma conta</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
