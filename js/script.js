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
  sortBtn.addEventListener("click", (e) => {
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
  sortModal.addEventListener("click", (e) => {
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
    //City//
    project_park_avenue: "Park Avenue, New York",

    //Jurassic park//
    project_McDonald_Restaurant: "McDonald's Restaurant",
    project_QQS_Restaurant: "QQS Restaurant",
    project_Gift_Shop: "Gift Shop",
    project_Aviary: "The Aviary",
    project_The_Mosasaurus_2: "The Mosasaurus (2)",
    project_Motorized_Monorail: "Motorized Monorail",
    project_The_Bowling: "The Bowling",
    project_Trex_enclosure: "T-rex enclosure",
    project_Subway_Restaurant: "Subway Restaurant",
    project_The_Coffee_Chain_Restaurant: "Coffee Chain Restaurant",
    project_Headquarter_Restaurant: "Headquarter & Restaurant",
    project_A_laboratory_in_the_jungle: "A laboratory in the jungle",
    project_Archaeological_excavations: "Archaeological excavations",

    //Marvel//
    project_Agatha_on_the_Witches_road: "Agatha on the Witches' road",
    project_Taweret_Boat: "Taweret's Boat",
    project_Endgame_final_battle: "Endgame final battle",
    project_Thor_VS_Surtur: "Thor VS Surtur",
    project_Steve_Rogers_transformation_scene: "Steve Rogers transformation",
    project_Loki_Mobius_in_Pompeii: "Loki & Mobius in Pompeii",
    project_Black_Widow_death_scene: "Black Widow death scene",
    project_Deadpool_3_opening_scene: "Deadpool 3 opening scene",
    project_Iron_man_2_boxing_ring: "Iron man 2 boxing ring",
    project_Hulk_VS_Leviathan: "Hulk VS Leviathan",
    project_Loki_God_of_stories: "Loki, God of stories",
    project_Shuri_meets_Killmonger: "Shuri meets Killmonger",
    project_Tomb_of_Alexander_the_Great: "Tomb of Alexander the Great",
    project_Loki_meets_Victor_Timely_2: "Loki meets Victor Timely (2)",
    project_Ouroboros_meets_Loki: "Ouroboros meets Loki",
    project_Citadel_of_He_Who_Remains: "Citadel of He Who Remains",
    project_GOTG3_Final_fight: "GOTG3 Final fight",
    project_Copying_human_identities: "Copying human identities",
    project_Loki_meets_Victor_Timely_1: "Loki meets Victor Timely (1)",
    project_Sanctum_Sanctorum: "Sanctum Sanctorum",
    project_Shang_chi_VS_Wenwu: "Shang-chi VS Wenwu",
    project_Iron_heart_reveal: "Iron heart reveal",
    project_Tony_in_the_snow: "Tony in the snow",
    project_Doctor_strange_meets_Mordo: "Doctor strange meets Mordo",
    project_Steve_1st_fight: "Steve 1st fight",
    project_Tony_discorvers_time_travel: "Tony discovers time travel",
    project_Morgan_Stark: "Morgan Stark",
    project_Red_Richards_turn_into_spaghetti: "Red Richards turn into spaghetti",
    project_The_Illuminati: "The Illuminati",
    project_Thor_with_GOTG: "Thor with GOTG",
    project_Strange_at_mount_Everest: "Strange at mount Everest",
    project_Spiderman_My_back_scene: "Spiderman My back scene",
    project_Tony_build_Mark_I: "Tony build Mark I",
    project_Spiderman_VS_Electro: "Spiderman VS Electro",
    project_JJJ: "J. Jonah Jameson",
    project_Eternals_opening_scene: "Eternals opening scene",
    project_Microscale_Asgard: "Microscale Asgard",
    project_Wandavision_ep2: "Wandavision ep2",
    project_Capture_of_Loki_by_TVA: "Capture of Loki by TVA",
    project_Loki_in_the_void: "Loki in the void",
    project_Iron_man_VS_Ivan_Vanko: "Iron man VS Ivan Vanko",
    project_Killmonger_death_scene: "Killmonger death scene",
    project_Thor_arrives_in_Wakanda: "Thor arrives in Wakanda",
    project_arc_reactor: "Arc reactor",
    project_TASM2_ending_scene: "TASM2 ending scene",
    project_Skrull_transformation: "Skrull transformation",
    project_Ancestral_plane: "Ancestral plane",
    project_Arnim_Zola: "Arnim Zola",

    //Medieval//
    project_Building_House: "Building House",

    //Wizarding World//
    project_Protego_Diabolica: "Protego Diabolica",

    //Others//
    project_Paris_2024_athletics_track: "Paris 2024 athletics track",
    project_Alpine_A523_Ferrari_SF23: "Alpine A523 & Ferrari SF23",
    project_Explorer_in_the_jungle: "Explorer in the jungle",
    project_Gladiators: "Gladiators",
    project_Percy_Jackson_and_the_Olympians: "Percy Jackson and the Olympians",
    project_Microscale_Hogwarts: "Microscale Hogwarts",
    project_A_pirates_fortness_under_attack: "A pirates fortness under attack",
    project_A_submerged_greek_temple: "A submerged greek temple",
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

    //City//
    project_park_avenue: "Park Avenue, New York",

    //Marvel//
    project_Agatha_on_the_Witches_road: "Agatha sur la route des sorcières",
    project_Taweret_Boat: "Le bateau de Taweret",
    project_Endgame_final_battle: "Bataille finale d'Endgame",
    project_Thor_VS_Surtur: "Thor VS Surtur",
    project_Steve_Rogers_transformation_scene: "Transformation de Steve Rogers ",
    project_Loki_Mobius_in_Pompeii: "Loki & Mobius à Pompeii",
    project_Black_Widow_death_scene: "La mort de Black Widow",
    project_Deadpool_3_opening_scene: "Deadpool 3, scène d'ouverture",
    project_Iron_man_2_boxing_ring: "Ring de boxe de Iron man 2",
    project_Hulk_VS_Leviathan: "Hulk VS Leviathan",
    project_Loki_God_of_stories: "Loki, Dieu des Histoires",
    project_Shuri_meets_Killmonger: "Shuri rencontre Killmonger",
    project_Tomb_of_Alexander_the_Great: "La tombe d'Alexandre le Grand",
    project_Loki_meets_Victor_Timely_2: "Loki rencontre Victor Timely (2)",
    project_Ouroboros_meets_Loki: "Ouroboros rencontre Loki",
    project_Citadel_of_He_Who_Remains: "La citadelle de Celui qui demeure",
    project_GOTG3_Final_fight: "Gardiens de la galaxie 3",
    project_Copying_human_identities: "Copier l'identité des humains",
    project_Loki_meets_Victor_Timely_1: "Loki rencontre Victor Timely (1)",
    project_Sanctum_Sanctorum: "Saint des Saints",
    project_Shang_chi_VS_Wenwu: "Shang-chi VS Wenwu",
    project_Iron_heart_reveal: "Reveal d'Iron heart",
    project_Tony_in_the_snow: "Tony dans la neige",
    project_Doctor_strange_meets_Mordo: "Doctor strange rencontre Mordo",
    project_Steve_1st_fight: "Steve 1er combat",
    project_Tony_discorvers_time_travel: "Tony découvre le voyage dans le temps",
    project_Morgan_Stark: "Morgan Stark",
    project_Red_Richards_turn_into_spaghetti: "Red Richards transformé en spaghetti",
    project_The_Illuminati: "Les Illuminati",
    project_Thor_with_GOTG: "Thor avec les gardiens",
    project_Strange_at_mount_Everest: "Strange au mont Everest",
    project_Spiderman_My_back_scene: "Les 3 spidermans",
    project_Tony_build_Mark_I: "Tony construit la Mark I",
    project_Spiderman_VS_Electro: "Spiderman VS Electro",
    project_JJJ: "J. Jonah Jameson",
    project_Eternals_opening_scene: "Eternals scène d'ouverture",
    project_Microscale_Asgard: "Asgard Miniature",
    project_Wandavision_ep2: "Wandavision ep2",
    project_Capture_of_Loki_by_TVA: "Capture de Loki par le TVA",
    project_Loki_in_the_void: "Loki dans le néant",
    project_Iron_man_VS_Ivan_Vanko: "Iron man VS Ivan Vanko",
    project_Killmonger_death_scene: "Mort de Killmonger",
    project_Thor_arrives_in_Wakanda: "Thor arrive au Wakanda",
    project_arc_reactor: "Réacteur ARC",
    project_TASM2_ending_scene: "Scène de fin de TASM2",
    project_Skrull_transformation: "Transformation des Skrull",
    project_Ancestral_plane: "Plan Ancestral",
    project_Arnim_Zola: "Arnim Zola",

    //Jurassic park//
    project_McDonald_Restaurant: "Restaurant McDonald's ",
    project_QQS_Restaurant: "Restaurant QQS",
    project_Gift_Shop: "Magasin de souvenirs",
    project_Aviary: "La volière",
    project_The_Mosasaurus_2: "Le Mosasaure (2)",
    project_Motorized_Monorail: "Monorail Motorisé",
    project_The_Bowling: "Le Bowling",
    project_Trex_enclosure: "Enclos du T-rex",
    project_Subway_Restaurant: "Restaurant Subway",
    project_The_Coffee_Chain_Restaurant: "Restaurant 'coffee chain'",
    project_Headquarter_Restaurant: "Quartier général & Restaurant",
    project_A_laboratory_in_the_jungle: "Un laboratoire dans la jungle",
    project_Archaeological_excavations: "Fouilles archéologiques",

    //Medieval//
    project_Building_House: "Maison en construction",

    //Wizarding World//
    project_Protego_Diabolica: "Protego Diabolica",

    //Others//
    project_Paris_2024_athletics_track: "Paris 2024 Piste athélique",
    project_Alpine_A523_Ferrari_SF23: "Alpine A523 & Ferrari SF23",
    project_Explorer_in_the_jungle: "Explorateur dans la jungle",
    project_Gladiators: "Gladiateurs",
    project_Percy_Jackson_and_the_Olympians: "Percy Jackson et les Olympiens",
    project_Microscale_Hogwarts: "Poudlard Miniature",
    project_A_pirates_fortness_under_attack: "Attaque d'une forteresse pirate",
    project_A_submerged_greek_temple: "Un temple grec submergé",
  }

};

let currentLang = "en";
let currentSortCriteria = "date-desc"; // mémorise le dernier tri choisi

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
}

document.addEventListener("DOMContentLoaded", () => {
  // Gestion clic sur options langue (desktop + mobile)
  document.querySelectorAll(".lang-option").forEach(option => {
    option.addEventListener("click", (e) => {
      e.preventDefault();
      const lang = e.target.getAttribute("data-lang");
      setLanguage(lang);
    });
  });

  // Définir langue par défaut
  setLanguage(currentLang);
});


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
filterfilterModal?.addEventListener("click", (e) => { if (e.target === filterfilterModal) closeFilter(); });
clearfilterFilters?.addEventListener("click", (e) => {
  e.preventDefault();
  clearAllfilter();
});

// Init + MAJ si changement de langue
document.addEventListener("DOMContentLoaded", () => {
  buildfilterFilterUI();
  applyfilterFilter();
});
const _setLanguage = window.setLanguage;
window.setLanguage = function (lang) {
  _setLanguage?.(lang);
  buildfilterFilterUI();
  applyfilterFilter();
};

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
    navigator.serviceWorker.register('./sw.js')
      .catch(console.error);
  });
}