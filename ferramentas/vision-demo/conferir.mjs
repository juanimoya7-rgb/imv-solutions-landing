import { construir, verificar } from "./dados.mjs";

const d = construir();
const erros = verificar(d);

const n = (v) => v.toLocaleString("pt-BR");
const p = (v, dec = 1) => (v * 100).toFixed(dec).replace(".", ",") + "%";

console.log("=== VERIFICAÇÃO ===");
if (erros.length === 0) console.log("todas as asserções passaram");
else erros.forEach((e) => console.log("FALHA · " + e));

console.log("\n=== MÊS A MÊS ===");
console.log(
  ["mês", "rec.bruta", "rec.líq", "desp.tot", "EBITDA", "mg.EBITDA", "lucro", "mg.líq", "fluxo", "saldo"].join("\t")
);
d.meses.forEach((m) =>
  console.log(
    [
      m.rotulo,
      n(m.receitaBruta),
      n(m.receitaLiquida),
      n(m.despesasTotais),
      n(m.ebitda),
      p(m.margemEbitda),
      n(m.lucroLiquido),
      p(m.margemLiquida),
      n(m.fluxoLiquido),
      n(m.saldoCaixa),
    ].join("\t")
  )
);

console.log("\n=== REFERÊNCIA set/26 ===");
const r = d.ref;
console.log("receita bruta        ", n(r.receitaBruta));
console.log("deduções             ", n(r.deducoes));
console.log("receita líquida      ", n(r.receitaLiquida));
console.log("custos variáveis     ", n(r.custosVariaveis));
console.log("lucro bruto          ", n(r.lucroBruto), p(r.margemBruta));
console.log("despesas operac.     ", n(r.despesasOperacionais));
console.log("EBITDA               ", n(r.ebitda), p(r.margemEbitda));
console.log("depreciação          ", n(r.depreciacao));
console.log("result. financeiro   ", n(r.resultadoFinanceiro), `(rend ${n(r.rendimento)} − juros ${n(r.juros)})`);
console.log("impostos s/ lucro    ", n(r.impostos.total), `(base ${n(r.impostos.base)})`);
console.log("lucro líquido        ", n(r.lucroLiquido), p(r.margemLiquida));
console.log("contas a receber     ", n(r.contasReceber), `pmr ${r.pmr}`);
console.log("contas a pagar       ", n(r.contasPagar), `pmp ${r.pmp}`);
console.log("ciclo financeiro     ", r.ciclo, "dias");
console.log("saldo de caixa       ", n(r.saldoCaixa));

console.log("\n=== SAÚDE FINANCEIRA ===");
console.log("score", d.score, d.faixa);
d.pilares.forEach((pi) =>
  console.log(
    "  ",
    pi.nome.padEnd(20),
    String(pi.pontos).padStart(3),
    "·",
    pi.metrica,
    "=",
    pi.formato === "pct" ? pi.valor.toFixed(1) + "%" : pi.valor.toFixed(1),
    "·",
    pi.banda
  )
);

console.log("\n=== DERIVADOS ===");
console.log("custo fixo médio     ", n(d.custoFixoMedio));
console.log("meses de caixa       ", d.mesesDeCaixa.toFixed(2));
console.log("FCO 12m              ", n(d.fco12));
console.log("lucro 12m            ", n(d.ll12));
console.log("conversão            ", p(d.conversaoCaixa));
console.log("volatilidade receita ", p(d.volatilidade));
console.log("tri receita          ", p(d.crescReceitaTri), "| tri despesa", p(d.crescDespesaTri),
  "| diferença", (d.crescDespesaTri - d.crescReceitaTri).toFixed(3));
console.log("margem jun→set       ", p(d.meses[8].margemLiquida), "→", p(r.margemLiquida),
  "=", ((r.margemLiquida - d.meses[8].margemLiquida) * 100).toFixed(1), "p.p.");
console.log("concentração top     ", p(d.clientes[0].fracao));
console.log("PMR vs vencimento    ", r.pmr, "vs", d.carteira.vencimentoMedioConcedido,
  "→ preso:", n(Math.round(((r.pmr - d.carteira.vencimentoMedioConcedido) / 30) * r.receitaBruta)));

console.log("\n=== ORÇADO x REALIZADO set/26 ===");
["receitaBruta", "deducoes", "custosVariaveis", "despesasOperacionais", "ebitda"].forEach((k) => {
  const o = d.orcado[k], re = k === "ebitda" ? r.ebitda : r[k];
  console.log(k.padEnd(22), n(o).padStart(9), n(re).padStart(9), n(re - o).padStart(9), p((re - o) / o));
});

console.log("\n=== DESPESAS POR CATEGORIA set/26 (vs média abr–jun) ===");
Object.entries(r.despesas).forEach(([k, v]) => {
  const base = d.mediaCategoriaAnterior[k];
  console.log(k.padEnd(12), n(v).padStart(8), n(base).padStart(8), p(v / base - 1));
});

console.log("\n=== SIMULAÇÃO ===");
[0, 0.03, 0.06, 0.09, 0.12].forEach((pc) => {
  const s = d.simular(pc);
  console.log(
    (pc * 100).toFixed(0) + "%",
    "economia", n(s.economia).padStart(7),
    "| EBITDA", n(s.ebitda).padStart(7), p(s.margemEbitda),
    "| lucro", n(s.lucroLiquido).padStart(7), p(s.margemLiquida),
    "| fôlego", s.mesesDeCaixa.toFixed(1),
    "| receita necessária", n(s.receitaNecessaria)
  );
});
