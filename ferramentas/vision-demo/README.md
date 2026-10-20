# Demonstração do IMV Vision na landing

A seção `#vision` do `index.html` mostra o IMV Vision rodando sobre uma empresa
**fictícia** — a Futebol Inc SaaS. Os números dessa empresa não são digitados no
HTML: saem daqui, calculados e conferidos.

É por isso que esta pasta existe. Editar 68 KB de HTML gerado à mão é como
acabam os dashboards que não fecham a conta.

## Os três arquivos

| Arquivo | O que é |
|---|---|
| `dados.mjs` | As premissas da empresa fictícia (receita, rubricas de despesa, prazos, dívida) e o motor que deriva tudo o mais. Também as asserções que impedem a publicação de um número que não fecha. |
| `conferir.mjs` | Roda as asserções e imprime o resultado mês a mês, o score, a simulação. É o que se usa ao mexer nas premissas. |
| `gerar.mjs` | Monta o HTML da seção, com os gráficos em SVG. |

## Como mexer nos números

```bash
node ferramentas/vision-demo/conferir.mjs        # confere e mostra o resultado
node ferramentas/vision-demo/gerar.mjs --aplicar # regenera e troca a seção no index.html
```

Sem `--aplicar`, o `gerar.mjs` só escreve `secao-vision.html` ao lado, para
conferir antes de aplicar. O `--aplicar` substitui o que está entre os
comentários `06 · IMV VISION` e `07 · DOIS CAMINHOS` do `index.html` — nada
mais do arquivo é tocado.

**Se uma asserção falhar, o `gerar.mjs` para e não escreve nada.** É de
propósito: a seção inteira existe para mostrar que os números da IMV fecham.

## O que as asserções garantem

- Toda identidade do DRE fecha (receita líquida, lucro bruto, EBITDA, lucro líquido).
- O saldo de caixa de cada mês é o do mês anterior mais o fluxo do mês.
- A carteira de clientes e a composição da receita somam a receita bruta do mês.
- O score reproduz exatamente a soma ponderada dos cinco pilares.
- A simulação com 0% devolve o baseline, e a economia chega inteira ao lucro
  (lucro presumido: o imposto incide sobre a receita).
- Cada apontamento da tela de Insights tem o dado que o sustenta: a margem cai
  mesmo em três meses seguidos, a despesa cresce mesmo mais de 10 p.p. acima da
  receita, o maior cliente passa mesmo de 30%.

## Regras de apresentação herdadas do produto

Estão em `C:\dev\imv-vision\docs` e valem também aqui:

- O dourado é da marca e do score. **Nunca entra em gráfico de dados.**
- A cor diz se é bom, não se subiu: despesa crescendo é vermelha.
- Variação de margem em pontos percentuais, nunca em porcentagem.
- Nada se afirma sobre o mês em curso. O mês de referência é sempre um mês fechado.
- A data da última leitura dos dados fica visível.

As três cores de série (`#2C5691` receita, `#B35C2E` despesa, `#00968F` lucro)
passaram pelo validador de paleta: banda de luminosidade, piso de croma,
separação sob protanopia e deuteranopia, e contraste contra o fundo branco.
Trocar uma delas no olho desfaz isso.

## O que fica de fora do deploy

A pasta está no `.vercelignore`: é ferramenta de manutenção, não vai para o ar.
