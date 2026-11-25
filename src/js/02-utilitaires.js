/* ============ helpers ============ */
const $ = (s,r=document)=>r.querySelector(s);
const esc = s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const uid = ()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const cl = o=>o==null?o:JSON.parse(JSON.stringify(o));
function localISO(d=new Date()){const z=d.getTimezoneOffset()*60000;return new Date(d-z).toISOString().slice(0,10)}
function addDays(iso,n){const d=new Date(iso+"T12:00:00");d.setDate(d.getDate()+n);return localISO(d)}
function daysBetween(a,b){return Math.round((Date.parse(b+"T00:00:00Z")-Date.parse(a+"T00:00:00Z"))/86400000)}
function fmtDate(iso){if(!iso)return"";const [y,m,d]=iso.split("-");return `${d}/${m}/${y}`}
function dueLabel(iso){const n=daysBetween(localISO(),iso);if(n<0)return `<span class="pill late">J+${-n}</span>`;if(n===0)return `<span class="pill now">Aujourd'hui</span>`;return `<span class="pill">dans ${n} j</span>`}
function agoLabel(iso){if(!iso)return `<span class="pill late">jamais</span>`;const n=daysBetween(iso,localISO());const cool=Number(S.profile.coolDays)||45;return `<span class="pill ${n>cool?"late":""}">il y a ${n} j</span>`}
function setPath(o,p,v){const k=p.split(".");let c=o;for(let i=0;i<k.length-1;i++){if(c[k[i]]==null)c[k[i]]={};c=c[k[i]]}c[k[k.length-1]]=v}
function vals(col){return Object.values(S.data[col]||{})}
function stClass(s){s=String(s).toUpperCase();if(s.startsWith("CONFIRMED")||s.startsWith("RULE"))return"confirmed";if(s.startsWith("USER"))return"user";if(s.startsWith("ESTIMATE"))return"estimate";if(s.startsWith("INFERENCE"))return"inference";if(s.startsWith("RUMOUR"))return"rumour";if(s.startsWith("UNKNOWN"))return"unknown";if(s.startsWith("ENOUGH"))return"act";return"verify"}
const stChip = s=>`<span class="st st-${stClass(s)}">${esc(s)}</span>`;
const sel = (a,b)=>String(a)===String(b)?" selected":"";

