/* =========================================================
   Gera o fragmento HTML da seção IMV Vision da landing.
   Todo número sai do dataset verificado em dados.mjs.
   ========================================================= */

import { readFileSync, writeFileSync } from "node:fs";
import { construir, verificar, CATEGORIAS_DESPESA } from "./dados.mjs";

const d = construir();
const erros = verificar(d);
if (erros.length) {
  console.error("dataset inconsistente:\n" + erros.join("\n"));
  process.exit(1);
}

/* ---------- Formatos brasileiros ---------- */
const MENOS = "−"; // sinal de menos tipográfico
const mil = (n) => Math.round(Math.abs(n)).toLocaleString("pt-BR");
const brl = (n) => (n < 0 ? MENOS : "") + "R$ " + mil(n);
const num = (n) => (n < 0 ? MENOS : "") + mil(n);
const dec = (n, c = 1) => (n < 0 ? MENOS : "") + Math.abs(n).toFixed(c).replace(".", ",");
const pct = (v, c = 1) => dec(v * 100, c) + "%";
const sinalPct = (v, c = 1) =>
  (Math.abs(v * 100).toFixed(c) === (0).toFixed(c) ? "" : v >= 0 ? "+" : MENOS) +
  Math.abs(v * 100).toFixed(c).replace(".", ",") +
  "%";
const sinalPp = (v, c = 1) => (v >= 0 ? "+" : MENOS) + Math.abs(v).toFixed(c).replace(".", ",") + " p.p.";
const sinalBrl = (n) => (n >= 0 ? "+" : MENOS) + "R$ " + mil(n);

const PAL = { receita: "#2C5691", despesa: "#B35C2E", lucro: "#00968F", grade: "#DFE5EC", eixo: "#8493A5" };

const m = d.meses;
const ref = d.ref;
const ant = d.anterior;
const jun = m[8];

/* =========================================================
   Gráficos
   ========================================================= */

/* --- Linhas: evolução de receita, despesas e lucro --- */
function graficoEvolucao() {
  const W = 920, H = 318;
  const x0 = 64, x1 = 904, y0 = 20, y1 = 252;
  const yMax = 480000, passo = 120000;
  const px = (i) => x0 + (i * (x1 - x0)) / (m.length - 1);
  const py = (v) => y1 - (v / yMax) * (y1 - y0);

  const series = [
    { chave: "receitaLiquida", nome: "Receita líquida", cor: PAL.receita },
    { chave: "despesasTotais", nome: "Despesas totais", cor: PAL.despesa },
    { chave: "lucroLiquido", nome: "Lucro líquido", cor: PAL.lucro },
  ];

  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="vg-evo-t">
      <title id="vg-evo-t">Receita líquida, despesas totais e lucro líquido mês a mês, de out/2025 a set/2026</title>`;

  for (let v = 0; v <= yMax; v += passo) {
    s += `\n      <line x1="${x0}" y1="${py(v).toFixed(1)}" x2="${x1}" y2="${py(v).toFixed(1)}" stroke="${PAL.grade}" stroke-width="1"/>`;
    s += `\n      <text x="${x0 - 10}" y="${(py(v) + 4).toFixed(1)}" text-anchor="end" class="vsvg__tick">${mil(v / 1000)}</text>`;
  }
  s += `\n      <text x="${x0 - 10}" y="${y0 - 6}" text-anchor="end" class="vsvg__unit">R$ mil</text>`;

  m.forEach((mes, i) => {
    s += `\n      <text x="${px(i).toFixed(1)}" y="${y1 + 20}" text-anchor="middle" class="vsvg__tick">${mes.rotulo}</text>`;
  });

  series.forEach((se) => {
    const pts = m.map((mes, i) => `${px(i).toFixed(1)},${py(mes[se.chave]).toFixed(1)}`).join(" ");
    s += `\n      <polyline points="${pts}" fill="none" stroke="${se.cor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
  });

  series.forEach((se) => {
    const ultimo = m[m.length - 1][se.chave];
    const cx = px(m.length - 1), cy = py(ultimo);
    s += `\n      <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="4.5" fill="${se.cor}" stroke="#fff" stroke-width="2"/>`;
    s += `\n      <text x="${(cx - 8).toFixed(1)}" y="${(cy - 10).toFixed(1)}" text-anchor="end" class="vsvg__val" fill="${se.cor}">${brl(ultimo)}</text>`;
  });

  /* Faixas de leitura: um tooltip nativo por mês, com as três séries. */
  const larg = (x1 - x0) / (m.length - 1);
  m.forEach((mes, i) => {
    s += `\n      <rect x="${(px(i) - larg / 2).toFixed(1)}" y="${y0}" width="${larg.toFixed(1)}" height="${y1 - y0}" fill="transparent">`;
    s += `<title>${mes.rotulo} · Receita líquida ${brl(mes.receitaLiquida)} · Despesas totais ${brl(mes.despesasTotais)} · Lucro líquido ${brl(mes.lucroLiquido)}</title></rect>`;
  });

  s += `\n      <line x1="${x0}" y1="${y1}" x2="${x1}" y2="${y1}" stroke="${PAL.eixo}" stroke-width="1"/>\n    </svg>`;
  return s;
}

/* --- Barras: fluxo de caixa líquido mês a mês --- */
function graficoFluxo() {
  const W = 440, H = 250;
  const x0 = 46, x1 = 428, y0 = 26, y1 = 198;
  const vMax = 60000, vMin = -20000;
  const py = (v) => y1 - ((v - vMin) / (vMax - vMin)) * (y1 - y0);
  const zero = py(0);
  const passoX = (x1 - x0) / m.length;
  const larg = passoX - 10;

  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="vg-flx-t">
      <title id="vg-flx-t">Fluxo de caixa líquido por mês, de out/2025 a set/2026</title>`;

  for (let v = vMin; v <= vMax; v += 20000) {
    s += `\n      <line x1="${x0}" y1="${py(v).toFixed(1)}" x2="${x1}" y2="${py(v).toFixed(1)}" stroke="${PAL.grade}" stroke-width="1"/>`;
    s += `\n      <text x="${x0 - 8}" y="${(py(v) + 4).toFixed(1)}" text-anchor="end" class="vsvg__tick">${v < 0 ? MENOS : ""}${mil(v / 1000)}</text>`;
  }
  s += `\n      <text x="${x0 - 8}" y="${y0 - 13}" text-anchor="end" class="vsvg__unit">R$ mil</text>`;

  m.forEach((mes, i) => {
    const x = x0 + i * passoX + 5;
    const pos = mes.fluxoLiquido >= 0;
    const topo = pos ? py(mes.fluxoLiquido) : zero;
    const alt = Math.abs(py(mes.fluxoLiquido) - zero);
    const cor = pos ? PAL.lucro : PAL.despesa;
    const r = Math.min(4, alt);
    s += `\n      <path d="${barra(x, topo, larg, Math.max(alt, 1.5), r, pos)}" fill="${cor}">`;
    s += `<title>${mes.rotulo} · Fluxo de caixa líquido ${brl(mes.fluxoLiquido)} · Saldo no fim do mês ${brl(mes.saldoCaixa)}</title></path>`;
    if (i % 2 === 0) {
      s += `\n      <text x="${(x + larg / 2).toFixed(1)}" y="${y1 + 36}" text-anchor="middle" class="vsvg__tick">${mes.rotulo}</text>`;
    }
  });

  /* Rótulos diretos: o único mês negativo e o mês de referência. */
  const iNeg = m.findIndex((x) => x.fluxoLiquido < 0);
  [iNeg].forEach((i) => {
    const mes = m[i];
    const ultimo = i === m.length - 1;
    /* O ultimo rotulo encosta na borda: ancora pela direita em vez de centrar. */
    const x = ultimo ? x0 + i * passoX + 5 + larg : x0 + i * passoX + 5 + larg / 2;
    const pos = mes.fluxoLiquido >= 0;
    const y = pos ? py(mes.fluxoLiquido) - 7 : zero + Math.abs(py(mes.fluxoLiquido) - zero) + 13;
    s += `\n      <text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${ultimo ? "end" : "middle"}" class="vsvg__val" fill="${pos ? PAL.lucro : PAL.despesa}">${brl(mes.fluxoLiquido)}</text>`;
  });

  s += `\n      <line x1="${x0}" y1="${zero.toFixed(1)}" x2="${x1}" y2="${zero.toFixed(1)}" stroke="${PAL.eixo}" stroke-width="1"/>\n    </svg>`;
  return s;
}

/* Barra com as duas pontas do lado do dado arredondadas. */
function barra(x, y, w, h, r, paraCima) {
  r = Math.max(0, Math.min(r, w / 2, h));
  return paraCima
    ? `M${x} ${(y + h).toFixed(1)} L${x} ${(y + r).toFixed(1)} Q${x} ${y.toFixed(1)} ${x + r} ${y.toFixed(1)} L${x + w - r} ${y.toFixed(1)} Q${x + w} ${y.toFixed(1)} ${x + w} ${(y + r).toFixed(1)} L${x + w} ${(y + h).toFixed(1)} Z`
    : `M${x} ${y.toFixed(1)} L${x} ${(y + h - r).toFixed(1)} Q${x} ${(y + h).toFixed(1)} ${x + r} ${(y + h).toFixed(1)} L${x + w - r} ${(y + h).toFixed(1)} Q${x + w} ${(y + h).toFixed(1)} ${x + w} ${(y + h - r).toFixed(1)} L${x + w} ${y.toFixed(1)} Z`;
}

/* --- Linha: saldo de caixa no fim do mês --- */
function graficoSaldo() {
  const W = 440, H = 250;
  const x0 = 46, x1 = 428, y0 = 26, y1 = 198;
  const yMax = 1200000;
  const px = (i) => x0 + (i * (x1 - x0)) / (m.length - 1);
  const py = (v) => y1 - (v / yMax) * (y1 - y0);

  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="vg-sld-t">
      <title id="vg-sld-t">Saldo de caixa no fim de cada mês, de out/2025 a set/2026</title>`;

  for (let v = 0; v <= yMax; v += 400000) {
    s += `\n      <line x1="${x0}" y1="${py(v).toFixed(1)}" x2="${x1}" y2="${py(v).toFixed(1)}" stroke="${PAL.grade}" stroke-width="1"/>`;
    s += `\n      <text x="${x0 - 8}" y="${(py(v) + 4).toFixed(1)}" text-anchor="end" class="vsvg__tick">${mil(v / 1000)}</text>`;
  }
  s += `\n      <text x="${x0 - 8}" y="${y0 - 13}" text-anchor="end" class="vsvg__unit">R$ mil</text>`;

  const pts = m.map((mes, i) => `${px(i).toFixed(1)},${py(mes.saldoCaixa).toFixed(1)}`).join(" ");
  s += `\n      <polyline points="${pts}" fill="none" stroke="${PAL.receita}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;

  m.forEach((mes, i) => {
    s += `\n      <circle cx="${px(i).toFixed(1)}" cy="${py(mes.saldoCaixa).toFixed(1)}" r="9" fill="transparent"><title>${mes.rotulo} · Saldo de caixa ${brl(mes.saldoCaixa)}</title></circle>`;
    if (i % 2 === 0) {
      s += `\n      <text x="${px(i).toFixed(1)}" y="${y1 + 36}" text-anchor="middle" class="vsvg__tick">${mes.rotulo}</text>`;
    }
  });

  const cx = px(m.length - 1), cy = py(ref.saldoCaixa);
  s += `\n      <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="4.5" fill="${PAL.receita}" stroke="#fff" stroke-width="2"/>`;
  s += `\n      <text x="${(cx - 6).toFixed(1)}" y="${(cy + 17).toFixed(1)}" text-anchor="end" class="vsvg__val" fill="${PAL.receita}">${brl(ref.saldoCaixa)}</text>`;
  s += `\n      <line x1="${x0}" y1="${y1}" x2="${x1}" y2="${y1}" stroke="${PAL.eixo}" stroke-width="1"/>\n    </svg>`;
  return s;
}

/* --- Cascata do DRE --- */
const PASSOS_DRE = [
  ["Receita\nbruta", ref.receitaBruta, "total"],
  ["Deduções", -ref.deducoes, "menos"],
  ["Receita\nlíquida", ref.receitaLiquida, "total"],
  ["Custos\nvariáveis", -ref.custosVariaveis, "menos"],
  ["Lucro\nbruto", ref.lucroBruto, "total"],
  ["Despesas\noperacionais", -ref.despesasOperacionais, "menos"],
  ["EBITDA", ref.ebitda, "total"],
  ["Depre-\nciação", -ref.depreciacao, "menos"],
  ["Resultado\nfinanceiro", ref.resultadoFinanceiro, "mais"],
  ["Impostos\ns/ lucro", -ref.impostos.total, "menos"],
  ["Lucro\nlíquido", ref.lucroLiquido, "resultado"],
];

function graficoCascata() {
  const W = 920, H = 352;
  const x0 = 56, x1 = 904, y0 = 36, y1 = 272;
  const yMax = 480000;
  const py = (v) => y1 - (v / yMax) * (y1 - y0);
  const passoX = (x1 - x0) / PASSOS_DRE.length;
  const larg = passoX - 24;

  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="vg-dre-t">
      <title id="vg-dre-t">Caminho da receita bruta até o lucro líquido em setembro de 2026</title>`;

  for (let v = 0; v <= yMax; v += 120000) {
    s += `\n      <line x1="${x0}" y1="${py(v).toFixed(1)}" x2="${x1}" y2="${py(v).toFixed(1)}" stroke="${PAL.grade}" stroke-width="1"/>`;
    s += `\n      <text x="${x0 - 10}" y="${(py(v) + 4).toFixed(1)}" text-anchor="end" class="vsvg__tick">${mil(v / 1000)}</text>`;
  }
  s += `\n      <text x="${x0 - 10}" y="${y0 - 14}" text-anchor="end" class="vsvg__unit">R$ mil</text>`;

  let base = 0; // topo acumulado
  const topos = [];

  PASSOS_DRE.forEach(([rotulo, valor, tipo], i) => {
    const x = x0 + i * passoX + 12;
    let de, ate;
    if (tipo === "total" || tipo === "resultado") {
      de = 0; ate = valor; base = valor;
    } else if (tipo === "menos") {
      de = base + valor; ate = base; base = de;
    } else {
      de = base; ate = base + valor; base = ate;
    }
    const yTopo = py(Math.max(de, ate));
    const alt = Math.abs(py(de) - py(ate));
    const cor = tipo === "menos" ? PAL.despesa : tipo === "mais" || tipo === "resultado" ? PAL.lucro : PAL.receita;
    s += `\n      <path d="${barra(x, yTopo, larg, Math.max(alt, 2), 4, true)}" fill="${cor}">`;
    s += `<title>${rotulo.replace("\n", " ")} ${brl(valor)}</title></path>`;
    s += `\n      <text x="${(x + larg / 2).toFixed(1)}" y="${(yTopo - 8).toFixed(1)}" text-anchor="middle" class="vsvg__val" fill="${cor}">${num(valor)}</text>`;
    rotulo.split("\n").forEach((linha, k) => {
      s += `\n      <text x="${(x + larg / 2).toFixed(1)}" y="${y1 + 20 + k * 13}" text-anchor="middle" class="vsvg__cat">${linha}</text>`;
    });
    topos.push({ x, larg, yTopo, alt, tipo });
  });

  /* Ligações entre um passo e o seguinte */
  for (let i = 0; i < topos.length - 1; i++) {
    const a = topos[i], b = topos[i + 1];
    const yLig = b.tipo === "menos" || b.tipo === "mais" ? (a.tipo === "menos" ? a.yTopo : a.yTopo) : null;
    if (yLig === null) continue;
    s += `\n      <line x1="${(a.x + a.larg).toFixed(1)}" y1="${yLig.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${yLig.toFixed(1)}" stroke="${PAL.eixo}" stroke-width="1" opacity=".5"/>`;
  }

  s += `\n      <line x1="${x0}" y1="${y1}" x2="${x1}" y2="${y1}" stroke="${PAL.eixo}" stroke-width="1"/>\n    </svg>`;
  return s;
}

/* --- Barras horizontais em HTML (rubricas, clientes, pilares) --- */
function barraHtml(largura, cor = PAL.receita) {
  return `<span class="vbar"><span class="vbar__fill" style="width:${largura.toFixed(1)}%;background:${cor}"></span></span>`;
}

/* =========================================================
   Blocos de conteúdo
   ========================================================= */

const kpis = [
  {
    nome: "Receita líquida",
    valor: brl(ref.receitaLiquida),
    variacao: sinalPct(d.var.receitaLiquida),
    bom: d.var.receitaLiquida > 0,
    nota: "vs. agosto/2026",
  },
  {
    nome: "Despesas totais",
    valor: brl(ref.despesasTotais),
    variacao: sinalPct(d.var.despesasTotais),
    bom: d.var.despesasTotais < 0,
    nota: "custos variáveis + operacionais",
  },
  {
    nome: "Lucro líquido",
    valor: brl(ref.lucroLiquido),
    variacao: sinalPct(d.var.lucroLiquido),
    bom: d.var.lucroLiquido > 0,
    nota: "vs. agosto/2026",
  },
  {
    nome: "Margem líquida",
    valor: pct(ref.margemLiquida),
    variacao: sinalPp(d.var.margemLiquida),
    bom: d.var.margemLiquida > 0,
    nota: "variação em pontos percentuais",
  },
];

const ATENCAO = [
  ["alerta", "Margem líquida em queda", `${sinalPp((ref.margemLiquida - jun.margemLiquida) * 100)} em três meses fechados`],
  ["atencao", "Despesas crescendo acima da receita", `${sinalPp((d.crescDespesaTri - d.crescReceitaTri) * 100)} de diferença no trimestre`],
  ["oportunidade", "Prazo de recebimento acima do contratado", `${brl(Math.round(((ref.pmr - d.carteira.vencimentoMedioConcedido) / 30) * ref.receitaBruta))} parados em recebíveis`],
];

const CHIP = {
  alerta: ["Alerta", "Alerta"],
  atencao: ["Atenção", "Atenção"],
  oportunidade: ["Oportunidade", "Oportunidade"],
};

const insights = [
  {
    sev: "alerta",
    confianca: "alta",
    regra: "MARGEM_EM_QUEDA · v1.0.0",
    titulo: "A margem líquida recuou em três meses fechados seguidos",
    texto: `Entre junho e setembro de 2026 a margem líquida passou de ${pct(jun.margemLiquida)} para ${pct(ref.margemLiquida)}, uma queda de ${dec(Math.abs((ref.margemLiquida - jun.margemLiquida) * 100))} p.p. No mesmo intervalo a receita líquida cresceu ${pct(ref.receitaLiquida / jun.receitaLiquida - 1)}.`,
    evidencia: [
      ["Margem líquida · jun/2026", pct(jun.margemLiquida), ""],
      ["Margem líquida · set/2026", pct(ref.margemLiquida), sinalPp((ref.margemLiquida - jun.margemLiquida) * 100)],
      ["Receita líquida · set/2026", brl(ref.receitaLiquida), sinalPct(ref.receitaLiquida / jun.receitaLiquida - 1)],
    ],
    periodo: "jun/2026 a set/2026",
    base: `${mil(d.empresa.lancamentosMes)} lançamentos classificados no mês de referência`,
    recomendacao: "Comparar o ritmo de contratação do trimestre com a entrada de receita recorrente.",
  },
  {
    sev: "atencao",
    confianca: "alta",
    regra: "DESPESA_CRESCE_ACIMA_RECEITA · v1.0.0",
    titulo: "As despesas operacionais cresceram acima da receita no trimestre",
    texto: `No trimestre jul–set/2026 as despesas operacionais cresceram ${pct(d.crescDespesaTri)} contra o trimestre anterior, enquanto a receita bruta cresceu ${pct(d.crescReceitaTri)}. A diferença é de ${dec((d.crescDespesaTri - d.crescReceitaTri) * 100)} p.p.`,
    evidencia: [
      ["Despesas operacionais · jul–set", brl(d.triAtual.despesasOperacionais), sinalPct(d.crescDespesaTri)],
      ["Receita bruta · jul–set", brl(d.triAtual.receitaBruta), sinalPct(d.crescReceitaTri)],
      ["Despesas operacionais · abr–jun", brl(d.triAnterior.despesasOperacionais), ""],
    ],
    periodo: "abr/2026 a set/2026",
    base: "6 meses fechados · regime de competência",
    recomendacao: "Avaliar quais rubricas sustentam o aumento e quais são reversíveis no curto prazo.",
  },
  {
    sev: "atencao",
    confianca: "alta",
    regra: "CONCENTRACAO_CLIENTES · v1.0.0",
    titulo: `Um cliente responde por ${pct(d.clientes[0].fracao)} da receita`,
    texto: `Em setembro de 2026, o ${d.clientes[0].nome} respondeu por ${pct(d.clientes[0].fracao)} da receita bruta — mais do que os dois clientes seguintes somados (${pct(d.clientes[1].fracao + d.clientes[2].fracao)}). O Vision mostra a concentração; o que fazer com ela é decisão comercial.`,
    pareto: true,
    periodo: "set/2026",
    base: `${d.empresa.clientesAtivos} clientes ativos no mês`,
    recomendacao: "Definir um teto de participação por cliente para os próximos contratos.",
  },
  {
    sev: "atencao",
    confianca: "média",
    regra: "CICLO_FINANCEIRO_PIORANDO · v1.0.0",
    titulo: "O prazo médio de recebimento subiu ao longo do ano",
    texto: `O prazo médio de recebimento passou de ${m[0].pmr} para ${ref.pmr} dias entre out/2025 e set/2026, com o prazo de pagamento estável em ${ref.pmp} dias. O ciclo financeiro foi de ${m[0].ciclo} para ${ref.ciclo} dias.`,
    evidencia: [
      ["Prazo médio de recebimento", `${ref.pmr} dias`, `+${ref.pmr - m[0].pmr} dias`],
      ["Prazo médio de pagamento", `${ref.pmp} dias`, `${MENOS}${m[0].pmp - ref.pmp} dias`],
      ["Ciclo financeiro", `${ref.ciclo} dias`, `+${ref.ciclo - m[0].ciclo} dias`],
    ],
    periodo: "out/2025 a set/2026",
    base: "12 meses fechados · títulos emitidos e liquidados",
    recomendacao: "Verificar se o alongamento vem de clientes novos ou da régua de cobrança.",
  },
  {
    sev: "oportunidade",
    confianca: "alta",
    regra: "PRAZO_RECEBIMENTO_MELHORAVEL · v1.0.0",
    titulo: `${brl(Math.round(((ref.pmr - d.carteira.vencimentoMedioConcedido) / 30) * ref.receitaBruta))} parados entre o vencimento e o recebimento`,
    texto: `Os títulos de setembro venceram em média em ${d.carteira.vencimentoMedioConcedido} dias e foram recebidos em ${ref.pmr} dias: ${ref.pmr - d.carteira.vencimentoMedioConcedido} dias de diferença sobre o prazo que a própria empresa concede em contrato.`,
    evidencia: [
      ["Vencimento médio concedido", `${d.carteira.vencimentoMedioConcedido} dias`, ""],
      ["Prazo médio de recebimento", `${ref.pmr} dias`, `+${ref.pmr - d.carteira.vencimentoMedioConcedido} dias`],
      ["Contas a receber em aberto", brl(ref.contasReceber), ""],
    ],
    periodo: "set/2026",
    base: "títulos recebidos no mês · vencimento x liquidação",
    recomendacao: "Antecipar a régua de cobrança para antes do vencimento e medir o efeito em 60 dias.",
  },
  {
    sev: "oportunidade",
    confianca: "alta",
    regra: "REDUCAO_CUSTO_POSSIVEL · v1.0.0",
    titulo: "Comercial e marketing cresceu muito acima da própria receita",
    texto: `A rubrica Comercial e marketing fechou setembro em ${brl(ref.despesas.comercial)}, ${pct(ref.despesas.comercial / d.mediaCategoriaAnterior.comercial - 1)} acima da média do trimestre anterior, enquanto a receita bruta cresceu ${pct(ref.receitaBruta / ((m[6].receitaBruta + m[7].receitaBruta + m[8].receitaBruta) / 3) - 1)} na mesma comparação.`,
    evidencia: [
      ["Comercial e marketing · set/2026", brl(ref.despesas.comercial), sinalPct(ref.despesas.comercial / d.mediaCategoriaAnterior.comercial - 1)],
      ["Média abr–jun/2026", brl(d.mediaCategoriaAnterior.comercial), ""],
      ["Peso na despesa operacional", pct(ref.despesas.comercial / ref.despesasOperacionais), ""],
    ],
    periodo: "abr/2026 a set/2026",
    base: "rubrica classificada · regime de competência",
    recomendacao: "Revisar as três maiores linhas da rubrica antes do próximo ciclo de investimento.",
  },
];

const PLANO = [
  {
    titulo: "Revisar as três maiores linhas de Comercial e marketing",
    origem: "REDUCAO_CUSTO_POSSIVEL · set/2026",
    prioridade: "Alta",
    esforco: "Médio",
    kpi: "Margem líquida",
    prazo: "30/10/2026",
    status: "Em andamento",
  },
  {
    titulo: "Reavaliar o ritmo de contratações do trimestre",
    origem: "DESPESA_CRESCE_ACIMA_RECEITA · set/2026",
    prioridade: "Alta",
    esforco: "Médio",
    kpi: "EBITDA",
    prazo: "14/11/2026",
    status: "Em andamento",
  },
  {
    titulo: "Antecipar a régua de cobrança para antes do vencimento",
    origem: "PRAZO_RECEBIMENTO_MELHORAVEL · set/2026",
    prioridade: "Média",
    esforco: "Baixo",
    kpi: "Prazo médio de recebimento",
    prazo: "07/11/2026",
    status: "A fazer",
  },
  {
    titulo: "Definir teto de participação por cliente nos novos contratos",
    origem: "CONCENTRACAO_CLIENTES · set/2026",
    prioridade: "Alta",
    esforco: "Alto",
    kpi: "Receita bruta",
    prazo: "28/11/2026",
    status: "A fazer",
  },
];

const DRE_LINHAS = [
  ["Receita bruta", ref.receitaBruta, ant.receitaBruta, "forte"],
  ["(−) Deduções sobre a receita", -ref.deducoes, -ant.deducoes, ""],
  ["Receita líquida", ref.receitaLiquida, ant.receitaLiquida, "forte"],
  ["(−) Custos variáveis", -ref.custosVariaveis, -ant.custosVariaveis, ""],
  ["Lucro bruto", ref.lucroBruto, ant.lucroBruto, "forte"],
  ["(−) Despesas operacionais", -ref.despesasOperacionais, -ant.despesasOperacionais, ""],
  ["EBITDA", ref.ebitda, ant.ebitda, "forte"],
  ["(−) Depreciação e amortização", -ref.depreciacao, -ant.depreciacao, ""],
  ["(+/−) Resultado financeiro", ref.resultadoFinanceiro, ant.resultadoFinanceiro, ""],
  ["(−) IRPJ e CSLL", -ref.impostos.total, -ant.impostos.total, ""],
  ["Lucro líquido", ref.lucroLiquido, ant.lucroLiquido, "resultado"],
];

const ORCADO_LINHAS = [
  ["Receita bruta", d.orcado.receitaBruta, ref.receitaBruta, true],
  ["Deduções sobre a receita", d.orcado.deducoes, ref.deducoes, false],
  ["Custos variáveis", d.orcado.custosVariaveis, ref.custosVariaveis, false],
  ["Despesas operacionais", d.orcado.despesasOperacionais, ref.despesasOperacionais, false],
  ["EBITDA", d.orcado.ebitda, ref.ebitda, true],
];

const sim = d.simular(0.06);

/* =========================================================
   Montagem do HTML
   ========================================================= */

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const maxCategoria = Math.max(...CATEGORIAS_DESPESA.map(([k]) => ref.despesas[k]));
const maxCliente = Math.max(...d.clientes.map((c) => c.valor));

let acumulado = 0;
const clientesHtml = d.clientes
  .map((c) => {
    acumulado += c.fracao;
    return `              <li>
                <span class="vrank__nome">${esc(c.nome)}<em>${esc(c.nota)}</em></span>
                ${barraHtml((c.valor / maxCliente) * 100)}
                <span class="vrank__val"><strong>${pct(c.fracao)}</strong>${brl(c.valor)}</span>
              </li>`;
  })
  .join("\n");

const html = `    <!-- ===================== 06 · IMV VISION ===================== -->
    <section class="sec sec--alt" id="vision">
      <div class="wrap">
        <header class="sechead reveal">
          <p class="label">Software próprio · incluído nas três camadas</p>
          <h2>IMV Vision: os números da sua empresa organizados, explicados e prontos para decidir.</h2>
          <p class="sechead__lead">
            Contratar BPO Financeiro, Controladoria ou CFO as a Service na IMV inclui o acesso
            ao IMV Vision — o software que construímos para que a sua empresa veja o próprio
            financeiro sem depender de planilha, de memória ou da nossa interpretação.
          </p>
        </header>

        <!-- Fonte dos dados: implica a integração com o sistema de gestão da empresa -->
        <div class="vflow reveal">
          <ol class="vflow__steps">
            <li>
              <span class="vflow__num" aria-hidden="true">01</span>
              <strong>O sistema que você já usa</strong>
              <span>Onde a sua empresa lança o dia a dia continua sendo a fonte. Nada muda de lugar.</span>
            </li>
            <li>
              <span class="vflow__num" aria-hidden="true">02</span>
              <strong>Conciliação lançamento por lançamento</strong>
              <span>Extrato bancário, contas a pagar e a receber conferidos antes de virar indicador.</span>
            </li>
            <li>
              <span class="vflow__num" aria-hidden="true">03</span>
              <strong>IMV Vision</strong>
              <span>Lê, organiza, calcula e explica — com a origem de cada número à mão.</span>
            </li>
          </ol>
          <p class="vflow__nota">
            <strong>Somente leitura.</strong> O Vision não movimenta dinheiro, não altera lançamento
            e não obriga a trocar de ferramenta. Ele se encaixa na operação que já existe.
          </p>
        </div>

        <div class="vfeat">
          <article class="vfeat__card reveal">
            <h3>Todo número tem origem</h3>
            <p>
              Cada indicador mostra o período, quantos lançamentos entraram no cálculo e a data
              da última leitura dos dados. Quando o seu contador perguntar de onde veio, a resposta
              está na tela.
            </p>
          </article>
          <article class="vfeat__card reveal">
            <h3>Nenhum número inventado</h3>
            <p>
              Se o dado não permite uma conclusão, o Vision diz o que falta — em vez de mostrar
              zero ou uma estimativa. Um indicador indisponível é informação; um número errado é
              um prejuízo.
            </p>
          </article>
          <article class="vfeat__card reveal">
            <h3>Dado, leitura e recomendação separados</h3>
            <p>
              O que aconteceu, o que isso indica e o que avaliar são blocos distintos e sinalizados.
              Você sempre sabe o que é fato e o que é interpretação.
            </p>
          </article>
          <article class="vfeat__card reveal">
            <h3>Pontos de atenção priorizados</h3>
            <p>
              Regras determinísticas, sem IA, varrem o resultado todo mês e apontam o que olhar
              primeiro — cada apontamento com a evidência que o disparou e o nome da regra.
            </p>
          </article>
          <article class="vfeat__card reveal">
            <h3>Cenários antes da decisão</h3>
            <p>
              Reduzir custo, mudar preço, contratar: você vê o efeito na margem e no caixa antes de
              executar. Cenário é cenário — a palavra "previsão" não aparece no produto.
            </p>
          </article>
          <article class="vfeat__card reveal">
            <h3>Mês fechado é mês fechado</h3>
            <p>
              O Vision nunca compara 15 dias com 30 e chama de queda, e nunca afirma nada sobre o mês
              em curso. A data da última leitura real fica sempre visível.
            </p>
          </article>
        </div>

        <div class="vlayers reveal">
          <article>
            <p class="vlayers__tag">No BPO Financeiro</p>
            <p>O Vision é onde a operação do dia a dia aparece organizada: caixa, contas a pagar e a receber, conciliação.</p>
          </article>
          <article>
            <p class="vlayers__tag">Na Controladoria</p>
            <p>É onde o dado vira informação: DRE gerencial, indicadores, orçado x realizado e pontos de atenção do mês.</p>
          </article>
          <article>
            <p class="vlayers__tag">No CFO as a Service</p>
            <p>É onde a decisão é simulada antes de ser tomada, e onde o plano de ação nasce ligado a um número real.</p>
          </article>
        </div>

        <!-- ============ DEMONSTRAÇÃO ============ -->
        <div class="vdemo reveal" id="vision-demo">
          <header class="vdemo__bar">
            <div class="vdemo__empresa">
              <span class="vdemo__avatar" aria-hidden="true">FI</span>
              <div>
                <strong>${esc(d.empresa.nome)}</strong>
                <span>${esc(d.empresa.setor)}</span>
              </div>
            </div>
            <ul class="vdemo__meta">
              <li><span>Mês de referência</span><strong>${esc(d.empresa.mesReferencia)}</strong></li>
              <li><span>Última leitura dos dados</span><strong>${esc(d.empresa.leituraDados)}</strong></li>
              <li><span>Qualidade dos dados</span><strong>100/100</strong></li>
            </ul>
          </header>

          <p class="vdemo__aviso">
            <strong>Demonstração com empresa fictícia.</strong> A ${esc(d.empresa.nome)} foi criada pela IMV
            para esta página: ${esc(d.empresa.descricao.toLowerCase())} Nenhum dado de cliente real aparece aqui —
            e os números abaixo fecham entre si até o último real.
          </p>

          <div class="vtabs" role="tablist" aria-label="Telas do IMV Vision">
            <button type="button" role="tab" id="vt-geral" aria-controls="vp-geral" aria-selected="true" tabindex="0">Visão Geral</button>
            <button type="button" role="tab" id="vt-fin" aria-controls="vp-fin" aria-selected="false" tabindex="-1">Financeiro</button>
            <button type="button" role="tab" id="vt-ctrl" aria-controls="vp-ctrl" aria-selected="false" tabindex="-1">Controladoria</button>
            <button type="button" role="tab" id="vt-ins" aria-controls="vp-ins" aria-selected="false" tabindex="-1">Insights</button>
            <button type="button" role="tab" id="vt-sim" aria-controls="vp-sim" aria-selected="false" tabindex="-1">Simulações</button>
            <button type="button" role="tab" id="vt-plano" aria-controls="vp-plano" aria-selected="false" tabindex="-1">Plano de Ação</button>
          </div>

          <div class="vpanels">

            <!-- ---------- Visão Geral ---------- -->
            <section class="vpanel is-active" role="tabpanel" id="vp-geral" aria-labelledby="vt-geral" tabindex="0">
              <p class="vpanel__q">Como está minha empresa?</p>

              <div class="vscore">
                <div class="vscore__num">
                  <strong>${d.score}</strong>
                  <span class="vchip vchip--boa">${esc(d.faixa)}</span>
                  <p>Saúde Financeira</p>
                  <small>Calculado com 5 de 5 pilares · cobertura 100%</small>
                  <span class="vscore__meter" aria-hidden="true">
                    <span class="vscore__track"></span>
                    <span class="vscore__mark" style="left:${d.score}%"></span>
                  </span>
                  <span class="vscore__bands" aria-hidden="true"><i>Crítica</i><i>Atenção</i><i>Boa</i><i>Forte</i></span>
                </div>
                <div class="vscore__lado">
                  <p class="vscore__frase">
                    A receita líquida cresceu ${pct(d.var.receitaLiquida)} no mês e ${pct(ref.receitaLiquida / m[0].receitaLiquida - 1)} em doze meses.
                    No mesmo período de três meses fechados, a margem líquida recuou ${dec(Math.abs((ref.margemLiquida - jun.margemLiquida) * 100))} p.p.
                  </p>
                  <ul class="vpilares">
${d.pilares
  .map(
    (p) => `                    <li>
                      <span class="vpilares__nome">${esc(p.nome)}<em>peso ${pct(p.peso, 0)} · ${esc(p.metrica)}: ${
      p.formato === "pct" ? pct(p.valor / 100) : p.formato === "meses" ? dec(p.valor) + " meses" : dec(p.valor, 0) + " dias"
    }</em></span>
                      ${barraHtml(p.pontos)}
                      <span class="vpilares__pts">${p.pontos}</span>
                    </li>`
  )
  .join("\n")}
                  </ul>
                  <p class="vpanel__nota">
                    Cada pilar é normalizado por bandas explícitas, não por nota arbitrária. O score é
                    aritmética determinística e versionada: não é nota de crédito, não é valuation e não
                    compara setores diferentes.
                  </p>
                </div>
              </div>

              <ul class="vkpis">
${kpis
  .map(
    (k) => `                <li>
                  <span class="vkpis__nome">${esc(k.nome)}</span>
                  <strong class="vkpis__val">${k.valor}</strong>
                  <span class="vkpis__var ${k.bom ? "is-bom" : "is-ruim"}">${k.variacao}</span>
                  <small>${esc(k.nota)}</small>
                </li>`
  )
  .join("\n")}
              </ul>

              <h4 class="vpanel__h">Principais pontos de atenção</h4>
              <ul class="vatencao">
${ATENCAO.map(
  ([sev, titulo, nota]) => `                <li class="is-${sev}">
                  <span class="vchip vchip--${sev}">${CHIP[sev][0]}</span>
                  <strong>${esc(titulo)}</strong>
                  <em>${nota}</em>
                </li>`
).join("\n")}
              </ul>
              <p class="vpanel__nota">Ordenados por gravidade, não por data. Cada um abre com a evidência que o disparou, na tela de Insights.</p>
            </section>

            <!-- ---------- Financeiro ---------- -->
            <section class="vpanel" role="tabpanel" id="vp-fin" aria-labelledby="vt-fin" tabindex="0" hidden>
              <p class="vpanel__q">O que aconteceu?</p>

              <ul class="vkpis vkpis--4">
                <li>
                  <span class="vkpis__nome">Saldo de caixa</span>
                  <strong class="vkpis__val">${brl(ref.saldoCaixa)}</strong>
                  <span class="vkpis__var is-bom">${sinalBrl(ref.fluxoLiquido)}</span>
                  <small>no fim de setembro/2026</small>
                </li>
                <li>
                  <span class="vkpis__nome">Meses de caixa</span>
                  <strong class="vkpis__val">${dec(d.mesesDeCaixa)}</strong>
                  <span class="vkpis__var is-neutro">banda 3 a 6</span>
                  <small>saldo ÷ custo fixo mensal médio de ${brl(d.custoFixoMedio)}</small>
                </li>
                <li>
                  <span class="vkpis__nome">Conversão de lucro em caixa</span>
                  <strong class="vkpis__val">${pct(d.conversaoCaixa)}</strong>
                  <span class="vkpis__var is-neutro">12 meses</span>
                  <small>${brl(d.fco12)} de caixa operacional sobre ${brl(d.ll12)} de lucro</small>
                </li>
                <li>
                  <span class="vkpis__nome">Fluxo de caixa líquido</span>
                  <strong class="vkpis__val">${brl(ref.fluxoLiquido)}</strong>
                  <span class="vkpis__var is-bom">setembro/2026</span>
                  <small>operacional ${brl(ref.operacional)} · investimento ${brl(ref.investimento)} · financiamento ${brl(ref.financiamento)}</small>
                </li>
              </ul>

              <figure class="vchart">
                <figcaption>
                  <h4>Como o resultado evoluiu nos 12 meses fechados</h4>
                  <ul class="vlegend">
                    <li><i style="background:${PAL.receita}"></i>Receita líquida</li>
                    <li><i style="background:${PAL.despesa}"></i>Despesas totais</li>
                    <li><i style="background:${PAL.lucro}"></i>Lucro líquido</li>
                  </ul>
                </figcaption>
                <div class="vchart__scroll vchart__scroll--wide">
                  ${graficoEvolucao()}
                </div>
              </figure>

              <div class="vchart__par">
                <figure class="vchart">
                  <figcaption><h4>Como o caixa se movimentou mês a mês</h4></figcaption>
                  <div class="vchart__scroll">
                    ${graficoFluxo()}
                  </div>
                  <p class="vpanel__nota">Entradas menos saídas de cada mês. Novembro ficou negativo por ${brl(m[1].capex)} de compra de equipamentos.</p>
                </figure>
                <figure class="vchart">
                  <figcaption><h4>Em que nível o caixa ficou</h4></figcaption>
                  <div class="vchart__scroll">
                    ${graficoSaldo()}
                  </div>
                  <p class="vpanel__nota">Saldo no fim de cada mês. Eixo a partir de zero, para que a variação não pareça maior do que é.</p>
                </figure>
              </div>

              <h4 class="vpanel__h">Capital de giro em setembro/2026</h4>
              <ul class="vtiles">
                <li><span>Contas a receber</span><strong>${brl(ref.contasReceber)}</strong><small>em aberto</small></li>
                <li><span>Contas a pagar</span><strong>${brl(ref.contasPagar)}</strong><small>em aberto</small></li>
                <li><span>Necessidade de capital de giro</span><strong>${brl(ref.necessidadeCapitalGiro)}</strong><small>a receber − a pagar</small></li>
                <li><span>Prazo médio de recebimento</span><strong>${ref.pmr} dias</strong><small>era ${m[0].pmr} em out/2025</small></li>
                <li><span>Prazo médio de pagamento</span><strong>${ref.pmp} dias</strong><small>era ${m[0].pmp} em out/2025</small></li>
                <li><span>Ciclo financeiro</span><strong>${ref.ciclo} dias</strong><small>recebimento − pagamento</small></li>
                <li><span>Inadimplência</span><strong>${pct(d.carteira.inadimplencia)}</strong><small>vencidos há mais de 30 dias</small></li>
                <li><span>Dívida bancária</span><strong>${brl(ref.dividaFinal)}</strong><small>amortização de ${brl(ref.amortizacao)}/mês</small></li>
              </ul>
              <p class="vpanel__nota">
                O ciclo financeiro é calculado sem prazo de estoque — a ${esc(d.empresa.nome)} não tem estoque.
                Quando a empresa tem, o Vision diz isso na própria tela em vez de omitir.
              </p>

              <details class="vtable__wrap">
                <summary>Ver os números dos 12 meses</summary>
                <div class="vtable__scroll">
                  <table class="vtable">
                    <caption>Resultado e caixa por mês fechado — ${esc(d.empresa.nome)} (fictícia). Valores em reais.</caption>
                    <thead>
                      <tr><th scope="col">Mês</th><th scope="col">Receita líquida</th><th scope="col">Despesas totais</th><th scope="col">EBITDA</th><th scope="col">Lucro líquido</th><th scope="col">Margem líquida</th><th scope="col">Fluxo de caixa</th><th scope="col">Saldo de caixa</th></tr>
                    </thead>
                    <tbody>
${m
  .map(
    (mes) => `                      <tr><th scope="row">${mes.rotulo}</th><td>${num(mes.receitaLiquida)}</td><td>${num(mes.despesasTotais)}</td><td>${num(mes.ebitda)}</td><td>${num(mes.lucroLiquido)}</td><td>${pct(mes.margemLiquida)}</td><td>${num(mes.fluxoLiquido)}</td><td>${num(mes.saldoCaixa)}</td></tr>`
  )
  .join("\n")}
                    </tbody>
                  </table>
                </div>
              </details>
            </section>

            <!-- ---------- Controladoria ---------- -->
            <section class="vpanel" role="tabpanel" id="vp-ctrl" aria-labelledby="vt-ctrl" tabindex="0" hidden>
              <p class="vpanel__q">Por que está assim?</p>

              <figure class="vchart">
                <figcaption><h4>Da receita bruta ao lucro líquido — setembro/2026</h4></figcaption>
                <div class="vchart__scroll vchart__scroll--wide">
                  ${graficoCascata()}
                </div>
              </figure>

              <div class="vtable__scroll">
                <table class="vtable vtable--dre">
                  <caption>DRE gerencial de setembro/2026, com o mês anterior ao lado. Valores em reais.</caption>
                  <thead>
                    <tr><th scope="col">Linha</th><th scope="col">set/2026</th><th scope="col">% da receita líquida</th><th scope="col">ago/2026</th><th scope="col">Variação</th></tr>
                  </thead>
                  <tbody>
${DRE_LINHAS.map(([rotulo, atual, anterior, classe]) => {
  const varr = anterior === 0 ? null : atual / anterior - 1;
  return `                    <tr${classe ? ` class="is-${classe}"` : ""}><th scope="row">${esc(rotulo)}</th><td>${num(atual)}</td><td>${pct(atual / ref.receitaLiquida)}</td><td>${num(anterior)}</td><td>${varr === null ? "—" : sinalPct(Math.abs(anterior) === 0 ? 0 : (Math.abs(atual) - Math.abs(anterior)) / Math.abs(anterior))}</td></tr>`;
}).join("\n")}
                  </tbody>
                </table>
              </div>
              <p class="vpanel__nota">
                A variação das linhas negativas é lida em módulo: ${esc("“+8,2%”")} em despesa operacional
                significa que a despesa subiu 8,2%, não que o resultado melhorou.
              </p>

              <h4 class="vpanel__h">Orçado x realizado — setembro/2026</h4>
              <div class="vtable__scroll">
                <table class="vtable">
                  <caption>Orçamento aprovado para setembro/2026 contra o realizado. Valores em reais.</caption>
                  <thead>
                    <tr><th scope="col">Linha</th><th scope="col">Orçado</th><th scope="col">Realizado</th><th scope="col">Variação</th><th scope="col">%</th><th scope="col">Efeito no resultado</th></tr>
                  </thead>
                  <tbody>
${ORCADO_LINHAS.map(([rotulo, orc, real, maiorEhMelhor]) => {
  const dif = real - orc;
  const favoravel = maiorEhMelhor ? dif >= 0 : dif <= 0;
  return `                    <tr><th scope="row">${esc(rotulo)}</th><td>${num(orc)}</td><td>${num(real)}</td><td>${dif >= 0 ? "+" : MENOS}${mil(dif)}</td><td>${sinalPct(dif / orc)}</td><td><span class="vflag ${favoravel ? "is-bom" : "is-ruim"}">${favoravel ? "Favorável" : "Desfavorável"}</span></td></tr>`;
}).join("\n")}
                  </tbody>
                </table>
              </div>
              <p class="vpanel__nota">
                A receita veio ${sinalPct((ref.receitaBruta - d.orcado.receitaBruta) / d.orcado.receitaBruta)} acima do orçado
                e o EBITDA veio ${sinalPct((ref.ebitda - d.orcado.ebitda) / d.orcado.ebitda)} abaixo. São dois fatos do mesmo mês:
                a leitura de causa é trabalho do consultor, não do software.
              </p>

              <h4 class="vpanel__h">De onde saem as despesas operacionais</h4>
              <ul class="vrank">
${CATEGORIAS_DESPESA.map(([chave, nome]) => {
  const valor = ref.despesas[chave];
  const base = d.mediaCategoriaAnterior[chave];
  const varr = valor / base - 1;
  return `                <li>
                  <span class="vrank__nome">${esc(nome)}<em>média abr–jun: ${brl(base)}</em></span>
                  ${barraHtml((valor / maxCategoria) * 100)}
                  <span class="vrank__val"><strong>${brl(valor)}</strong><span class="${varr > 0.1 ? "is-ruim" : "is-neutro"}">${sinalPct(varr)}</span></span>
                </li>`;
}).join("\n")}
              </ul>
              <p class="vpanel__nota">
                Rubricas ordenadas por tamanho, comparadas com a média do trimestre anterior.
                Soma: ${brl(ref.despesasOperacionais)} — exatamente a linha de despesas operacionais do DRE acima.
              </p>
            </section>

            <!-- ---------- Insights ---------- -->
            <section class="vpanel" role="tabpanel" id="vp-ins" aria-labelledby="vt-ins" tabindex="0" hidden>
              <p class="vpanel__q">O que devo olhar primeiro?</p>
              <p class="vpanel__intro">
                Regras determinísticas, sem IA. Uma regra sem os dados que ela exige não é executada —
                e o produto publica o que faltou em vez de arredondar a conclusão.
              </p>

              <div class="vins">
${insights
  .map(
    (ins) => `                <article class="vins__card is-${ins.sev}">
                  <header>
                    <span class="vchip vchip--${ins.sev}">${CHIP[ins.sev][0]}</span>
                    <span class="vins__conf">Confiança: ${ins.confianca}</span>
                  </header>
                  <h5>${esc(ins.titulo)}</h5>
                  <p>${ins.texto}</p>
${
  ins.pareto
    ? `                  <p class="vins__sub">O que observamos · receita bruta de set/2026 por cliente</p>
                  <ul class="vrank vrank--mini">
${clientesHtml}
                  </ul>`
    : `                  <p class="vins__sub">O que observamos</p>
                  <ul class="vins__ev">
${ins.evidencia
  .map(
    ([rot, val, varr]) =>
      `                    <li><span>${esc(rot)}</span><strong>${val}</strong><em>${varr}</em></li>`
  )
  .join("\n")}
                  </ul>`
}
                  <dl class="vins__meta">
                    <div><dt>Período analisado</dt><dd>${esc(ins.periodo)}</dd></div>
                    <div><dt>Base de cálculo</dt><dd>${esc(ins.base)}</dd></div>
                    <div><dt>Regra</dt><dd>${esc(ins.regra)}</dd></div>
                  </dl>
                  <p class="vins__rec"><strong>O que recomendamos avaliar:</strong> ${esc(ins.recomendacao)}</p>
                </article>`
  )
  .join("\n")}
              </div>

              <p class="vpanel__nota">
                Nenhum apontamento afirma causa. O de margem mostra dois fatos e a relação de tempo
                entre eles; concluir que um causou o outro é decisão de quem conhece o negócio.
              </p>
            </section>

            <!-- ---------- Simulações ---------- -->
            <section class="vpanel" role="tabpanel" id="vp-sim" aria-labelledby="vt-sim" tabindex="0" hidden>
              <p class="vpanel__q">E se eu fizer isso?</p>

              <div class="vsim"
                   data-rl="${ref.receitaLiquida}"
                   data-lb="${ref.lucroBruto}"
                   data-opex="${ref.despesasOperacionais}"
                   data-da="${ref.depreciacao}"
                   data-fin="${ref.resultadoFinanceiro}"
                   data-imp="${ref.impostos.total}"
                   data-caixa="${ref.saldoCaixa}"
                   data-fixo="${d.custoFixoMedio}">
                <header class="vsim__top">
                  <p class="vsim__tag">Simulação · não é uma previsão</p>
                  <label class="vsim__ctrl" for="vsim-range">
                    Redução nas despesas operacionais
                    <input type="range" id="vsim-range" min="0" max="12" step="1" value="6">
                    <output id="vsim-pct" for="vsim-range">6%</output>
                  </label>
                  <p class="vsim__resumo" aria-live="polite">
                    Neste cenário, o lucro líquido do mês vai de <b>${brl(ref.lucroLiquido)}</b> para
                    <b id="vsim-r-lucro">${brl(sim.lucroLiquido)}</b>, e a margem líquida, de
                    <b>${pct(ref.margemLiquida)}</b> para <b id="vsim-r-margem">${pct(sim.margemLiquida)}</b>.
                  </p>
                </header>

                <div class="vsim__cols">
                  <div class="vsim__col">
                    <h5>Situação atual · setembro/2026</h5>
                    <ul>
                      <li><span>Receita líquida</span><strong>${brl(ref.receitaLiquida)}</strong></li>
                      <li><span>Despesas operacionais</span><strong>${brl(ref.despesasOperacionais)}</strong></li>
                      <li><span>EBITDA</span><strong>${brl(ref.ebitda)}</strong></li>
                      <li><span>Lucro líquido</span><strong>${brl(ref.lucroLiquido)}</strong></li>
                      <li><span>Margem líquida</span><strong>${pct(ref.margemLiquida)}</strong></li>
                      <li><span>Meses de caixa</span><strong>${dec(d.mesesDeCaixa)}</strong></li>
                    </ul>
                  </div>
                  <div class="vsim__col vsim__col--cen">
                    <h5>Cenário simulado</h5>
                    <ul>
                      <li><span>Receita líquida</span><strong>${brl(ref.receitaLiquida)}</strong><em>mantida</em></li>
                      <li><span>Despesas operacionais</span><strong id="vsim-opex">${brl(sim.despesasOperacionais)}</strong><em id="vsim-eco">${brl(-sim.economia)}</em></li>
                      <li><span>EBITDA</span><strong id="vsim-ebitda">${brl(sim.ebitda)}</strong><em id="vsim-debitda">+${brl(sim.economia)}</em></li>
                      <li><span>Lucro líquido</span><strong id="vsim-lucro">${brl(sim.lucroLiquido)}</strong><em id="vsim-dlucro">+${brl(sim.economia)}</em></li>
                      <li><span>Margem líquida</span><strong id="vsim-margem">${pct(sim.margemLiquida)}</strong><em id="vsim-dmargem">${sinalPp((sim.margemLiquida - ref.margemLiquida) * 100)}</em></li>
                      <li><span>Meses de caixa</span><strong id="vsim-meses">${dec(sim.mesesDeCaixa)}</strong><em id="vsim-dmeses">${(sim.mesesDeCaixa >= d.mesesDeCaixa ? "+" : MENOS) + dec(Math.abs(sim.mesesDeCaixa - d.mesesDeCaixa)) + " meses"}</em></li>
                    </ul>
                  </div>
                </div>

                <div class="vsim__notas">
                  <div>
                    <h5>Premissas da simulação</h5>
                    <ul>
                      <li>Base de cálculo: mês fechado de setembro/2026</li>
                      <li>Redução aplicada sobre ${brl(ref.despesasOperacionais)} de despesas operacionais</li>
                      <li>Receita mantida constante</li>
                      <li>Lucro presumido: o imposto incide sobre a receita, então a economia chega inteira ao lucro</li>
                    </ul>
                  </div>
                  <div>
                    <h5>Não considerado</h5>
                    <ul>
                      <li>Sazonalidade</li>
                      <li>Custo de implementar a mudança</li>
                      <li>Efeito sobre a capacidade da equipe</li>
                      <li>Prazos de rescisão contratual</li>
                    </ul>
                  </div>
                </div>

                <p class="vsim__realoc">
                  <strong>E se esse recurso fosse para outro lugar?</strong>
                  A economia equivale a <b id="vsim-ano">${brl(sim.economiaAno)}</b> em doze meses. Aplicada em marketing,
                  para se pagar em doze meses ela precisaria gerar <b id="vsim-necessaria">${brl(sim.receitaNecessaria)}</b>
                  de receita líquida adicional. O Vision mostra o retorno <em>necessário</em> — não estima o retorno provável,
                  porque isso ele não tem como saber.
                </p>
                <p class="vpanel__nota">Este cenário assume que a redução não afeta a receita.</p>
              </div>
            </section>

            <!-- ---------- Plano de Ação ---------- -->
            <section class="vpanel" role="tabpanel" id="vp-plano" aria-labelledby="vt-plano" tabindex="0" hidden>
              <p class="vpanel__q">Qual é o meu próximo passo?</p>
              <p class="vpanel__intro">
                Nenhum item existe sem um apontamento real por trás. Prioridade e indicador vêm do
                apontamento; o esforço é o único campo que o consultor da IMV preenche, porque é o
                único que o sistema não tem como calcular.
              </p>

              <ul class="vplano">
${PLANO.map(
  (it) => `                <li>
                  <div class="vplano__cab">
                    <strong>${esc(it.titulo)}</strong>
                    <span class="vflag ${it.status === "Em andamento" ? "is-andamento" : "is-afazer"}">${esc(it.status)}</span>
                  </div>
                  <dl>
                    <div><dt>Origem</dt><dd>${esc(it.origem)}</dd></div>
                    <div><dt>Prioridade</dt><dd>${esc(it.prioridade)}</dd></div>
                    <div><dt>Esforço</dt><dd>${esc(it.esforco)}</dd></div>
                    <div><dt>Indicador</dt><dd>${esc(it.kpi)}</dd></div>
                    <div><dt>Prazo</dt><dd>${esc(it.prazo)}</dd></div>
                  </dl>
                </li>`
).join("\n")}
              </ul>
            </section>

          </div>
        </div>

        <div class="vclose reveal">
          <p>
            É isso que a sua empresa passa a ver todo mês — com os números dela, conferidos antes
            de virar indicador.
          </p>
          <a href="#agendar" class="btn btn--primary btn--lg">Quero ver minha empresa no IMV Vision</a>
        </div>
      </div>
    </section>
`;

const destinoFragmento = new URL("./secao-vision.html", import.meta.url);
writeFileSync(destinoFragmento, html, "utf8");
console.log("gerado: secao-vision.html · " + html.length + " caracteres");

/* Com --aplicar, troca a seção direto no index.html da landing.
   Os marcadores são os comentários de seção: nada mais do arquivo é tocado. */
if (process.argv.includes("--aplicar")) {
  const alvo = new URL("../../index.html", import.meta.url);
  const pagina = readFileSync(alvo, "utf8");

  const abre = "    <!-- ===================== 06 · IMV VISION";
  const fecha = "    <!-- ===================== 07 · DOIS CAMINHOS";
  const i = pagina.indexOf(abre);
  const f = pagina.indexOf(fecha);

  if (i === -1 || f === -1 || f < i) {
    console.error("index.html: marcadores de seção não encontrados. Nada foi alterado.");
    process.exit(1);
  }

  writeFileSync(alvo, pagina.slice(0, i) + html + "\n" + pagina.slice(f), "utf8");
  console.log("index.html atualizado.");
}
