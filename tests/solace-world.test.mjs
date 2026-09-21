import test from 'node:test';
import assert from 'node:assert/strict';
import {ALL_LOCATIONS,mapFor,walkable,buildingGeometry} from '../solace/world.mjs';
import {doorCollision} from '../city/doors.mjs';

function reachablePoints(id){
 const m=mapFor(id),step=24,start={x:Math.round(m.arrival.x/step)*step,y:Math.round(m.arrival.y/step)*step},seen=new Set(),queue=[start];
 for(let index=0;index<queue.length;index++){
  const p=queue[index],key=p.x+','+p.y;
  if(seen.has(key)||!walkable(id,p.x,p.y))continue;
  seen.add(key);
  for(const [dx,dy]of [[step,0],[-step,0],[0,step],[0,-step]])queue.push({x:p.x+dx,y:p.y+dy});
 }
 return [...seen].map(s=>s.split(',').map(Number));
}

test('every Solace room has safe arrivals and destinations, with intentional physical doors',()=>{
 for(const id of ALL_LOCATIONS){const m=mapFor(id);assert.ok(walkable(id,m.arrival.x,m.arrival.y),id+' arrival');for(const d of m.doors){assert.ok(mapFor(d.target),d.id+' target');assert.ok(walkable(d.target,d.position.x,d.position.y),d.id+' destination position');if(d.visual!=='district'){const c=doorCollision(d);assert.equal(walkable(id,c.x+c.w/2,c.y+c.h/2),false,d.id+' stops walking through closed door');}}}
});

test('all story controls and every door have reachable approach space, through actual walkable corridors',()=>{
 for(const id of ALL_LOCATIONS){const m=mapFor(id),points=reachablePoints(id);for(const d of m.doors){const reached=points.some(([x,y])=>Math.hypot(x-d.x,y-d.y)<150&&(d.side==='north'?y>d.y&&Math.abs(x-d.x)<80:d.side==='south'?y<d.y&&Math.abs(x-d.x)<80:d.side==='west'?x>d.x&&Math.abs(y-d.y)<85:x<d.x&&Math.abs(y-d.y)<85));assert.ok(reached,id+' approach '+d.id);}for(const i of m.interactions)assert.ok(points.some(([x,y])=>Math.hypot(x-i.x,y-i.y)<145),id+' feature '+i.id);}
});

test('Solace buildings collide only with their fitted illustrated base and can be walked behind',()=>{
 for(const id of ['solace-transit','solace-commercial','solace-residential','solace-north'])for(const b of mapFor(id).buildings){const g=buildingGeometry(b);assert.ok(g.footprint.h<g.h*.25);assert.equal(walkable(id,g.x,g.y-40),false,b.id+' base solid');assert.equal(walkable(id,g.x,g.footprint.y-35),true,b.id+' rear sidewalk');}
});

test('megacomplex vertical movement uses real landings and cars; roof bypass ends before NR4',()=>{
 for(const level of [8,14,21,31])assert.ok(mapFor(`solace-mega-${level}-hall`));
 assert.ok(mapFor('solace-mega-14-elevator').doors.some(d=>d.target==='solace-mega-lift-14-21'&&d.gate==='CH3_FLOOR14_COMPLETE'));
 assert.ok(mapFor('solace-mega-21-upper-elevator').doors.some(d=>d.target==='solace-mega-lift-21-31'&&d.gate==='CH3_FLOOR21_COMPLETE'));
 assert.ok(mapFor('solace-mega-roof').doors.some(d=>d.target==='solace-mega-bridge'&&d.gate==='CH3_NR4_CODE'));
 assert.ok(mapFor('solace-mega-bridge').doors.some(d=>d.target==='solace-utility-annex'&&d.event==='roof-escape'));
 assert.equal(mapFor('solace-mega-lobby').doors.find(d=>d.target==='solace-residential').blockedBy,'CH3_LOCKDOWN');
 assert.equal(mapFor('solace-nr4-access').doors.length,1,'The endpoint cannot enter an invented final dungeon');
 assert.ok(mapFor('solace-nr4-access').interactions.some(i=>i.event==='elevator-start'));
 assert.notEqual(mapFor('solace-residential').buildings.find(b=>b.target==='solace-job-apartment').id,mapFor('solace-north').buildings.find(b=>b.target==='solace-lou-apartment').id);
});
