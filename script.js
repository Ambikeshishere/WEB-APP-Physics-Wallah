const CSV_URL="YOUR_CSV_LINK";

let allSheets=[];
let pinned=JSON.parse(localStorage.getItem("pins")||"[]");
let currentGroup="all";

function extractLink(v){
  if(!v) return "";
  if(v.startsWith("http")) return v;
  const m=v.match(/"(https?:\/\/[^"]+)"/);
  return m?m[1]:"";
}

async function load(){
  const res=await fetch(CSV_URL);
  const csv=await res.text();
  const parsed=Papa.parse(csv,{header:true});

  allSheets=parsed.data
  .filter(r=>r.Name)
  .map(r=>({
    name:r.Name,
    owner:r.Owner||"",
    link:extractLink(r["Sheet Link"])
  }));

  render();
}

function render(){
  renderPinned();
  renderList();
}

function renderPinned(){
  const grid=document.getElementById("pinnedGrid");
  const section=document.getElementById("pinnedSection");

  if(!pinned.length){
    section.classList.add("hidden");
    return;
  }

  section.classList.remove("hidden");

  grid.innerHTML=pinned.map(name=>{
    const s=allSheets.find(x=>x.name===name);
    return `
    <div class="tile" draggable="true" data-name="${name}">
      <strong>${s.name}</strong>
      <div style="margin-top:10px;">
        <button onclick="window.open('${s.link}')">Open</button>
      </div>
    </div>`;
  }).join("");
}

/* Drag reorder */

document.addEventListener("dragstart",e=>{
  if(e.target.classList.contains("tile")){
    e.dataTransfer.setData("name",e.target.dataset.name);
  }
});

document.addEventListener("dragover",e=>e.preventDefault());

document.addEventListener("drop",e=>{
  const name=e.dataTransfer.getData("name");
  pinned=pinned.filter(x=>x!==name);
  pinned.push(name);
  localStorage.setItem("pins",JSON.stringify(pinned));
  renderPinned();
});

function renderList(){
  const container=document.getElementById("listContainer");
  const q=document.getElementById("searchInput").value.toLowerCase();

  let list=allSheets.filter(s=>!pinned.includes(s.name));

  if(currentGroup!=="all"){
    list=list.filter(s=>s.name.toLowerCase().includes(currentGroup));
  }

  if(q){
    list=list.filter(s=>s.name.toLowerCase().includes(q));
  }

  container.innerHTML=list.map(s=>`
    <div class="list-item">
      <div>
        <strong>${s.name}</strong><br>
        <small>${s.owner}</small>
      </div>
      <div>
        <button onclick="pin('${s.name}')">📍</button>
        <button onclick="window.open('${s.link}')">Open</button>
      </div>
    </div>
  `).join("");
}

function pin(name){
  if(!pinned.includes(name)){
    pinned.push(name);
    localStorage.setItem("pins",JSON.stringify(pinned));
    render();
  }
}

document.getElementById("searchInput")
.addEventListener("input",renderList);

document.getElementById("menuList")
.addEventListener("click",e=>{
  if(e.target.closest("li")){
    document.querySelectorAll(".menu li")
      .forEach(li=>li.classList.remove("active"));
    e.target.closest("li").classList.add("active");
    currentGroup=e.target.closest("li").dataset.group;
    renderList();
  }
});

document.getElementById("collapseBtn")
.onclick=()=>{
  document.getElementById("sidebar")
  .classList.toggle("collapsed");
};

window.onload=load;