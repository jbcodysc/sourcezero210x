import {livingEnemies,playerAction,enemyAction,validatePlayerAction} from './encounters.mjs';

// Quartic weighting makes a small speed advantage useful: 6:5 = 67.46%,
// 10:5 = 94.12%. Exponential races give a coherent order for whole groups,
// without an inconsistent random comparator. Every participant acts once.
export const initiativeChance=(speed,opponent)=>1/(1+(opponent/speed)**4);
export const escapeChance=(speed,opponent)=>Math.max(.05,Math.min(.75,.3+.35*Math.log(speed/opponent)/Math.log(3)));
export const canRun=b=>!b.enemies.some(e=>e.stats.boss||e.id==='courier'||e.id==='scriptedScanDrone');
export const battleEscapeChance=b=>canRun(b)?escapeChance(b.speed,Math.max(...livingEnemies(b).map(e=>e.stats.speed))):0;

export function beginRound(b,action,rng=Math.random){
 const valid=validatePlayerAction(b,action);if(!valid.ok)return valid;
 if(action==='run'&&!canRun(b))return {ok:false,message:'There is no escape from this story encounter.'};
 b.pendingAction=action;
 const actors=[{who:'hero',speed:b.speed},...livingEnemies(b).map(e=>({who:'enemy',uid:e.uid,speed:e.stats.speed}))];
 b.roundQueue=actors.map(actor=>({...actor,key:-Math.log(Math.max(Number.EPSILON,1-rng()))/actor.speed**4})).sort((a,c)=>a.key-c.key);
 b.phase='resolving';return {ok:true};
}

export function nextTurn(b,rng=Math.random){
 if(b.phase!=='resolving')return {ok:false};
 let actor;
 while(b.roundQueue?.length&&!actor){const next=b.roundQueue.shift();if(next.who==='hero'||b.enemies.some(e=>e.uid===next.uid&&e.hp>0))actor=next;}
 if(!actor){b.phase='command';b.pendingAction=null;b.turn++;return {ok:false,roundComplete:true};}
 if(actor.who==='enemy'){
  b.enemyQueue=[actor.uid];return {...enemyAction(b,rng,{queued:true}),actor:'enemy'};
 }
 const action=b.pendingAction;
 if(action==='run'){
  b.guarding=false;const chance=battleEscapeChance(b),escaped=rng()<chance;
  b.message=escaped?'You slip past the enemy and escape!':'You try to escape, but the enemy cuts you off!';
  if(escaped){b.phase='escaped';b.roundQueue=[];b.targetHp=b.hp;}
  return {ok:true,actor:'hero',action,escaped,chance,actionMessage:b.message};
 }
 b.phase='command';const result=playerAction(b,action,rng,{queued:true});
 if(!result.ok){b.phase='resolving';b.message=result.message||'You cannot complete that action.';}
 return {...result,actor:'hero',action};
}

// Escapes are not victories: persist only the state the player carries away.
// Keep the overworld enemy alive and rely on the shared 2-second battle grace.
export function carryBattleInventory(progress,b){progress.snacks=b.snacks;progress.inventory=[...b.inventory];}
export function escapeProgress(progress,b){
 if(b.phase!=='escaped')return false;
 carryBattleInventory(progress,b);progress.hp=Math.max(1,Math.ceil(b.hp));return true;
}
