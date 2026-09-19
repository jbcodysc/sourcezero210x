// Keep a visible command cursor even when focus moves to the canvas or a target.
export class BattleSelection {
 constructor(root){
  this.root=root;this.actions={main:'attack',goods:null};this.mode='main';
  this.onFocus=e=>this.select(e.target.closest?.('.battle-action:not(:disabled)'));
  this.onPointer=e=>{const button=e.target.closest?.('.battle-action:not(:disabled)');if(button)button.focus();};
  root.addEventListener('focusin',this.onFocus);root.addEventListener('pointerover',this.onPointer);
 }
 select(button){
  if(!button)return;this.actions[this.mode]=button.dataset.action;
  for(const item of this.root.querySelectorAll('.battle-action'))item.classList.toggle('command-selected',item===button);
 }
 restore(goodsOpen,enabled){
  this.mode=goodsOpen?'goods':'main';if(!enabled)return;
  const buttons=[...this.root.querySelectorAll('.battle-action:not(:disabled)')];
  const button=buttons.find(b=>b.dataset.action===this.actions[this.mode])||buttons[0];
  this.select(button);button?.focus({preventScroll:true});
 }
 destroy(){this.root.removeEventListener('focusin',this.onFocus);this.root.removeEventListener('pointerover',this.onPointer);}
}
