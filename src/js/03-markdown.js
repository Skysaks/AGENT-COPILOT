/* ============ markdown ============ */
const STATUS_RE = /\b(CONFIRMED|USER-PROVIDED|ESTIMATE|INFERENCE|RUMOUR|UNKNOWN|RULE CONFIRMED|UNRESOLVED \/ VERIFY|UNRESOLVED|VERIFY|ENOUGH INFORMATION TO ACT)\b/g;
function inlineMd(s){
  return s.replace(/`([^`]+)`/g,"<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>")
    .replace(/(^|[^*\w])\*([^*\n]+)\*(?!\w)/g,"$1<em>$2</em>")
    .replace(/(^|[^\w])_([^_\n]+)_(?!\w)/g,"$1<em>$2</em>")
    .replace(STATUS_RE,m=>`<span class="st st-${stClass(m)}">${m}</span>`);
}
function md(src){
  const L=esc(src||"").split("\n");const out=[];let i=0;
  const isList=l=>/^\s*([-*•]|\d+[.)])\s+/.test(l), isTbl=l=>/^\s*\|.*\|\s*$/.test(l);
  while(i<L.length){
    const l=L[i];let m;
    if(!l.trim()){i++;continue}
    if(/^\s*```/.test(l)){const b=[];i++;while(i<L.length&&!/^\s*```/.test(L[i]))b.push(L[i++]);i++;out.push("<pre><code>"+b.join("\n")+"</code></pre>");continue}
    if((m=l.match(/^\s*(#{1,6})\s+(.*)/))){const lv=Math.min(m[1].length+2,5);out.push(`<h${lv}>${inlineMd(m[2])}</h${lv}>`);i++;continue}
    if(/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(l)){out.push("<hr>");i++;continue}
    if(isTbl(l)){let rows=[];while(i<L.length&&isTbl(L[i]))rows.push(L[i++]);rows=rows.filter(r=>!/^\s*\|[\s:|-]+\|\s*$/.test(r));
      const cells=r=>r.trim().replace(/^\|/,"").replace(/\|$/,"").split("|").map(c=>inlineMd(c.trim()));
      out.push('<div class="tbl"><table>'+rows.map((r,k)=>"<tr>"+cells(r).map(c=>k?`<td>${c}</td>`:`<th>${c}</th>`).join("")+"</tr>").join("")+"</table></div>");continue}
    if(isList(l)){const ord=/^\s*\d+[.)]/.test(l);const it=[];while(i<L.length&&(isList(L[i])||(L[i].trim()&&/^\s{2,}\S/.test(L[i])&&it.length))){if(isList(L[i]))it.push(L[i].replace(/^\s*([-*•]|\d+[.)])\s+/,""));else it[it.length-1]+="<br>"+L[i].trim();i++}
      out.push(`<${ord?"ol":"ul"}>`+it.map(x=>"<li>"+inlineMd(x)+"</li>").join("")+`</${ord?"ol":"ul"}>`);continue}
    if(/^&gt;\s?/.test(l)){const b=[];while(i<L.length&&/^&gt;\s?/.test(L[i]))b.push(L[i++].replace(/^&gt;\s?/,""));out.push("<blockquote>"+inlineMd(b.join("<br>"))+"</blockquote>");continue}
    const b=[l];i++;
    while(i<L.length&&L[i].trim()&&!/^\s*(#{1,6}\s|```)/.test(L[i])&&!isTbl(L[i])&&!isList(L[i])&&!/^&gt;/.test(L[i]))b.push(L[i++]);
    const one=b[0].trim().replace(/[:：]\s*$/,"");
    if(one.length>=4&&one.length<60&&one===one.toUpperCase()&&/[A-Z]/.test(one)&&!/[a-z]/.test(one)){out.push('<h5 class="caps">'+inlineMd(one)+"</h5>");b.shift();if(!b.length)continue}
    out.push("<p>"+inlineMd(b.join("<br>"))+"</p>");
  }
  return out.join("");
}
function extractNBA(text){
  const up=text.toUpperCase();const i=up.lastIndexOf("NEXT BEST ACTION");if(i<0)return"";
  const rest=text.slice(i+16).split("\n").map(s=>s.replace(/^[\s*#:—–\-0-9.)]+/,"").replace(/[*`#_]/g,"").trim()).filter(Boolean);
  return (rest[0]||"").slice(0,180);
}

