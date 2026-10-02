# Adega do Rei — Frontend

Projeto Integrado — Desenvolvimento de Interfaces de Usuário para Web

## Equipe

- Thiago Mafra Doningues — [25000115]
- Matheus Gabriel de Melo Tesch — [25001921]

## Descrição

Interface web de reservas e gestão para a **Adega do Rei**, comércio local de bebidas
alcoólicas. A aplicação permite que clientes consultem o catálogo e reservem produtos
para retirada, e que o administrador (dono do estabelecimento) gerencie produtos e
estoque por um painel próprio.

Nesta etapa da entrega, a aplicação roda **sem depender de um backend**: todos os
dados vêm de uma camada de simulação (`src/services/`), que será substituída por
chamadas reais à API REST (Node/Express/MySQL, já em desenvolvimento em paralelo)
numa fase posterior do projeto.

## Tecnologias utilizadas

- React 19 + TypeScript
- Vite
- Tailwind CSS
- React Router DOM

## Como instalar e rodar localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173`. Não é necessário configurar `.env` nem subir nenhum
backend — a aplicação já funciona sozinha com dados simulados.

### Contas de teste (login)

| Perfil | E-mail | Senha |
|---|---|---|
| Cliente | cliente@teste.com | Senha123 |
| Administrador | admin@adegadorei.com | Admin@1234 |

Também é possível criar uma conta nova pela tela de Cadastro — ela fica salva no
`localStorage` do navegador enquanto não há backend.

## Estrutura do projeto

```
src/
├── components/      # Header, Footer, ProductCard, AdminSidebar, rotas protegidas
├── context/         # AuthContext (login), CartContext (carrinho/reserva)
├── services/        # Camada de dados simulados (mockDb, produtosService, authService)
├── lib/             # format.ts (preço em R$), cpf.ts (validação de CPF)
├── pages/           # Páginas do cliente (Home, Catálogo, Produto, Reservas, Login, Cadastro, Perfil)
├── pages/admin/     # Painel administrativo (Dashboard, Estoque, Novo Produto)
└── types/           # Tipos compartilhados (Produto, Usuario)
```

### Componentização e reutilização

- `ProductCard` recebe um `produto` via props e é reaproveitado no Catálogo, na página
  de Produto (seção "relacionados") e poderia ser usado em qualquer outra listagem.
- `Header`, `Footer` e `AdminSidebar` são usados em todas as páginas, evitando repetir
  a navegação em cada tela.
- `ProtectedRoute` e `AdminRoute` encapsulam a lógica de controle de acesso por rota,
  reutilizada em `/perfil` e em todas as rotas `/admin/*`.

### Interações já implementadas

- Seletor de quantidade, cálculo de total e remoção de itens no carrinho de reserva.
- Exibição condicional: produto esgotado desabilita o botão de reserva; alerta visual
  de estoque baixo no painel admin; mensagens de erro de formulário.
- Mostrar/ocultar senha na tela de login.

## Sobre os dados simulados (`src/services/`)

Para esta entrega, a atividade não exige integração com API REST — por isso toda a
"persistência" acontece em `src/services/mockDb.ts`, que guarda os dados no
`localStorage` do navegador (produtos e usuários de exemplo já vêm pré-cadastrados).
Os arquivos `produtosService.ts` e `authService.ts` expõem funções assíncronas
(`listarProdutos`, `login`, `registrarEntradaEstoque`, etc.) com a mesma assinatura
que as chamadas à API real terão — a ideia é que, na próxima fase, baste trocar o
conteúdo dessas duas funções para `fetch`/`axios` reais, sem precisar alterar nenhuma
página ou componente.

## Paleta e tipografia

Definidas em `tailwind.config.js` (`wine`, `gold`, `bg`, `surface`...) e nas fontes
`Cormorant Garamond` (títulos) e `Sora` (texto), carregadas em `index.html` —
seguindo o protótipo desenvolvido no Figma: https://www.figma.com/design/npP3g7CpN1qqvweMNU4Z6O/Adega-do-Rei-Website?node-id=0-1&t=ifOsVVZm7LxXZskb-1.
