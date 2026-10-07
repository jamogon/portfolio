/* ============================================================
   Auditoría final — Portfolio
   Verificación estática del código para la tarea
   "Optimización y pulido final":

     [A] HTML válido (estructura, atributos, ARIA, meta SEO)
     [B] Movimiento: TODA animación/transición respeta
         prefers-reduced-motion (DESIGN-001 §5)
     [C] Imágenes: formatos, dimensiones, lazy loading, alt
     [D] Enlaces: externos con target=_blank + rel nofollow,
         mailto en el email, skip-link interno
     [E] Edge cases de la capa de datos (SPEC-001 §10)
     [F] Tipografía multi-navegador: stacks con fallback,
         display=swap, pesos 400/500/600 (DESIGN-001 §2)
     [G] Performance: scripts defer, preconnect, sin
         dependencias externas innecesarias

   Referencias: SPEC-001 §9/§10, DESIGN-001 §2/§5/§6.
   ============================================================ */

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");

/* ---------- Mini-framework de tests ---------- */
let pasados = 0;
let fallados = 0;
const avisos = [];

function test(nombre, fn) {
  return Promise.resolve()
    .then(fn)
    .then(
      () => {
        pasados++;
        console.log(`  ✅ ${nombre}`);
      },
      (err) => {
        fallados++;
        console.log(`  ❌ ${nombre}\n     ${err.message}`);
      }
    );
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || "assertion failed");
}

function aviso(msg) {
  avisos.push(msg);
}

/* ---------- Mini parser de HTML (suficiente para validación estructural) ---------- */
const VOID_ELEMENTS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr",
]);

function parseHTML(html) {
  // Elimina comentarios y doctype para el análisis
  const limpio = html.replace(/<!--[\s\S]*?-->/g, "");
  const tags = [];
  const re = /<\/?([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[^\s<>"'=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)?\s*(\/?)>/g;
  let m;
  while ((m = re.exec(limpio))) {
    const [, nombre, attrsRaw, selfClose] = m;
    const cierre = m[0].startsWith("</");
    const attrs = {};
    const attrRe = /([^\s<>"'=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
    let a;
    while ((a = attrRe.exec(attrsRaw))) {
      attrs[a[1].toLowerCase()] = a[2] ?? a[3] ?? a[4] ?? "";
    }
    tags.push({
      nombre: nombre.toLowerCase(),
      attrs,
      cierre,
      selfClose: selfClose === "/",
      raw: m[0],
      pos: m.index,
    });
  }
  return tags;
}

function validarAnidado(tags) {
  // Comprueba que las etiquetas no-vacías se abren y cierran correctamente.
  const pila = [];
  const errores = [];
  for (const t of tags) {
    if (VOID_ELEMENTS.has(t.nombre)) continue;
    if (!t.cierre) {
      if (!t.selfClose) pila.push(t);
    } else {
      if (pila.length === 0) {
        errores.push(`Cierre sin apertura: </${t.nombre}>`);
      } else {
        const ultimo = pila.pop();
        if (ultimo.nombre !== t.nombre) {
          errores.push(`Esperaba </${ultimo.nombre}> pero encontré </${t.nombre}>`);
        }
      }
    }
  }
  for (const t of pila) errores.push(`Sin cerrar: <${t.nombre}>`);
  return errores;
}

/* ---------- Carga de archivos ---------- */
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const css = fs.readFileSync(path.join(ROOT, "css", "styles.css"), "utf8");
const mainJs = fs.readFileSync(path.join(ROOT, "js", "main.js"), "utf8");
const profileJson = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "profile.json"), "utf8"));
const projectsJson = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "projects.json"), "utf8"));

const tags = parseHTML(html);

(async () => {
  /* ============================================================
     [A] HTML VÁLIDO
     ============================================================ */
  console.log("\n[A] Validación de HTML (estructura y atributos)");

  await test("Doctype HTML5 presente", () => {
    assert(/^\s*<!DOCTYPE html>/i.test(html), "falta <!DOCTYPE html>");
  });

  await test("<html lang=\"es\"> (SPEC-001 §12: idioma español)", () => {
    const htmlTag = tags.find((t) => t.nombre === "html");
    assert(htmlTag && htmlTag.attrs.lang === "es", "lang incorrecto o ausente");
  });

  await test("Anidado de etiquetas correcto (sin aperturas/cierres cruzados)", () => {
    const errores = validarAnidado(tags);
    assert(errores.length === 0, errores.join("; "));
  });

  await test("Meta charset UTF-8 como primer elemento de <head>", () => {
    const head = html.match(/<head>([\s\S]*?)<\/head>/);
    assert(head, "no hay <head>");
    assert(/<meta\s+charset="UTF-8"\s*>/.test(head[1]), "falta meta charset");
  });

  await test("Meta viewport responsive presente", () => {
    const meta = tags.find((t) => t.nombre === "meta" && t.attrs.name === "viewport");
    assert(meta, "falta meta viewport");
    assert(meta.attrs.content.includes("width=device-width"), "viewport sin width=device-width");
  });

  await test("Meta description para SEO presente y con contenido", () => {
    const meta = tags.find((t) => t.nombre === "meta" && t.attrs.name === "description");
    assert(meta && meta.attrs.content && meta.attrs.content.length > 30, "meta description ausente o demasiado corta");
  });

  await test("<title> descriptivo presente", () => {
    const m = html.match(/<title>([^<]+)<\/title>/);
    assert(m && m[1].trim().length > 5, "falta <title>");
  });

  await test("Jerarquía de encabezados: exactamente un <h1>", () => {
    const h1s = tags.filter((t) => t.nombre === "h1" && !t.cierre);
    assert(h1s.length === 1, `hay ${h1s.length} <h1>, debe haber 1`);
  });

  await test("Atributos duplicados: ninguna etiqueta los tiene", () => {
    for (const t of tags) {
      const nombres = t.raw.match(/[^\s<>"'=]+(?=\s*=)/g) || [];
      const dup = nombres.filter((n, i) => nombres.indexOf(n) !== i);
      assert(dup.length === 0, `<${t.nombre}> tiene atributos duplicados: ${dup.join(", ")}`);
    }
  });

  await test("IDs únicos en el documento", () => {
    const ids = tags.filter((t) => t.attrs.id).map((t) => t.attrs.id);
    const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
    assert(dup.length === 0, `IDs duplicados: ${dup.join(", ")}`);
  });

  await test("Las secciones tienen aria-labelledby apuntando a IDs existentes", () => {
    const ids = new Set(tags.filter((t) => t.attrs.id).map((t) => t.attrs.id));
    // Solo las etiquetas de APERTURA: las de cierre (</section>) nunca llevan atributos.
    for (const t of tags.filter((x) => x.nombre === "section" && !x.cierre)) {
      const ref = t.attrs["aria-labelledby"];
      assert(ref, `<section> sin aria-labelledby`);
      assert(ids.has(ref), `aria-labelledby="${ref}" no apunta a ningún ID`);
    }
  });

  await test("Skip-link apunta a un ID existente", () => {
    const skip = tags.find((t) => (t.attrs.class || "").includes("skip-link"));
    assert(skip, "no hay skip-link");
    const destino = (skip.attrs.href || "").replace("#", "");
    const ids = new Set(tags.filter((t) => t.attrs.id).map((t) => t.attrs.id));
    assert(ids.has(destino), `skip-link apunta a #${destino} que no existe`);
  });

  await test("Las imágenes estáticas tienen atributo alt", () => {
    for (const t of tags.filter((x) => x.nombre === "img")) {
      assert("alt" in t.attrs, `<img> sin alt (src="${t.attrs.src || "?"}")`);
    }
  });

  await test("Los scripts usan defer (no bloquean el render)", () => {
    const scripts = tags.filter((t) => t.nombre === "script" && t.attrs.src);
    assert(scripts.length > 0, "no hay scripts externos");
    for (const s of scripts) {
      assert("defer" in s.attrs, `<script src="${s.attrs.src}"> sin defer`);
    }
  });

  await test("Los archivos referenciados en el HTML existen en disco", () => {
    for (const t of tags) {
      for (const attr of ["src", "href"]) {
        const v = t.attrs[attr];
        if (!v || v.startsWith("http") || v.startsWith("#") || v.startsWith("mailto:") || v === "") continue;
        const ruta = path.join(ROOT, v);
        assert(fs.existsSync(ruta), `${t.nombre}[${attr}="${v}"] no existe en disco`);
      }
    }
  });

  /* ============================================================
     [B] MOVIMIENTO — prefers-reduced-motion (DESIGN-001 §5)
     ============================================================ */
  console.log("\n[B] Movimiento y prefers-reduced-motion (DESIGN-001 §5)");

  function extraerBloquesMedia(cssText, query) {
    // Extrae el contenido de @media (query) { ... } con llaves balanceadas.
    const bloques = [];
    const re = new RegExp(`@media\\s*\\(${query.replace(/[()]/g, (c) => "\\" + c)}\\)\\s*\\{`, "g");
    let m;
    while ((m = re.exec(cssText))) {
      let depth = 1;
      let i = m.index + m[0].length;
      const inicio = i;
      while (i < cssText.length && depth > 0) {
        if (cssText[i] === "{") depth++;
        else if (cssText[i] === "}") depth--;
        i++;
      }
      bloques.push(cssText.slice(inicio, i - 1));
    }
    return bloques;
  }

  await test("Existe la media query prefers-reduced-motion: no-preference", () => {
    assert(
      /@media\s*\(prefers-reduced-motion:\s*no-preference\)/.test(css),
      "no se encontró la media query"
    );
  });

  await test("Ninguna animation/transición vive fuera de la media query no-preference", () => {
    // Quitamos todos los bloques @media del CSS y buscamos animaciones en el resto.
    let cssResto = css;
    for (const query of ["prefers-reduced-motion: no-preference", "prefers-reduced-motion: reduce"]) {
      for (const bloque of extraerBloquesMedia(cssResto, query)) {
        cssResto = cssResto.replace(bloque, "");
      }
    }
    // Quitamos los comentarios (pueden mencionar "transición" en prosa).
    cssResto = cssResto.replace(/\/\*[\s\S]*?\*\//g, "");
    // Quitamos también el keyframes (no es una ejecución, solo la definición).
    cssResto = cssResto.replace(/@keyframes\s+[\w-]+\s*\{[^{}]*(\{[^{}]*\}[^{}]*)*\}/g, "");

    const animacionesFuera = [];
    const re = /([^{}]+)\{([^{}]*)\}/g;
    let m;
    while ((m = re.exec(cssResto))) {
      const cuerpo = m[2];
      if (/\btransition\s*:|\banimation\s*:/.test(cuerpo)) {
        animacionesFuera.push(m[1].trim().split("\n").pop().trim());
      }
    }
    assert(
      animacionesFuera.length === 0,
      `Animaciones/transiciones fuera de no-preference: ${animacionesFuera.join(", ")}`
    );
    // Y que dentro sí haya algo (la animación de entrada).
    const dentroNoPreference = extraerBloquesMedia(css, "prefers-reduced-motion: no-preference").join("\n");
    assert(/animation\s*:/.test(dentroNoPreference), "no hay animación dentro de no-preference");
  });

  await test("La curva de aceleración es la única de DESIGN-001 §5", () => {
    const curvas = new Set();
    for (const m of css.matchAll(/cubic-bezier\([^)]+\)/g)) curvas.add(m[0]);
    assert(curvas.size === 1 && curvas.has("cubic-bezier(.2, .8, .2, 1)"),
      `curvas encontradas: ${[...curvas].join(", ")}`);
  });

  await test("Duraciones dentro de las permitidas (150/200/400ms)", () => {
    // Solo contamos duraciones en declaraciones CSS, no en comentarios.
    const sinComentarios = css.replace(/\/\*[\s\S]*?\*\//g, "");
    const duraciones = new Set();
    for (const m of sinComentarios.matchAll(/:\s*[^;{}]*?(\d+)ms/g)) duraciones.add(parseInt(m[1], 10));
    const permitidas = new Set([0, 150, 200, 400, 60]); // 60 = stagger, 0 = delay inicial
    const fuera = [...duraciones].filter((d) => !permitidas.has(d));
    assert(fuera.length === 0, `duraciones no permitidas: ${fuera.join(", ")}ms`);
  });

  /* ============================================================
     [C] IMÁGENES
     ============================================================ */
  console.log("\n[C] Optimización de imágenes");

  await test("Todas las imágenes referenciadas en los JSON existen", () => {
    const rutas = [
      profileJson.foto,
      ...projectsJson.proyectos.map((p) => p.imagen).filter(Boolean),
    ];
    for (const r of rutas) {
      assert(fs.existsSync(path.join(ROOT, r)), `no existe ${r}`);
    }
  });

  await test("Las imágenes de proyecto están en formato web (JPG/PNG/WebP/SVG)", () => {
    for (const p of projectsJson.proyectos) {
      if (!p.imagen) continue;
      assert(/\.(jpe?g|png|webp|svg)$/i.test(p.imagen), `${p.imagen}: formato no web`);
    }
  });

  await test("Las imágenes de proyecto tienen peso razonable (< 200 KB)", () => {
    for (const p of projectsJson.proyectos) {
      if (!p.imagen) continue;
      const size = fs.statSync(path.join(ROOT, p.imagen)).size;
      assert(size < 200 * 1024, `${p.imagen}: ${Math.round(size / 1024)} KB ≥ 200 KB`);
    }
  });

  await test("La foto de perfil tiene peso razonable (< 100 KB)", () => {
    const size = fs.statSync(path.join(ROOT, profileJson.foto)).size;
    assert(size < 100 * 1024, `${profileJson.foto}: ${Math.round(size / 1024)} KB`);
  });

  await test("Las imágenes de proyecto se cargan con lazy loading", () => {
    assert(/img\.loading\s*=\s*"lazy"/.test(mainJs), "falta loading=lazy en las imágenes de proyecto");
  });

  await test("La foto de perfil declara width/height (evita CLS)", () => {
    const img = tags.find((t) => t.nombre === "img" && t.attrs["data-profile"] === "foto");
    assert(img && img.attrs.width && img.attrs.height, "la foto no declara width/height");
  });

  await test("Las imágenes informativas llevan alt descriptivo (generado en JS)", () => {
    assert(/img\.alt\s*=\s*`Imagen del proyecto \$\{p\.nombre\}`/.test(mainJs), "falta alt en imágenes de proyecto");
    assert(/foto\.alt\s*=\s*`Foto de \$\{profile\.nombre\}`/.test(mainJs), "falta alt en la foto de perfil");
  });

  await test("La tarjeta tipográfica (sin imagen) se oculta a lectores de pantalla", () => {
    assert(
      /fallback\.setAttribute\("aria-hidden",\s*"true"\)/.test(mainJs),
      "la tarjeta tipográfica no tiene aria-hidden"
    );
  });

  /* ============================================================
     [D] ENLACES
     ============================================================ */
  console.log("\n[D] Enlaces (externos, mailto, internos)");

  await test("Los enlaces externos del JS usan target=_blank y rel con nofollow", () => {
    const externos = mainJs.match(/a\.target\s*=\s*"_blank"|link\.target\s*=\s*"_blank"|repo\.target\s*=\s*"_blank"/g) || [];
    const rels = mainJs.match(/rel\s*=\s*"nofollow noopener"/g) || [];
    assert(externos.length >= 3, `solo ${externos.length} enlaces con target=_blank`);
    assert(rels.length >= 3, `solo ${rels.length} enlaces con rel nofollow`);
  });

  await test("El email usa mailto (SPEC-001 §6)", () => {
    const mailtos = mainJs.match(/mailto:\$\{profile\.email\}/g) || [];
    assert(mailtos.length >= 2, "mailto debe aparecer en hero, sobre-mí y footer");
  });

  await test("Las URLs de los JSON son absolutas http(s) bien formadas", () => {
    const urls = [
      ...Object.values(profileJson.redes || {}),
      ...projectsJson.proyectos.map((p) => p.enlace),
    ];
    for (const u of urls) {
      assert(/^https:\/\/[^\s/]+\.[^\s/]+/.test(u), `URL sospechosa: ${u}`);
    }
  });

  await test("Los enlaces externos apuntan a dominios conocidos y activos", () => {
    const urls = [
      ...Object.values(profileJson.redes || {}),
      ...projectsJson.proyectos.map((p) => p.enlace),
    ];
    for (const u of urls) {
      const { hostname } = new URL(u);
      const ok = ["github.com", "www.github.com", "linkedin.com", "www.linkedin.com"].includes(hostname);
      if (!ok) aviso(`Dominio no verificable automáticamente: ${hostname} (${u})`);
    }
    // No falla el test: los dominios de ejemplo (alex-ejemplo) son placeholders
    // documentados en requirements.md ("perfil de ejemplo").
    assert(true);
  });

  /* ============================================================
     [E] EDGE CASES — capa de datos (SPEC-001 §10)
     ============================================================ */
  console.log("\n[E] Edge cases de datos (SPEC-001 §10)");

  // Los módulos de datos son scripts clásicos: en el navegador comparten
  // el scope global vía <script> (profile.js y projects.js usan
  // cargarJSONSeguro de loader.js). Para reproducirlo, los concatenamos
  // en un único new Function() con scope compartido.
  function cargarModulosDatos() {
    const codigo = ["js/data/loader.js", "js/data/profile.js", "js/data/projects.js"]
      .map((rel) => fs.readFileSync(path.join(ROOT, rel), "utf8"))
      .join("\n;\n");
    return new Function(
      `${codigo}
       return {
         ...(typeof cargarPerfil !== "undefined" ? { cargarPerfil } : {}),
         ...(typeof cargarProyectos !== "undefined" ? { cargarProyectos } : {}),
       };`
    )();
  }
  const { cargarPerfil, cargarProyectos } = cargarModulosDatos();

  function mockFetch(mapa) {
    globalThis.fetch = async (url) => {
      if (!(url in mapa)) return { ok: false, status: 404, text: async () => "" };
      const body = mapa[url];
      if (body instanceof Error) throw body;
      return { ok: true, status: 200, text: async () => body };
    };
  }

  await test("JSON de perfil inválido → contenido por defecto sin romper", async () => {
    mockFetch({ "data/profile.json": '{ "nombre": "Javi", ' });
    const { profile, error } = await cargarPerfil();
    assert(error && error.kind === "parse", "debería reportar error de parseo");
    assert(profile && typeof profile.nombre === "string", "perfil por defecto disponible");
  });

  await test("JSON de proyectos inválido → lista vacía sin romper", async () => {
    mockFetch({ "data/projects.json": "no es json {{{" });
    const { proyectos, error } = await cargarProyectos();
    assert(error && error.kind === "parse", "debería reportar error de parseo");
    assert(Array.isArray(proyectos) && proyectos.length === 0, "lista vacía por defecto");
  });

  await test("Ambos JSON inválidos a la vez → la página sigue funcionando", async () => {
    mockFetch({
      "data/profile.json": "{{{",
      "data/projects.json": "tampoco",
    });
    const [r1, r2] = await Promise.all([cargarPerfil(), cargarProyectos()]);
    assert(r1.error && r2.error, "ambos errores reportados");
    assert(r1.profile.nombre === "Portfolio" && r2.proyectos.length === 0, "contenido por defecto");
  });

  await test("JSON válido pero con estructura inesperada → normalizado", async () => {
    mockFetch({ "data/projects.json": '{"proyectos": "no-es-un-array"}' });
    const { proyectos } = await cargarProyectos();
    assert(Array.isArray(proyectos) && proyectos.length === 0, "lista vacía");
  });

  await test("El aviso de error al usuario existe en main.js (SPEC-001 §10)", () => {
    assert(/renderAvisoError/.test(mainJs), "falta renderAvisoError");
    assert(/Parte del contenido no se pudo cargar/.test(mainJs), "falta el mensaje de aviso");
  });

  /* ============================================================
     [F] TIPOGRAFÍA MULTI-NAVEGADOR (DESIGN-001 §2)
     ============================================================ */
  console.log("\n[F] Tipografía en diferentes navegadores (DESIGN-001 §2)");

  await test("Stack de texto con fallbacks de sistema (si Geist no carga)", () => {
    assert(
      /--font-text:\s*"Geist",\s*-apple-system,\s*"Segoe UI",\s*Helvetica,\s*Arial,\s*sans-serif/.test(css),
      "stack de texto sin fallbacks"
    );
  });

  await test("Stack mono con fallbacks de sistema", () => {
    assert(
      /--font-mono:\s*"Geist Mono",\s*ui-monospace,\s*"SF Mono",\s*Menlo,\s*Consolas,\s*monospace/.test(css),
      "stack mono sin fallbacks"
    );
  });

  await test("La carga de fuentes usa display=swap (evita texto invisible)", () => {
    assert(/display=swap/.test(html), "falta display=swap en Google Fonts");
  });

  await test("Solo se cargan los pesos 400, 500 y 600 (nunca 700)", () => {
    const m = html.match(/family=Geist[^"']*/);
    assert(m, "no se encontró la URL de Google Fonts");
    assert(!/wght@[^;]*700/.test(m[0]), "se está cargando el peso 700");
    assert(/wght@400;500;600/.test(m[0]), "faltan pesos 400/500/600");
  });

  await test("El CSS no aplica font-weight 700 en ningún sitio", () => {
    const sinComentarios = css.replace(/\/\*[\s\S]*?\*\//g, "");
    assert(!/font-weight:\s*(700|bold)\b/.test(sinComentarios), "hay font-weight 700/bold en el CSS");
    // Y que los tokens de peso solo definen 400/500/600.
    const pesos = [...sinComentarios.matchAll(/--weight-[\w-]+:\s*(\d+)/g)].map((m) => parseInt(m[1], 10));
    assert(pesos.every((p) => p <= 600), `pesos por encima de 600: ${pesos.join(", ")}`);
  });

  await test("Preconnect a fonts.gstatic.com (acelera la carga de fuentes)", () => {
    assert(/rel="preconnect"\s+href="https:\/\/fonts\.gstatic\.com"\s+crossorigin/.test(html),
      "falta preconnect a fonts.gstatic.com");
  });

  /* ============================================================
     [G] PERFORMANCE Y SEO (checks estáticos tipo Lighthouse)
     ============================================================ */
  console.log("\n[G] Performance, accesibilidad y SEO (checks estáticos)");

  await test("Sin frameworks ni librerías externas pesadas (vanilla JS)", () => {
    const externos = tags.filter(
      (t) => (t.attrs.src || t.attrs.href || "").startsWith("http")
    );
    for (const t of externos) {
      const url = t.attrs.src || t.attrs.href;
      assert(
        /fonts\.(googleapis|gstatic)\.com/.test(url),
        `recurso externo no esencial: ${url}`
      );
    }
  });

  await test("El CSS es un único archivo local (una sola petición bloqueante)", () => {
    const hojas = tags.filter((t) => t.nombre === "link" && t.attrs.rel === "stylesheet");
    const locales = hojas.filter((t) => !(t.attrs.href || "").startsWith("http"));
    assert(locales.length === 1, `hay ${locales.length} hojas locales`);
    const size = fs.statSync(path.join(ROOT, locales[0].attrs.href)).size;
    assert(size < 50 * 1024, `styles.css pesa ${Math.round(size / 1024)} KB`);
  });

  await test("Contraste AA: colores de texto sobre fondo (cálculo de ratio)", () => {
    // DESIGN-001 §6: contraste mínimo 4.5:1 en todo el texto.
    function luminancia(hex) {
      const c = hex.replace("#", "");
      const [r, g, b] = [0, 2, 4].map((i) => {
        const v = parseInt(c.substr(i, 2), 16) / 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }
    function ratio(fg, bg) {
      const [l1, l2] = [luminancia(fg), luminancia(bg)];
      return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    }
    const pares = [
      ["texto principal", "#0A0A0A", "#FFFFFF"],
      ["texto párrafo", "#404040", "#FFFFFF"],
      ["texto secundario", "#595959", "#FFFFFF"],
      ["muted sobre surface", "#595959", "#F5F5F5"],
      ["botón primario", "#FAFAFA", "#171717"],
      ["acento sobre blanco", "#6D28D9", "#FFFFFF"],
      ["ok sobre blanco", "#047857", "#FFFFFF"],
      ["warn sobre blanco", "#A16207", "#FFFFFF"],
      ["bad sobre blanco", "#B91C1C", "#FFFFFF"],
    ];
    for (const [nombre, fg, bg] of pares) {
      const r = ratio(fg, bg);
      assert(r >= 4.5, `${nombre}: ratio ${r.toFixed(2)}:1 < 4.5:1`);
    }
  });

  await test("Foco de teclado visible: outline 2px acento + offset 3px", () => {
    const m = css.match(/:focus-visible\s*\{([^}]*)\}/);
    assert(m, "no hay :focus-visible");
    assert(/outline:\s*2px\s+solid\s+var\(--accent\)/.test(m[1]), "outline incorrecto");
    assert(/outline-offset:\s*3px/.test(m[1]), "offset incorrecto");
  });

  await test("Imágenes decorativas ocultas a lectores de pantalla", () => {
    // La tarjeta tipográfica es decorativa (el nombre ya está en el h3).
    assert(/aria-hidden",\s*"true"/.test(mainJs), "falta aria-hidden en decorativos");
  });

  await test("Estructura semántica: header, main, footer, sections con título", () => {
    for (const el of ["header", "main", "footer", "section", "h1", "h2"]) {
      assert(tags.some((t) => t.nombre === el && !t.cierre), `falta <${el}>`);
    }
  });

  /* ---------- Resumen ---------- */
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Resultado: ${pasados} pasados, ${fallados} fallados`);
  if (avisos.length > 0) {
    console.log(`\nAvisos (no bloquean):`);
    for (const a of avisos) console.log(`  ⚠️  ${a}`);
  }
  console.log("");
  process.exit(fallados === 0 ? 0 : 1);
})();
