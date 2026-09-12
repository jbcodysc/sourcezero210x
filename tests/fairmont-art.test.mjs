import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CITIZEN_SHEETS,selectCitizenFrame,createCitizenActor,drawCitizenActor} from '../fairmont/citizen-sheets.mjs';
import {FAIRMONT_ENEMY_FRAMES,FAIRMONT_PARK_FRAMES} from '../fairmont/art.mjs';
import {INTERIOR_ART} from '../fairmont/interior-art.mjs';

test('illustrated interior objects have actual standalone RGBA assets',()=>{
 assert.equal(Object.keys(INTERIOR_ART).length,13);
 for(const [type,art]of Object.entries(INTERIOR_ART)){
  const png=readFileSync(new URL('../fairmont/assets/interior-v2/'+art.file,import.meta.url));
  assert.equal(png.toString('hex',0,8),'89504e470d0a1a0a',type);
  assert.equal(png[25],6,type+' must preserve its RGBA cutout');
  assert.ok(png.readUInt32BE(16)>=1000&&png.readUInt32BE(20)>=1000,type+' needs a detailed source');
  assert.ok(art.width>=100&&art.width<=390,type+' must fit human-scale rooms');
 }
});

test('all ten supplied citizens have sixteen separate, valid source poses',()=>{
 assert.equal(Object.keys(CITIZEN_SHEETS).length,10);
 for(const sheet of Object.values(CITIZEN_SHEETS)){
  const png=readFileSync(new URL(sheet.url));
  assert.equal(png.readUInt32BE(16),sheet.width);assert.equal(png.readUInt32BE(20),sheet.height);
  const frames=Object.entries(sheet.frames);assert.equal(frames.length,16);
  assert.equal(sheet.protester,sheet.index<=5);
  for(const [i,[name,{bounds:[x,y,w,h]}]] of frames.entries()){
   assert.ok(x>=0&&y>=0&&x+w<=sheet.width&&y+h<=sheet.height,`${sheet.index}:${name}`);
   for(const [other,{bounds:[ox,oy,ow,oh]}] of frames.slice(i+1))
    assert.ok(x+w<=ox||ox+ow<=x||y+h<=oy||oy+oh<=y,`${sheet.index}:${name} overlaps ${other}`);
  }
 }
});

test('citizens walk with four distinct source poses in every facing',()=>{
 for(let sheetIndex=1;sheetIndex<=10;sheetIndex++)for(const dir of ['down','left','right','up']){
  const selected=[0,160,320,480].map(elapsed=>selectCitizenFrame({sheetIndex,dir,walking:true,elapsed}));
  assert.equal(new Set(selected.map(frame=>frame.frame)).size,4);
  for(const frame of selected)assert.ok(CITIZEN_SHEETS[sheetIndex].frames[frame.frame]);
 }
 for(const sheetIndex of [6,9,10]){
  assert.equal(selectCitizenFrame({sheetIndex,dir:'left',walking:true,elapsed:320}).flipX,true);
  assert.equal(selectCitizenFrame({sheetIndex,dir:'right',walking:true,elapsed:320}).flipX,false);
 }
});

test('sign holders retain body scale and both actor types keep their feet anchored',()=>{
 const chain=()=>{const v={};for(const method of ['setOrigin','setScale','setDepth','setFlipX','setTexture','setPosition'])v[method]=(...args)=>{v[method+'Args']=args;return v;};return v;};
 const scene={add:{sprite:chain,ellipse:chain}};
 for(const index of [1,6]){
  const actor=createCitizenActor(scene,320,640,index,104);actor.walking=true;actor.dir='left';drawCitizenActor(actor,320);
  assert.equal(actor.fairmontCitizen,true);assert.equal(actor.staticFrame,true);
  assert.deepEqual(actor.sprite.setPositionArgs,[320,640]);
  assert.equal(actor.sprite.setTextureArgs[0],`fairmont-citizen-sheet-${index}`);
  assert.ok(Math.abs(actor.scale*selectCitizenFrame(actor).bounds[3]-actor.renderHeight)<1e-9);
  assert.equal(actor.renderHeight,index===1?104*1.22:104);
 }
});

test('six new enemies expose independent map and battle images and all park props fit the atlas',()=>{
 assert.equal(Object.keys(FAIRMONT_ENEMY_FRAMES).length,6);
 const check=(rect,width=1536,height=1024)=>{const [x,y,w,h]=rect;assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=width&&y+h<=height);};
 for(const frames of Object.values(FAIRMONT_ENEMY_FRAMES)){
  check(frames.map,1024,1536);check(frames.battle,1024,1536);
  assert.ok(frames.battle[2]*frames.battle[3]>frames.map[2]*frames.map[3]);
 }
 assert.equal(Object.keys(FAIRMONT_PARK_FRAMES).length,8);
 Object.values(FAIRMONT_PARK_FRAMES).forEach(rect=>check(rect));
 for(const filename of ['fairmont-enemies-v2.png','fairmont-park-details.png']){
  const png=readFileSync(new URL(`../fairmont/assets/${filename}`,import.meta.url));
  assert.equal(png.readUInt32BE(16),filename.includes('enemies')?1024:1536);assert.equal(png.readUInt32BE(20),filename.includes('enemies')?1536:1024);
 }
});
