export const BATTLE_START_MS=2800;
const clamp=n=>Math.max(0,Math.min(1,n));
export function tileBurnTime(x,y){return 230+x*1.05+y*.65+(Math.sin(x*.14+y*.2)+1)*135;}
// Gameplay effect: the captured overworld becomes charred, falling pieces over the live battle.
export class BattleTransition{
 constructor(scene,source){
  this.scene=scene;this.source=source;this.key='battle-dissolve';if(scene.textures.exists(this.key))scene.textures.remove(this.key);
  this.texture=scene.textures.createCanvas(this.key,768,512);this.image=scene.add.image(0,0,this.key).setOrigin(0).setDisplaySize(1536,1024).setDepth(10000);
  this.tiles=[];for(let y=0;y<512;y+=24)for(let x=0;x<768;x+=24)this.tiles.push({x,y,w:Math.min(24,768-x),h:Math.min(24,512-y),start:tileBurnTime(x,y),seed:Math.sin(x*4.2+y*7.7)});
  this.draw(0);
 }
 draw(ms){
  const c=this.texture.context;c.clearRect(0,0,768,512);
  for(const t of this.tiles){const age=ms-t.start;if(age>1050)continue;const burn=clamp(age/440),fall=clamp((age-200)/850),shrink=1-fall*.78;c.save();c.globalAlpha=1-clamp((age-680)/350);c.translate(t.x+t.w/2+t.seed*fall*55,t.y+t.h/2+fall*fall*180);c.rotate(t.seed*fall*.65);c.scale(shrink,shrink);
   if(this.source)c.drawImage(this.source,t.x*2,t.y*2,t.w*2,t.h*2,-t.w/2,-t.h/2,t.w,t.h);else{c.fillStyle='#203c44';c.fillRect(-t.w/2,-t.h/2,t.w,t.h);}
   if(age>0){c.fillStyle='rgba(24,18,18,'+(burn*.96)+')';c.fillRect(-t.w/2,-t.h/2,t.w,t.h);if(age<620){c.strokeStyle=age<240?'#d7faff':age<410?'#ffc96c':'#d66932';c.lineWidth=age<240?1.7:1;c.strokeRect(-t.w/2+.5,-t.h/2+.5,t.w-1,t.h-1);}}
   c.restore();
  }
  if(ms<2200){const strength=(1-clamp((ms-1300)/900))*.85;for(let arc=0;arc<5;arc++){c.beginPath();const startX=80+arc*155;c.moveTo(startX,0);for(let y=0;y<=512;y+=24)c.lineTo(startX+Math.sin(y*.075+arc*3+Math.floor(ms/110))*(32+arc*6)+Math.sin(ms*.001+y*.02)*110,y);c.strokeStyle='rgba(60,172,240,'+strength*.35+')';c.lineWidth=8;c.stroke();c.strokeStyle='rgba(203,248,255,'+strength+')';c.lineWidth=1.5;c.stroke();}}
  this.texture.refresh();
 }
 destroy(){this.image.destroy();if(this.scene.textures.exists(this.key))this.scene.textures.remove(this.key);}
}
