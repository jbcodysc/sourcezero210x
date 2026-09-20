import {escapeUI as esc} from './core-status.mjs';
import {saleInventory,resalePrice,sellItem} from './shop.mjs';

// Shares the world menu's input lock and button navigation, with a local modal owner.
export class ShopUI{
 constructor(scene,{progress,save,overlay,reset}){Object.assign(this,{scene,progress,save,overlay,reset});}
 open(options){this.options=options;this.page='choice';this.modal=null;this.message=options.greeting||'What can I do for you?';this.selected=null;this.scene.menu='shop';this.scene.locked=true;this.scene.writer=null;this.render();this.focus('trade-buy');this.reset();this.scene.input.keyboard.resetKeys();}
 clear(){this.options=null;this.modal=null;}
 focus(action){this.overlay.querySelector('[data-action="'+action+'"]')?.focus();}
 items(){return saleInventory(this.progress());}
 render(){
  const s=this.progress(),o=this.options,button=(action,label,detail='')=>'<button data-action="'+action+'">'+label+(detail?'<small>'+detail+'</small>':'')+'</button>';
  const items=this.items();
  const body=this.page==='choice'?'<div class="trade-choices">'+button('trade-buy','Buy')+button('trade-sell','Sell')+'</div>':this.page==='buy'?o.offers.map(([id,name,detail])=>button('trade-purchase:'+id,esc(name),esc(detail))).join(''):'<div class="trade-inventory" role="list" aria-label="Items to sell">'+(items.length?items.map(item=>button('trade-item:'+item.id,(item.equipped?'<strong class="core-equipped" aria-label="Equipped">E</strong>':'')+esc(item.name),'× '+item.count+' · '+resalePrice(item)+' credits each')).join(''):'<p>No items to sell.</p>')+'</div>';
  this.overlay.className='menu-ui';this.overlay.innerHTML='<section class="notebook service trade-menu" aria-label="Shop"><small>'+esc(o.region)+' · '+s.credits+' CREDITS</small><h2>'+esc(o.title)+'</h2><p>'+esc(this.message)+'</p>'+body+button(this.page==='choice'?'trade-close':'trade-back',this.page==='choice'?'Return':'Back')+'</section>';
  if(this.modal){
   for(const b of this.overlay.querySelectorAll('button')){b.disabled=true;b.tabIndex=-1;}
   this.overlay.insertAdjacentHTML('beforeend','<div class="trade-shade"><section class="trade-dialog" role="alertdialog" aria-modal="true" aria-label="'+(this.modal.confirm?'Confirm sale':'Shop message')+'"><p>'+esc(this.modal.message)+'</p><div class="trade-choices">'+(this.modal.confirm?button('trade-yes','Yes')+button('trade-no','No'):button('trade-dismiss','Continue'))+'</div></section></div>');
   this.focus(this.modal.confirm?'trade-no':'trade-dismiss');
  }
 }
 restoreItem(){const items=this.items();this.selected=items.some(i=>i.id===this.selected)?this.selected:items[0]?.id;this.focus(this.selected?'trade-item:'+this.selected:'trade-back');}
 action(action){
  if(!action.startsWith('trade-'))return false;if(!this.options)return true;
  if(this.modal){
   if(action==='trade-no'||action==='trade-dismiss'){this.modal=null;this.render();this.restoreItem();}
   else if(action==='trade-yes'&&this.modal.confirm){const result=sellItem(this.progress(),this.selected);if(result.ok)this.save();this.modal={message:result.message};this.render();}
   return true;
  }
  if(action==='trade-close'){this.scene.closeMenu();return true;}
  if(action==='trade-back'){this.page='choice';this.message=this.options.greeting||'What can I do for you?';this.render();this.focus('trade-buy');return true;}
  if(action==='trade-buy'||action==='trade-sell'){this.page=action.slice(6);this.message=this.page==='sell'?'I pay half the value. What would you like to sell?':this.options.greeting||'Take a look.';this.render();if(this.page==='sell')this.restoreItem();else this.focus('trade-purchase:'+this.options.offers[0][0]);return true;}
  if(action.startsWith('trade-purchase:')&&this.page==='buy'){const id=action.slice(15);if(!this.options.offers.some(o=>o[0]===id))return true;this.message=this.options.purchase(id);this.save();this.render();this.focus(action);return true;}
  if(action.startsWith('trade-item:')&&this.page==='sell'){
   this.selected=action.slice(11);const item=this.items().find(i=>i.id===this.selected);if(!item)return true;
   if(item.equipped)this.modal={message:'Equipped items cannot be sold. Equip something else first.'};
   else if(item.kind)this.modal={confirm:true,message:'Are you sure you want to sell '+item.name+'?'};
   else{const result=sellItem(this.progress(),item.id);if(result.ok)this.save();this.modal={message:result.message};}
   this.render();
  }
  return true;
 }
 key(e){
  const key=e.key.toLowerCase();e.preventDefault();
  if(key==='escape'){this.action(this.modal?(this.modal.confirm?'trade-no':'trade-dismiss'):this.page==='choice'?'trade-close':'trade-back');return;}
  const buttons=[...this.overlay.querySelectorAll('button:not(:disabled)')],active=this.overlay.ownerDocument.activeElement;
  if(['enter','z',' '].includes(key)){(buttons.includes(active)?active:buttons[0])?.click();return;}
  if(['arrowleft','arrowright','arrowup','arrowdown','w','a','s','d'].includes(key)){const step=['arrowleft','arrowup','w','a'].includes(key)?-1:1,index=buttons.indexOf(active);buttons[(index+step+buttons.length)%buttons.length]?.focus();}
 }
}
