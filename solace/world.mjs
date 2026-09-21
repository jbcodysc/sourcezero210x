// Solace is a connected collection of real districts, rooms and vertical landings.
// Coordinates are world pixels; furnishings are anchored at their bottom centre.
// Floors, building bases and furniture footprints are also used by navigation QA.
import {doorCollision} from '../city/doors.mjs';
export const DISTRICTS=['solace-transit','solace-commercial','solace-residential','solace-north'];
export const SOLACE_MAPS={};
const rect=(x,y,w,h)=>({x,y,w,h});
const P=(type,x,y,width=180,extra={})=>({type,x,y,width,...extra});
const N=(id,name,x,y,sheet=8,extra={})=>({id,name,x,y,sheet,...extra});
const I=(id,name,x,y,action=id,extra={})=>({id,name,x,y,action,event:action,kind:/^(circuit|transfer|relay|bypass|west\d|east\d|lobby-service)/.test(action)?'panel':action==='supply'?'item':action==='rest'?'rest':action==='vending'?'vending':'story',...extra});
const S=(id,x,y,kind,chance=.76)=>({id,x,y,w:150,h:100,kind,chance});
const map=(id,title,extra={})=>SOLACE_MAPS[id]={id,title,width:1536,height:1024,exterior:false,arrival:{x:768,y:810},floorRects:[rect(96,340,1344,580)],props:[],npcs:[],doors:[],interactions:[],spawns:[],...extra};
const room=(id,title,kind,extra={})=>map(id,title,{kind,...extra});
function door(m,id,side,target,name,extra={}){
 const f=m.floorRects[0],points={north:{x:f.x+f.w/2,y:f.y+8},south:{x:f.x+f.w/2,y:f.y+f.h-8},west:{x:f.x+8,y:f.y+f.h/2},east:{x:f.x+f.w-8,y:f.y+f.h/2}};
 const d={id:m.id+'-'+id,side,...points[side],target,name,visual:'door',position:{x:768,y:790},...extra};m.doors.push(d);return d;
}
function connection(a,side,b,name,extra={}){return door(SOLACE_MAPS[a],b,side,b,name,extra);}
function city(id,title){return map(id,title,{width:2400,height:1680,exterior:true,kind:'city',arrival:{x:1140,y:1410},floorRects:[rect(32,32,2336,1616)],roads:{horizontal:[685,1240],vertical:[1140]},buildings:[]});}
function building(m,id,name,type,x,y,w,h,target,extra={}){
 const b={id,name,type,x,y,w,h,target,...extra};m.buildings.push(b);
 if(target)m.doors.push({id:'enter-'+id,x:x+w/2,y:y+h+16,side:'north',target,name:'Enter '+name,position:{x:768,y:810},visual:'building-door',...(extra.gate?{gate:extra.gate}:{})});
 return b;
}
function exitTo(m,side,target,name,x,y,position){m.doors.push({id:m.id+'-'+side,x,y,side,target,name,position,visual:'district'});}
function returnTo(m,district,id){const b=SOLACE_MAPS[district].buildings.find(b=>b.id===id);door(m,'street','south',district,'Return to the street',{position:{x:b.x+b.w/2,y:b.y+b.h+72}});}
function furnish(m,kind){
 const p=m.props;
 if(['apartment','luxury','job'].includes(kind)){
  p.push(P('bed',340,585,170),P('solace-kitchen',1125,480,350),P('shelf',1270,860,175),P('solace-lounge',1050,830,285),P('desk',355,865,190),P('plant',220,480,65),P('woven-rug',1040,875,380,{solid:false}));
 }else if(kind==='cafe'){
  p.push(P('solace-reception',1090,505,350),P('shelf',1120,395,220),P('public-cafe-setting',360,590,230),P('public-cafe-setting',410,860,220),P('public-cafe-setting',1130,840,220),P('plant',235,435,70),P('plant',1320,435,70));
 }else if(kind==='clinic'){
  p.push(P('clinic-bed',320,540,200),P('clinic-bed',580,540,200),P('clinic-cabinet',1190,480,145),P('clinic-cart',1010,540,100),P('clinic-screen',370,860,205),P('public-waiting-chairs',1120,850,215),P('solace-reception',1100,720,255));
 }else if(kind==='retail'){
  p.push(P('robotics-retail-display',325,505,190),P('robotics-retail-display',550,505,190),P('robotics-retail-shelves',370,865,255),P('solace-reception',1120,515,320),P('shelf',1140,870,235));
 }else if(kind==='logistics'){
  p.push(P('clinic-cabinet',330,490,150),P('clinic-cabinet',525,490,150),P('solace-packages',1180,465,275),P('conveyor',1080,850,310),P('crates',370,840,160),P('console',580,485,95),P('clinic-cart',1270,865,85));
 }else if(kind==='office'||kind==='meeting'){
  p.push(P('desk',390,530,235),P('desk',1110,530,235),P('shelf',1180,400,180),P('solace-lounge',1080,850,290),P('plant',245,465,75),P('woven-rug',1080,870,400,{solid:false}),P('solace-kiosk',460,860,115));
 }else if(kind==='gym'){
  p.push(P('solace-gym',350,540,285),P('solace-gym',1110,540,285),P('solace-gym',350,850,260),P('solace-packages',1180,845,210),P('plant',1320,440,65));
 }else if(kind==='garden'){
  p.push(P('solace-garden',375,545,320),P('solace-garden',1125,545,320),P('solace-garden',1140,845,280),P('public-waiting-chairs',350,850,220),P('solace-kiosk',590,470,105));
 }else if(kind==='mechanical'||kind==='utility'){
  p.push(P('solace-electrical',330,520,230),P('server',545,490,95),P('solace-hvac',1120,530,300),P('solace-electrical',1150,850,230),P('shelf',365,860,215),P('console',575,850,110));
 }else if(kind==='lobby'){
  p.push(P('solace-reception',1110,520,370),P('solace-packages',350,490,285),P('solace-lounge',390,855,285),P('plant',1320,480,70),P('plant',220,480,70),P('woven-rug',790,800,425,{solid:false}),P('solace-kiosk',1150,850,115));
 }
 return m;
}

const transit=city('solace-transit','Solace · Transit District');
building(transit,'bus-terminal','Solace Transit','terminal',95,120,550,420,'solace-terminal');
building(transit,'daybreak','Daybreak Deli','cafe',670,195,320,345,'solace-deli');
building(transit,'transit-residence','Westline Residences','tower',1420,70,380,470,null);
building(transit,'transit-retail','Circuit & Component','hardware',1840,180,425,370,'solace-parts');
building(transit,'transit-apartment','Platform Apartments','tower',160,780,355,405,'solace-transit-home');
building(transit,'transit-services','Account Services','tower',590,795,370,390,'solace-ai-service');
building(transit,'transit-filler','Skyline Offices','tower',1550,770,415,420,null);
transit.props.push(P('solace-vending',795,1460,125),P('solace-kiosk',1500,1455,125),P('public-waiting-chairs',485,1460,190),P('plant',640,1450,85),P('solace-garden',2030,1420,260),P('bus',1050,1630,350,{solid:false}));
transit.interactions.push(I('bus','Regional bus',1030,1440,'bus'),I('vending','Fingerprint vending',795,1510,'vending'),I('transit-guide','Transit directory',1500,1490,'directory'));
transit.npcs.push(N('commuter','Nia',1300,1410,8),N('waiting','Victor',450,1360,6),N('transit-porter','Parcel Unit 24',1380,600,0,{robot:true}),N('gardener','Elle',1850,1350,7));
exitTo(transit,'east','solace-commercial','Central / Commercial District',2340,905,{x:90,y:905});
exitTo(transit,'north','solace-residential','Residential District',1150,80,{x:1150,y:1560});

const commercial=city('solace-commercial','Solace · Central District');
building(commercial,'cafe','Half Past Coffee','cafe',95,205,390,350,'solace-cafe');
building(commercial,'central-retail','Everyday / Solace','hardware',530,180,470,390,'solace-market');
building(commercial,'central-services','Personal Services','hardware',1410,195,440,345,'solace-central-service');
building(commercial,'central-tower','Meridian Offices','tower',1880,70,385,485,null);
building(commercial,'transit-gate','Central Transit Gate','terminal',90,850,445,340,null);
building(commercial,'central-house','Atrium Residences','tower',570,745,395,435,'solace-central-home');
building(commercial,'gallery','City Gallery','tower',1480,795,420,395,'solace-gallery');
commercial.props.push(P('solace-vending',2030,1450,125),P('solace-kiosk',750,1430,125),P('solace-garden',1800,1460,270),P('public-waiting-chairs',1480,1450,190));
commercial.interactions.push(I('transit-lead','Transit maintenance interface',360,1190,'transit-lead'),I('delivery-lead','Delivery routing unit',1350,980,'delivery-lead'),I('plaza-camera','Street camera',1140,920,'plaza-camera'),I('central-vending','Biometric service kiosk',2030,1490,'vending-lead'));
commercial.npcs.push(N('restaurants','Ari',880,1420,10),N('delivery-owner','Mina',1410,1020,8),N('groceries','Owen',490,1380,6),N('delivery-unit','Delivery Unit',1350,980,0,{robot:true}),N('gallery-guest','Jules',1890,1160,9));
commercial.spawns.push(S('central-search-drone',1670,940,'solaceDrone',.8));
exitTo(commercial,'west','solace-transit','Transit District',60,905,{x:2310,y:905});
exitTo(commercial,'north','solace-north','North / Medical District',1150,80,{x:1150,y:1560});
exitTo(commercial,'east','solace-residential','Residential loop',2340,1430,{x:90,y:1430});

const residential=city('solace-residential','Solace · Residential District');
building(residential,'megacomplex','Meridian Residential Megacomplex','mega',1410,45,710,535,'solace-mega-lobby',{gate:'CH3_JAMMER_ACTIVE'});
building(residential,'job-apartment','Orchard Court','tower',105,80,405,490,'solace-job-apartment');
building(residential,'residential-neighbor','Terrace House','tower',555,135,405,420,'solace-residential-home');
building(residential,'residential-market','Small Hours Deli','cafe',140,865,390,325,'solace-residential-deli');
building(residential,'residential-tower','West Terrace','tower',590,760,350,430,null);
building(residential,'utility-annex','Meridian Service Annex','hardware',1500,840,440,350,'solace-utility-annex');
residential.props.push(P('solace-garden',2050,1420,270),P('solace-packages',400,1445,210),P('solace-kiosk',745,1430,110),P('public-waiting-chairs',1590,1440,205));
residential.npcs.push(N('resident-waiting','Leah',365,1370,8),N('residential-neighbor','Damon',865,1100,9),N('courtyard-reader','Paz',1650,1380,7),N('building-porter','Building Porter',1290,1080,0,{robot:true}));
residential.spawns.push(S('residential-search-drone',1110,950,'solaceDrone',.83));
exitTo(residential,'south','solace-transit','Transit District',1150,1600,{x:1150,y:130});
exitTo(residential,'west','solace-commercial','Central District',60,1430,{x:2310,y:1430});
exitTo(residential,'east','solace-north','North District',2340,905,{x:90,y:905});

const north=city('solace-north','Solace · North District');
building(north,'lou-home','Northline Apartments','tower',110,80,410,495,'solace-lou-apartment');
building(north,'clinic','Solace Community Clinic','clinic',560,175,435,400,'solace-clinic');
building(north,'medical-logistics','Medical Distribution','logistics',1390,155,440,420,'solace-logistics');
building(north,'north-tower','Juniper House','tower',1890,110,395,465,'solace-north-home');
building(north,'neuro-center','Neurological Rehabilitation','neuro',1440,760,735,445,'solace-neuro-public');
building(north,'north-workshop','Northline Maintenance','hardware',170,865,445,330,'solace-neuro-service',{gate:'nr4service'});
building(north,'north-cafe','The Second Cup','cafe',650,870,345,325,'solace-north-cafe');
north.props.push(P('solace-garden',450,1470,310),P('solace-garden',2060,1455,270),P('solace-kiosk',750,1470,115),P('public-waiting-chairs',1680,1460,200));
north.npcs.push(N('medical-worker','Marta · Transport Technician',1360,1430,7),N('therapy-patient','Theo',1940,1330,6),N('north-local','Anika',860,1100,8),N('walking-neighbor','Cal',380,1350,10),N('medical-courier','Sterile Delivery Unit',1280,790,0,{robot:true}));
north.spawns.push(S('north-search-drone',1130,1040,'solaceDrone',.8));
exitTo(north,'south','solace-commercial','Central District',1150,1600,{x:1150,y:130});
exitTo(north,'west','solace-residential','Residential District',60,905,{x:2310,y:905});

const interiors=[
 ['solace-terminal','Solace Transit Lounge','lobby','solace-transit','bus-terminal'],['solace-deli','Daybreak Deli','cafe','solace-transit','daybreak'],['solace-parts','Circuit & Component','retail','solace-transit','transit-retail'],['solace-transit-home','Platform Apartments · 206','apartment','solace-transit','transit-apartment'],['solace-ai-service','Account Services','office','solace-transit','transit-services'],
 ['solace-cafe','Half Past Coffee','cafe','solace-commercial','cafe'],['solace-market','Everyday / Solace','retail','solace-commercial','central-retail'],['solace-central-service','Personal Services','office','solace-commercial','central-services'],['solace-central-home','Atrium Residences · 510','apartment','solace-commercial','central-house'],['solace-gallery','City Gallery','garden','solace-commercial','gallery'],
 ['solace-job-apartment','Orchard Court · Kitchen Service','job','solace-residential','job-apartment'],['solace-residential-home','Terrace House · 311','apartment','solace-residential','residential-neighbor'],['solace-residential-deli','Small Hours Deli','cafe','solace-residential','residential-market'],['solace-utility-annex','Meridian Service Annex','utility','solace-residential','utility-annex'],
 ['solace-lou-apartment',"Lou's Apartment",'apartment','solace-north','lou-home'],['solace-clinic','Solace Community Clinic','clinic','solace-north','clinic'],['solace-logistics','Medical Distribution / Dispatch','logistics','solace-north','medical-logistics'],['solace-north-home','Juniper House · 203','apartment','solace-north','north-tower'],['solace-neuro-public','Neurological Rehabilitation · Public Reception','clinic','solace-north','neuro-center'],['solace-neuro-service','Northline Maintenance / Records','office','solace-north','north-workshop'],['solace-north-cafe','The Second Cup','cafe','solace-north','north-cafe'],
];
for(const [id,title,kind,district,bid]of interiors){const m=furnish(room(id,title,kind),kind);returnTo(m,district,bid);}
for(const [id,name,sheet,text]of [
 ['solace-transit-home','Ren',10,'The windows keep the platform noise out. I still wave when the morning bus goes past. Habit, I suppose.'],
 ['solace-central-home','Maren',7,'The kitchen suggests recipes from whatever is left in the fridge. Yesterday it suggested going shopping. Fair enough.'],
 ['solace-residential-home','Isaac',6,'The apartment assistant ordered three bags of rice. I meant three portions. We are having friends over until the cupboard closes again.'],
 ['solace-north-home','Tessa',8,'My sister is learning to use her hand again at the rehabilitation center. Today she buttoned her own coat. We are celebrating with cake.']
])SOLACE_MAPS[id].npcs.push(N(id+'-resident',name,660,590,sheet,{text,zone:{x:570,y:550,w:165,h:105}}));
for(const id of ['solace-deli','solace-cafe','solace-residential-deli','solace-north-cafe']){
 const m=SOLACE_MAPS[id];m.npcs.push(N(id+'-vendor','Service Associate',925,555,8,{service:id.includes('cafe')?'cafe':'deli'}),N(id+'-guest','Morning Regular',480,680,6),N(id+'-employee','Brewer',1280,570,10));
}
SOLACE_MAPS['solace-parts'].npcs.push(N('solace-machinist','Imani · Components',935,575,9,{service:'parts'}));
SOLACE_MAPS['solace-market'].npcs.push(N('solace-retailer','Retail Associate',935,575,8,{service:'deli'}));
SOLACE_MAPS['solace-clinic'].npcs.push(N('solace-nurse','Nurse Salim',850,640,8,{service:'clinic'}));
SOLACE_MAPS['solace-lou-apartment'].npcs.push(N('lou','Lou',850,670,10));
const louWorkshop=furnish(room('solace-lou-workshop',"Lou's Apartment · Electrical Workshop",'utility'),'utility');
door(SOLACE_MAPS['solace-lou-apartment'],'workshop','north',louWorkshop.id,"Lou's workshop",{x:1320,position:{x:768,y:810}});
door(louWorkshop,'apartment','south','solace-lou-apartment','Return to the apartment',{position:{x:1320,y:455}});
louWorkshop.props.push(P('desk',930,730,230));
louWorkshop.interactions.push(I('lou-workbench','Electronics workbench',890,790,'workbench',{text:'Replacement relays, two multimeters, and a neatly labelled parts tray. A long empty weapon mount hangs above the bench.'}));
SOLACE_MAPS['solace-job-apartment'].npcs.push(N('job-resident','Resident',860,620,7));
SOLACE_MAPS['solace-job-apartment'].interactions.push(I('kitchen-relay','Kitchen electrical controller',1060,570,'job-relay'));
SOLACE_MAPS['solace-logistics'].interactions.push(I('logistics-records','Medical route directory',580,565,'medical-logistics'));
SOLACE_MAPS['solace-logistics'].npcs.push(N('dispatch-worker','Dispatch Associate',860,600,9));
SOLACE_MAPS['solace-neuro-public'].npcs.push(N('rehab-reception','Receptionist',880,635,8),N('rehab-visitor','A Visiting Son',500,755,10));
SOLACE_MAPS['solace-neuro-service'].interactions.push(I('power-records','Archived electrical plans',480,620,'power-records'));
SOLACE_MAPS['solace-neuro-service'].doors.push({id:'basement-stair',side:'north',x:768,y:348,target:'solace-neuro-basement',position:{x:768,y:810},name:'Descend to the service basement',visual:'stairs',gate:'CH3_POWER_TRACE'});
furnish(room('solace-neuro-basement','Rehabilitation Center · Old Utility Basement','mechanical'),'mechanical');
door(SOLACE_MAPS['solace-neuro-basement'],'up','south','solace-neuro-service','Stairs to maintenance records',{position:{x:768,y:440},visual:'stairs'});
door(SOLACE_MAPS['solace-neuro-basement'],'old-service','east','solace-nr4-access','Follow the powered service conduit',{position:{x:230,y:640},gate:'nr4access'});
const nr4=furnish(room('solace-nr4-access','Restricted Service Access','mechanical'),'mechanical');
door(nr4,'back','west','solace-neuro-basement','Return to utility basement',{position:{x:1320,y:640}});
nr4.props.push(P('solace-elevator',768,365,205,{solid:false}));nr4.interactions.push(I('nr4-elevator','Old service elevator controller',768,440,'nr4-elevator'));

// The occupied building is composed of distinct corridors, apartments, utility
// spaces, stair landings and elevator cars. No room is a hole in a shared wall.
const lobby=furnish(room('solace-mega-lobby','Meridian Megacomplex · Concierge Lobby','lobby',{dungeon:true,level:1}),'lobby');
returnTo(lobby,'solace-residential','megacomplex');lobby.doors[0].blockedBy='CH3_LOCKDOWN';lobby.doors[0].lockedText='The physical steel security barrier seals the entrance.';
lobby.npcs.push(N('concierge','Residential Concierge',915,570,0,{robot:true}));
door(lobby,'meeting-wing','west','solace-mega-corridor','Meeting suite corridor',{position:{x:1420,y:615},gate:'CH3_MEETING_ASSIGNED'});
door(lobby,'lift-lobby','north','solace-mega-elevator-lobby','Elevator lobby',{position:{x:768,y:810}});
door(lobby,'service-corridor','east','solace-mega-service','Security / service corridor',{position:{x:230,y:640},gate:'CH3_LOCKDOWN'});
const meetingHall=room('solace-mega-corridor','Level 1 · Meeting Suite Corridor','hall',{dungeon:true,level:1,width:1680,floorRects:[rect(96,435,1488,370)],arrival:{x:1460,y:615}});
meetingHall.props.push(P('public-waiting-chairs',440,740,190),P('plant',260,510,70),P('solace-kiosk',1260,510,100));
door(meetingHall,'lobby','east','solace-mega-lobby','Concierge lobby',{position:{x:230,y:630}});
door(meetingHall,'meeting','north','solace-mega-meeting','Private meeting lounge',{x:650,position:{x:768,y:810}});
const meeting=furnish(room('solace-mega-meeting','Level 1 · Private Meeting Lounge','meeting',{dungeon:true,level:1}),'meeting');
door(meeting,'hall','south','solace-mega-corridor','Return to the corridor',{position:{x:650,y:520}});meeting.doors[0].gate='meeting-exit';
meeting.interactions.push(I('meeting-chair','Take a moment to sit',760,660,'meeting-rest'),I('meeting-door-panel','Door access panel',865,820,'meeting-bypass'));
const elevatorLobby=furnish(room('solace-mega-elevator-lobby','Level 1 · Elevator Lobby','lobby',{dungeon:true,level:1}),'lobby');
door(elevatorLobby,'lobby','south','solace-mega-lobby','Concierge lobby',{position:{x:768,y:440}});
elevatorLobby.props.push(P('solace-elevator',580,365,195,{solid:false}),P('solace-elevator',950,365,195,{solid:false}));elevatorLobby.interactions.push(I('main-lift','Main elevator call',765,455,'main-lift'));
const service=furnish(room('solace-mega-service','Level 1 · Security Service Corridor','utility',{dungeon:true,level:1}),'utility');
door(service,'lobby','west','solace-mega-lobby','Concierge lobby',{position:{x:1320,y:640}});
door(service,'stairs','north','solace-mega-1-stairs','Service stairwell',{position:{x:768,y:810},gate:'CH3_LOBBY_SERVICE_OPEN'});
service.interactions.push(I('lobby-service','Stairwell relay cabinet',540,610,'lobby-service'));

function landing(level,type='stairs'){
 const id=`solace-mega-${level}-${type}`,m=room(id,`Level ${level} · ${type==='stairs'?'Protected Stair Landing':'Service Elevator Lobby'}`,type,{dungeon:true,level,width:1200,height:980,floorRects:[rect(140,350,920,540)],arrival:{x:600,y:785}});
 m.props.push(P('solace-electrical',890,500,120),P('plant',290,760,60));return m;
}
const stairs1=landing(1);door(stairs1,'service','south','solace-mega-service','Security service corridor',{position:{x:768,y:440}});door(stairs1,'up','north','solace-mega-8-stairs','Ascend to level 8',{x:600,y:495,position:{x:600,y:650},visual:'stairs',gate:'CH3_LOBBY_SERVICE_OPEN'});
function hall(level,title){const m=room(`solace-mega-${level}-hall`,`Level ${level} · ${title}`,'hall',{dungeon:true,level,width:2000,height:1050,floorRects:[rect(96,405,1808,460)],arrival:{x:260,y:655}});m.props.push(P('solace-packages',400,805,220),P('public-waiting-chairs',1500,810,220),P('plant',1830,500,65),P('plant',190,500,65),P('woven-rug',1000,790,460,{solid:false}));return m;}
const hall8=hall(8,'Standard Residential');
const s8=landing(8);door(s8,'hall','east',hall8.id,'Residential corridor',{position:{x:230,y:650}});door(s8,'down','north',stairs1.id,'Descend to level 1',{x:600,y:495,position:{x:600,y:650},visual:'stairs'});
door(hall8,'stairs-arrival','west',s8.id,'Lower stair landing',{position:{x:940,y:620}});
for(const [suffix,title,kind]of [['west','Apartment 8-04','apartment'],['east','Apartment 8-12','apartment'],['utility','Electrical Utility Closet','utility']]){const m=furnish(room('solace-mega-8-'+suffix,'Level 8 · '+title,kind,{dungeon:true,level:8}),kind);door(m,'hall','south',hall8.id,'Residential corridor',{position:{x:suffix==='west'?510:suffix==='east'?1390:1010,y:520}});door(hall8,suffix,'north',m.id,title,{x:suffix==='west'?510:suffix==='east'?1390:1010,position:{x:768,y:810},...(suffix==='west'?{gate:'circuit8-west'}:suffix==='east'?{gate:'circuit8-east'}:{})});}
SOLACE_MAPS['solace-mega-8-west'].interactions.push(I('west8','West hall distribution test',910,580,'west8'),I('supply8','Resident emergency sandwich',490,840,'supply',{item:'sandwich'}));
SOLACE_MAPS['solace-mega-8-west'].npcs.push(N('floor8-resident','Resident',890,740,7));
SOLACE_MAPS['solace-mega-8-east'].interactions.push(I('east8','East hall distribution test',910,580,'east8'));
SOLACE_MAPS['solace-mega-8-utility'].interactions.push(I('circuit8','Emergency power routing',550,600,'circuit8'));
hall8.interactions.push(I('circuit8-hall','Emergency routing repeater',1050,755,'circuit8'));
const s8up=landing('8-upper');s8up.level=8;s8up.title='Level 8 · Upper Stair Landing';door(hall8,'up-stair','east',s8up.id,'Released stairwell',{position:{x:255,y:660},gate:'CH3_FLOOR8_COMPLETE'});door(s8up,'hall','west',hall8.id,'Residential corridor',{position:{x:1760,y:650}});door(s8up,'up','north','solace-mega-14-stairs','Ascend to level 14',{x:600,y:495,position:{x:600,y:650},visual:'stairs'});
hall8.spawns.push(S('hall8-cleaner',1070,660,'residentialCleaner'),S('hall8-porter',1720,660,'residentialPorter',.7));
SOLACE_MAPS['solace-mega-8-east'].spawns.push(S('east8-cleaner',1020,735,'residentialCleaner',.7));

const hall14=hall(14,'Amenities / Resident Services'),s14=landing(14);door(s14,'hall','east',hall14.id,'Amenity corridor',{position:{x:240,y:650}});door(s14,'down','north',s8up.id,'Descend to level 8',{x:600,y:495,position:{x:600,y:650},visual:'stairs'});door(hall14,'stairs','west',s14.id,'Stair landing',{position:{x:940,y:620}});
for(const [suffix,title,kind,x]of [['gym','Automated Gym','gym',440],['garden','Indoor Garden','garden',800],['office','Resident Management','office',1190],['cafe','Residents Café','cafe',1600]]){const m=furnish(room('solace-mega-14-'+suffix,'Level 14 · '+title,kind,{dungeon:true,level:14}),kind);door(m,'hall','south',hall14.id,'Amenity corridor',{position:{x,y:525}});door(hall14,suffix,'north',m.id,title,{x,position:{x:768,y:810}});}
SOLACE_MAPS['solace-mega-14-gym'].interactions.push(I('relay14','Local elevator power relay',880,570,'relay14'));
SOLACE_MAPS['solace-mega-14-office'].interactions.push(I('bypass14','Security authorization panel',880,570,'bypass14'));
SOLACE_MAPS['solace-mega-14-garden'].interactions.push(I('supply14','Emergency food locker',530,815,'supply',{item:'field-meal'}));
SOLACE_MAPS['solace-mega-14-cafe'].interactions.push(I('rest14','Resident first-aid cabinet',920,730,'rest'));
for(const suffix of ['gym','office'])SOLACE_MAPS['solace-mega-14-'+suffix].spawns.push(S(suffix+'-automation',1080,755,'residentialPorter',.78));
hall14.spawns.push(S('hall14-cleaner',1250,660,'residentialCleaner'));
const e14=landing(14,'elevator');door(hall14,'lift','east',e14.id,'Service elevator lobby',{position:{x:255,y:660}});door(e14,'hall','west',hall14.id,'Amenity corridor',{position:{x:1760,y:655}});door(e14,'car','north','solace-mega-lift-14-21','Call service elevator',{x:600,y:495,position:{x:500,y:640},visual:'elevator',gate:'CH3_FLOOR14_COMPLETE'});

function lift(id,title,lower,upper,gate){const m=room(id,title,'lift',{dungeon:true,width:1000,height:850,floorRects:[rect(245,355,510,375)],arrival:{x:500,y:640}});door(m,'lower','south',lower,'Return to lower elevator lobby',{x:500,position:{x:600,y:650},visual:'elevator'});door(m,'upper','north',upper,'Ride to the next service level',{x:500,y:420,position:{x:600,y:650},visual:'elevator',gate});return m;}
lift('solace-mega-lift-14-21','Service Elevator · 14 → 21',e14.id,'solace-mega-21-elevator','CH3_FLOOR14_COMPLETE');
const hall21=hall(21,'Mechanical Services'),e21=landing(21,'elevator');door(e21,'hall','east',hall21.id,'Mechanical service corridor',{position:{x:240,y:650}});door(e21,'car','north','solace-mega-lift-14-21','Service elevator to level 14',{x:600,y:495,position:{x:500,y:640},visual:'elevator'});door(hall21,'lift','west',e21.id,'Lower elevator lobby',{position:{x:940,y:620}});
for(const [suffix,title,x]of [['control','Emergency Distribution',450],['hvac','Ventilation Plant',850],['traction','Remote Traction Control',1330],['stores','Maintenance Stores',1680]]){const m=furnish(room('solace-mega-21-'+suffix,'Level 21 · '+title,'mechanical',{dungeon:true,level:21}),'mechanical');door(m,'hall','south',hall21.id,'Mechanical corridor',{position:{x,y:525}});door(hall21,suffix,'north',m.id,title,{x,position:{x:768,y:810},...(suffix==='traction'?{gate:'circuit21-shutters'}:{})});}
SOLACE_MAPS['solace-mega-21-control'].interactions.push(I('circuit21','Emergency supply selector',530,600,'circuit21'));
SOLACE_MAPS['solace-mega-21-traction'].interactions.push(I('transfer21','Traction transfer panel',880,590,'transfer21'));
SOLACE_MAPS['solace-mega-21-stores'].interactions.push(I('supply21','Maintenance emergency ration',520,800,'supply',{item:'field-meal'}));
hall21.spawns.push(S('hall21-maintenance',1040,660,'residentialMaintenance'),S('hall21-response',1740,660,'solaceSecurity'));
SOLACE_MAPS['solace-mega-21-traction'].spawns.push(S('traction-guard',1120,735,'residentialMaintenance'));
SOLACE_MAPS['solace-mega-21-hvac'].spawns.push(S('hvac-guard',1110,750,'residentialMaintenance'));
const e21up=landing('21-upper','elevator');e21up.level=21;e21up.title='Level 21 · Upper Service Elevator';door(hall21,'upper-lift','east',e21up.id,'Upper service elevator',{position:{x:255,y:660},gate:'CH3_FLOOR21_COMPLETE'});door(e21up,'hall','west',hall21.id,'Mechanical corridor',{position:{x:1760,y:655}});door(e21up,'car','north','solace-mega-lift-21-31','Call upper service elevator',{x:600,y:495,position:{x:500,y:640},visual:'elevator',gate:'CH3_FLOOR21_COMPLETE'});
lift('solace-mega-lift-21-31','Service Elevator · 21 → 31',e21up.id,'solace-mega-31-elevator','CH3_FLOOR21_COMPLETE');

const hall31=hall(31,'Upper Residential / Private Suites'),e31=landing(31,'elevator');door(e31,'hall','east',hall31.id,'Upper residential corridor',{position:{x:240,y:650}});door(e31,'car','north','solace-mega-lift-21-31','Service elevator to level 21',{x:600,y:495,position:{x:500,y:640},visual:'elevator'});door(hall31,'lift','west',e31.id,'Elevator lobby',{position:{x:940,y:620}});
for(const [suffix,title,kind,x]of [['west','West Private Suite','luxury',470],['lounge','Premium Residents Lounge','meeting',900],['east','East Private Suite','luxury',1380]]){const m=furnish(room('solace-mega-31-'+suffix,'Level 31 · '+title,kind,{dungeon:true,level:31}),kind);door(m,'hall','south',hall31.id,'Private corridor',{position:{x,y:525}});door(hall31,suffix,'north',m.id,title,{x,position:{x:768,y:810}});}
SOLACE_MAPS['solace-mega-31-west'].interactions.push(I('west31','West roof release',890,600,'west31'));
SOLACE_MAPS['solace-mega-31-east'].interactions.push(I('east31','East roof release',890,600,'east31'),I('supply31','Sealed first-aid ration',505,790,'supply',{item:'field-meal'}));
for(const suffix of ['west','east'])SOLACE_MAPS['solace-mega-31-'+suffix].spawns.push(S(suffix+'-containment',1070,735,'solaceResponse'));
hall31.spawns.push(S('hall31-containment',1200,655,'solaceResponse'),S('hall31-security',1730,660,'solaceSecurity',.8));
const s31=landing(31);door(hall31,'roof-stair','east',s31.id,'Rooftop stair landing',{position:{x:255,y:650},gate:'CH3_FLOOR31_COMPLETE'});door(s31,'hall','west',hall31.id,'Upper residential corridor',{position:{x:1760,y:655}});door(s31,'roof','north','solace-mega-roof','Ascend to the rooftop',{x:600,y:495,position:{x:920,y:1060},visual:'stairs',gate:'CH3_FLOOR31_COMPLETE'});
const roof=map('solace-mega-roof','Meridian Megacomplex · Roof / Upper Mechanical',{dungeon:true,level:32,kind:'roof',width:1920,height:1280,floorRects:[rect(125,425,1670,725)],arrival:{x:920,y:1060}});
roof.props.push(P('solace-hvac',350,650,340),P('solace-hvac',1460,650,340),P('solace-electrical',1480,1030,205),P('server',320,1060,110),P('solace-kiosk',550,1080,105));
door(roof,'stairs','south',s31.id,'Roof stairwell',{x:920,position:{x:600,y:650},visual:'stairs'});
roof.interactions.push(I('containment8','Containment unit',940,685,'containment8'),I('mission-cache','Local mission cache',1020,725,'mission-cache',{gate:'CH3_BOSS_DEFEATED'}));
door(roof,'bridge','east','solace-mega-bridge','Maintenance bridge to the service annex',{position:{x:230,y:650},gate:'CH3_NR4_CODE'});
const bridge=map('solace-mega-bridge','Rooftop Maintenance Bridge',{dungeon:true,kind:'bridge',width:1800,height:1050,floorRects:[rect(95,540,1610,260)],arrival:{x:230,y:650}});
door(bridge,'roof','west',roof.id,'Return to the roof',{position:{x:1660,y:785}});door(bridge,'annex','east','solace-utility-annex','Descend through the service annex',{position:{x:768,y:785},visual:'stairs',gate:'CH3_NR4_CODE'});

// Canonical dialogue IDs are shared with story.mjs; there are no parallel plot flags.
const canonicalFeatures={'logistics-records':'medical-routes','power-records':'power-trace','nr4-elevator':'elevator-start','meeting-chair':'lockdown-start','containment8':'roof-start','mission-cache':'cache-start'};
for(const m of Object.values(SOLACE_MAPS)){
 for(const i of m.interactions){if(canonicalFeatures[i.id])i.id=i.event=i.action=canonicalFeatures[i.id];if(i.action==='supply'||i.action==='rest')delete i.event;}
 for(const n of m.npcs){if(n.service==='parts')n.service='gear';if(n.service==='cafe')n.service='coffee';}
}
SOLACE_MAPS['solace-commercial'].npcs.find(n=>n.id==='restaurants').id='recommendations';
SOLACE_MAPS['solace-commercial'].npcs.find(n=>n.id==='delivery-owner').id='delivery-lead';
SOLACE_MAPS['solace-commercial'].npcs.push(N('transit-lead','Gate Attendant',385,1300,9));
SOLACE_MAPS['solace-residential'].npcs.find(n=>n.id==='residential-neighbor').id='resident';
SOLACE_MAPS['solace-residential'].npcs.find(n=>n.id==='courtyard-reader').id='runner';
SOLACE_MAPS['solace-north'].npcs.find(n=>n.id==='north-local').id='manual';
SOLACE_MAPS['solace-north'].npcs.find(n=>n.id==='walking-neighbor').id='student';
SOLACE_MAPS['solace-north'].npcs.find(n=>n.id==='medical-worker').name='Marta · Transport Technician';
SOLACE_MAPS['solace-neuro-public'].npcs.find(n=>n.id==='rehab-reception').id='neuro-reception';
SOLACE_MAPS['solace-logistics'].npcs.find(n=>n.id==='dispatch-worker').id='medical-routes';
const bridgeExit=bridge.doors.find(d=>d.target==='solace-utility-annex');bridgeExit.event='roof-escape';
export const ALL_LOCATIONS=Object.freeze(Object.keys(SOLACE_MAPS));
export const mapFor=id=>SOLACE_MAPS[id]||null;
export const within=(p,r,pad=0)=>p.x>=r.x-pad&&p.x<=r.x+r.w+pad&&p.y>=r.y-pad&&p.y<=r.y+r.h+pad;
export const BUILDING_ART_SIZES={terminal:[498,348],cafe:[259,399],tower:[256,489],mega:[367,507],hardware:[378,359],clinic:[372,342],logistics:[375,352],neuro:[386,416]};
export function buildingGeometry(b){const [iw,ih]=BUILDING_ART_SIZES[b.type]||BUILDING_ART_SIZES.tower,scale=Math.min(b.w/iw,b.h/ih),w=iw*scale,h=ih*scale,x=b.x+b.w/2,y=b.y+b.h;return {x,y,w,h,facade:rect(x-w/2,y-h,w,h),footprint:rect(x-w*.43,y-Math.min(115,h*.19),w*.86,Math.min(110,h*.19))};}
export function propFootprint(p){if(p.solid===false||p.type==='woven-rug')return null;const w=p.width||180;return rect(p.x-w*.42,p.y-Math.min(80,w*.25),w*.84,Math.min(80,w*.25));}
const collisionCache=new WeakMap();
export function obstaclesFor(value,progress={}){const m=typeof value==='string'?mapFor(value):value;if(!m)return [];if(!collisionCache.has(m))collisionCache.set(m,[...(m.buildings||[]).map(b=>buildingGeometry(b).footprint),...m.props.map(propFootprint).filter(Boolean),...m.doors.filter(d=>d.visual!=='district').map(doorCollision),...(m.obstacles||[])]);return collisionCache.get(m);}
export function walkable(id,x,y,progress={},radius=12){const m=mapFor(id);if(!m)return false;const corners=[{x:x-radius,y:y-radius},{x:x+radius,y:y-radius},{x:x-radius,y:y+radius},{x:x+radius,y:y+radius}];return corners.every(p=>m.floorRects.some(f=>within(p,f)))&&!obstaclesFor(m,progress).some(o=>x+radius>o.x&&x-radius<o.x+o.w&&y+radius>o.y&&y-radius<o.y+o.h);}
export function nearestWalkable(id,point,progress={}){if(walkable(id,point.x,point.y,progress))return {...point};for(let radius=20;radius<500;radius+=20)for(let i=0;i<16;i++){const a=i*Math.PI/8,p={x:point.x+Math.cos(a)*radius,y:point.y+Math.sin(a)*radius};if(walkable(id,p.x,p.y,progress))return p;}return {...mapFor(id).arrival};}
