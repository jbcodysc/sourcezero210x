import {drawFairmontProp} from './art.mjs';

// Coordinates are at the object's bottom centre. The shallow ground footprints
// keep the same cross aisles, doors, story terminals, NPCs and encounter lanes.
const asset=(type,x,y,scale=1,w=120,h=45)=>({type,x,y,scale,w,h});
const rug=(x,y,width=380)=>({type:'woven-rug',x,y,scale:width/380,w:0,h:0,solid:false});
const floor=(type,x,y,w,h)=>({type,x,y,w,h,solid:false});
const person=(id,name,x,y,row,text)=>({id,name,x,y,row,text,fixed:true});
const blank=()=>({props:[],details:[],actors:[],service:null});

function ordinaryRoom(id){
 const d=blank(),p=d.props;
 p.push(asset('plant',230,470,.8,45,30),asset('plant',1330,470,.8,45,30));
 if(id==='cafe'||id==='diner'){
  // The existing illustrated workstation supplies the staffed service counter.
  // Complete cafe settings include the cups, pastries, newspaper and chairs.
  p.push(asset('desk',1110,510,1.4,245,65),asset('shelf',1270,385,.72,140,40),asset('shelf',420,385,.9,170,45));
  for(const [x,y]of [[340,550],[390,825],[1050,840]])p.push(asset('public-cafe-setting',x,y,.85,205,65));
  d.details.push(rug(1060,690,350));
  d.service={x:870,y:555};
  d.actors.push(person(id+'-brewer','Emil · Coffee Brewer',1280,585,0,'The grinder is the only machine in this city I want to hear before breakfast.'),person(id+'-guest-one','June',480,510,1,'I came here to read. So far I have read the pastry menu three times.'),person(id+'-guest-two','Martin',1195,795,0,'Actual coffee. In an actual cup. I am trying to remember what the delivery fee was for.'));
  if(id==='diner')d.actors[0].name='Walt · Line Cook';
 }else if(id==='apartment'){
  p.push(asset('bed',390,565,1.3,170,80),asset('sofa',1090,815,1.1,220,65),asset('desk',1110,500,1.1,190,55),asset('shelf',405,850,.95,185,50),asset('public-cafe-setting',430,695,.6,145,45));
  d.details.push(rug(1060,760,390),rug(395,540,310));
 }else if(id==='clinic'){
  p.push(asset('clinic-bed',355,555,.95,175,80),asset('clinic-bed',570,555,.95,175,80),
   asset('clinic-cabinet',1130,440,.95,135,55),asset('clinic-cart',1260,585,.85,72,42),
   asset('clinic-screen',390,875,.85,185,45),asset('public-waiting-chairs',1080,850,.9,190,45),
   asset('clinic-cart',1120,540,.85,72,42));
 }else if(['radio','gear','books'].includes(id)){
  for(const [x,y]of [[355,460],[555,460],[390,850]])p.push(asset('shelf',x,y,.85,165,48));
  p.push(asset('desk',1110,535,1.35,235,60),asset('shelf',1120,855,.95,185,50));
  if(id==='books')p.push(asset('public-cafe-setting',410,670,.65,155,45));
  else p.push(asset('console',1120,385,.8,75,35),asset('crates',1290,840,.6,75,35));
  d.details.push(rug(480,690,350));
 }else if(id==='terminal'){
  p.push(asset('public-waiting-chairs',400,520,.95,200,45),asset('public-waiting-chairs',400,815,.95,200,45),
   asset('desk',1120,525,1.2,205,55),asset('console',1060,850,1,90,45),
   asset('console',1200,850,1,90,45),asset('public-hotel-cart',550,850,.7,80,40));
 }else{
  p.push(asset('desk',1080,510,1.2,205,55),asset('sofa',405,560,1.15,230,65),asset('shelf',420,850,.95,180,45),
   asset('public-cafe-setting',1090,835,.7,165,50));
  d.details.push(rug(440,700,380));
 }
 return d;
}

function hotelRoom(id){
 const d=blank(),p=d.props;
 if(id==='fairmont-hotel'){
  p.push(asset('public-hotel-reception',1100,520,.86,310,70),asset('public-hotel-cart',1080,860,.85,90,45),
   asset('sofa',420,535,1.1,220,65),asset('sofa',425,860,1,200,60),
   asset('public-cafe-setting',425,715,.58,140,42),asset('plant',235,460,.85,48,30),asset('plant',1330,445,.85,48,30));
  d.details.push(rug(710,810,390));
  d.service={x:870,y:570};
  d.actors.push(person('hotel-guest','The Early Check-in',490,610,0,'I asked for a room away from the freight line. She asked which freight line.'),person('hotel-porter','Nico · Porter',1170,775,0,'The lift is for luggage. People take the stairs. The luggage has a union.'));
 }else if(id==='fairmont-hotel-upstairs'){
  d.details.push(rug(440,720,330),rug(795,720,330),rug(1150,720,330));
  p.push(asset('public-hotel-cart',405,860,.8,85,42),asset('public-waiting-chairs',1100,850,.85,180,40),
   asset('plant',1350,510,.8,45,30),asset('plant',230,810,.8,45,30));
 }else{
  p.push(asset('bed',415,580,1.4,185,85),asset('desk',1100,515,1.15,195,55),
   asset('sofa',1110,845,1,200,60),asset('plant',225,445,.8,45,30),
   asset('shelf',1130,390,.8,150,45),asset('public-cafe-setting',1100,707,.6,145,45));
  d.details.push(rug(460,695,380),rug(1095,790,330));
 }
 return d;
}

function workRoom(map){
 const d=blank(),p=d.props,title=(map.rooms?.[0]?.title||map.title.split(' · ').at(-1)).toLowerCase(),i=map.roomIndex,market=map.isMarket;
 const storage=()=>{
  for(const [x,y]of [[345,480],[565,480],[1080,480],[1290,480]])p.push(asset(market?'robotics-retail-shelves':'shelf',x,y,market?.67:.8,150,45));
  p.push(asset('crates',355,865,.85,105,42),asset('crates',550,880,.75,95,40),
   asset('crates',1120,875,.85,105,42),asset('crates',1300,875,.75,95,40));
 };
 if(i===0){
  if(market){
   p.push(asset('robotics-retail-display',375,515,.95,190,55),asset('robotics-retail-shelves',1120,495,.9,205,55),
    asset('public-waiting-chairs',380,855,.85,180,40),asset('desk',1120,875,1.15,195,55),
    asset('plant',580,485,.7,40,28),asset('plant',1300,850,.7,40,28));
  }else{
   p.push(asset('server',330,495,1,95,55),asset('console',535,495,.95,85,40),
    asset('conveyor',1110,500,1.1,255,60),asset('crates',1290,865,.85,105,42),
    asset('shelf',365,870,.95,180,45),asset('server',1110,875,1,95,55));
  }
 }else if(map.boss){
  p.push(asset('server',330,495,1.15,105,60),asset('server',1190,465,1.15,105,60),
   asset('console',470,470,1.1,100,45),asset('console',380,865,1.1,100,45),
   asset('server',1100,885,1,95,55),asset('server',1300,885,1,95,55));
  p.push(market?asset('desk',1140,545,1.1,185,50):asset('robotics-test-rig',1100,375,.8,190,45));
 }else if(/office|control|routing/.test(title)){
  p.push(asset('desk',370,510,1.25,215,60),asset('desk',1120,500,1.25,215,60),
   asset('shelf',1280,430,.65,125,38),asset('server',540,450,.85,80,40),
   asset('shelf',350,870,.8,150,45),asset('desk',1100,875,1.15,195,55),
   asset('server',1300,850,.85,80,45));
  if(map.rest)p.push(asset('clinic-cart',1280,555,.75,65,35));
 }else if(map.rest){
  // An employee first-aid bay is the facility's one staffed recovery area.
  p.push(asset('clinic-bed',365,525,.95,175,75),asset('clinic-cabinet',550,470,.85,115,48),
   asset('clinic-screen',1110,505,.85,185,40),asset('clinic-cart',1290,495,.75,65,35),
   asset('public-waiting-chairs',370,870,.85,180,40),asset('shelf',550,875,.65,125,40),
   asset('server',1280,875,.85,80,45));
 }else if(i===2||/stockroom|storage|reserve|components|supplies/.test(title)){
  storage();
 }else if(market&&/demonstration|premium|consumer/.test(title)){
  p.push(asset('robotics-retail-display',375,515,1,195,55),asset('robotics-retail-display',1135,515,1,195,55),
   asset('robotics-retail-shelves',365,875,.9,205,50),asset('robotics-retail-shelves',1140,875,.9,205,50),
   asset('shelf',570,480,.55,105,35),asset('shelf',1320,485,.55,105,35));
  d.details.push(rug(770,690,285));
 }else if(/test|validation|flight|calibration|isolation|sensor/.test(title)){
  p.push(asset('robotics-test-rig',385,515,1,240,65),asset('robotics-test-rig',1140,510,1,240,65),
   asset('server',1100,875,1,95,55),asset('server',1300,875,1,95,55),
   asset('console',380,865,1.1,100,45),asset('droneDock',570,485,.6,85,35));
 }else if(/weld|assembly|repair|returned/.test(title)){
  if(market){
   p.push(asset('desk',390,515,1.2,205,55),asset('robotics-test-rig',1130,510,.95,225,60),
    asset('robotics-retail-shelves',355,875,.85,190,50),asset('crates',555,880,.75,95,40),
    asset('droneDock',575,475,.6,85,35),asset('shelf',1120,875,.9,170,45));
  }else{
   p.push(asset('robotics-assembly-cell',405,520,.85,245,65),asset('robotics-assembly-cell',1120,515,.85,245,65),
    asset('conveyor',1090,875,1.1,255,60),asset('crates',350,875,.85,105,42),
    asset('crates',550,880,.75,95,40),asset('server',1310,880,.8,75,45));
  }
  d.details.push(floor('safety-line',1130,575,300,12));
 }else if(/freight|receiving|intake|loading/.test(title)){
  p.push(asset('conveyor',395,515,1.15,270,60),asset('conveyor',1110,515,1.15,270,60),
   asset('crates',355,865,.9,110,45),asset('crates',550,880,.9,110,45),
   asset('shelf',1100,885,.85,165,45),asset('crates',1300,880,.85,105,42));
  d.details.push(floor('safety-line',415,575,300,12));
 }else{
  // Access and stair bays contain real spare units and service equipment.
  p.push(asset(market?'robotics-retail-shelves':'shelf',375,495,market?.85:1,190,50),
   asset(market?'robotics-retail-display':'robotics-test-rig',1120,505,.85,190,55),
   asset('console',565,475,.85,75,35),asset('crates',365,870,.85,105,42),
   asset('shelf',1115,875,.85,165,45),asset('server',1300,880,.85,80,45));
 }
 d.details.push(floor('floor-drain',600,875,65,24),floor('floor-drain',1295,580,50,22));
 return d;
}

export function interiorDesignFor(location,map=null){
 if(map?.baseId)return workRoom(map);
 if(location==='fairmont-hotel'||location.startsWith('fairmont-hotel-'))return hotelRoom(location);
 return ordinaryRoom(location.replace(/^fairmont-/,''));
}

export function furnishingObstacles(design){
 return [...design.props,...design.details.filter(p=>p.solid)].filter(p=>p.w>0&&p.h>0).map(p=>({x:p.x-p.w/2,y:p.y-p.h,w:p.w,h:p.h}));
}

// Furniture and textiles are illustrated sprites. Only flush floor hardware and
// painted hazard markings use geometry; there is no generic box-drawing fallback.
export function drawInteriorDetails(scene,design){
 return design.details.map(d=>{
  if(d.type==='woven-rug')return drawFairmontProp(scene,d.type,d.x,d.y,d.scale).setDepth(-27);
  if(!['floor-drain','safety-line'].includes(d.type))throw new Error('Unknown interior detail: '+d.type);
  const g=scene.add.graphics().setPosition(d.x,d.y).setDepth(-27);
  if(d.type==='floor-drain'){
   g.fillStyle(0x253944).fillRect(-d.w/2,-d.h,d.w,d.h);
   for(let x=-d.w/2+5;x<d.w/2;x+=9)g.fillStyle(0x859394).fillRect(x,-d.h+3,3,d.h-6);
  }else{
   for(let x=-d.w/2,index=0;x<d.w/2;x+=20,index++)g.fillStyle(index%2?0xc5a75c:0x405158).fillRect(x,-d.h,Math.min(16,d.w/2-x),d.h);
  }
  return g;
 });
}
