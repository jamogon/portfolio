# SPEC-001 — Portfolio

|         |            |
| ------- | ---------- |
| Estado  | Lista para DEV |
| Versión | v3         |
| Fecha   | 01/10/2026 |

## 1. Context

¿Qué problema queremos resolver?

Queremos hacer una página web que sea nuestro portfolio.
Somos un alumno que está cursando un grado sobre informática y queremos enviar esto a una empresa para hacer las prácticas con ella.

## 2. Goal

¿Qué queremos conseguir?

Que el portfolio sirva de ayuda para que la empresa se fije en mí y pueda conseguir las prácticas.

## 3. Users

¿Quién utilizará esta funcionalidad?

La utilizará Marta Ibáñez, responsable de RRHH de la empresa Arema Software, para elegir o descartar los candidatos que van a hacer las prácticas con ellos.

## 4. Scope

### In scope

Una página web responsive en la que se muestre:

- **Quién soy**, que incluirá:
  - Datos personales
  - Una breve descripción sobre mí
  - Datos de contacto
- **Qué proyectos he hecho** (máximo 6), donde cada proyecto mostrará:
  - Imagen
  - Nombre
  - Pequeña descripción explicando de qué va
  - Tecnología principal
  - Enlace al repositorio de GitHub
  - Fecha de realización

### Out of scope

- Trabajos no relacionados con informática.
- Página de detalle de cada proyecto.
- Más de 6 proyectos.

## 5. Requirements

### R1

- Los proyectos deben mostrar la fecha en que se realizaron.
- La sección "Sobre mí" debe incluir fechas relevantes (formación, experiencia).

### R2

- Debe existir una sección "Sobre mí" que incluya:
  - Datos personales
  - Breve descripción
  - Datos de contacto

### R3

- Debe existir una portada con:
  - Foto
  - Nombre
  - Titular indicando que estoy disponible
  - Datos de contacto

### R4

- Se mostrarán un máximo de 6 proyectos.

### R5

- Cada proyecto debe mostrar la tecnología principal utilizada.

## 6. Business Rules

- La página tiene que ser responsive.
- Los proyectos deben tener enlaces externos con apertura en otra pestaña.
- Los enlaces externos serán nofollow.
- En mi dirección de correo habrá un mailto para que sea fácil contactarme.
- El diseño visual debe seguir lo definido en DESIGN-001.
- **El contenido se gestiona editando archivos JSON, no el código fuente.**

## 7. Data Sources

El contenido de la página se alimenta de dos archivos JSON:

### 7.1 `data/projects.json`

Contiene el listado de proyectos. Estructura por proyecto:

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `id` | string | Sí | Identificador único (slug) |
| `nombre` | string | Sí | Nombre del proyecto |
| `descripcion` | string | Sí | Descripción breve |
| `tecnologia` | string | Sí | Tecnología principal |
| `imagen` | string | No | Ruta a la imagen (si falta, tarjeta tipográfica) |
| `enlace` | string | Sí | URL del repositorio |
| `fecha` | string | Sí | Fecha de realización (formato: `YYYY-MM`) |

### 7.2 `data/profile.json`

Contiene los datos personales. Estructura:

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `nombre` | string | Sí | Nombre completo |
| `titular` | string | Sí | Titular de disponibilidad (ej: "Disponible para prácticas") |
| `descripcion` | string | Sí | Breve descripción personal |
| `foto` | string | Sí | Ruta a la foto de perfil |
| `email` | string | Sí | Dirección de correo |
| `formacion` | array | Sí | Lista de formación con fechas |
| `redes` | object | No | Enlaces a redes sociales (GitHub, LinkedIn…) |

## 8. User Flow

1. El visitante llega a la portada y ve la cabecera con mi foto, datos de contacto y si estoy disponible.
2. Al hacer scroll ve los proyectos que he trabajado (máximo 6).
3. Al final de la página, en el footer, verá de nuevo mis datos de contacto para poder contactarme.

## 9. Acceptance Criteria

- [ ] La portada muestra foto, nombre, titular de disponibilidad y datos de contacto.
- [ ] La sección "Sobre mí" incluye datos personales, descripción, contacto y fechas relevantes.
- [ ] Se muestran un máximo de 6 proyectos.
- [ ] Cada proyecto muestra imagen, nombre, descripción, tecnología, enlace a GitHub y fecha de realización.
- [ ] Un proyecto sin imagen muestra una tarjeta tipográfica con su nombre (diseño de respaldo solo con texto).
- [ ] Un proyecto sin demo no muestra el enlace "Demo", y su imagen lleva al repositorio.
- [ ] Los enlaces externos se abren en nueva pestaña y tienen atributo nofollow.
- [ ] El email tiene enlace mailto funcional.
- [ ] La página se visualiza correctamente en móvil, tablet y escritorio.
- [ ] El diseño sigue las especificaciones de DESIGN-001 (colores, tipografía, espaciado, componentes).
- [ ] Los cambios de contenido se realizan editando los archivos JSON, sin tocar código.

## 10. Edge Cases

- Proyecto sin imagen: se muestra tarjeta tipográfica con el nombre.
- Proyecto sin enlace a demo: solo se muestra enlace al repositorio.
- Proyecto sin descripción: se muestra solo nombre e imagen.
- Menos de 6 proyectos: se muestran los que haya sin elementos vacíos.
- JSON con formato inválido: la página muestra mensaje de error o contenido por defecto.

## 11. Open Questions

- (ninguna)

## 12. Assumptions

- El contenido (textos, imágenes, proyectos) lo proporcionará el alumno editando los JSON.
- La página será estática (sin backend ni CMS).
- El idioma de la página será español.

## 13. Dependencies

- Repositorios de GitHub públicos y actualizados.
- Imágenes de los proyectos en formato web (JPG, PNG, WebP).
- **DESIGN-001**: Sistema de diseño que define colores, tipografía, espaciado, componentes, movimiento y accesibilidad.
- **data/projects.json**: Archivo con los datos de los proyectos.
- **data/profile.json**: Archivo con los datos personales.
