/* ============================================================
   Portfolio — js/tests/build-inline-data.cjs
   Regenera los bloques de datos inline de index.html
   (window.__PROFILE__ y window.__PROYECTOS__) a partir de
   data/profile.json y data/projects.json.

   ¿Por qué existe? El contenido se gestiona editando los JSON
   (SPEC-001 §6), pero la página lo pinta ANTES del primer paint
   leyendo los datos inline, sin fetch (fix CLS,
   QA-LIGHTHOUSE-001 ISSUE-1). Este script vuelve a volcar los
   JSON dentro del HTML para que ambos no se desincronicen.

   Uso:  node js/tests/build-inline-data.cjs
   ============================================================ */

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const INDEX = path.join(ROOT, "index.html");

/* ---------- Carga y validación de los JSON ---------- */
function cargarJSON(rel) {
  const ruta = path.join(ROOT, rel);
  const texto = fs.readFileSync(ruta, "utf8");
  try {
    return JSON.parse(texto);
  } catch (err) {
    console.error(`✗ ${rel}: JSON inválido (${err.message}). No se toca index.html.`);
    process.exit(1);
  }
}

const profile = cargarJSON("data/profile.json");
const projects = cargarJSON("data/projects.json");

/* ---------- Serialización segura para un <script> inline ----------
   JSON.stringify nunca emite "</script>" salvo dentro de strings;
   se escapa "<" como "<" para que el HTML no pueda romperse
   (SPEC-001 §10: el contenido nunca rompe la página). */
function jsonParaInline(datos) {
  return JSON.stringify(datos).replace(/</g, "\\u003c");
}

const BLOQUE_PROFILE = `<script>window.__PROFILE__ = ${jsonParaInline(profile)};</script>`;
const BLOQUE_PROYECTOS = `<script>window.__PROYECTOS__ = ${jsonParaInline(projects)};</script>`;

/* ---------- Sustitución en index.html ---------- */
const html = fs.readFileSync(INDEX, "utf8");

const reProfile = /<script>window\.__PROFILE__ = [\s\S]*?;<\/script>/;
const reProyectos = /<script>window\.__PROYECTOS__ = [\s\S]*?;<\/script>/;

if (!reProfile.test(html) || !reProyectos.test(html)) {
  console.error("✗ No se encontraron los bloques inline en index.html. No se toca nada.");
  process.exit(1);
}

const actualizado = html
  .replace(reProfile, BLOQUE_PROFILE)
  .replace(reProyectos, BLOQUE_PROYECTOS);

if (actualizado === html) {
  console.log("✓ index.html ya estaba sincronizado con los JSON.");
} else {
  fs.writeFileSync(INDEX, actualizado);
  console.log("✓ index.html actualizado con los datos de data/profile.json y data/projects.json.");
}
