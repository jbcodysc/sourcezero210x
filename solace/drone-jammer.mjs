// A protocol-specific field device, never a player command or a rendered aura.
export const JAMMER_RADIUS=240;
export const DISRUPTABLE_DRONES=new Set(['scanDrone','testDrone','solaceDrone']);
export function disableNearbyDrones(progress,location,lou,drones){
 if(!progress.flags.CH3_JAMMER_ACTIVE||!lou)return [];
 const changed=[];progress.solaceDisabledDrones??={};
 for(const drone of drones){
  if(drone.disabled||!DISRUPTABLE_DRONES.has(drone.kind)||Math.hypot(drone.x-lou.x,drone.y-lou.y)>JAMMER_RADIUS)continue;
  drone.disabled=true;drone.target=null;drone.walking=false;
  progress.solaceDisabledDrones[location+':'+drone.id]={x:drone.x,y:drone.y};changed.push(drone);
 }
 return changed;
}
export function disabledDrone(progress,location,id){return progress.solaceDisabledDrones?.[location+':'+id]||null;}
