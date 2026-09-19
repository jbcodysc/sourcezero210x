import {doorApproach} from '../city/doors.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ARRIVAL, BUILDINGS, CITY, ROADS, PARK, PARK_DETAILS, MARKET_FLOORS, FACILITY_ZONES,
  ROOM_LOCATIONS, HOTEL, HOTEL_LOCATIONS, mapFor, hotelMapFor, canonicalLocation, dungeonRoomId,
  worldWalkable, nearestWalkable, citySpawns, spawnEvents, markDefeated, retireRoomSpawns, chaseWaypoint,buildingFootprint,rearServiceEntrance,
} from '../fairmont/world.mjs';
import { createFairmontScene } from '../fairmont/scene.mjs';
import {interiorDesignFor} from '../fairmont/interior-design.mjs';

// Use the player's collision function. Intermediate probes cannot skip through
// furniture; off-grid targets are linked to a reached cell using the same rule.
function reachableGrid(location, start, dimensions, collision = (x,y) => worldWalkable(location,x,y)) {
  const step = 20, stride = Math.ceil(dimensions.width / step) + 3;
  const height = Math.ceil(dimensions.height / step) + 3;
  const ox = ((start.x % step) + step) % step;
  const oy = ((start.y % step) + step) % step;
  const startCol = Math.round((start.x - ox) / step), startRow = Math.round((start.y - oy) / step);
  const cache = new Map();
  const pass = (x, y) => {
    const key = `${x},${y}`;
    if (!cache.has(key)) cache.set(key, collision(x,y));
    return cache.get(key);
  };
  const clearSegment = (a, b) => {
    const count = Math.max(1, Math.ceil(Math.hypot(a.x-b.x, a.y-b.y) / 5));
    for (let i = 0; i <= count; i++) if (!pass(a.x+(b.x-a.x)*i/count, a.y+(b.y-a.y)*i/count)) return false;
    return true;
  };
  assert.ok(pass(start.x,start.y), `${location} arrival is blocked`);
  const queue = [startRow * stride + startCol], visited = new Set(queue);
  for (let head = 0; head < queue.length; head++) {
    const cell = queue[head], col = cell % stride, row = Math.floor(cell / stride);
    const a = {x:ox+col*step,y:oy+row*step};
    for (const [dc,dr] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nc = col+dc, nr = row+dr, n = nr*stride+nc;
      if (nc < 0 || nr < 0 || nc >= stride || nr >= height || visited.has(n)) continue;
      const b = {x:ox+nc*step,y:oy+nr*step};
      if (clearSegment(a,b)) { visited.add(n); queue.push(n); }
    }
  }
  return target => {
    if (!pass(target.x,target.y)) return false;
    const col = Math.round((target.x-ox)/step), row = Math.round((target.y-oy)/step);
    for (let dc = -1; dc <= 1; dc++) for (let dr = -1; dr <= 1; dr++) {
      const nc = col+dc, nr = row+dr;
      if (visited.has(nr*stride+nc) && clearSegment({x:ox+nc*step,y:oy+nr*step},target)) return true;
    }
    return false;
  };
}

test('arrival connects to every city building door and each security spawn', () => {
  const reachable = reachableGrid('fairmont', ARRIVAL, CITY);
  for (const building of BUILDINGS) assert.ok(reachable(building.door), `${building.id} door has no walkable route`);
  for (const spawn of citySpawns()) assert.ok(reachable(spawn), `${spawn.id} is obstructed or isolated`);
});

for (const base of [...MARKET_FLOORS,...FACILITY_ZONES]) {
  test(`${base}: every separate room has reachable doors, supplies and controls`, () => {
   for(const location of ROOM_LOCATIONS.filter(id=>mapFor(id).baseId===base)){
    const map = mapFor(location), reachable = reachableGrid(location,map.arrival,map);
    const targets = [
      ...map.doors.map(door=>[door.id,door.facilityDoor?doorApproach(door):door]),
      ...map.supply.map(supply => [supply.id,supply]),
      ...map.spawns.map(spawn => [spawn.id,spawn]),
      ...map.logs.map(log=>['log '+log.index,log]),
      ...(map.puzzle ? [['puzzle',map.puzzle]] : []),
      ...(map.rest ? [['rest station',map.rest]] : []),
      ...(map.boss ? [['boss',map.boss]] : []),
      ...(map.elevator ? [['elevator',map.elevator.facilityDoor?doorApproach(map.elevator):map.elevator]] : []),
    ];
    for (const [name,point] of targets) assert.ok(reachable(point), `${location}: ${name} is obstructed or disconnected`);
    for(const door of map.doors)assert.ok(worldWalkable(door.target,door.position.x,door.position.y),`${location}: ${door.id} exits into a blocked destination`);
   }
  });
}

test('rooms load as distinct enclosed areas connected only through door transitions',()=>{
 assert.equal(ROOM_LOCATIONS.length,50);
 for(const base of [...MARKET_FLOORS,...FACILITY_ZONES]){
  const seen=new Set([base]),queue=[base];
  for(let head=0;head<queue.length;head++)for(const door of mapFor(queue[head]).doors){
   if(mapFor(door.target)?.baseId===base&&!seen.has(door.target)){seen.add(door.target);queue.push(door.target);}
  }
  assert.equal(seen.size,base==='fairmont-facility-5'?8:6,base+' has an unreachable room');
  for(const id of seen){const map=mapFor(id);assert.equal(map.rooms.length,1);assert.equal(map.floor.length,1);assert.equal(map.corridors.length,0);assert.equal(map.id,id);assert.equal(worldWalkable(id,0,600),false);assert.equal(worldWalkable(id,1500,600),false);}
 }
});

test('expanded market patrols and sparse facility encounters leave safe foyers and healing rooms',()=>{
 assert.equal(ROOM_LOCATIONS.map(mapFor).filter(m=>m.isMarket).flatMap(m=>m.spawns).length,Math.round(11*1.75));
 for(const base of [...MARKET_FLOORS,...FACILITY_ZONES]){
  const maps=ROOM_LOCATIONS.filter(id=>mapFor(id).baseId===base).map(mapFor);
  assert.ok(maps.flatMap(m=>m.spawns).length<=(mapFor(base).isMarket?7:base==='fairmont-facility-5'?5:4));
  assert.ok(maps.every(m=>m.spawns.length<=(m.isMarket?2:1)));
  assert.equal(mapFor(base).spawns.length,0,'stairs arrive into a safe foyer');
  assert.ok(maps.some(m=>m.supply.some(s=>s.kind==='snack')&&m.spawns.length===0));
  assert.ok(maps.some(m=>m.spawns.length>=1&&!m.supply.length&&!m.puzzle&&!m.rest&&!m.boss),'each floor includes an enemy-only room');
  assert.ok(maps.flatMap(m=>m.spawns).every(s=>s.chance===.72));
 }
});

test('only the defeated final boss releases the facility return elevator and street exit',()=>{
 const maps=ROOM_LOCATIONS.map(mapFor).filter(m=>!m.isMarket);
 const elevators=maps.filter(m=>m.elevator);
 assert.equal(elevators.length,1);
 const room=elevators[0];assert.ok(room.boss);assert.equal(room.index,4);assert.equal(room.elevator.target,FACILITY_ZONES[0]);assert.equal(room.elevator.requiresFlag,'CH2_ARGUS_DEFEATED');
 for(const map of maps)for(const door of map.doors){
  if(door.target==='fairmont')assert.equal(door.requiresFlag,'CH2_ARGUS_DEFEATED');
  const target=mapFor(door.target);if(target&&target.index>map.index)assert.ok(door.requiresFlag,'zone stairs must retain the control-terminal gate');
  if(target&&target.index<map.index)assert.equal(target.index,map.index-1,'no premature shortcut jumps to receiving');
 }
});

test('hotel has a public lobby, upstairs corridor and only one accessible guest bedroom',()=>{
 const lobby=hotelMapFor(HOTEL.lobby),hall=hotelMapFor(HOTEL.hall),bedroom=hotelMapFor(HOTEL.bedroom);
 assert.equal(BUILDINGS.find(b=>b.id==='hotel').stories,2);
 assert.equal(lobby.kind,'lobby');assert.equal(lobby.bed,null);assert.ok(lobby.clerk);assert.ok(lobby.props.some(p=>p.type==='sofa'));assert.ok(interiorDesignFor(lobby.id).props.some(p=>p.type==='public-hotel-reception'));
 assert.ok(lobby.doors.some(d=>d.target===HOTEL.hall&&d.stairs));
 assert.equal(hall.lockedDoors.length,4);assert.equal(hall.doors.filter(d=>d.target.startsWith('fairmont-hotel-room-')).length,1);assert.equal(hall.bed,null);
 assert.ok(bedroom.bed);assert.equal(bedroom.doors[0].target,HOTEL.hall);
 for(const id of HOTEL_LOCATIONS){const map=hotelMapFor(id),reachable=reachableGrid(id,map.arrival,map);for(const door of [...map.doors,...map.lockedDoors])assert.ok(reachable(door),id+' inaccessible '+door.id);if(map.bed)assert.ok(reachable(map.bed));}
});

test('the northwest commons is separate from industry and coffee is across town',()=>{
 assert.ok(PARK.x<200&&PARK.y<200);
 assert.ok(PARK_DETAILS.demolition.x+PARK_DETAILS.demolition.w<PARK.x+PARK.w/2);
 assert.ok(PARK_DETAILS.intact.x>=PARK.x+PARK.w/2-40);
 assert.ok(PARK_DETAILS.dirtPiles.length>=3&&PARK_DETAILS.fallenTrees.length>=2);
 assert.ok(PARK_DETAILS.benches.length>=2&&PARK_DETAILS.fountain&&PARK_DETAILS.trees.length>=3);
 const coffee=BUILDINGS.find(b=>b.id==='cafe');assert.ok(Math.hypot(coffee.door.x-PARK_DETAILS.npcs.derek.x,coffee.door.y-PARK_DETAILS.npcs.derek.y)>2500);
 assert.ok(ROADS.verticalStarts[750]>PARK.y+PARK.h);
 const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
 for(const b of BUILDINGS)assert.equal(overlap(b,PARK),false,b.id+' overlaps the park');
 for(const [id,p]of Object.entries(PARK_DETAILS.npcs))assert.ok(worldWalkable('fairmont',p.x,p.y),id+' is obstructed');
});

test('floor walls, room furniture, city facades and construction enclosure keep their collision', () => {
  for (const location of ROOM_LOCATIONS) {
    const map = mapFor(location);
    assert.equal(worldWalkable(location,0,0),false);
    const prop = map.props[0];
    assert.equal(worldWalkable(location,prop.x,prop.y-10),false);
    assert.ok(worldWalkable(location,map.arrival.x,map.arrival.y));
  }
  for (const building of BUILDINGS){const f=buildingFootprint(building);assert.equal(worldWalkable('fairmont',f.x+f.w/2,f.y+f.h/2),false);}
  assert.equal(worldWalkable('fairmont',PARK_DETAILS.demolition.x+200,PARK_DETAILS.demolition.y+200),false);
  assert.equal(worldWalkable('fairmont',-10,100),false);
});

const view = {x:0,y:0,w:900,h:650};
const slot = () => ({id:'patrol',x:700,y:400,w:150,h:150,armed:true,enemy:null});
const player = {x:200,y:400};

test('patrols roll the 82 percent chance once on approach, including a real chance of no encounter', () => {
  const success = slot(), miss = slot();
  assert.equal(spawnEvents([success],player,view,true,()=>.819999).filter(x=>x.type==='spawn').length,1);
  assert.deepEqual(spawnEvents([miss],player,view,true,()=>.82),[]);
  assert.equal(miss.armed,false);
  assert.deepEqual(spawnEvents([miss],player,view,true,()=>0),[],'staying nearby must not reroll until success');
  let rolled = 0;
  spawnEvents([slot()],{x:690,y:400},view,true,()=>{rolled++;return 0;});
  spawnEvents([slot()],{x:2000,y:400},view,true,()=>{rolled++;return 0;});
  assert.equal(rolled,0,'too close and distant slots do not spawn');
});

test('defeated patrols stay gone nearby and roll again only after leaving far offscreen', () => {
  const spawn = slot();
  spawnEvents([spawn],player,view,true,()=>0);
  markDefeated([spawn],spawn.id);
  assert.equal(spawn.enemy,null);
  assert.equal(spawn.armed,false);
  assert.deepEqual(spawnEvents([spawn],player,view,true,()=>0),[]);
  const farPlayer = {x:2500,y:400}, farView = {x:1900,y:0,w:900,h:650};
  spawnEvents([spawn],farPlayer,farView,true,()=>0);
  assert.equal(spawn.armed,true);
  assert.equal(spawnEvents([spawn],player,view,true,()=>0)[0]?.type,'spawn');
});

test('unloading a separate room rearms one probabilistic patrol roll without affecting active battles',()=>{
 const patrol={...slot(),chance:.72};spawnEvents([patrol],player,view,true,()=>0);markDefeated([patrol],patrol.id);
 assert.equal(patrol.armed,false);retireRoomSpawns([patrol]);assert.equal(patrol.armed,true);assert.equal(patrol.enemy,null);
 assert.deepEqual(spawnEvents([patrol],player,view,true,()=>.72),[]);assert.equal(patrol.armed,false);
 retireRoomSpawns([patrol]);assert.equal(spawnEvents([patrol],player,view,true,()=>.71).length,1);
});

test('visible or nearby enemies are retained; far offscreen and story-disabled enemies are removed', () => {
  const spawn = slot();
  spawnEvents([spawn],player,view,true,()=>0);
  assert.deepEqual(spawnEvents([spawn],{x:2500,y:400},view,true,()=>0),[],'visible enemies must not disappear');
  assert.ok(spawn.enemy);
  assert.deepEqual(spawnEvents([spawn],player,{x:1900,y:0,w:900,h:650},true,()=>0),[],'nearby enemies must not disappear');
  assert.deepEqual(spawnEvents([spawn],{x:2500,y:400},{x:1900,y:0,w:900,h:650},true,()=>0),[{type:'remove',id:'patrol'}]);
  spawnEvents([spawn],player,view,true,()=>0);
  assert.deepEqual(spawnEvents([spawn],player,view,false,()=>0),[{type:'remove',id:'patrol'}]);
  assert.equal(spawn.enemy,null);
});

test('save-position recovery supplies a walkable point for a stale blocked position', () => {
  for (const location of ['fairmont',...ROOM_LOCATIONS,...HOTEL_LOCATIONS,'fairmont-radio']) {
    const recovered = nearestWalkable(location,{x:-1000,y:-1000});
    assert.ok(worldWalkable(location,recovered.x,recovered.y),`${location} recovery is blocked`);
  }
  for(const base of [...MARKET_FLOORS,...FACILITY_ZONES]){assert.equal(canonicalLocation(base),base);assert.equal(mapFor(base).roomIndex,0);assert.equal(canonicalLocation(base+'-room-99'),base);}
  assert.equal(canonicalLocation(dungeonRoomId(MARKET_FLOORS[0],3)),dungeonRoomId(MARKET_FLOORS[0],3));
});

// Run the real scene construction methods without a renderer. These lightweight
// drawing objects discard paint operations while retaining runtime NPCs,
// collision rectangles and interaction targets for geometry checks.
function drawingObject() {
  const object = {width:320,height:400,displayWidth:320,displayHeight:400,texture:{key:'test-facade'}};
  for (const key of ['setDepth','setPosition','fillStyle','fillRect','fillEllipse','fillRoundedRect','lineStyle','lineBetween','strokeRect','strokeEllipse','setOrigin','setTint','add','setStrokeStyle','setAngle','setAlpha']) object[key] = () => object;
  object.setScale = scale => {object.scaleX=scale;object.displayWidth=object.width*scale;object.displayHeight=object.height*scale;return object;};
  return object;
}
function geometryScene(location) {
  const progress = {flags:{},visited:[]};
  const Scene = createFairmontScene({Base:class{constructor(){this.sys={settings:{}};}},getProgress:()=>progress,state:{}});
  const scene = new Scene();
  Object.assign(scene,{location,roomId:location.replace('fairmont-',''),night:false,map:mapFor(location),hotel:hotelMapFor(location),npcs:[],interactables:[],obstacles:[],visuals:[]});
  scene.building = BUILDINGS.find(b=>b.id===scene.roomId);
  scene.add = Object.fromEntries(['graphics','rectangle','container','image','tileSprite','ellipse','circle','text'].map(key=>[key,()=>drawingObject()]));
  scene.tweens={add:()=>{}};
  scene.textures={exists:()=>true};
  scene.label=()=>drawingObject();scene.prop=()=>drawingObject();
  scene.addCitizen=(id,name,x,y,row=0,text=null)=>{const npc={id,name,x,y,row,flavor:text};scene.npcs.push(npc);return npc;};
  if(location==='fairmont')scene.createJunction();else if(scene.map)scene.createComplex();else if(scene.hotel)scene.createHotel();else scene.createInterior();
  return scene;
}

function interactionCanBeSelected(scene, target, reachable) {
  const candidates=[...scene.interactables,...scene.npcs.map(n=>({...n,kind:'npc',range:120}))];
  const radius=target.range||122;
  for(let y=target.y-radius;y<=target.y+radius;y+=15) for(let x=target.x-radius;x<=target.x+radius;x+=15) {
    const distance=Math.hypot(x-target.x,y-target.y);
    if(distance>radius || !reachable({x,y}))continue;
    // There must be a reachable standing point where another eligible target
    // cannot steal the interaction merely by being closer to the player.
    if(!candidates.some(other=>other.id!==target.id && Math.hypot(x-other.x,y-other.y)<distance && Math.hypot(x-other.x,y-other.y)<=(other.range||122))) return true;
  }
  return false;
}

test('runtime hotel rooms, furniture details, services and exits remain separately selectable', () => {
  for(const id of [...['terminal','diner','apartment','clinic','radio','cafe','gear','books'].map(x=>'fairmont-'+x),...HOTEL_LOCATIONS]) {
    const scene=geometryScene(id);
    const reachable=reachableGrid(scene.location,scene.hotel?.arrival||{x:770,y:850},{width:1536,height:1024},(x,y)=>scene.canStand(x,y,scene.npcs));
    const targets=[...scene.interactables,...scene.npcs.map(n=>({...n,kind:'npc',range:120}))];
    for(const target of targets) assert.ok(interactionCanBeSelected(scene,target,reachable),`${id}: ${target.id} is obstructed or always hidden by another nearby interaction`);
  }
});

test('runtime market and facility service entrances, exit return points and city residents have access', () => {
  const scene=geometryScene('fairmont');
  const reachable=reachableGrid('fairmont',ARRIVAL,CITY,(x,y)=>scene.canStand(x,y,scene.npcs));
  for(const id of ['market-rear','facility-rear','bus-return']) {
    const target=scene.interactables.find(n=>n.id===id);
    assert.ok(target,`${id} is missing`);
    assert.ok(interactionCanBeSelected(scene,target,reachable),`${id} cannot be selected from a reachable point`);
  }
  for(const id of ['market','facility']) {
    const building=BUILDINGS.find(b=>b.id===id);
    assert.ok(reachable(rearServiceEntrance(building)),`${id} exit returns the player inside a wall`);
  }
  for(const npc of scene.npcs) assert.ok(worldWalkable('fairmont',npc.x,npc.y),`${npc.name} starts inside a world collider`);
});

test('runtime complex interactions are selectable without a neighboring terminal taking priority', () => {
  for(const location of ROOM_LOCATIONS) {
    const scene=geometryScene(location);
    const reachable=reachableGrid(location,scene.map.arrival,scene.map,(x,y)=>scene.canStand(x,y,scene.npcs));
    for(const target of scene.interactables) assert.ok(interactionCanBeSelected(scene,target,reachable),`${location}: ${target.id} cannot be selected from reachable floor`);
  }
});

function assertChaseReaches(location,start,goal){
 let point={...start},turns=0;
 for(;Math.hypot(point.x-goal.x,point.y-goal.y)>1&&turns<100;turns++){
  const next=chaseWaypoint(location,point,goal),distance=Math.hypot(next.x-point.x,next.y-point.y);
  assert.ok(distance>.01,`${location} chase stalled at ${point.x},${point.y}`);
  for(let i=0;i<=Math.ceil(distance/2);i++){
   const fraction=i/Math.ceil(distance/2);
   assert.ok(worldWalkable(location,point.x+(next.x-point.x)*fraction,point.y+(next.y-point.y)*fraction),`${location} chase cut through a wall`);
  }
  point=next;
 }
 assert.ok(turns<100,`${location} chase never reached its target`);
 return turns;
}

test('patrols route around furniture within their current room without leaving it',()=>{
 for(const base of [...MARKET_FLOORS,...FACILITY_ZONES]){
  const location=dungeonRoomId(base,1);
  assertChaseReaches(location,{x:275,y:365},{x:600,y:625});
  assertChaseReaches(location,{x:600,y:625},{x:275,y:365});
  assertChaseReaches(location,{x:775,y:860},{x:775,y:375});
 }
});

test('city pursuit routes around building footprints and the closed construction site',()=>{
 const building=BUILDINGS.find(b=>b.id==='radio');
 const base=buildingFootprint(building);
 const turns=assertChaseReaches('fairmont',{x:base.x-65,y:base.y+base.h/2},{x:base.x+base.w+65,y:base.y+base.h/2});
 assert.ok(turns>1,'a city chase should route around the building instead of going through it');
 assertChaseReaches('fairmont',{x:100,y:450},{x:1030,y:450});
});

test('open room floor chases directly and invalid blocked endpoints fail safely',()=>{
 const location=FACILITY_ZONES[0],from={x:650,y:700},to={x:800,y:700};
 assert.deepEqual(chaseWaypoint(location,from,to),to);
 assert.deepEqual(chaseWaypoint(location,from,{x:0,y:0}),from);
 assert.deepEqual(chaseWaypoint(location,from,{x:NaN,y:0}),from);
 // Repeated calls reuse the same static graph without modifying either actor.
 const snapshot={...from};chaseWaypoint(location,from,{x:550,y:850});
 assert.deepEqual(from,snapshot);
});
