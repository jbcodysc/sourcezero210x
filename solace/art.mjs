import {drawFairmontProp,drawFairmontBus} from '../fairmont/art.mjs';
import {buildingGeometry} from './world.mjs';
import {canAccess} from './story.mjs';
import {preloadSolaceEnemies,prepareSolaceEnemies} from './enemy-art.mjs';

// Original illustrated RGBA architecture and amenities. The atlas preserves its
// alpha; source pixels are not repainted into procedural placeholder furniture.
export const BUILDING_FRAMES={terminal:[0,100,510,415],cafe:[510,70,285,445],tower:[795,0,350,515],mega:[1145,0,391,515],hardware:[0,540,390,460],clinic:[390,540,375,460],logistics:[765,540,380,460],neuro:[1145,515,391,509]};
export const PROP_FRAMES={
 'solace-reception':[0,0,384,341],'solace-vending':[384,0,384,341],'solace-kiosk':[768,0,384,341],'solace-kitchen':[1152,0,384,341],
 'solace-gym':[0,341,384,306],'solace-garden':[384,341,384,306],'solace-lounge':[768,341,384,306],'solace-packages':[1152,341,384,306],
 'solace-electrical':[0,647,384,377],'solace-hvac':[384,647,384,377],'solace-stairs':[768,647,384,377],'solace-elevator':[1152,647,384,377],
};
export function preloadSolaceArt(scene){
 for(const [key,file]of [['solace-buildings-raw','solace-buildings.png'],['solace-amenities-raw','solace-amenities.png']])if(!scene.textures.exists(key))scene.load.image(key,new URL('./assets/'+file,import.meta.url).href);
 if(!scene.textures.exists('solace-lou-walk'))scene.load.image('solace-lou-walk',new URL('./assets/lou-walk.png',import.meta.url).href);
 preloadSolaceEnemies(scene);
}
function trimFrame(scene,source,key,rect){
 if(scene.textures.exists(key))return;
 const image=scene.textures.get(source).getSourceImage(),sx=image.width/1536,sy=image.height/1024;
 const [x,y,w,h]=rect.map((n,i)=>Math.round(n*(i%2?sy:sx))),c=document.createElement('canvas');c.width=w;c.height=h;
 const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,x,y,w,h,0,0,w,h);const pixels=ctx.getImageData(0,0,w,h).data;
 let left=w,top=h,right=0,bottom=0;for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++)if(pixels[(yy*w+xx)*4+3]>32){left=Math.min(left,xx);top=Math.min(top,yy);right=Math.max(right,xx);bottom=Math.max(bottom,yy);}
 const out=document.createElement('canvas');out.width=right-left+1;out.height=bottom-top+1;out.getContext('2d').drawImage(c,left,top,out.width,out.height,0,0,out.width,out.height);scene.textures.addCanvas(key,out).setFilter(0);
}
function surface(scene,key,base,grid,variant){
 if(scene.textures.exists(key))return;const c=document.createElement('canvas');c.width=256;c.height=256;const g=c.getContext('2d');g.fillStyle=base;g.fillRect(0,0,256,256);
 // Stone, wood and road surfaces use repeatable fine grain and structural joints.
 // The low contrast keeps the detailed object sprites and character silhouettes clear.
 let seed=761;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<2800;i++){const n=rand();g.fillStyle=n>.5?'rgba(255,255,255,.035)':'rgba(19,37,43,.04)';g.fillRect(Math.floor(rand()*256),Math.floor(rand()*256),1+Math.floor(rand()*2),1);}
 if(grid){g.lineWidth=1;for(let y=0;y<256;y+=grid){g.fillStyle='rgba(29,47,51,.18)';g.fillRect(0,y,256,2);g.fillStyle='rgba(255,255,255,.3)';g.fillRect(0,y+2,256,1);for(let x=(y/grid)%2?grid/2:0;x<256;x+=grid){g.fillStyle='rgba(29,47,51,.15)';g.fillRect(x,y,1,grid);}}}
 if(variant==='wood'){g.strokeStyle='rgba(59,41,23,.13)';for(let y=8;y<256;y+=11){g.beginPath();g.moveTo(0,y);g.bezierCurveTo(65,y+3,165,y-3,256,y+2);g.stroke();}}
 scene.textures.addCanvas(key,c).setFilter(0);
}
export function prepareSolaceArt(scene){
 for(const [name,r]of Object.entries(BUILDING_FRAMES))trimFrame(scene,'solace-buildings-raw','solace-building-'+name,r);
 for(const [name,r]of Object.entries(PROP_FRAMES))trimFrame(scene,'solace-amenities-raw',name,r);
 prepareSolaceEnemies(scene);
 prepareLou(scene);
 surface(scene,'solace-paving','#b9c8c7',64);surface(scene,'solace-road','#586c76',0);surface(scene,'solace-marble','#c2c8bf',128);surface(scene,'solace-carpet','#6f8990',0);surface(scene,'solace-wood','#957d62',64,'wood');surface(scene,'solace-service','#8b999b',64);
}
const DIRECTIONS=['down','left','right','up'];
function prepareLou(scene){
 const t=scene.textures.get('solace-lou-walk'),img=t.getSourceImage(),c=document.createElement('canvas');c.width=img.width;c.height=img.height;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);const d=ctx.getImageData(0,0,c.width,c.height).data;
 for(let row=0;row<4;row++)for(let col=0;col<4;col++){const key=DIRECTIONS[row]+'-'+col;if(t.has(key))continue;const x0=Math.floor(col*c.width/4),y0=Math.floor(row*c.height/4),x1=Math.floor((col+1)*c.width/4),y1=Math.floor((row+1)*c.height/4);let left=x1,top=y1,right=x0,bottom=y0;for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(d[(y*c.width+x)*4+3]>32){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}t.add(key,0,left,top,right-left+1,bottom-top+1);}t.setFilter(0);
 if(!scene.textures.exists('solace-halberd')){
  // A pixel-scale equipped weapon: steel shaft, insulated grip, forked electrode
  // and a broad halberd cutting edge. No unrelated prop is repurposed as a weapon.
  const w=document.createElement('canvas');w.width=42;w.height=170;const p=w.getContext('2d');
  p.fillStyle='#152d37';p.fillRect(18,22,8,145);p.fillStyle='#8aa4a7';p.fillRect(20,25,4,138);p.fillStyle='#e3eeee';p.fillRect(20,29,1,125);
  p.fillStyle='#253744';p.fillRect(16,102,11,36);for(let y=103;y<137;y+=5){p.fillStyle='#59606b';p.fillRect(17,y,8,2);}
  p.fillStyle='#b3bca4';p.fillRect(16,98,12,5);p.fillRect(16,138,12,4);p.fillStyle='#172e3a';p.fillRect(14,18,16,35);
  p.beginPath();p.moveTo(21,0);p.lineTo(26,22);p.lineTo(41,31);p.lineTo(38,48);p.lineTo(29,57);p.lineTo(28,43);p.lineTo(10,34);p.lineTo(5,19);p.lineTo(16,24);p.closePath();p.fill();
  p.fillStyle='#adced0';p.beginPath();p.moveTo(21,5);p.lineTo(24,24);p.lineTo(37,33);p.lineTo(34,46);p.lineTo(30,50);p.lineTo(29,40);p.lineTo(13,32);p.lineTo(10,25);p.lineTo(19,28);p.closePath();p.fill();
  p.fillStyle='#e7ffff';p.fillRect(20,7,2,20);p.fillStyle='#4dd8ed';p.fillRect(17,33,6,14);p.fillStyle='#c8fcff';p.fillRect(18,35,2,9);p.fillStyle='#ddc681';p.fillRect(14,47,16,4);p.fillStyle='#58a8b7';p.fillRect(19,156,6,8);
  scene.textures.addCanvas('solace-halberd',w).setFilter(0);
 }
}
export function createLouActor(scene,x,y,height=110,armed=false){
 const texture=scene.textures.get('solace-lou-walk'),frame=texture.get('down-0'),scale=height/frame.height;
 const a={x,y,dir:'down',elapsed:0,walking:false,scale,solaceLou:true,staticFrame:true,armed,scene};a.sprite=scene.add.sprite(x,y,'solace-lou-walk','down-0').setOrigin(.5,1).setScale(scale).setDepth(y);a.shadow=scene.add.ellipse(x,y-2,40,10,0x20363f,.22).setDepth(y-.2);if(armed)equipLouHalberd(a);return a;
}
export function equipLouHalberd(a){a.armed=true;if(!a.weaponSprite)a.weaponSprite=a.scene.add.image(a.x+24,a.y-4,'solace-halberd').setOrigin(.5,1).setDisplaySize(30,123).setDepth(a.y+.1);return a.weaponSprite;}
export function drawLouActor(a,delta=0){
 if(!a?.solaceLou)return;a.elapsed=(a.elapsed||0)+delta;const direction=DIRECTIONS.includes(a.dir)?a.dir:'down',pose=a.walking?[1,0,3,2][Math.floor(a.elapsed/165)%4]:0;
 a.sprite.setTexture('solace-lou-walk',direction+'-'+pose).setScale(a.scale).setPosition(a.x,a.y).setDepth(a.y);a.shadow.setPosition(a.x,a.y-2).setDepth(a.y-.2);
 if(a.weaponSprite){const left=direction==='left';a.weaponSprite.setPosition(a.x+(left?-26:26),a.y-3).setFlipX(left).setDepth(a.y+(direction==='up'?-.1:.1)).setVisible(a.sprite.visible);}
}
const label=(scene,x,y,text,size=14,color='#edf4eb',depth=100)=>scene.add.text(x,y,text,{fontFamily:'monospace',fontSize:size+'px',fontStyle:'bold',color,align:'center',stroke:'#243a43',strokeThickness:3}).setOrigin(.5).setDepth(depth);
export function drawSolaceProp(scene,p){
 if(p.type==='bus')return drawFairmontBus(scene,p.x,p.y,p.width,false);
 if(PROP_FRAMES[p.type]){const img=scene.add.image(p.x,p.y,p.type).setOrigin(.5,1);return img.setScale(p.width/img.width).setDepth(p.y);}
 const art=drawFairmontProp(scene,p.type,p.x,p.y);art.setScale(p.width/art.width);if(p.type==='woven-rug')art.setDepth(-22);if(p.type==='tree')art.setDepth(-4);return art;
}
function building(scene,b){
 const geo=buildingGeometry(b),container=scene.add.container(geo.x,geo.y).setDepth(geo.y),g=scene.add.graphics();
 // Contact shadow stays beneath the actual base, not under the whole allocation.
 g.fillStyle(0x263f49,.19).fillEllipse(8,5,geo.w*.95,34);
 g.fillStyle(0x49626a,.24).fillRect(-geo.w*.44,-5,geo.w*.89,12);
 const img=scene.add.image(0,0,'solace-building-'+b.type).setOrigin(.5,1).setDisplaySize(geo.w,geo.h);container.add([g,img]);
 if(b.target){const width=Math.min(geo.w*.87,Math.max(142,b.name.length*6.9)),plate=scene.add.rectangle(0,-geo.h*.205,width,25,0x1c4349,.95).setStrokeStyle(1,0xa8cabf);const text=scene.add.text(0,-geo.h*.205,b.name.toUpperCase(),{fontFamily:'monospace',fontSize:'12px',fontStyle:'bold',color:'#e5ecce',align:'center'}).setOrigin(.5);if(text.width>width-8)text.setScale((width-8)/text.width);container.add([plate,text]);}
 container.geometry=geo;container.facade=img;return container;
}
function camera(scene,x,y,dir=1){
 const c=scene.add.container(x,y).setDepth(y-1),g=scene.add.graphics();g.fillStyle(0x4f646c).fillRect(-3,-87,6,87);g.fillStyle(0x768b8f).fillRect(-12,-90,24,9);g.fillStyle(0xcbd9d5).fillRoundedRect(-19,-106,38,17,4);g.fillStyle(0x25434d).fillRect(dir>0?11:-18,-103,7,10);g.fillStyle(0x78c8c6).fillRect(dir>0?14:-18,-100,3,4);c.add(g);return c;
}
function street(scene,m){
 scene.add.tileSprite(0,0,m.width,m.height,'solace-paving').setOrigin(0).setDepth(-30);
 const g=scene.add.graphics().setDepth(-25),roadWidth=138;
 for(const y of m.roads.horizontal){scene.add.tileSprite(0,y,m.width,roadWidth,'solace-road').setOrigin(0,.5).setDepth(-28);g.fillStyle(0x73878b).fillRect(0,y-roadWidth/2-8,m.width,8);g.fillStyle(0xe1e6d8).fillRect(0,y-roadWidth/2-12,m.width,4);g.fillStyle(0x344c57,.32).fillRect(0,y+roadWidth/2,m.width,8);g.fillStyle(0xd8e0d1).fillRect(0,y+roadWidth/2+8,m.width,5);}
 for(const x of m.roads.vertical){scene.add.tileSprite(x,0,roadWidth,m.height,'solace-road').setOrigin(.5,0).setDepth(-28);g.fillStyle(0x73878b).fillRect(x-roadWidth/2-8,0,8,m.height);g.fillStyle(0xe1e6d8).fillRect(x-roadWidth/2-12,0,4,m.height);g.fillStyle(0x344c57,.28).fillRect(x+roadWidth/2,0,8,m.height);g.fillStyle(0xd8e0d1).fillRect(x+roadWidth/2+8,0,5,m.height);}
 g.fillStyle(0xe5e7d2,.8);for(const y of m.roads.horizontal)for(let x=30;x<m.width;x+=100)if(Math.abs(x-1140)>120)g.fillRect(x,y-2,36,4);
 for(const y of m.roads.horizontal)for(let i=-2;i<=2;i++){g.fillRect(1110+i*18,y-110,10,26);g.fillRect(1250,y+i*17,26,9);}
 for(const [x,y,d]of [[1190,565,1],[1080,1140,-1],[700,750,1],[1780,1310,-1],[2150,620,-1]])camera(scene,x,y,d);
 const small=scene.add.container(130,1480).setDepth(20),panel=scene.add.rectangle(0,0,240,56,0x1d4a52,.98).setStrokeStyle(2,0xc6dcd0),text=scene.add.text(0,0,m.id==='solace-transit'?'SOLACE\nLIFE, SIMPLIFIED.':m.id==='solace-north'?'NORTH DISTRICT\nMEDICAL / RESIDENTIAL':m.id==='solace-commercial'?'CENTRAL DISTRICT\nLESS TO MANAGE.':'RESIDENTIAL DISTRICT\nLET SOLACE HANDLE THE REST.',{fontFamily:'monospace',fontSize:'12px',fontStyle:'bold',color:'#e0eee5',align:'center',lineSpacing:5}).setOrigin(.5);small.add([panel,text]);
}
function skyline(scene,m){
 scene.add.rectangle(0,0,m.width,m.height,0xa5c6cf).setOrigin(0).setDepth(-40);const g=scene.add.graphics().setDepth(-35);
 for(let i=0;i<20;i++){const x=i*108-30,h=95+(i*43)%165;g.fillStyle(i%2?0x859fac:0x748f9d,.7).fillRect(x,440-h,72,h);g.fillStyle(0xc4d9d8,.5);for(let xx=x+10;xx<x+62;xx+=16)for(let yy=450-h;yy<425;yy+=20)g.fillRect(xx,yy,6,9);}
}
function bridgeStructure(scene,f){
 // Recessed grating, bolted cross-members and exposed trusses give the elevated
 // maintenance deck physical depth without covering the walkable center aisle.
 const g=scene.add.graphics().setDepth(-24),bottom=f.y+f.h;
 g.fillStyle(0x29444f).fillRect(f.x,bottom+16,f.w,58);
 g.fillStyle(0x769297).fillRect(f.x,bottom+16,f.w,8).fillRect(f.x,bottom+67,f.w,7);
 for(let x=f.x+12;x<f.x+f.w-12;x+=76){
  g.lineStyle(7,0x496a76).lineBetween(x,bottom+25,Math.min(x+65,f.x+f.w-10),bottom+65);
  g.fillStyle(0x354f59).fillRect(x,f.y+12,4,f.h-24);
  g.fillStyle(0xc2d1cc,.7).fillRect(x+4,f.y+12,2,f.h-24);
  for(const y of [f.y+18,bottom-20]){g.fillStyle(0x415c64).fillCircle(x+2,y,4);g.fillStyle(0xc1ceca).fillRect(x+1,y-1,2,2);}
 }
 g.lineStyle(1,0x3b5862,.38);
 for(let y=f.y+24;y<bottom-20;y+=9)g.lineBetween(f.x+12,y,f.x+f.w-12,y);
 for(const y of [f.y-30,bottom-25]){
  g.fillStyle(0x263f4c,.25).fillRect(f.x,y+31,f.w,5);
  for(let x=f.x+20;x<f.x+f.w;x+=120){g.fillStyle(0x44636e).fillRect(x,y,7,38);g.fillStyle(0xb6cbc9).fillRect(x,y,2,38);}
  g.fillStyle(0x476b79).fillRect(f.x,y,f.w,7);g.fillStyle(0xd0ded7).fillRect(f.x,y,f.w,2);
 }
}
function interior(scene,m){
 const service=['mechanical','utility','roof','bridge','stairs','lift'].includes(m.kind),warm=['apartment','luxury','job','meeting','cafe'].includes(m.kind),tile=service?'solace-service':warm?'solace-wood':m.kind==='hall'?'solace-carpet':'solace-marble';
 if(['roof','bridge'].includes(m.kind))skyline(scene,m);else scene.add.rectangle(0,0,m.width,m.height,0x152833).setOrigin(0).setDepth(-40);
 for(const f of m.floorRects){
  scene.add.tileSprite(f.x,f.y,f.w,f.h,tile).setOrigin(0).setDepth(-30);
  const wall=scene.add.graphics().setDepth(-26),height=['roof','bridge'].includes(m.kind)?30:145;
  wall.fillStyle(service?0x7a9096:0xd1d8cb).fillRect(f.x-12,f.y-height,f.w+24,height);
  wall.fillStyle(service?0x3d555e:0x849b99).fillRect(f.x-12,f.y-height-10,f.w+24,10);
  wall.fillStyle(0xe2e7d9,.8).fillRect(f.x,f.y-height+8,f.w,3);
  wall.fillStyle(0x536c73).fillRect(f.x,f.y-9,f.w,9);wall.fillStyle(0x344d57,.32).fillRect(f.x,f.y,f.w,7);
  for(let x=f.x+15;x<f.x+f.w;x+=168){wall.fillStyle(0x6d858c,.14).fillRect(x,f.y-height+12,2,height-25);}
  wall.fillStyle(0x526b74).fillRect(f.x-16,f.y-height,16,f.h+height+16).fillRect(f.x+f.w,f.y-height,16,f.h+height+16).fillRect(f.x,f.y+f.h,f.w,16);
  wall.fillStyle(0xcedbd1).fillRect(f.x-16,f.y-height,5,f.h+height+16).fillRect(f.x+f.w,f.y-height,5,f.h+height+16).fillRect(f.x,f.y+f.h,f.w,4);
  if(!service){for(const x of [f.x+190,f.x+f.w-260]){wall.fillStyle(0x829ca0).fillRect(x-88,f.y-height+25,176,91);wall.fillStyle(0x557f8e).fillRect(x-81,f.y-height+31,162,76);wall.fillStyle(0xb5d7d9,.75).fillRect(x-75,f.y-height+37,68,64);wall.fillStyle(0xacc8c9).fillRect(x-2,f.y-height+31,5,76);}}
  if(service&&m.kind!=='stairs'&&m.kind!=='lift'){wall.lineStyle(5,0x4a6671).lineBetween(f.x+30,f.y-height+35,f.x+f.w-30,f.y-height+35);wall.lineStyle(2,0xb1c6c2).lineBetween(f.x+30,f.y-height+31,f.x+f.w-30,f.y-height+31);}
  if(m.kind==='bridge')bridgeStructure(scene,f);
 }
 label(scene,m.width/2,Math.max(75,m.floorRects[0].y-185),m.title.toUpperCase(),19,'#e0e9dd',-4);
}
function drawDoor(scene,d,p,m){
 if(d.visual==='building-door')return;
 if(d.visual==='district'){
  const arrows={north:'↑',south:'↓',west:'←',east:'→'},short=d.name.replace(' / ','\n'),x=Math.max(150,Math.min(m.width-160,d.x)),y=Math.max(105,Math.min(m.height-100,d.y));
  const panel=scene.add.rectangle(x,y,250,55,0x2d5961,.95).setStrokeStyle(2,0xb6d5c9).setDepth(-4);label(scene,x,y,arrows[d.side]+' '+short,14,'#e7f1d8',-3);return panel;
 }
 const locked=d.blockedBy&&p.flags?.[d.blockedBy]||d.gate&&!canAccess(p,d.gate),isLift=d.visual==='elevator',isStair=d.visual==='stairs';
 const door=scene.add.container(d.x,d.y).setDepth(d.y+2);
 if(isStair){const stairs=scene.add.image(0,15,'solace-stairs').setOrigin(.5,1).setDisplaySize(172,176);door.add(stairs);}
 else if(isLift){const lift=scene.add.image(0,20,'solace-elevator').setOrigin(.5,1).setDisplaySize(176,175);door.add(lift);}
 else{
  const g=scene.add.graphics(),side=['west','east'].includes(d.side),w=side?80:120;
  g.fillStyle(0x263e48).fillRect(-w/2-10,-133,w+20,150);g.fillStyle(0x809b9f).fillRect(-w/2-5,-129,w+10,141);g.fillStyle(0x3c5964).fillRect(-w/2,-123,w,130);g.fillStyle(0xacc1bb).fillRect(-w/2+6,-117,w-12,118);g.fillStyle(0x6c8f96).fillRect(-w/2+12,-108,w-24,79);g.fillStyle(0xd5e0cb).fillRect(-w/2+12,-20,w-24,21);g.fillStyle(0x546b70).fillRect(-1,-119,3,124);g.fillStyle(locked?0xcd755f:0x78d4c4).fillRect(w/2+10,-75,7,15);g.fillStyle(0xe3cf85).fillRect(w/2-17,-44,7,14);
  if(d.blockedBy&&p.flags?.[d.blockedBy]){g.fillStyle(0x70838b).fillRect(-78,-125,156,143);for(let yy=-115;yy<12;yy+=15){g.fillStyle(0x3b515b).fillRect(-76,yy,152,3);g.fillStyle(0xb2c3c4).fillRect(-76,yy+3,152,2);}g.fillStyle(0x263941).fillRect(-82,-5,164,18);}
  door.add(g);
 }
 const text=(d.visual==='stairs'?'STAIRS':d.visual==='elevator'?'LIFT':d.name.replace(/^(Enter |Return to |Return to the )/,'')).toUpperCase();
 const l=scene.add.text(0,-150,text.length>30?text.slice(0,29)+'…':text,{fontFamily:'monospace',fontSize:'12px',fontStyle:'bold',color:locked?'#f2bda3':'#dff2dc',backgroundColor:'#29444c',padding:{x:6,y:4},align:'center'}).setOrigin(.5);door.add(l);return door;
}
export function drawSolaceMap(scene,m,progress={}){
 const objects=[],buildings=[];if(m.exterior)street(scene,m);else interior(scene,m);
 for(const b of m.buildings||[]){const v=building(scene,b);buildings.push(v);objects.push({sprite:v,kind:'building'});}
 for(const p of m.props){const v=drawSolaceProp(scene,p);if(p.type!=='woven-rug')objects.push({sprite:v,kind:/tree|plant|garden/.test(p.type)?'tree':'furniture'});}
 for(const d of m.doors){const sprite=drawDoor(scene,d,progress,m);if(sprite&&d.visual!=='district')objects.push({sprite,kind:'furniture'});}
 for(const i of m.interactions){
  if(i.kind==='panel'){const g=scene.add.graphics().setDepth(i.y-5);g.fillStyle(0x243f49).fillRect(i.x-33,i.y-57,66,51);g.fillStyle(0x91aaa8).fillRect(i.x-30,i.y-54,60,44);g.fillStyle(0x244d54).fillRect(i.x-23,i.y-48,37,27);g.fillStyle(0x7ce0ca).fillRect(i.x-19,i.y-44,26,3);g.fillStyle(0xd8b96d).fillRect(i.x+19,i.y-44,5,6);g.fillStyle(0x77b7b1).fillRect(i.x+19,i.y-31,5,6);}
  if(i.kind==='item'){drawFairmontProp(scene,'crates',i.x,i.y,.38).setDepth(i.y);const mark=label(scene,i.x,i.y-43,'+',17,'#f5e9ac',i.y+1);mark.setAlpha(.8);}
 }
 return {objects,buildings};
}
