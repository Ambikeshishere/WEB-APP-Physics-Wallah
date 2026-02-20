const CSV_URL = "PASTE_YOUR_CSV_URL_HERE";

let currentUser = null;
let allSheets = [];

/* Google Login */
function handleCredentialResponse(response) {
  const data = parseJwt(response.credential);
  currentUser = data.email;

  localStorage.setItem("loggedUser", currentUser);

  initApp();
}

function parseJwt(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(atob(base64));
}

window.onload = () => {
  const user = localStorage.getItem("loggedUser");
  if (user) {
    currentUser = user;
    initApp();
  }
};

/* Init */
function initApp() {
  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");

  document.getElementById("userInfo").innerText = currentUser;

  fetchSheets();
}

/* Fetch CSV */
async function fetchSheets() {
  const res = await fetch(CSV_URL);
  const text = await res.text();

  const rows = text.split("\n").slice(1);
  allSheets = rows.map(r => {
    const cols = r.split(",");
    return {
      name: cols[0],
      link: cols[1]
    };
  });

  renderSheets();
}

/* Render */
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
          <span onclick="openSheet('${sheet.link}')" style="cursor:pointer">${sheet.name}</span>
          <button onclick="togglePin('${sheet.name}')">📌</button>
        </div>`;
    }
  });
}

/* Pin Logic */
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

/* Open Sheet */
function openSheet(link) {
  window.open(link, "_blank");
}

/* Logout */
function logout() {
  localStorage.removeItem("loggedUser");
  location.reload();
}