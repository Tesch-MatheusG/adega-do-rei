# Requisitos Não Funcionais (RNF)

| Código | Categoria | Descrição |
|--------|-----------|-----------|
| RNF01 | Usabilidade | A interface deve ser responsiva, funcionando corretamente em smartphones, já que a maioria dos clientes acessará pelo celular. |
| RNF02 | Segurança | Senhas de usuários devem ser armazenadas com hash (bcrypt ou equivalente), nunca em texto puro. |
| RNF03 | Segurança | O acesso ao painel administrativo deve ser restrito por autenticação e verificação de papel (role) no back-end, não apenas ocultado na interface. |
| RNF04 | Privacidade | Dados pessoais (CPF, data de nascimento) devem ser tratados conforme a LGPD, com coleta mínima e consentimento explícito do usuário. |
| RNF05 | Desempenho | As páginas principais (catálogo e reserva) devem carregar em até 3 segundos em conexão 4G padrão. |
| RNF06 | Disponibilidade | O sistema deve utilizar serviços de nuvem com backup automático do banco de dados. |
| RNF07 | Custo | A infraestrutura de nuvem deve ser compatível com o porte de um pequeno comércio, priorizando planos gratuitos ou de baixo custo (camada serverless/free tier). |
| RNF08 | Manutenibilidade | O código deve seguir uma estrutura de pastas organizada e documentada, permitindo que outro desenvolvedor entenda o projeto sem depender apenas dos autores originais. |
| RNF09 | Compatibilidade | O sistema deve funcionar corretamente nos navegadores mais usados (Chrome, Firefox, Edge, Safari), nas versões atuais. |
| RNF10 | Confiabilidade | Operações de estoque (entrada, saída, reserva) devem ser transacionais, evitando inconsistências em caso de acessos simultâneos. |
