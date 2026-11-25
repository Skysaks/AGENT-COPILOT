function vExam(){
  const src=vals("sources").filter(s=>s.text);
  if(!S.ui.quizSrc&&src[0])S.ui.quizSrc=src[0].id;
  const qs=quizStats();const hist=vals("quiz").sort((a,b)=>b.ts-a.ts);
  const weak={};hist.slice(0,60).filter(h=>!h.correct&&h.reference).forEach(h=>{weak[h.reference]=(weak[h.reference]||0)+1});
  const weakL=Object.entries(weak).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const Q=S.ui.quiz;
  let qhtml="";
  if(Q&&Q.loading)qhtml=`<p class="thinking">Préparation de la question…</p>`;
  else if(Q&&Q.q){
    const q=Q.q,ans=Q.picked!=null;
    qhtml=`<div class="row"><span class="eyebrow">Question · ${esc(Q.srcTitle)}</span><span class="spacer"></span><span class="timer" id="timer">${ans?fmtSec(Q.seconds):"0:00"}</span></div>
      <p style="margin:0;font-size:16px;font-weight:500">${esc(q.question)}</p>
      <div style="display:grid;gap:8px">${q.options.map((o,i)=>`<button class="qopt ${ans&&i===q.answer?"right":""} ${ans&&i===Q.picked&&i!==q.answer?"wrong":""}" data-act="quiz-pick" data-i="${i}" ${ans?"disabled":""}><span class="mono">${"ABCD"[i]}</span> · ${esc(o)}</button>`).join("")}</div>
      ${ans?`<div style="display:grid;gap:8px">
        <p style="margin:0"><strong>${Q.picked===q.answer?"Bonne réponse.":"Mauvaise réponse."}</strong> Référence : <span class="mono">${esc(q.reference)}</span></p>
        <div class="quote">${esc(q.quote)}</div>
        <p class="small" style="margin:0">${Q.verified?`<span class="st st-confirmed">CITATION TROUVÉE DANS LA SOURCE</span>`:`<span class="st st-verify">CITATION INTROUVABLE</span> Vérifie cette question dans le texte avant de t'y fier.`}</p>
        <p style="margin:0">${esc(q.explanation)}</p>${q.trap?`<p class="small muted" style="margin:0"><strong>Piège classique :</strong> ${esc(q.trap)}</p>`:""}
        <div class="row"><button class="btn primary" data-act="quiz-new">Question suivante</button><button class="btn" data-act="copilot-quiz">Approfondir avec le copilote</button></div></div>`:""}`;
  }
  return `<div class="grid2">
  <section class="panel"><div class="panel-h"><h2>Examen · livre ouvert</h2><span class="eyebrow">QCM chronométré</span></div>
    <p class="muted small" style="margin:0">Questions générées uniquement à partir de tes sources. Chaque réponse donne l'article et une citation, vérifiée automatiquement dans le texte.</p>
    ${aiNote()}
    ${src.length?`<div class="fgrid"><label class="f"><span>Source</span><select id="q-src" data-bind="quizSrc">${src.map(s=>`<option value="${s.id}"${sel(s.id,S.ui.quizSrc)}>${esc(s.title)}</option>`).join("")}</select></label>
      <label class="f"><span>Thème (facultatif)</span><input type="text" id="q-theme" data-bind="quizTheme" value="${esc(S.ui.quizTheme)}" placeholder="conflits d'intérêts, mineurs, rémunération…"></label></div>
      ${!Q||(!Q.q&&!Q.loading)?`<div class="row"><button class="btn primary" data-act="quiz-new" ${S.ai!=="on"?"disabled":""}>Nouvelle question</button></div>`:""}
      ${qhtml}`
    :`<div class="empty"><h3>Ajoute d'abord une source</h3><p style="margin:0">Colle le texte officiel du règlement, dans sa version en vigueur, depuis le site de la FIFA ou de ta fédération. On s'entraîne à retrouver l'article, pas à réciter.</p><div class="row"><button class="btn primary" data-act="tab" data-tab="sources">Ajouter une source</button></div></div>`}
  </section>
  <section class="panel"><div class="panel-h"><h2>Progression</h2></div>
    <div class="stats"><span><b>${qs.total||0}</b> questions</span>${qs.total?`<span><b>${qs.pct} %</b> sur ${qs.last} dernières</span><span><b>${qs.avgSec} s</b> en moyenne</span>`:""}</div>
    ${weakL.length?`<div><div class="eyebrow" style="margin-bottom:4px">Articles à retravailler</div><div class="list">${weakL.map(([r,n])=>`<div class="item two"><span class="mono small">${esc(r)}</span><span class="pill late">${n} erreur${n>1?"s":""}</span></div>`).join("")}</div></div>`:""}
    ${hist.length?`<div><div class="eyebrow" style="margin-bottom:4px">Dernières questions</div><div class="list">${hist.slice(0,8).map(h=>`<div class="item two"><div style="min-width:0"><div class="t small" style="font-weight:400">${esc((h.question||"").slice(0,110))}</div><div class="m mono">${esc(h.reference||"")} · ${h.seconds||0} s</div></div><span class="pill ${h.correct?"ok":"late"}">${h.correct?"juste":"faux"}</span></div>`).join("")}</div></div>`:`<p class="muted small" style="margin:0">Tes résultats apparaîtront ici.</p>`}
  </section></div>`;
}
const fmtSec=s=>`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
let timerInt=0;
function tickTimer(){clearInterval(timerInt);const Q=S.ui.quiz;if(!Q||!Q.q||Q.picked!=null)return;
  const f=()=>{const el=$("#timer");if(!el){clearInterval(timerInt);return}el.textContent=fmtSec(Math.floor((Date.now()-Q.startedAt)/1000))};f();timerInt=setInterval(f,1000)}

