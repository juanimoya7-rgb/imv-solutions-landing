# IMV Solutions — Landing Page

Landing page de consultoría en gestión empresarial, en **português do Brasil**, con
agendamiento de reunión de diagnóstico gratuita vía **Calendly** embebido.

HTML + CSS + JavaScript puro. Sin build, sin dependencias, sin `npm install`.

---

## Estructura

```
IMV AI/
├─ index.html              ← toda la página
├─ assets/
│  ├─ css/styles.css       ← estilos
│  └─ js/main.js           ← configuración + interacciones
└─ README.md
```

## Cómo verla

Abrí `index.html` con doble clic. Eso es todo.

> El calendario de Calendly necesita conexión a internet. Sin conexión (o si el link
> no está configurado todavía), la página muestra automáticamente los botones de
> WhatsApp y e-mail en lugar del calendario.

---

## Lo que tenés que configurar

### 1. Link de Calendly — **obligatorio**

Abrí `assets/js/main.js`. En la primera línea del bloque `CONFIG`:

```js
calendlyUrl: "https://calendly.com/SEU-USUARIO/diagnostico-gratuito",
```

Reemplazá con el link real de tu evento de Calendly. Se saca desde el panel de
Calendly → el evento → **Copy link**. Mientras diga `SEU-USUARIO`, la página muestra
el fallback de contacto directo.

En Calendly conviene crear el evento así:
- Nombre: `Diagnóstico gratuito`
- Duración: 45 minutos
- Ubicación: Google Meet / Zoom (link automático)
- Preguntas del formulario: empresa, facturación anual aproximada, principal desafío

Los colores del calendario ya vienen configurados para que combinen con la paleta del
sitio (verde `#22705F`). Se ajustan en el mismo bloque `CONFIG`.

### 2. Datos de contacto — **obligatorio**

Están como placeholders en `index.html`. Buscá y reemplazá:

| Placeholder | Dónde aparece |
|---|---|
| `5511900000000` | links de WhatsApp (3 lugares: sección agendar, fallback, botón flotante) |
| `+55 11 90000-0000` | texto visible del teléfono (sección agendar y footer) |
| `contato@imvsolutions.com.br` | e-mail (sección agendar, fallback, footer) |

El formato del número de WhatsApp es `55` + DDD + número, todo junto y sin símbolos.

### 3. Números de la sección "Resultados" — **importante**

En `index.html`, sección `#resultados`, hay cuatro estadísticas:

```html
<span class="stat__value" data-count="18" data-suffix="%">0%</span>
```

**Son valores de ejemplo.** Cambiá `data-count` por tus números reales o borrá las
tarjetas que no puedas respaldar. Publicar métricas inventadas es un riesgo legal y
de reputación real, sobre todo en una consultoría.

Lo mismo aplica a los plazos del método ("2 a 3 semanas", "3 a 6 meses") y al piso de
facturación mencionado en el FAQ (R$ 5 milhões) — ajustalos a tu operación.

---

## Lo que ya está resuelto

- **Responsive** — probado en 375px, 768px y 1280px. Menú hamburguesa en mobile.
- **Accesibilidad** — skip link, navegación por teclado, `aria-expanded` en el menú,
  foco visible, contraste AA, respeta `prefers-reduced-motion`.
- **Performance** — cero fuentes externas, íconos SVG inline, el script de Calendly se
  carga recién cuando el usuario se acerca a la sección de agendamiento.
- **SEO básico** — `title`, `meta description`, Open Graph, `lang="pt-BR"`.
- **Fallback de Calendly** — si el script no carga en 10 segundos o falla, aparecen
  los canales de contacto directo en vez de un espacio vacío.

---

## Secciones de la página

1. **Hero** — propuesta de valor + tarjeta con lo que incluye el diagnóstico
2. **Faixa de setores** — industrias atendidas
3. **Desafios** — 4 dolores típicos del cliente
4. **Serviços** — 6 frentes de trabajo
5. **Método** — 4 etapas, del diagnóstico a la sustentación
6. **Resultados** — 4 métricas con contador animado
7. **Sobre** — posicionamiento y valores + panel de "cómo empieza un proyecto"
8. **Agendar** — Calendly embebido + cómo prepararse
9. **FAQ** — 6 preguntas frecuentes
10. **CTA final + footer**

---

## Publicarla

Es un sitio estático: subís la carpeta entera y funciona.

- **Netlify / Vercel** — arrastrás la carpeta a la interfaz web, listo.
- **GitHub Pages** — push al repo, activás Pages en la rama `main`.
- **Hosting tradicional** — subís todo por FTP a `public_html/`.

Antes de publicar: conseguí el dominio, configurá el link de Calendly, reemplazá los
datos de contacto y escribí las páginas de Política de Privacidade y Termos de Uso
(hoy los links del footer apuntan a `#`). Para operar en Brasil, la política de
privacidad debe cubrir LGPD.
