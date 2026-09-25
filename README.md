# Adega do Rei — Sistema de Reservas e Controle de Estoque

Projeto integrado desenvolvido para o módulo **Desenvolvimento de Aplicação Web**, em parceria com a **Adega do Rei**, comércio local de bebidas alcoólicas.

## Sobre o projeto

Atualmente a Adega do Rei controla seu estoque manualmente (papel e caneta) e atende pedidos pelo WhatsApp pessoal do proprietário. Este projeto tem como objetivo substituir esse processo por uma solução digital de baixo custo, composta por:

- **Site de reservas**: os clientes consultam o catálogo de produtos e reservam itens para retirada e pagamento no próprio estabelecimento.
- **Painel administrativo**: de uso exclusivo do proprietário, para cadastro de produtos, controle de entrada/saída de estoque e gerenciamento das reservas recebidas.

A solução é hospedada em serviços de nuvem com custo compatível com o porte da empresa, evitando investimento em infraestrutura própria.

## Tecnologias

- **Front-end:** React + TypeScript + Tailwind CSS + Vite
- **Back-end:** *Node.js + Express (arquitetura MVC — Routes, Controllers, Models)
- **ORM / Banco de dados:** Sequelize + MySQL
- **Infraestrutura:** AWS (RDS, S3, Elastic Beanstalk/EC2, EventBridge + Lambda), priorizando camada gratuita
- **Autenticação e Segurança:** JWT (JSON Web Token) + bcrypt (hash de senhas)
- **Validação:** express-validator
- **Ferramentas de Banco:** DBeaver (Cliente MySQL)

## Estrutura do repositório

```
adega-do-rei/
├── .github/              # Templates de PR e Issues
├── design/               # Protótipos e diagramas
├── docs/                 # Documentação (requisitos, casos de uso, backlog)
├── src/                  # Código-fonte (front-end e back-end)
├── tests/                # Testes automatizados
└── README.md
```

Documentação detalhada disponível em [`docs/`](./docs):
- [`rf.md`](./docs/rf.md) — Requisitos Funcionais
- [`rn.md`](./docs/rn.md) — Regras de Negócio
- [`rnf.md`](./docs/rnf.md) — Requisitos Não Funcionais
- [`casosDeUso.md`](./docs/casosDeUso.md) — Casos de Uso
- [`backlog.md`](./docs/backlog.md) — Backlog do produto

## Fluxo de branches

- `main` — versões estáveis, prontas para entrega
- `develop` — integração contínua do time
- `feature/*` — uma branch por funcionalidade, com Pull Request para `develop`

## Como rodar o projeto

# Clonar o repositório
git clone https://github.com/usuario/adega-do-rei.git
cd adega-do-rei

# Front-end
cd src/frontend
npm install
npm run dev

# Back-end (em outro terminal)
cd src/backend
npm install
# configurar o .env com as credenciais do MySQL (ver .env.example)
npx sequelize db:migrate
npm run dev

## Equipe

- Matheus Gabriel de Melo Tesch
- Thiago Mafra Domingues

## Licença

Projeto acadêmico desenvolvido para fins educacionais.