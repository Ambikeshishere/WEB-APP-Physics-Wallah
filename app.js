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
        <span class="sheet-name" title="${escapeAttr(sheet.name)}">${escapeHTML(sheet.name)}</span>
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

  if (!query) {
    renderSheets(allSheets);
    return;
  }

  const filtered = allSheets.filter(s =>
    s.name.toLowerCase().includes(query)
  );

  renderSheets(filtered);
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

// ===== SIDEBAR NAV =====
document.querySelectorAll(".menu-item").forEach(item => {
  item.addEventListener("click", function () {
    document.querySelectorAll(".menu-item").forEach(i => i.classList.remove("active"));
    this.classList.add("active");
  });
});

// ===== INIT =====
fetchSheets();