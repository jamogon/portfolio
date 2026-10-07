# Publicar tu portfolio con GitHub Pages

Al terminar el día 2 tu portfolio deja de ser una carpeta y pasa a ser una URL que puedes mandar.
Es lo que pide el encargo: Marta quiere abrir un enlace desde el móvil, no descargar un zip.

**Esto se hace al final, cuando el producto ya funciona.** No a mitad de un lab.

---

## 1. Crea tu propio repositorio

No puedes subir nada al repositorio de la formación: es de solo lectura para ti. Necesitas uno
tuyo.

En GitHub: **New repository** → nombre `portfolio` → **Public** (Pages gratis solo funciona en
repos públicos) → **sin** README, **sin** .gitignore, **sin** licencia. Que nazca vacío.

## 2. Apunta tu carpeta a ese repositorio

Desde la carpeta del proyecto, sustituyendo `TU-USUARIO`:

```bash
git remote set-url origin git@github.com:TU-USUARIO/portfolio.git
git push -u origin main
```

Si te da error de permisos con `git@`, usa HTTPS:

```bash
git remote set-url origin https://github.com/TU-USUARIO/portfolio.git
git push -u origin main
```

Recarga la página del repositorio en GitHub: deben verse tus archivos.

## 3. Activa Pages

En tu repositorio: **Settings** → **Pages** (menú de la izquierda).

- **Source:** Deploy from a branch
- **Branch:** `main`
- **Folder:** `/ (root)`
- **Save**

## 4. Espera y abre

Tarda entre uno y dos minutos la primera vez. La URL es:

```
https://TU-USUARIO.github.io/portfolio/
```

**Ábrela en tu móvil.** Es la prueba real del requisito de Marta, y es donde aparecen los
problemas que en el navegador del portátil no se ven.

---

## Si sale en blanco o sin imágenes

Cuatro causas, por orden de frecuencia:

**El archivo de entrada no se llama `index.html`.** Pages solo busca ese nombre, en la raíz del
repositorio. Ni `portfolio.html` ni `index.html` dentro de una carpeta.

**Rutas absolutas.** `/assets/project-01.jpg` apunta a la raíz del dominio, que no es tu proyecto.
Todas las rutas van en relativo: `assets/project-01.jpg`.

**Mayúsculas.** Tu Mac o tu Windows no distinguen entre `Assets/` y `assets/`; el servidor de
Pages sí. Si en local se ve y publicado no, mira las mayúsculas del nombre del archivo.

**Caché.** Después de cada `git push` tarda un poco en actualizarse. Recarga forzando
(`Cmd+Shift+R`) antes de dar por rota ninguna otra cosa.

---

## Cada cambio posterior

```bash
git add -A
git commit -m "lo que has cambiado"
git push
```

Pages se actualiza solo. No hay que volver a tocar los ajustes.
