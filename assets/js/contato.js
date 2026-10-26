/* Captacao de contato: convite ao diagnostico financeiro gratuito.
   Nasceu como anuncio da feira de 2026, com data de validade e abertura em
   toda visita. Agora e permanente, entao o ritmo mudou: aparece uma vez por
   pessoa e so depois que o visitante demonstrou interesse.

   Fica em arquivo proprio porque a CSP exige script-src 'self' — nada aqui
   pode voltar para dentro do index.html. */
(function(){
  'use strict';

  var ENDPOINT = '/api/lead';
  var CHAVE_ENVIADO = 'imv-contato-enviado';
  var CHAVE_DISPENSA = 'imv-contato-dispensa';
  var CHAVE_FILA = 'imv-contato-fila';

  /* Nao abre de cara: espera o visitante ler. O que vier primeiro, rolar um
     terco da pagina ou meio minuto parado nela. */
  var LIMIAR_ROLAGEM = 0.35;
  var ESPERA_MS = 30000;
  var SILENCIO_DIAS = 30;   // quem fechou sem preencher nao ve de novo por um mes

  var overlay = document.getElementById('contato-overlay');
  if (!overlay) return;

  function jaDeixouContato(){
    try { return localStorage.getItem(CHAVE_ENVIADO) === '1'; } catch (e) { return false; }
  }

  function dispensadoHaPouco(){
    try {
      var quando = parseInt(localStorage.getItem(CHAVE_DISPENSA) || '0', 10);
      return quando > 0 && (Date.now() - quando) < SILENCIO_DIAS * 86400000;
    } catch (e) { return false; }
  }

  if (jaDeixouContato() || dispensadoHaPouco()) return;

  var card = document.getElementById('contato-card');
  var form = document.getElementById('contato-form');
  var btn = document.getElementById('contato-btn');
  var ultimoFoco = null;

  function marca(chave){
    try { localStorage.setItem(chave, '1'); } catch (e) {}
  }

  function abre(){
    ultimoFoco = document.activeElement;
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function(){ overlay.classList.add('is-open'); });
    setTimeout(function(){ document.getElementById('contato-nome').focus(); }, 240);
  }

  function fecha(){
    if (!jaDeixouContato()) {
      try { localStorage.setItem(CHAVE_DISPENSA, String(Date.now())); } catch (e) {}
    }
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(function(){ overlay.hidden = true; }, 220);
    if (ultimoFoco && ultimoFoco.focus) ultimoFoco.focus();
  }

  document.getElementById('contato-fechar').addEventListener('click', fecha);
  document.getElementById('contato-ok-btn').addEventListener('click', fecha);
  overlay.addEventListener('mousedown', function(ev){
    if (ev.target === overlay) fecha();
  });
  document.addEventListener('keydown', function(ev){
    if (ev.key === 'Escape' && !overlay.hidden) fecha();
    /* mantém o foco dentro do diálogo */
    if (ev.key === 'Tab' && !overlay.hidden) {
      var focaveis = card.querySelectorAll('button, input, select, a[href]');
      var vivos = [];
      for (var i = 0; i < focaveis.length; i++) {
        if (focaveis[i].offsetParent !== null) vivos.push(focaveis[i]);
      }
      if (!vivos.length) return;
      var primeiro = vivos[0], ultimo = vivos[vivos.length - 1];
      if (ev.shiftKey && document.activeElement === primeiro) { ev.preventDefault(); ultimo.focus(); }
      else if (!ev.shiftKey && document.activeElement === ultimo) { ev.preventDefault(); primeiro.focus(); }
    }
  });

  /* contexto do QR: imv.solutions/?src=cracha&dia=21&por=isa */
  function contexto(){
    var q = {};
    try { new URLSearchParams(location.search).forEach(function(v, k){ q[k] = v; }); } catch (e) {}
    return { origem: q.src || 'site' };
  }

  function digitos(s){ return String(s || '').replace(/\D/g, ''); }

  function valida(){
    var ok = true;
    var nome = document.getElementById('contato-nome').value.trim();
    var tel = digitos(document.getElementById('contato-telefone').value);
    var email = document.getElementById('contato-email').value.trim();
    var empresa = document.getElementById('contato-empresa').value.trim();
    var dor = document.getElementById('contato-dor').value;

    var contatoOk = nome.length >= 2 && tel.length >= 10 && tel.length <= 13;
    var dadosOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && empresa.length >= 2;

    document.getElementById('contato-erro-contato').hidden = contatoOk;
    document.getElementById('contato-erro-dados').hidden = dadosOk;
    document.getElementById('contato-erro-dor').hidden = !!dor;

    if (!contatoOk || !dadosOk || !dor) ok = false;
    return ok;
  }

  function coleta(){
    var ctx = contexto();
    return {
      nome: document.getElementById('contato-nome').value.trim(),
      whatsapp: digitos(document.getElementById('contato-telefone').value),
      email: document.getElementById('contato-email').value.trim(),
      empresa: document.getElementById('contato-empresa').value.trim(),
      dor: document.getElementById('contato-dor').value,
      dor_detalhe: '',
      faturamento: document.getElementById('contato-faturamento').value,
      origem: ctx.origem,
      enviado_em: new Date().toISOString()
    };
  }

  function envia(lead){
    return fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead)
    }).then(function(r){
      if (!r.ok) throw new Error('http ' + r.status);
      return r;
    });
  }

  /* sem sinal: guarda e reenvia sozinho depois */
  function leFila(){
    try { return JSON.parse(localStorage.getItem(CHAVE_FILA) || '[]') || []; }
    catch (e) { return []; }
  }
  function guardaFila(l){
    try { localStorage.setItem(CHAVE_FILA, JSON.stringify(l)); } catch (e) {}
  }
  function escoaFila(){
    var lista = leFila();
    if (!lista.length) return;
    var restantes = [];
    Promise.all(lista.map(function(lead){
      return envia(lead).catch(function(){ restantes.push(lead); });
    })).then(function(){ guardaFila(restantes); });
  }
  window.addEventListener('online', escoaFila);
  escoaFila();

  function sucesso(lead, offline){
    marca(CHAVE_ENVIADO);
    document.getElementById('contato-conteudo').hidden = true;
    document.getElementById('contato-ok').hidden = false;
    document.getElementById('contato-ok-titulo').textContent =
      'Recebido, ' + lead.nome.split(' ')[0] + '!';
    if (offline) {
      document.getElementById('contato-ok-texto').textContent =
        'Sem sinal agora — seus dados ficaram salvos e são enviados sozinhos quando a conexão voltar. A Isabella entra em contato pelo WhatsApp.';
    }
    card.scrollTop = 0;
  }

  form.addEventListener('submit', function(ev){
    ev.preventDefault();
    if (document.getElementById('contato-hp').value) return;   // bot
    if (!valida()) return;

    var lead = coleta();
    btn.disabled = true;
    btn.textContent = 'Enviando…';

    envia(lead)
      .then(function(){ sucesso(lead, false); })
      .catch(function(){
        var l = leFila();
        l.push(lead);
        guardaFila(l);
        sucesso(lead, true);
      });
  });

  /* Um gatilho so: o primeiro que acontecer desarma o outro. */
  (function arma(){
    var jaAbriu = false;

    function dispara(){
      if (jaAbriu) return;
      jaAbriu = true;
      clearTimeout(relogio);
      window.removeEventListener('scroll', aoRolar);
      abre();
    }

    function aoRolar(){
      var alcance = document.documentElement.scrollHeight - window.innerHeight;
      if (alcance <= 0 || (window.scrollY / alcance) >= LIMIAR_ROLAGEM) dispara();
    }

    var relogio = setTimeout(dispara, ESPERA_MS);
    window.addEventListener('scroll', aoRolar, { passive: true });

    /* Quem volta pelo botao "voltar" ou recarrega no meio da pagina chega ja
       rolado, e o navegador restaura a posicao antes deste script existir.
       Sem esta leitura inicial ele nao veria evento nenhum ate rolar de novo. */
    aoRolar();
  })();
})();
