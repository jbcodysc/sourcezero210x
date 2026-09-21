import {GEAR,playerStats,CONSUMABLES,equipArmor,migrateGearInventory} from './progress.mjs';
export const escapeUI=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const hasMagic=s=>!!(s.magicUnlocked||s.capabilities?.magic||s.flags?.magicUnlocked||s.flags?.MAGIC_UNLOCKED);
export function characterStatus(s){
 const stats=playerStats(s),out={name:s.name,level:s.level,hp:Math.ceil(s.hp),maxHp:s.maxHp,stats:[['Attack',s.attack??stats.attack],['Defense',s.defense??stats.defense],['Speed',s.speed??stats.speed]]};
 if(hasMagic(s)){out.mp=s.mp??0;out.maxMp=s.maxMp??0;}
 return out;
}
export function partyMembers(s){return [s,...(s.party||[]).filter(member=>member&&member.id!=='hero')];}
export function partyStatus(s){return partyMembers(s).map(characterStatus);}
const bar=(label,value,max)=>'<div class="core-resource"><span>'+label+'</span><strong>'+value+' / '+max+'</strong><div role="meter" aria-label="'+label+'" aria-valuemin="0" aria-valuemax="'+max+'" aria-valuenow="'+value+'"><i style="width:'+Math.max(0,Math.min(100,max?value/max*100:0))+'%"></i></div></div>';
export function statusPanel(s,compact=false){const c=characterStatus(s);return '<section class="core-character"><header><h2>'+escapeUI(c.name)+'</h2><span>LEVEL '+c.level+'</span></header>'+bar('HP',c.hp,c.maxHp)+(hasMagic(s)?bar('MP',c.mp,c.maxMp):'')+(!compact?'<dl>'+c.stats.map(([name,value])=>'<div><dt>'+name+'</dt><dd>'+value+'</dd></div>').join('')+'</dl><p class="core-equipment">'+escapeUI(s.equipment?.weapon|| (s.upgrade>=2?'Vibrosword · resonant edge':s.upgrade?'Vibrosword · insulated grip':'Homemade vibrosword'))+'<br>'+escapeUI(s.equipment?.body||GEAR[s.armor]?.name||'No body armor')+'</p>':'')+'</section>';}
const ITEMS={
 ...CONSUMABLES,
 'fairmont-service-keycard':{keyItem:true,name:'Cenexis service keycard',description:'Authorizes the employee entrance to the Drone Facility. Used automatically at the reader.'},
 'service-badge':{keyItem:true,name:'Repaired service badge',description:'Ruth repaired this standardized access badge. Used at compatible service entrances.'},
 'storage-module':{keyItem:true,name:'Relay storage module',description:'Recovered relay records. Harlan traced the encrypted code to Cenexis.'}
};
export function inventoryEntries(s){
 const counts=new Map();if(s.snacks>0)counts.set('sandwich',s.snacks);
 for(const id of s.inventory||[])counts.set(id,(counts.get(id)||0)+1);
 if(s.gearInventoryVersion!==1){if(s.upgrade>=1&&!counts.has('insulated-grip'))counts.set('insulated-grip',1);if(s.upgrade>=2&&!counts.has('resonant-drive'))counts.set('resonant-drive',1);}
 if(s.flags?.badgeFixed)counts.set('service-badge',1);if(s.flags?.relayTaken)counts.set('storage-module',1);
 return [...counts].map(([id,count])=>{const item=ITEMS[id]||GEAR[id]||{name:id.replace(/-/g,' '),description:'An item carried on your journey.'};return {id,count,...item,description:item.description|| (item.kind==='body'?'Protective workwear that reduces incoming damage.':'A precision modification for the vibrosword.'),usable:!!(item.heal||item.kind==='body'||item.kind==='weapon'),equipped:item.kind==='body'?s.armor===id:item.kind==='weapon'?s.upgrade===item.tier:false};});
}
export function itemInformation(item){return item.description+(item.heal?' Restores '+item.heal+' HP.':'')+(item.attack?' Attack +'+item.attack+'.':'')+(item.defense?' Defense +'+item.defense+'.':'');}
export function useInventoryItem(s,id,targetId='hero'){
 migrateGearInventory(s);
 const item=inventoryEntries(s).find(item=>item.id===id);if(!item||!item.usable)return {ok:false,message:'This item cannot be used here.'};
 if(item.heal){const recipient=targetId==='hero'?s:s.party?.find(member=>member.id===targetId);if(!recipient)return {ok:false,message:'That party member is not here.'};if(recipient.hp>=recipient.maxHp&&!item.speedBoost)return {ok:false,message:'HP is already full.'};const recovered=Math.min(item.heal,recipient.maxHp-recipient.hp);recipient.hp+=recovered;if(item.speedBoost)recipient.speedBoostTurns=item.boostTurns;if(id==='sandwich')s.snacks--;else s.inventory.splice(s.inventory.indexOf(id),1);return {ok:true,message:(s.party?.length?recipient.name+' recovered ':'Recovered ')+Math.ceil(recovered)+' HP.'+(item.speedBoost?' Speed +30% for the next three combat rounds.':'')};}
 if(item.kind==='body'){if(s.armor!==id)equipArmor(s,id);}else s.upgrade=item.tier;
 return {ok:true,message:item.name+' equipped.'};
}
