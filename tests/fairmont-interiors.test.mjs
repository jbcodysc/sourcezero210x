import test from 'node:test';
import assert from 'node:assert/strict';
import {interiorDesignFor,furnishingObstacles,drawInteriorDetails} from '../fairmont/interior-design.mjs';
import {INTERIORS,HOTEL_LOCATIONS,ROOM_LOCATIONS,mapFor,hotelMapFor} from '../fairmont/world.mjs';
import {FAIRMONT_PROP_FRAMES,drawFairmontProp} from '../fairmont/art.mjs';
import {INTERIOR_ART} from '../fairmont/interior-art.mjs';

test('coffee shop and hotel use illustrated amenities and retain their staff and seating',()=>{
 const cafe=interiorDesignFor('fairmont-cafe');
 for(const type of ['desk','shelf','public-cafe-setting'])assert.ok(cafe.props.some(d=>d.type===type),type);
 assert.equal(cafe.props.filter(d=>d.type==='public-cafe-setting').length,3);
 assert.equal(cafe.actors.filter(a=>a.id.includes('guest')).length,2);
 assert.ok(cafe.actors.some(a=>a.id.includes('brewer')));
 assert.deepEqual(cafe.service,{x:870,y:555});
 const hotel=interiorDesignFor('fairmont-hotel');
 for(const type of ['public-hotel-reception','public-hotel-cart','public-cafe-setting'])assert.ok(hotel.props.some(d=>d.type===type),type);
 assert.ok(hotel.props.filter(d=>d.type==='sofa').length>=2);
 assert.deepEqual(hotel.service,{x:870,y:570});
 assert.ok(interiorDesignFor('fairmont-hotel-upstairs').props.some(p=>p.type==='public-hotel-cart'));
 assert.ok(interiorDesignFor('fairmont-hotel-room').props.some(p=>p.type==='bed'));
 for(const id of ['fairmont-cafe','fairmont-diner','fairmont-hotel']){
  const design=interiorDesignFor(id),obstacles=furnishingObstacles(design);
  for(const actor of [...design.actors,design.service])assert.ok(!obstacles.some(r=>actor.x>=r.x-15&&actor.x<=r.x+r.w+15&&actor.y>=r.y-15&&actor.y<=r.y+r.h+15),id+' furniture covers a staff member or patron');
 }
});

test('the clinic uses medical equipment and indoor waiting chairs instead of domestic or park furnishings',()=>{
 const clinic=interiorDesignFor('fairmont-clinic'),types=clinic.props.map(p=>p.type);
 for(const type of ['clinic-bed','clinic-cabinet','clinic-cart','clinic-screen','public-waiting-chairs'])assert.ok(types.includes(type),type);
 assert.equal(types.filter(t=>t==='clinic-bed').length,2);
 for(const type of ['bed','bench','parkBench','desk','sofa'])assert.ok(!types.includes(type),type+' does not belong in this clinic plan');
 assert.equal(clinic.details.length,0,'the clinic has no block-drawn cabinet, screen, or rug fallback');
 for(const p of clinic.props)if(p.type!=='plant')assert.ok(INTERIOR_ART[p.type].width*p.scale<=240,'medical furniture stays in proportion');
});

test('Whole Robotics sales rooms display products while drone production rooms have assembly and test machinery',()=>{
 const marketIds=ROOM_LOCATIONS.filter(id=>id.startsWith('fairmont-market'));
 for(const id of marketIds){
  const m=mapFor(id),d=interiorDesignFor(id,m),title=m.rooms[0].title;
  if(m.roomIndex===0||/demonstration/i.test(title)){
   assert.ok(d.props.some(p=>p.type==='robotics-retail-display'),id);
   assert.ok(d.props.some(p=>p.type==='robotics-retail-shelves'),id);
   assert.ok(!d.props.some(p=>p.type==='robotics-assembly-cell'),id+' is sales space');
  }
 }
 const assembly=interiorDesignFor('fairmont-facility-2-room-1',mapFor('fairmont-facility-2-room-1'));
 assert.equal(assembly.props.filter(p=>p.type==='robotics-assembly-cell').length,2);
 assert.ok(assembly.props.some(p=>p.type==='conveyor'));
 const testing=interiorDesignFor('fairmont-facility-3-room-1',mapFor('fairmont-facility-3-room-1'));
 assert.equal(testing.props.filter(p=>p.type==='robotics-test-rig').length,2);
 for(const id of ROOM_LOCATIONS.filter(id=>id.startsWith('fairmont-facility'))){
  assert.ok(!interiorDesignFor(id,mapFor(id)).props.some(p=>p.type.startsWith('robotics-retail-')),id+' is an active factory');
 }
});

test('department dressing leaves existing dungeon progression and encounter points clear',()=>{
 for(const id of ROOM_LOCATIONS){
  const map=mapFor(id),design=interiorDesignFor(id,map),obstacles=furnishingObstacles(design);
  assert.ok(design.props.length>=6,`${id} needs substantial illustrated room content`);
  const points=[map.arrival,...map.doors,...map.supply,...map.spawns,...(map.logs||[]),...[map.puzzle,map.rest,map.boss,map.elevator].filter(Boolean)];
  for(const p of points)assert.ok(!obstacles.some(r=>p.x>=r.x-15&&p.x<=r.x+r.w+15&&p.y>=r.y-15&&p.y<=r.y+r.h+15),`${id} furnishing blocks ${p.id||JSON.stringify(p)}`);
  if(/office|control|routing/i.test(map.rooms[0].title)&&!map.boss)assert.ok(design.props.some(d=>d.type==='desk'),`${id} needs an actual work station`);
 }
});

test('every furniture plan resolves real illustrated assets; only drains and hazard paint use primitive geometry',()=>{
 const drawn=[];
 const scene={add:{
  image(x,y,key,frame){
   assert.ok(Number.isFinite(x)&&Number.isFinite(y));drawn.push(key);
   const sprite={width:250,depth:null,setOrigin(a,b){assert.deepEqual([a,b],[.5,1]);return this;},setScale(scale){assert.ok(Number.isFinite(scale)&&scale>0);return this;},setDepth(depth){assert.ok(Number.isFinite(depth));this.depth=depth;return this;}};
   if(key.startsWith('fm-interior-')){assert.ok(INTERIOR_ART[key.slice(12)]);assert.equal(frame,'object');}
   else assert.ok(FAIRMONT_PROP_FRAMES[key.slice(14)]);
   return sprite;
  },
  graphics(){const g={};for(const name of ['setPosition','setDepth','fillStyle','fillRect'])g[name]=(...values)=>{for(const value of values)assert.ok(Number.isFinite(value),`${name}: ${values}`);if(name==='fillRect')assert.ok(values[2]>=0&&values[3]>=0,'negative rectangle size');return g;};return g;}
 }};
 for(const id of [...INTERIORS.map(x=>'fairmont-'+x),...HOTEL_LOCATIONS,...ROOM_LOCATIONS]){
  const design=interiorDesignFor(id,mapFor(id)||hotelMapFor(id));
  const obstacles=furnishingObstacles(design);
  assert.equal(obstacles.length,design.props.filter(d=>d.w&&d.h).length);
  for(const p of design.props){
   assert.ok(INTERIOR_ART[p.type]||FAIRMONT_PROP_FRAMES[p.type],id+' references missing art '+p.type);
   assert.ok(!['bench','parkBench'].includes(p.type),id+' has outdoor seating inside');
   drawFairmontProp(scene,p.type,p.x,p.y,p.scale);
  }
  for(const detail of design.details){
   assert.ok(['woven-rug','floor-drain','safety-line'].includes(detail.type),detail.type+' is a placeholder fixture');
   assert.equal(detail.solid,false);
  }
  assert.equal(drawInteriorDetails(scene,design).length,design.details.length);
 }
 assert.ok(drawn.includes('fm-interior-woven-rug'));
 assert.ok(drawn.includes('fm-interior-clinic-bed'));
 assert.ok(drawn.includes('fm-interior-robotics-assembly-cell'));
 assert.throws(()=>drawInteriorDetails(scene,{details:[{type:'medical-cabinet'}]}),/Unknown interior detail/);
});
