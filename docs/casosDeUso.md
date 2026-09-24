# Casos de Uso

## UC01 — Reservar produto
**Ator principal:** Cliente
**Pré-condição:** Cliente cadastrado e logado.
**Fluxo principal:**
1. Cliente acessa o catálogo de produtos.
2. Cliente seleciona um ou mais produtos e a quantidade desejada.
3. Sistema verifica disponibilidade em estoque (RN05).
4. Cliente confirma a reserva.
5. Sistema gera a reserva com status "pendente" e reduz o estoque disponível.
6. Sistema exibe confirmação com prazo para retirada.

**Fluxo alternativo:** Se o estoque for insuficiente, o sistema informa o cliente e impede a confirmação (RF15).

---

## UC02 — Retirar produto reservado
**Ator principal:** Administrador
**Pré-condição:** Existe uma reserva com status "pendente" ou "pronta".
**Fluxo principal:**
1. Cliente comparece ao estabelecimento e apresenta a reserva (código ou nome).
2. Administrador confere documento com foto para validar maioridade (RN02).
3. Administrador localiza a reserva no painel administrativo.
4. Administrador confirma o pagamento e marca a reserva como "retirada".
5. Sistema registra a movimentação de saída definitiva do estoque.

---

## UC03 — Cadastrar novo produto
**Ator principal:** Administrador
**Fluxo principal:**
1. Administrador acessa o painel administrativo.
2. Administrador seleciona "Novo produto".
3. Administrador preenche nome, categoria, preço, volume, foto e estoque inicial.
4. Sistema salva o produto e registra a movimentação de estoque inicial (RF08, RN06).

---

## UC04 — Registrar entrada de estoque
**Ator principal:** Administrador
**Pré-condição:** Produto já cadastrado.
**Fluxo principal:**
1. Administrador acessa o produto no painel administrativo.
2. Administrador seleciona "Registrar entrada".
3. Administrador informa a quantidade recebida do fornecedor.
4. Sistema atualiza o estoque disponível e registra a movimentação (RF10, RN06).

---

## UC05 — Reserva expirada automaticamente
**Ator principal:** Sistema (processo automático)
**Fluxo principal:**
1. Sistema verifica periodicamente reservas com status "pendente".
2. Sistema identifica reservas que ultrapassaram o prazo de 24h (RN03).
3. Sistema altera o status da reserva para "expirada".
4. Sistema devolve a quantidade reservada ao estoque disponível e registra a movimentação.
