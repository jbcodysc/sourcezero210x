export const TIDAL_WAVE = Object.freeze({key:'tidalWaveFx',animation:'tidalWaveCrash',width:299,height:198,frames:20,fps:18,foreground:9,impact:16});

export const MISSILE_VOLLEY=Object.freeze({key:'argusMissileVolleyFx',animation:'argusMissileVolley',width:1196,height:790,frames:36,fps:18,foreground:0,impacts:[23,27,31],flash:'255,243,226'});

export function preloadScreenAttacks(scene,missiles=false){
 if(missiles&&!scene.textures.exists(MISSILE_VOLLEY.key))scene.load.spritesheet(MISSILE_VOLLEY.key,'assets/effects/argus_missile_volley_fx_sheet.png',{frameWidth:1196,frameHeight:790});
 if(!scene.textures.exists(TIDAL_WAVE.key))scene.load.spritesheet(TIDAL_WAVE.key,'assets/effects/tidal_wave_fx_sheet.png',{frameWidth:TIDAL_WAVE.width,frameHeight:TIDAL_WAVE.height});
}

export function registerScreenAttacks(scene){
 if(scene.textures.exists?.(MISSILE_VOLLEY.key)){scene.textures.get(MISSILE_VOLLEY.key).setFilter(0);if(!scene.anims.exists(MISSILE_VOLLEY.animation))scene.anims.create({key:MISSILE_VOLLEY.animation,frames:scene.anims.generateFrameNumbers(MISSILE_VOLLEY.key,{start:0,end:35}),frameRate:18,repeat:0});}
 scene.textures.get(TIDAL_WAVE.key).setFilter(0); // Phaser NEAREST
 if(!scene.anims.exists(TIDAL_WAVE.animation))scene.anims.create({key:TIDAL_WAVE.animation,frames:scene.anims.generateFrameNumbers(TIDAL_WAVE.key,{start:0,end:19}),frameRate:TIDAL_WAVE.fps,repeat:0});
}

/** Live screen-space effect, independent of the attacker and combat rules.
 * Phaser renders the distant water behind enemies. The HUD is HTML, so the
 * same animation frame transfers to a transparent stage canvas at frame 9.
 * Both renderers use identical cover geometry: no position jump or screenshot.
 */
export class TidalWaveEffect {
 constructor(scene,{host,sound,onImpact,onComplete},config=TIDAL_WAVE){
  this.config=config;this.hitFlags=[];this.soundFlags=new Set();
  this.scene=scene;this.host=host;this.sound=sound;this.onImpact=onImpact;this.onComplete=onComplete;this.done=false;this.impacted=false;this.frame=0;this.flash=0;
  const {width:w,height:h}=scene.cameras.main;this.width=w;this.height=h;
  this.scale=Math.max(w/config.width,h/config.height);
  this.x=(w-config.width*this.scale)/2;this.y=(h-config.height*this.scale)/2;
  this.wave=scene.add.sprite(this.x,this.y,config.key,0).setOrigin(0).setScrollFactor(0).setScale(this.scale).setDepth(50);
  this.canvas=host.ownerDocument.createElement('canvas');this.canvas.className='battle-screen-effect';this.canvas.width=w;this.canvas.height=h;this.canvas.setAttribute('aria-hidden','true');
  this.context=this.canvas.getContext('2d');this.context.imageSmoothingEnabled=false;host.appendChild(this.canvas);host.classList.add('battle-effect-active');
  this.onShutdown=()=>this.destroy();scene.events.once('shutdown',this.onShutdown);
  this.wave.on('animationupdate',(animation,frame)=>this.showFrame(Number(frame.textureFrame)));
  this.wave.once('animationcomplete',()=>this.complete());
  if(config===TIDAL_WAVE)sound.effect('tidal-wave');this.wave.play(config.animation);
  if(config.foreground===0)this.showFrame(0);
 }
 showFrame(index){
  if(this.done)return;this.frame=index;
  if(index>=this.config.foreground){this.wave.setDepth(1000).setVisible(false);this.drawForeground();}
  if(this.config===MISSILE_VOLLEY)for(const cue of [0,5,10,15])if(index>=cue&&!this.soundFlags.has(cue)){this.soundFlags.add(cue);this.sound.effect('missile-launch');}
  (this.config.impacts||[this.config.impact]).forEach((frame,hit)=>{if(index>=frame&&!this.hitFlags[hit])this.impact(hit);});
 }
 impact(hit){
  this.hitFlags[hit]=true;this.impacted=true;this.onImpact(hit);
  const missile=this.config===MISSILE_VOLLEY;if(missile)this.sound.effect('missile-explosion');
  this.scene.cameras.main.shake(missile&&hit===1?150:120,missile?(hit===1?.009:.006):.004);
  this.flashTween?.remove();this.flash=missile?.45:.6;this.drawForeground();
  this.flashTween=this.scene.tweens.add({targets:this,flash:0,duration:120,ease:'Quad.easeOut',onUpdate:()=>this.drawForeground()});
 }
 drawForeground(){
  if(this.done)return;const c=this.context;c.clearRect(0,0,this.width,this.height);
  if(this.frame>=this.config.foreground){const frame=this.scene.textures.getFrame(this.config.key,this.frame);c.drawImage(frame.source.image,frame.cutX,frame.cutY,frame.cutWidth,frame.cutHeight,this.x,this.y,this.config.width*this.scale,this.config.height*this.scale);}
  if(this.flash>0){c.fillStyle=`rgba(${this.config.flash||'229,247,255'},${this.flash})`;c.fillRect(0,0,this.width,this.height);}
 }
 complete(){
  if(this.done)return;
  // A skipped render frame must never skip the impact callback.
  (this.config.impacts||[this.config.impact]).forEach((frame,hit)=>{if(!this.hitFlags[hit])this.impact(hit);});
  this.completedNaturally=true;this.destroy();this.onComplete();
 }
 destroy(){
  if(this.done)return;this.done=true;this.flashTween?.remove();this.wave.destroy();this.canvas.remove();this.host.classList.remove('battle-effect-active');for(const key of this.config===MISSILE_VOLLEY?(this.completedNaturally?['missile-launch']:['missile-launch','missile-explosion']):['tidal-wave'])this.sound.stopEffects(key);this.scene.events.off('shutdown',this.onShutdown);
 }
}

export class MissileVolleyEffect extends TidalWaveEffect {constructor(scene,options){super(scene,options,MISSILE_VOLLEY);}}
