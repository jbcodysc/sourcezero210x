import test from 'node:test';
import assert from 'node:assert/strict';
import {CITY,ROADS,ARRIVAL,BUILDINGS,PARK,worldWalkable,nearestWalkable,rearServiceEntrance} from '../fairmont/world.mjs';
import {buildingGeometry} from '../fairmont/building-geometry.mjs';
import {CROSS_BLOCK_ALLEYS,CITY_NPC_POINTS,CITY_FIXTURES,compactLegacyCityPoint,CITY_LAYOUT_VERSION,COMPACT_CITY_FLAG} from '../fairmont/city-density.mjs';
import {createFairmontScene} from '../fairmont/scene.mjs';
import {createChapterProgress} from '../city/chapter-start.mjs';
import {freshProgress} from '../city/progress.mjs';
import {SaveSlots} from '../city/save-slots.mjs';
import {transition} from '../fairmont/story.mjs';

test('compact blocks remove excess concrete behind roofs without clipping the artwork',()=>{
 assert.ok(CITY.width*CITY.height<4800*4500*.75);
 assert.equal(ROADS.horizontal.length,4);
 assert.ok(ROADS.vertical.length>=2);
 assert.deepEqual(PARK,{x:100,y:70,w:2000,h:930});
 for(const b of BUILDINGS){
  const f=buildingGeometry(b).facade;
  assert.ok(f.x>=45&&f.x+f.w<=CITY.width-45,b.id+' art clips the city edge');
  assert.ok(f.y>=0&&f.y+f.h<CITY.height-100,b.id+' art clips the north/south boundary');
  const street=ROADS.horizontal.filter(y=>y<f.y).at(-1);
  if(street!==undefined){
   const clearance=f.y-street-95;
   assert.ok(clearance>=40&&clearance<=65,b.id+' retains a broad empty rear apron: '+clearance);
  }
 }
});

test('infill buildings have solid bases but keep frequent pedestrian cross-block alleys',()=>{
 const infill=BUILDINGS.filter(b=>b.decorative);
 assert.equal(infill.length,2);
 assert.ok(infill.every(b=>!b.enter&&!b.name));
 assert.ok(CROSS_BLOCK_ALLEYS.length>=8);
 for(const alley of CROSS_BLOCK_ALLEYS)for(let y=alley.from;y<=alley.to;y+=5)for(const dx of [-22,0,22]){
  assert.ok(worldWalkable('fairmont',alley.x+dx,y),'cross-block alley blocked at '+[alley.x+dx,y]);
 }
 for(const b of infill){const f=buildingGeometry(b).footprint;assert.equal(worldWalkable('fairmont',f.x+f.w/2,f.y+f.h/2),false);}
 const rects=BUILDINGS.map(b=>({id:b.id,...buildingGeometry(b).facade}));
 for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++){
  const a=rects[i],b=rects[j],overlap=a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
  assert.equal(overlap,false,a.id+' artwork overlaps '+b.id);
 }
});

test('relocated city residents, transport fixtures and both rear entrances remain on valid floor',()=>{
 for(const [id,p]of Object.entries(CITY_NPC_POINTS))assert.ok(worldWalkable('fairmont',p.x,p.y),id+' is blocked');
 assert.ok(worldWalkable('fairmont',ARRIVAL.x,ARRIVAL.y));
 const board=CITY_FIXTURES.departureBoard;assert.ok(worldWalkable('fairmont',board.x,board.y));
 assert.ok(CITY_FIXTURES.lamps.every(p=>p.x>=45&&p.x<=CITY.width-45&&p.y>0&&p.y<CITY.height));
 for(const id of ['market','facility']){const p=rearServiceEntrance(BUILDINGS.find(b=>b.id===id));assert.ok(worldWalkable('fairmont',p.x,p.y));}
});

test('old outdoor save coordinates compact monotonically while preserving the park',()=>{
 assert.equal(CITY_LAYOUT_VERSION,2);
 for(const p of [{x:1360,y:785},{x:1940,y:865},{x:1000,y:400}])assert.deepEqual(compactLegacyCityPoint(p),p);
 const oldPoints=[{x:760,y:4060},{x:4710,y:4300},{x:1680,y:2921},{x:3800,y:800}];
 for(const p of oldPoints){const n=compactLegacyCityPoint(p),safe=nearestWalkable('fairmont',n);assert.ok(worldWalkable('fairmont',safe.x,safe.y));}
 assert.deepEqual(compactLegacyCityPoint(null),ARRIVAL);
 const first=compactLegacyCityPoint({x:3300,y:2100}),second=compactLegacyCityPoint({x:4350,y:3400});
 assert.ok(first.x<second.x&&first.y<second.y);
});

function loadScene(progress,location=progress.location,position=progress.position){
 const Scene=createFairmontScene({Base:class{init(){}},getProgress:()=>progress,state:{}});
 const scene=new Scene();scene.init({location,position});return scene;
}

test('actual scene initialization migrates an old outdoor save only once through storage and doors',()=>{
 const progress=createChapterProgress(2,'Taylor');delete progress.flags[COMPACT_CITY_FLAG];
 progress.position={x:4710,y:4300};const old={...progress.position};
 const migrated=loadScene(progress);
 assert.deepEqual(migrated.entry,compactLegacyCityPoint(old));
 assert.deepEqual(progress.position,migrated.entry);
 assert.equal(progress.flags[COMPACT_CITY_FLAG],true);
 const memory=new Map(),storage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)};
 const files=new SaveSlots(storage);assert.ok(files.write(0,progress));
 const restored=new SaveSlots(storage).read(0),again=loadScene(restored);
 assert.equal(restored.flags[COMPACT_CITY_FLAG],true);
 assert.deepEqual(again.entry,migrated.entry,'loading twice must not shrink coordinates twice');
 const interiorPoint={x:770,y:850},inside=loadScene(restored,'fairmont-radio',interiorPoint);
 assert.deepEqual(inside.entry,interiorPoint);
 restored.location='fairmont-radio';restored.position=interiorPoint;
 const door=BUILDINGS.find(b=>b.id==='radio').door,back=loadScene(restored,'fairmont',door);
 assert.deepEqual(back.entry,door,'a current doorway destination must never be remapped');
 assert.equal(restored.level,15);assert.equal(restored.credits,2000);
});

test('old interior saves keep room and cutscene-context coordinates when tagging the city layout',()=>{
 const progress=createChapterProgress(2);delete progress.flags[COMPACT_CITY_FLAG];
 Object.assign(progress,{location:'fairmont-hotel-room-204',position:{x:510,y:665},chapter2HotelContext:{location:'fairmont-hotel-room-204',position:{x:515,y:660}}});
 const before=JSON.parse(JSON.stringify(progress));
 const scene=loadScene(progress);
 assert.deepEqual(scene.entry,before.position);assert.deepEqual(progress.position,before.position);
 assert.deepEqual(progress.chapter2HotelContext,before.chapter2HotelContext);
 assert.equal(progress.flags[COMPACT_CITY_FLAG],true);
 const door=BUILDINGS.find(b=>b.id==='hotel').door;
 assert.deepEqual(loadScene(progress,'fairmont',door).entry,door);
});

test('chapter selection and first natural arrival already use the compact city coordinate system',()=>{
 const chapter=createChapterProgress(2);
 assert.equal(chapter.flags[COMPACT_CITY_FLAG],true);
 assert.deepEqual(loadScene(chapter).entry,ARRIVAL);
 const natural=freshProgress();Object.assign(natural.flags,{waterRestored:true,relayTaken:true,badgeFixed:true});
 const arrived=transition(natural,'arrive').state;
 assert.equal(arrived.flags[COMPACT_CITY_FLAG],true);
 Object.assign(arrived,{location:'fairmont',position:{...ARRIVAL}});
 assert.deepEqual(loadScene(arrived).entry,ARRIVAL);
 // Replaying an already completed story event cannot mask a pre-update save.
 delete arrived.flags[COMPACT_CITY_FLAG];arrived.position={x:760,y:4060};
 const repeated=transition(arrived,'arrive').state,expected=compactLegacyCityPoint(arrived.position);
 assert.equal(repeated.flags[COMPACT_CITY_FLAG],undefined);
 assert.deepEqual(loadScene(repeated).entry,expected);
});
