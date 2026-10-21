export default function Footer() {
  return (
    <footer className="border-t border-border mt-20">
      <div className="container-page py-12 grid gap-10 md:grid-cols-3 text-sm text-muted">
        <div>
          <p className="font-serif text-lg text-ink mb-2">Adega do Rei</p>
          <p>A curadoria mais prestigiada de bebidas premium — vinhos, whiskies, cervejas artesanais, gins, vodkas e muito mais.</p>
        </div>
        <div>
          <p className="text-ink mb-2">Categorias</p>
          <p>Vinhos Finos</p><p>Whiskies &amp; Single Malts</p><p>Cervejas Artesanais</p><p>Gins, Vodkas &amp; Licores</p>
        </div>
        <div>
          <p className="text-ink mb-2">Contato &amp; Retirada</p>
          <p>Seg. a Dom. — 7h às 23h</p>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} Adega do Rei. Venda proibida para menores de 18 anos.
      </div>
    </footer>
  );
}
