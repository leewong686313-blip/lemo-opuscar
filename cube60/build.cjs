// CUBE 60 — génère le pack (HTML -> PDF) : 30 énigmes, solutions, grille de score.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

function rng(seed){let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const R=rng(6060);
const ri=(a,b)=>a+Math.floor(R()*(b-a+1));
const pick=a=>a[Math.floor(R()*a.length)];
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const INK='#1B1F3B';
const PALS=[['#FFE7A0','#F6BD45','#D9912A'],['#B5ECF4','#55C6DB','#2B95AE'],['#FFCADD','#F584AC','#C8527E'],['#C9F2C0','#7CD36B','#4BA13F'],['#DCCFFF','#A98BF5','#7557C9']];

// ---------- structures de cubes (hauteurs décroissantes vers l'avant : rien n'est caché derrière)
function genHeights(n,m,maxH,minT,maxT){
  for(let t=0;t<5000;t++){
    const h=[];let tot=0,cols=0;
    for(let x=0;x<n;x++){h.push([]);for(let y=0;y<m;y++){
      let v;
      if(!x&&!y)v=maxH;else{
        const cap=Math.min(x?h[x-1][y]:99,y?h[x][y-1]:99);
        const r=R();v=Math.max(0,cap-(r<0.5?0:r<0.85?1:2));
      }
      h[x].push(v);tot+=v;if(v)cols++;
    }}
    if(tot>=minT&&tot<=maxT&&cols>=Math.ceil(n*m*0.6))return h;
  }
  throw new Error('gen');
}
const C=0.866;
const P=(x,y,z,s)=>[(x-y)*C*s,((x+y)/2-z)*s];
function wrapSVG(polys,extra,pts,cls){
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  for(const [x,y] of pts){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y)}
  const pad=4;
  return `<svg class="${cls||''}" viewBox="${(x0-pad).toFixed(1)} ${(y0-pad).toFixed(1)} ${(x1-x0+2*pad).toFixed(1)} ${(y1-y0+2*pad).toFixed(1)}" xmlns="http://www.w3.org/2000/svg">${polys}${extra||''}</svg>`;
}
function isoSVG(h,{pal=PALS[0],arrow=null,cls='iso'}={}){
  const s=30,n=h.length,m=h[0].length,pts=[];let out='';
  const poly=(arr,fill)=>{const p=arr.map(a=>P(a[0],a[1],a[2],s));pts.push(...p);out+=`<polygon points="${p.map(q=>q[0].toFixed(1)+','+q[1].toFixed(1)).join(' ')}" fill="${fill}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`};
  for(let x=0;x<n;x++)for(let y=0;y<m;y++)for(let z=0;z<h[x][y];z++){
    if(y==m-1||h[x][y+1]<=z)poly([[x,y+1,z],[x+1,y+1,z],[x+1,y+1,z+1],[x,y+1,z+1]],pal[1]);
    if(x==n-1||h[x+1][y]<=z)poly([[x+1,y,z],[x+1,y+1,z],[x+1,y+1,z+1],[x+1,y,z+1]],pal[2]);
    if(z==h[x][y]-1)poly([[x,y,z+1],[x+1,y,z+1],[x+1,y+1,z+1],[x,y+1,z+1]],pal[0]);
  }
  let extra='';
  if(arrow){
    const a=arrow=='R'?[[n+2.3,m/2],[n+0.7,m/2]]:[[n/2,m+2.3],[n/2,m+0.7]];
    const A=P(a[0][0],a[0][1],0,s),B=P(a[1][0],a[1][1],0,s);
    const dx=B[0]-A[0],dy=B[1]-A[1],L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L;
    const hx=B[0]-ux*13,hy=B[1]-uy*13;
    extra+=`<line x1="${A[0]}" y1="${A[1]}" x2="${hx}" y2="${hy}" stroke="#E5383B" stroke-width="5" stroke-linecap="round"/>`+
      `<polygon points="${B[0]},${B[1]} ${hx-uy*8},${hy+ux*8} ${hx+uy*8},${hy-ux*8}" fill="#E5383B"/>`+
      `<text x="${A[0]}" y="${A[1]+20}" text-anchor="middle" font-size="13" font-weight="800" fill="#E5383B">VUE</text>`;
    pts.push(A,B,[A[0]-22,A[1]+24],[A[0]+22,A[1]+24]);
  }
  return wrapSVG(out,extra,pts,cls);
}
function mapSVG(h,pal){ // vue de dessus en perspective : hauteur de chaque pile
  const s=22,pts=[];let out='';
  for(let x=0;x<h.length;x++)for(let y=0;y<h[0].length;y++){if(!h[x][y])continue;
    const p=[[x,y],[x+1,y],[x+1,y+1],[x,y+1]].map(a=>P(a[0],a[1],0,s));pts.push(...p);
    const c=P(x+.5,y+.5,0,s);
    out+=`<polygon points="${p.map(q=>q[0].toFixed(1)+','+q[1].toFixed(1)).join(' ')}" fill="${pal[0]}" stroke="${INK}" stroke-width="1.2"/><text x="${c[0].toFixed(1)}" y="${(c[1]+4).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="800" fill="${INK}">${h[x][y]}</text>`;
  }
  return wrapSVG(out,'',pts,'map');
}
function viewSVG(prof,maxH,pal){
  const c=14;let out='';
  prof.forEach((v,i)=>{for(let z=0;z<v;z++)out+=`<rect x="${i*c}" y="${(maxH-1-z)*c}" width="${c}" height="${c}" fill="${pal[1]}" stroke="${INK}" stroke-width="1.3"/>`});
  out+=`<line x1="-3" y1="${maxH*c}" x2="${prof.length*c+3}" y2="${maxH*c}" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`;
  return `<svg class="view" viewBox="-5 -2 ${prof.length*c+10} ${maxH*c+5}" xmlns="http://www.w3.org/2000/svg">${out}</svg>`;
}

// ---------- hexominos et pliage
const norm=cs=>{const r0=Math.min(...cs.map(c=>c[0])),c0=Math.min(...cs.map(c=>c[1]));return cs.map(c=>[c[0]-r0,c[1]-c0]).sort((a,b)=>a[0]-b[0]||a[1]-b[1])};
const TF=[c=>[c[0],c[1]],c=>[c[1],-c[0]],c=>[-c[0],-c[1]],c=>[-c[1],c[0]],c=>[c[0],-c[1]],c=>[-c[1],-c[0]],c=>[-c[0],c[1]],c=>[c[1],c[0]]];
const key=cs=>JSON.stringify(cs);
const canon=cs=>TF.map(f=>key(norm(cs.map(f)))).sort()[0];
function hexominoes(){
  let set=new Map([[canon([[0,0]]),[[0,0]]]]);
  for(let k=1;k<6;k++){const nx=new Map();
    for(const cs of set.values())for(const [r,c] of cs)for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const q=[r+dr,c+dc];if(cs.some(a=>a[0]==q[0]&&a[1]==q[1]))continue;
      const n=[...cs,q];const ck=canon(n);if(!nx.has(ck))nx.set(ck,JSON.parse(ck));
    }
    set=nx;}
  return [...set.values()];
}
function fold(cs){ // renvoie pour chaque case la face du cube (0..5) ; paires opposées (0,1)(2,3)(4,5)
  const at=new Map(cs.map((c,i)=>[c[0]+','+c[1],i]));const face=Array(cs.length).fill(-1);
  const st=[[0,{U:0,D:1,N:2,S:3,E:4,W:5}]];face[0]=1;
  while(st.length){const [i,o]=st.pop();const [r,c]=cs[i];
    const mv=[[0,1,{...o,D:o.E,E:o.U,U:o.W,W:o.D}],[0,-1,{...o,D:o.W,W:o.U,U:o.E,E:o.D}],[-1,0,{...o,D:o.N,N:o.U,U:o.S,S:o.D}],[1,0,{...o,D:o.S,S:o.U,U:o.N,N:o.D}]];
    for(const [dr,dc,no] of mv){const j=at.get((r+dr)+','+(c+dc));if(j===undefined||face[j]>=0)continue;face[j]=no.D;st.push([j,no])}
  }
  return face;
}
const isNet=cs=>new Set(fold(cs)).size==6;
const HEX=hexominoes();
const NETS=HEX.filter(isNet),BAD=HEX.filter(c=>!isNet(c));
if(HEX.length!=35||NETS.length!=11)throw new Error('hexominos: '+HEX.length+'/'+NETS.length);
const has22=cs=>cs.some(([r,c])=>[[0,1],[1,0],[1,1]].every(([a,b])=>cs.some(q=>q[0]==r+a&&q[1]==c+b)));
const span=cs=>Math.max(Math.max(...cs.map(c=>c[0])),Math.max(...cs.map(c=>c[1])))+1;
const BAD_HARD=BAD.filter(c=>!has22(c)&&span(c)<=5);
const rot=cs=>norm(cs.map(pick(TF)));
function netSVG(cs,letters,pal){
  const c=18,w=Math.max(...cs.map(a=>a[1]))+1,hh=Math.max(...cs.map(a=>a[0]))+1;let out='';
  cs.forEach((a,i)=>{out+=`<rect x="${a[1]*c}" y="${a[0]*c}" width="${c}" height="${c}" fill="${pal[0]}" stroke="${INK}" stroke-width="1.4"/>`;
    if(letters)out+=`<text x="${a[1]*c+c/2}" y="${a[0]*c+c/2+4}" text-anchor="middle" font-size="10.5" font-weight="800" fill="${INK}">${letters[i]}</text>`});
  return `<svg class="${letters?'netbig':'net'}" viewBox="-2 -2 ${w*c+4} ${hh*c+4}" xmlns="http://www.w3.org/2000/svg">${out}</svg>`;
}

// ---------- énigmes
const L='ABCD';
const puzzles=[];
// Niveau 1 : cubes cachés
[[3,3,2,7,10],[3,3,3,10,14],[3,3,3,13,18],[3,4,3,14,20],[4,4,3,16,22],[4,4,4,20,27],[4,4,4,24,32],[4,5,4,26,36],[5,5,4,30,42],[5,5,5,38,52]].forEach((p,i)=>{
  const h=genHeights(...p),pal=PALS[i%5],tot=h.flat().reduce((a,b)=>a+b,0);
  const layers=[];for(let k=1;k<=p[2];k++)layers.push(h.flat().filter(v=>v>=k).length);
  puzzles.push({lvl:1,q:'Combien de cubes au total ?',fig:isoSVG(h,{pal}),ans:String(tot),
    sol:`${mapSVG(h,pal)}<div><b>${tot} cubes</b><br><small>Étages : ${layers.join(' + ')} = ${tot}</small></div>`});
});
// Niveau 2 : bonne vue
[[3,3,3],[3,3,3],[3,4,3],[4,3,3],[4,4,3],[4,4,4],[4,4,4],[4,5,4],[5,4,4],[5,5,5]].forEach((p,i)=>{
  for(;;){
    const [n,m,mx]=p,h=genHeights(n,m,mx,n*m,n*m*mx),pal=PALS[(i+2)%5],dir=i%2?'L':'R';
    const pr=[];for(let y=m-1;y>=0;y--)pr.push(Math.max(...h.map(r=>r[y])));
    const pl=h.map(r=>Math.max(...r));
    const good=dir=='R'?pr:pl,other=(dir=='R'?pl:pr).slice().reverse();
    const cand=[good.slice().reverse(),other];
    for(let t=0;t<40;t++){const v=good.slice(),k=ri(0,v.length-1);v[k]+=pick([-1,1]);if(v[k]>=1&&v[k]<=mx)cand.push(v)}
    const seen=new Set([good.join()]),opts=[];
    for(const c of cand){if(opts.length==3)break;if(seen.has(c.join()))continue;seen.add(c.join());opts.push(c)}
    if(opts.length<3||new Set(good).size<2)continue;
    const all=shuffle([good,...opts]),ai=all.indexOf(good);
    puzzles.push({lvl:2,q:'Quelle vue obtient-on depuis la flèche ?',fig:isoSVG(h,{pal,arrow:dir,cls:'iso small'}),
      opts:all.map(v=>viewSVG(v,mx,pal)),ans:L[ai],sol:`${viewSVG(good,mx,pal)}<div><b>Réponse ${L[ai]}</b></div>`});
    break;
  }
});
// Niveau 3 : bon dépliage
for(let i=0;i<10;i++){
  const pal=PALS[(i+4)%5];
  if(i<4){
    const good=rot(pick(NETS)),bad=shuffle(i<2?BAD:BAD_HARD).slice(0,3).map(rot),all=shuffle([good,...bad]),ai=all.indexOf(good);
    puzzles.push({lvl:3,q:'Quel patron se replie en cube ?',opts:all.map(c=>netSVG(c,null,pal)),ans:L[ai],sol:`${netSVG(good,null,pal)}<div><b>Réponse ${L[ai]}</b></div>`});
  }else if(i<7){
    const bad=rot(pick(BAD_HARD)),good=shuffle(NETS).slice(0,3).map(rot),all=shuffle([bad,...good]),ai=all.indexOf(bad);
    puzzles.push({lvl:3,q:'Quel patron ne forme PAS un cube ?',opts:all.map(c=>netSVG(c,null,pal)),ans:L[ai],sol:`${netSVG(bad,null,pal)}<div><b>Réponse ${L[ai]}</b><br><small>Deux faces se chevauchent.</small></div>`});
  }else{
    const net=rot(pick(NETS)),f=fold(net),let6=shuffle([...'ABCDEF']),k=ri(0,5),opp=f[k]^1,j=f.indexOf(opp);
    const pairs=[0,2,4].map(a=>let6[f.indexOf(a)]+'↔'+let6[f.indexOf(a+1)]).join(' · ');
    puzzles.push({lvl:3,q:`Cube replié : quelle face est opposée à ${let6[k]} ?`,fig:netSVG(net,let6,pal),ans:let6[j],sol:`<div><b>Face ${let6[j]}</b><br><small>${pairs}</small></div>`});
  }
}

// ---------- mise en page
const LV={1:['Cubes cachés','Compte tous les cubes, même ceux que tu ne vois pas.','Astuce : compte étage par étage, puis additionne.'],
          2:['La bonne vue','Place-toi à la flèche rouge : que vois-tu de face ?','Astuce : repère la pile la plus haute, puis sa position à gauche ou à droite.'],
          3:['Le bon dépliage','Replie le patron dans ta tête.','Astuce : choisis une face comme base et replie les autres une à une.']};
const pages=[];
pages.push(`<section class="page cover"><div class="tag">30 ÉNIGMES 3D</div>${isoSVG(genHeights(4,4,4,22,28),{pal:PALS[0],cls:'iso hero'})}<h1>CUBE <span>60</span></h1><p>60 secondes par énigme.<br>Ton score sur 30 ?</p></section>`);
pages.push(`<section class="page"><h2>Règles du jeu</h2><ol class="rules">
<li><b>Lance un chrono de 60 secondes</b> pour chaque énigme.</li>
<li><b>Décide de ta réponse</b> avant de regarder la solution.</li>
<li><b>1 point</b> par bonne réponse trouvée dans le temps.</li>
<li><b>Note ton score sur 30</b> dans la grille, à la fin du pack.</li></ol>
<div class="box"><b>À savoir pour les cubes</b><br>Aucun cube ne flotte : chacun repose sur le sol ou sur un autre cube. Aucune pile n'est cachée derrière une autre.</div>
<div class="levels"><div><b>Niveau 1</b>Cubes cachés<i>1 à 10</i></div><div><b>Niveau 2</b>La bonne vue<i>11 à 20</i></div><div><b>Niveau 3</b>Le bon dépliage<i>21 à 30</i></div></div></section>`);
puzzles.forEach((p,i)=>{
  if(i%10==0)pages.push(`<section class="page intro"><div class="tag">NIVEAU ${p.lvl}</div><h2>${LV[p.lvl][0]}</h2><p>${LV[p.lvl][1]}</p><div class="box">${LV[p.lvl][2]}</div><p class="dim">Énigmes ${i+1} à ${i+10}</p></section>`);
  pages.push(`<section class="page puzzle"><header><span>Niveau ${p.lvl} · ${LV[p.lvl][0]}</span><b>${String(i+1).padStart(2,'0')}<i>/30</i></b></header>
<h3>${p.q}</h3><div class="fig ${p.opts?'half':''}">${p.fig||''}</div>
${p.opts?`<div class="opts">${p.opts.map((o,k)=>`<div><b>${L[k]}</b>${o}</div>`).join('')}</div>`:''}
<footer><span class="timer">60 s</span><span>Solutions à la fin du pack</span></footer></section>`);
});
pages.push(`<section class="page"><h2>Ta grille de score</h2><p class="dim">1 point par bonne réponse trouvée en 60 secondes.</p>
<div class="grid">${puzzles.map((p,i)=>`<div class="l${p.lvl}">${i+1}</div>`).join('')}</div>
<table class="scale"><tr><td>0 à 9</td><td>Apprenti</td></tr><tr><td>10 à 17</td><td>Bâtisseur</td></tr><tr><td>18 à 24</td><td>Architecte</td></tr><tr><td>25 à 30</td><td>Maître du cube</td></tr></table>
<div class="box">Poste ton score sur 30 avec <b>#Cube60</b> et défie un ami.</div></section>`);
for(const lvl of [1,2,3]){
  const ps=puzzles.map((p,i)=>[p,i]).filter(a=>a[0].lvl==lvl);
  const chunks=lvl==1?[ps.slice(0,5),ps.slice(5)]:[ps];
  chunks.forEach(ch=>pages.push(`<section class="page sols s${lvl}"><h2>Solutions · Niveau ${lvl}</h2>${lvl==1?'<p class="dim">Chaque chiffre donne la hauteur de la pile.</p>':''}<div class="sollist">${ch.map(([p,i])=>`<div class="sol"><span class="n">${i+1}</span>${p.sol}</div>`).join('')}</div></section>`));
}
const css=`@page{size:108mm 192mm;margin:0}*{box-sizing:border-box}html,body{margin:0}
body{font-family:"Helvetica Neue",Arial,"DejaVu Sans",sans-serif;color:${INK}}
.page{width:108mm;height:192mm;padding:9mm 8mm;page-break-after:always;overflow:hidden;position:relative;background:#FBF8F1;display:flex;flex-direction:column}
h1,h2,h3,p{margin:0}h2{font-size:21pt;margin-bottom:4mm}h3{font-size:14.5pt;line-height:1.2;margin:3mm 0 2mm}
p{font-size:11.5pt;line-height:1.4}.dim{color:#6B6F8A;font-size:10pt}small{font-size:8.5pt;color:#555a78}
.tag{align-self:flex-start;background:#E5383B;color:#fff;font-weight:800;font-size:9pt;letter-spacing:.12em;padding:1.5mm 3mm;border-radius:99px;margin-bottom:4mm}
.box{background:#fff;border:1.5px solid ${INK};border-radius:3mm;padding:3.5mm;font-size:10.5pt;line-height:1.4;margin-top:5mm}
.cover{background:${INK};color:#fff;align-items:center;justify-content:center;text-align:center}.cover .tag{align-self:center}
.cover h1{font-size:44pt;letter-spacing:.02em;margin-top:6mm}.cover h1 span{color:#F6BD45}.cover p{font-size:13pt;margin-top:3mm;color:#d9dcf0}
.iso{width:100%;max-height:100%}.hero{max-height:80mm}.cover .iso polygon{stroke:#0d1024}
.rules{padding-left:5mm;margin:0;font-size:11.5pt;line-height:1.4}.rules li{margin-bottom:3mm}
.levels{display:flex;gap:2mm;margin-top:auto}.levels div{flex:1;background:${INK};color:#fff;border-radius:3mm;padding:3mm 2mm;font-size:8.5pt;text-align:center}.levels b{display:block;color:#F6BD45;font-size:9pt}.levels i{display:block;font-style:normal;opacity:.7;margin-top:1mm}
.intro{justify-content:center}.intro h2{font-size:27pt}.intro .dim{margin-top:6mm}
.puzzle header{display:flex;justify-content:space-between;align-items:baseline;font-size:9pt;color:#6B6F8A;border-bottom:1.5px solid ${INK};padding-bottom:2mm}
.puzzle header b{font-size:19pt;color:${INK}}.puzzle header i{font-style:normal;font-size:10pt;color:#6B6F8A}
.fig{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:2mm 0}.fig.half{flex:0 0 62mm}.fig:empty{display:none}
.fig svg{max-width:100%;max-height:100%}.netbig{width:70mm}
.opts{flex:1;min-height:0;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:2.5mm}
.opts>div{background:#fff;border:1.5px solid ${INK};border-radius:3mm;position:relative;display:flex;align-items:center;justify-content:center;padding:6mm 3mm 3mm;min-height:0}
.opts b{position:absolute;top:1.5mm;left:2.5mm;font-size:11pt}.opts svg{max-width:100%;max-height:100%}.view{width:24mm}.net{width:26mm}
footer{display:flex;justify-content:space-between;align-items:center;font-size:8.5pt;color:#6B6F8A;margin-top:3mm}
.timer{background:${INK};color:#F6BD45;font-weight:800;padding:1mm 3mm;border-radius:99px;font-size:9.5pt}
.grid{display:grid;grid-template-columns:repeat(6,1fr);gap:2mm;margin:5mm 0}.grid div{aspect-ratio:1;border:1.5px solid ${INK};border-radius:2mm;background:#fff;font-size:8pt;font-weight:700;padding:1mm;color:#6B6F8A}
.grid .l1{background:#FFF3CC}.grid .l2{background:#DDF5F9}.grid .l3{background:#EEE7FF}
.scale{width:100%;border-collapse:collapse;font-size:11pt}.scale td{padding:1.8mm 0;border-bottom:1px solid #d8d4c6}.scale td:first-child{font-weight:800;width:30%}
.sollist{flex:1;min-height:0;display:flex;flex-direction:column;justify-content:space-between}
.s2 .sollist,.s3 .sollist{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:2mm;align-content:space-between}
.sol{display:flex;align-items:center;gap:3mm;background:#fff;border:1.2px solid ${INK};border-radius:3mm;padding:2mm 3mm;font-size:11pt;line-height:1.25}
.sol .n{flex:none;width:7mm;height:7mm;border-radius:50%;background:${INK};color:#fff;font-size:9pt;font-weight:800;display:flex;align-items:center;justify-content:center}
.sol .map{width:30mm;max-height:24mm;flex:none}.sol .view{width:13mm;flex:none}.sol .net{width:13mm;max-height:16mm;flex:none}.s2 .sol,.s3 .sol{min-height:24mm;font-size:10pt;gap:2mm;padding:2mm}.s3 small{font-size:7pt}`;
const html=`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>CUBE 60</title><style>${css}</style></head><body>${pages.join('\n')}</body></html>`;
fs.writeFileSync(path.join(__dirname,'cube60.html'),html);
fs.writeFileSync(path.join(__dirname,'reponses.txt'),puzzles.map((p,i)=>`${i+1}. ${p.ans}`).join('\n')+'\n');
(async()=>{
  const b=await chromium.launch();const pg=await b.newPage({viewport:{width:408,height:726},deviceScaleFactor:2});
  await pg.goto('file://'+path.join(__dirname,'cube60.html'));
  await pg.pdf({path:path.join(__dirname,'CUBE60.pdf'),width:'108mm',height:'192mm',printBackground:true});
  await pg.locator('.page').first().screenshot({path:path.join(__dirname,'couverture.png')});
  const want=(process.argv[2]||'').split(',').filter(Boolean).map(Number);
  for(const k of want)await pg.locator('.page').nth(k).screenshot({path:path.join(process.argv[3],`p${k}.png`)});
  console.log('pages',pages.length);await b.close();
})();
