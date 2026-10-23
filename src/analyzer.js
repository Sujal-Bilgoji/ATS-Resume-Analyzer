// Core logic: parses resume + job description, scores the match, renders results
import {HARD,SOFT,SYN,VERBS,RULES,HEAD} from './data.js';
import {$,esc} from './utils.js';
const stem=w=>/^[a-z]+$/.test(w)&&w.length>5?w.replace(/(ations|ation|ings|ing|ical|ics|ies|ied|ed|es|s)$/,""):w;
const norm=t=>" "+(t.toLowerCase().match(/[a-z0-9+#.\/]+/g)||[]).map(w=>stem(w.replace(/^\.+|\.+$/g,""))).join(" ")+" ";
const cnt=(tn,t)=>tn.split(norm(t)).length-1;
function status(tn,t){const n=cnt(tn,t);if(n)return{s:"ok",n};const v=(SYN[t]||[]).find(a=>tn.includes(norm(a)));return v?{s:"rel",via:v,n:0}:{s:"no",n:0}}
function marks(T){const o=[];RULES.forEach(([p,alt,t])=>{const re=new RegExp("\\b(?:"+p+")\\b",t==="p"?"g":"gi");let m;while((m=re.exec(T)))o.push({s:m.index,e:m.index+m[0].length,w:m[0],alt,t})});o.sort((a,b)=>a.s-b.s);const k=[];let end=0;o.forEach(m=>{if(m.s>=end){k.push(m);end=m.e}});return k}
function jdTitle(J){const m=J.match(/(?:role|position|job title|title)\s*[:\-–]\s*(.{3,60}?)(?=location|experience|company|responsib|\n|$)/i);let t=m?m[1]:(J.split("\n").map(x=>x.trim()).find(x=>x&&!/^(about|job description|overview|description)/i.test(x))||"").slice(0,60);t=t.replace(/\(.*?\)/g,"").trim();return t.split(/\s+/).length<=6?t:""}
const CATRE={data:/data|analytic|science/i,ai:/\bai\b|ml|api/i,tools:/tool|devops|cloud|platform/i,web:/web|front|back/i,lang:/language|programming/i,core:/core|concept|other/i};
const catOf=t=>/llm|generative|prompt/.test(t)?"ai":/cloud|aws|azure|gcp|docker|kubernetes|git|ci\/cd|jenkins|devops|linux|terraform/.test(t)?"tools":/html|css|react|angular|vue|node|javascript|typescript|bootstrap|tailwind|graphql|rest|fastapi|django|flask|spring/.test(t)?"web":/^(python|java|c\+\+|c#|php|ruby|kotlin|swift)$/.test(t)?"lang":/data|sql|pandas|numpy|learn|tensor|torch|statist|power bi|tableau|excel|matplotlib|seaborn|etl|spark|hadoop|predict|regress|classif|cluster|time series|hypothesis|dashboard|intelligence|nlp|vision|scraping|a\/b|feature/.test(t)?"data":"core";
const DN={sql:"SQL",tensorflow:"TensorFlow",pytorch:"PyTorch","scikit-learn":"Scikit-learn",llm:"LLMs",etl:"ETL",nlp:"NLP",aws:"AWS",gcp:"GCP","ci/cd":"CI/CD","power bi":"Power BI",api:"APIs"};
const disp=t=>DN[t]||t.replace(/\b[a-z]/g,c=>c.toUpperCase());
const tgtIdx=(SL,t)=>SL.findIndex(l=>l.includes(":")&&CATRE[catOf(t)].test(l.split(":")[0]));
function buildSkills(){const picked=[...document.querySelectorAll(".ms:checked")].map(x=>x.value);if(!picked.length){alert("Tick the skills you genuinely have first.");return}
 const L=[...window.CTX.SL],extra=[];picked.forEach(t=>{const i=tgtIdx(L,t);if(i>=0)L[i]=L[i].replace(/[\s,]*$/,"")+", "+disp(t);else extra.push(disp(t))});
 if(extra.length)L.push("Additional Skills: "+extra.join(", "));$("sk-out").value="SKILLS\n"+L.join("\n")}
function analyze(){
 const R=$("res").value.replace(/[\uE000-\uF8FF§■□◆❖]/g,"").trim(),J=$("jd").value.trim();
 if(R.length<80){alert("Please paste or upload your resume first.");return}
 if(J.length<80){alert("Please paste the full job description.");return}
 const lines=R.split("\n"),words=(R.match(/\S+/g)||[]).length,fx=[],cats=[],rn=norm(R),jn=norm(J);
 // parse sections and bullets
 let sec="",cur=null;const found={},B=[],SL=[];
 lines.forEach((l,i)=>{const t=l.trim();if(!t)return;const h=(()=>{const x=t.replace(/:$/,"").toLowerCase();for(const[n,r]of HEAD)if(r.test(x))return n})();
  if(h){sec=h;found[h]=1;cur=null;return}if(sec==="Skills")SL.push(t);if(sec!=="Experience"&&sec!=="Projects"){cur=null;return}
  if(/^(tools?|tech(nologies)?|tech stack)\s*:/i.test(t)){cur=null;return}
  if(/^[•\-\*▪●◦–·]\s*/.test(t)){cur={s:i,e:i,text:t.replace(/^[•\-\*▪●◦–·]\s*/,"")};B.push(cur);return}
  if(cur&&(/^[a-z]/.test(t)||(!/[.!?]$/.test(cur.text)&&t.length>=40))){cur.e=i;cur.text+=" "+t;return}
  cur=null;if(t.length>=60){cur={s:i,e:i,text:t};B.push(cur)}});
 // hard skills
 const pi=J.search(/(preferred|good to have|nice to have|bonus|desirable)/i),reqN=norm(pi>0?J.slice(0,pi):J),sk=[];
 HARD.forEach(t=>{const c=cnt(jn,t);if(c)sk.push({t,c,pref:!cnt(reqN,t),...status(rn,t)})});
 sk.sort((a,b)=>a.pref-b.pref||b.c-a.c);
 let tot=0,got=0;sk.forEach(k=>{const w=(1+Math.min(2,k.c-1)*.25)*(k.pref?.5:1);tot+=w;got+=w*(k.s==="ok"?1:0)});
 const hp=sk.length?Math.round(45*got/tot):22;cats.push(["Hard skills (job match)",hp,45,"j"]);
 const miss=sk.filter(k=>k.s==="no"),rel=sk.filter(k=>k.s==="rel");
 if(!sk.length)fx.push(["m","I could not detect technical skills in the job description. Paste the complete job post."]);
 if(miss.length)fx.push(["h",`Missing hard skills from the job description: <b>${miss.filter(k=>!k.pref).slice(0,12).map(k=>k.t).join(", ")||miss.slice(0,8).map(k=>k.t).join(", ")}</b>. Add only the ones you truly know (see the action plan below).`]);
 if(rel.length)fx.push(["m",`Use the job description's exact wording: ${rel.slice(0,6).map(k=>`you wrote <b>${k.via}</b>, the job says <b>${k.t}</b>`).join("; ")}. Strict mode: these get no credit until you use the exact wording, e.g. "SQL (MySQL, PostgreSQL)".`]);
 const sf=SOFT.map(t=>({t,c:cnt(jn,t),...status(rn,t)})).filter(k=>k.c);const sg=sf.filter(k=>k.s==="ok").length;
 cats.push(["Soft skills (job match)",sf.length?Math.round(5*sg/sf.length):5,5,"j"]);
 const so=sf.filter(k=>k.s!=="ok");if(so.length)fx.push(["l",`Soft skills in the job post you can show with proof in bullets: ${so.map(k=>k.t).join(", ")}.`]);
 // title
 const ttl=jdTitle(J),core=ttl.toLowerCase().replace(/\b(junior|senior|sr|jr|associate|lead|intern|trainee|fresher|entry level)\b/g,"").trim();let tp=5;
 if(core){const tk=core.split(/\s+/),hit=tk.filter(w=>rn.includes(" "+stem(w)+" ")).length;tp=rn.includes(norm(core))?5:0;
  if(tp<5)fx.push(["h",`The job title <b>${esc(ttl)}</b> is not in your resume. Put it in your Summary, e.g. "Aspiring ${esc(ttl.replace(/^(junior|senior)\s+/i,""))} with ...".`])}
 cats.push(["Job title match",tp,5,"j"]);
 const needDeg=/\b(bachelor|b\.?tech|degree|master)/i.test(J),hasDeg=/\b(b\.?tech|b\.?e\b|bachelor|bca|b\.?sc|master|m\.?tech|mca)/i.test(R);
 cats.push(["Education match",!needDeg||hasDeg?5:0,5,"j"]);if(needDeg&&!hasDeg)fx.push(["h","Your degree isn't clearly stated. Write it as 'Bachelor of Technology (B.Tech)'."]);
 // sections
 let sp=0;if(found.Skills)sp+=3;else fx.push(["h","Add a <b>Skills</b> heading."]);if(found.Education)sp+=2;else fx.push(["h","Add an <b>Education</b> heading."]);
 if(found.Experience||found.Projects)sp+=3;else fx.push(["h","Add a <b>Projects</b> or <b>Experience</b> section."]);
 if(found.Summary)sp+=2;else fx.push(["m","Add a 2-3 line <b>Summary</b> with the job title and your top skills from this job description."]);
 cats.push(["Section headings",Math.round(sp*.8),8,"r"]);
 let cp=0;const em=/[\w.+-]+@[\w-]+\.[\w.]+/.test(R),ph=/\+?\d[\d\s().-]{8,}\d/.test(R),ln=/linkedin\.com|github\.com/i.test(R);
 if(em)cp+=2;else fx.push(["h","No email found."]);if(ph)cp+=1;else fx.push(["h","No phone number found."]);if(ln)cp+=2;else fx.push(["m","Add LinkedIn and/or GitHub."]);
 cats.push(["Contact info",Math.round(cp*.8),4,"r"]);
 // content
 const M=marks(R),iss=M.filter(m=>m.t!=="p").length,mt=B.filter(b=>!/\d/.test(b.text)),vb=B.filter(b=>VERBS.has((b.text.split(/\s+/)[0]||"").toLowerCase().replace(/[^a-z]/g,"")));
 const mr=B.length?1-mt.length/B.length:.4,vr=B.length?vb.length/B.length:.4;
 cats.push(["Bullet quality & tone",Math.round(.8*Math.max(0,Math.min(25,10*mr+8*vr+Math.max(0,7-1.5*iss)))),20,"r"]);
 if(B.length<3)fx.push(["h","I found fewer than 3 bullets under Projects/Experience. Write 3-4 bullets per project."]);
 if(mt.length)fx.push([mt.length>2?"h":"m",`<b>${mt.length}</b> of ${B.length} project/experience bullets have no number (marked amber). Skills and coursework lines are not checked.`]);
 if(B.length&&vr<.8)fx.push(["m",`${Math.round(vr*100)}% of bullets start with an action verb. Aim for 100%.`]);
 const bz=M.filter(m=>m.t==="b"),wk=M.filter(m=>m.t==="w"),pr=M.filter(m=>m.t==="p");
 if(bz.length)fx.push(["h",`<b>${bz.length}</b> buzzword(s) found (red). Replacements are shown next to each.`]);
 if(wk.length)fx.push(["h",`<b>${wk.length}</b> weak phrase(s) found (red). Replacements are shown next to each.`]);
 let fp=10;const odd=(R.match(/[^\x00-\x7F•–—’‘“”·●▪◦]/g)||[]).length;
 if(words<250){fp-=3;fx.push(["m",`Short resume (${words} words). Aim for 350-700.`])}else if(words>900){fp-=3;fx.push(["m",`Long resume (${words} words). Keep freshers to one page.`])}
 if(pr.length){fp-=2;fx.push(["m",`First-person words found (${pr.length}). Remove I/my.`])}
 if(odd>8){fp-=3;fx.push(["m",`${odd} unusual symbols found. Use plain bullets.`])}
 cats.push(["Format & length",Math.round(Math.max(0,fp)*.8),8,"r"]);
 const jm=cats.filter(c=>c[3]==="j"),sum=(a,i)=>a.reduce((x,c)=>x+c[i],0),total=Math.round(sum(jm,1)/sum(jm,2)*100);
 fx.sort((a,b)=>"hml".indexOf(a[0])-"hml".indexOf(b[0]));if(!fx.length)fx.push(["l","No major issues. Re-check with every new job description."]);
 // resume view
 const notes={};B.forEach(b=>{const n=[];if(!/\d/.test(b.text))n.push('Add a result, e.g. "by 25%", "10+ users", "500 records"');if(!VERBS.has((b.text.split(/\s+/)[0]||"").toLowerCase().replace(/[^a-z]/g,"")))n.push("Start with an action verb: Developed, Built, Implemented");if(n.length)notes[b.e]=n.join(". ")});
 let off=0,html="";lines.forEach((l,i)=>{const st=off,en=off+l.length;let h="",p=st;M.filter(m=>m.s>=st&&m.e<=en).forEach(m=>{h+=esc(R.slice(p,m.s))+`<mark class="rm">${esc(m.w)}</mark><span class="sg">→ ${esc(m.alt)}</span>`;p=m.e});h+=esc(R.slice(p,en));
  const bi=B.find(b=>b.s<=i&&i<=b.e);html+=(bi&&!/\d/.test(bi.text)?`<mark class="am">${h}</mark>`:h)+"\n";off=en+1;if(notes[i])html+=`<div class="note">💡 ${esc(notes[i])}</div>`});
 const jr=[];sk.forEach(k=>{const re=new RegExp("(?<![a-z0-9])"+k.t.replace(/[.*+?^${}()|[\]\\\/]/g,"\\$&").replace(/ /g,"[\\s-]+")+"s?(?![a-z0-9])","gi");let m;while((m=re.exec(J)))jr.push({s:m.index,e:m.index+m[0].length,c:k.s==="ok"?"g":k.s==="rel"?"am":"rm"})});
 jr.sort((a,b)=>a.s-b.s);let jh="",q=0;jr.forEach(m=>{if(m.s<q)return;jh+=esc(J.slice(q,m.s))+`<mark class="${m.c}">${esc(J.slice(m.s,m.e))}</mark>`;q=m.e});jh+=esc(J.slice(q));
 const seen={},rows=M.filter(m=>m.t!=="p"&&!seen[m.w.toLowerCase()]&&(seen[m.w.toLowerCase()]=1)).map(m=>`<tr><td><mark class="rm">${esc(m.w)}</mark></td><td>${M.filter(x=>x.w.toLowerCase()===m.w.toLowerCase()).length}</td><td>${esc(m.alt)}</td></tr>`).join("");
 const col=v=>v>=.8?"var(--ok)":v>=.55?"var(--am)":"var(--rd)",pc=(a,b)=>Math.round(a/b*100);
 const yrs=J.match(/(\d+)\s*(?:-|–|to)\s*(\d+)\s*\+?\s*years?/i),
 skRows=sk.map(k=>`<tr><td>${esc(k.t)}${k.pref?' <span class="mu">(preferred)</span>':""}</td><td>${k.s==="ok"?`<span class="chip g">✓ found ${k.n}×</span>`:k.s==="rel"?`<span class="chip a">≈ you have "${esc(k.via)}"</span>`:'<span class="chip r">✗ missing</span>'}</td><td>${k.c}</td></tr>`).join("");
 const cand=[...miss,...rel].slice(0,12);window.CTX={SL};
 const plan=cand.map(k=>{const i=tgtIdx(SL,k.t),lab=i>=0?SL[i].split(":")[0]:"Additional Skills (new line)";return `<label class="fix ${k.s==="rel"?"l":"m"}" style="display:block;cursor:pointer"><input type="checkbox" class="ms" value="${esc(k.t)}"> <b>${esc(disp(k.t))}</b> → add to the <i>${esc(lab)}</i> line${k.s==="rel"?` <span class="mu">(you already use ${esc(k.via)}, so this is safe to add)</span>`:""}<div class="mu">Then back it with a bullet: "Used ${esc(disp(k.t))} in [project] to [task], achieving [number/%]".</div></label>`}).join("");
 $("out").hidden=false;
 $("out").innerHTML=`<div class="grid"><div class="card"><div class="mu">Job match score</div><div class="score" style="color:${col(total/100)}">${total}<span style="font-size:24px">/100</span></div>
 <div class="mu">${total>=90?"Excellent":total>=75?"Good, a few fixes left":total>=55?"Needs work":"Low, fix the red items first"}</div>
 
 <div class="mu" style="margin-top:8px">${ttl?`Job title detected: <b>${esc(ttl)}</b>. `:""}${yrs?`Experience asked: ${yrs[1]}-${yrs[2]} years.`:""}</div></div>
 <div class="card">${cats.filter(c=>c[3]==="j").map(c=>`<div class="cat"><div><span>${c[0]}</span><span>${c[1]}/${c[2]}</span></div><div class="bar"><i style="width:${c[1]/c[2]*100}%;background:${col(c[1]/c[2])}"></i></div></div>`).join("")}</div></div>
 <div class="card"><h2>What to fix (most important first)</h2><div class="mu" style="margin-bottom:8px">Your score is the job match only. Resume tips (headings, bullets, format) are shown to help but do not change the score.</div>${fx.map(f=>`<div class="fix ${f[0]}">${f[1]}</div>`).join("")}</div>
 <div class="card scroll"><h2>Hard skills: your resume vs this job</h2><div class="mu" style="margin-bottom:8px">Strict mode: only exact skill matches count. Amber (related) words get no credit, like other scanners.</div><table><tr><th>Skill</th><th>In your resume</th><th>Times in job post</th></tr>${skRows||'<tr><td colspan="3" class="mu">None detected</td></tr>'}</table>
 <div class="mu" style="margin-top:8px">Soft skills: ${sf.length?sf.map(k=>`<span class="chip ${k.s==="ok"?"g":"r"}">${esc(k.t)}</span>`).join(""):"none detected"}</div></div>
 ${plan?`<div class="card"><h2>Where to add the missing skills</h2><div class="mu" style="margin-bottom:8px">Tick only the skills you genuinely have. I will place each one in the matching line of your Skills section.</div>${plan}<div class="row"><button onclick="buildSkills()">Build my updated Skills section</button></div><textarea id="sk-out" readonly placeholder="Your updated Skills section appears here. Select it and copy." style="height:150px;margin-top:10px"></textarea><div class="mu" style="margin-top:6px">Skills you don't have yet: learn them through a small project first, then add them.</div></div>`:""}
 <div class="card"><h2>Job description with skills highlighted</h2><div class="mu" style="margin-bottom:8px"><mark class="g">Green</mark> in your resume. <mark class="am">Amber</mark> related word found. <mark class="rm">Red</mark> missing.</div><div id="view">${jh}</div></div>
 <div class="card"><h2>Your resume with problems marked</h2><div class="mu" style="margin-bottom:8px"><mark class="rm">Red</mark> = buzzword/weak phrase, with the replacement shown beside it. <mark class="am">Amber</mark> = project bullet with no number, with a tip underneath.</div><div id="view">${html}</div></div>
 ${rows?`<div class="card scroll"><h2>Replace these</h2><table><tr><th>Found</th><th>Times</th><th>Use instead</th></tr>${rows}</table></div>`:""}`;
 $("out").scrollIntoView({behavior:"smooth"});
}

window.buildSkills=buildSkills;
export {analyze};
