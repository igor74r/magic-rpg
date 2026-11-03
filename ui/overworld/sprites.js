// Пиксельные 2D-модели героев, существ и объектов.
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

function drawVillageBuilding(ctx, x, y, style = 'home') {
  // Presentation-only village architecture: warm timber, plaster, shingles and
  // readable silhouettes. The world collision footprint remains unchanged.
  const palettes = {
    hall: ['#ddc99f', '#70443a', '#493039', '#f2c36d', '#9a6245'],
    forge: ['#a8957d', '#49332e', '#302a30', '#ff914d', '#75604e'],
    healer: ['#ded7bd', '#71815b', '#43543b', '#d5efaa', '#9b865f'],
    alchemy: ['#c2b296', '#604b70', '#3d304a', '#a6e5c5', '#8d795f'],
    market: ['#dfc493', '#8b5437', '#57372f', '#ffd27a', '#a34c3d'],
    tavern: ['#d0b187', '#704a35', '#49302b', '#ffc16d', '#98613c'],
    home: ['#d6c39e', '#79564a', '#514047', '#f5d18a', '#987454']
  };
  const [wall, timber, roof, glow, stone] = palettes[style] || palettes.home;
  const t = performance.now() * 0.001;
  const pulse = Math.round((Math.sin(t * 1.7 + x * 0.03) + 1) * 1.5);
  const px = (left, top, width, height, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(left, top, width, height);
  };

  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(1.8, 1.44);
  ctx.imageSmoothingEnabled = false;

  // Ground shadow, stone plinth and irregular foundation blocks.
  px(-42, 18, 84, 8, '#17171b');
  px(-38, 14, 76, 8, '#29282b');
  px(-34, 10, 68, 7, '#51483e');
  for (let i = 0; i < 8; i++) {
    px(-32 + i * 8, 10, 7, 5, i % 2 ? stone : '#6e6251');
  }

  // Tall, layered shingle roof with visible eaves and ridge.
  px(-8, -72, 16, 4, '#211d22');
  px(-16, -68, 32, 4, '#211d22');
  px(-24, -64, 48, 4, '#211d22');
  px(-32, -60, 64, 4, '#211d22');
  px(-40, -56, 80, 4, '#211d22');
  px(-44, -52, 88, 8, '#211d22');
  px(-40, -52, 80, 4, roof);
  px(-36, -48, 72, 4, roof);
  px(-32, -44, 64, 4, roof);
  px(-28, -40, 56, 4, roof);
  px(-24, -36, 48, 4, roof);
  px(-20, -32, 40, 4, roof);
  px(-36, -28, 72, 4, timber);
  // Individual shingle seams and subtle warm highlights.
  for (let row = 0; row < 5; row++) {
    const half = 40 - row * 4;
    for (let col = -half + 8; col < half; col += 16) {
      px(col, -50 + row * 4, 1, 3, '#ffffff22');
      px(col + 7, -48 + row * 4, 5, 1, '#1d1820');
    }
  }

  // Plaster facade, half-timber framing and stone sill.
  px(-36, -24, 72, 44, '#211d22');
  px(-32, -20, 64, 36, wall);
  px(-32, -20, 5, 36, timber);
  px(27, -20, 5, 36, timber);
  px(-28, -16, 56, 3, '#ead8b5');
  px(-28, 5, 56, 3, timber);
  px(-28, 9, 56, 7, stone);
  px(-24, -16, 3, 22, '#bda985');
  px(21, -16, 3, 22, '#bda985');
  // Exposed diagonal braces make the buildings read as timber-framed cottages.
  ctx.strokeStyle = timber;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-27, -15); ctx.lineTo(-14, -3);
  ctx.moveTo(27, -15); ctx.lineTo(14, -3);
  ctx.stroke();

  // Arched-looking doorway, threshold and iron handle.
  px(-10, -5, 20, 27, '#211916');
  px(-7, -2, 14, 24, '#765035');
  px(-5, 1, 10, 21, '#8c6040');
  px(4, 10, 2, 3, '#e4b45f');
  px(-12, 20, 24, 3, '#c5a77a');

  // Two leaded windows with warm animated panes and flower boxes.
  for (const wx of [-25, 13]) {
    px(wx, -13, 14, 18, '#211d22');
    px(wx + 3, -10, 8, 12, glow);
    px(wx + 6, -10, 2, 12, timber);
    px(wx + 3, -5, 8, 2, timber);
    px(wx + 1, 5, 12, 3, '#5b3829');
    px(wx + 2, 8, 10, 2, '#7b5036');
    if (style === 'home' || style === 'healer' || style === 'tavern') {
      px(wx + 3, 3, 2, 3, '#6e9a55');
      px(wx + 8, 2, 2, 4, '#a65a62');
    }
  }

  // Distinctive roof fittings and shop identity.
  px(-5, -61, 10, 4, '#d0aa68');
  if (style === 'forge' || style === 'tavern' || style === 'hall') {
    px(17, -58, 12, 22, '#30282a');
    px(13, -62, 20, 4, '#80604c');
    px(20, -70, 8, 8, '#8e8980');
    px(24, -78, 8, 8, '#aaa39a');
    px(26, -82, 5, 4, '#c2b9a7');
  }
  if (style === 'forge') {
    px(-4, 13, 8, 5, '#ff7435');
    px(-1, 9, 5, 4, '#ffd27a');
    px(12, 1, 5, 8, '#b9a18a');
  }
  if (style === 'market') {
    // Striped awning and hanging shop sign.
    px(-36, -27, 72, 5, '#a33f38');
    for (let i = 0; i < 6; i++) px(-32 + i * 12, -27, 6, 5, i % 2 ? '#e9d19d' : '#a33f38');
    px(31, -39, 3, 14, timber);
    px(27, -42, 12, 8, '#e4c17d');
    px(29, -40, 8, 4, '#70452f');
  } else if (style === 'healer') {
    px(-4, -57, 8, 12, '#f0ead7');
    px(-2, -55, 4, 8, '#6c9a5a');
    px(-7, -52, 14, 3, '#6c9a5a');
  } else if (style === 'alchemy') {
    px(30, -42, 3, 16, timber);
    px(26, -44, 12, 8, '#c8b4d8');
    px(29, -42, 6, 4, '#765a91');
    px(-3, -58, 6, 8, '#a6e5c5');
  } else if (style === 'hall') {
    px(-5, -59, 10, 14, '#e7d8b4');
    px(-2, -56, 4, 8, '#a54b3e');
    px(-7, -53, 14, 3, '#a54b3e');
  } else if (style === 'tavern') {
    px(31, -40, 3, 15, timber);
    px(26, -43, 13, 9, '#d7b36d');
    px(29, -41, 7, 5, '#8b3f32');
  }
  ctx.restore();
}
function drawVillageProp(ctx, x, y, style) {
  const t = performance.now() * 0.001;
  ctx.save();
  if (style === 'lantern') {
    // Carved oak post, iron hooks and a warm glass lantern.
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(x, y + 23, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#392a23'; ctx.fillRect(x - 3, y - 5, 6, 31);
    ctx.fillStyle = '#765238'; ctx.fillRect(x - 2, y - 4, 2, 28);
    ctx.fillStyle = '#9b744b'; ctx.fillRect(x - 9, y - 17, 18, 4);
    ctx.fillRect(x - 6, y - 21, 12, 4);
    ctx.fillStyle = '#29252a'; ctx.fillRect(x - 7, y - 15, 14, 15);
    ctx.fillStyle = '#d99a42'; ctx.fillRect(x - 5, y - 13, 10, 11);
    ctx.fillStyle = '#ffe7a5'; ctx.globalAlpha = 0.82 + Math.sin(t * 2 + x) * 0.12;
    ctx.fillRect(x - 3, y - 11, 6, 7);
    ctx.beginPath(); ctx.arc(x, y - 6, 20, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#49352a'; ctx.lineWidth = 2; ctx.strokeRect(x - 7, y - 15, 14, 15);
    ctx.fillStyle = '#c6a36b'; ctx.fillRect(x - 8, y - 17, 16, 2); ctx.fillRect(x - 8, y, 16, 2);
  } else if (style === 'memorial') {
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(x, y + 10, 24, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#55565b'; ctx.beginPath(); ctx.moveTo(x - 17, y + 10); ctx.lineTo(x - 14, y - 18); ctx.lineTo(x - 7, y - 25); ctx.lineTo(x + 8, y - 25); ctx.lineTo(x + 16, y - 15); ctx.lineTo(x + 18, y + 10); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#aaa08c'; ctx.lineWidth = 2; ctx.stroke();
    ctx.strokeStyle = '#c9a66b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y - 16); ctx.lineTo(x, y + 2); ctx.moveTo(x - 6, y - 9); ctx.lineTo(x + 6, y - 9); ctx.stroke();
  } else if (style === 'bench') {
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(x, y + 13, 25, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#392923'; ctx.fillRect(x - 21, y - 4, 42, 8);
    ctx.fillStyle = '#9a6940'; ctx.fillRect(x - 23, y - 12, 46, 7);
    ctx.fillStyle = '#bd8b55'; ctx.fillRect(x - 20, y - 11, 40, 2);
    ctx.fillStyle = '#63402e'; ctx.fillRect(x - 18, y - 3, 5, 17); ctx.fillRect(x + 13, y - 3, 5, 17);
    ctx.fillStyle = '#d0a66b'; ctx.fillRect(x - 22, y - 13, 44, 2);
    ctx.strokeStyle = '#49352a'; ctx.lineWidth = 1.5; ctx.strokeRect(x - 23, y - 12, 46, 7);
    // Small carved end caps.
    ctx.fillStyle = '#d8b878'; ctx.fillRect(x - 23, y - 12, 3, 7); ctx.fillRect(x + 20, y - 12, 3, 7);
  } else if (style === 'stall') {
    ctx.fillStyle = '#50352a'; ctx.fillRect(x - 23, y - 2, 46, 20);
    ctx.fillStyle = '#9a633b'; ctx.fillRect(x - 25, y - 7, 50, 6);
    ctx.fillStyle = '#b64a3c'; ctx.beginPath(); ctx.moveTo(x - 27, y - 7); ctx.lineTo(x - 21, y - 20); ctx.lineTo(x + 21, y - 20); ctx.lineTo(x + 27, y - 7); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e6c68d'; ctx.fillRect(x - 13, y - 18, 8, 11); ctx.fillRect(x + 5, y - 18, 8, 11);
    ctx.fillStyle = '#d6a34d'; ctx.fillRect(x - 17, y + 2, 34, 5);
  } else if (style === 'fountain') {
    // Layered cut-stone basin with rippling water and a carved central jet.
    ctx.fillStyle = 'rgba(0,0,0,.34)'; ctx.beginPath(); ctx.ellipse(x, y + 15, 36, 13, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#343940'; ctx.beginPath(); ctx.ellipse(x, y + 5, 36, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#777b7b'; ctx.beginPath(); ctx.ellipse(x, y + 1, 33, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#c4b18d'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y + 1, 29, 9, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#4b91a0'; ctx.beginPath(); ctx.ellipse(x, y - 1, 25, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#a9e9f0'; ctx.lineWidth = 1.5; ctx.globalAlpha = .45 + Math.sin(t * 2) * .18;
    ctx.beginPath(); ctx.ellipse(x - 5, y - 2, 12, 3 + Math.sin(t * 2) * 1.2, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x + 7, y, 7, 2.5, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#a99b80'; ctx.fillRect(x - 5, y - 22, 10, 22);
    ctx.fillStyle = '#d9c9a4'; ctx.fillRect(x - 11, y - 25, 22, 5);
    ctx.fillStyle = '#8c806c'; ctx.fillRect(x - 8, y - 30, 16, 5);
    ctx.strokeStyle = '#a9e9f0'; ctx.lineWidth = 2; ctx.globalAlpha = .72 + Math.sin(t * 2) * .18;
    ctx.beginPath(); ctx.moveTo(x, y - 27); ctx.quadraticCurveTo(x - 8, y - 38, x - 11, y - 31); ctx.moveTo(x, y - 27); ctx.quadraticCurveTo(x + 8, y - 38, x + 11, y - 31); ctx.stroke();
    ctx.globalAlpha = 1;
  } else if (style === 'world-portal' || style.startsWith('world-waystone')) {
    const portalTone = style.includes('forest') || style.includes('briar') ? '#79bd78' : style.includes('ice') || style.includes('frost') ? '#8edfff' : style.includes('volcano') || style.includes('obsidian') || style.includes('dragon') ? '#ff9364' : style.includes('shadow') || style.includes('void') || style.includes('rift') ? '#bd91ff' : style.includes('swamp') ? '#b0bd6a' : style.includes('desert') || style.includes('wasteland') ? '#e7bd71' : style.includes('graveyard') || style.includes('ruins') || style.includes('sunken') ? '#b6a2c9' : style.includes('library') ? '#e5ca83' : '#6fd7d2';
    const pulse = 0.72 + Math.sin(t * 2.2 + x * 0.01) * 0.16;
    ctx.fillStyle = 'rgba(0,0,0,0.42)';
    ctx.beginPath(); ctx.ellipse(x, y + 18, 35, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#34313d'; ctx.beginPath(); ctx.ellipse(x, y + 7, 30, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#b89b69'; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = '#151b2a'; ctx.beginPath(); ctx.ellipse(x, y - 8, 19, 27, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = portalTone; ctx.lineWidth = 3; ctx.globalAlpha = pulse;
    ctx.beginPath(); ctx.ellipse(x, y - 8, 17, 25, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#d7c18a'; ctx.lineWidth = 2; ctx.globalAlpha = 0.9;
    ctx.beginPath(); ctx.arc(x, y - 8, 10, t * 0.7, t * 0.7 + Math.PI * 1.55); ctx.stroke();
    ctx.fillStyle = portalTone; ctx.globalAlpha = pulse;
    ctx.beginPath(); ctx.arc(x, y - 8, 5 + Math.sin(t * 3) * 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  } else if (style === 'tower-gate') {
    const pulse = 0.68 + Math.sin(t * 1.8 + x * 0.02) * 0.14;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath(); ctx.ellipse(x, y + 19, 38, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#37313a'; ctx.fillRect(x - 28, y - 24, 9, 45); ctx.fillRect(x + 19, y - 24, 9, 45);
    ctx.fillStyle = '#796047'; ctx.fillRect(x - 33, y - 30, 66, 8);
    ctx.strokeStyle = '#c49a5e'; ctx.lineWidth = 3; ctx.strokeRect(x - 28, y - 24, 56, 45);
    ctx.fillStyle = '#1d1220'; ctx.beginPath(); ctx.moveTo(x - 17, y + 19); ctx.lineTo(x - 17, y - 7); ctx.quadraticCurveTo(x, y - 34, x + 17, y - 7); ctx.lineTo(x + 17, y + 19); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#d28b58'; ctx.lineWidth = 3; ctx.globalAlpha = pulse;
    ctx.beginPath(); ctx.moveTo(x - 17, y + 19); ctx.lineTo(x - 17, y - 7); ctx.quadraticCurveTo(x, y - 34, x + 17, y - 7); ctx.lineTo(x + 17, y + 19); ctx.stroke();
    ctx.fillStyle = '#ffb36b'; ctx.globalAlpha = pulse;
    ctx.beginPath(); ctx.arc(x, y - 7, 6, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#d6b77e'; ctx.fillRect(x - 2, y - 35, 4, 7);
  } else if (style === 'planter') {
    ctx.fillStyle = 'rgba(0,0,0,.24)'; ctx.beginPath(); ctx.ellipse(x, y + 13, 19, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#58443a'; ctx.fillRect(x - 14, y - 2, 28, 16);
    ctx.fillStyle = '#98704d'; ctx.fillRect(x - 16, y - 7, 32, 6);
    ctx.fillStyle = '#c09161'; ctx.fillRect(x - 13, y - 5, 26, 2);
    ctx.fillStyle = '#354a35'; ctx.beginPath(); ctx.arc(x, y - 10, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#52764a'; ctx.beginPath(); ctx.arc(x - 7, y - 12, 7, 0, Math.PI * 2); ctx.arc(x + 7, y - 10, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#a85b64'; ctx.beginPath(); ctx.arc(x - 6, y - 14, 3, 0, Math.PI * 2); ctx.arc(x + 6, y - 8, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e7c879'; ctx.beginPath(); ctx.arc(x, y - 17, 2, 0, Math.PI * 2); ctx.fill();
  } else if (style === 'banner') {
    ctx.fillStyle = '#46372d'; ctx.fillRect(x - 2, y - 31, 4, 58);
    ctx.fillStyle = '#8f3037'; ctx.beginPath(); ctx.moveTo(x + 2, y - 29); ctx.lineTo(x + 22, y - 24); ctx.lineTo(x + 2, y - 12); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#d7b46f'; ctx.lineWidth = 1.5; ctx.stroke();
  } else if (style === 'brazier') {
    ctx.fillStyle = '#4a3930'; ctx.fillRect(x - 3, y - 3, 6, 25);
    ctx.fillStyle = '#8b7862'; ctx.fillRect(x - 12, y - 5, 24, 5);
    ctx.fillStyle = '#e98a43'; ctx.globalAlpha = 0.85 + Math.sin(t * 6 + x) * 0.1;
    ctx.beginPath(); ctx.moveTo(x, y - 29); ctx.quadraticCurveTo(x + 14, y - 13, x, y - 7); ctx.quadraticCurveTo(x - 12, y - 17, x, y - 29); ctx.fill();
    ctx.globalAlpha = 1;
  } else if (style === 'anvil') {
    ctx.fillStyle = '#343941'; ctx.fillRect(x - 7, y - 4, 14, 16);
    ctx.fillStyle = '#8a9299'; ctx.beginPath(); ctx.moveTo(x - 18, y - 13); ctx.lineTo(x + 12, y - 13); ctx.lineTo(x + 18, y - 7); ctx.lineTo(x + 5, y - 4); ctx.lineTo(x - 10, y - 4); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#c0c8ca'; ctx.lineWidth = 2; ctx.stroke();
  } else if (style === 'woodpile') {
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = i % 2 ? '#68442f' : '#8a5b3a';
      ctx.fillRect(x - 19 + (i % 2) * 3, y - 12 + i * 5, 38 - (i % 2) * 6, 5);
      ctx.fillStyle = '#c69a69'; ctx.fillRect(x - 18 + (i % 2) * 3, y - 12 + i * 5, 3, 5);
    }
  } else if (style === 'cart') {
    ctx.fillStyle = '#765033'; ctx.fillRect(x - 18, y - 13, 34, 20);
    ctx.fillStyle = '#a8794b'; ctx.fillRect(x - 21, y - 17, 40, 5);
    ctx.strokeStyle = '#392c26'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(x - 11, y + 10, 6, 0, Math.PI * 2); ctx.arc(x + 12, y + 10, 6, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#858c8a'; ctx.fillRect(x - 13, y - 10, 10, 10); ctx.fillRect(x + 1, y - 10, 10, 10);
  } else if (style === 'barrels') {
    for (let i = 0; i < 2; i++) {
      ctx.fillStyle = '#805335'; ctx.fillRect(x - 17 + i * 20, y - 12, 14, 25);
      ctx.fillStyle = '#b58a55'; ctx.fillRect(x - 17 + i * 20, y - 9, 14, 3); ctx.fillRect(x - 17 + i * 20, y + 5, 14, 3);
      ctx.strokeStyle = '#3d3029'; ctx.lineWidth = 1.5; ctx.strokeRect(x - 17 + i * 20, y - 12, 14, 25);
    }
  } else if (style === 'herb-rack') {
    ctx.fillStyle = '#5a4030'; ctx.fillRect(x - 18, y - 18, 36, 4); ctx.fillRect(x - 18, y + 5, 36, 4);
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = ['#75945a','#a4a85e','#698c72'][i % 3]; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x - 14 + i * 7, y - 14); ctx.lineTo(x - 11 + i * 7, y + 4); ctx.stroke();
    }
  } else if (style === 'frost-lantern') {
    ctx.fillStyle = '#46545d'; ctx.fillRect(x - 3, y - 5, 6, 27);
    ctx.fillStyle = '#b7e9f5'; ctx.fillRect(x - 8, y - 15, 16, 13);
    ctx.fillStyle = '#e6fbff'; ctx.globalAlpha = 0.65 + Math.sin(t * 2) * 0.18;
    ctx.beginPath(); ctx.arc(x, y - 9, 18, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1; ctx.strokeStyle = '#d7f6ff'; ctx.lineWidth = 2; ctx.strokeRect(x - 8, y - 15, 16, 13);
  } else if (style === 'rift-ward') {
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(x, y + 13, 25, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#46404b'; ctx.beginPath(); ctx.moveTo(x - 17, y + 12); ctx.lineTo(x - 12, y - 13); ctx.lineTo(x, y - 25); ctx.lineTo(x + 12, y - 13); ctx.lineTo(x + 17, y + 12); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#9b74b8'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#c18cff'; ctx.globalAlpha = 0.55 + Math.sin(t * 2.4) * 0.2;
    ctx.beginPath(); ctx.moveTo(x, y - 18); ctx.lineTo(x + 7, y - 4); ctx.lineTo(x, y + 5); ctx.lineTo(x - 6, y - 4); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1; ctx.strokeStyle = '#d6b0ff'; ctx.beginPath(); ctx.moveTo(x, y - 18); ctx.lineTo(x, y + 5); ctx.stroke();
  }
  ctx.restore();
}

// ---------- ОТРИСОВКА ПРЕДМЕТОВ И ОБЪЕКТОВ ----------

export function drawObject(ctx, obj, x, y, shadowColor) {
  if (obj.propStyle) {
    drawVillageProp(ctx, x, y, obj.propStyle);
    return;
  }
  if (obj.buildingStyle) {
    drawVillageBuilding(ctx, x, y, obj.buildingStyle);
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
  ctx.save();
  ctx.lineWidth = 2;
  if (id === 'blacksmith') {
    ctx.fillStyle = '#8b929e'; ctx.strokeStyle = '#171923';
    ctx.fillRect(x-9,y-20+bob,18,5); ctx.strokeRect(x-9,y-20+bob,18,5);
    ctx.fillStyle = '#c9a227'; ctx.fillRect(x+9,y-9+bob,4,8);
  } else if (id === 'healer') {
    ctx.strokeStyle = '#a9ef9b'; ctx.beginPath(); ctx.moveTo(x,y-21+bob); ctx.lineTo(x,y-11+bob); ctx.moveTo(x-5,y-16+bob); ctx.lineTo(x+5,y-16+bob); ctx.stroke();
  } else if (id === 'merchant') {
    ctx.fillStyle = '#8a5a2a'; ctx.strokeStyle = '#d8bd71';
    ctx.beginPath(); ctx.moveTo(x-13,y-28+bob); ctx.lineTo(x,y-37+bob); ctx.lineTo(x+13,y-28+bob); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (id === 'guard') {
    ctx.fillStyle = '#9aa8c0'; ctx.fillRect(x-13,y-21+bob,5,11); ctx.fillRect(x+8,y-21+bob,5,11);
  } else if (id === 'elder') {
    ctx.strokeStyle = '#d8d0bb'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x+10,y-8+bob); ctx.lineTo(x+13,y+13+bob); ctx.stroke();
    ctx.fillStyle = '#d8d0bb'; ctx.beginPath(); ctx.arc(x+13,y-9+bob,2,0,Math.PI*2); ctx.fill();
  } else if (id === 'alchemist') {
    ctx.strokeStyle = '#9bdb77'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x+11,y-13+bob,4,0,Math.PI*2); ctx.stroke();
  } else if (id === 'herald') {
    ctx.fillStyle = '#c9a227'; ctx.fillRect(x-2,y-38+bob,4,13);
  }
  ctx.restore();
}
