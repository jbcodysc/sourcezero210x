import {doorApproach} from '../city/doors.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createFairmontScene,finishFairmontBattle,abortFairmontBattle} from '../fairmont/scene.mjs';
import {createChapterProgress} from '../city/chapter-start.mjs';
import {HOTEL,HOTEL_LOCATIONS,ROOM_LOCATIONS,MARKET_FLOORS,FACILITY_ZONES,mapFor,hotelMapFor,dungeonRoomId} from '../fairmont/world.mjs';
import {transition,timeOfDay,resumeEvent,ARGUS_SCENE} from '../fairmont/story.mjs';

function harness(progress=createChapterProgress(2)){
 const events=[],state={};
 class Base{
  init(){this.cutscene=null;this.arrival=false;this.transitioning=false;this.dialog=null;this.locked=false;}
  closeMenu(){this.menu=null;this.locked=false;}
  advanceDialogue(){const d=this.dialog;if(++d.index<d.messages.length)return;this.dialog=null;this.locked=false;d.complete?.();}
 }
 const Scene=createFairmontScene({Base,getProgress:()=>progress,state,save(){events.push({type:'save'});},remember(scene){progress.location=scene.location;progress.position={x:scene.player.x,y:scene.player.y};},resetControls(){},finishText(){return false;},sound:{powerDown(){events.push({type:'power-down'});}}});
 const scene=new Scene();scene.init({location:progress.location,position:progress.position});scene.player={...progress.position,name:progress.name};scene.night=timeOfDay(progress)==='night';
 scene.input={keyboard:{resetKeys(){}}};
 scene.travel=(location,position)=>events.push({type:'travel',location,position});scene.beginBattle=(id,spawnId,ids)=>events.push({type:'battle',id,spawnId,ids});
 scene.showDialogue=(lines,speaker,done)=>{events.push({type:'dialogue',lines});if(scene.argusDialogue)scene.dialog={messages:lines,index:0,complete:done};else done?.();};scene.say=(text,speaker,done)=>{events.push({type:'say',text});done?.();};
 scene.playArgusEntrance=(pending,complete)=>{scene.argusEntrance={pending,complete};events.push({type:'entrance',pending});};
 scene.openFairmontService=id=>events.push({type:'service',id});scene.runBellwether=()=>events.push({type:'meanwhile'});scene.showChapterEnd=()=>events.push({type:'chapter-end'});
 return {scene,events,progress,load(location){scene.location=location;scene.map=mapFor(location);scene.hotel=hotelMapFor(location);scene.night=timeOfDay(progress)==='night';scene.player={...(scene.map||scene.hotel)?.arrival||progress.position,name:progress.name};},interact(target){scene.nearest=()=>target;scene.interact();},event(type){Object.assign(progress,transition(progress,type).state);},finishEntrance(){scene.argusEntrance.complete({name:'A.R.G.U.S.',x:850,y:485});},finishDialogue(){while(scene.dialog)scene.advanceDialogue();}};
}
const storyOrder=['module-reminder','radio-bargain','hotel-sleep','bellwether-finished','wrm-enter','karen-start','karen-defeated','cut-lines','hotel-sleep','decrypt-start','guard-heard','protester-finished','scan-finished','security-defeated','keycard','facility-enter'];
const through=last=>{let p=createChapterProgress(2);for(const type of storyOrder.slice(0,storyOrder.indexOf(last)+1))p=transition(p,type).state;return p;};

test('legacy saves with pending bosses move from old floor coordinates into the separate boss room',()=>{
 for(const [boss,event,base,before]of [['karen','karen-start',MARKET_FLOORS[2],'wrm-enter'],['argus','argus-start',FACILITY_ZONES[4],'facility-enter']]){
  const h=harness(through(before));if(boss==='argus')h.progress.flags.CH2_ARGUS_PENDING=true;else h.event(event);h.load(base);h.scene.resumeStory();
  const room=base+'-room-5';assert.equal(h.events.find(e=>e.type==='travel')?.location,room);
  h.events.length=0;h.load(room);h.scene.resumeStory();assert.equal(h.events.find(e=>e.type==='battle')?.id,boss);
 }
});

test('real door interactions load separate instances and enforce each room interlock',()=>{
 const h=harness();
 for(const location of [...ROOM_LOCATIONS,...HOTEL_LOCATIONS]){
  h.load(location);const m=mapFor(location)||hotelMapFor(location);
  for(const target of [...m.doors,...(m.elevator?[{...m.elevator,kind:'room-door'}]:[])]){
   h.events.length=0;if(target.facilityDoor)Object.assign(h.scene.player,doorApproach(target));if(target.requiresFlag)delete h.progress.flags[target.requiresFlag];h.interact(target);
   if(target.requiresFlag){assert.equal(h.events.some(e=>e.type==='travel'),false,`${location}: locked door opened`);h.progress.flags[target.requiresFlag]=true;h.interact(target);}
   assert.equal(h.events.findLast(e=>e.type==='travel')?.location,target.target,`${location}: ${target.id}`);
  }
 }
 h.load(HOTEL.hall);
 for(const target of hotelMapFor(HOTEL.hall).lockedDoors){h.events.length=0;h.interact({...target,kind:'room-door',locked:true});assert.equal(h.events.some(e=>e.type==='travel'),false);assert.match(h.events[0].text,/Occupied/);}
});

test('the hotel clerk never advances time; only the private bed starts meanwhile and the post-market morning',()=>{
 const h=harness();h.event('module-reminder');h.event('radio-bargain');
 h.load(HOTEL.lobby);h.interact({kind:'npc',id:'hotel-clerk',speaker:{name:'Lena Vale'}});
 assert.equal(h.progress.flags.CH2_BELLWETHER_PENDING,undefined);assert.ok(h.events.some(e=>e.type==='service'));
 h.scene.sleep();assert.equal(h.progress.flags.CH2_BELLWETHER_PENDING,undefined,'lobby has no usable bed');
 h.load(HOTEL.bedroom);h.interact({kind:'sleep'});assert.equal(h.progress.flags.CH2_BELLWETHER_PENDING,true);assert.ok(h.events.some(e=>e.type==='meanwhile'));
 assert.equal(h.progress.chapter2HotelContext.location,HOTEL.bedroom);
 h.event('bellwether-finished');h.load(HOTEL.bedroom);h.scene.sleep();assert.equal(timeOfDay(h.progress),'night','sleep cannot bypass sabotage');
 for(const type of ['wrm-enter','karen-start','karen-defeated','cut-lines'])h.event(type);
 h.events.length=0;h.scene.sleep();assert.equal(timeOfDay(h.progress),'day');assert.equal(h.progress.flags.CH2_DAY2,true);
 assert.equal(h.events.findLast(e=>e.type==='travel').location,HOTEL.bedroom);
});

test('real boss interactions require a separate breaker action and release the final lift only after victory',()=>{
 const market=harness(through('wrm-enter'));market.load(dungeonRoomId(MARKET_FLOORS[2],5));
 market.interact({kind:'breaker'});assert.equal(market.events.findLast(e=>e.type==='battle').id,'karen');
 finishFairmontBattle(market.progress,{id:'karen'});assert.equal(market.progress.flags.CH2_KAREN_DEFEATED,true);assert.equal(market.progress.flags.CH2_WRM_CLEARED,undefined);
 market.interact({kind:'breaker'});assert.equal(market.progress.flags.CH2_WRM_CLEARED,true);assert.ok(market.events.some(e=>e.type==='power-down'));
 const facility=harness(through('facility-enter'));facility.load(dungeonRoomId(FACILITY_ZONES[4],5));const room=facility.scene.map;
 Object.assign(facility.scene.player,doorApproach(room.elevator));facility.interact({kind:'room-door',...room.elevator});assert.equal(facility.events.some(e=>e.type==='travel'),false);
 facility.interact({kind:'argus'});assert.equal(facility.events.some(e=>e.type==='battle'),false);
 facility.progress.flags.CH2_CORE_SHUTTERS=true;facility.interact({kind:'argus'});assert.equal(facility.events.some(e=>e.type==='battle'),false);facility.finishEntrance();facility.finishDialogue();assert.equal(facility.events.findLast(e=>e.type==='battle').id,'argus');
 finishFairmontBattle(facility.progress,{id:'argus'});Object.assign(facility.scene.player,doorApproach(room.elevator));facility.interact({kind:'room-door',...room.elevator});assert.equal(facility.events.findLast(e=>e.type==='travel').location,FACILITY_ZONES[0]);
 facility.interact({kind:'argus'});assert.equal(facility.progress.flags.CH2_COMPLETE,true);assert.ok(facility.events.some(e=>e.type==='chapter-end'));
});

test('the real final terminal locks controls, waits for the entrance, then retains dialogue before battle',()=>{
 const h=harness(through('facility-enter'));h.load(dungeonRoomId(FACILITY_ZONES[4],5));h.progress.flags.CH2_CORE_SHUTTERS=true;
 h.interact({kind:'argus'});
 assert.equal(h.progress.flags.CH2_ARGUS_ENTRANCE_STARTED,true);
 assert.equal(h.progress.flags.CH2_ARGUS_ENCOUNTER_ACTIVE,true);
 assert.equal(h.scene.locked,true);assert.equal(h.scene.arrival,true);
 assert.equal(h.events.filter(e=>e.type==='entrance').length,1);
 assert.equal(h.events.some(e=>e.type==='battle'||e.type==='dialogue'),false);
 h.interact({kind:'argus'});h.scene.runArgusEncounter();
 assert.equal(h.events.filter(e=>e.type==='entrance').length,1,'repeated input cannot create another entrance');
 h.finishEntrance();
 assert.equal(h.progress.flags.CH2_ARGUS_ENTRANCE_SEEN,true);
 assert.equal(h.scene.arrival,false,'dialogue input unlocks after the flight');
 assert.equal(h.scene.locked,true,'movement remains locked for dialogue');
 assert.match(h.events.findLast(e=>e.type==='dialogue').lines[0].text,/Autonomous Response, Guidance & Unified Security/);
 assert.equal(h.events.some(e=>e.type==='battle'),false);
 h.scene.advanceDialogue();
 assert.equal(h.progress.chapter2ArgusDialogueStep,1,'the next dialogue line is persisted');
 assert.equal(h.events.some(e=>e.type==='battle'),false);
 h.finishDialogue();
 assert.equal(h.events.filter(e=>e.type==='battle').length,1);
 assert.equal(h.events.findLast(e=>e.type==='battle').id,'argus');
 assert.equal(h.progress.flags.CH2_ARGUS_PENDING,true);
});

test('scene resumes alarm, flight, landing, and dialogue checkpoints in the integration room without opening combat early',()=>{
 const room=dungeonRoomId(FACILITY_ZONES[4],5);
 for(const [type,step]of [['argus-entrance',0],['argus-entrance',1],['argus-entrance',2],['argus-dialogue',2]]){
  const h=harness(through('facility-enter'));h.progress.flags.CH2_CORE_SHUTTERS=true;h.event('argus-entrance-start');
  if(type==='argus-entrance')h.event({type:'argus-entrance-step',step});
  else{h.event('argus-entrance-complete');h.event({type:'argus-dialogue-step',step});}
  h.load('fairmont-facility-5');h.scene.resumeStory();
  assert.equal(h.events.findLast(e=>e.type==='travel').location,room);
  h.events.length=0;h.load(room);h.scene.resumeStory();
  assert.deepEqual(h.events.find(e=>e.type==='entrance').pending,{type,step});
  assert.equal(h.events.some(e=>e.type==='battle'),false);
  h.finishEntrance();
  const lines=h.events.findLast(e=>e.type==='dialogue').lines;
  assert.equal(lines.length,ARGUS_SCENE.length-(type==='argus-dialogue'?step:0));
  h.finishDialogue();assert.equal(h.events.findLast(e=>e.type==='battle').id,'argus');
 }
});

test('an A.R.G.U.S. defeat waits at the clinic and an explicit terminal retry skips the already seen flight',()=>{
 const h=harness(through('facility-enter'));h.progress.flags.CH2_CORE_SHUTTERS=true;
 h.event('argus-entrance-start');h.event('argus-entrance-complete');h.event('argus-start');
 abortFairmontBattle(h.progress,{id:'argus'});h.load('fairmont-clinic');h.scene.resumeStory();
 assert.equal(resumeEvent(h.progress),null);assert.equal(h.events.some(e=>['battle','travel','entrance'].includes(e.type)),false);
 h.load(dungeonRoomId(FACILITY_ZONES[4],5));h.interact({kind:'argus'});
 assert.equal(h.events.findLast(e=>e.type==='entrance').pending.type,'argus-dialogue');
 h.finishEntrance();h.finishDialogue();assert.equal(h.events.findLast(e=>e.type==='battle').id,'argus');
});

test('a scripted defeat can recover at the clinic and resumes only through the guard conversation',()=>{
 const h=harness(through('scan-finished')),encounter={id:'junctionGuard',ids:['junctionGuard','scriptedScanDrone','scriptedScanDrone']};
 abortFairmontBattle(h.progress,encounter);h.load('fairmont-clinic');h.scene.resumeStory();assert.equal(h.events.some(e=>e.type==='battle'||e.type==='travel'),false);assert.equal(resumeEvent(h.progress),null);
 h.load('fairmont');h.interact({kind:'npc',id:'security-guard',speaker:{name:'Contract Security'}});
 assert.deepEqual(h.events.findLast(e=>e.type==='battle').ids,encounter.ids);assert.equal(h.progress.flags.CH2_SECURITY_RETRY_NEEDED,undefined);
 finishFairmontBattle(h.progress,encounter);assert.equal(h.progress.flags.CH2_CITY_SECURITY_HOSTILE,true);
});


test('Argus terminal warning happens once across computers and saved scenes while controls still unlock',()=>{
 const h=harness(through('facility-enter'));
 const first=mapFor(FACILITY_ZONES[0]+'-room-4').puzzle,second=mapFor(FACILITY_ZONES[1]+'-room-4').puzzle;
 h.interact({...first,kind:'puzzle'});assert.equal(h.events.findLast(e=>e.type==='dialogue').lines.filter(l=>l.speaker==='A.R.G.U.S.').length,1);
 assert.equal(h.progress.flags[first.flag],true);h.interact({...first,kind:'puzzle'});assert.equal(h.events.findLast(e=>e.type==='dialogue').lines.length,1);
 const loaded=harness(JSON.parse(JSON.stringify(h.progress)));loaded.interact({...second,kind:'puzzle'});
 assert.equal(loaded.events.findLast(e=>e.type==='dialogue').lines.length,1);assert.equal(loaded.progress.flags[second.flag],true);
});
