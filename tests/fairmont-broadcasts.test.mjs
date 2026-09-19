import test from 'node:test';
import assert from 'node:assert/strict';
import {createChapterProgress} from '../city/chapter-start.mjs';
import {SaveSlots} from '../city/save-slots.mjs';
import {ARGUS_BROADCASTS,ARGUS_SCENE,argusBroadcastFlag,facilityBroadcast,dialogueLines,resumeEvent,transition} from '../fairmont/story.mjs';
import {createFairmontScene,abortFairmontBattle,finishFairmontBattle} from '../fairmont/scene.mjs';
import {mapFor} from '../fairmont/world.mjs';
import {enemiesFor} from '../fairmont/enemies.mjs';

function ready(floor=2,room=0){
 const p=createChapterProgress(2,'Morgan');
 Object.assign(p.flags,{CH2_DRONE_FACILITY_ENTERED:true,CH2_DRONE_KEYCARD:true,CH2_CITY_SECURITY_HOSTILE:true,CH2_CORE_SHUTTERS:true});
 p.location='fairmont-facility-'+floor+(room?'-room-'+room:'');p.position={...mapFor(p.location).arrival};return p;
}
function apply(p,event){return transition(p,event).state;}
function reloaded(p){
 const storage={data:null,getItem(){return this.data;},setItem(key,data){this.data=data;}};
 assert.equal(new SaveSlots(storage).write(0,p),true);
 return new SaveSlots(storage).read(0);
}
function complete(p){
 const count=ARGUS_BROADCASTS[p.chapter2ArgusBroadcastFloor].length;
 p=apply(p,{type:'argus-broadcast-step',step:count});return apply(p,'argus-broadcast-complete');
}
function harness(progress){
 const events=[],state={};
 class Base{
  init(){this.locked=false;this.dialog=null;this.cutscene=null;this.arrival=false;this.transitioning=false;}
  advanceDialogue(){const d=this.dialog;if(++d.index<d.messages.length)return;this.dialog=null;this.locked=false;d.complete();}
 }
 const Scene=createFairmontScene({Base,getProgress:()=>progress,state,save(){events.push('save');},remember(scene){progress.location=scene.location;progress.position={x:scene.player.x,y:scene.player.y};},resetControls(){events.push('reset-controls');},finishText(){return false;}});
 const scene=new Scene();scene.init({location:progress.location,position:progress.position});scene.player={...progress.position,walking:true};
 scene.input={keyboard:{resetKeys(){events.push('reset-keys');}}};
 scene.showDialogue=(messages,speaker,complete)=>{scene.locked=true;scene.dialog={messages,index:0,speaker,complete};events.push('dialogue');};
 scene.beginBattle=()=>events.push('battle');scene.travel=()=>events.push('travel');
 scene.runArgusEncounter=()=>events.push('boss-entrance');
 return {scene,events,progress,finish(){while(scene.dialog)scene.advanceDialogue();}};
}

test('three broadcasts occur only on floors 2, 3 and 5, including any room in an existing save',()=>{
 for(let floor=1;floor<=5;floor++)for(let room=0;room<=5;room++){
  const p=ready(floor,room),broadcast=facilityBroadcast(p);
  assert.equal(broadcast?.floor||null,[2,3,5].includes(floor)?floor:null,`${floor}/${room}`);
 }
 const early=ready();delete early.flags.CH2_DRONE_FACILITY_ENTERED;
 assert.equal(facilityBroadcast(early),null);
 for(const location of ['fairmont','fairmont-clinic','fairmont-market-2','fairmont-facility-6','fairmont-facility-2-room-6'])assert.equal(facilityBroadcast(ready(),location),null,location);
 const deeper=ready(5,3);assert.deepEqual(facilityBroadcast(deeper),{type:'facility-broadcast',floor:5,step:0});
 assert.equal(deeper.flags[argusBroadcastFlag(2)],undefined,'a legacy later-floor save does not manufacture earlier completions');
});

test('broadcast state survives actual save slots and resumes the next unread page once',()=>{
 for(const floor of [2,3,5]){
  let p=ready(floor,4),result=transition(p,'argus-broadcast-start');
  assert.deepEqual(result.effects,['facility-broadcast']);p=result.state;
  assert.equal(transition(p,'argus-broadcast-start').changed,false);
  assert.equal(transition(p,'argus-broadcast-complete').changed,false,'cannot complete before pages are acknowledged');
  for(let step=1;step<=ARGUS_BROADCASTS[floor].length;step++){
   p=apply(p,{type:'argus-broadcast-step',step});p=reloaded(p);
   assert.deepEqual(resumeEvent(p),{type:'facility-broadcast',floor,step});
   assert.equal(transition(p,{type:'argus-broadcast-step',step}).changed,false);
  }
  result=transition(p,'argus-broadcast-complete');p=reloaded(result.state);
  assert.equal(p.flags[argusBroadcastFlag(floor)],true);assert.equal(p.flags.CH2_ARGUS_BROADCAST_PENDING,undefined);
  assert.equal(facilityBroadcast(p),null);assert.equal(resumeEvent(p),null);
  assert.equal(transition(p,'argus-broadcast-complete').changed,false);
  assert.equal(transition(p,'argus-broadcast-start').changed,false);
 }
});

test('invalid and backward page checkpoints do not skip a broadcast',()=>{
 let p=apply(ready(3),'argus-broadcast-start');p=apply(p,{type:'argus-broadcast-step',step:1});
 for(const step of [-1,0,1,1.5,3,Infinity,NaN])assert.equal(transition(p,{type:'argus-broadcast-step',step}).changed,false,String(step));
 const copy=structuredClone(p);Object.freeze(p.flags);Object.freeze(p);
 apply(p,{type:'argus-broadcast-step',step:2});assert.deepEqual(p,copy);
});

test('personal units enter only the final-floor random enemy pool after the release line is acknowledged',()=>{
 let p=apply(ready(5),'argus-broadcast-start');
 assert.equal(enemiesFor(mapFor(p.location),p).includes('argusSentinel'),false);
 p=apply(p,{type:'argus-broadcast-step',step:2});
 assert.equal(p.flags.CH2_ARGUS_UNITS_RELEASED,undefined);
 p=complete(p);assert.equal(p.flags.CH2_ARGUS_UNITS_RELEASED,true);
 for(let floor=1;floor<=5;floor++)assert.equal(enemiesFor(mapFor('fairmont-facility-'+floor),p).includes('argusSentinel'),floor===5);
 assert.equal(enemiesFor(mapFor('fairmont-market-3'),p).includes('argusSentinel'),false);
 const earlier=complete(apply(ready(2),'argus-broadcast-start'));assert.equal(earlier.flags.CH2_ARGUS_UNITS_RELEASED,undefined);
});

test('scene locks movement, checkpoints dialogue, prevents duplicate starts and unlocks without immunity',()=>{
 const h=harness(ready(2));h.scene.resumeStory();
 assert.equal(h.scene.locked,true);assert.equal(h.scene.player.walking,false);assert.equal(h.scene.arrival,false);
 assert.equal(h.scene.facilityBroadcast,2);assert.equal(h.events.filter(e=>e==='dialogue').length,1);
 assert.equal(h.scene.dialog.messages[0].speaker,'A.R.G.U.S.');assert.equal(h.scene.dialog.messages[0].channel,'FACILITY BROADCAST');
 h.scene.resumeStory();assert.equal(h.events.filter(e=>e==='dialogue').length,1);
 h.scene.advanceDialogue();assert.equal(h.progress.chapter2ArgusBroadcastStep,1);
 const next=harness(reloaded(h.progress));next.scene.resumeStory();
 assert.equal(next.scene.dialog.messages.length,1);assert.equal(next.scene.facilityBroadcastOffset,1);
 next.finish();assert.equal(next.scene.locked,false);assert.equal(next.scene.facilityBroadcast,null);
 assert.equal(next.progress.flags[argusBroadcastFlag(2)],true);
 next.scene.resumeStory();assert.equal(next.events.filter(e=>e==='dialogue').length,1);
 assert.equal(next.events.some(e=>['battle','travel','boss-entrance'].includes(e)),false);
 assert.equal(next.scene.recoveryUntil,undefined);assert.equal(next.progress.invincible,undefined);
});

test('reload after the last acknowledged page finishes safely without an empty dialogue',()=>{
 let p=apply(ready(5),'argus-broadcast-start');p=apply(p,{type:'argus-broadcast-step',step:3});
 const h=harness(reloaded(p));h.scene.resumeStory();
 assert.equal(h.scene.locked,false);assert.equal(h.scene.dialog,null);assert.equal(h.events.includes('dialogue'),false);
 assert.equal(h.progress.flags.CH2_ARGUS_UNITS_RELEASED,true);
});

test('physical boss entrance and pending combat take priority; victory reflects on resonance while clinic recovery is silent',()=>{
 let p=apply(ready(5),'argus-broadcast-start');p=apply(p,'argus-entrance-start');
 assert.equal(p.flags.CH2_ARGUS_BROADCAST_PENDING,undefined);assert.equal(resumeEvent(p).type,'argus-entrance');
 const h=harness(p);h.scene.resumeStory();assert.equal(h.events.includes('dialogue'),false);assert.equal(h.events.includes('travel'),true);
 p=apply(p,'argus-entrance-complete');p=apply(p,'argus-start');
 assert.equal(resumeEvent(p).type,'argus-battle');assert.equal(facilityBroadcast(p),null);
 const lost=structuredClone(p);abortFairmontBattle(lost,{id:'argus'});lost.location='fairmont-clinic';
 const clinic=harness(lost);clinic.scene.resumeStory();assert.equal(clinic.events.length,0);assert.equal(clinic.scene.locked,false);
 lost.location='fairmont-facility-5';assert.equal(facilityBroadcast(lost),null,'a rematch does not run belated PA announcements');
 finishFairmontBattle(p,{id:'argus'});
 for(const floor of [2,3,5])assert.equal(facilityBroadcast(p,'fairmont-facility-'+floor),null);
 assert.equal(resumeEvent(p).type,'reflection');
 const aftermath=harness(p);aftermath.scene.resumeStory();assert.ok(aftermath.events.includes('dialogue'));
 const done=transition(p,'argus-reflected').state;assert.equal(resumeEvent(done),null);assert.equal(transition(done,'argus-reflected').changed,false);
});

test('A.R.G.U.S. recognizes the hero, slips classified resonance information, and uses the unique panel for every page',()=>{
 const direct=dialogueLines(ARGUS_SCENE,{name:'Morgan'}),text=direct.map(l=>l.text).join(' ');
 assert.match(text,/Morgan\. The Bellwether chemist/);assert.match(text,/resonance shows considerable promise/);
 assert.match(text,/Destroying so many drones and robotics systems/);assert.match(text,/Cenexis has not authorized disclosure/);
 assert.match(text,/superior to humans/);assert.doesNotMatch(text,/Identity unresolved/);
 assert.match(ARGUS_BROADCASTS[2].map(l=>l.text).join(' '),/not surprised/);
 assert.match(ARGUS_BROADCASTS[3].map(l=>l.text).join(' '),/handle you myself/);
 assert.match(ARGUS_BROADCASTS[5].map(l=>l.text).join(' '),/far too quickly.*laziness.*AI to become fully integrated.*manufactured units/);
 for(const line of [...direct,...Object.values(ARGUS_BROADCASTS).flat()]){
  assert.equal(line.presentation,'argus');assert.equal(line.speaker,'A.R.G.U.S.');assert.ok(line.text.length<=140,line.text);
 }
});
