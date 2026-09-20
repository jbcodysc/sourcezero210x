export const TIDAL_WAVE = Object.freeze({key:'tidalWaveFx',animation:'tidalWaveCrash',width:299,height:198,frames:20,fps:18,foreground:9,impact:16});

export function preloadScreenAttacks(scene){
 if(!scene.textures.exists(TIDAL_WAVE.key))scene.load.spritesheet(TIDAL_WAVE.key,'assets/effects/tidal_wave_fx_sheet.png',{frameWidth:TIDAL_WAVE.width,frameHeight:TIDAL_WAVE.height});
}

export function registerScreenAttacks(scene){
 scene.textures.get(TIDAL_WAVE.key).setFilter(0); // Phaser NEAREST
 if(!scene.anims.exists(TIDAL_WAVE.animation))scene.anims.create({key:TIDAL_WAVE.animation,frames:scene.anims.generateFrameNumbers(TIDAL_WAVE.key,{start:0,end:19}),frameRate:TIDAL_WAVE.fps,repeat:0});
}

/** Live screen-space effect, independent of the attacker and combat rules.
 * Phaser renders the distant water behind enemies. The HUD is HTML, so the
 * same animation frame transfers to a transparent stage canvas at frame 9.
 * Both renderers use identical cover geometry: no position jump or screenshot.
 */
export class TidalWaveEffect {
 constructor(scene,{host,sound,onImpact,onComplete}){
  this.scene=scene;this.host=host;this.sound=sound;this.onImpact=onImpact;this.onComplete=onComplete;this.done=false;this.impacted=false;this.frame=0;this.flash=0;
  const {width:w,height:h}=scene.cameras.main;this.width=w;this.height=h;
  this.scale=Math.max(w/TIDAL_WAVE.width,h/TIDAL_WAVE.height);
  this.x=(w-TIDAL_WAVE.width*this.scale)/2;this.y=(h-TIDAL_WAVE.height*this.scale)/2;
  this.wave=scene.add.sprite(this.x,this.y,TIDAL_WAVE.key,0).setOrigin(0).setScrollFactor(0).setScale(this.scale).setDepth(50);
  this.canvas=host.ownerDocument.createElement('canvas');this.canvas.className='battle-screen-effect';this.canvas.width=w;this.canvas.height=h;this.canvas.setAttribute('aria-hidden','true');
  this.context=this.canvas.getContext('2d');this.context.imageSmoothingEnabled=false;host.appendChild(this.canvas);host.classList.add('battle-effect-active');
  this.onShutdown=()=>this.destroy();scene.events.once('shutdown',this.onShutdown);
  this.wave.on('animationupdate',(animation,frame)=>this.showFrame(Number(frame.textureFrame)));
  this.wave.once('animationcomplete',()=>this.complete());
  sound.effect('tidal-wave');this.wave.play(TIDAL_WAVE.animation);
 }
 showFrame(index){
  if(this.done)return;this.frame=index;
  if(index>=TIDAL_WAVE.foreground){this.wave.setDepth(1000).setVisible(false);this.drawForeground();}
  if(index>=TIDAL_WAVE.impact&&!this.impacted){
   this.impacted=true;this.onImpact();this.scene.cameras.main.shake(120,.004);
   this.flash=.6;this.drawForeground();
   this.flashTween=this.scene.tweens.add({targets:this,flash:0,duration:120,ease:'Quad.easeOut',onUpdate:()=>this.drawForeground()});
  }
 }
 drawForeground(){
  if(this.done)return;const c=this.context;c.clearRect(0,0,this.width,this.height);
  if(this.frame>=TIDAL_WAVE.foreground){const frame=this.scene.textures.getFrame(TIDAL_WAVE.key,this.frame);c.drawImage(frame.source.image,frame.cutX,frame.cutY,frame.cutWidth,frame.cutHeight,this.x,this.y,TIDAL_WAVE.width*this.scale,TIDAL_WAVE.height*this.scale);}
  if(this.flash>0){c.fillStyle=`rgba(229,247,255,${this.flash})`;c.fillRect(0,0,this.width,this.height);}
 }
 complete(){
  if(this.done)return;
  // A skipped render frame must never skip the impact callback.
  if(!this.impacted){this.impacted=true;this.onImpact();}
  this.destroy();this.onComplete();
 }
 destroy(){
  if(this.done)return;this.done=true;this.flashTween?.remove();this.wave.destroy();this.canvas.remove();this.host.classList.remove('battle-effect-active');this.sound.stopEffects('tidal-wave');this.scene.events.off('shutdown',this.onShutdown);
 }
}
