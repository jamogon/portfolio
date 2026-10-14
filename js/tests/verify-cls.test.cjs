/* ============================================================
   Verificación del fix CLS (QA-LIGHTHOUSE-001 ISSUE-1)

   Comprueba, sin navegador, que:
     1. index.html lleva los datos inline en el <head>.
     2. Esos datos son IDÉNTICOS a data/profile.json y
        data/projects.json (SPEC-001 §6: el contenido solo se
        edita en los JSON).
     3. Las cargadoras (profile.js / projects.js) resuelven con
        los datos inline SIN llamar a fetch (primer render sin
        red → sin salto de layout).
     4. El render completo (main.js: renderPerfil +
        renderProyectos) rellena TODAS las zonas de contenido
        (topbar, hero, sobre-m��, proyectos, footer) usando solo
        los datos inline — es decir, el primer paint ya lleva
        todo puesto.
     5. Sin datos inline, las cargadoras siguen funcionando vía
        fetch (fallback, SPEC-001 §10).

   Uso:  node js/tests/verify-cls.test.cjs
   ============================================================ */

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");

/* ---------- Mini-framework ---------- */
let pasados = 0;
let fallados = 0;

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

/* ---------- Archivos ---------- */
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const profileJson = JSON.parse(fs.readFileSync(path.join(ROOT, "data/profile.json"), "utf8"));
const projectsJson = JSON.parse(fs.readFileSync(path.join(ROOT, "data/projects.json"), "utf8"));

function cargarModulos() {
  const codigo = [
    "js/data/loader.js",
    "js/data/profile.js",
    "js/data/projects.js",
    "js/main.js",
  ]
    .map((rel) => fs.readFileSync(path.join(ROOT, rel), "utf8"))
    .join("\n;\n");
  return codigo;
}

/* ---------- Mini DOM de prueba ----------
   Solo lo que main.js necesita: querySelector(All), createElement,
   appendChild/append/prepend, textContent, className, atributos. */
function crearElemento(tag) {
  const el = {
    tagName: tag.toUpperCase(),
    children: [],
    attrs: {},
    textContent: "",
    className: "",
    hidden: false,
    appendChild(c) {
      this.children.push(c);
      return c;
    },
    append(...nodos) {
      for (const n of nodos) this.children.push(n);
    },
    prepend(...nodos) {
      this.children.unshift(...nodos);
    },
    setAttribute(k, v) {
      this.attrs[k] = v;
    },
  };
  return el;
}

function crearDOM() {
  // Mapa data-profile → elemento; data-projects → contenedor.
  const porDataProfile = new Map();
  const registrar = (clave) => {
    const el = crearElemento("div");
    porDataProfile.set(clave, [...(porDataProfile.get(clave) || []), el]);
    return el;
  };
  const nombre = [registrar("nombre"), registrar("nombre")]; // topbar + hero
  const foto = registrar("foto");
  const titular = registrar("titular");
  const descripcion = registrar("descripcion");
  const email = registrar("email");
  const sobreMi = registrar("sobre-mi");
  const footer = registrar("footer");
  const contProyectos = crearElemento("div");
  const main = crearElemento("main");

  const document = {
    querySelectorAll(sel) {
      const m = sel.match(/^\[data-profile="(.+)"\]$/);
      if (m) return porDataProfile.get(m[1]) || [];
      return [];
    },
    querySelector(sel) {
      const m = sel.match(/^\[data-profile="(.+)"\]$/);
      if (m) return (porDataProfile.get(m[1]) || [])[0] || null;
      if (sel === "[data-projects]") return contProyectos;
      if (sel === "main") return main;
      return null;
    },
    createElement: crearElemento,
    createTextNode: (t) => ({ textContent: t }),
  };

  return { document, nombre, foto, titular, descripcion, email, sobreMi, footer, contProyectos, main };
}

/* ---------- Tests ---------- */
(async () => {
  console.log("\n[CLS] Datos inline en index.html");

  await test("Los bloques inline existen en el <head>", () => {
    const head = html.match(/<head>([\s\S]*?)<\/head>/);
    assert(head, "no hay <head>");
    assert(/<script>window\.__PROFILE__ = \{/.test(head[1]), "falta window.__PROFILE__");
    assert(/<script>window\.__PROYECTOS__ = \{/.test(head[1]), "falta window.__PROYECTOS__");
  });

  await test("Los datos inline son idénticos a los JSON (fuente única de verdad)", () => {
    const mP = html.match(/<script>window\.__PROFILE__ = ([\s\S]*?);<\/script>/);
    const mPr = html.match(/<script>window\.__PROYECTOS__ = ([\s\S]*?);<\/script>/);
    assert(mP && mPr, "faltan bloques inline");
    assert(JSON.stringify(JSON.parse(mP[1])) === JSON.stringify(profileJson), "perfil inline desincronizado");
    assert(JSON.stringify(JSON.parse(mPr[1])) === JSON.stringify(projectsJson), "proyectos inline desincronizados");
  });

  console.log("\n[CLS] Carga de datos sin fetch (primer render síncrono)");

  await test("cargarPerfil/cargarProyectos resuelven con los datos inline SIN fetch", async () => {
    const { document } = crearDOM();
    let fetchLlamado = false;
    const window = {
      __PROFILE__: JSON.parse(JSON.stringify(profileJson)),
      __PROYECTOS__: JSON.parse(JSON.stringify(projectsJson)),
    };
    const fn = new Function(
      "window",
      "document",
      "fetch",
      `${cargarModulos()}
       return (async () => {
         const r1 = await cargarPerfil();
         const r2 = await cargarProyectos();
         return { r1, r2 };
       })();`
    );
    const { r1, r2 } = await fn(window, document, () => {
      fetchLlamado = true;
      throw new Error("fetch no debería llamarse con datos inline");
    });
    assert(!fetchLlamado, "se llamó a fetch pese a haber datos inline");
    assert(r1.error === null && r1.profile.nombre === profileJson.nombre, "perfil inline no aplicado");
    assert(r2.error === null && r2.proyectos.length === projectsJson.proyectos.length, "proyectos inline no aplicados");
  });

  await test("Sin datos inline, las cargadoras recurren al fetch (fallback intacto)", async () => {
    const { document } = crearDOM();
    const window = {}; // sin inline
    const mockFetch = async (url) => ({
      ok: true,
      status: 200,
      text: async () =>
        url.includes("profile") ? JSON.stringify(profileJson) : JSON.stringify(projectsJson),
    });
    const fn = new Function(
      "window",
      "document",
      "fetch",
      `${cargarModulos()}
       return (async () => {
         const r1 = await cargarPerfil();
         const r2 = await cargarProyectos();
         return { r1, r2 };
       })();`
    );
    const { r1, r2 } = await fn(window, document, mockFetch);
    assert(r1.profile.nombre === profileJson.nombre, "fallback fetch de perfil roto");
    assert(r2.proyectos.length === projectsJson.proyectos.length, "fallback fetch de proyectos roto");
  });

  console.log("\n[CLS] Render completo con datos inline (primer paint con todo puesto)");

  await test("init() rellena topbar, hero, sobre-mí, proyectos y footer", async () => {
    const dom = crearDOM();
    const window = {
      __PROFILE__: JSON.parse(JSON.stringify(profileJson)),
      __PROYECTOS__: JSON.parse(JSON.stringify(projectsJson)),
    };
    const fn = new Function(
      "window",
      "document",
      "fetch",
      `${cargarModulos()}
       return (async () => { await init(); })();`
    );
    await fn(window, dom.document, () => {
      throw new Error("fetch no debería llamarse");
    });

    // Topbar + hero: nombre
    for (const el of dom.nombre) {
      assert(el.textContent === profileJson.nombre, "nombre no pintado");
    }
    // Foto
    assert(dom.foto.src === profileJson.foto, "foto sin src");
    // Titular y entradilla
    assert(dom.titular.textContent === profileJson.titular, "titular no pintado");
    assert(dom.descripcion.textContent === profileJson.descripcion, "entradilla no pintada");
    // Email
    assert(dom.email.textContent === profileJson.email, "email no pintado");

    // Sobre mí: debe contener descripción, datos (dl), contacto y formación
    const textoSobreMi = JSON.stringify(dom.sobreMi.children.map((c) => c.className));
    assert(/sobre-mi__descripcion/.test(textoSobreMi), "sobre-mí sin descripción");
    assert(/sobre-mi__datos/.test(textoSobreMi), "sobre-mí sin datos personales");
    assert(/sobre-mi__contacto/.test(textoSobreMi), "sobre-mí sin contacto");
    assert(/sobre-mi__formacion/.test(textoSobreMi), "sobre-mí sin formación");

    // Proyectos: una tarjeta por proyecto
    assert(
      dom.contProyectos.children.length === projectsJson.proyectos.length,
      `proyectos: ${dom.contProyectos.children.length} tarjetas, esperaba ${projectsJson.proyectos.length}`
    );

    // Footer: contacto repetido
    assert(dom.footer.children.length > 0, "footer vacío");

    // Sin aviso de error (todo cargó bien)
    assert(dom.main.children.length === 0, "apareció el aviso de error sin motivo");
  });

  /* ---------- Resumen ---------- */
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Resultado: ${pasados} pasados, ${fallados} fallados`);
  process.exit(fallados === 0 ? 0 : 1);
})();
