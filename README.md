# Adega do Rei — Sistema de Reservas e Controle de Estoque

Projeto integrado desenvolvido para o módulo **Desenvolvimento de Aplicação Web** (UNIFEOB), em parceria com a **Adega do Rei**, comércio local de bebidas alcoólicas.

| | Endereço |
|---|---|
| Site | https://adega-do-rei-web.onrender.com |
| API | https://adega-do-rei.onrender.com |
| Protótipo (Figma) | [design/figma.md](./design/figma.md) |

> A API roda no plano gratuito do Render: depois de alguns minutos sem uso ela "dorme", e o primeiro acesso pode levar cerca de 30 segundos.

## Sobre o projeto

A Adega do Rei controlava o estoque manualmente (papel e caneta) e atendia pedidos pelo WhatsApp pessoal do proprietário. Este projeto substitui esse processo por uma solução digital de baixo custo, composta por:

- **Site de reservas:** o cliente consulta o catálogo, reserva produtos e acompanha suas reservas. A retirada e o pagamento acontecem presencialmente, no próprio estabelecimento.
- **Painel administrativo:** de uso exclusivo do proprietário, para cadastrar produtos, controlar o estoque e gerenciar as reservas recebidas.

## Funcionalidades

| Área | Situação |
|---|---|
| Cadastro de cliente com CPF válido e verificação de maioridade (18+) | Pronto |
| Login com JWT e perfis (cliente e administrador) | Pronto |
| Catálogo de produtos e página de detalhe | Pronto |
| Cadastro de produtos e entrada de estoque (admin) | Pronto |
| Histórico de movimentações de estoque (entrada, reserva, ajuste), com saldo antes e depois | Pronto (API) |
| Alerta de estoque baixo no painel | Pronto |
| Reserva de produtos, com conferência de estoque e baixa automática | Pronto |
| Minhas Reservas e cancelamento pelo cliente (o estoque volta) | Pronto |
| Gestão de reservas pelo admin: marcar como pronta, confirmar retirada, cancelar | Pronto |
| Expiração automática de reservas não retiradas em 24h | Pronto |
| Publicação na nuvem (site, API e banco) | Pronto |
| Edição de produto e consulta do histórico pelo painel (a API já existe) | Em andamento |
| Fotos dos produtos | Pendente |
| Saída manual de estoque (perda ou quebra) | Pendente |
| Relatório de produtos mais reservados | Pendente |
| Backup automático do banco e análise de custo | Pendente |

O detalhamento por requisito está em [`docs/`](./docs).

## Tecnologias

- **Front-end:** React 19 + TypeScript + Tailwind CSS + Vite, com React Router e Axios
- **Back-end:** Node.js + Express, em camadas (rotas, middlewares, validators, controllers, models e services)
- **ORM e banco:** Sequelize + MySQL
- **Autenticação e segurança:** JWT, bcrypt (hash de senhas), controle de acesso por papel no servidor, sanitização e validação com express-validator
- **Testes:** Jest + Supertest (90 testes automatizados)
- **Infraestrutura:** Render (API e site estático) e Aiven (MySQL gerenciado, com conexão SSL), ambos em plano gratuito
- **Ferramentas:** DBeaver (cliente MySQL), Figma (protótipo)

## Estrutura do repositório

```
adega-do-rei/
├── .github/              # Template de Pull Request
├── design/               # Protótipo (Figma)
├── docs/                 # Requisitos, regras de negócio, casos de uso, backlog e evidências de testes
├── src/
│   ├── backend/          # API REST (Node.js + Express + Sequelize)
│   └── frontend/         # Aplicação web (React + TypeScript)
├── tests/                # Guia de testes (os testes automatizados ficam em src/backend/tests)
└── README.md
```

Documentação do projeto, em [`docs/`](./docs):

- [`rf.md`](./docs/rf.md): requisitos funcionais
- [`rn.md`](./docs/rn.md): regras de negócio, com o status de implementação de cada uma
- [`rnf.md`](./docs/rnf.md): requisitos não funcionais
- [`casosDeUso.md`](./docs/casosDeUso.md): casos de uso
- [`backlog.md`](./docs/backlog.md): backlog do produto
- [`evidencias/resultado-testes.txt`](./docs/evidencias/resultado-testes.txt): resultado da última execução dos testes

Cada parte tem o seu próprio README, com mais detalhes: [backend](./src/backend/README.md) e [frontend](./src/frontend/README.md).

## Nuvem (Render + Aiven)

```
Navegador ──► Site (Render, estático) ──► API (Render, Node/Express) ──► MySQL (Aiven, SSL)
```

| Serviço | Função | Plano |
|---|---|---|
| Render — Static Site | Site (`src/frontend`, build `npm run build`, publica `dist`) | Gratuito |
| Render — Web Service | API (`src/backend`, build `npm install`, start `npm start`) | Gratuito |
| Aiven — MySQL | Banco de dados gerenciado, com conexão SSL | Gratuito |

- **Configuração:** toda configuração (banco, JWT, CORS e URL da API) vem de **variáveis de ambiente**, então o mesmo código roda localmente e em produção. Os arquivos `.env` nunca vão para o Git, e cada parte traz um `.env.example` como modelo.
- **Banco:** os dados de conexão (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`) vêm do painel da Aiven, com `DB_SSL=true`. As tabelas (`usuarios`, `produtos`, `movimentacoes_estoque`, `reservas` e `reserva_itens`) são criadas sozinhas quando a API sobe.
- **API:** além das variáveis do banco, usa `JWT_SECRET`, `CORS_ORIGIN` (URLs do site, separadas por vírgula) e `EXPIRACAO_INTERVALO_MIN`. O Render define a `PORT`.
- **Site:** usa `VITE_API_URL` (termina em `/api`), lida na hora do build, e uma regra *Rewrite* `/*` → `/index.html` para o F5 funcionar nas rotas.
- **Atualização:** o repositório é público e não dispara deploy sozinho. Depois de cada merge na `develop`, use **Manual Deploy** na API e, se o frontend mudou, no site. Mudanças em Models com colunas novas exigem `ALTER TABLE`, porque o `sync()` não altera tabelas existentes.
- **Limitações:** no plano gratuito a API "dorme" após alguns minutos sem uso, e o primeiro acesso leva cerca de 30 segundos. Backup automático do banco e monitoramento ainda não estão configurados.

Mais detalhes de publicação estão nos READMEs do [backend](./src/backend/README.md) e do [frontend](./src/frontend/README.md).

## Como rodar localmente

Pré-requisitos: **Node.js 20 ou superior** e **MySQL** instalado.

```bash
git clone https://github.com/Tesch-MatheusG/adega-do-rei
cd adega-do-rei
```

### Back-end

Crie o banco no MySQL (pelo DBeaver ou pelo terminal):

```sql
CREATE DATABASE adega_do_rei;
```

Depois, em `src/backend`:

```bash
cd src/backend
npm install
cp .env.example .env     # no Windows (cmd): copy .env.example .env
```

Edite o `.env` com os dados do seu MySQL. **Para MySQL local, use `DB_SSL=false`** (o valor `true` é só para a Aiven). Depois:

```bash
npm run seed:admin       # cria o administrador (ADMIN_EMAIL e ADMIN_SENHA do .env)
npm run dev              # API em http://localhost:3000
```

As tabelas são criadas automaticamente na primeira execução (`sequelize.sync()`).

### Front-end (em outro terminal)

```bash
cd src/frontend
npm install
cp .env.example .env     # VITE_API_URL=http://localhost:3000/api
npm run dev              # site em http://localhost:5173
```

Para usar a API publicada em vez da local, aponte `VITE_API_URL` para `https://adega-do-rei.onrender.com/api`.

### Testes

```bash
cd src/backend
npm test
```

Os testes usam um banco SQLite em memória, então não alteram nenhum dado real.

## Arquitetura e publicação

```
Navegador ──► Site (Render, estático) ──► API (Render, Node/Express) ──► MySQL (Aiven, SSL)
```

- Toda configuração de ambiente (banco, JWT, CORS, URL da API) vem de **variáveis de ambiente**. O mesmo código roda localmente e em produção.
- Os arquivos `.env` nunca vão para o Git. Cada parte traz um `.env.example` como modelo.
- As instruções de publicação estão nos READMEs do [backend](./src/backend/README.md) e do [frontend](./src/frontend/README.md).

## Segurança, em resumo

- Senhas guardadas só como hash bcrypt, que nunca sai nas consultas.
- Papel do usuário nunca vem do corpo da requisição; o acesso ao painel é conferido no servidor (401 sem login, 403 sem permissão).
- Um cliente só enxerga as próprias reservas.
- Entradas limpas e validadas no servidor (CPF com dígitos verificadores, data real, maioridade, limites de quantidade).
- Operações de estoque transacionais, com histórico completo e rastreável.
- Dados pessoais tratados com coleta mínima: o administrador nunca vê o CPF dos clientes.

## Fluxo de branches

- `main`: versões estáveis, prontas para entrega
- `develop`: integração do time
- `feature/*`: uma branch por funcionalidade, com Pull Request para `develop` e revisão do outro integrante

## Equipe

- Matheus Gabriel de Melo Tesch
- Thiago Mafra Domingues

## Licença

Projeto acadêmico desenvolvido para fins educacionais.
