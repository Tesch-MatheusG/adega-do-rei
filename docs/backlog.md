# Backlog do Produto

Organizado por épicos, cada um agrupando as funcionalidades relacionadas. Sugestão: dividir os épicos entre os dois integrantes (ex: um foca mais em back-end/estoque, outro em front-end/cliente), revisando o trabalho um do outro via Pull Request.

## Épico 1 — Autenticação e Perfis
- Tela de splash/landing
- Tela de cadastro de usuário (cliente), com CPF e data de nascimento
- Tela de login
- Diferenciação de perfil (ADM / Cliente) após login
- Autenticação e controle de sessão (JWT ou equivalente)
- Restrição de acesso ao painel administrativo por papel (role), validada no back-end

## Épico 2 — Catálogo e Estoque de Produtos
- Listagem de produtos disponíveis (catálogo)
- Visualização de detalhes do produto
- Modelagem do banco: produtos, estoque, movimentações
- Cadastro de novo produto (ADM)
- Edição de produto existente (ADM)
- Registro de entrada de estoque (ADM)
- Registro de saída manual de estoque — perda/quebra (ADM)
- Histórico de movimentações de estoque
- Alerta de estoque baixo

## Épico 3 — Reservas
- Realizar reserva de produto (Cliente)
- Verificação de disponibilidade em estoque antes de confirmar
- Visualizar reserva(s) ativa(s) (Cliente)
- Cancelar reserva (Cliente)
- Listar todas as reservas (ADM)
- Confirmar retirada da reserva (ADM)
- Atualização automática do estoque ao confirmar retirada
- Expiração automática de reserva não retirada em 24h (job agendado)

## Épico 4 — Painel Administrativo
- Dashboard com visão geral (estoque baixo, reservas pendentes)
- Gestão de produtos (acesso centralizado ao Épico 2)
- Gestão de reservas (acesso centralizado ao Épico 3)
- Relatório de produtos mais reservados

## Épico 5 — Infraestrutura e Nuvem
- Deploy do front-end (Vercel/Netlify/Cloudflare Pages)
- Deploy do back-end (Render/Railway/Cloud Run)
- Banco de dados gerenciado (Supabase/Neon/RDS)
- Armazenamento de imagens dos produtos (S3/R2/Supabase Storage)
- Rotina agendada para expiração de reservas
- Backup automático do banco
- Documento de análise de custo (free tier vs. produção)

---

## Fora do escopo deste projeto
- WhatsApp Business API (custo alto para o porte da empresa)
- Pagamento online (fica como possível evolução futura)
- Sistema de fidelidade / cupons
- Aplicativo mobile nativo
