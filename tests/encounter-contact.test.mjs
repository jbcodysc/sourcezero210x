import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {touchingBounds,encounterBounds,sweptTouchingBounds,postBattleImmune,grantPostBattleImmunity} from '../city/encounter-contact.mjs';

const rect=(x,y,width=55,height=110)=>({x,y,width,height});
const actor=r=>({sprite:{getBounds:()=>({...r})}});
test('engagement includes head-to-feet, every edge, corners and outlines, in either direction',()=>{
 const a=rect(100,100);
 for(const b of [rect(155,100),rect(45,100),rect(100,210),rect(100,-10),rect(155,210),rect(155,-10),rect(45,210),rect(45,-10),a]){
  assert.ok(touchingBounds(a,b));assert.ok(touchingBounds(b,a));
 }
 assert.equal(touchingBounds(a,rect(156,100)),false);
 assert.deepEqual(encounterBounds(actor(a)),{x:97,y:97,width:61,height:116});
 assert.ok(touchingBounds(encounterBounds(actor(a)),encounterBounds(actor(rect(160,100)))));
});
test('opposing motion and fast movement engage at contact without false diagonal near misses',()=>{
 assert.ok(sweptTouchingBounds(rect(0,0),rect(300,0),rect(300,0),rect(0,0)));
 assert.ok(sweptTouchingBounds(rect(0,0),rect(0,400),rect(0,200),rect(0,200)));
 assert.equal(sweptTouchingBounds(rect(0,0),rect(300,0),rect(100,200),rect(100,200)),false);
 assert.equal(sweptTouchingBounds(rect(0,0,10,10),rect(100,100,10,10),rect(0,100,10,10),rect(0,100,10,10)),false);
});
test('production encounter check ignores old immunity timers but respects dialogue and cutscene locks',()=>{
 const source=readFileSync(new URL('../city/city.js',import.meta.url),'utf8');
 const method=source.slice(source.indexOf(' engageTouchingEnemy(){'),source.indexOf(' roam(npc,zone,'));
 const Scene=vm.runInNewContext('(class {'+method+'})',{touchingBounds,encounterBounds,postBattleImmune,state:{}});
 const scene=new Scene(),calls=[];scene.player=actor(rect(0,0));scene.enemies=new Map([['e',{...actor(rect(0,110)),kind:'robot',id:'e'}]]);
 scene.immunity=2600;scene.beginBattle=(...args)=>calls.push(args);
 assert.equal(scene.engageTouchingEnemy(),true);assert.deepEqual(calls,[['robot','e']]);
 for(const flag of ['locked','transitioning','cutscene','arrival']){scene[flag]=true;assert.equal(scene.engageTouchingEnemy(),false);scene[flag]=false;}
});
test('only a battle grants two seconds; scene changes and menus do not restart its deadline',()=>{
 const state={};assert.equal(postBattleImmune(state,100),false);
 grantPostBattleImmunity(state,100);assert.equal(state.encounterImmunityUntil,2100);
 assert.equal(postBattleImmune(state,2099.99),true);assert.equal(postBattleImmune(state,2100),false);
 const source=readFileSync(new URL('../city/city.js',import.meta.url),'utf8');
 for(const method of ['closeDialogue','closeMenu','travel']){
  const body=source.slice(source.indexOf(' '+method+'('),source.indexOf('\n ',source.indexOf(' '+method+'(')+1));
  assert.doesNotMatch(body,/grantPostBattleImmunity|afterBattle:true|immunity=/);
 }
 assert.match(source,/returnedFromBattle=!!data\?\.afterBattle/);
 assert.equal((source.match(/afterBattle:true/g)||[]).length,3,'victory and both defeat destinations');
 const launch=source.slice(source.indexOf(' launch(s){'),source.indexOf('\n handleAction('));
 const session={encounterImmunityUntil:2100},ui={};
 const Start=vm.runInNewContext('(class {'+launch+'})',{progress:null,state:session,newSpawns:()=>[],locations:new Set(['city']),save:()=>{},$:()=>ui,resumeOpening:p=>p});
 const start=new Start();start.slot=1;start.scene={start:()=>{}};start.launch({location:'city'});
 assert.equal(postBattleImmune(session,101),false,'loading another save cannot inherit the previous battle recovery');
});
