import test from 'node:test';
import assert from 'node:assert/strict';
import {CoreGameUI} from '../city/core-ui.mjs';
import {characterStatus,statusPanel,partyStatus,inventoryEntries,itemInformation,useInventoryItem} from '../city/core-status.mjs';
import {createChapterProgress} from '../city/chapter-start.mjs';
import {SaveSlots,SLOTS_KEY} from '../city/save-slots.mjs';
import {canEnter,resumeEvent,derekStatus,transition,objective} from '../fairmont/story.mjs';
import {ROOM_LOCATIONS,mapFor,worldWalkable,FACILITY_ZONES} from '../fairmont/world.mjs';
import {enemiesFor} from '../fairmont/enemies.mjs';
import {canInteractDoor,activateDoor,doorApproach,doorCollision} from '../city/doors.mjs';

test('the chapter-independent Status panel reads current stats and reveals MP only by persistent capability',()=>{
 const s=createChapterProgress(2,'Morgan');const before=characterStatus(s);assert.equal(before.level,15);assert.ok(!statusPanel(s).includes('MP'));assert.ok(!statusPanel(s).includes('???'));
 s.flags.magicUnlocked=true;s.mp=9;s.maxMp=24;assert.match(statusPanel(s),/9 \/ 24/);assert.match(statusPanel(s),/aria-label="MP"/);
 s.level++;s.maxHp+=12;s.upgrade=2;s.armor='laminate-vest';assert.ok(characterStatus(s).stats[0][1]>before.stats[0][1]);assert.ok(characterStatus(s).stats[1][1]>before.stats[1][1]);
 s.party=[{id:'partner',name:'Partner',level:15,hp:95,maxHp:120,attack:38,defense:17}];assert.equal(partyStatus(s).length,2);assert.equal(partyStatus(s)[1].stats[0][1],38);
 const storage={getItem(){return this.value;},setItem(k,v){this.value=v;}};const saves=new SaveSlots(storage);saves.write(0,s);assert.match(statusPanel(new SaveSlots(storage).read(0)),/9 \/ 24/);
});

test('Items combines owned gear and consumables, CHECK reports healing, USE consumes once and persists',()=>{
 const s=createChapterProgress('2-facility','Morgan');s.hp-=100;const list=inventoryEntries(s);
 for(const id of ['sandwich','insulated-grip','insulated-vest','resonant-drive','laminate-vest','fairmont-service-keycard'])assert.ok(list.some(i=>i.id===id),id);
 assert.match(itemInformation(list.find(i=>i.id==='sandwich')),/70 HP/);const old=s.snacks,hp=s.hp;
 assert.equal(useInventoryItem(s,'sandwich').message,'Recovered 70 HP.');assert.equal(s.hp,hp+70);assert.equal(s.snacks,old-1);
 assert.equal(useInventoryItem(s,'sandwich').message,'Recovered 30 HP.');assert.equal(useInventoryItem(s,'sandwich').ok,false);
 useInventoryItem(s,'insulated-vest');assert.equal(s.armor,'insulated-vest');useInventoryItem(s,'laminate-vest');assert.equal(s.armor,'laminate-vest');
 useInventoryItem(s,'insulated-grip');assert.equal(s.upgrade,1);useInventoryItem(s,'resonant-drive');assert.equal(s.upgrade,2);
 assert.equal(useInventoryItem(s,'fairmont-service-keycard').ok,false);
 const storage={getItem(){return this.value;},setItem(k,v){this.value=v;}};new SaveSlots(storage).write(0,s);const loaded=new SaveSlots(storage).read(0);assert.equal(loaded.snacks,0);assert.equal(loaded.armor,'laminate-vest');assert.equal(loaded.upgrade,2);
});

function uiHarness(){
 const s=createChapterProgress(2,'Jamie'),events=[];
 const overlay={innerHTML:'',className:'',querySelector(){return {focus(){},click(){events.push('click');}};},insertAdjacentHTML(where,html){this.innerHTML+=html;},ownerDocument:{activeElement:null}};
 const scene={locked:false,time:{paused:false},tweens:{paused:false,pauseAll(){this.paused=true;},resumeAll(){this.paused=false;}},physics:{world:{isPaused:false,pause(){this.isPaused=true;},resume(){this.isPaused=false;}}},input:{keyboard:{resetKeys(){}}},interact(){events.push('dialogue');},advanceNarration(){events.push('cutscene');},handleAction(){},openJournal(){ui.open();}};
 const ui=new CoreGameUI(scene,{progress:()=>s,save:()=>events.push('save'),reset(){},overlay,prompt:{}});
 const key=(key,repeat=false)=>ui.key({key,repeat,preventDefault(){}});return {s,scene,ui,overlay,events,key,tap(key){this.key(key);ui.keyup({key});}};
}
test('one pause owner freezes clocks, tweens and physics; Space debounce and context prevent competing overlays',()=>{
 const h=uiHarness();h.key(' ');assert.equal(h.ui.mode,'pause');assert.equal(h.scene.locked,true);assert.equal(h.scene.time.paused,true);assert.equal(h.scene.tweens.paused,true);assert.equal(h.scene.physics.world.isPaused,true);
 h.key(' ',true);h.key(' ');assert.equal(h.ui.mode,'pause');assert.equal(h.ui.open('menu'),false);assert.match(h.overlay.innerHTML,/PAUSED/);assert.ok(!h.overlay.innerHTML.includes('MP'));
 h.ui.keyup({key:' '});h.tap(' ');assert.equal(h.ui.mode,null);assert.equal(h.scene.time.paused,false);assert.equal(h.scene.tweens.paused,false);assert.equal(h.scene.physics.world.isPaused,false);
 h.scene.dialog={};h.tap(' ');assert.deepEqual(h.events,['dialogue']);assert.equal(h.ui.mode,null);
 h.scene.dialog=null;h.scene.cutscene={};h.tap(' ');assert.equal(h.events.at(-1),'cutscene');assert.equal(h.ui.mode,null);
});
test('Status and Items are the only menu tabs; item result owns input until acknowledged',()=>{
 const h=uiHarness();h.s.hp-=90;h.ui.open();assert.equal((h.overlay.innerHTML.match(/role="tab"/g)||[]).length,2);assert.ok(!h.overlay.innerHTML.includes('notebook'));
 h.tap('ArrowRight');assert.equal(h.ui.tab,'items');h.ui.action('core-item:sandwich');h.ui.action('core-check');assert.match(h.overlay.innerHTML,/Restores 70 HP/);
 h.ui.action('core-use');const quantity=h.s.snacks;assert.match(h.overlay.innerHTML,/Recovered 70 HP/);h.ui.action('core-use');assert.equal(h.s.snacks,quantity);h.tap('Enter');assert.equal(h.ui.result,null);assert.equal(h.s.snacks,quantity);
 h.ui.destroy();assert.equal(h.scene.locked,false);assert.equal(h.scene.time.paused,false);
});
test('post-scan preset grants only available equipment/access and leaves the facility and optional quest unfinished',()=>{
 const p=createChapterProgress('2-facility','Avery');assert.equal(p.level,20);assert.equal(p.hp,p.maxHp);assert.equal(p.location,'fairmont');assert.ok(worldWalkable(p.location,p.position.x,p.position.y));
 assert.equal(canEnter(p,'facility'),true);assert.equal(p.flags.CH2_ARGUS_DEFEATED,undefined);assert.equal(p.flags.CH2_DRONE_FACILITY_ENTERED,undefined);assert.equal(p.flags.CH2_COMPLETE,undefined);assert.equal(resumeEvent(p),null);
 assert.equal(p.flags.CH2_DEREK_COMPLETE,undefined);assert.ok(['expired','unavailable'].includes(derekStatus(p)));assert.match(objective(p),/facility service entrance/);
 for(const flag of ['CH2_RADIO_HUT_BARGAIN','CH2_BELLWETHER_FINISHED','CH2_WRM_CLEARED','CH2_KAREN_DEFEATED','CH2_DAY2','CH2_PLAYER_SCANNED','CH2_CITY_SECURITY_HOSTILE','CH2_DRONE_KEYCARD'])assert.equal(p.flags[flag],true,flag);
 assert.equal(createChapterProgress(2).level,15);assert.equal(createChapterProgress(1).level,1);
});
test('Floor 5 adds exactly two rooms before the preserved boss, only personal units, and retains one earlier recovery bay',()=>{
 const final=ROOM_LOCATIONS.map(mapFor).filter(m=>m.baseId===FACILITY_ZONES[4]);assert.equal(final.length,8);
 const visited=new Set(),walk=id=>{if(visited.has(id))return;visited.add(id);for(const door of mapFor(id).doors)if(mapFor(door.target)?.baseId===FACILITY_ZONES[4])walk(door.target);};walk(FACILITY_ZONES[4]);assert.equal(visited.size,8);
 for(const i of [6,7]){const m=mapFor(FACILITY_ZONES[4]+'-room-'+i);assert.ok(m.props.length>=6);assert.equal(m.spawns.length,1);assert.equal(m.boss,null);}
 assert.equal(mapFor(FACILITY_ZONES[4]+'-room-5').doors[0].target,FACILITY_ZONES[4]+'-room-7');
 assert.equal(final.flatMap(m=>m.spawns).length,5);for(const m of final){assert.equal(m.rest,null);assert.deepEqual(enemiesFor(m,{flags:{CH2_ARGUS_UNITS_RELEASED:true}}),['argusSentinel']);}
 const recovery=ROOM_LOCATIONS.map(mapFor).filter(m=>!m.isMarket&&m.rest);assert.equal(recovery.length,1);assert.equal(recovery[0].id,'fairmont-facility-3-room-2');
});
test('facility doors require facing and confirm, block their footprint, preserve destination facing and play once',()=>{
 for(const m of ROOM_LOCATIONS.map(mapFor).filter(m=>!m.isMarket))for(const door of m.doors){
  const player=doorApproach(door),box=doorCollision(door);assert.equal(canInteractDoor(player,door),true);assert.equal(worldWalkable(m.id,door.x,door.y),false);assert.ok(box.w>0&&box.h>0);
  assert.equal(canInteractDoor({...player,dir:'wrong'},door),false);const events=[],api={flags:{},sound:{automaticDoor(){events.push('sound');}},travel(...args){events.push(args);}};
  assert.equal(activateDoor(player,door,api),!door.requiresFlag);if(door.requiresFlag){api.flags[door.requiresFlag]=true;assert.equal(activateDoor(player,door,api),true);}
  assert.equal(events.filter(e=>e==='sound').length,1);assert.equal(events.at(-1)[0],door.target);assert.ok(worldWalkable(door.target,door.position.x,door.position.y));
 }
});
test('Bellwether title progress persists without completing or replaying the actual dialogue',()=>{
 let p=createChapterProgress(2);for(const event of ['module-reminder','radio-bargain','hotel-sleep','bellwether-title-seen'])p=transition(p,event).state;
 const storage={getItem(){return this.value;},setItem(k,v){this.value=v;}};new SaveSlots(storage).write(0,p);p=new SaveSlots(storage).read(0);assert.equal(p.flags.CH2_BELLWETHER_TITLE_SEEN,true);assert.deepEqual(resumeEvent(p),{type:'bellwether',step:0});
 p=transition(p,{type:'scene-step',step:2}).state;assert.equal(resumeEvent(p).step,2);p=transition(p,'bellwether-finished').state;assert.equal(resumeEvent(p),null);
});
