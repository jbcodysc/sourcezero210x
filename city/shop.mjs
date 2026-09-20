import {inventoryEntries} from './core-status.mjs';
import {migrateGearInventory} from './progress.mjs';

export const resalePrice=item=>Math.floor((item?.price||item?.value||0)/2);
export function saleInventory(s){return inventoryEntries(s).filter(item=>!item.keyItem&&resalePrice(item)>0);}
export function sellItem(s,id){
 migrateGearInventory(s);const item=saleInventory(s).find(i=>i.id===id);
 if(!item)return {ok:false,message:'That item cannot be sold.'};
 if(item.equipped)return {ok:false,message:'Equipped items cannot be sold. Equip something else first.'};
 if(id==='sandwich')s.snacks--;else{const index=s.inventory.indexOf(id);if(index<0)return {ok:false,message:'You no longer have that item.'};s.inventory.splice(index,1);}
 const credits=resalePrice(item);s.credits+=credits;
 return {ok:true,credits,message:'Sold '+item.name+' for '+credits+' credits.'};
}
