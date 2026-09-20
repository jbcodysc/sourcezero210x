// Scene-owned exit: save flags checkpoint the breach and the completed flight.
export const SCRAP_BREACH={x:850,y:207,width:340};
export function preloadScrapEscape(scene){
 if(!scene.textures.exists('scrap-escape'))scene.load.spritesheet('scrap-escape',new URL('./assets/scrap-escape-sheet.png',import.meta.url).href,{frameWidth:512,frameHeight:512});
 if(!scene.textures.exists('scrap-wall-breach'))scene.load.image('scrap-wall-breach',new URL('./assets/scrap-wall-breach.png',import.meta.url).href);
}
export function showScrapBreach(scene){
 if(scene.scrapBreach?.active)return scene.scrapBreach;
 const p=SCRAP_BREACH,image=scene.add.image(p.x,p.y,'scrap-wall-breach').setDepth(-26);
 image.setScale(p.width/image.width);scene.scrapBreach=image;return image;
}
export class ScrapEscape {
 constructor(scene,{sound,onBreach=()=>{},onComplete=()=>{}}){
  this.scene=scene;this.sound=sound;this.onBreach=onBreach;this.onComplete=onComplete;
  this.timers=[];this.tweens=[];this.disposed=false;this.shutdown=()=>this.dispose();scene.events.once('shutdown',this.shutdown);
 }
 later(delay,fn){this.timers.push(this.scene.time.delayedCall(delay,()=>{if(!this.disposed)fn();}));}
 tween(config){this.tweens.push(this.scene.tweens.add(config));}
 start(step=0){
  if(this.started||this.disposed)return;this.started=true;const s=this.scene;
  this.sound.setMode('argus-entrance');
  s.textures.get('scrap-escape').setFilter(0);s.textures.get('scrap-wall-breach').setFilter(0);
  this.body=s.add.sprite(850,350,'scrap-escape',0).setScale(.58).setDepth(7000);
  this.effect=s.add.graphics().setDepth(7001);
  if(step>=1){showScrapBreach(s);this.fly();return;}
  this.later(350,()=>this.body.setFrame(1));
  this.later(650,()=>this.body.setFrame(2));
  this.later(1050,()=>this.body.setFrame(3));
  this.later(1350,()=>this.fire());
 }
 fire(){
  const s=this.scene;this.body.setFrame(4);this.sound.effect('missile-launch');
  this.effect.lineStyle(12,0x278cfa,.7).lineBetween(920,232,850,207);
  this.effect.lineStyle(4,0xddffff,1).lineBetween(920,232,850,207);
  this.later(110,()=>{
   this.effect.clear();showScrapBreach(s);this.onBreach();this.sound.effect('wall-breach');
   s.cameras.main.shake(230,.004);s.cameras.main.flash(100,210,239,255,false);
   for(let i=0;i<22;i++){
    const chip=s.add.rectangle(850+(i%6-3)*22,207+Math.floor(i/6)*10,5+i%4*2,4+i%3*2,i%2?0x94aab1:0x374a59).setDepth(7002);
    this.tween({targets:chip,x:chip.x+(i%2?-1:1)*(24+i*3),y:chip.y+85+i%7*14,alpha:0,angle:i*21,duration:600+i%4*80,onComplete:()=>chip.destroy()});
    (this.debris||=[]).push(chip);
   }
  });
  this.later(350,()=>this.body.setFrame(3));
  this.later(850,()=>this.fly());
 }
 fly(){
  this.body.setFrame(5);this.sound.effect('argus-boosters');
  this.tween({targets:this.body,x:850,y:235,scaleX:.30,scaleY:.30,duration:1050,ease:'Sine.easeInOut',onComplete:()=>{
   if(this.disposed)return;
   this.tween({targets:this.body,x:855,y:196,scaleX:.012,scaleY:.012,alpha:0,duration:1400,ease:'Sine.easeOut',onComplete:()=>{
    if(this.disposed)return;this.dispose();this.onComplete();
   }});
  }});
 }
 dispose(){
  if(this.disposed)return;this.disposed=true;
  for(const timer of this.timers)timer.remove(false);
  for(const tween of this.tweens)tween.stop();
  for(const item of this.debris||[])item.destroy();this.body?.destroy();this.effect?.destroy();
  for(const key of ['argus-boosters','missile-launch','wall-breach'])this.sound.stopEffects(key);
  this.scene.events.off('shutdown',this.shutdown);
 }
}
