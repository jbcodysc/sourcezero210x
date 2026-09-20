import test from 'node:test';
import assert from 'node:assert/strict';
import {freshProgress,award,xpThreshold,buy,upgradeProgress,playerStats} from '../city/progress.mjs';
import {createChapterProgress} from '../city/chapter-start.mjs';
import {ENEMIES,createEncounter,effectiveSpeed,revealReinforcement,enemyAction,applyEnemyImpact} from '../city/encounters.mjs';
import {beginRound,nextTurn,battleEscapeChance,carryBattleInventory} from '../city/battle-turns.mjs';
import {saleInventory,sellItem} from '../city/shop.mjs';
import {inventoryEntries,useInventoryItem} from '../city/core-status.mjs';
import {SaveSlots} from '../city/save-slots.mjs';
import {argusTypingStyle,argusTextMarkup} from '../city/argus-dialogue.mjs';
import {createFairmontScene} from '../fairmont/scene.mjs';
import {ARGUS_SCENE} from '../fairmont/story.mjs';
import {Typewriter} from '../lab/presentation.mjs';

const hero=()=>createChapterProgress('2-facility','Jamie');
function endRound(b){while(b.phase==='resolving')nextTurn(b,()=>.1);assert.equal(b.phase,'command');}
test('all healing goods and Guard outrank even the fastest enemies, without changing enemy ordering',()=>{
 for(const action of ['guard','snack','item:field-meal','item:caramel-macchiato']){
  const p=hero();p.hp=40;p.inventory.push('field-meal','caramel-macchiato');const b=createEncounter('pipeRat',p,['pipeRat','scanDrone','loader']);b.speed=.01;
  beginRound(b,action,()=>.5);assert.equal(b.roundQueue[0].who,'hero');assert.deepEqual(b.roundQueue.slice(1).map(a=>a.uid),[1,0,2]);
  const before=b.targetHp,result=nextTurn(b);assert.equal(result.actor,'hero');if(action!=='guard')assert.ok(b.targetHp>before);
  endRound(b);assert.equal(b.guarding,false);
 }
});
test('a call is announced before arrival, consumes both turns, and cannot duplicate or skip to commands',()=>{
 const b=createEncounter('volunteer',hero());b.enemyHp=1000;beginRound(b,'attack',()=>.5);nextTurn(b,()=>.5);
 const hp=b.targetHp,r=nextTurn(b,()=>.17);assert.equal(r.type,'help');assert.match(b.message,/Volunteer calls for help!/);assert.equal(b.enemies.length,1);
 assert.equal(nextTurn(b).ok,false);assert.equal(beginRound(b,'attack').ok,false);
 assert.equal(revealReinforcement(b),true);assert.equal(revealReinforcement(b),false);assert.match(b.message,/Volunteer appears!/);assert.equal(b.enemies.length,2);assert.equal(b.enemies[1].turn,2);
 assert.equal(nextTurn(b).roundComplete,true);assert.equal(b.targetHp,hp);assert.equal(b.turn,2);
 beginRound(b,'guard',()=>.5);assert.ok(b.roundQueue.some(a=>a.uid===r.joined));
});
test('three live ordinary enemies give a flat 66% escape chance without unlocking story fights',()=>{
 const b=createEncounter('loader',hero(),['loader','pipeRat','scanDrone']);for(const speed of [1,25,10000]){b.speed=speed;assert.equal(battleEscapeChance(b),.66);}
 b.enemies[2].hp=0;assert.notEqual(battleEscapeChance(b),.66);
 assert.equal(battleEscapeChance(createEncounter('junctionGuard',hero(),['junctionGuard','scriptedScanDrone','scriptedScanDrone'])),0);
});
test('macchiato heals 15, refreshes without stacking, and boosts exactly three following rounds',()=>{
 const p=hero();p.hp=100;p.inventory.push('caramel-macchiato','caramel-macchiato');const b=createEncounter('loader',p);b.enemies[0].hp=10000;
 beginRound(b,'item:caramel-macchiato',()=>.5);nextTurn(b);assert.equal(b.targetHp,115);assert.equal(effectiveSpeed(b),b.speed*1.3);endRound(b);assert.equal(b.speedBoostTurns,3);
 for(const remaining of [2,1,0]){beginRound(b,'attack',()=>.5);assert.equal(b.roundQueue.find(a=>a.who==='hero').speed,b.speed*1.3);endRound(b);assert.equal(b.speedBoostTurns,remaining);}
 assert.equal(effectiveSpeed(b),b.speed);b.targetHp=b.maxHp;beginRound(b,'item:caramel-macchiato',()=>.5);assert.equal(nextTurn(b).recovered,0);endRound(b);assert.equal(b.speedBoostTurns,3);
 carryBattleInventory(p,b);const next=createEncounter('loader',p);assert.equal(next.speedBoostTurns,3);assert.equal(effectiveSpeed(next),next.speed*1.3);
 const outside=hero();outside.inventory.push('caramel-macchiato');assert.ok(useInventoryItem(outside,'caramel-macchiato').ok);assert.equal(outside.speedBoostTurns,3);
});
test('missile volley does 295 independent of level and armor, while Guard still reduces it',()=>{
 for(const level of [12,20,27,50]){const p=freshProgress();award(p,xpThreshold(level),0);p.armor='laminate-vest';const b=createEncounter('argus',p);b.enemyHp=200;b.phase='resolving';b.enemyQueue=[0];const result=enemyAction(b,()=>.5,{queued:true});assert.equal(result.impact.damage,295);for(let i=0;i<3;i++)applyEnemyImpact(b,result.impact,i);assert.equal(b.message,'A missile volley was fired, doing massive 295 damage!');}
});
test('post-22 XP rises sharply without a cap; old high-level saves retain level and progress fraction once',()=>{
 assert.equal(xpThreshold(22),11025);assert.equal(xpThreshold(23)-xpThreshold(22),2688);assert.equal(xpThreshold(24)-xpThreshold(23),3764);assert.ok(xpThreshold(100)>xpThreshold(99));
 const p=hero();p.level=27;p.maxHp=p.hp=422;p.xp=25*26**2+500;delete p.xpCurveVersion;const stats=playerStats(p);upgradeProgress(p);
 assert.equal(p.level,27);assert.deepEqual(playerStats(p),stats);assert.equal(p.xp,xpThreshold(27)+Math.floor(500/1325*(xpThreshold(28)-xpThreshold(27))));
 const once=p.xp;upgradeProgress(p);assert.equal(p.xp,once);
});
test('sales pay half, protect equipped/key items and remove gear permanently across saves',()=>{
 const p=hero(),money=p.credits;assert.equal(sellItem(p,'laminate-vest').ok,false);assert.equal(sellItem(p,'resonant-drive').ok,false);assert.equal(sellItem(p,'fairmont-service-keycard').ok,false);assert.equal(p.credits,money);
 assert.equal(sellItem(p,'insulated-grip').credits,42);assert.equal(sellItem(p,'insulated-vest').credits,50);assert.equal(sellItem(p,'sandwich').credits,20);
 assert.ok(!saleInventory(p).some(i=>i.id==='insulated-grip'));assert.equal(sellItem(p,'insulated-grip').ok,false);
 const memory={getItem(){return this.data;},setItem(k,v){this.data=v;}};new SaveSlots(memory).write(0,p);const loaded=new SaveSlots(memory).read(0);
 assert.ok(!inventoryEntries(loaded).some(i=>i.id==='insulated-grip'));assert.equal(loaded.upgrade,2);assert.equal(loaded.credits,money+112);
 buy(loaded,'upgrade');assert.ok(inventoryEntries(loaded).some(i=>i.id==='insulated-grip'&&i.equipped));assert.equal(sellItem(loaded,'resonant-drive').credits,160);
 const snacks=loaded.snacks;buy(loaded,'sandwich');assert.equal(loaded.snacks,snacks+1);assert.ok(!loaded.inventory.includes('sandwich'));
 const legacy=hero();delete legacy.gearInventoryVersion;legacy.inventory=legacy.inventory.filter(id=>id!=='insulated-grip');upgradeProgress(legacy);assert.ok(legacy.inventory.includes('insulated-grip'));sellItem(legacy,'insulated-grip');upgradeProgress(legacy);assert.ok(!inventoryEntries(legacy).some(i=>i.id==='insulated-grip'));
});
test('only the five designation words receive slow typing and metallic emphasis',()=>{
 const line=ARGUS_SCENE[0],text=line.text.toUpperCase(),style=argusTypingStyle(line),range=style.slowRanges[0],writer=new Typewriter(text,44,style.slowRanges);
 assert.equal(text.slice(range.start,range.end),'SECURITY COMBAT RESPONSE AUTONOMOUS PURSUER');
 writer.advance(range.start/44*1000+1001);assert.equal(writer.count,range.start+14);
 const html=argusTextMarkup(writer.text,style.designationStart);assert.match(html,/<em class="argus-designation">SECURITY COMBA<\/em>/);assert.ok(!html.includes('<em class="argus-designation">I AM'));
 assert.equal(argusTypingStyle({...line,emphasizeDesignation:false}),null);writer.finish();assert.equal(writer.text,text);
});

test('facility XP rewards rise about 25% while later levels require steadily more fights',()=>{
 const previous={facilitySecurity:370,testDrone:350,heavyDrone:455,assemblyArm:485,argusSentinel:540,argus:950};
 for(const [id,xp]of Object.entries(previous)){assert.ok(ENEMIES[id].xp>=xp*1.25);assert.ok(ENEMIES[id].xp<=xp*1.28);}
 assert.equal(ENEMIES.retailCleaner.xp,180);assert.equal(ENEMIES.scriptedScanDrone.xp,70);
 const gains=[23,24,25,26].map(level=>xpThreshold(level)-xpThreshold(level-1));assert.deepEqual(gains,[2688,3764,4840,5916]);
});


test('shop stock stays specialized and never gains sold items, including after reopening',()=>{
 const previousDocument=globalThis.document;globalThis.document={querySelector:()=>({className:''})};
 try{
  const p=hero();const Scene=createFairmontScene({Base:class{},getProgress:()=>p,resetControls(){}}),scene=new Scene();let shop;
  scene.openShop=options=>{shop=options;};
  for(const id of ['vendor','barista','diner-owner']){
   scene.openFairmontService(id);const stock=shop.offers.map(offer=>offer[0]);
   if(id==='vendor')assert.deepEqual(stock,['resonant-drive','laminate-vest']);
   else{assert.ok(stock.includes('snack'));assert.ok(stock.includes('field-meal'));assert.ok(!stock.includes('resonant-drive'));assert.ok(!stock.includes('laminate-vest'));}
   const before=p.snacks;assert.ok(sellItem(p,'sandwich').ok);assert.equal(p.snacks,before-1);
   scene.openFairmontService(id);assert.deepEqual(shop.offers.map(offer=>offer[0]),stock);
  }
 }finally{globalThis.document=previousDocument;}
});
