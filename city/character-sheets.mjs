// Frames are measured from the supplied, unmodified 1448 × 1086 transparent sheets.
// A one-pixel edge preserves the outline without including a neighboring pose.
const padded = ([x, y, width, height]) => [x - 1, y - 1, width + 2, height + 2];
const directions = ['down', 'left', 'right', 'up'];
const normalRows = [
  [[274,25,148,256],[519,25,146,259],[780,25,147,260],[1042,25,145,260]],
  [[272,292,143,258],[520,292,144,258],[777,292,146,258],[1041,292,149,258]],
  [[276,558,147,251],[524,560,148,252],[787,560,148,255],[1051,557,146,254]],
  [[272,817,144,252],[520,817,144,253],[778,818,147,257],[1039,817,147,253]],
];
const miraRows = [
  [[299,17,129,242],[513,17,128,247],[714,17,128,247],[926,18,132,246]],
  [[294,280,144,242],[509,281,139,241],[717,279,139,243],[937,282,139,240]],
  [[295,541,152,242],[512,544,145,239],[724,544,147,239],[943,548,148,235]],
  [[305,794,125,262],[513,796,128,260],[726,798,129,261],[943,798,128,261]],
];
const labRows = [
  [[155,13,107,212],[337,13,107,211],[517,13,107,211]],
  [[135,239,113,206],[321,239,111,206],[502,239,111,206]],
  [[146,464,116,208],[329,464,114,208],[510,464,115,209]],
  [[140,691,107,203],[322,691,106,204],[502,691,107,207]],
];
const injuredRows = [
  [[872,18,109,208],[1052,18,110,208],[1234,18,109,208]],
  [[859,244,120,204],[1040,244,123,203],[1221,244,123,203]],
  [[865,468,117,208],[1051,468,112,206],[1233,468,111,205]],
  [[865,691,106,207],[1045,691,107,208],[1226,691,107,208]],
];
const talkFrames = [[53,903,110,175],[225,903,124,175],[396,903,110,175],[568,903,125,175]];

function directionalFrames(rows, prefix, flipLeftWalking = false) {
  return Object.fromEntries(rows.flatMap((row, d) => row.map((rect, index) => [
    `${prefix}-${directions[d]}-${index}`,
    { bounds: padded(rect), flipX: flipLeftWalking && d === 1 && index >= 2 },
  ])));
}

export const CHARACTER_SHEETS = {
  'hero-normal': {
    url: 'assets/hero-normal.png', width: 1448, height: 1086,
    frames: directionalFrames(normalRows, 'normal', true),
  },
  'hero-lab': {
    url: 'assets/hero-lab.png', width: 1448, height: 1086,
    frames: {
      ...directionalFrames(labRows, 'lab'),
      ...directionalFrames(injuredRows, 'injured'),
      ...Object.fromEntries(talkFrames.map((rect, i) => [`talk-${i}`, { bounds: padded(rect), flipX: false }])),
    },
  },
  'mira-sheet': {
    url: 'assets/mira.png', width: 1448, height: 1086,
    frames: directionalFrames(miraRows, 'mira'),
  },
};

export function loadCharacterSheets(scene) {
  for (const [key, sheet] of Object.entries(CHARACTER_SHEETS)) scene.load.image(key, sheet.url);
}

export function prepareCharacterSheets(scene) {
  for (const [key, sheet] of Object.entries(CHARACTER_SHEETS)) {
    const texture = scene.textures.get(key);
    const image = texture.getSourceImage();
    if (image.width !== sheet.width || image.height !== sheet.height) {
      throw new Error(`Character sheet ${key} has unexpected dimensions.`);
    }
    for (const [name, frame] of Object.entries(sheet.frames)) {
      if (!texture.has(name)) texture.add(name, 0, ...frame.bounds);
    }
  }
}

// This pure selector also keeps save restoration and dialogue poses independent
// of Phaser's animation clock. 'talking' never changes an injured arm back.
export function selectCharacterFrame({
  kind = 'hero', outfit = 'normal', dir = 'down', walking = false,
  elapsed = 0, talking = false, talkElapsed = elapsed,
} = {}) {
  const facing = directions.includes(dir) ? dir : 'down';
  const prefix = kind === 'mira' ? 'mira' : ['lab', 'injured'].includes(outfit) ? outfit : 'normal';
  const key = prefix === 'mira' ? 'mira-sheet' : prefix === 'normal' ? 'hero-normal' : 'hero-lab';
  const tick = Math.floor(Math.max(0, elapsed) / 135);
  const sequence = prefix === 'normal' || prefix === 'mira' ? [1,0,2,3] : [1,0,2,0];
  let frame = `${prefix}-${facing}-${walking ? sequence[tick % sequence.length] : 0}`;
  if (talking && !walking && prefix === 'lab') {
    const gestures = [0,1,0,2,0,3];
    frame = `talk-${gestures[Math.floor(Math.max(0, talkElapsed) / 370) % gestures.length]}`;
  } else if (talking && !walking && prefix === 'mira') {
    // Her fourth front pose folds the arms; use it as a conversational gesture.
    frame = `mira-down-${Math.floor(Math.max(0, talkElapsed) / 540) % 2 ? 3 : 0}`;
  }
  return { key, frame, ...CHARACTER_SHEETS[key].frames[frame] };
}

export function createSheetActor(scene, x, y, { kind = 'hero', outfit = 'normal', height = 104 } = {}) {
  const selected = selectCharacterFrame({ kind, outfit });
  const scale = height / selected.bounds[3];
  const sprite = scene.add.sprite(x, y, selected.key, selected.frame)
    .setOrigin(.5, 1).setScale(scale).setDepth(y).setFlipX(selected.flipX);
  const shadow = scene.add.ellipse(x, y - 2, height * .38, height * .105, 0x172b29, .25).setDepth(y - .2);
  return {
    x, y, sprite, shadow, dir: 'down', elapsed: 0, walking: false, scale,
    key: selected.key, prefix: kind === 'mira' ? 'mira' : outfit,
    sheetCharacter: true, kind, outfit, height, talking: false, talkElapsed: 0,
  };
}

export function setCharacterOutfit(actor, outfit) {
  if (!actor?.sheetCharacter || actor.kind !== 'hero') return;
  actor.outfit = ['lab', 'injured'].includes(outfit) ? outfit : 'normal';
  actor.elapsed = 0;
  actor.talkElapsed = 0;
  drawSheetActor(actor, 0);
}

export function drawSheetActor(actor, delta = 0) {
  actor.elapsed += delta;
  actor.talkElapsed = actor.talking ? actor.talkElapsed + delta : 0;
  const selected = selectCharacterFrame(actor);
  actor.key = selected.key;
  actor.prefix = actor.kind === 'mira' ? 'mira' : actor.outfit;
  // Every pose rests on the same ground point, even though the supplied frames
  // differ in size. Scaling is recalculated so the shorter talk row does not shrink.
  actor.scale = actor.height / selected.bounds[3];
  actor.sprite.setTexture(selected.key, selected.frame).setFlipX(selected.flipX)
    .setScale(actor.scale).setPosition(actor.x, actor.y).setDepth(actor.y);
  actor.shadow.setPosition(actor.x, actor.y - 2).setDepth(actor.y - .2);
}
