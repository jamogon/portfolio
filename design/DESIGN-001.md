# DESIGN-001 — Sistema de diseño · Portfolio

> Artefacto hermano de las SPEC. Aquí viven las **decisiones visuales que valen para todo el
> producto**; en la SPEC viven las reglas de comportamiento verificables.
>
> Regla para saber dónde va algo: *si cambiaría al hacer otra funcionalidad, no pertenece a la
> SPEC*. El acento vale para toda la página → aquí. "El estado nunca se transmite solo por color"
> es una regla que QA puede verificar → a la SPEC.

| | |
|---|---|
| Versión | v1 |
| Fecha | 2026-09-28 |
| Estado | Cerrado · no se modifica durante el curso |

---

## 1. Color

### Neutros

| Token | Valor | Uso |
|---|---|---|
| `bg` | `#FFFFFF` | Fondo de página |
| `ink` | `#0A0A0A` | Texto principal, titulares |
| `ink-2` | `#404040` | Texto de párrafo largo |
| `muted` | `#595959` | Metadatos, etiquetas, texto secundario |
| `surface` | `#F5F5F5` | Chips, píldoras, botones secundarios |
| `surface-2` | `#EDEDED` | Estado hover de lo anterior |
| `border` | `#E5E5E5` | Separadores y bordes |
| `border-strong` | `#D4D4D4` | Borde en hover, subrayados discretos |
| `btn` / `btn-ink` | `#171717` / `#FAFAFA` | Botón primario y su texto |

### Acento

El acento es **configurable por el estudiante**. Cada opción define un par: color pleno y versión
suave para fondos.

| Nombre | Acento | Suave |
|---|---|---|
| Violeta *(por defecto)* | `#6D28D9` | `#EDE9FE` |
| Azul | `#1D4ED8` | `#DBEAFE` |
| Verde | `#047857` | `#D1FAE5` |
| Naranja | `#C2410C` | `#FFEDD5` |
| Rosa | `#BE185D` | `#FCE7F3` |
| Amarillo | `#A16207` | `#FEF3C7` |

El acento se usa **solo** en: foco de teclado, subrayado de enlaces en hover, punto del indicador
de disponibilidad y fondo del marco de las imágenes de proyecto. Nunca en texto corrido ni en
botones primarios.

### Semánticos

| Token | Valor | Significado |
|---|---|---|
| `ok` | `#047857` | Vigente |
| `warn` | `#A16207` | Caduca pronto |
| `bad` | `#B91C1C` | Caducada |

Estos tres son independientes del acento y no cambian aunque el estudiante cambie de color.

---

## 2. Tipografía

| Rol | Familia | Alternativa |
|---|---|---|
| Texto | Geist | `-apple-system`, Segoe UI, Helvetica, Arial, sans-serif |
| Datos y etiquetas | Geist Mono | `ui-monospace`, SF Mono, Menlo, Consolas, monospace |

Pesos en uso: 400, 500 y 600. No se usa negrita 700.

| Elemento | Tamaño | Interlineado |
|---|---|---|
| Titular de portada | `clamp(40px, 6vw, 64px)` | 1.05 |
| Entradilla de portada | 20px | 30px |
| Texto corrido | 17px | 28px |
| Título de sección (h2) | 28px | 1.2 |
| Nombre de proyecto destacado | 24px | 1.2 |
| Nombre de proyecto en rejilla | 18px | 1.3 |
| Resumen en rejilla | 15px | 24px |
| Metadatos | 13px monoespaciada | 20px |
| Antetítulo de sección | 12px monoespaciada, mayúsculas, `+0.12em` | — |

La monoespaciada se reserva para **datos**: fechas, tecnologías, contadores, etiquetas de estado y
el correo. Nunca para texto que se lee de corrido.

---

## 3. Espacio y medidas

| Token | Móvil | ≥900px |
|---|---|---|
| Ancho máximo de contenido | 1120px | 1120px |
| Ancho máximo de lectura | 720px | 720px |
| Margen lateral | 24px | 48px |
| Separación entre secciones | 64px | 96px |
| Alto de la barra superior | 56px | 56px |

Radios: 8px (botones, chips), 12px (bloques), 16px (marcos de imagen), completo (píldoras).

---

## 4. Componentes

**Botón.** Alto 44px (36px en su variante pequeña). Primario sobre `btn`; secundario sobre
`surface`.

**Chip.** Monoespaciada 13px sobre `surface`, radio 8px. Solo para tecnologías.

**Píldora.** Radio completo, con un punto del color de acento a la izquierda. Solo para el
indicador de disponibilidad.

**Marco de proyecto.** Relleno de 12px en `accent-soft`, con la imagen dentro en proporción 16:10
y radio 8px. Al pasar el ratón, la imagen escala un 2% y el borde se oscurece.

**Etiqueta de estado.** Píldora de 28px con icono y texto, en el color semántico correspondiente.
**El icono y el texto son obligatorios**: el color nunca va solo.

---

## 5. Movimiento

Solo tres tipos de animación en todo el producto:

1. Cambios de color en elementos interactivos — 150ms.
2. Aparición y desaparición de la identidad en la barra superior — 200ms.
3. Entrada escalonada de los elementos de la portada al cargar — 400ms, con 60ms de diferencia
   entre elementos.

Curva de aceleración única: `cubic-bezier(.2, .8, .2, 1)`.

Con `prefers-reduced-motion` activado, **no se ejecuta ninguna**.

---

## 6. Accesibilidad

Estas son decisiones de sistema; su verificación vive en los criterios de aceptación de la SPEC.

- Contraste mínimo AA (4.5:1) en todo el texto.
- El foco de teclado siempre visible: contorno de 2px en el color de acento, separado 3px.
- Ningún estado se comunica solo con color.
- Toda imagen decorativa se oculta a los lectores de pantalla; las que aportan información llevan
  descripción.
- Enlace de salto al contenido como primer elemento enfocable.

---

## 7. Lo que NO decide este documento

- Qué secciones existen y en qué orden → SPEC.
- Qué datos muestra cada sección → SPEC.
- Cuándo se oculta algo y por qué → SPEC.
- Cómo se implementa → decisión de DEV.
