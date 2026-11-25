/* ============ storage ============ */
const Store = {
  db:null, base:null, q:{},
  async init(){
    renderAll();
    let db=null,user=null,sample=null,downloads=null;
    if(window.claude&&typeof window.claude.use==="function"){
      try{[db,user,sample,downloads]=await Promise.all(["db","user","sample","downloads"].map(n=>window.claude.use(n).catch(()=>null)))}catch(e){}
    }
    S.sample=sample; S.ai=sample?"on":"off"; S.downloads=downloads;
    let id=null; if(user){try{id=await user.id()}catch(e){}}
    if(db&&id){this.db=db;this.base=db.doc("data/users/"+id+"/profile");S.mode="db";this.subscribe()}
    else this.loadLocal();
    renderAll();
  },
  subscribe(){
    this.base.onSnapshot(s=>{S.profile={...DEFAULT_PROFILE,...(s.exists?cl(s.data()):{})};schedule()},e=>this.fail(e));
    for(const c of COLS){
      this.base.collection(c).onSnapshot(snap=>{const o={};snap.docs.forEach(d=>{o[d.id]={...cl(d.data()),id:d.id}});S.data[c]=o;schedule()},e=>this.fail(e));
    }
  },
  fail(e){if(e&&e.code==="revoked"){S.mode="memory";renderChrome()}else if(e){toast("Synchronisation interrompue. Recharge la page.")}},
  loadLocal(){
    try{const raw=localStorage.getItem("agent-copilot.v1");if(raw){const p=JSON.parse(raw);S.profile={...DEFAULT_PROFILE,...(p.profile||{})};for(const c of COLS)S.data[c]=p.data?.[c]||{}}S.mode="local"}
    catch(e){S.mode="memory"}
  },
  saveLocal(){if(S.mode!=="local")return;try{localStorage.setItem("agent-copilot.v1",JSON.stringify({profile:S.profile,data:S.data}))}catch(e){S.mode="memory";renderChrome();toast("Stockage local indisponible : rien n'est enregistré dans cette vue.")}},
  enqueue(key,fn){const p=(this.q[key]||Promise.resolve()).then(fn).catch(writeError);this.q[key]=p;return p},
  put(col,obj){
    obj=cl(obj);obj.id=obj.id||uid();const now=Date.now();obj.updatedAt=now;if(!obj.createdAt)obj.createdAt=now;
    S.data[col][obj.id]=obj;schedule();
    if(S.mode==="db"){const ref=this.base.collection(col).doc(obj.id);return this.enqueue(ref.path,()=>ref.set(obj)).then(()=>obj)}
    this.saveLocal();return Promise.resolve(obj);
  },
  del(col,id){
    delete S.data[col][id];schedule();
    if(S.mode==="db"){const ref=this.base.collection(col).doc(id);return this.enqueue(ref.path,()=>ref.delete())}
    this.saveLocal();return Promise.resolve();
  },
  setProfile(p){
    S.profile={...S.profile,...cl(p)};schedule();
    if(S.mode==="db"){const body=cl(S.profile);return this.enqueue(this.base.path,()=>this.base.set(body))}
    this.saveLocal();return Promise.resolve();
  }
};
function writeError(e){
  const c=e&&e.code;
  if(c==="quota_exceeded")toast("Espace de stockage plein : supprime d'anciens fils de discussion ou des sources.");
  else if(c==="invalid_argument")toast("Enregistrement refusé : ce compte ne peut pas écrire ici, ou la fiche est trop volumineuse.");
  else toast("Enregistrement échoué. Réessaie dans un instant.");
}

