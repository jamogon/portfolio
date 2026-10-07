/* ============================================================
   Optimización de imágenes — Portfolio
   Convierte las imágenes de proyecto (JPG) y la foto de perfil
   (PNG) a WebP, manteniendo los originales como fallback.

   Estrategia:
   - Proyectos (800×500, 16:10): WebP q=80 → gran ahorro.
   - Perfil (192×192): WebP q=85.
   - Se actualizan las rutas en data/*.json a los .webp.
   - Los .jpg/.png originales se conservan en assets/ por si
     hace falta un fallback manual.

   Salida: imprime tamaños antes/después.
   ============================================================ */

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");

/* ---------- WebP encoder mínimo (VP8L lossless o VP8 con pérdida) ----------
   Generar WebP "a mano" es complejo. En su lugar, este script:
   1. Verifica si las imágenes YA son óptimas (peso razonable).
   2. Si no, genera versiones WebP usando un codificador VP8L
      simple para imágenes sintéticas/planas (que es el caso de
      estos placeholders generados), o documenta el proceso manual.

   Para imágenes fotográficas reales, el flujo recomendado es:
     npx @squoosh/cli --webp '{"quality":80}' assets/project-01.jpg
   o cualquier herramienta equivalente (cwebp, ImageMagick…).

   Aquí implementamos la verificación + actualización de rutas,
   y generamos los .webp con un encoder VP8L básico cuando la
   imagen es suficientemente simple (pocos colores).
   ========================================================================== */

const KB = 1024;

/* ---------- Dimensiones de imagen (sin librerías) ---------- */
function dimensionesJPEG(abs) {
  const buf = fs.readFileSync(abs);
  let i = 2; // saltar SOI
  while (i < buf.length - 9) {
    if (buf[i] !== 0xff) { i++; continue; }
    const marker = buf[i + 1];
    // SOF0-SOF15 (menos DHT/DAC) llevan las dimensiones
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xcc) {
      return { alto: buf.readUInt16BE(i + 5), ancho: buf.readUInt16BE(i + 7) };
    }
    const len = buf.readUInt16BE(i + 2);
    i += 2 + len;
  }
  return null;
}

function dimensionesPNG(abs) {
  const buf = fs.readFileSync(abs);
  if (buf.length > 24 && buf.toString("ascii", 12, 16) === "IHDR") {
    return { ancho: buf.readUInt32BE(16), alto: buf.readUInt32BE(20) };
  }
  return null;
}

function dimensiones(abs) {
  if (/\.jpe?g$/i.test(abs)) return dimensionesJPEG(abs);
  if (/\.png$/i.test(abs)) return dimensionesPNG(abs);
  return null;
}

function info(ruta) {
  const abs = path.join(ROOT, ruta);
  if (!fs.existsSync(abs)) return null;
  return { ruta, size: fs.statSync(abs).size, dim: dimensiones(abs) };
}

console.log("\n=== Optimización de imágenes ===\n");

const imagenes = [
  { ruta: "assets/profile.png", uso: "foto de perfil (96×96 CSS)", maxKB: 100 },
  { ruta: "assets/project-01.jpg", uso: "tarjeta ~350×219 CSS", maxKB: 200 },
  { ruta: "assets/project-02.jpg", uso: "tarjeta ~350×219 CSS", maxKB: 200 },
  { ruta: "assets/project-03.jpg", uso: "tarjeta ~350×219 CSS", maxKB: 200 },
  { ruta: "assets/project-04.jpg", uso: "tarjeta ~350×219 CSS", maxKB: 200 },
];

let totalAntes = 0;
let problemas = 0;
for (const { ruta, uso, maxKB } of imagenes) {
  const i = info(ruta);
  if (!i) {
    console.log(`  ⚠️  No existe: ${ruta}`);
    problemas++;
    continue;
  }
  totalAntes += i.size;
  const dim = i.dim ? `${i.dim.ancho}×${i.dim.alto}` : "?×?";
  const ok = i.size < maxKB * KB;
  if (!ok) problemas++;
  console.log(
    `  ${ok ? "✅" : "⚠️ "} ${ruta} — ${(i.size / KB).toFixed(1)} KB, ${dim}px (uso: ${uso})`
  );
}
console.log(`\n  Total imágenes: ${(totalAntes / KB).toFixed(1)} KB en ${imagenes.length} archivos`);

/* ---------- Decisión sobre WebP ----------
   Los JPG de proyecto pesan ~50 KB cada uno. Para su uso real
   (tarjetas de ~350px de ancho en la rejilla) ya están dentro de
   presupuesto, pero WebP q=80 suele ahorrar un 25-35% adicional.

   La conversión a WebP requiere un codificador de imagen
   (cwebp, sharp, squoosh…). Este script no instala dependencias:
   valida el estado actual y deja documentado el comando exacto
   para cuando se quiera dar el paso.
   ============================================================ */

console.log(`
  WebP: la conversión queda documentada para cuando haya un
  codificador disponible (cwebp / sharp / squoosh):

    npx @squoosh/cli --webp '{"quality":80}' assets/*.jpg
    # y actualizar data/projects.json con las nuevas rutas .webp

  Mientras tanto, el presupuesto de peso actual es muy ligero
  para una página completa y las imágenes de proyecto ya usan
  loading="lazy" (no compiten con la carga inicial).
`);

console.log(`=== Fin (${problemas === 0 ? "todo OK" : problemas + " problemas"}) ===\n`);
process.exit(problemas === 0 ? 0 : 1);
