// ==============================
// INPUT FORMAT
// ==============================
function formatLfdNrInput(inputField) {
  inputField.addEventListener('input', function () {
    let value = inputField.value;
    if (/^\d{15}$/.test(value)) {
      let trimmed = value.replace(/^0+/, '');
      inputField.value = trimmed.substring(0, 4);
    }
  });
}

// ==============================
// BUTTON STYLES
// ==============================
function applyButtonStyles(normal, hover, text) {
  if (normal) document.documentElement.style.setProperty('--button-color', normal);
  if (hover) document.documentElement.style.setProperty('--button-hover', hover);
  if (text) document.documentElement.style.setProperty('--button-text', text);
}

// ==============================
// SETTINGS TOGGLE
// ==============================
function toggleSettings() {
  const s = document.getElementById("settings-overlay");
  if (s) s.classList.toggle("show");
}

// ==============================
// GLOBAL CLICK HANDLER (EINMAL!)
// ==============================
document.addEventListener('click', function (event) {

  const settings = document.getElementById("settings-overlay");
  const settingsBtn = document.querySelector(".bottom-left-info button");

  const readme = document.getElementById('readme-popup');
  const version = document.querySelector('.version.clickable');

  const overlay = document.getElementById('overlay');
  const overlayBtn = document.querySelector('.bottom-right-info button');

  const anschluss = document.getElementById('anschlussplaene-overlay');
  const dichtung = document.getElementById('dichtungswechsel-overlay');

  if (settings && settings.classList.contains("show") &&
    !settings.contains(event.target) &&
    settingsBtn && !settingsBtn.contains(event.target)) {
    settings.classList.remove("show");
  }

  if (readme && readme.style.display === 'block' &&
    !readme.contains(event.target) &&
    version && !version.contains(event.target)) {
    readme.style.display = 'none';
  }

  if (overlay && overlay.classList.contains('show') &&
    !overlay.contains(event.target) &&
    overlayBtn && !overlayBtn.contains(event.target)) {
    toggleOverlay();
  }

  if (anschluss && anschluss.classList.contains('show') &&
    !anschluss.contains(event.target)) {
    toggleAnschlussplaeneOverlay(false);
  }

  if (dichtung && dichtung.classList.contains('show') &&
    !dichtung.contains(event.target)) {
    closeDichtungswechselOverlay();
  }
});

// ==============================
// INIT
// ==============================
document.addEventListener("DOMContentLoaded", () => {

  initStyles();
  initInputs();
  loadProfiles();
  initUI();
  initDichtungen();

});

// ==============================
// STYLES INIT
// ==============================
function initStyles() {
  const normal = localStorage.getItem("buttonColor") || "#9b9b9b";
  const hover = localStorage.getItem("buttonHoverColor") || "#696969";
  const text = localStorage.getItem("buttonTextColor") || "#ffffff";

  const btn = document.getElementById("btnColorPicker");
  const hov = document.getElementById("btnHoverColorPicker");
  const txt = document.getElementById("btnTextColorPicker");

  if (!btn || !hov || !txt) return;

  btn.value = normal;
  hov.value = hover;
  txt.value = text;

  applyButtonStyles(normal, hover, text);

  [btn, hov, txt].forEach(el => {
    el.addEventListener("input", () => {
      localStorage.setItem("buttonColor", btn.value);
      localStorage.setItem("buttonHoverColor", hov.value);
      localStorage.setItem("buttonTextColor", txt.value);
      applyButtonStyles(btn.value, hov.value, txt.value);
    });
  });

  const reset = document.getElementById("resetDefaultsBtn");
  if (reset) {
    reset.addEventListener("click", () => {
      localStorage.clear();
      location.reload();
    });
  }
}

// ==============================
// INPUT INIT
// ==============================
function initInputs() {
  const mobileInput = document.getElementById('mobileInputField');
  const desktopInput = document.getElementById('desktopInputField');
  if (mobileInput) formatLfdNrInput(mobileInput);
  if (desktopInput) formatLfdNrInput(desktopInput);
}

// ==============================
// FETCH HELPER
// ==============================
async function fetchJsonMitFallback(u1, u2) {
  try {
    let r = await fetch(u1);
    if (!r.ok) r = await fetch(u2);
    if (!r.ok) throw new Error("Nicht gefunden");
    return await r.json();
  } catch (e) {
    console.error(e);
    throw e;
  }
}

// ==============================
// PROFILE LOGIK
// ==============================
let profiles = {};

async function loadProfiles() {
  try {
    profiles = await fetchJsonMitFallback(
      `https://bichfl.github.io/Auftragsdokumente/profile.json?t=${Date.now()}`,
      `https://bichfl.github.io/Auftragsdokumente/profile.JSON?t=${Date.now()}`
    );
    populateProfileSelectors();
  } catch (e) {
    alert("Profile konnten nicht geladen werden.");
  }
}

function populateProfileSelectors() {
  ['mobileProfileSelector', 'desktopProfileSelector'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;

    sel.innerHTML = '';

    Object.entries(profiles).forEach(([key, prof]) => {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = prof.displayName;
      sel.appendChild(opt);
    });
  });
}

// ==============================
// UI INIT
// ==============================
function initUI() {
  if (istMobil()) {
    document.body.classList.add('mobile');
  } else {
    document.body.classList.add('desktop');
  }
}

// ==============================
// MOBILE DETECTION
// ==============================
function istMobil() {
  return window.innerWidth <= 768;
}

// ==============================
// OVERLAY
// ==============================
function toggleOverlay() {
  const o = document.getElementById('overlay');
  if (!o) return;

  if (!o.classList.contains('show')) {
    o.style.display = 'flex';
    o.classList.add('show');
  } else {
    o.classList.remove('show');
    o.style.display = 'none';
  }
}

// ==============================
// DICHTUNGEN (GEFIXT - NUR 1x!)
// ==============================
let dichtungen = {};

function initDichtungen() {
  const posInput = document.getElementById("pos");
  if (!posInput) return;

  loadGaskets();
}

async function loadGaskets() {
  try {
    dichtungen = await fetchJsonMitFallback(
      "https://bichfl.github.io/Auftragsdokumente/gaskets.JSON",
      "https://bichfl.github.io/Auftragsdokumente/gaskets.json"
    );
    populateSerieDropdown();
  } catch {
    alert("Fehler beim Laden der Dichtungen");
  }
}

function populateSerieDropdown() {
  const serieSelect = document.getElementById("serieSelect");
  if (!serieSelect) return;

  serieSelect.innerHTML = '<option value="">Serie wählen</option>';

  Object.keys(dichtungen).forEach(s => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    serieSelect.appendChild(opt);
  });
}

// ==============================
// MAIL
// ==============================
function senden() {
  const nr = getLaufendeNummer().trim();
  if (!nr) return alert("Nummer fehlt");

  window.open(
    `https://outlook.office365.com/mail/deeplink/compose?subject=${encodeURIComponent(nr)}`,
    "_blank"
  );
}

// ==============================
// HELPERS
// ==============================
function getLaufendeNummer() {
  const mi = document.getElementById('mobileInputField');
  if (mi && mi.offsetParent !== null) return mi.value;
  const di = document.getElementById('desktopInputField');
  return di ? di.value : "";
}