function vCapture(){
  const c=S.ui.capture,r=c.result;
  const ck=(path,on)=>`<input type="checkbox" data-bind="${path}" ${on!==false?"checked":""}>`;
  let review="";
  if(r){
    const sec=(title,arr,fn)=>arr&&arr.length?`<div><div class="eyebrow" style="margin-bottom:4px">${title}</div><div class="list">${arr.map(fn).join("")}</div></div>`:"";
    review=`<section class="panel"><div class="panel-h"><h2>À enregistrer</h2><span class="eyebrow">décoche ce qui est faux</span></div>
      ${r.summary?`<p style="margin:0">${esc(r.summary)}</p>`:""}
      ${r.sensitive_flag?`<p class="small" style="margin:0"><span class="card-y" style="margin-right:6px;vertical-align:-2px"></span>La note contient une information sensible (santé ou autre). Elle n'a pas été extraite.</p>`:""}
      ${sec("Contacts",r.contacts,(x,i)=>`<label class="item check">${ck(`capture.result.contacts.${i}._on`,x._on)}<div><div class="t">${esc(x.name)}</div><div class="m">${esc([x.role,x.org].filter(Boolean).join(" · "))} ${x.match_id&&S.data.contacts[x.match_id]?"· mise à jour d'une fiche existante":"· nouvelle fiche"}</div></div><span></span></label>`)}
      ${sec("Prospects",r.prospects,(x,i)=>`<label class="item check">${ck(`capture.result.prospects.${i}._on`,x._on)}<div><div class="t">${esc(x.name)}</div><div class="m">${esc([x.position,x.club].filter(Boolean).join(" · "))} · âge : ${esc(x.age_info||"inconnu")}</div></div>${x.age_info!=="majeur"?`<span class="${x.age_info==="mineur"?"card-r":"card-y"}"></span>`:"<span></span>"}</label>`)}
      ${sec("Échanges au journal",r.interactions,(x,i)=>`<label class="item check">${ck(`capture.result.interactions.${i}._on`,x._on)}<div><div class="t">${esc(x.contact_name)}</div><div class="m">${esc(x.summary)}</div></div><span class="pill">${fmtDate(x.date)}</span></label>`)}
      ${sec("Faits",r.facts,(x,i)=>`<label class="item check">${ck(`capture.result.facts.${i}._on`,x._on)}<div><div class="t">${esc(x.text)}</div><div class="m">${esc(x.about)}</div></div>${stChip(x.status||"USER-PROVIDED")}</label>`)}
      ${sec("Tâches",r.tasks,(x,i)=>`<label class="item check">${ck(`capture.result.tasks.${i}._on`,x._on)}<div class="t">${esc(x.title)}</div>${x.due?dueLabel(x.due):"<span></span>"}</label>`)}
      ${r.open_questions&&r.open_questions.length?`<div><div class="eyebrow">Questions ouvertes</div><ul style="margin:4px 0 0;padding-left:20px">${r.open_questions.map(q=>`<li>${esc(q)}</li>`).join("")}</ul></div>`:""}
      <div class="row"><button class="btn primary" data-act="capture-apply">Enregistrer la sélection</button><button class="btn ghost" data-act="capture-clear">Annuler</button></div></section>`;
  }
  return `<section class="panel">
    <div class="panel-h"><h2>Capture</h2><span class="eyebrow">note brute → fiches</span></div>
    <p class="muted small" style="margin:0">Après un appel ou un rendez-vous, écris ou dicte (micro du clavier) ce qui s'est passé. Le copilote propose contacts, échanges, faits avec leur statut et tâches datées. Rien n'est enregistré sans ta validation.</p>
    ${aiNote()}
    <textarea id="cap-in" data-bind="draft.capture" rows="6" placeholder="Ex. : Appel avec le responsable recrutement de [club] : il dit chercher un 6 gaucher U21 pour janvier, budget non communiqué. Rappeler mardi. Il connaît bien l'entraîneur des U19 de [autre club].">${esc(S.ui.draft.capture)}</textarea>
    <div class="row"><button class="btn primary" data-act="capture-run" ${c.busy||S.ai!=="on"?"disabled":""}>${c.busy?"Structuration…":"Structurer"}</button><span class="eyebrow">Ctrl / ⌘ + Entrée</span></div>
  </section>${review}`;
}

function contactEditor(o,isNew){
  const b=k=>`data-bind="edit.obj.${k}"`;
  const j=(o.journal||[]).slice().map((e,i)=>({...e,i})).sort((a,b)=>(b.date||"").localeCompare(a.date||""));
  return `<section class="panel" id="editor"><div class="panel-h"><h2>${isNew?"Nouveau contact":esc(o.name||"Contact")}</h2>${o.example?`<span class="pill now">exemple</span>`:""}</div>
  <div class="fgrid">
    <label class="f"><span>Nom</span><input type="text" id="c-name" ${b("name")} value="${esc(o.name)}"></label>
    <label class="f"><span>Rôle</span><select id="c-role" ${b("role")}><option value="">—</option>${ROLES.map(r=>`<option${sel(r,o.role)}>${r}</option>`).join("")}</select></label>
    <label class="f"><span>Organisation</span><input type="text" id="c-org" ${b("org")} value="${esc(o.org)}"></label>
    <label class="f"><span>Canal préféré</span><input type="text" id="c-ch" ${b("channel")} value="${esc(o.channel)}" placeholder="WhatsApp, e-mail, LinkedIn…"></label>
    <label class="f wide"><span>Pourquoi cette personne compte</span><textarea id="c-why" rows="2" ${b("why")}>${esc(o.why)}</textarea></label>
    <label class="f wide"><span>Ce que je peux lui apporter</span><textarea id="c-val" rows="2" ${b("value")}>${esc(o.value)}</textarea></label>
    <label class="f"><span>Dernier échange</span><input type="date" id="c-last" ${b("lastInteraction")} value="${esc(o.lastInteraction)}"></label>
    <label class="f"><span>Prochaine action</span><input type="text" id="c-next" ${b("nextAction")} value="${esc(o.nextAction)}"></label>
    <label class="f"><span>Échéance</span><input type="date" id="c-nextd" ${b("nextDate")} value="${esc(o.nextDate)}"></label>
    <label class="f wide"><span>Notes</span><textarea id="c-notes" rows="2" ${b("notes")}>${esc(o.notes)}</textarea></label>
  </div>
  <div><div class="eyebrow" style="margin-bottom:4px">Journal des échanges</div>
    ${j.length?`<div class="list">${j.map(e=>`<div class="item"><span class="pill">${fmtDate(e.date)}</span><div class="t" style="font-weight:400">${esc(e.summary)}</div><button class="btn ghost sm" data-act="rm-journal" data-i="${e.i}" aria-label="Retirer">✕</button></div>`).join("")}</div>`:`<p class="muted small" style="margin:0">Aucun échange noté.</p>`}
    <div class="row" style="margin-top:8px"><input type="date" id="j-date" data-bind="journal.date" value="${esc(S.ui.journal.date||localISO())}" style="width:auto"><input type="text" id="j-sum" data-bind="journal.summary" value="${esc(S.ui.journal.summary)}" placeholder="Ce qui a été dit, promis, appris" style="flex:1 1 220px"><button class="btn sm" data-act="add-journal">Ajouter</button></div>
  </div>
  <div class="row"><button class="btn primary" data-act="save-edit">Enregistrer</button><button class="btn" data-act="cancel-edit">Fermer</button>
    ${!isNew?`<button class="btn" data-act="copilot-from" data-col="contacts" data-id="${o.id}" data-mode="reseau">Préparer un échange</button>`:""}
    <span class="spacer"></span>${!isNew?delBtn("contacts",o.id):""}</div>
  <p class="small muted" style="margin:0">Ne note que ce qui sert la relation. Pas de données de santé ni d'informations privées inutiles.</p></section>`;
}
function delBtn(col,id){const k=`${col}:${id}`;return S.ui.confirm===k?`<button class="btn danger solid sm" data-act="del" data-col="${col}" data-id="${id}">Confirmer la suppression</button>`:`<button class="btn danger sm" data-act="askdel" data-key="${k}">Supprimer</button>`}

function vNetwork(){
  const e=S.ui.edit&&S.ui.edit.col==="contacts"?S.ui.edit:null;
  const q=S.ui.search.toLowerCase(),rf=S.ui.roleFilter;
  const list=vals("contacts").filter(c=>(!rf||c.role===rf)&&(!q||[c.name,c.org,c.role,c.notes].join(" ").toLowerCase().includes(q))).sort((a,b)=>(a.nextDate||"9999").localeCompare(b.nextDate||"9999")||a.name.localeCompare(b.name));
  return `${e?contactEditor(e.obj,e.isNew):""}
  <section class="panel"><div class="panel-h"><h2>Réseau</h2><button class="btn primary sm" data-act="new" data-col="contacts">Nouveau contact</button></div>
    <div class="row"><input type="search" id="n-search" data-bind="search" data-live="1" value="${esc(S.ui.search)}" placeholder="Rechercher" style="flex:1 1 200px"><select id="n-role" data-bind="roleFilter" data-change="rerender" style="width:auto"><option value="">Tous les rôles</option>${ROLES.map(r=>`<option${sel(r,rf)}>${r}</option>`).join("")}</select></div>
    ${list.length?`<div class="list">${list.map(c=>`<div class="item click two" data-act="edit" data-col="contacts" data-id="${c.id}"><div style="min-width:0"><div class="t">${esc(c.name)} ${c.example?`<span class="pill now">exemple</span>`:""}</div><div class="m">${esc([c.role,c.org].filter(Boolean).join(" · "))}${c.nextAction?` — ${esc(c.nextAction)}`:""}</div></div><div class="row" style="justify-content:flex-end">${c.nextDate?dueLabel(c.nextDate):""}${agoLabel(c.lastInteraction)}</div></div>`).join("")}</div>`
      :`<div class="empty"><h3>Aucun contact${q||rf?" pour ce filtre":""}</h3><p style="margin:0">Ajoute les personnes qui comptent : recruteurs, entraîneurs, agents licenciés, dirigeants. Pour chacune, note pourquoi elle compte et ce que tu peux lui apporter.</p></div>`}
  </section>`;
}

