import test from 'node:test';
import assert from 'node:assert/strict';
import {createSolaceScene} from '../solace/scene.mjs';
import {createSolaceCheckpoint} from '../solace/checkpoints.mjs';
import {transition,SCENES} from '../solace/story.mjs';
import {mapFor} from '../solace/world.mjs';

function harness(id='3-investigation'){
 const progress=createSolaceCheckpoint(id,'Morgan'),calls=[];
 const Scene=createSolaceScene({Base:class{},getProgress:()=>progress,state:{},save:()=>{},sound:{automaticDoor:()=>calls.push('door-sound')}});
 const scene=new Scene();Object.assign(scene,{location:progress.location,map:mapFor(progress.location),player:{x:768,y:810,dir:'up'},npcs:[],locked:false,updateObjective:()=>{},resumeStory:()=>{},say:(text,who,done)=>{calls.push(text);done?.();},showLines:(lines,who,done)=>{assert.ok(lines.length,'must not render an empty dialogue');calls.push(lines);done?.();},travel:(id,position)=>calls.push({travel:id,position}),scene:{start:(id,data)=>calls.push({scene:id,data})}});
 return {scene,progress,calls,Scene};
}

test('scene feature dispatch uses actual world action IDs for floor panels and pickups',()=>{
 const {scene,progress,calls}=harness('3-megacomplex');Object.assign(progress.flags,{CH3_LOCKDOWN:true,CH3_LOBBY_SERVICE_OPEN:true});
 scene.openCircuit=id=>calls.push({panel:id});scene.activateFeature({id:'repeat-panel',action:'circuit8'});assert.equal(calls.at(-1).panel,'circuit8');
 progress.chapter3Circuit8=['west','east'];scene.activateFeature({id:'west8',action:'west8'});scene.activateFeature({id:'east8',action:'east8'});assert.equal(progress.flags.CH3_FLOOR8_WEST_CHECKED,true);assert.equal(progress.flags.CH3_FLOOR8_EAST_CHECKED,true);
 const snacks=progress.snacks;scene.activateFeature({id:'supply8',action:'supply',item:'sandwich'});scene.activateFeature({id:'supply8',action:'supply',item:'sandwich'});assert.equal(progress.snacks,snacks+1);assert.equal(progress.inventory.includes('sandwich'),false);
});

test('vending inspection sets the paid flag, awards once, and completes the required lead',()=>{
 const {scene,progress}=harness(),credits=progress.credits,coffees=progress.inventory.filter(id=>id==='caramel-macchiato').length;
 scene.useVending();assert.equal(progress.credits,credits-8);assert.equal(progress.flags.CH3_VENDING_USED,true);assert.equal(progress.flags.CH3_VENDING_LEAD,true);assert.equal(progress.inventory.filter(id=>id==='caramel-macchiato').length,coffees+1);
 scene.useVending();assert.equal(progress.credits,credits-8);assert.equal(progress.inventory.filter(id=>id==='caramel-macchiato').length,coffees+1);
});

test('semantic door gates respect circuit and medical prerequisites rather than looking for nonexistent flags',()=>{
 const {scene,progress,calls}=harness('3-megacomplex');const door={target:'solace-mega-8-west',gate:'circuit8-west',position:{x:768,y:810}};
 scene.interactDoor(door);assert.equal(calls.some(c=>c.travel),false);
 progress.chapter3Circuit8=['west','east'];scene.interactDoor(door);assert.ok(calls.some(c=>c.travel==='solace-mega-8-west'));
 calls.length=0;progress.flags.CH3_RECORDS_REMOVED=true;scene.interactDoor({target:'solace-neuro-service',gate:'nr4service'});assert.equal(calls.some(c=>c.travel),false);
 progress.flags.CH3_NEURO_PUBLIC_CONTEXT=true;scene.interactDoor({target:'solace-neuro-service',gate:'nr4service'});assert.ok(calls.some(c=>c.travel==='solace-neuro-service'));
});

test('Lou following closely does not intercept the player’s intended door interaction',()=>{
 const {scene}=harness();scene.player={x:500,y:700,dir:'up'};scene.lou={id:'lou',name:'Lou',x:520,y:710,follower:true};scene.npcs=[scene.lou];scene.interactables=[{id:'door',kind:'door',x:500,y:610,range:180}];
 assert.equal(scene.nearest().id,'door');scene.interactables=[];assert.equal(scene.nearest().id,'lou');
});
test('facing a door beats a nearby side-on bystander but permits speaking to someone directly ahead',()=>{
 const {scene}=harness();scene.player={x:500,y:700,dir:'up'};scene.lou=null;scene.npcs=[{id:'bystander',name:'Cal',x:550,y:700}];scene.interactables=[{id:'door',kind:'door',facilityDoor:true,side:'north',x:500,y:610,range:180}];
 assert.equal(scene.nearest().id,'door');scene.npcs[0].x=500;scene.npcs[0].y=650;assert.equal(scene.nearest().id,'bystander');
});

test('finished saved dialogue resumes its completion without trying to render an empty box',()=>{
 const {scene,progress}=harness('3-arrival');progress.flags.CH3_LOU_JOB_SEEN=true;progress.chapter3Sequence={id:'reunion',step:SCENES.reunion.length};scene.sequence=null;
 scene.runSequence({id:'reunion',step:SCENES.reunion.length,lines:SCENES.reunion});assert.equal(progress.flags.CH3_LOU_MEETING_COMPLETE,true);assert.equal(progress.chapter3Sequence,null);
});

test('story persistence captures the live interaction position for interrupted sequence reloads',()=>{
 const {scene,progress}=harness('3-nr4');scene.location='solace-nr4-access';scene.player={x:728,y:518,dir:'up'};
 Object.assign(progress.flags,{CH3_POWER_TRACE:true});scene.applyEvent('elevator-start');
 assert.equal(progress.location,'solace-nr4-access');assert.deepEqual(progress.position,{x:728,y:518});assert.equal(progress.chapter3Sequence.id,'service-elevator');
});

test('pending story battles loaded at the clinic become deliberate retries rather than surprise combat',()=>{
 const {scene,progress,Scene}=harness();for(const e of ['transit-lead','delivery-lead','vending-use','vending-lead','attack-start','sequence-complete'])Object.assign(progress,transition(progress,e).state);
 assert.equal(progress.flags.CH3_ATTACK_PENDING,true);scene.location='solace-clinic';scene.beginBattle=()=>assert.fail('No clinic battle');Scene.prototype.resumeStory.call(scene);
 assert.equal(progress.flags.CH3_ATTACK_RETRY,true);assert.equal(progress.flags.CH3_ATTACK_PENDING,undefined);assert.equal(scene.locked,false);
});

test('Solace services keep gear and food separate, and the bus returns to the existing Fairmont scene',()=>{
 const {scene,progress,calls}=harness();scene.openShop=options=>calls.push(options);
 scene.openSolaceService('parts');assert.deepEqual(calls.at(-1).offers.map(item=>item[0]),['resonant-drive','laminate-vest']);
 scene.openSolaceService('cafe');assert.ok(calls.at(-1).offers.every(item=>['caramel-macchiato','snack','field-meal'].includes(item[0])));
 scene.startNarration=(pages,done)=>done();scene.activateFeature({id:'bus',action:'bus'});assert.equal(progress.location,'fairmont');assert.equal(calls.at(-1).scene,'Fairmont');
});
