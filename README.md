# Adega do Rei — Sistema de Reservas e Controle de Estoque

Projeto integrado desenvolvido para o módulo **Desenvolvimento de Aplicação Web**, em parceria com a **Adega do Rei**, comércio local de bebidas alcoólicas.

## Sobre o projeto

Atualmente a Adega do Rei controla seu estoque manualmente (papel e caneta) e atende pedidos pelo WhatsApp pessoal do proprietário. Este projeto tem como objetivo substituir esse processo por uma solução digital de baixo custo, composta por:

- **Site de reservas**: os clientes consultam o catálogo de produtos e reservam itens para retirada e pagamento no próprio estabelecimento.
- **Painel administrativo**: de uso exclusivo do proprietário, para cadastro de produtos, controle de entrada/saída de estoque e gerenciamento das reservas recebidas.

A solução é hospedada em serviços de nuvem com custo compatível com o porte da empresa, evitando investimento em infraestrutura própria.

## Tecnologias

- **Front-end:** React + TypeScript + Vite
- **Back-end:** *(definir: Python — Flask/FastAPI)*
- **Banco de dados:** *(definir: PostgreSQL / Supabase)*
- **Infraestrutura:** hospedagem em nuvem (camada gratuita/serverless)

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

> *Instruções a serem detalhadas conforme o setup do back-end for definido.*

## Equipe

- Matheus Gabriel de Melo Tesch
- Thiago Mafra Domingues

## Licença

Projeto acadêmico desenvolvido para fins educacionais.