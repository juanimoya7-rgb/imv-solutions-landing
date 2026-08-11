# IMV Solutions — Landing Page

> Estrutura para crescer. Gestão para evoluir.

Landing page oficial de IMV Solutions, en **português do Brasil**. HTML + CSS + JS puro,
sin build ni dependencias. Deploy en Vercel.

---

## Estructura

```
IMV AI/
├─ index.html              ← la página completa (14 secciones)
├─ assets/
│  ├─ css/styles.css       ← sistema visual
│  ├─ js/main.js           ← configuración de Calendly + interacciones
│  └─ img/                 ← logo, águila, favicons, og-image
├─ vercel.json             ← headers de caché y seguridad
└─ README.md
```

## Sistema visual

| | |
|---|---|
| **Azul profundo** | `#1D3B66` — color estructural de la marca |
| **Dorado** | `#C9A227` — reservado para lo estratégico: CTAs, letras CRESCER, marcadores |
| **Navy profundo** | `#0C1B2E` — fondo de secciones oscuras |
| **Títulos** | Archivo 700/800, tracking cerrado |
| **Texto** | Source Sans 3 |
| **Nombre de marca** | Cinzel — serifa clásica que replica el wordmark del logo |
| **Forma** | Radios de 3–8px, hairlines, espacio negativo. Geometría, no cards redondeados. |

El logo es un doble chevrón ascendente — el águila traducida a alas y altura. Se repite
como favicon, en el header, en el footer y como remate del gráfico del hero.

## Secciones

1. Hero — headline, tagline y los dos CTAs
2. O problema — 10 situaciones reales del empresario
3. A solução — qué hace IMV + filosofía Diagnosticar → Estruturar → Implementar → Medir → Acompanhar
4. Metodologia CRESCER — las 7 dimensiones (sección oscura, centro de la página)
5. Os 4 pilares — Financeira, Operações, Comercial, Digital
6. Transformação — 7 pares antes → depois
7. Como funciona — la jornada Raio-X / Implementação / Acompanhamento
8. Raio-X Empresarial — presentación y CTA
9. Implementação Estratégica
10. Acompanhamento de Crescimento
11. Reunião gratuita — Calendly embebido
12. Para quem é a IMV
13. Dois caminhos — CTA final
14. Footer

## Calendly

El link real ya está configurado: `https://calendly.com/contato-imv/30min`

Está en `assets/js/main.js`, en el bloque `CONFIG` al inicio del archivo. El calendario
se carga solo cuando el visitante se acerca a la sección. Si el script falla o tarda más
de 10 segundos, aparece un botón directo en lugar de un hueco vacío.

**Los CTAs llevan `utm_content` distinto según su origen**, para que puedas ver en Calendly
de dónde vino cada agendamiento:

| CTA | `utm_content` |
|---|---|
| Hero — Raio-X | `raio-x-hero` |
| Sección Raio-X | `raio-x-secao` |
| Calendario embebido | `reuniao-gratuita-embed` |
| Caminho 01 (final) | `raio-x-final` |
| Caminho 02 (final) | `reuniao-final` |
| Footer | `footer` |

## Assets de marca

Generados a partir del logo original (`Logo IMV Solutions.png`, 1254×1254, 1.35 MB). Se le
extrajo el fondo azul por distancia de color, con las bordes desmezcladas para que no
quede halo oscuro. Todo pesa ~310 KB en conjunto.

| Archivo | Uso |
|---|---|
| `logo-imv-solutions.png` (900×557) | Lockup completo, transparente. Footer y fondos oscuros. |
| `imv-aguia.png` (420×162) | Águila sola, transparente. Header y remate del gráfico del hero. |
| `imv-aguia-sm.png` (96×37) | Versión chica de reserva. |
| `og-image.jpg` (1200×630) | Preview al compartir el link. |
| `favicon.png` (64×64) · `apple-touch-icon.png` (180×180) | Íconos. |

El lockup lleva el texto en blanco, así que **solo funciona sobre fondo oscuro**. Sobre
blanco se usa el águila más el nombre en texto.

El azul `--navy-900` (`#061E40`) está muestreado del fondo del logo original, para que las
secciones oscuras vivan en el mismo tono que la marca.

## Pendiente

- **Instagram y LinkedIn** — están como comentario HTML en la columna "Fale com a IMV"
  del footer, listos para descomentar cuando tengas los perfiles.
- **Destino propio para el Raio-X** — hoy los dos caminos llegan al mismo Calendly, diferenciados
  solo por UTM. Si querés un evento separado, un formulario o WhatsApp para el Raio-X, se cambia
  en los `href` correspondientes.
- **DNS** — el sitio apunta a `https://imv.solutions` (`canonical`, `og:url`, `og:image`).
  Al conectar el dominio en Vercel, tocar solo los registros A/CNAME. **No tocar los MX**,
  que son los que hacen funcionar el correo de Google Workspace.
- **Política de Privacidade** — obligatoria bajo LGPD, ya que Calendly recoge datos personales.

## Verificado

- Sin desborde horizontal en 375px, 768px y 1280px
- Sin errores de consola
- Archivo y Source Sans 3 cargan correctamente
- Un solo `<h1>`, jerarquía semántica de `h2`/`h3` correcta
- Skip link, foco visible, `aria-expanded` en el menú, respeta `prefers-reduced-motion`
- JSON-LD de `ProfessionalService` para SEO

## Deploy

El repo está conectado a Vercel. Cada push a `main` redespliega solo.
