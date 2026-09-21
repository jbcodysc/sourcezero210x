import test from 'node:test';
import assert from 'node:assert/strict';
import {freshProgress,playerStats,xpThreshold} from '../city/progress.mjs';
import {createLou,joinLou,normalizeParty,awardParty,restoreParty} from '../city/party.mjs';
import {createEncounter,commandMember,playerAction,enemyAction,rollHealth,revealReinforcement,livingParty,ENEMIES} from '../city/encounters.mjs';
import {beginRound,nextTurn,carryBattleInventory,canRun} from '../city/battle-turns.mjs';
import {hasMagic,statusPanel,useInventoryItem} from '../city/core-status.mjs';
const progress=()=>{const s=freshProgress('Jamie');Object.assign(s,{level:26,xp:xpThreshold(26),hp:410,maxHp:410,upgrade:2,armor:'laminate-vest',snacks:5,inventory:['field-meal','caramel-macchiato']});joinLou(s);return s;};
const battle=()=>createEncounter('residentialPorter',progress());
function drain(b,rng=()=>.5){const results=[];let limit=30;while(b.phase==='resolving'&&limit--){const r=nextTurn(b,rng);results.push(r);if(b.phase==='reinforcement')revealReinforcement(b);}assert.ok(limit>0);return results;}

test('Lou joins once with durable physical stats, no MP, independent saved equipment and HP',()=>{
 const s=progress(),lou=s.party[0];assert.ok(lou.maxHp>s.maxHp);assert.ok(lou.attack>playerStats(s).attack);assert.equal(hasMagic(lou),false);assert.doesNotMatch(statusPanel(lou),/>MP</);assert.match(statusPanel(lou),/Electro-halberd/);assert.match(statusPanel(lou),/Reinforced work jacket/);
 lou.hp=183;joinLou(s);assert.equal(s.party.length,1);const reloaded=JSON.parse(JSON.stringify(s));normalizeParty(reloaded);assert.equal(reloaded.party[0].hp,183);assert.deepEqual(reloaded.party[0].equipment,lou.equipment);
});
test('both party members choose independently before a speed-ordered round and each acts once',()=>{
 const b=battle();assert.equal(commandMember(b).id,'hero');assert.equal(beginRound(b,'attack',()=>.5).awaitingCommands,true);assert.equal(b.phase,'command');assert.equal(b.enemyHp,720);assert.equal(commandMember(b).id,'lou');assert.equal(beginRound(b,'attack',()=>.5).ok,true);
 const results=drain(b);assert.deepEqual(results.filter(r=>r.actor==='hero').map(r=>r.actorId),['hero','lou']);assert.equal(results.filter(r=>r.actor==='enemy').length,1);assert.equal(b.turn,2);assert.equal(commandMember(b).id,'hero');
});
test('the party architecture supports a third future member without adding a special combat slot',()=>{
 const s=progress();s.party.push({...createLou(s),id:'future',name:'Future ally',speed:100});const b=createEncounter('residentialPorter',s);
 beginRound(b,'guard');beginRound(b,'guard');beginRound(b,'attack');const r=drain(b);assert.equal(r.filter(r=>r.actor==='hero').length,3);assert.equal(b.party.length,3);
});
test('Guard and healing outrank fast enemies for every member and guards expire together',()=>{
 const b=battle();b.enemies[0].stats={...b.enemies[0].stats,speed:10000};b.party[1].hp=b.party[1].targetHp=200;
 beginRound(b,'guard',()=>.5);beginRound(b,'item:field-meal',()=>.5);assert.deepEqual(b.roundQueue.slice(0,2).map(a=>a.who),['hero','hero']);const results=drain(b);assert.equal(results.find(r=>r.itemId)?.recipientId,'lou');assert.equal(results.find(r=>r.itemId)?.recovered,160);assert.equal(b.party[1].targetHp,360-results.filter(r=>r.targetPartyId==='lou').reduce((sum,r)=>sum+(r.damage||0),0));assert.equal(b.party.every(member=>!member.guarding),true);
});
test('shared goods cannot be assigned twice; healing can target another member and revive them',()=>{
 const b=battle();b.hp=b.targetHp=250;b.party[1].hp=b.party[1].targetHp=200;
 beginRound(b,'item:field-meal');assert.equal(beginRound(b,'item:field-meal').ok,false);beginRound(b,'guard');drain(b);assert.equal(b.inventory.includes('field-meal'),false);
 b.phase='command';b.commandIndex=0;b.party[1].hp=b.party[1].targetHp=0;b.healTargetId='lou';const r=playerAction(b,'snack',()=>.5);assert.equal(r.recipientId,'lou');assert.equal(b.party[1].targetHp,70);assert.equal(b.party[1].hp,1);
});
test('an incapacitated protagonist does not defeat an active ally and down members lose queued turns',()=>{
 const b=battle();beginRound(b,'attack');beginRound(b,'attack');b.hp=0;b.targetHp=0;rollHealth(b,.1);assert.notEqual(b.phase,'defeat');assert.equal(livingParty(b).length,1);assert.ok(drain(b).every(r=>r.actorId!=='hero'));assert.equal(commandMember(b).id,'lou');
 b.party[1].hp=0;b.party[1].targetHp=0;rollHealth(b,.1);assert.equal(b.phase,'defeat');
});
test('a member falling during command selection automatically hands the cursor to a standing ally',()=>{
 const b=battle();b.hp=b.targetHp=0;assert.equal(commandMember(b).id,'lou');assert.equal(b.commandIndex,1);assert.equal(b.healTargetId,'lou');assert.equal(beginRound(b,'attack').awaitingCommands,undefined);assert.ok(b.roundQueue.every(actor=>actor.memberId!=='hero'));
});
test('rolling HP, notice recovery, buff persistence and victory XP operate independently',()=>{
 const s=progress(),b=createEncounter('residentialPorter',s);b.targetHp=100;b.party[1].hp=100;b.party[1].targetHp=150;
 rollHealth(b,.1,{healingOnly:true});assert.equal(b.hp,410);assert.equal(b.party[1].hp,102.4);rollHealth(b,.1);assert.equal(b.hp,408.8);assert.equal(b.party[1].hp,104.80000000000001);
 b.party[1].speedBoostTurns=2;carryBattleInventory(s,b);assert.equal(s.party[0].hp,105);assert.equal(s.party[0].speedBoostTurns,2);s.party[0].hp=0;
 const level=s.party[0].level,notices=awardParty(s,xpThreshold(level+1)-s.party[0].xp);assert.equal(notices[0].name,'Lou');assert.equal(s.party[0].level,level+1);assert.equal(s.party[0].hp,0,'XP does not revive a fallen member');restoreParty(s);assert.equal(s.party[0].hp,s.party[0].maxHp);
});
test('outside-battle goods can target Lou while consuming the shared item only once',()=>{
 const s=progress();s.party[0].hp=100;const result=useInventoryItem(s,'field-meal','lou');assert.equal(result.ok,true);assert.equal(s.party[0].hp,260);assert.equal(s.hp,410);assert.equal(s.inventory.includes('field-meal'),false);
});
test('containment adaptation ramps gently to 30%, reacts per member, and variety resets it',()=>{
 const b=createEncounter('containment8',progress()),hits=[];
 for(let i=0;i<7;i++){b.phase='command';hits.push(playerAction(b,'attack',()=>.5,{queued:true}).damage);}
 assert.equal(hits[0],126);assert.equal(hits[1],126);assert.ok(hits[2]<126);assert.equal(hits.at(-1),88);assert.match(b.message,/BEHAVIOR MODEL UPDATED/);
 b.phase='command';playerAction(b,'guard',()=>.5,{queued:true});b.phase='command';assert.equal(playerAction(b,'attack',()=>.5,{queued:true}).damage,126);
 b.phase='command';assert.equal(playerAction(b,'attack',()=>.5,{queued:true,actorId:'lou'}).damage,130);
});
test('containment foam slows one member, preserves promised charges, and never summons lethal units',()=>{
 const b=createEncounter('containment8',progress()),foe=b.enemies[0];assert.equal(canRun(b),false);assert.equal(foe.stats.noHelp,true);foe.turn=2;b.phase='resolving';b.enemyQueue=[0];let result=enemyAction(b,()=>.5,{queued:true});assert.equal(result.type,'restraint');assert.ok(b.party.some(member=>member.slowTurns===2));assert.match(b.message,/alive/);
 foe.charged=true;foe.turn=6;b.phase='resolving';b.enemyQueue=[0];result=enemyAction(b,()=>.5,{queued:true});assert.equal(result.type,'attack');assert.ok(result.damage>0);assert.equal(foe.charged,false);assert.match(b.message,/ENVIRONMENTAL OVERRIDE/);
});
test('residential reinforcements stay within building/Cenexis roster and enemies strengthen upward',()=>{
 for(const id of ['residentialCleaner','residentialPorter','residentialMaintenance','solaceResponse']){const b=createEncounter(id,progress());b.phase='resolving';b.enemyQueue=[0];const result=enemyAction(b,()=>.17,{queued:true});assert.equal(result.type,'help');revealReinforcement(b);assert.ok(['residentialCleaner','residentialPorter','residentialMaintenance'].includes(b.enemies[1].id));}
 assert.ok(ENEMIES.solaceResponse.attack>ENEMIES.residentialMaintenance.attack);assert.ok(ENEMIES.residentialMaintenance.attack>ENEMIES.residentialCleaner.attack);
});
