import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CityAudio} from '../city/audio.mjs';
import {explorationMusicMode} from '../city/music-routing.mjs';
import {LOCATIONS,mapFor} from '../fairmont/world.mjs';

test('Fairmont streets and every ordinary interior share the new theme; all dungeon rooms keep theirs',()=>{
 for(const location of LOCATIONS){
  const map=mapFor(location);
  const expected=map?(map.isMarket?'dungeon':'factory'):location==='fairmont'?'fairmont-city':'fairmont-interior';
  assert.equal(explorationMusicMode({location,map}),expected,location);
 }
 assert.equal(explorationMusicMode({location:'city'}),'city');
 assert.equal(explorationMusicMode({location:'home'}),'interior');
 assert.equal(explorationMusicMode({location:'water'}),'dungeon');
 assert.equal(explorationMusicMode({location:'fairmont',cutscene:true}),'narration');
 assert.equal(explorationMusicMode({location:'fairmont-facility-5',argusEntrance:{}}),'argus-entrance');
});

test('town loop continues through interiors, resumes after combat, and never overlaps dungeon music',()=>{
 const a=new CityAudio();
 const c={state:'running',currentTime:0,destination:{},
  createBufferSource(){return {connect(){},disconnect(){},stop(){},start(...args){this.started=args;}};},
  createGain(){return {connect(){},disconnect(){},gain:{value:0,setTargetAtTime(v){this.value=v;}}};}};
 a.context=c;for(const t of a.tracks){t.context=c;t.buffer={duration:152.195};}
 const active=()=>a.tracks.filter(t=>t.source);
 a.setMode('fairmont-city');assert.deepEqual(active(),[a.fairmontTown]);
 const source=a.fairmontTown.source;c.currentTime=12;
 a.setMode('fairmont-interior');assert.equal(a.fairmontTown.source,source);
 a.setMode('transition');assert.equal(a.fairmontTown.offset,12);
 a.setMode('battle');assert.deepEqual(active(),[a.battle]);
 c.currentTime=24;a.setMode('fairmont-city');assert.equal(a.fairmontTown.source.started[1],12);
 a.fountain(0);assert.deepEqual(active(),[a.fairmontTown,a.water]);
 a.setMode('fairmont-interior');assert.deepEqual(active(),[a.fairmontTown]);
 for(const [mode,track]of [['dungeon',a.dungeon],['factory',a.factory],['argus-battle',a.argus],['city',a.town]]){
  a.setMode(mode);assert.deepEqual(active(),[track]);
 }
 a.setMode('fairmont-city');a.setEnabled(false);assert.deepEqual(active(),[]);
 a.setEnabled(true);assert.deepEqual(active(),[a.fairmontTown]);
 a.setVisible(false);assert.deepEqual(active(),[]);a.setVisible(true);assert.deepEqual(active(),[a.fairmontTown]);
});

test('rendered supplied score has the exact MIDI loop duration and a continuous, unclipped PCM seam',()=>{
 const b=readFileSync(new URL('../city/assets/fairmont-junction-industrial-town.wav',import.meta.url));
 assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WAVE');
 assert.equal(b.readUInt16LE(22),2);assert.equal(b.readUInt32LE(24),44100);assert.equal(b.readUInt16LE(34),16);
 const samples=new Int16Array(b.buffer,b.byteOffset+44,(b.length-44)/2);
 const tempo=731707;assert.ok(Math.abs(samples.length/2/44100-208*tempo/1e6)<1/44100);
 let peak=0,energy=0;for(const n of samples){peak=Math.max(peak,Math.abs(n));energy+=n*n;}
 assert.ok(peak<30000);assert.ok(Math.sqrt(energy/samples.length)/32768>.08);
 assert.ok(Math.abs(samples[0]-samples.at(-2))<=1);assert.ok(Math.abs(samples[1]-samples.at(-1))<=1);
});
