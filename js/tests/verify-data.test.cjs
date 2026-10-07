/* ============================================================
   Verificación de la capa de datos (js/data/) — Portfolio
   Simula fetch + JSONs y comprueba los criterios de aceptación
   de la tarea "Cargar y parsear datos JSON".
   ============================================================ */

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");

/* ---------- Cargar los módulos (scripts clásicos: scope compartido) ---------- */
// En el navegador, loader.js, profile.js y projects.js comparten el scope
// global vía <script>: profile.js y projects.js usan cargarJSONSeguro de
// loader.js. Para reproducirlo en Node, los concatenamos en un único
// new Function() (un solo scope), en orden de dependencia.
function cargarModulosDatos() {
  const codigo = ["js/data/loader.js", "js/data/profile.js", "js/data/projects.js"]
    .map((rel) => fs.readFileSync(path.join(ROOT, rel), "utf8"))
    .join("\n;\n");
  return new Function(
    `${codigo}
     return {
       ...(typeof DataError !== "undefined" ? { DataError } : {}),
       ...(typeof cargarJSON !== "undefined" ? { cargarJSON } : {}),
       ...(typeof cargarJSONSeguro !== "undefined" ? { cargarJSONSeguro } : {}),
       ...(typeof prepararPerfil !== "undefined" ? { prepararPerfil } : {}),
       ...(typeof cargarPerfil !== "undefined" ? { cargarPerfil } : {}),
       ...(typeof prepararProyecto !== "undefined" ? { prepararProyecto } : {}),
       ...(typeof cargarProyectos !== "undefined" ? { cargarProyectos } : {}),
       ...(typeof MAX_PROYECTOS !== "undefined" ? { MAX_PROYECTOS } : {}),
     };`
  )();
}

const data = cargarModulosDatos();

/* ---------- Mock de fetch ---------- */
function mockFetch(mapa) {
  globalThis.fetch = async (url) => {
    if (!(url in mapa)) {
      return { ok: false, status: 404, text: async () => "" };
    }
    const body = mapa[url];
    if (body instanceof Error) throw body;
    return { ok: true, status: 200, text: async () => body };
  };
}

/* ---------- Mini-framework de tests ---------- */
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

/* ---------- Datos reales del proyecto ---------- */
const PROFILE_REAL = fs.readFileSync(path.join(ROOT, "data/profile.json"), "utf8");
const PROJECTS_REAL = fs.readFileSync(path.join(ROOT, "data/projects.json"), "utf8");

(async () => {
  console.log("\n[1] Carga correcta con los JSON reales del proyecto");

  mockFetch({
    "data/profile.json": PROFILE_REAL,
    "data/projects.json": PROJECTS_REAL,
  });

  await test("profile.json se carga y parsea con todos los campos de SPEC-001 §7.2", async () => {
    const { profile, error } = await data.cargarPerfil();
    assert(error === null, "no debería haber error");
    assert(profile.nombre === "Javier Motos González", "nombre");
    assert(profile.titular.includes("prácticas"), "titular");
    assert(typeof profile.descripcion === "string" && profile.descripcion.length > 0, "descripcion");
    assert(profile.foto === "assets/profile.png", "foto");
    assert(profile.email === "javi@secture.com", "email");
    assert(Array.isArray(profile.formacion) && profile.formacion.length === 1, "formacion");
    assert(profile.formacion[0].fechaInicio === "2023" && profile.formacion[0].fechaFin === "Actualidad", "fechas formacion");
    assert(profile.redes.github && profile.redes.linkedin, "redes");
  });

  await test("projects.json se carga y parsea con los campos de SPEC-001 §7.1", async () => {
    const { proyectos, error } = await data.cargarProyectos();
    assert(error === null, "no debería haber error");
    assert(proyectos.length === 4, `esperaba 4 proyectos, hay ${proyectos.length}`);
    const p = proyectos[0];
    for (const campo of ["id", "nombre", "descripcion", "tecnologia", "imagen", "enlace", "fecha"]) {
      assert(campo in p, `falta campo ${campo}`);
    }
    assert(/^\d{4}-\d{2}$/.test(p.fecha), "formato fecha YYYY-MM");
  });

  console.log("\n[2] Manejo graceful de errores de formato (SPEC-001 §10)");

  await test("JSON de perfil inválido → contenido por defecto, sin excepción", async () => {
    mockFetch({ "data/profile.json": '{ "nombre": "Javi", ' }); // truncado
    const { profile, error } = await data.cargarPerfil();
    assert(error && error.kind === "parse", "debería ser DataError kind=parse");
    assert(profile && typeof profile.nombre === "string", "perfil por defecto disponible");
    assert(Array.isArray(profile.formacion) && profile.formacion.length === 0, "formacion vacía");
  });

  await test("JSON de proyectos inválido → lista vacía, sin excepción", async () => {
    mockFetch({ "data/projects.json": "no es json {{{" });
    const { proyectos, error } = await data.cargarProyectos();
    assert(error && error.kind === "parse", "debería ser DataError kind=parse");
    assert(Array.isArray(proyectos) && proyectos.length === 0, "lista vacía por defecto");
  });

  await test("Recurso inexistente (404) → contenido por defecto", async () => {
    mockFetch({}); // nada disponible
    const r1 = await data.cargarPerfil();
    const r2 = await data.cargarProyectos();
    assert(r1.error && r1.error.kind === "http", "perfil: error http");
    assert(r2.error && r2.error.kind === "http", "proyectos: error http");
    assert(r1.profile && Array.isArray(r2.proyectos), "datos por defecto disponibles");
  });

  await test("Fallo de red → contenido por defecto", async () => {
    mockFetch({ "data/profile.json": new Error("network down") });
    const { profile, error } = await data.cargarPerfil();
    assert(error && error.kind === "http", "error http");
    assert(profile.nombre === "Portfolio", "perfil por defecto");
  });

  console.log("\n[3] Límite de 6 proyectos (SPEC-001 R4)");

  await test("8 proyectos en el JSON → solo 6 llegan al render", async () => {
    const ocho = {
      proyectos: Array.from({ length: 8 }, (_, i) => ({
        id: `p${i}`,
        nombre: `Proyecto ${i}`,
        descripcion: "x",
        tecnologia: "JS",
        imagen: "assets/project-01.jpg",
        enlace: "https://github.com/x/y",
        fecha: "2026-01",
      })),
    };
    mockFetch({ "data/projects.json": JSON.stringify(ocho) });
    const { proyectos, error } = await data.cargarProyectos();
    assert(error === null, "sin error");
    assert(proyectos.length === 6, `esperaba 6, hay ${proyectos.length}`);
  });

  await test("Menos de 6 proyectos → se muestran los que hay (SPEC-001 §10)", async () => {
    mockFetch({ "data/projects.json": PROJECTS_REAL });
    const { proyectos } = await data.cargarProyectos();
    assert(proyectos.length === 4, `esperaba 4, hay ${proyectos.length}`);
  });

  console.log("\n[4] Datos preparados para componentes");

  await test("Proyecto sin imagen → imagen null (tarjeta tipográfica, §10)", async () => {
    const sinImagen = {
      proyectos: [{
        id: "x", nombre: "Sin imagen", descripcion: "d",
        tecnologia: "Go", enlace: "https://github.com/x/y", fecha: "2025-11",
      }],
    };
    mockFetch({ "data/projects.json": JSON.stringify(sinImagen) });
    const { proyectos } = await data.cargarProyectos();
    assert(proyectos.length === 1 && proyectos[0].imagen === null, "imagen null");
  });

  await test("Proyecto sin campos obligatorios → descartado, no rompe la lista", async () => {
    const mezcla = {
      proyectos: [
        { id: "malo", nombre: "Incompleto" }, // sin tecnologia/enlace/fecha
        { id: "bueno", nombre: "OK", descripcion: "d", tecnologia: "JS", imagen: "", enlace: "https://github.com/x/y", fecha: "2026-02" },
      ],
    };
    mockFetch({ "data/projects.json": JSON.stringify(mezcla) });
    const { proyectos } = await data.cargarProyectos();
    assert(proyectos.length === 1 && proyectos[0].id === "bueno", "solo el válido");
    assert(proyectos[0].imagen === null, "imagen vacía normalizada a null");
  });

  await test("Perfil con campos ausentes → normalizado con tipos correctos", () => {
    const p = data.prepararPerfil({ nombre: 42, formacion: "no-array", redes: [1, 2] });
    assert(typeof p.nombre === "string", "nombre string");
    assert(Array.isArray(p.formacion), "formacion array");
    assert(typeof p.redes === "object" && !Array.isArray(p.redes), "redes object");
  });

  await test("MAX_PROYECTOS = 6 según SPEC-001 R4", () => {
    assert(data.MAX_PROYECTOS === 6, "constante");
  });

  console.log(`\nResultado: ${pasados} pasados, ${fallados} fallados\n`);
  process.exit(fallados === 0 ? 0 : 1);
})();
