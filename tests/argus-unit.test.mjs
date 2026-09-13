import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {ARGUS_UNIT_SOURCE,ARGUS_UNIT_FRAMES,ARGUS_UNIT_FRAME_MS,selectArgusUnitFrame,keyArgusUnitMatte,createArgusUnitActor,drawArgusUnitActor} from '../fairmont/argus-unit-sprites.mjs';
import {FAIRMONT_ENEMIES,enemiesFor} from '../fairmont/enemies.mjs';
import {FACILITY_ZONES,MARKET_FLOORS,mapFor,spawnEvents} from '../fairmont/world.mjs';
import {createEncounter,playerAction,enemyAction} from '../city/encounters.mjs';
import {createChapterProgress} from '../city/chapter-start.mjs';
import {encounterBounds,touchingBounds} from '../city/encounter-contact.mjs';

test('all twelve robot poses exclude the sheet labels and retain the exact supplied artwork',()=>{
 const png=readFileSync(new URL(ARGUS_UNIT_SOURCE.url));
 assert.equal(createHash('sha256').update(png).digest('hex'),'45e4b5b4ab17289b1ecdb3a6b05c93a06e4f442bf8f02ee3afe9cef9fbb9fefe');
 assert.equal(png.readUInt32BE(16),ARGUS_UNIT_SOURCE.width);assert.equal(png.readUInt32BE(20),ARGUS_UNIT_SOURCE.height);
 const labels=[[45,8,200,49],[45,274,213,49],[45,526,220,49],[45,773,172,48]];
 const overlaps=([x,y,w,h],[a,b,c,d])=>x<a+c&&x+w>a&&y<b+d&&y+h>b;
 const all=Object.values(ARGUS_UNIT_FRAMES).flat();assert.equal(all.length,12);
 for(const [i,frame]of all.entries()){
  const [x,y,w,h]=frame;assert.ok(x>=0&&y>=0&&x+w<=1448&&y+h<=1086);
  for(const label of labels)assert.equal(overlaps(frame,label),false);
  for(const other of all.slice(i+1))assert.equal(overlaps(frame,other),false);
 }
});

test('black background is removed while enclosed black armor remains opaque',()=>{
 const width=7,height=7,pixels=new Uint8ClampedArray(width*height*4);
 for(let i=3;i<pixels.length;i+=4)pixels[i]=255;
 for(let y=1;y<6;y++)for(let x=1;x<6;x++)if(x===1||x===5||y===1||y===5){const i=(y*width+x)*4;pixels[i]=42;pixels[i+1]=73;pixels[i+2]=125;}
 keyArgusUnitMatte(pixels,width,height);
 assert.equal(pixels[3],0);assert.equal(pixels[(3*width+3)*4+3],255);assert.equal(pixels[(1*width+1)*4+3],255);
});

test('supplied left and right facings animate independently with stable feet and scale',()=>{
 const chain=()=>{const v={};for(const method of ['setOrigin','setScale','setDepth','setFlipX','setTexture','setPosition'])v[method]=(...args)=>{v[method+'Args']=args;return v;};return v;};
 const scene={add:{sprite:chain,ellipse:chain}},actor=createArgusUnitActor(scene,300,650),scale=actor.scale;
 for(const dir of ['down','left','right','up']){
  const selected=[0,1,2,3].map(n=>selectArgusUnitFrame({dir,walking:true,elapsed:n*ARGUS_UNIT_FRAME_MS}).frame);
  assert.equal(new Set(selected).size,3);assert.ok(selected.every(frame=>frame.startsWith(dir+'-')));
  actor.dir=dir;actor.walking=true;drawArgusUnitActor(actor,ARGUS_UNIT_FRAME_MS);
  assert.equal(actor.scale,scale);assert.deepEqual(actor.sprite.setPositionArgs,[300,650]);assert.deepEqual(actor.sprite.setFlipXArgs,[false]);
  assert.equal(selectArgusUnitFrame({dir,walking:false,elapsed:999}).frame,dir+'-0');
 }
 // Its full source pose is the engagement rectangle: top-to-feet contact counts.
 const pose=selectArgusUnitFrame(actor).bounds;
 actor.sprite.getBounds=()=>({x:actor.x-pose[2]*scale/2,y:actor.y-pose[3]*scale,width:pose[2]*scale,height:pose[3]*scale});
 const bounds=encounterBounds(actor),hero={x:actor.x-20,y:bounds.y-70,width:40,height:70};
 assert.equal(touchingBounds(bounds,hero),true);
});

test('personal units join only the released final-floor roster and keep ordinary random spawns',()=>{
 const released={flags:{CH2_ARGUS_UNITS_RELEASED:true}},unreleased={flags:{}};
 for(const base of [...FACILITY_ZONES,...MARKET_FLOORS])for(let room=0;room<6;room++){
  const map=mapFor(room?base+'-room-'+room:base),shouldInclude=!map.isMarket&&map.index===4;
  assert.equal(enemiesFor(map,unreleased).includes('argusSentinel'),false);
  assert.equal(enemiesFor(map,released).includes('argusSentinel'),shouldInclude);
 }
 assert.equal(enemiesFor(null,released).includes('argusSentinel'),false);
 const final=mapFor(FACILITY_ZONES[4]+'-room-1');assert.equal(final.spawns.length,1);
 const slot=()=>({...final.spawns[0],enemy:null,armed:true});
 const player={x:final.spawns[0].x-500,y:final.spawns[0].y},view={x:0,y:0,w:1536,h:1024};
 assert.equal(spawnEvents([slot()],player,view,true,()=>0).length,1);
 assert.equal(spawnEvents([slot()],player,view,true,()=>.99).length,0);
});

test('Sentinel is a stronger ordinary enemy without leaking into earlier reinforcements',()=>{
 const sentinel=FAIRMONT_ENEMIES.argusSentinel,fabricator=FAIRMONT_ENEMIES.assemblyArm;
 for(const stat of ['hp','attack','charge'])assert.ok(sentinel[stat]>=fabricator[stat]*1.1&&sentinel[stat]<=fabricator[stat]*1.15,stat);
 assert.ok(sentinel.hp<FAIRMONT_ENEMIES.argus.hp*.45);assert.equal(sentinel.boss,undefined);
 for(const enemy of Object.values(FAIRMONT_ENEMIES))assert.notEqual(enemy.helper,'argusSentinel');
 const battle=createEncounter('argusSentinel',createChapterProgress(2,'Ada'));
 playerAction(battle,'guard');const result=enemyAction(battle,()=>.17);
 assert.equal(result.type,'help');assert.equal(battle.enemies.at(-1).id,'testDrone');
 assert.equal(battle.enemy.portrait,'fairmont-argus-unit');assert.equal(battle.enemy.frame,'portrait');
});
