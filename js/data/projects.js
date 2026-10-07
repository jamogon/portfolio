/* ============================================================
   Portfolio — js/data/projects.js
   Carga y prepara data/projects.json para el renderizado.
   Estructura según SPEC-001 §7.1. Máximo 6 proyectos (R4).
   ============================================================ */

"use strict";

const PROJECTS_URL = "data/projects.json";
const MAX_PROYECTOS = 6; // SPEC-001 R4

/** Contenido por defecto si el JSON es inválido (SPEC-001 §10). */
const PROJECTS_POR_DEFECTO = { proyectos: [] };

/**
 * Normaliza un proyecto: garantiza los campos de SPEC-001 §7.1.
 * `imagen` es opcional (si falta, tarjeta tipográfica — §10).
 *
 * @param {object} raw Datos crudos del proyecto.
 * @returns {object|null} Proyecto listo para renderizar, o null
 *   si le falta algún campo obligatorio (id, nombre, tecnologia,
 *   enlace o fecha): un proyecto incompleto no se muestra.
 */
function prepararProyecto(raw) {
  if (!raw || typeof raw !== "object") return null;

  const obligatorios = ["id", "nombre", "tecnologia", "enlace", "fecha"];
  for (const campo of obligatorios) {
    if (typeof raw[campo] !== "string" || raw[campo].trim() === "") return null;
  }

  return {
    id: raw.id,
    nombre: raw.nombre,
    // descripcion es de facto opcional en §10 ("Proyecto sin descripción")
    descripcion: typeof raw.descripcion === "string" ? raw.descripcion : "",
    tecnologia: raw.tecnologia,
    imagen: typeof raw.imagen === "string" && raw.imagen.trim() !== "" ? raw.imagen : null,
    enlace: raw.enlace,
    fecha: raw.fecha,
  };
}

/**
 * Carga data/projects.json y devuelve la lista de proyectos
 * preparada para renderizar:
 * - Si el JSON es inválido o no se puede cargar → lista vacía
 *   (contenido por defecto, SPEC-001 §10).
 * - Proyectos incompletos → descartados (con aviso en consola).
 * - Máximo 6 proyectos (SPEC-001 R4).
 *
 * @returns {Promise<{proyectos: object[], error: DataError|null}>}
 */
async function cargarProyectos() {
  const { datos, error } = await cargarJSONSeguro(PROJECTS_URL, PROJECTS_POR_DEFECTO);

  const crudos = Array.isArray(datos && datos.proyectos) ? datos.proyectos : [];
  const proyectos = [];

  for (const raw of crudos) {
    const proyecto = prepararProyecto(raw);
    if (proyecto) {
      proyectos.push(proyecto);
    } else {
      console.warn("[data] Proyecto descartado por campos obligatorios ausentes:", raw);
    }
    if (proyectos.length >= MAX_PROYECTOS) break; // R4: máximo 6
  }

  return { proyectos, error };
}
