import test from 'node:test';
import assert from 'node:assert/strict';
import {freshProgress,award,xpThreshold} from '../city/progress.mjs';
import {createEncounter,enemyAction,playerAction,applyEnemyImpact,finishEnemyAnimation,encounterRewards,rollHealth} from '../city/encounters.mjs';
import {beginRound,nextTurn} from '../city/battle-turns.mjs';
import {transition,resumeEvent,ARGUS_SCENE,ARGUS_BROADCASTS,dialogueLines} from '../fairmont/story.mjs';
import {createChapterProgress} from '../city/chapter-start.mjs';
import {SaveSlots} from '../city/save-slots.mjs';
import {securityName,securitySpeaker,SECURITY_DESIGNATION} from '../fairmont/security-identity.mjs';

const attack=b=>{b.phase='resolving';b.enemyQueue=[0];return enemyAction(b,()=>.5,{queued:true});};
function boss(){const p=freshProgress();award(p,xpThreshold(20),0);p.armor='laminate-vest';p.hp=p.maxHp;return createEncounter('argus',p);}
test('missiles take the next turn at 20%, precede antics/charge, hit exactly three times and never repeat',()=>{
 const b=boss();b.enemyHp=287;assert.equal(attack(b).type,'attack');
 b.targetHp=b.hp=338;b.enemyHp=286;b.charged=true;const r=attack(b);assert.equal(r.type,'missile-volley');assert.equal(b.charged,false);
 assert.equal(b.targetHp,338);assert.equal(r.impact.damage,260);assert.deepEqual(r.impact.hits,[86,86,88]);
 assert.equal(beginRound(b,'snack').ok,false);assert.equal(nextTurn(b).ok,false);assert.equal(finishEnemyAnimation(b,r.impact),false);
 for(const [i,hp]of [[0,252],[1,166],[2,78]]){assert.equal(applyEnemyImpact(b,r.impact,i),true);assert.equal(b.targetHp,hp);assert.equal(applyEnemyImpact(b,r.impact,i),false);}
 assert.equal(applyEnemyImpact(b,{...r.impact},0),false);assert.equal(finishEnemyAnimation(b,r.impact),true);
 assert.equal(b.phase,'resolving');b.enemyHp=1;for(let i=0;i<8;i++)assert.notEqual(attack(b).type,'missile-volley');
});
test('volley respects defense, Guard, miss rate and stale callbacks after defeat',()=>{
 const b=boss();b.enemyHp=100;b.guarding=true;assert.equal(attack(b).impact.damage,78);
 const miss=boss();miss.enemyHp=100;miss.phase='resolving';miss.enemyQueue=[0];const r=enemyAction(miss,()=>.01,{queued:true});
 assert.equal(r.type,'missile-volley');assert.deepEqual(r.impact.hits,[0,0,0]);
 miss.phase='defeat';assert.equal(applyEnemyImpact(miss,r.impact,1),false);assert.equal(finishEnemyAnimation(miss,r.impact),false);
});
test('lethal damage leaves S.C.R.A.P. at one HP, stops queued actions and freezes rolling damage during farewell',()=>{
 const b=boss();b.enemyHp=20;b.targetHp=0;b.hp=17;
 const result=playerAction(b,'attack',()=>.5,{queued:true});assert.ok(result.ok);assert.equal(b.enemyHp,1);assert.equal(b.phase,'bossRetreat');
 assert.doesNotMatch(result.actionMessage,/shuts down/);assert.deepEqual(b.roundQueue,[]);assert.equal(nextTurn(b).ok,false);
 for(let i=0;i<100;i++)rollHealth(b,.1);assert.equal(b.hp,17);assert.equal(b.targetHp,17);
 assert.deepEqual(encounterRewards(b),{xp:950,credits:450});assert.equal(playerAction(b,'attack').ok,false);
 const ordinary=createEncounter('heavyDrone',freshProgress());ordinary.enemyHp=1;playerAction(ordinary,'attack',()=>.5);assert.equal(ordinary.enemyHp,0);assert.equal(ordinary.phase,'victory');
});
function ready(){const p=createChapterProgress('2-facility');Object.assign(p.flags,{CH2_DRONE_FACILITY_ENTERED:true,CH2_CORE_SHUTTERS:true});return transition(transition(p,'argus-entrance-start').state,'argus-entrance-complete').state;}
test('broadcasts stay classified until the hero names him; the reveal persists through save/load',()=>{
 let p=ready();assert.equal(securityName(p),SECURITY_DESIGNATION);assert.equal(securitySpeaker(p),'[Classified]');
 assert.ok(dialogueLines(ARGUS_BROADCASTS[2],p).every(l=>l.speaker==='[Classified]'));
 const lines=dialogueLines(ARGUS_SCENE,p);assert.match(lines[0].text,/Security Combat Response Autonomous Pursuer/);assert.equal(lines[1].text,"So, you're S.C.R.A.P.?");assert.equal(lines[2].speaker,'S.C.R.A.P.');
 p=transition(p,{type:'argus-dialogue-step',step:2}).state;
 const memory=new Map(),storage={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)};
 new SaveSlots(storage).write(0,p);p=new SaveSlots(storage).read(0);assert.equal(securitySpeaker(p),'S.C.R.A.P.');assert.equal(securityName(p),'S.C.R.A.P.');
});
test('victory reloads into escape, the breach persists, then reflection/archive resume once without a rematch',()=>{
 let p=transition(ready(),'argus-start').state;p=transition(p,'argus-defeated').state;
 assert.deepEqual(resumeEvent(p),{type:'argus-escape',step:0});assert.equal(transition(p,'archive-read').changed,false);assert.equal(transition(p,'argus-reflected').changed,false);
 p=transition(p,'argus-wall-breached').state;p=JSON.parse(JSON.stringify(p));assert.deepEqual(resumeEvent(p),{type:'argus-escape',step:1});
 assert.equal(transition(p,'argus-wall-breached').changed,false);
 p=transition(p,'argus-escape-complete').state;assert.equal(resumeEvent(p).type,'reflection');assert.equal(p.flags.CH2_ARGUS_WALL_BREACHED,true);
 p=transition(p,'argus-reflected').state;assert.equal(resumeEvent(p),null);assert.equal(transition(p,'argus-start').changed,false);
 p=transition(p,'archive-read').state;assert.equal(p.flags.CH2_COMPLETE,true);assert.equal(transition(p,'argus-defeated').changed,false);
});
