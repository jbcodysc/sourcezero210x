import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {ArgusEntrance,ARGUS_TIMING} from '../fairmont/argus-entrance.mjs';
import {explorationMusicMode,combatMusicMode} from '../city/music-routing.mjs';

function harness(){
 const events=[],objects=[],jobs=[],motions=[];
 function object(kind,x=0,y=0){
  const o={kind,x,y,width:864,alpha:1,scaleX:1,scaleY:1,commands:[],destroyed:false,
   setDepth(n){this.depth=n;return this;},setOrigin(){return this;},setScrollFactor(){return this;},
   setScale(n){this.scaleX=this.scaleY=n;return this;},setAlpha(n){this.alpha=n;return this;},
   setFillStyle(color,alpha){this.color=color;this.alpha=alpha;events.push(['light',color]);return this;},
   clear(){this.commands=[];return this;},fillStyle(){return this;},lineStyle(){return this;},strokeRect(){return this;},
   fillRect(...args){this.commands.push(args);return this;},destroy(){this.destroyed=true;}
  };objects.push(o);return o;
 }
 const scene={events:new EventEmitter(),time:{now:0},cameras:{main:{width:1536,height:1024,shake(...args){events.push(['shake',...args]);}}},
  add:{rectangle:(x,y)=>object('overlay',x,y),graphics:()=>object('graphics'),ellipse:(x,y)=>object('shadow',x,y),image:(x,y)=>object('boss',x,y)}};
 const job=(delay,callback,loop=false)=>{const item={at:scene.time.now+delay,delay,callback,loop,removed:false,remove(){this.removed=true;}};jobs.push(item);return item;};
 scene.time.delayedCall=(delay,callback)=>job(delay,callback);
 scene.time.addEvent=({delay,callback,loop})=>job(delay,callback,loop);
 scene.tweens={add(config){
  const motion={config,start:scene.time.now,initial:{},stopped:false,stop(){this.stopped=true;}};
  for(const key of ['x','y','alpha','scaleX','scaleY'])if(key in config)motion.initial[key]=config.targets[key];
  motions.push(motion);job(config.duration,()=>{if(!motion.stopped)config.onComplete?.();});return motion;
 }};
 const sound={setMode:mode=>events.push(['mode',mode]),effect:key=>events.push(['effect',key]),stopEffects:key=>events.push(['stop',key])};
 const entrance=new ArgusEntrance(scene,{sound,target:{x:850,y:485},onStep:step=>events.push(['step',step]),onComplete:boss=>events.push(['done',boss]),onDispose:()=>events.push(['disposed'])});
 function advance(ms){
  const end=scene.time.now+ms;
  while(scene.time.now<end){
   const next=Math.min(end,...jobs.filter(j=>!j.removed).map(j=>j.at));scene.time.now=next;
   for(const m of motions)if(!m.stopped){const t=Math.min(1,(next-m.start)/m.config.duration);for(const [k,v]of Object.entries(m.initial))m.config.targets[k]=v+(m.config[k]-v)*t;m.config.onUpdate?.();}
   for(const j of [...jobs])if(!j.removed&&j.at<=next){if(j.loop)j.at+=j.delay;else j.removed=true;j.callback();}
  }
 }
 return {scene,events,objects,jobs,entrance,advance};
}

test('alarm precedes visible flight; twin pixel boosters move with the chassis and cease before dialogue',()=>{
 const h=harness();h.entrance.start();h.entrance.start();
 assert.equal(h.events.filter(e=>e[0]==='effect'&&e[1]==='security-alarm').length,1);
 assert.equal(h.objects.filter(o=>o.kind==='boss').length,0);
 h.advance(600);assert.deepEqual(h.events.filter(e=>e[0]==='light').map(e=>e[1]),[0xef2445,0x2786ff,0xef2445]);
 h.advance(ARGUS_TIMING.alarm-600);const boss=h.entrance.actor.sprite;
 assert.equal(boss.y,-35,'enters above the viewport');assert.equal(h.events.some(e=>e[0]==='done'),false);
 h.advance(775);assert.ok(boss.y>0&&boss.y<485);assert.ok(boss.x>850);
 const flames=h.entrance.exhaust.commands;assert.ok(flames.some(r=>r[0]===Math.round(boss.x-53)-15));assert.ok(flames.some(r=>r[0]===Math.round(boss.x+53)-15));
 h.advance(775);assert.equal(boss.y,485);assert.deepEqual(h.events.filter(e=>e[0]==='step'),[['step',1],['step',2]]);
 assert.ok(h.events.some(e=>e[0]==='stop'&&e[1]==='argus-boosters'));assert.ok(h.events.some(e=>e[0]==='shake'));
 h.advance(ARGUS_TIMING.settle);assert.equal(h.events.filter(e=>e[0]==='done').length,1);
 assert.equal(boss.destroyed,false,'chassis remains for existing dialogue and transition snapshot');
 assert.ok(h.objects.filter(o=>o.kind==='graphics'||o.kind==='overlay').every(o=>o.destroyed));
 assert.equal(h.jobs.some(j=>!j.removed),false);h.advance(5000);assert.equal(h.events.filter(e=>e[0]==='done').length,1);
});

test('scene shutdown during flight cancels completion, timers, sound and all transient objects',()=>{
 const h=harness();h.entrance.start();h.advance(ARGUS_TIMING.alarm+200);h.scene.events.emit('shutdown');h.advance(6000);
 assert.equal(h.events.some(e=>e[0]==='done'),false);assert.ok(h.objects.every(o=>o.destroyed));assert.ok(h.events.some(e=>e[0]==='stop'&&e[1]==='security-alarm'));assert.equal(h.scene.events.listenerCount('shutdown'),0);
});

test('reload at flight skips alarm lead-in; reload after landing never replays boosters or sirens',()=>{
 const flight=harness();flight.entrance.start(1);flight.advance(180);assert.ok(flight.entrance.actor);flight.entrance.dispose();
 const landed=harness();landed.entrance.start(2);landed.advance(180);assert.equal(landed.entrance.actor.sprite.y,485);assert.equal(landed.events.some(e=>e[0]==='effect'),false);assert.equal(landed.events.filter(e=>e[0]==='done').length,1);
});

test('entry and browser restoration select exploration, entrance and combat music without crossing their boundaries',()=>{
 assert.equal(explorationMusicMode({map:{isMarket:false}}),'factory');assert.equal(explorationMusicMode({map:{isMarket:true}}),'dungeon');
 assert.equal(explorationMusicMode({location:'water'}),'dungeon');assert.equal(explorationMusicMode({location:'fairmont'}),'fairmont-city');
 assert.equal(explorationMusicMode({map:{isMarket:false},argusEntrance:{}}),'argus-entrance');
 assert.equal(combatMusicMode({transition:{},battle:{id:'argus',phase:'command'}}),'transition');
 assert.equal(combatMusicMode({battle:{id:'argus',phase:'command'}}),'argus-battle');
 assert.equal(combatMusicMode({battle:{id:'testDrone',phase:'command'}}),'battle');
 assert.equal(combatMusicMode({battle:{id:'argus',phase:'defeat'}}),'defeat');
});
