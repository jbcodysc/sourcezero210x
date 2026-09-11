export const CITY={width:4800,height:4500};
export const ROADS={horizontal:[1100,2100,3400,4200],vertical:[750,3300,4350]};
export const ARRIVAL={x:760,y:4060};
export const PARK={x:1120,y:2300,w:1900,h:820};
export const PARK_OBSTACLES=[...[[1230,2400],[2020,2380],[2130,3100],[1230,3170]].map(([x,y])=>({x:x-26,y:y-27,w:52,h:32})),...[[1380,2470],[1840,3020],[2060,2690]].map(([x,y])=>({x:x-85,y:y-65,w:170,h:65}))];
const building=(id,name,type,x,y,w=510,h=520,enter=true)=>({id,name,type,x,y,w,h,enter,door:{x:x+w/2,y:y+h+50}});
export const BUILDINGS=[
 building('terminal','FAIRMONT TRANSIT','terminal',100,3550,470,470),
 building('hotel','THE SWITCHYARD HOTEL','hotel',1050,3590),
 building('diner','NIGHT SHIFT DINER','cafe',1780,3640,460,460),
 building('apartment','MERCER APARTMENTS','apartment',2480,3540,560,560),
 building('clinic','JUNCTION FIRST AID','hotel',3570,3550,500,550),
 building('radio','RADIO HUT','radio',1090,1300,530,620),
 building('cafe','COMMON GROUNDS','cafe',1800,1460,480,460),
 building('gear','BOLT & BRACKET','warehouse',2460,1390,580,530),
 building('market','WHOLE ROBOTICS MARKET','market',1150,240,1060,660),
 building('books','PAPER TRAIL BOOKS','apartment',2510,420,530,500),
 building('facility','CENEXIS AUTONOMOUS SYSTEMS','facility',3540,270,650,650),
 building('freight','JUNCTION FREIGHT','warehouse',3540,1360,630,540,false),
 building('supplier','VECTOR ROBOTICS','warehouse',3530,2430,640,560,false),
 building('civic','CIVIC SERVICES','apartment',100,2470,460,590,false),
 building('homes','RAILWAY TERRACE','apartment',100,1380,460,580,false),
 building('utility','GRID CONTROL','warehouse',140,290,450,600,false),
 building('dispatch','AUTONOMOUS DISPATCH','warehouse',4480,2350,270,650,false),
 building('lofts','EASTLINE LOFTS','apartment',4480,3550,270,530,false)
];
export const INTERIORS=['terminal','hotel','diner','apartment','clinic','radio','cafe','gear','books'];
export const MARKET_FLOORS=['fairmont-market-1','fairmont-market-2','fairmont-market-3'];
export const FACILITY_ZONES=['fairmont-facility-1','fairmont-facility-2','fairmont-facility-3','fairmont-facility-4','fairmont-facility-5'];
export const LOCATIONS=['fairmont',...INTERIORS.map(x=>'fairmont-'+x),...MARKET_FLOORS,...FACILITY_ZONES];
export const FACILITY_TITLES=['Receiving & Service Entry','Assembly & Repair','Flight Validation Hangar','Sensor & Software Validation','Network Integration Core'];
export const MARKET_TITLES=['Home & Consumer Robotics','Components & Industrial Repair','Premium Systems & Building Control'];
export function mapFor(id){
 const retail=MARKET_FLOORS.indexOf(id),facility=FACILITY_ZONES.indexOf(id);if(retail<0&&facility<0)return null;
 const index=retail>=0?retail:facility,isMarket=retail>=0,width=2720,height=1910;
 const rooms=[];for(let r=0;r<3;r++)for(let c=0;c<4;c++)rooms.push({id:r*4+c,x:90+c*650,y:100+r*590,w:530,h:420});
 const corridors=[];for(let r=0;r<3;r++)corridors.push({x:70,y:250+r*590,w:2580,h:150});
 for(let c=0;c<4;c++)corridors.push({x:270+c*650,y:80,w:165,h:1740});
 const floor=[...rooms,...corridors],arrival={x:350,y:460},up={x:350,y:460},down={x:2300,y:1620};
 const props=[];
 for(const room of rooms){
  const type=isMarket?(index===0?'shelf':index===1?'crates':'desk'):['crates','assemblyArm','droneDock','console','server'][index];
  props.push({type,x:room.x+120,y:room.y+132,w:130,h:65});
  if(room.id%3!==0)props.push({type:isMarket?'shelf':room.id%2?'desk':'server',x:room.x+415,y:room.y+145,w:110,h:70});
 }
 const puzzles= isMarket?null:[
  {id:'receiving-power',name:'Reroute loading-bay power',room:6,flag:'CH2_RECEIVING_POWER',text:'Auxiliary power routed to the service shutter. The freight route is open.',type:'console'},
  {id:'assembly-belt',name:'Reverse the service conveyor',room:3,flag:'CH2_CONVEYOR_REVERSED',text:'The belt reverses. A service lane opens behind the repair cages.',type:'console'},
  {id:'flight-test',name:'Redirect the validation flight',room:8,flag:'CH2_TEST_REDIRECTED',text:'Test drones return to their charging docks. The hangar safety interlock releases.',type:'console'},
  {id:'sensor-route',name:'Route the calibration sequence',room:6,flag:'CH2_SENSOR_ROUTED',text:'The test sequence moves to the empty calibration booth. Network access is released.',type:'console'},
  {id:'core-shutters',name:'Open integration shutters',room:3,flag:'CH2_CORE_SHUTTERS',text:'Integration hangar unlocked. A.R.G.U.S. transfers control to a dedicated security chassis.',type:'console'}
 ][index];
 const point=id=>({x:rooms[id].x+270,y:rooms[id].y+285});
 const supply=[{...point(4),id:id+'-supply',kind:'snack',amount:1},{...point(10),id:id+'-funds',kind:'credits',amount:isMarket?55:85}];
 const spawns=rooms.filter(r=>![0,11].includes(r.id)).map(r=>({id:id+'-patrol-'+r.id,x:r.x+240,y:r.y+300,w:220,h:150,armed:true,enemy:null}));
 return {id,index,isMarket,width,height,title:(isMarket?MARKET_TITLES:FACILITY_TITLES)[index],rooms,corridors,floor,props,arrival,up,down,point,puzzle:puzzles?{...puzzles,...point(puzzles.room)}:null,supply,spawns,boss:point(11),rest:!isMarket&&(index===2||index===4)?point(9):null};
}
export function within(p,r,pad=0){return p.x>=r.x-pad&&p.x<=r.x+r.w+pad&&p.y>=r.y-pad&&p.y<=r.y+r.h+pad;}
export function worldWalkable(location,x,y,blockers=[]){
 const p={x,y},map=mapFor(location);
 if(map){if(!map.floor.some(r=>within(p,r,-20)))return false;if(map.props.some(r=>within(p,{x:r.x-r.w/2,y:r.y-r.h,w:r.w,h:r.h},15)))return false;}
 else if(location==='fairmont'){
  if(x<45||y<80||x>CITY.width-45||y>CITY.height-50)return false;
  if(BUILDINGS.some(b=>within(p,b,18)))return false;
  if(within(p,{x:2260,y:2260,w:690,h:660},10))return false;
  if(PARK_OBSTACLES.some(r=>within(p,r,12)))return false;
 }else{if(x<155||x>1390||y<395||y>955)return false;}
 return !blockers.some(b=>Math.hypot(x-b.x,y-b.y)<42);
}
export function nearestWalkable(location,p){if(worldWalkable(location,p.x,p.y))return p;const center=mapFor(location)?.arrival|| (location==='fairmont'?ARRIVAL:{x:770,y:845});for(let r=0;r<300;r+=30)for(let a=0;a<8;a++){const q={x:center.x+Math.cos(a*Math.PI/4)*r,y:center.y+Math.sin(a*Math.PI/4)*r};if(worldWalkable(location,q.x,q.y))return q;}return center;}
export function citySpawns(){return [{x:3470,y:1100},{x:4200,y:2000},{x:750,y:1500},{x:3290,y:3040},{x:2200,y:3400},{x:3300,y:4100}].map((p,i)=>({...p,id:'fairmont-security-'+i,w:280,h:150,armed:true,enemy:null}));}
export function spawnEvents(slots,player,view,allowed,rng=Math.random){const out=[];for(const s of slots){const distance=Math.hypot(s.x-player.x,s.y-player.y),visible=within(s.enemy||s,{x:view.x-170,y:view.y-170,w:view.w+340,h:view.h+340});if(!allowed){if(s.enemy)out.push({type:'remove',id:s.id});s.enemy=null;continue;}if(distance>1450&&!visible){if(s.enemy)out.push({type:'remove',id:s.id});s.enemy=null;s.armed=true;}if(!s.enemy&&s.armed&&distance<1100&&distance>300){s.armed=false;if(rng()<.82){s.enemy={x:s.x,y:s.y};out.push({type:'spawn',id:s.id,x:s.x,y:s.y});}}}return out;}
export function markDefeated(slots,id){const s=slots?.find(x=>x.id===id);if(s){s.enemy=null;s.armed=false;}}

const CHASE_GRID_STEP=80;
const chaseGrids=new Map();
function clearChaseSegment(location,from,to){
 const distance=Math.hypot(to.x-from.x,to.y-from.y),steps=Math.max(1,Math.ceil(distance/10));
 for(let i=0;i<=steps;i++)if(!worldWalkable(location,from.x+(to.x-from.x)*i/steps,from.y+(to.y-from.y)*i/steps))return false;
 return true;
}
function chaseGrid(location){
 if(chaseGrids.has(location))return chaseGrids.get(location);
 const map=mapFor(location),size=map||(location==='fairmont'?CITY:{width:1536,height:1024});
 const cols=Math.ceil(size.width/CHASE_GRID_STEP)+1,rows=Math.ceil(size.height/CHASE_GRID_STEP)+1,nodes=new Map();
 for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
  const x=col*CHASE_GRID_STEP,y=row*CHASE_GRID_STEP;
  if(worldWalkable(location,x,y))nodes.set(row*cols+col,{x,y,col,row,edges:[]});
 }
 // Edges are checked once against the actual map collision, including props.
 // Four-neighbor routing cannot jump diagonally through a room's closed corner.
 for(const [id,node]of nodes)for(const [dc,dr]of [[1,0],[0,1]]){
  const otherId=(node.row+dr)*cols+node.col+dc,other=nodes.get(otherId);
  if(other&&other.col===node.col+dc&&clearChaseSegment(location,node,other)){
   node.edges.push(otherId);other.edges.push(id);
  }
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
 // Skip intermediate grid turns only when the entire shortcut is walkable.
 for(let i=path.length-1;i>=0;i--)if(clearChaseSegment(location,from,path[i]))return {x:path[i].x,y:path[i].y};
 return from;
}
