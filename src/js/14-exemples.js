/* ============ examples ============ */
function loadExamples(){
  const t=localISO();
  const C=[
    {name:"Responsable recrutement d'un club de N2 (exemple)",role:"Recruteur / scout",org:"Club fictif FC",channel:"WhatsApp",why:"Voit passer beaucoup de profils régionaux de 17 à 21 ans.",value:"Lui remonter des profils filmés et vérifiés, sans le solliciter pour autre chose.",lastInteraction:addDays(t,-62),nextAction:"Message court pour reprendre contact après le tournoi",nextDate:t,journal:[{date:addDays(t,-62),summary:"Rencontré au tournoi U19 de la ligue (exemple)."}],example:true},
    {name:"Agent licencié installé (exemple)",role:"Agent",org:"Indépendant",channel:"LinkedIn",why:"Peut décrire la pratique réelle des mandats et des négociations.",value:"Contenu, veille réglementaire, aide ponctuelle sur la prospection.",lastInteraction:"",nextAction:"Demander 20 minutes d'échange sur le métier",nextDate:addDays(t,3),journal:[],example:true}
  ];
  const P=[
    {name:"Milieu défensif, 19 ans (exemple)",position:"Milieu défensif",club:"Club fictif FC",league:"National 2",ageStatus:"majeur",ageSource:"Exemple",contractEnd:"",contractStatus:"UNKNOWN",stage:"WATCHLIST",whyInteresting:"Titulaire régulier en N2 à 19 ans.",whyNow:"Situation contractuelle inconnue : à vérifier avant tout.",whyMe:"",access:"Via le responsable recrutement du club (contact exemple).",redFlags:"Représentation actuelle inconnue.",nextAction:"Voir deux matchs complets avant tout contact",nextDate:addDays(t,7),facts:[{text:"Titulaire sur les derniers matchs observés",status:"USER-PROVIDED",source:"Observation (exemple)"}],example:true},
    {name:"Ailier de centre de formation (exemple)",position:"Ailier",club:"Centre de formation fictif",league:"U19 National",ageStatus:"inconnu",ageSource:"",contractEnd:"",contractStatus:"UNKNOWN",stage:"DISCOVERED",whyInteresting:"Repéré en vidéo.",whyNow:"",whyMe:"",access:"",redFlags:"Âge non vérifié.",nextAction:"Vérifier l'âge et le cadre applicable",nextDate:t,facts:[],example:true}
  ];
  const T=[{title:"Coller le règlement FIFA sur les agents (version en vigueur) dans Sources",due:t,done:false,example:true},{title:"Faire 10 questions d'examen chronométrées",due:addDays(t,1),done:false,example:true}];
  C.forEach(x=>Store.put("contacts",x));P.forEach(x=>Store.put("prospects",x));T.forEach(x=>Store.put("tasks",x));
  toast("Exemples chargés. Retire-les depuis Réglages.");
}
async function clearExamples(){for(const c of COLS)for(const x of vals(c).filter(x=>x.example))await Store.del(c,x.id);toast("Exemples retirés.")}

