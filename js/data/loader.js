/* ============================================================
   Portfolio — js/data/loader.js
   Carga y parseo de archivos JSON con manejo de errores.
   (SPEC-001 §7 Data Sources, §10 Edge Cases:
    "JSON con formato inválido: la página muestra mensaje
     de error o contenido por defecto".)
   ============================================================ */

"use strict";

/**
 * Error de datos: distingue fallos de red/HTTP de JSON inválido,
 * para que la capa de datos pueda reaccionar con contenido por
 * defecto en lugar de romper la página.
 */
class DataError extends Error {
  /**
   * @param {string} url      Recurso que falló.
   * @param {string} kind     "http" | "parse" | "shape"
   * @param {string} message  Detalle legible.
   */
  constructor(url, kind, message) {
    super(message);
    this.name = "DataError";
    this.url = url;
    this.kind = kind;
  }
}

/**
 * Carga un JSON y lo parsea de forma segura.
 * - Lanza DataError("http")  si el recurso no responde OK.
 * - Lanza DataError("parse") si el cuerpo no es JSON válido.
 *   (Se parsea como texto primero para capturar el SyntaxError
 *    con un mensaje claro en vez del error genérico de res.json().)
 *
 * @param {string} url Ruta del JSON (relativa a la página).
 * @returns {Promise<any>} Datos parseados.
 */
async function cargarJSON(url) {
  let res;
  try {
    res = await fetch(url);
  } catch (err) {
    throw new DataError(url, "http", `No se pudo conectar con ${url}: ${err.message}`);
  }

  if (!res.ok) {
    throw new DataError(url, "http", `No se pudo cargar ${url} (HTTP ${res.status})`);
  }

  const texto = await res.text();
  try {
    return JSON.parse(texto);
  } catch (err) {
    throw new DataError(url, "parse", `JSON inválido en ${url}: ${err.message}`);
  }
}

/**
 * Carga un JSON y, si falla (red, HTTP o formato inválido),
 * devuelve un contenido por defecto en lugar de romper la página
 * (SPEC-001 §10). El error queda registrado en consola.
 *
 * @param {string} url          Ruta del JSON.
 * @param {*}      contenidoPorDefecto Valor de respaldo.
 * @returns {Promise<{datos: any, error: DataError|null}>}
 */
async function cargarJSONSeguro(url, contenidoPorDefecto) {
  try {
    return { datos: await cargarJSON(url), error: null };
  } catch (err) {
    console.error(`[data] ${err.message}`);
    return { datos: contenidoPorDefecto, error: err };
  }
}
