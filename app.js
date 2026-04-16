	function formatLfdNrInput(inputField) {
	inputField.addEventListener('input', function () {
		let value = inputField.value;
		if (/^\d{15}$/.test(value)) {
			let trimmed = value.replace(/^0+/, '');
			inputField.value = trimmed.substring(0, 4);
			}
		});
	}
  
    function applyButtonStyles(normal, hover, text) {
      if (normal) document.documentElement.style.setProperty('--button-color', normal);
      if (hover)  document.documentElement.style.setProperty('--button-hover', hover);
      if (text)   document.documentElement.style.setProperty('--button-text', text);
    }

    function toggleSettings() {
      const s = document.getElementById("settings-overlay");
      s.classList.toggle("show");
    }

    // Klick außerhalb schließt das Overlay + Reload
    document.addEventListener("click", function(e) {
      const s = document.getElementById("settings-overlay");
      const btn = document.querySelector(".bottom-left-info button");
      if (s.classList.contains("show") && !s.contains(e.target) && !btn.contains(e.target)) {
        s.classList.remove("show");
        location.reload();
      }
    });

document.addEventListener("DOMContentLoaded", () => {
  const colorPickers = {
    btnColorPicker: "buttonColor",
    btnHoverColorPicker: "buttonHoverColor",
    btnTextColorPicker: "buttonTextColor"
  };

  // gespeicherte Werte laden oder Defaults
  const normal = localStorage.getItem("buttonColor") || "#9b9b9b";
  const hover  = localStorage.getItem("buttonHoverColor") || "#696969";
  const text   = localStorage.getItem("buttonTextColor") || "#ffffff";

  document.getElementById("btnColorPicker").value = normal;
  document.getElementById("btnHoverColorPicker").value = hover;
  document.getElementById("btnTextColorPicker").value = text;

  applyButtonStyles(normal, hover, text);

  // Änderungen speichern & anwenden
  Object.entries(colorPickers).forEach(([pickerId, storageKey]) => {
    const picker = document.getElementById(pickerId);
    picker.addEventListener("input", () => {
      const value = picker.value;
      localStorage.setItem(storageKey, value);

      const newNormal = document.getElementById("btnColorPicker").value;
      const newHover  = document.getElementById("btnHoverColorPicker").value;
      const newText   = document.getElementById("btnTextColorPicker").value;

      applyButtonStyles(newNormal, newHover, newText);
    });
  });

  // Reset
      document.getElementById("resetDefaultsBtn").addEventListener("click", () => {
        const defaults = {
          buttonColor: "#9b9b9b",
          buttonHoverColor: "#696969",
          buttonTextColor: "#ffffff"
        };
        Object.entries(defaults).forEach(([key, val]) => {
          localStorage.setItem(key, val);
        });
        document.getElementById("btnColorPicker").value = defaults.buttonColor;
        document.getElementById("btnHoverColorPicker").value = defaults.buttonHoverColor;
        document.getElementById("btnTextColorPicker").value = defaults.buttonTextColor;
        applyButtonStyles(defaults.buttonColor, defaults.buttonHoverColor, defaults.buttonTextColor);
      });
    });



	async function toggleReadmePopup() {
      const popup = document.getElementById('readme-popup');
	  popup.style.color = '#000';
      if (popup.style.display === 'block') {
        popup.style.display = 'none';
        return;
      }
      try {
        popup.innerHTML = '<h2>CHANGELOG</h2><div>Lade...</div>';
        popup.style.display = 'block';

        // Zeitstempel anhängen, damit der Browser nicht cached
        const url = 'https://bichfl.github.io/Auftragsdokumente/README.md?t=' + Date.now();

        const res = await fetch(url);
        if (!res.ok) throw new Error('Fehler beim Laden der README.md');
        const text = await res.text();

        // Inhalt einfügen (HTML-Tags entschärfen)
        popup.innerHTML = '<h2>CHANGELOG</h2><div>' + text.replace(/</g, "&lt;") + '</div>';
      } catch (err) {
        popup.innerHTML = '<h2>CHANGELOG</h2><div>Fehler beim Laden: ' + err.message + '</div>';
      }
    }

    // Klick außerhalb schließt das Popup
    document.addEventListener('click', function(event) {
      const popup = document.getElementById('readme-popup');
      const version = document.querySelector('.version.clickable');
      if (popup.style.display === 'block' && !popup.contains(event.target) && !version.contains(event.target)) {
        popup.style.display = 'none';
      }
    });
	
	async function fetchJsonMitFallback(u1, u2) {
      try {
        const r1 = await fetch(u1);
        if (r1.ok) return await r1.json();
        const r2 = await fetch(u2);
        if (r2.ok) return await r2.json();
        throw new Error('Nicht gefunden');
      } catch (err) {
        throw err;
      }
    }
	
    let profiles = {};
    async function loadProfiles() {
      try {
        profiles = await fetchJsonMitFallback(
          `https://bichfl.github.io/Auftragsdokumente/profile.json?t=${Date.now()}`,
          `https://bichfl.github.io/Auftragsdokumente/profile.JSON?t=${Date.now()}`
        );
        populateProfileSelectors();
        populateCustomProfileSettings();
        initUI();
      } catch (e) {
        console.error(e);
        alert('Profile konnten nicht geladen werden.');
      }
    }
	
    function populateProfileSelectors() {
  ['mobileProfileSelector', 'desktopProfileSelector'].forEach(id => {
    const sel = document.getElementById(id);
    sel.innerHTML = '';

    // Normale Profile
    Object.entries(profiles).forEach(([key, prof]) => {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = prof.displayName;
      sel.appendChild(opt);
    });

    // Benutzerdefiniertes Profil
    const opt = document.createElement('option');
    opt.value = 'custom';
    const savedName = localStorage.getItem('customProfileName') || 'Benutzerdefiniert';
    opt.textContent = savedName;
    sel.appendChild(opt);
  });

  // Name im Overlay setzen
  const input = document.getElementById('customProfileName');
  input.value = localStorage.getItem('customProfileName') || 'Benutzerdefiniert';
  input.addEventListener('input', () => {
    localStorage.setItem('customProfileName', input.value || 'Benutzerdefiniert');
    // Selektoren aktualisieren
    populateProfileSelectors();
  });
}
	function populateCustomProfileSettings() {
  const container = document.getElementById("customProfileSettings");
  container.innerHTML = '';

  const allButtons = new Set();
  Object.values(profiles).forEach(p => {
  if (Array.isArray(p.buttons)) {
    p.buttons.forEach(b => allButtons.add(b));
  }
  });

  // Prüfen ob key existiert. Nur beim ersten Mal initialisieren.
  const raw = localStorage.getItem("customProfileButtons");
  let saved;
  if (raw === null) {
    // Erstinitialisierung: alle Buttons in Default-Reihenfolge aktivieren
    saved = Array.from(allButtons);
    localStorage.setItem("customProfileButtons", JSON.stringify(saved));
  } else {
    try {
      saved = JSON.parse(raw);
      if (!Array.isArray(saved)) saved = [];
    } catch (e) {
      saved = [];
    }
  }

  // gespeicherte (aktivierte) Buttons in der Reihenfolge anzeigen
  saved.forEach(buttonName  => {
	if (buttonName  === "Fließfertigung") {
	  return;
	}
    const label = document.createElement("div");
    label.classList.add("draggable-item");
    label.setAttribute("draggable", "true");

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = buttonName ;
    cb.checked = true;
    cb.addEventListener("change", saveCustomProfile);

    label.appendChild(cb);
    label.append(" " + buttonName );

    label.addEventListener("dragstart", dragStart);
    label.addEventListener("dragover", dragOver);
    label.addEventListener("drop", dropItem);

    container.appendChild(label);
  });

  // alle übrigen (nicht aktiven) Buttons anhängen — ungeprüft
  Array.from(allButtons).forEach(buttonName  => {
	if (buttonName  === "Fließfertigung") {
	  return;
	}
    if (!saved.includes(buttonName )) {
      const label = document.createElement("div");
      label.classList.add("draggable-item");
      label.setAttribute("draggable", "true");

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.value = buttonName ;
      cb.checked = false;
      cb.addEventListener("change", saveCustomProfile);

      label.appendChild(cb);
      label.append(" " + buttonName );

      label.addEventListener("dragstart", dragStart);
      label.addEventListener("dragover", dragOver);
      label.addEventListener("drop", dropItem);

      container.appendChild(label);
    }
  });
}


    function saveCustomProfile() {
      const items = document.querySelectorAll("#customProfileSettings .draggable-item input[type=checkbox]");
      const selected = Array.from(items)
        .filter(cb => cb.checked)
        .map(cb => cb.value);

      localStorage.setItem("customProfileButtons", JSON.stringify(selected));
    }

    let draggedItem = null;

    function dragStart(e) {
      draggedItem = e.target;
      e.target.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
    }

    function dragOver(e) {
      e.preventDefault();
      const container = document.getElementById("customProfileSettings");
      const afterElement = getDragAfterElement(container, e.clientY);
      if (afterElement == null) {
        container.appendChild(draggedItem);
      } else {
        container.insertBefore(draggedItem, afterElement);
      }
    }

    function dropItem(e) {
      e.preventDefault();
      draggedItem.classList.remove("dragging");
      saveCustomProfile();
    }

    function getDragAfterElement(container, y) {
      const draggableElements = [...container.querySelectorAll(".draggable-item:not(.dragging)")];
      return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child };
        } else {
          return closest;
        }
      }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
	
    function initUI() {
		const mobileInput = document.getElementById('mobileInputField');
		const desktopInput = document.getElementById('desktopInputField');
		if (mobileInput) formatLfdNrInput(mobileInput);
		if (desktopInput) formatLfdNrInput(desktopInput);
      if (istMobil()) {
        document.body.classList.add('mobile');
        document.getElementById('mobile-layout').style.display = 'block';
        const sel = document.getElementById('mobileProfileSelector');
        sel.value = localStorage.getItem('selectedMobileProfile') || sel.options[0].value;
        loadMobileProfileButtons();
      } else {
        document.body.classList.add('desktop');
        document.getElementById('desktop-layout').style.display = 'block';
        const sel = document.getElementById('desktopProfileSelector');
        sel.value = localStorage.getItem('selectedDesktopProfile') || sel.options[0].value;
        loadDesktopProfileButtons();
      }
    }
    function loadProfileButtons(profileKey, inputId, containerId, isDesktop) {
  localStorage.setItem(isDesktop ? 'selectedDesktopProfile' : 'selectedMobileProfile', profileKey);
  const cont = document.getElementById(containerId);
  cont.innerHTML = '';

  let buttons = [];
  if (profileKey === "custom") {
    buttons = JSON.parse(localStorage.getItem("customProfileButtons") || "[]");
  } else {
    const prof = profiles[profileKey];
    if (!prof) return; // Sicherheit
    buttons = Array.isArray(prof.buttons) ? prof.buttons : [];
  }
	
  const allowedFliessfertigungProfiles = ["profile2","profile3","profile4"];
	
  buttons.forEach(name => {
	if (name === "Fließfertigung" && !allowedFliessfertigungProfiles.includes(profileKey)) {
      return;
	}
    const btn = document.createElement('button');
    btn.textContent = name;
    btn.onclick = () => {
	  const input = document.getElementById(inputId).value.trim();

	  if (name.trim().toLowerCase() === 'anschlusspläne') {
		toggleAnschlussplaeneOverlay(true);
		return;
	  }
	  if (name.trim().toLowerCase() === 'dichtungswechsel') {
		toggleDichtungswechselOverlay(true);
		return;
	  }
	  let url;
	  if (name === 'Fließfertigung') {
		url = getFliessfertigungUrl(profileKey);
	  } else if (name === 'FSF_Beschriftung') {
		url = `https://peneder.sharepoint.com/sites/FSF-AluAuftragsdokumente/Freigegebene%20Dokumente/${input}_FSF_Beschriftung.pdf`;
	  } else if (name === 'FSF_Vorfertigung Etiketten') {
		url = `https://peneder.sharepoint.com/sites/FSF-AluAuftragsdokumente/Freigegebene%20Dokumente/${input}_FSF_Vorfertigung Etiketten.pdf`;
	  } else {
		url = `https://peneder.sharepoint.com/:b:/r/sites/FSF-AluAuftragsdokumente/Freigegebene%20Dokumente/${input}_${name}.pdf?csf=1&web=1`;
	  }
	  if (url) window.open(url, '_blank');
	};
    cont.appendChild(btn);
  });
}

    function loadMobileProfileButtons() {
      loadProfileButtons(document.getElementById('mobileProfileSelector').value,
        'mobileInputField', 'mobileButtonContainer', false);
    }
    function loadDesktopProfileButtons() {
      loadProfileButtons(document.getElementById('desktopProfileSelector').value,
        'desktopInputField', 'desktopButtonContainer', true);
    }
    async function suchAnschlussplaene() {
      const nr = document.getElementById('anschlussSuche').value.trim();
      if (!nr) return alert('Bitte eine Artikelnummer eingeben.');
      const t = Date.now();
      try {
        const daten = await fetchJsonMitFallback(
          `https://bichfl.github.io/Auftragsdokumente/PIN-Belegung.json?t=${t}`,
          `https://bichfl.github.io/Auftragsdokumente/PIN-Belegung.JSON?t=${t}`
        );
        const ein = daten.find(d => d.ArtNR === nr);
        if (!ein) return alert('Artikelnummer nicht gefunden.');
        const pdfUrl = `https://peneder.sharepoint.com/:b:/r//sites/FSF-AluAuftragsdokumente/Freigegebene%20Dokumente/PIN-Belegung/${ein.Pfad}/${encodeURIComponent(ein.Dokument)}.pdf#zoom=500`;
        window.open(pdfUrl,'_blank');
      } catch(e){ alert(e.message); }
    }
    function toggleOverlay() {
      const o = document.getElementById('overlay');
      if (!o.classList.contains('show')) {
        populateOverlayButtons();
        o.style.display='flex';
        o.classList.add('show');
        o.classList.remove('hide');
      } else {
        o.classList.add('hide');
        o.classList.remove('show');
        setTimeout(()=>o.style.display='none',400);
      }
    }
    function populateOverlayButtons() {
      const con = document.querySelector('.overlay-buttons');
      con.innerHTML='';
      const isMob = document.body.classList.contains('mobile');
      const sel = document.getElementById(isMob ? 'mobileProfileSelector' : 'desktopProfileSelector');
      const profileKey = sel.value;
      let buttons = [];
      if (profileKey === "custom") {
        buttons = JSON.parse(localStorage.getItem("customProfileButtons") || "[]");
      } else {
        buttons = profiles[profileKey].buttons;
      }
	  const allowedFliessfertigungProfiles = ["profile2","profile3","profile4"];
      buttons.forEach(name => {
		if (name === "Fließfertigung" && !allowedFliessfertigungProfiles.includes(profileKey)) {
		  return;
		}
        const b = document.createElement('button');
        b.textContent = name;
        b.onclick = () => openAccessMail(name);
        con.appendChild(b);
      });
    }
    function openAccessMail(btnName) {
	  const nr = getLaufendeNummer();
	  const pos = document.getElementById('posInputField').value.trim();
	  const subj = encodeURIComponent('fehlende Dokumente zu ' + nr);
	  const body = encodeURIComponent(
		pos
		  ? `Zur laufenden Nummer "${nr}", Position "${pos}" fehlt folgendes Dokument:\n\n"${btnName}"\n\nBitte legt das Dokument ab.`
		  : `Zur laufenden Nummer "${nr}" fehlt folgendes Dokument:\n\n"${btnName}"\n\nBitte legt das Dokument ab.`
	  );
	  const url = `https://outlook.office365.com/mail/deeplink/compose?to=ok.alu@peneder.com&subject=${subj}&body=${body}`;
	  window.open(url, '_blank');
	}

    function getLaufendeNummer() {
      const mi = document.getElementById('mobileInputField');
      return mi.offsetParent !== null ? mi.value : document.getElementById('desktopInputField').value;
    }
    function istMobil() {
      const ua = navigator.userAgent;
      const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
      const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const small = window.innerWidth <= 768;
      return [mobileUA, touch, small].filter(Boolean).length >= 2;
    }
    function getFormattedDate() {
      const d = new Date();
      return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;
    }
    function getFliessfertigungUrl(profile) {
      const date = getFormattedDate();
      const base = 'https://peneder.sharepoint.com/:b:/r/sites/FSF-AluAuftragsdokumente/Freigegebene%20Dokumente/Fließfertigung/';
      switch(profile) {
        case 'profile2': return `${base}Lager/${date}.pdf?csf=1&web=1`;
        case 'profile3': return `${base}Stabbearbeitung/${date}.pdf?csf=1&web=1`;
        case 'profile4': return `${base}Stabbearbeitung/${date}.pdf?csf=1&web=1`;
        case 'profile5': return `${base}Türstabmontage/${date}.pdf?csf=1&web=1`;
        case 'profile6': return `${base}Verklebung/${date}.pdf?csf=1&web=1`;
        case 'profile7': return `${base}Zusammenbau/${date}.pdf?csf=1&web=1`;
        case 'profile8': return `${base}Verglasung/${date}.pdf?csf=1&web=1`;
        case 'profile9': return `${base}Sonder/${date}.pdf?csf=1&web=1`;
        default: return null;
      }
    }
    function toggleAnschlussplaeneOverlay(show) {
      const o = document.getElementById('anschlussplaene-overlay');
      if (show) { o.style.display='flex'; o.classList.add('show'); }
      else { o.classList.remove('show'); o.style.display='none'; }
    }
    function closeAnschlussplaeneOverlay() {
      toggleAnschlussplaeneOverlay(false);
    }
    document.addEventListener('click', event => {
      const o = document.getElementById('overlay'), btn = document.querySelector('.bottom-right-info button');
      if (o.classList.contains('show') && !o.contains(event.target) && !btn.contains(event.target)) toggleOverlay();
    });
    document.addEventListener('click', event => {
      const o = document.getElementById('anschlussplaene-overlay');
      const dBtn = Array.from(document.querySelectorAll('#desktopButtonContainer button')).find(b => b.textContent.trim() === 'Anschlusspläne');
      if (o.classList.contains('show') && !o.contains(event.target) && (!dBtn||!dBtn.contains(event.target))) toggleAnschlussplaeneOverlay(false);
    });

    document.addEventListener('DOMContentLoaded', loadProfiles);
	
	let changelogClickCount = 0;
  let clickTimeout;

  document.addEventListener("click", function(e) {
    if (e.target.closest("#readme-popup h2")) {
      changelogClickCount++;
      clearTimeout(clickTimeout);
      clickTimeout = setTimeout(() => { changelogClickCount = 0; }, 2000);

      if (changelogClickCount >= 8) {
        showEasterEgg();
        changelogClickCount = 0;
      }
    } else if (!e.target.closest("#readme-popup")) {
      changelogClickCount = 0;
    }
  });
  
  function toggleDichtungswechselOverlay(show) {
    const o = document.getElementById('dichtungswechsel-overlay');
	if (show) {
      o.style.display = 'flex';
      o.classList.add('show');
	} else {
      o.classList.remove('show');
      o.style.display = 'none';
	}
  }

  function closeDichtungswechselOverlay() {
	  const posInput = document.getElementById("pos");
	  const serieSelect = document.getElementById("serieSelect");
	  const daSelect = document.getElementById("daSelect");
	  const diSelect = document.getElementById("diSelect");
	  const eiSelect = document.getElementById("eiSelect");
	  posInput.value = "";
	  serieSelect.value = "";
	  serieSelect.disabled = true;
	  daSelect.innerHTML = '<option value="">Dichtung außen</option>';
	  daSelect.disabled = true;
	  diSelect.innerHTML = '<option value="">Dichtung innen</option>';
	  diSelect.disabled = true;
	  eiSelect.innerHTML = '<option value="">Ersatzdichtung innen</option>';
	  eiSelect.disabled = true;
	  toggleDichtungswechselOverlay(false);
	}
  
  document.addEventListener('click', event => {
    const o = document.getElementById('dichtungswechsel-overlay');
    const dBtn = Array.from(document.querySelectorAll('#desktopButtonContainer button'))
      .find(b => b.textContent.trim() === 'Dichtungswechsel');

    if (o.classList.contains('show') &&
       !o.contains(event.target) &&
       (!dBtn || !dBtn.contains(event.target))) {
      toggleDichtungswechselOverlay(false);
	}
	});

  function showEasterEgg() {
  const popup = document.getElementById('readme-popup');

  // Hintergrundfarbe merken
  const popupBackground = window.getComputedStyle(popup).backgroundColor;

  // Größe & Stil anpassen, Position bleibt
  popup.style.width = '800px';
  popup.style.height = 'auto';
  popup.style.maxWidth = 'none';

  // Spielfeld HTML einfügen
  popup.innerHTML = `
    <style>
      * { box-sizing: border-box; }

      #game {
        position: relative;
        width: 650px;
        height: 200px;
        border: 3px solid var(--button-color); /* optional: Rahmen auch grau */
        overflow: hidden;
        background: ${popupBackground};
        margin: 10px auto;
      }

      #player {
        position: absolute;
        width: 40px;
        height: 40px;
        background: var(--button-color); /* grau wie Buttons */
        bottom: 0;
        left: 50px;
        transition: bottom 0.3s, height 0.1s;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      #player .logo { width: 16px; height: 16px; }

      .obstacle {
        position: absolute;
        right: -30px;
        animation-name: moveLeft;
        animation-timing-function: linear;
        animation-fill-mode: forwards;
        background: var(--button-color); /* grau wie Buttons */
      }

      @keyframes moveLeft {
        from { right: -30px; }
        to { right: 100%; }
      }

      /* --- Wichtig: höhere Spezifität, damit globale Button-Regeln NICHT gewinnen --- */
      #readme-popup .controls {
        margin-top: 10px;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 12px;
        text-align: center;
        flex-wrap: nowrap;
      }

      #readme-popup .controls button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: auto !important;         /* globale width:100% überstimmen */
        padding: 20px 30px !important;  /* höher/breiter */
        font-size: 28px !important;     /* größere Pfeile */
        line-height: 1;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        background-color: var(--button-color);
        color: var(--button-text);
        transition: background-color 0.3s;
      }

      #readme-popup .controls button:hover {
        background-color: var(--button-hover);
      }

      #score {
        margin-top: 10px;
        font-size: 18px;
        text-align: center;
        color: black;
      }
    </style>

    <div id="game">
      <div id="player">
        <img src="https://www.peneder.com/assets/favicons/favicon-16x16.png" alt="Logo" class="logo">
      </div>
    </div>

    <div class="controls">
      <button onclick="jump()">↑</button>
      <button onclick="duck()">↓</button>
    </div>

    <div id="score">Punkte: 0</div>
  `;

  popup.style.display = 'block';

  // Spiellogik starten
  initGame();
}



function initGame() {
  const player = document.getElementById("player");
  const game = document.getElementById("game");
  const scoreDisplay = document.getElementById("score");

  let isJumping = false;
  let isDucking = false;
  let score = 0;

  window.jump = function() {
    if (isJumping || isDucking) return;
    isJumping = true;
    player.style.bottom = "100px";
    setTimeout(() => {
      player.style.bottom = "0";
      setTimeout(() => { isJumping = false; }, 300);
    }, 300);
  };

  window.duck = function() {
    if (isJumping || isDucking) return;
    isDucking = true;
    player.style.height = "20px";
    player.style.alignItems = "flex-end";
    setTimeout(() => {
      player.style.height = "40px";
      player.style.alignItems = "center";
      isDucking = false;
    }, 500);
  };

  function getSpeed() {
    const baseDuration = 3.0;
    const minDuration = 1.2;
    const speedUp = Math.min(score * 0.05, baseDuration - minDuration);
    return (baseDuration - speedUp).toFixed(2) + 's';
  }

  function spawnObstacle() {
    const obs = document.createElement("div");
    obs.classList.add("obstacle");

    const isHigh = Math.random() < 0.5;
    if (isHigh) {
      obs.style.height = "30px";
      obs.style.width = "30px";
      obs.style.bottom = "25px";
      obs.style.background = "var(--button-color)";
    } else {
      obs.style.height = "30px";
      obs.style.width = "20px";
      obs.style.bottom = "0";
      obs.style.background = "var(--button-color)";
    }

    obs.style.animationDuration = getSpeed();
    game.appendChild(obs);

    const obsInterval = setInterval(() => {
      const obsRect = obs.getBoundingClientRect();
      const playerRect = player.getBoundingClientRect();

      const verticalOverlap = playerRect.bottom > obsRect.top && playerRect.top < obsRect.bottom;
      const horizontalOverlap = obsRect.left < playerRect.right && obsRect.right > playerRect.left;

      if (horizontalOverlap && verticalOverlap) {
        alert("Game Over! Dein Punktestand: " + score);
        location.reload();
      }
    }, 20);

    obs.addEventListener("animationend", () => {
      clearInterval(obsInterval);
      obs.remove();
      score++;
      scoreDisplay.textContent = "Punkte: " + score;
    });
  }

  function startObstacleLoop() {
    const minDelay = 2000;
    const maxDelay = 3500;
    function loop() {
      spawnObstacle();
      const nextDelay = Math.random() * (maxDelay - minDelay) + minDelay;
      setTimeout(loop, nextDelay);
    }
    loop();
  }

  document.addEventListener("keydown", (e) => {
    if (e.code === "ArrowUp") jump();
    if (e.code === "ArrowDown") duck();
  });

  startObstacleLoop();
}

// ------------------------------
// DICHTUNGSWECHSEL LOGIK
// ------------------------------

let dichtungen = {};

async function loadGaskets() {
  const urlJSON = "https://bichfl.github.io/Auftragsdokumente/gaskets.JSON?t=" + Date.now();
  const urljson = "https://bichfl.github.io/Auftragsdokumente/gaskets.json?t=" + Date.now();

  try {
    let res = await fetch(urlJSON);
    if (!res.ok) res = await fetch(urljson);

    dichtungen = await res.json();
    populateSerieDropdown();
  } catch (e) {
    console.error(e);
    alert("Fehler beim Laden der Dichtungsdaten!");
  }
}

function populateSerieDropdown() {
  const serieSelect = document.getElementById("serieSelect");
  if (!serieSelect) return;

  serieSelect.innerHTML = '<option value="" selected>Serie wählen</option>';

  Object.keys(dichtungen).forEach(serie => {
    const opt = document.createElement("option");
    opt.value = serie;
    opt.textContent = serie;
    serieSelect.appendChild(opt);
  });
}

// Event Listener erst nach DOM laden
document.addEventListener("DOMContentLoaded", () => {

  const posInput = document.getElementById("pos");
  const serieSelect = document.getElementById("serieSelect");
  const daSelect = document.getElementById("daSelect");
  const diSelect = document.getElementById("diSelect");
  const eiSelect = document.getElementById("eiSelect");

  if (!posInput) return; // wichtig!

  loadGaskets();

  posInput.addEventListener("input", () => {
    const filled = posInput.value.trim() !== "";
    serieSelect.disabled = !filled;

    if (!filled) {
      serieSelect.value = "";
      daSelect.disabled = true;
      diSelect.disabled = true;
      eiSelect.disabled = true;
    }
  });

  serieSelect.addEventListener("change", () => {
    daSelect.innerHTML = '<option value="">Dichtung außen</option>';
    diSelect.innerHTML = '<option value="">Dichtung innen</option>';
    eiSelect.innerHTML = '<option value="">Ersatzdichtung innen</option>';

    daSelect.disabled = false;
    diSelect.disabled = true;
    eiSelect.disabled = true;

    const serie = serieSelect.value;
    if (!serie) return;

    Object.keys(dichtungen[serie]).forEach(da => {
      const opt = document.createElement("option");
      opt.value = da;
      opt.textContent = da;
      daSelect.appendChild(opt);
    });
  });

  daSelect.addEventListener("change", () => {
    diSelect.innerHTML = '<option value="">Dichtung innen</option>';
    eiSelect.innerHTML = '<option value="">Ersatzdichtung innen</option>';

    diSelect.disabled = false;
    eiSelect.disabled = true;

    const serie = serieSelect.value;
    const da = daSelect.value;

    Object.keys(dichtungen[serie][da]).forEach(di => {
      const opt = document.createElement("option");
      opt.value = di;
      opt.textContent = di;
      diSelect.appendChild(opt);
    });
  });

  diSelect.addEventListener("change", () => {
    eiSelect.innerHTML = '<option value="">Ersatzdichtung innen</option>';
    eiSelect.disabled = false;

    const serie = serieSelect.value;
    const da = daSelect.value;
    const di = diSelect.value;

    dichtungen[serie][da][di].forEach(ei => {
      const opt = document.createElement("option");
      opt.value = ei;
      opt.textContent = ei;
      eiSelect.appendChild(opt);
    });
  });

});

// Mail senden
function senden() {
  const nr = getLaufendeNummer();
  const pos = document.getElementById("pos").value;
  const di = document.getElementById("diSelect").value;
  const ei = document.getElementById("eiSelect").value;

  const recipients = "ok.alu@peneder.com,logikalsupport@peneder.com,lager_aluglas@peneder.com";
  const subject = encodeURIComponent("Verglasungsdichtung innen geändert");

  const body = encodeURIComponent(
    `Hallo,\n\n` +
    `bei laufenden Nummer ${nr}, Position ${pos} wurde eine andere Dichtung verwendet.\n\n` +
    `Dichtung lt. LogiKal: ${di}\n` +
    `verwendete Dichtung: ${ei}\n\n` +
	`OK.-Büro: Buchung im Infor korrigieren\n` +
	`Warenwirtschaft: Dichtung für Seitenteile im Montagepaket tauschen` 
  );

  const url = `https://outlook.office365.com/mail/deeplink/compose?to=${recipients}&subject=${subject}&body=${body}`;
  window.open(url, "_blank");
}


