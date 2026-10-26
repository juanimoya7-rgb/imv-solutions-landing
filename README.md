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

## Seguridad (24-oct-2026)

Headers enviados por `vercel.json` en todas las respuestas:

| Header | Para qué |
|---|---|
| `Content-Security-Policy` | Solo se ejecuta JS propio + `assets.calendly.com`. iframes solo de `calendly.com`. Nadie puede embeber el sitio (`frame-ancestors 'none'`). |
| `Strict-Transport-Security` | `max-age` 2 años **con `includeSubDomains`** |
| `X-Frame-Options: DENY` | Anti-clickjacking para navegadores viejos |
| `Cross-Origin-Opener-Policy` | Aísla la ventana de pestañas abiertas con `target="_blank"` |
| `Cross-Origin-Resource-Policy` | Evita que otros sitios carguen los assets |
| `Permissions-Policy` | Apaga cámara, micrófono, geo, pagos, USB, sensores |
| `X-Permitted-Cross-Domain-Policies` | Bloquea políticas Flash/Acrobat heredadas |

### La CSP depende de un hash — importante

`script-src` incluye `'sha256-WZRJfWvsnNCPcxzZwvyhovnZGqhZaC+8gPGPRbx6wTk='`, que es el
hash del único script inline que queda, en el `<head>`:

```html
<script>document.documentElement.classList.add("js");</script>
```

**Si ese renglón se edita, hay que recalcular el hash** o el navegador lo bloquea
(el síntoma sería un parpadeo de estilos al cargar). Para recalcularlo:

```bash
node -e "console.log(require('crypto').createHash('sha256').update('document.documentElement.classList.add(\"js\");').digest('base64'))"
```

Por eso el script del popup de contacto salió del HTML a `assets/js/contato.js`:
cualquier script nuevo va en un archivo propio, nunca inline, y la CSP no se toca.

### `/api/lead`

Escribe en el CRM sin autenticar al visitante, así que tiene tres puertas:

- **Origen** — solo acepta POST disparado desde `imv.solutions` / `www.imv.solutions`
  (o desde el mismo host de la request). Un sitio de terceros no puede enviar el
  formulario en nombre de quien lo visita.
- **Ritmo** — 20 envíos por IP cada 10 minutos. Es a propósito un techo alto: en un
  estand de feria todo el pabellón sale por el mismo IP del wi-fi.
- **Tamaño** — corta cuerpos de más de 20 KB.

La respuesta de error ya **no** devuelve el texto que mandó Attio: ese texto puede
traer de vuelta el contenido de la request, y el diagnóstico queda solo en los logs
de Vercel.

La `ATTIO_API_KEY` vive únicamente en las variables de entorno de Vercel. El
`.gitignore` nuevo evita que un `.env` termine commiteado.

## DNS — el registro A del dominio raíz está roto

`imv.solutions` resuelve a **un solo** registro A: `216.198.79.1`. Desde la conexión
de casa (Boituva) esa IP **no responde**: 100% de pérdida en ping y timeout en los
puertos 80 y 443. El traceroute muere en el borde del ISP.

Por eso el sitio se veía mal o no cargaba en el computador, y bien en el celular:
el celular sale por la red móvil, que sí llega a esa IP.

Las otras IPs del mismo edge de Vercel sí responden desde esa conexión:

| IP | Desde casa |
|---|---|
| `216.198.79.1` (la que está puesta) | timeout |
| `76.76.21.21` | 200 OK, 16 ms |
| `64.29.17.1` (a la que resuelve `www`) | 200 OK, 12 ms |

**Arreglo:** en Squarespace DNS (los NS son `nsd1..4.squarespacedns.com`), cambiar el
registro **A de `@`** de `216.198.79.1` a `76.76.21.21`. Vercel sigue aceptando esa IP
para dominios raíz.

**No tocar los MX** — son los del correo de Google Workspace.

## Captación de contacto (popup)

`assets/js/contato.js` + el bloque `.contato-*` al final de `index.html`. Nació como
anuncio de la Feira do Empreendedor 2026 y quedó como captación permanente.

**Cuándo aparece:** lo que pase primero — que el visitante scrollee el 35% de la página,
o que lleve 30 segundos en ella. No aparece si ya dejó el contacto, y si lo cerró sin
llenarlo no vuelve por 30 días. Todo eso vive en `localStorage`, así que es por
navegador, no por persona.

Antes abría a los 900 ms **en cada visita**: era correcto para los 4 días de la feria,
no para un sitio permanente.

**Lo que escribe en Attio** (`api/lead.js`): crea o actualiza la empresa en `companies`
y le cuelga una nota. Dos cosas quedaron deliberadamente fuera:

- **No se agrega a ninguna lista.** La única que había era "FE26 - Feira do
  Empreendedor", específica de la feria. Cuando exista una lista para leads del sitio,
  se vuelve a enganchar en `api/lead.js`.
- **`Canal 1er contacto` y `Tanda origen` quedan vacíos.** Las opciones que existen en
  Attio son Email, WhatsApp, Instagram, Llamada, Presencial, LinkedIn e Indicação:
  ninguna dice "vino por el sitio", y poner Presencial sería dato falso. Si se crea la
  opción, es una línea en cada uno.

Mientras tanto el campo de texto `fonte_dados` guarda `Formulário do site — <origem>`,
donde `origem` sale del parámetro `?src=` de la URL.
