import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CHARACTER_SHEETS, selectCharacterFrame, createSheetActor, drawSheetActor, setCharacterOutfit } from '../city/character-sheets.mjs';

test('every measured pose is inside its actual source PNG with no neighboring frame overlap', () => {
  for (const sheet of Object.values(CHARACTER_SHEETS)) {
    const file = readFileSync(new URL(`../city/${sheet.url}`, import.meta.url));
    assert.equal(file.readUInt32BE(16), sheet.width);
    assert.equal(file.readUInt32BE(20), sheet.height);
    const frames = Object.entries(sheet.frames);
    for (const [index, [name, { bounds: [x, y, width, height] }]] of frames.entries()) {
      assert.ok(x >= 0 && y >= 0 && x + width <= sheet.width && y + height <= sheet.height, name);
      for (const [otherName, { bounds: [ox, oy, ow, oh] }] of frames.slice(index + 1)) {
        assert.ok(x + width <= ox || ox + ow <= x || y + height <= oy || oy + oh <= y, `${name} overlaps ${otherName}`);
      }
    }
  }
});

test('normal clothes left-facing poses correct the two reversed drawings individually', () => {
  assert.equal(selectCharacterFrame({ dir: 'left', walking: false }).flipX, false);
  assert.equal(selectCharacterFrame({ dir: 'left', walking: true, elapsed: 0 }).flipX, false);
  assert.equal(selectCharacterFrame({ dir: 'left', walking: true, elapsed: 270 }).flipX, true);
  assert.equal(selectCharacterFrame({ dir: 'left', walking: true, elapsed: 405 }).flipX, true);
  assert.equal(selectCharacterFrame({ dir: 'right', walking: true, elapsed: 270 }).flipX, false);
});

test('lab gestures use all supplied talk poses and injured conversations keep the arm injury', () => {
  const poses = new Set([0,370,740,1110,1480,1850].map(talkElapsed => selectCharacterFrame({ outfit: 'lab', talking: true, talkElapsed }).frame));
  assert.deepEqual([...poses].sort(), ['talk-0','talk-1','talk-2','talk-3']);
  for (const dir of ['up','down','left','right']) {
    assert.equal(selectCharacterFrame({ outfit: 'injured', dir, talking: true }).frame, `injured-${dir}-0`);
  }
});

test('every outfit and direction selects a valid frame during walking and dialogue', () => {
  for (const kind of ['hero','mira']) for (const outfit of ['normal','lab','injured']) {
    for (const dir of ['up','down','left','right']) for (const walking of [true,false]) for (const talking of [true,false]) {
      for (let elapsed = 0; elapsed < 2500; elapsed += 135) {
        const frame = selectCharacterFrame({kind,outfit,dir,walking,talking,elapsed});
        assert.ok(CHARACTER_SHEETS[frame.key].frames[frame.frame]);
      }
    }
  }
});

test('changing clothes and dialogue poses preserve the actor ground position and display height', () => {
  const chain = () => {
    const value = {};
    for (const method of ['setOrigin','setScale','setDepth','setFlipX','setTexture','setPosition']) value[method] = (...args) => { value[method+'Args'] = args; return value; };
    return value;
  };
  const scene = {add:{sprite:chain,ellipse:chain}};
  const actor = createSheetActor(scene, 200, 300, {outfit:'lab',height:104});
  actor.talking = true;
  drawSheetActor(actor, 1110);
  assert.deepEqual(actor.sprite.setPositionArgs, [200,300]);
  assert.ok(Math.abs(actor.scale * selectCharacterFrame(actor).bounds[3] - 104) < 1e-9);
  setCharacterOutfit(actor, 'injured');
  assert.equal(actor.sprite.setTextureArgs[1], 'injured-down-0');
  setCharacterOutfit(actor, 'normal');
  assert.equal(actor.sprite.setTextureArgs[0], 'hero-normal');
  assert.deepEqual(actor.sprite.setPositionArgs, [200,300]);
});
