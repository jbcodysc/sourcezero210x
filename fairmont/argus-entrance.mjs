// A short, scene-owned event. Phaser owns the clock/tween lifecycle; the story
// reducer owns checkpoints. The chassis is deliberately never an interactable.
export const ARGUS_TIMING = Object.freeze({alarm:2250,flight:1550,settle:550,pulse:300});

export class ArgusEntrance {
 constructor(scene,{sound,target,onStep=()=>{},onComplete=()=>{},onDispose=()=>{}}){
  this.scene=scene;this.sound=sound;this.target=target;this.onStep=onStep;
  this.onComplete=onComplete;this.onDispose=onDispose;
  this.timers=[];this.tweens=[];this.effects=[];this.disposed=false;this.completed=false;
  this.shutdown=()=>this.dispose();scene.events.once('shutdown',this.shutdown);
 }
 later(delay,callback){const timer=this.scene.time.delayedCall(delay,()=>{if(!this.disposed)callback();});this.timers.push(timer);return timer;}
 tween(config){const tween=this.scene.tweens.add(config);this.tweens.push(tween);return tween;}
 makeChassis(x,y){
  const s=this.scene;
  this.shadow=s.add.ellipse(this.target.x,this.target.y+1,162,29,0x071320,.3).setDepth(this.target.y-1);
  const sprite=s.add.image(x,y,'fairmont-argus','portrait').setOrigin(.5,1).setDepth(this.target.y+1);
  sprite.setScale(245/sprite.width);
  this.actor={x:this.target.x,y:this.target.y,name:'[Classified]',row:3,dir:'down',sprite};
 }
 start(step=0){
  if(this.started||this.disposed)return;this.started=true;
  this.sound.setMode('argus-entrance');
  if(step>=2){this.makeChassis(this.target.x,this.target.y);this.later(180,()=>this.finish());return;}
  const s=this.scene,camera=s.cameras.main;
  this.overlay=s.add.rectangle(0,0,camera.width,camera.height,0xee264e,.16).setOrigin(0).setScrollFactor(0).setDepth(9000);
  this.lamps=s.add.graphics().setDepth(8000);
  this.effects.push(this.overlay,this.lamps);
  let blue=true;
  const pulse=()=>{
   blue=!blue;const color=blue?0x2786ff:0xef2445;
   this.overlay.setFillStyle(color,.17);this.lamps.clear();
   for(const x of [320,640,960,1280]){
    this.lamps.fillStyle(0x11202e,1).fillRect(x-22,310,44,23);
    this.lamps.fillStyle(color,1).fillRect(x-16,314,32,13);
    this.lamps.fillStyle(color,.22).fillRect(x-38,333,76,40);
   }
  };
  pulse();this.timers.push(s.time.addEvent({delay:ARGUS_TIMING.pulse,loop:true,callback:pulse}));
  this.sound.effect('security-alarm');
  // The upper service aperture is scenery, not a new door or changed map route.
  this.aperture=s.add.graphics().setDepth(350);
  this.aperture.fillStyle(0x172a3c,1).fillRect(this.target.x-156,275,312,70);
  this.aperture.lineStyle(5,0x6a92aa,1).strokeRect(this.target.x-156,275,312,70);
  for(let x=this.target.x-140;x<this.target.x+150;x+=28)this.aperture.fillStyle(0xa1c9d4,.7).fillRect(x,281,12,4);
  this.effects.push(this.aperture);
  this.later(step>=1?180:ARGUS_TIMING.alarm,()=>this.fly());
 }
 fly(){
  this.onStep(1);this.makeChassis(this.target.x+130,-35);
  this.shadow.setAlpha(.08).setScale(.45);
  this.exhaust=this.scene.add.graphics().setDepth(this.target.y);
  this.effects.push(this.exhaust);this.sound.effect('argus-boosters');
  this.tween({targets:this.actor.sprite,x:this.target.x,y:this.target.y,duration:ARGUS_TIMING.flight,ease:'Cubic.easeOut',
   onUpdate:()=>this.drawBoosters(),onComplete:()=>{if(!this.disposed)this.stabilize();}});
  this.tween({targets:this.shadow,alpha:.3,scaleX:1,scaleY:1,duration:ARGUS_TIMING.flight});
  this.drawBoosters();
 }
 drawBoosters(){
  if(this.disposed||!this.exhaust)return;
  const g=this.exhaust,sprite=this.actor.sprite,phase=Math.floor(this.scene.time.now/60);
  g.clear();
  for(const side of [-1,1]){
   const x=Math.round(sprite.x+side*53),y=Math.round(sprite.y-9),length=58+(phase%3)*9;
   g.fillStyle(0x123edd,.85).fillRect(x-15,y,30,length-14).fillRect(x-10,y+length-14,20,22);
   g.fillStyle(0x159cff,1).fillRect(x-10,y,20,length-5).fillRect(x-5,y+length-5,10,13);
   g.fillStyle(0x8bfaff,1).fillRect(x-5,y,10,length-20);
   g.fillStyle(0xf0ffff,1).fillRect(x-3,y,6,20);
   for(let i=0;i<4;i++){
    const age=(phase*7+i*19)%66,offset=((i*11+phase*3)%27)-13;
    g.fillStyle(i%2?0xcafaff:0x46bfff,1-age/85).fillRect(x+offset,y+length+age,4,6);
   }
  }
 }
 stabilize(){
  this.onStep(2);this.sound.stopEffects('argus-boosters');this.sound.stopEffects('security-alarm');
  this.sound.effect('argus-stabilize');this.exhaust.clear();
  this.scene.cameras.main.shake(160,.002);
  for(const side of [-1,1])for(let i=0;i<7;i++)this.exhaust.fillStyle(i%2?0xb5f7ff:0x299dfa,.8).fillRect(this.target.x+side*53+(i-3)*10,this.target.y+(i%2)*8,7,4);
  this.later(180,()=>this.exhaust.clear());
  this.later(ARGUS_TIMING.settle,()=>this.finish());
 }
 finish(){
  if(this.disposed||this.completed)return;this.completed=true;
  this.clearEffects();this.onComplete(this.actor);
 }
 clearEffects(){
  for(const timer of this.timers)timer.remove(false);this.timers=[];
  for(const effect of this.effects)effect.destroy();this.effects=[];
  for(const key of ['security-alarm','argus-boosters','argus-stabilize'])this.sound.stopEffects(key);
 }
 dispose(){
  if(this.disposed)return;this.disposed=true;this.clearEffects();
  for(const tween of this.tweens)tween.stop();this.tweens=[];
  this.actor?.sprite.destroy();this.shadow?.destroy();
  this.scene.events.off('shutdown',this.shutdown);this.onDispose();
 }
}
