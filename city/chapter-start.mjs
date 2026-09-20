import {freshProgress,STORY_XP,xpThreshold,award,CONSUMABLES} from './progress.mjs';
import {ARRIVAL,BUILDINGS,rearServiceEntrance} from '../fairmont/world.mjs';
import {transition} from '../fairmont/story.mjs';

export const CHAPTERS=Object.freeze([
 {id:1,title:'Bellwether',description:'The first morning in the lab. Level 1.'},
 {id:2,title:'Fairmont Junction',description:'Arrive by bus. Level 15, Chapter 1 equipment, 2,000 credits and two sandwiches.'},
 {id:'2-facility',badge:'02',title:'Chapter 2 — Drone Facility',description:'Post-scan checkpoint. Level 24, 5,000 credits, ten of each food, available equipment and facility keycard. Security Combat Response Autonomous Pursuer undefeated.'}
]);

/** A chapter start is a new adventure in one selected file, never a mutation of another save. */
export function createChapterProgress(chapter,name='Alex'){
 if(!CHAPTERS.some(item=>item.id===chapter))throw new RangeError('Unknown chapter');
 const s=freshProgress(name);if(chapter===1)return s;
 award(s,xpThreshold(15),0);
 Object.assign(s,{opening:'complete',hp:s.maxHp,credits:2000,snacks:2,upgrade:1,armor:'insulated-vest',inventory:['insulated-grip','insulated-vest'],location:'fairmont',position:{...ARRIVAL},visited:['lab','city','water','fairmont']});
 for(const flag of ['courierArrived','courierDone','policeReported','manifestChecked','sampleTaken','beckMet','badge','badgeFixed','resinCleared','bastionDefeated','relayTaken','factoryDone','waterAccess','waterRestored','vestFound','chapterComplete'])s.flags[flag]=true;
 for(const id of Object.keys(STORY_XP))s.flags['xp:'+id]=true;
 s.notes.push('The delivery droid attacked me in Bellwether. The police report led nowhere.', 'The relay storage module points toward Cenexis. Ruth repaired the service badge.', 'Bellwether’s water regulator is restored. I took the bus to Fairmont Junction.');
 let result=transition(s,'arrive').state;
 if(chapter==='2-facility'){
  for(const event of ['module-reminder','radio-bargain','hotel-sleep','bellwether-finished','wrm-enter','karen-start','karen-defeated','cut-lines','hotel-sleep','decrypt-start','guard-heard','protester-finished','scan-finished','security-defeated','keycard'])result=transition(result,event).state;
  award(result,xpThreshold(24)-result.xp,0);
  result.credits=5000;result.snacks=10;
  for(const id of Object.keys(CONSUMABLES).filter(id=>id!=='sandwich')){result.inventory=result.inventory.filter(item=>item!==id);result.inventory.push(...Array(10).fill(id));}
  result.inventory.push('resonant-drive','laminate-vest');result.upgrade=2;result.armor='laminate-vest';result.hp=result.maxHp;
  const entry=rearServiceEntrance(BUILDINGS.find(b=>b.id==='facility'));
  result.location='fairmont';result.position={x:entry.x,y:entry.y-75};
 }
 return result;
}
