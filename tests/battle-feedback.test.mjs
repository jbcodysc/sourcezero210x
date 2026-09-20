import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {freshProgress,award,playerStats,mark} from '../city/progress.mjs';
import {createEncounter,playerAction,enemyAction,encounterRewards,rollHealth,applyEnemyImpact,finishEnemyAnimation} from '../city/encounters.mjs';
import {beginRound,nextTurn,carryBattleInventory,escapeProgress} from '../city/battle-turns.mjs';
import {Typewriter} from '../lab/presentation.mjs';
const source=readFileSync(new URL('../city/city.js',import.meta.url),'utf8');
function setup(){
 const progress=freshProgress('Jamie'),state={origin:{scene:'Explore'},encounter:{id:'volunteer'}},events=[];
 const text=source.slice(source.indexOf('class BattleScene extends'),source.indexOf('if(!P)'));
 const Battle=vm.runInNewContext(text+';BattleScene',{SceneBase:class{},TidalWaveEffect:class{constructor(scene,callbacks){this.callbacks=callbacks;}destroy(){events.push('wave-disposed');}},applyEnemyImpact,finishEnemyAnimation,progress,state,award,playerStats,mark,encounterRewards,rollHealth,carryBattleInventory,escapeProgress,beginRound:(b,a)=>beginRound(b,a,()=>.5),nextTurn:b=>{const r=nextTurn(b,()=>.5);if(r.actor==='enemy')events.push('enemy');return r;},playerAction:(b,a)=>playerAction(b,a,()=>.5),enemyAction,heroName:()=>progress.name,save:()=>events.push('save'),resetControls(){},finishText(){return false;},advanceText(s,d){s.writer?.advance(d);},sound:{setMode(){},effect(){}},$:()=>({remove(){}})});
 const scene=new Battle();scene.battle=createEncounter('volunteer',progress);scene.enemySprites=new Map();scene.time={now:0,delayedCall(){}};scene.input={keyboard:{resetKeys(){}}};scene.scene={start:(...args)=>events.push(args)};scene.updateVitals=()=>{};scene.patternTime=0;scene.cameras={main:{shake(){}}};
 scene.renderHUD=()=>{events.push('render');if(scene.battle.phase==='victory'&&!scene.actionPresentation)scene.reward();else scene.writer=new Typewriter(scene.battle.message,44);};
 scene.renderNotice=()=>events.push('notice');
 return {scene,progress,events};
}
test('player action stays visible for 1.8 seconds after typing, and commands cannot skip it',()=>{
 const {scene,events}=setup();scene.handleAction('guard');const message=scene.battle.message;
 for(let i=0;i<10;i++)scene.update(0,100);assert.equal(events.includes('enemy'),false);
 scene.handleAction('attack');assert.equal(scene.battle.message,message);
 scene.writer.finish();for(let i=0;i<17;i++)scene.update(0,100);assert.equal(events.includes('enemy'),false);
 scene.update(0,100);assert.equal(events.filter(e=>e==='enemy').length,1);
});
test('healing confirmation blocks repeated goods, pauses damage, and releases exactly one enemy turn',()=>{
 const {scene,events}=setup();scene.battle.hp=scene.battle.targetHp=45;scene.battle.snacks=3;
 scene.handleAction('snack');assert.equal(scene.notice.recovered,65);assert.equal(scene.battle.snacks,2);
 assert.equal(scene.battle.hp,45,'healing must not snap the counter to its target');
 for(let i=0;i<20;i++){scene.handleAction('snack');scene.update(0,100);}
 assert.ok(Math.abs(scene.battle.hp-93)<.00001,'healing continues at 24 HP/sec behind the notice');
 assert.equal(scene.battle.snacks,2);assert.equal(events.includes('enemy'),false);
 scene.handleAction('notice-next');assert.equal(scene.notice,null);assert.equal(events.filter(e=>e==='enemy').length,1);assert.equal(scene.battle.snacks,2);
});
test('a finishing blow remains readable before XP and level-up notices are awarded',()=>{
 const {scene,progress,events}=setup();progress.xp=20;scene.battle.enemyHp=1;scene.handleAction('attack');
 assert.equal(scene.battle.phase,'victory');assert.match(scene.battle.message,/31 damage/);assert.equal(progress.level,1);
 scene.writer.finish();for(let i=0;i<18;i++)scene.update(0,100);
 assert.equal(progress.level,2);assert.equal(scene.notice.kind,'level');assert.equal(scene.notice.name,'Jamie');
 assert.deepEqual(JSON.parse(JSON.stringify(scene.notice.after)),{health:122,attack:34,defense:2,speed:6});
 const xp=progress.xp;scene.reward();assert.equal(progress.xp,xp);
 scene.handleAction('return');assert.equal(scene.closed,undefined);
 scene.handleAction('notice-next');assert.equal(scene.notice.page,1);assert.equal(scene.closed,undefined);
 scene.handleAction('notice-next');assert.equal(scene.closed,true);assert.ok(events.some(e=>Array.isArray(e)&&e[0]==='Explore'));
});
test('multi-level increases reflect actual stats and equipment without changing combat balance',()=>{
 const p=freshProgress();p.upgrade=2;p.armor='laminate-vest';const before=playerStats(p);assert.equal(award(p,225,0),3);const after=playerStats(p);
 assert.deepEqual({health:after.health-before.health,attack:after.attack-before.attack,defense:after.defense-before.defense},{health:36,attack:9,defense:6});
 const encounter=createEncounter('volunteer',p);assert.equal(encounter.heroAttack,after.attack);assert.equal(encounter.defense,after.defense);
});
test('rolling HP defeat during a reading pause still opens recovery',()=>{
 const {scene}=setup();scene.battle.hp=1;scene.battle.targetHp=0;scene.handleAction('guard');scene.update(0,100);
 assert.equal(scene.battle.phase,'defeat');assert.equal(scene.actionPresentation,null);
});

test('the actual escape return preserves used items and requests post-battle immunity without awarding XP',()=>{
 const {scene,progress,events}=setup();const before={xp:progress.xp,credits:progress.credits,flags:JSON.stringify(progress.flags)};
 scene.battle.phase='escaped';scene.battle.hp=63.2;scene.battle.snacks=0;scene.battle.inventory=['field-meal'];
 scene.handleAction('return');assert.equal(progress.hp,64);assert.equal(progress.snacks,0);assert.deepEqual(progress.inventory,['field-meal']);
 assert.equal(progress.xp,before.xp);assert.equal(progress.credits,before.credits);assert.equal(JSON.stringify(progress.flags),before.flags);
 const returned=events.find(e=>Array.isArray(e));assert.equal(returned[0],'Explore');assert.equal(returned[1].afterBattle,true);assert.ok(events.includes('save'));
});


test('BattleScene locks every command until the animated hit completes, then resumes the queued round',()=>{
 const {scene,progress,events}=setup();
 scene.battle=createEncounter('regulator',{...progress,level:10,maxHp:218,hp:218,armor:'insulated-vest',upgrade:1});scene.battle.enemyHp=194;
 scene.handleAction('attack');scene.writer.finish();for(let i=0;i<18;i++)scene.update(0,100);
 const b=scene.battle,effect=scene.enemyEffect;assert.equal(b.phase,'enemyAnimation');assert.equal(b.enemyHp,130);assert.equal(b.targetHp,218);
 const snapshot=JSON.stringify(b);
 for(const command of ['attack','guard','goods','item:sandwich','run','target-0','return'])scene.handleAction(command);
 scene.resolveTurn();assert.equal(JSON.stringify(b),snapshot);
 effect.callbacks.onImpact();effect.callbacks.onImpact();assert.equal(b.targetHp,53);
 effect.callbacks.onComplete();assert.equal(scene.enemyEffect,null);assert.equal(b.phase,'resolving');assert.equal(b.message,'165 damage.');
 scene.writer.finish();for(let i=0;i<10;i++)scene.update(0,100);assert.equal(b.phase,'command');assert.equal(b.turn,2);assert.equal(events.filter(e=>e==='enemy').length,1);
});
