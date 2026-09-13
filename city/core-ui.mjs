import {escapeUI as esc,statusPanel,partyMembers,inventoryEntries,itemInformation,useInventoryItem} from './core-status.mjs';

// One owner for transient world overlays. Persistent values remain in the save model.
export class CoreGameUI{
 constructor(scene,{progress,save,reset,overlay,prompt}){Object.assign(this,{scene,progress,save,reset,overlay,prompt});this.mode=null;this.tab='status';this.item=null;this.detail=null;this.held=new Set();}
 freeze(){const s=this.scene;this.prior={clock:s.time?.paused,tweens:s.tweens?.paused,physics:s.physics?.world?.isPaused};s.locked=true;if(s.time)s.time.paused=true;s.tweens?.pauseAll();s.physics?.world?.pause();this.reset();s.input?.keyboard?.resetKeys();if(this.prompt)this.prompt.hidden=true;}
 open(mode='menu'){const s=this.scene;if(this.mode||s.dialog||s.cutscene||s.arrival||s.transitioning||s.locked)return false;this.mode=mode;s.menu=mode==='menu'?'core':null;this.tab='status';this.item=null;this.detail=null;this.freeze();this.render();return true;}
 close(){if(!this.mode)return;const s=this.scene;this.mode=null;this.result=null;s.menu=null;s.locked=!!(s.dialog||s.cutscene||s.arrival||s.transitioning);if(s.time)s.time.paused=this.prior.clock;if(!this.prior.tweens)s.tweens?.resumeAll();if(!this.prior.physics)s.physics?.world?.resume();this.overlay.innerHTML='';this.overlay.className='';this.reset();s.input?.keyboard?.resetKeys();}
 render(){const s=this.progress();this.overlay.className=this.mode==='pause'?'core-pause-ui':'core-menu-ui';
  if(this.mode==='pause'){this.overlay.innerHTML='<div class="core-pause-shade"></div><section class="core-pause"><small>PAUSED</small><div>'+partyMembers(s).map(member=>statusPanel(member,true)).join('')+'</div></section>';return;}
  const items=inventoryEntries(s),selected=items.find(x=>x.id===this.item);
  const body=this.tab==='status'?'<div class="core-status-grid">'+partyMembers(s).map(member=>statusPanel(member)).join('')+'</div>':'<div class="core-items"><div class="core-item-list" role="list" aria-label="Inventory">'+(items.length?items.map(item=>'<button data-action="core-item:'+esc(item.id)+'" aria-pressed="'+(item.id===this.item)+'">'+esc(item.name)+'<small>'+ (item.equipped?'Equipped · ':'')+'× '+item.count+'</small></button>').join(''):'<p>Your pockets are empty.</p>')+'</div><section class="core-item-details">'+(selected?'<h2>'+esc(selected.name)+'</h2><div class="core-item-actions"><button data-action="core-check">CHECK</button><button data-action="core-use" '+(!selected.usable?'disabled':'')+'>USE</button></div>'+(this.detail?'<p>'+esc(this.detail)+'</p>':''):'<p>Select an item.</p>')+'</section></div>';
  this.overlay.innerHTML='<section class="core-menu" aria-label="Main menu"><nav role="tablist" aria-label="Main menu tabs">'+['status','items'].map(tab=>'<button role="tab" aria-selected="'+(this.tab===tab)+'" data-action="core-tab:'+tab+'">'+tab.toUpperCase()+'</button>').join('')+'<span>'+s.credits+' CREDITS</span></nav><div class="core-content" role="tabpanel">'+body+'</div><footer><button data-action="core-close">Return</button><button data-action="core-title">Save and return to title</button></footer></section>';
  if(this.result)this.overlay.insertAdjacentHTML('beforeend','<section class="core-result" role="alertdialog" aria-modal="true" aria-label="Item result"><p>'+esc(this.result)+'</p><button data-action="core-result">Continue</button></section>');
 }
 action(action){if(!action.startsWith('core-'))return false;if(!this.mode)return true;
  if(this.result){if(action==='core-result'){this.result=null;this.render();this.overlay.querySelector('[data-action="core-use"]')?.focus();}return true;}
  if(action==='core-close'){this.close();return true;}if(action==='core-title'){this.save();this.close();this.scene.handleAction('title');return true;}
  if(action.startsWith('core-tab:')){this.tab=action.slice(9);this.item=null;this.detail=null;this.render();}
  if(action.startsWith('core-item:')){this.item=action.slice(10);this.detail=null;this.render();this.overlay.querySelector('[data-action="core-check"]')?.focus();}
  const item=inventoryEntries(this.progress()).find(x=>x.id===this.item);
  if(action==='core-check'&&item){this.detail=itemInformation(item);this.render();this.overlay.querySelector('[data-action="core-check"]')?.focus();}
  if(action==='core-use'&&item){this.result=useInventoryItem(this.progress(),item.id).message;this.save();this.render();this.overlay.querySelector('[data-action="core-result"]')?.focus();}
  return true;
 }
 key(e){const k=e.key.toLowerCase();if(e.repeat||this.held.has(k))return;this.held.add(k);
  const confirm=['enter','z',' '].includes(k),s=this.scene;
  if(s.dialog){if(confirm){e.preventDefault();if(s.dialog.choiceVisible)(this.overlay.ownerDocument.activeElement?.closest('button')||this.overlay.querySelector('button'))?.click();else s.interact();}else if(k==='escape'){e.preventDefault();s.interact();}else s.chooseMenuKey?.(e);return;}
  if(this.mode){e.preventDefault();if(this.mode==='pause'){if(k===' '||k==='escape')this.close();return;}
   if(this.result){if(confirm||k==='escape')this.action('core-result');return;}
   if(k==='escape'){if(this.item){this.item=null;this.detail=null;this.render();}else this.close();return;}
   if(['arrowleft','arrowright','a','d'].includes(k)){this.action('core-tab:'+(this.tab==='status'?'items':'status'));this.overlay.querySelector('[aria-selected="true"]')?.focus();return;}
   if(confirm)(this.overlay.ownerDocument.activeElement?.closest('#overlay button')||this.overlay.querySelector('button'))?.click();else s.chooseMenuKey?.(e);return;
  }
  if(s.menu){if(confirm||k==='escape')e.preventDefault();if(k==='escape')s.closeMenu();else if(confirm)(this.overlay.ownerDocument.activeElement?.closest('#overlay button')||this.overlay.querySelector('button'))?.click();else s.chooseMenuKey?.(e);return;}
  if(s.cutscene){if(confirm){e.preventDefault();s.advanceNarration();}return;}
  if(s.arrival||s.transitioning||s.locked)return;
  if(k===' '){e.preventDefault();this.open('pause');}else if(k==='escape'){e.preventDefault();s.openJournal();}else if(confirm){e.preventDefault();s.interact();}
 }
 keyup(e){this.held.delete(e.key.toLowerCase());}
 destroy(){if(this.mode)this.close();this.held.clear();}
}
