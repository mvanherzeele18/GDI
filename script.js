import { auth, db, firebaseReady } from "./firebase.js";
import { createUserWithEmailAndPassword,onAuthStateChanged,signInWithEmailAndPassword,signOut } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { addDoc,collection,deleteDoc,doc,onSnapshot,orderBy,query,serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const KEYS=["players","trainings","matches","tactics","notes"];
const state={players:[],trainings:[],matches:[],tactics:[],notes:[]};
let user=null,opponents=false,dragging=null,positions=[],unsubs=[],selected=null;
const formations={"4-3-3":[[50,91],[82,76],[61,78],[39,78],[18,76],[50,59],[68,46],[32,46],[82,25],[50,20],[18,25]],"4-2-3-1":[[50,91],[82,76],[61,78],[39,78],[18,76],[62,61],[38,61],[80,39],[50,35],[20,39],[50,17]],"3-5-2":[[50,91],[72,77],[50,80],[28,77],[90,52],[70,56],[50,60],[30,56],[10,52],[62,25],[38,25]],"4-4-2":[[50,91],[82,76],[61,78],[39,78],[18,76],[82,51],[61,51],[39,51],[18,51],[62,25],[38,25]],"5-3-2":[[50,91],[88,75],[68,78],[50,80],[32,78],[12,75],[70,49],[50,53],[30,49],[62,24],[38,24]]};
const initialPlayers=[["Doelman",1,"Keeper"],["Rechtsback",2,"Verdediger"],["Centrale verdediger",4,"Verdediger"],["Centrale verdediger",5,"Verdediger"],["Linksback",3,"Verdediger"],["Middenvelder",6,"Middenvelder"],["Middenvelder",8,"Middenvelder"],["Middenvelder",10,"Middenvelder"],["Rechtsbuiten",7,"Aanvaller"],["Spits",9,"Aanvaller"],["Linksbuiten",11,"Aanvaller"]];
const uid=()=>crypto.randomUUID();
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function toast(msg){const e=$("#toast");e.textContent=msg;e.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove("show"),2600)}
function localLoad(){KEYS.forEach(k=>{try{state[k]=JSON.parse(localStorage.getItem("gdi_"+k)||"[]")}catch{state[k]=[]}})}
function localSave(k){localStorage.setItem("gdi_"+k,JSON.stringify(state[k]))}
function renderAll(){renderStats();renderPlayers();renderRecords("trainings");renderRecords("matches");renderRecords("tactics");renderRecords("notes");renderHome()}
async function addRecord(type,data){
 const item={id:uid(),...data,createdAt:Date.now()};
 if(user&&db){try{await addDoc(collection(db,"users",user.uid,type),{...data,createdAt:serverTimestamp()});toast("Opgeslagen in je GDI-account.");return}catch(e){console.error(e);toast("Opslaan in de cloud lukte niet. Je gegevens zijn niet aangepast.");return}}
 state[type].unshift(item);localSave(type);renderAll();toast("Opgeslagen op dit toestel. Log in om te synchroniseren.");
}
async function removeRecord(type,id){
 if(user&&db){try{await deleteDoc(doc(db,"users",user.uid,type,id));toast("Verwijderd.");return}catch(e){console.error(e);toast("Verwijderen lukte niet.");return}}
 state[type]=state[type].filter(x=>x.id!==id);localSave(type);renderAll();toast("Verwijderd.");
}
function renderStats(){$("#count-players").textContent=state.players.length;$("#count-training").textContent=state.trainings.length;$("#count-matches").textContent=state.matches.length;$("#count-tactics").textContent=state.tactics.length;$("#squad-total").textContent=state.players.length}
function renderHome(){
 const next=[...state.matches].filter(x=>x.date).sort((a,b)=>a.date.localeCompare(b.date)).find(x=>x.date>=new Date().toISOString().slice(0,10));
 $("#next-event").innerHTML=next?'<div class="record"><div class="match-date">'+esc(next.date)+(next.time?' · '+esc(next.time):'')+'</div><b>GDI '+(next.venue==="Uit"?'@':'—')+' '+esc(next.opponent)+'</b><p>'+esc(next.venue)+' · '+esc(next.location||next.type||"Wedstrijd")+'</p></div>':"Nog geen komende wedstrijd ingepland.";
 const recent=[...state.trainings.map(x=>({...x,kind:"Training"})),...state.matches.map(x=>({...x,kind:"Wedstrijd"})),...state.tactics.map(x=>({...x,kind:"Tactiek"})),...state.notes.map(x=>({...x,kind:"Notitie"}))].sort((a,b)=>(b.createdAt?.seconds?b.createdAt.seconds*1000:b.createdAt||0)-(a.createdAt?.seconds?a.createdAt.seconds*1000:a.createdAt||0)).slice(0,4);
 $("#recent-items").innerHTML=recent.map(x=>'<div class="record"><div class="record-top"><b>'+esc(x.title||x.opponent)+'</b><span class="subtle">'+esc(x.kind)+'</span></div></div>').join("")||"Nog niets bewaard. Je recente ploegwerk komt hier te staan.";
}
function renderPlayers(){
 const term=($("#player-search")?.value||"").toLowerCase();
 const rows=state.players.filter(p=>(p.name+" "+p.number+" "+p.position).toLowerCase().includes(term));
 $("#squad-list").innerHTML=rows.map(p=>'<div class="player-row"><span class="player-name">'+esc(p.name)+'</span><span class="player-number">#'+esc(p.number)+'</span><span class="player-position">'+esc(p.position)+'</span><button class="delete" data-del-player="'+esc(p.id)+'" aria-label="Verwijder speler">×</button></div>').join("")||'<div class="empty">Geen spelers gevonden. Voeg een speler toe aan je lijst.</div>';
 $$("[data-del-player]").forEach(b=>b.addEventListener("click",()=>removeRecord("players",b.dataset.delPlayer)));
}
function recordMarkup(type,x){
 let title=x.title||x.opponent||"Item",meta="",body=x.description||x.body||"";
 if(type==="trainings")meta=[x.date,x.duration,x.goal].filter(Boolean).join(" · ");
 if(type==="matches") {title="GDI "+(x.venue==="Uit"?"@":"—")+" "+x.opponent;meta=[x.date,x.time,x.venue,x.type].filter(Boolean).join(" · ");body=x.location||""}
 if(type==="tactics")meta="Opstelling: "+(x.formation||"");
 if(type==="notes")meta="Ploegnotitie";
 return '<div class="record"><div class="record-top"><div><b>'+esc(title)+'</b><div class="record-meta">'+esc(meta)+'</div></div><div class="record-actions">'+(type==="tactics"?'<button data-load-tactic="'+esc(x.id)+'" aria-label="Opstelling laden">↗</button>':"")+'<button data-remove="'+esc(x.id)+'" data-type="'+type+'" aria-label="Verwijderen">×</button></div></div>'+(body?'<p>'+esc(body)+'</p>':"")+'</div>';
}
function renderRecords(type){
 const map={trainings:"#training-list",matches:"#match-list",tactics:"#tactic-list",notes:"#note-list"};
 const arr=[...state[type]].sort((a,b)=>(a.date||"").localeCompare(b.date||"")||((b.createdAt?.seconds||b.createdAt||0)-(a.createdAt?.seconds||a.createdAt||0)));
 $(map[type]).innerHTML=arr.map(x=>recordMarkup(type,x)).join("")||({trainings:"Nog geen trainingen voorbereid.",matches:"Nog geen wedstrijden gepland.",tactics:"Nog geen opstellingen bewaard.",notes:"Nog geen notities bewaard."}[type]);
 $(map[type]+" [data-remove]").forEach(b=>b.addEventListener("click",()=>removeRecord(b.dataset.type,b.dataset.remove)));if(type==="tactics")$(map[type]+" [data-load-tactic]").forEach(b=>b.addEventListener("click",()=>{const item=state.tactics.find(x=>x.id===b.dataset.loadTactic);if(!item)return;currentFormation=item.formation||"4-3-3";$("#formation").value=currentFormation;positions=Array.isArray(item.positions)?item.positions.map(p=>({...p})):formations[currentFormation].map(([x,y],i)=>({number:i+1,x,y}));renderPitch();showPage("tactics");toast("Opstelling geladen.");}));
}
function showPage(name){$$(".page").forEach(p=>p.classList.toggle("active",p.id==="page-"+name));$$(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.page===name));$("#current-page").textContent=({home:"Overzicht",team:"Ploeg & spelers",tactics:"Tactiekbord",training:"Trainingen",matches:"Wedstrijden",notes:"Ploegnotities"})[name]||"GDI";if(name==="tactics")renderPitch();window.scrollTo({top:0,behavior:"smooth"})}
$$("[data-page]").forEach(b=>b.addEventListener("click",()=>showPage(b.dataset.page)));
$$("[data-go]").forEach(b=>b.addEventListener("click",()=>showPage(b.dataset.go)));
$("#add-player-focus").addEventListener("click",()=>{$("#player-name").focus();window.scrollTo({top:document.body.scrollHeight,behavior:"smooth"})});
$("#player-search").addEventListener("input",renderPlayers);
$("#player-form").addEventListener("submit",e=>{e.preventDefault();const name=$("#player-name").value.trim(),number=Number($("#player-number").value),position=$("#player-position").value;if(!name||number<1||number>99)return;if(state.players.some(p=>Number(p.number)===number)){toast("Dit rugnummer is al in gebruik.");return}addRecord("players",{name,number,position});e.target.reset();});
$("#training-form").addEventListener("submit",e=>{e.preventDefault();addRecord("trainings",{title:$("#training-title").value.trim(),date:$("#training-date").value,duration:$("#training-duration").value,goal:$("#training-goal").value.trim(),description:$("#training-description").value.trim()});e.target.reset()});
$("#match-form").addEventListener("submit",e=>{e.preventDefault();addRecord("matches",{opponent:$("#opponent-name").value.trim(),date:$("#match-date").value,time:$("#match-time").value,venue:$("#match-venue").value,type:$("#match-type").value.trim(),location:$("#match-location").value.trim()});e.target.reset()});
$("#note-form").addEventListener("submit",e=>{e.preventDefault();addRecord("notes",{title:$("#note-title").value.trim(),body:$("#note-body").value.trim()});e.target.reset()});
let currentFormation="4-3-3";
function renderPitch(){
 const layer=$("#pitch-players");layer.innerHTML="";
 if(positions.length!==11)positions=formations[currentFormation].map(([x,y],i)=>({number:i+1,x,y}));
 positions.forEach((p,i)=>{const el=document.createElement("div");el.className="shirt";el.textContent=p.number;el.style.left=p.x+"%";el.style.top=p.y+"%";el.addEventListener("pointerdown",e=>{dragging=i;selected=i;el.classList.add("selected");el.setPointerCapture(e.pointerId)});el.addEventListener("pointermove",e=>{if(dragging!==i)return;const r=$("#pitch").getBoundingClientRect();p.x=Math.max(4,Math.min(96,(e.clientX-r.left)/r.width*100));p.y=Math.max(5,Math.min(95,(e.clientY-r.top)/r.height*100));el.style.left=p.x+"%";el.style.top=p.y+"%"});el.addEventListener("pointerup",()=>{dragging=null;renderPitch()});el.addEventListener("pointercancel",()=>{dragging=null;renderPitch()});layer.append(el)});
 if(opponents){[[50,9],[18,24],[39,24],[61,24],[82,24],[28,44],[50,44],[72,44],[18,65],[50,65],[82,65]].forEach(([x,y],i)=>{const el=document.createElement("div");el.className="shirt opponent";el.textContent=i+1;el.style.left=x+"%";el.style.top=y+"%";layer.append(el)})}
}
$("#formation").addEventListener("change",e=>{currentFormation=e.target.value;positions=formations[currentFormation].map(([x,y],i)=>({number:i+1,x,y}));renderPitch()});
$("#reset-pitch").addEventListener("click",()=>{positions=formations[currentFormation].map(([x,y],i)=>({number:i+1,x,y}));renderPitch()});
$("#opponents").addEventListener("click",()=>{opponents=!opponents;$("#opponents").textContent=opponents?"Tegenstander verbergen":"Tegenstander tonen";renderPitch()});
$("#save-tactic").addEventListener("click",()=>{const title=$("#tactic-name").value.trim()||"Opstelling "+currentFormation;addRecord("tactics",{title,formation:currentFormation,positions:positions.map(p=>({...p}))})});

$("#login-open").addEventListener("click",()=>{$("#auth-modal").classList.remove("hidden");$("#auth-error").textContent=""});
$("#auth-close").addEventListener("click",()=>$("#auth-modal").classList.add("hidden"));
$("#auth-modal").addEventListener("click",e=>{if(e.target.id==="auth-modal")$("#auth-modal").classList.add("hidden")});
$("#auth-form").addEventListener("submit",e=>{e.preventDefault();authenticate(false)});
$("#signup").addEventListener("click",()=>authenticate(true));
async function authenticate(create){
 $("#auth-error").textContent="";
 if(!firebaseReady||!auth){$("#auth-error").textContent="Firebase is nog niet geconfigureerd.";return}
 try{const email=$("#auth-email").value,password=$("#auth-password").value;if(create)await createUserWithEmailAndPassword(auth,email,password);else await signInWithEmailAndPassword(auth,email,password);$("#auth-modal").classList.add("hidden");toast("Je bent ingelogd bij GDI.")}
 catch(e){$("#auth-error").textContent=e.code==="auth/email-already-in-use"?"Dit e-mailadres heeft al een account.":e.code==="auth/invalid-credential"?"E-mailadres of wachtwoord klopt niet.":e.message}
}
$("#logout").addEventListener("click",()=>signOut(auth));
function subscribeUser(u){
 unsubs.forEach(fn=>fn());unsubs=[];
 if(!u){localLoad();renderAll();return}
 KEYS.forEach(type=>{const unsub=onSnapshot(query(collection(db,"users",u.uid,type),orderBy("createdAt","desc")),snap=>{state[type]=snap.docs.map(d=>({id:d.id,...d.data()}));renderAll()},err=>{console.error(err);toast("Kon "+type+" niet synchroniseren. Controleer de Firestore-regels.")});unsubs.push(unsub)});
}
function setUser(u){user=u;$("#login-open").classList.toggle("hidden",!!u);$("#logout").classList.toggle("hidden",!u);$("#sync-state").textContent=u?"Verbonden met Firebase":firebaseReady?"Niet ingelogd · lokaal":"Lokale modus";$("#sync-state").style.color=u?"#1f6b43":"";subscribeUser(u)}
localLoad();
if(firebaseReady&&auth)onAuthStateChanged(auth,setUser);else{setUser(null)}
renderAll();positions=formations[currentFormation].map(([x,y],i)=>({number:i+1,x,y}));renderPitch();
