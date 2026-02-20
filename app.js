const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQsEVNq4qW_LNCvcjfRLXA5v__OZo4AzAfWcDlmKYonEAyXVEpbDdlbjjugTJ0oJo1P30HRxPAguNTs/pub?gid=0&single=true&output=csv";

let currentUser = localStorage.getItem("loggedUser");
let allSheets = [];

document.getElementById("userInfo").innerText = currentUser;

async function fetchSheets() {
  const res = await fetch(CSV_URL);
  const text = await res.text();

  const rows = text.split("\n").slice(1);

  allSheets = rows.map(row => {
    const cols = row.split(",");
    return {
      name: cols[0],
      link: cols[1]
    };
  });

  renderSheets();
}

function renderSheets() {
  const pinned = getPinned();

  const pinnedContainer = document.getElementById("pinnedContainer");
  const sheetList = document.getElementById("sheetList");

  pinnedContainer.innerHTML = "";
  sheetList.innerHTML = "";

  allSheets.forEach(sheet => {
    if (pinned.includes(sheet.name)) {
      pinnedContainer.innerHTML += `
        <div class="pinned-card" onclick="openSheet('${sheet.link}')">
          ${sheet.name}
        </div>`;
    } else {
      sheetList.innerHTML += `
        <div class="sheet-item">
          <span onclick="openSheet('${sheet.link}')">${sheet.name}</span>
          <button onclick="togglePin('${sheet.name}')">📌</button>
        </div>`;
    }
  });
}

function getPinned() {
  const data = JSON.parse(localStorage.getItem("pinnedSheets")) || {};
  return data[currentUser] || [];
}

function togglePin(name) {
  const data = JSON.parse(localStorage.getItem("pinnedSheets")) || {};
  const userPins = data[currentUser] || [];

  if (userPins.includes(name)) {
    data[currentUser] = userPins.filter(s => s !== name);
  } else {
    data[currentUser] = [...userPins, name];
  }

  localStorage.setItem("pinnedSheets", JSON.stringify(data));
  renderSheets();
}

function openSheet(link) {
  window.open(link, "_blank");
}

function logout() {
  localStorage.removeItem("loggedUser");
  window.location.href = "login.html";
}

document.getElementById("searchInput").addEventListener("input", function() {
  const search = this.value.toLowerCase();

  const filtered = allSheets.filter(sheet =>
    sheet.name.toLowerCase().includes(search)
  );

  const sheetList = document.getElementById("sheetList");
  sheetList.innerHTML = "";

  filtered.forEach(sheet => {
    sheetList.innerHTML += `
      <div class="sheet-item">
        <span onclick="openSheet('${sheet.link}')">${sheet.name}</span>
        <button onclick="togglePin('${sheet.name}')">📌</button>
      </div>`;
  });
});

fetchSheets();