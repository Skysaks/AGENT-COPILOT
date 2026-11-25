/* ============ actions ============ */
const DEFAULTS={contacts:()=>({name:"",role:"",org:"",channel:"",why:"",value:"",lastInteraction:"",nextAction:"",nextDate:"",notes:"",journal:[]}),
  prospects:()=>({name:"",position:"",club:"",league:"",ageStatus:"inconnu",ageSource:"",contractEnd:"",contractStatus:"UNKNOWN",stage:"DISCOVERED",whyInteresting:"",whyNow:"",whyMe:"",access:"",redFlags:"",nextAction:"",nextDate:"",facts:[]}),
  sources:()=>({title:"",issuer:"",versionDate:"",url:"",text:"",include:true})};
const TAB_OF={contacts:"network",prospects:"prospects",sources:"sources"};
const top0=()=>{try{window.scrollTo({top:0,behavior:"auto"})}catch(e){}};
const A={
  tab:d=>{S.ui.tab=d.tab;S.ui.confirm=null;if(d.tab!=="settings")S.ui.prof=null;renderAll();top0()},
  new:d=>{S.ui.edit={col:d.col,obj:DEFAULTS[d.col](),isNew:true};S.ui.tab=TAB_OF[d.col];S.ui.journal={date:"",summary:""};renderAll();top0();setTimeout(()=>{const i=$("#editor input");if(i)i.focus()},30)},
  edit:d=>{const r=S.data[d.col]?.[d.id];if(!r)return;S.ui.edit={col:d.col,obj:cl(r),isNew:false};S.ui.tab=TAB_OF[d.col];S.ui.confirm=null;S.ui.journal={date:"",summary:""};renderAll();top0()},
  "cancel-edit":()=>{S.ui.edit=null;S.ui.confirm=null;renderAll()},
  "save-edit":()=>{const e=S.ui.edit;if(!e)return;const o=e.obj;if(!String(o.name||"").trim()){toast("Indique au moins un nom.");return}
    o.name=o.name.trim();if(o.facts)o.facts=o.facts.filter(f=>String(f.text||"").trim());Store.put(e.col,o);S.ui.edit=null;toast("Enregistré.");renderAll()},
  "save-source":()=>{const e=S.ui.edit;if(!e)return;const o=e.obj;if(!String(o.title||"").trim()||!String(o.text||"").trim()){toast("Titre et texte sont nécessaires.");return}
    const MAX=100000;const text=o.text;
    if(text.length<=MAX){Store.put("sources",o)}else{const parts=Math.ceil(text.length/MAX);
      for(let k=0;k<parts;k++){Store.put("sources",{...o,id:k===0?o.id:undefined,title:`${o.title.replace(/ \(partie \d+\/\d+\)$/,"")} (partie ${k+1}/${parts})`,text:text.slice(k*MAX,(k+1)*MAX)})}
      toast(`Texte long : découpé en ${parts} parties.`)}
    S.ui.edit=null;renderAll()},
  askdel:d=>{S.ui.confirm=d.key||null;renderMain()},
  del:d=>{Store.del(d.col,d.id);if(S.ui.edit&&S.ui.edit.obj.id===d.id)S.ui.edit=null;if(d.col==="threads"&&S.ui.threadId===d.id)S.ui.threadId=null;S.ui.confirm=null;toast("Supprimé.");renderAll()},
  "add-journal":()=>{const j=S.ui.journal;if(!S.ui.edit||!String(j.summary||"").trim())return;const o=S.ui.edit.obj;const d=j.date||localISO();
    o.journal=[...(o.journal||[]),{date:d,summary:j.summary.trim()}];if(!o.lastInteraction||d>o.lastInteraction)o.lastInteraction=d;S.ui.journal={date:"",summary:""};renderMain()},
  "rm-journal":d=>{const o=S.ui.edit?.obj;if(!o)return;o.journal.splice(Number(d.i),1);o.lastInteraction=(o.journal.map(x=>x.date).sort().pop())||o.lastInteraction;renderMain()},
  "add-fact":()=>{const o=S.ui.edit?.obj;if(!o)return;o.facts=[...(o.facts||[]),{text:"",status:"USER-PROVIDED",source:""}];renderMain();setTimeout(()=>{const i=$(`#pf-t-${o.facts.length-1}`);if(i)i.focus()},30)},
  "rm-fact":d=>{const o=S.ui.edit?.obj;if(!o)return;o.facts.splice(Number(d.i),1);renderMain()},
  pfilter:d=>{S.ui.pFilter=d.v;renderMain()},
  send:()=>send(),
  stop:()=>{if(ctl)ctl.abort()},
  "new-thread":()=>{S.ui.threadId=null;S.ui.attach="";S.ui.confirm=null;renderMain();const i=$("#cp-in");if(i)i.focus()},
  "open-thread":d=>{const t=S.data.threads[d.id];if(!t)return;S.ui.threadId=d.id;S.ui.mode=t.mode;S.ui.confirm=null;renderMain()},
  mode:d=>{S.ui.mode=d.mode;const t=S.ui.threadId&&S.data.threads[S.ui.threadId];if(t){Store.put("threads",{...cl(t),mode:d.mode})}renderMain()},
  starter:d=>{const th=S.ui.threadId&&S.data.threads[S.ui.threadId];const m=th?th.mode:S.ui.mode;S.ui.draft.copilot=(STARTERS[m]||[])[Number(d.i)]||"";renderMain();const i=$("#cp-in");if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length)}},
  "copy-msg":d=>{const t=S.data.threads[S.ui.threadId];const m=t&&t.messages[Number(d.i)];if(m)copy(m.content)},
  "nba-task":d=>{const t=S.data.threads[S.ui.threadId];const m=t&&t.messages[Number(d.i)];const a=m?extractNBA(m.content):"";
    if(!a){toast("Aucune NEXT BEST ACTION repérée dans cette réponse.");return}Store.put("tasks",{title:a,due:localISO(),done:false});toast("Tâche créée pour aujourd'hui.")},
  "copilot-from":d=>{const r=S.data[d.col]?.[d.id];if(!r)return;S.ui.edit=null;S.ui.threadId=null;S.ui.attach=`${d.col}:${d.id}`;S.ui.mode=d.mode;
    S.ui.draft.copilot=d.mode==="juridique"?`Avant toute approche de ${r.name} (âge : ${r.ageStatus}), quelles règles s'appliquent et que dois-je vérifier ?`:d.mode==="reseau"?`Comment préparer mon prochain échange avec ${r.name} ? Objectif : ${r.nextAction||"[à préciser]"}.`:`Analyse ce prospect à partir de sa fiche et dis-moi ce qui manque avant d'aller plus loin.`;
    S.ui.tab="copilot";renderAll();top0()},
  "copilot-quiz":()=>{const Q=S.ui.quiz;if(!Q||!Q.q)return;S.ui.threadId=null;S.ui.attach="";S.ui.mode="examen";
    S.ui.draft.copilot=`Question d'entraînement : ${Q.q.question}\nRéponse attendue : ${Q.q.options[Q.q.answer]} (${Q.q.reference}).\nJ'ai répondu : ${Q.q.options[Q.picked]}. Explique la règle, donne un second cas pratique et le piège classique.`;S.ui.tab="copilot";renderAll();top0()},
  "capture-run":()=>runCapture(),
  "capture-apply":()=>applyCapture(),
  "capture-clear":()=>{S.ui.capture={busy:false,result:null};renderMain()},
  "task-add":()=>{const t=S.ui.task;if(!String(t.title||"").trim())return;Store.put("tasks",{title:t.title.trim(),due:t.due||"",done:false});S.ui.task={title:"",due:""};renderMain();const i=$("#t-title");if(i)i.focus()},
  "task-toggle":d=>{const t=S.data.tasks[d.id];if(!t)return;const done=!t.done;Store.put("tasks",{...cl(t),done,doneAt:done?Date.now():null})},
  "quiz-new":()=>newQuestion(),
  "quiz-pick":d=>pickAnswer(Number(d.i)),
  brief:()=>runBrief(),
  "eval-run":d=>runEval(d.id),
  "eval-save":d=>{const c=EVALS.find(x=>x.id===d.id);const chk=S.ui.evalChecks[d.id]||{};const score=c.checks.filter((_,i)=>chk[i]).length;
    Store.put("evals",{caseId:d.id,ts:Date.now(),checks:cl(chk),score,output:String(S.ui.evalRun[d.id]?.text||"").slice(0,12000)});toast(`Résultat enregistré : ${score}/${c.checks.length}.`)},
  "save-profile":()=>{const p=S.ui.prof;p.stage=Math.max(0,Math.min(5,Number(p.stage)||0));p.represented=Math.max(0,Number(p.represented)||0);p.coolDays=Math.max(7,Number(p.coolDays)||45);
    const {lastBrief,...rest}=p;Store.setProfile(rest);S.ui.prof=null;toast("Contexte enregistré.");renderAll()},
  "copy-prompt":()=>copy(SYSTEM_PROMPT+"\n\n"+contextBlock()),
  export:()=>exportData(),
  "import-apply":async()=>{const ip=S.ui.importPreview;if(!ip)return;S.ui.importPreview=null;let n=0;
    if(ip.profile){const {lastBrief,...rest}=ip.profile;await Store.setProfile(rest)}
    for(const c of COLS)for(const r of Object.values(ip.data?.[c]||{})){if(r&&typeof r==="object"){await Store.put(c,r);n++}}
    toast(`${n} fiches importées.`);renderAll()},
  "import-cancel":()=>{S.ui.importPreview=null;renderMain()},
  "examples-load":()=>loadExamples(),
  "examples-clear":()=>clearExamples(),
  wipe:async()=>{S.ui.confirm=null;for(const c of COLS)for(const x of vals(c))await Store.del(c,x.id);await Store.setProfile({...DEFAULT_PROFILE});S.ui.prof=null;S.ui.threadId=null;toast("Toutes les données ont été effacées.");renderAll()}
};
const CH={
  attach:el=>{S.ui.attach=el.value;const t=S.ui.threadId&&S.data.threads[S.ui.threadId];if(t)Store.put("threads",{...cl(t),attach:el.value})},
  rerender:()=>renderMain(),
  import:el=>{const f=el.files&&el.files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{try{const p=JSON.parse(rd.result);if(p.app!=="agent-copilot"||!p.data)throw 0;S.ui.importPreview=p;renderMain()}catch(e){toast("Fichier non reconnu : utilise un export de cette page.")}};rd.readAsText(f)}
};
async function copy(text){try{await navigator.clipboard.writeText(text);toast("Copié.")}catch(e){toast("Copie impossible ici : sélectionne le texte à la main.")}}
async function exportData(){
  const payload=JSON.stringify({app:"agent-copilot",version:1,exportedAt:new Date().toISOString(),profile:S.profile,data:S.data},null,2);
  if(!S.downloads){toast("Export indisponible dans cette vue.");return}
  try{await S.downloads.save({filename:`agent-copilot-${localISO()}.json`,data:payload});toast("Export enregistré.")}
  catch(e){if(e&&e.code!=="declined")toast("Export impossible dans cette vue.")}
}

document.addEventListener("click",e=>{
  const el=e.target.closest("[data-act]");if(!el)return;
  if(el.tagName==="LABEL")return;
  const f=A[el.dataset.act];if(!f)return;
  if(el.type!=="checkbox")e.preventDefault();
  f(el.dataset,el);
});
document.addEventListener("input",e=>{const el=e.target;if(!el.dataset||!el.dataset.bind)return;setPath(S.ui,el.dataset.bind,el.type==="checkbox"?el.checked:el.value);if(el.dataset.live){renderMain();const n=$("#"+el.id);if(n){n.focus();n.setSelectionRange(n.value.length,n.value.length)}}});
document.addEventListener("change",e=>{const el=e.target;if(el.dataset&&el.dataset.bind&&(el.type==="checkbox"||el.tagName==="SELECT"))setPath(S.ui,el.dataset.bind,el.type==="checkbox"?el.checked:el.value);if(el.dataset&&el.dataset.change&&CH[el.dataset.change])CH[el.dataset.change](el)});
document.addEventListener("keydown",e=>{if((e.metaKey||e.ctrlKey)&&e.key==="Enter"){if(e.target.id==="cp-in"){e.preventDefault();send()}else if(e.target.id==="cap-in"){e.preventDefault();runCapture()}}});

(function(){const h=(location.hash||"").slice(1);if(TABS.some(t=>t[0]===h))S.ui.tab=h})();
Store.init();
