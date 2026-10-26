/**
 * POST /api/lead
 *
 * Recebe o formulário de contato do site e grava o lead no Attio: cria ou
 * atualiza a empresa em `companies` e deixa uma nota com tudo o que o
 * formulário capturou.
 *
 * Variável de ambiente obrigatória no Vercel:
 *   ATTIO_API_KEY   — token da API do Attio (Settings → Developers → Access tokens)
 *                     Escopo mínimo: record (read+write), list_entry (write), note (write).
 *
 * A chave nunca chega ao navegador: só esta função a lê.
 */

'use strict';

var ATTIO = 'https://api.attio.com/v2';

/* Sem lista: o workspace ainda nao tem uma para leads do site. Quando
   existir, basta voltar a adicionar a entrada depois de gravar o registro. */

/* IDs das opções já existentes no workspace da IMV. */
var OPCAO = {
  estado_respondeu: '867abe63-a105-4c0c-ae94-902757e291b5',  // Respondio
  resultado_interessado: '0aff20b0-8362-4e27-b268-46a3663ff571',  // Respondeu - interessado
  tipo_prospecto: '8de6565b-e274-4f9a-99ef-735cc84523f3',  // Prospecto
  oferta_a_definir: 'dc5c473b-7550-4017-929d-1ff8f4524d4e',  // A definir
  objecao_nenhuma: '584d5a41-8eea-4ee5-a0d2-17d87e2e429f',  // Nenhuma registrada
  prioridade: {
    maxima: 'e20421c5-0de5-4ac4-969a-32a29fbce875',
    alta: '15ff832f-110c-4b31-83d9-b90f41bbac31',
    media: 'ac542d01-18af-438a-8df0-e4092ab8c194',
    exploratoria: '22f98dd4-9d13-433b-9aaa-70f92f57d48b',
    sem_avaliar: '287ad961-5e8c-42ba-acba-712ed489c5be'
  }
};

/* Faixa declarada no formulário → opção do atributo "Faturamento mensal"
   no Attio + prioridade comercial para a fila da noite.
   As chaves são exatamente os values do <select> do anúncio. Comparação exata:
   cada faixa traz dois números no texto, então busca por trecho erra o tramo. */
var FAIXAS = {
  'Até R$ 20 mil':            { opcao: '36b5d3f5-9fdd-48d0-bc96-58c094ab1cdb', prioridade: 'exploratoria' },
  'R$ 20 mil a R$ 50 mil':    { opcao: '71794a96-856d-410a-8abd-4fdc8cd00778', prioridade: 'media' },
  'R$ 50 mil a R$ 100 mil':   { opcao: 'b034a734-ce55-4d6f-b8d5-f30ec16f5489', prioridade: 'alta' },
  'R$ 100 mil a R$ 300 mil':  { opcao: '2da98cb0-1929-421b-acf9-9bc351f01ff4', prioridade: 'maxima' },
  'Acima de R$ 300 mil':      { opcao: 'd814c882-98f7-46e8-b20b-f4a811ae67ea', prioridade: 'maxima' }
};

function faixaDe(faturamento) {
  return FAIXAS[String(faturamento || '').trim()] || null;
}

function limpa(valor, max) {
  return String(valor == null ? '' : valor).trim().slice(0, max || 300);
}

/** 11987654321 → +5511987654321 */
function telefoneE164(bruto) {
  var d = String(bruto || '').replace(/\D/g, '');
  if (!d) return null;
  if (d.length >= 12 && d.indexOf('55') === 0) return '+' + d;
  if (d.length === 10 || d.length === 11) return '+55' + d;
  return '+' + d;
}

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

function chamaAttio(caminho, metodo, corpo, chave) {
  return fetch(ATTIO + caminho, {
    method: metodo,
    headers: {
      'Authorization': 'Bearer ' + chave,
      'Content-Type': 'application/json'
    },
    body: corpo ? JSON.stringify(corpo) : undefined
  }).then(function (r) {
    return r.text().then(function (texto) {
      if (!r.ok) {
        var erro = new Error('Attio ' + r.status + ': ' + texto.slice(0, 400));
        erro.status = r.status;
        throw erro;
      }
      return texto ? JSON.parse(texto) : {};
    });
  });
}

/* Procura empresa já existente pelo WhatsApp, para não duplicar o registro.
   O filtro de phone-number aceita a forma curta e a aninhada conforme o caso;
   tentamos as duas antes de desistir, porque falhar aqui gera registro duplicado. */
function procuraPorWhatsapp(telefone, chave) {
  var formas = [
    { whatsapp: telefone },
    { whatsapp: { original_phone_number: telefone } }
  ];

  function tenta(i) {
    if (i >= formas.length) return Promise.resolve(null);
    return chamaAttio('/objects/companies/records/query', 'POST', {
      filter: formas[i],
      limit: 1
    }, chave).then(function (r) {
      var lista = (r && r.data) || [];
      return lista.length ? lista[0].id.record_id : null;
    }).catch(function (e) {
      console.error('busca por whatsapp falhou (forma ' + (i + 1) + '):', e.message);
      return tenta(i + 1);   // sintaxe recusada: tenta a outra
    });
  }
  return tenta(0);
}

/* ---------------------------------------------------------------- *
 * Defesas do endpoint. Ele escreve direto no CRM sem autenticar o
 * visitante, entao as duas portas sao: de onde veio e com que ritmo.
 * ---------------------------------------------------------------- */

var HOSTS_PERMITIDOS = ['imv.solutions', 'www.imv.solutions'];

/* So aceita POST disparado de uma pagina da IMV. O navegador manda Origin
   em todo POST, inclusive same-origin, entao um site de terceiros que tente
   enviar o formulario em nome do visitante cai aqui. Sem Origin usavel,
   o Referer serve de segunda leitura. */
function origemConfiavel(req) {
  var host = String(req.headers['host'] || '').toLowerCase();
  var bruto = req.headers['origin'] || req.headers['referer'] || '';
  if (!bruto) return false;
  var vindo;
  try { vindo = new URL(bruto).host.toLowerCase(); } catch (e) { return false; }
  return vindo === host || HOSTS_PERMITIDOS.indexOf(vindo) !== -1;
}

/* Limite por IP, melhor esforco: cada instancia da funcao guarda a sua
   janela em memoria. Nao e uma barreira dura, e sim um teto contra envio
   automatizado. O teto e alto de proposito: num estande a feira inteira
   sai pelo mesmo IP do wi-fi do pavilhao. */
var JANELA_MS = 10 * 60 * 1000;
var TETO_JANELA = 20;
var janelas = new Map();

function dentroDoTeto(ip) {
  if (!ip) return true;
  var agora = Date.now();
  var marcas = (janelas.get(ip) || []).filter(function (t) { return agora - t < JANELA_MS; });
  if (marcas.length >= TETO_JANELA) {
    janelas.set(ip, marcas);
    return false;
  }
  marcas.push(agora);
  janelas.set(ip, marcas);
  if (janelas.size > 500) {           // teto de memoria da instancia
    janelas.clear();
    janelas.set(ip, marcas);
  }
  return true;
}

function ipDe(req) {
  var xff = String(req.headers['x-forwarded-for'] || '');
  return xff.split(',')[0].trim() || null;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, erro: 'metodo_nao_permitido' });
  }

  if (!origemConfiavel(req)) {
    console.error('POST recusado, origem fora da lista:', req.headers['origin'] || req.headers['referer'] || '(sem origem)');
    return res.status(403).json({ ok: false, erro: 'origem_nao_permitida' });
  }

  if (!dentroDoTeto(ipDe(req))) {
    res.setHeader('Retry-After', '600');
    return res.status(429).json({ ok: false, erro: 'muitos_envios' });
  }

  var chave = process.env.ATTIO_API_KEY;
  if (!chave) {
    console.error('ATTIO_API_KEY ausente nas variáveis de ambiente');
    return res.status(500).json({ ok: false, erro: 'config_ausente' });
  }

  var corpo = req.body;
  if (typeof corpo === 'string' && corpo.length > 20000) {   // corpo gigante nao e lead
    return res.status(413).json({ ok: false, erro: 'corpo_grande_demais' });
  }
  if (typeof corpo === 'string') {
    try { corpo = JSON.parse(corpo); } catch (e) { corpo = null; }
  }
  if (!corpo || typeof corpo !== 'object') {
    return res.status(400).json({ ok: false, erro: 'corpo_invalido' });
  }

  if (limpa(corpo._hp, 50)) {                       // honeypot preenchido = bot
    return res.status(200).json({ ok: true });
  }

  var nome = limpa(corpo.nome, 120);
  var empresa = limpa(corpo.empresa, 160);
  var email = limpa(corpo.email, 160);
  var telefone = telefoneE164(corpo.whatsapp);
  var dor = limpa(corpo.dor, 200);
  var dorDetalhe = limpa(corpo.dor_detalhe, 800);
  var faturamento = limpa(corpo.faturamento, 60);
  var origem = limpa(corpo.origem, 60) || 'site';

  if (nome.length < 2 || empresa.length < 2 || !telefone) {
    return res.status(400).json({ ok: false, erro: 'campos_obrigatorios' });
  }

  var gancho = dor + (dorDetalhe ? ' — ' + dorDetalhe : '');
  var faixa = faixaDe(faturamento);

  var valores = {
    name: [{ value: empresa }],
    contato_nome: [{ value: nome }],
    whatsapp: [{ original_phone_number: telefone }],
    gancho_comercial: [{ value: gancho.slice(0, 900) }],
    fonte_dados: [{ value: 'Formulário do site — ' + origem }],
    estado_prospeccion: [{ option: OPCAO.estado_respondeu }],
    resultado_ultimo_contacto: [{ option: OPCAO.resultado_interessado }],
    /* canal_primer_contacto e tanda_origen ficam vazios de proposito: nenhuma
       das opcoes existentes no Attio descreve "veio pelo site", e preencher
       com Presencial seria dado errado. Criada a opcao, e so voltar aqui. */
    tipo_registro: [{ option: OPCAO.tipo_prospecto }],
    oferta_objetivo: [{ option: OPCAO.oferta_a_definir }],
    objecion_principal: [{ option: OPCAO.objecao_nenhuma }],
    prioridad_imv: [{ option: faixa ? OPCAO.prioridade[faixa.prioridade] : OPCAO.prioridade.sem_avaliar }],
    fecha_prospeccion: [{ value: hoje() }],
    ultimo_toque: [{ value: hoje() }],
    proximo_follow_up: [{ value: hoje() }],   // contato na mesma noite
    toque_numero: [{ value: 1 }]
  };

  /* só envia quando veio preenchido, para não apagar um valor já existente no PATCH */
  if (email) {
    valores.email_contato = [{ value: email }];
  }
  if (faixa) {
    valores.faturamento_mensal = [{ option: faixa.opcao }];
  }

  /* Numa empresa que já existe (prospecção da Isabella, por exemplo) só
     acrescentamos o que o lead acabou de declarar. Estado do funil, pitch,
     origem e contagem de toques ficam como estão — o formulário não pode
     rebaixar quem já estava em "Reunião agendada". O resto vai todo na nota. */
  var valoresUpdate = {
    contato_nome: valores.contato_nome,
    whatsapp: valores.whatsapp,
    ultimo_toque: valores.ultimo_toque,
    proximo_follow_up: valores.proximo_follow_up
  };
  if (email) valoresUpdate.email_contato = valores.email_contato;
  if (faixa) valoresUpdate.faturamento_mensal = valores.faturamento_mensal;

  try {
    var existente = await procuraPorWhatsapp(telefone, chave);
    var registro;

    if (existente) {
      registro = await chamaAttio(
        '/objects/companies/records/' + existente,
        'PATCH',
        { data: { values: valoresUpdate } },
        chave
      );
    } else {
      registro = await chamaAttio(
        '/objects/companies/records',
        'POST',
        { data: { values: valores } },
        chave
      );
    }

    var recordId = registro && registro.data && registro.data.id
      ? registro.data.id.record_id
      : existente;

    if (!recordId) throw new Error('Attio nao devolveu record_id');

    /* A partir daqui o lead já está salvo. Nada abaixo pode derrubar a resposta. */

    var extras = [];

    var linhas = [
      'Lead capturado no formulário de contato do site.',
      '',
      'Contato: ' + nome,
      'Empresa: ' + empresa,
      'WhatsApp: ' + telefone,
      email ? 'E-mail: ' + email : null,
      'Dor declarada: ' + dor,
      dorDetalhe ? 'Nas palavras dele: "' + dorDetalhe + '"' : null,
      'Faturamento mensal: ' + (faturamento || 'não informado'),
      '',
      'Origem: ' + origem,
      'Enviado em: ' + (limpa(corpo.enviado_em, 40) || new Date().toISOString()),
      '',
      'Próximo passo: chamar no WhatsApp com dois horários para o diagnóstico.'
    ].filter(Boolean);

    extras.push(
      chamaAttio('/notes', 'POST', {
        data: {
          parent_object: 'companies',
          parent_record_id: recordId,
          title: 'Site — ' + empresa + ' (' + (dor || 'sem dor declarada') + ')',
          format: 'plaintext',
          content: linhas.join('\n')
        }
      }, chave).catch(function (e) {
        console.error('falha ao criar a nota:', e.message);
      })
    );

    await Promise.all(extras);

    return res.status(200).json({ ok: true, record_id: recordId, novo: !existente });

  } catch (e) {
    console.error('erro ao gravar lead no Attio:', e.message);
    // 502 faz o formulário guardar o lead no aparelho e reenviar sozinho.
    // O diagnóstico fica só no log do Vercel: a mensagem do Attio pode
    // trazer de volta o corpo da requisição, e isso não desce ao navegador.
    return res.status(502).json({ ok: false, erro: 'attio_indisponivel' });
  }
};
