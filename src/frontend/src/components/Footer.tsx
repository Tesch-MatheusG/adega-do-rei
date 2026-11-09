export default function Footer() {
  return (
    <footer className="border-t border-border mt-20">
      <div className="container-page py-12 grid gap-10 md:grid-cols-3 text-sm text-muted">
        <div>
          <p className="font-serif text-lg text-ink mb-2">Adega do Rei</p>
          <p>Av. Dr. Leonardo guaranha, 187 - Jardim Primavera, Aguaí-SP</p>
        </div>
        <div>
          <p className="text-ink mb-2">Categorias</p>
          <p>Vinhos</p><p>Whiskies</p><p>Cervejas</p><p>Gins, Vodkas &amp; Licores</p><p>Refrigerantes e Energéticos.</p>
        </div>
        <div>
          <p className="text-ink mb-2">Contato &amp; Retirada</p>
          <p>Instagram: _adegadorei</p>
          <p>Seg. a Dom. — 7h às 23h</p>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} Adega do Rei. Venda proibida para menores de 18 anos.
      </div>
    </footer>
  );
}
