import { auth, db, firebaseReady } from "./firebase.js";
import {
  createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
  addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const defaultPlayers = [
  {id:1,number:1,x:50,y:91},{id:2,number:2,x:82,y:76},{id:3,number:4,x:61,y:78},{id:4,number:5,x:39,y:78},{id:5,number:3,x:18,y:76},
  {id:6,number:6,x:50,y:59},{id:7,number:8,x:68,y:46},{id:8,number:10,x:32,y:46},{id:9,number:7,x:82,y:25},{id:10,number:9,x:50,y:20},{id:11,number:11,x:18,y:25}
];
const formations = {
  "4-3-3":[[50,91],[82,76],[61,78],[39,78],[18,76],[50,59],[68,46],[32,46],[82,25],[50,20],[18,25]],
  "4-2-3-1":[[50,91],[82,76],[61,78],[39,78],[18,76],[62,61],[38,61],[80,39],[50,35],[20,39],[50,17]],
  "3-5-2":[[50,91],[72,77],[50,80],[28,77],[90,52],[70,56],[50,60],[30,56],[10,52],[62,25],[38,25]],
  "4-4-2":[[50,91],[82,76],[61,78],[39,78],[18,76],[82,51],[61,51],[39,51],[18,51],[62,25],[38,25]]
};
let players = structuredClone(defaultPlayers);
let squad = [
  ["Doelman",1,"Keeper"],["Rechtsback",2,"Verdediger"],["Centrale verdediger",4,"Verdediger"],["Centrale verdediger",5,"Verdediger"],["Linksback",3,"Verdediger"],
  ["Middenvelder",6,"Middenvelder"],["Middenvelder",8,"Middenvelder"],["Middenvelder",10,"Middenvelder"],["Rechtsbuiten",7,"Aanvaller"],["Spits",9,"Aanvaller"],["Linksbuiten",11,"Aanvaller"]
].map(([name,number,position])=>({name,number,position}));
let selectedPlayer = null, draggedPlayer = null, showOpponents = false, opponentNodes = [], currentUser = null;
let tactics = [], trainings = [], animationTimer = null, animationPhase = 0;

function toast(message){const el=$("#toast");el.textContent=message;el.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove("show"),2800);}
function escapeHTML(value){return String(value).replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));}
function showPage(name){
  $$(".page").forEach(page=>page.classList.toggle("active",page.id===`page-${name}`));
  $$(".nav-link").forEach(button=>button.classList.toggle("active",button.dataset.page===name));
  const active=$(`[data-page="${name}"]`);$("#breadcrumb").textContent=active?.textContent.trim()||name;
  if(name==="tactics")renderPitch();if(name==="animations")renderAnimation();window.scrollTo({top:0,behavior:"smooth"});
}
$$("[data-page]").forEach(button=>button.addEventListener("click",()=>showPage(button.dataset.page)));
$$("[data-go]").forEach(button=>button.addEventListener("click",()=>showPage(button.dataset.go)));

function renderPitch(){
  const layer=$("#players-layer");layer.innerHTML="";
  players.forEach(player=>{
    const token=document.createElement("div");token.className="player-token"+(selectedPlayer===player.id?" selected":"");token.textContent=player.number;
    token.style.left=player.x+"%";token.style.top=player.y+"%";token.dataset.playerId=player.id;
    token.addEventListener("pointerdown",event=>{event.preventDefault();draggedPlayer=player.id;selectedPlayer=player.id;token.setPointerCapture(event.pointerId);renderPitch();$("#selected-info").textContent=`Speler #${player.number} geselecteerd. Sleep hem over het veld.`;});
    token.addEventListener("pointermove",event=>{if(draggedPlayer!==player.id)return;const rect=$("#pitch").getBoundingClientRect();player.x=Math.max(4,Math.min(96,(event.clientX-rect.left)/rect.width*100));player.y=Math.max(5,Math.min(95,(event.clientY-rect.top)/rect.height*100));token.style.left=player.x+"%";token.style.top=player.y+"%";});
    token.addEventListener("pointerup",()=>{draggedPlayer=null;renderPitch();});token.addEventListener("pointercancel",()=>{draggedPlayer=null;renderPitch();});layer.append(token);
  });
  renderOpponents();
}
function renderOpponents(){
  const layer=$("#opponents-layer");layer.innerHTML="";if(!showOpponents)return;
  const positions=[[50,9],[18,24],[39,24],[61,24],[82,24],[28,44],[50,44],[72,44],[18,65],[50,65],[82,65]];
  positions.forEach(([x,y],i)=>{const el=document.createElement("div");el.className="player-token opponent";el.textContent=i+1;el.style.left=x+"%";el.style.top=y+"%";layer.append(el);});
}
function setFormation(name){players=players.map((player,index)=>({...player,x:formations[name][index][0],y:formations[name][index][1]}));$("#formation-select").value=name;renderPitch();renderFormationButtons();}
function renderFormationButtons(){$("#formation-buttons").innerHTML=Object.keys(formations).map(name=>`<button class="button formation-button ${$("#formation-select").value===name?"chosen":""}" data-formation="${name}">${name}</button>`).join("");$$("[data-formation]").forEach(button=>button.addEventListener("click",()=>setFormation(button.dataset.formation)));}
$("#formation-select").addEventListener("change",event=>setFormation(event.target.value));
$("#toggle-opponents").addEventListener("click",()=>{showOpponents=!showOpponents;$("#toggle-opponents").textContent=showOpponents?"− Tegenstander verbergen":"＋ Tegenstander tonen";renderOpponents();});
$("#reset-formation").addEventListener("click",()=>{setFormation("4-3-3");selectedPlayer=null;$("#selected-info").textContent="Geen speler geselecteerd.";});
$("#save-tactic").addEventListener("click",()=>saveItem("tactics",`Tactiek ${$("#formation-select").value}`,JSON.stringify({formation:$("#formation-select").value,players})));

function renderSquad(){
  $("#squad-count").textContent=squad.length;$("#stat-players").textContent=squad.length;
  $("#squad-list").innerHTML=squad.map((player,index)=>`<div class="squad-row"><span>${escapeHTML(player.name)}</span><span>#${player.number}</span><span class="position-label">${escapeHTML(player.position)}</span><button class="delete-button" data-remove-player="${index}" aria-label="Verwijder ${escapeHTML(player.name)}">×</button></div>`).join("")||'<div class="empty-state">Nog geen spelers. Voeg je eerste speler toe.</div>';
  $$("[data-remove-player]").forEach(button=>button.addEventListener("click",()=>{squad.splice(Number(button.dataset.removePlayer),1);renderSquad();}));
}
$("#add-player-form").addEventListener("submit",event=>{event.preventDefault();const name=$("#player-name").value.trim(),number=Number($("#player-number").value);if(!name||number<1||number>99)return;if(squad.some(p=>p.number===number)){toast("Dat rugnummer is al in gebruik.");return;}squad.push({name,number,position:$("#player-position").value});$("#player-name").value="";$("#player-number").value=String(number+1);renderSquad();toast("Speler toegevoegd.");});

async function saveItem(type,title,description){
  const item={id:crypto.randomUUID(),title,description,createdAt:Date.now()};
  if(currentUser&&db){try{await addDoc(collection(db,"users",currentUser.uid,type),{title,description,createdAt:serverTimestamp()});toast("Bewaard in Firebase.");return;}catch(error){console.error(error);toast("Opslaan in Firebase is mislukt.");return;}}
  const list=type==="tactics"?tactics:trainings;list.unshift(item);renderSaved();toast("Bewaard in deze browsersessie. Log in voor cloudsynchronisatie.");
}
async function deleteItem(type,id){
  if(currentUser&&db){try{await deleteDoc(doc(db,"users",currentUser.uid,type,id));return;}catch(error){console.error(error);toast("Verwijderen is mislukt.");return;}}
  if(type==="tactics")tactics=tactics.filter(item=>item.id!==id);else trainings=trainings.filter(item=>item.id!==id);renderSaved();
}
function renderSaved(){
  $("#stat-tactics").textContent=tactics.length;$("#stat-training").textContent=trainings.length;
  $("#tactics-list").classList.toggle("empty-state",!tactics.length);
  $("#tactics-list").innerHTML=tactics.map(item=>savedMarkup(item,"tactics")).join("")||"Nog geen tactieken bewaard.";
  $("#training-list").classList.toggle("empty-state",!trainings.length);
  $("#training-list").innerHTML=trainings.map(item=>savedMarkup(item,"trainings")).join("")||"Nog geen trainingen bewaard.";
  const recent=[...tactics.map(x=>({...x,kind:"Tactiek"})),...trainings.map(x=>({...x,kind:"Training"}))].slice(0,6);
  $("#recent-list").innerHTML=recent.map(item=>`<div class="recent-item"><div><b>${escapeHTML(item.title)}</b><small>${item.kind}</small></div></div>`).join("")||"Je bewaarde tactieken en trainingen verschijnen hier.";
  $$("[data-delete-item]").forEach(button=>button.addEventListener("click",()=>deleteItem(button.dataset.type,button.dataset.deleteItem)));
}
function savedMarkup(item,type){return `<div class="saved-item"><div><b>${escapeHTML(item.title)}</b><small>${escapeHTML(item.description||"")}</small></div><button class="saved-delete" data-delete-item="${item.id}" data-type="${type}" aria-label="Verwijderen">×</button></div>`;}
$("#training-form").addEventListener("submit",event=>{event.preventDefault();const title=$("#training-title").value.trim();if(!title)return;saveItem("sessions",title,($("#training-description").value.trim()+" · "+$("#training-duration").value).trim());$("#training-form").reset();$("#training-duration").value="90 minuten";});

function renderAnimation(){
  const layer=$("#animation-layer");layer.innerHTML="";
  players.forEach((player,index)=>{const el=document.createElement("div");el.className="player-token";el.textContent=player.number;const offset=animationTimer?Math.sin((animationPhase+index)*.7)*7:0;const vertical=animationTimer?Math.cos((animationPhase+index)*.7)*5:0;el.style.left=(player.x+offset)+"%";el.style.top=(player.y+vertical)+"%";layer.append(el);});
  $("#phase-label").textContent=`Fase ${animationPhase+1} / 6`;
}
function stopAnimation(){if(animationTimer)clearInterval(animationTimer);animationTimer=null;$("#animation-play").textContent="▶ Afspelen";renderAnimation();}
$("#animation-play").addEventListener("click",()=>{if(animationTimer){stopAnimation();return;}$("#animation-play").textContent="Ⅱ Pauzeren";animationTimer=setInterval(()=>{animationPhase=(animationPhase+1)%6;renderAnimation();},650);});
$("#animation-reset").addEventListener("click",()=>{stopAnimation();animationPhase=0;renderAnimation();});

$("#auth-open").addEventListener("click",()=>{$("#auth-modal").classList.remove("hidden");$("#auth-error").textContent="";});
$("#auth-close").addEventListener("click",()=>$("#auth-modal").classList.add("hidden"));
$("#auth-modal").addEventListener("click",event=>{if(event.target.id==="auth-modal")$("#auth-modal").classList.add("hidden");});
$("#auth-form").addEventListener("submit",event=>{event.preventDefault();authenticate("login");});
$("#signup-button").addEventListener("click",()=>authenticate("signup"));
async function authenticate(mode){
  $("#auth-error").textContent="";
  if(!firebaseReady||!auth){$("#auth-error").textContent="Vul eerst je Firebase-configuratie in firebase.js in.";return;}
  const email=$("#auth-email").value,password=$("#auth-password").value;
  try{if(mode==="signup")await createUserWithEmailAndPassword(auth,email,password);else await signInWithEmailAndPassword(auth,email,password);$("#auth-modal").classList.add("hidden");toast("Je bent ingelogd.");}
  catch(error){$("#auth-error").textContent=error.message||"Inloggen is niet gelukt.";}
}
$("#auth-logout").addEventListener("click",()=>signOut(auth));

function setAccount(user){
  currentUser=user;$("#auth-open").classList.toggle("hidden",!!user);$("#auth-logout").classList.toggle("hidden",!user);
  $("#stat-account").textContent=user?"Actief":"Demo";
  $("#firebase-status").textContent=user?"Firebase verbonden":(firebaseReady?"Firebase klaar · niet ingelogd":"Demo-modus");
  $("#firebase-status").classList.toggle("ready",!!user);
  if(!user){tactics=[];trainings=[];renderSaved();}
}
if(firebaseReady&&auth){
  onAuthStateChanged(auth,user=>{
    setAccount(user);
    if(!user)return;
    onSnapshot(query(collection(db,"users",user.uid,"tactics"),orderBy("createdAt","desc")),snapshot=>{tactics=snapshot.docs.map(d=>({id:d.id,...d.data()}));renderSaved();});
    onSnapshot(query(collection(db,"users",user.uid,"sessions"),orderBy("createdAt","desc")),snapshot=>{trainings=snapshot.docs.map(d=>({id:d.id,...d.data()}));renderSaved();});
  });
}else setAccount(null);

renderFormationButtons();renderPitch();renderSquad();renderSaved();
