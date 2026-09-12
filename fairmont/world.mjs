import {buildingFootprint,rearServiceEntrance} from './building-geometry.mjs';
import {interiorDesignFor,furnishingObstacles} from './interior-design.mjs';
export {buildingFootprint,rearServiceEntrance} from './building-geometry.mjs';
export const CITY={width:4800,height:4500};
// The western street starts below the commons rather than running through it.
export const ROADS={horizontal:[1100,2100,3400,4200],vertical:[750,3300,4350],verticalStarts:{750:1100}};
export const ARRIVAL={x:760,y:4060};
export const PARK={x:100,y:70,w:2000,h:930};
export const PARK_DETAILS={
 demolition:{x:125,y:165,w:845,h:690},intact:{x:1060,y:100,w:1010,h:860},
 paths:[{x:1000,y:845,w:1000,h:85},{x:1470,y:200,w:110,h:715},{x:1040,y:650,w:900,h:85}],
 fence:[{x:990,y:275},{x:990,y:430},{x:990,y:585},{x:990,y:740}],
 trees:[{x:1080,y:365},{x:1880,y:340},{x:1850,y:865}],
 tents:[{x:1160,y:560},{x:1740,y:615}],benches:[{x:1280,y:435},{x:1790,y:735}],
 flowerbeds:[{x:1280,y:330,scale:.85},{x:1765,y:400,scale:.85},{x:1320,y:610,scale:.85},{x:2040,y:660,scale:.9},{x:1700,y:965,scale:.85}],
 fountain:{x:1560,y:485},
 dirtPiles:[{x:325,y:380,scale:1.5},{x:685,y:700,scale:1.25},{x:760,y:300,scale:1}],
 fallenTrees:[{x:375,y:655,angle:-14},{x:690,y:490,angle:18}],
 stumps:[{x:230,y:260},{x:530,y:380},{x:830,y:760}],
 machinery:{x:635,y:630},crates:{x:850,y:825},
 npcs:{derek:{x:1360,y:785},protester:{x:1550,y:775},camper:{x:1190,y:700},organizer:{x:1760,y:825},signmaker:{x:1840,y:520},bystander:{x:1120,y:890}},
 guard:{x:1940,y:785},drones:[{x:1650,y:340},{x:1800,y:880}],scanCheckpoint:{x:1540,y:865},
};
export const PARK_OBSTACLES=[
 PARK_DETAILS.demolition,
 ...PARK_DETAILS.trees.map(({x,y})=>({x:x-26,y:y-27,w:52,h:32})),
 ...PARK_DETAILS.tents.map(({x,y})=>({x:x-85,y:y-65,w:170,h:65})),
 ...PARK_DETAILS.benches.map(({x,y})=>({x:x-65,y:y-30,w:130,h:35})),
 ...PARK_DETAILS.flowerbeds.map(({x,y,scale})=>({x:x-72*scale,y:y-57*scale,w:144*scale,h:57*scale})),
 ...PARK_DETAILS.fence.map(({x,y})=>({x:x-50,y:y-25,w:100,h:30})),
 {x:PARK_DETAILS.fountain.x-80,y:PARK_DETAILS.fountain.y-55,w:160,h:65},
];
const building=(id,name,type,x,y,w=510,h=520,enter=true)=>({id,name,type,x,y,w,h,enter,door:{x:x+w/2,y:y+h+50}});
export const BUILDINGS=[
 building('terminal','FAIRMONT TRANSIT','terminal',100,3550,470,470),
 {...building('hotel','THE SWITCHYARD HOTEL','hotel',1050,3590),stories:2},
 building('diner','NIGHT SHIFT DINER','cafe',1800,1460,480,460),
 building('apartment','MERCER APARTMENTS','apartment',2480,3540,560,560),
 building('clinic','JUNCTION FIRST AID','hotel',3570,3550,500,550),
 building('radio','RADIO HUT','radio',1090,1300,530,620),
 building('cafe','COMMON GROUNDS','cafe',1780,3640,460,460),
 building('gear','BOLT & BRACKET','warehouse',2460,1390,580,530),
 building('market','WHOLE ROBOTICS MARKET','market',1120,2390,1120,700),
 building('books','PAPER TRAIL BOOKS','apartment',2510,420,530,500),
 building('facility','CENEXIS AUTONOMOUS SYSTEMS','facility',3540,270,650,650),
 building('freight','JUNCTION FREIGHT','warehouse',3540,1360,630,540,false),
 building('supplier','VECTOR ROBOTICS','warehouse',3530,2430,640,560,false),
 building('civic','CIVIC SERVICES','apartment',100,2470,460,590,false),
 building('homes','RAILWAY TERRACE','apartment',100,1380,460,580,false),
 building('utility','GRID CONTROL','warehouse',2490,2390,480,640,false),
 building('dispatch','AUTONOMOUS DISPATCH','warehouse',4460,2350,270,650,false),
 building('lofts','EASTLINE LOFTS','apartment',4460,3550,270,530,false)
];
export const INTERIORS=['terminal','hotel','diner','apartment','clinic','radio','cafe','gear','books'];
export const HOTEL={lobby:'fairmont-hotel',hall:'fairmont-hotel-upstairs',bedroom:'fairmont-hotel-room-204'};
export const HOTEL_LOCATIONS=Object.values(HOTEL);
export const MARKET_FLOORS=['fairmont-market-1','fairmont-market-2','fairmont-market-3'];
export const FACILITY_ZONES=['fairmont-facility-1','fairmont-facility-2','fairmont-facility-3','fairmont-facility-4','fairmont-facility-5'];
export const FACILITY_TITLES=['Receiving & Service Entry','Assembly & Repair','Flight Validation Hangar','Sensor & Software Validation','Network Integration Core'];
export const MARKET_TITLES=['Home & Consumer Robotics','Components & Industrial Repair','Premium Systems & Building Control'];
export const dungeonRoomId=(baseId,index)=>index?baseId+'-room-'+index:baseId;
export const ROOM_LOCATIONS=[...MARKET_FLOORS,...FACILITY_ZONES].flatMap(base=>Array.from({length:6},(_,i)=>dungeonRoomId(base,i)));
export const LOCATIONS=[...new Set(['fairmont',...INTERIORS.map(x=>'fairmont-'+x),...HOTEL_LOCATIONS,...ROOM_LOCATIONS])];
/** Preserve legacy floor IDs as their new foyer; recover malformed old room IDs. */
export function canonicalLocation(id){
 if(LOCATIONS.includes(id))return id;
 const base=String(id||'').match(/^(fairmont-(?:market|facility)-\d+)/)?.[1];
 return [...MARKET_FLOORS,...FACILITY_ZONES].includes(base)?base:id;
}
const INDOOR_FLOOR={x:125,y:290,w:1280,h:650};
const INDOOR_SIZE={width:1536,height:1024};
const entryFor={west:{x:280,y:625},east:{x:1250,y:625},north:{x:770,y:430},south:{x:770,y:805}};
const doorPoint={west:{x:175,y:625},east:{x:1355,y:625},north:{x:770,y:340},south:{x:770,y:890}};
const opposite={west:'east',east:'west',north:'south',south:'north'};
function roomDoor(id,side,target,name,extra={}){
 return {id,...doorPoint[side],side,target,position:{...entryFor[opposite[side]]},name,kind:'room-door',...extra,stairs:extra.visual==='stairs'};
}
const hotelMaps={
 [HOTEL.lobby]:{
  id:HOTEL.lobby,...INDOOR_SIZE,title:'The Switchyard Hotel · Lobby',kind:'lobby',arrival:{x:770,y:840},
  floor:[INDOOR_FLOOR],props:[{type:'desk',x:1050,y:515,w:280,h:95},{type:'sofa',x:415,y:560,w:270,h:110},{type:'bench',x:430,y:790,w:180,h:55},{type:'plant',x:235,y:465,w:65,h:55}],
  clerk:{x:1010,y:635},doors:[roomDoor('hotel-street','south','fairmont','Return to the street',{position:BUILDINGS.find(b=>b.id==='hotel').door}),roomDoor('hotel-upstairs','east',HOTEL.hall,'Stairs to the second floor',{visual:'stairs'})],lockedDoors:[],bed:null,
 },
 [HOTEL.hall]:{
  id:HOTEL.hall,...INDOOR_SIZE,title:'The Switchyard Hotel · Second Floor',kind:'hall',arrival:{...entryFor.west},
  floor:[INDOOR_FLOOR],props:[{type:'plant',x:1350,y:460,w:60,h:55},{type:'bench',x:1110,y:790,w:200,h:55}],
  doors:[roomDoor('hotel-downstairs','west',HOTEL.lobby,'Stairs to the lobby',{visual:'stairs'}),{id:'hotel-room-204',x:1020,y:400,side:'north',target:HOTEL.bedroom,position:{x:770,y:805},name:'Enter room 204 · your room',kind:'room-door',number:'204'}],
  lockedDoors:[201,202,203,205].map((number,i)=>({id:'hotel-locked-'+number,x:[285,530,775,1265][i],y:400,side:'north',name:'Room '+number,number:String(number),text:'Occupied. Your key is for room 204.'})),bed:null,
 },
 [HOTEL.bedroom]:{
  id:HOTEL.bedroom,...INDOOR_SIZE,title:'The Switchyard Hotel · Room 204',kind:'bedroom',arrival:{x:770,y:805},
  floor:[INDOOR_FLOOR],props:[{type:'bed',x:415,y:580,w:270,h:150},{type:'desk',x:1100,y:515,w:280,h:95},{type:'sofa',x:1110,y:790,w:235,h:90},{type:'plant',x:225,y:445,w:65,h:55}],
  doors:[roomDoor('hotel-room-exit','south',HOTEL.hall,'Return to the guest corridor',{position:{x:1020,y:520}})],lockedDoors:[],bed:{x:505,y:665},
 },
};
for(const map of Object.values(hotelMaps)){
 const design=interiorDesignFor(map.id);map.props=design.props;map.furnishingObstacles=furnishingObstacles(design);
 if(design.service)map.clerk={...design.service};
}
export const hotelMapFor=id=>hotelMaps[id]||null;
const puzzleSpecs=[
 {id:'receiving-power',name:'Reroute loading-bay power',flag:'CH2_RECEIVING_POWER',text:'Auxiliary power routed to the service shutter. The freight route is open.',type:'console'},
 {id:'assembly-belt',name:'Reverse the service conveyor',flag:'CH2_CONVEYOR_REVERSED',text:'The belt reverses. A service lane opens behind the repair cages.',type:'console'},
 {id:'flight-test',name:'Redirect the validation flight',flag:'CH2_TEST_REDIRECTED',text:'Test drones return to their charging docks. The hangar safety interlock releases.',type:'console'},
 {id:'sensor-route',name:'Route the calibration sequence',flag:'CH2_SENSOR_ROUTED',text:'The test sequence moves to the empty calibration booth. Network access is released.',type:'console'},
 {id:'core-shutters',name:'Open integration shutters',flag:'CH2_CORE_SHUTTERS',text:'Integration hangar unlocked. A.R.G.U.S. transfers control to a dedicated security chassis.',type:'console'},
];
const roomNames={
 market:[['Service foyer','Consumer demonstration hall','Shipping stockroom','Returned units','Security office','Upper stairwell'],['Parts foyer','Industrial repair room','Parts reserve','Calibration room','Supervisor office','Upper stairwell'],['Executive foyer','Premium demonstration room','Emergency supplies','Security storage','Operations office','Primary control room']],
 facility:[['Receiving foyer','Freight inspection','Supplies cage','Unscheduled intake','Loading control','Assembly access'],['Assembly foyer','Automated welding','Spare components','Repair isolation','Conveyor control','Validation access'],['Hangar foyer','Live flight validation','Staff recovery','Drone storage','Test routing','Sensor access'],['Validation foyer','Sensor test chamber','Calibration supplies','Software isolation','Sequence control','Core access'],['Core foyer','Network assembly','Integration supplies','Security holding','Recovery and shutter control','A.R.G.U.S. integration chamber']],
};
const mapCache=new Map();
export function mapFor(requestedId){
 const id=canonicalLocation(requestedId);if(!ROOM_LOCATIONS.includes(id))return null;
 if(mapCache.has(id))return mapCache.get(id);
 const baseId=id.match(/^fairmont-(?:market|facility)-\d+/)[0],retail=MARKET_FLOORS.indexOf(baseId),isMarket=retail>=0,index=isMarket?retail:FACILITY_ZONES.indexOf(baseId),roomIndex=Number(id.match(/-room-(\d+)$/)?.[1]||0);
 const bases=isMarket?MARKET_FLOORS:FACILITY_ZONES,names=roomNames[isMarket?'market':'facility'][index],lastFloor=index===bases.length-1;
 const title=(isMarket?MARKET_TITLES:FACILITY_TITLES)[index]+' · '+names[roomIndex];
 const props=[{type:roomIndex===0?'bench':isMarket?(index===0?'shelf':index===1?'crates':'desk'):['crates','assemblyArm','droneDock','console','server'][index],x:430,y:510,w:205,h:100}];
 if(roomIndex!==5)props.push({type:roomIndex===2?'crates':isMarket?'shelf':'server',x:1100,y:490,w:195,h:90});
 if(roomIndex===1||roomIndex===3)props.push({type:isMarket?'desk':'console',x:735,y:535,w:145,h:75});
 const doors=[],link=(side,next,name,extra={})=>doors.push(roomDoor(id+'-'+side,side,dungeonRoomId(baseId,next),name||names[next],extra));
 if(roomIndex===0){
  link('east',1,'Enter '+names[1]);
  if(index>0)doors.push(roomDoor(id+'-previous','south',dungeonRoomId(bases[index-1],5),'Stairs to the previous '+(isMarket?'floor':'zone'),{visual:'stairs',position:{...entryFor.south}}));
  else {const b=BUILDINGS.find(b=>b.id===(isMarket?'market':'facility'));doors.push(roomDoor(id+'-street','south','fairmont','Exit through the service entrance',{position:rearServiceEntrance(b),...(!isMarket?{requiresFlag:'CH2_ARGUS_DEFEATED',lockedText:'The entry lockdown is controlled by A.R.G.U.S. The integration core must release it.'}:{})}));}
 }
 if(roomIndex===1){link('west',0,'Return to the foyer');link('north',2,'Enter '+names[2]);link('east',3,'Enter '+names[3]);}
 if(roomIndex===2){link('south',1,'Return to '+names[1]);link('east',4,'Enter '+names[4]);}
 if(roomIndex===3){link('west',1,'Return to '+names[1]);link('north',4,'Enter '+names[4]);}
 if(roomIndex===4){link('west',2,'Return to '+names[2]);link('south',3,'Return to '+names[3]);link('east',5,'Enter '+names[5],!isMarket&&lastFloor?{requiresFlag:puzzleSpecs[index].flag,lockedText:'Integration is sealed. Release the shutters at network control.'}:{});}
 if(roomIndex===5){
  link('west',4,'Return to '+names[4]);
  if(!lastFloor)doors.push(roomDoor(id+'-next','south',bases[index+1],'Stairs to '+(isMarket?'floor '+(index+2):FACILITY_TITLES[index+1]),{visual:'stairs',position:{...entryFor.south},...(!isMarket?{requiresFlag:puzzleSpecs[index].flag,lockedText:'The zone shutter is locked. Release it from the local control room.'}:{})}));
 }
 const supply=roomIndex===2?[{x:985,y:720,id:baseId+'-supply',kind:'snack',amount:1}]:roomIndex===3?[{x:410,y:745,id:baseId+'-funds',kind:'credits',amount:isMarket?55:85}]:[];
 const rest=!isMarket&&((index===2&&roomIndex===2)||(index===4&&roomIndex===4))?{x:1110,y:735}:null;
 const boss=lastFloor&&roomIndex===5?{x:850,y:565}:null;
 const puzzle=!isMarket&&roomIndex===4?{...puzzleSpecs[index],room:4,x:785,y:510}:null;
 const logs=roomIndex===2?[{index:5,x:440,y:720}]:roomIndex===4?[{index:isMarket?7:1,x:440,y:735}]:[];
 const spawns=[1,3,4,5].includes(roomIndex)&&!boss&&!rest?[{id:id+'-patrol',x:1060,y:745,w:170,h:120,armed:true,enemy:null,chance:.72}]:[];
 // Whole Robotics previously had eleven slots. Eight additional independent rolls
 // give nineteen (round(11 * 1.75)); the facility and safe supply rooms stay unchanged.
 if(isMarket&&([1,3].includes(roomIndex)||(roomIndex===4&&index<2)))spawns.push({id:id+'-second-patrol',x:550,y:785,w:100,h:100,armed:true,enemy:null,chance:.72});
 const elevator=!isMarket&&lastFloor&&roomIndex===5?{id:'argus-return-elevator',x:1225,y:790,target:FACILITY_ZONES[0],position:{...entryFor.south},name:'Return elevator · receiving',requiresFlag:'CH2_ARGUS_DEFEATED',lockedText:'The lift is held by the integration lockdown. It will activate when A.R.G.U.S. is defeated.',visual:'elevator'}:null;
 const room={id:roomIndex,...INDOOR_FLOOR,title:names[roomIndex]};
 const map={id,baseId,index,isMarket,roomIndex,roomKind:roomIndex===0?'foyer':roomIndex===2?'supplies':boss?'boss':'workroom',...INDOOR_SIZE,title,rooms:[room],corridors:[],floor:[INDOOR_FLOOR],props,arrival:{...entryFor.west},doors,up:null,down:null,point:()=>({x:775,y:720}),puzzle,supply,spawns,boss,rest,logs,elevator};
 if(roomIndex===0)map.arrival={...entryFor.south};
 const design=interiorDesignFor(id,map);map.props=design.props;map.furnishingObstacles=furnishingObstacles(design);
 mapCache.set(id,map);return map;
}
export function within(p,r,pad=0){return p.x>=r.x-pad&&p.x<=r.x+r.w+pad&&p.y>=r.y-pad&&p.y<=r.y+r.h+pad;}
const interiorCollisionCache=new Map();
function interiorObstacles(location){if(!interiorCollisionCache.has(location))interiorCollisionCache.set(location,furnishingObstacles(interiorDesignFor(location)));return interiorCollisionCache.get(location);}
export function worldWalkable(location,x,y,blockers=[]){
 if(!Number.isFinite(x)||!Number.isFinite(y))return false;
 const p={x,y},map=mapFor(location)||hotelMapFor(location);
 if(map){if(!map.floor.some(r=>within(p,r,-20)))return false;if(map.furnishingObstacles.some(r=>within(p,r,15)))return false;}
 else if(location==='fairmont'){
  if(x<45||y<80||x>CITY.width-45||y>CITY.height-50)return false;
  if(BUILDINGS.some(b=>within(p,buildingFootprint(b),14)))return false;
  if(PARK_OBSTACLES.some(r=>within(p,r,12)))return false;
 }else{if(x<155||x>1390||y<395||y>955)return false;if(interiorObstacles(location).some(r=>within(p,r,15)))return false;}
 return !blockers.some(b=>Math.hypot(x-b.x,y-b.y)<42);
}
export function nearestWalkable(location,p,blockers=[],canStand=null){
 const pass=canStand||((x,y)=>worldWalkable(location,x,y,blockers));
 const center=(mapFor(location)||hotelMapFor(location))?.arrival||(location==='fairmont'?ARRIVAL:{x:770,y:845});
 // Prefer a nearby correction to a stale saved position before moving to a room's
 // fallback entrance. Both searches include furniture and present NPC bodies.
 for(const start of [p,center]){
  if(!Number.isFinite(start?.x)||!Number.isFinite(start?.y))continue;
  if(pass(start.x,start.y))return {...start};
  for(let r=24;r<=312;r+=24)for(let a=0;a<16;a++){
   const q={x:start.x+Math.cos(a*Math.PI/8)*r,y:start.y+Math.sin(a*Math.PI/8)*r};
   if(pass(q.x,q.y))return q;
  }
 }
 // This can only occur for an entirely blocked/invalid map; never return NaN.
 return {...center};
}
export function citySpawns(){return [{x:3470,y:1100},{x:4200,y:2000},{x:750,y:1500},{x:3290,y:3040},{x:2200,y:3400},{x:3300,y:4100}].map((p,i)=>({...p,id:'fairmont-security-'+i,w:280,h:150,armed:true,enemy:null}));}
export function spawnEvents(slots,player,view,allowed,rng=Math.random){const out=[];for(const s of slots){const distance=Math.hypot(s.x-player.x,s.y-player.y),visible=within(s.enemy||s,{x:view.x-170,y:view.y-170,w:view.w+340,h:view.h+340});if(!allowed){if(s.enemy)out.push({type:'remove',id:s.id});s.enemy=null;continue;}if(distance>1450&&!visible){if(s.enemy)out.push({type:'remove',id:s.id});s.enemy=null;s.armed=true;}if(!s.enemy&&s.armed&&distance<1100&&distance>300){s.armed=false;if(rng()<(s.chance??.82)){s.enemy={x:s.x,y:s.y};out.push({type:'spawn',id:s.id,x:s.x,y:s.y});}}}return out;}
export function markDefeated(slots,id){const s=slots?.find(x=>x.id===id);if(s){s.enemy=null;s.armed=false;}}
/** An unloaded room is entirely off screen. Re-entry gets one fresh spawn roll. */
export function retireRoomSpawns(slots){for(const slot of slots||[]){slot.enemy=null;slot.armed=true;}return slots;}

const CHASE_GRID_STEP=80;
const chaseGrids=new Map();
function clearChaseSegment(location,from,to){
 const distance=Math.hypot(to.x-from.x,to.y-from.y),steps=Math.max(1,Math.ceil(distance/10));
 for(let i=0;i<=steps;i++)if(!worldWalkable(location,from.x+(to.x-from.x)*i/steps,from.y+(to.y-from.y)*i/steps))return false;
 return true;
}
function chaseGrid(location){
 if(chaseGrids.has(location))return chaseGrids.get(location);
 const map=mapFor(location)||hotelMapFor(location),size=map||(location==='fairmont'?CITY:{width:1536,height:1024});
 const cols=Math.ceil(size.width/CHASE_GRID_STEP)+1,rows=Math.ceil(size.height/CHASE_GRID_STEP)+1,nodes=new Map();
 for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
  const x=col*CHASE_GRID_STEP,y=row*CHASE_GRID_STEP;
  if(worldWalkable(location,x,y))nodes.set(row*cols+col,{x,y,col,row,edges:[]});
 }
 for(const [id,node]of nodes)for(const [dc,dr]of [[1,0],[0,1]]){
  const otherId=(node.row+dr)*cols+node.col+dc,other=nodes.get(otherId);
  if(other&&other.col===node.col+dc&&clearChaseSegment(location,node,other)){node.edges.push(otherId);other.edges.push(id);}
 }
 const grid={nodes,cols,rows};chaseGrids.set(location,grid);return grid;
}
function chaseConnectors(location,point,grid){
 const col=Math.round(point.x/CHASE_GRID_STEP),row=Math.round(point.y/CHASE_GRID_STEP),out=[];
 for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
  const c=col+dx,r=row+dy;if(c<0||r<0||c>=grid.cols||r>=grid.rows)continue;
  const id=r*grid.cols+c,node=grid.nodes.get(id);
  if(node&&clearChaseSegment(location,point,node))out.push({id,cost:Math.hypot(node.x-point.x,node.y-point.y)});
 }
 return out;
}
/** Next collision-free pursuit waypoint; static grids are shared by all patrols. */
export function chaseWaypoint(location,enemy,player){
 const from={x:enemy.x,y:enemy.y},to={x:player.x,y:player.y};
 if(![from.x,from.y,to.x,to.y].every(Number.isFinite))return from;
 if(clearChaseSegment(location,from,to))return to;
 const grid=chaseGrid(location),starts=chaseConnectors(location,from,grid),goals=chaseConnectors(location,to,grid);
 if(!starts.length||!goals.length)return from;
 const goalIds=new Set(goals.map(n=>n.id)),open=new Set(),closed=new Set(),cost=new Map(),previous=new Map();
 for(const start of starts){open.add(start.id);cost.set(start.id,start.cost);}
 let end;
 while(open.size){
  let current,best=Infinity;
  for(const id of open){const node=grid.nodes.get(id),score=cost.get(id)+Math.hypot(node.x-to.x,node.y-to.y);if(score<best){current=id;best=score;}}
  if(goalIds.has(current)){end=current;break;}
  open.delete(current);closed.add(current);
  for(const next of grid.nodes.get(current).edges){
   if(closed.has(next))continue;
   const nextCost=cost.get(current)+CHASE_GRID_STEP;
   if(nextCost<(cost.get(next)??Infinity)){cost.set(next,nextCost);previous.set(next,current);open.add(next);}
  }
 }
 if(end===undefined)return from;
 const path=[];for(let id=end;id!==undefined;id=previous.get(id))path.push(grid.nodes.get(id));path.reverse();
 for(let i=path.length-1;i>=0;i--)if(clearChaseSegment(location,from,path[i]))return {x:path[i].x,y:path[i].y};
 return from;
}
