// Esta página ainda é um placeholder: o backend de Reservas (tabela + rotas
// /api/reservas) é o próximo passo do PI, descrito no backlog (Épico 3).
// Quando essa API existir, troque o array abaixo por uma chamada a ela.
export default function ReservasAdmin() {
  return (
    <div>
      <h1 className="font-serif text-2xl mb-6">Pedidos / Reservas</h1>
      <div className="card p-8 text-center text-muted">
        <p className="mb-1">Ainda não há reservas para gerenciar.</p>
        <p className="text-sm">Esta tela será conectada à API de Reservas na próxima etapa do projeto.</p>
      </div>
    </div>
  );
}
