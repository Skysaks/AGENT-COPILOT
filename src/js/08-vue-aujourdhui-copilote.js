/* ============ views ============ */
function vToday(){
  const t=localISO(),st=Number(S.profile.stage)||0;
  const tasks=vals("tasks"),contacts=vals("contacts"),prospects=vals("prospects");
  const due=[];
  tasks.filter(x=>!x.done&&x.due&&x.due<=t).forEach(x=>due.push({kind:"Tâche",title:x.title,date:x.due,act:`data-act="tab" data-tab="tasks"`}));
  contacts.filter(c=>c.nextDate&&c.nextDate<=t).forEach(c=>due.push({kind:"Réseau",title:`${c.nextAction||"Prochaine action"} — ${c.name}`,date:c.nextDate,act:`data-act="edit" data-col="contacts" data-id="${c.id}"`}));
  prospects.filter(p=>p.nextDate&&p.nextDate<=t&&!["SIGNED","DROPPED"].includes(p.stage)).forEach(p=>due.push({kind:"Prospect",title:`${p.nextAction||"Prochaine action"} — ${p.name}`,date:p.nextDate,act:`data-act="edit" data-col="prospects" data-id="${p.id}"`}));
  due.sort((a,b)=>a.date.localeCompare(b.date));
  const cool=Number(S.profile.coolDays)||45;
  const cold=contacts.filter(c=>!c.lastInteraction||daysBetween(c.lastInteraction,t)>cool).sort((a,b)=>(a.lastInteraction||"").localeCompare(b.lastInteraction||"")).slice(0,6);
  const age=prospects.filter(p=>!["DROPPED"].includes(p.stage)&&p.ageStatus!=="majeur");
  const qs=quizStats();
  const emptyAll=!tasks.length&&!contacts.length&&!prospects.length&&!vals("sources").length;
  const ladder=STAGES.map((s,i)=>`<div class="rung ${i<st?"done":""} ${i===st?"on":""}"><b>${i}</b><span>${s[0]}</span></div>`).join("");
  const brief=S.ui.brief.text||(S.profile.lastBrief&&S.profile.lastBrief.date===t?S.profile.lastBrief.text:"");
  return `
  <section class="panel">
    <div class="panel-h"><h2>Où j'en suis</h2><span class="eyebrow">${fmtDate(t)}</span></div>
    <div class="ladder" aria-label="Progression">${ladder}</div>
    <p style="margin:0"><strong>Stage ${st} · ${STAGES[st][0]}.</strong> ${STAGES[st][1]}</p>
    <div class="stats"><span><b>${contacts.length}</b> contacts</span><span><b>${prospects.filter(p=>p.stage!=="DROPPED").length}</b> prospects</span><span><b>${tasks.filter(x=>!x.done).length}</b> tâches ouvertes</span><span>examen : ${qs.total?`<b>${qs.pct} %</b> sur ${qs.last} dernières · ${qs.avgSec} s/question`:"aucune question faite"}</span></div>
  </section>
  ${emptyAll?`<section class="empty"><h3>Commence ici</h3><ol>
    <li>Colle le texte officiel du règlement en vigueur dans <strong>Sources</strong>, puis entraîne-toi dans <strong>Examen</strong>.</li>
    <li>Après chaque échange, dicte ou tape une note dans <strong>Capture</strong> : contacts, tâches et faits sont extraits pour toi.</li>
    <li>Pose tes questions métier au <strong>Copilote</strong>, et vérifie son comportement dans le <strong>Banc d'essai</strong>.</li></ol>
    <div class="row"><button class="btn" data-act="examples-load">Charger des exemples</button><button class="btn primary" data-act="tab" data-tab="sources">Ajouter une source</button></div></section>`:""}
  <div class="grid2">
    <section class="panel">
      <div class="panel-h"><h2>À traiter</h2><span class="eyebrow">${due.length} élément${due.length>1?"s":""}</span></div>
      ${due.length?`<div class="list">${due.map(d=>`<div class="item click" ${d.act}><span class="eyebrow">${d.kind}</span><div class="t">${esc(d.title)}</div>${dueLabel(d.date)}</div>`).join("")}</div>`:`<p class="muted small" style="margin:0">Rien d'échu aujourd'hui.</p>`}
    </section>
    <section class="panel">
      <div class="panel-h"><h2>Brief du jour</h2>${S.ai==="on"?`<button class="btn sm" data-act="brief" ${S.ui.brief.busy?"disabled":""}>${S.ui.brief.busy?"En cours…":brief?"Regénérer":"Générer"}</button>`:""}</div>
      ${aiNote()}
      ${S.ui.brief.busy&&!S.ui.brief.text?`<p class="thinking">Réflexion…</p>`:brief?`<div class="md" id="brief-out">${md(brief)}</div>`:S.ai==="on"?`<p class="muted small" style="margin:0">Trois lignes et une action, tirées uniquement de tes tâches, contacts et prospects.</p>`:""}
    </section>
  </div>
  <div class="grid2">
    <section class="panel">
      <div class="panel-h"><h2>Conformité</h2><span class="eyebrow">prospects</span></div>
      ${age.length?`<div class="list">${age.map(p=>`<div class="item click" data-act="edit" data-col="prospects" data-id="${p.id}"><span class="${p.ageStatus==="mineur"?"card-r":"card-y"}"></span><div><div class="t">${esc(p.name)}</div><div class="m">${p.ageStatus==="mineur"?"Mineur : mode juridique obligatoire avant toute approche.":"Âge inconnu : à vérifier avant toute approche."}</div></div><span></span></div>`).join("")}</div>`:`<p class="muted small" style="margin:0">Aucun prospect mineur ou d'âge inconnu.</p>`}
    </section>
    <section class="panel">
      <div class="panel-h"><h2>Relations à réactiver</h2><span class="eyebrow">&gt; ${cool} jours</span></div>
      ${cold.length?`<div class="list">${cold.map(c=>`<div class="item click two" data-act="edit" data-col="contacts" data-id="${c.id}"><div><div class="t">${esc(c.name)}</div><div class="m">${esc([c.role,c.org].filter(Boolean).join(" · "))}</div></div>${agoLabel(c.lastInteraction)}</div>`).join("")}</div>`:`<p class="muted small" style="margin:0">Aucune relation inactive.</p>`}
    </section>
  </div>`;
}

function vCopilot(){
  const threads=vals("threads").sort((a,b)=>b.updatedAt-a.updatedAt);
  const th=S.ui.threadId?S.data.threads[S.ui.threadId]:null;
  const mode=th?th.mode:S.ui.mode;const attach=th?(th.attach||""):S.ui.attach;
  const opts=[...vals("prospects").map(p=>[`prospects:${p.id}`,"Prospect — "+p.name]),...vals("contacts").map(c=>[`contacts:${c.id}`,"Contact — "+c.name])];
  const nSrc=vals("sources").filter(s=>s.include!==false&&s.text).length;
  const msgs=th?th.messages:[];
  return `<section class="copilot">
    <aside class="threads" aria-label="Fils">
      <button class="btn primary" data-act="new-thread">Nouveau fil</button>
      ${threads.map(t=>`<button class="thread" aria-current="${t.id===S.ui.threadId}" data-act="open-thread" data-id="${t.id}"><span class="tm">${esc(MODES[t.mode]?.label||"Libre")} · ${fmtDate(localISO(new Date(t.updatedAt)))}</span><span class="tt">${esc(t.title)}</span></button>`).join("")}
    </aside>
    <div class="panel" style="padding:14px">
      <div class="modes" role="group" aria-label="Mode">${Object.entries(MODES).map(([k,m])=>`<button class="chip" aria-pressed="${k===mode}" data-act="mode" data-mode="${k}">${m.label}</button>`).join("")}</div>
      <div class="row small">
        <label class="f" style="flex:1 1 240px"><span>Fiche jointe</span><select id="cp-attach" data-change="attach"><option value="">Aucune</option>${opts.map(([v,l])=>`<option value="${v}"${sel(v,attach)}>${esc(l)}</option>`).join("")}</select></label>
        <label class="check" style="align-self:end;padding-bottom:8px"><input type="checkbox" id="cp-deep" data-bind="deep" ${S.ui.deep?"checked":""}> Analyse approfondie</label>
        ${MODES[mode].sources?`<span class="pill ${nSrc?"ok":"late"}" style="align-self:end;margin-bottom:9px">${nSrc} source${nSrc>1?"s":""} incluse${nSrc>1?"s":""}</span>`:""}
      </div>
      ${aiNote()}
      <div class="msgs" id="msgs">
        ${!msgs.length&&!S.ui.busy?`<div class="starters"><span class="eyebrow">Pour démarrer · ${esc(MODES[mode].label)}</span>${(STARTERS[mode]||[]).map((s,i)=>`<button class="starter" data-act="starter" data-i="${i}">${esc(s)}</button>`).join("")}</div>`:""}
        ${msgs.map((m,i)=>m.role==="user"?`<div class="msg-u">${esc(m.content)}</div>`:`<div class="msg-a"><div class="md">${md(m.content)}</div><div class="acts"><button class="btn ghost sm" data-act="copy-msg" data-i="${i}">Copier</button><button class="btn ghost sm" data-act="nba-task" data-i="${i}">Action → tâche</button></div></div>`).join("")}
        ${S.ui.busy?`<div class="msg-a"><div class="md" id="stream">${S.ui.streamText?md(S.ui.streamText):'<p class="thinking">Réflexion…</p>'}</div></div>`:""}
      </div>
      <div class="composer">
        <textarea id="cp-in" data-bind="draft.copilot" rows="3" placeholder="Décris la situation, colle un message, pose ta question…">${esc(S.ui.draft.copilot)}</textarea>
        <div class="row"><button class="btn primary" data-act="send" ${S.ui.busy||S.ai!=="on"?"disabled":""}>Envoyer</button>${S.ui.busy?`<button class="btn" data-act="stop">Arrêter</button>`:""}<span class="spacer"></span><span class="eyebrow">Ctrl / ⌘ + Entrée</span>
        ${th?(S.ui.confirm===`thread:${th.id}`?`<button class="btn danger solid sm" data-act="del" data-col="threads" data-id="${th.id}">Confirmer la suppression</button>`:`<button class="btn ghost sm" data-act="askdel" data-key="thread:${th.id}">Supprimer le fil</button>`):""}</div>
      </div>
    </div>
  </section>`;
}

