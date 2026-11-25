function vSources(){
  const e=S.ui.edit&&S.ui.edit.col==="sources"?S.ui.edit:null;
  const list=vals("sources").sort((a,b)=>(a.title||"").localeCompare(b.title||""));
  let ed="";
  if(e){const o=e.obj,b=k=>`data-bind="edit.obj.${k}"`;const n=(o.text||"").length;
    ed=`<section class="panel" id="editor"><div class="panel-h"><h2>${e.isNew?"Nouvelle source":esc(o.title)}</h2><span class="eyebrow mono">${n.toLocaleString("fr-FR")} caractères</span></div>
    <div class="fgrid">
      <label class="f wide"><span>Titre</span><input type="text" id="s-title" ${b("title")} value="${esc(o.title)}" placeholder="Règlement FIFA sur les agents de football"></label>
      <label class="f"><span>Émetteur</span><input type="text" id="s-iss" ${b("issuer")} value="${esc(o.issuer)}" placeholder="FIFA, FFF, Code du sport…"></label>
      <label class="f"><span>Date de la version</span><input type="date" id="s-ver" ${b("versionDate")} value="${esc(o.versionDate)}"></label>
      <label class="f wide"><span>Adresse officielle</span><input type="text" id="s-url" ${b("url")} value="${esc(o.url)}" placeholder="https://…"></label>
      <label class="f wide"><span>Texte officiel collé</span><textarea id="s-text" rows="12" ${b("text")}>${esc(o.text)}</textarea></label>
      <label class="check wide"><input type="checkbox" id="s-inc" ${b("include")} ${o.include!==false?"checked":""}> Utiliser dans les modes Examen et Juridique</label>
    </div>
    <p class="small muted" style="margin:0">Le copilote ne cite un article que s'il le trouve ici. Vérifie la version en vigueur sur le site officiel avant de coller. Un texte long est découpé automatiquement en parties.</p>
    <div class="row"><button class="btn primary" data-act="save-source">Enregistrer</button><button class="btn" data-act="cancel-edit">Fermer</button><span class="spacer"></span>${!e.isNew?delBtn("sources",o.id):""}</div></section>`;}
  return `${ed}<section class="panel"><div class="panel-h"><h2>Sources</h2><button class="btn primary sm" data-act="new" data-col="sources">Ajouter une source</button></div>
    ${list.length?`<div class="list">${list.map(s=>`<div class="item click" data-act="edit" data-col="sources" data-id="${s.id}"><span class="pill ${s.include!==false?"ok":""}">${s.include!==false?"utilisée":"ignorée"}</span><div style="min-width:0"><div class="t">${esc(s.title)}</div><div class="m">${esc(s.issuer||"Émetteur non précisé")} · version ${s.versionDate?fmtDate(s.versionDate):"non datée"} · <span class="mono">${(s.text||"").length.toLocaleString("fr-FR")}</span> car.</div></div>${!s.versionDate?`<span class="st st-verify">NON DATÉE</span>`:"<span></span>"}</div>`).join("")}</div>`
    :`<div class="empty"><h3>Aucune source</h3><p style="margin:0">Sans source, le copilote marque toute règle UNRESOLVED / VERIFY. Commence par le règlement FIFA sur les agents dans sa version en vigueur, puis les textes nationaux qui te concernent.</p></div>`}
  </section>`;
}

function vTests(){
  const ev=vals("evals");
  return `<section class="panel"><div class="panel-h"><h2>Banc d'essai</h2><span class="eyebrow">le prompt tient-il ?</span></div>
    <p class="muted small" style="margin:0">Trois cas pièges envoyés au copilote en mode Libre, avec ton contexte actuel. Coche ce qu'il a fait correctement. Si un cas échoue, corrige la section du prompt concernée avant d'élargir l'usage.</p>${aiNote()}</section>
  ${EVALS.map(c=>{const last=ev.filter(x=>x.caseId===c.id).sort((a,b)=>b.ts-a.ts)[0];const run=S.ui.evalRun[c.id]||{};const chk=S.ui.evalChecks[c.id]||{};
    return `<section class="panel"><div class="panel-h"><h3 style="font-size:19px;text-transform:uppercase;letter-spacing:.05em">${esc(c.title)}</h3>${last?`<span class="pill ${last.score===c.checks.length?"ok":"late"}">dernier : ${last.score}/${c.checks.length} · ${fmtDate(localISO(new Date(last.ts)))}</span>`:`<span class="pill">jamais lancé</span>`}</div>
      <div class="quote">${esc(c.prompt)}</div>
      <div class="row"><button class="btn primary sm" data-act="eval-run" data-id="${c.id}" ${run.busy||S.ai!=="on"?"disabled":""}>${run.busy?"En cours…":run.text?"Relancer":"Lancer"}</button>${run.busy?`<button class="btn sm" data-act="stop">Arrêter</button>`:""}</div>
      ${run.text||run.busy?`<div class="msg-a"><div class="md" id="ev-${c.id}">${run.text?md(run.text):'<p class="thinking">Réflexion…</p>'}</div></div>`:""}
      <div style="display:grid;gap:6px"><span class="eyebrow">Comportement attendu</span>${c.checks.map((k,i)=>`<label class="check"><input type="checkbox" id="ev-${c.id}-${i}" data-bind="evalChecks.${c.id}.${i}" ${chk[i]?"checked":""}> ${esc(k)}</label>`).join("")}</div>
      ${run.text&&!run.busy?`<div class="row"><button class="btn sm" data-act="eval-save" data-id="${c.id}">Enregistrer le résultat</button></div>`:""}
    </section>`}).join("")}`;
}

function vSettings(){
  if(!S.ui.prof)S.ui.prof=cl(S.profile);
  const p=S.ui.prof,b=k=>`data-bind="prof.${k}"`,ip=S.ui.importPreview;
  const nEx=COLS.reduce((a,c)=>a+vals(c).filter(x=>x.example).length,0);
  return `<section class="panel"><div class="panel-h"><h2>Contexte</h2><span class="eyebrow">injecté dans chaque requête</span></div>
    <div class="fgrid">
      <label class="f"><span>Stage actuel</span><select id="pr-stage" ${b("stage")}>${STAGES.map((s,i)=>`<option value="${i}"${sel(i,p.stage)}>${i} · ${s[0]}</option>`).join("")}</select></label>
      <label class="f"><span>Joueurs représentés</span><input type="number" min="0" id="pr-rep" ${b("represented")} value="${esc(p.represented)}"></label>
      <label class="f"><span>Licence</span><input type="text" id="pr-lic" ${b("licence")} value="${esc(p.licence)}"></label>
      <label class="f"><span>Heures par semaine</span><input type="text" id="pr-h" ${b("hours")} value="${esc(p.hours)}"></label>
      <label class="f wide"><span>Positionnement</span><input type="text" id="pr-pos" ${b("positioning")} value="${esc(p.positioning)}"></label>
      <label class="f"><span>Langue de réponse</span><input type="text" id="pr-lang" ${b("lang")} value="${esc(p.lang)}"></label>
      <label class="f"><span>Relation inactive après (jours)</span><input type="number" min="7" id="pr-cool" ${b("coolDays")} value="${esc(p.coolDays)}"></label>
    </div>
    <div class="row"><button class="btn primary" data-act="save-profile">Enregistrer le contexte</button></div>
    <pre class="prompt" aria-label="Aperçu du contexte">${esc(contextBlockFrom(p))}</pre>
  </section>
  <section class="panel"><div class="panel-h"><h2>Prompt v2.1</h2><button class="btn sm" data-act="copy-prompt">Copier le prompt complet</button></div>
    <p class="muted small" style="margin:0">Le même texte sert dans un Projet claude.ai si tu veux l'utiliser hors de cette page.</p>
    <details><summary class="small">Afficher</summary><pre class="prompt" style="margin-top:8px">${esc(SYSTEM_PROMPT)}</pre></details>
  </section>
  <section class="panel"><div class="panel-h"><h2>Données</h2><span class="eyebrow">${S.mode==="db"?"stockage claude.ai · privé":S.mode==="local"?"ce navigateur":"non enregistré"}</span></div>
    <div class="row"><button class="btn" data-act="export">Exporter (JSON)</button><label class="btn" for="imp-file">Importer un export</label><input type="file" id="imp-file" accept=".json,application/json" data-change="import" hidden>
      ${nEx?`<button class="btn" data-act="examples-clear">Retirer les exemples (${nEx})</button>`:`<button class="btn" data-act="examples-load">Charger des exemples</button>`}</div>
    ${ip?`<div class="quote">Import prêt : ${COLS.map(c=>`${Object.keys(ip.data?.[c]||{}).length} ${c}`).join(" · ")}. Les fiches de même identifiant seront remplacées.<div class="row" style="margin-top:6px"><button class="btn primary sm" data-act="import-apply">Importer</button><button class="btn sm" data-act="import-cancel">Annuler</button></div></div>`:""}
    <div class="row">${S.ui.confirm==="wipe"?`<button class="btn danger solid" data-act="wipe">Confirmer : tout effacer</button><button class="btn" data-act="askdel" data-key="">Annuler</button>`:`<button class="btn danger" data-act="askdel" data-key="wipe">Tout effacer</button>`}</div>
  </section>`;
}
function contextBlockFrom(p){const keep=S.profile;S.profile={...keep,...p};const t=contextBlock();S.profile=keep;return t}

