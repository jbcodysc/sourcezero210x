import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CityAudio} from '../city/audio.mjs';
import {explorationMusicMode} from '../city/music-routing.mjs';
import {LOCATIONS,mapFor} from '../fairmont/world.mjs';

test('Fairmont streets and industrial interiors use the city machine; homes and public interiors retain the supplied score',()=>{
 for(const location of LOCATIONS){
  const map=mapFor(location);
  const expected=map?(map.isMarket?'dungeon':'factory'):location==='fairmont'?'fairmont-city':['fairmont-terminal','fairmont-gear'].includes(location)?'fairmont-industrial':'fairmont-interior';
  assert.equal(explorationMusicMode({location,map}),expected,location);
 }
 assert.equal(explorationMusicMode({location:'city'}),'city');
 assert.equal(explorationMusicMode({location:'home'}),'interior');
 assert.equal(explorationMusicMode({location:'water'}),'dungeon');
 assert.equal(explorationMusicMode({location:'fairmont',cutscene:true}),'narration');
 assert.equal(explorationMusicMode({location:'fairmont-facility-5',argusEntrance:{}}),'argus-entrance');
});

test('both Fairmont loops resume their own position after battles and do not overlap each other or dungeons',()=>{
 const a=new CityAudio();
 const c={state:'running',currentTime:0,destination:{},
  createBufferSource(){return {connect(){},disconnect(){},stop(){},start(...args){this.started=args;}};},
  createGain(){return {connect(){},disconnect(){},gain:{value:0,setTargetAtTime(v){this.value=v;}}};}};
 a.context=c;for(const t of a.tracks){t.context=c;t.buffer={duration:152.195};}
 const active=()=>a.tracks.filter(t=>t.source);
 a.setMode('fairmont-city');assert.deepEqual(active(),[a.fairmontCity]);
 const source=a.fairmontCity.source;c.currentTime=12;
 a.setMode('fairmont-industrial');assert.equal(a.fairmontCity.source,source);
 a.setMode('transition');assert.equal(a.fairmontCity.offset,12);
 a.setMode('battle');assert.deepEqual(active(),[a.battle]);
 c.currentTime=24;a.setMode('fairmont-city');assert.equal(a.fairmontCity.source.started[1],12);
 a.fountain(0);assert.deepEqual(active(),[a.fairmontCity,a.water]);
 a.setMode('fairmont-interior');assert.deepEqual(active(),[a.fairmontTown]);
 const indoorSource=a.fairmontTown.source;c.currentTime=30;
 a.setMode('fairmont-interior');assert.equal(a.fairmontTown.source,indoorSource);
 a.setMode('battle');assert.deepEqual(active(),[a.battle]);assert.equal(a.fairmontTown.offset,6);
 c.currentTime=34;a.setMode('fairmont-interior');assert.equal(a.fairmontTown.source.started[1],6);
 a.setMode('fairmont-city');assert.equal(a.fairmontCity.source.started[1],12);
 for(const [mode,track]of [['dungeon',a.dungeon],['factory',a.factory],['argus-battle',a.argus],['city',a.town]]){
  a.setMode(mode);assert.deepEqual(active(),[track]);
 }
 a.setMode('fairmont-city');a.setEnabled(false);assert.deepEqual(active(),[]);
 a.setEnabled(true);assert.deepEqual(active(),[a.fairmontCity]);
 a.setVisible(false);assert.deepEqual(active(),[]);a.setVisible(true);assert.deepEqual(active(),[a.fairmontCity]);
});

test('fountain always starts at zero gain before the distance ramp, including mute and visibility recovery',()=>{
 const starts=[],ramps=[],a=new CityAudio();
 const c={state:'running',currentTime:5,destination:{},
  createBufferSource(){return {connect(gain){this.gain=gain;},disconnect(){},stop(){},start(){starts.push(this.gain.gain.value);}};},
  createGain(){return {connect(){},disconnect(){},gain:{value:0,setTargetAtTime(value,time,constant){ramps.push({value,time,constant});this.value=value;}}};}};
 a.context=c;const w=a.water;w.context=c;w.buffer={duration:5};a.setMode('fairmont-city');
 a.fountain(0);assert.deepEqual(starts,[0]);assert.equal(ramps.length,1);assert.ok(ramps[0].value>0);assert.equal(ramps[0].constant,.12);
 a.setEnabled(false);a.setEnabled(true);assert.deepEqual(starts,[0,0]);
 a.fountain(0);a.setVisible(false);a.setVisible(true);assert.deepEqual(starts,[0,0,0]);
 a.fountain(Infinity);assert.equal(w.source,null);
 a.fountain(0);assert.deepEqual(starts,[0,0,0,0]);
});

test('original machine-city track meets duration, tempo, stereo, and seamless PCM requirements',()=>{
 const report=JSON.parse(readFileSync(new URL('../tools/fairmont-machine-verification.json',import.meta.url)));
 assert.equal(report.bpm,108);assert.equal(report.meter,'4/4');assert.equal(report.bars,84);
 assert.ok(report.duration>=150&&report.duration<=195);assert.ok(report.original);
 assert.ok(report.events['hydraulic press']>=160);assert.ok(report.events['distant freight horn']>=8);
 assert.ok(report.events['synchronized relays']>300);assert.ok(report.events['fragmented city motif']>75);
 assert.ok(report.stereo_correlation<.99);
 const b=readFileSync(new URL('../city/assets/fairmont-city-machine.wav',import.meta.url));
 assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.readUInt16LE(22),2);assert.equal(b.readUInt32LE(24),44100);
 const samples=new Int16Array(b.buffer,b.byteOffset+44,(b.length-44)/2);
 assert.ok(Math.abs(samples.length/2/44100-84*4*60/108)<1/44100);
 let peak=0,energy=0;for(const n of samples){peak=Math.max(peak,Math.abs(n));energy+=n*n;}
 assert.ok(peak<30000);assert.ok(Math.sqrt(energy/samples.length)/32768>.09);
 assert.ok(Math.abs(samples[0]-samples.at(-2))<=1);assert.ok(Math.abs(samples[1]-samples.at(-1))<=1);
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
