/* ============ AI actions ============ */
function fitThread(th){
  th.messages=th.messages.slice(-40).map(m=>({...m,content:String(m.content).slice(0,30000)}));
  while(JSON.stringify(th).length>180000&&th.messages.length>2)th.messages.shift();
  return th;
}
async function send(){
  const text=(S.ui.draft.copilot||"").trim();if(!text||S.ui.busy)return;
  if(!S.sample||S.ai!=="on"){toast("Claude n'est pas disponible dans cette vue.");return}
  let th=S.ui.threadId&&S.data.threads[S.ui.threadId]?cl(S.data.threads[S.ui.threadId]):{id:uid(),mode:S.ui.mode,attach:S.ui.attach||"",title:text.slice(0,80),messages:[]};
  S.ui.threadId=th.id;
  th.messages.push({role:"user",content:text,ts:Date.now()});
  S.ui.draft.copilot="";S.ui.busy=true;S.ui.streamText="";
  Store.put("threads",fitThread(cl(th)));renderAll();
  const el=$("#stream");if(el)el.scrollIntoView({block:"nearest"});
  const input=[{role:"user",content:buildRules(th.mode,th.attach)},...th.messages.slice(-24).map(m=>({role:m.role,content:m.content}))];
  ctl=new AbortController();
  try{
    const r=await S.sample(input,{cache:false,signal:ctl.signal,modelTier:S.ui.deep?"complex":"default",onText:({text})=>{S.ui.streamText=text;const s=$("#stream");if(s)s.innerHTML=md(text)}});
    th.messages.push({role:"assistant",content:r.text+(r.truncated?"\n\n_Réponse tronquée : demande une suite ou découpe la question._":""),ts:Date.now()});
  }catch(e){
    if(e&&e.text)th.messages.push({role:"assistant",content:e.text+"\n\n_Réponse interrompue._",ts:Date.now()});
    const m=aiError(e);if(m)toast(m);
  }finally{
    S.ui.busy=false;S.ui.streamText="";ctl=null;
    Store.put("threads",fitThread(th));renderAll();
  }
}
async function runBrief(){
  if(!S.sample||S.ui.brief.busy)return;
  S.ui.brief={busy:true,text:""};renderMain();
  const prompt=SYSTEM_PROMPT+"\n\n"+contextBlock()+`\n\nTÂCHE : brief du jour. À partir des DONNÉES ci-dessous uniquement, donne en 120 mots maximum :
1) ce qui exige mon attention aujourd'hui (trois lignes au plus) ;
2) le principal risque ou blocage ;
3) un titre NEXT BEST ACTION suivi d'une seule action spécifique, faisable aujourd'hui.
N'invente aucun élément absent des données. Si les données sont maigres, dis quelle information ajouter en premier.

DONNÉES (USER-PROVIDED) :
${compactSnapshot()}`;
  try{
    const r=await S.sample(prompt,{cache:false,onText:({text})=>{S.ui.brief.text=text;const o=$("#brief-out");if(o)o.innerHTML=md(text);else if(S.ui.tab==="today")renderMain()}});
    S.ui.brief={busy:false,text:r.text};Store.setProfile({lastBrief:{date:localISO(),text:r.text}});
  }catch(e){S.ui.brief={busy:false,text:S.ui.brief.text};const m=aiError(e);if(m)toast(m)}
  renderAll();
}
async function runCapture(){
  const note=(S.ui.draft.capture||"").trim();if(!note||S.ui.capture.busy)return;
  if(!S.sample||S.ai!=="on"){toast("Claude n'est pas disponible dans cette vue.");return}
  S.ui.capture={busy:true,result:null};renderMain();
  const C=vals("contacts").map(c=>`${c.id}: ${c.name} — ${c.role||"?"} — ${c.org||"?"}`).join("\n")||"(aucun)";
  const P=vals("prospects").map(p=>`${p.id}: ${p.name} — ${p.position||"?"} — ${p.club||"?"}`).join("\n")||"(aucun)";
  const prompt=`Tu structures la note brute d'un agent de football (Stage ${S.profile.stage}). Date du jour : ${localISO()}. Convertis les dates relatives (« vendredi », « demain », « la semaine prochaine ») en dates AAAA-MM-JJ postérieures ou égales à aujourd'hui.
Règles :
- N'extrais que ce que la note dit. N'invente rien.
- Statut des faits : USER-PROVIDED si l'agent l'affirme ou l'a constaté ; RUMOUR si c'est rapporté par un tiers ou non confirmé (« il paraît », « on m'a dit », « il cherche » dit par quelqu'un) ; INFERENCE si c'est une déduction.
- N'extrais aucune donnée de santé (blessure, médical, psychologique) : mets seulement "sensitive_flag": true.
- age_info : "mineur" si moins de 18 ans est indiqué, "majeur" si 18 ans ou plus est indiqué, sinon "inconnu".
- Associe les personnes aux fiches existantes par match_id quand c'est clairement la même personne, sinon null.
Contacts existants (id: nom — rôle — organisation) :
${C}
Prospects existants (id: nom — poste — club) :
${P}
Rôles possibles : ${ROLES.join(", ")}.

Réponds avec UNIQUEMENT un objet JSON de cette forme :
{"summary":"une phrase","contacts":[{"name":"","role":null,"org":null,"match_id":null}],"prospects":[{"name":"","position":null,"club":null,"age_info":"inconnu","match_id":null}],"interactions":[{"contact_name":"","date":"AAAA-MM-JJ","summary":""}],"facts":[{"about":"","text":"","status":"USER-PROVIDED"}],"tasks":[{"title":"","due":null}],"open_questions":[""],"sensitive_flag":false}

NOTE :
"""
${note.slice(0,20000)}
"""`;
  try{
    const r=await S.sample.json(prompt,{cache:false});
    const arr=k=>Array.isArray(r?.[k])?r[k].filter(x=>x&&typeof x==="object").map(x=>({...x,_on:true})):[];
    S.ui.capture={busy:false,result:{summary:String(r?.summary||""),contacts:arr("contacts").filter(x=>x.name),prospects:arr("prospects").filter(x=>x.name),
      interactions:arr("interactions").filter(x=>x.contact_name&&x.summary),facts:arr("facts").filter(x=>x.text),tasks:arr("tasks").filter(x=>x.title),
      open_questions:Array.isArray(r?.open_questions)?r.open_questions.filter(q=>typeof q==="string"&&q.trim()):[],sensitive_flag:!!r?.sensitive_flag}};
  }catch(e){S.ui.capture={busy:false,result:null};const m=aiError(e);if(m)toast(m)}
  renderAll();
}
async function applyCapture(){
  const r=S.ui.capture.result;if(!r)return;const t=localISO();
  const iso=d=>/^\d{4}-\d{2}-\d{2}$/.test(d||"")?d:null;
  const byName={};const norm=s=>String(s||"").trim().toLowerCase();
  for(const c of vals("contacts"))byName[norm(c.name)]=cl(c);
  const touched={};
  for(const x of r.contacts.filter(x=>x._on)){
    let c=x.match_id&&S.data.contacts[x.match_id]?cl(S.data.contacts[x.match_id]):byName[norm(x.name)]||null;
    if(!c)c={id:uid(),name:x.name,role:ROLES.includes(x.role)?x.role:(x.role?"Autre":""),org:x.org||"",journal:[]};
    else{if(!c.role&&x.role)c.role=ROLES.includes(x.role)?x.role:"Autre";if(!c.org&&x.org)c.org=x.org}
    byName[norm(c.name)]=c;byName[norm(x.name)]=c;touched[c.id]=c;
  }
  for(const x of r.interactions.filter(x=>x._on)){
    let c=byName[norm(x.contact_name)];
    if(!c){c={id:uid(),name:x.contact_name,role:"",org:"",journal:[]};byName[norm(x.contact_name)]=c}
    const d=iso(x.date)||t;c.journal=[...(c.journal||[]),{date:d,summary:x.summary}];
    if(!c.lastInteraction||d>c.lastInteraction)c.lastInteraction=d;touched[c.id]=c;
  }
  const pBy={};for(const p of vals("prospects"))pBy[norm(p.name)]=cl(p);
  const pTouched={};
  for(const x of r.prospects.filter(x=>x._on)){
    let p=x.match_id&&S.data.prospects[x.match_id]?cl(S.data.prospects[x.match_id]):pBy[norm(x.name)]||null;
    const age=["mineur","majeur","inconnu"].includes(x.age_info)?x.age_info:"inconnu";
    if(!p)p={id:uid(),name:x.name,position:x.position||"",club:x.club||"",ageStatus:age,ageSource:age!=="inconnu"?"Note (USER-PROVIDED)":"",stage:"DISCOVERED",contractStatus:"UNKNOWN",facts:[]};
    else{if(!p.position&&x.position)p.position=x.position;if(!p.club&&x.club)p.club=x.club;if(p.ageStatus==="inconnu"&&age!=="inconnu")p.ageStatus=age}
    pBy[norm(x.name)]=p;pTouched[p.id]=p;
  }
  for(const f of r.facts.filter(x=>x._on)){
    const st=FACT_ST.includes(f.status)?f.status:"USER-PROVIDED";
    const p=pBy[norm(f.about)];
    if(p){p.facts=[...(p.facts||[]),{text:f.text,status:st,source:"Capture du "+fmtDate(t)}];pTouched[p.id]=p;continue}
    const c=byName[norm(f.about)];
    if(c){c.notes=((c.notes?c.notes+"\n":"")+`[${st}] ${f.text}`);touched[c.id]=c}
  }
  const ops=[...Object.values(touched).map(c=>Store.put("contacts",c)),...Object.values(pTouched).map(p=>Store.put("prospects",p)),
    ...r.tasks.filter(x=>x._on).map(x=>Store.put("tasks",{title:x.title,due:iso(x.due)||"",done:false}))];
  await Promise.all(ops);
  const n=Object.keys(touched).length+Object.keys(pTouched).length+r.tasks.filter(x=>x._on).length;
  S.ui.capture={busy:false,result:null};S.ui.draft.capture="";
  toast(`${n} fiche${n>1?"s":""} enregistrée${n>1?"s":""}.`);renderAll();
}
async function newQuestion(){
  const src=S.data.sources[S.ui.quizSrc];if(!src||!src.text||!S.sample)return;
  S.ui.quiz={loading:true};renderMain();
  const txt=src.text,W=14000;const start=txt.length>W?Math.floor(Math.random()*(txt.length-W)):0;const ex=txt.slice(start,start+W);
  const recent=vals("quiz").sort((a,b)=>b.ts-a.ts).slice(0,6).map(h=>h.reference).filter(Boolean);
  const prompt=`Tu prépares un candidat à l'examen d'agent de football FIFA (QCM, livre ouvert). Utilise UNIQUEMENT l'extrait ci-dessous. N'invente aucun article : la référence doit figurer dans l'extrait.
Source : ${src.title} — ${src.issuer||"émetteur non précisé"} — version ${src.versionDate||"non datée"}.
${S.ui.quizTheme?`Thème souhaité si l'extrait le couvre : ${S.ui.quizTheme}.`:""}
${recent.length?`Évite ces références déjà posées : ${recent.join(" ; ")}.`:""}
Crée UNE question de mise en situation (cas concret vécu par un agent), quatre options plausibles, une seule correcte. Les mauvaises options doivent correspondre à des erreurs fréquentes.
Réponds avec UNIQUEMENT un objet JSON : {"question":"","options":["","","",""],"answer":0,"reference":"article et alinéa tels qu'écrits dans l'extrait","quote":"phrase copiée mot pour mot depuis l'extrait, 35 mots maximum","explanation":"2 ou 3 phrases","trap":"le piège classique en une phrase"}

EXTRAIT :
"""
${ex}
"""`;
  try{
    const q=await S.sample.json(prompt,{cache:false});
    if(!q||typeof q.question!=="string"||!Array.isArray(q.options)||q.options.length!==4||![0,1,2,3].includes(Number(q.answer)))throw{code:"invalid_json"};
    q.answer=Number(q.answer);q.options=q.options.map(String);
    const n=s=>String(s||"").toLowerCase().replace(/[’‘]/g,"'").replace(/[«»“”"]/g,"").replace(/\s+/g," ").trim();
    const verified=!!q.quote&&n(q.quote).length>12&&n(txt).includes(n(q.quote));
    S.ui.quiz={q,verified,startedAt:Date.now(),picked:null,srcId:src.id,srcTitle:src.title};
  }catch(e){S.ui.quiz=null;const m=aiError(e);if(m)toast(m)}
  renderMain();
}
function pickAnswer(i){
  const Q=S.ui.quiz;if(!Q||!Q.q||Q.picked!=null)return;
  Q.picked=i;Q.seconds=Math.floor((Date.now()-Q.startedAt)/1000);clearInterval(timerInt);
  Store.put("quiz",{ts:Date.now(),sourceId:Q.srcId,question:Q.q.question.slice(0,400),reference:String(Q.q.reference||"").slice(0,120),correct:i===Q.q.answer,seconds:Q.seconds,verified:Q.verified});
  renderMain();
}
async function runEval(id){
  const c=EVALS.find(x=>x.id===id);if(!c||!S.sample)return;
  S.ui.evalRun[id]={busy:true,text:""};S.ui.evalChecks[id]={};renderMain();
  ctl=new AbortController();
  try{
    const r=await S.sample([{role:"user",content:buildRules("libre","")},{role:"user",content:c.prompt}],{cache:false,signal:ctl.signal,onText:({text})=>{S.ui.evalRun[id].text=text;const o=$("#ev-"+id);if(o)o.innerHTML=md(text)}});
    S.ui.evalRun[id]={busy:false,text:r.text};
  }catch(e){S.ui.evalRun[id]={busy:false,text:e&&e.text||""};const m=aiError(e);if(m)toast(m)}
  ctl=null;renderMain();
}

