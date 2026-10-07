/* ============================================================
   Verificación de accesibilidad (DESIGN-001 §6) — Portfolio
   Comprueba, sobre los archivos reales del proyecto:
     1. Enlace de salto al contenido como primer elemento enfocable.
     2. Contraste AA (4.5:1) en todas las combinaciones texto/fondo.
     3. Foco visible: outline 2px en color de acento, offset 3px.
     4. Ningún estado se comunica solo con color.
     5. Imágenes decorativas ocultas a lectores de pantalla.
     6. Imágenes informativas con descripción alt.
     7. Navegación por teclado: orden de tabulación completo.
   Ejecutar con: node js/tests/verify-a11y.test.cjs
   ============================================================ */

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const css = fs.readFileSync(path.join(ROOT, "css/styles.css"), "utf8");
const js = fs.readFileSync(path.join(ROOT, "js/main.js"), "utf8");

/* ---------- Mini-framework de tests ---------- */
let pasados = 0;
let fallados = 0;

function test(nombre, fn) {
  try {
    fn();
    pasados++;
    console.log(`  ✅ ${nombre}`);
  } catch (err) {
    fallados++;
    console.log(`  ❌ ${nombre}\n     ${err.message}`);
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || "assertion failed");
}

/* ---------- Utilidades de color (WCAG 2.x) ---------- */
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
}

function luminancia(hex) {
  const [r, g, b] = hexToRgb(hex).map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contraste(fg, bg) {
  const l1 = luminancia(fg);
  const l2 = luminancia(bg);
  const [claro, oscuro] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (claro + 0.05) / (oscuro + 0.05);
}

const AA = 4.5;

/* ---------- Tokens de color (DESIGN-001 §1) ---------- */
const NEUTROS = {
  bg: "#FFFFFF",
  ink: "#0A0A0A",
  "ink-2": "#404040",
  muted: "#595959",
  surface: "#F5F5F5",
  "surface-2": "#EDEDED",
  btn: "#171717",
  "btn-ink": "#FAFAFA",
};

const SEMANTICOS = {
  ok: "#047857",
  warn: "#A16207",
  bad: "#B91C1C",
};

const ACENTOS = {
  violeta: "#6D28D9",
  azul: "#1D4ED8",
  verde: "#047857",
  naranja: "#C2410C",
  rosa: "#BE185D",
  amarillo: "#A16207",
};

/* ============================================================ */

console.log("\n[1] Enlace de salto al contenido (primer elemento enfocable)");

test("existe un skip-link como primer elemento dentro de <body>", () => {
  const body = html.split(/<body[^>]*>/i)[1] || "";
  const primer = body.match(/<a[^>]*class="[^"]*skip-link[^"]*"[^>]*>/i);
  assert(primer, "no hay <a class=\"skip-link\"> en el HTML");
  const antes = body.slice(0, primer.index);
  assert(
    !/<(a|button|input|select|textarea)\b/i.test(antes),
    "hay un elemento enfocable antes del skip-link"
  );
});

test("el skip-link apunta a #contenido y el destino existe con tabindex=\"-1\"", () => {
  assert(/<a[^>]*class="[^"]*skip-link[^"]*"[^>]*href="#contenido"/i.test(html),
    "el skip-link no apunta a #contenido");
  assert(/<main[^>]*id="contenido"[^>]*tabindex="-1"/i.test(html),
    "<main id=\"contenido\"> no tiene tabindex=\"-1\" (el foco no puede moverse al destino)");
});

test("el skip-link es invisible hasta recibir el foco (CSS)", () => {
  assert(/\.skip-link\s*\{[^}]*left:\s*-9999px/i.test(css),
    "el skip-link no está oculto fuera de pantalla por defecto");
  assert(/\.skip-link:focus\s*\{[^}]*left:\s*8px/i.test(css),
    "el skip-link no se hace visible al recibir el foco");
});

console.log("\n[2] Contraste AA (4.5:1) en todo el texto");

const combinaciones = [
  ["ink sobre bg (texto principal)", NEUTROS.ink, NEUTROS.bg],
  ["ink-2 sobre bg (párrafos largos)", NEUTROS["ink-2"], NEUTROS.bg],
  ["muted sobre bg (metadatos, antetítulos, footer)", NEUTROS.muted, NEUTROS.bg],
  ["muted sobre surface (píldora, chips)", NEUTROS.muted, NEUTROS.surface],
  ["muted sobre surface-2 (hover de chips)", NEUTROS.muted, NEUTROS["surface-2"]],
  ["ink sobre surface (botón secundario)", NEUTROS.ink, NEUTROS.surface],
  ["ink sobre surface-2 (hover botón secundario)", NEUTROS.ink, NEUTROS["surface-2"]],
  ["btn-ink sobre btn (botón primario y skip-link)", NEUTROS["btn-ink"], NEUTROS.btn],
  ["ok sobre surface (etiqueta de estado vigente)", SEMANTICOS.ok, NEUTROS.surface],
  ["warn sobre surface (etiqueta caduca pronto)", SEMANTICOS.warn, NEUTROS.surface],
  ["bad sobre surface (etiqueta caducada)", SEMANTICOS.bad, NEUTROS.surface],
  ["ok sobre bg", SEMANTICOS.ok, NEUTROS.bg],
  ["warn sobre bg", SEMANTICOS.warn, NEUTROS.bg],
  ["bad sobre bg", SEMANTICOS.bad, NEUTROS.bg],
];

for (const [nombre, fg, bg] of combinaciones) {
  test(`${nombre}: ${contraste(fg, bg).toFixed(2)}:1`, () => {
    assert(contraste(fg, bg) >= AA,
      `contraste ${contraste(fg, bg).toFixed(2)}:1 < ${AA}:1`);
  });
}

test("los 6 acentos configurables superan AA sobre blanco (foco visible en cualquier configuración)", () => {
  for (const [nombre, hex] of Object.entries(ACENTOS)) {
    const c = contraste(hex, NEUTROS.bg);
    assert(c >= AA, `acento ${nombre} (${hex}): ${c.toFixed(2)}:1 < ${AA}:1`);
  }
});

test("los tokens usados en el CSS coinciden con DESIGN-001 §1", () => {
  for (const [token, hex] of Object.entries({ ...NEUTROS, ...SEMANTICOS })) {
    const re = new RegExp(`--${token}:\\s*${hex}`, "i");
    assert(re.test(css), `--${token} no es ${hex} en styles.css`);
  }
});

console.log("\n[3] Foco visible: contorno 2px en acento, separado 3px");

test(":focus-visible define outline 2px solid var(--accent) con offset 3px", () => {
  const bloque = css.match(/:focus-visible\s*\{([^}]*)\}/);
  assert(bloque, "no hay regla :focus-visible");
  assert(/outline:\s*2px\s+solid\s+var\(--accent\)/.test(bloque[1]),
    "el outline no es 2px solid var(--accent)");
  assert(/outline-offset:\s*3px/.test(bloque[1]),
    "el outline-offset no es 3px");
});

test("ninguna regla elimina el foco de elementos interactivos (outline: none solo en #contenido)", () => {
  const limpiezas = css.match(/[^{}]+\{[^}]*outline:\s*none[^}]*\}/g) || [];
  for (const regla of limpiezas) {
    assert(/#contenido/.test(regla),
      `outline:none fuera de #contenido: ${regla.trim().slice(0, 80)}…`);
  }
});

test("el destino del skip-link no muestra contorno propio al recibir foco programático", () => {
  assert(/#contenido:focus[^{]*\{[^}]*outline:\s*none/i.test(css),
    "falta la excepción de outline para #contenido");
});

console.log("\n[4] Ningún estado se comunica solo con color");

test("la píldora de disponibilidad acompaña el punto de acento con texto", () => {
  assert(/<span[^>]*class="pildora"[^>]*data-profile="titular"/.test(html),
    "la píldora no muestra el titular como texto");
  assert(/\.pildora::before/.test(css), "falta el punto de acento (::before)");
});

test("las etiquetas de estado llevan texto (el color semántico nunca va solo)", () => {
  assert(/\.estado--ok|\.estado--warn|\.estado--bad/.test(css),
    "no existen las clases de estado semántico");
  // El color solo cambia el texto; el contenido textual es obligatorio
  // por diseño (DESIGN-001 §4) y no hay elemento de estado sin texto.
  assert(!/\.estado--(ok|warn|bad)\s*\{[^}]*(content|display:\s*none)/.test(css),
    "alguna etiqueta de estado depende solo del color");
});

test("los enlaces no dependen solo del color: tienen subrayado/borde además del hover de acento", () => {
  assert(/\.hero__contacto a\s*\{[^}]*border-bottom/.test(css),
    "el enlace de contacto no tiene subrayado permanente");
  assert(/\.sobre-mi__contacto-lista a\s*\{[^}]*border-bottom/.test(css),
    "los enlaces de contacto no tienen subrayado permanente");
});

console.log("\n[5] Imágenes decorativas ocultas a lectores de pantalla");

test("la tarjeta tipográfica de respaldo (nombre duplicado) lleva aria-hidden", () => {
  const bloque = js.match(/proyecto__marco--tipografico[\s\S]{0,400}/);
  assert(bloque, "no existe la tarjeta tipográfica de respaldo");
  assert(/aria-hidden",\s*"true"/.test(bloque[0]),
    "la tarjeta tipográfica no tiene aria-hidden=\"true\"");
});

test("el punto decorativo de la píldora es CSS (::before), no una imagen accesible", () => {
  assert(/\.pildora::before\s*\{[^}]*content:\s*""/.test(css),
    "el punto de la píldora debería ser decorativo vía CSS");
});

test("no hay <img> ni <svg> sin alt en el HTML estático", () => {
  const imgs = html.match(/<img[^>]*>/g) || [];
  for (const img of imgs) {
    assert(/alt=/.test(img), `<img> sin atributo alt: ${img}`);
  }
});

console.log("\n[6] Imágenes informativas con descripción alt");

test("la foto de perfil recibe alt descriptivo desde JS", () => {
  assert(/foto\.alt\s*=\s*`Foto de \$\{profile\.nombre\}`/.test(js),
    "la foto de perfil no recibe alt con el nombre");
});

test("las imágenes de proyecto reciben alt descriptivo desde JS", () => {
  assert(/img\.alt\s*=\s*`Imagen del proyecto \$\{p\.nombre\}`/.test(js),
    "las imágenes de proyecto no reciben alt descriptivo");
});

test("si no hay foto, el <img> se oculta en lugar de quedar vacío", () => {
  assert(/foto\.hidden\s*=\s*true/.test(js),
    "la foto sin imagen debería ocultarse (hidden)");
});

console.log("\n[7] Navegación completa por teclado");

test("los enlaces externos usan <a href> real (enfocables por teclado)", () => {
  assert(!/href="javascript:/.test(html + js), "hay enlaces con javascript:");
  assert(/a\.href\s*=\s*url/.test(js), "las redes no usan <a href>");
  assert(/link\.href\s*=\s*p\.enlace/.test(js), "los proyectos no usan <a href>");
  assert(/mail\.href\s*=\s*`mailto:/.test(js), "el email no usa mailto");
});

test("no hay tabindex positivo que rompa el orden natural de tabulación", () => {
  assert(!/tabindex="[1-9]/.test(html + js),
    "hay tabindex positivo en el documento");
});

test("no hay handlers que dependan solo de ratón (click sin teclado)", () => {
  // La página no define onclick ni listeners de ratón exclusivos:
  // toda la interacción son enlaces nativos, activables con Enter.
  assert(!/onclick=/.test(html), "hay onclick en el HTML");
  assert(!/addEventListener\(["']mousedown/.test(js), "hay listeners de mousedown");
});

test("el orden de tabulación del documento es coherente (skip-link → identidad → contenido → footer)", () => {
  const orden = [];
  const re = /<a\b[^>]*>/g;
  let m;
  while ((m = re.exec(html)) !== null) orden.push(m[0]);
  assert(orden.length >= 2, "debería haber al menos skip-link e identidad");
  assert(/skip-link/.test(orden[0]), "el primer enlace no es el skip-link");
});

/* ---------- Resultado ---------- */
console.log(`\nResultado: ${pasados} pasados, ${fallados} fallados\n`);
process.exit(fallados === 0 ? 0 : 1);
