import test from 'node:test';
import assert from 'node:assert/strict';
import {BattleSelection} from '../city/battle-selection.mjs';
import {createEncounter,enemyAction,ENEMIES} from '../city/encounters.mjs';
import {freshProgress} from '../city/progress.mjs';

test('command cursor starts on Attack, survives rounds and targets, and keeps Goods selection separate',()=>{
 const events={},root={buttons:[],addEventListener(k,f){events[k]=f;},removeEventListener(k){delete events[k];},querySelectorAll(selector){return this.buttons.filter(b=>!selector.includes(':not')||!b.disabled);}};
 const render=(actions,disabled=false)=>root.buttons=actions.map(action=>({dataset:{action},disabled,selected:false,classList:{toggle(name,value){this.button.selected=value;}},closest(){return this;},focus(){events.focusin({target:this});}}));
 const draw=(actions,disabled)=>{render(actions,disabled);for(const b of root.buttons)b.classList.button=b;};
 const selection=new BattleSelection(root);
 draw(['attack','guard','goods','run']);selection.restore(false,true);assert.equal(root.buttons.find(b=>b.selected).dataset.action,'attack');
 root.buttons[1].focus();assert.equal(root.buttons.filter(b=>b.selected).length,1);assert.equal(selection.actions.main,'guard');
 draw(['attack','guard','goods','run'],true);selection.restore(false,false);assert.equal(root.buttons.some(b=>b.selected),false);
 draw(['attack','guard','goods','run']);selection.restore(false,true);assert.equal(root.buttons.find(b=>b.selected).dataset.action,'guard');
 draw(['item:sandwich','item:field-meal','goods-back']);selection.restore(true,true);root.buttons[1].focus();
 draw(['attack','guard','goods','run']);selection.restore(false,true);assert.equal(root.buttons.find(b=>b.selected).dataset.action,'guard');
 draw(['item:sandwich','goods-back']);selection.restore(true,true);assert.equal(root.buttons.find(b=>b.selected).dataset.action,'item:sandwich');
 selection.destroy();assert.deepEqual(events,{});
});

test('A.R.G.U.S. only wastes a turn below 5%, never summons help, and still releases charged attacks',()=>{
 assert.equal(ENEMIES.argus.sillyRate,.05);
 for(const [roll,expected] of [[.049,'silly'],[.05,'attack'],[.1,'attack']]){
  const b=createEncounter('argus',freshProgress());b.phase='resolving';b.enemyQueue=[0];
  const rolls=[roll,.99];assert.equal(enemyAction(b,()=>rolls.shift()).type,expected);assert.equal(b.enemies.length,1);
 }
 const b=createEncounter('argus',freshProgress());b.phase='resolving';b.enemyQueue=[0];b.enemies[0].charged=true;
 const rolls=[0,.99];assert.equal(enemyAction(b,()=>rolls.shift()).type,'attack');assert.equal(b.enemies[0].charged,false);
});

test('all six drone antics are usable without imaginary printers or wrists',()=>{
 const messages=new Set();
 for(let turn=1;turn<=6;turn++){
  const b=createEncounter('testDrone',freshProgress());b.phase='resolving';b.enemyQueue=[0];b.enemies[0].turn=turn;
  assert.equal(enemyAction(b,()=>0).type,'silly');assert.doesNotMatch(b.message,/print|wrist/i);messages.add(b.message);
 }
 assert.equal(messages.size,6);
});
