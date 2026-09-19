import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {CityAudio} from '../city/audio.mjs';
import {curbSegments} from '../fairmont/street-depth.mjs';
const inventory=JSON.parse(readFileSync(new URL('../tools/soundtrack-remaster-inventory.json',import.meta.url)));
test('approved factory and Argus masters retain their exact original bytes and runtime paths',()=>{
 const audio=new CityAudio();
 for(const id of ['factory','argus']){
  const entry=inventory.find(t=>t.id===id),bytes=readFileSync(new URL('../'+entry.original,import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),entry.sha256);
  assert.ok(audio[id].url.endsWith(entry.original));
 }
});
test('all eight remasters are real Ogg assets while original files remain recoverable',()=>{
 for(const entry of inventory.filter(t=>t.new)){
  const data=readFileSync(new URL('../'+entry.new,import.meta.url));
  assert.equal(data.toString('ascii',0,4),'OggS');assert.ok(data.length>10000);
  const old=readFileSync(new URL('../'+entry.original,import.meta.url));
  assert.equal(createHash('sha256').update(old).digest('hex'),entry.sha256);
 }
 const audio=new CityAudio();
 for(const key of ['town','fairmontTown','fairmontCity','battle','menu','dungeon'])assert.match(audio[key].url,/music-remastered\/.*\.ogg$/);
});
test('curbs stop at intersections and preserve cross-street passages',()=>{
 assert.deepEqual(curbSegments(1000,[250,750]),[[0,143],[357,643],[857,1000]]);
 assert.deepEqual(curbSegments(1000,[250,750],400),[[400,643],[857,1000]]);
 assert.deepEqual(curbSegments(1000,[]),[[0,1000]]);
});
