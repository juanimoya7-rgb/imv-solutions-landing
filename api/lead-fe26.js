/**
 * POST /api/lead-fe26
 *
 * Recebe o formulário de /fe26 (QR do cordão na Feira do Empreendedor 2026)
 * e grava o lead no Attio: cria ou atualiza a empresa em `companies`,
 * adiciona à lista "FE26 - Feira do Empreendedor" e deixa uma nota com
 * tudo o que o formulário capturou.
 *
 * Variável de ambiente obrigatória no Vercel:
 *   ATTIO_API_KEY   — token da API do Attio (Settings → Developers → Access tokens)
 *                     Escopo mínimo: record (read+write), list_entry (write), note (write).
 *
 * A chave nunca chega ao navegador: só esta função a lê.
 */

'use strict';

var ATTIO = 'https://api.attio.com/v2';
var LISTA_FE26 = 'f24522cc-0ff5-4036-ac16-7dfbb6034867';

/* IDs das opções já existentes no workspace da IMV. */
var OPCAO = {
  estado_respondeu: '867abe63-a105-4c0c-ae94-902757e291b5',  // Respondio
  resultado_interessado: '0aff20b0-8362-4e27-b268-46a3663ff571',  // Respondeu - interessado
  canal_presencial: 'a250113d-bdaf-4fc5-92a0-9c66820cc009',  // Presencial
  tanda_presencial: '59c9cc41-39e8-4a7c-8a12-d48d2efb9e7a',  // Presencial
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

/* Faturamento declarado → prioridade comercial, para a fila da noite.
   As chaves são exatamente os values do <select> em /fe26. Comparação exata:
   cada faixa traz dois números no texto, então busca por trecho erra o tramo. */
var PRIORIDADE_POR_FATURAMENTO = {
  'Até R$ 20 mil': 'exploratoria',
  'R$ 20 mil a R$ 50 mil': 'media',
  'R$ 50 mil a R$ 100 mil': 'alta',
  'R$ 100 mil a R$ 300 mil': 'maxima',
  'Acima de R$ 300 mil': 'maxima'
};

function prioridadePor(faturamento) {
  var nivel = PRIORIDADE_POR_FATURAMENTO[String(faturamento || '').trim()];
  return OPCAO.prioridade[nivel || 'sem_avaliar'];
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

/* Procura empresa já existente pelo WhatsApp, para não duplicar o registro. */
function procuraPorWhatsapp(telefone, chave) {
  return chamaAttio('/objects/companies/records/query', 'POST', {
    filter: { whatsapp: { original_phone_number: telefone } },
    limit: 1
  }, chave).then(function (r) {
    var lista = (r && r.data) || [];
    return lista.length ? lista[0].id.record_id : null;
  }).catch(function () {
    return null;   // busca falhou: segue como lead novo, melhor duplicar que perder
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, erro: 'metodo_nao_permitido' });
  }

  var chave = process.env.ATTIO_API_KEY;
  if (!chave) {
    console.error('ATTIO_API_KEY ausente nas variáveis de ambiente');
    return res.status(500).json({ ok: false, erro: 'config_ausente' });
  }

  var corpo = req.body;
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
  var origem = limpa(corpo.origem, 60) || 'qr-cracha';
  var diaFeira = limpa(corpo.dia_feira, 10);
  var captadoPor = limpa(corpo.captado_por, 40);

  if (nome.length < 2 || empresa.length < 2 || !telefone) {
    return res.status(400).json({ ok: false, erro: 'campos_obrigatorios' });
  }

  var gancho = dor + (dorDetalhe ? ' — ' + dorDetalhe : '');

  var valores = {
    name: [{ value: empresa }],
    contato_nome: [{ value: nome }],
    whatsapp: [{ original_phone_number: telefone }],
    gancho_comercial: [{ value: gancho.slice(0, 900) }],
    fonte_dados: [{ value: 'Formulário /fe26 — ' + origem + (diaFeira ? ' (dia ' + diaFeira + ')' : '') }],
    estado_prospeccion: [{ option: OPCAO.estado_respondeu }],
    resultado_ultimo_contacto: [{ option: OPCAO.resultado_interessado }],
    canal_primer_contacto: [{ option: OPCAO.canal_presencial }],
    tanda_origen: [{ option: OPCAO.tanda_presencial }],
    tipo_registro: [{ option: OPCAO.tipo_prospecto }],
    oferta_objetivo: [{ option: OPCAO.oferta_a_definir }],
    objecion_principal: [{ option: OPCAO.objecao_nenhuma }],
    prioridad_imv: [{ option: prioridadePor(faturamento) }],
    fecha_prospeccion: [{ value: hoje() }],
    ultimo_toque: [{ value: hoje() }],
    proximo_follow_up: [{ value: hoje() }],   // contato na mesma noite
    toque_numero: [{ value: 1 }]
  };

  /* só envia o e-mail quando veio preenchido, para não apagar um já existente no PATCH */
  if (email) {
    valores.email_contato = [{ value: email }];
  }

  try {
    var existente = await procuraPorWhatsapp(telefone, chave);
    var registro;

    if (existente) {
      registro = await chamaAttio(
        '/objects/companies/records/' + existente,
        'PATCH',
        { data: { values: valores } },
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

    extras.push(
      chamaAttio('/lists/' + LISTA_FE26 + '/entries', 'POST', {
        data: {
          parent_object: 'companies',
          parent_record_id: recordId,
          entry_values: {}
        }
      }, chave).catch(function (e) {
        console.error('falha ao adicionar na lista FE26:', e.message);
      })
    );

    var linhas = [
      'Lead capturado no formulário /fe26 (Feira do Empreendedor 2026).',
      '',
      'Contato: ' + nome,
      'Empresa: ' + empresa,
      'WhatsApp: ' + telefone,
      email ? 'E-mail: ' + email : null,
      'Dor declarada: ' + dor,
      dorDetalhe ? 'Nas palavras dele: "' + dorDetalhe + '"' : null,
      'Faturamento mensal: ' + (faturamento || 'não informado'),
      '',
      'Origem do QR: ' + origem,
      diaFeira ? 'Dia da feira: ' + diaFeira + '/10' : null,
      captadoPor ? 'Captado por: ' + captadoPor : null,
      'Enviado em: ' + (limpa(corpo.enviado_em, 40) || new Date().toISOString()),
      '',
      'Próximo passo: chamar no WhatsApp hoje à noite com dois horários para o diagnóstico.'
    ].filter(Boolean);

    extras.push(
      chamaAttio('/notes', 'POST', {
        data: {
          parent_object: 'companies',
          parent_record_id: recordId,
          title: 'FE26 — ' + empresa + ' (' + (dor || 'sem dor declarada') + ')',
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
    // attio_status/detalhe são para diagnóstico: o visitante nunca os vê,
    // o formulário só olha o código HTTP.
    return res.status(502).json({
      ok: false,
      erro: 'attio_indisponivel',
      attio_status: e.status || null,
      detalhe: String(e.message || '').slice(0, 200)
    });
  }
};
