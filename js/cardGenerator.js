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
            const card = node.querySelector(".portfolio-card");
            const img = node.querySelector("img");
            const nameSpan = node.querySelector("h3 [data-key], h3 span"); // tolérant
            const dateSpan = node.querySelector(".date");

            // Hydratation: attributs lus par script.js (tri/filtre)
            card.href = p.href || "#";
            card.dataset.date = p.date || "";
            card.dataset.relevance = String(p.relevance ?? 0);
            card.dataset.filter = p.filter || "";

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
        document.querySelectorAll(".portfolio-card").forEach(card => {
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
            const img = document.createElement("img");
            lb.appendChild(img);
            lb.addEventListener("click", () => { lb.style.display = "none"; });
            document.body.appendChild(lb);
        }
        return lb;
    }

    function uniqueFilms(items, lang) {
        const set = new Set(items.map(f => pickLang(f.film, lang)).filter(Boolean));
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }
    
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
        document.querySelectorAll(".portfolio-card").forEach(card => {
            const dateISO = card.dataset.date;
            const dateSpan = card.querySelector(".date");
            if (!dateISO || !dateSpan) return;
            const d = new Date(dateISO);
            if (!isNaN(d)) dateSpan.textContent = d.toLocaleDateString(locale);
        });
    }

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
            ["Œuvre", data.work],
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

