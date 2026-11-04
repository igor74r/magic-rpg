import { drawAuroraBuilding } from './aurora-art.js';

// Пиксельные 2D-модели героев и существ; архитектура Авроры рисуется Canvas 2D.
// Все спрайты создаются локально через Canvas 2D.
// Маски: o — контур, a — основной цвет, b — тень,
// s — кожа, e — глаза/свечение, w — металл, c — акцент.

const OUTLINE = '#080a12';

function pal(
  a,
  b,
  s = '#e8b48a',
  e = '#101018',
  w = '#c9d6ea',
  c = '#7ce7ff'
) {
  return {
    o: OUTLINE,
    a,
    b,
    k: b,
    s,
    e,
    w,
    c
  };
}

const HUMANOID = [
  '....oooo....',
  '...oaaaao...',
  '..oaaaaaao..',
  '..oasseeso..',
  '..oasseeso..',
  '..oaaaaaao..',
  '...oaaaao...',
  '....oooo....',
  '..oobbbboo..',
  '.oobaaaaboo.',
  '.oobaaaaboo.',
  '.oobaaaaboo.',
  '..oobbbboo..',
  '...oo..oo...',
  '...oo..oo...',
  '..ooo..ooo..'
];

const WOLF = [
  '..............',
  '..oo......oo..',
  '.owwo....owwo.',
  '.owwwoooowwwo.',
  '..owwwwwwwwo..',
  '..owewwwewwo..',
  '..owwwwwwwwo..',
  '...owwwwwwo...',
  '....oo..oo....',
  '...oo....oo...'
];

const GHOST = [
  '....oooo....',
  '...oaaaao...',
  '..oaaaaaao..',
  '..oaeaeaao..',
  '..oaaaaaao..',
  '..oaaaaaao..',
  '..oaaaaaao..',
  '..oaaaaaao..',
  '..oaaaaaao..',
  '..oaaoaao.a.',
  '..oao.oao.a.',
  '..o..o..o...'
];

const ELEMENTAL = [
  '.....oo.....',
  '....oaao....',
  '...oaaaao...',
  '..oaaaaaao..',
  '..oaeeeaao..',
  '.oaaaaaaaao.',
  '.oaaaaaaaao.',
  '.oaaaaaaaao.',
  '..oaaaaaao..',
  '..oaaaaaao..',
  '...oaaaao...',
  '....oooo....'
];

const DRAGON = [
  '................',
  'oo............oo',
  'oaoo........ooao',
  'oaaooookkoooaaao',
  'oaaaokkkkkkoaaao',
  '.oaaokekekkooao.',
  '.oaaokkkkkkoao..',
  '..oaokkkkkkoa...',
  '...ookkkkkoo....',
  '....okkkko......',
  '...ookkkkoo.....',
  '..oo.oooo.oo....'
];

const HARPY = [
  '................',
  '..oo........oo..',
  '.obbo......obbo.',
  '..obbo....obbo..',
  '...obbo..obbo...',
  '....oaaaaao.....',
  '...oaaeeaaao....',
  '...oaaaaaaao....',
  '....oaaaaao.....',
  '.....oaaao......',
  '.....o.bb.o.....',
  '....oo....oo....',
  '...oo......oo...'
];

const WELL = [
  '....oooooo....',
  '..oobbbbbboo..',
  '.obbbbbbbbbbo.',
  '.obbooooobbbo.',
  'obbobbbbbobbbo',
  'obboaaaaaobbbo',
  'obboaaaaaobbbo',
  '.obbooooobbbo.',
  '.obbbbbbbbbbo.',
  '..oobbbbbboo..',
  '....oooooo....',
  '..............'
];

const BOARD = [
  '..oooooooooo..',
  '..obbbbbbbbo..',
  '..obaaaaaabo..',
  '..obawawaabo..',
  '..obaaaaaabo..',
  '..obawawwabo..',
  '..obaaaaaabo..',
  '..obbbbbbbbo..',
  '....o....o....',
  '....o....o....',
  '....o....o....',
  '...oo....oo...'
];

const CRYSTAL = [
  '....oo....',
  '...oaao...',
  '..oaaaao..',
  '.oaaaaaao.',
  'oaaaaaaaao',
  '.oaaaaaao.',
  '..oaaaao..',
  '...oaao...',
  '....oo....'
];

const CHEST = [
  '..oooooooo..',
  '..obbbbbbo..',
  '..obaaaabo..',
  '..obawwabo..',
  '..obaaaaabo.',
  '..obbbbbbo..',
  '..oooooooo..',
  '...o....o...',
  '...o....o...'
];

const ALTAR = [
  '...oooooo...',
  '..obbbbbbo..',
  '.obaaaaaabo.',
  '.obaaaaaabo.',
  '..obbbbbbo..',
  '...o....o...',
  '...o....o...',
  '..oo....oo..'
];

// ---------- МОДЕЛИ ГЕРОЕВ ----------

const HEROES = {
  warrior: pal(
    '#8fa3c8',
    '#b4543a',
    '#e8b48a',
    '#101018',
    '#dbe6f6',
    '#ffcf6e'
  ),

  mage: pal(
    '#34407a',
    '#7ce7ff',
    '#e8b48a',
    '#101018',
    '#c9d6ea',
    '#7ce7ff'
  ),

  archer: pal(
    '#536e48',
    '#b47b43',
    '#e8b48a',
    '#101018',
    '#d3dfc2',
    '#d8bd71'
  ),

  // Только для визуальной совместимости старых сохранений.
  priest: pal(
    '#d8d2c0',
    '#ffd27a',
    '#e8b48a',
    '#101018',
    '#fff4d6',
    '#ffd27a'
  )
};

// ---------- МОДЕЛИ ВРАГОВ ----------

const ENEMY_ART = {
  goblin: {
    mask: HUMANOID,
    pal: pal('#5f8f3a', '#3f5f28', '#9ccc65', '#101018'),
    scale: 2
  },

  skeleton: {
    mask: HUMANOID,
    pal: pal('#d8d8c8', '#8a8a7a', '#d8d8c8', '#101018'),
    scale: 2
  },

  'skeleton-archer': {
    mask: HUMANOID,
    pal: pal('#c8c8b0', '#6a6a5a', '#c8c8b0'),
    scale: 2
  },

  'dark-knight': {
    mask: HUMANOID,
    pal: pal('#4a5470', '#222a40', '#c8d6ea', '#0cf'),
    scale: 2
  },

  'shadow-mage': {
    mask: HUMANOID,
    pal: pal('#3a2a5a', '#b28dff', '#c9b8e8', '#e0d0ff'),
    scale: 2
  },

  wolf: {
    mask: WOLF,
    pal: pal('#6a6a72', '#3a3a42', '#6a6a72', '#ff4040'),
    scale: 2
  },

  'frost-wolf': {
    mask: WOLF,
    pal: pal('#9fd8e8', '#5a8aa0', '#d8f4ff', '#7ce7ff'),
    scale: 2
  },

  ghost: {
    mask: GHOST,
    pal: pal('#8fd8e8', '#5aa0b0', '#8fd8e8', '#eaffff'),
    scale: 2
  },

  wraith: {
    mask: GHOST,
    pal: pal('#7a6aa8', '#4a3a78', '#7a6aa8', '#d0c0ff'),
    scale: 2
  },

  'dust-wraith': {
    mask: GHOST,
    pal: pal('#c8b090', '#8a7050', '#c8b090', '#fff0c0'),
    scale: 2
  },

  'grave-king': {
    mask: HUMANOID,
    pal: pal('#5a4a6a', '#c9a227', '#cfc0a0', '#ffd060'),
    scale: 3
  },

  'sand-king': {
    mask: HUMANOID,
    pal: pal('#d8b060', '#8a6a20', '#e8d0a0', '#ffd060'),
    scale: 3
  },

  'ice-queen': {
    mask: HUMANOID,
    pal: pal('#9fd8e8', '#4a7aa0', '#e0f4ff', '#7ce7ff'),
    scale: 3
  },

  'fire-elemental': {
    mask: ELEMENTAL,
    pal: pal('#ff7a3a', '#ffd060', '#ff7a3a', '#fff2c0'),
    scale: 2
  },

  'ice-elemental': {
    mask: ELEMENTAL,
    pal: pal('#7ce7ff', '#c0f4ff', '#7ce7ff', '#ffffff'),
    scale: 2
  },

  'magma-golem': {
    mask: HUMANOID,
    pal: pal('#6a4a3a', '#ff6020', '#8a6a4a', '#ffd060'),
    scale: 3
  },

  'sand-worm': {
    mask: WOLF,
    pal: pal('#c8a870', '#8a6a3a', '#c8a870', '#3a2a1a'),
    scale: 2
  },

  'flying-tome': {
    mask: BOARD,
    pal: pal('#d8c8a0', '#7a5a3a', '#d8c8a0', '#7ce7ff'),
    scale: 2
  },

  'book-guardian': {
    mask: HUMANOID,
    pal: pal('#7a5a3a', '#c9a227', '#d8c8a0', '#ffd060'),
    scale: 2
  },

  archmage: {
    mask: HUMANOID,
    pal: pal('#2a3a6a', '#7ce7ff', '#c9b8e8', '#e0f4ff'),
    scale: 3
  },

  dragonling: {
    mask: DRAGON,
    pal: pal('#4a7a3a', '#8ac860', '#4a7a3a', '#ffd060'),
    scale: 1.5
  },

  'fire-drake': {
    mask: DRAGON,
    pal: pal('#8a2a2a', '#ff6020', '#8a2a2a', '#ffd060'),
    scale: 2
  },

  'dragon-guardian': {
    mask: HUMANOID,
    pal: pal('#6a3a2a', '#ff6020', '#8a6a4a', '#ffd060'),
    scale: 3
  },

  'ancient-dragon': {
    mask: DRAGON,
    pal: pal('#6a1a1a', '#c9a227', '#6a1a1a', '#ffd060'),
    scale: 3
  },

  'flame-lord': {
    mask: HUMANOID,
    pal: pal('#8a2a0a', '#ff6020', '#c86a3a', '#ffd060'),
    scale: 3
  },

  // Акт I — заражённый лес.
  'thorn-stalker': {
    mask: HUMANOID,
    pal: pal('#385c36', '#8bad4e', '#99ad77', '#f0d070'),
    scale: 2
  },

  'spore-shaman': {
    mask: HUMANOID,
    pal: pal('#4d563b', '#a18a55', '#a8b28a', '#b9ff80'),
    scale: 2
  },

  'moss-troll': {
    mask: HUMANOID,
    pal: pal('#34553a', '#647a38', '#93a86e', '#ffba45'),
    scale: 3
  },

  'elder-treant': {
    mask: HUMANOID,
    pal: pal('#4d3925', '#668b42', '#a18a5a', '#c4ff78'),
    scale: 3
  },

  // Акт II — некрополь.
  'grave-scout': {
    mask: HUMANOID,
    pal: pal('#777b86', '#383c4d', '#d1c6a5', '#b8e3ff'),
    scale: 2
  },

  'crypt-hound': {
    mask: WOLF,
    pal: pal('#5b5364', '#302d3b', '#958b9e', '#cc8bff'),
    scale: 2
  },

  'bone-colossus': {
    mask: HUMANOID,
    pal: pal('#d4d0bb', '#6f6a5f', '#e5d9b9', '#ff6a6a'),
    scale: 3
  },

  'bone-tyrant': {
    mask: HUMANOID,
    pal: pal('#b3a68b', '#514355', '#e1d3b2', '#ffcc56'),
    scale: 3
  },

  // Акт III — вулкан.
  'ash-harpy': {
    mask: HARPY,
    pal: pal('#5e3830', '#c06436', '#c68d6a', '#ffd36d'),
    scale: 2
  },

  'obsidian-guard': {
    mask: HUMANOID,
    pal: pal('#272b38', '#95553e', '#9d8069', '#ff7a37'),
    scale: 3
  },

  // Акт IV — ледяная крепость.
  'rime-witch': {
    mask: GHOST,
    pal: pal('#79a9c6', '#3c668d', '#c0e3ef', '#ffffff'),
    scale: 2
  },

  'frost-giant': {
    mask: HUMANOID,
    pal: pal('#8cb8c9', '#476d88', '#d7eff5', '#86e8ff'),
    scale: 3
  },

  // Акт V — бездна.
  'void-harbinger': {
    mask: GHOST,
    pal: pal('#392b58', '#8c4fb5', '#ad91c8', '#ff6cf0'),
    scale: 3
  }
};

// ---------- МОДЕЛИ NPC ----------

const NPC_ART = {
  blacksmith: pal('#6a4a3a', '#c9a227', '#e8b48a', '#101018'),
  healer: pal('#d8d8c8', '#60c060', '#e8b48a'),
  alchemist: pal('#4a6a4a', '#a0d060', '#e8b48a'),
  merchant: pal('#8a5a2a', '#ffd060', '#e8b48a'),
  elder: pal('#5a5a6a', '#d8d8c8', '#d8c0a0'),
  bard: pal('#6a3a6a', '#ffd060', '#e8b48a'),
  guard: pal('#4a5470', '#c9d6ea', '#e8b48a'),
  herald: pal('#8a2a2a', '#ffd060', '#e8b48a'),
  kids: pal('#6a8a3a', '#ffd060', '#e8b48a'),
  well: pal('#7a8aa0', '#4a5a70', '#c9d6ea'),
  questBoard: pal('#8a6a3a', '#d8c8a0', '#e8b48a')
};

const cache = new Map();

function sprite(mask, colors, scale) {
  const key = `${mask.length}x${mask[0].length}|${scale}|${Object.values(colors).join('')}`;

  if (cache.has(key)) {
    return cache.get(key);
  }

  const width = Math.ceil(mask[0].length * scale);
  const height = Math.ceil(mask.length * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const graphics = canvas.getContext('2d');

  for (let y = 0; y < mask.length; y++) {
    for (let x = 0; x < mask[y].length; x++) {
      const ch = mask[y][x];
      if (ch === '.') continue;

      graphics.fillStyle = colors[ch] || colors.o;

      graphics.fillRect(
        Math.floor(x * scale),
        Math.floor(y * scale),
        Math.ceil(scale),
        Math.ceil(scale)
      );
    }
  }

  cache.set(key, canvas);
  return canvas;
}

function blob(ctx, x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, width, height, 0, 0, Math.PI * 2);
  ctx.fill();
}

function blit(ctx, canvas, x, y, bob = 0) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  ctx.drawImage(
    canvas,
    Math.round(x - canvas.width / 2),
    Math.round(y + 14 - canvas.height + bob)
  );

  ctx.restore();
}

const motionHistory = new WeakMap();

function drawGait(ctx, x, y, phase, palette, scale = 1) {
  const swing = Math.sin(phase) * 4 * scale;
  const lift = Math.max(0, Math.cos(phase)) * 2 * scale;
  ctx.save();
  ctx.lineCap = 'square';
  ctx.lineJoin = 'miter';
  // Legs: alternating steps, with dark outline and a lighter armor/cloth edge.
  for (const side of [-1, 1]) {
    const legSwing = side * swing;
    ctx.strokeStyle = palette.o;
    ctx.lineWidth = 5 * scale;
    ctx.beginPath();
    ctx.moveTo(x + side * 5 * scale, y + 1 * scale);
    ctx.lineTo(x + side * 5 * scale + legSwing, y + 9 * scale - (side > 0 ? lift : 0));
    ctx.stroke();
    ctx.strokeStyle = palette.b;
    ctx.lineWidth = 2.5 * scale;
    ctx.beginPath();
    ctx.moveTo(x + side * 5 * scale, y + 2 * scale);
    ctx.lineTo(x + side * 5 * scale + legSwing, y + 9 * scale - (side > 0 ? lift : 0));
    ctx.stroke();
    ctx.fillStyle = palette.o;
    ctx.fillRect(Math.round(x + side * 5 * scale + legSwing - 2 * scale), Math.round(y + 8 * scale - (side > 0 ? lift : 0)), 5 * scale, 3 * scale);
    ctx.fillStyle = palette.w;
    ctx.fillRect(Math.round(x + side * 5 * scale + legSwing - 1 * scale), Math.round(y + 8 * scale - (side > 0 ? lift : 0)), 3 * scale, 1.5 * scale);
  }
  // Arms move opposite to the legs.
  for (const side of [-1, 1]) {
    ctx.strokeStyle = palette.o;
    ctx.lineWidth = 4 * scale;
    ctx.beginPath();
    ctx.moveTo(x + side * 8 * scale, y - 15 * scale);
    ctx.lineTo(x + side * 10 * scale - swing * side * 0.55, y - 6 * scale);
    ctx.stroke();
    ctx.strokeStyle = palette.a;
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.moveTo(x + side * 8 * scale, y - 14 * scale);
    ctx.lineTo(x + side * 10 * scale - swing * side * 0.55, y - 6 * scale);
    ctx.stroke();
  }
  ctx.restore();
}
function shadow(ctx, x, y, color, width = 14) {
  blob(ctx, x, y + 14, width, width * 0.42, color);
}

// ---------- ОТРИСОВКА ГЕРОЯ ----------

export function drawHero(ctx, x, y, playerClass, shadowColor, moving = false) {
  const colors = HEROES[playerClass] || HEROES.warrior;
  const now = performance.now();
  const phase = now / (moving ? 78 : 520);
  const bob = moving ? Math.abs(Math.sin(phase)) * 2.2 : Math.sin(phase) * 0.65;

  shadow(ctx, x, y, shadowColor, 15);
  if (moving) drawGait(ctx, x, y + 5, phase, colors, 1.25);
  blit(ctx, sprite(HUMANOID, colors, 3), x, y, bob);
  drawHeroDetails(ctx, x, y, playerClass, bob);

  const px = x + 17;
  const py = y + 2 + bob;

  ctx.save();
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';

  if (playerClass === 'warrior') {
    // Меч и щит.
    ctx.strokeStyle = '#dbe6f6';
    ctx.beginPath();
    ctx.moveTo(px, py - 14);
    ctx.lineTo(px, py + 6);
    ctx.stroke();

    ctx.strokeStyle = '#c9a227';
    ctx.beginPath();
    ctx.moveTo(px - 4, py + 2);
    ctx.lineTo(px + 4, py + 2);
    ctx.stroke();

    ctx.fillStyle = '#7d8ca8';
    ctx.fillRect(px - 11, py - 1, 6, 10);

    ctx.strokeStyle = '#dbe6f6';
    ctx.strokeRect(px - 11, py - 1, 6, 10);
  } else if (playerClass === 'archer') {
    // Лук, тетива и стрела.
    // Геометрия рисуется Canvas, а не заменяется символом.
    ctx.strokeStyle = '#9b6836';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(
      px + 1,
      py,
      13,
      -Math.PI * 0.72,
      Math.PI * 0.72
    );
    ctx.stroke();

    ctx.strokeStyle = '#e7d7b3';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px - 7, py - 10);
    ctx.lineTo(px + 8, py + 10);
    ctx.stroke();

    ctx.strokeStyle = '#d8bd71';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px - 8, py);
    ctx.lineTo(px + 13, py);
    ctx.lineTo(px + 9, py - 3);
    ctx.moveTo(px + 13, py);
    ctx.lineTo(px + 9, py + 3);
    ctx.stroke();
  } else {
    // Посох мага и наследуемый посох жреца.
    ctx.strokeStyle = '#5a4a3a';
    ctx.beginPath();
    ctx.moveTo(px, py - 16);
    ctx.lineTo(px, py + 8);
    ctx.stroke();

    ctx.fillStyle = playerClass === 'priest'
      ? '#ffd27a'
      : '#7ce7ff';

    ctx.beginPath();
    ctx.arc(px, py - 18, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// ---------- ОТРИСОВКА ВРАГА ----------

export function drawEnemy(ctx, enemy, x, y, shadowColor) {
  const art = ENEMY_ART[enemy.enemyId] || ENEMY_ART.goblin;
  const scale = enemy.boss
    ? Math.max(3, art.scale)
    : art.scale;
  const now = performance.now();
  const previous = motionHistory.get(enemy);
  const moving = !!previous && Math.hypot(enemy.x - previous.x, enemy.y - previous.y) > 0.15;
  motionHistory.set(enemy, { x: enemy.x, y: enemy.y });
  const phase = now / (moving ? 92 : 610) + (enemy.x || 0) * 0.03;
  const bob = moving ? Math.abs(Math.sin(phase)) * 2.6 : Math.sin(phase) * 0.8;

  shadow(
    ctx,
    x,
    y,
    shadowColor,
    enemy.boss ? 20 : 13
  );

  if (moving && art.mask === HUMANOID) drawGait(ctx, x, y + 5, phase, art.pal, enemy.boss ? 1.7 : 1.15);

  blit(
    ctx,
    sprite(art.mask, art.pal, scale),
    x,
    y,
    bob
  );
  drawEnemyDetails(ctx, enemy, x, y, bob, scale);
}

function drawVillageBuilding(ctx, x, y, style = 'home', variant = 'default') {
  // Detailed Canvas architecture; gameplay anchors and collision footprints stay unchanged.
  drawAuroraBuilding(ctx, x, y, style, variant);
}
let villagePropAtlas = null;
let auroraWorldPortalAtlas = null;
function getVillagePropAtlas() {
  if (villagePropAtlas || typeof Image === 'undefined') return villagePropAtlas;
  villagePropAtlas = new Image();
  villagePropAtlas.src = new URL('../../assets/aurora/village-props-atlas.png', import.meta.url).href;
  return villagePropAtlas;
}
function getAuroraWorldPortalAtlas() {
  if (auroraWorldPortalAtlas || typeof Image === 'undefined') return auroraWorldPortalAtlas;
  auroraWorldPortalAtlas = new Image();
  auroraWorldPortalAtlas.src = new URL('../../assets/aurora/world-portal.png', import.meta.url).href;
  return auroraWorldPortalAtlas;
}
const VILLAGE_PROP_FRAMES = new Map([
  ['lantern', 0], ['memorial', 1], ['bench', 2], ['stall', 3],
  ['fountain', 4], ['planter', 5], ['banner', 6], ['brazier', 7],
  ['anvil', 8], ['woodpile', 9], ['cart', 10], ['barrels', 11],
  ['herb-rack', 12], ['frost-lantern', 13], ['rift-ward', 14], ['tower-gate', 15]
]);
// Authored 16-bit nature atlas; keep the procedural canvas as a load-time fallback.
const AURORA_NATURE_FRAMES = new Map([
  ['oak', 0], ['pine', 1], ['bush', 2], ['rock', 3],
  ['stump', 4], ['hedge', 5], ['fence', 6], ['flowerbed', 7]
]);
let auroraNatureAtlas = null;
function getAuroraNatureAtlas() {
  if (typeof Image === 'undefined') return null;
  if (!auroraNatureAtlas) {
    auroraNatureAtlas = new Image();
    auroraNatureAtlas.src = new URL('../../assets/aurora/nature-atlas.png', import.meta.url).href;
  }
  return auroraNatureAtlas;
}

export function preloadAuroraNatureAtlas() {
  const atlas = getAuroraNatureAtlas();
  if (!atlas) return Promise.resolve(false);
  if (atlas.complete) return Promise.resolve(atlas.naturalWidth > 0);
  return new Promise(resolve => {
    atlas.addEventListener('load', () => resolve(true), { once: true });
    atlas.addEventListener('error', () => resolve(false), { once: true });
  });
}

// Crisp, cached 16-bit pixel vegetation for Aurora's outer gardens.
const AURORA_NATURE_CACHE = new Map();
function getAuroraNatureSprite(style) {
  if (AURORA_NATURE_CACHE.has(style)) return AURORA_NATURE_CACHE.get(style);
  const canvas = document.createElement('canvas');
  canvas.width = 32; canvas.height = 40;
  const g = canvas.getContext('2d');
  g.imageSmoothingEnabled = false;
  const px=(x,y,color,w=1,h=1)=>{g.fillStyle=color;g.fillRect(x,y,w,h);};
  const cluster=(x,y,w,h,colors)=>{
    for(let row=0;row<h;row++){
      const inset=(row%3===0?1:0);
      px(x+inset,y+row,colors[row%colors.length],w-inset,1);
    }
  };
  if(style==='oak'||style==='pine'){
    // Trunk and roots first; the canopy is layered with stepped pixel clusters.
    cluster(14,26,5,12,['#68452d','#805638','#563a28']);
    px(11,36,'#563a28',11,2);
    if(style==='pine'){
      cluster(8,5,17,6,['#31563d','#3e7049','#285039']);
      cluster(5,11,23,7,['#2d6042','#39754a','#285039']);
      cluster(3,18,27,7,['#285039','#326743','#244832']);
      cluster(1,25,31,5,['#244832','#2b5a3a','#244832']);
      px(15,2,'#5b8b56',3,2);px(11,9,'#56864e',3,2);px(20,15,'#4c7e48',3,2);
    } else {
      cluster(6,6,20,7,['#356442','#42794a','#2c593a']);
      cluster(3,12,26,8,['#2f603c','#3c7146','#285536']);
      cluster(5,19,22,7,['#285536','#356b3f','#244a30']);
      cluster(9,24,15,4,['#244a30','#315e38','#244a30']);
      px(8,10,'#6a9858',4,2);px(19,13,'#6a9858',3,2);px(12,20,'#57844e',3,2);px(21,21,'#4f7d47',2,2);
    }
  } else if(style==='bush'){
    cluster(6,18,20,8,['#315d3b','#3c7146','#285536']);
    cluster(3,23,26,7,['#285536','#356b3f','#244a30']);
    cluster(7,28,19,4,['#244a30','#315e38','#244a30']);
    px(7,21,'#6a9858',3,2);px(17,24,'#6a9858',3,2);px(23,22,'#57844e',2,2);
    px(10,31,'#d7b978');px(20,30,'#d9a5b7');
  } else if(style==='rock'){
    cluster(8,22,16,8,['#777b78','#90958c','#666b68']);
    cluster(5,27,22,6,['#666b68','#858b83','#5b605d']);
    px(10,23,'#b1b4a5',5,2);px(21,27,'#a0a497',2,2);
    px(9,31,'#516148',4,1);px(20,32,'#516148',3,1);
  } else if(style==='stump'){
    cluster(11,22,10,10,['#815b3b','#986a43','#68482f']);
    px(10,21,'#b68a58',12,2);px(13,23,'#c39a65',4,2);
    px(9,31,'#563a28',14,2);px(8,32,'#315d3b',4,2);px(21,32,'#315d3b',3,2);
  } else if(style==='hedge'){
    cluster(4,20,24,8,['#244832','#315d3b','#3d7146']);
    cluster(2,25,28,8,['#285536','#356b3f','#244a30']);
    cluster(6,30,21,4,['#244832','#315d3b','#244a30']);
    px(7,21,'#6a9858',4,2);px(18,24,'#719c5d',4,2);px(25,27,'#57844e',3,2);
  } else if(style==='fence'){
    px(2,22,'#4b3528',3,15);px(13,22,'#4b3528',3,15);px(25,22,'#4b3528',3,15);
    px(1,24,'#a77a4b',29,3);px(1,31,'#805638',29,3);
    px(2,23,'#d0a16a',3,1);px(13,23,'#d0a16a',3,1);px(25,23,'#d0a16a',3,1);
    px(5,27,'#68452d',2,2);px(18,27,'#68452d',2,2);
  } else if(style==='flowerbed'){
    px(4,29,'#68452d',24,5);px(6,27,'#986a43',20,3);
    for(let i=0;i<6;i++){const x=6+i*4;px(x,22-(i%2)*2,'#315d3b',2,6);px(x,20-(i%2)*2,['#d7a5b8','#e6c77b','#b9a0dc'][i%3],2,2);}
    px(8,31,'#a77a4b',3,1);px(20,31,'#a77a4b',3,1);
  }
  AURORA_NATURE_CACHE.set(style,canvas);
  return canvas;
}
function drawAuroraNature(ctx,x,y,style){
  // The authored atlas has transparent margins around each silhouette.
  // Give each species its own world footprint so trees read as landmarks,
  // while low garden pieces remain below the player's waist.
  const size = {
    oak: [120, 150], pine: [108, 144], bush: [90, 72], rock: [78, 66],
    stump: [72, 66], hedge: [96, 72], fence: [108, 54], flowerbed: [84, 48]
  }[style] || [72, 72];
  const [width, height] = size;
  const frame = AURORA_NATURE_FRAMES.get(style);
  const atlas = getAuroraNatureAtlas();
  ctx.save();
  try{
    ctx.imageSmoothingEnabled=false;
    if (Number.isInteger(frame) && atlas && atlas.complete && atlas.naturalWidth) {
      ctx.drawImage(atlas,frame*64,0,64,80,Math.round(x-width/2),Math.round(y-height+8),width,height);
    } else {
      const sprite=getAuroraNatureSprite(style);
      ctx.drawImage(sprite,Math.round(x-width/2),Math.round(y-height+8),width,height);
    }
  }finally{ctx.restore();}
}

function drawVillageProp(ctx, x, y, style) {
  const isWorldPortal = style === 'world-portal';
  const frame = isWorldPortal ? 0 : VILLAGE_PROP_FRAMES.get(style);
  const atlas = isWorldPortal ? getAuroraWorldPortalAtlas() : getVillagePropAtlas();
  if (frame === undefined || !atlas || !atlas.complete || !atlas.naturalWidth) return;
  ctx.save();
  try {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(atlas, isWorldPortal ? 0 : frame * 64, 0, 64, 64,
      Math.round(x - 48), Math.round(y - 48), 96, 96);
    if (style === 'lantern' || style === 'frost-lantern' || style === 'brazier') {
      ctx.globalAlpha = 0.72 + Math.sin(performance.now() * 0.002 + x * 0.03) * 0.16;
      ctx.fillStyle = style === 'frost-lantern' ? '#c9f5ff' : '#ffe39a';
      ctx.fillRect(Math.round(x - 2), Math.round(y - 31), 4, 4);
    } else if (style === 'fountain') {
      ctx.globalAlpha = 0.55 + Math.sin(performance.now() * 0.002) * 0.2;
      ctx.fillStyle = '#b9f2f2';
      ctx.fillRect(Math.round(x - 7), Math.round(y - 27), 3, 2);
      ctx.fillRect(Math.round(x + 4), Math.round(y - 24), 3, 2);
    } else if (style === 'rift-ward' || style === 'world-portal') {
      ctx.globalAlpha = 0.55 + Math.sin(performance.now() * 0.0018 + x * 0.02) * 0.2;
      ctx.fillStyle = '#d7b4ff';
      ctx.fillRect(Math.round(x - 1), Math.round(y - 31), 2, 5);
    }
  } finally {
    ctx.restore();
  }
}

// ---------- ОТРИСОВКА ПРЕДМЕТОВ И ОБЪЕКТОВ ----------

export function drawObject(ctx, obj, x, y, shadowColor) {
  if (obj.natureStyle) {
    drawAuroraNature(ctx, x, y, obj.natureStyle);
    return;
  }
  if (obj.propStyle) {
    drawVillageProp(ctx, x, y, obj.propStyle);
    return;
  }
  if (obj.buildingStyle) {
    drawVillageBuilding(ctx, x, y, obj.buildingStyle, obj.id);
    return;
  }
  const id = obj.id;

  if (obj.eventType) {
    const art = {
      crystal: {
        mask: CRYSTAL,
        colors: pal('#7ce7ff', '#b28dff', '#7ce7ff', '#ffffff'),
        scale: 2
      },

      altar: {
        mask: ALTAR,
        colors: pal('#6a6a7a', '#c9a227', '#8a8a9a'),
        scale: 2
      },

      mimic: {
        mask: CHEST,
        colors: pal('#8a5a2a', '#ffcf6e', '#8a5a2a', '#ff4a5c'),
        scale: 2
      },

      traveler: {
        mask: HUMANOID,
        colors: pal('#3a4a6a', '#7ce7ff', '#e8b48a'),
        scale: 2
      }
    }[obj.eventType] || {
      mask: CRYSTAL,
      colors: pal('#7ce7ff', '#b28dff'),
      scale: 2
    };

    shadow(ctx, x, y, shadowColor, 12);
    blit(
      ctx,
      sprite(art.mask, art.colors, art.scale),
      x,
      y,
      0
    );

    return;
  }

  if (id === 'well') {
    shadow(ctx, x, y, shadowColor, 16);
    blit(ctx, sprite(WELL, NPC_ART.well, 2), x, y, 0);
    return;
  }

  if (id === 'questBoard') {
    shadow(ctx, x, y, shadowColor, 14);
    blit(ctx, sprite(BOARD, NPC_ART.questBoard, 2), x, y, 0);
    return;
  }

  if (id === 'cat') {
    const bob = Math.sin(
      performance.now() / 400 + x * 0.02
    ) * 0.6;

    shadow(ctx, x, y, shadowColor, 9);

    blit(
      ctx,
      sprite(
        WOLF,
        pal('#c8a070', '#8a6a40', '#c8a070', '#5ef0b0'),
        1.5
      ),
      x,
      y,
      bob
    );

    return;
  }

  const colors = NPC_ART[id] || pal('#6a6a7a', '#3a3a4a');
  const small = id === 'kids';

  const bob = Math.sin(
    performance.now() / 300 + x * 0.02
  ) * 0.8;

  shadow(ctx, x, y, shadowColor, small ? 10 : 13);

  blit(
    ctx,
    sprite(HUMANOID, colors, small ? 2 : 2.5),
    x,
    y,
    bob
  );
  drawNpcDetails(ctx, id, x, y, bob);
}
// ---------- ДЕТАЛИЗАЦИЯ СИЛУЭТОВ (визуальный слой, без изменения хитбоксов) ----------
function drawHeroDetails(ctx, x, y, playerClass, bob) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (playerClass === 'warrior') {
    // Наплечники, нагрудная пластина и центральная заклёпка.
    ctx.fillStyle = '#dbe6f6';
    ctx.strokeStyle = '#080a12';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x-13,y-24+bob); ctx.lineTo(x-19,y-20+bob); ctx.lineTo(x-15,y-14+bob); ctx.lineTo(x-9,y-17+bob); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x+13,y-24+bob); ctx.lineTo(x+19,y-20+bob); ctx.lineTo(x+15,y-14+bob); ctx.lineTo(x+9,y-17+bob); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#9b4c3b'; ctx.fillRect(x-5,y-21+bob,10,13);
    ctx.fillStyle = '#ffcf6e'; ctx.fillRect(x-1,y-19+bob,2,2);
  } else if (playerClass === 'mage') {
    // Капюшон и светящийся знак на мантии.
    ctx.fillStyle = '#20264e'; ctx.strokeStyle = '#7ce7ff'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x-12,y-32+bob); ctx.lineTo(x,y-42+bob); ctx.lineTo(x+12,y-32+bob); ctx.lineTo(x+9,y-25+bob); ctx.lineTo(x-9,y-25+bob); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#b28dff'; ctx.beginPath(); ctx.moveTo(x,y-18+bob); ctx.lineTo(x-3,y-13+bob); ctx.lineTo(x,y-8+bob); ctx.lineTo(x+3,y-13+bob); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#7ce7ff'; ctx.fillRect(x-1,y-15+bob,2,4);
  } else if (playerClass === 'archer') {
    // Кожаная перевязь, капюшон и колчан со стрелами.
    ctx.strokeStyle = '#d8bd71'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x-8,y-25+bob); ctx.lineTo(x+8,y-10+bob); ctx.stroke();
    ctx.fillStyle = '#384b32'; ctx.strokeStyle = '#c5a66b'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x-11,y-31+bob); ctx.lineTo(x,y-38+bob); ctx.lineTo(x+11,y-31+bob); ctx.lineTo(x+8,y-25+bob); ctx.lineTo(x-8,y-25+bob); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#8b633d'; ctx.fillRect(x+9,y-13+bob,5,13);
    ctx.strokeStyle = '#e8d8b9'; ctx.lineWidth = 1;
    for (let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(x+10+i*2,y-17+bob);ctx.lineTo(x+10+i*2,y-8+bob);ctx.stroke();}
  }
  ctx.restore();
}

function drawEnemyDetails(ctx, enemy, x, y, bob, scale) {
  const id = enemy.enemyId || '';
  ctx.save();
  if (id.includes('skeleton') || id.includes('bone') || id === 'grave-king' || id === 'bone-tyrant') {
    ctx.strokeStyle = '#eee4ca'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x-5*scale,y-10*scale+bob); ctx.lineTo(x+5*scale,y-10*scale+bob); ctx.stroke();
    ctx.fillStyle = '#ff6262'; ctx.fillRect(x-4*scale,y-26*scale+bob,2*scale,2*scale); ctx.fillRect(x+2*scale,y-26*scale+bob,2*scale,2*scale);
  } else if (id.includes('frost') || id.includes('ice') || id === 'rime-witch') {
    ctx.strokeStyle = '#d8f7ff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x,y-35*scale+bob); ctx.lineTo(x-5*scale,y-43*scale+bob); ctx.moveTo(x,y-35*scale+bob); ctx.lineTo(x+5*scale,y-43*scale+bob); ctx.stroke();
    ctx.fillStyle = '#b9efff'; ctx.fillRect(x-2*scale,y-16*scale+bob,4*scale,3*scale);
  } else if (id.includes('fire') || id.includes('magma') || id.includes('flame') || id.includes('ash') || id.includes('obsidian')) {
    ctx.fillStyle = '#ff9a43'; ctx.globalAlpha = .8;
    ctx.beginPath(); ctx.arc(x,y-20*scale+bob,2.2*scale,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#54251f'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x-6*scale,y-8*scale+bob); ctx.lineTo(x+6*scale,y-8*scale+bob); ctx.stroke();
  } else if (id.includes('void') || id.includes('wraith') || id.includes('shadow')) {
    ctx.strokeStyle = '#c69cff'; ctx.globalAlpha = .7; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x,y-19*scale+bob,7*scale,Math.PI*1.1,Math.PI*1.9); ctx.stroke();
  }
  ctx.restore();
}

function drawNpcDetails(ctx, id, x, y, bob) {
  // Role silhouettes use integer pixel clusters only: no antialiased strokes,
  // arcs or vector-like outlines on Aurora's 16-bit character sprites.
  const px = (dx, dy, w, h, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x + dx), Math.round(y + dy + bob), w, h);
  };
  if (id === 'blacksmith') {
    px(-8,-21,16,7,'#171923'); px(-6,-20,12,5,'#8b929e');
    px(-5,-12,10,4,'#49372e'); px(-11,-8,22,3,'#6a4a3a');
    px(9,-13,4,9,'#171923'); px(10,-12,2,6,'#c9a227');
    px(8,-17,7,4,'#8b929e'); px(7,-18,9,2,'#d8e0e8');
  } else if (id === 'healer') {
    px(-2,-22,4,13,'#315d3b'); px(-6,-17,12,4,'#315d3b');
    px(-1,-21,2,11,'#d8f0c8'); px(-5,-16,10,2,'#d8f0c8');
    px(-8,-5,16,3,'#e0d2aa');
  } else if (id === 'merchant') {
    px(-14,-30,28,5,'#49372e'); px(-10,-35,20,6,'#8a5a2a');
    px(-6,-38,12,4,'#b47b43'); px(-12,-29,24,2,'#d8bd71');
    px(-8,-8,16,5,'#65412f'); px(-6,-7,12,2,'#e3b85f');
  } else if (id === 'guard') {
    px(-15,-23,7,14,'#202a40'); px(-14,-22,5,11,'#9aa8c0');
    px(8,-23,7,14,'#202a40'); px(9,-22,5,11,'#9aa8c0');
    px(-5,-18,10,7,'#26344c'); px(-3,-16,6,3,'#c9d6ea');
    px(13,-12,3,19,'#49372e'); px(12,-15,5,4,'#d8bd71');
  } else if (id === 'elder') {
    px(-5,-10,10,5,'#d8d0bb'); px(-4,-7,8,3,'#b6ad99');
    px(10,-10,3,25,'#49372e'); px(9,-12,5,4,'#d8d0bb');
    px(-7,-3,14,3,'#5a5a6a');
  } else if (id === 'alchemist') {
    px(8,-19,8,11,'#344c3b'); px(10,-22,4,4,'#344c3b');
    px(9,-17,6,7,'#9bdb77'); px(10,-15,4,3,'#d8f0a8');
    px(7,-8,10,2,'#493e3c');
  } else if (id === 'herald') {
    px(-2,-39,4,27,'#49372e'); px(2,-37,10,8,'#7a2e2a');
    px(3,-36,8,5,'#c9a227'); px(10,-34,3,4,'#f3d77c');
    px(-3,-13,6,3,'#d8bd71');
  } else if (id === 'bard') {
    px(-12,-13,24,4,'#49372e'); px(-9,-17,18,3,'#b47b43');
    px(7,-20,5,10,'#8a5a2a'); px(9,-21,2,4,'#d8bd71');
    px(-4,-7,8,2,'#ffd060');
  } else if (id === 'kids') {
    px(-7,-10,14,3,'#b47b43'); px(-5,-8,10,3,'#ffd060');
    px(-10,-24,5,3,'#e8b48a'); px(5,-24,5,3,'#e8b48a');
  }
}
