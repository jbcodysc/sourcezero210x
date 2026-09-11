import {CITY_FRAMES,FACADE_WIDTH} from './city-art-data.mjs';
export const CITY={width:4608,height:4992};
export const VIEW={width:1536,height:1024};
export const STREETS={horizontal:[800,1600,2400,3200],vertical:[1536,3072],width:164};
export const PARK={x:2304,y:2100,w:1120,h:620,fountain:{x:2304,y:2110,radius:86}};
const building=(id,name,art,x,y,room)=>({id,name,art,x,y,room,door:{x,y:y+45},body:{x:x-225,y:y-190,w:450,h:190}});
export const BUILDINGS=[
 building('lab','Bellwether Pharmaceutical',0,768,630,'lab'),
 building('hall','Town Hall',3,2304,630,'office'),
 building('plant','Plant 4 · Service Annex',4,3840,630,'workshop'),
 building('store','Harrow General Store',1,768,1430,'store'),
 building('hotel','Juniper Hotel',2,2304,1430,'hotel'),
 building('library','Bellwether Public Library',5,3840,1430,'library'),
 building('clinic','Mercy Street Clinic',6,768,2230,'clinic'),
 building('beck','Beck’s Repair',7,3840,2230,'workshop'),
 building('diner','Harvest Diner',8,768,3030,'diner'),
 building('post','Post Office',9,2304,3030,'office'),
 building('ruth','Delaney House',10,3840,3030,'homeA'),
 building('reed','Reed House',11,465,3870,'homeB'),
 building('miller','Miller House',12,1080,3870,'homeA'),
 building('alvarez','Alvarez House',13,2304,3870,'homeB'),
 building('water','Municipal Waterworks',14,3840,3870,'workshop'),
 building('player-home','Your House',11,1900,4560,'homeB')
];
export function facadeBounds(b){const f=CITY_FRAMES['building-'+b.art],h=f[3]*FACADE_WIDTH/f[2];return {x:b.x-FACADE_WIDTH/2,y:b.y-h,w:FACADE_WIDTH,h};}
export function overlaps(a,b,pad=0){return a.x<b.x+b.w+pad&&a.x+a.w>b.x-pad&&a.y<b.y+b.h+pad&&a.y+a.h>b.y-pad;}
const pathSegment=(a,b,width=115)=>({x:Math.min(a.x,b.x)-width/2,y:Math.min(a.y,b.y)-width/2,w:Math.abs(a.x-b.x)+width,h:Math.abs(a.y-b.y)+width});
// Every path leaves the front door. Southern homes join a vertical street by
// their front yards, instead of running back through their own buildings.
export const BUILDING_PATHS=BUILDINGS.flatMap(b=>{
 const start={x:b.x,y:b.y+58},southRoad=STREETS.horizontal.find(y=>y>b.y);
 if(southRoad)return [{...pathSegment(start,{x:b.x,y:southRoad}),building:b.id}];
 const street=STREETS.vertical.reduce((a,x)=>Math.abs(x-b.x)<Math.abs(a-b.x)?x:a),corner={x:b.x,y:b.y+150};
 return [pathSegment(start,corner),pathSegment(corner,{x:street,y:corner.y})].map(p=>({...p,building:b.id}));
});
export const PARK_PATHS=[{x:PARK.x-75,y:PARK.y-245,w:150,h:490},{x:PARK.x-PARK.w/2,y:PARK.y-65,w:PARK.w,h:130}];
export const BENCHES=[{x:1900,y:1900},{x:2700,y:2270}];
const paved=[...BUILDING_PATHS,...PARK_PATHS,...STREETS.horizontal.map(y=>({x:0,y:y-122,w:CITY.width,h:244})),...STREETS.vertical.map(x=>({x:x-122,y:0,w:244,h:CITY.height}))];
const treeCandidates=[
 ...[570,1370,2170,2970,3800,4450,4840].flatMap(y=>[[185,y],[4423,y]]),
 ...[560,1360,2950].flatMap(y=>[[1200,y],[1880,y],[2740,y],[3410,y]]),
 [1230,2150],[3400,2150],[1870,3730],[2760,3780],[4290,3770],
 [1200,4450],[2340,4500],[3500,4400],[2050,1990,.85],[2750,1990,.85]
];
export function treeBounds(t){return {x:t.x-213*t.scale/2,y:t.y-231*t.scale,w:213*t.scale,h:231*t.scale};}
export const TREES=treeCandidates.map(([x,y,scale=1.4])=>({x,y,scale,radius:26*scale})).filter(t=>{
 if(t.x===4423&&t.y===4450)return false; // Leave the waterworks overflow channel clear.
 const canopy=treeBounds(t);return !paved.some(p=>overlaps(canopy,p,20))&&!BUILDINGS.some(b=>overlaps(canopy,facadeBounds(b),24))&&!BENCHES.some(b=>overlaps(canopy,{x:b.x-135,y:b.y-230,w:270,h:230},12));
}).reduce((placed,t)=>placed.some(p=>overlaps(treeBounds(p),treeBounds(t),12))?placed:[...placed,t],[]);
export const ROOMS={homeA:0,homeB:1,store:2,hotel:3,office:4,workshop:5,diner:6,clinic:7,library:8};
export const ROOM_BOUNDS={left:395,right:1150,top:430,bottom:980};
export const ROOM_EXIT={x:768,y:960};
export function roomWalkable(x,y,blockers=[]){const r=ROOM_BOUNDS;return Number.isFinite(x)&&Number.isFinite(y)&&x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom&&(y<=870||Math.abs(x-768)<=100)&&!blockers.some(b=>Math.hypot(x-b.x,y-b.y)<31);}
export function freeArrival(preferred,fallback,canStand){for(const start of [preferred,fallback]){if(!start)continue;if(canStand(start.x,start.y))return {...start};for(let radius=40;radius<=240;radius+=40)for(let i=0;i<16;i++){const p={x:start.x+Math.cos(i*Math.PI/8)*radius,y:start.y+Math.sin(i*Math.PI/8)*radius};if(canStand(p.x,p.y))return p;}}return {...fallback};}
export const SPAWN_AREAS=STREETS.horizontal.flatMap((y,i)=>[
 {id:'west-'+i,kind:i%2?'loader':'cleaner',x:240,y:y-58,w:820,h:116},
 {id:'east-'+i,kind:i%2?'cleaner':'loader',x:3570,y:y-58,w:790,h:116},
 {id:'center-'+i,kind:'volunteer',x:1880,y:y-55,w:840,h:110}
]).concat([{id:'human-north',kind:'contractor',x:1476,y:1020,w:120,h:270},{id:'human-south',kind:'volunteer',x:3012,y:2660,w:120,h:250}]);
export function contains(p,r,pad=0){return p.x>=r.x-pad&&p.x<=r.x+r.w+pad&&p.y>=r.y-pad&&p.y<=r.y+r.h+pad;}
export function cityWalkable(x,y,blockers=[]){
 if(!Number.isFinite(x)||!Number.isFinite(y))return false;
 if(x<95||y<190||x>CITY.width-95||y>CITY.height-130)return false;
 if(BUILDINGS.some(b=>contains({x,y},b.body,16)))return false;
 if(TREES.some(t=>Math.hypot(x-t.x,y-(t.y-8))<t.radius+16))return false;
 if(BENCHES.some(b=>contains({x,y},{x:b.x-130,y:b.y-55,w:260,h:55},12)))return false;
 if(((x-PARK.fountain.x)/161)**2+((y-PARK.fountain.y)/82)**2<1)return false;
 return !blockers.some(b=>Math.hypot(x-b.x,y-b.y)<(b.radius||31));
}
export function walk(p,dx,dy,canStand,zone){let x=p.x,y=p.y;const inZone=(x,y)=>!zone||contains({x,y},zone);if(inZone(x+dx,y)&&canStand(x+dx,y))x+=dx;if(inZone(x,y+dy)&&canStand(x,y+dy))y+=dy;return {x,y,moved:Math.hypot(x-p.x,y-p.y)>.01};}
export function pointInZone(zone,rng=Math.random){return {x:zone.x+rng()*zone.w,y:zone.y+rng()*zone.h};}
export function distanceToZone(p,z){return Math.hypot(Math.max(z.x-p.x,0,p.x-z.x-z.w),Math.max(z.y-p.y,0,p.y-z.y-z.h));}
export function newSpawns(){return SPAWN_AREAS.map(area=>({area,armed:true,enemy:null,rolled:false}));}
export function updateSpawns(slots,player,camera,rng=Math.random){
 const events=[];let active=slots.filter(s=>s.enemy).length;
 for(const slot of slots){
  const distance=distanceToZone(player,slot.area);
  if(distance>1550){if(slot.enemy){events.push({type:'remove',id:slot.area.id});slot.enemy=null;active--;}slot.armed=true;slot.rolled=false;continue;}
  if(distance>1050||slot.enemy||active>=6)continue;
  if(slot.armed){slot.armed=false;slot.rolled=rng()<.62;}
  if(!slot.rolled)continue;
  for(let tries=0;tries<24;tries++){
   const p=pointInZone(slot.area,rng);
   if(contains(p,camera,90)||Math.hypot(p.x-player.x,p.y-player.y)<430||!cityWalkable(p.x,p.y))continue;
   slot.enemy={...p,id:slot.area.id,kind:slot.area.kind};slot.rolled=false;active++;events.push({type:'spawn',...slot.enemy});break;
  }
 }
 return events;
}
export function defeatedSpawn(slots,id){const slot=slots.find(s=>s.area.id===id);if(slot){slot.enemy=null;slot.armed=false;slot.rolled=false;}}
export function fountainVolume(distance){return .48*Math.max(0,1-distance/820)**2;}
export const OUTDOOR_NPCS=[
 {id:'runner',name:'Ada · postal runner',x:1010,y:820,row:1,zone:{x:900,y:720,w:370,h:110}},
 {id:'omari',name:'Omari · bus driver',x:3150,y:4070,row:0,zone:{x:3120,y:3950,w:220,h:180}},
 {id:'gardener',name:'Jo · groundskeeper',x:2050,y:2150,row:1,zone:{x:1830,y:1950,w:300,h:340}},
 {id:'park-reader',name:'Mr. Finch',x:2550,y:2100,row:0,zone:{x:2490,y:1880,w:250,h:400}},
 {id:'park-robot',name:'Public Amenities 03',x:2230,y:1860,row:4,zone:{x:2150,y:1790,w:340,h:180}},
 {id:'mail-robot',name:'Postal assistant',x:2580,y:3170,row:4,zone:{x:2460,y:3090,w:350,h:120}},
 {id:'dogwalker',name:'Tess',x:1790,y:1620,row:1,zone:{x:1690,y:1490,w:350,h:210}},
 {id:'old-timer',name:'Walt',x:3350,y:2420,row:0,zone:{x:3250,y:2320,w:260,h:160}},
 {id:'shopper',name:'Lou',x:1010,y:1570,row:1,zone:{x:980,y:1490,w:330,h:120}},
 {id:'jogger',name:'Dennis',x:3010,y:1910,row:0,zone:{x:2980,y:1790,w:170,h:260}},
 {id:'neighbor',name:'Mrs. Reed',x:1140,y:3480,row:1,zone:{x:1090,y:3330,w:210,h:280}},
 {id:'delivery',name:'Grocery assistant',x:2490,y:3990,row:4,zone:{x:2440,y:3960,w:300,h:140}},
 {id:'clerk-walk',name:'Owen',x:2690,y:800,row:0,zone:{x:2500,y:700,w:340,h:120}},
 {id:'mechanic-walk',name:'Inez',x:3430,y:1690,row:1,zone:{x:3280,y:1660,w:180,h:190}}
];
