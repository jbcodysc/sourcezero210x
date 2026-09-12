import test from 'node:test';
import assert from 'node:assert/strict';
import {BUILDINGS as fairmontBuildings,worldWalkable,nearestWalkable,rearServiceEntrance,MARKET_FLOORS,FACILITY_ZONES,mapFor,PARK,PARK_DETAILS,PARK_OBSTACLES} from '../fairmont/world.mjs';
import {buildingGeometry} from '../fairmont/building-geometry.mjs';
import {BUILDINGS as bellwetherBuildings,cityWalkable,buildingFootprint,facadeBounds} from '../city/city-world.mjs';

function checkBase(b,base,facade,walkable){
 const center=base.x+base.w/2;
 assert.ok(base.w<=facade.w,b.id+' base extends beyond art');
 assert.ok(base.h<facade.h*.35,b.id+' upper walls should not block walking behind');
 assert.equal(walkable(center,base.y+base.h/2),false,b.id+' base is not solid');
 assert.ok(walkable(center,base.y-23),b.id+' rear wall is inaccessible');
 assert.ok(walkable(base.x-23,base.y+base.h/2),b.id+' left wall stops the player too early');
 assert.ok(walkable(base.x+base.w+23,base.y+base.h/2),b.id+' right wall stops the player too early');
 assert.ok(walkable(center,base.y+base.h+23),b.id+' front wall stops the player too early');
 // Walk a complete perimeter, including across the space behind the upper art.
 const corners=[{x:base.x-24,y:base.y+base.h+24},{x:base.x-24,y:base.y-24},{x:base.x+base.w+24,y:base.y-24},{x:base.x+base.w+24,y:base.y+base.h+24}];
 for(let i=0;i<4;i++){
  const a=corners[i],z=corners[(i+1)%4],steps=Math.ceil(Math.hypot(z.x-a.x,z.y-a.y)/8);
  for(let j=0;j<=steps;j++)assert.ok(walkable(a.x+(z.x-a.x)*j/steps,a.y+(z.y-a.y)*j/steps),b.id+' cannot be circled at its base');
 }
}

test('every Bellwether building has a solid shallow base and walkable rear perimeter',()=>{
 for(const b of bellwetherBuildings){const base=buildingFootprint(b);assert.deepEqual(base,b.body);checkBase(b,base,facadeBounds(b),cityWalkable);}
});

test('every Fairmont building uses its aspect-fitted artwork for the physical base',()=>{
 for(const b of fairmontBuildings){const {footprint,facade,w,h}=buildingGeometry(b);assert.ok(w<=b.w+.01&&h<=b.h+.01);checkBase(b,footprint,facade,(x,y)=>worldWalkable('fairmont',x,y));}
 const market=fairmontBuildings.find(b=>b.id==='market'),geo=buildingGeometry(market);
 assert.ok(geo.w<market.w*.6,'the tall narrow market must not block its unused drawing allocation');
});

test('both industrial service entrances and their exits sit directly behind the actual base',()=>{
 for(const [id,location]of [['market',MARKET_FLOORS[0]],['facility',FACILITY_ZONES[0]]]){
  const b=fairmontBuildings.find(b=>b.id===id),{footprint}=buildingGeometry(b),door=rearServiceEntrance(b);
  assert.ok(Math.abs(door.x-footprint.x-footprint.w/2)<1e-8);
  assert.ok(door.y<footprint.y&&footprint.y-door.y<60);
  assert.ok(worldWalkable('fairmont',door.x,door.y));
  assert.deepEqual(mapFor(location).doors.find(d=>d.target==='fairmont').position,door);
 }
});

test('the enlarged commons has physical planting beds and clear story-character positions',()=>{
 assert.ok(PARK.w*PARK.h>1900*820*1.15);
 for(const bed of PARK_DETAILS.flowerbeds){
  assert.ok(PARK_OBSTACLES.some(o=>bed.x>=o.x&&bed.x<=o.x+o.w&&bed.y>=o.y&&bed.y<=o.y+o.h));
  assert.equal(worldWalkable('fairmont',bed.x,bed.y-10),false,'flowerbed must be solid');
 }
 for(const p of Object.values(PARK_DETAILS.npcs))assert.ok(worldWalkable('fairmont',p.x,p.y));
});

test('stale save positions avoid new furniture and NPCs without returning invalid coordinates',()=>{
 const saved={x:870,y:570},npcs=[{...saved}],safe=nearestWalkable('fairmont-hotel',saved,npcs);
 assert.ok(worldWalkable('fairmont-hotel',safe.x,safe.y,npcs));
 assert.ok(Math.hypot(safe.x-saved.x,safe.y-saved.y)<=72,'a nearby safe position should be preferred');
 const broken=nearestWalkable('fairmont',{x:NaN,y:Infinity});
 assert.ok(worldWalkable('fairmont',broken.x,broken.y));
 const base=buildingGeometry(fairmontBuildings.find(b=>b.id==='radio')).footprint;
 const buried=nearestWalkable('fairmont',{x:base.x+base.w/2,y:base.y+base.h/2});
 assert.ok(worldWalkable('fairmont',buried.x,buried.y));
 const strict=nearestWalkable('fairmont-hotel',saved,npcs,(x,y)=>worldWalkable('fairmont-hotel',x,y,npcs)&&y>620);
 assert.ok(strict.y>620&&worldWalkable('fairmont-hotel',strict.x,strict.y,npcs));
});
