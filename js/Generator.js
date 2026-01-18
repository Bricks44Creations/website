/*-------CardGENERATOR----------*/
(function (global) {
  function formatDateFR(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    return isNaN(d) ? "" : d.toLocaleDateString("fr-FR");
  }

  function resolveName(p, lang) {
    if (p?.name && typeof p.name === "object") {
      return p.name[lang] || p.name.en || p.name.fr || p.label || "Untitled";
    }
    return p?.label || p?.alt || "Untitled";
  }

  function setSpanText(span, text) {
    if (!span) return;
    span.removeAttribute("data-key");      // on évite le dico i18n pour ce titre
    span.textContent = text;
  }

  function generateCards({ items = [], containerId, templateId, lang }) {
    const grid = document.getElementById(containerId);
    const tpl = document.getElementById(templateId);
    if (!grid || !tpl) return;

    const curLang = lang || (global.currentLang || "en");
    const frag = document.createDocumentFragment();

    items.forEach(p => {
      const node = tpl.content.cloneNode(true);
      const card = node.querySelector(".MOC-card");
      const img = node.querySelector("img");
      const nameSpan = node.querySelector("h3 [data-key], h3 span"); // tolérant
      const dateSpan = node.querySelector(".date");

      // Hydratation: attributs lus par script.js (tri/filtre)
      let baseHref = "detail-moc.html";
      if (p.type === "technics" || (typeof p.id === "string" && p.id.startsWith("technics"))) {
        baseHref = "detail-technic.html";
      } else if (p.type === "instruction" || (typeof p.id === "string" && p.id.startsWith("instruction"))) {
        baseHref = "detail-instruction.html";
      }
      // --- Lien carte ---
      const isInstruction =
        p.type === "instruction" ||
        (typeof p.id === "string" && p.id.startsWith("instruction"));

      // Si instruction et PDF dispo dans data.js => on ouvre le PDF directement (comme Instructions.html)
      if (isInstruction && p.href) {
        card.href = p.href;
        card.target = "_blank";
        card.rel = "noopener noreferrer";
      } else {
        card.href = `${baseHref}?id=${p.id}`;
      } card.dataset.date = p.date || "";

      card.dataset.relevance = String(p.relevance ?? 0);
      card.dataset.filter = p.filter || "";
      card.dataset.difficulty = p.difficulty ?? 0;


      if (img) { img.src = p.img || ""; img.alt = p.alt || ""; }

      // Titre : priorité à name.{fr|en}. Si absent, on laisse le dico (key) faire.
      if (p?.name && typeof p.name === "object") {
        const txt = resolveName(p, curLang);
        setSpanText(nameSpan, txt);
        // pour tri getTranslatedName() + MAJ ultérieure
        card.dataset.name = txt;
        if (p.name.en) card.dataset.nameEn = p.name.en;
        if (p.name.fr) card.dataset.nameFr = p.name.fr;
      } else if (p?.key && nameSpan) {
        // Pas de name : conserver data-key pour i18n existante
        nameSpan.setAttribute("data-key", p.key);
      } else {
        // Fallback ultime
        const txt = resolveName(p, curLang);
        setSpanText(nameSpan, txt);
        card.dataset.name = txt;
      }

      if (dateSpan) dateSpan.textContent = formatDateFR(p.date);

      frag.appendChild(node);
    });

    grid.innerHTML = "";
    grid.appendChild(frag);
  }

  // Appelé au changement de langue pour mettre à jour les titres depuis data-name-{fr|en}
  function updateCardTitlesFromNames(lang) {
    const curLang = lang || (global.currentLang || "en");
    document.querySelectorAll(".MOC-card").forEach(card => {
      const span = card.querySelector("h3 span");
      const txt =
        curLang === "fr"
          ? (card.dataset.nameFr || card.dataset.name)
          : (card.dataset.nameEn || card.dataset.name);
      if (txt && span) span.textContent = txt;
      if (txt) card.dataset.name = txt; // cohérent avec sort par Nom
    });
  }

  global.CardGenerator = { generateCards, updateCardTitlesFromNames };
})(window);

/*---*/



/* ---------- MINIFIGS GENERATOR ---------------------*/
// --- MINIFIGS GENERATOR ------------------------------------------------------
(function (global) {
  const norm = s => (s || "").trim().toLowerCase();
  const isMinifigType = t => norm(t) === "minifig"; // strict : exige type "minifig"

  // texte bilingue (string ou {fr,en})
  function pickLang(v, lang, fallback = "") {
    if (!v) return fallback;
    if (typeof v === "string") return v;
    return v[lang] || v.en || v.fr || fallback;
  }

  function ensureLightbox() {
    let lb = document.querySelector(".lightbox-minifig");
    if (!lb) {
      lb = document.createElement("div");
      lb.className = "lightbox-minifig";

      // conteneur relatif pour pouvoir positionner la croix sur l'image
      const content = document.createElement("div");
      content.className = "lightbox-content";

      const img = document.createElement("img");

      // bouton de fermeture (croix noire)
      const closeBtn = document.createElement("button");
      closeBtn.className = "lightbox-close";
      closeBtn.setAttribute("aria-label", "Fermer");
      closeBtn.textContent = "×";

      // événements
      closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        lb.style.display = "none";
      });

      // clic sur l'overlay ferme aussi
      lb.addEventListener("click", () => { lb.style.display = "none"; });

      // empêcher le clic sur l'image de remonter si tu veux garder la croix comme action principale
      content.addEventListener("click", (e) => e.stopPropagation());

      content.appendChild(img);
      content.appendChild(closeBtn);
      lb.appendChild(content);
      document.body.appendChild(lb);
    }
    return lb;
  }


  function uniqueFilms(items, lang) {
    const set = new Set(items.map(f => pickLang(f.film, lang)).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }

  /**
   * Génère les cartes Minifigs (hover, lightbox, filtre par film).
   * items: objets avec au minimum:
   *   { type:"minifig", name:(string|{fr,en}), film:(string|{fr,en}),
   *     image, hoverImage?, parts:[{name:(string|{fr,en}), link, image?}] }
   * containerId:    "figures-container"
   * filterSelectId: "film-filter" (optionnel)
   * lang: "fr" | "en" (défaut = window.currentLang || "en")
   */
  function generateMinifigs({ items = [], containerId, filterSelectId, lang }) {
    const curLang = lang || (global.currentLang || "en");
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`[CardGenerator] container #${containerId} introuvable`);
      return;
    }

    // Strictement les minifigs
    items = items.filter(p => isMinifigType(p.type));

    const lightbox = ensureLightbox();
    const lightboxImg = lightbox.querySelector("img");

    // Remplir le <select> s'il est fourni
    let filterSelect = null;
    if (filterSelectId) {
      filterSelect = document.getElementById(filterSelectId);
      if (filterSelect) {
        filterSelect.innerHTML = "";
        const optAll = document.createElement("option");
        optAll.value = "all";
        optAll.textContent = (curLang === "fr" ? "Tous" : "All");
        filterSelect.appendChild(optAll);
        uniqueFilms(items, curLang).forEach(film => {
          const opt = document.createElement("option");
          opt.value = film;
          opt.textContent = film;
          filterSelect.appendChild(opt);
        });
      }
    }

    function render(list) {
      container.innerHTML = "";

      list.forEach(fig => {
        // Précharge l’image de survol si présente
        if (fig.hoverImage) {
          const preload = new Image();
          preload.src = fig.hoverImage;
        }

        const card = document.createElement("div");
        card.className = "card-minifigs";

        const nameTxt = pickLang(fig.name, curLang, fig.alt || "Untitled");
        const filmTxt = pickLang(fig.film, curLang, "");

        // stock pour MAJ i18n ultérieure
        card.dataset.name = nameTxt;
        if (fig.name && typeof fig.name === "object") {
          if (fig.name.en) card.dataset.nameEn = fig.name.en;
          if (fig.name.fr) card.dataset.nameFr = fig.name.fr;
        }
        if (fig.film && typeof fig.film === "object") {
          if (fig.film.en) card.dataset.filmEn = fig.film.en;
          if (fig.film.fr) card.dataset.filmFr = fig.film.fr;
        } else {
          card.dataset.film = filmTxt;
        }

        const hasImage = Boolean(fig.image);
        const mainImage = hasImage
          ? `
            <img src="${fig.image}" alt="${nameTxt}"
                 data-default="${fig.image}"
                 data-hover="${fig.hoverImage || fig.image}">
          `
          : `<span>${nameTxt}</span>`;

        const partsHtml = (fig.parts || []).map(part => {
          const pname = typeof part.name === "object"
            ? (part.name[curLang] || part.name.en || part.name.fr || "")
            : (part.name || "");
          return part.image
            ? `
              <a href="${part.link}" class="part" target="_blank" rel="noopener">
                <img src="${part.image}" alt="${pname}">
                <span>${pname}</span>
              </a>`
            : `
              <a href="${part.link}" class="part" target="_blank" rel="noopener">
                <div class="placeholder">${pname ? pname[0] : "?"}</div>
                <span>${pname}</span>
              </a>`;
        }).join("");

        card.innerHTML = `
          <div class="main-image">
            ${mainImage}
            <div class="overlay-minifig">
              <h2>${nameTxt}</h2>
              <p>${filmTxt}</p>
            </div>
          </div>
          <div class="parts-bar">
            ${partsHtml}
          </div>
        `;

        // interactivité image (lightbox + hover swap)
        const mainImgElem = card.querySelector(".main-image img");
        if (mainImgElem) {
          mainImgElem.addEventListener("click", () => {
            lightboxImg.src = mainImgElem.getAttribute("data-default");
            lightbox.style.display = "flex";
          });
          mainImgElem.addEventListener("mouseenter", () => {
            const hoverSrc = mainImgElem.getAttribute("data-hover") || mainImgElem.getAttribute("data-default");
            mainImgElem.src = hoverSrc;
          });
          mainImgElem.addEventListener("mouseleave", () => {
            mainImgElem.src = mainImgElem.getAttribute("data-default");
          });
        }

        container.appendChild(card);
      });
    }

    // rendu initial (tous)
    render(items);

    // filtre dynamique via <select>
    if (filterSelect) {
      filterSelect.onchange = () => {
        const selected = filterSelect.value;
        if (selected === "all") render(items);
        else render(items.filter(f => pickLang(f.film, curLang) === selected));
      };
    }
  }

  // MAJ des textes (name/film) quand la langue change
  function updateMinifigTextsFromNames(lang) {
    const curLang = lang || (global.currentLang || "en");
    document.querySelectorAll(".card-minifigs").forEach(card => {
      const h2 = card.querySelector(".overlay-minifig h2");
      const p = card.querySelector(".overlay-minifig p");
      const name = curLang === "fr" ? (card.dataset.nameFr || card.dataset.name) : (card.dataset.nameEn || card.dataset.name);
      const film = curLang === "fr" ? (card.dataset.filmFr || card.dataset.film) : (card.dataset.filmEn || card.dataset.film);
      if (name && h2) h2.textContent = name;
      if (film && p) p.textContent = film;
    });
  }

  // Étendre l'API existante
  global.CardGenerator = Object.assign({}, global.CardGenerator, {
    generateMinifigs,
    updateMinifigTextsFromNames
  });
})(window);


/* ---------- INSTRUCTIONS GENERATOR ---------------------*/
(function (global) {
  const norm = (s) => (s || "").trim().toLowerCase();
  const isInstructionType = (t) => norm(t) === "instruction";

  // Localise la date selon la langue courante
  function updateInstructionDates(lang) {
    const locale = (lang === "fr") ? "fr-FR" : "en-GB";
    document.querySelectorAll(".MOC-card").forEach(card => {
      const dateISO = card.dataset.date;
      const dateSpan = card.querySelector(".date");
      if (!dateISO || !dateSpan) return;
      const d = new Date(dateISO);
      if (!isNaN(d)) dateSpan.textContent = d.toLocaleDateString(locale);
    });
  }

  /**
   * Génère les cartes d'instructions (nom traduisible + date locale)
   * items: tableau global (ex: window.PROJECTS)
   * containerId: "MOC-grid"
   * templateId:  "card-template"
   * lang: "fr" | "en"
   */
  function generateInstructions({ items = [], containerId, templateId, lang }) {
    const src = Array.isArray(items) ? items : [];
    const filtered = src.filter(
      p => isInstructionType(p.type) || (typeof p.id === "string" && p.id.startsWith("instruction"))
    );

    // Réutilise le générateur de cartes générique (gère name.{fr|en}, href, img, data-*)
    global.CardGenerator.generateCards({
      items: filtered,
      containerId,
      templateId,
      lang
    });

    // Localise la date après rendu initial
    updateInstructionDates(lang || global.currentLang || "en");
  }

  // Pour la bascule de langue : met à jour le titre (name.{fr|en}) + la date localisée
  function updateInstructionTitlesFromNames(lang) {
    global.CardGenerator.updateCardTitlesFromNames(lang);
    updateInstructionDates(lang);
  }

  // Étend l'API
  global.CardGenerator = Object.assign({}, global.CardGenerator, {
    generateInstructions,
    updateInstructionTitlesFromNames,
    updateInstructionDates
  });
})(window);

// detailGenerator.js
(function (global) {
  function $(id) { return document.getElementById(id); }

  function fillDetail(key, lang = global.currentLang || "en") {
    const data = global.DETAILS?.[key];
    if (!data) {
      $("title").textContent = "Projet introuvable";
      $("description").textContent = "Aucune donnée pour la clé " + key;
      return;
    }

    // titre + description
    $("title").textContent = data.title?.[lang] || data.title?.en || data.title?.fr || "";
    $("description").textContent = data.description?.[lang] || data.description?.en || "";

    // image principale
    $("hero-image").src = data.images?.main || "";

    // références
    const refs = [
      ["Date", data.date],
      ["Lieu(x)", data.locations],
      ["Œuvre", data.movie],
      ["Personnages", data.characters]
    ];
    $("refs").innerHTML = refs.map(([k, v]) =>
      `<div><strong>${k}:</strong> ${v || "-"}</div>`
    ).join("");

    // crédits
    $("credits").innerHTML = [
      data.stats?.pieces && `<span>${data.stats.pieces}</span>`,
      data.stats?.dimensions && `<span>${data.stats.dimensions}</span>`,
      data.stats?.buildTime && `<span>${data.stats.buildTime}</span>`
    ].filter(Boolean).join(" ");

    // galerie
    $("gallery").innerHTML = (data.images?.gallery || [])
      .map(img => `<figure><img src="${img.src}" alt=""><figcaption>${img.caption || ""}</figcaption></figure>`)
      .join("");
  }

  // init
  const params = new URLSearchParams(location.search);
  const key = params.get("key");
  if (key) fillDetail(key);

  global.DetailGenerator = { fillDetail };
})(window);



/* === PATCH MINIFIGS (à AJOUTER tout à la fin de Generator.js) === */
(function () {
  if (!window.CardGenerator) window.CardGenerator = {};

  // Décorateur: enrichit les cartes avec les data-* attendus par le filtre/tri Minifigs
  const _generateMinifigs = window.CardGenerator.generateMinifigs;
  window.CardGenerator.generateMinifigs = function (opts) {
    const res = _generateMinifigs?.call(window.CardGenerator, opts);

    try {
      const container = document.getElementById(opts?.containerId || "figures-container");
      if (!container) return res;

      const cards = Array.from(container.querySelectorAll(".card-minifigs"));
      const items = Array.isArray(opts?.items) ? opts.items : [];

      cards.forEach((card, i) => {
        const it = items[i] || {};
        // --- name localisé -> data-name (pour le tri)
        const name =
          typeof it.name === "object"
            ? (it.name[(opts?.lang) || window.currentLang || "en"] || it.name.en || it.name.fr || "")
            : (it.name || "");
        if (name) card.dataset.name = name;

        // --- films -> data-film, data-filmEn, data-filmFr (pour le filtre)
        const film = it.film || "";
        const filmEn = it.filmEn || (typeof it.film === "object" ? it.film.en : "") || "";
        const filmFr = it.filmFr || (typeof it.film === "object" ? it.film.fr : "") || "";

        if (film) card.dataset.film = String(film);
        if (filmEn) card.dataset.filmEn = String(filmEn);
        if (filmFr) card.dataset.filmFr = String(filmFr);
      });
    } catch (e) {
      console.warn("Minifigs patch failed:", e);
    }

    return res;
  };

  // Utilitaire : met à jour le texte affiché (nom/film) selon la langue, et resynchronise data-name
  window.CardGenerator.updateMinifigTextsFromNames = function (lang) {
    const L = lang || window.currentLang || "en";
    const cards = document.querySelectorAll(".card-minifigs");
    cards.forEach(card => {
      // Met à jour data-name d’après le libellé visible (utile pour le tri A-Z)
      const h3 = card.querySelector("h3");
      if (h3) {
        const clone = h3.cloneNode(true);
        clone.querySelectorAll(".date")?.forEach(n => n.remove?.());
        const txt = (clone.textContent || "").trim();
        if (txt) card.dataset.name = txt;
      }

      // Si tu affiches le film dans la carte, adapte ici (ex: span[data-role='film'])
      const filmEl = card.querySelector("[data-role='film']");
      if (filmEl) {
        const v = (L === "fr") ? (card.dataset.filmFr || card.dataset.film || "")
          : (card.dataset.filmEn || card.dataset.film || "");
        filmEl.textContent = v;
      }
    });
  };
})();


/* ---------- Technics GENERATOR ---------------------*/
(function (global) {
  const norm = (s) => (s || "").trim().toLowerCase();
  const isTechnicType = (t) => norm(t) === "technics";

  // Localise la date selon la langue courante (comme pour Instructions)
  function updateTechnicDates(lang) {
    const locale = (lang === "fr") ? "fr-FR" : "en-GB";
    document.querySelectorAll(".MOC-card").forEach(card => {
      const dateISO = card.dataset.date;
      const dateSpan = card.querySelector(".date");
      if (!dateISO || !dateSpan) return;
      const d = new Date(dateISO);
      if (!isNaN(d)) dateSpan.textContent = d.toLocaleDateString(locale);
    });
  }

  /**
   * Génère les cartes de Technics (nom traduisible + date locale).
   * items: tableau source (ex: window.PROJECTS)
   * containerId: "Technics-grid"
   * templateId:  "card-template"
   * lang: "fr" | "en"
   */
  function generateTechnics({ items = [], containerId, templateId, lang }) {
    const src = Array.isArray(items) ? items : [];
    const filtered = src.filter(
      p => isTechnicType(p.type) || (typeof p.id === "string" && p.id.startsWith("technics"))
    );

    // Réutilise le générateur de cartes générique (gère name.{fr|en}, href, img, data-*)
    global.CardGenerator.generateCards({
      items: filtered,
      containerId,
      templateId,
      lang
    }); /* s’appuie sur CardGenerator.generateCards:contentReference[oaicite:0]{index=0} */

    // Localise la date après rendu initial (comme pour Instructions)
    updateTechnicDates(lang || global.currentLang || "en");
  }

  // Pour la bascule de langue : met à jour le titre (name.{fr|en}) + la date localisée
  function updateTechnicTitlesFromNames(lang) {
    global.CardGenerator.updateCardTitlesFromNames(lang); /* même API que les Instructions:contentReference[oaicite:1]{index=1} */
    updateTechnicDates(lang);
  }

  // Expose l’API
  global.CardGenerator = Object.assign({}, global.CardGenerator, {
    generateTechnics,
    updateTechnicTitlesFromNames,
    updateTechnicDates
  });
})(window);

document.addEventListener("DOMContentLoaded", () => {
  CardGenerator.generateTechnics({
    items: window.PROJECTS,          // ton tableau global
    containerId: "technics-grid",        // l’ID de ta grille
    templateId: "card-template",     // le <template> de card
    lang: window.currentLang || "en"
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const src = window.PROJECTS || window.project || [];
  window.CardGenerator.generateTechnics({
    items: src,
    containerId: "technics-grid",
    templateId: "card-template",
    lang: window.currentLang || "en"
  });
});



// Bascule de langue
(function () {
  const prev = window.setLanguage;
  window.setLanguage = function (lang) {
    prev?.(lang);
    window.CardGenerator.updateTechnicTitlesFromNames(lang);
    if (typeof sortMOC === "function") sortMOC();
  };
  window.CardGenerator.updateTechnicTitlesFromNames(window.currentLang || "en");

})();




/* ===== HEADER & FOOTER GENERATOR ===== */
(function () {
  // Inject header au tout début du body
  const headerHtml = `
  <header class="header">
    <button class="burger" id="burger-btn" aria-label="Ouvrir le menu">☰</button>
    <div class="logo-text">
      <a href="index.html"><img src="img/logo_actuel.png" alt="Logo" /></a>
      <a href="index.html"><h1 data-key="site_title">Bricks Creations</h1></a>
    </div>
    <nav class="navbar">
      <ul class="menu">
        <li class="has-submenu">
          <a href="MOC-home.html"><span data-key="MOCs">MOCs</span><span class="arrow-down">&#9662;</span></a>
          <ul class="submenu">
            <li><a href="MOC.html?theme=all" data-key="filter_all">Voir tous</a></li>
            <li class="separator"></li>
            <li><a href="MOC.html?theme=city" data-key="MOC_city">City</a></li>
            <li><a href="MOC.html?theme=jurassic-park" data-key="MOC_jp">Jurassic Park</a></li>
            <li><a href="MOC.html?theme=marvel" data-key="MOC_marvel">Marvel</a></li>
            <li><a href="MOC.html?theme=medieval" data-key="MOC_medieval">Medieval</a></li>
            <li><a href="MOC.html?theme=wizarding-world" data-key="MOC_ww">Wizarding World</a></li>
            <li><a href="MOC.html?theme=others" data-key="MOC_others">Others</a></li>
          </ul>
        </li>
        <li><a href="Instructions.html" data-key="instructions">Instructions</a></li>
        <li><a href="Minifigs.html" data-key="minifigs">Minifigs</a></li>
        <li><a href="Technics.html" data-key="technics">Technics</a></li>
        <li class="has-submenu">
          <a href="Conventions.html"><span data-key="conventions">Conventions</span><span class="arrow-down">&#9662;</span></a>
          <ul class="submenu">
            <li><a href="detail-conventions.html?id=bousies-2018" data-key="convention_bousies">Bousies</a></li>
            <li><a href="detail-conventions.html?id=escaudoeuvres-2019" data-key="convention_Preseau">Escaudoeuvres</a></li>
            <li><a href="detail-conventions.html?id=divion-2022" data-key="convention_divion">Divion</a></li>
          </ul>
        </li>
      </ul>
    </nav>
    <div class="header-right-link">
      <ul class="menu">
        <li class="has-submenu">
          <a href="#" id="translate-btn-desktop">
            <i class="fa-solid fa-language"></i>
            <span id="current-lang" data-key="current_language">English</span>
            <span class="arrow-down">&#9662;</span>
          </a>
          <ul class="submenu">
            <li><a href="#" class="lang-option" data-lang="en">English</a></li>
            <li><a href="#" class="lang-option" data-lang="fr">Français</a></li>
          </ul>
        </li>
      </ul>
    </div>
  </header>

  <!-- SIDEBAR MOBILE -->
  <aside id="mobile-sidebar" class="mobile-sidebar hidden" role="dialog" aria-modal="true" aria-labelledby="sidebar-title">
    <button id="close-sidebar" aria-label="Fermer le menu">×</button>
    <nav>
      <ul class="menu-sidebar">
        <li><a href="index.html" data-key="home">Home</a></li>
        <li class="big-separator"></li>
        <li class="mobile-has-submenu">
          <button class="submenu-toggle" aria-expanded="false"><span data-key="MOC">MOC</span> <span class="arrow-down">&#9662;</span></button>
          <ul class="mobile-submenu">
            <li><a href="MOC.html?theme=all" data-key="filter_all">Voir tous</a></li>
            <li class="big-separator"></li>
            <li><a href="MOC.html?theme=city" data-key="MOC_city">City</a></li>
            <li><a href="MOC.html?theme=jurassic-park" data-key="MOC_jp">Jurassic Park</a></li>
            <li><a href="MOC.html?theme=marvel" data-key="MOC_marvel">Marvel</a></li>
            <li><a href="MOC.html?theme=medieval" data-key="MOC_medieval">Medieval</a></li>
            <li><a href="MOC.html?theme=wizarding-world" data-key="MOC_ww">Wizarding World</a></li>
            <li><a href="MOC.html?theme=others" data-key="MOC_others">Others</a></li>
          </ul>
        </li>
        <li class="separator"></li>
        <li><a href="Instructions.html" data-key="instructions">Instructions</a></li>
        <li class="separator"></li>
        <li><a href="Minifigs.html" data-key="minifigs">Minifigs</a></li>
        <li class="separator"></li>
        <li><a href="Technics.html" data-key="technics">Technics</a></li>
        <li class="separator"></li>
        <li class="mobile-has-submenu">
          <button class="submenu-toggle" aria-expanded="false"><span data-key="conventions">Conventions</span> <span class="arrow-down">&#9662;</span></button>
          <ul class="mobile-submenu">
<li><a href="detail-conventions.html?id=bousies-2018" data-key="convention_bousies">Bousies</a></li>
            <li><a href="detail-conventions.html?id=escaudoeuvres-2019" data-key="convention_Preseau">Escaudoeuvres</a></li>
            <li><a href="detail-conventions.html?id=divion-2022" data-key="convention_divion">Divion</a></li>
          </ul>
        </li>
        <li class="big-separator"></li>
        <li class="mobile-has-submenu">
          <button class="submenu-toggle" aria-expanded="false"><span data-key="languages">Langues</span> <span class="arrow-down">&#9662;</span></button>
          <ul class="mobile-submenu">
            <li><a href="#" class="lang-option" data-lang="en">English</a></li>
            <li><a href="#" class="lang-option" data-lang="fr">Français</a></li>
          </ul>
        </li>
      </ul>
    </nav>
  </aside>
  <div id="overlay" class="hidden"></div>
  `;

  document.body.insertAdjacentHTML("afterbegin", headerHtml);

  // Inject footer à la fin du body
  const footerHtml = `
  <footer class="footer" id="footer">
    <div class="footer-columns">
      <div class="footer-column footer-useful-links">
        <h3 data-key="quick_links">Quick Links</h3>
        <ul class="quick-links">
          <li><a href="index.html" data-key="home"></a></li>
          <li><a href="MOC-home.html" data-key="MOC"></a></li>
          <li><a href="Instructions.html" data-key="instructions"></a></li>
          <li><a href="Minifigs.html" data-key="minifigs"></a></li>
          <li><a href="Technics.html" data-key="Technics"></a></li>
          <li><a href="Conventions.html" data-key="conventions"></a></li>
        </ul>
      </div>
      <div class="footer-column footer-info">
        <h3 data-key="social_contacts"></h3>
        <ul class="footer-links">
          <li><a href="https://www.youtube.com/@BricksCreations" target="_blank" rel="noopener noreferrer"><span data-key="youtube">YouTube </span><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a></li>
          <li><a href="https://www.instagram.com/bricks44creations" target="_blank"><span data-key="instagram">Instagram </span><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a></li>
          <li><a href="https://www.tiktok.com/@brickscreations" target="_blank" rel="noopener noreferrer"><span data-key="tiktok">TikTok </span><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a></li>
          <li><a href="mailto:stix.bricks@gmail.com" target="_blank" rel="noopener noreferrer"><span data-key="email">Email </span><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a></li>
        </ul>
      </div>
      <div class="footer-column footer-useful-links">
        <h3 data-key="more_from_me"></h3>
        <ul class="footer-links">
          <li><a href="More_about_me.html" data-key="who_am_i"></a></li>
          <li><a href="index.html" target="_blank" rel="noopener noreferrer" data-key="my_website"></a></li>
        </ul>
      </div>
      <div class="footer-column footer-useful-links">
        <h3 data-key="legal_notices"></h3>
        <ul class="footer-links">
          <li><a href="legal_notices.html" data-key="legal_notices"></a></li>
        </ul>
      </div>
    </div>
    <p class="copyright" data-key="footer_disclaimer">
      © 2024-{YEAR} All rights reserved Bricks Creations <br>
      I don't work for LEGO®, I am not corrupted by LEGO®, I buy my LEGO® myself. <br>
      For the rest, the owners of the respective brands mentioned on the site remain the owners and it is very well like that. LEGO® is a registered trademark of The LEGO Group which does not sponsor, authorize or endorse this site.
    </p>
  </footer>
  `;

  document.body.insertAdjacentHTML("beforeend", footerHtml);
})();
