import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {CityAudio} from '../city/audio.mjs';

function context(){
 const nodes=[];
 return {state:'running',currentTime:0,destination:{},nodes,
  createBufferSource(){const node={loop:false,start(...args){this.started=args;},stop(){this.stopped=true;},connect(){},disconnect(){this.disconnected=true;}};nodes.push(node);return node;},
  createGain(){return {gain:{value:0,setValueAtTime(v){this.value=v;},linearRampToValueAtTime(v){this.value=v;},setTargetAtTime(v){this.value=v;}},connect(){},disconnect(){}};}
 };
}
function ready(){
 const a=new CityAudio(),c=context();a.context=c;
 for(const track of a.tracks){track.context=c;track.buffer={duration:64};}
 for(const key of ['security-alarm','argus-boosters','argus-stabilize','fanfare','victory'])a.effects[key]={duration:2};
 return a;
}
const playing=a=>a.tracks.filter(track=>track.source);

test('factory exploration resumes its offset after normal encounters and shares no source with the boss',()=>{
 const a=ready();a.setMode('factory');assert.deepEqual(playing(a),[a.factory]);
 a.context.currentTime=13.25;a.setMode('transition');assert.deepEqual(playing(a),[]);
 assert.equal(a.factory.offset,13.25);a.setMode('battle');assert.deepEqual(playing(a),[a.battle]);
 a.context.currentTime=29;a.setMode('victory');assert.deepEqual(playing(a),[]);
 a.setMode('factory');assert.deepEqual(playing(a),[a.factory]);assert.equal(a.factory.source.started[1],13.25);
 a.setMode('argus-entrance');assert.deepEqual(playing(a),[]);
 a.setMode('transition');assert.deepEqual(playing(a),[]);assert.equal(a.argus.active,false);
 a.setMode('argus-battle');assert.deepEqual(playing(a),[a.argus]);assert.equal(a.argus.source.started[1],0);
 a.setMode('defeat');assert.deepEqual(playing(a),[]);a.setMode('argus-battle');assert.equal(a.argus.source.started[1],0);
});

test('Chapter 1 dungeon and existing town/menu modes retain their selected tracks',()=>{
 const a=ready();for(const [mode,track]of [['dungeon',a.dungeon],['city',a.town],['interior',a.town],['menu',a.menu],['battle',a.battle]]){a.setMode(mode);assert.deepEqual(playing(a),[track]);}
 a.stop();assert.deepEqual(playing(a),[]);
});

test('alarm and boosters loop once per key and are entrance-only; stabilization is a one-shot',()=>{
 const a=ready();a.effect('security-alarm');assert.equal(a.playingEffects.size,0);
 a.setMode('argus-entrance');a.effect('security-alarm');a.effect('security-alarm');a.effect('argus-boosters');a.effect('argus-stabilize');
 assert.equal(a.playingEffects.size,3);const effects=[...a.playingEffects];
 assert.equal(effects.find(x=>x.key==='security-alarm').node.loop,true);assert.equal(effects.find(x=>x.key==='argus-boosters').node.loop,true);assert.equal(effects.find(x=>x.key==='argus-stabilize').node.loop,false);
 a.stopEffects('argus-boosters');assert.equal(effects.find(x=>x.key==='argus-boosters').node.stopped,true);assert.equal(a.requestedLoops.has('argus-boosters'),false);
 a.setMode('transition');assert.equal(a.playingEffects.size,0);assert.equal(a.requestedLoops.size,0);assert.ok(effects.every(x=>x.node.stopped));
 a.effect('security-alarm');assert.equal(a.playingEffects.size,0);
});

test('stopping or leaving the sequence cancels sources and pending loop intent',()=>{
 for(const action of [a=>a.stop(),a=>a.setMode('factory')]){
  const a=ready();a.setMode('argus-entrance');a.effect('security-alarm');a.effect('argus-boosters');
  delete a.effects['security-alarm'];a.stopEffects('security-alarm');a.effect('security-alarm');assert.equal(a.requestedLoops.has('security-alarm'),true);
  const sources=[...a.playingEffects].map(x=>x.node);action(a);assert.equal(a.playingEffects.size,0);assert.equal(a.requestedLoops.size,0);assert.ok(sources.every(x=>x.stopped));
 }
});

test('hidden or muted entrance effects resume only when visible, enabled and still requested',()=>{
 const a=ready();a.setMode('argus-entrance');a.effect('security-alarm');a.effect('argus-boosters');a.effect('argus-stabilize');
 const original=[...a.playingEffects].map(x=>x.node);
 a.setVisible(false);assert.equal(a.playingEffects.size,0);assert.equal(a.requestedLoops.size,2);assert.ok(original.every(x=>x.stopped));
 a.setEnabled(false);a.setVisible(true);assert.equal(a.playingEffects.size,0);
 a.setEnabled(true);assert.equal(a.playingEffects.size,2);assert.ok([...a.playingEffects].every(x=>x.node.loop));
 a.setEnabled(true);assert.equal(a.playingEffects.size,2,'repeated toggles do not duplicate loops');
 a.setVisible(false);a.stopEffects('argus-boosters');a.setVisible(true);
 assert.deepEqual([...a.playingEffects].map(x=>x.key),['security-alarm']);
 a.setEnabled(false);a.setMode('argus-battle');a.setEnabled(true);
 assert.equal(a.playingEffects.size,0);assert.equal(a.requestedLoops.size,0);assert.deepEqual(playing(a),[a.argus]);
});

test('an entrance beginning while muted retains loop intent without playing a sound',()=>{
 const a=ready();a.setEnabled(false);a.setMode('argus-entrance');a.effect('security-alarm');
 assert.equal(a.playingEffects.size,0);assert.equal(a.requestedLoops.has('security-alarm'),true);
 a.setEnabled(true);assert.equal(a.playingEffects.size,1);
 a.setVisible(false);a.stop();a.setVisible(true);assert.equal(a.playingEffects.size,0);assert.equal(a.requestedLoops.size,0);
});

test('an alarm finishing its download after entrance cancellation stays silent',async()=>{
 const originalFetch=globalThis.fetch;
 let finishAlarm;
 const waiting=new Promise(resolve=>{finishAlarm=resolve;});
 const response={ok:true,arrayBuffer:async()=>new ArrayBuffer(4)};
 globalThis.fetch=url=>String(url).endsWith('argus-security-alarm.wav')?waiting:Promise.resolve(response);
 try{
  const a=ready();delete a.effects['security-alarm'];
  a.context.decodeAudioData=async()=>({duration:2.2});
  a.setMode('argus-entrance');a.effect('security-alarm');
  const loading=a.unlock();assert.equal(a.requestedLoops.has('security-alarm'),true);
  a.setMode('argus-battle');finishAlarm(response);await loading;
  assert.ok(a.effects['security-alarm']);assert.equal(a.playingEffects.size,0);
  assert.deepEqual(playing(a),[a.argus]);
 }finally{globalThis.fetch=originalFetch;}
});

function wav(name){
 const bytes=readFileSync(new URL('../city/assets/'+name+'.wav',import.meta.url));
 assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WAVE');
 let format,data;for(let offset=12;offset+8<=bytes.length;){const id=bytes.toString('ascii',offset,offset+4),length=bytes.readUInt32LE(offset+4);if(id==='fmt ')format=bytes.subarray(offset+8,offset+8+length);if(id==='data')data=bytes.subarray(offset+8,offset+8+length);offset+=8+length+(length%2);}
 assert.equal(format.readUInt16LE(0),1);assert.equal(format.readUInt16LE(2),2);assert.equal(format.readUInt32LE(4),44100);assert.equal(format.readUInt16LE(14),16);assert.ok(data);
 const samples=new Int16Array(data.buffer,data.byteOffset,data.byteLength/2);return {bytes,samples,duration:data.length/(44100*4)};
}

test('finished original PCM tracks have distinct scores, complete bar lengths and gapless non-silent seams',()=>{
 const hashes=[];
 for(const [name,bpm,bars]of [['ch2_drone_factory_theme',126,32],['ch2_argus_battle_theme',168,48]]){
  const {bytes,samples,duration}=wav(name);assert.ok(Math.abs(duration-bars*4*60/bpm)<1/44100);
  let energy=0,peak=0;for(const n of samples){energy+=n*n;peak=Math.max(peak,Math.abs(n));}
  const rms=Math.sqrt(energy/samples.length)/32768;assert.ok(rms>.10&&rms<.35);assert.ok(peak<32700);
  assert.ok(Math.abs(samples[0]-samples.at(-2))<=1);assert.ok(Math.abs(samples[1]-samples.at(-1))<=1);
  for(const part of [samples.subarray(0,4410),samples.subarray(samples.length-4410)])assert.ok(Math.sqrt(part.reduce((sum,n)=>sum+n*n,0)/part.length)>300,'no silent loop boundary');
  hashes.push(createHash('sha256').update(bytes).digest('hex'));
 }
 assert.notEqual(hashes[0],hashes[1]);
 for(const name of ['argus-security-alarm','argus-blue-boosters','argus-stabilize'])assert.ok(wav(name).duration>.5);
});
