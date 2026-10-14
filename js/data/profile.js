/* ============================================================
   Portfolio — js/data/profile.js
   Carga y prepara data/profile.json para el renderizado.
   Estructura según SPEC-001 §7.2.
   ============================================================ */

"use strict";

const PROFILE_URL = "data/profile.json";

/** Contenido por defecto si el JSON es inválido (SPEC-001 §10). */
const PROFILE_POR_DEFECTO = {
  nombre: "Portfolio",
  titular: "",
  descripcion: "",
  foto: "",
  email: "",
  formacion: [],
  redes: {},
};

/**
 * Normaliza un objeto de perfil: garantiza que todos los campos
 * existen con el tipo esperado por SPEC-001 §7.2, aunque el JSON
 * venga incompleto o con tipos incorrectos.
 *
 * @param {object} raw Datos crudos parseados del JSON.
 * @returns {object} Perfil listo para los componentes.
 */
function prepararPerfil(raw) {
  const p = raw && typeof raw === "object" ? raw : {};

  return {
    nombre: typeof p.nombre === "string" ? p.nombre : PROFILE_POR_DEFECTO.nombre,
    titular: typeof p.titular === "string" ? p.titular : "",
    descripcion: typeof p.descripcion === "string" ? p.descripcion : "",
    foto: typeof p.foto === "string" ? p.foto : "",
    email: typeof p.email === "string" ? p.email : "",
    formacion: Array.isArray(p.formacion)
      ? p.formacion
          .filter((f) => f && typeof f === "object")
          .map((f) => ({
            titulo: typeof f.titulo === "string" ? f.titulo : "",
            centro: typeof f.centro === "string" ? f.centro : "",
            fechaInicio: typeof f.fechaInicio === "string" ? f.fechaInicio : "",
            fechaFin: typeof f.fechaFin === "string" ? f.fechaFin : "",
          }))
      : [],
    redes: p.redes && typeof p.redes === "object" && !Array.isArray(p.redes) ? p.redes : {},
  };
}

/**
 * Devuelve el perfil preparado para renderizar.
 *
 * Fix CLS (QA-LIGHTHOUSE-001 ISSUE-1): lee primero los datos inline
 * de index.html (window.__PROFILE__), disponibles de forma SÍNCRONA
 * antes del primer paint, para que "Sobre mí" y la portada se pinten
 * en el primer render sin desplazar el contenido. Si el bloque inline
 * no existe o es inválido, recurre al fetch de data/profile.json
 * (y si ese falla, al contenido por defecto — SPEC-001 §10).
 *
 * @returns {Promise<{profile: object, error: DataError|null}>}
 */
async function cargarPerfil() {
  const inline =
    typeof window !== "undefined" && window.__PROFILE__ && typeof window.__PROFILE__ === "object"
      ? window.__PROFILE__
      : null;

  if (inline) {
    return { profile: prepararPerfil(inline), error: null };
  }

  const { datos, error } = await cargarJSONSeguro(PROFILE_URL, PROFILE_POR_DEFECTO);
  return { profile: prepararPerfil(datos), error };
}
