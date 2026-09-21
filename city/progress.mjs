export const SAVE_KEY='source-zero-bellwether-v1';
export const SANDWICH_HEAL=70;
export const SANDWICH_PRICE=40;
export const FIELD_MEAL_HEAL=160;
export const FIELD_MEAL_PRICE=200;
export const CONSUMABLES=Object.freeze({
 sandwich:Object.freeze({name:'Pocket sandwich',description:'A simple sandwich, kept safely away from solvents.',heal:SANDWICH_HEAL,price:SANDWICH_PRICE}),
 'field-meal':Object.freeze({name:'Hearty field meal',description:'A substantial hot meal in an insulated container.',heal:FIELD_MEAL_HEAL,price:FIELD_MEAL_PRICE}),
 'caramel-macchiato':Object.freeze({name:'Caramel macchiato',description:'Handmade coffee. Speed +30% for the next three combat rounds.',heal:15,price:8,speedBoost:1.3,boostTurns:3})
});
export const VEST_DEFENSE=5;
export const GEAR=Object.freeze({
 'insulated-grip':Object.freeze({name:'Insulated grip',description:'A safer grip for the homemade vibrosword.',kind:'weapon',price:85,attack:6,tier:1}),
 'resonant-drive':Object.freeze({name:'Resonant edge drive',kind:'weapon',price:320,attack:20,tier:2}),
 'laminate-vest':Object.freeze({name:'Laminated field vest',kind:'body',price:240,defense:12}),
 'insulated-vest':Object.freeze({name:'Insulated work vest',kind:'body',value:100,defense:VEST_DEFENSE})
});
export const weaponBonus=s=>s.upgrade>=2?GEAR['resonant-drive'].attack:s.upgrade?6:0;
export const armorDefense=s=>GEAR[s.armor]?.kind==='body'?GEAR[s.armor].defense:0;
export const playerStats=s=>({health:s.maxHp,attack:31+(s.level-1)*3+weaponBonus(s),defense:(s.level-1)*2+armorDefense(s),speed:4+s.level});
export const STORY_XP={b1:35,b3:50,b4:65,b5:70,b6:90,b7:85,b8:100};
export function freshProgress(name='Alex'){return {version:1,xpCurveVersion:2,gearInventoryVersion:1,name,opening:'intro',flags:{},notes:[],hp:110,maxHp:110,level:1,xp:0,credits:70,snacks:1,upgrade:0,armor:null,inventory:[],location:'lab',position:{x:768,y:838},visited:['lab']};}
export function milestone(s,id,xp){if(s.flags['xp:'+id])return false;s.flags['xp:'+id]=true;award(s,xp,0);return true;}
export function storyReward(s,id){return STORY_XP[id]?milestone(s,id,STORY_XP[id]):false;}
export function upgradeProgress(s){
 migrateLevelCurve(s);migrateGearInventory(s);
 if(!Array.isArray(s.inventory))s.inventory=[];if(GEAR[s.armor]?.kind!=='body')s.armor=null;
 s.notes=s.notes.map(note=>note.startsWith('Found an insulated work vest near the fourth-floor stairs.')?note.replace(/It adds \d+ defense when equipped\./,'It adds '+VEST_DEFENSE+' defense when equipped.'):note);
 const completed={b1:'sampleTaken',b3:'beckMet',b4:'badge',b5:'badgeFixed',b6:'resinCleared',b7:'relayTaken',b8:'factoryDone'};
 for(const [id,flag]of Object.entries(completed))if(s.flags[flag])storyReward(s,id);
 return s;
}
export function equipVest(s){if(!s.inventory?.includes('insulated-vest'))return false;s.armor=s.armor==='insulated-vest'?null:'insulated-vest';return true;}
export function equipArmor(s,id){if(GEAR[id]?.kind!=='body'||!s.inventory?.includes(id))return false;s.armor=s.armor===id?null:id;return true;}
export function buyGear(s,id){
 migrateGearInventory(s);
 const item=GEAR[id];if(!item?.price)return 'That item is not for sale.';
 if(s.inventory?.includes(id))return item.name+' is already yours.';
 if(s.credits<item.price)return item.name+' costs '+item.price+' credits.';
 s.credits-=item.price;s.inventory??=[];if(!s.inventory.includes(id))s.inventory.push(id);
 if(item.kind==='weapon'){s.upgrade=item.tier;return item.name+' fitted. Weapon bonus +'+item.attack+' attack.';}
 s.armor=id;return item.name+' equipped. Defense +'+item.defense+'.';
}
export function xpThreshold(level){const beyond=Math.max(0,level-22);return beyond?11025+2688*beyond+538*beyond*(beyond-1):25*(level-1)**2;}
export function migrateLevelCurve(s){
 if(s.xpCurveVersion===2)return s;
 if(s.level>=22){const previous=25*(s.level-1)**2,next=25*s.level**2,fraction=Math.max(0,Math.min(1,(s.xp-previous)/(next-previous)));s.xp=xpThreshold(s.level)+Math.floor(fraction*(xpThreshold(s.level+1)-xpThreshold(s.level)));}
 s.xpCurveVersion=2;return s;
}
export function migrateGearInventory(s){
 if(s.gearInventoryVersion===1)return s;
 s.inventory??=[];for(const [tier,id]of [[1,'insulated-grip'],[2,'resonant-drive']])if(s.upgrade>=tier&&!s.inventory.includes(id))s.inventory.push(id);
 s.gearInventoryVersion=1;return s;
}
export function award(s,xp,credits){s.xp+=xp;s.credits+=credits;let levels=0;while(s.xp>=xpThreshold(s.level+1)){s.level++;levels++;s.maxHp+=12;s.hp=Math.min(s.maxHp,s.hp+24);}return levels;}
export function mark(s,flag,note){const first=!s.flags[flag];s.flags[flag]=true;if(note&&!s.notes.includes(note))s.notes.push(note);return first;}
export function restore(s){s.hp=s.maxHp;for(const member of s.party||[])member.hp=member.maxHp;}
export function buy(s,kind){if(kind==='sandwich')kind='snack';if(GEAR[kind]?.price)return buyGear(s,kind);if(CONSUMABLES[kind]?.price){const item=CONSUMABLES[kind];if(s.credits<item.price)return item.name+' costs '+item.price+' credits.';s.credits-=item.price;s.inventory??=[];s.inventory.push(kind);return item.name+' packed. Restores '+item.heal+' HP.';}if(kind==='snack'){if(s.credits<SANDWICH_PRICE)return 'A sandwich costs '+SANDWICH_PRICE+' credits.';s.credits-=SANDWICH_PRICE;s.snacks++;return 'One pocket sandwich. Try to keep it away from solvents.';}if(kind==='upgrade')return buyGear(s,'insulated-grip');if(kind==='hotel'){if(s.credits<14)return 'Short on cash? The clinic offers free first aid.';s.credits-=14;restore(s);return 'A quiet room, clean sheets. HP restored.';}return '';}
export function validProgress(s){return s?.version===1&&s.flags&&typeof s.flags==='object'&&!Array.isArray(s.flags)&&Array.isArray(s.notes)&&s.notes.every(n=>typeof n==='string')&&Array.isArray(s.visited)&&['hp','maxHp','level','xp','credits','snacks','upgrade'].every(k=>Number.isFinite(s[k])&&s[k]>=0)&&s.hp<=s.maxHp&&s.maxHp>0&&Number.isSafeInteger(s.level)&&s.level>=1&&Number.isInteger(s.upgrade)&&s.upgrade<=2&&typeof s.location==='string'&&Number.isFinite(s.position?.x)&&Number.isFinite(s.position?.y);}
