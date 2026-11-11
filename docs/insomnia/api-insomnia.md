# Documentação da API no Insomnia

Coleção pronta para importar: [`docs/insomnia/adega-do-rei.insomnia.json`](./insomnia/adega-do-rei.insomnia.json)
(30 requisições organizadas em Autenticação, Categorias, Produtos e Reservas, com dois ambientes: **Local** e **Nuvem**).

## Como usar

1. Instale o [Insomnia](https://insomnia.rest/download).
2. **Import** → escolha o arquivo `adega-do-rei.insomnia.json`.
3. No canto superior esquerdo, selecione o ambiente **Local** (`http://localhost:3000/api`) ou **Nuvem (Render)**.
4. Edite o ambiente base (`Manage Environments`) e preencha `admin_email` e `admin_senha` com os dados do admin criado pelo seeder (`ADMIN_EMAIL` / `ADMIN_SENHA` do `.env`).
5. Ordem sugerida: **Cadastrar cliente → Login ADMIN → Login CLIENTE** e depois as demais. Os logins geram o token JWT e as outras requisições o reaproveitam sozinhas (aba *Auth → Bearer*, valor ligado à resposta do login).
6. Variáveis `produto_id` e `reserva_id` do ambiente indicam em qual registro as requisições atuam. Depois de criar um produto/reserva, copie o `id` retornado para lá.

> Na nuvem, a API gratuita do Render dorme após ~15 min sem uso; a primeira chamada pode levar ~30 s.

## Como a autenticação funciona

- `POST /auth/login` devolve `{ token, usuario }`. O token é um JWT que expira em 2 h (`JWT_EXPIRES_IN`).
- Rotas protegidas recebem o cabeçalho `Authorization: Bearer <token>`.
- Sem token ou token inválido → **401**. Token válido de um cliente em rota de admin → **403**.

## Endpoints

Acesso: **Pública** (sem token) · **Login** (qualquer usuário autenticado) · **Dono/Admin** (dono do recurso ou admin) · **Admin**.

### Autenticação — `/api/auth`
| Método | Rota | Acesso | Corpo | Sucesso |
|---|---|---|---|---|
| POST | `/register` | Pública | `nome, email, cpf, dataNascimento (AAAA-MM-DD), senha` | 201 |
| POST | `/login` | Pública | `email, senha` | 200 `{ token, usuario }` |
| GET | `/me` | Login | — | 200 |

### Categorias — `/api/categorias`
| Método | Rota | Acesso | Corpo | Sucesso |
|---|---|---|---|---|
| GET | `/` | Pública | — | 200 |
| POST | `/` | Admin | `nome` | 201 (409 se já existe) |

### Produtos — `/api/produtos`
| Método | Rota | Acesso | Corpo | Sucesso |
|---|---|---|---|---|
| GET | `/` | Pública | — | 200 |
| GET | `/:id` | Pública | — | 200 |
| GET | `/:id/imagem` | Pública | — | 200 |
| POST | `/` | Admin | `nome, categoria, preco, volumeMl?, descricao?, estoque?` | 201 |
| PUT | `/:id` | Admin | qualquer campo acima | 200 |
| PATCH | `/:id/estoque` | Admin | `quantidade, motivo?` | 200 |
| GET | `/:id/movimentacoes` | Admin | — | 200 |
| PUT | `/:id/imagem` | Admin | multipart, campo `imagem` (até 2 MB) | 200 (413 se maior) |
| DELETE | `/:id/imagem` | Admin | — | 204 |
| DELETE | `/:id` | Admin | — | 204 (exclusão lógica) |

### Reservas — `/api/reservas` (todas exigem login)
| Método | Rota | Acesso | Corpo | Sucesso |
|---|---|---|---|---|
| POST | `/` | Login | `itens[{produtoId, quantidade}], retiradaPrevista?` | 201 (409 sem estoque) |
| GET | `/minhas` | Login | — | 200 |
| GET | `/?status=` | Admin | — | 200 |
| GET | `/:id` | Dono/Admin | — | 200 (404 se for de outro) |
| PATCH | `/:id/pronta` | Admin | — | 200 |
| PATCH | `/:id/retirada` | Admin | — | 200 |
| PATCH | `/:id/cancelar` | Dono/Admin | — | 200 (devolve estoque) |

Erros de validação voltam como **400** e regras de negócio violadas como **409**; formato do erro: `{ "erro": "mensagem" }`.