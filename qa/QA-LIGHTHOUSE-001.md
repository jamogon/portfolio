# QA — Auditoría Lighthouse (task_351e47254a0150ec)

**Fecha:** 2026-10-07
**Objeto:** Portfolio (SPEC-001 v3, sección 9)
**Herramienta:** Lighthouse CLI 12.8.2 · Chromium 154 (headless)
**URL auditada:** build local servido en `http://localhost:8080/` (idéntico al que se publica en GitHub Pages; la URL pública `https://bposti.github.io/portfolio-lab/` devuelve 404 — aún no desplegada)
**Informe completo:** `qa/lighthouse-mobile.html`

## Result

**FAIL**

## Scores

| Categoría       | Móvil | Escritorio | Umbral | Resultado |
|-----------------|:-----:|:----------:|:------:|:---------:|
| Performance     |  70   |     76     |  > 90  | ❌ FAIL   |
| Accessibility   |  100  |    100     |  > 90  | ✅ PASS   |
| Best Practices  |  96   |     96     |  > 90  | ✅ PASS   |
| SEO             |  100  |    100     |  > 90  | ✅ PASS   |

## Checks

### Performance > 90
- **Expected:** > 90
- **Actual:** 70 (móvil) / 76 (escritorio)
- **Result:** FAIL

### Accessibility > 90
- **Expected:** > 90
- **Actual:** 100
- **Result:** PASS

### Best Practices > 90
- **Expected:** > 90
- **Actual:** 96
- **Result:** PASS

### SEO > 90
- **Expected:** > 90
- **Actual:** 100
- **Result:** PASS

## Issues

### ISSUE-1 — CLS (Cumulative Layout Shift) muy alto — crítico
- **Métrica:** CLS = **0.64** (móvil) / **0.71** (escritorio). Umbral "bueno": ≤ 0.1.
- **Peso en la nota:** 25 %. Es la causa principal del suspenso en Performance.
- **Causa (verificada en el reporte):** 1 layout shift en `<section class="seccion" aria-labelledby="sobre-mi-titulo">` (la sección **Sobre mí**).
- **Origen en código:** `index.html` renderiza esa sección vacía y `js/main.js` la rellena después (`document.createElement` + `appendChild` de descripción, datos personales, contacto y formación) al cargar `profile.json`. Al inyectarse el contenido tras el primer paint, el resto de la página se desplaza.
- **Relación con SPEC:** sección 9 exige que la página se visualice correctamente; un CLS de 0.64 es un defecto de estabilidad visual.

### ISSUE-2 — FCP / LCP lentos en móvil
- **Métricas móvil:** FCP = 2.4 s (score 0.69), LCP = 2.7 s (score 0.86). Umbrales "buenos": FCP ≤ 1.8 s, LCP ≤ 2.5 s.
- **Causa (audit `render-blocking-resources`, ahorro est. 1 720 ms):**
  - Hoja de Google Fonts (Geist / Geist Mono): ~773 ms render-blocking.
  - `css/styles.css`: ~302 ms render-blocking.

### ISSUE-3 — Imágenes sin optimizar
- **Audits afectados (móvil):** `uses-responsive-images` (ahorro ~159 KiB), `modern-image-formats` (~165 KiB), `uses-optimized-images` (~86 KiB).
- **Detalle:** `assets/project-0X.jpg` (~50 KB cada una) se sirven a resolución completa también en móvil y en formato JPG (sin WebP/AVIF ni `srcset`).

### ISSUE-4 — Error de consola: favicon 404 (Best Practices)
- **Audit:** `errors-in-console` → score 0. Único motivo de que Best Practices sea 96 y no 100.
- **Detalle:** `GET /favicon.ico` → 404. No hay favicon declarado en `index.html` ni archivo en la raíz.

## Recommendations

1. **Eliminar el CLS (ISSUE-1):** reservar el espacio de la sección "Sobre mí" antes de cargar los datos — renderizar el contenido en el HTML estático, o usar un skeleton/placeholder con altura fija (`min-height`) en `.sobre-mi` para que la inyección de JS no desplace el layout. Es la corrección de mayor impacto (25 % de la nota).
2. **Reducir render-blocking (ISSUE-2):** precargar la fuente (`<link rel="preload">` del woff2 + `font-display: swap`), o autoalojar Geist en `assets/`; considerar inline del CSS crítico o minificar `styles.css`.
3. **Optimizar imágenes (ISSUE-3):** generar versiones responsive (`srcset`/`sizes`) y formato moderno (WebP/AVIF) para las imágenes de proyectos.
4. **Favicon (ISSUE-4):** añadir un favicon (p. ej. `assets/profile.svg` ya existente) y declararlo con `<link rel="icon">` para llevar Best Practices a 100.
5. **Re-auditar tras el deploy real:** la URL pública de GitHub Pages devuelve 404; cuando se despliegue (DEPLOY.md), repetir el audit sobre la URL final para validar en producción.

> Nota de método: los scores de Lighthouse en local (python http.server) son representativos de los de GitHub Pages en cuanto a CLS, render-blocking e imágenes, ya que dependen del código y los recursos, no del servidor.
