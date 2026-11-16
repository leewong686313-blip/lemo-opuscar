// Photo de profil TikTok : renard plein cadre (TikTok coupe en rond)
const { chromium } = require('playwright'); const fs=require('fs'); const path=require('path');
const img='data:image/jpeg;base64,'+fs.readFileSync(path.join(__dirname,'src/tirelire-net.jpg')).toString('base64');
const html=`<body style="margin:0"><div style="width:1080px;height:1080px;position:relative;overflow:hidden;background:radial-gradient(circle at 50% 45%,#FFE45C 0%,#FFC21A 55%,#F59E0B 100%)">
<div style="position:absolute;inset:60px;border-radius:50%;background:radial-gradient(circle at 50% 40%,#FFF8EE,#F6E3CC);overflow:hidden;box-shadow:0 0 0 14px #fff">
<div style="position:absolute;inset:0;background-image:url(${img});background-size:1420px auto;background-position:-172px -100px"></div></div></div></body>`;
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1080}});await p.setContent(html);await p.screenshot({path:path.join(__dirname,'vignettes/photo-profil-tiktok.png')});
await p.setContent(html.replace('<body style="margin:0">','<body style="margin:0;background:#fff"><div style="width:1080px;height:1080px;border-radius:50%;overflow:hidden">')+'</div>');
await p.screenshot({path:'/tmp/claude-0/-home-user-lemo-opuscar/5b5bd110-8146-5459-a470-c7a88bb5ee1a/scratchpad/tt.png'});await b.close();})();
