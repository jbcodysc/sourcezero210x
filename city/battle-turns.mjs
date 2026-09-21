import {livingEnemies,livingParty,commandMember,playerAction,enemyAction,validatePlayerAction,actionItem,effectiveSpeed} from './encounters.mjs';
import {carryParty} from './party.mjs';

// Quartic weighting makes a small speed advantage useful: 6:5 = 67.46%,
// 10:5 = 94.12%. Exponential races give a coherent order for whole groups,
// without an inconsistent random comparator. Every participant acts once.
export const initiativeChance=(speed,opponent)=>1/(1+(opponent/speed)**4);
export const escapeChance=(speed,opponent)=>Math.max(.05,Math.min(.75,.3+.35*Math.log(speed/opponent)/Math.log(3)));
export const canRun=b=>!b.enemies.some(e=>e.stats.boss||e.id==='courier'||e.id==='scriptedScanDrone')&&!b.storyNoRun;
export const battleEscapeChance=(b,speed=effectiveSpeed(b))=>!canRun(b)?0:livingEnemies(b).length===3?.66:escapeChance(speed,Math.max(...livingEnemies(b).map(e=>e.stats.speed)));

export function beginRound(b,action,rng=Math.random){
 const valid=validatePlayerAction(b,action);if(!valid.ok)return valid;
 if(action==='run'&&!canRun(b))return {ok:false,message:'There is no escape from this story encounter.'};
 const member=commandMember(b),members=livingParty(b);
 b.plannedActions??={};
 const item=actionItem(action),reserved=Object.values(b.plannedActions).filter(plan=>actionItem(plan.action)===item).length;
 if(item&&reserved>=(item==='sandwich'?b.snacks:b.inventory.filter(id=>id===item).length))return {ok:false,message:'That item is already assigned this turn.'};
 b.plannedActions[member.id||'hero']={action,targetUid:b.targetUid,healTargetId:b.healTargetId||member.id};
 const next=members.find(actor=>!b.plannedActions[actor.id||'hero']);
 if(next){b.commandIndex=b.party.indexOf(next);b.healTargetId=next.id;b.message='Choose '+next.name+'’s action.';return {ok:true,awaitingCommands:true};}
 b.pendingAction=b.plannedActions.hero?.action||action;for(const actor of members)actor.guarding=false;
 const actors=[...members.map(actor=>({who:'hero',memberId:actor.id||'hero',speed:effectiveSpeed(actor)})),...livingEnemies(b).map(e=>({who:'enemy',uid:e.uid,speed:e.stats.speed}))];
 b.roundQueue=actors.map(actor=>({...actor,key:-Math.log(Math.max(Number.EPSILON,1-rng()))/actor.speed**4})).sort((a,c)=>a.key-c.key);
 const priority=actor=>actor.who==='hero'&&(b.plannedActions[actor.memberId].action==='guard'||actionItem(b.plannedActions[actor.memberId].action));b.roundQueue=[...b.roundQueue.filter(priority),...b.roundQueue.filter(actor=>!priority(actor))];
 b.phase='resolving';return {ok:true};
}

export function nextTurn(b,rng=Math.random){
 if(b.phase!=='resolving')return {ok:false};
 let actor;
 while(b.roundQueue?.length&&!actor){const next=b.roundQueue.shift();if(next.who==='hero'?livingParty(b).some(member=>(member.id||'hero')===(next.memberId||'hero')):b.enemies.some(e=>e.uid===next.uid&&e.hp>0))actor=next;}
 if(!actor){b.phase='command';b.pendingAction=null;b.plannedActions={};for(const member of b.party||[b]){member.guarding=false;if(member.speedBoostTurns>0&&member.speedBoostAppliedTurn!==b.turn)member.speedBoostTurns--;if(member.slowTurns>0&&member.slowAppliedTurn!==b.turn)member.slowTurns--;}b.commandIndex=Math.max(0,b.party?.findIndex(member=>member.hp>0)||0);b.healTargetId=commandMember(b).id||'hero';b.turn++;return {ok:false,roundComplete:true};}
 if(actor.who==='enemy'){
  b.enemyQueue=[actor.uid];return {...enemyAction(b,rng,{queued:true}),actor:'enemy'};
 }
 const plan=b.plannedActions?.[actor.memberId||'hero']||{action:b.pendingAction},action=plan.action;
 if(action==='run'){
  const member=b.party?.find(member=>member.id===actor.memberId)||b;member.guarding=false;const chance=battleEscapeChance(b,effectiveSpeed(member)),escaped=rng()<chance;
  b.message=escaped?'You slip past the enemy and escape!':'You try to escape, but the enemy cuts you off!';
  if(escaped){b.phase='escaped';b.roundQueue=[];b.targetHp=b.hp;}
  return {ok:true,actor:'hero',action,escaped,chance,actionMessage:b.message};
 }
 b.phase='command';const result=playerAction(b,action,rng,{queued:true,actorId:actor.memberId||'hero',targetUid:plan.targetUid,healTargetId:plan.healTargetId});
 if(!result.ok){b.phase='resolving';b.message=result.message||'You cannot complete that action.';}
 return {...result,actor:'hero',action};
}

// Escapes are not victories: persist only the state the player carries away.
// Keep the overworld enemy alive and rely on the shared 2-second battle grace.
export function carryBattleInventory(progress,b){progress.snacks=b.snacks;progress.inventory=[...b.inventory];progress.speedBoostTurns=b.speedBoostTurns||0;carryParty(progress,b);}
export function escapeProgress(progress,b){
 if(b.phase!=='escaped')return false;
 carryBattleInventory(progress,b);progress.hp=Math.max(1,Math.ceil(b.hp));return true;
}
