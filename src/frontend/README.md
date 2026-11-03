# Adega do Rei — Frontend

Projeto Integrado — Desenvolvimento de Interfaces de Usuário para Web

## Equipe

- Thiago Mafra Doningues — [25000115]
- Matheus Gabriel de Melo Tesch — [25001921]

## Descrição

Interface web de reservas e gestão para a **Adega do Rei**, comércio local de bebidas
alcoólicas. Clientes consultam o catálogo, reservam produtos para retirada e acompanham
suas reservas; o administrador (dono) gerencia produtos, estoque e reservas por um painel próprio.

A aplicação consome a API REST do backend (`../backend`, Node/Express + MySQL) através de
`src/services/`.

## Tecnologias utilizadas

- React 19 + TypeScript
- Vite
- Tailwind CSS
- React Router DOM
- Axios

## Como instalar e rodar localmente

O backend precisa estar rodando (ver o README em `../backend`) ou você pode apontar para a
API publicada.

```bash
npm install
cp .env.example .env   # VITE_API_URL: http://localhost:3000/api (local) ou a URL da API na nuvem
npm run dev
```

Acesse `http://localhost:5173`.

### Contas de teste (login)

| Perfil | Como obter |
|---|---|
| Administrador | e-mail/senha definidos em `ADMIN_EMAIL`/`ADMIN_SENHA` no `.env` do backend (criado com `npm run seed:admin`) |
| Cliente | criado pela tela de Cadastro (precisa ser maior de 18 anos e ter CPF válido) |

## Estrutura do projeto

```
src/
├── components/      # Header, Footer, ProductCard, AdminSidebar, rotas protegidas
├── context/         # AuthContext (login/token), CartContext (carrinho antes de confirmar)
├── services/        # Chamadas à API: authService, produtosService, reservasService
├── lib/             # api.ts (cliente axios), format.ts (preço, datas, status), cpf.ts
├── pages/           # Home, Catálogo, Produto, Reservas (carrinho), Minhas Reservas, Login, Cadastro, Perfil
├── pages/admin/     # Dashboard, Estoque, Novo Produto, Reservas
└── types/           # Tipos compartilhados (Produto, Usuario, Reserva)
```

### Componentização e reutilização

- `ProductCard` recebe um `produto` via props e é reaproveitado no Catálogo e na página de Produto.
- `Header`, `Footer` e `AdminSidebar` aparecem em todas as páginas, sem repetir a navegação.
- `ProtectedRoute` e `AdminRoute` controlam o acesso por rota. É só uma camada de UX — a proteção
  de verdade está no backend (`verifyToken` + `isAdmin`).
- `STATUS_RESERVA` (em `lib/format.ts`) é usado pelas telas do cliente e do admin para mostrar
  o status da reserva sempre com o mesmo rótulo e cor.

## Integração com o backend

`src/lib/api.ts` cria o cliente axios (`VITE_API_URL`) e anexa o token JWT a toda requisição
autenticada. Os arquivos de `src/services/` são os únicos que falam HTTP — nenhuma página chama
o axios diretamente, então trocar a URL da API (local, Render) não exige mexer em telas.

### Fluxo de reservas

1. O cliente monta o carrinho (salvo no navegador) e, em **Minha Adega**, escolhe opcionalmente
   quando vai retirar.
2. Ao confirmar, `POST /api/reservas`: o backend confere maioridade e estoque e já baixa o estoque.
   Sem login, o cliente é levado ao login e volta para o carrinho.
3. Em **Minhas Reservas** o cliente acompanha o status e pode cancelar (o estoque volta).
4. No painel admin, **Pedidos / Reservas** permite marcar como pronta, confirmar a retirada ou cancelar,
   com filtro por status. O Dashboard mostra o número de reservas pendentes.
5. Reservas não retiradas em 24h expiram sozinhas no backend.

### O que ainda não está conectado

- **Fotos dos produtos**: hoje é um placeholder com a inicial do nome.

## Publicação (deploy)

O frontend é um site estático: `npm run build` gera a pasta `dist/`. Em qualquer hospedagem:

1. Defina a variável de ambiente **`VITE_API_URL`** com a URL pública da API, terminando em `/api`
   (ex.: `https://adega-do-rei.onrender.com/api`). Ela é lida **na hora do build**, então depois de
   mudá-la é preciso fazer um novo deploy.
2. Comando de build: `npm run build`. Pasta publicada: `dist`. Diretório raiz do projeto: `src/frontend`.
3. Libere a URL do site no CORS da API: acrescente-a em `CORS_ORIGIN` no Render, separada por vírgula
   da URL local (`http://localhost:5173,https://seu-site.exemplo`).
4. **Redirecionamento de rotas (SPA):** sem ele, dar F5 em `/catalogo` dá "página não encontrada".
   - Netlify / Cloudflare Pages: já resolvido pelo arquivo `public/_redirects`.
   - Vercel: já resolvido pelo `vercel.json`.
   - Render Static Site: em *Redirects/Rewrites* crie uma regra do tipo **Rewrite**, origem `/*`, destino `/index.html`.

## Paleta e tipografia

Definidas em `tailwind.config.js` (`wine`, `gold`, `bg`, `surface`...) e nas fontes
`Cormorant Garamond` (títulos) e `Sora` (texto), carregadas em `index.html` —
seguindo o protótipo desenvolvido no Figma: https://www.figma.com/design/npP3g7CpN1qqvweMNU4Z6O/Adega-do-Rei-Website?node-id=0-1&t=ifOsVVZm7LxXZskb-1.
