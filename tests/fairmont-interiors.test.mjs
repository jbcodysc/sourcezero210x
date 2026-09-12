import test from 'node:test';
import assert from 'node:assert/strict';
import {interiorDesignFor,furnishingObstacles,drawInteriorDetails} from '../fairmont/interior-design.mjs';
import {INTERIORS,HOTEL_LOCATIONS,ROOM_LOCATIONS,mapFor,hotelMapFor} from '../fairmont/world.mjs';

test('coffee shop and hotel support their public uses with staff and furnished seating',()=>{
 const cafe=interiorDesignFor('fairmont-cafe');
 for(const type of ['counter','espresso','pastries','cafe-table','chair'])assert.ok(cafe.details.some(d=>d.type===type),type);
 assert.equal(cafe.actors.filter(a=>a.id.includes('guest')).length,2);
 assert.ok(cafe.actors.some(a=>a.id.includes('brewer')));
 assert.ok(cafe.service,'existing barista retains a service location');
 const hotel=interiorDesignFor('fairmont-hotel');
 for(const type of ['reception','key-rack','coffee-table','television'])assert.ok(hotel.details.some(d=>d.type===type),type);
 assert.ok(hotel.props.filter(d=>d.type==='sofa').length>=2);
 assert.ok(hotel.service);
});

test('department dressing leaves existing dungeon progression and encounter points clear',()=>{
 for(const id of ROOM_LOCATIONS){
  const map=mapFor(id),design=interiorDesignFor(id,map),obstacles=furnishingObstacles(design);
  assert.ok(design.props.length+design.details.length>=8,`${id} needs substantial room content`);
  const points=[map.arrival,...map.doors,...map.supply,...map.spawns,...(map.logs||[]),...[map.puzzle,map.rest,map.boss,map.elevator].filter(Boolean)];
  for(const p of points)assert.ok(!obstacles.some(r=>p.x>=r.x-15&&p.x<=r.x+r.w+15&&p.y>=r.y-15&&p.y<=r.y+r.h+15),`${id} furnishing blocks ${p.id||JSON.stringify(p)}`);
  if(/office|control|routing/i.test(map.rooms[0].title)&&!map.boss)assert.ok(design.props.some(d=>d.type==='desk')||design.details.some(d=>d.type==='workbench'),`${id} needs an actual work station`);
 }
});

test('room fixtures render with valid pixel geometry and floor decoration does not become a wall',()=>{
 let rectangles=0;
 const scene={add:{graphics(){const g={};for(const name of ['setPosition','setDepth','fillStyle','fillRect','lineStyle','strokeRect'])g[name]=(...values)=>{for(const value of values)assert.ok(Number.isFinite(value),`${name}: ${values}`);if(name==='fillRect'){rectangles++;assert.ok(values[2]>=0&&values[3]>=0,'negative rectangle size');}return g;};return g;}}};
 for(const id of [...INTERIORS.map(x=>'fairmont-'+x),...HOTEL_LOCATIONS,...ROOM_LOCATIONS]){
  const design=interiorDesignFor(id,mapFor(id)||hotelMapFor(id));
  const obstacles=furnishingObstacles(design);
  assert.equal(obstacles.length,design.props.filter(d=>d.w&&d.h).length+design.details.filter(d=>d.solid).length);
  assert.equal(drawInteriorDetails(scene,design).length,design.details.length);
 }
 assert.ok(rectangles>1000,'room contents include real drawn detail');
});
