/* ============ state ============ */
const S = {
  data:Object.fromEntries(COLS.map(c=>[c,{}])), profile:{...DEFAULT_PROFILE}, mode:"loading",
  sample:null, ai:"pending", downloads:null,
  ui:{tab:"today", draft:{copilot:"",capture:""}, mode:"libre", attach:"", deep:false, threadId:null, busy:false, streamText:"",
      edit:null, confirm:null, journal:{date:"",summary:""}, capture:{busy:false,result:null}, quiz:null, quizSrc:"", quizTheme:"",
      evalRun:{}, evalChecks:{}, prof:null, importPreview:null, brief:{busy:false,text:""}, search:"", roleFilter:"", pFilter:"", task:{title:"",due:""}}
};
let ctl=null;

