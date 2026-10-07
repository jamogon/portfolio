/* ============================================================
   Portfolio — main.js
   Punto de entrada: pide los datos a la capa de datos
   (js/data/) y los pinta en la página.
   (SPEC-001 §6: el contenido se gestiona editando JSON, no código.)
   ============================================================ */

"use strict";

/* ---------- Portada + Sobre mí + Footer ---------- */
function renderPerfil(profile) {
  // Nombre (barra superior y portada)
  document.querySelectorAll('[data-profile="nombre"]').forEach((el) => {
    el.textContent = profile.nombre;
  });

  // Foto de portada (si no hay foto, se oculta el <img>)
  const foto = document.querySelector('[data-profile="foto"]');
  if (foto) {
    if (profile.foto) {
      foto.src = profile.foto;
      foto.alt = `Foto de ${profile.nombre}`;
    } else {
      foto.hidden = true;
    }
  }

  // Titular de disponibilidad
  const titular = document.querySelector('[data-profile="titular"]');
  if (titular) titular.textContent = profile.titular;

  // Entradilla de portada (DESIGN-001 §2: 20px/30px)
  const entradilla = document.querySelector('[data-profile="descripcion"]');
  if (entradilla) entradilla.textContent = profile.descripcion;

  // Email con mailto (SPEC-001 §6)
  const email = document.querySelector('[data-profile="email"]');
  if (email && profile.email) {
    email.textContent = profile.email;
    email.href = `mailto:${profile.email}`;
  }

  // Sobre mí: descripción, datos personales, contacto y formación
  // con fechas (SPEC-001 R1/R2). Todo se alimenta de profile.json.
  const sobreMi = document.querySelector('[data-profile="sobre-mi"]');
  if (sobreMi) {
    // --- Breve descripción ---
    if (profile.descripcion) {
      const desc = document.createElement("p");
      desc.className = "prosa sobre-mi__descripcion";
      desc.textContent = profile.descripcion;
      sobreMi.appendChild(desc);
    }

    // --- Datos personales ---
    const datos = document.createElement("dl");
    datos.className = "sobre-mi__datos";

    const addDato = (etiqueta, valor) => {
      if (!valor) return;
      const dt = document.createElement("dt");
      dt.className = "sobre-mi__etiqueta";
      dt.textContent = etiqueta;
      const dd = document.createElement("dd");
      dd.className = "sobre-mi__valor";
      dd.textContent = valor;
      datos.append(dt, dd);
    };

    addDato("Nombre", profile.nombre);
    addDato("Titular", profile.titular);

    if (datos.children.length > 0) {
      sobreMi.appendChild(datos);
    }

    // --- Datos de contacto ---
    const contacto = document.createElement("div");
    contacto.className = "sobre-mi__contacto";

    const contactoTitulo = document.createElement("h3");
    contactoTitulo.className = "sobre-mi__subtitulo";
    contactoTitulo.textContent = "Contacto";
    contacto.appendChild(contactoTitulo);

    const contactoLista = document.createElement("ul");
    contactoLista.className = "sobre-mi__contacto-lista";

    // Email con mailto (SPEC-001 §6)
    if (profile.email) {
      const li = document.createElement("li");
      const mail = document.createElement("a");
      mail.className = "mono";
      mail.href = `mailto:${profile.email}`;
      mail.textContent = profile.email;
      li.appendChild(mail);
      contactoLista.appendChild(li);
    }

    // Redes sociales (enlaces externos, nueva pestaña, nofollow)
    for (const [red, url] of Object.entries(profile.redes)) {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "nofollow noopener";
      a.textContent = red;
      li.appendChild(a);
      contactoLista.appendChild(li);
    }

    if (contactoLista.children.length > 0) {
      contacto.appendChild(contactoLista);
      sobreMi.appendChild(contacto);
    }

    // --- Formación con fechas (R1) ---
    if (profile.formacion.length > 0) {
      const formacion = document.createElement("div");
      formacion.className = "sobre-mi__formacion";

      const formacionTitulo = document.createElement("h3");
      formacionTitulo.className = "sobre-mi__subtitulo";
      formacionTitulo.textContent = "Formación";
      formacion.appendChild(formacionTitulo);

      const lista = document.createElement("ul");
      lista.className = "formacion";
      for (const f of profile.formacion) {
        const li = document.createElement("li");
        li.className = "formacion__item";

        const titulo = document.createElement("strong");
        titulo.textContent = f.centro
          ? `${f.titulo} (${f.centro})`
          : f.titulo;

        const fechas = document.createElement("span");
        fechas.className = "meta";
        fechas.textContent = `${f.fechaInicio} – ${f.fechaFin}`;

        li.append(titulo, document.createTextNode(" — "), fechas);
        lista.appendChild(li);
      }
      formacion.appendChild(lista);
      sobreMi.appendChild(formacion);
    }
  }

  // Footer: contacto de nuevo (SPEC-001 §8)
  const footer = document.querySelector('[data-profile="footer"]');
  if (footer && profile.email) {
    const p = document.createElement("p");
    const mail = document.createElement("a");
    mail.className = "mono";
    mail.href = `mailto:${profile.email}`;
    mail.textContent = profile.email;
    p.append(`${profile.nombre} · `, mail);

    for (const [red, url] of Object.entries(profile.redes)) {
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "nofollow noopener";
      a.textContent = red;
      p.append(" · ", a);
    }
    footer.appendChild(p);
  }
}

/* ---------- Proyectos ---------- */
function renderProyectos(proyectos) {
  const cont = document.querySelector("[data-projects]");
  if (!cont) return;

  for (const p of proyectos) {
    const card = document.createElement("article");
    card.className = "proyecto";

    // Marco con imagen o tarjeta tipográfica de respaldo (SPEC-001 §10)
    if (p.imagen) {
      const marco = document.createElement("div");
      marco.className = "proyecto__marco";
      const img = document.createElement("img");
      img.src = p.imagen;
      img.alt = `Imagen del proyecto ${p.nombre}`;
      img.loading = "lazy";
      marco.appendChild(img);

      // La imagen enlaza al repositorio (SPEC-001 §9).
      // El alt de la imagen ya describe el destino del enlace,
      // así que el <a> no necesita aria-label adicional.
      const link = document.createElement("a");
      link.href = p.enlace;
      link.target = "_blank";
      link.rel = "nofollow noopener";
      link.appendChild(marco);
      card.appendChild(link);
    } else {
      // Tarjeta tipográfica de respaldo (SPEC-001 §10): el nombre ya
      // aparece como <h3> en la tarjeta, así que este bloque es
      // decorativo y se oculta a los lectores de pantalla (DESIGN-001 §6).
      const fallback = document.createElement("div");
      fallback.className = "proyecto__marco proyecto__marco--tipografico";
      fallback.setAttribute("aria-hidden", "true");
      fallback.textContent = p.nombre;
      card.appendChild(fallback);
    }

    const nombre = document.createElement("h3");
    nombre.className = "proyecto__nombre";
    nombre.textContent = p.nombre;
    card.appendChild(nombre);

    if (p.descripcion) {
      const resumen = document.createElement("p");
      resumen.className = "proyecto__resumen";
      resumen.textContent = p.descripcion;
      card.appendChild(resumen);
    }

    const meta = document.createElement("p");
    meta.className = "meta";
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = p.tecnologia;
    meta.append(chip, ` · ${p.fecha} · `);

    const repo = document.createElement("a");
    repo.href = p.enlace;
    repo.target = "_blank";
    repo.rel = "nofollow noopener";
    repo.textContent = "GitHub";
    meta.appendChild(repo);

    card.appendChild(meta);
    cont.appendChild(card);
  }
}

/* ---------- Aviso de error (SPEC-001 §10) ---------- */
function renderAvisoError() {
  const main = document.querySelector("main");
  if (!main) return;
  const aviso = document.createElement("p");
  aviso.className = "meta";
  aviso.textContent =
    "Parte del contenido no se pudo cargar. Se muestra el contenido disponible.";
  main.prepend(aviso);
}

/* ---------- Arranque ---------- */
async function init() {
  // Carga en paralelo; cada módulo resuelve con contenido por
  // defecto si su JSON es inválido (nunca rompen la página).
  const [{ profile, error: errorPerfil }, { proyectos, error: errorProyectos }] =
    await Promise.all([cargarPerfil(), cargarProyectos()]);

  renderPerfil(profile);
  renderProyectos(proyectos);

  if (errorPerfil || errorProyectos) renderAvisoError();
}

init();
