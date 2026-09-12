import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {freshProgress,award,playerStats,mark} from '../city/progress.mjs';
import {createEncounter,playerAction,enemyAction,encounterRewards,rollHealth} from '../city/encounters.mjs';
import {Typewriter} from '../lab/presentation.mjs';
const source=readFileSync(new URL('../city/city.js',import.meta.url),'utf8');
function setup(){
 const progress=freshProgress('Jamie'),state={origin:{scene:'Explore'},encounter:{id:'volunteer'}},events=[];
 const text=source.slice(source.indexOf('class BattleScene extends'),source.indexOf('if(!P)'));
 const Battle=vm.runInNewContext(text+';BattleScene',{SceneBase:class{},progress,state,award,playerStats,mark,encounterRewards,rollHealth,playerAction:(b,a)=>playerAction(b,a,()=>.5),enemyAction,heroName:()=>progress.name,save:()=>events.push('save'),resetControls(){},finishText(){return false;},advanceText(s,d){s.writer?.advance(d);},sound:{setMode(){},effect(){}},$:()=>({remove(){}})});
 const scene=new Battle();scene.battle=createEncounter('volunteer',progress);scene.enemySprites=new Map();scene.time={now:0,delayedCall(){}};scene.input={keyboard:{resetKeys(){}}};scene.scene={start:(...args)=>events.push(args)};scene.updateVitals=()=>{};scene.patternTime=0;
 scene.renderHUD=()=>{events.push('render');if(scene.battle.phase==='victory'&&!scene.actionPresentation)scene.reward();else scene.writer=new Typewriter(scene.battle.message,44);};
 scene.renderNotice=()=>events.push('notice');scene.resolveEnemyTurn=()=>{events.push('enemy');enemyAction(scene.battle,()=>.5);};
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
 for(let i=0;i<20;i++){scene.handleAction('snack');scene.update(0,100);}
 assert.equal(scene.battle.snacks,2);assert.equal(events.includes('enemy'),false);
 scene.handleAction('notice-next');assert.equal(scene.notice,null);assert.equal(events.filter(e=>e==='enemy').length,1);assert.equal(scene.battle.snacks,2);
});
test('a finishing blow remains readable before XP and level-up notices are awarded',()=>{
 const {scene,progress,events}=setup();progress.xp=20;scene.battle.enemyHp=1;scene.handleAction('attack');
 assert.equal(scene.battle.phase,'victory');assert.match(scene.battle.message,/31 damage/);assert.equal(progress.level,1);
 scene.writer.finish();for(let i=0;i<18;i++)scene.update(0,100);
 assert.equal(progress.level,2);assert.equal(scene.notice.kind,'level');assert.equal(scene.notice.name,'Jamie');
 assert.deepEqual(JSON.parse(JSON.stringify(scene.notice.after)),{health:122,attack:34,defense:2});
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
