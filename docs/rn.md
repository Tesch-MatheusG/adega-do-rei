# Regras de Negócio (RN)

| Código | Descrição | Implementação / evidência |
|--------|-----------|------|
| RN01 | Somente pessoas maiores de 18 anos podem finalizar uma reserva, conforme informado no cadastro (data de nascimento). | **Implementado no cadastro** (`utils/cpf.js` → `isAdult`, `authValidators.js`). Teste: "rejeita menor de 18 anos". Bloqueio na finalização da reserva: pendente (módulo de reservas). |
| RN02 | A conferência final da maioridade é feita presencialmente, com documento com foto, no momento da retirada. O cadastro no site é uma pré-validação, não uma comprovação legal. | Procedimento presencial, fora do sistema. |
| RN03 | Toda reserva não retirada em até 24 horas após o horário combinado expira automaticamente e o estoque reservado retorna ao estoque disponível. | Pendente (módulo de reservas). |
| RN04 | O pagamento é realizado exclusivamente no momento da retirada, no estabelecimento. | Procedimento presencial, fora do sistema. |
| RN05 | Não é permitido reservar uma quantidade maior do que o estoque disponível do produto. | Pendente (módulo de reservas). |
| RN06 | Toda alteração de estoque (entrada, saída, reserva ou ajuste) deve ser registrada no histórico de movimentações, não sendo permitida alteração direta do saldo sem rastro. | **Implementado para estoque inicial e entrada** (tabela `movimentacoes_estoque`, gravada na mesma transação do saldo). Teste: "saldo atual = soma das movimentações". Saída, reserva e ajuste: pendentes. |
| RN07 | Somente o administrador (dono do estabelecimento) pode cadastrar produtos, alterar preços e registrar entrada/saída manual de estoque. | **Implementado** (`verifyToken` + `isAdmin`). Testes: sem token 401, cliente 403. |
| RN08 | Dados pessoais dos clientes (CPF, data de nascimento) são utilizados apenas para validação de maioridade e identificação da reserva, conforme a LGPD, não sendo compartilhados com terceiros. | **Parcial**: senha só como hash bcrypt; CPF e data de nascimento só retornam ao próprio titular (`/auth/me`). Consentimento explícito (RNF04): pendente no frontend. |
| RN09 | Um produto com estoque zerado não pode ser reservado, mas continua visível no catálogo como "indisponível". | **Parcial**: produto com estoque 0 continua listado no catálogo. Rótulo "indisponível" e bloqueio da reserva: pendentes. |