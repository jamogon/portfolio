# portfolio-lab

Punto de partida de la formación **Construir productos con IA** (2 días).

El proyecto vehículo es un **portfolio personal de desarrollador**. El objetivo no es el
portfolio: es el proceso — agentes + specs + desarrollo + QA + cambios.

## Qué hay aquí

| Archivo / carpeta | Qué es |
|---|---|
| `requirements.md` | El encargo de la empresa. Es lo único que sabes del producto. |
| `data/projects.json` | Los datos con los que trabajas. |
| `assets/` | Las imágenes de los proyectos. |
| `design/DESIGN-001.md` | Sistema de diseño. **Ya está hecho y no se toca.** |
| `specs/SPEC-001.md` | Vacía. La rellenas tú en el LAB 1. |
| `tasks.md` | Vacía. La rellenas tú en el LAB 1. |
| `agents/pm.md` | Vacía. La rellenas tú en el LAB 2. |
| `agents/dev.md` | Vacía. La rellenas tú en el LAB 3. |
| `agents/qa.md` | Vacía. La rellenas tú en el LAB 4. |
| `DEPLOY.md` | Cómo publicar tu portfolio en una URL. Al final del día 2. |

**El producto va en la raíz del repositorio**: `index.html` y lo que necesite a su lado. No lo
metas en una subcarpeta — así las rutas a `data/` y `assets/` funcionan tal cual, y publicarlo
después es cuestión de dos clics.

## Cómo se trabaja

No editas este repo mientras trabajas: **trabajas dentro de Teros.ai**. Este repo es el punto de
partida y el sitio donde queda el resultado.

1. Te descargas el repo al empezar el día 1.
2. En cada lab, pegas en Teros.ai el contenido del archivo que toque.
3. Trabajas allí: spec, agentes, implementación.
4. Al cerrar el lab, vuelcas el resultado al archivo correspondiente de este repo.

Un único volcado al cerrar cada lab. No subas nada a mitad: el ida y vuelta cuesta más tiempo del
que ahorra.

## Versiones de la spec

Guarda **todas** las versiones de la spec, no solo la última:

```
specs/
├── SPEC-001-v0.md    ← LAB 1 · tu primera spec, antes del PM Agent
├── SPEC-001-v1.md    ← LAB 2 · después de que el PM Agent la revise
└── SPEC-001-v2.md    ← Día 2 · después del change request
```

El repo con las tres versiones es el **entregable final**.

## Reglas de oro

- El agente propone; el humano decide.
- La SPEC es la referencia del desarrollo.
- Si falta una decisión importante, se pregunta.
- DEV no inventa requisitos.
- QA no redefine el producto.
- Cuando cambia el requisito, se actualiza primero la SPEC.
