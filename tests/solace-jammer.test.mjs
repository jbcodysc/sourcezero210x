import test from 'node:test';
import assert from 'node:assert/strict';
import {freshProgress} from '../city/progress.mjs';
import {disableNearbyDrones,disabledDrone} from '../solace/drone-jammer.mjs';
test('Lou disables only compatible drones inside his range and preserves their fallen positions',()=>{
 const p=freshProgress(),lou={x:400,y:400},drones=[{id:'a',kind:'scanDrone',x:430,y:400},{id:'b',kind:'testDrone',x:1300,y:400},{id:'c',kind:'residentialCleaner',x:420,y:400}];
 assert.deepEqual(disableNearbyDrones(p,'solace-commercial',lou,drones),[]);
 p.flags.CH3_JAMMER_ACTIVE=true;
 assert.deepEqual(disableNearbyDrones(p,'solace-commercial',lou,drones).map(d=>d.id),['a']);
 assert.equal(drones[2].disabled,undefined);assert.equal(drones[1].disabled,undefined);
 assert.deepEqual(disableNearbyDrones(p,'solace-commercial',lou,drones),[]);
 const loaded=JSON.parse(JSON.stringify(p));assert.deepEqual(disabledDrone(loaded,'solace-commercial','a'),{x:430,y:400});
 assert.equal(disabledDrone(loaded,'solace-north','a'),null);
});
