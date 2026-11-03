// Aurora village artwork rendered entirely with Canvas 2D.
// No external vector artwork: buildings are layered, palette-driven illustrations.
const BUILDINGS = Object.freeze({
  hall:    { wall:'#c7a477', shade:'#866044', roof:'#4b3942', roofHi:'#80606a', trim:'#e5c99b', sign:'#d6b66e', window:'#f4c875', chimney:true, crest:'✦' },
  forge:   { wall:'#a87954', shade:'#674735', roof:'#46363a', roofHi:'#765044', trim:'#d6a66e', sign:'#b96c3d', window:'#ff9b4e', chimney:true, crest:'⚒' },
  healer:  { wall:'#d3c39a', shade:'#91845e', roof:'#64704e', roofHi:'#91a16a', trim:'#f0dfb2', sign:'#71965e', window:'#f8d78a', chimney:false, crest:'✚' },
  alchemy: { wall:'#b69b78', shade:'#76634e', roof:'#4c5960', roofHi:'#71868a', trim:'#d9c59b', sign:'#789b83', window:'#b7e6bc', chimney:true, crest:'⚗' },
  market:  { wall:'#c9a06e', shade:'#896442', roof:'#9a5840', roofHi:'#c47b4c', trim:'#f0d19a', sign:'#bd7444', window:'#f7d18a', chimney:false, crest:'◆' },
  tavern:  { wall:'#bd8c5f', shade:'#78513c', roof:'#553b36', roofHi:'#8a5945', trim:'#e6bd83', sign:'#a84e39', window:'#ffc66e', chimney:true, crest:'★' },
  home:    { wall:'#c9b18a', shade:'#88745b', roof:'#59604a', roofHi:'#89916a', trim:'#e5d1aa', sign:'#8a7452', window:'#f5d28a', chimney:false, crest:'' }
});

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function polygon(ctx, points, fill, stroke, lineWidth=1) {
  ctx.beginPath(); ctx.moveTo(points[0][0], points[0][1]);
  for (let i=1;i<points.length;i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath(); if (fill) { ctx.fillStyle=fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle=stroke; ctx.lineWidth=lineWidth; ctx.stroke(); }
}
function rounded(ctx,x,y,w,h,r,fill,stroke) {
  ctx.beginPath(); ctx.roundRect(x,y,w,h,r); ctx.fillStyle=fill; ctx.fill();
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}
}
function line(ctx,x1,y1,x2,y2,color,width=2) {
  ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();
}
function makeGroundPattern(ctx) {
  const tile=document.createElement('canvas'); tile.width=256; tile.height=256;
  const g=tile.getContext('2d');
  g.fillStyle='#657d50';g.fillRect(0,0,256,256);
  let seed=0xA170A;
  const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<260;i++){
    const x=rand()*256,y=rand()*256,r=1+rand()*5;
    g.fillStyle=rand()>.5?'rgba(191,177,112,.12)':'rgba(28,57,38,.13)';
    g.beginPath();g.ellipse(x,y,r*1.7,r,rand()*Math.PI,0,Math.PI*2);g.fill();
  }
  for(let i=0;i<95;i++){
    const x=rand()*256,y=rand()*256;
    g.strokeStyle=rand()>.5?'rgba(205,204,132,.32)':'rgba(34,68,38,.35)';
    g.lineWidth=1;g.beginPath();g.moveTo(x,y);g.lineTo(x-2+rand()*5,y-2-rand()*5);g.stroke();
  }
  return ctx.createPattern(tile,'repeat');
}
let groundPattern=null;
export function drawAuroraGround(ctx,cameraX,cameraY,worldWidth,worldHeight){
  if(!groundPattern) groundPattern=makeGroundPattern(ctx);
  ctx.save();ctx.fillStyle=groundPattern;
  ctx.fillRect(-cameraX,-cameraY,worldWidth,worldHeight);
  // Soft sunlit variation prevents a flat, uniform floor.
  const glow=ctx.createRadialGradient(520-cameraX,340-cameraY,20,520-cameraX,340-cameraY,680);
  glow.addColorStop(0,'rgba(230,205,133,.13)');glow.addColorStop(1,'rgba(230,205,133,0)');
  ctx.fillStyle=glow;ctx.fillRect(-cameraX,-cameraY,worldWidth,worldHeight);
  ctx.restore();
}

function drawRoof(ctx,p) {
  polygon(ctx,[[-132,-111],[-91,-190],[4,-218],[133,-151],[133,-112],[4,-174],[-91,-151]],p.roof,'#302a2b',5);
  polygon(ctx,[[-132,-111],[-91,-190],[4,-218],[4,-174],[-91,-151]],p.roofHi,'rgba(255,225,174,.28)',2);
  polygon(ctx,[[4,-218],[133,-151],[133,-112],[4,-174]],p.roof,'rgba(25,25,24,.4)',2);
  // Individual roof courses and shingle highlights.
  for(let row=0;row<4;row++){
    const yy=-184+row*17, inset=row*8;
    line(ctx,-88+inset,yy,0,yy-25,p.roofHi,2);
    line(ctx,8,yy-24,119-inset,yy+31,p.roofHi,2);
  }
  line(ctx,-91,-190,4,-218,'#d6b58a',4);
  line(ctx,4,-218,133,-151,'#d6b58a',4);
  polygon(ctx,[[-139,-111],[-91,-151],[4,-174],[4,-160],[-91,-137],[-139,-98]],'#352b2a','#211f20',2);
  polygon(ctx,[[4,-174],[133,-112],[133,-96],[4,-160]],'#30282a','#211f20',2);
}
function drawWindow(ctx,x,y,p,glow=true){
  ctx.save();
  rounded(ctx,x-16,y-24,32,45,5,'#332a28','#2a2422');
  rounded(ctx,x-12,y-20,24,37,3,glow?p.window:'#52604c','#d5b27b');
  ctx.fillStyle='rgba(255,239,183,.45)';ctx.fillRect(x-9,y-17,5,29);
  line(ctx,x,y-20,x,y+17,'#513b2d',3);line(ctx,x-12,y-2,x+12,y-2,'#513b2d',3);
  polygon(ctx,[[x-20,y-25],[x,y-34],[x+20,y-25],[x+16,y-19],[x-16,y-19]],p.trim,'#3a2b26',2);
  ctx.restore();
}
function drawBuilding(ctx,x,y,style){
  const p=BUILDINGS[style]||BUILDINGS.home;
  ctx.save();ctx.translate(x,y);
  // Broad contact shadow and stone plinth.
  ctx.fillStyle='rgba(17,25,17,.36)';ctx.beginPath();ctx.ellipse(0,8,145,31,0,0,Math.PI*2);ctx.fill();
  polygon(ctx,[[-126,-111],[0,-143],[126,-111],[126,2],[0,35],[-126,2]],'#5c5142','#332e29',3);
  polygon(ctx,[[-126,-111],[0,-143],[0,18],[-126,2]],p.wall,'#47382d',2);
  polygon(ctx,[[0,-143],[126,-111],[126,2],[0,18]],p.shade,'#47382d',2);
  // Limewash, aged plaster and exposed timber framing.
  for(let i=0;i<7;i++){
    const yy=-98+i*17;
    line(ctx,-116,yy,-7,yy+13,'rgba(255,231,184,.13)',1);
    line(ctx,8,yy+13,116,yy-yy*.0+yy*0+yy+27,'rgba(32,27,25,.12)',1);
  }
  line(ctx,-119,-103,-119,-2,'#49372b',8);line(ctx,-8,-132,-8,17,'#49372b',8);
  line(ctx,119,-108,119,-1,'#382d28',8);line(ctx,8,-132,119,-104,'#49372b',7);
  line(ctx,-119,-3,-8,25,'#49372b',7);line(ctx,8,25,119,-3,'#382d28',7);
  // Lower stone courses, each block offset like real masonry.
  for(let row=0;row<2;row++) for(let col=0;col<5;col++){
    const bx=-119+col*23+(row%2)*7, by=-1+row*13;
    rounded(ctx,bx,by,20,10,2,row?'#756b59':'#8d8067','#5a5145');
  }
  // Roof is drawn over the upper wall, then its edge receives carved fascia.
  drawRoof(ctx,p);
  line(ctx,-137,-108,4,-169,'#d4b58a',5);line(ctx,4,-169,139,-105,'#d4b58a',5);
  // Gable vent and decorative braces.
  polygon(ctx,[[-35,-184],[4,-202],[43,-181],[4,-165]],'#40342f','#b99569',2);
  rounded(ctx,-5,-185,18,13,3,'#29292a','#d0a976');
  line(ctx,-112,-124,-83,-140,'#d9b47d',4);line(ctx,84,-140,117,-124,'#d9b47d',4);
  // Door with inset panels, stone step, iron handle.
  polygon(ctx,[[-20,17],[-20,-57],[0,-68],[20,-57],[20,22],[0,30]],'#3b2925','#241f1d',3);
  polygon(ctx,[[-15,15],[-15,-53],[0,-61],[0,25]],'#86583a','#d1a16b',2);
  polygon(ctx,[[2,-60],[15,-53],[15,18],[2,23]],'#65422f','#332721',2);
  line(ctx,-12,-24,12,-24,'#c1945e',3);line(ctx,-12,-4,12,-4,'#c1945e',3);
  ctx.fillStyle='#e4c17d';ctx.beginPath();ctx.arc(11,-20,2.7,0,Math.PI*2);ctx.fill();
  polygon(ctx,[[-28,22],[0,29],[29,20],[26,29],[0,39],[-28,31]],'#b5a184','#51473b',2);
  // Windows, flower boxes and shutters.
  drawWindow(ctx,-76,-55,p);drawWindow(ctx,76,-55,p);
  for(const wx of [-76,76]){
    rounded(ctx,wx-23,-27,46,7,2,'#65412e','#382b24');
    for(let f=0;f<4;f++){ctx.fillStyle=['#d35c56','#e8b85f','#9eaf65'][f%3];ctx.beginPath();ctx.arc(wx-15+f*10,-31-(f%2)*3,4,0,Math.PI*2);ctx.fill();}
  }
  // Business sign unique to each building.
  if(p.crest){
    ctx.fillStyle='#302722';ctx.fillRect(86,-92,4,34);
    rounded(ctx,72,-113,34,25,5,p.sign,'#3b2b25');
    ctx.fillStyle='#f6e1b6';ctx.font='bold 16px Georgia,serif';ctx.textAlign='center';ctx.fillText(p.crest,89,-95);
  }
  // Chimney, smoke and roof-side dormer.
  if(p.chimney){
    polygon(ctx,[[77,-185],[77,-224],[105,-232],[105,-168]],'#815a48','#3e302a',3);
    polygon(ctx,[[73,-224],[91,-235],[109,-228],[105,-217],[77,-214]],'#bd9872','#4b382e',2);
    for(let i=0;i<3;i++){ctx.fillStyle='rgba(239,224,196,.15)';ctx.beginPath();ctx.arc(93+i*5,-245-i*8,7+i*2,0,Math.PI*2);ctx.fill();}
  }
  // Warm wall lamps and foundation moss.
  for(const lx of [-108,108]){
    ctx.fillStyle='#392a23';ctx.fillRect(lx-2,-49,4,13);
    ctx.fillStyle='#f4bd64';ctx.beginPath();ctx.arc(lx,-53,5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(255,190,87,.16)';ctx.beginPath();ctx.arc(lx,-53,17,0,Math.PI*2);ctx.fill();
  }
  for(let i=0;i<12;i++){ctx.fillStyle=i%2?'#637b4d':'#87915a';ctx.fillRect(-119+i*21,7+(i%3)*3,5,3);}
  // Small identifying details per service building.
  if(style==='forge'){ctx.fillStyle='#f08a3d';ctx.beginPath();ctx.arc(49,7,8+Math.sin(performance.now()/250)*2,0,Math.PI*2);ctx.fill();line(ctx,38,13,58,13,'#392b24',3);}
  if(style==='healer'){ctx.fillStyle='#6d9a61';ctx.fillRect(-4,-104,8,25);ctx.fillRect(-13,-95,26,7);}
  if(style==='alchemy'){for(let i=0;i<3;i++){ctx.fillStyle=['#9bd5ae','#b5a3df','#e4c16d'][i];ctx.beginPath();ctx.arc(48+i*13,3,5,0,Math.PI*2);ctx.fill();}}
  if(style==='market'){ctx.fillStyle='#e0bd79';ctx.fillRect(-111,5,29,7);ctx.fillStyle='#a44e3c';ctx.fillRect(-108,12,24,4);}
  if(style==='tavern'){ctx.fillStyle='#f4c875';ctx.font='bold 10px Georgia';ctx.textAlign='center';ctx.fillText('ТРАКТИР',0,-79);}
  if(style==='hall'){polygon(ctx,[[-5,-218],[4,-239],[13,-218]],'#d8bd7d','#5b4633',2);}
  ctx.restore();
}
export function drawAuroraBuilding(ctx,x,y,style='home'){drawBuilding(ctx,x,y,style);return true;}
