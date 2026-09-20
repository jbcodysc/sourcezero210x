import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {CHAPTERS,createChapterProgress} from '../city/chapter-start.mjs';
import {freshProgress,GEAR,buy,buyGear,equipArmor,armorDefense,weaponBonus,playerStats,xpThreshold,validProgress,restore} from '../city/progress.mjs';
import {carryBattleInventory} from '../city/battle-turns.mjs';
import {SaveSlots} from '../city/save-slots.mjs';
import {resumeEvent,timeOfDay,transition} from '../fairmont/story.mjs';
import {createEncounter,ENEMIES} from '../city/encounters.mjs';
import {validateName} from '../city/name-policy.mjs';
import {normalizeName} from '../city/opening.mjs';

const storage=()=>{const values=new Map();return {getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)};};

test('Chapter 2 begins at the daytime bus arrival with complete Chapter 1 prerequisites, not a later event',()=>{
 const s=createChapterProgress(2,'Finley');
 assert.ok(validProgress(s));assert.equal(s.level,15);assert.equal(s.xp,xpThreshold(15));assert.equal(s.hp,s.maxHp);assert.equal(s.location,'fairmont');
 assert.equal(s.credits,2000);assert.deepEqual(playerStats(s),{health:278,attack:79,defense:33,speed:19});
 assert.deepEqual(s.inventory,['insulated-grip','insulated-vest']);assert.equal(s.snacks,2);
 assert.equal(timeOfDay(s),'day');assert.equal(resumeEvent(s),null);assert.equal(s.flags.CH2_ARRIVED,true);
 assert.equal(s.flags.CH2_MODULE_REMINDER_SEEN,undefined);assert.equal(s.flags.CH2_RADIO_HUT_BARGAIN,undefined);
 for(const flag of ['waterRestored','relayTaken','badgeFixed'])assert.equal(s.flags[flag],true);
 assert.equal(s.armor,'insulated-vest');assert.equal(s.upgrade,1);
 const heard=transition(s,'module-reminder').state;assert.equal(transition(heard,'radio-bargain').changed,true);
 assert.deepEqual(createChapterProgress(1,'Finley'),freshProgress('Finley'));assert.throws(()=>createChapterProgress(3),RangeError);
});

test('chapter selection and upgraded gear survive reload without awarding Chapter 1 XP twice or touching other files',()=>{
 const memory=storage(),book=new SaveSlots(memory),start=createChapterProgress(2,'Terry');
 book.write(0,freshProgress('First'));book.write(2,freshProgress('Third'));
 buyGear(start,'resonant-drive');buyGear(start,'laminate-vest');book.write(1,start);
 const loaded=new SaveSlots(memory);assert.equal(loaded.read(1).xp,start.xp);assert.equal(loaded.read(1).level,15);
 assert.equal(loaded.read(1).upgrade,2);assert.equal(loaded.read(1).armor,'laminate-vest');
 assert.equal(loaded.read(0).name,'First');assert.equal(loaded.read(2).name,'Third');
 assert.deepEqual(loaded.read(1).inventory,start.inventory);
});

test('new equipment replaces old bonuses, purchases charge once, and unaffordable items do not alter state',()=>{
 const s=createChapterProgress(2);s.credits=1000;const old=createEncounter('retailCleaner',s);
 assert.equal(weaponBonus(s),6);assert.equal(armorDefense(s),5);
 buy(s,'resonant-drive');buy(s,'laminate-vest');const next=createEncounter('retailCleaner',s);
 assert.equal(s.credits,1000-GEAR['resonant-drive'].price-GEAR['laminate-vest'].price);
 assert.equal(next.heroAttack-old.heroAttack,14);assert.equal(next.defense-old.defense,7);
 const once=JSON.stringify(s);buyGear(s,'resonant-drive');buyGear(s,'laminate-vest');assert.equal(JSON.stringify(s),once);
 assert.ok(equipArmor(s,'insulated-vest'));assert.equal(armorDefense(s),5);assert.ok(equipArmor(s,'laminate-vest'));assert.equal(armorDefense(s),12);
 const poor=freshProgress(),before=JSON.stringify(poor);buyGear(poor,'resonant-drive');buyGear(poor,'laminate-vest');assert.equal(JSON.stringify(poor),before);
 assert.equal(equipArmor(poor,'laminate-vest'),false);
});

test('only the two scripted drones retain the low stats; field units and reinforcements use the stronger roster',()=>{
 assert.deepEqual(['hp','attack','charge'].map(k=>ENEMIES.scriptedScanDrone[k]),[115,36,58]);
 for(const id of ['scanDrone','testDrone','heavyDrone']){
  assert.ok(ENEMIES[id].hp>ENEMIES.scriptedScanDrone.hp);assert.ok(ENEMIES[id].attack>ENEMIES.scriptedScanDrone.attack);
 }
 for(const enemy of Object.values(ENEMIES))assert.notEqual(enemy.helper,'scriptedScanDrone');
 const market=['retailCleaner','retailSecurity','retailService'];
 assert.equal(new Set(market.map(id=>ENEMIES[id].portrait)).size,3);
 assert.equal(new Set(market.map(id=>ENEMIES[id].mapTexture)).size,3);
 for(const id of market)assert.ok(ENEMIES[id].portrait.startsWith('fairmont-enemy-'));
 for(const id of ['facilitySecurity','testDrone','heavyDrone','assemblyArm'])assert.ok(ENEMIES[id].attack>Math.max(...market.map(k=>ENEMIES[k].attack)));
});

const citySource=readFileSync(new URL('../city/city.js',import.meta.url),'utf8');
function actualSceneClass(name,end,globals){
 const text=citySource.slice(citySource.indexOf('class '+name+' extends'),citySource.indexOf(end));
 return vm.runInNewContext(text+';'+name,{SceneBase:class{},...globals});
}

test('the actual start menu requires an overwrite confirmation and validated name before launching a chapter',()=>{
 const memory=storage(),book=new SaveSlots(memory);book.write(0,freshProgress('Existing'));
 const nodes=new Map(),node=selector=>{if(!nodes.has(selector))nodes.set(selector,{innerHTML:'',className:'',focus(){},select(){},remove(){},insertAdjacentHTML(_,html){this.innerHTML+=html;}});return nodes.get(selector);};
 const Start=actualSceneClass('StartScene','const ROOM_CONTENT=',{$:node,esc:String,saveFiles:book,saveAvailable:true,sound:{setMode(){}},CHAPTERS,createChapterProgress,normalizeName,validateName,document:{activeElement:null}});
 const scene=new Start();scene.init({});scene.time={delayedCall(){}};let launched;
 scene.launch=s=>{launched=s;};scene.handleAction('chapter-menu');scene.handleAction('chapter-2');scene.handleAction('chapter-slot-0');
 assert.equal(scene.phase,'chapter-overwrite');assert.equal(launched,undefined);assert.equal(book.read(0).name,'Existing');
 scene.handleAction('chapter-files');assert.equal(scene.phase,'chapter-slots');assert.equal(launched,undefined);
 scene.handleAction('chapter-slot-0');scene.handleAction('chapter-replace');assert.equal(scene.phase,'name');
 node('#hero-name').value='Ness';scene.handleAction('name-check');assert.equal(scene.phase,'name-rejected');assert.equal(launched,undefined);
 scene.handleAction('name-dismiss');node('#hero-name').value='Jamie';scene.handleAction('name-check');assert.equal(scene.phase,'confirm');
 scene.handleAction('name-start');assert.equal(launched.name,'Jamie');assert.equal(launched.location,'fairmont');assert.equal(launched.level,15);assert.equal(launched.credits,2000);
 assert.equal(book.read(0).name,'Existing','only launch is allowed to write the chosen file');
});

test('the actual battle return sends every Fairmont defeat to the clinic while keeping inventory and story notes',()=>{
 for(const id of ['retailCleaner','karen','junctionGuard','heavyDrone','argus']){
  const progress=createChapterProgress(2,'Kim');progress.hp=1;progress.flags.CH2_RADIO_HUT_BARGAIN=true;
  const before=progress.inventory.slice(),state={origin:{scene:'Fairmont'},encounter:{id,region:'fairmont-facility5',checkpoint:{location:'fairmont-facility5',position:{x:100,y:100}}}};
  let destination,saved=false,aborted=false;
  const Battle=actualSceneClass('BattleScene','if(!P)',{state,progress,restore,carryBattleInventory,abortFairmontBattle(){aborted=true;},save(){saved=true;}});
  const scene=new Battle();scene.closed=false;scene.battle={phase:'defeat',snacks:1,inventory:[...progress.inventory]};scene.scene={start:(name,data)=>{destination={name,...data};}};
  scene.handleAction('return');assert.equal(destination.name,'Fairmont');assert.equal(destination.location,'fairmont-clinic');assert.equal(progress.location,'fairmont-clinic');
  assert.equal(progress.hp,progress.maxHp);assert.equal(progress.snacks,1);assert.deepEqual(progress.inventory,before);assert.equal(progress.flags.CH2_RADIO_HUT_BARGAIN,true);
  assert.equal(saved,true);assert.equal(aborted,true);
 }
});
