import { Link } from 'react-router-dom';

const categorias = ['Vinhos', 'Cervejas', 'Whiskies', 'Gins & Vodkas'];

export default function Home() {
  return (
    <div>
      <section className="border-b border-border">
        <div className="container-page py-24 max-w-2xl">
          <p className="text-gold text-sm mb-3">Adega premium de bebidas raras</p>
          <h1 className="font-serif text-5xl leading-tight mb-5">Onde cada garrafa conta a história</h1>
          <p className="text-muted mb-8">
            Vinhos, whiskies, cervejas artesanais, gins e muito mais. Curadoria de bebidas premium de
            todos os cantos do mundo, guardadas em condições perfeitas para elevar qualquer ocasião.
          </p>
          <Link to="/catalogo" className="btn-primary">Explorar Bebidas</Link>
        </div>
      </section>

      <section className="container-page py-16">
        <h2 className="font-serif text-3xl text-center mb-2">Seleção por Categoria</h2>
        <p className="text-muted text-center mb-10">Selecione o estilo perfeito para cada momento e celebração</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categorias.map((c) => (
            <Link key={c} to="/catalogo" className="card aspect-square flex items-end p-4 hover:border-gold transition-colors">
              <span className="font-serif text-lg">{c}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
