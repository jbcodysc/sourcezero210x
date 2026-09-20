import {applyEnemyImpact,finishEnemyAnimation,revealReinforcement} from '../city/encounters.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ENEMIES,MISS_RATE,SILLY_RATE,HELP_RATE,ENEMY_DAMAGE_MULTIPLIER,MAX_ACTIVE_ENEMIES,
  createEncounter,playerAction,enemyAction,livingEnemies,selectTarget,encounterRewards,
} from '../city/encounters.mjs';
import { FAIRMONT_ENEMIES } from '../fairmont/enemies.mjs';
import { freshProgress, xpThreshold } from '../city/progress.mjs';

const hero = (level=10,snacks=4) => ({...freshProgress('Rowan'),level,xp:xpThreshold(level),maxHp:110+12*(level-1),hp:110+12*(level-1),upgrade:1,armor:'insulated-vest',snacks});
const sequence = (...values) => {let i=0;return ()=>values[Math.min(i++,values.length-1)];};

test('the park encounter begins with exactly one guard and two drones', () => {
  const battle=createEncounter('junctionGuard',hero(12),['junctionGuard','scriptedScanDrone','scriptedScanDrone']);
  assert.deepEqual(battle.enemies.map(enemy=>enemy.id),['junctionGuard','scriptedScanDrone','scriptedScanDrone']);
  assert.equal(new Set(battle.enemies.map(enemy=>enemy.uid)).size,3);
  assert.equal(battle.nextUid,3);
  playerAction(battle,'guard');
  const help=enemyAction(battle,()=>.17);
  assert.equal(help.type,'help');
  assert.equal(help.joined,undefined);
  assert.equal(livingEnemies(battle).length,MAX_ACTIVE_ENEMIES);
});

test('every Fairmont reinforcement belongs to its assigned Fairmont enemy type', () => {
  for(const [id,stats] of Object.entries(FAIRMONT_ENEMIES)) {
    if(stats.noHelp)continue;
    const battle=createEncounter(id,hero());
    playerAction(battle,'guard');
    const result=enemyAction(battle,()=>.17);
    assert.equal(result.type,'help',id);revealReinforcement(battle);
    const helper=battle.enemies.find(enemy=>enemy.uid===result.joined);
    assert.equal(helper.id,stats.helper,id);
    assert.ok(Object.hasOwn(FAIRMONT_ENEMIES,helper.id),`${id} summoned a Chapter 1 enemy`);
    assert.notEqual(helper.id,'volunteer');
  }
});

test('a replacement reinforcement gets its own target identity and rewards', () => {
  const battle=createEncounter('junctionGuard',hero(),['junctionGuard','scriptedScanDrone','scriptedScanDrone']);
  battle.enemies[1].hp=0;
  playerAction(battle,'guard');
  const result=enemyAction(battle,()=>.17);
  assert.equal(result.joined,3);revealReinforcement(battle);
  assert.equal(livingEnemies(battle).length,3);
  while(battle.phase==='resolving')enemyAction(battle,()=>.1);
  assert.ok(selectTarget(battle,3));
  assert.equal(selectTarget(battle,1),false);
  assert.deepEqual(encounterRewards(battle),{xp:ENEMIES.scriptedScanDrone.xp,credits:ENEMIES.scriptedScanDrone.credits});
});

test('the existing 5 percent misses, 15 percent silliness, 5 percent help and damage multiplier are retained', () => {
  assert.equal(MISS_RATE,.05);assert.equal(SILLY_RATE,.15);assert.equal(HELP_RATE,.05);assert.equal(ENEMY_DAMAGE_MULTIPLIER,1.3);
  for(const [roll,expected] of [[0,'silly'],[.149999,'silly'],[.15,'help'],[.199999,'help'],[.2,'attack']]) {
    const battle=createEncounter('retailCleaner',hero());
    playerAction(battle,'guard');
    assert.equal(enemyAction(battle,sequence(roll,.99)).type,expected);
  }
  for(const [roll,miss] of [[.049999,true],[.05,false]]) {
    const battle=createEncounter('retailCleaner',hero());
    assert.equal(playerAction(battle,'attack',()=>roll).miss,miss);
    assert.equal(enemyAction(battle,sequence(.8,roll)).type,miss?'miss':'attack');
  }
});

test('courier, K.A.R.E.N. and A.R.G.U.S. cannot call reinforcements', () => {
  for(const id of ['courier','bastion','regulator','karen','argus']) {
    const battle=createEncounter(id,hero());
    assert.equal(battle.enemy.noHelp,true,id);
    playerAction(battle,'guard');
    assert.equal(enemyAction(battle,sequence(.17,.99)).type,'attack',id);
    assert.equal(battle.enemies.length,1,id);
  }
});

test('every charged enemy releases on its next turn instead of being silly, calling help or charging again', () => {
  for(const id of Object.keys(ENEMIES)) for(const temptingRoll of [0,.17,.99]) {
    const battle=createEncounter(id,hero());
    battle.enemies[0].turn=3;
    playerAction(battle,'guard');
    assert.equal(enemyAction(battle,()=>.99).type,'charge',id);
    assert.equal(battle.enemies[0].charged,true,id);
    playerAction(battle,'guard');
    const release=enemyAction(battle,sequence(temptingRoll,.99));
    assert.equal(release.type,'attack',id);
    assert.ok(release.damage>0,id);
    assert.equal(battle.enemies[0].charged,false,id);
    assert.equal(battle.enemies.length,1,id);
  }
  const battle=createEncounter('argus',hero());
  battle.enemies[0].charged=true;
  playerAction(battle,'guard');
  assert.equal(enemyAction(battle,sequence(0,0)).type,'miss');
  assert.equal(battle.enemies[0].charged,false,'a missed release also consumes the charge');
});

test('Chapter 1 enemy balance remains unchanged while adding the Fairmont roster', () => {
  const chapter1={
    courier:[180,15,38,25,22],volunteer:[90,10,24,12,14],contractor:[118,13,29,19,19],
    cleaner:[105,12,28,16,17],loader:[138,15,32,22,22],bastion:[320,21,43,105,90],
    waterScrubber:[160,40,60,55,32],pipeBot:[184,42,64,65,38],pipeRat:[132,39,54,50,20],
    waterGuard:[198,44,65,70,45],drainBot:[175,41,62,60,35],regulator:[650,46,70,300,180],
  };
  for(const [id,values] of Object.entries(chapter1))assert.deepEqual(['hp','attack','charge','xp','credits'].map(key=>ENEMIES[id][key]),values,id);
});

test('Chapter 2 gets tougher without buffing the two scripted drones or adding encounters',()=>{
  const previous={retailCleaner:[250,52,79],retailSecurity:[290,57,88],retailService:[265,54,83],karen:[780,62,104],junctionGuard:[180,43,72],scanDrone:[240,54,84],facilitySecurity:[340,70,108],testDrone:[330,69,106],heavyDrone:[420,77,119],assemblyArm:[445,80,124],argus:[1300,82,135]};
  assert.deepEqual(Object.keys(FAIRMONT_ENEMIES).sort(),[...Object.keys(previous),'scriptedScanDrone','argusSentinel'].sort());
  for(const [id,old]of Object.entries(previous))for(const [index,key]of ['hp','attack','charge'].entries()){
    assert.ok(FAIRMONT_ENEMIES[id][key]>old[index],`${id} ${key} should increase`);
  }
  assert.deepEqual(['hp','attack','charge','xp','credits'].map(key=>FAIRMONT_ENEMIES.scriptedScanDrone[key]),[115,36,58,70,29]);
  assert.equal(FAIRMONT_ENEMIES.scriptedScanDrone.noHelp,true);
});

function seededRandom(seed) {
  let state=seed>>>0;
  return ()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
}

function chooseAction(battle) {
  const foes=livingEnemies(battle).sort((a,b)=>a.hp-b.hp);
  const charged=foes.filter(enemy=>enemy.charged);
  const finishable=foes.find(enemy=>enemy.hp<=battle.heroAttack+(enemy.charged?4:0));
  const target=charged.length===1&&charged[0].hp<=battle.heroAttack+4?charged[0]:finishable||foes[0];
  selectTarget(battle,target.uid);
  if((foes.length===1 || charged.length===1&&target.charged) && target.hp<=battle.heroAttack+(target.charged?4:0))return 'attack';
  if(charged.length)return 'guard';
  const predicted=foes.reduce((sum,enemy)=>sum+Math.round(Math.max(4,enemy.stats.attack+(enemy.turn%2===0?3:0)-battle.defense)*ENEMY_DAMAGE_MULTIPLIER),0);
  const freeHealingTurn=foes.every(enemy=>enemy.turn%3===0);
  if(battle.snacks && (battle.targetHp<Math.max(battle.maxHp*.4,predicted*1.8) || freeHealingTurn&&battle.maxHp-battle.targetHp>=60))return 'snack';
  return 'attack';
}

function simulate(id,level,snacks,seed,group=null) {
  const equipped={...hero(level,snacks),upgrade:2,armor:'laminate-vest'};
  const battle=createEncounter(id,equipped,group),random=seededRandom(seed);
  let rounds=0;
  while(!['victory','defeat'].includes(battle.phase)&&rounds++<180) {
    const action=playerAction(battle,chooseAction(battle),random);
    assert.ok(action.ok,'simulation chose an unavailable action');
    if(battle.phase==='bossRetreat')battle.phase='victory';
    while(battle.phase==='resolving') {
      const result=enemyAction(battle,random);if(result.joined!==undefined)revealReinforcement(battle);
      if(result.impact){for(let i=0;i<(result.impact.hits?.length||1);i++)applyEnemyImpact(battle,result.impact,i);finishEnemyAnimation(battle,result.impact);}
      // Settle all incoming damage before the next choice; this deliberately
      // avoids depending on fast input rescuing the rolling health counter.
      battle.hp=battle.targetHp;
      if(battle.hp<=0){battle.phase='defeat';break;}
    }
  }
  return {win:battle.phase==='victory',rounds,used:snacks-battle.snacks,hp:battle.hp};
}

test('representative level 10–20 battles complete under a bounded guard/healing strategy', t => {
  const cases=[
    ['retailCleaner',10,2],['retailSecurity',10,2],['karen',11,3],['karen',12,3],
    ['junctionGuard',12,3,['junctionGuard','scriptedScanDrone','scriptedScanDrone']],
    ['facilitySecurity',13,3],['assemblyArm',13,3],['heavyDrone',15,3],
    ['argus',16,4],['argus',16,6],['argus',18,2],['argus',18,4],['argus',19,4],
    ['argus',20,0],['argus',20,2],['argus',20,4],['argus',20,6],
  ];
  for(const [id,level,snacks,group] of cases) {
    const results=Array.from({length:200},(_,seed)=>simulate(id,level,snacks,seed+1,group));
    const wins=results.filter(result=>result.win);
    assert.ok(results.every(result=>result.rounds<=180),`${id} battle never resolved`);
    // This is a diagnostic balance sample rather than an arbitrary difficulty
    // requirement. Structural regressions above are asserted independently.
    t.diagnostic(`${id}${group?' (guard + two drones)':''}, Lv${level}, ${snacks} sandwiches: ${wins.length/2}% wins; winning averages ${wins.length?(wins.reduce((sum,r)=>sum+r.rounds,0)/wins.length).toFixed(1):'—'} turns, ${wins.length?(wins.reduce((sum,r)=>sum+r.used,0)/wins.length).toFixed(2):'—'} sandwiches, ${wins.length?(wins.reduce((sum,r)=>sum+r.hp,0)/wins.length).toFixed(0):'—'} HP left`);
  }
});
