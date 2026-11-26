import { Link } from 'react-router-dom';
import ImagemOpcional from '../components/ImagemOpcional';
import { IMAGENS } from '../lib/imagens';

const categorias = Object.entries(IMAGENS.categorias).map(([nome, imagem]) => ({ nome, imagem }));

export default function Home() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-border">
        {/* Foto de fundo, encostada à direita. Se o arquivo não existir, a seção fica só preta. */}
        <ImagemOpcional
          src={IMAGENS.hero}
          alt=""
          fetchPriority="high"
          className="absolute inset-y-0 right-0 h-full w-full md:w-[75%] object-cover object-center"
        />
        {/* Celular: o texto ocupa a largura toda, então escurecemos a foto inteira */}
        <div className="absolute inset-0 bg-bg/75 md:hidden" />
        {/* Computador: fundo preto sólido atrás do texto, que vai desaparecendo (fade) até revelar a foto */}
        <div className="absolute inset-0 hidden md:block bg-gradient-to-r from-bg from-30% via-bg/85 via-50% to-transparent" />

        <div className="container-page relative py-24 md:py-32">
          <div className="max-w-xl">
            <h1 className="font-serif text-5xl leading-tight mb-5">Onde cada garrafa conta uma história</h1>
            <p className="text-muted mb-8">
              Vinhos, whiskies, cervejas, gins e muito mais. O reino das melhores bebidas, para atender
              o gosto da realeza.
            </p>
            <Link to="/catalogo" className="btn-primary">Explorar Bebidas</Link>
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <h2 className="font-serif text-3xl text-center mb-2">Seleção por Categoria</h2>
        <p className="text-muted text-center mb-10">Selecione o estilo perfeito para cada momento e celebração</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categorias.map((c) => (
            <Link key={c.nome} to="/catalogo" className="card group relative aspect-square flex items-end p-4 hover:border-gold transition-colors">
              <ImagemOpcional
                src={c.imagem}
                alt=""
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* Degradê de baixo para cima para o nome continuar legível sobre qualquer foto */}
              <div className="absolute inset-0 bg-gradient-to-t from-bg/90 via-bg/20 to-transparent" />
              <span className="relative font-serif text-lg">{c.nome}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
