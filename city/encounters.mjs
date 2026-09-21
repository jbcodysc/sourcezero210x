import {securityText} from '../fairmont/security-identity.mjs';
import {rollHealth as rollSingleHealth} from '../lab/battle-rules.mjs';
import {CONSUMABLES,playerStats} from './progress.mjs';
import {FAIRMONT_ENEMIES} from '../fairmont/enemies.mjs';
import {SOLACE_ENEMIES} from '../solace/enemies.mjs';
import {normalizeParty} from './party.mjs';
export function rollHealth(b,seconds,{healingOnly=false}={}){
 if(!b.party||b.party.length===1)return !healingOnly||b.hp<b.targetHp?rollSingleHealth(b,seconds):undefined;
 if(['victory','escaped','defeat','bossRetreat'].includes(b.phase))return;
 for(const member of b.party){if(healingOnly&&member.hp>=member.targetHp)continue;const rolling={hp:member.hp,targetHp:member.targetHp,phase:'resolving'};rollSingleHealth(rolling,seconds);member.hp=rolling.hp;}
 if(b.party.every(member=>member.hp<=0)){b.phase='defeat';b.message='The party can no longer stand. The clinic can help.';}
}
export const livingParty=b=>(b.party||[b]).filter(member=>member.hp>0);
export function commandMember(b){
 if(!b.party)return b;let member=b.party[b.commandIndex||0];
 if(b.phase==='command'&&member?.hp<=0){const next=b.party.find(actor=>actor.hp>0&&!b.plannedActions?.[actor.id])||b.party.find(actor=>actor.hp>0);if(next){member=next;b.commandIndex=b.party.indexOf(next);b.healTargetId=next.id;}}
 return member||b.party[0];
}
export const MISS_RATE=.05,SILLY_RATE=.15,HELP_RATE=.05,ENEMY_DAMAGE_MULTIPLIER=1.3,MAX_ACTIVE_ENEMIES=3;
export const ENEMIES={
 courier:{speed:5,name:'Cenexis Courier',hp:180,attack:15,charge:38,xp:25,credits:22,portrait:'courier-battle',kind:'robot',noHelp:true,opening:'Biological variance confirmed. Subject retrieval authorized.'},
 volunteer:{speed:5,name:'Misled Volunteer',hp:90,attack:10,charge:24,xp:12,credits:14,portrait:'battle-human',kind:'human',opening:'“The bulletin says you are dangerous. I am helping!”'},
 contractor:{speed:7,name:'Cenexis Contractor',hp:118,attack:13,charge:29,xp:19,credits:19,portrait:'battle-human',kind:'human',opening:'“Corporate property. Stop right there.”'},
 cleaner:{speed:6,name:'Overzealous Cleaner',hp:105,attack:12,charge:28,xp:16,credits:17,portrait:'battle-robot',kind:'robot',opening:'UNREGISTERED OBSTRUCTION. THIS STREET WILL BE TIDY.'},
 loader:{speed:4,name:'Routebound Loader',hp:138,attack:15,charge:32,xp:22,credits:22,portrait:'battle-robot',kind:'robot',opening:'COLLECTION ZONE BREACHED. PLEASE BECOME CARGO.'},
 bastion:{speed:6,name:'BASTION-7',hp:320,attack:21,charge:43,xp:105,credits:90,portrait:'battle-boss',kind:'robot',boss:true,noHelp:true,opening:'Unauthorized investigative subject: Alex. Your arrival was anticipated.'},
 waterScrubber:{speed:9,name:'Runaway Scrubber',hp:160,attack:40,charge:60,xp:55,credits:32,portrait:'water-enemies',frame:'water-0',kind:'robot',opening:'FLOOR CLEANING PRIORITY: REMOVE THE CHEMIST.'},
 pipeBot:{speed:10,name:'Pressure Technician',hp:184,attack:42,charge:64,xp:65,credits:38,portrait:'water-enemies',frame:'water-1',kind:'robot',opening:'Your pressure reading is unacceptable.'},
 pipeRat:{speed:36,name:'Pipe Rat',hp:132,attack:39,charge:54,xp:50,credits:20,portrait:'water-enemies',frame:'water-2',kind:'animal',opening:'A soaking-wet rat bares its teeth.'},
 waterGuard:{speed:11,name:'Cenexis Facility Guard',hp:198,attack:44,charge:65,xp:70,credits:45,portrait:'water-enemies',frame:'water-3',kind:'human',opening:'“Company orders. Turn around.”'},
 drainBot:{speed:8,name:'Drain Scourer',hp:175,attack:41,charge:62,xp:60,credits:35,portrait:'water-enemies',frame:'water-4',kind:'robot',opening:'BLOCKAGE IDENTIFIED. APPLYING EXCESSIVE FORCE.'},
 regulator:{tidalWavePower:150,speed:7,name:'DELUGE · Water Regulator',hp:650,attack:46,charge:70,xp:300,credits:180,portrait:'water-enemies',frame:'water-5',kind:'robot',boss:true,noHelp:true,opening:'CENEXIS REMOTE OVERRIDE ACTIVE. DISCHARGE LIMITS DISABLED.'}
 ,...FAIRMONT_ENEMIES,...SOLACE_ENEMIES};
const helperFor={waterScrubber:'pipeRat',pipeBot:'waterScrubber',pipeRat:'pipeRat',waterGuard:'waterGuard',drainBot:'pipeBot',courier:'cleaner',volunteer:'volunteer',contractor:'volunteer',cleaner:'cleaner',loader:'cleaner',bastion:'loader'};
const antics={
 animal:['sneezes at a droplet and looks offended.','tries to intimidate its own tail.','carefully rearranges a damp cracker.','forgets the argument and washes one ear.','stares at a crumb as if it holds all the answers.','picks a fight with its own shadow.'],
 human:['tries to crack their knuckles. Nothing happens.','checks a pocket for a dramatic entrance cue.','argues with an imaginary supervisor.','attempts an intimidating wink. Both eyes close.','practices a threatening pose and loses their balance.','forgets their prepared insult halfway through.'],
 robot:['plays its own startup jingle. Nobody applauds.','installs a confidence update. Restart postponed.','announces a coffee break. It cannot drink coffee.','runs a victory simulation. The results are inconclusive.','asks you to rate this encounter before it is over.','spends a moment arguing with its own diagnostic report.']
};
function makeFoe(id,uid){const stats=ENEMIES[id]||ENEMIES.volunteer;return {uid,id,stats,hp:stats.hp,maxHp:stats.hp,charged:false,turn:1};}
export const livingEnemies=b=>b.enemies.filter(e=>e.hp>0&&!e.retreating);
export function targetEnemy(b){return b.enemies.find(e=>e.uid===b.targetUid&&e.hp>0)||livingEnemies(b)[0]||b.enemies.at(-1);}
export function selectTarget(b,uid){if(b.phase!=='command'||!b.enemies.some(e=>e.uid===uid&&e.hp>0))return false;b.targetUid=uid;return true;}
export function encounterRewards(b){return b.enemies.filter(e=>e.hp<=0||e.retreating).reduce((r,e)=>({xp:r.xp+e.stats.xp,credits:r.credits+e.stats.credits}),{xp:0,credits:0});}
export function createEncounter(id,progress,group=null){
 const foe=makeFoe(id,0);if(id==='argusSentinel')foe.stats={...foe.stats,name:securityText(foe.stats.name,progress)};const enemy=foe.stats,b={phase:'command',turn:1,hp:progress.hp,targetHp:progress.hp,maxHp:progress.maxHp,snacks:progress.snacks,inventory:[...(progress.inventory||[])],guarding:false,speedBoostTurns:Math.max(0,Math.min(3,progress.speedBoostTurns||0)),lastAction:null,enemies:[foe],enemyQueue:[],targetUid:0,nextUid:1,enemy,id,heroAttack:playerStats(progress).attack,defense:playerStats(progress).defense,speed:playerStats(progress).speed,message:securityText(enemy.opening,progress).replace('subject: Alex.','subject: '+(progress.name||'Alex')+'.')};
 if(group?.length){b.enemies=group.slice(0,MAX_ACTIVE_ENEMIES).map((kind,i)=>makeFoe(kind,i));b.nextUid=b.enemies.length;b.enemy=b.enemies[0].stats;}
 const hero={id:'hero',name:progress.name||'Alex',level:progress.level,weapon:'vibrosword',equipment:{weapon:'Homemade vibrosword'},capabilities:progress.capabilities,magicUnlocked:progress.magicUnlocked,flags:progress.flags,mp:progress.mp,maxMp:progress.maxMp};
 for(const key of ['hp','targetHp','maxHp','heroAttack','defense','speed','guarding','speedBoostTurns','speedBoostAppliedTurn']){hero[key]=b[key];Object.defineProperty(b,key,{enumerable:true,configurable:true,get:()=>hero[key],set:value=>{hero[key]=value;}});}
 b.party=[hero,...normalizeParty(progress).map(member=>({...member,targetHp:member.hp,heroAttack:member.attack,guarding:false,speedBoostTurns:member.speedBoostTurns||0}))];b.commandIndex=Math.max(0,b.party.findIndex(member=>member.hp>0));b.plannedActions={};b.healTargetId=b.party[b.commandIndex].id;
 // The selected foe retains the existing HUD/test-facing health interface.
 for(const [key,field]of [['enemyHp','hp'],['enemyMaxHp','maxHp'],['charged','charged']])Object.defineProperty(b,key,{get:()=>targetEnemy(b)[field],set:v=>{targetEnemy(b)[field]=v;}});
 return b;
}
export const actionItem=action=>action==='snack'?'sandwich':action.startsWith('item:')?action.slice(5):null;
export const itemCount=(b,id)=>id==='sandwich'?b.snacks:(b.inventory||[]).filter(item=>item===id).length;
export const effectiveSpeed=b=>b.speed*(b.speedBoostTurns>0?1.3:1)*(b.slowTurns>0?.7:1);
export function validatePlayerAction(b,action,actor=commandMember(b),healTarget=null){
 if(b.phase!=='command')return {ok:false};
 const id=actionItem(action),item=CONSUMABLES[id];
 if(!['attack','guard','run'].includes(action)&&!item)return {ok:false};
 if(item&&!itemCount(b,id))return {ok:false,message:'No '+item.name.toLowerCase()+' left.'};
 const recipient=healTarget||b.party?.find(member=>member.id===b.healTargetId)||actor;
 if(item&&recipient.targetHp>=recipient.maxHp&&!item.speedBoost)return {ok:false,message:recipient.id==='hero'?'Your HP is already full.':recipient.name+' is already at full HP.'};
 return {ok:true};
}
export function playerAction(b,action,rng=Math.random,{queued=false,actorId='hero',targetUid=null,healTargetId=null}={}){
 const actor=b.party?.find(member=>member.id===actorId)||b,recipient=b.party?.find(member=>member.id===(healTargetId||b.healTargetId))||actor;
 const valid=validatePlayerAction(b,action,actor,recipient);if(!valid.ok||action==='run')return {...valid,ok:false};
 b.phase='resolving';b.lastAction=action;actor.guarding=action==='guard';let damage=0,miss=false,recovered=0;const foe=b.enemies.find(enemy=>enemy.uid===targetUid&&enemy.hp>0)||targetEnemy(b),subject=actorId==='hero'?'Your':actor.name+'’s',weapon=actor.weapon==='electro-halberd'?'electro-halberd':'vibrosword';
 if(action==='attack'){
  miss=rng()<MISS_RATE;
  if(miss)b.message=subject+' '+weapon+' cuts empty air. Miss!';
  else{const repetition=foe.behavior?.[actorId]||0,adaptation=foe.stats.adaptive?Math.max(.7,1-Math.max(0,repetition-1)*.1):1;damage=Math.max(1,Math.round((actor.heroAttack+(foe.charged?4:0))*(foe.stats.incomingDamageMultiplier??1)*adaptation));foe.hp=Math.max(0,foe.hp-damage);if(foe.stats.retreatAtOne&&foe.hp===0){foe.hp=1;foe.retreating=true;foe.charged=false;}b.message=subject+' '+weapon+' strikes '+foe.stats.name+'. '+damage+' damage!';if(adaptation<1)b.message+=' BEHAVIOR MODEL UPDATED — repeated strike predicted.';if(!foe.hp)b.message+=' '+(foe.stats.containment?'Its restraint systems fail. Recovery is no longer viable.':foe.stats.kind==='human'?'They retreat.':'It shuts down.');}
 }
 for(const enemy of b.enemies)if(enemy.stats.adaptive){enemy.behavior??={};enemy.behavior[actorId]=action==='attack'&&enemy===foe?(enemy.behavior[actorId]||0)+1:0;}
 if(action==='guard')b.message=(actorId==='hero'?'You brace behind the vibrosword.':actor.name+' braces behind the '+weapon+'.')+' Damage is reduced for this turn.';
 const itemId=actionItem(action),item=CONSUMABLES[itemId];
 if(item){recovered=Math.min(item.heal,recipient.maxHp-recipient.targetHp);if(itemId==='sandwich')b.snacks--;else b.inventory.splice(b.inventory.indexOf(itemId),1);recipient.targetHp=Math.min(recipient.maxHp,recipient.targetHp+item.heal);if(recipient.hp<=0)recipient.hp=1;if(item.speedBoost){recipient.speedBoostTurns=item.boostTurns;recipient.speedBoostAppliedTurn=b.turn;}b.message=(actorId==='hero'?'You':actor.name)+' use'+(actorId==='hero'?'':'s')+' '+item.name.toLowerCase()+(b.party.length>1?' for '+recipient.name:'')+'. '+recovered+' HP recovered.'+(item.speedBoost?' Speed +30% for three turns!':'');}
 const actionMessage=b.message;
 const survivors=livingEnemies(b);if(!queued)b.enemyQueue=survivors.map(e=>e.uid);
 if(!survivors.length){b.phase=foe.retreating?'bossRetreat':'victory';b.roundQueue=[];b.targetHp=b.hp;b.message=b.id==='regulator'?'The Cenexis override breaks. The regulator reboots into municipal control.':b.enemy.kind==='human'?'They drop their guard and flee.':b.enemy.kind==='animal'?'The rats scatter into the pipes.':'The machines fall silent.';}
 else if(foe.hp<=0)b.targetUid=survivors[0].uid;
 return {ok:true,damage,miss,recovered,itemId,itemName:item?.name,speedBoost:item?.speedBoost,actionMessage,targetUid:foe.uid,actorId,recipientId:recipient.id};
}
export function enemyAction(b,rng=Math.random,{queued=false}={}){
 if(b.phase!=='resolving')return {ok:false};
 let foe;while(b.enemyQueue.length&&!foe){const uid=b.enemyQueue.shift();foe=b.enemies.find(e=>e.uid===uid&&e.hp>0);}
 if(!foe){if(!queued){b.phase='command';b.guarding=false;}return {ok:false};}
 const members=livingParty(b),victim=members.length===1?members[0]:foe.stats.containment&&foe.turn%3!==2?members.find(member=>member.id==='hero')||members[0]:members[Math.floor(rng()*members.length)%members.length];
 if(!victim)return {ok:false};
 if(foe.stats.missileVolleyPower&&!foe.missileVolleyUsed&&foe.hp<=foe.maxHp*.2){
  foe.missileVolleyUsed=true;foe.charged=false;foe.turn++;
  const miss=rng()<MISS_RATE;let damage=foe.stats.missileVolleyPower;
  if(victim.guarding)damage=Math.ceil(damage*.3);
  damage=miss?0:damage;
  const hits=[Math.floor(damage/3),Math.floor(damage/3),damage-2*Math.floor(damage/3)];
  const impact={type:'missile-volley',enemyUid:foe.uid,targetPartyId:victim.id,damage,hits,hitApplied:[false,false,false],miss,applied:false,queued};
  b.pendingEnemyImpact=impact;b.phase='enemyAnimation';b.message='';
  return {ok:true,type:'missile-volley',enemyUid:foe.uid,damage:0,impact};
 }
 // Threshold is private combat state; no health-trigger narration. A charged
 // attack keeps its promised next turn, with the wave waiting until afterward.
 if(foe.stats.tidalWavePower&&!foe.charged&&!foe.tidalWaveUsed&&foe.hp<=foe.maxHp*.2){
  foe.tidalWaveUsed=true;foe.turn++;
  const miss=rng()<MISS_RATE;
  let damage=Math.max(4,foe.stats.tidalWavePower-victim.defense);
  if(victim.guarding)damage=Math.ceil(damage*.3);
  const impact={type:'tidal-wave',enemyUid:foe.uid,targetPartyId:victim.id,damage:miss?0:Math.round(damage*ENEMY_DAMAGE_MULTIPLIER),miss,applied:false,queued};
  b.pendingEnemyImpact=impact;b.phase='enemyAnimation';b.message='';
  return {ok:true,type:'tidal-wave',enemyUid:foe.uid,damage:0,impact};
 }
 const result={ok:true,damage:0,enemyUid:foe.uid,targetPartyId:victim.id,type:'attack'},roll=rng(),name=foe.stats.name,sillyRate=foe.stats.sillyRate??SILLY_RATE;
 if(!foe.charged&&roll<sillyRate){result.type='silly';b.message=name+' '+antics[foe.stats.kind][(foe.turn-1)%antics[foe.stats.kind].length];}
 else if(!foe.charged&&!foe.stats.noHelp&&roll<sillyRate+HELP_RATE){
  result.type='help';
  if(livingEnemies(b).length<MAX_ACTIVE_ENEMIES){const helper=makeFoe(foe.stats.helper||helperFor[foe.id]||'volunteer',b.nextUid++);b.pendingReinforcement={helper,queued};b.phase='reinforcement';result.joined=helper.uid;b.message=name+' calls for help!';}
  else b.message=name+' calls for help, but there is no room for anyone else!';
 }else if(foe.stats.containment&&!foe.charged&&foe.turn%4===2){
  result.type='restraint';victim.slowTurns=2;victim.slowAppliedTurn=b.turn;b.message=name+': RESTRAINT FOAM coats '+victim.name+'’s boots. Speed reduced for two turns. Recovery condition: alive.';
 }else if(!foe.charged&&foe.turn%3===0){
  result.type='charge';foe.charged=true;b.message=name+': '+(foe.stats.chargeText|| (foe.id==='regulator'?'Its electric coils charge above a trembling column of water.':foe.stats.kind==='human'?'They plant their feet and draw back their arm.':foe.stats.kind==='animal'?'It crouches low, preparing to leap.':'Its capacitors begin charging with a rising electrical whine.'));
 }else{
  const charged=foe.charged;foe.charged=false;
  if(rng()<MISS_RATE){result.type='miss';b.message=name+' '+(charged?'releases its big attack too wide. Miss!':'swings past you. Miss!');}
  else{let damage=Math.max(4,(charged?foe.stats.charge:foe.stats.attack+(foe.turn%2===0?3:0))-victim.defense);if(victim.guarding)damage=Math.ceil(damage*.3);damage=Math.round(Math.round(damage*ENEMY_DAMAGE_MULTIPLIER)*(foe.stats.outgoingDamageMultiplier??1));result.damage=damage;victim.targetHp=Math.max(0,victim.targetHp-damage);b.message=name+': '+((charged?foe.stats.chargedText:foe.stats.attackText)|| (foe.id==='regulator'?(charged?'An electrical outburst erupts through the spray!':foe.turn%2===0?'It tears a pipe loose and hurls it at you!':'A pressurized water blast knocks you back!'):foe.stats.kind==='human'?(charged?'A full-body shove!':'A fist catches your shoulder.'):foe.stats.kind==='animal'?(charged?'It launches itself at your shoulder!':'Sharp teeth catch your sleeve.'):(charged?'A charged restraint pulse tears through the air!':'A plated arm slams into you.')))+' '+damage+' damage'+(b.party.length>1?' to '+victim.name:'')+'.';}
 }
 foe.turn++;if(!queued&&!b.enemyQueue.length&&!b.pendingReinforcement){b.turn++;b.guarding=false;b.phase='command';}
 return result;
}

// Presentation calls this only after the caller's announcement has been read.
// Arrival uses the helper's first turn, so it is never added to this round's queue.
export function revealReinforcement(b){
 const pending=b.pendingReinforcement;if(b.phase!=='reinforcement'||!pending)return false;
 pending.helper.turn++;b.enemies.push(pending.helper);b.pendingReinforcement=null;b.message=pending.helper.stats.name+' appears!';
 b.phase=pending.queued||b.enemyQueue.length?'resolving':'command';
 if(!pending.queued&&b.phase==='command'){b.turn++;b.guarding=false;}
 return true;
}

// Animation callbacks commit an enemy hit exactly once, only in its live battle.
export function applyEnemyImpact(b,impact,index=0){
 if(b.phase!=='enemyAnimation'||b.pendingEnemyImpact!==impact||impact.applied)return false;
 const victim=b.party?.find(member=>member.id===impact.targetPartyId)||b;
 if(impact.hits){
  if(!Number.isInteger(index)||index<0||index>=impact.hits.length||impact.hitApplied[index])return false;
  impact.hitApplied[index]=true;impact.applied=impact.hitApplied.every(Boolean);victim.targetHp=Math.max(0,victim.targetHp-impact.hits[index]);
 }else{impact.applied=true;victim.targetHp=Math.max(0,victim.targetHp-impact.damage);}
 b.message=impact.miss?'Miss!':impact.type==='missile-volley'?'A missile volley was fired, doing massive '+impact.damage+' damage!':impact.damage+' damage.';return true;
}
export function finishEnemyAnimation(b,impact){
 if(b.phase!=='enemyAnimation'||b.pendingEnemyImpact!==impact||!impact.applied)return false;
 b.pendingEnemyImpact=null;b.phase=impact.queued?'resolving':b.enemyQueue.length?'resolving':'command';
 if(!impact.queued&&b.phase==='command'){b.turn++;b.guarding=false;}
 return true;
}
