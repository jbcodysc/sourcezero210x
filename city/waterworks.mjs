import {contains,pointInZone,distanceToZone} from './city-world.mjs';
export const DUNGEON={width:3072,height:2304,chaseSpeed:365,spawnChance:.85};
export const WATER_FLOORS=['water-b1','water-b2','water-b3','water-b4'];
export const FLOOR_TITLES=['B1 · Intake Galleries','B2 · Filtration Works','B3 · Pressure Exchange','B4 · Regulator Vault'];
const baseRooms=[
 {id:'foyer',x:128,y:1632,w:800,h:512},
 {id:'pump',x:128,y:736,w:800,h:672},
 {id:'store',x:128,y:128,w:800,h:384},
 {id:'gallery',x:1152,y:736,w:768,h:672},
 {id:'break',x:1152,y:1632,w:768,h:512},
 {id:'basin',x:2144,y:736,w:800,h:672},
 {id:'service',x:2144,y:128,w:800,h:384},
 {id:'stairs',x:2144,y:1632,w:800,h:512}
];
const baseHalls=[{x:448,y:1408,w:160,h:224},{x:448,y:512,w:160,h:224},{x:928,y:992,w:224,h:160},{x:1472,y:1408,w:160,h:224},{x:1920,y:992,w:224,h:160},{x:2464,y:512,w:160,h:224},{x:2464,y:1408,w:160,h:224}];
function transform(p,index){return {...p,x:index%2?DUNGEON.width-p.x-(p.w||0):p.x,y:index>=2?DUNGEON.height-p.y-(p.h||0):p.y};}
export function floorData(id){
 const index=WATER_FLOORS.indexOf(id);if(index<0)return null;
 const rooms=baseRooms.map(r=>transform(r,index)),halls=baseHalls.map(r=>transform(r,index));
 const point=p=>transform(p,index),foyer=rooms[0],last=rooms.at(-1);
 const up={x:foyer.x+foyer.w/2,y:foyer.y+foyer.h-80},down={x:last.x+last.w/2,y:last.y+last.h-80},arrival={x:up.x,y:up.y-150},returnArrival={x:down.x,y:down.y-150};
 const supplies=index===0?[{...point({x:500,y:315}),id:id+'-supplies',count:1}]:index===3?[{...point({x:2650,y:315}),id:id+'-reserve',count:1}]:[];
 const rest=index===2?{...point({x:1510,y:1880}),id:id+'-firstaid'}:null;
 // Props stay along room walls; the central walkways and all corridor mouths stay clear.
 const props=rooms.flatMap((r,i)=>[
  {key:i%3===0?'pump':i%3===1?'pipes':'console',x:r.x+r.w-125,y:r.y+210,width:170,solid:true},
  ...(i!==0&&i!==7?[{key:'barrels',x:r.x+130,y:r.y+r.h-65,width:135,solid:true}]:[])
 ]);
 return {id,index,title:FLOOR_TITLES[index],rooms,halls,foyer,last,up,down,arrival,returnArrival,supplies,rest,props,vest:point({x:750,y:1850}),boss:{x:last.x+last.w/2,y:last.y+last.h-180}};
}
export function dungeonWalkable(floor,x,y,blockers=[]){
 if(!floor||!Number.isFinite(x)||!Number.isFinite(y))return false;
 const inside=(xx,yy)=>[...floor.rooms,...floor.halls].some(r=>contains({x:xx,y:yy},r));
 if(![[x-17,y-17],[x+17,y-17],[x-17,y+17],[x+17,y+17]].every(([xx,yy])=>inside(xx,yy)))return false;
 if(floor.props.some(p=>p.solid&&contains({x,y},{x:p.x-65,y:p.y-52,w:130,h:58},12)))return false;
 return !blockers.some(p=>Math.hypot(p.x-x,p.y-y)<(p.radius||31));
}
const pools=[
 ['waterScrubber','waterScrubber','pipeRat','pipeRat','drainBot','pipeBot','waterGuard'],
 ['waterScrubber','pipeRat','pipeBot','pipeBot','drainBot','waterGuard','waterGuard'],
 ['waterScrubber','pipeRat','pipeBot','drainBot','drainBot','waterGuard','waterGuard'],
 ['waterScrubber','pipeRat','pipeBot','pipeBot','drainBot','waterGuard','waterGuard','waterGuard']
];
export function newDungeonSpawns(floor){return floor.rooms.map(r=>({area:{id:floor.id+'-'+r.id,x:r.x+80,y:r.y+80,w:r.w-160,h:r.h-160},armed:true,enemy:null,rolled:false}));}
function spawnIn(slot,floor,player,rng,camera=null){
 for(let i=0;i<40;i++){const p=pointInZone(slot.area,rng);if(Math.hypot(p.x-player.x,p.y-player.y)<260||!dungeonWalkable(floor,p.x,p.y)||camera&&contains(p,camera,70)||[floor.up,floor.down].some(s=>Math.hypot(p.x-s.x,p.y-s.y)<160))continue;
  const pool=pools[floor.index];slot.enemy={...p,id:slot.area.id,kind:pool[Math.min(pool.length-1,Math.floor(rng()*pool.length))]};slot.rolled=false;return {type:'spawn',...slot.enemy};
 }return null;
}
export function seedFoyer(slots,floor,player,rng=Math.random){
 const slot=slots[0];if(!slot.armed||slot.enemy)return null;slot.armed=false;slot.rolled=rng()<DUNGEON.spawnChance;return slot.rolled?spawnIn(slot,floor,player,rng):null;
}
export function updateDungeonSpawns(slots,floor,player,camera,rng=Math.random){
 const events=[];let active=slots.filter(s=>s.enemy).length;
 for(const slot of slots){const d=distanceToZone(player,slot.area);
  if(d>1550){if(slot.enemy){events.push({type:'remove',id:slot.area.id});slot.enemy=null;active--;}slot.armed=true;slot.rolled=false;continue;}
  if(d>1050||slot.enemy||active>=7)continue;
  if(slot.armed){slot.armed=false;slot.rolled=rng()<DUNGEON.spawnChance;}
  if(slot.rolled){const event=spawnIn(slot,floor,player,rng,camera);if(event){events.push(event);active++;}}
 }return events;
}
// A small navigation grid lets pursuers round pipe galleries instead of pushing into walls.
export function chaseStep(floor,from,to){
 const clear=(a,b)=>{const count=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/16));for(let i=1;i<=count;i++)if(!dungeonWalkable(floor,a.x+(b.x-a.x)*i/count,a.y+(b.y-a.y)*i/count))return false;return true;};
 if(clear(from,to))return {...to};
 const step=64,key=(x,y)=>x+','+y,toCell=p=>({x:Math.floor(p.x/step),y:Math.floor(p.y/step)}),start=toCell(from),goal=toCell(to),queue=[start],previous=new Map([[key(start.x,start.y),null]]);let found=null;
 for(let i=0;i<queue.length&&i<1800;i++){const c=queue[i];if(Math.abs(c.x-goal.x)+Math.abs(c.y-goal.y)<=1&&clear({x:c.x*step+32,y:c.y*step+32},to)){found=c;break;}for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const n={x:c.x+dx,y:c.y+dy},k=key(n.x,n.y);if(!previous.has(k)&&dungeonWalkable(floor,n.x*step+32,n.y*step+32)){previous.set(k,c);queue.push(n);}}}
 if(!found)return {...to};let prev=previous.get(key(found.x,found.y));while(prev&&previous.get(key(prev.x,prev.y))){found=prev;prev=previous.get(key(found.x,found.y));}return {x:found.x*step+32,y:found.y*step+32};
}
export const SOUTH_FENCE={x:3296,y:4160,w:64,h:832};
export const FLOOD_CHANNELS=[{x:4144,y:3860,w:144,h:560},{x:3360,y:4260,w:1248,h:192}];
export const FLOOD_BARRIER={x:3360,y:4260,w:1248,h:732};
export const FAIRMONT_EXIT={x:3840,y:4770};
export function floodActive(s){return !!(s.flags.courierDone||s.flags.policeReported)&&!s.flags.waterRestored;}
export function southernWalkable(x,y,s){if(contains({x,y},SOUTH_FENCE,16))return false;if(floodActive(s)&&[...FLOOD_CHANNELS,FLOOD_BARRIER].some(r=>contains({x,y},r,18)))return false;return true;}

