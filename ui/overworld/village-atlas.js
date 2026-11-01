// Aurora hand-painted modular architecture atlas (48px cells, 4x4 variants).
const VILLAGE_BUILDING_ATLAS = (() => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192">
  <defs>
    <linearGradient id="wall" x2="0" y2="1"><stop stop-color="#82745d"/><stop offset="1" stop-color="#40382f"/></linearGradient>
    <linearGradient id="roof" x2="0" y2="1"><stop stop-color="#65505a"/><stop offset="1" stop-color="#29252e"/></linearGradient>
    <linearGradient id="wood" x2="0" y2="1"><stop stop-color="#9b7047"/><stop offset="1" stop-color="#4d3425"/></linearGradient>
  </defs>
  ${Array.from({length:16},(_,i)=>{const x=i%4*48,y=Math.floor(i/4)*48; const kind=i%4;
    return `<g transform="translate(${x} ${y})">
    <rect x="2" y="3" width="44" height="44" fill="#090b0c" opacity=".35"/>
    <rect x="4" y="15" width="40" height="31" fill="url(#wall)" stroke="#28231f" stroke-width="2"/>
    <path d="M0 17L24 0 48 17 44 22 24 8 4 22Z" fill="url(#roof)" stroke="#241e28" stroke-width="2"/>
    <path d="M5 18L24 5 43 18" fill="none" stroke="#b49a78" stroke-opacity=".5" stroke-width="1.5"/>
    <rect x="8" y="23" width="8" height="10" fill="#18242a" stroke="#2a1f1b"/>
    <rect x="32" y="23" width="8" height="10" fill="#18242a" stroke="#2a1f1b"/>
    <path d="M9 28h6m-3-5v10M33 28h6m-3-5v10" stroke="#d6a96c" stroke-width="1"/>
    <rect x="19" y="30" width="10" height="16" fill="url(#wood)" stroke="#2c2019" stroke-width="1.5"/>
    <circle cx="26" cy="38" r="1" fill="#e8c178"/>
    <path d="M5 45h38" stroke="#c2a27a" stroke-width="2" opacity=".55"/>
    ${kind===1?`<path d="M3 15L24 0 45 15" fill="#786149" opacity=".5"/><rect x="20" y="22" width="8" height="6" fill="#f1bd65"/>`:''}
    ${kind===2?`<rect x="18" y="19" width="12" height="8" fill="#18242a" stroke="#2a1f1b"/><path d="M24 19v8m-6-4h12" stroke="#d6a96c"/>`:''}
    ${kind===3?`<path d="M24 0v17" stroke="#c4a77c" stroke-width="2"/><rect x="6" y="34" width="7" height="10" fill="#4d3425"/>`:''}
    </g>`;}).join('')}
  </svg>`;
  if (typeof Image === 'undefined') return null;
  const img=new Image(); img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg); return img;
})();
let villageAtlasReady=false;
if (VILLAGE_BUILDING_ATLAS) VILLAGE_BUILDING_ATLAS.onload=()=>{villageAtlasReady=true;};
export function drawVillageBuilding(ctx,x,y,size,variant=0){
  if(!villageAtlasReady)return false;
  const col=variant%4,row=Math.floor(variant/4)%4;
  ctx.drawImage(VILLAGE_BUILDING_ATLAS,col*48,row*48,48,48,x,y,size,size);
  return true;
}
