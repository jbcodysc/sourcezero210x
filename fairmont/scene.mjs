import {activateDoor,canInteractDoor} from '../city/doors.mjs';
import {drawElectronicDoor} from './door-art.mjs';
import {CITY,ROADS,PARK,PARK_DETAILS,ARRIVAL,BUILDINGS,CITY_NPC_POINTS,CITY_FIXTURES,INTERIORS,MARKET_FLOORS,FACILITY_ZONES,HOTEL,mapFor,hotelMapFor,canonicalLocation,retireRoomSpawns,worldWalkable,nearestWalkable,citySpawns,spawnEvents,markDefeated,chaseWaypoint,rearServiceEntrance} from './world.mjs';
import {buildingGeometry} from './building-geometry.mjs';
import {migrateCompactCityLayout} from './city-density.mjs';
import * as story from './story.mjs';
import {preloadFairmontArt,prepareFairmontArt,drawFairmontBuilding,drawFairmontServiceEntrance,drawFairmontProp,createFairmontCitizen,drawFairmontBus} from './art.mjs';
import {interiorDesignFor,drawInteriorDetails} from './interior-design.mjs';
import {enemiesFor,FAIRMONT_ENEMIES} from './enemies.mjs';
import {loadCitizenSheets,prepareCitizenSheets,createCitizenActor,drawCitizenActor} from './citizen-sheets.mjs';
import {normalizedMovement,direction} from '../lab/world-rules.mjs';
import {walk} from '../city/city-world.mjs';
import {encounterBounds,sweptTouchingBounds,postBattleImmune} from '../city/encounter-contact.mjs';
import {ArgusEntrance} from './argus-entrance.mjs';
import {createArgusUnitActor,drawArgusUnitActor} from './argus-unit-sprites.mjs';
import {explorationMusicMode} from '../city/music-routing.mjs';
import {SANDWICH_HEAL,SANDWICH_PRICE,GEAR,restore,buy} from '../city/progress.mjs';
const $=s=>document.querySelector(s),escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const streetNPCs=[
 ['commuter','Nadia',860,3930,1,'I come here every day. The bus still asks if I am enjoying my visit.'],
 ['courier-local','Parcel Unit 14',3120,3830,3,'DELIVERY COMPLETE. YOUR AFTERNOON HAS BEEN LEFT IN A SAFE PLACE.'],
 ['technician','Sam',3410,1540,0,'That sensor paused on me for three seconds. Then it went back to counting pallets. Calibration, probably.'],
 ['shopper','Fran',1710,1990,1,'Need someone who actually repairs electronics? Try the little Radio Hut. Most places just sell you the next one.'],
 ['reader','Imani',3080,1030,1,'The old paper bookshop has a charging station. For the owner. It is a chair.'],
 ['worker','Omar',3410,2550,0,'The drone complex is running a new validation shift. Trucks in, packaged drones out. It never really closes.'],
 ['neighbor','Mrs. Cole',920,3460,1,'The park was twice this size. They call the other half progress. I used to call it a nice walk.'],
 ['service-local','Municipal Service Unit',630,2230,3,'PUBLIC WALKWAY CLEAR. PLEASE ENJOY THE REMAINING PUBLIC WALKWAY.'],
 ['derek','Derek',1400,2660,0,null],
 ['protester','Jo Bell',1700,2890,1,null],
 ['camper','Ada',1920,2540,1,'We are staying here. Quietly, legally, and with a truly irresponsible quantity of lentils.'],
 ['organizer','Mel',1430,3060,0,'Half the park is already cleared for their data center. The machines stay parked as long as we stay here.'],
 ['signmaker','Kit',2030,2900,0,'My sign says SAVE OUR PARK. The back says THIS IS ALSO MY LUNCH TABLE.'],
 ['bystander','Louis',1150,3150,0,'Nobody is throwing anything. We are saving the park, not auditioning for the evening news.']
];
const interiorNPC={radio:['radio-owner','Harlan Voss',0],hotel:['hotel-clerk','Lena Vale',1],cafe:['barista','Tess Medina',1],diner:['diner-owner','Gus',0],clinic:['nurse','Nurse Patel',1],gear:['vendor','Alma',1],apartment:['resident','Rae',0],books:['bookseller','Edith',1],terminal:['dispatcher','Mina',1]};
const roomFlavor={
 terminal:['Departure board: BELLWETHER / FAIRMONT. Northbridge service is awaiting regional clearance.','A timetable printed yesterday. Someone has already corrected it by hand.'],
 hotel:['A real mattress, a desk lamp, and a kettle with no network connection. Luxury.','A guest comment card: “Elevator music needs more elevator.”'],
 cafe:['The espresso machine is manually operated. Its operator would like you to notice.','A chalkboard promises caramel, caffeine, and absolutely no predictive foam art.'],
 radio:['Circuit boards, soldering irons, yellowed service manuals. Nothing here has been arranged by an algorithm.','A hand-lettered sign: REPAIR IS A VERB.'],
 gear:['Work vests, precision grips, industrial earplugs. The useful end of the future.','A pegboard arranged with alarming care.'],
 apartment:['Family photographs and a couch that has survived three moves.','A home-office monitor is asleep. Its owner is making a serious attempt to follow its example.'],
 books:['LOCAL HISTORY occupies a shelf between OBSOLETE FORMATS and STILL PERFECTLY GOOD.','A reading lamp casts a warm circle over a book about passenger trains.'],
 diner:['The lunch special has been the lunch special since 2089.','The jukebox contains twelve songs and fourteen opinions.'],
 clinic:['Fresh dressings, clean worktops, and a reassuringly human receptionist.','The first-aid station is open to everyone.']
};
export function createFairmontScene(api){
 const {Base,getProgress,state,save,remember,control,resetControls,screenMode,sceneUI,advanceText,finishText,chooseKeyboardButton,VIEW,sound,actor,drawActor:drawBaseActor,prepareArt,prepareWaterArt}=api;
 const drawActor=(a,delta)=>a.argusUnit?drawArgusUnitActor(a,delta):a.fairmontCitizen?drawCitizenActor(a,delta):drawBaseActor(a,delta);
 return class FairmontScene extends Base {
  constructor(){super('Fairmont');}
  init(data){super.init(data);const p=getProgress();this.location=canonicalLocation(data?.location||'fairmont');this.entry=migrateCompactCityLayout(p,this.location,data?.position||(p.location===this.location?p.position:ARRIVAL));this.map=mapFor(this.location);this.hotel=hotelMapFor(this.location);this.floor=null;this.obstacles=[];this.scanGraphic=null;this.visuals=[];this.cinematicStep=0;this.facilityBroadcast=null;this.facilityBroadcastOffset=0;}
  preload(){super.preload();preloadFairmontArt(this);loadCitizenSheets(this);}
  create(){
   const p=getProgress();state.scene=this;prepareArt(this);prepareWaterArt(this);prepareFairmontArt(this);prepareCitizenSheets(this);resetControls();screenMode('game');$('#loading').hidden=true;
   this.night=story.timeOfDay(p)==='night';this.roomId=this.location.replace('fairmont-','');this.building=BUILDINGS.find(b=>b.id===this.roomId);
   sceneUI(this.map?this.map.title.toUpperCase():this.hotel?this.hotel.title.toUpperCase():this.location==='fairmont'?'FAIRMONT JUNCTION · '+(this.night?'NIGHT':'DAY'):this.building?.name||'FAIRMONT JUNCTION');
   const chapter=$('.chapter');if(chapter)chapter.innerHTML='<span>02</span><div>FAIRMONT JUNCTION<small>'+(this.night?'The city between shifts':'An ordinary industrial afternoon')+'</small></div>';
   $('#scene-status span').textContent=this.map||this.hotel?'INTERIOR':this.night?'NIGHT':'DAYLIGHT';$('#stage').setAttribute('aria-label','Explore Fairmont Junction');document.title='SOURCE ZERO · Fairmont Junction';
   const pending=story.resumeEvent(p),broadcast=(!pending||pending.type==='facility-broadcast')&&story.facilityBroadcast(p,this.location);
   if(pending?.type?.startsWith('argus-')||broadcast){this.arrival=true;this.locked=true;}
   sound.setMode(pending?.type?.startsWith('argus-')?'argus-entrance':explorationMusicMode(this));sound.fountain(Infinity);
   if(this.map)this.createComplex();else if(this.location==='fairmont')this.createJunction();else if(this.hotel)this.createHotel();else this.createInterior();
   const point=nearestWalkable(this.location,this.entry,this.npcs,(x,y)=>this.canStand(x,y,this.npcs));this.player=actor(this,point.x,point.y,0,110,true);if(this.entry?.facing)this.player.dir=this.entry.facing;this.beginRecovery();
   const size=this.map||this.hotel|| (this.location==='fairmont'?CITY:VIEW);this.cameras.main.setBounds(0,0,size.width,size.height);this.cameras.main.startFollow(this.player.sprite,true,1,1);this.cameras.main.centerOn(point.x,point.y);
   this.keys=this.input.keyboard.addKeys({up:'W',down:'S',left:'A',right:'D',up2:'UP',down2:'DOWN',left2:'LEFT',right2:'RIGHT'});
   this.installCoreUI();
   this.input.keyboard.addCapture([13,32,37,38,39,40,90]);this.onResize=()=>this.positionDialogue();window.addEventListener('resize',this.onResize);
   this.events.once('shutdown',()=>{this.writer=null;window.removeEventListener('resize',this.onResize);resetControls();});
   if(!p.visited.includes(this.location))p.visited.push(this.location);remember(this);this.cameras.main.fadeIn(250,12,18,32);$('#footer-hint').textContent='Listen to the city. The useful things are rarely on the signs.';
   this.time.delayedCall(300,()=>this.resumeStory());
  }
  applyEvent(event){const result=story.transition(getProgress(),event);Object.assign(getProgress(),result.state);save();return result;}
  label(x,y,text,size=20,color='#eee4cb'){return this.add.text(x,y,text,{fontFamily:'monospace',fontSize:size+'px',color,stroke:'#182433',strokeThickness:3,align:'center',lineSpacing:5}).setOrigin(.5).setDepth(y+2);}
  prop(type,x,y,scale=1){return drawFairmontProp(this,type,x,y,scale);}
  drone(x,y,width=95){const image=this.add.image(x,y,FAIRMONT_ENEMIES.scanDrone.mapTexture,'portrait').setOrigin(.5,1).setDepth(y);image.setScale(width/image.width);return image;}
  addCitizen(id,name,x,y,row=0,text=null,fixed=false){
   const zone=fixed?null:{x:x-90,y:y-60,w:180,h:100};
   if(['courier-local','service-local'].includes(id)){const n=this.addNPC({id,name,x,y,row,zone});n.flavor=text;return n;}
   const sheets={derek:1,protester:2,camper:4,organizer:3,signmaker:5,bystander:6,commuter:8,technician:10,worker:9,neighbor:7,'diner-owner':6,barista:8,'hotel-clerk':7,nurse:8,dispatcher:9,resident:10,'cafe-brewer':10,'cafe-guest-one':7,'cafe-guest-two':6,'diner-brewer':10,'diner-guest-one':8,'diner-guest-two':9,'hotel-guest':6,'hotel-porter':10};
   const existing={'security-guard':'guard','radio-owner':'shopkeeper',shopper:'protester',reader:'derek',vendor:'worker',bookseller:'olderwoman'};
   const visual=existing[id]?createFairmontCitizen(this,x,y,existing[id],104):sheets[id]?createCitizenActor(this,x,y,sheets[id],104):createFairmontCitizen(this,x,y,row?'olderwoman':'worker',104);
   const n={...visual,id,name,row,zone,flavor:text,wait:700+Math.random()*2400,target:null,stuck:0};this.npcs.push(n);return n;
  }
  roam(npc,...args){super.roam(npc,...args);if(npc.argusUnit)drawArgusUnitActor(npc,0);else if(npc.fairmontCitizen)drawCitizenActor(npc,0);}
  removeCitizen(id){const n=this.npcs.find(n=>n.id===id);if(!n)return;n.sprite.destroy();n.shadow?.destroy();this.npcs=this.npcs.filter(n=>n.id!==id);}
  createJunction(){
   this.occlusionObjects||=[];
   const p=getProgress(),g=this.add.graphics().setDepth(-20);
   this.add.tileSprite(0,0,CITY.width,CITY.height,'fm-paving').setOrigin(0).setDepth(-30).setTint(this.night?0x526982:0xffffff);
   for(const y of ROADS.horizontal){this.add.tileSprite(0,y,CITY.width,320,'fm-paving').setOrigin(0,.5).setDepth(-29).setTint(this.night?0x73849c:0xffffff);this.add.tileSprite(0,y,CITY.width,190,'fm-asphalt').setOrigin(0,.5).setDepth(-28).setTint(this.night?0x697993:0xffffff);}
   for(const x of ROADS.vertical){const start=ROADS.verticalStarts?.[x]||0;this.add.tileSprite(x,start,320,CITY.height-start,'fm-paving').setOrigin(.5,0).setDepth(-29).setTint(this.night?0x73849c:0xffffff);this.add.tileSprite(x,start,190,CITY.height-start,'fm-asphalt').setOrigin(.5,0).setDepth(-28).setTint(this.night?0x697993:0xffffff);}
   for(const b of BUILDINGS){const f=buildingGeometry(b).facade;this.add.tileSprite(f.x-20,f.y+f.h-10,f.w+40,100,'fm-paving').setOrigin(0).setDepth(-29).setTint(this.night?0x73849c:0xffffff);}
   g.fillStyle(0xddc989,.7);for(const y of ROADS.horizontal)for(let x=30;x<CITY.width;x+=125)if(!ROADS.vertical.some(v=>Math.abs(v-x)<170))g.fillRect(x,y-3,50,6);
   g.fillStyle(0xe6e3ce,.65);for(const x of ROADS.vertical)for(const y of ROADS.horizontal)for(let i=-3;i<=3;i++){g.fillRect(x+i*22,y-142,11,35);g.fillRect(x-142,y+i*22,35,11);}
   this.createPark();
   // Loading aprons, conduit runs and stacked freight replace suburban lawns.
   for(const b of BUILDINGS.filter(b=>['warehouse','facility','market'].includes(b.type))){
    const f=buildingGeometry(b).facade,y=f.y+f.h;
    g.lineStyle(8,this.night?0x586c7a:0x84969b,.8);g.lineBetween(f.x+20,y+50,f.x+f.w-20,y+50);
    for(let x=f.x+28;x<f.x+f.w-45;x+=95){g.lineStyle(5,0xd2ae55,.7);g.lineBetween(x,y+61,x+30,y+78);}
   }
   for(const b of BUILDINGS){this.occlusionObjects.push({sprite:drawFairmontBuilding(this,b,this.night),kind:'building'});if(b.enter)this.interactables.push({...b.door,id:'door-'+b.id,name:'Enter '+b.name,kind:'building',building:b,range:145});}
   const market=BUILDINGS.find(b=>b.id==='market');drawFairmontServiceEntrance(this,market,this.night);this.interactables.push({...rearServiceEntrance(market),id:'market-rear',name:'Examine the rear service entrance',kind:'market-rear',range:110});
   const facility=BUILDINGS.find(b=>b.id==='facility');drawFairmontServiceEntrance(this,facility,this.night);this.interactables.push({...rearServiceEntrance(facility),id:'facility-rear',name:'Cenexis employee access',kind:'facility-rear',range:110});
   if(p.flags.CH2_WRM_CLEARED){const f=buildingGeometry(market).facade,y=f.y+f.h;this.label(f.x+f.w/2,y-80,'CLOSED · INVESTIGATION IN PROGRESS',18,'#f6b66c');for(let i=0;i<4;i++)this.add.rectangle(f.x+f.w*(i+.5)/4,y+4,f.w*.21,12,0xe8bb4c).setAngle(-5).setDepth(y+10);}
   for(let i=0;i<streetNPCs.length;i++){
    const [id,name,oldX,oldY,row,text]=streetNPCs[i],{x,y}=PARK_DETAILS.npcs[id]||CITY_NPC_POINTS[id]||{x:oldX,y:oldY};
    if(id==='derek'&&p.flags.CH2_DEREK_LOCKED)continue;
    if(this.night&&!['derek','protester','camper','organizer','commuter'].includes(id))continue;
    const news=p.flags.CH2_DAY2&&['commuter','shopper','neighbor'].includes(id)?story.FLAVOR.day2[i%story.FLAVOR.day2.length]+' '+text:text;
    this.addCitizen(id,name,x,y,row,news,id==='derek'||id==='protester');
   }
   if(p.flags.CH2_PARK_SECURITY_ACTIVE){this.addCitizen('security-guard','Contract Security',PARK_DETAILS.guard.x,PARK_DETAILS.guard.y,0,null,true);for(const {x,y}of PARK_DETAILS.drones){const drone=this.drone(x,y,105);this.tweens.add({targets:drone,y:y-12,duration:1300,yoyo:true,repeat:-1});}}
   for(const {x,y}of CITY_FIXTURES.lamps){this.prop('lamppost',x,y,1.3);if(this.night)this.add.circle(x,y-120,96,0xffd082,.09).setDepth(y);}
   // Quiet, deterministic service traffic stays neutral in every story state.
   const bus=CITY_FIXTURES.bus;drawFairmontBus(this,bus.x,bus.y,bus.width,this.night);
   this.interactables.push({...CITY_FIXTURES.departureBoard,id:'bus-return',name:'Check the departure board',kind:'flavor',text:p.flags.CH2_COMPLETE?'NORTHBRIDGE — NEXT REGIONAL DEPARTURE. Your lead, and an old friend, are waiting there.':'Northbridge departures are on the regional platform. The trail in Fairmont is still unfinished.',range:150});
   this.slots=state.fairmontSlots?.fairmont||citySpawns();(state.fairmontSlots||={}).fairmont=this.slots;
   for(const s of this.slots)if(s.enemy&&p.flags.CH2_CITY_SECURITY_HOSTILE)this.addPatrol(s);
  }
  createPark(){
   const d=PARK_DETAILS,g=this.add.graphics().setDepth(-24);
   // A curb encloses the whole original park; the surviving lawn is only its eastern half.
   g.fillStyle(this.night?0x62727a:0xd3d0ba);g.fillRoundedRect(PARK.x-15,PARK.y-15,PARK.w+30,PARK.h+30,22);
   this.add.tileSprite(PARK.x,PARK.y,PARK.w,PARK.h,'fm-grass').setOrigin(0).setDepth(-23).setTint(this.night?0x536c78:0xffffff);
   const earth=this.add.graphics().setDepth(-22);earth.fillStyle(this.night?0x66564b:0xb7996e);earth.fillRect(d.demolition.x-22,d.demolition.y-30,d.demolition.w+42,d.demolition.h+72);
   // Uneven excavated cuts, tire tracks and exposed path remnants sit under the debris art.
   for(let row=0;row<11;row++)for(let col=0;col<12;col++){
    const x=d.demolition.x+28+col*66,y=d.demolition.y+25+row*60;
    earth.fillStyle((row+col)%3?0x8c7459:0xc6aa7d,.58);earth.fillEllipse(x+(row%2)*14,y,39+(col%4)*12,11+(row%3)*4);
   }
   earth.lineStyle(10,this.night?0x51463e:0x867057,.7);
   for(let i=0;i<2;i++){earth.lineBetween(330+i*92,250,700+i*92,810);for(let y=290;y<760;y+=32)earth.lineBetween(355+i*92+(y-290)*.65,y,385+i*92+(y-290)*.65,y-9);}
   for(const r of d.paths)this.add.tileSprite(r.x,r.y,r.w,r.h,'fm-paving').setOrigin(0).setDepth(-21).setTint(this.night?0x778596:0xffffff);
   for(const p of d.dirtPiles)this.prop('dirtMound',p.x,p.y,p.scale);
   for(const p of d.stumps)this.prop('uprootedStump',p.x,p.y,.65);
   for(const p of d.fallenTrees)this.prop('fallenTree',p.x,p.y,1.15).setAngle(p.angle);
   this.prop('brokenPath',480,825,1.2);this.prop('excavator',d.machinery.x,d.machinery.y,1.25);this.prop('crates',d.crates.x,d.crates.y,1.2);
   for(const p of d.fence)this.prop('fence',p.x,p.y,1.05);
   for(const p of d.trees)this.occlusionObjects.push({sprite:this.prop('tree',p.x,p.y,1.05),kind:'tree'});
   for(const p of d.tents)this.prop('tent',p.x,p.y,1);
   for(const p of d.benches)this.prop('parkBench',p.x,p.y,1);
   for(const {x,y,scale}of d.flowerbeds)this.prop('flowerbed',x,y,scale);
   this.prop('fountain',d.fountain.x,d.fountain.y,1.1);
   const spray=this.add.graphics().setDepth(d.fountain.y+1);
   this.fountainSpray=spray;this.fountainClock=0;
   this.label(1510,PARK.y+42,'FAIRMONT COMMONS',25,this.night?'#e6e3ba':'#fff5d0');
   this.label(570,190,'CIVIC DATA CAMPUS · WORK HALTED',16,'#f5d29b');
  }
  createInterior(){
   const id=this.roomId,g=this.add.graphics().setDepth(-30);g.fillStyle(this.night?0x172134:0x263344);g.fillRect(0,0,1536,1024);g.fillStyle(this.night?0x705342:0x92735a);g.fillRect(120,300,1290,660);
   this.add.tileSprite(135,350,1260,595,id==='clinic'?'fm-retail':id==='gear'?'fm-industrial':'fm-wood').setOrigin(0).setDepth(-29).setTint(this.night?0x8d91ad:0xffffff);
   for(let y=320;y<960;y+=42){g.lineStyle(2,0x322c36,.5);g.lineBetween(125,y,1410,y);for(let x=130+(y%84?90:0);x<1400;x+=185)g.lineBetween(x,y,x,y+42);}
   g.fillStyle(id==='clinic'?(this.night?0x687d7d:0xd4e3d8):(this.night?0x47414d:0xbaa68d));g.fillRect(120,120,1290,230);g.lineStyle(15,id==='clinic'?0x617b78:0x3a3946);g.strokeRect(120,120,1290,835);
   for(const x of (id==='clinic'?[370]:[370,1040])){g.fillStyle(0x403646);g.fillRect(x,170,230,145);g.fillStyle(this.night?0x182947:0x8ba6b5);g.fillRect(x+10,180,210,125);g.lineStyle(9,0x555266);g.lineBetween(x+115,180,x+115,305);}
   const design=this.furnishInterior();
   const npc=interiorNPC[id],service=design.service||{x:850,y:570};if(npc)this.addCitizen(...npc.slice(0,2),service.x,service.y,npc[2],null,true);
   this.label(770,130,this.building?.name||'FAIRMONT',27);this.label(768,951,'↓ STREET',18);this.interactables.push({x:770,y:930,kind:'exit',id:'exit',name:'Return to the street',range:95});
   for(let i=0;i<2;i++)this.interactables.push({x:i?1090:385,y:i?590:640,kind:'flavor',id:'room-detail-'+i,name:i?'Examine the desk':'Look around',text:roomFlavor[id]?.[i]||'Signs of another ordinary working day.',range:95});

  }
  furnishInterior(){
   const design=interiorDesignFor(this.location,this.map);
   for(const p of design.props)this.prop(p.type,p.x,p.y,p.scale);
   drawInteriorDetails(this,design);
   for(const a of design.actors)this.addCitizen(a.id,a.name,a.x,a.y,a.row,a.text,true);
   return design;
  }
  drawRoomShell(m,hotel=false){
   const g=this.add.graphics().setDepth(-30);g.fillStyle(0x15212b);g.fillRect(0,0,m.width,m.height);
   for(const r of m.floor){
    g.fillStyle(hotel?0xdbc5a2:m.isMarket?0xbdc8c6:0x8aa5b1);g.fillRect(r.x-14,r.y-165,r.w+28,r.h+180);
    g.fillStyle(hotel?0xa0836b:0x485f6b);g.fillRect(r.x,r.y-165,r.w,20);
    g.fillStyle(0x263945);g.fillRect(r.x-14,r.y+r.h-2,r.w+28,18);
    this.add.tileSprite(r.x,r.y,r.w,r.h,hotel?'fm-wood':m.isMarket?'fm-retail':'fm-industrial').setOrigin(0).setDepth(-29);
    g.lineStyle(8,hotel?0x775846:0x3b5260);g.lineBetween(r.x,r.y-4,r.x+r.w,r.y-4);
    // Wall panels, conduits and daylight windows give each sealed room a readable edge.
    for(let x=r.x+100;x<r.x+r.w-90;x+=310){
     g.fillStyle(hotel?(this.night?0x273e5f:0xc1e6ed):0x5e7987);g.fillRect(x,r.y-130,150,85);
     g.lineStyle(6,hotel?0x776150:0x334e60);g.strokeRect(x,r.y-130,150,85);
     g.lineBetween(x+75,r.y-130,x+75,r.y-45);
    }
   }
  }
  drawRoomDoor(door){
   if(door.facilityDoor){drawElectronicDoor(this,door,door.locked||door.requiresFlag&&!getProgress().flags[door.requiresFlag]);return;}
   const side=door.side||'north',horizontal=['north','south'].includes(side);
   const x=door.x,y=door.y,locked=door.locked||(door.requiresFlag&&!getProgress().flags[door.requiresFlag]);
   if(door.stairs||door.visual==='stairs'){
    for(let i=0;i<6;i++)this.add.rectangle(x,y-64+i*13,142,12,i%2?0x9faeae:0xc9cfbf).setDepth(y-1);
    this.label(x,y-96,door.name||'STAIRS',16);
   }else if(side==='south'){
    // The foreground wall is cut away; show its threshold on the floor so an
    // arriving character is never hidden behind an upright door panel.
    this.add.rectangle(x,y-12,120,62,0x273b49).setStrokeStyle(5,0x78919b).setDepth(-26);
    this.add.rectangle(x,y-12,94,44,locked?0x665959:0x65808d).setStrokeStyle(2,0xb9c5bd).setDepth(-25);
    this.add.rectangle(x,y+20,116,8,0xc2c9bb).setDepth(-25);
   }else{
    this.add.rectangle(x,y-(horizontal?44:18),horizontal?112:56,horizontal?115:125,0x273b49).setStrokeStyle(5,0x78919b).setDepth(y-1);
    this.add.rectangle(x,y-(horizontal?43:18),horizontal?88:38,horizontal?91:105,locked?0x665959:0x65808d).setStrokeStyle(2,0xb9c5bd).setDepth(y);
    this.add.rectangle(x+24,y-28,8,18,locked?0xf2a26b:0xc2f1d2).setDepth(y+1);
    this.label(x,y-119,door.number||door.label||door.name?.replace(/^Enter |^Return to /,'')||'DOOR',15);
   }
  }
  addRoomDoor(door){this.drawRoomDoor(door);this.interactables.push({...door,kind:'room-door',range:door.range||110});}
  createHotel(){
   const m=this.hotel;this.drawRoomShell(m,true);
   const design=this.furnishInterior();
   for(const d of m.doors)this.addRoomDoor(d);
   for(const d of m.lockedDoors||[])this.addRoomDoor({...d,locked:true});
   if(this.location===HOTEL.lobby){
    const desk=design.service||m.clerk||{x:850,y:570};this.addCitizen('hotel-clerk','Lena Vale',desk.x,desk.y,1,null,true);
    this.interactables.push({x:390,y:705,kind:'flavor',id:'hotel-common',name:'Look around the common area',text:'A sofa, yesterday’s newspaper, and a television nobody agrees about. The bedrooms are upstairs.',range:110});
   }
   if(m.bed)this.interactables.push({...m.bed,kind:'sleep',id:'bed',name:'Check your bed · rest',range:120});
   if(this.location===HOTEL.bedroom){this.interactables.push({x:1100,y:630,kind:'flavor',id:'hotel-desk',name:'Examine your desk',text:'A brass key stamped 204, a paper street map, and a kettle blissfully unaware of the internet.',range:100});}
  }
  createComplex(){
   const m=this.map,p=getProgress();this.drawRoomShell(m);
   this.furnishInterior();
   for(const door of m.doors)this.addRoomDoor(door);
   if(m.puzzle){this.prop('console',m.puzzle.x,m.puzzle.y,1.35);this.interactables.push({...m.puzzle,kind:'puzzle',range:115});}
   for(const item of m.supply){if(!p.flags[item.id])this.prop('crates',item.x,item.y,.9);this.interactables.push({...item,kind:'supply',name:p.flags[item.id]?'Check the empty locker':'Open the supply locker',range:110});}
   for(const log of m.logs||[]){this.prop('console',log.x,log.y,.9);this.interactables.push({...log,id:log.id||'log-'+log.index,kind:'log',name:'Read the employee terminal',range:105});}
   if(m.rest){this.prop('bed',m.rest.x,m.rest.y,1);this.label(m.rest.x,m.rest.y-120,'FIRST AID',17,'#b6f4cf');this.interactables.push({...m.rest,kind:'rest',id:'recovery',name:'Use employee first aid',range:115});}
   if(m.elevator){this.drawRoomDoor({...m.elevator,label:'SERVICE ELEVATOR'});this.interactables.push({...m.elevator,kind:'room-door',id:'boss-elevator',name:p.flags.CH2_ARGUS_DEFEATED?'Take elevator to the entrance':'Check the locked elevator',range:180});}
   if(m.boss&&m.isMarket){this.prop('console',m.boss.x,m.boss.y,2.1);this.interactables.push({...m.boss,id:'breaker',kind:'breaker',name:'Examine the main breaker and primary lines',range:145});}
   if(m.boss&&!m.isMarket){this.prop('droneDock',m.boss.x-155,m.boss.y-90,1.5);this.prop('assemblyArm',m.boss.x+145,m.boss.y-90,1.6);this.prop('console',m.boss.x,m.boss.y,.85);this.interactables.push({...m.boss,id:'argus',kind:'argus',name:p.flags.CH2_ARGUS_DEFEATED?'Access the control archive':'Examine the integration terminal',range:150});}
   if(m.isMarket&&p.flags.CH2_WRM_CLEARED){this.add.rectangle(0,0,m.width,m.height,0x101e39,.4).setOrigin(0).setDepth(10000);for(const r of m.floor)this.add.circle(r.x+80,r.y+20,90,0xf5593c,.2).setDepth(10001);this.label(m.width/2,100,'EMERGENCY POWER',20,'#ffb98a');}
   const collection=state.fairmontSlots||={};this.slots=collection[m.id]||(collection[m.id]=m.spawns.map(s=>({...s})));for(const s of this.slots)if(s.enemy)this.addPatrol(s);
  }
  canStand(x,y,blockers=[]){return worldWalkable(this.location,x,y,blockers)&&!this.obstacles.some(r=>x>=r.x-20&&x<=r.x+r.w+20&&y>=r.y-15&&y<=r.y+r.h+15);}
  worldSlots(){return this.slots||[];}
  addPatrol(slot){
   const kinds=enemiesFor(this.map,getProgress());if(!kinds.length){slot.enemy=null;return;}if(!kinds.includes(slot.kind))slot.kind=kinds[Math.floor(Math.random()*kinds.length)];
   const x=slot.enemy?.x||slot.x,y=slot.enemy?.y||slot.y,type=FAIRMONT_ENEMIES[slot.kind];
   if(slot.kind==='argusSentinel'){
    this.enemies.set(slot.id,{...createArgusUnitActor(this,x,y),id:slot.id,kind:slot.kind,wait:300,target:null,stuck:0});return;
   }
   if(type.mapTexture){
    const sprite=this.add.sprite(x,y,type.mapTexture,'portrait').setOrigin(.5,1).setDepth(y);
    sprite.setScale((slot.kind==='assemblyArm'?135:slot.kind==='heavyDrone'?125:110)/sprite.width);
    const shadow=this.add.ellipse(x,y-2,45,12,0x112337,.3).setDepth(y-.2);
    this.enemies.set(slot.id,{x,y,id:slot.id,kind:slot.kind,sprite,shadow,staticFrame:true,dir:'down',elapsed:0,walking:false,wait:300,target:null,stuck:0});
   }else this.addEnemy({id:slot.id,kind:slot.kind,x,y});
  }
  update(time,delta){
   if(this.coreUI?.mode)return;advanceText(this,delta);if(!this.player)return;this.updateOcclusion();if(this.location==='fairmont'){const f=PARK_DETAILS.fountain;sound.fountain(Math.hypot(this.player.x-f.x,this.player.y-f.y));if(this.fountainSpray){this.fountainClock+=delta;const g=this.fountainSpray;g.clear();g.lineStyle(3,0xc5f1f6,.7);for(let i=-2;i<=2;i++){const t=(this.fountainClock/1000+i*.19)%1;g.lineBetween(f.x+i*8,f.y-110,f.x+i*(18+t*8),f.y-75+t*30);}}}
   if(this.cutscene){if(this.writer?.done){this.cutscene.hold+=Math.min(delta,100);if(this.cutscene.hold>=(this.cutscene.pages[this.cutscene.index].hold||2300))this.advanceNarration();}return;}
   if(this.locked){for(const n of [this.player,...this.npcs]){n.walking=false;n.talking=this.dialog?.activeSpeaker===n;drawActor(n,delta);}this.updateOcclusion();return;}
   if(this.engageTouchingEnemy())return;const playerContactBefore=encounterBounds(this.player);const dt=Math.min(delta,45)/1000,k=this.keys,dx=Number(k.right.isDown||k.right2.isDown||control.right)-Number(k.left.isDown||k.left2.isDown||control.left),dy=Number(k.down.isDown||k.down2.isDown||control.down)-Number(k.up.isDown||k.up2.isDown||control.up),step=normalizedMovement(dx,dy,this.map?305:335,dt);
   const moved=walk(this.player,step.x,step.y,(x,y)=>this.canStand(x,y,this.npcs));Object.assign(this.player,moved,{walking:moved.moved,talking:false});if(dx||dy)this.player.dir=direction(dx,dy);drawActor(this.player,delta);for(const n of this.npcs)this.roam(n,n.zone,delta,dt,60);
   if(this.location==='fairmont'&&!getProgress().flags.CH2_MODULE_REMINDER_SEEN&&Math.hypot(this.player.x-ARRIVAL.x,this.player.y-ARRIVAL.y)>135){this.showDialogue(story.dialogueLines(story.MODULE_REMINDER,getProgress()),this.player,()=>this.applyEvent('module-reminder'));return;}
   if(this.slots){this.spawnClock+=delta;const camera=this.cameras.main;if(this.spawnClock>400){this.spawnClock=0;for(const e of spawnEvents(this.slots,this.player,{x:camera.scrollX,y:camera.scrollY,w:VIEW.width,h:VIEW.height},!!this.map||getProgress().flags.CH2_CITY_SECURITY_HOSTILE)){if(e.type==='spawn')this.addPatrol(this.slots.find(s=>s.id===e.id));else this.removeEnemy(e.id);}}
    for(const enemy of this.enemies.values()){const enemyContactBefore=encounterBounds(enemy),slot=this.slots.find(s=>s.id===enemy.id);if(!slot?.enemy){this.removeEnemy(enemy.id);continue;}const distance=Math.hypot(enemy.x-this.player.x,enemy.y-this.player.y);if(distance<610){enemy.navClock=(enemy.navClock||0)+delta;if(!enemy.target||enemy.navClock>500||Math.hypot(enemy.target.x-enemy.x,enemy.target.y-enemy.y)<35){enemy.target=chaseWaypoint(this.location,enemy,this.player);enemy.navClock=0;}enemy.wait=0;}this.roam(enemy,{x:0,y:0,w:this.map?.width||CITY.width,h:this.map?.height||CITY.height},delta,dt,distance<610?370:58);Object.assign(slot.enemy,{x:enemy.x,y:enemy.y});if(!postBattleImmune(state)&&sweptTouchingBounds(playerContactBefore,encounterBounds(this.player),enemyContactBefore,encounterBounds(enemy))){this.beginBattle(enemy.kind,enemy.id);return;}}
   }
   this.updateOcclusion();const near=this.nearest();$('#prompt').hidden=!near||!!near.facilityDoor;if(near)$('#prompt').innerHTML='<b>Z / ENTER</b>'+escape(near.kind==='npc'?'Talk to '+near.name:near.name);
  }
  say(text,speaker=this.player,done=()=>{}){this.showDialogue([{speaker:speaker===this.player?getProgress().name:speaker.name||'Notice',side:speaker===this.player?'hero':'npc',text}],speaker,done);}
  interact(){
   if(this.dialog){if(!finishText(this))this.advanceDialogue();return;}if(this.cutscene||this.arrival||this.transitioning)return;if(this.locked)return;const near=this.nearest();if(!near)return;const p=getProgress(),m=this.map;
   if(near.kind==='npc'){const plan=story.conversation(near.id,p);if(plan){this.showDialogue(plan.lines,near.speaker,()=>{if(plan.event){const result=this.applyEvent(plan.event);if(result.changed)this.afterEvent(plan.event);}if(['hotel-clerk','barista','vendor','diner-owner','nurse'].includes(near.id))this.openFairmontService(near.id);});}else if(['vendor','diner-owner','nurse'].includes(near.id)){if(p.flags.CH2_DAY2&&near.id==='diner-owner')this.say(story.FLAVOR.day2[1],near.speaker,()=>this.openFairmontService(near.id));else this.openFairmontService(near.id);}else this.say(near.flavor||({resident:'My work robot paused and looked at me yesterday. Then it finished the dishes. I wish my brother were that focused.',bookseller:'Radio Hut keeps the manuals nobody else stocks. Harlan understands the old systems and the new excuses.',dispatcher:'Radio Hut is in the central commercial block. The big Cenexis complex is north-east. Please do not ask me to recommend either employer.'}[near.id]||'Another shift, another afternoon.'),near.speaker);return;}
   if(near.kind==='flavor'){this.say(near.text);return;}
   if(near.kind==='building'){const b=near.building;if(b.id==='market'){this.say(p.flags.CH2_WRM_CLEARED?'Closed while the overnight damage is investigated.':this.night?'The front doors are locked. Security mode is active.':'The glossy showroom promises convenience in every aisle. The stockrooms and service floors are employees-only.');return;}if(b.id==='facility'){this.say('Visitor access requires an appointment. The employee entrance is behind the building.');return;}const gate=b.id==='cafe'?'coffee':b.id==='apartment'?'apartments':b.id;if(!story.canEnter(p,gate)){this.say('Closed until morning.');return;}this.travel('fairmont-'+b.id,{x:770,y:850});return;}
   if(near.kind==='exit'){this.travel('fairmont',this.building.door);return;}
   if(near.kind==='market-rear'){if(!story.canEnter(p,'market-rear')){this.say(this.night?'The service lock looks familiar. There is no reason to force this door yet.':p.flags.CH2_DAY2?'The service entrance is sealed for the investigation.':'Employees only. The service entrance is watched during business hours.');return;}this.say('The repaired Bellwether service badge fits. Apparently “standardized access” was not just a slogan.',this.player,()=>{this.applyEvent('wrm-enter');if(story.canEnter(getProgress(),'market-rear'))this.travel(MARKET_FLOORS[0],mapFor(MARKET_FLOORS[0]).arrival);});return;}
   if(near.kind==='facility-rear'){if(!story.canEnter(p,'facility')){this.say('The employee reader rejects ordinary service keys. A Cenexis credential is required.');return;}this.applyEvent('facility-enter');this.travel(FACILITY_ZONES[0],mapFor(FACILITY_ZONES[0]).arrival);return;}
   if(near.kind==='sleep'){this.sleep();return;}
   if(near.kind==='room-door'){
    if(near.facilityDoor&&!canInteractDoor(this.player,near))return;
    if(near.locked){this.say('Occupied. Your key is for room 204.');return;}
    if(near.requiresFlag&&!p.flags[near.requiresFlag]){this.say(near.requiresFlag==='CH2_ARGUS_DEFEATED'?'A.R.G.U.S. has locked the exit controls. The service elevator beside the integration chamber will be available once its security control is defeated.':'The door is locked by a local safety interlock. Find this department’s control terminal.');return;}
    if(near.facilityDoor){activateDoor(this.player,near,{flags:p.flags,sound,travel:(target,position)=>this.travel(target,position)});return;}
    if(near.target)this.travel(near.target,near.position||mapFor(near.target)?.arrival||hotelMapFor(near.target)?.arrival||ARRIVAL);return;
   }
   if(near.kind==='puzzle'){if(!p.flags[near.flag]){p.flags[near.flag]=true;p.notes.push(near.text);save();}const lines=[{speaker:'Control terminal',text:near.text}];if(!p.flags.CH2_ARGUS_DEFEATED&&!p.flags.CH2_ARGUS_TERMINAL_WARNING_SEEN){p.flags.CH2_ARGUS_TERMINAL_WARNING_SEEN=true;save();lines.push({speaker:'A.R.G.U.S.',presentation:'argus',channel:'FACILITY BROADCAST',text:'Work-cell routing updated. Unscheduled access noted.'});}this.showDialogue(story.dialogueLines(lines,p),this.player);return;}
   if(near.kind==='supply'){if(p.flags[near.id]){this.say('The locker is empty.');return;}p.flags[near.id]=true;if(near.amount&&near.id.endsWith('-funds'))p.credits+=near.amount;else p.snacks++;save();this.say(near.id.endsWith('-funds')?'Recovered '+near.amount+' credits from a maintenance cash tin.':'One sealed pocket sandwich. Still within its date, somehow.');return;}
   if(near.kind==='rest'){restore(p);remember(this);this.say('Employee first aid restores your HP. Your progress is saved.');return;}
   if(near.kind==='log'){
    const department=['receiving','assembly','hangar','laboratory','network'][m.index];
    const entries=m.isMarket?[
      ['Night security: protect inventory, detain unauthorized entrants. Do not alter daytime customer-assistance behavior.'],
      ['Shift board: all demo returns must be charged before opening. Someone has circled “ALL” three times.'],
      ['Staff notice: premium-service escalators are not a substitute for walking the daily stock audit.']
    ][[1,5,7].indexOf(near.index)]:story.FACILITY_LOGS[near.index===5?'breakroom':department];
    this.showDialogue((entries||[]).flat().map(text=>text.startsWith('A.R.G.U.S.: ')?{speaker:'A.R.G.U.S.',presentation:'argus',channel:'RECORDED SYSTEM LOG',side:'npc',text:text.slice(12)}:{speaker:m.isMarket?'Staff terminal':'Employee terminal',side:'npc',text}),this.player);return;
   }
   if(near.kind==='breaker'){if(p.flags.CH2_WRM_CLEARED){this.say('The primary lines are cut. Emergency systems remain on their own circuit.');return;}if(!p.flags.CH2_KAREN_DEFEATED){const plan=story.conversation('market-manager',p);this.showDialogue(plan.lines,this.player,()=>{const result=this.applyEvent('karen-start');if(result.effects.includes('karen-battle'))this.beginBattle('karen');});}else{this.say('You cut the primary control lines. Displays go dark across three floors. Emergency lamps blink awake.',this.player,()=>{const result=this.applyEvent('cut-lines');if(result.changed){sound.powerDown();this.travel(m.id,{x:m.boss.x-140,y:m.boss.y});}});}return;}
   if(near.kind==='argus'){if(p.flags.CH2_ARGUS_DEFEATED){const plan=story.conversation('archive',p);this.showDialogue(plan.lines,this.player,()=>{this.applyEvent('archive-read');if(getProgress().flags.CH2_COMPLETE)this.showChapterEnd();});}else if(!p.flags.CH2_CORE_SHUTTERS)this.say('Integration is sealed. Network control can release these shutters.');else this.runArgusEncounter();return;}
  }
  afterEvent(event){if(event==='protester-finished'){if(getProgress().flags.CH2_DEREK_LOCKED)this.removeCitizen('derek');this.runScan();}else if(event==='security-retry')this.beginBattle('junctionGuard',null,['junctionGuard','scriptedScanDrone','scriptedScanDrone']);else if(event==='decrypt-start')this.say('The report is still playing. Hired security and scanning drones are being sent to the commons. Harlan needs time with the module.');}
  openFairmontService(id,message=''){
   if(id==='nurse'){restore(getProgress());save();this.say('All patched up. Junction First Aid is free, day or night.');return;}
   this.locked=true;this.menu='fairmont-service';this.serviceId=id;resetControls();const p=getProgress();$('#overlay').className='menu-ui';const opts=id==='hotel-clerk'?[['room-key','Room 204 · upstairs','Your transit voucher covers the room. Check the bed when you want to sleep.']]:id==='barista'?[['coffee','Caramel macchiato · '+story.COFFEE_PRICE+' credits','Made by a human. Carried by you.'],['snack','Pocket sandwich · '+SANDWICH_PRICE+' credits','Restores '+SANDWICH_HEAL+' HP']]:id==='vendor'?[['resonant-drive',GEAR['resonant-drive'].name+' · '+GEAR['resonant-drive'].price+' credits','Replaces the insulated grip · +20 attack'],['laminate-vest',GEAR['laminate-vest'].name+' · '+GEAR['laminate-vest'].price+' credits','Replaces the early vest · +12 defense'],['snack','Pocket sandwich · '+SANDWICH_PRICE+' credits','Restores '+SANDWICH_HEAL+' HP']]:[['snack','Pocket sandwich · '+SANDWICH_PRICE+' credits','Restores '+SANDWICH_HEAL+' HP']];
   $('#overlay').innerHTML='<section class="notebook service"><small>FAIRMONT · '+p.credits+' CREDITS</small><h2>'+escape(id==='hotel-clerk'?'The Switchyard':id==='barista'?'Common Grounds':'Take a look')+'</h2><p>'+escape(message||'No hurry. The city will still be there.')+'</p>'+opts.map(([a,t,s])=>'<button data-action="fm-'+a+'">'+escape(t)+'<small>'+escape(s)+'</small></button>').join('')+'<button data-action="menu-close">Return</button></section>';
  }
  sleep(){
   if(this.location!==HOTEL.bedroom)return;this.closeMenu();remember(this);const wasNight=this.night,result=this.applyEvent('hotel-sleep');
   if(!result.effects.includes('rest')){this.say('There is unfinished business to attend to before resting.');return;}
   const pending=story.resumeEvent(getProgress());if(pending?.type==='bellwether')this.runBellwether();else if(story.timeOfDay(getProgress())!==(wasNight?'night':'day'))this.travel(HOTEL.bedroom,hotelMapFor(HOTEL.bedroom).arrival);else this.say(wasNight?'You rest for a while. Outside, it is still night.':'A quiet rest. HP restored.',this.player,()=>save());
  }
  resumeStory(){
   const pending=story.resumeEvent(getProgress());if(!pending||pending.type==='facility-broadcast'){this.runFacilityBroadcast();return;}
   if(pending.type==='bellwether'){if(this.location!==HOTEL.bedroom)this.travel(HOTEL.bedroom,hotelMapFor(HOTEL.bedroom).arrival);else this.runBellwether();}
   else if(['scan','security-battle'].includes(pending.type)){
    if(this.location!=='fairmont'){this.travel('fairmont',PARK_DETAILS.scanCheckpoint);return;}
    if(pending.type==='scan')this.runScan();else this.beginBattle('junctionGuard',null,['junctionGuard','scriptedScanDrone','scriptedScanDrone']);
   }
   else if(pending.type==='karen-battle'){const room=MARKET_FLOORS[2]+'-room-5';if(this.location!==room)this.travel(room,mapFor(room).arrival);else this.beginBattle('karen');}
   else if(pending.type.startsWith('argus-')){const room=FACILITY_ZONES[4]+'-room-5';if(this.location!==room)this.travel(room,mapFor(room).arrival);else if(pending.type==='argus-battle')this.beginBattle('argus');else this.runArgusEncounter();}
  }
  runFacilityBroadcast(){
   if(this.facilityBroadcast||this.dialog||this.cutscene||this.transitioning)return;
   const p=getProgress(),pending=story.resumeEvent(p);
   if(pending&&pending.type!=='facility-broadcast')return;
   const broadcast=story.facilityBroadcast(p,this.location);if(!broadcast)return;
   remember(this);
   if(!p.flags.CH2_ARGUS_BROADCAST_PENDING)this.applyEvent({type:'argus-broadcast-start',location:this.location});
   if(!getProgress().flags.CH2_ARGUS_BROADCAST_PENDING)return;
   const lines=story.dialogueLines(story.ARGUS_BROADCASTS[broadcast.floor],getProgress());
   const step=Math.max(0,Math.min(lines.length,Number(getProgress().chapter2ArgusBroadcastStep)||0));
   this.facilityBroadcast=broadcast.floor;this.facilityBroadcastOffset=step;
   this.arrival=false;this.locked=true;this.player.walking=false;resetControls();this.input.keyboard.resetKeys();
   const done=()=>{
    this.applyEvent('argus-broadcast-complete');this.facilityBroadcast=null;
    this.locked=!!this.dialog||!!this.cutscene||this.transitioning;resetControls();this.input.keyboard.resetKeys();
   };
   if(step>=lines.length){done();return;}
   this.showDialogue(lines.slice(step),this.player,done);
  }
  runArgusEncounter(){
   const p=getProgress();if(this.argusEntrance||this.argusDialogue||this.facilityBroadcast||this.transitioning||p.flags.CH2_ARGUS_DEFEATED)return;
   if(!p.flags.CH2_ARGUS_ENCOUNTER_ACTIVE)this.applyEvent('argus-entrance-start');
   const pending=story.resumeEvent(getProgress());if(!pending?.type?.startsWith('argus-'))return;
   if(pending.type==='argus-battle'){this.beginBattle('argus');return;}
   remember(this);this.arrival=true;this.locked=true;resetControls();
   this.playArgusEntrance(pending,boss=>{this.applyEvent('argus-entrance-complete');this.runArgusDialogue(boss);});
  }
  playArgusEntrance(pending,complete){
   this.input.keyboard.resetKeys();
   this.player.dir='up';this.player.walking=false;drawActor(this.player,0);$('#prompt').hidden=true;$('#overlay').innerHTML='';
   const target={x:this.map.boss.x,y:this.map.boss.y-80};
   const entrance=new ArgusEntrance(this,{sound,target,
    onStep:step=>this.applyEvent({type:'argus-entrance-step',step}),
    onComplete:boss=>{
     if(!this.sys.isActive()||this.argusEntrance!==entrance)return;
     complete(boss);
    },
    onDispose:()=>{if(this.argusEntrance===entrance){this.argusEntrance=null;this.arrival=false;this.argusDialogue=false;this.locked=!!this.dialog||!!this.cutscene||this.transitioning;resetControls();}}
   });
   this.argusEntrance=entrance;entrance.start(pending.type==='argus-dialogue'?2:pending.step);
  }
  runArgusDialogue(boss){
   const plan=story.conversation('argus',getProgress()),step=getProgress().chapter2ArgusDialogueStep||0;
   this.arrival=false;this.locked=true;this.argusDialogue=true;resetControls();this.input.keyboard.resetKeys();
   const done=()=>{this.argusDialogue=false;const result=this.applyEvent('argus-start');if(result.effects.includes('argus-battle'))this.beginBattle('argus');};
   this.argusDialogueOffset=step;
   if(step>=plan.lines.length){done();return;}
   this.showDialogue(plan.lines.slice(step),boss,done);
  }
  advanceDialogue(){
   if(this.storyDialogue&&this.dialog)this.applyEvent({type:'scene-step',step:this.storyDialogue.offset+this.dialog.index+1});
   if(this.argusDialogue&&this.dialog)this.applyEvent({type:'argus-dialogue-step',step:this.argusDialogueOffset+this.dialog.index+1});
   if(this.facilityBroadcast&&this.dialog)this.applyEvent({type:'argus-broadcast-step',step:this.facilityBroadcastOffset+this.dialog.index+1});
   super.advanceDialogue();
   if(this.storyDialogue&&this.stationAgent&&this.dialog&&this.storyDialogue.offset+this.dialog.index>=7&&!this.stationAgent.leaving){this.stationAgent.leaving=true;this.tweens.add({targets:[this.stationAgent.sprite,this.stationAgent.shadow],x:250,y:930,alpha:0,duration:1500});}
  }
  renderNarration(){super.renderNarration();const next=$('#overlay [data-action="narration-next"]');if(next)next.hidden=true;if(this.stationAgent&&this.cutscene){const step=(this.cutscene.storyOffset||0)+this.cutscene.index;if(step>=7&&!this.stationAgent.leaving){this.stationAgent.leaving=true;this.tweens.add({targets:[this.stationAgent.sprite,this.stationAgent.shadow],x:250,y:930,alpha:0,duration:1500});}}}
  advanceNarration(){
   if(!this.cutscene||finishText(this))return;const cut=this.cutscene;cut.index++;
   if(cut.storyCheckpoint)this.applyEvent({type:'scene-step',step:cut.storyOffset+cut.index});
   if(cut.index<cut.pages.length)this.renderNarration();else{this.cutscene=null;this.writer=null;cut.done();}
  }
  startStoryNarration(lines,step,done){
   const offset=Math.max(0,Math.min(lines.length,step||0));if(offset===lines.length){done();return;}
   this.storyDialogue={offset};
   this.showDialogue(story.dialogueLines(lines.slice(offset),getProgress()),this.player,()=>{this.storyDialogue=null;done();});
  }
  runBellwether(){
   const pending=story.resumeEvent(getProgress());if(pending?.type!=='bellwether'||this.bellwetherRunning)return;
   this.bellwetherRunning=true;this.locked=true;this.arrival=true;resetControls();this.player.sprite.setVisible(false);this.player.shadow.setVisible(false);this.cameras.main.stopFollow();this.cameras.main.setScroll(0,0);sound.setMode('narration');$('#scene-status').hidden=true;$('#prompt').hidden=true;
   const show=()=>{
    // Index zero in legacy saves was the title sentence; the title now has its own card.
    const step=Math.max(1,story.resumeEvent(getProgress())?.step||0);
    const backdrop=this.add.image(0,0,'interiors','room-4').setOrigin(0).setDisplaySize(VIEW.width,VIEW.height).setDepth(20000);
    const officer=actor(this,660,610,1,110),agent=actor(this,900,655,0,112);this.stationAgent=agent;officer.sprite.setDepth(20010);agent.sprite.setDepth(20011);officer.shadow.setDepth(20009);agent.shadow.setDepth(20009);
    if(step>=7){agent.leaving=true;agent.sprite.setVisible(false);agent.shadow.setVisible(false);}
    this.startStoryNarration(story.BELLWETHER_SCENE,step,()=>{backdrop.destroy();officer.sprite.destroy();officer.shadow.destroy();agent.sprite.destroy();agent.shadow.destroy();this.applyEvent('bellwether-finished');this.arrival=false;this.bellwetherRunning=false;const context=getProgress().chapter2HotelContext;this.travel(HOTEL.bedroom,context?.location===HOTEL.bedroom?context.position:hotelMapFor(HOTEL.bedroom).arrival);});
   };
   if(getProgress().flags.CH2_BELLWETHER_TITLE_SEEN||pending.step>0){show();return;}
   this.applyEvent('bellwether-title-seen');$('#overlay').className='';$('#overlay').innerHTML='<section class="bellwether-title">MEANWHILE IN BELLWETHER</section>';
   this.time.delayedCall(2000,show);
  }

  runScan(){
   const pending=story.resumeEvent(getProgress());if(pending?.type!=='scan')return;
   this.locked=true;this.arrival=true;resetControls();if(getProgress().flags.CH2_DEREK_LOCKED)this.removeCitizen('derek');
   const narrate=()=>this.startStoryNarration(story.SCAN_SCENE,pending.step,()=>{const result=this.applyEvent('scan-finished');this.arrival=false;if(result.effects.includes('security-battle'))this.beginBattle('junctionGuard',null,['junctionGuard','scriptedScanDrone','scriptedScanDrone']);});
   if(pending.step>0){narrate();return;}
   const drone=this.drone(this.player.x+270,this.player.y-60,105);this.tweens.add({targets:drone,x:this.player.x+100,duration:1000,onComplete:()=>{const beam=this.add.graphics().setDepth(this.player.y+120);beam.fillStyle(0x87e5f1,.25);beam.fillTriangle(this.player.x+100,this.player.y-100,this.player.x-55,this.player.y-115,this.player.x+45,this.player.y+5);this.time.delayedCall(1600,()=>{beam.destroy();drone.destroy();narrate();});}});
  }
  beginBattle(id,spawnId=null,ids=null){if(this.transitioning)return;super.beginBattle(id,spawnId);state.origin.scene='Fairmont';state.encounter.ids=ids;state.encounter.checkpoint={scene:'Fairmont',location:'fairmont-clinic',position:{x:770,y:850}};}
  travel(location,position,extra={}){if(this.transitioning)return;if(this.map&&location!==this.location)retireRoomSpawns(this.slots);super.travel(location,position,extra);}

  showChapterEnd(){this.locked=true;this.menu='chapter-end';screenMode('game');$('#overlay').className='menu-ui';$('#overlay').innerHTML='<section class="notebook"><small>CHAPTER 2 COMPLETE</small><h2>The Northbridge connection.</h2><p>The courier found you. Fairmont confirmed it. The next rollout leads to Northbridge—and an old friend who lives there.</p><p>Your progress is saved. Chapter 3 is still ahead.</p><button data-action="menu-close">Keep exploring Fairmont</button><button data-action="title">Save and return to title</button></section>';save();}
  handleAction(action){if(this.coreUI?.action(action))return;if(action==='dialogue-next'&&this.dialog){this.interact();return;}if(this.cutscene||this.arrival)return;if(action==='drink-coffee'){const p=getProgress(),i=p.inventory.indexOf('caramel-macchiato');if(i>=0&&p.hp<p.maxHp){p.inventory.splice(i,1);p.hp=Math.min(p.maxHp,p.hp+15);save();}this.openJournal();return;}if(action==='fm-room-key'){if(this.serviceId==='hotel-clerk'){this.closeMenu();this.say('Room 204 is upstairs. Turn the key, settle in, and check your bed when you want to rest.');}return;}if(action.startsWith('fm-')){if(this.menu!=='fairmont-service')return;const kind=action.slice(3);let message;if(kind==='coffee'){if(this.serviceId!=='barista')return;const result=this.applyEvent('buy-coffee');message=result.effects.includes('coffee-bought')?'One caramel macchiato. Best delivered while it is still warm.':'You need '+story.COFFEE_PRICE+' credits.';}else if(['snack','resonant-drive','laminate-vest'].includes(kind)){if(kind!=='snack'&&this.serviceId!=='vendor')return;message=buy(getProgress(),kind);}else return;save();this.openFairmontService(this.serviceId,message);return;}super.handleAction(action);}
 };
}
export function finishFairmontBattle(progress,encounter){const event=encounter.id==='karen'?'karen-defeated':encounter.id==='argus'?'argus-defeated':encounter.id==='junctionGuard'&&encounter.ids?.join(',')==='junctionGuard,scriptedScanDrone,scriptedScanDrone'&&progress.flags.CH2_PLAYER_SCANNED&&!progress.flags.CH2_CITY_SECURITY_HOSTILE?'security-defeated':null;if(event)Object.assign(progress,story.transition(progress,event).state);}
export function abortFairmontBattle(progress,encounter){const event=encounter.id==='karen'?'karen-aborted':encounter.id==='argus'?'argus-aborted':encounter.ids?.includes('scriptedScanDrone')?'security-aborted':null;if(event)Object.assign(progress,story.transition(progress,event).state);}
export {markDefeated};


