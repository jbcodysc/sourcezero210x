import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {freshProgress,award,xpThreshold} from '../city/progress.mjs';
import {createEncounter,enemyAction,applyEnemyImpact,finishEnemyAnimation,rollHealth,ENEMIES} from '../city/encounters.mjs';
import {beginRound,nextTurn} from '../city/battle-turns.mjs';
import {TidalWaveEffect,MissileVolleyEffect,registerScreenAttacks,TIDAL_WAVE} from '../city/screen-attacks.mjs';

function boss(){const p=freshProgress();award(p,xpThreshold(10),0);p.armor='insulated-vest';p.hp=p.maxHp;return createEncounter('regulator',p);}
function enemy(b){b.phase='resolving';b.enemyQueue=[0];return enemyAction(b,()=>.99,{queued:true});}

test('only DELUGE triggers at or below 20%, once per encounter, with no damage or narration at launch',()=>{
 assert.deepEqual(Object.keys(ENEMIES).filter(id=>ENEMIES[id].tidalWavePower),['regulator']);
 const b=boss();b.enemyHp=131;assert.equal(enemy(b).type,'attack');
 b.enemyHp=130;const before=b.targetHp,r=enemy(b);assert.equal(r.type,'tidal-wave');assert.equal(b.phase,'enemyAnimation');assert.equal(b.targetHp,before);assert.equal(b.message,'');
 assert.equal(r.impact.damage,165);assert.equal(nextTurn(b).ok,false);assert.equal(beginRound(b,'snack').ok,false);
 assert.equal(applyEnemyImpact(b,{...r.impact}),false,'stale callback cannot affect a different action');
 assert.equal(applyEnemyImpact(b,r.impact),true);assert.equal(b.targetHp,before-165);assert.equal(b.hp,b.maxHp,'damage still rolls');assert.equal(applyEnemyImpact(b,r.impact),false);
 rollHealth(b,.1);assert.ok(b.hp<b.maxHp);assert.equal(finishEnemyAnimation(b,r.impact),true);assert.equal(finishEnemyAnimation(b,r.impact),false);
 b.enemyHp=1;for(let i=0;i<7;i++)assert.notEqual(enemy(b).type,'tidal-wave');
 const retry=boss();retry.enemyHp=1;assert.equal(enemy(retry).type,'tidal-wave','a new attempt has its own one-use move');
});

test('the wave honors Guard, 5% misses, and the promise to release a charged attack next turn',()=>{
 const b=boss();b.enemyHp=100;b.charged=true;assert.equal(enemy(b).type,'attack');assert.equal(b.charged,false);assert.equal(b.enemies[0].tidalWaveUsed,undefined);
 b.guarding=true;assert.equal(enemy(b).impact.damage,51);
 const miss=boss();miss.enemyHp=1;miss.phase='resolving';miss.enemyQueue=[0];const r=enemyAction(miss,()=>.049,{queued:true});
 assert.equal(r.type,'tidal-wave');assert.equal(r.impact.damage,0);applyEnemyImpact(miss,r.impact);assert.equal(miss.targetHp,miss.maxHp);assert.equal(miss.message,'Miss!');
});

test('an animated enemy turn resumes the same initiative queue and cannot damage after defeat',()=>{
 const b=boss();b.enemyHp=130;beginRound(b,'guard',()=>.5);assert.equal(nextTurn(b,()=>.99).action,'guard');
 const result=nextTurn(b,()=>.99);assert.equal(result.type,'tidal-wave');assert.equal(nextTurn(b).ok,false);
 assert.equal(finishEnemyAnimation(b,result.impact),false,'cannot resume before impact');
 applyEnemyImpact(b,result.impact);finishEnemyAnimation(b,result.impact);assert.equal(nextTurn(b).roundComplete,true);assert.equal(b.turn,2);
 const dead=boss();dead.enemyHp=1;const hit=enemy(dead);dead.phase='defeat';assert.equal(applyEnemyImpact(dead,hit.impact),false);assert.equal(finishEnemyAnimation(dead,hit.impact),false);
});

function harness(){
 const calls=[],events=new EventEmitter(),ctx={clearRect(){},drawImage(...args){calls.push(['draw',...args.slice(1)]);},fillRect(){calls.push('flash');}},host={children:[],classList:{add(){},remove(){}},ownerDocument:{createElement(){return {setAttribute(){},getContext:()=>ctx,remove(){host.children=[];}};}},appendChild(c){this.children.push(c);}};
 let sprite;const scene={events,cameras:{main:{width:1536,height:1024,shake:(...args)=>calls.push(['shake',...args])}},textures:{getFrame:(key,index)=>({source:{image:'sheet'},cutX:index%5*299,cutY:Math.floor(index/5)*198,cutWidth:299,cutHeight:198})},
  add:{sprite(x,y,key,frame){sprite=new EventEmitter();Object.assign(sprite,{x,y,depth:0,visible:true,setOrigin(){return this;},setScrollFactor(){return this;},setScale(s){this.scale=s;return this;},setDepth(d){this.depth=d;return this;},setVisible(v){this.visible=v;return this;},play(){},destroy(){this.removeAllListeners();calls.push('destroy');}});return sprite;}},
  tweens:{add(){return {remove(){calls.push('removeTween');}}}}};
 const sound={effect:key=>calls.push(['sound',key]),stopEffects:key=>calls.push(['stopSound',key])};
 return {scene,host,calls,sound,get sprite(){return sprite;}};
}

test('effect crosses live depth at frame 9, impacts once at frame 16, then removes all temporary resources',()=>{
 const h=harness();let impacts=0,completed=0;
 const effect=new TidalWaveEffect(h.scene,{host:h.host,sound:h.sound,onImpact:()=>impacts++,onComplete:()=>completed++});
 assert.equal(h.sprite.depth,50);assert.equal(h.host.children.length,1);
 const emit=index=>h.sprite.emit('animationupdate',{}, {textureFrame:index});
 emit(8);assert.equal(h.sprite.visible,true);assert.equal(impacts,0);
 emit(9);assert.equal(h.sprite.depth,1000);assert.equal(h.sprite.visible,false);assert.ok(h.calls.some(c=>Array.isArray(c)&&c[0]==='draw'));
 emit(15);assert.equal(impacts,0);emit(16);emit(17);assert.equal(impacts,1);assert.equal(h.calls.filter(c=>Array.isArray(c)&&c[0]==='shake').length,1);assert.ok(h.calls.includes('flash'));
 h.sprite.emit('animationcomplete');assert.equal(completed,1);assert.equal(h.host.children.length,0);assert.equal(h.scene.events.listenerCount('shutdown'),0);effect.complete();effect.destroy();assert.equal(completed,1);
 assert.equal(h.calls.filter(c=>c==='destroy').length,1);
});

test('scene shutdown cancels damage and completion; repeated battles leave no effect listeners or canvases',()=>{
 const h=harness();let impacts=0,completed=0;
 for(let i=0;i<30;i++){
  const effect=new TidalWaveEffect(h.scene,{host:h.host,sound:h.sound,onImpact:()=>impacts++,onComplete:()=>completed++});
  h.scene.events.emit('shutdown');effect.showFrame(16);effect.complete();assert.equal(h.host.children.length,0);assert.equal(h.scene.events.listenerCount('shutdown'),0);
 }
 assert.equal(impacts,0);assert.equal(completed,0);
});

test('animation registration is shared, uses all 20 frames at 18 FPS and never loops',()=>{
 let definition,created=0;const scene={textures:{get:()=>({setFilter:n=>assert.equal(n,0)})},anims:{exists:()=>!!definition,generateFrameNumbers:(key,range)=>{assert.equal(key,TIDAL_WAVE.key);assert.deepEqual(range,{start:0,end:19});return Array.from({length:20},(_,i)=>i);},create:d=>{created++;definition=d;}}};
 registerScreenAttacks(scene);registerScreenAttacks(scene);assert.equal(created,1);assert.equal(definition.frameRate,18);assert.equal(definition.repeat,0);assert.equal(definition.frames.length,20);
});

test('missile impacts and launch sounds follow frames once, including skipped frames, and shutdown cancels remaining hits',()=>{
 const h=harness(),hits=[];let complete=0;
 const effect=new MissileVolleyEffect(h.scene,{host:h.host,sound:h.sound,onImpact:i=>hits.push(i),onComplete:()=>complete++});
 effect.showFrame(22);assert.deepEqual(hits,[]);
 effect.showFrame(23);effect.showFrame(23);assert.deepEqual(hits,[0]);
 effect.showFrame(31);assert.deepEqual(hits,[0,1,2]);
 assert.equal(h.calls.filter(c=>Array.isArray(c)&&c[0]==='shake').length,3);
 assert.equal(h.calls.filter(c=>Array.isArray(c)&&c[0]==='sound'&&c[1]==='missile-launch').length,4);
 assert.equal(h.calls.filter(c=>Array.isArray(c)&&c[0]==='sound'&&c[1]==='missile-explosion').length,3);
 effect.complete();effect.complete();assert.equal(complete,1);assert.equal(h.host.children.length,0);assert.equal(h.scene.events.listenerCount('shutdown'),0);
 const aborted=new MissileVolleyEffect(h.scene,{host:h.host,sound:h.sound,onImpact:i=>hits.push(i),onComplete:()=>complete++});
 h.scene.events.emit('shutdown');aborted.showFrame(35);aborted.complete();assert.deepEqual(hits,[0,1,2]);assert.equal(complete,1);assert.equal(h.host.children.length,0);
});
