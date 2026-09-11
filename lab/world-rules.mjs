export const WORLD = Object.freeze({width:1536,height:1024});
export const PLAYER_START = Object.freeze({x:768,y:838});
export const COURIER = Object.freeze({x:465,y:646});
export const ROOM = Object.freeze({left:40,right:1492,top:282,bottom:892});
export const FURNITURE = Object.freeze([
 {id:'left-door',x:35,y:269,w:184,h:282},
 {id:'receiving',x:283,y:440,w:377,h:124},
 {id:'east-bench',x:1114,y:280,w:422,h:207},
 {id:'east-sinks',x:1180,y:410,w:356,h:338},
 {id:'east-stool',x:1104,y:475,w:86,h:100},
 {id:'bottom-wall',x:0,y:892,w:1536,h:132}
]);
export const TECHNICIANS = Object.freeze([
 {id:'mira',name:'Mira',row:1,start:{x:820,y:530},zone:{left:720,right:920,top:380,bottom:790},lines:['The afternoon samples are all within range. That almost never happens.','Your courier is waiting at receiving. He has been very patient. Almost suspiciously patient.']},
 {id:'dev',name:'Dev',row:2,start:{x:1080,y:750},zone:{left:985,right:1080,top:520,bottom:864},lines:['I recalibrated the spectrometer. Again. It and I have different ideas about precision.','Please tell me that thing on your belt is a tool and not your lunch-break sword.']}
]);
export function insideZone(p,z,padding=0){return p.x>=z.left+padding&&p.x<=z.right-padding&&p.y>=z.top+padding&&p.y<=z.bottom-padding;}
export function intersectsFoot(x,y,r,rect){return x+r>rect.x&&x-r<rect.x+rect.w&&y+r>rect.y&&y-r<rect.y+rect.h;}
export function canStand(x,y,blockers=[],radius=16){if(!Number.isFinite(x)||!Number.isFinite(y)||!insideZone({x,y},ROOM,radius))return false;if(FURNITURE.some(o=>intersectsFoot(x,y,radius,o)))return false;return !blockers.some(o=>Math.hypot(x-o.x,y-o.y)<radius+(o.radius??17));}
export function moveFoot(p,dx,dy,blockers=[],zone=null){let x=p.x,y=p.y;if(canStand(x+dx,y,blockers)&&(!zone||insideZone({x:x+dx,y},zone)))x+=dx;if(canStand(x,y+dy,blockers)&&(!zone||insideZone({x,y:y+dy},zone)))y+=dy;return {x,y,moved:Math.hypot(x-p.x,y-p.y)>0.01};}
export function randomTarget(zone,random=Math.random,blockers=[]){for(let i=0;i<30;i++){const p={x:zone.left+random()*(zone.right-zone.left),y:zone.top+random()*(zone.bottom-zone.top)};if(canStand(p.x,p.y,blockers))return p;}return null;}
export function direction(dx,dy){if(Math.abs(dx)>Math.abs(dy))return dx<0?'left':'right';return dy<0?'up':'down';}
export function normalizedMovement(x,y,speed,delta){const length=Math.hypot(x,y);return length?{x:x/length*speed*delta,y:y/length*speed*delta}:{x:0,y:0};}
export function nearestInteractable(player,technicians,includeRobot=true){const choices=[...(includeRobot?[{...COURIER,id:'courier',name:'Cenexis courier'}]:[]),...technicians];return choices.map(p=>({...p,distance:Math.hypot(p.x-player.x,p.y-player.y)})).filter(p=>p.distance<=122).sort((a,b)=>a.distance-b.distance)[0]||null;}
export function chooseWalkFrame(dir,walking,elapsed){const col=dir==='up'?4:dir==='left'||dir==='right'?2:0;return col+(walking?Math.floor(elapsed/180)%2:0);}
