import {chooseWalkFrame} from '../lab/world-rules.mjs';
import {CITY_FRAMES} from './city-art-data.mjs';
import {prepareCharacterSheets,createSheetActor,drawSheetActor} from './character-sheets.mjs';
function frame(texture,name,x,y,w,h,trim=true){
 if(texture.has(name))return texture.get(name);
 const source=texture.getSourceImage();x=Math.round(x);y=Math.round(y);w=Math.round(w);h=Math.round(h);
 if(trim){const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(source,x,y,w,h,0,0,w,h);const data=ctx.getImageData(0,0,w,h).data;let minX=w,minY=h,maxX=-1,maxY=-1;for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++)if(data[(yy*w+xx)*4+3]>80){minX=Math.min(minX,xx);minY=Math.min(minY,yy);maxX=Math.max(maxX,xx);maxY=Math.max(maxY,yy);}if(maxX>=0){x+=minX;y+=minY;w=maxX-minX+1;h=maxY-minY+1;}}
 return texture.add(name,0,x,y,w,h);
}
export function prepareArt(scene){
 prepareCharacterSheets(scene);
 const city=scene.textures.get('city-atlas'),image=city.getSourceImage(),cw=image.width/6,ch=image.height/4;
 for(const [name,bounds]of Object.entries(CITY_FRAMES))frame(city,name,...bounds.map((v,i)=>v*(i%2?image.height/1024:image.width/1536)),false);
 for(const [col,name]of ['grass','asphalt','sidewalk','path','flowers','hedge'].entries()){
  const f=frame(city,name,col*cw+2,3*ch+2,cw-4,ch-4,false);
  if(!scene.textures.exists(name)){
   const t=scene.textures.createCanvas(name,f.width,f.height);t.context.drawImage(image,f.cutX,f.cutY,f.width,f.height,0,0,f.width,f.height);
   // Ground is opaque: crossing road strips must not double their translucent tint.
   const pixels=t.context.getImageData(0,0,f.width,f.height);for(let i=3;i<pixels.data.length;i+=4)pixels.data[i]=255;t.context.putImageData(pixels,0,0);t.refresh();
  }
 }
 const rooms=scene.textures.get('interiors'),ri=rooms.getSourceImage();for(let i=0;i<9;i++){const x=Math.round(i%3*ri.width/3),y=Math.round(Math.floor(i/3)*ri.height/3);frame(rooms,'room-'+i,x,y,Math.round((i%3+1)*ri.width/3)-x,Math.round((Math.floor(i/3)+1)*ri.height/3)-y,false);}
 const lab=scene.textures.get('lab-characters'),li=lab.getSourceImage();for(let r=0;r<4;r++)for(let c=0;c<6;c++)frame(lab,'lab-'+r+'-'+c,c*li.width/6,r*li.height/4,li.width/6,li.height/4-2);
 const town=scene.textures.get('town-characters'),ti=town.getSourceImage(),cell=ti.width/6;for(let r=0;r<4;r++)for(let c=0;c<6;c++)frame(town,'town-'+r+'-'+c,c*cell,r*cell,cell,r===3?ti.height*806/1254-r*cell:cell);
 for(let i=0;i<3;i++){const f=frame(town,'battle-'+i,i*ti.width/3,ti.height*806/1254,ti.width/3,ti.height*(1-806/1254));const name=['battle-human','battle-robot','battle-boss'][i];if(!scene.textures.exists(name))scene.textures.addImage(name,ti);const standalone=scene.textures.get(name);if(!standalone.has('portrait'))standalone.add('portrait',0,f.cutX,f.cutY,f.width,f.height);}
}
export function actor(scene,x,y,row=0,height=104,hero=false,labRole=null){
 if(hero||labRole===1)return createSheetActor(scene,x,y,{kind:hero?'hero':'mira',outfit:hero?(scene.heroOutfit||'normal'):'lab',height});
 const lab=hero||row===4||labRole!==null,prefix=lab?'lab-'+(hero?0:labRole??3):'town-'+row,key=lab?'lab-characters':'town-characters';
 const f=scene.textures.get(key).get(prefix+'-0'),scale=height/f.height;
 const sprite=scene.add.sprite(x,y,key,prefix+'-0').setOrigin(.5,1).setScale(scale).setDepth(y);
 const shadow=scene.add.ellipse(x,y-2,40,11,0x172b29,.25).setDepth(y-.2);
 return {x,y,row,prefix,key,sprite,shadow,dir:'down',elapsed:0,walking:false,scale};
}
export function drawActor(a,delta){if(a.sheetCharacter)return drawSheetActor(a,delta);a.elapsed+=delta;if(!a.staticFrame)a.sprite.setFrame(a.prefix+'-'+chooseWalkFrame(a.dir,a.walking,a.elapsed));a.sprite.setFlipX(a.dir==='left').setPosition(a.x,a.y).setDepth(a.y);a.shadow.setPosition(a.x,a.y-2).setDepth(a.y-.2);}
