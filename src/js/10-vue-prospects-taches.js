function prospectEditor(o,isNew){
  const b=k=>`data-bind="edit.obj.${k}"`;
  const facts=o.facts||[];
  return `<section class="panel" id="editor"><div class="panel-h"><h2>${isNew?"Nouveau prospect":esc(o.name||"Prospect")}</h2>${o.example?`<span class="pill now">exemple</span>`:""}</div>
  ${o.ageStatus!=="majeur"?`<p class="small" style="margin:0;display:flex;gap:8px"><span class="${o.ageStatus==="mineur"?"card-r":"card-y"}"></span><span>${o.ageStatus==="mineur"?"Joueur mineur : passe par le mode juridique et les représentants légaux avant toute approche.":"Âge non vérifié : confirme-le avant toute stratégie d'approche."}</span></p>`:""}
  <div class="fgrid">
    <label class="f"><span>Nom</span><input type="text" id="p-name" ${b("name")} value="${esc(o.name)}"></label>
    <label class="f"><span>Poste</span><input type="text" id="p-pos" ${b("position")} value="${esc(o.position)}"></label>
    <label class="f"><span>Club</span><input type="text" id="p-club" ${b("club")} value="${esc(o.club)}"></label>
    <label class="f"><span>Championnat</span><input type="text" id="p-league" ${b("league")} value="${esc(o.league)}"></label>
    <label class="f"><span>Âge</span><select id="p-age" ${b("ageStatus")} data-change="rerender"><option value="inconnu"${sel("inconnu",o.ageStatus)}>Inconnu</option><option value="mineur"${sel("mineur",o.ageStatus)}>Mineur (moins de 18 ans)</option><option value="majeur"${sel("majeur",o.ageStatus)}>Majeur (vérifié)</option></select></label>
    <label class="f"><span>Source de l'âge</span><input type="text" id="p-ages" ${b("ageSource")} value="${esc(o.ageSource)}" placeholder="Fiche officielle, club, joueur…"></label>
    <label class="f"><span>Fin de contrat</span><input type="text" id="p-ce" ${b("contractEnd")} value="${esc(o.contractEnd)}" placeholder="ex. juin 2027"></label>
    <label class="f"><span>Statut de cette info</span><select id="p-ces" ${b("contractStatus")}>${FACT_ST.map(s=>`<option${sel(s,o.contractStatus||"UNKNOWN")}>${s}</option>`).join("")}</select></label>
    <label class="f"><span>Étape</span><select id="p-stage" ${b("stage")}>${PSTAGES.map(([k,l])=>`<option value="${k}"${sel(k,o.stage)}>${l}</option>`).join("")}</select></label>
    <label class="f wide"><span>Pourquoi intéressant</span><textarea id="p-why" rows="2" ${b("whyInteresting")}>${esc(o.whyInteresting)}</textarea></label>
    <label class="f"><span>Pourquoi maintenant</span><textarea id="p-now" rows="2" ${b("whyNow")}>${esc(o.whyNow)}</textarea></label>
    <label class="f"><span>Pourquoi moi</span><textarea id="p-me" rows="2" ${b("whyMe")}>${esc(o.whyMe)}</textarea></label>
    <label class="f"><span>Accès légitime</span><textarea id="p-acc" rows="2" ${b("access")}>${esc(o.access)}</textarea></label>
    <label class="f"><span>Signaux d'alerte</span><textarea id="p-red" rows="2" ${b("redFlags")}>${esc(o.redFlags)}</textarea></label>
    <label class="f"><span>Prochaine action</span><input type="text" id="p-next" ${b("nextAction")} value="${esc(o.nextAction)}"></label>
    <label class="f"><span>Échéance</span><input type="date" id="p-nextd" ${b("nextDate")} value="${esc(o.nextDate)}"></label>
  </div>
  <div><div class="eyebrow" style="margin-bottom:4px">Faits et leur statut</div>
    ${facts.length?`<div class="list">${facts.map((f,i)=>`<div class="item" style="grid-template-columns:minmax(0,1fr) auto auto"><input type="text" id="pf-t-${i}" data-bind="edit.obj.facts.${i}.text" value="${esc(f.text)}"><select id="pf-s-${i}" data-bind="edit.obj.facts.${i}.status" style="width:auto">${FACT_ST.map(s=>`<option${sel(s,f.status)}>${s}</option>`).join("")}</select><button class="btn ghost sm" data-act="rm-fact" data-i="${i}" aria-label="Retirer">✕</button></div>`).join("")}</div>`:`<p class="muted small" style="margin:0">Aucun fait noté.</p>`}
    <button class="btn sm" style="margin-top:8px" data-act="add-fact">Ajouter un fait</button>
  </div>
  <div class="row"><button class="btn primary" data-act="save-edit">Enregistrer</button><button class="btn" data-act="cancel-edit">Fermer</button>
    ${!isNew?`<button class="btn" data-act="copilot-from" data-col="prospects" data-id="${o.id}" data-mode="${o.ageStatus==="majeur"?"prospect":"juridique"}">${o.ageStatus==="majeur"?"Analyser avec le copilote":"Vérifier le cadre juridique"}</button>`:""}
    <span class="spacer"></span>${!isNew?delBtn("prospects",o.id):""}</div>
  <p class="small muted" style="margin:0">Données minimales : pas de santé, pas de vie privée. Tu devras informer la personne que tu conserves ces informations (RGPD).</p></section>`;
}
function vProspects(){
  const e=S.ui.edit&&S.ui.edit.col==="prospects"?S.ui.edit:null;
  const all=vals("prospects"),f=S.ui.pFilter;
  const cnt=Object.fromEntries(PSTAGES.map(([k])=>[k,all.filter(p=>p.stage===k).length]));
  const list=all.filter(p=>f?p.stage===f:p.stage!=="DROPPED");
  const groups=PSTAGES.filter(([k])=>list.some(p=>p.stage===k));
  return `${e?prospectEditor(e.obj,e.isNew):""}
  <section class="panel"><div class="panel-h"><h2>Prospects</h2><button class="btn primary sm" data-act="new" data-col="prospects">Nouveau prospect</button></div>
    <div class="modes"><button class="chip" aria-pressed="${!f}" data-act="pfilter" data-v="">Actifs</button>${PSTAGES.map(([k,l])=>`<button class="chip" aria-pressed="${f===k}" data-act="pfilter" data-v="${k}">${l} <span class="mono">${cnt[k]}</span></button>`).join("")}</div>
    ${list.length?groups.map(([k,l])=>`<div><div class="eyebrow" style="margin:6px 0 4px">${l}</div><div class="list">${list.filter(p=>p.stage===k).map(p=>`<div class="item click" data-act="edit" data-col="prospects" data-id="${p.id}"><span class="${p.ageStatus==="mineur"?"card-r":p.ageStatus==="majeur"?"":"card-y"}" style="${p.ageStatus==="majeur"?"width:9px":""}"></span><div style="min-width:0"><div class="t">${esc(p.name)} ${p.example?`<span class="pill now">exemple</span>`:""}</div><div class="m">${esc([p.position,p.club,p.league].filter(Boolean).join(" · "))}${p.nextAction?` — ${esc(p.nextAction)}`:""}</div></div>${p.nextDate?dueLabel(p.nextDate):"<span></span>"}</div>`).join("")}</div></div>`).join("")
      :`<div class="empty"><h3>Aucun prospect${f?" à cette étape":""}</h3><p style="margin:0">Cherche des situations où un agent crée de la valeur : passage académie vers pro, échéance de contrat, joueur sous-exposé, palier difficile. Note pourquoi maintenant et pourquoi toi.</p></div>`}
  </section>`;
}

function vTasks(){
  const all=vals("tasks");const open=all.filter(t=>!t.done).sort((a,b)=>(a.due||"9999").localeCompare(b.due||"9999"));
  const done=all.filter(t=>t.done).sort((a,b)=>(b.doneAt||0)-(a.doneAt||0)).slice(0,20);
  const row=t=>`<div class="item"><input type="checkbox" class="check" aria-label="Terminée" data-act="task-toggle" data-id="${t.id}" ${t.done?"checked":""} style="margin-top:5px;accent-color:var(--pitch)"><div class="t" style="${t.done?"text-decoration:line-through;color:var(--muted)":""}">${esc(t.title)} ${t.example?`<span class="pill now">exemple</span>`:""}</div><div class="row">${t.due&&!t.done?dueLabel(t.due):""}${S.ui.confirm===`tasks:${t.id}`?`<button class="btn danger solid sm" data-act="del" data-col="tasks" data-id="${t.id}">Confirmer</button>`:`<button class="btn ghost sm" data-act="askdel" data-key="tasks:${t.id}" aria-label="Supprimer">✕</button>`}</div></div>`;
  return `<section class="panel"><div class="panel-h"><h2>Tâches</h2><span class="eyebrow">${open.length} ouverte${open.length>1?"s":""}</span></div>
    <div class="row"><input type="text" id="t-title" data-bind="task.title" value="${esc(S.ui.task.title)}" placeholder="Action précise et faisable" style="flex:1 1 240px"><input type="date" id="t-due" data-bind="task.due" value="${esc(S.ui.task.due)}" style="width:auto"><button class="btn primary" data-act="task-add">Ajouter</button></div>
    ${open.length?`<div class="list">${open.map(row).join("")}</div>`:`<p class="muted small" style="margin:0">Aucune tâche ouverte. Le bouton « Action → tâche » du copilote en crée une à partir de la NEXT BEST ACTION.</p>`}
    ${done.length?`<details><summary class="small">Terminées (${done.length})</summary><div class="list" style="margin-top:6px">${done.map(row).join("")}</div></details>`:""}
  </section>`;
}

