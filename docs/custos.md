# Análise de custos e comparação com a AWS

Elaborado em 17/11/2026, com base no repositório (branch `develop`) e em preços públicos consultados nesta data. Valores em dólares (US$), moeda em que as plataformas cobram.

## 1. Resumo

- **Hoje o projeto custa US$ 0/mês de infraestrutura**: site e API no Render (plano gratuito) e MySQL na Aiven (plano gratuito).
- **Prazo crítico:** a Aiven vai desligar os MySQL gratuitos em **21/12/2026** e apagar dados e backups. Sem ação, o banco do projeto é perdido.
- Continuar na mesma stack depois disso custa a partir de **US$ 5/mês** (Aiven Developer), ou **US$ 12/mês** com a API sempre ligada.
- Rodar tudo na AWS custaria cerca de **US$ 24/mês (us-east-1)** a **US$ 37/mês (São Paulo, estimativa)**, com mais trabalho de operação. Uma conta nova da AWS ganha até US$ 200 em créditos por até 6 meses: serve para uma demonstração, não como solução permanente.

## 2. Arquitetura atual

```
Navegador ──► Site (Render, estático) ──► API (Render, Node/Express) ──► MySQL (Aiven, SSL)
```

Pontos do código que pesam no custo:

- As fotos dos produtos ficam no próprio MySQL (tabela `produto_imagens`, até 2 MB por foto), e não em um bucket. Isso mantém tudo no plano gratuito, mas faz o banco crescer.
- Um agendador dentro da API expira reservas a cada 10 minutos. No Render gratuito a API dorme, por isso as listagens também conferem a expiração na hora.
- Toda a configuração vem de variáveis de ambiente, o que facilita trocar de provedor.
- Backup automático e monitoramento estão como pendentes, e o deploy é manual (Manual Deploy no Render).

## 3. Quanto custa hoje

| Item | Serviço | Plano | Custo/mês | Observação |
|---|---|---|---|---|
| Site | Render Static Site | Gratuito | US$ 0 | Hospedagem estática gratuita |
| API | Render Web Service | Free | US$ 0 | 750 h/mês; dorme após 15 min sem uso (cerca de 30 s no primeiro acesso) |
| Banco | Aiven for MySQL | Free (1 vCPU, 1 GB RAM, 1 GB de disco) | US$ 0 | **Será desligado em 21/12/2026** |
| Código | GitHub | Repositório público | US$ 0 | |
| Domínio | Endereço `onrender.com` | n/a | US$ 0 | Domínio próprio seria custo extra |
| Ferramentas | Figma, DBeaver, Insomnia | Planos gratuitos ou educacionais | US$ 0 (confirmar) | Confirmar o plano de cada uma |
| **Total de infraestrutura** | | | **US$ 0** | |

**Mão de obra:** não entra no caixa por ser projeto acadêmico, mas pode ser registrada como custo de oportunidade: horas trabalhadas × valor de hora de referência. Preencher com as horas de cada integrante.

## 4. Limitações do plano gratuito (custo indireto)

- **Partida a frio da API (~30 s):** o primeiro acesso após um período parado pode estourar o requisito RNF05 (páginas principais em até 3 s).
- **Banco de 1 GB:** com fotos no limite de 2 MB, cabem cerca de 500; com fotos reduzidas (~200 KB), milhares. Vale acompanhar o uso do disco.
- **Backup:** o backup automático está pendente (RNF06). O plano Developer da Aiven anuncia backups diários incluídos; conferir no console o que está ativo no serviço.
- **Fim do plano gratuito de MySQL na Aiven:** novos serviços gratuitos de MySQL não podem mais ser criados desde 06/11/2026, e os existentes serão desligados em 21/12/2026.

## 5. Cenários de custo mensal

| Cenário | Composição | Custo/mês |
|---|---|---|
| A. Hoje (até 20/12/2026) | Render Free + Aiven Free | US$ 0 |
| B. Mínimo para continuar no ar | Render Free + Aiven Developer (US$ 5) | US$ 5 (API ainda dorme) |
| C. Produção leve na mesma stack | Render Starter (US$ 7) + Aiven Developer (US$ 5) + site gratuito | US$ 12 |
| D. Tudo na AWS | Ver seção 6 | cerca de US$ 24 a US$ 37 |

O plano Developer da Aiven para MySQL inclui 1 CPU, 1 GB de RAM e 8 GB de disco, e mantém os dados e as credenciais de conexão ao migrar do plano gratuito.

## 6. Comparação com a AWS

### Equivalência de serviços

| Função | Hoje | Na AWS |
|---|---|---|
| Site estático | Render Static Site | S3 + CloudFront |
| API Node/Express | Render Web Service | EC2 (por exemplo t4g.micro); alternativas: App Runner, Lightsail, Elastic Beanstalk |
| MySQL | Aiven | RDS for MySQL |
| Fotos | BLOB no MySQL | S3 (já previsto no backlog do projeto) |
| Backup | Pendente | Backups automáticos do RDS |
| HTTPS | Automático no Render | CloudFront para o site; para a API é preciso configurar proxy com certificado ou colocar o CloudFront na frente |

### Custo estimado (instâncias pequenas, Single-AZ, baixo tráfego)

| Item | us-east-1 (preço consultado) | São Paulo (estimativa) |
|---|---|---|
| EC2 t4g.micro (API) | US$ 6,13 (US$ 0,0084/h) | cerca de US$ 9,78 (US$ 0,0134/h) |
| RDS MySQL db.t4g.micro | US$ 11,68 (US$ 0,016/h) | cerca de US$ 19 (estimativa) |
| Armazenamento do RDS, 20 GB gp3 | cerca de US$ 2,30 | cerca de US$ 3,50 (estimativa) |
| Disco da API (EBS) + IPv4 público | cerca de US$ 4,30 | cerca de US$ 4,70 (estimativa) |
| Site (S3 + CloudFront) | cerca de US$ 0 | cerca de US$ 0 |
| **Total** | **cerca de US$ 24** | **cerca de US$ 37** |

Pontos que sustentam a tabela:

- O CloudFront tem um nível gratuito permanente de 1 TB de saída e 10 milhões de requisições por mês, mais do que suficiente para um catálogo de adega.
- São Paulo é a região mais cara da AWS: o EC2 t4g.micro custa cerca de 60% mais que em us-east-1. Foi aplicada uma proporção parecida ao RDS, ao armazenamento e ao IPv4; por isso essas linhas são estimativas.
- A linha de disco + IPv4 usa tarifas conhecidas (EBS gp3 e cobrança por IPv4 público) que não foram reconferidas nesta data.
- Se o banco ficar em sub-rede privada e a API precisar sair para a internet via NAT Gateway, só a hora do NAT custa cerca de US$ 33/mês em us-east-1. É um custo fácil de esquecer.

### Créditos da conta nova

Contas novas escolhem entre o plano Free e o Paid. No Free há US$ 100 de crédito ao abrir a conta e até US$ 100 adicionais por atividades no console, por até 6 meses ou até acabar o crédito, o que vier primeiro. Depois disso a conta Free fecha sozinha e o prazo não pode ser estendido. O benefício vale só para quem nunca teve conta na AWS, e a validade exata dos créditos aparece com valores diferentes em páginas distintas da AWS, então conferir no console. Com o custo estimado acima, US$ 100 a US$ 200 duram entre cerca de 3 e 8 meses, limitados ao teto de 6 meses do plano Free.

### Comparativo qualitativo

| Critério | Render + Aiven | AWS |
|---|---|---|
| Custo hoje | US$ 0 (até 21/12/2026); depois US$ 5 a US$ 12 | cerca de US$ 24 a US$ 37 (créditos cobrem poucos meses) |
| Esforço de operação | Baixo: deploy por Git, HTTPS pronto | Maior: sistema operacional, Node, certificado, grupos de segurança, atualizações |
| Latência no Brasil | O Render não parece ter região no Brasil (confirmar) | Região São Paulo (sa-east-1) disponível |
| Backup | Depende do plano do banco | RDS com backups automáticos |
| Escala e recursos | Suficiente para o porte atual | Muito maior: monitoramento, permissões, rede privada |
| Risco de custo inesperado | Baixo (valor fixo por serviço) | Maior (NAT Gateway, tráfego, IPs, recursos esquecidos ligados) |

## 7. Recomendação

Para o porte de um pequeno comércio (RNF07) e para o prazo mais próximo:

1. **Antes de 21/12/2026**, exportar o banco com `mysqldump` e guardar o arquivo fora da Aiven. Vale para qualquer cenário.
2. **Destino do banco:** Aiven Developer (US$ 5/mês) é o caminho de menor esforço, pois mantém dados e credenciais. Migrar para o RDS faz sentido se o objetivo da entrega for demonstrar a nuvem AWS.
3. **API:** manter no Render gratuito enquanto a partida a frio for aceitável, e subir para o Starter (US$ 7/mês) quando houver clientes reais.
4. **Para a comparação com a AWS na disciplina:** montar a estimativa na AWS Pricing Calculator, região São Paulo, com os itens da seção 6, e anexar o resultado a este documento. Se for subir algo de verdade, usar uma conta nova com créditos, só para demonstração, e desligar tudo ao final.
5. **Fotos:** mover para o S3 só se o banco se aproximar do limite de disco.

## 8. Fontes e ressalvas

- Aiven: documentação de aposentadoria do MySQL gratuito, página do Developer Tier e página de preços do MySQL.
- Render: página de preços e artigos de 2026 sobre o plano Hobby (US$ 0), instância Free (750 h/mês, dorme após 15 min) e Starter (US$ 7/mês).
- AWS: página e FAQ do Free Tier, preços do CloudFront (nível gratuito permanente) e listagens de preço do EC2 t4g.micro e do RDS db.t4g.micro.
- Os preços de EC2 e RDS vieram de listagens públicas, e não da calculadora oficial. As linhas marcadas como estimativa devem ser confirmadas na AWS Pricing Calculator.
- Valores em dólares, sem impostos nem IOF, e sem conversão para reais.
