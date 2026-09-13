import {GEAR,playerStats,SANDWICH_HEAL,equipArmor} from './progress.mjs';
export const escapeUI=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const hasMagic=s=>!!(s.magicUnlocked||s.capabilities?.magic||s.flags?.magicUnlocked||s.flags?.MAGIC_UNLOCKED);
export function characterStatus(s){
 const stats=playerStats(s),out={name:s.name,level:s.level,hp:Math.ceil(s.hp),maxHp:s.maxHp,stats:[['Attack',s.attack??stats.attack],['Defense',s.defense??stats.defense]]};
 if(hasMagic(s)){out.mp=s.mp??0;out.maxMp=s.maxMp??0;}
 return out;
}
export function partyMembers(s){return [s,...(s.party||[]).filter(member=>member&&member.id!=='hero')];}
export function partyStatus(s){return partyMembers(s).map(characterStatus);}
const bar=(label,value,max)=>'<div class="core-resource"><span>'+label+'</span><strong>'+value+' / '+max+'</strong><div role="meter" aria-label="'+label+'" aria-valuemin="0" aria-valuemax="'+max+'" aria-valuenow="'+value+'"><i style="width:'+Math.max(0,Math.min(100,max?value/max*100:0))+'%"></i></div></div>';
export function statusPanel(s,compact=false){const c=characterStatus(s);return '<section class="core-character"><header><h2>'+escapeUI(c.name)+'</h2><span>LEVEL '+c.level+'</span></header>'+bar('HP',c.hp,c.maxHp)+(hasMagic(s)?bar('MP',c.mp,c.maxMp):'')+(!compact?'<dl>'+c.stats.map(([name,value])=>'<div><dt>'+name+'</dt><dd>'+value+'</dd></div>').join('')+'</dl>':'')+'</section>';}
const ITEMS={
 sandwich:{name:'Pocket sandwich',description:'A simple sandwich, kept safely away from solvents.',heal:SANDWICH_HEAL},
 'caramel-macchiato':{name:'Caramel macchiato',description:'Handmade coffee. A little comfort in a paper cup.',heal:15},
 'insulated-grip':{name:'Insulated grip',description:'A safer grip for the homemade vibrosword.',kind:'weapon',tier:1,attack:6},
 'fairmont-service-keycard':{keyItem:true,name:'Cenexis service keycard',description:'Authorizes the employee entrance to the Drone Facility. Used automatically at the reader.'},
 'service-badge':{keyItem:true,name:'Repaired service badge',description:'Ruth repaired this standardized access badge. Used at compatible service entrances.'},
 'storage-module':{keyItem:true,name:'Relay storage module',description:'Recovered relay records. Harlan traced the encrypted code to Cenexis.'}
};
export function inventoryEntries(s){
 const counts=new Map();if(s.snacks>0)counts.set('sandwich',s.snacks);
 for(const id of s.inventory||[])counts.set(id,(counts.get(id)||0)+1);
 if(s.upgrade>=1&&!counts.has('insulated-grip'))counts.set('insulated-grip',1);
 if(s.upgrade>=2&&!counts.has('resonant-drive'))counts.set('resonant-drive',1);
 if(s.flags?.badgeFixed)counts.set('service-badge',1);if(s.flags?.relayTaken)counts.set('storage-module',1);
 return [...counts].map(([id,count])=>{const item=ITEMS[id]||GEAR[id]||{name:id.replace(/-/g,' '),description:'An item carried on your journey.'};return {id,count,...item,description:item.description|| (item.kind==='body'?'Protective workwear that reduces incoming damage.':'A precision modification for the vibrosword.'),usable:!!(item.heal||item.kind==='body'||item.kind==='weapon'),equipped:item.kind==='body'?s.armor===id:item.kind==='weapon'?s.upgrade===item.tier:false};});
}
export function itemInformation(item){return item.description+(item.heal?' Restores '+item.heal+' HP.':'')+(item.attack?' Attack +'+item.attack+'.':'')+(item.defense?' Defense +'+item.defense+'.':'');}
export function useInventoryItem(s,id){
 const item=inventoryEntries(s).find(item=>item.id===id);if(!item||!item.usable)return {ok:false,message:'This item cannot be used here.'};
 if(item.heal){if(s.hp>=s.maxHp)return {ok:false,message:'HP is already full.'};const recovered=Math.min(item.heal,s.maxHp-s.hp);s.hp+=recovered;if(id==='sandwich')s.snacks--;else s.inventory.splice(s.inventory.indexOf(id),1);return {ok:true,message:'Recovered '+Math.ceil(recovered)+' HP.'};}
 if(item.kind==='body'){if(s.armor!==id)equipArmor(s,id);}else s.upgrade=item.tier;
 return {ok:true,message:item.name+' equipped.'};
}
