import test from 'node:test';
import assert from 'node:assert/strict';
import {createFairmontScene,finishFairmontBattle,abortFairmontBattle} from '../fairmont/scene.mjs';
import {createChapterProgress} from '../city/chapter-start.mjs';
import {HOTEL,HOTEL_LOCATIONS,ROOM_LOCATIONS,MARKET_FLOORS,FACILITY_ZONES,mapFor,hotelMapFor,dungeonRoomId} from '../fairmont/world.mjs';
import {transition,timeOfDay,resumeEvent} from '../fairmont/story.mjs';

function harness(progress=createChapterProgress(2)){
 const events=[],state={};
 class Base{
  init(){this.cutscene=null;this.arrival=false;this.transitioning=false;this.dialog=null;this.locked=false;}
  closeMenu(){this.menu=null;this.locked=false;}
 }
 const Scene=createFairmontScene({Base,getProgress:()=>progress,state,save(){events.push({type:'save'});},remember(scene){progress.location=scene.location;progress.position={x:scene.player.x,y:scene.player.y};},resetControls(){},finishText(){return false;},sound:{powerDown(){events.push({type:'power-down'});}}});
 const scene=new Scene();scene.init({location:progress.location,position:progress.position});scene.player={...progress.position,name:progress.name};scene.night=timeOfDay(progress)==='night';
 scene.travel=(location,position)=>events.push({type:'travel',location,position});scene.beginBattle=(id,spawnId,ids)=>events.push({type:'battle',id,spawnId,ids});
 scene.showDialogue=(lines,speaker,done)=>{events.push({type:'dialogue',lines});done?.();};scene.say=(text,speaker,done)=>{events.push({type:'say',text});done?.();};
 scene.openFairmontService=id=>events.push({type:'service',id});scene.runBellwether=()=>events.push({type:'meanwhile'});scene.showChapterEnd=()=>events.push({type:'chapter-end'});
 return {scene,events,progress,load(location){scene.location=location;scene.map=mapFor(location);scene.hotel=hotelMapFor(location);scene.night=timeOfDay(progress)==='night';scene.player={...(scene.map||scene.hotel)?.arrival||progress.position,name:progress.name};},interact(target){scene.nearest=()=>target;scene.interact();},event(type){Object.assign(progress,transition(progress,type).state);}};
}
const storyOrder=['module-reminder','radio-bargain','hotel-sleep','bellwether-finished','wrm-enter','karen-start','karen-defeated','cut-lines','hotel-sleep','decrypt-start','guard-heard','protester-finished','scan-finished','security-defeated','keycard','facility-enter'];
const through=last=>{let p=createChapterProgress(2);for(const type of storyOrder.slice(0,storyOrder.indexOf(last)+1))p=transition(p,type).state;return p;};

test('legacy saves with pending bosses move from old floor coordinates into the separate boss room',()=>{
 for(const [boss,event,base,before]of [['karen','karen-start',MARKET_FLOORS[2],'wrm-enter'],['argus','argus-start',FACILITY_ZONES[4],'facility-enter']]){
  const h=harness(through(before));h.event(event);h.load(base);h.scene.resumeStory();
  const room=base+'-room-5';assert.equal(h.events.find(e=>e.type==='travel')?.location,room);
  h.events.length=0;h.load(room);h.scene.resumeStory();assert.equal(h.events.find(e=>e.type==='battle')?.id,boss);
 }
});

test('real door interactions load separate instances and enforce each room interlock',()=>{
 const h=harness();
 for(const location of [...ROOM_LOCATIONS,...HOTEL_LOCATIONS]){
  h.load(location);const m=mapFor(location)||hotelMapFor(location);
  for(const target of [...m.doors,...(m.elevator?[{...m.elevator,kind:'room-door'}]:[])]){
   h.events.length=0;if(target.requiresFlag)delete h.progress.flags[target.requiresFlag];h.interact(target);
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
 facility.interact({kind:'room-door',...room.elevator});assert.equal(facility.events.some(e=>e.type==='travel'),false);
 facility.interact({kind:'argus'});assert.equal(facility.events.some(e=>e.type==='battle'),false);
 facility.progress.flags.CH2_CORE_SHUTTERS=true;facility.interact({kind:'argus'});assert.equal(facility.events.findLast(e=>e.type==='battle').id,'argus');
 finishFairmontBattle(facility.progress,{id:'argus'});facility.interact({kind:'room-door',...room.elevator});assert.equal(facility.events.findLast(e=>e.type==='travel').location,FACILITY_ZONES[0]);
 facility.interact({kind:'argus'});assert.equal(facility.progress.flags.CH2_COMPLETE,true);assert.ok(facility.events.some(e=>e.type==='chapter-end'));
});

test('a scripted defeat can recover at the clinic and resumes only through the guard conversation',()=>{
 const h=harness(through('scan-finished')),encounter={id:'junctionGuard',ids:['junctionGuard','scriptedScanDrone','scriptedScanDrone']};
 abortFairmontBattle(h.progress,encounter);h.load('fairmont-clinic');h.scene.resumeStory();assert.equal(h.events.some(e=>e.type==='battle'||e.type==='travel'),false);assert.equal(resumeEvent(h.progress),null);
 h.load('fairmont');h.interact({kind:'npc',id:'security-guard',speaker:{name:'Contract Security'}});
 assert.deepEqual(h.events.findLast(e=>e.type==='battle').ids,encounter.ids);assert.equal(h.progress.flags.CH2_SECURITY_RETRY_NEEDED,undefined);
 finishFairmontBattle(h.progress,encounter);assert.equal(h.progress.flags.CH2_CITY_SECURITY_HOSTILE,true);
});
