# Adega do Rei — Backend (API REST)

API em **Node.js + Express** com **Sequelize + MySQL**, autenticação **JWT**, senhas com **bcrypt** e validação com **express-validator**, seguindo a arquitetura **MVC**.

## Como rodar

```bash
cd src/backend        # (ou a pasta onde este backend estiver)
npm install
cp .env.example .env  # preencha DB_PASSWORD e troque o JWT_SECRET
# crie o banco no MySQL/DBeaver:  CREATE DATABASE adega_do_rei;
npm run seed:admin    # cria o usuário administrador
npm run dev           # sobe em http://localhost:3000
```

As tabelas são criadas automaticamente pelo Sequelize (`sync`) na primeira execução.

## Estrutura (MVC)

```
src/
├── config/database.js        # conexão Sequelize/MySQL
├── models/                   # Model: User, Product
├── controllers/              # Controller: regras de cada rota
├── routes/                   # Rotas: URL -> middlewares -> controller
├── middlewares/              # verifyToken, isAdmin, validate
├── validators/               # regras do express-validator
├── utils/cpf.js              # validação de CPF e maioridade
├── seeders/createAdmin.js    # cria o admin
├── app.js                    # configuração do Express
└── server.js                 # conexão com o banco + listen
```

## Rotas

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| POST | `/api/auth/register` | Público | Cadastro de cliente (valida CPF, maioridade e senha) |
| POST | `/api/auth/login` | Público | Login, retorna o token JWT |
| GET | `/api/auth/me` | Token | Dados do usuário logado |
| GET | `/api/produtos` | Público | Lista o catálogo (`?categoria=`) |
| GET | `/api/produtos/:id` | Público | Detalhe do produto |
| POST | `/api/produtos` | Admin | Cadastra produto |
| PUT | `/api/produtos/:id` | Admin | Atualiza produto |
| PATCH | `/api/produtos/:id/estoque` | Admin | Entrada de estoque (`{"quantidade": 12}`) |
| DELETE | `/api/produtos/:id` | Admin | Remove do catálogo (exclusão lógica) |

Rotas protegidas exigem o header `Authorization: Bearer <token>`.

## Segurança

- Senhas guardadas apenas como hash **bcrypt** (10 rounds); o hash nunca é retornado nas consultas.
- **JWT** com expiração; `verifyToken` bloqueia requisições sem token válido (401).
- Controle de acesso por papel (`isAdmin`): cliente autenticado recebe 403 em rotas de admin.
- O papel do usuário nunca vem do corpo da requisição no cadastro (evita escalada de privilégio).
- Mensagem de login genérica, sem revelar se o e-mail existe.
- Entradas validadas e sanitizadas com **express-validator** antes de chegar ao controller.
- Segredos ficam no `.env` (fora do Git).

## Nuvem (Aiven + Render)

Toda configuração de nuvem é feita por variáveis de ambiente — nenhum código muda entre
rodar localmente e rodar em produção.

- **Banco de dados (Aiven):** copie `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` e
  `DB_PASSWORD` do painel do serviço MySQL na Aiven, defina `DB_SSL=true` e, se quiser
  validar o certificado (recomendado), baixe o `ca.pem` do painel e aponte
  `DB_SSL_CA_PATH` para ele. Sem SSL o Aiven recusa a conexão.
- **API (Render):** conecte o repositório do GitHub, defina como diretório raiz do
  serviço `src/backend`, comando de build `npm install`, comando de start `npm start`,
  e cadastre todas as variáveis do `.env.example` no painel do Render (incluindo as do
  Aiven acima e o `CORS_ORIGIN` apontando para a URL pública do frontend).
- O Render define sua própria `PORT` automaticamente; o `server.js` já lê
  `process.env.PORT`, então nada precisa ser alterado para isso.
