import {DUNGEON,SOUTH_FENCE,FLOOD_CHANNELS,floodActive} from './waterworks.mjs';
export const WATER_ENEMY_FRAMES=[[38,97,390,361],[574,64,385,390],[1055,132,436,314],[103,569,269,405],[534,552,449,407],[1043,495,460,481]];
export const WATER_PROP_FRAMES={pump:[72,42,346,373],pipes:[448,59,380,354],console:[892,123,294,297],down:[46,482,382,315],up:[464,462,327,337],vent:[883,522,314,251],barrels:[67,860,320,314],crate:[477,869,299,302]};
export function topWallSegments(room,halls){let segments=[[room.x+28,room.x+room.w-28]];for(const h of halls.filter(h=>h.y+h.h===room.y))segments=segments.flatMap(([a,b])=>h.x>=b||h.x+h.w<=a?[[a,b]]:[[a,Math.max(a,h.x)],[Math.min(b,h.x+h.w),b]].filter(([x,y])=>y>x));return segments;}
export function prepareWaterArt(scene){
 const enemies=scene.textures.get('water-enemies'),props=scene.textures.get('water-props');
 WATER_ENEMY_FRAMES.forEach((r,i)=>{if(!enemies.has('water-'+i))enemies.add('water-'+i,0,...r);});
 for(const [name,r]of Object.entries(WATER_PROP_FRAMES))if(!props.has(name))props.add(name,0,...r);
 if(!scene.textures.exists('facility-floor')){const t=scene.textures.createCanvas('facility-floor',128,128);t.context.drawImage(props.getSourceImage(),894,873,286,285,0,0,128,128);const pixels=t.context.getImageData(0,0,128,128);for(let i=3;i<pixels.data.length;i+=4)pixels.data[i]=255;t.context.putImageData(pixels,0,0);t.context.fillStyle='#17363c77';t.context.fillRect(0,0,128,128);t.refresh();}
}
export function waterActor(scene,x,y,frame,height=104){
 const sprite=scene.add.sprite(x,y,'water-enemies',frame).setOrigin(.5,1);sprite.setScale(height/sprite.height).setDepth(y);
 const shadow=scene.add.ellipse(x,y-3,height*.47,height*.12,0x051b21,.4).setDepth(y-.2);
 return {x,y,sprite,shadow,staticFrame:true,dir:'down',row:3,elapsed:0,walking:false};
}
export function facilityProp(scene,key,x,y,width=180){
 scene.add.ellipse(x+10,y-6,width*.92,30,0x071d22,.45).setDepth(-10);
 const image=scene.add.image(x,y,'water-props',key).setOrigin(.5,1);return image.setScale(width/image.width).setDepth(y);
}
export function drawFacility(scene,floor,s){
 scene.cameras.main.setBackgroundColor('#06131c');
 const structure=scene.add.graphics().setDepth(-22),details=scene.add.graphics().setDepth(-16);
 for(const r of [...floor.rooms,...floor.halls]){structure.fillStyle(0x1d343e).fillRect(r.x-32,r.y-60,r.w+64,r.h+92);structure.lineStyle(3,0x4b6970).strokeRect(r.x-30,r.y-59,r.w+60,r.h+90);scene.add.tileSprite(r.x,r.y,r.w,r.h,'facility-floor').setOrigin(0).setDepth(-20);}
 for(const [i,r]of floor.rooms.entries()){
  const segments=topWallSegments(r,floor.halls);for(const [a,b]of segments){details.fillStyle(0x0d252e,.48).fillRect(a,r.y,b-a,24);details.lineStyle(7,0x688281,.8).lineBetween(a,r.y+12,b,r.y+12);details.lineStyle(3,0xb1ac73,.9).lineBetween(a,r.y+8,b,r.y+8);}
  for(let x=r.x+80;x<r.x+r.w;x+=192){if(!segments.some(([a,b])=>x-38>=a&&x+38<=b))continue;details.fillStyle(0xa8e7d5,.08).fillRect(x-38,r.y+18,76,85);details.fillStyle(0xbbe8d3).fillRect(x-24,r.y+22,48,7);details.fillStyle(0x203740).fillRect(x-30,r.y+18,5,15);}
  const names=['STAIR LOBBY','PUMP GALLERY','SPARES','TRANSFER HALL',floor.rest?'FIRST AID':'STAFF ROOM','FILTER BASIN','RESERVE LOCKER',floor.index===3?'REGULATOR':'LOWER ACCESS'];
  scene.add.text(r.x+32,r.y+50,names[i],{fontFamily:'monospace',fontSize:'16px',color:'#a5bdac',backgroundColor:'#193038',padding:{x:8,y:5}}).setDepth(-15);
  if(i===1||i===5){details.fillStyle(0x1d657a,.35).fillEllipse(r.x+r.w*.48,r.y+r.h*.5,270,130);details.lineStyle(2,0x82bed0,.3).strokeEllipse(r.x+r.w*.48,r.y+r.h*.5,230,90);facilityProp(scene,'vent',r.x+150,r.y+220,130);}
 }
 for(const p of floor.props)facilityProp(scene,p.key,p.x,p.y,p.width);
 facilityProp(scene,'up',floor.up.x,floor.up.y,210);
 if(floor.index<3)facilityProp(scene,'down',floor.down.x,floor.down.y,220);
 for(const crate of floor.supplies)if(!s.flags[crate.id])facilityProp(scene,'crate',crate.x,crate.y,112);
 if(floor.rest){facilityProp(scene,'console',floor.rest.x,floor.rest.y,110);
 scene.add.text(floor.rest.x,floor.rest.y-115,'+ FIRST AID',{fontFamily:'monospace',fontSize:'15px',color:'#c6f2c3',backgroundColor:'#214e44',padding:{x:8,y:5}}).setOrigin(.5,1).setDepth(floor.rest.y+1);}
 if(floor.index===3&&!s.flags.vestFound){facilityProp(scene,'crate',floor.vest.x,floor.vest.y,100);scene.add.text(floor.vest.x,floor.vest.y-100,'INSULATED GEAR',{fontFamily:'monospace',fontSize:'13px',color:'#f6d59e',backgroundColor:'#333a39',padding:{x:6,y:4}}).setOrigin(.5,1).setDepth(floor.vest.y);}
 if(floor.index===3){facilityProp(scene,'console',floor.boss.x+230,floor.boss.y+60,120);scene.add.text(floor.boss.x+230,floor.boss.y+100,'SURFACE LIFT',{fontFamily:'monospace',fontSize:'13px',color:'#c1cebb',backgroundColor:'#233a40',padding:{x:8,y:5}}).setOrigin(.5).setDepth(floor.boss.y+101);}
}
export function drawSouthernRoute(scene,s){
 scene.add.tileSprite(3072,4080,768,115,'path').setOrigin(0,.5).setDepth(-19);scene.add.tileSprite(3840,4070,190,910,'path').setOrigin(.5,0).setDepth(-19);
 const f=SOUTH_FENCE,g=scene.add.graphics().setDepth(-11);g.fillStyle(0x183125).fillRect(f.x,f.y,f.w,f.h);for(let y=f.y;y<f.y+f.h;y+=48){g.fillStyle(0x6b7970).fillRect(f.x+24,y,12,44);g.fillStyle(0x294c39).fillEllipse(f.x+32,y+35,90,90);}
 g.fillStyle(0x81948a).fillRect(4078,3890,120,32);g.lineStyle(5,0x233d42).strokeRect(4078,3890,120,32);
 scene.add.text(3630,4140,'FAIRMONT JUNCTION ↓',{fontFamily:'monospace',fontSize:'19px',color:'#ebe3be',backgroundColor:'#344e43',padding:{x:12,y:8}}).setDepth(4160);
 if(floodActive(s))scene.add.text(3740,4200,'ROAD FLOODED',{fontFamily:'monospace',fontSize:'18px',color:'#f5d797',backgroundColor:'#4d3d2b',padding:{x:12,y:8}}).setDepth(4210);
 scene.floodGraphics=scene.add.graphics().setDepth(-12);drawFlood(scene,s,0);
}
export function drawFlood(scene,s,time){
 const g=scene.floodGraphics;if(!g)return;g.clear();
 for(const r of FLOOD_CHANNELS){if(!floodActive(s)){g.fillStyle(0x4d6459,.35).fillRect(r.x,r.y,r.w,r.h);continue;}
  g.fillStyle(0x173a4c).fillRect(r.x-10,r.y-8,r.w+20,r.h+16);g.fillStyle(0x2e788c).fillRect(r.x,r.y,r.w,r.h);g.fillStyle(0x459cab,.6).fillRect(r.x+9,r.y+12,r.w-18,r.h-24);
  for(let yy=r.y+15;yy<r.y+r.h;yy+=25)for(let xx=r.x+10;xx<r.x+r.w-50;xx+=91){const drift=(time*.025+yy*.27)%65;g.lineStyle(3,0xc4e8de,.55).lineBetween(xx+drift,yy,Math.min(xx+drift+32,r.x+r.w-4),yy+3);}
 }
}
