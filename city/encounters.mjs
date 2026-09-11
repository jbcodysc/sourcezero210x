import {rollHealth} from '../lab/battle-rules.mjs';
import {SANDWICH_HEAL,VEST_DEFENSE} from './progress.mjs';
export {rollHealth};
export const MISS_RATE=.05,SILLY_RATE=.15,HELP_RATE=.05,ENEMY_DAMAGE_MULTIPLIER=1.3,MAX_ACTIVE_ENEMIES=3;
export const ENEMIES={
 courier:{name:'Cenexis Courier',hp:180,attack:15,charge:38,xp:25,credits:22,portrait:'courier-battle',kind:'robot',noHelp:true,opening:'Biological variance confirmed. Subject retrieval authorized.'},
 volunteer:{name:'Misled Volunteer',hp:90,attack:10,charge:24,xp:12,credits:14,portrait:'battle-human',kind:'human',opening:'“The bulletin says you are dangerous. I am helping!”'},
 contractor:{name:'Cenexis Contractor',hp:118,attack:13,charge:29,xp:19,credits:19,portrait:'battle-human',kind:'human',opening:'“Corporate property. Stop right there.”'},
 cleaner:{name:'Overzealous Cleaner',hp:105,attack:12,charge:28,xp:16,credits:17,portrait:'battle-robot',kind:'robot',opening:'UNREGISTERED OBSTRUCTION. THIS STREET WILL BE TIDY.'},
 loader:{name:'Routebound Loader',hp:138,attack:15,charge:32,xp:22,credits:22,portrait:'battle-robot',kind:'robot',opening:'COLLECTION ZONE BREACHED. PLEASE BECOME CARGO.'},
 bastion:{name:'BASTION-7',hp:320,attack:21,charge:43,xp:105,credits:90,portrait:'battle-boss',kind:'robot',boss:true,noHelp:true,opening:'Unauthorized investigative subject: Alex. Your arrival was anticipated.'},
 waterScrubber:{name:'Runaway Scrubber',hp:160,attack:40,charge:60,xp:55,credits:32,portrait:'water-enemies',frame:'water-0',kind:'robot',opening:'FLOOR CLEANING PRIORITY: REMOVE THE CHEMIST.'},
 pipeBot:{name:'Pressure Technician',hp:184,attack:42,charge:64,xp:65,credits:38,portrait:'water-enemies',frame:'water-1',kind:'robot',opening:'Your pressure reading is unacceptable.'},
 pipeRat:{name:'Pipe Rat',hp:132,attack:39,charge:54,xp:50,credits:20,portrait:'water-enemies',frame:'water-2',kind:'animal',opening:'A soaking-wet rat bares its teeth.'},
 waterGuard:{name:'Cenexis Facility Guard',hp:198,attack:44,charge:65,xp:70,credits:45,portrait:'water-enemies',frame:'water-3',kind:'human',opening:'“Company orders. Turn around.”'},
 drainBot:{name:'Drain Scourer',hp:175,attack:41,charge:62,xp:60,credits:35,portrait:'water-enemies',frame:'water-4',kind:'robot',opening:'BLOCKAGE IDENTIFIED. APPLYING EXCESSIVE FORCE.'},
 regulator:{name:'DELUGE · Water Regulator',hp:650,attack:46,charge:70,xp:300,credits:180,portrait:'water-enemies',frame:'water-5',kind:'robot',boss:true,noHelp:true,opening:'CENEXIS REMOTE OVERRIDE ACTIVE. DISCHARGE LIMITS DISABLED.'}
};
const helperFor={waterScrubber:'pipeRat',pipeBot:'waterScrubber',pipeRat:'pipeRat',waterGuard:'waterGuard',drainBot:'pipeBot',courier:'cleaner',volunteer:'volunteer',contractor:'volunteer',cleaner:'cleaner',loader:'cleaner',bastion:'loader'};
const antics={
 animal:['sneezes at a droplet and looks offended.','tries to intimidate its own tail.','carefully rearranges a damp cracker.','forgets the argument and washes one ear.'],
 human:['tries to crack their knuckles. Nothing happens.','checks a pocket for a dramatic entrance cue.','argues with an imaginary supervisor.','attempts an intimidating wink. Both eyes close.'],
 robot:['prints a receipt for absolutely nothing.','installs a confidence update. Restart postponed.','announces a coffee break. It cannot drink coffee.','spins its wrist like a tiny ceiling fan.']
};
function makeFoe(id,uid){const stats=ENEMIES[id]||ENEMIES.volunteer;return {uid,id,stats,hp:stats.hp,maxHp:stats.hp,charged:false,turn:1};}
export const livingEnemies=b=>b.enemies.filter(e=>e.hp>0);
export function targetEnemy(b){return b.enemies.find(e=>e.uid===b.targetUid&&e.hp>0)||livingEnemies(b)[0]||b.enemies.at(-1);}
export function selectTarget(b,uid){if(b.phase!=='command'||!b.enemies.some(e=>e.uid===uid&&e.hp>0))return false;b.targetUid=uid;return true;}
export function encounterRewards(b){return b.enemies.filter(e=>e.hp<=0).reduce((r,e)=>({xp:r.xp+e.stats.xp,credits:r.credits+e.stats.credits}),{xp:0,credits:0});}
export function createEncounter(id,progress){
 const foe=makeFoe(id,0),enemy=foe.stats,b={phase:'command',turn:1,hp:progress.hp,targetHp:progress.hp,maxHp:progress.maxHp,snacks:progress.snacks,guarding:false,lastAction:null,enemies:[foe],enemyQueue:[],targetUid:0,nextUid:1,enemy,id,heroAttack:31+(progress.level-1)*3+progress.upgrade*6,defense:(progress.level-1)*2+(progress.armor==='insulated-vest'?VEST_DEFENSE:0),message:enemy.opening.replace('subject: Alex.','subject: '+(progress.name||'Alex')+'.')};
 // The selected foe retains the existing HUD/test-facing health interface.
 for(const [key,field]of [['enemyHp','hp'],['enemyMaxHp','maxHp'],['charged','charged']])Object.defineProperty(b,key,{get:()=>targetEnemy(b)[field],set:v=>{targetEnemy(b)[field]=v;}});
 return b;
}
export function playerAction(b,action,rng=Math.random){
 if(b.phase!=='command'||!['attack','guard','snack'].includes(action))return {ok:false};
 if(action==='snack'&&(!b.snacks||b.hp>=b.maxHp&&b.targetHp>=b.maxHp))return {ok:false,message:b.snacks?'Your HP is already full.':'No sandwiches left.'};
 b.phase='resolving';b.lastAction=action;b.guarding=action==='guard';let damage=0,miss=false;const foe=targetEnemy(b);
 if(action==='attack'){
  miss=rng()<MISS_RATE;
  if(miss)b.message='Your vibrosword cuts empty air. Miss!';
  else{damage=b.heroAttack+(foe.charged?4:0);foe.hp=Math.max(0,foe.hp-damage);b.message='Your vibrosword strikes '+foe.stats.name+'. '+damage+' damage!';if(!foe.hp)b.message+=' '+(foe.stats.kind==='human'?'They retreat.':'It shuts down.');}
 }
 if(action==='guard')b.message='You brace behind the vibrosword. Incoming damage will be reduced.';
 if(action==='snack'){b.snacks--;b.targetHp=Math.min(b.maxHp,b.targetHp+SANDWICH_HEAL);b.hp=Math.min(b.maxHp,Math.max(b.hp,b.targetHp));b.message='You eat a pocket sandwich. '+SANDWICH_HEAL+' HP recovered.';}
 const survivors=livingEnemies(b);b.enemyQueue=survivors.map(e=>e.uid);
 if(!survivors.length){b.phase='victory';b.targetHp=b.hp;b.message=b.id==='regulator'?'The Cenexis override breaks. The regulator reboots into municipal control.':b.enemy.kind==='human'?'They drop their guard and flee.':b.enemy.kind==='animal'?'The rats scatter into the pipes.':'The machines fall silent.';}
 else if(foe.hp<=0)b.targetUid=survivors[0].uid;
 return {ok:true,damage,miss,targetUid:foe.uid};
}
export function enemyAction(b,rng=Math.random){
 if(b.phase!=='resolving')return {ok:false};
 let foe;while(b.enemyQueue.length&&!foe){const uid=b.enemyQueue.shift();foe=b.enemies.find(e=>e.uid===uid&&e.hp>0);}
 if(!foe){b.phase='command';b.guarding=false;return {ok:false};}
 const result={ok:true,damage:0,enemyUid:foe.uid,type:'attack'},roll=rng(),name=foe.stats.name;
 if(!foe.charged&&roll<SILLY_RATE){result.type='silly';b.message=name+' '+antics[foe.stats.kind][(foe.turn-1)%4];}
 else if(!foe.charged&&!foe.stats.noHelp&&roll<SILLY_RATE+HELP_RATE){
  result.type='help';
  if(livingEnemies(b).length<MAX_ACTIVE_ENEMIES){const helper=makeFoe(helperFor[foe.id]||'volunteer',b.nextUid++);b.enemies.push(helper);result.joined=helper.uid;b.message=name+' calls for help. '+helper.stats.name+' joins the fight!';}
  else b.message=name+' calls for help, but there is no room for anyone else!';
 }else if(!foe.charged&&foe.turn%3===0){
  result.type='charge';foe.charged=true;b.message=name+': '+(foe.id==='regulator'?'Its electric coils charge above a trembling column of water.':foe.stats.kind==='human'?'They plant their feet and draw back their arm.':foe.stats.kind==='animal'?'It crouches low, preparing to leap.':'Its capacitors begin charging with a rising electrical whine.');
 }else{
  const charged=foe.charged;foe.charged=false;
  if(rng()<MISS_RATE){result.type='miss';b.message=name+' '+(charged?'releases its big attack too wide. Miss!':'swings past you. Miss!');}
  else{let damage=Math.max(4,(charged?foe.stats.charge:foe.stats.attack+(foe.turn%2===0?3:0))-b.defense);if(b.guarding)damage=Math.ceil(damage*.3);damage=Math.round(damage*ENEMY_DAMAGE_MULTIPLIER);result.damage=damage;b.targetHp=Math.max(0,b.targetHp-damage);b.message=name+': '+(foe.id==='regulator'?(charged?'An electrical outburst erupts through the spray!':foe.turn%2===0?'It tears a pipe loose and hurls it at you!':'A pressurized water blast knocks you back!'):foe.stats.kind==='human'?(charged?'A full-body shove!':'A fist catches your shoulder.'):foe.stats.kind==='animal'?(charged?'It launches itself at your shoulder!':'Sharp teeth catch your sleeve.'):(charged?'A charged restraint pulse tears through the air!':'A plated arm slams into you.'))+' '+damage+' damage.';}
 }
 foe.turn++;if(!b.enemyQueue.length){b.turn++;b.guarding=false;b.phase='command';}
 return result;
}
