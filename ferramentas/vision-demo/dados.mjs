/* =========================================================
   Futebol Inc SaaS — dataset fictício para a demonstração
   do IMV Vision na landing da IMV Solutions.

   Regra deste arquivo: NADA é digitado duas vezes. Só entram
   premissas (receita, despesas por categoria, prazos, dívida);
   todo o resto é derivado e verificado por asserções.

   Tudo em reais inteiros, com arredondamento a cada passo, para
   que a aritmética exibida na tela feche exatamente — sem "sobra
   de centavo" entre o que o cliente soma e o que o site mostra.
   ========================================================= */

/* ---------- Premissas do negócio ---------- */

export const EMPRESA = {
  nome: "Futebol Inc SaaS",
  setor: "SaaS B2B · tecnologia para clubes de futebol",
  descricao:
    "Plataforma de gestão de desempenho, escalação e scouting vendida por assinatura para clubes, federações e centros de formação.",
  clientesAtivos: 51,
  regime: "Lucro Presumido",
  mesReferencia: "setembro/2026",
  leituraDados: "01/10/2026 às 07:12",
  lancamentosMes: 1482,
  transferenciasExcluidas: 34,
  semClassificacao: 0,
};

/* Alíquotas e taxas — explícitas, para aparecerem na tela. */
export const TAXAS = {
  deducoes: 0.0565, // ISS 2% + PIS 0,65% + COFINS 3% (serviço, cumulativo)
  custosVariaveis: 0.265, // infra em nuvem, gateway, comissões, suporte N1
  presuncaoIRPJ: 0.32, // base presumida de serviços
  irpj: 0.15,
  irpjAdicional: 0.1,
  irpjAdicionalFranquia: 20000, // por mês
  csll: 0.09,
  rendimentoAplicacao: 0.007, // sobre o saldo inicial do mês
  jurosEmprestimo: 0.0105, // sobre o saldo devedor inicial
};

/* 12 meses fechados: out/2025 a set/2026. */
const MESES = [
  // rotulo,     receitaBruta, pessoal, comercial, tecnologia, admin, ocupacao, pmr, pmp, capex, depreciacao
  ["out/25", 352000,  92400, 24800, 12600, 11900, 8400, 33, 31,  8000, 6800],
  ["nov/25", 361000,  92400, 26200, 12600, 12300, 8400, 34, 31, 42000, 6800],
  ["dez/25", 349000,  99800, 21400, 12900, 13600, 8400, 35, 30,  8000, 6800],
  ["jan/26", 374000,  96200, 25600, 13400, 12800, 8400, 35, 30,  8000, 7200],
  ["fev/26", 383000,  96200, 27300, 13400, 12600, 8400, 36, 30,  8000, 7200],
  ["mar/26", 402000, 101700, 30400, 14100, 13200, 9800, 36, 29, 14000, 7200],
  ["abr/26", 411000, 103500, 31800, 14600, 13400, 9800, 37, 29,  8000, 7200],
  ["mai/26", 419000, 103500, 33100, 14900, 13700, 9800, 38, 29,  8000, 7200],
  ["jun/26", 428000, 105900, 34600, 15200, 14100, 9800, 38, 29,  8000, 7200],
  ["jul/26", 441000, 119700, 42800, 16800, 14900, 9800, 39, 29,  8000, 7900],
  ["ago/26", 452000, 127400, 48300, 17900, 15600, 9800, 40, 29,  8000, 7900],
  ["set/26", 468000, 131800, 52700, 18700, 16300, 9800, 41, 29,  8000, 7900],
];

/* Estado herdado de setembro/2025 (mês anterior à série). */
const ABERTURA = {
  saldoCaixa: 820000,
  dividaBancaria: 320000,
  amortizacaoMensal: 8000,
  receitaBrutaAnterior: 344000,
  pmrAnterior: 33,
  pmpAnterior: 31,
  custoAnterior: 236000, // custos variáveis + despesas operacionais de set/2025
};

export const CATEGORIAS_DESPESA = [
  ["pessoal", "Pessoal"],
  ["comercial", "Comercial e marketing"],
  ["tecnologia", "Tecnologia e ferramentas"],
  ["admin", "Administrativas"],
  ["ocupacao", "Ocupação"],
];

/* Composição da receita de set/2026 — soma verificada contra a receita bruta. */
export const RECEITA_SET = {
  recorrente: 402000,
  implantacao: 66000,
};

/* Carteira de clientes de set/2026 — soma verificada contra a receita bruta. */
export const CLIENTES_SET = [
  ["Grupo Esportivo Albatroz", 148000, "rede de 4 clubes"],
  ["Federação Paulista de Futsal", 72000, "contrato anual"],
  ["Clube Atlético Rio Verde", 56000, "Série B"],
  ["Esporte Clube Vila Nova", 41000, "Série C"],
  ["Centro de Formação Base Sul", 33000, "categorias de base"],
  ["Outros 46 clientes", 118000, "ticket médio menor"],
];

/* Orçamento aprovado para set/2026 (premissas, não resultado). */
export const ORCADO_SET = {
  receitaBruta: 455000,
  custosVariaveis: 113500,
  despesasOperacionais: 212000,
};

/* Prazos e inadimplência — dados de operação, não derivados. */
export const CARTEIRA_SET = {
  vencimentoMedioConcedido: 30, // prazo que a própria empresa concede em contrato
  inadimplencia: 0.019, // vencidos > 30 dias / faturado do mês
};

/* ---------- Motor ---------- */

const r = (n) => Math.round(n);

function impostosSobreLucro(receitaBruta) {
  const base = r(receitaBruta * TAXAS.presuncaoIRPJ);
  const irpj = r(base * TAXAS.irpj);
  const adicional = r(Math.max(0, base - TAXAS.irpjAdicionalFranquia) * TAXAS.irpjAdicional);
  const csll = r(base * TAXAS.csll);
  return { base, irpj, adicional, csll, total: irpj + adicional + csll };
}

export function construir() {
  const meses = [];

  let saldo = ABERTURA.saldoCaixa;
  let divida = ABERTURA.dividaBancaria;
  let arAnterior = r((ABERTURA.pmrAnterior / 30) * ABERTURA.receitaBrutaAnterior);
  let apAnterior = r((ABERTURA.pmpAnterior / 30) * ABERTURA.custoAnterior);

  MESES.forEach((linha, i) => {
    const [rotulo, receitaBruta, pessoal, comercial, tecnologia, admin, ocupacao, pmr, pmp, capex, depreciacao] = linha;

    /* Resultado (competência) */
    const deducoes = r(receitaBruta * TAXAS.deducoes);
    const receitaLiquida = receitaBruta - deducoes;
    const custosVariaveis = r(receitaLiquida * TAXAS.custosVariaveis);
    const lucroBruto = receitaLiquida - custosVariaveis;

    const despesas = { pessoal, comercial, tecnologia, admin, ocupacao };
    const despesasOperacionais = pessoal + comercial + tecnologia + admin + ocupacao;

    const ebitda = lucroBruto - despesasOperacionais;

    const rendimento = r(saldo * TAXAS.rendimentoAplicacao);
    const juros = r(divida * TAXAS.jurosEmprestimo);
    const resultadoFinanceiro = rendimento - juros;

    const impostos = impostosSobreLucro(receitaBruta);
    const lucroLiquido = ebitda - depreciacao + resultadoFinanceiro - impostos.total;

    /* Capital de giro */
    const contasReceber = r((pmr / 30) * receitaBruta);
    const contasPagar = r((pmp / 30) * (custosVariaveis + despesasOperacionais));
    const varReceber = contasReceber - arAnterior;
    const varPagar = contasPagar - apAnterior;

    /* Caixa */
    const operacional =
      receitaBruta - varReceber - deducoes - impostos.total - (custosVariaveis + despesasOperacionais) + varPagar;
    const investimento = rendimento - capex;
    const amortizacao = ABERTURA.amortizacaoMensal;
    const financiamento = -juros - amortizacao;
    const fluxoLiquido = operacional + investimento + financiamento;

    const saldoInicial = saldo;
    saldo = saldoInicial + fluxoLiquido;
    divida = divida - amortizacao;

    meses.push({
      i,
      rotulo,
      receitaBruta,
      deducoes,
      receitaLiquida,
      custosVariaveis,
      lucroBruto,
      despesas,
      despesasOperacionais,
      despesasTotais: custosVariaveis + despesasOperacionais,
      ebitda,
      margemEbitda: ebitda / receitaLiquida,
      depreciacao,
      rendimento,
      juros,
      resultadoFinanceiro,
      impostos,
      lucroLiquido,
      margemLiquida: lucroLiquido / receitaLiquida,
      margemBruta: lucroBruto / receitaLiquida,
      pmr,
      pmp,
      ciclo: pmr - pmp,
      contasReceber,
      contasPagar,
      necessidadeCapitalGiro: contasReceber - contasPagar,
      capex,
      operacional,
      investimento,
      financiamento,
      amortizacao,
      fluxoLiquido,
      saldoInicial,
      saldoCaixa: saldo,
      dividaFinal: divida,
    });

    arAnterior = contasReceber;
    apAnterior = contasPagar;
  });

  const ref = meses[meses.length - 1]; // set/26
  const anterior = meses[meses.length - 2]; // ago/26

  /* Custo fixo mensal médio: últimos 3 meses de despesa operacional + juros.
     É o denominador de "meses de caixa" — fica explícito na tela. */
  const ultimos3 = meses.slice(-3);
  const custoFixoMedio = r(
    ultimos3.reduce((s, m) => s + m.despesasOperacionais + m.juros, 0) / 3
  );
  const mesesDeCaixa = ref.saldoCaixa / custoFixoMedio;

  /* Conversão de lucro em caixa — 12 meses fechados (um mês isolado não diz nada). */
  const fco12 = meses.reduce((s, m) => s + m.operacional, 0);
  const ll12 = meses.reduce((s, m) => s + m.lucroLiquido, 0);
  const conversaoCaixa = fco12 / ll12;

  /* Volatilidade da receita — coeficiente de variação dos 12 meses. */
  const receitas = meses.map((m) => m.receitaBruta);
  const media = receitas.reduce((s, v) => s + v, 0) / receitas.length;
  const desvio = Math.sqrt(
    receitas.reduce((s, v) => s + (v - media) ** 2, 0) / (receitas.length - 1)
  );
  const volatilidade = desvio / media;

  /* Trimestres, para a regra de despesa crescendo acima da receita. */
  const tri = (arr) => ({
    receitaBruta: arr.reduce((s, m) => s + m.receitaBruta, 0),
    despesasOperacionais: arr.reduce((s, m) => s + m.despesasOperacionais, 0),
  });
  const triAtual = tri(meses.slice(9, 12)); // jul–set
  const triAnterior = tri(meses.slice(6, 9)); // abr–jun
  const crescReceitaTri = triAtual.receitaBruta / triAnterior.receitaBruta - 1;
  const crescDespesaTri = triAtual.despesasOperacionais / triAnterior.despesasOperacionais - 1;

  /* Média do trimestre anterior por categoria, para a variação das rubricas. */
  const mediaCategoriaAnterior = {};
  CATEGORIAS_DESPESA.forEach(([chave]) => {
    mediaCategoriaAnterior[chave] = r(
      meses.slice(6, 9).reduce((s, m) => s + m.despesas[chave], 0) / 3
    );
  });

  /* ---------- Score de Saúde Financeira ---------- */
  /* Normalização por bandas, interpolada dentro da banda. Determinística e
     explicável: cada pilar mostra sua métrica e sua banda. */
  const porBandas = (valor, bandas) => {
    for (const [de, ate, pDe, pAte] of bandas) {
      if (valor >= de && valor < ate) {
        const t = (valor - de) / (ate - de);
        return pDe + t * (pAte - pDe);
      }
    }
    return valor < bandas[0][0] ? bandas[0][2] : bandas[bandas.length - 1][3];
  };

  const pilares = [
    {
      nome: "Rentabilidade",
      peso: 0.25,
      pergunta: "A operação ganha dinheiro?",
      metrica: "Margem líquida",
      valor: ref.margemLiquida * 100,
      formato: "pct",
      bandas: [
        [-100, 0, 0, 20],
        [0, 5, 20, 50],
        [5, 12, 50, 80],
        [12, 25, 80, 100],
      ],
      banda: "5% a 12% → 50 a 80",
    },
    {
      nome: "Geração de caixa",
      peso: 0.25,
      pergunta: "O lucro virou caixa?",
      metrica: "Conversão de lucro em caixa (12 meses)",
      valor: conversaoCaixa * 100,
      formato: "pct",
      bandas: [
        [-200, 0, 0, 20],
        [0, 50, 20, 50],
        [50, 90, 50, 80],
        [90, 130, 80, 100],
      ],
      banda: "50% a 90% → 50 a 80",
    },
    {
      nome: "Fôlego",
      peso: 0.2,
      pergunta: "Quanto tempo aguenta sem receita?",
      metrica: "Meses de caixa",
      valor: mesesDeCaixa,
      formato: "meses",
      bandas: [
        [0, 1, 0, 20],
        [1, 3, 20, 50],
        [3, 6, 50, 80],
        [6, 12, 80, 100],
      ],
      banda: "3 a 6 meses → 50 a 80",
    },
    {
      nome: "Ciclo financeiro",
      peso: 0.15,
      pergunta: "O capital de giro drena ou financia?",
      metrica: "Ciclo financeiro",
      valor: ref.ciclo,
      formato: "dias",
      bandas: [
        [-60, 0, 100, 100],
        [0, 10, 100, 85],
        [10, 20, 85, 65],
        [20, 35, 65, 40],
        [35, 50, 40, 20],
        [50, 120, 20, 0],
      ],
      banda: "10 a 20 dias → 85 a 65",
    },
    {
      nome: "Previsibilidade",
      peso: 0.15,
      pergunta: "O resultado é estável ou errático?",
      metrica: "Volatilidade da receita (coef. de variação)",
      valor: volatilidade * 100,
      formato: "pct",
      bandas: [
        [0, 10, 100, 80],
        [10, 20, 80, 50],
        [20, 35, 50, 20],
        [35, 100, 20, 0],
      ],
      banda: "até 10% → 100 a 80",
    },
  ].map((p) => ({ ...p, pontos: Math.round(porBandas(p.valor, p.bandas)) }));

  const score = Math.round(pilares.reduce((s, p) => s + p.pontos * p.peso, 0));
  const faixa = score >= 80 ? "Forte" : score >= 60 ? "Boa" : score >= 40 ? "Atenção" : "Crítica";

  /* ---------- Simulação (função pura sobre o baseline) ---------- */
  const simular = (pct) => {
    const economia = r(ref.despesasOperacionais * pct);
    const despesasOperacionais = ref.despesasOperacionais - economia;
    const ebitda = ref.lucroBruto - despesasOperacionais;
    /* No lucro presumido o imposto incide sobre a receita presumida: a economia
       de custo não altera IRPJ/CSLL. A economia chega inteira ao lucro. */
    const lucroLiquido = ebitda - ref.depreciacao + ref.resultadoFinanceiro - ref.impostos.total;
    const custoFixo = custoFixoMedio - economia;
    return {
      pct,
      economia,
      economiaAno: economia * 12,
      despesasOperacionais,
      ebitda,
      margemEbitda: ebitda / ref.receitaLiquida,
      lucroLiquido,
      margemLiquida: lucroLiquido / ref.receitaLiquida,
      custoFixo,
      mesesDeCaixa: ref.saldoCaixa / custoFixo,
      /* Para se pagar em 12 meses, um investimento do tamanho da economia anual
         precisaria gerar esta receita líquida adicional (margem de contribuição). */
      receitaNecessaria: r((economia * 12) / (ref.lucroBruto / ref.receitaLiquida)),
    };
  };

  const clientes = CLIENTES_SET.map(([nome, valor, nota]) => ({
    nome,
    valor,
    nota,
    fracao: valor / ref.receitaBruta,
  }));

  const orcado = {
    receitaBruta: ORCADO_SET.receitaBruta,
    deducoes: r(ORCADO_SET.receitaBruta * TAXAS.deducoes),
    custosVariaveis: ORCADO_SET.custosVariaveis,
    despesasOperacionais: ORCADO_SET.despesasOperacionais,
  };
  orcado.receitaLiquida = orcado.receitaBruta - orcado.deducoes;
  orcado.lucroBruto = orcado.receitaLiquida - orcado.custosVariaveis;
  orcado.ebitda = orcado.lucroBruto - orcado.despesasOperacionais;

  return {
    empresa: EMPRESA,
    taxas: TAXAS,
    meses,
    ref,
    anterior,
    custoFixoMedio,
    mesesDeCaixa,
    fco12,
    ll12,
    conversaoCaixa,
    volatilidade,
    triAtual,
    triAnterior,
    crescReceitaTri,
    crescDespesaTri,
    mediaCategoriaAnterior,
    pilares,
    score,
    faixa,
    simular,
    clientes,
    receita: RECEITA_SET,
    carteira: CARTEIRA_SET,
    orcado,
    /* Variações mês a mês do mês de referência */
    var: {
      receitaLiquida: ref.receitaLiquida / anterior.receitaLiquida - 1,
      despesasTotais: ref.despesasTotais / anterior.despesasTotais - 1,
      lucroLiquido: ref.lucroLiquido / anterior.lucroLiquido - 1,
      margemLiquida: (ref.margemLiquida - anterior.margemLiquida) * 100,
      receitaBruta: ref.receitaBruta / anterior.receitaBruta - 1,
    },
  };
}

/* ---------- Verificação: nada vai para a tela sem fechar ---------- */

export function verificar(d) {
  const erros = [];
  const ok = (cond, msg) => { if (!cond) erros.push(msg); };

  d.meses.forEach((m) => {
    ok(m.receitaLiquida === m.receitaBruta - m.deducoes, `${m.rotulo}: receita líquida`);
    ok(m.lucroBruto === m.receitaLiquida - m.custosVariaveis, `${m.rotulo}: lucro bruto`);
    ok(
      m.despesasOperacionais ===
        Object.values(m.despesas).reduce((s, v) => s + v, 0),
      `${m.rotulo}: soma das rubricas`
    );
    ok(m.ebitda === m.lucroBruto - m.despesasOperacionais, `${m.rotulo}: EBITDA`);
    ok(
      m.lucroLiquido === m.ebitda - m.depreciacao + m.resultadoFinanceiro - m.impostos.total,
      `${m.rotulo}: lucro líquido`
    );
    ok(
      m.impostos.total === m.impostos.irpj + m.impostos.adicional + m.impostos.csll,
      `${m.rotulo}: impostos`
    );
    ok(m.despesasTotais === m.custosVariaveis + m.despesasOperacionais, `${m.rotulo}: despesas totais`);
    ok(m.resultadoFinanceiro === m.rendimento - m.juros, `${m.rotulo}: resultado financeiro`);
    ok(
      m.fluxoLiquido === m.operacional + m.investimento + m.financiamento,
      `${m.rotulo}: fluxo líquido`
    );
    ok(m.saldoCaixa === m.saldoInicial + m.fluxoLiquido, `${m.rotulo}: saldo de caixa`);
    ok(m.ciclo === m.pmr - m.pmp, `${m.rotulo}: ciclo financeiro`);
    ok(m.necessidadeCapitalGiro === m.contasReceber - m.contasPagar, `${m.rotulo}: NCG`);
    ok(m.lucroLiquido > 0, `${m.rotulo}: lucro líquido negativo (${m.lucroLiquido})`);
  });

  /* Encadeamento do saldo entre meses */
  d.meses.forEach((m, i) => {
    if (i === 0) return;
    ok(m.saldoInicial === d.meses[i - 1].saldoCaixa, `${m.rotulo}: encadeamento do saldo`);
  });

  /* Composição da receita e carteira de clientes fecham com a receita bruta */
  ok(
    d.receita.recorrente + d.receita.implantacao === d.ref.receitaBruta,
    "composição da receita não fecha"
  );
  ok(
    d.clientes.reduce((s, c) => s + c.valor, 0) === d.ref.receitaBruta,
    "carteira de clientes não fecha"
  );

  /* Regras de insight: só afirmamos o que o dado sustenta */
  const [jun, jul, ago, set] = d.meses.slice(-4);
  ok(jul.margemLiquida < jun.margemLiquida, "margem: jul deveria cair vs jun");
  ok(ago.margemLiquida < jul.margemLiquida, "margem: ago deveria cair vs jul");
  ok(set.margemLiquida < ago.margemLiquida, "margem: set deveria cair vs ago");
  ok(
    (jun.margemLiquida - set.margemLiquida) * 100 > 2,
    "margem: queda deveria passar de 2 p.p."
  );
  ok(
    (d.crescDespesaTri - d.crescReceitaTri) * 100 > 10,
    "despesa x receita: diferença deveria passar de 10 p.p."
  );
  ok(d.clientes[0].fracao > 0.3, "concentração: maior cliente deveria passar de 30%");
  ok(d.ref.pmr > d.carteira.vencimentoMedioConcedido, "PMR deveria estar acima do vencimento concedido");
  ok(d.meses[0].pmr < d.ref.pmr, "PMR deveria estar subindo ao longo do ano");
  ok(d.mesesDeCaixa > 3 && d.mesesDeCaixa < 6, `meses de caixa fora da banda 3–6: ${d.mesesDeCaixa}`);
  ok(d.ref.margemLiquida > 0.05, `margem líquida de referência baixa: ${d.ref.margemLiquida}`);

  /* Nenhum trio de meses com fluxo negativo seguido (regra FLUXO_NEGATIVO_RECORRENTE) */
  for (let i = 2; i < d.meses.length; i++) {
    const trio = d.meses.slice(i - 2, i + 1);
    ok(
      !trio.every((m) => m.fluxoLiquido < 0),
      `fluxo negativo em 3 meses seguidos terminando em ${d.meses[i].rotulo}`
    );
  }

  /* Score consistente com os pilares */
  const recalculado = Math.round(d.pilares.reduce((s, p) => s + p.pontos * p.peso, 0));
  ok(recalculado === d.score, "score não reproduz os pilares");
  ok(d.pilares.reduce((s, p) => s + p.peso, 0) === 1, "pesos dos pilares não somam 1");

  /* Simulação: a economia chega inteira ao lucro (lucro presumido) */
  const s6 = d.simular(0.06);
  ok(s6.lucroLiquido - d.ref.lucroLiquido === s6.economia, "simulação: economia não chega ao lucro");
  ok(d.simular(0).lucroLiquido === d.ref.lucroLiquido, "simulação: 0% deveria devolver o baseline");

  return erros;
}
