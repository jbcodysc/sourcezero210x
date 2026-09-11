export const SAVE_KEY='source-zero-bellwether-v1';
export const SANDWICH_HEAL=70;
export const SANDWICH_PRICE=40;
export const VEST_DEFENSE=5;
export const STORY_XP={b1:35,b3:50,b4:65,b5:70,b6:90,b7:85,b8:100};
export function freshProgress(name='Alex'){return {version:1,name,opening:'intro',flags:{},notes:[],hp:110,maxHp:110,level:1,xp:0,credits:70,snacks:1,upgrade:0,armor:null,inventory:[],location:'lab',position:{x:768,y:838},visited:['lab']};}
export function milestone(s,id,xp){if(s.flags['xp:'+id])return false;s.flags['xp:'+id]=true;award(s,xp,0);return true;}
export function storyReward(s,id){return STORY_XP[id]?milestone(s,id,STORY_XP[id]):false;}
export function upgradeProgress(s){
 if(!Array.isArray(s.inventory))s.inventory=[];if(s.armor!=='insulated-vest')s.armor=null;
 s.notes=s.notes.map(note=>note.startsWith('Found an insulated work vest near the fourth-floor stairs.')?note.replace(/It adds \d+ defense when equipped\./,'It adds '+VEST_DEFENSE+' defense when equipped.'):note);
 const completed={b1:'sampleTaken',b3:'beckMet',b4:'badge',b5:'badgeFixed',b6:'resinCleared',b7:'relayTaken',b8:'factoryDone'};
 for(const [id,flag]of Object.entries(completed))if(s.flags[flag])storyReward(s,id);
 return s;
}
export function equipVest(s){if(!s.inventory?.includes('insulated-vest'))return false;s.armor=s.armor==='insulated-vest'?null:'insulated-vest';return true;}
export function xpThreshold(level){return 25*(level-1)**2;}
export function award(s,xp,credits){s.xp+=xp;s.credits+=credits;let levels=0;while(s.level<20&&s.xp>=xpThreshold(s.level+1)){s.level++;levels++;s.maxHp+=12;s.hp=Math.min(s.maxHp,s.hp+24);}return levels;}
export function mark(s,flag,note){const first=!s.flags[flag];s.flags[flag]=true;if(note&&!s.notes.includes(note))s.notes.push(note);return first;}
export function restore(s){s.hp=s.maxHp;}
export function buy(s,kind){if(kind==='snack'){if(s.credits<SANDWICH_PRICE)return 'A sandwich costs '+SANDWICH_PRICE+' credits.';s.credits-=SANDWICH_PRICE;s.snacks++;return 'One pocket sandwich. Try to keep it away from solvents.';}if(kind==='upgrade'){if(s.upgrade)return 'That grip is already fitted. Take care of it.';if(s.credits<85)return 'The insulated grip costs 85 credits.';s.credits-=85;s.upgrade=1;return 'Insulated grip fitted. Your vibrosword strikes harder.';}if(kind==='hotel'){if(s.credits<14)return 'Short on cash? The clinic offers free first aid.';s.credits-=14;restore(s);return 'A quiet room, clean sheets. HP restored.';}return '';}
export function validProgress(s){return s?.version===1&&s.flags&&typeof s.flags==='object'&&!Array.isArray(s.flags)&&Array.isArray(s.notes)&&s.notes.every(n=>typeof n==='string')&&Array.isArray(s.visited)&&['hp','maxHp','level','xp','credits','snacks','upgrade'].every(k=>Number.isFinite(s[k])&&s[k]>=0)&&s.hp<=s.maxHp&&s.maxHp>0&&s.level>=1&&s.level<=20&&s.upgrade<=1&&typeof s.location==='string'&&Number.isFinite(s.position?.x)&&Number.isFinite(s.position?.y);}
