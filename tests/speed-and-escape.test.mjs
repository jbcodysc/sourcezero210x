import test from 'node:test';
import assert from 'node:assert/strict';
import {freshProgress,award,xpThreshold,validProgress,playerStats,buy} from '../city/progress.mjs';
import {SaveSlots} from '../city/save-slots.mjs';
import {inventoryEntries,useInventoryItem,characterStatus} from '../city/core-status.mjs';
import {ENEMIES,createEncounter,rollHealth} from '../city/encounters.mjs';
import {beginRound,nextTurn,initiativeChance,escapeChance,battleEscapeChance,canRun,escapeProgress} from '../city/battle-turns.mjs';

const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
const sequence=(...rolls)=>()=>rolls.shift()??.99;
const hero=level=>{const p=freshProgress('Jamie');award(p,xpThreshold(level),0);p.hp=p.maxHp;return p;};
function finishRound(b,rng=()=>.99){const results=[];for(let i=0;b.phase==='resolving'&&i<10;i++)results.push(nextTurn(b,rng));assert.notEqual(b.phase,'resolving');return results;}

test('speed gives strong initiative advantages but a gentler capped escape curve',()=>{
 close(initiativeChance(5,5),.5);assert.ok(initiativeChance(6,5)>.66&&initiativeChance(6,5)<.68);
 assert.ok(initiativeChance(10,5)>.94&&initiativeChance(10,5)<.96);
 close(escapeChance(10,10),.4);close(escapeChance(30,10),.75);close(escapeChance(999,10),.75);
 assert.ok(escapeChance(20,10)>.61&&escapeChance(20,10)<.63);
 assert.ok(escapeChance(5,10)<.2);assert.equal(escapeChance(1,100),.05);
});

test('weighted turn ordering statistically matches the stated two-combatant chances',()=>{
 let seed=778;const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
 for(const speed of [5,6,10]){
  const b=createEncounter('volunteer',hero(1));b.speed=speed;let first=0;
  for(let i=0;i<20000;i++){b.phase='command';beginRound(b,'attack',random);first+=b.roundQueue[0].who==='hero';}
  assert.ok(Math.abs(first/20000-initiativeChance(speed,5))<.012);
 }
});

test('every enemy has authored speed; ordinary level-12 rivals match, rats and small drones dominate',()=>{
 for(const [id,stats]of Object.entries(ENEMIES))assert.ok(Number.isInteger(stats.speed)&&stats.speed>0,id);
 const p=hero(12);assert.equal(playerStats(p).speed,16);assert.equal(characterStatus(p).stats[2][1],16);
 assert.equal(ENEMIES.retailCleaner.speed,16);assert.equal(ENEMIES.junctionGuard.speed,16);
 for(const id of ['pipeRat','scanDrone','scriptedScanDrone','testDrone'])assert.ok(initiativeChance(p.level+4,ENEMIES[id].speed)<.04,id);
 for(const id of ['loader','bastion','regulator','retailSecurity','assemblyArm','karen'])assert.ok(ENEMIES[id].speed<=16,id);
});

test('fast enemy can attack before the selected action, with each actor taking exactly one turn',()=>{
 const b=createEncounter('scanDrone',hero(12));const before=b.targetHp;
 beginRound(b,'attack',sequence(.99,.001));assert.equal(b.phase,'resolving');
 const enemy=nextTurn(b,()=>.99);assert.equal(enemy.actor,'enemy');assert.ok(b.targetHp<before);
 const player=nextTurn(b,()=>.99);assert.equal(player.actor,'hero');assert.ok(player.damage>0);
 assert.equal(nextTurn(b).roundComplete,true);assert.equal(b.turn,2);assert.equal(b.phase,'command');
 assert.equal(nextTurn(b).ok,false);
});

test('fallen enemies lose queued turns and reinforcements wait for the next round',()=>{
 const b=createEncounter('volunteer',hero(12),['volunteer','cleaner']);b.enemies[0].hp=1;
 beginRound(b,'attack',sequence(.00001,.9,.95));const hit=nextTurn(b,()=>.99);assert.ok(hit.damage);
 const helper=nextTurn(b,sequence(.17));assert.equal(helper.actor,'enemy');assert.equal(helper.type,'help');
 assert.equal(b.enemies.length,3);assert.equal(b.enemies.at(-1).turn,1);
 assert.equal(nextTurn(b).roundComplete,true);
 beginRound(b,'guard',()=>.5);assert.ok(b.roundQueue.some(a=>a.uid===helper.joined));
});

test('guard activates in speed order and holds until the next player action',()=>{
 const b=createEncounter('scanDrone',hero(12));beginRound(b,'guard',sequence(.99,.001));
 const unguarded=nextTurn(b,()=>.99).damage;assert.equal(b.guarding,false);nextTurn(b);finishRound(b);
 assert.equal(b.guarding,true);beginRound(b,'attack',sequence(.99,.001));
 const guarded=nextTurn(b,()=>.99).damage;assert.ok(guarded<unguarded*.4);nextTurn(b,()=>.99);assert.equal(b.guarding,false);
});

test('successful escape ends the queue without victory, rewards, flags or enemy removal',()=>{
 const p=hero(12);p.inventory=['field-meal'];const b=createEncounter('volunteer',p),before=JSON.stringify({xp:p.xp,credits:p.credits,flags:p.flags});
 beginRound(b,'run',sequence(.00001,.99));const result=nextTurn(b,()=>0);
 assert.equal(result.escaped,true);assert.equal(b.phase,'escaped');assert.deepEqual(b.roundQueue,[]);
 b.inventory=[];assert.equal(escapeProgress(p,b),true);assert.deepEqual(p.inventory,[]);
 assert.equal(JSON.stringify({xp:p.xp,credits:p.credits,flags:p.flags}),before);assert.equal(b.enemies[0].hp,b.enemies[0].maxHp);
 const hp=b.hp;rollHealth(b,.1);assert.equal(b.hp,hp);assert.equal(nextTurn(b).ok,false);
});

test('failed escape costs one turn; fastest surviving enemy controls escape chance',()=>{
 const b=createEncounter('volunteer',hero(12),['volunteer','scanDrone']);
 close(battleEscapeChance(b),escapeChance(b.speed,48));beginRound(b,'run',sequence(.00001,.9,.99));
 const run=nextTurn(b,()=>.99);assert.equal(run.escaped,false);assert.equal(b.phase,'resolving');
 assert.equal(beginRound(b,'run').ok,false);
 const rest=finishRound(b);assert.equal(rest.filter(r=>r.actor==='enemy').length,2);assert.equal(b.turn,2);
 b.enemies[1].hp=0;close(battleEscapeChance(b),escapeChance(b.speed,5));
});

test('bosses, courier and scripted scan encounter cannot flee or bypass progression',()=>{
 for(const id of ['courier','bastion','regulator','karen','argus']){
  const b=createEncounter(id,hero(15));assert.equal(canRun(b),false);assert.equal(beginRound(b,'run').ok,false);assert.equal(b.phase,'command');
 }
 const b=createEncounter('junctionGuard',hero(15),['junctionGuard','scriptedScanDrone','scriptedScanDrone']);b.enemies[1].hp=b.enemies[2].hp=0;
 assert.equal(canRun(b),false);assert.equal(canRun(createEncounter('junctionGuard',hero(15))),true);
});

test('hearty field meal costs 200, heals 160, appears in Items and consumes once in speed-ordered combat',()=>{
 const p=hero(20);p.credits=199;const before=JSON.stringify(p);buy(p,'field-meal');assert.equal(JSON.stringify(p),before);
 p.credits=500;buy(p,'field-meal');buy(p,'field-meal');assert.equal(p.credits,100);
 const item=inventoryEntries(p).find(i=>i.id==='field-meal');assert.equal(item.count,2);assert.equal(item.heal,160);
 p.hp=50;const b=createEncounter('volunteer',p);beginRound(b,'item:field-meal',sequence(.00001,.99));
 const used=nextTurn(b);assert.equal(used.recovered,160);assert.equal(b.hp,50);assert.equal(b.targetHp,210);assert.equal(b.inventory.length,1);
 assert.equal(beginRound(b,'item:field-meal').ok,false);assert.equal(b.inventory.length,1);
 assert.equal(useInventoryItem(p,'field-meal').message,'Recovered 160 HP.');assert.equal(p.hp,210);
 p.hp=p.maxHp-10;assert.equal(useInventoryItem(p,'field-meal').message,'Recovered 10 HP.');assert.equal(p.inventory.length,0);
});

test('rolling HP falls at 12 HP/sec and rises at 24 HP/sec without snapping or overshooting',()=>{
 const b=createEncounter('volunteer',hero(12));b.hp=100;b.targetHp=50;
 for(let i=0;i<10;i++)rollHealth(b,.1);close(b.hp,88);
 b.targetHp=160;for(let i=0;i<10;i++)rollHealth(b,.1);close(b.hp,112);
 b.targetHp=113;rollHealth(b,.1);assert.equal(b.hp,113);
 b.hp=1;b.targetHp=0;rollHealth(b,.1);assert.equal(b.phase,'defeat');
});

test('levels continue beyond 20 with growing requirements, correct gains and save/load support',()=>{
 const p=hero(20),hp=p.maxHp;assert.equal(award(p,xpThreshold(27)-p.xp,0),7);assert.equal(p.level,27);assert.equal(p.maxHp,hp+84);assert.equal(playerStats(p).speed,31);
 assert.ok(xpThreshold(28)-xpThreshold(27)>xpThreshold(21)-xpThreshold(20));assert.ok(validProgress(p));
 const memory={getItem(){return this.data;},setItem(k,v){this.data=v;}};const book=new SaveSlots(memory);assert.ok(book.write(0,p));
 const loaded=new SaveSlots(memory).read(0);assert.equal(loaded.level,27);assert.equal(loaded.xp,p.xp);
 award(loaded,xpThreshold(100)-loaded.xp,0);assert.equal(loaded.level,100);assert.ok(validProgress(loaded));
 const old=freshProgress();delete old.speed;assert.ok(validProgress(old));assert.equal(createEncounter('courier',old).speed,5);
});

test('sentinel strength and distinct AI survive speed-order rounds; charged attacks still release next turn',()=>{
 assert.equal(ENEMIES.argusSentinel.hp,614);assert.equal(ENEMIES.argusSentinel.attack,111);assert.equal(ENEMIES.argusSentinel.charge,172);
 for(const [roll,type]of [[.049,'silly'],[.05,'attack'],[.17,'attack']]){
  const b=createEncounter('argusSentinel',hero(20));beginRound(b,'guard',sequence(.99,.001));
  assert.equal(nextTurn(b,sequence(roll,.99)).type,type);assert.equal(b.enemies.length,1);
 }
 const b=createEncounter('argusSentinel',hero(20));b.enemies[0].turn=3;beginRound(b,'guard',sequence(.99,.001));
 assert.equal(nextTurn(b,()=>.99).type,'charge');finishRound(b);
 beginRound(b,'guard',sequence(.99,.001));const release=nextTurn(b,sequence(.01,.99));assert.equal(release.type,'attack');assert.ok(release.damage);assert.equal(b.enemies[0].charged,false);
});
