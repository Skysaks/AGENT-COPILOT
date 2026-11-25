/* ============ render loop ============ */
let raf=0,pending=false;
const editingInMain=()=>{const a=document.activeElement;return a&&$("#main").contains(a)&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)};
function schedule(){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;renderChrome();if(editingInMain()){pending=true;return}renderMain()})}
document.addEventListener("focusout",()=>{if(pending)setTimeout(()=>{if(pending&&!editingInMain())renderMain()},350)});
function renderAll(){renderChrome();renderMain()}

const TABS=[["today","Aujourd'hui"],["copilot","Copilote"],["capture","Capture"],["network","Réseau"],["prospects","Prospects"],["tasks","Tâches"],["exam","Examen"],["sources","Sources"],["tests","Banc d'essai"],["settings","Réglages"]];
function renderChrome(){
  const st=Number(S.profile.stage)||0;
  $("#stage-chip").textContent=`STAGE ${st} · ${STAGES[st][0]}`;
  const counts={network:vals("contacts").length,prospects:vals("prospects").filter(p=>p.stage!=="DROPPED").length,tasks:vals("tasks").filter(t=>!t.done).length};
  $("#tabs").innerHTML=TABS.map(([k,l])=>`<button class="tab" role="tab" aria-selected="${S.ui.tab===k}" data-act="tab" data-tab="${k}">${l}${counts[k]?`<span class="n">${counts[k]}</span>`:""}</button>`).join("");
  let b="";
  if(S.mode==="local")b="Enregistrement dans ce navigateur uniquement. La version hébergée ajoute un stockage privé synchronisé et l'assistant IA.";
  if(S.mode==="memory")b="Rien n'est enregistré dans cette vue : les données disparaîtront à la fermeture.";
  $("#banner").innerHTML=b?`<div class="banner"><p>${b}</p></div>`:"";
}
function renderMain(){
  const v={today:vToday,copilot:vCopilot,capture:vCapture,network:vNetwork,prospects:vProspects,tasks:vTasks,exam:vExam,sources:vSources,tests:vTests,settings:vSettings}[S.ui.tab]||vToday;
  pending=false;
  $("#main").innerHTML=v();
  if(S.ui.tab==="exam")tickTimer();
}
function toast(msg){const t=$("#toast");t.textContent=msg;t.hidden=false;clearTimeout(toast._t);toast._t=setTimeout(()=>{t.hidden=true},4200)}
function aiNote(){
  if(S.ai==="on")return"";
  if(S.ai==="pending")return`<p class="muted small">Connexion à Claude…</p>`;
  return`<p class="small muted">Les fonctions IA s'activent dans la version hébergée, une fois l'accès au modèle autorisé. Le reste de l'outil fonctionne sans.</p>`;
}
function aiError(e){
  const c=e&&e.code;
  if(["not_granted","sampling_disabled","not_declared","capability_disabled","capability_removed"].includes(c)){S.ai="off";return"Claude n'est pas accessible depuis cette page pour cette visite."}
  return({cancelled:"",rate_limited:"Trop de requêtes ou limite d'usage atteinte. Réessaie plus tard.",session_expired:"Session expirée : reconnecte-toi à claude.ai.",
    prompt_too_large:"Contexte trop long : réduis les sources incluses ou ouvre un nouveau fil.",refused:"Claude a refusé cette demande. Reformule-la.",
    empty_completion:"Réponse vide. Simplifie la demande.",invalid_json:"La réponse n'était pas exploitable. Relance."})[c]??"Interruption du service. Relance manuellement.";
}

