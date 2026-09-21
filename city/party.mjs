import {xpThreshold} from './progress.mjs';

// Party members carry their own durable state; combat never uses a Lou-only slot.
export function createLou(progress){
 const level=progress.level||1,maxHp=140+14*(level-1);
 return {id:'lou',name:'Lou',level,xp:progress.xp??xpThreshold(level),hp:maxHp,maxHp,attack:55+3*(level-1),defense:14+2*(level-1),speed:3+level,weapon:'electro-halberd',armor:'electrician-jacket',equipment:{weapon:'Electro-halberd',body:'Reinforced work jacket'},growth:{health:14,attack:3,defense:2,speed:1},capabilities:{magic:false}};
}
export function normalizeParty(progress){
 progress.party=Array.isArray(progress.party)?progress.party.filter((member,index,all)=>member&&typeof member.id==='string'&&member.id!=='hero'&&all.findIndex(other=>other?.id===member.id)===index):[];
 for(const member of progress.party){const fallback=member.id==='lou'?createLou(progress):{level:1,xp:0,maxHp:110,attack:31,defense:0,speed:5};for(const key of ['level','xp','maxHp','attack','defense','speed'])if(!Number.isFinite(member[key]))member[key]=fallback[key];member.hp=Math.max(0,Math.min(member.maxHp,Number.isFinite(member.hp)?member.hp:member.maxHp));}
 return progress.party;
}
export function joinLou(progress){const party=normalizeParty(progress);let lou=party.find(member=>member.id==='lou');if(!lou){lou=createLou(progress);party.push(lou);}return lou;}
export function restoreParty(progress){for(const member of normalizeParty(progress))member.hp=member.maxHp;}
export function carryParty(progress,battle){for(const member of normalizeParty(progress)){const live=battle.party?.find(actor=>actor.id===member.id);if(live){member.hp=Math.max(0,Math.min(member.maxHp,Math.ceil(live.hp)));member.speedBoostTurns=live.speedBoostTurns||0;}}}
export function awardParty(progress,xp){
 const gains=[];
 for(const member of normalizeParty(progress)){const before={health:member.maxHp,attack:member.attack,defense:member.defense,speed:member.speed};member.xp+=xp;let levels=0;while(member.xp>=xpThreshold(member.level+1)){member.level++;levels++;const growth=member.growth||{health:12,attack:3,defense:2,speed:1};member.maxHp+=growth.health;for(const key of ['attack','defense','speed'])member[key]+=growth[key]||0;if(member.hp>0)member.hp=Math.min(member.maxHp,member.hp+24);}if(levels)gains.push({kind:'level',page:0,before,after:{health:member.maxHp,attack:member.attack,defense:member.defense,speed:member.speed},level:member.level,name:member.name});}
 return gains;
}
