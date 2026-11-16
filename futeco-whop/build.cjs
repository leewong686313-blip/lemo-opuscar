// Génère les vignettes Whop (16:9 et carré) et la photo de profil
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
const src = f => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(__dirname,'src',f)).toString('base64');
const P = [
 {id:'factures', img:'factures-net.jpg', kicker:'Guide pratique 2026', title:'Factures &amp; abonnements', sub:'Payez moins chaque mois, sans changer vos habitudes', chips:['31 leçons','Messages prêts à copier','Accès à vie'], price:'5,90 €', pos:'62% 30%', wsize:'142%', wpos:'45% 0%'},
 {id:'voyage', img:'voyage-net.jpg', kicker:'Guide pratique 2026', title:'Voyager moins cher', sub:'Partez plus souvent, sans mauvaises surprises', chips:['36 leçons','Billets, logement, réclamations','Accès à vie'], price:'7,90 €', pos:'50% 30%'},
 {id:'repas', img:'repas-net.jpg', kicker:'Guide pratique 2026', title:'30 jours de repas en famille', sub:'Fini le « on mange quoi ce soir ? »', chips:['45 leçons','Menus + listes de courses','Accès à vie'], price:'9,90 €', pos:'50% 18%', wsize:'142%', wpos:'40% 0%'},
 {id:'courses', img:'courses-net.jpg', kicker:'Guide pratique 2026', title:'Faire ses courses moins cher', sub:'Remplissez le caddie en payant moins, chaque semaine', chips:['33 leçons','Promos, applis, anti-gaspi','Accès à vie'], price:'5,90 €', pos:'50% 30%'},
 {id:'pack-complet', img:'pack-net.jpg', kicker:'Pack complet · 4 guides', title:'Tout votre budget allégé', sub:'Factures, courses, repas et voyages réunis', chips:['145 leçons','4 guides','Accès à vie'], price:'19,90 €', old:'29,60 €', badge:'−33 %', pos:'50% 30%'},
];
const css = `
*{margin:0;box-sizing:border-box}
body{font-family:'Inter',sans-serif;}
.c{position:relative;overflow:hidden;background:radial-gradient(120% 120% at 80% 30%,#FFF8EE 0%,#F8E9D6 55%,#F1D9BE 100%);color:#2A1A10}
.img{position:absolute;top:0;bottom:0;right:0;background-size:cover;-webkit-mask-image:linear-gradient(90deg,transparent 0,#000 22%);}
.brand{display:inline-flex;align-items:center;gap:10px;font-weight:800;letter-spacing:-.5px}
.brand b{background:linear-gradient(90deg,#F26B1D,#D7261E);-webkit-background-clip:text;color:transparent}
.dot{width:12px;height:12px;border-radius:50%;background:#D7261E}
.kick{font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#C2410C}
h1{font-family:'Inter Display','Inter',sans-serif;font-weight:900;letter-spacing:-2px;line-height:.98}
.sub{font-weight:500;color:#5B4636;line-height:1.3}
.chips{display:flex;flex-wrap:wrap;gap:10px}
.chip{background:#fff;border:2px solid #F1D2B3;border-radius:999px;font-weight:700;color:#7C2D12;white-space:nowrap}
.price{display:inline-flex;align-items:baseline;gap:14px;background:linear-gradient(90deg,#F26B1D,#D7261E);color:#fff;border-radius:22px;font-weight:900;box-shadow:0 10px 30px rgba(215,38,30,.3)}
.price s{font-weight:600;opacity:.8}
.badge{position:absolute;background:#2A1A10;color:#FFD9A8;font-weight:900;border-radius:50%;display:flex;align-items:center;justify-content:center;transform:rotate(-10deg)}
`;
function wide(p){return `<div class="c" style="width:1280px;height:720px">
 <div class="img" style="width:52%;-webkit-mask-image:linear-gradient(90deg,transparent 0,#000 16%);background-image:url(${src(p.img)});background-size:auto ${p.wsize||'128%'};background-position:${p.wpos||'40% 22%'}"></div>
 <div style="position:absolute;left:64px;top:56px;width:610px;display:flex;flex-direction:column;gap:22px">
  <div class="brand" style="font-size:30px"><span class="dot"></span><b>FutÉco</b></div>
  <div class="kick" style="font-size:20px;margin-top:10px">${p.kicker}</div>
  <h1 style="font-size:${p.title.length>24?70:80}px">${p.title}</h1>
  <div class="sub" style="font-size:28px;max-width:560px">${p.sub}</div>
  <div class="chips">${p.chips.map(c=>`<span class="chip" style="font-size:19px;padding:9px 18px">${c}</span>`).join('')}</div>
  <div><span class="price" style="font-size:44px;padding:14px 30px">${p.old?`<s style="font-size:26px">${p.old}</s>`:''}${p.price}</span></div>
 </div>
 ${p.badge?`<div class="badge" style="width:130px;height:130px;font-size:34px;right:48px;top:44px">${p.badge}</div>`:''}
</div>`}
function square(p){return `<div class="c" style="width:1080px;height:1080px">
 <div class="img" style="width:100%;top:300px;-webkit-mask-image:linear-gradient(180deg,transparent 0,#000 18%);background-image:url(${src(p.img)});background-position:${p.pos}"></div>
 <div style="position:absolute;left:72px;top:64px;right:72px;display:flex;flex-direction:column;gap:18px">
  <div class="brand" style="font-size:34px"><span class="dot"></span><b>FutÉco</b></div>
  <h1 style="font-size:${p.title.length>24?84:96}px">${p.title}</h1>
 </div>
 <div style="position:absolute;left:72px;bottom:72px"><span class="price" style="font-size:60px;padding:18px 36px">${p.old?`<s style="font-size:34px">${p.old}</s>`:''}${p.price}</span></div>
 ${p.badge?`<div class="badge" style="width:170px;height:170px;font-size:46px;right:64px;bottom:64px">${p.badge}</div>`:''}
</div>`}
function pp(){return `<div style="width:1080px;height:1080px;background:linear-gradient(135deg,#F26B1D,#D7261E);display:flex;align-items:center;justify-content:center">
 <div style="width:880px;height:880px;border-radius:50%;background:radial-gradient(circle at 50% 40%,#FFF8EE,#F6E3CC);overflow:hidden;position:relative;box-shadow:0 0 0 18px rgba(255,255,255,.35)">
  <div style="position:absolute;inset:0;background-image:url(${src('tirelire-net.jpg')});background-size:1333px auto;background-position:-223px 20px"></div>
 </div></div>`}
(async()=>{
 const b=await chromium.launch(); const pg=await b.newPage({deviceScaleFactor:1});
 const out=path.join(__dirname,'vignettes'); fs.mkdirSync(out,{recursive:true});
 const shot=async(html,w,h,f)=>{await pg.setViewportSize({width:w,height:h});await pg.setContent(`<html><head><style>${css}</style></head><body>${html}</body></html>`);await pg.evaluate(()=>document.fonts.ready);await pg.screenshot({path:path.join(out,f)});};
 for(const p of P){await shot(wide(p),1280,720,`${p.id}-1280x720.png`);await shot(square(p),1080,1080,`${p.id}-carre.png`);}
 await shot(pp(),1080,1080,'photo-profil.png');
 await b.close();
})();
