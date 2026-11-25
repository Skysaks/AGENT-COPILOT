/* ============ context builders ============ */
function contextBlock(){
  const p=S.profile,st=Number(p.stage)||0;
  return `CONTEXTE AU ${localISO()} : Stage ${st} (${STAGES[st][0]}). Joueurs représentés : ${p.represented}. Licence : ${p.licence}. Positionnement : ${p.positioning}. Disponibilité : ${p.hours} h/semaine. Langue de réponse : ${p.lang}.`;
}
function sourcesBlock(budget=150000){
  const src=vals("sources").filter(s=>s.include!==false&&s.text);
  if(!src.length)return"\n\nSOURCES : aucune source fournie. Toute règle citée doit donc être marquée UNRESOLVED / VERIFY.";
  const per=Math.floor(budget/src.length);
  return "\n\nSOURCES FOURNIES (seuls textes citables comme RULE CONFIRMED) :\n"+src.map(s=>{
    const t=s.text.length>per?s.text.slice(0,per)+"\n[…extrait tronqué pour tenir dans le contexte]":s.text;
    return `=== ${s.title} — ${s.issuer||"émetteur non précisé"} — version du ${s.versionDate||"date inconnue"} ===\n${t}`;}).join("\n\n");
}
function slimRecord(col,r){
  if(!r)return null;const o=cl(r);delete o.updatedAt;delete o.createdAt;delete o.example;
  if(col==="contacts"&&o.journal)o.journal=o.journal.slice(-8);
  return o;
}
function buildRules(mode,attach){
  const M=MODES[mode]||MODES.libre;
  let t=SYSTEM_PROMPT+"\n\n"+contextBlock()+`\n\nMODE ACTIF : ${M.label}. ${M.instr}`;
  if(attach){const [col,id]=attach.split(":");const r=S.data[col]?.[id];if(r)t+=`\n\nFICHE JOINTE (${col==="contacts"?"contact":"prospect"}, USER-PROVIDED, non vérifiée) :\n`+JSON.stringify(slimRecord(col,r));}
  if(M.sources)t+=sourcesBlock();
  return t+"\n\nRéponds maintenant au message suivant.";
}
function compactSnapshot(){
  const t=localISO();
  return JSON.stringify({
    date:t,
    taches_ouvertes:vals("tasks").filter(x=>!x.done).slice(0,40).map(x=>({titre:x.title,echeance:x.due||null})),
    contacts:vals("contacts").slice(0,60).map(c=>({nom:c.name,role:c.role,org:c.org,derniere_interaction:c.lastInteraction||null,prochaine_action:c.nextAction||null,date:c.nextDate||null})),
    prospects:vals("prospects").filter(p=>p.stage!=="DROPPED").slice(0,40).map(p=>({nom:p.name,etape:p.stage,age:p.ageStatus,prochaine_action:p.nextAction||null,date:p.nextDate||null})),
    examen:quizStats()
  });
}
function quizStats(){
  const r=vals("quiz").sort((a,b)=>b.ts-a.ts);const last=r.slice(0,20);
  if(!last.length)return{total:0};
  const ok=last.filter(x=>x.correct).length;const sec=Math.round(last.reduce((a,x)=>a+(x.seconds||0),0)/last.length);
  return{total:r.length,last:last.length,pct:Math.round(ok*100/last.length),avgSec:sec};
}

