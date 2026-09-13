// Shared intentional door interaction. Content supplies a side, destination and art.
const directions={north:'up',south:'down',west:'left',east:'right'};
const away={north:'down',south:'up',west:'right',east:'left'};
export const doorwayFacing=side=>away[side];
export function doorApproach(door,distance=140){const p={x:door.x,y:door.y,dir:directions[door.side]};if(door.side==='north')p.y+=distance;else if(door.side==='south')p.y-=distance;else if(door.side==='west')p.x+=distance;else p.x-=distance;return p;}
export function doorCollision(door){const vertical=['west','east'].includes(door.side);return {x:door.x-(vertical?28:92),y:door.y-(vertical?100:28),w:vertical?56:184,h:vertical?200:56};}
export function canInteractDoor(player,door){
 if(!door.facilityDoor)return true;
 if(player.dir!==directions[door.side])return false;
 const dx=player.x-door.x,dy=player.y-door.y;
 if(Math.hypot(dx,dy)>(door.range||180))return false;
 return door.side==='north'?dy>0&&Math.abs(dx)<82:door.side==='south'?dy<0&&Math.abs(dx)<82:door.side==='west'?dx>0&&Math.abs(dy)<88:dx<0&&Math.abs(dy)<88;
}
export function activateDoor(player,door,{flags={},sound,travel}){
 if(!canInteractDoor(player,door)||door.locked||door.requiresFlag&&!flags[door.requiresFlag]||!door.target)return false;
 sound?.automaticDoor?.();travel(door.target,{...door.position,facing:door.targetFacing||door.position?.facing});return true;
}
