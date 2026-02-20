const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQsEVNq4qW_LNCvcjfRLXA5v__OZo4AzAfWcDlmKYonEAyXVEpbDdlbjjugTJ0oJo1P30HRxPAguNTs/pub?gid=0&single=true&output=csv";

let currentUser = localStorage.getItem("loggedUser");
let allSheets = [];

// Set user badge
const userBadge = document.getElementById("userBadge");
if (userBadge) userBadge.innerText = "👤 " + currentUser;

// ===== FETCH SHEETS =====
async function fetchSheets() {
  showSkeletons();

  try {
    const res = await fetch(CSV_URL);
    const text = await res.text();

    const rows = text.split("\n").slice(1).filter(r => r.trim());

    allSheets = rows.map(row => {
      // Handle CSV with commas inside quoted fields
      const cols = parseCSVRow(row);
      return {
        name: cols[0]?.trim() || "Untitled",
        openLink: cols[1]?.trim() || "",
        owner: cols[2]?.trim() || "",
        lastModified: cols[3]?.trim() || "",
        lastModifiedDate: cols[4]?.trim() || "",
        webLink: cols[5]?.trim() || cols[1]?.trim() || ""
      };
    }).filter(s => s.name && s.webLink);

    // Update counts
    document.getElementById("sheetCount").innerText = allSheets.length + " sheets";

    renderSheets(allSheets);

  } catch (err) {
    console.error("Error fetching sheets:", err);
    document.getElementById("sheetList").innerHTML = `
      <div class="empty-state">
        <p>Failed to load sheets. Please refresh the page.</p>
      </div>`;
  }
}

// Simple CSV row parser (handles quoted fields)
function parseCSVRow(row) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ===== RENDER =====
function renderSheets(sheets) {
  const pinned = getPinned();

  const pinnedSheets = sheets.filter(s => pinned.includes(s.name));
  const unpinnedSheets = sheets.filter(s => !pinned.includes(s.name));

  renderPinned(pinnedSheets);
  renderList(unpinnedSheets);

  document.getElementById("allCount").innerText = unpinnedSheets.length + " sheets";
}

function renderPinned(sheets) {
  const container = document.getElementById("pinnedContainer");
  const empty = document.getElementById("pinnedEmpty");

  container.innerHTML = "";

  if (sheets.length === 0) {
    empty.style.display = "block";
    return;
  }

  empty.style.display = "none";

  sheets.forEach((sheet, i) => {
    const card = document.createElement("div");
    card.className = "pinned-card";
    card.style.animationDelay = `${i * 0.05}s`;
    card.innerHTML = `
      <div class="pinned-card-name">${escapeHTML(sheet.name)}</div>
      <div class="sheet-meta">
        ${sheet.owner ? `<span class="meta-item">👤 ${escapeHTML(sheet.owner)}</span>` : ""}
        ${sheet.lastModifiedDate ? `<span class="meta-item">🗓 ${escapeHTML(sheet.lastModifiedDate)}</span>` : ""}
      </div>
      <div class="pinned-card-footer">
        <span class="pinned-open">Open ↗</span>
        <button class="unpin-btn" onclick="event.stopPropagation(); togglePin('${escapeAttr(sheet.name)}')">Unpin</button>
      </div>
    `;
    card.addEventListener("click", () => openSheet(sheet.webLink));
    container.appendChild(card);
  });
}

function renderList(sheets) {
  const list = document.getElementById("sheetList");
  const empty = document.getElementById("listEmpty");

  list.innerHTML = "";

  if (sheets.length === 0) {
    empty.style.display = "block";
    return;
  }

  empty.style.display = "none";

  sheets.forEach((sheet, i) => {
    const item = document.createElement("div");
    item.className = "sheet-item";
    item.style.animationDelay = `${i * 0.02}s`;
    item.innerHTML = `
      <div class="sheet-info">
        <div class="sheet-dot"></div>
        <div class="sheet-text">
          <span class="sheet-name" title="${escapeAttr(sheet.name)}">${escapeHTML(sheet.name)}</span>
          <div class="sheet-meta">
            ${sheet.owner ? `<span class="meta-item">👤 ${escapeHTML(sheet.owner)}</span>` : ""}
            ${sheet.lastModifiedDate ? `<span class="meta-item">🗓 ${escapeHTML(sheet.lastModifiedDate)}</span>` : ""}
          </div>
        </div>
      </div>
      <div class="sheet-actions">
        <button class="open-btn" onclick="event.stopPropagation(); openSheet('${escapeAttr(sheet.webLink)}')">Open ↗</button>
        <button class="pin-btn" onclick="event.stopPropagation(); togglePin('${escapeAttr(sheet.name)}')">📌</button>
      </div>
    `;
    item.addEventListener("click", () => openSheet(sheet.webLink));
    list.appendChild(item);
  });
}

// ===== PINNING =====
function getPinned() {
  try {
    const data = JSON.parse(localStorage.getItem("pinnedSheets")) || {};
    return data[currentUser] || [];
  } catch { return []; }
}

function togglePin(name) {
  try {
    const data = JSON.parse(localStorage.getItem("pinnedSheets")) || {};
    const userPins = data[currentUser] || [];

    let msg;
    if (userPins.includes(name)) {
      data[currentUser] = userPins.filter(s => s !== name);
      msg = "📌 Unpinned";
    } else {
      data[currentUser] = [...userPins, name];
      msg = "📌 Pinned!";
    }

    localStorage.setItem("pinnedSheets", JSON.stringify(data));
    showToast(msg);
    renderSheets(allSheets);
  } catch (err) {
    console.error("Pin error:", err);
  }
}

// ===== OPEN =====
function openSheet(link) {
  if (link) window.open(link, "_blank");
}

// ===== LOGOUT =====
function logout() {
  localStorage.removeItem("loggedUser");
  window.location.href = "login.html";
}

// ===== SEARCH =====
document.getElementById("searchInput").addEventListener("input", function () {
  const query = this.value.toLowerCase().trim();

  let sheets = [...allSheets];

  // Apply category filter first
  if (currentFilter !== "all" && currentFilter !== "pinned") {
    sheets = sheets.filter(s => s.name.toLowerCase().includes(currentFilter.toLowerCase()));
  } else if (currentFilter === "pinned") {
    const pinned = getPinned();
    sheets = sheets.filter(s => pinned.includes(s.name));
  }

  // Then apply search
  if (query) {
    sheets = sheets.filter(s => s.name.toLowerCase().includes(query));
  }

  renderSheets(sheets);
});

// ===== SKELETON LOADING =====
function showSkeletons() {
  const list = document.getElementById("sheetList");
  list.innerHTML = Array(6).fill(0).map(() =>
    `<div class="loading-skeleton"></div>`
  ).join("");
}

// ===== TOAST =====
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.innerText = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}

// ===== HELPERS =====
function escapeHTML(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function escapeAttr(str) {
  return str.replace(/'/g, "\\'").replace(/"/g, "&quot;");
}

// ===== SIDEBAR NAV & FILTER =====
let currentFilter = "all";

function toggleSub(id) {
  const sub = document.getElementById(id);
  const chevron = document.getElementById("chevron-" + id);
  sub.classList.toggle("open");
  chevron.classList.toggle("open");
}

function setFilter(filter) {
  currentFilter = filter;

  // Update active states - menu items
  document.querySelectorAll(".menu-item").forEach(i => i.classList.remove("active"));
  document.querySelectorAll(".sub-item").forEach(i => i.classList.remove("active"));

  const matched = document.querySelector(`[data-filter="${filter}"]`);
  if (matched) matched.classList.add("active");

  // Update page title
  const titles = {
    all: "Sheet Library", pinned: "Pinned Sheets",
    analysis: "Analysis", b2b: "B2B", acad: "Acad", bws: "BWS",
    comms: "Comms", gen: "Gen", ptm: "PTM", orientation: "Orientation",
    "batch start": "Batch Start", mh: "MH", maharashtra: "Maharashtra"
  };
  document.querySelector(".page-title").innerText = titles[filter] || "Sheet Library";

  // Clear search
  document.getElementById("searchInput").value = "";

  applyFilter();
}

function applyFilter() {
  let sheets = [...allSheets];

  if (currentFilter === "all") {
    renderSheets(sheets);
    return;
  }

  if (currentFilter === "pinned") {
    const pinned = getPinned();
    renderSheets(sheets.filter(s => pinned.includes(s.name)));
    return;
  }

  // Keyword filter on sheet name
  const keyword = currentFilter.toLowerCase();
  renderSheets(sheets.filter(s => s.name.toLowerCase().includes(keyword)));
}

// Attach click to all menu items and sub items
document.querySelectorAll(".menu-item:not(.has-sub)").forEach(item => {
  item.addEventListener("click", function () {
    setFilter(this.dataset.filter);
  });
});

document.querySelectorAll(".sub-item").forEach(item => {
  item.addEventListener("click", function (e) {
    e.stopPropagation();
    setFilter(this.dataset.filter);
  });
});

// ===== INIT =====
fetchSheets();

// ===== THEME =====
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('pwTheme', theme);

  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
}

// Apply saved theme on load
(function () {
  const saved = localStorage.getItem('pwTheme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  // Wait for DOM to mark correct button active
  window.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === saved);
    });
  });
})();

// ===== LIVE TREND =====
function openLiveTrend() {
  const panel = document.getElementById('livePanel');
  const overlay = document.getElementById('liveOverlay');
  const frame = document.getElementById('liveTrendFrame');

  // Set src only once to avoid reload every time
  if (!frame.src || frame.src === 'about:blank' || frame.src === '') {
    frame.src = 'trend.html';
  }

  panel.classList.add('open');
  overlay.classList.add('open');

  // Mark menu item active
  document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
  document.querySelectorAll('.sub-item').forEach(i => i.classList.remove('active'));
  document.getElementById('liveTrendBtn').classList.add('active');
}

function closeLiveTrend() {
  const panel = document.getElementById('livePanel');
  const overlay = document.getElementById('liveOverlay');
  panel.classList.remove('open');
  overlay.classList.remove('open');

  // Restore All Sheets as active
  document.getElementById('liveTrendBtn').classList.remove('active');
  const allItem = document.querySelector('[data-filter="all"]');
  if (allItem) allItem.classList.add('active');
}

// Close with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeLiveTrend();
});