
// === Utils dropdown tri/filtre ===
function closeAllDropdowns() {
  document.querySelectorAll('.dropdown-content-tri').forEach(dd => dd.classList.remove('show'));
  document.querySelectorAll('.dropbtn-tri .arrow-down').forEach(arrow => arrow.classList.remove('rotate'));
}


// ======== INITIALISATION UI (regroupée) ========
function initUIOnDOMContentLoaded() {
  // --- Burger / sidebar mobile
  const burgerBtn = document.getElementById('burger-btn');
  const sidebar = document.getElementById('mobile-sidebar');
  const closeBtn = document.getElementById('close-sidebar');
  const overlay = document.getElementById('overlay');

  function openSidebar() {
    sidebar?.classList.remove('hidden');
    overlay?.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    sidebar?.classList.add('hidden');
    overlay?.classList.add('hidden');
    document.body.style.overflow = '';
  }

  burgerBtn?.addEventListener('click', openSidebar);
  closeBtn?.addEventListener('click', closeSidebar);
  overlay?.addEventListener('click', closeSidebar);

  document.querySelectorAll('.submenu-toggle').forEach(button => {
    button.addEventListener('click', () => {
      const submenu = button.nextElementSibling;
      const isExpanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!isExpanded));
      if (submenu) submenu.style.display = isExpanded ? 'none' : 'flex';
    });
  });

  // --- Sort modal (mobile)
  const sortBtn = document.getElementById("sort-btn");
  const sortModal = document.getElementById("sort-modal");

  sortBtn?.addEventListener("click", (e) => {
    if (window.innerWidth <= 768 && sortModal) {
      e.preventDefault();
      sortModal.style.display = "flex";
    }
  });

  document.querySelectorAll(".close-sort-modal").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const modal = e.target.closest(".sort-modal");
      if (modal) modal.style.display = "none";
      document.body.style.overflow = "";
    });
  });

  sortModal?.addEventListener("click", (e) => {
    if (e.target === sortModal) {
      sortModal.style.display = "none";
    }
  });

  // --- Langue (options + localStorage)
  document.querySelectorAll(".lang-option").forEach(option => {
    option.addEventListener("click", (e) => {
      e.preventDefault();
      const lang = e.target.getAttribute("data-lang");
      if (lang) setLanguage(lang);
    });
  });

  const saved = loadLang();
  if (saved) currentLang = saved;

  // Définir langue par défaut (ou sauvegardée)
  setLanguage(currentLang);

  // --- Filtre (si présent)
  buildfilterFilterUI();
  applyfilterFilter();

  // --- Synchronisations titres (après premier rendu)
  setupTitleSyncObservers();
  // On attend la stabilité du layout : fonts + resizeCardTitles au load (voir listener window.load),
  // mais ici on fait une première passe "soft" au cas où.
  requestAnimationFrame(() => {
    resizeCardTitles();
    syncAllCardTitles();
  });
}

document.addEventListener("DOMContentLoaded", initUIOnDOMContentLoaded);

// --- TRI MOC ---
const sortBtn = document.getElementById("sort-btn");
const sortLabel = document.getElementById("sort-label");
const sortArrow = sortBtn?.querySelector(".arrow-down");
const sortOptions = document.getElementById("sort-options");

sortBtn?.addEventListener("mousehover", (e) => {
  e.stopPropagation();
  sortOptions?.classList.toggle("show");
  if (sortArrow) sortArrow.classList.toggle("rotate", sortOptions?.classList.contains("show"));
});

window.addEventListener("click", (e) => {
  if (!e.target.closest(".dropdown-tri")) {
    sortOptions?.classList.remove("show");
    if (sortArrow) sortArrow.classList.remove("rotate");
  }
});

function handleSortChoice(link, closeMenus = true) {
  const criteria = link.dataset.sort;
  const isMinifigs = !!document.getElementById("figures-container");

  // On considère “Instructions” si des options de tri difficulté existent sur la page
  const isInstructionsPage = !isMinifigs && !!document.querySelector(
    '#sort-options a[data-sort^="difficulty"], #sort-modal a[data-sort^="difficulty"]'
  );

  if (isMinifigs && typeof sortMinifig === "function") {
    sortMinifig(criteria);
  } else if (isInstructionsPage && typeof sortInstruction === "function") {
    sortInstruction(criteria);
  } else {
    sortMOC(criteria);
  }

  if (sortLabel) {
    const selectedKey = link.getAttribute("data-key");
    const prefix = translations[currentLang].sort_label_prefix || "";
    const translatedOption = translations[currentLang][selectedKey] || link.textContent;
    sortLabel.setAttribute("data-key", selectedKey);
    sortLabel.textContent = `${prefix}${translatedOption}`;
  }

  if (closeMenus) {
    sortOptions?.classList.remove("show");
    if (sortArrow) sortArrow.classList.remove("rotate");
    const sortModal = document.getElementById("sort-modal");
    if (sortModal) sortModal.style.display = "none";
  }
}

document.querySelectorAll("#sort-options a, #sort-modal a").forEach(option => {
  option.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    handleSortChoice(this);
  });
});

// Helper: récupère le nom affiché (traduit) dans une carte
function getTranslatedName(card) {
  const nameEl = card.querySelector('h3 [data-key]');
  if (nameEl) return nameEl.textContent.trim();
  if (card.dataset.name) return card.dataset.name.trim();
  const h3 = card.querySelector('h3');
  if (h3) {
    const clone = h3.cloneNode(true);
    const dateEl = clone.querySelector('.date');
    if (dateEl) dateEl.remove();
    return clone.textContent.trim();
  }
  return "";
}

function sortMOC(criteria) {
  const grid = document.querySelector(".MOC-grid");
  if (!grid) return;

  if (criteria) currentSortCriteria = criteria;

  const items = Array.from(grid.querySelectorAll(".MOC-card"));
  const collator = new Intl.Collator(currentLang, { sensitivity: "base", numeric: true });

  items.sort((a, b) => {
    const nameA = getTranslatedName(a);
    const nameB = getTranslatedName(b);
    const dateA = new Date(a.dataset.date || 0);
    const dateB = new Date(b.dataset.date || 0);
    const relevanceA = parseInt(a.dataset.relevance || 0, 10);
    const relevanceB = parseInt(b.dataset.relevance || 0, 10);

    switch (currentSortCriteria) {
      case "name-asc": return collator.compare(nameA, nameB);
      case "name-desc": return collator.compare(nameB, nameA);
      case "date-asc": return dateA - dateB;
      case "date-desc": return dateB - dateA;
      case "relevance": return relevanceB - relevanceA;
      default: return 0;
    }
  });

  grid.innerHTML = "";
  items.forEach(item => grid.appendChild(item));
}

function sortMinifig(criteria) {
  const grid = document.querySelector("#figures-container");
  if (!grid) return;

  if (criteria) currentSortCriteria = criteria;
  const items = Array.from(grid.querySelectorAll(".card-minifigs"));
  const collator = new Intl.Collator(window.currentLang || "en", { sensitivity: "base", numeric: true });

  items.sort((a, b) => {
    const an = a.dataset.name || "", bn = b.dataset.name || "";
    const ar = parseFloat(a.dataset.relevance) || 0, br = parseFloat(b.dataset.relevance) || 0;

    switch (currentSortCriteria) {
      case "name-asc": return collator.compare(an, bn);
      case "name-desc": return collator.compare(bn, an);
      case "relevance": return br - ar;
      default: return 0;
    }
  });

  items.forEach(el => grid.appendChild(el));
}

function sortInstruction(criteria) {
  const grid = document.querySelector(".MOC-grid");
  if (!grid) return;

  if (criteria) currentSortCriteria = criteria;

  const items = Array.from(grid.querySelectorAll(".MOC-card"));
  const collator = new Intl.Collator(currentLang, { sensitivity: "base", numeric: true });

  items.sort((a, b) => {
    const nameA = getTranslatedName(a);
    const nameB = getTranslatedName(b);
    const difficultyA = parseInt(a.dataset.difficulty || 0, 10);
    const difficultyB = parseInt(b.dataset.difficulty || 0, 10);

    switch (currentSortCriteria) {
      case "name-asc": return collator.compare(nameA, nameB);
      case "name-desc": return collator.compare(nameB, nameA);
      case "difficulty-asc": return difficultyA - difficultyB;
      case "difficulty-desc": return difficultyB - difficultyA;
      default: return 0;
    }
  });

  grid.innerHTML = "";
  items.forEach(item => grid.appendChild(item));
}

/* ========= PERSISTENCE LANGUE (ajout) ========= */
function saveLang(lang) {
  try { localStorage.setItem("preferredLang", lang); } catch { /* ignore */ }
}
function loadLang() {
  try { return localStorage.getItem("preferredLang"); } catch { return null; }
}

let currentLang = "en";
let currentSortCriteria = "date-desc"; // mémorise le dernier tri choisi

/* ====== setLanguage existante + sauvegarde (ajout) ====== */
function setLanguage(lang) {
  currentLang = lang;
  document.querySelectorAll("[data-key]").forEach(el => {
    const key = el.getAttribute("data-key");
    if (translations[currentLang][key]) {
      let text = translations[currentLang][key];
      // Si c’est le footer, transformer \n en <br>
      if (key === "footer_disclaimer") {
        const currentYear = new Date().getFullYear();
        text = text
          .replace("{YEAR}", currentYear)
          .replace(/\n/g, "<br>");
      }
      el.innerHTML = text;
    }
  });
  // Mise à jour du label de tri avec préfixe + option traduite
  const sortLabel = document.getElementById("sort-label");
  if (sortLabel) {
    const optionKey = sortLabel.getAttribute("data-key");
    const prefix = translations[currentLang].sort_label_prefix || "";
    const translatedOption = translations[currentLang][optionKey] || sortLabel.textContent;
    sortLabel.textContent = `${prefix}${translatedOption}`;
  }

  // Synchroniser data-name avec le libellé traduit
  document.querySelectorAll(".MOC-card").forEach(card => {
    const translated = getTranslatedName(card);
    if (translated) card.dataset.name = translated;
  });

  // Ré-appliquer le tri courant pour refléter la langue choisie
  // Ré-appliquer le tri courant pour refléter la langue choisie (selon la page)
  const isMinifigs = !!document.getElementById("figures-container");
  const isInstructionsPage = !isMinifigs && !!document.querySelector(
    '#sort-options a[data-sort^="difficulty"], #sort-modal a[data-sort^="difficulty"]'
  );

  if (isMinifigs && typeof sortMinifig === "function") {
    sortMinifig();
  } else if (isInstructionsPage && typeof sortInstruction === "function") {
    sortInstruction();
  } else {
    sortMOC();
  }

  requestAnimationFrame(() => {
    // 1) Ajuster la taille de police si besoin
    resizeCardTitles();
    // 2) Puis synchroniser les paddings des titres (section-row + MOC-grid)
    syncAllCardTitles();
  });
  // --- AJOUT : persister la langue
  saveLang(lang);
  updateDetailTexts(lang); // <<< ajoute cette ligne
  window.updateTechnicDetailTexts?.(lang);

} /* ← c’est bien cette fonction que tu avais déjà, enrichie pour sauver la langue :contentReference[oaicite:0]{index=0} */

// ------- MAJ des textes de detail-moc quand on change de langue -------
function updateDetailTexts(lang) {
  // Ne fait rien si on n'est pas sur la page détail
  const h1 = document.getElementById('page-title');
  if (!h1) return;

  const params = new URLSearchParams(location.search);
  const mocId = params.get('id');

  // ===== PATCH CONVENTIONS (detail-conventions.html) =====
  // Si EXPO existe, on est sur une page "Conventions" -> titre = "City Year"
  const EXPO = (window.EXPO || []);
  const expo = EXPO.find(e => e.id === mocId);
  if (expo) {
    h1.textContent = expo.year ? `${expo.city} ${expo.year}` : (expo.city || mocId);
    return;
  }
  if (!mocId) return;

  const PROJECTS = (window.PROJECTS || window.project || []);
  const DETAILS = (window.dataDetails || []);
  const p = PROJECTS.find(x => x.id === mocId) || {};
  const d = DETAILS.find(x => x.id === mocId) || {};

  const title =
    (p.name && (p.name[lang] || p.name.en || p.name.fr)) ||
    (d.title && (d.title[lang] || d.title.en || d.title.fr)) ||
    (mocId || '');
  h1.textContent = title;

  const descEl = document.getElementById('desc');
  if (descEl) {
    const desc =
      (d.description && (d.description[lang] || d.description.en || d.description.fr)) || '';
    descEl.textContent = desc;
  }
  if (window.innerWidth > 768) {
    requestAnimationFrame(() => syncTechnicImageHeights(140));
  }
}

// ======== FILTRE  ========

// Éléments
const filterBtn = document.getElementById("filter-btn");
const filterLabel = document.getElementById("filter-label");
const filterArrow = filterBtn?.querySelector(".arrow-down");
const filterMenu = document.getElementById("filter-options");

// Modale mobile
const filterfilterModal = document.getElementById("filter-modal");
const filterfilterList = document.getElementById("filter-list");
const closeFilterBtn = document.querySelector(".close-filter-modal");
const closeFilterLink = document.getElementById("close-filter-filter");
const clearfilterFilters = document.getElementById("clear-filters");

// Récupère les valeurs uniques de data-filter (triées A→Z)
function getfilterSources() {
  const isMinifigs = !!document.getElementById("figures-container");

  if (!isMinifigs) {
    // Cas MOC (inchangé)
    const cards = Array.from(document.querySelectorAll(".MOC-card[data-filter]"));
    const set = new Set(cards.map(c => (c.dataset.filter || "").trim()).filter(Boolean));
    const collator = new Intl.Collator(currentLang || "fr", { sensitivity: "base", numeric: true });
    return Array.from(set).sort((a, b) => collator.compare(a, b));
  }

  // Cas Minifigs : on lit le film localisé
  const lang = window.currentLang || "en";
  const cards = Array.from(document.querySelectorAll(".card-minifigs"));
  const getFilm = (card) =>
    lang === "fr"
      ? (card.dataset.filmFr || card.dataset.film || "").trim()
      : (card.dataset.filmEn || card.dataset.film || "").trim();

  const set = new Set(cards.map(getFilm).filter(Boolean));
  const collator = new Intl.Collator(lang, { sensitivity: "base", numeric: true });
  return Array.from(set).sort((a, b) => collator.compare(a, b));
}

// Construit un item checkbox : <label class="checkbox-item"><input type="checkbox"> <span>Nom</span></label>
// -> cliquer sur le texte coche/décoche automatiquement
function makeCheckbox(idBase, value) {
  const id = `${idBase}-${value.replace(/\W+/g, "_")}`;

  const label = document.createElement("label");
  label.className = "checkbox-item";
  label.setAttribute("data-value", value);

  const input = document.createElement("input");
  input.type = "checkbox";
  input.id = id;
  input.value = value;

  const txt = document.createElement("span");
  txt.textContent = value;

  label.appendChild(input);
  label.appendChild(txt);
  return label;
}

// Formate le libellé du bouton (toujours compact)
function formatfilterLabel(selected) {
  const allLabel = translations[currentLang]?.filter_all || "Tous";
  if (!selected || selected.length === 0) return allLabel;
  if (selected.length === 1) return selected[0];
  return `${selected[0]}, +${selected.length - 1}`;
}

function buildfilterFilterUI() {
  if (!filterMenu) return;
  filterMenu.innerHTML = "";
  if (filterfilterList) filterfilterList.innerHTML = "";

  const values = getfilterSources();

  // Items Desktop (dropdown)
  values.forEach(v => {
    const cb = makeCheckbox("filter-dd", v);
    filterMenu.appendChild(cb);
  });

  // ---- Boutons d'action en bas du dropdown ----
  const actions = document.createElement("div");
  actions.className = "dropdown-actions";

  const btnApply = document.createElement("a");
  btnApply.href = "#";
  btnApply.className = "btn-apply";
  btnApply.textContent = (translations?.[currentLang]?.action_apply_filters) || "Appliquer les filtres";

  const btnReset = document.createElement("a");
  btnReset.href = "#";
  btnReset.className = "btn-reset";
  btnReset.textContent = (translations?.[currentLang]?.action_reset_filters) || "Réinitialiser les filtres";

  actions.appendChild(btnReset);
  actions.appendChild(btnApply);
  filterMenu.appendChild(actions);

  // Items Mobile (modale)
  if (filterfilterList) {
    values.forEach(v => filterfilterList.appendChild(makeCheckbox("filter-modal", v)));
  }

  // Écouteurs communs
  filterMenu.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.addEventListener("change", applyfilterFilter);
  });
  filterfilterList?.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.addEventListener("change", (e) => {
      // synchronise avec le dropdown
      const twin = [...filterMenu.querySelectorAll('input[type="checkbox"]')].find(i => i.value === e.target.value);
      if (twin) twin.checked = e.target.checked;
      applyfilterFilter();
    });
  });

  // Écouteurs actions dropdown
  btnApply.addEventListener("click", (e) => {
    e.preventDefault();
    applyfilterFilter();                    // au cas où
    filterMenu?.classList.remove("show");   // ferme le dropdown
    if (filterArrow) filterArrow.classList.remove("rotate");
  });

  btnReset.addEventListener("click", (e) => {
    e.preventDefault();
    clearAllfilter();                        // réinitialise
  });
}

function applyfilterFilter() {
  const selected = [...document.querySelectorAll('#filter-options input[type="checkbox"]:checked')].map(i => i.value);
  const isMinifigs = !!document.getElementById("figures-container");

  if (!isMinifigs) {
    // MOC (inchangé)
    const cards = document.querySelectorAll(".MOC-card[data-filter]");
    cards.forEach(card => {
      const show = selected.length === 0 || selected.includes(card.dataset.filter);
      card.style.display = show ? "" : "none";
    });
  } else {
    // Minifigs
    const lang = window.currentLang || "en";
    const cards = document.querySelectorAll(".card-minifigs");
    cards.forEach(card => {
      const film = (lang === "fr")
        ? (card.dataset.filmFr || card.dataset.film || "")
        : (card.dataset.filmEn || card.dataset.film || "");
      const show = selected.length === 0 || selected.includes(film);
      card.style.display = show ? "" : "none";
    });
  }

  const prefix = translations[currentLang]?.filter_by_prefix || "Filtrer par : ";
  if (filterLabel) {
    filterLabel.textContent = prefix + formatfilterLabel(selected);
  }
}

function clearAllfilter() {
  document.querySelectorAll('#filter-options input[type="checkbox"]').forEach(cb => cb.checked = false);
  filterfilterList?.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
  applyfilterFilter();
}

// Ouvre/ferme (desktop) ou modale (mobile ≤768px)
filterBtn?.addEventListener("click", (e) => {
  e.stopPropagation();

  if (window.innerWidth <= 768 && filterfilterModal) {
    filterfilterModal.style.display = "flex";
    document.body.style.overflow = "hidden";
    applyfilterFilter(); // met à jour le libellé compact tout de suite
    return;
  }

  const wasOpen = filterMenu?.classList.contains("show");
  closeAllDropdowns(); // ferme tous les autres dropdowns (global)
  if (!wasOpen) {
    filterMenu?.classList.add("show");
    filterArrow?.classList.add("rotate");
  }
  applyfilterFilter(); // libellé compact même ouvert
});
// Ferme si clic ailleurs
window.addEventListener("click", (e) => {
  const infilter = e.target.closest("#filter-btn") || e.target.closest("#filter-options");
  if (!infilter) {
    filterMenu?.classList.remove("show");
    if (filterArrow) filterArrow.classList.remove("rotate");
    applyfilterFilter(); // garde le compact
  }
});

// Modale mobile
function closeFilter() {
  if (!filterfilterModal) return;
  filterfilterModal.style.display = "none";
  document.body.style.overflow = "";
  applyfilterFilter(); // garde le compact
}
closeFilterBtn?.addEventListener("click", closeFilter);
closeFilterLink?.addEventListener("click", (e) => { e.preventDefault(); closeFilter(); });
clearfilterFilters?.addEventListener("click", (e) => {
  e.preventDefault();
  clearAllfilter();
});

/* --- Surcharge window.setLanguage pour filtre Marvel (existant) --- */
const _setLanguage = window.setLanguage;
window.setLanguage = function (lang) {
  _setLanguage?.(lang);         // garde l’existant (qui sauvegarde déjà la langue)
  buildfilterFilterUI();
  applyfilterFilter();
}; /* ← c’est la surcouche d’origine ; elle reste compatible avec la persistance :contentReference[oaicite:2]{index=2} */

const applyfilterFiltersLink = document.getElementById("apply-filters");
const resetfilterFiltersLink = document.getElementById("reset-filters");

applyfilterFiltersLink?.addEventListener("click", (e) => {
  e.preventDefault();
  applyfilterFilter();           // applique (déjà fait au fil de l’eau)
  closeFilter();           // et ferme la modale
});

resetfilterFiltersLink?.addEventListener("click", (e) => {
  e.preventDefault();
  clearAllfilter();              // réinitialise
});

// Enregistrer le service worker pour la PWA (GitHub Pages)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .catch(console.error);
  });
}


/* === EXPO PAGE (Conventions) === */
(function () {
  if (!document.getElementById('map')) return; // sécurité si pas sur la page

  // 1) Map
  const DEFAULT_CENTER = [50.366669, 3.01667];
  const map = L.map('map', { scrollWheelZoom: true }).setView(DEFAULT_CENTER, 8);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // 2) Marqueurs + cards
  const markers = new Map();
  function addExpoMarker(e) {
    const m = L.marker([e.lat, e.lon]).addTo(map).bindPopup(
      `<b>${e.city}</b><br>${e.date}`
    );
    m.on('click', () => highlightCard(e.id));
    markers.set(e.id, m);
  }
  const cardsEl = document.getElementById('cards');
  function cardTemplate(e) {
    const el = document.createElement('article');
    // Card "expo" (affiche portrait) 
    el.className = 'card expo-card';
    el.innerHTML = `
    <div class="poster"><img src="${e.poster}" alt="Affiche ${e.city}"></div>
    <div class="meta">
      <h3>${e.city}</h3>
      <div class="sub">${e.date}</div>
<div class="actions">
  <button class="btn" data-goto="${e.id}" data-key="expo_view_map"></button>
<a class="btn" href="detail-conventions.html?id=${encodeURIComponent(e.id)}" data-key="expo_view_page"></a>
</div>
    </div>`;
    return el;
  }
  function renderCards(list) {
    cardsEl.innerHTML = '';
    list.forEach(e => cardsEl.appendChild(cardTemplate(e)));
    cardsEl.querySelectorAll('[data-goto]').forEach(btn => {
      btn.addEventListener('click', ev => {
        const id = ev.currentTarget.getAttribute('data-goto');
        gotoOnMap(id);
      });
    });
  }
  function gotoOnMap(id) {
    const e = (window.EXPO || []).find(x => x.id === id); if (!e) return;
    map.flyTo([e.lat, e.lon], 11, { duration: .8 });
    const m = markers.get(id); if (m) { setTimeout(() => m.openPopup(), 850); }
    highlightCard(id);
  }
  function highlightCard(id) {
    cardsEl.querySelectorAll('.card').forEach(c => c.style.boxShadow = 'none');
    const idx = (window.EXPO || []).findIndex(x => x.id === id);
    if (idx >= 0) {
      const card = cardsEl.children[idx];
      card.style.boxShadow = 'inset 0 0 0 2px #F3BD99';

      // scroll centré dans le conteneur scrollable (la colonne de droite)
      const cardRect = card.getBoundingClientRect();
      const listRect = cardsEl.getBoundingClientRect();
      const offset = (cardRect.top - listRect.top) - (listRect.height / 2 - cardRect.height / 2);
      cardsEl.scrollBy({ top: offset, behavior: 'smooth' });
    }
  }

  // 3) Filtres (années + recherche)
  // 3) Filtres (années + villes + recherche)
  const EXPO = (window.EXPO || []).slice(); // copie
  EXPO.forEach(addExpoMarker);
  renderCards(EXPO);

  const q = document.getElementById('q');
  const doSearch = document.getElementById('doSearch');

  // --- états sélectionnés
  let selectedYears = new Set();
  let selectedCities = new Set();

  // --- utilitaires UI checkboxes
  function makeCheckbox(idBase, label) {
    const id = `${idBase}-${String(label).replace(/\W+/g, "_")}`;
    const wrap = document.createElement('label');
    wrap.className = 'checkbox-item';
    wrap.setAttribute('data-value', label);
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = id;
    input.value = label;
    const txt = document.createElement('span');
    txt.textContent = label;
    wrap.appendChild(input);
    wrap.appendChild(txt);
    return wrap;
  }
  function compactLabel(list, emptyText) {
    if (!list.length) return emptyText;
    if (list.length === 1) return list[0];
    return `${list[0]}, +${list.length - 1}`;
  }
  function syncLabel(el, prefix, values) {
    el.textContent = `${prefix}${compactLabel(values, 'Toutes')}`;
  }

  // --- sources uniques
  const years = [...new Set(EXPO.map(e => e.year))].sort((a, b) => b - a);
  const cities = [...new Set(EXPO.map(e => e.city))].sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));

  // --- éléments Années
  const yearBtn = document.getElementById('year-filter-btn');
  const yearArrow = yearBtn?.querySelector('.arrow-down');
  const yearMenu = document.getElementById('year-filter-options');
  const yearLabel = document.getElementById('year-filter-label');
  const yearModal = document.getElementById('year-filter-modal');
  const yearList = document.getElementById('year-filter-list');
  const yearApply = document.getElementById('year-apply');
  const yearReset = document.getElementById('year-reset');

  // --- éléments Villes
  const cityBtn = document.getElementById('city-filter-btn');
  const cityArrow = cityBtn?.querySelector('.arrow-down');
  const cityMenu = document.getElementById('city-filter-options');
  const cityLabel = document.getElementById('city-filter-label');
  const cityModal = document.getElementById('city-filter-modal');
  const cityList = document.getElementById('city-filter-list');
  const cityApply = document.getElementById('city-apply');
  const cityReset = document.getElementById('city-reset');

  // --- build dropdowns + modales
  function buildFilter(menuEl, listEl, values, idBase, onChange) {
    if (menuEl) {
      menuEl.innerHTML = '';
      values.forEach(v => {
        const cb = makeCheckbox(idBase, v);
        menuEl.appendChild(cb);
      });
      // actions sticky
      const actions = document.createElement('div');
      actions.className = 'dropdown-actions';
      const btnReset = Object.assign(document.createElement('a'), { href: '#', className: 'btn-reset', textContent: 'Réinitialiser' });
      const btnApply = Object.assign(document.createElement('a'), { href: '#', className: 'btn-apply', textContent: 'Appliquer' });
      actions.appendChild(btnReset); actions.appendChild(btnApply);
      menuEl.appendChild(actions);
      // listeners
      menuEl.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.addEventListener('change', onChange));
      btnApply.addEventListener('click', (e) => { e.preventDefault(); menuEl.classList.remove('show'); yearArrow?.classList.remove('rotate'); cityArrow?.classList.remove('rotate'); applyFilters(); });
      btnReset.addEventListener('click', (e) => { e.preventDefault(); menuEl.querySelectorAll('input[type="checkbox"]').forEach(i => i.checked = false); onChange(); });
    }
    if (listEl) {
      listEl.innerHTML = '';
      values.forEach(v => listEl.appendChild(makeCheckbox(`${idBase}-modal`, v)));
      listEl.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.addEventListener('change', onChange));
    }
  }

  // --- handlers mise à jour des sélections
  function updateSelectedFrom(menuEl, set, labelEl, prefix) {
    set.clear();
    menuEl?.querySelectorAll('input[type="checkbox"]:checked').forEach(i => set.add(i.value));
    labelEl && syncLabel(labelEl, prefix, [...set]);
  }
  function onYearChange() {
    updateSelectedFrom(yearMenu, selectedYears, yearLabel, 'Années : ');
    applyFilters(); // tri direct
  }
  function onCityChange() {
    updateSelectedFrom(cityMenu, selectedCities, cityLabel, 'Villes : ');
    applyFilters(); // tri direct
  }

  // --- construction
  buildFilter(yearMenu, yearList, years, 'year', onYearChange);
  buildFilter(cityMenu, cityList, cities, 'city', onCityChange);

  // --- open/close dropdowns + modales (mobile ≤768px)
  function toggleDropdown(btn, menu, arrow) {
    if (window.innerWidth <= 768 && (btn.id.includes('year') ? yearModal : cityModal)) {
      (btn.id.includes('year') ? yearModal : cityModal).style.display = 'flex';
      document.body.style.overflow = 'hidden';
      return;
    }
    menu?.classList.toggle('show');
    arrow?.classList.toggle('rotate', menu?.classList.contains('show'));
  }
  yearBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    const wasOpen = yearMenu?.classList.contains('show');
    closeAllDropdowns(); // ferme tout
    if (!wasOpen) {
      toggleDropdown(yearBtn, yearMenu, yearArrow);
    }
  });
  cityBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    const wasOpen = cityMenu?.classList.contains('show');
    closeAllDropdowns(); // ferme tout
    if (!wasOpen) {
      toggleDropdown(cityBtn, cityMenu, cityArrow);
    }
  });
  window.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown-tri')) {
      closeAllDropdowns();
    }
  });
  // modales mobile : appliquer / réinitialiser / fermer (×)
  function closeModal(modal) { modal.style.display = 'none'; document.body.style.overflow = ''; }
  yearApply?.addEventListener('click', (e) => {
    e.preventDefault(); // sync depuis la modale vers le dropdown
    yearMenu?.querySelectorAll('input[type="checkbox"]').forEach(i => {
      const twin = [...yearList.querySelectorAll('input')].find(j => j.value === i.value); if (twin) i.checked = twin.checked;
    });
    onYearChange(); closeModal(yearModal); applyFilters();
  });
  yearReset?.addEventListener('click', (e) => { e.preventDefault(); yearList?.querySelectorAll('input').forEach(i => i.checked = false); });
  cityApply?.addEventListener('click', (e) => {
    e.preventDefault();
    cityMenu?.querySelectorAll('input[type="checkbox"]').forEach(i => {
      const twin = [...cityList.querySelectorAll('input')].find(j => j.value === i.value); if (twin) i.checked = twin.checked;
    });
    onCityChange(); closeModal(cityModal); applyFilters();
  });
  cityReset?.addEventListener('click', (e) => { e.preventDefault(); cityList?.querySelectorAll('input').forEach(i => i.checked = false); });
  yearModal?.querySelector('.close-sort-modal')?.addEventListener('click', () => closeModal(yearModal));
  cityModal?.querySelector('.close-sort-modal')?.addEventListener('click', () => closeModal(cityModal));

  // --- recherche
  doSearch?.addEventListener('click', applyFilters);
  q?.addEventListener('keydown', (e) => { if (e.key === 'Enter') applyFilters(); });

  // --- filtrage principal
  function applyFilters() {
    const text = (q?.value || '').trim().toLowerCase();
    const yrs = [...selectedYears];
    const cts = [...selectedCities];

    const filtered = EXPO.filter(e => {
      const okYear = yrs.length ? yrs.includes(String(e.year)) || yrs.includes(e.year) : true;
      const okCity = cts.length ? cts.includes(e.city) : true;
      const okText = text ? (e.title?.toLowerCase().includes(text) || e.city.toLowerCase().includes(text)) : true;
      return okYear && okCity && okText;
    });

    renderCards(filtered);

    // maj marqueurs
    markers.forEach((m, id) => {
      const has = filtered.some(e => e.id === id);
      if (has) { m.addTo(map); } else { m.remove(); }
    });
  }

})();

function highlightCard(id) {
  cardsEl.querySelectorAll('.card').forEach(c => c.style.boxShadow = 'none');
  const idx = (window.EXPO || []).findIndex(x => x.id === id);
  if (idx >= 0) {
    const card = cardsEl.children[idx];
    card.style.boxShadow = '2px solid #F3BD99';

    if (window.innerWidth > 768) {
      // Desktop : comportement d’origine (scroll dans la colonne)
      const cardRect = card.getBoundingClientRect();
      const listRect = cardsEl.getBoundingClientRect();
      const offset = (cardRect.top - listRect.top) - (listRect.height / 2 - cardRect.height / 2);
      cardsEl.scrollBy({ top: offset, behavior: 'smooth' });
    } else {
      // Mobile : pas de scroll interne ; on fait défiler la page
      card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}


function resizeCardTitles() {
  document.querySelectorAll(".MOC-card h3 span:not(.date)").forEach(span => {

    // ✅ IMPORTANT : sur index (section-row), on ne réduit pas la taille de police,
    // sinon ça supprime le wrap et le padding ne se déclenche jamais.
    if (span.closest(".section-row")) return;

    let parentWidth = span.parentElement.offsetWidth - 20; // marge de sécurité
    let fontSize = 16; // taille max de base (en px)

    span.style.fontSize = fontSize + "px";

    while (span.scrollWidth > parentWidth && fontSize > 10) {
      fontSize--;
      span.style.fontSize = fontSize + "px";
    }
  });
}


(function () {
  const $ = (s) => document.querySelector(s);

  const params = new URLSearchParams(location.search);
  const technicId = params.get("id");

  const PROJECTS = (window.PROJECTS || window.project || []);
  const DETAILS = (window.dataDetails || []);

  const p = PROJECTS.find(x => x.id === technicId) || {};
  const d = DETAILS.find(x => x.id === technicId) || {};

  const rows = Array.isArray(d.rows) ? d.rows : [];
  const wrap = $("#technic-content");
  if (!wrap) return;

  // util: texte dans la langue (sans dépendre d'un curLang figé)
  const pickLang = (lang, obj) => {
    if (!obj) return "";
    if (typeof obj === "string") return obj;
    return obj[lang] || obj.en || obj.fr || "";
  };

  // On garde les références des éléments translatables, pour ne mettre à jour QUE les textes
  const nodes = {
    titleEl: $("#page-title"),
    titleSources: { projectName: p.name, detailTitle: d.title, fallback: technicId || "" },
    headings: [], // { el, src }
    texts: [],    // { el, src }
    captions: [], // { el, src }
    alts: []      // { img, src }
  };

  // --- RENDER INITIAL (une seule fois, sans logique de langue figée) ---
  if (!rows.length) {
    wrap.innerHTML = `<p style="opacity:.7">Aucun contenu pour cette technique.</p>`;
  } else {
    let currentP = null;
    let paragraphEl = null;
    let globalRowIndex = 0;

    rows.forEach((r) => {
      const pIndex = (typeof r.p === "number") ? r.p : 1;

      // Nouveau paragraphe si p change
      if (pIndex !== currentP) {
        currentP = pIndex;

        paragraphEl = document.createElement("section");
        paragraphEl.className = "technic-paragraph";

        // Heading (créé une seule fois)
        if (r.heading) {
          const h = document.createElement("h2");
          h.className = "technic-paragraph-title";
          paragraphEl.appendChild(h);
          nodes.headings.push({ el: h, src: r.heading });
        }

        wrap.appendChild(paragraphEl);
      }

      // Ligne (structure identique à ton existant)
      const row = document.createElement("div");
      row.className = "technic-row" + (globalRowIndex % 2 === 1 ? " reverse" : "");

      const textCol = document.createElement("div");
      textCol.className = "technic-text";

      if (r.text) {
        const pEl = document.createElement("p");
        textCol.appendChild(pEl);
        nodes.texts.push({ el: pEl, src: r.text });
      }

      const imgCol = document.createElement("div");
      imgCol.className = "technic-image";

      if (r.img) {
        const imgs = Array.isArray(r.img) ? r.img : [r.img];

        imgs.forEach((it) => {
          const src = (typeof it === "string") ? it : it?.src;
          if (!src) return;

          const img = document.createElement("img");
          img.src = src;
          img.loading = "lazy";
          imgCol.appendChild(img);
          img.addEventListener("load", () => syncTechnicImageHeights(140));


          // Alt (si tu veux un alt global r.alt)
          if (r.alt) nodes.alts.push({ img, src: r.alt });
        });

        // Caption (inchangé)
        if (r.caption) {
          const c = document.createElement("div");
          c.className = "technic-caption";
          imgCol.appendChild(c);
          nodes.captions.push({ el: c, src: r.caption });
        }
      }


      row.appendChild(textCol);
      row.appendChild(imgCol);
      paragraphEl.appendChild(row);

      globalRowIndex++;
    });
  }

  // --- UPDATE TEXT ONLY (aucun innerHTML = "", aucune recréation d'img) ---
  function updateTechnicTexts(lang) {
    const curLang =
      lang ||
      (typeof currentLang !== "undefined" ? currentLang : null) ||
      window.currentLang ||
      "fr";

    // Title
    const title =
      (nodes.titleSources.projectName && pickLang(curLang, nodes.titleSources.projectName)) ||
      (nodes.titleSources.detailTitle && pickLang(curLang, nodes.titleSources.detailTitle)) ||
      nodes.titleSources.fallback;

    if (nodes.titleEl) nodes.titleEl.textContent = title;

    // Headings
    nodes.headings.forEach(({ el, src }) => {
      const t = pickLang(curLang, src);
      // Si vide, on cache le heading sans détruire le DOM
      el.textContent = t;
      el.style.display = t ? "" : "none";
    });

    // Paragraph texts
    nodes.texts.forEach(({ el, src }) => {
      el.textContent = pickLang(curLang, src);
    });

    // Captions
    nodes.captions.forEach(({ el, src }) => {
      const t = pickLang(curLang, src);
      el.textContent = t;
      el.style.display = t ? "" : "none";
    });

    // Alt (ne change pas l'image, seulement l'attribut)
    nodes.alts.forEach(({ img, src }) => {
      img.alt = pickLang(curLang, src) || title;
    });

    requestAnimationFrame(() => syncTechnicImageHeights(140));

  }

  // 1) update initial
  updateTechnicTexts(
    (typeof currentLang !== "undefined" ? currentLang : null) ||
    window.currentLang ||
    "fr"

  );

  setupTechnicRowsAutoSync(140);

  // 2) hook public appelé par setLanguage(lang)
  window.updateTechnicDetailTexts = (lang) => updateTechnicTexts(lang);
})();

function syncTechnicImageHeights(minPx = 140) {
  const isMobile = window.innerWidth <= 768;

  // Sur mobile : on ne force PAS la hauteur, et on nettoie toute hauteur inline déjà posée
  if (isMobile) {
    document.querySelectorAll(".technic-row .technic-image").forEach(col => {
      col.style.height = ""; // important : annule les hauteurs fixées précédemment
    });
    return;
  }

  document.querySelectorAll(".technic-row").forEach(row => {
    const imgCol = row.querySelector(".technic-image");
    if (!imgCol) return;
    const text = row.querySelector(".technic-text");
    const imgs = imgCol.querySelectorAll("img");
    if (!text || imgs.length === 0) return;

    const h = Math.max(minPx, Math.ceil(text.getBoundingClientRect().height));
    imgCol.style.height = h + "px";
  });
}



function setupTechnicRowsAutoSync(minPx = 140) {
  const rows = document.querySelectorAll(".technic-row");
  if (!rows.length) return;

  const sync = () => syncTechnicImageHeights(minPx);

  // 1) Re-sync quand le texte change de hauteur (fonts, wrapping, etc.)
  const ro = new ResizeObserver(() => sync());
  rows.forEach(row => {
    const text = row.querySelector(".technic-text");
    if (text) ro.observe(text);
  });

  // 2) Re-sync après chargement fonts (important si font swap)
  if (document.fonts?.ready) {
    document.fonts.ready.then(sync).catch(() => { });
  }

  // 3) Re-sync quand les images finissent de décoder (par sécurité)
  rows.forEach(row => {
    row.querySelectorAll(".technic-image img").forEach(img => {
      if (img.complete) return;
      img.addEventListener("load", sync, { once: true });
    });
  });

  // 4) Cas navigateur qui restaure une page depuis le cache (bfcache)
  window.addEventListener("pageshow", sync);

  // Sync initial
  sync();
}

/* ========= SYNC HAUTEUR TITRES PAR SECTION-ROW ========= */
/* ========= SYNC TITRES : AJOUT PADDING UNIQUEMENT AUX TITRES 1-LIGNE ========= */
function syncSectionRowCardTitleHeights() {
  const rows = document.querySelectorAll(".section-row");
  if (!rows.length) return;

  rows.forEach(row => {
    const titleSpans = Array.from(
      row.querySelectorAll(".MOC-card h3 > span:not(.date)")
    );

    if (!titleSpans.length) return;

    // Reset (important si changement langue / resize)
    titleSpans.forEach(s => {
      s.style.paddingTop = "";
      s.style.paddingBottom = "";
    });

    // Mesure hauteur max de la row
    let maxH = 0;
    titleSpans.forEach(s => {
      const h = s.getBoundingClientRect().height;
      if (h > maxH) maxH = h;
    });

    // Si tout le monde a la même hauteur => personne ne wrap
    // donc on ne fait rien
    const hasWrappingTitle = titleSpans.some(
      s => s.getBoundingClientRect().height < maxH
    );

    if (!hasWrappingTitle) return;

    // BONUS: équivalent d’une "ligne fantôme" répartie (1/2 haut + 1/2 bas)
    const extra = 23;
    const paddingTop = Math.floor(extra / 2);
    const paddingBottom = Math.ceil(extra / 2);

    // Appliquer le padding UNIQUEMENT aux titres courts (1 ligne)
    titleSpans.forEach(s => {
      const h = s.getBoundingClientRect().height;

      // ceux qui sont déjà grands (2 lignes) -> on ne touche pas
      if (h >= maxH) return;

      // ceux qui sont plus courts -> on ajoute la ligne fantôme répartie
      s.style.paddingTop = `${paddingTop}px`;
      s.style.paddingBottom = `${paddingBottom}px`;
    });
  });
}

/* ========= SYNC TITRES PAR LIGNE (MOC-GRID) ========= */
/* Même logique que .section-row : si au moins un titre wrap sur une ligne,
   on ajoute un padding haut/bas aux titres 1-ligne de cette même rangée. */
function syncMOCGridCardTitleHeights() {
  const grids = document.querySelectorAll(".MOC-grid");
  if (!grids.length) return;

  grids.forEach(grid => {
    const cards = Array.from(grid.querySelectorAll(".MOC-card"));
    if (!cards.length) return;

    // Regrouper les cards par "ligne" visuelle (flex-wrap) via leur top
    // (tolérance pour éviter les micro-différences de sub-pixels)
    const rows = new Map();
    const tol = 2;

    cards.forEach(card => {
      const top = Math.round(card.getBoundingClientRect().top);

      // trouver une clé existante proche (±tol)
      let key = null;
      for (const k of rows.keys()) {
        if (Math.abs(k - top) <= tol) { key = k; break; }
      }
      if (key === null) key = top;

      if (!rows.has(key)) rows.set(key, []);
      rows.get(key).push(card);
    });

    // Pour chaque rangée, appliquer la même règle que sur index.html
    rows.forEach(rowCards => {
      const titleSpans = rowCards
        .map(c => c.querySelector(".MOC-card h3 > span:not(.date), h3 > span:not(.date)"))
        .filter(Boolean);

      if (!titleSpans.length) return;

      // Reset
      titleSpans.forEach(s => {
        s.style.paddingTop = "";
        s.style.paddingBottom = "";
      });

      // Mesure hauteur max dans la rangée
      let maxH = 0;
      titleSpans.forEach(s => {
        const h = s.getBoundingClientRect().height;
        if (h > maxH) maxH = h;
      });

      // S'il n'y a aucun wrap (tout pareil), on ne touche pas
      const hasWrappingTitle = titleSpans.some(
        s => s.getBoundingClientRect().height < maxH
      );
      if (!hasWrappingTitle) return;

      // "Ligne fantôme" répartie (comme section-row)
      const extra = 23;
      const paddingTop = Math.floor(extra / 2);
      const paddingBottom = Math.ceil(extra / 2);

      // Ajouter uniquement aux titres courts (1 ligne)
      titleSpans.forEach(s => {
        const h = s.getBoundingClientRect().height;
        if (h >= maxH) return;
        s.style.paddingTop = `${paddingTop}px`;
        s.style.paddingBottom = `${paddingBottom}px`;
      });
    });
  });
}


// Appelle les deux synchronisations de titres sans dupliquer la logique
function syncAllCardTitles() {
  syncSectionRowCardTitleHeights();
  syncMOCGridCardTitleHeights();
}

// --- Helper: relance le recalcul des tailles/paddings après injection dynamique de cartes ---
function runTitleSyncSoon() {
  // double rAF = attendre que le navigateur applique le layout
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (typeof resizeCardTitles === "function") resizeCardTitles();
      if (typeof syncAllCardTitles === "function") syncAllCardTitles();
    });
  });
}

// --- Patch: après génération de cartes (Generator.js), resynchroniser les titres
(function patchCardGeneratorForTitleSync() {
  const cg = window.CardGenerator;
  if (!cg || patchCardGeneratorForTitleSync._done) return;
  patchCardGeneratorForTitleSync._done = true;

  const wrap = (fnName) => {
    const prev = cg[fnName];
    if (typeof prev !== "function") return;
    cg[fnName] = function (...args) {
      const res = prev.apply(this, args);
      runTitleSyncSoon();
      return res;
    };
  };

  // Index.html utilise generateCards + generateMinifigs (et d'autres pages aussi)
  wrap("generateCards");
  wrap("generateMinifigs");
  wrap("generateInstructions");
  wrap("generateTechnics");
})();







// Observe les changements DOM qui ajoutent/retirent des cartes, pour resynchroniser
// après génération (Generator.js), tri, filtre, etc.
function setupTitleSyncObservers() {
  // évite doublons
  if (setupTitleSyncObservers._installed) return;
  setupTitleSyncObservers._installed = true;

  let t = null;
  const schedule = () => {
    clearTimeout(t);
    t = setTimeout(() => {
      // 1) ajuste la taille de police, 2) sync paddings
      resizeCardTitles();
      syncAllCardTitles();
    }, 60);
  };

  const mo = new MutationObserver((mutations) => {
    for (const m of mutations) {
      // Si des nodes ajoutés contiennent des cartes, on resync
      if (m.addedNodes && m.addedNodes.length) {
        for (const n of m.addedNodes) {
          if (n.nodeType !== 1) continue;
          const el = /** @type {Element} */ (n);
          if (el.classList?.contains("MOC-card") || el.querySelector?.(".MOC-card")) {
            schedule();
            return;
          }
        }
      }
      // si on enlève des cartes (filtre/tri), resync aussi
      if (m.removedNodes && m.removedNodes.length) {
        schedule();
        return;
      }
    }
  });

  mo.observe(document.body, { childList: true, subtree: true });

  // Si les fonts se chargent après coup, on resync
  if (document.fonts?.ready) {
    document.fonts.ready.then(() => schedule()).catch(() => { });
  }
}
// ======== Synchronisations globales (load + resize) ========
window.addEventListener("load", () => {
  // Stabilise la typo avant de mesurer les hauteurs
  resizeCardTitles();
  // Synchronise titres (section-row + MOC-grid) quand le layout est final
  requestAnimationFrame(syncAllCardTitles);
  // Technique detail (si présent)
  syncTechnicImageHeights(140);
});

let _globalResizeTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(_globalResizeTimer);
  _globalResizeTimer = setTimeout(() => {
    syncTechnicImageHeights(140);
    resizeCardTitles();
    requestAnimationFrame(syncAllCardTitles);
  }, 120);
});


// Dernière passe quand tout est chargé (images/fonts) : utile pour index.html (cartes en sections)
window.addEventListener("load", () => {
  try { runTitleSyncSoon(); } catch (e) { }
});
