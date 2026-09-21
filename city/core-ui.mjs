import {escapeUI as esc,statusPanel,partyMembers,inventoryEntries,itemInformation,useInventoryItem} from './core-status.mjs';

// One owner for transient world overlays. Persistent values remain in the save model.
export class CoreGameUI{
 constructor(scene,{progress,save,reset,overlay,prompt}){Object.assign(this,{scene,progress,save,reset,overlay,prompt});this.mode=null;this.tab='status';this.level='tabs';this.category='items';this.cursor=0;this.command='check';this.item=null;this.detail=null;this.held=new Set();}
 freeze(){const s=this.scene;this.prior={clock:s.time?.paused,tweens:s.tweens?.paused,physics:s.physics?.world?.isPaused};s.locked=true;if(s.time)s.time.paused=true;s.tweens?.pauseAll();s.physics?.world?.pause();this.reset();s.input?.keyboard?.resetKeys();if(this.prompt)this.prompt.hidden=true;}
 open(mode='menu'){const s=this.scene;if(this.mode||s.dialog||s.cutscene||s.arrival||s.transitioning||s.locked)return false;this.mode=mode;s.menu=mode==='menu'?'core':null;this.tab='status';this.level='tabs';this.category='items';this.cursor=0;this.command='check';this.item=null;this.detail=null;this.freeze();this.render();if(mode==='menu')this.focus('core-tab:status');return true;}
 close(){if(!this.mode)return;const s=this.scene;this.mode=null;this.result=null;s.menu=null;s.locked=!!(s.dialog||s.cutscene||s.arrival||s.transitioning);if(s.time)s.time.paused=this.prior.clock;if(!this.prior.tweens)s.tweens?.resumeAll();if(!this.prior.physics)s.physics?.world?.resume();this.overlay.innerHTML='';this.overlay.className='';this.reset();s.input?.keyboard?.resetKeys();}
 render(){const s=this.progress();this.overlay.className=this.mode==='pause'?'core-pause-ui':'core-menu-ui';
  if(this.mode==='pause'){this.overlay.innerHTML='<div class="core-pause-shade"></div><section class="core-pause"><small>PAUSED</small><div>'+partyMembers(s).map(member=>statusPanel(member,true)).join('')+'</div></section>';return;}
  const all=inventoryEntries(s),items=this.visibleItems(),selected=all.find(x=>x.id===this.item);
  const body=this.tab==='status'?'<div class="core-status-grid">'+partyMembers(s).map(member=>statusPanel(member)).join('')+'</div>':'<div class="core-inventory"><div class="core-categories" aria-label="Item categories">'+['items','key'].map(category=>'<button data-action="core-category:'+category+'" aria-pressed="'+(this.category===category)+'">'+(category==='key'?'KEY ITEMS':'ITEMS')+'</button>').join('')+'</div><div class="core-items"><div class="core-item-list" role="list" aria-label="Inventory">'+(items.length?items.map(item=>'<button data-action="core-item:'+esc(item.id)+'" aria-pressed="'+(item.id===this.item)+'">'+(item.equipped?'<strong class="core-equipped" aria-label="Equipped">E</strong>':'')+esc(item.name)+'<small>× '+item.count+'</small></button>').join(''):'<p>No '+(this.category==='key'?'key items':'items')+' here.</p>')+'</div><section class="core-item-details">'+(selected?'<h2>'+esc(selected.name)+'</h2><div class="core-item-actions"><button data-action="core-check">CHECK</button><button data-action="core-use" '+(!selected.usable?'disabled':'')+'>USE</button></div>'+(this.detail?'<p>'+esc(this.detail)+'</p>':''):'<p>Select an item.</p>')+'</section></div></div>';
  this.overlay.innerHTML='<section class="core-menu" aria-label="Main menu"><nav role="tablist" aria-label="Main menu tabs">'+['status','items'].map(tab=>'<button role="tab" aria-selected="'+(this.tab===tab)+'" data-action="core-tab:'+tab+'">'+tab.toUpperCase()+'</button>').join('')+'<span>'+s.credits+' CREDITS</span></nav><div class="core-content" role="tabpanel">'+body+'</div><footer><button data-action="core-close">Return</button><button data-action="core-title">Save and return to title</button></footer></section>';
  if(this.result)this.overlay.insertAdjacentHTML('beforeend','<section class="core-result" role="alertdialog" aria-modal="true" aria-label="Item result"><p>'+esc(this.result)+'</p><button data-action="core-result">Continue</button></section>');
  if(this.healChoice){for(const button of this.overlay.querySelectorAll('button'))button.disabled=true;this.overlay.insertAdjacentHTML('beforeend','<section class="core-heal-targets" role="dialog" aria-modal="true" aria-label="Choose recipient"><h2>Use on whom?</h2>'+partyMembers(s).map(member=>'<button data-action="core-heal:'+esc(member.id||'hero')+'">'+esc(member.name)+' · '+Math.ceil(member.hp)+' / '+member.maxHp+' HP</button>').join('')+'<button data-action="core-heal:cancel">Cancel</button></section>');}
 }
 action(action){if(!action.startsWith('core-'))return false;if(!this.mode)return true;
  if(this.healChoice){if(action.startsWith('core-heal:')){const target=action.slice(10),item=this.healChoice;this.healChoice=null;if(target!=='cancel'){this.result=useInventoryItem(this.progress(),item,target).message;this.save();}this.render();if(this.result)this.focus('core-result');else this.restoreFocus();}return true;}
  if(this.result){if(action==='core-result'){this.result=null;if(!this.visibleItems().some(i=>i.id===this.item)){this.item=null;this.level='list';}else this.level='actions';this.render();this.restoreFocus();}return true;}
  if(action==='core-close'){this.close();return true;}if(action==='core-title'){this.save();this.close();this.scene.handleAction('title');return true;}
  if(action.startsWith('core-tab:')){this.tab=action.slice(9);this.item=null;this.detail=null;this.level=this.tab==='items'?'categories':'tabs';this.render();this.restoreFocus();}
  if(action.startsWith('core-category:')){this.category=action.slice(14);this.item=null;this.detail=null;this.cursor=0;this.level='list';this.render();this.restoreFocus();}
  if(action.startsWith('core-item:')){this.item=action.slice(10);this.cursor=Math.max(0,this.visibleItems().findIndex(i=>i.id===this.item));this.detail=null;this.command='check';this.level='actions';this.render();this.restoreFocus();}
  const item=inventoryEntries(this.progress()).find(x=>x.id===this.item);
  if(action==='core-check'&&item){this.detail=itemInformation(item);this.command='check';this.level='actions';this.render();this.restoreFocus();}
  if(action==='core-use'&&item){this.command='use';if(item.heal&&this.progress().party?.length){this.healChoice=item.id;this.render();this.focus('core-heal:hero');return true;}this.result=useInventoryItem(this.progress(),item.id).message;this.save();this.render();this.overlay.querySelector('[data-action="core-result"]')?.focus();}
  return true;
 }
 visibleItems(){return inventoryEntries(this.progress()).filter(item=>!!item.keyItem===(this.category==='key'));}
 focus(action){this.overlay.querySelector('[data-action="'+action+'"]')?.focus();}
 restoreFocus(){
  if(this.level==='tabs')this.focus('core-tab:'+this.tab);
  else if(this.level==='categories')this.focus('core-category:'+this.category);
  else if(this.level==='list'){const items=this.visibleItems();this.cursor=Math.max(0,Math.min(this.cursor,items.length-1));this.focus(items.length?'core-item:'+items[this.cursor].id:'core-category:'+this.category);}
  else if(this.level==='actions')this.focus('core-'+this.command);
  else this.focus(this.cursor?'core-title':'core-close');
 }
 menuKey(k,confirm){
  // Mouse/Tab focus and gamepad-style navigation share the same local owner.
  const active=this.overlay.ownerDocument.activeElement?.closest?.('#overlay button')?.dataset?.action;
  if(active?.startsWith('core-tab:')){this.level='tabs';}
  else if(active?.startsWith('core-category:'))this.level='categories';
  else if(active?.startsWith('core-item:')){this.level='list';this.cursor=this.visibleItems().findIndex(i=>'core-item:'+i.id===active);}
  else if(['core-check','core-use'].includes(active)){this.level='actions';this.command=active.slice(5);}
  else if(['core-close','core-title'].includes(active)){this.level='footer';this.cursor=active==='core-title'?1:0;}
  const horizontal=['arrowleft','arrowright','a','d'].includes(k),vertical=['arrowup','arrowdown','w','s'].includes(k),step=['arrowleft','arrowup','a','w'].includes(k)?-1:1;
  if(k==='escape'){
   if(this.level==='actions'){this.item=null;this.detail=null;this.level='list';}
   else if(this.level==='list')this.level='categories';
   else if(this.level!=='tabs')this.level='tabs';
   else {this.close();return;}
   this.render();this.restoreFocus();return;
  }
  if(this.level==='tabs'){
   if(horizontal){this.tab=this.tab==='status'?'items':'status';this.item=null;this.detail=null;this.render();}
   if(confirm||vertical){this.level=this.tab==='items'?'categories':'footer';this.cursor=0;}
  }else if(this.level==='categories'){
   if(horizontal){this.category=this.category==='items'?'key':'items';this.item=null;this.detail=null;this.cursor=0;this.render();}
   if(confirm||vertical&&step>0){this.level=this.visibleItems().length?'list':'footer';this.cursor=0;}
   else if(vertical&&step<0)this.level='tabs';
  }else if(this.level==='list'){
   const items=this.visibleItems();
   if(vertical){this.cursor+=step;if(this.cursor<0){this.cursor=0;this.level='categories';}else if(this.cursor>=items.length){this.cursor=0;this.level='footer';}}
   if(confirm&&items[this.cursor]){this.action('core-item:'+items[this.cursor].id);return;}
  }else if(this.level==='actions'){
   if(horizontal){const item=this.visibleItems().find(i=>i.id===this.item);this.command=this.command==='check'&&item?.usable?'use':'check';}
   if(confirm){this.action('core-'+this.command);return;}
  }else if(this.level==='footer'){
   if(horizontal)this.cursor=this.cursor?0:1;
   if(vertical)this.level=this.tab==='items'?'categories':'tabs';
   if(confirm){this.action(this.cursor?'core-title':'core-close');return;}
  }
  this.restoreFocus();
 }
 key(e){const k=e.key.toLowerCase();if(e.repeat||this.held.has(k))return;this.held.add(k);
  const confirm=['enter','z',' '].includes(k),s=this.scene;
  if(s.dialog){if(confirm){e.preventDefault();if(s.dialog.choiceVisible)(this.overlay.ownerDocument.activeElement?.closest('button')||this.overlay.querySelector('button'))?.click();else s.interact();}else if(k==='escape'){e.preventDefault();s.interact();}else s.chooseMenuKey?.(e);return;}
  if(this.mode){e.preventDefault();if(this.mode==='pause'){if(k===' '||k==='escape')this.close();return;}
   if(this.healChoice){if(k==='escape'){this.action('core-heal:cancel');return;}const buttons=[...this.overlay.querySelectorAll('.core-heal-targets button')];if(confirm){(buttons.find(button=>button===this.overlay.ownerDocument.activeElement)||buttons[0])?.click();}else if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'].includes(k)){const index=buttons.indexOf(this.overlay.ownerDocument.activeElement),step=['arrowup','arrowleft','w','a'].includes(k)?-1:1;buttons[(index+step+buttons.length)%buttons.length]?.focus();}return;}
   if(this.result){if(confirm||k==='escape')this.action('core-result');return;}
   this.menuKey(k,confirm);return;
  }
  if(s.menu&&s.shopUI?.options){s.shopUI.key(e);return;}
  if(s.menu){if(confirm||k==='escape')e.preventDefault();if(k==='escape')s.closeMenu();else if(confirm)(this.overlay.ownerDocument.activeElement?.closest('#overlay button')||this.overlay.querySelector('button'))?.click();else s.chooseMenuKey?.(e);return;}
  if(s.cutscene){if(confirm){e.preventDefault();s.advanceNarration();}return;}
  if(s.arrival||s.transitioning||s.locked)return;
  if(k===' '){e.preventDefault();this.open('pause');}else if(k==='escape'){e.preventDefault();s.openJournal();}else if(confirm){e.preventDefault();s.interact();}
 }
 keyup(e){this.held.delete(e.key.toLowerCase());}
 destroy(){if(this.mode)this.close();this.held.clear();}
}
