import {freshProgress,STORY_XP,xpThreshold,award} from './progress.mjs';
import {ARRIVAL} from '../fairmont/world.mjs';
import {transition} from '../fairmont/story.mjs';

export const CHAPTERS=Object.freeze([
 {id:1,title:'Bellwether',description:'The first morning in the lab. Level 1.'},
 {id:2,title:'Fairmont Junction',description:'Arrive by bus. Level 15, Chapter 1 equipment, 2,000 credits and two sandwiches.'}
]);

/** A chapter start is a new adventure in one selected file, never a mutation of another save. */
export function createChapterProgress(chapter,name='Alex'){
 if(!CHAPTERS.some(item=>item.id===chapter))throw new RangeError('Unknown chapter');
 const s=freshProgress(name);if(chapter===1)return s;
 award(s,xpThreshold(15),0);
 Object.assign(s,{opening:'complete',hp:s.maxHp,credits:2000,snacks:2,upgrade:1,armor:'insulated-vest',inventory:['insulated-vest'],location:'fairmont',position:{...ARRIVAL},visited:['lab','city','water','fairmont']});
 for(const flag of ['courierArrived','courierDone','policeReported','manifestChecked','sampleTaken','beckMet','badge','badgeFixed','resinCleared','bastionDefeated','relayTaken','factoryDone','waterAccess','waterRestored','vestFound','chapterComplete'])s.flags[flag]=true;
 for(const id of Object.keys(STORY_XP))s.flags['xp:'+id]=true;
 s.notes.push('The delivery droid attacked me in Bellwether. The police report led nowhere.', 'The relay storage module points toward Cenexis. Ruth repaired the service badge.', 'Bellwether’s water regulator is restored. I took the bus to Fairmont Junction.');
 return transition(s,'arrive').state;
}
