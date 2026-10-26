/* Campanha FE26 (Feira do Empreendedor 2026) - anuncio + formulario de lead.
   Estava inline no index.html; saiu para arquivo proprio para que a CSP
   possa exigir script-src self, sem unsafe-inline. */
(function(){
  'use strict';

  var ENDPOINT = '/api/lead-fe26';
  var CHAVE_ENVIADO = 'imv-fe26-enviado';
  var CHAVE_FILA = 'imv-fe26-fila';
  var ATRASO = 900;   // ms antes de aparecer, para o visitante ver que chegou na IMV
  var ATE = '2026-10-23';   // rede de segurança: depois desta data o anúncio não aparece mais

  var overlay = document.getElementById('fe26-overlay');
  if (!overlay) return;

  var agora = new Date();
  var limite = new Date(ATE + 'T23:59:59');
  if (agora > limite) return;

  var card = document.getElementById('fe26-card');
  var form = document.getElementById('fe26-form');
  var btn = document.getElementById('fe26-btn');
  var ultimoFoco = null;

  function marca(chave){
    try { localStorage.setItem(chave, '1'); } catch (e) {}
  }

  /* Durante a feira o anúncio abre em TODA visita, inclusive para quem já
     deixou o contato. Decisão comercial: são poucos dias e o alcance vale
     mais que o incômodo. Para voltar a mostrar uma vez por pessoa, reponha:
       try { if (localStorage.getItem(CHAVE_ENVIADO) === '1') return; } catch (e) {} */

  function abre(){
    ultimoFoco = document.activeElement;
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function(){ overlay.classList.add('is-open'); });
    setTimeout(function(){ document.getElementById('fe26-nome').focus(); }, 240);
  }

  function fecha(){
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(function(){ overlay.hidden = true; }, 220);
    if (ultimoFoco && ultimoFoco.focus) ultimoFoco.focus();
  }

  document.getElementById('fe26-fechar').addEventListener('click', fecha);
  document.getElementById('fe26-ok-btn').addEventListener('click', fecha);
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
    return {
      origem: q.src || 'site',
      dia: q.dia || '',
      captou: q.por || ''
    };
  }

  function digitos(s){ return String(s || '').replace(/\D/g, ''); }

  function valida(){
    var ok = true;
    var nome = document.getElementById('fe26-nome').value.trim();
    var tel = digitos(document.getElementById('fe26-telefone').value);
    var email = document.getElementById('fe26-email').value.trim();
    var empresa = document.getElementById('fe26-empresa').value.trim();
    var dor = document.getElementById('fe26-dor').value;

    var contatoOk = nome.length >= 2 && tel.length >= 10 && tel.length <= 13;
    var dadosOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && empresa.length >= 2;

    document.getElementById('fe26-erro-contato').hidden = contatoOk;
    document.getElementById('fe26-erro-dados').hidden = dadosOk;
    document.getElementById('fe26-erro-dor').hidden = !!dor;

    if (!contatoOk || !dadosOk || !dor) ok = false;
    return ok;
  }

  function coleta(){
    var ctx = contexto();
    return {
      nome: document.getElementById('fe26-nome').value.trim(),
      whatsapp: digitos(document.getElementById('fe26-telefone').value),
      email: document.getElementById('fe26-email').value.trim(),
      empresa: document.getElementById('fe26-empresa').value.trim(),
      dor: document.getElementById('fe26-dor').value,
      dor_detalhe: '',
      faturamento: document.getElementById('fe26-faturamento').value,
      origem: ctx.origem,
      dia_feira: ctx.dia,
      captado_por: ctx.captou,
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
    document.getElementById('fe26-conteudo').hidden = true;
    document.getElementById('fe26-ok').hidden = false;
    document.getElementById('fe26-ok-titulo').textContent =
      'Recebido, ' + lead.nome.split(' ')[0] + '!';
    if (offline) {
      document.getElementById('fe26-ok-texto').textContent =
        'Sem sinal agora — seus dados ficaram salvos e são enviados sozinhos quando a conexão voltar. A Isabella entra em contato pelo WhatsApp.';
    }
    card.scrollTop = 0;
  }

  form.addEventListener('submit', function(ev){
    ev.preventDefault();
    if (document.getElementById('fe26-hp').value) return;   // bot
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

  setTimeout(abre, ATRASO);
})();
