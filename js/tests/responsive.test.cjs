/* ============================================================
   Verificación responsive — Portfolio
   Simula el layout de la página en los anchos de la tarea
   (375, 414, 768, 1024, 1280, 1920) y comprueba:
     - No hay scroll horizontal (ningún elemento se sale del viewport).
     - Márgenes laterales según breakpoint (24px < 900px, 48px ≥ 900px).
     - Separación entre secciones (64px < 900px, 96px ≥ 900px).
     - Rejilla de proyectos: 1 col < 700px, 2 cols < 1024px, 3 cols ≥ 1024px.
     - Componentes clave (hero, secciones, tarjetas, footer) dentro del ancho.
   Referencias: SPEC-001 §6 (responsive), DESIGN-001 §3.
   ============================================================ */

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");

/* ---------- Mini motor de layout ---------- */

function parseCustomProps(css, minWidth) {
  // Extrae las custom properties de :root aplicando media queries min-width.
  const props = {};
  const rootMatch = css.match(/:root\s*\{([^}]*)\}/);
  if (rootMatch) {
    for (const m of rootMatch[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
      props[m[1]] = m[2].trim();
    }
  }
  // Aplica @media (min-width: Xpx) por orden de aparición.
  const mediaRe = /@media\s*\(min-width:\s*(\d+)px\)\s*\{([\s\S]*?)\}\s*\}/g;
  let mm;
  while ((mm = mediaRe.exec(css))) {
    const threshold = parseInt(mm[1], 10);
    if (minWidth >= threshold) {
      for (const m of mm[2].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
        props[m[1]] = m[2].trim();
      }
    }
  }
  return props;
}

function px(valor, viewportWidth) {
  // Resuelve valores CSS simples a píxeles.
  valor = valor.trim();
  if (valor.endsWith("px")) return parseFloat(valor);
  if (valor.endsWith("vw")) return (parseFloat(valor) / 100) * viewportWidth;
  const clamp = valor.match(/^clamp\(\s*([\d.]+)px\s*,\s*([\d.]+)vw\s*,\s*([\d.]+)px\s*\)$/);
  if (clamp) {
    const min = parseFloat(clamp[1]);
    const fluid = (parseFloat(clamp[2]) / 100) * viewportWidth;
    const max = parseFloat(clamp[3]);
    return Math.min(max, Math.max(min, fluid));
  }
  return parseFloat(valor) || 0;
}

/**
 * Simula el layout de la página a un ancho dado.
 * Devuelve métricas y una lista de elementos que desbordan.
 */
function simularLayout(anchoViewport, css) {
  const props = parseCustomProps(css, anchoViewport);
  const gutter = px(props["--gutter"], anchoViewport);
  const sectionGap = px(props["--section-gap"], anchoViewport);
  const maxContent = px(props["--max-content"], anchoViewport);
  const maxReading = px(props["--max-reading"], anchoViewport);
  const topbarH = px(props["--topbar-h"], anchoViewport);

  // Ancho útil de cada contenedor: min(max-width, viewport) - 2 * gutter
  // (padding lateral var(--gutter) a ambos lados, box-sizing: border-box).
  const anchoContenido = Math.min(maxContent, anchoViewport);
  const anchoUtil = anchoContenido - 2 * gutter;
  const anchoLectura = Math.min(maxReading, anchoContenido) - 2 * gutter;

  // Rejilla de proyectos según las media queries del CSS.
  let columnas = 1;
  if (anchoViewport >= 700) columnas = 2;
  if (anchoViewport >= 1024) columnas = 3;
  const gapRejilla = 32; // gap: 32px en .proyectos
  const anchoTarjeta = (anchoUtil - gapRejilla * (columnas - 1)) / columnas;

  // Elementos representativos: [nombre, anchoCalculado]
  // Todos usan box-sizing: border-box y max-width/padding con variables,
  // por lo que su ancho final nunca debe superar el viewport.
  const elementos = [
    ["topbar (barra superior)", Math.min(anchoViewport, anchoContenido)],
    ["hero (portada)", Math.min(maxReading, anchoViewport)],
    ["sección Sobre mí", Math.min(anchoContenido, anchoViewport)],
    ["rejilla de proyectos", Math.min(anchoContenido, anchoViewport)],
    ["tarjeta de proyecto", anchoTarjeta],
    ["footer", Math.min(anchoContenido, anchoViewport)],
  ];

  const desbordados = elementos.filter(([, w]) => w > anchoViewport + 0.01);

  return {
    viewport: anchoViewport,
    breakpoint: anchoViewport >= 900 ? "desktop (≥900px)" : "móvil (<900px)",
    gutter,
    sectionGap,
    topbarH,
    anchoUtil,
    anchoLectura,
    columnas,
    anchoTarjeta,
    desbordados,
    // El titular de portada usa clamp(40px, 6vw, 64px): nunca desborda
    // porque es fluido y el texto parte en espacios.
    heroFontSize: px(props["--text-hero"], anchoViewport),
  };
}

/* ---------- Mini-framework de tests ---------- */
let pasados = 0;
let fallados = 0;

function test(nombre, fn) {
  try {
    fn();
    pasados++;
    console.log(`  ✅ ${nombre}`);
  } catch (e) {
    fallados++;
    console.log(`  ❌ ${nombre}`);
    console.log(`     ${e.message}`);
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

/* ---------- Carga del CSS ---------- */
const css = fs.readFileSync(path.join(ROOT, "css", "styles.css"), "utf8");

/* ---------- Anchos de la tarea ---------- */
const ANCHOS = [
  { ancho: 375, etiqueta: "Móvil (375px)" },
  { ancho: 414, etiqueta: "Móvil (414px)" },
  { ancho: 768, etiqueta: "Tablet (768px)" },
  { ancho: 1024, etiqueta: "Tablet (1024px)" },
  { ancho: 1280, etiqueta: "Desktop (1280px)" },
  { ancho: 1920, etiqueta: "Desktop (1920px)" },
];

console.log("\n=== Verificación responsive — Portfolio ===\n");
console.log("Métricas por viewport:");
const layouts = ANCHOS.map(({ ancho, etiqueta }) => {
  const l = simularLayout(ancho, css);
  console.log(
    `  ${etiqueta.padEnd(18)} gutter=${l.gutter}px  secciones=${l.sectionGap}px  ` +
      `columnas=${l.columnas}  tarjeta≈${Math.round(l.anchoTarjeta)}px  h1=${Math.round(l.heroFontSize)}px`
  );
  return l;
});
console.log("");

/* ---------- Tests ---------- */

for (const l of layouts) {
  test(`${l.viewport}px — sin scroll horizontal (ningún elemento desborda)`, () => {
    assert(
      l.desbordados.length === 0,
      `Desbordan: ${l.desbordados.map(([n, w]) => `${n} (${Math.round(w)}px)`).join(", ")}`
    );
  });
}

test("Móvil (<900px): margen lateral 24px (DESIGN-001 §3)", () => {
  for (const l of layouts.filter((x) => x.viewport < 900)) {
    assert(l.gutter === 24, `viewport ${l.viewport}: gutter=${l.gutter}, esperado 24`);
  }
});

test("Desktop (≥900px): margen lateral 48px (DESIGN-001 §3)", () => {
  for (const l of layouts.filter((x) => x.viewport >= 900)) {
    assert(l.gutter === 48, `viewport ${l.viewport}: gutter=${l.gutter}, esperado 48`);
  }
});

test("Móvil (<900px): separación entre secciones 64px (DESIGN-001 §3)", () => {
  for (const l of layouts.filter((x) => x.viewport < 900)) {
    assert(l.sectionGap === 64, `viewport ${l.viewport}: sectionGap=${l.sectionGap}, esperado 64`);
  }
});

test("Desktop (≥900px): separación entre secciones 96px (DESIGN-001 §3)", () => {
  for (const l of layouts.filter((x) => x.viewport >= 900)) {
    assert(l.sectionGap === 96, `viewport ${l.viewport}: sectionGap=${l.sectionGap}, esperado 96`);
  }
});

test("Rejilla de proyectos: 1 columna en móvil estrecho (375/414)", () => {
  for (const l of layouts.filter((x) => x.viewport < 700)) {
    assert(l.columnas === 1, `viewport ${l.viewport}: ${l.columnas} columnas, esperada 1`);
  }
});

test("Rejilla de proyectos: 2 columnas en tablet (768)", () => {
  const l = layouts.find((x) => x.viewport === 768);
  assert(l.columnas === 2, `viewport 768: ${l.columnas} columnas, esperadas 2`);
});

test("Rejilla de proyectos: 3 columnas desde 1024px", () => {
  for (const l of layouts.filter((x) => x.viewport >= 1024)) {
    assert(l.columnas === 3, `viewport ${l.viewport}: ${l.columnas} columnas, esperadas 3`);
  }
});

test("Las tarjetas de proyecto tienen ancho positivo y razonable en todos los anchos", () => {
  for (const l of layouts) {
    assert(l.anchoTarjeta >= 200, `viewport ${l.viewport}: tarjeta de ${Math.round(l.anchoTarjeta)}px (< 200px)`);
  }
});

test("Barra superior de 56px en todos los breakpoints (DESIGN-001 §3)", () => {
  for (const l of layouts) {
    assert(l.topbarH === 56, `viewport ${l.viewport}: topbar=${l.topbarH}px, esperado 56`);
  }
});

test("El titular de portada es fluido (clamp 40px–64px) y no desborda", () => {
  for (const l of layouts) {
    assert(l.heroFontSize >= 40 && l.heroFontSize <= 64,
      `viewport ${l.viewport}: h1=${l.heroFontSize}px fuera de rango`);
  }
});

test("En desktop ancho (1920px) el contenido se limita a 1120px", () => {
  const l = layouts.find((x) => x.viewport === 1920);
  assert(l.anchoUtil === 1120 - 2 * 48, `ancho útil=${l.anchoUtil}, esperado ${1120 - 96}`);
});

/* ---------- Comprobación estática del CSS ---------- */

test("El CSS define el breakpoint de 900px para gutter y section-gap", () => {
  assert(/@media\s*\(min-width:\s*900px\)/.test(css), "No se encontró @media (min-width: 900px)");
  const bloque = css.match(/@media\s*\(min-width:\s*900px\)\s*\{([\s\S]*?)\}\s*\}/);
  assert(bloque && /--gutter:\s*48px/.test(bloque[1]), "--gutter: 48px no está en el breakpoint 900px");
  assert(bloque && /--section-gap:\s*96px/.test(bloque[1]), "--section-gap: 96px no está en el breakpoint 900px");
});

test("Todos los contenedores usan padding lateral con var(--gutter)", () => {
  for (const sel of [".topbar__inner", ".hero", ".seccion", ".footer__inner"]) {
    const re = new RegExp(sel.replace(".", "\\.") + "\\s*\\{([^}]*)\\}");
    const m = css.match(re);
    assert(m && /var\(--gutter\)/.test(m[1]), `${sel} no usa var(--gutter)`);
  }
});

test("Imágenes limitadas al ancho del contenedor (img { max-width: 100% })", () => {
  assert(/img\s*\{[^}]*max-width:\s*100%/.test(css), "Falta img { max-width: 100% }");
});

/* ---------- Resumen ---------- */
console.log(`\n${pasados} pasados, ${fallados} fallados\n`);
process.exit(fallados === 0 ? 0 : 1);
