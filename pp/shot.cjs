const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1080}});
await p.goto('file://'+__dirname+'/pp.html');await p.waitForTimeout(300);
for(const id of ['a','b','c']){await p.locator('#'+id).screenshot({path:__dirname+`/pp-${id}.png`});}
// preview: circular crops at small size
await p.setContent(`<body style="margin:0;background:#fff;display:flex;gap:60px;padding:40px;align-items:center;font-family:Inter">${['a','b','c'].map((i,n)=>`<div style="text-align:center"><img src="file://${__dirname}/pp-${i}.png" style="width:300px;border-radius:50%"><br><img src="file://${__dirname}/pp-${i}.png" style="width:60px;border-radius:50%;margin-top:20px"><div style="font:700 28px Inter">${n+1}</div></div>`).join('')}</body>`);
await p.setViewportSize({width:1140,height:520});await p.screenshot({path:__dirname+'/apercu.png'});await b.close();})();
