// Exact user-supplied RGBA sheets; no image pixels have been changed.
// Each irregular pose is measured around its opaque outline. Front/left/right/back.
const DIRECTIONS = ['down', 'left', 'right', 'up'];
const MEASURED_ROWS = {"1":[[[215,23,168,254],[481,23,172,257],[769,28,169,252],[1075,27,170,253]],[[211,283,172,248],[480,284,176,248],[767,291,174,240],[1074,280,171,251]],[[230,546,172,246],[509,545,173,244],[791,550,179,243],[1093,544,168,249]],[[231,806,171,248],[504,800,173,254],[786,808,182,246],[1088,801,175,253]]],"2":[[[213,9,181,261],[492,9,184,264],[795,9,174,264],[1091,9,182,264]],[[212,275,182,252],[491,278,186,252],[794,278,186,252],[1087,278,186,251]],[[196,538,199,245],[486,540,189,244],[792,537,189,247],[1086,539,192,245]],[[215,790,166,242],[501,791,169,245],[795,793,178,242],[1100,791,166,245]]],"3":[[[168,13,176,275],[505,13,171,276],[787,13,164,276],[1094,14,187,274]],[[172,300,175,249],[496,302,168,246],[773,299,166,250],[1095,296,147,253]],[[201,556,173,242],[525,556,177,245],[799,556,176,244],[1099,554,179,245]],[[198,805,162,265],[506,806,173,260],[785,806,181,264],[1093,806,188,264]]],"4":[[[166,14,198,263],[467,16,192,261],[763,17,191,261],[1060,15,196,263]],[[185,280,181,259],[485,283,180,252],[779,282,173,252],[1076,279,184,260]],[[196,546,176,253],[498,544,196,252],[797,545,191,253],[1088,544,187,257]],[[187,804,182,254],[490,806,191,255],[788,802,198,259],[1086,805,189,256]]],"5":[[[174,13,195,252],[469,16,191,251],[756,16,187,251],[1041,16,193,251]],[[197,278,169,252],[489,277,172,252],[776,280,172,250],[1075,280,172,252]],[[218,548,178,247],[504,545,174,252],[791,544,179,254],[1075,543,183,256]],[[216,806,182,248],[503,806,184,248],[787,804,189,253],[1076,810,183,246]]],"6":[[[278,26,149,248],[523,26,154,251],[768,26,148,252],[1012,26,154,251]],[[281,292,139,247],[529,292,137,243],[771,292,145,247],[1020,292,139,244]],[[277,552,139,243],[530,553,140,242],[779,553,142,242],[1015,552,138,243]],[[270,806,153,235],[523,806,153,241],[769,806,154,241],[1019,806,154,235]]],"7":[[[244,23,155,267],[516,23,154,267],[785,24,153,267],[1058,23,153,267]],[[243,303,144,253],[516,304,148,250],[784,305,148,249],[1056,305,147,251]],[[239,572,155,251],[520,572,155,249],[791,572,155,251],[1064,572,155,251]],[[247,833,146,242],[515,833,144,241],[787,833,144,243],[1057,833,144,243]]],"8":[[[261,47,158,237],[515,47,156,237],[770,47,158,237],[1025,47,157,237]],[[274,299,157,235],[527,299,159,237],[784,299,155,235],[1037,299,159,235]],[[256,550,160,232],[504,550,164,231],[765,551,161,231],[1017,550,164,232]],[[265,796,161,239],[516,796,160,239],[772,796,159,239],[1025,796,162,238]]],"9":[[[281,29,148,253],[526,29,148,254],[776,28,153,255],[1024,29,146,253]],[[282,292,146,251],[526,291,147,252],[773,291,147,252],[1023,291,147,250]],[[279,552,146,246],[532,550,149,248],[775,551,149,248],[1025,552,148,245]],[[281,808,145,242],[526,806,147,245],[774,808,149,245],[1023,806,150,245]]],"10":[[[239,25,143,252],[511,27,143,252],[792,26,141,254],[1068,26,145,253]],[[228,285,152,257],[503,284,152,256],[795,289,151,251],[1077,284,154,256]],[[235,550,154,252],[509,550,154,253],[794,549,155,255],[1077,549,155,255]],[[239,806,143,249],[511,809,144,246],[790,809,143,252],[1068,809,145,249]]]};
const NAMES = ['Green-jacket protester','Red-jacket protester','Retired worker protester','Older protester','Glasses protester','Older townsman','Older townswoman','Yellow-jacket townswoman','Orange-jacket townsman','Beanie townsman'];
export const CITIZEN_SHEETS = Object.fromEntries(Object.entries(MEASURED_ROWS).map(([number, rows]) => {
  const index = Number(number), key = `fairmont-citizen-sheet-${index}`;
  const frames = Object.fromEntries(rows.flatMap((row, d) => row.map((bounds, pose) => [
    `${DIRECTIONS[d]}-${pose}`,
    // Three supplied normal sheets repeat right-facing poses on the left row.
    { bounds, flipX: d === 1 && (([6,9,10].includes(index) && pose >= 2) || (index === 3 && pose === 3)) },
  ])));
  return [index, { key, index, name: NAMES[index-1], protester: index <= 5, width:1448, height:1086,
    url: new URL(`./assets/citizen-sheet-${String(index).padStart(2,'0')}.png`, import.meta.url).href, frames }];
}));

export function loadCitizenSheets(scene) {
  for (const sheet of Object.values(CITIZEN_SHEETS))
    if (!scene.textures.exists(sheet.key)) scene.load.image(sheet.key, sheet.url);
}

export function prepareCitizenSheets(scene) {
  for (const sheet of Object.values(CITIZEN_SHEETS)) {
    const texture = scene.textures.get(sheet.key), image = texture.getSourceImage();
    if (image.width !== sheet.width || image.height !== sheet.height)
      throw new Error(`Citizen sheet ${sheet.index} has unexpected dimensions.`);
    for (const [name, frame] of Object.entries(sheet.frames))
      if (!texture.has(name)) texture.add(name, 0, ...frame.bounds);
    texture.setFilter(0);
  }
}

export function selectCitizenFrame({ sheetIndex = 6, dir = 'down', walking = false, elapsed = 0 } = {}) {
  const sheet = CITIZEN_SHEETS[sheetIndex] || CITIZEN_SHEETS[6];
  const facing = DIRECTIONS.includes(dir) ? dir : 'down';
  const sequence = [1,0,2,3], pose = walking ? sequence[Math.floor(Math.max(0,elapsed)/160)%4] : 0;
  const frame = `${facing}-${pose}`;
  return { key:sheet.key, frame, ...sheet.frames[frame] };
}

export function createCitizenActor(scene, x, y, sheetIndex = 6, height = 104) {
  sheetIndex = CITIZEN_SHEETS[sheetIndex] ? Number(sheetIndex) : 6;
  const selected = selectCitizenFrame({sheetIndex});
  // The placard is above the head; sign-holders retain the same human body scale.
  const renderHeight = height * (sheetIndex <= 5 ? 1.22 : 1);
  const scale = renderHeight / selected.bounds[3];
  const sprite = scene.add.sprite(x,y,selected.key,selected.frame).setOrigin(.5,1)
    .setScale(scale).setDepth(y).setFlipX(selected.flipX);
  const shadow = scene.add.ellipse(x,y-2,height*.36,height*.095,0x16222a,.22).setDepth(y-.2);
  return {x,y,sprite,shadow,key:selected.key,dir:'down',elapsed:0,walking:false,scale,
    sheetIndex,height,renderHeight,fairmontCitizen:true,staticFrame:true,row:0};
}

export function drawCitizenActor(actor, delta = 0) {
  if (!actor?.fairmontCitizen) return;
  actor.elapsed = (actor.elapsed || 0) + delta;
  const selected = selectCitizenFrame(actor);
  actor.key = selected.key;
  actor.scale = actor.renderHeight / selected.bounds[3];
  actor.sprite.setTexture(selected.key,selected.frame).setFlipX(selected.flipX)
    .setScale(actor.scale).setPosition(actor.x,actor.y).setDepth(actor.y);
  actor.shadow.setPosition(actor.x,actor.y-2).setDepth(actor.y-.2);
}
