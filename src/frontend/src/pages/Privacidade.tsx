import { Link } from 'react-router-dom';
import { TEXTO_FUNCIONAMENTO } from '../lib/horarioRetirada';

const ATUALIZADA_EM = '19/11/2026';

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="font-serif text-xl mb-2">{titulo}</h2>
      <div className="text-muted leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

// Política de Privacidade (LGPD, Lei nº 13.709/2018). O texto descreve o que o sistema realmente faz:
// confira esta página sempre que o projeto passar a coletar ou compartilhar algum dado novo.
export default function Privacidade() {
  return (
    <div className="container-page py-14 max-w-3xl">
      <p className="text-gold text-sm">Adega do Rei</p>
      <h1 className="font-serif text-3xl mb-2">Política de Privacidade</h1>
      <p className="text-muted text-sm mb-10">Última atualização: {ATUALIZADA_EM}</p>

      <Secao titulo="1. Quem somos">
        <p>
          A <strong className="text-ink">Adega do Rei</strong> (Av. Dr. Leonardo Guaranha, 187 – Jardim Primavera, Aguaí-SP) é a responsável
          pelos dados pessoais tratados neste site, que serve para consultar o catálogo e <strong className="text-ink">reservar bebidas para retirada na loja</strong>.
        </p>
      </Secao>

      <Secao titulo="2. Quais dados coletamos">
        <ul className="list-disc pl-5 space-y-1">
          <li><strong className="text-ink">Cadastro:</strong> nome completo, data de nascimento, CPF, e-mail e senha.</li>
          <li><strong className="text-ink">Reservas:</strong> produtos e quantidades reservados, data e horário combinados para a retirada e o status da reserva.</li>
        </ul>
        <p>
          Não coletamos dados de pagamento: o pagamento é feito somente na loja, no momento da retirada. Sua senha é guardada
          apenas de forma criptografada (hash), então nem a equipe da adega consegue vê-la.
        </p>
      </Secao>

      <Secao titulo="3. Para que usamos seus dados">
        <ul className="list-disc pl-5 space-y-1">
          <li><strong className="text-ink">Data de nascimento e CPF:</strong> verificar que você tem 18 anos ou mais e identificar o titular da reserva. A conferência final é feita na loja, com documento com foto, no momento da retirada.</li>
          <li><strong className="text-ink">Nome e e-mail:</strong> identificar sua conta e permitir o seu acesso ao site.</li>
          <li><strong className="text-ink">Dados da reserva:</strong> separar os produtos, controlar o estoque e organizar a retirada.</li>
        </ul>
        <p>Usamos apenas o necessário para essas finalidades. Não enviamos propaganda nem vendemos seus dados.</p>
      </Secao>

      <Secao titulo="4. Base legal">
        <p>
          O tratamento é feito com o seu <strong className="text-ink">consentimento</strong> (art. 7º, I, da LGPD), dado ao marcar a caixa de
          aceite no cadastro. Para a verificação de maioridade, o tratamento também se justifica pelo cumprimento da proibição legal de venda de bebidas alcoólicas a menores de 18 anos.
        </p>
      </Secao>

      <Secao titulo="5. Com quem compartilhamos">
        <p>
          Não compartilhamos seus dados pessoais com terceiros para fins próprios deles. Para o site funcionar, usamos serviços de
          tecnologia que armazenam e processam os dados em nosso nome: o <strong className="text-ink">Render</strong> (hospedagem do site e da API)
          e a <strong className="text-ink">Aiven</strong> (banco de dados). Eles só tratam os dados para manter o sistema no ar.
        </p>
        <p>
          Dentro da adega, o administrador vê o nome e a reserva para atendê-lo, mas <strong className="text-ink">não tem acesso ao seu CPF nem à sua data de nascimento</strong> pelo painel.
          Esses dados só aparecem para você, no seu perfil.
        </p>
      </Secao>

      <Secao titulo="6. Segurança">
        <p>
          Adotamos medidas como senhas criptografadas, login com token de acesso, controle de permissões (cliente e administrador)
          e validação dos dados enviados. Nenhum sistema é totalmente imune a falhas, mas trabalhamos para proteger suas informações.
        </p>
      </Secao>

      <Secao titulo="7. Seus direitos">
        <p>Pela LGPD (art. 18), você pode, a qualquer momento:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>confirmar que tratamos seus dados e acessá-los;</li>
          <li>corrigir dados incompletos, inexatos ou desatualizados;</li>
          <li>pedir a eliminação dos dados tratados com base no seu consentimento;</li>
          <li>pedir informações sobre com quem os dados são compartilhados;</li>
          <li>revogar o consentimento dado.</li>
        </ul>
        <p>
          Para exercer qualquer um desses direitos, fale com a adega pelo Instagram <strong className="text-ink">_adegadorei</strong> ou
          pessoalmente na loja ({TEXTO_FUNCIONAMENTO.toLowerCase()}). Se você revogar o consentimento, não será mais possível manter a conta e fazer reservas.
        </p>
      </Secao>

      <Secao titulo="8. Menores de idade">
        <p>
          O site é destinado a maiores de 18 anos. Cadastros de menores de idade não são aceitos.
        </p>
      </Secao>

      <Secao titulo="9. Mudanças nesta política">
        <p>Podemos atualizar este texto. A data da última atualização fica sempre no topo desta página.</p>
      </Secao>

      <Link to="/cadastro" className="btn-outline">← Voltar ao cadastro</Link>
    </div>
  );
}
