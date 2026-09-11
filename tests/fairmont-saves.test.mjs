import test from 'node:test';
import assert from 'node:assert/strict';
import {freshProgress} from '../city/progress.mjs';
import {SaveSlots} from '../city/save-slots.mjs';
import {transition,resumeEvent,timeOfDay} from '../fairmont/story.mjs';
const order=['arrive','module-reminder','radio-bargain','hotel-sleep','bellwether-finished','wrm-enter','karen-start','karen-defeated','cut-lines','hotel-sleep','decrypt-start','guard-heard','protester-finished','scan-finished','security-defeated','keycard','facility-enter','argus-start','argus-defeated','archive-read'];
test('real three-slot storage preserves every Chapter 2 transition through Chapter 1 migration',()=>{
 const memory=new Map(),storage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)},book=new SaveSlots(storage);
 let s=freshProgress('Morgan');Object.assign(s,{opening:'complete',level:10,xp:2025,maxHp:218,hp:218,location:'city'});Object.assign(s.flags,{waterRestored:true,badgeFixed:true,relayTaken:true,factoryDone:true,courierDone:true,policeReported:true});
 book.write(1,freshProgress('Other file'));
 for(const event of order){s=transition(s,event).state;s.location='fairmont';s.position={x:760,y:4060};assert.equal(book.write(0,s),true,event);const loaded=new SaveSlots(storage).read(0);assert.equal(loaded.location,'fairmont',event);assert.equal(loaded.name,'Morgan');assert.equal(timeOfDay(loaded),timeOfDay(s),event);assert.deepEqual(resumeEvent(loaded),resumeEvent(s),event);for(const [flag,value]of Object.entries(s.flags))assert.equal(loaded.flags[flag],value,event+': '+flag);assert.deepEqual(loaded.inventory,s.inventory,event);assert.equal(new SaveSlots(storage).read(1).name,'Other file');s=loaded;}
 assert.equal(s.flags.CH2_COMPLETE,true);assert.equal(s.flags.CH2_DEREK_COMPLETE,undefined);
});
