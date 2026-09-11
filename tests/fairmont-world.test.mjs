import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ARRIVAL, BUILDINGS, CITY, MARKET_FLOORS, FACILITY_ZONES, mapFor,
  worldWalkable, nearestWalkable, citySpawns, spawnEvents, markDefeated, chaseWaypoint,
} from '../fairmont/world.mjs';
import { createFairmontScene } from '../fairmont/scene.mjs';

// Test the same collision function used by the moving player. A 20-pixel grid
// fits inside the narrowest 110-pixel corridor; intermediate probes ensure an
// edge cannot skip through a thin obstacle. Final off-grid targets are linked
// to a reached cell with the same collision probes.
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

for (const location of [...MARKET_FLOORS,...FACILITY_ZONES]) {
  test(`${location}: stairs, every room, puzzle, boss, supplies and rest point are reachable`, () => {
    const map = mapFor(location), reachable = reachableGrid(location,map.arrival,map);
    const targets = [
      ['up stairs',map.up],['down stairs',map.down],['boss',map.boss],
      ...map.rooms.map(room => [`room ${room.id}`,map.point(room.id)]),
      ...map.supply.map(supply => [supply.id,supply]),
      ...map.spawns.map(spawn => [spawn.id,spawn]),
      ...(map.puzzle ? [['puzzle',map.puzzle]] : []),
      ...(map.rest ? [['rest station',map.rest]] : []),
    ];
    for (const [name,point] of targets) assert.ok(reachable(point), `${location}: ${name} is obstructed or disconnected`);
  });
}

test('floor walls, room furniture, city facades and construction enclosure keep their collision', () => {
  for (const location of [...MARKET_FLOORS,...FACILITY_ZONES]) {
    const map = mapFor(location);
    assert.equal(worldWalkable(location,0,0),false);
    const prop = map.props[0];
    assert.equal(worldWalkable(location,prop.x,prop.y-10),false);
    assert.ok(worldWalkable(location,map.arrival.x,map.arrival.y));
  }
  for (const building of BUILDINGS) assert.equal(worldWalkable('fairmont',building.x+building.w/2,building.y+building.h/2),false);
  assert.equal(worldWalkable('fairmont',2550,2550),false);
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
  for (const location of ['fairmont',...MARKET_FLOORS,...FACILITY_ZONES,'fairmont-radio']) {
    const recovered = nearestWalkable(location,{x:-1000,y:-1000});
    assert.ok(worldWalkable(location,recovered.x,recovered.y),`${location} recovery is blocked`);
  }
});

// Run the real scene construction methods without a renderer. These lightweight
// drawing objects discard paint operations while retaining runtime NPCs,
// collision rectangles and interaction targets for geometry checks.
function drawingObject() {
  const object = {width:320,height:400,displayWidth:320,displayHeight:400};
  for (const key of ['setDepth','fillStyle','fillRect','fillRoundedRect','lineStyle','lineBetween','strokeRect','setOrigin','setTint','add','setStrokeStyle','setAngle']) object[key] = () => object;
  object.setScale = scale => {object.displayWidth=object.width*scale;object.displayHeight=object.height*scale;return object;};
  return object;
}
function geometryScene(location) {
  const progress = {flags:{},visited:[]};
  const Scene = createFairmontScene({Base:class{constructor(){this.sys={settings:{}};}},getProgress:()=>progress,state:{}});
  const scene = new Scene();
  Object.assign(scene,{location,roomId:location.replace('fairmont-',''),night:false,map:mapFor(location),npcs:[],interactables:[],obstacles:[],visuals:[]});
  scene.building = BUILDINGS.find(b=>b.id===scene.roomId);
  scene.add = Object.fromEntries(['graphics','rectangle','container','image','tileSprite','ellipse','circle','text'].map(key=>[key,()=>drawingObject()]));
  scene.tweens={add:()=>{}};
  scene.label=()=>drawingObject();scene.prop=()=>drawingObject();
  scene.addCitizen=(id,name,x,y,row=0,text=null)=>{const npc={id,name,x,y,row,flavor:text};scene.npcs.push(npc);return npc;};
  if(location==='fairmont')scene.createJunction();else if(scene.map)scene.createComplex();else scene.createInterior();
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

test('runtime hotel bed, furniture details, services and exits remain separately selectable', () => {
  for(const id of ['terminal','hotel','diner','apartment','clinic','radio','cafe','gear','books']) {
    const scene=geometryScene('fairmont-'+id);
    const reachable=reachableGrid(scene.location,{x:770,y:850},{width:1536,height:1024},(x,y)=>scene.canStand(x,y,scene.npcs));
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
  for(const [id,offset] of [['market',190],['facility',350]]) {
    const building=BUILDINGS.find(b=>b.id===id);
    assert.ok(reachable({x:building.x+building.w+85,y:building.y+offset}),`${id} exit returns the player inside a wall`);
  }
  for(const npc of scene.npcs) assert.ok(worldWalkable('fairmont',npc.x,npc.y),`${npc.name} starts inside a world collider`);
});

test('runtime complex interactions are selectable without a neighboring terminal taking priority', () => {
  for(const location of [...MARKET_FLOORS,...FACILITY_ZONES]) {
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

test('patrols navigate room walls and furniture through corridors without cutting corners',()=>{
 for(const location of [...MARKET_FLOORS,...FACILITY_ZONES]){
  const map=mapFor(location);
  // Across the vertical room gap, a direct chase intersects furniture and wall.
  assertChaseReaches(location,{x:550,y:450},{x:550,y:960});
  assertChaseReaches(location,map.point(0),map.point(11));
  assertChaseReaches(location,map.point(11),map.point(0));
 }
});

test('city pursuit routes around building footprints and the closed construction site',()=>{
 const building=BUILDINGS.find(b=>b.id==='radio');
 const turns=assertChaseReaches('fairmont',{x:building.x-65,y:building.y+building.h/2},{x:building.x+building.w+65,y:building.y+building.h/2});
 assert.ok(turns>1,'a city chase should route around the building instead of going through it');
 assertChaseReaches('fairmont',{x:2180,y:2650},{x:3030,y:2650});
});

test('open corridors chase directly and invalid blocked endpoints fail safely',()=>{
 const location=FACILITY_ZONES[0],from={x:350,y:450},to={x:350,y:550};
 assert.deepEqual(chaseWaypoint(location,from,to),to);
 assert.deepEqual(chaseWaypoint(location,from,{x:0,y:0}),from);
 assert.deepEqual(chaseWaypoint(location,from,{x:NaN,y:0}),from);
 // Repeated calls reuse the same static graph without modifying either actor.
 const snapshot={...from};chaseWaypoint(location,from,{x:550,y:850});
 assert.deepEqual(from,snapshot);
});
