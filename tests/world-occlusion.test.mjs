import test from 'node:test';
import assert from 'node:assert/strict';
import {updateWorldOcclusion} from '../city/occlusion.mjs';

function sprite(bounds,depth){
 return {active:true,visible:true,alpha:1,depth,getBounds:()=>({...bounds}),setDepth(value){this.depth=value;return this;},setAlpha(value){this.alpha=value;return this;}};
}
function person(x,y){return {x,y,sprite:sprite({x:x-25,y:y-105,width:50,height:105},y)};}

test('an overlapping canopy never covers a player or NPC standing behind it',()=>{
 const tree=sprite({x:100,y:100,width:180,height:210},310);
 const hero=person(180,240),npc=person(230,300),front=person(155,355);
 updateWorldOcclusion([{sprite:tree,kind:'tree'}],[hero,npc,front]);
 assert.equal(tree.alpha,.28);
 assert.ok(hero.sprite.depth>tree.depth);
 assert.ok(npc.sprite.depth>tree.depth);
 assert.equal(front.sprite.depth,front.y,'foreground characters retain their normal ground order');
});

test('overlapping canopies leave characters in front of all covering foliage',()=>{
 const short=sprite({x:100,y:100,width:180,height:180},280);
 const tall=sprite({x:140,y:160,width:180,height:190},350);
 const npc=person(220,250);
 updateWorldOcclusion([{sprite:tall,kind:'tree'},{sprite:short,kind:'tree'}],[npc]);
 assert.ok(npc.sprite.depth>tall.depth&&npc.sprite.depth>short.depth);
 assert.equal(short.alpha,.28);assert.equal(tall.alpha,.28);
});

test('rear building cutaways preserve foot-based depth and restore opacity after leaving',()=>{
 const building=sprite({x:100,y:100,width:250,height:400},500),npc=person(190,420);
 updateWorldOcclusion([{sprite:building,kind:'building'}],[npc]);
 assert.equal(building.alpha,.32);
 assert.equal(npc.sprite.depth,420,'walking behind a wall must not globally raise the character');
 updateWorldOcclusion([{sprite:building,kind:'building'}],[person(420,420)]);
 assert.equal(building.alpha,1);
});

test('hidden actors and actors in front do not fade unrelated scenery',()=>{
 const tree=sprite({x:100,y:100,width:180,height:210},310),hidden=person(180,250),inactive=person(200,240);
 hidden.sprite.visible=false;inactive.sprite.active=false;
 updateWorldOcclusion([{sprite:tree,kind:'tree'}],[hidden,inactive,person(210,345),person(500,280)]);
 assert.equal(tree.alpha,1);
 assert.equal(hidden.sprite.depth,hidden.y);assert.equal(inactive.sprite.depth,inactive.y);
});
