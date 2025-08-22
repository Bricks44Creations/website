document.addEventListener('DOMContentLoaded', function () {
  const burgerBtn = document.getElementById('burger-btn');
  const sidebar = document.getElementById('mobile-sidebar');
  const closeBtn = document.getElementById('close-sidebar');
  const overlay = document.getElementById('overlay');

  function openSidebar() {
    sidebar.classList.remove('hidden');
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    sidebar.classList.add('hidden');
    overlay.classList.add('hidden');
    document.body.style.overflow = '';
  }

  burgerBtn?.addEventListener('click', openSidebar);
  closeBtn?.addEventListener('click', closeSidebar);
  overlay?.addEventListener('click', closeSidebar);

  document.querySelectorAll('.submenu-toggle').forEach(button => {
    button.addEventListener('click', () => {
      const submenu = button.nextElementSibling;
      const isExpanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', !isExpanded);
      submenu.style.display = isExpanded ? 'none' : 'flex';
    });
  });
});

// --- TRI PORTFOLIO ---
const sortBtn = document.getElementById("sort-btn");
const sortLabel = document.getElementById("sort-label");
const sortArrow = sortBtn?.querySelector(".arrow-down");
const sortOptions = document.getElementById("sort-options");

sortBtn?.addEventListener("click", (e) => {
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
  sortPortfolio(criteria);

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

function sortPortfolio(criteria) {
  const grid = document.querySelector(".portfolio-grid");
  if (!grid) return;

  if (criteria) currentSortCriteria = criteria;

  const items = Array.from(grid.querySelectorAll(".portfolio-card"));
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

document.addEventListener("DOMContentLoaded", () => {
  const sortBtn = document.getElementById("sort-btn");
  const sortModal = document.getElementById("sort-modal");
  const closeSortModal = document.querySelector(".close-sort-modal");

  // Ouvrir la modale sur mobile
  sortBtn?.addEventListener("click", (e) => {
    if (window.innerWidth <= 768) {
      e.preventDefault();
      sortModal.style.display = "flex";
    }
  });

  // Fermer toutes les modales avec les boutons ×
  document.querySelectorAll(".close-sort-modal").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const modal = e.target.closest(".sort-modal");
      if (modal) modal.style.display = "none";
      document.body.style.overflow = ""; // pour réactiver le scroll
    });
  });

  // Fermer si clic à l’extérieur du contenu
  sortModal?.addEventListener("click", (e) => {
    if (e.target === sortModal) {
      sortModal.style.display = "none";
    }
  });
});



const translations = {
  en: {
    current_language: "English",
    portfolio: "Portfolio",
    portfolio_city: "City",
    portfolio_jp: "Jurassic Park",
    portfolio_marvel: "Marvel",
    portfolio_medieval: "Medieval",
    portfolio_ww: "Wizarding World",
    portfolio_others: "Others",
    portfolio_vignettes: "Vignettes",
    instructions: "Instructions",
    tips: "Tips",
    minifigs: "Minifigs",
    conventions: "Conventions",
    languages: "Languages",
    convention_bousies: "Bousies",
    convention_escaudoeuvres: "Escaudoeuvres",
    convention_divion: "Divion",
    quick_links: "Quick links",
    social_contacts: "Social | Contacts",
    youtube: "YouTube",
    instagram: "Instagram",
    tiktok: "TikTok",
    email: "Email",
    more_from_me: "More from me",
    who_am_i: "Who am I?",
    op_city: "City",
    op_jp: "Jurassic Park",
    op_filter: "filter",
    op_medieval: "Medieval",
    op_ww: "Wizarding World",
    op_others: "Others",
    op_vignettes: "Vignettes",
    search: "Search",
    search_placeholder: "Type to search...",
    filter: "Filter",
    sort_by: "Sort by",
    sort_label_prefix: "Sort by: ",
    sort_name_asc: "Name A-Z",
    sort_name_desc: "Name Z-A",
    sort_date_desc: "Date (newest → oldest)",
    sort_date_asc: "Date (oldest → newest)",
    sort_relevance: "Relevance",
    filter_by_prefix: "Filter by: ",
    filter_all_label: "Filter by: All",
    action_apply_filters: "Apply filters",
    action_reset_filters: "Reset filters",
    filter_all: "All",
    action_clear_all: "Clear all",
    action_close: "Close",
  },

  fr: {
    current_language: "Français",
    portfolio: "Portfolio",
    portfolio_city: "Ville",
    portfolio_jp: "Jurassic Park",
    portfolio_marvel: "Marvel",
    portfolio_medieval: "Médiéval",
    portfolio_ww: "Monde des sorciers",
    portfolio_others: "Autres",
    portfolio_vignettes: "Vignettes",
    instructions: "Instructions",
    tips: "Astuces",
    minifigs: "Minifigurines",
    languages: "Langues",
    conventions: "Expositions",
    convention_bousies: "Bousies",
    convention_escaudoeuvres: "Escaudoeuvres",
    convention_divion: "Divion",
    quick_links: "Liens rapides",
    social_contacts: "Réseaux sociaux | Contacts",
    youtube: "YouTube",
    instagram: "Instagram",
    tiktok: "TikTok",
    email: "Email",
    more_from_me: "En savoir plus sur moi",
    who_am_i: "Qui suis-je ?",
    op_city: "Ville",
    op_jp: "Jurassic Park",
    op_filter: "filter",
    op_medieval: "Médiéval",
    op_ww: "Monde des sorciers",
    op_others: "Autres",
    op_vignettes: "Vignettes",
    search: "Rechercher",
    search_placeholder: "Tapez pour rechercher...",
    filter: "Filtrer",
    sort_by: "Trier par",
    sort_label_prefix: "Trier par : ",
    sort_name_asc: "Nom A-Z",
    sort_name_desc: "Nom Z-A",
    sort_date_desc: "Date (récent → ancien)",
    sort_date_asc: "Date (ancien → récent)",
    sort_relevance: "Pertinence",
    filter_by_prefix: "Filtrer par : ",
    filter_all_label: "Filtrer par : Tous",
    filter_all: "Tous",
    action_clear_all: "Effacer tout",
    action_close: "Fermer",
    action_apply_filters: "Appliquer les filtres",
    action_reset_filters: "Réinitialiser les filtres",
  }

};

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
      el.innerHTML = translations[currentLang][key];
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
  document.querySelectorAll(".portfolio-card").forEach(card => {
    const translated = getTranslatedName(card);
    if (translated) card.dataset.name = translated;
  });

  // Ré-appliquer le tri courant pour refléter la langue choisie
  sortPortfolio();

  // --- AJOUT : persister la langue
  saveLang(lang);
} /* ← c’est bien cette fonction que tu avais déjà, enrichie pour sauver la langue :contentReference[oaicite:0]{index=0} */

/* ====== Initialisation langue : charger localStorage (ajout) ====== */
document.addEventListener("DOMContentLoaded", () => {
  // Gestion clic sur options langue (desktop + mobile)
  document.querySelectorAll(".lang-option").forEach(option => {
    option.addEventListener("click", (e) => {
      e.preventDefault();
      const lang = e.target.getAttribute("data-lang");
      setLanguage(lang);
    });
  });

  // === AJOUT : définir la langue depuis localStorage si dispo
  const saved = loadLang();
  if (saved) currentLang = saved;

  // Définir langue par défaut (ou sauvegardée)
  setLanguage(currentLang);
}); /* ← ce bloc existait déjà, on y ajoute juste la lecture du stockage :contentReference[oaicite:1]{index=1} */


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
  const cards = Array.from(document.querySelectorAll(".portfolio-card[data-filter]"));
  const set = new Set(cards.map(c => (c.dataset.filter || "").trim()).filter(Boolean));
  const collator = new Intl.Collator(currentLang || "fr", { sensitivity: "base", numeric: true });
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
  const cards = document.querySelectorAll(".portfolio-card[data-filter]");

  cards.forEach(card => {
    const show = selected.length === 0 || selected.includes(card.dataset.filter);
    card.style.display = show ? "" : "none";
  });

  const prefix = translations[currentLang]?.filter_by_prefix || "Filtrer par : ";
  if (filterLabel) {
    filterLabel.textContent = prefix + formatfilterLabel(selected); // toujours compact
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

  filterMenu?.classList.toggle("show");
  if (filterArrow) filterArrow.classList.toggle("rotate", filterMenu?.classList.contains("show"));
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

// Init + MAJ si changement de langue
document.addEventListener("DOMContentLoaded", () => {
  buildfilterFilterUI();
  applyfilterFilter();
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
