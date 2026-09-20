import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {ScrapEscape,showScrapBreach} from '../fairmont/scrap-escape.mjs';
import {explorationMusicMode} from '../city/music-routing.mjs';

function harness(){
 const jobs=[],motions=[],objects=[],calls=[];
 const object=(kind,x=0,y=0)=>{const o={kind,x,y,width:1536,active:true,scaleX:1,scaleY:1,alpha:1,
  setScale(v){this.scaleX=this.scaleY=v;return this;},setDepth(){return this;},setFrame(frame){this.frame=frame;calls.push(['frame',frame]);return this;},
  lineStyle(){return this;},lineBetween(){return this;},clear(){return this;},destroy(){this.active=false;}};objects.push(o);return o;};
 const scene={events:new EventEmitter(),time:{now:0},textures:{get:()=>({setFilter(){}})},
  add:{image:(x,y)=>object('hole',x,y),sprite:(x,y)=>object('boss',x,y),graphics:()=>object('beam'),rectangle:(x,y)=>object('chip',x,y)},
  cameras:{main:{shake(){calls.push('shake');},flash(){calls.push('flash');}}}};
 scene.time.delayedCall=(delay,fn)=>{const job={at:scene.time.now+delay,fn,removed:false,remove(){this.removed=true;}};jobs.push(job);return job;};
 scene.tweens={add(config){const motion={config,stopped:false,stop(){this.stopped=true;}};motions.push(motion);scene.time.delayedCall(config.duration,()=>{if(motion.stopped)return;for(const key of ['x','y','scaleX','scaleY','alpha'])if(key in config)config.targets[key]=config[key];config.onComplete?.();});return motion;}};
 const sound={setMode:mode=>calls.push(['mode',mode]),effect:key=>calls.push(['sound',key]),stopEffects:key=>calls.push(['stop',key])};
 const exit=new ScrapEscape(scene,{sound,onBreach:()=>calls.push('breached'),onComplete:()=>calls.push('complete')});
 function advance(ms){const end=scene.time.now+ms;for(let job;(job=jobs.filter(j=>!j.removed&&j.at<=end).sort((a,b)=>a.at-b.at)[0]);){scene.time.now=job.at;job.removed=true;job.fn();}scene.time.now=end;}
 return {scene,exit,calls,objects,motions,advance};
}
test('escape turns, fires, breaches the real wall and flies away before returning control',()=>{
 const h=harness();h.exit.start();h.exit.start();assert.equal(h.objects.filter(o=>o.kind==='boss').length,1);
 h.advance(1100);assert.deepEqual(h.calls.filter(Array.isArray).filter(c=>c[0]==='frame').map(c=>c[1]),[1,2,3]);assert.equal(h.calls.includes('breached'),false);
 h.advance(360);assert.equal(h.calls.filter(c=>c==='breached').length,1);assert.ok(h.scene.scrapBreach.active);assert.ok(h.calls.includes('shake'));
 assert.equal(showScrapBreach(h.scene),h.scene.scrapBreach);assert.equal(h.objects.filter(o=>o.kind==='hole').length,1);
 h.advance(2000);assert.equal(h.exit.body.frame,5);assert.ok(h.exit.body.scaleX<.58);assert.equal(h.calls.includes('complete'),false);
 h.advance(2000);assert.equal(h.calls.filter(c=>c==='complete').length,1);assert.ok(h.objects.filter(o=>o.kind!=='hole').every(o=>!o.active));assert.ok(h.scene.scrapBreach.active);
 assert.equal(h.scene.events.listenerCount('shutdown'),0);assert.equal(explorationMusicMode({scrapEscape:{},map:{}}),'argus-entrance');
});
test('reload after wall breach skips the shot and resumes flight; shutdown cancels every completion and transient object',()=>{
 const resumed=harness();resumed.exit.start(1);assert.equal(resumed.exit.body.frame,5);resumed.advance(3000);
 assert.equal(resumed.calls.includes('breached'),false);assert.equal(resumed.calls.filter(c=>c==='complete').length,1);
 for(const time of [300,1500,2800]){const h=harness();h.exit.start();h.advance(time);h.scene.events.emit('shutdown');h.advance(9000);assert.equal(h.calls.includes('complete'),false);assert.ok(h.objects.filter(o=>o.kind!=='hole').every(o=>!o.active));assert.ok(h.motions.every(m=>m.stopped));}
});
