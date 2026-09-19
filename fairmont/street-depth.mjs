// Shallow 2.5D surface details; coordinates and walkable geometry stay unchanged.
export function curbSegments(length,crossings,start=0){
 const cuts=crossings.map(x=>[Math.max(start,x-107),Math.min(length,x+107)]).sort((a,b)=>a[0]-b[0]);
 const result=[];let cursor=start;
 for(const [a,b]of cuts){if(a>cursor)result.push([cursor,a]);cursor=Math.max(cursor,b);}
 if(cursor<length)result.push([cursor,length]);return result;
}
export function drawStreetDepth(scene,city,roads,night){
 const g=scene.add.graphics().setDepth(-25);
 const stone=night?0x75838b:0xc5c8bb,light=night?0x9aa7a7:0xf0eedb,face=night?0x3d4d5b:0x697b80;
 const edge=(a,b,fixed,vertical)=>{
  const rect=(s,o,l,w,color,alpha=1)=>{g.fillStyle(color,alpha);vertical?g.fillRect(fixed+o,s,w,l):g.fillRect(s,fixed+o,l,w);};
  for(const side of [-1,1]){
   const c=side*95;
   rect(a,c+(side<0?-12:0),b-a,12,face);
   rect(a,c+(side<0?-14:10),b-a,5,stone);
   rect(a,c+(side<0?-14:10),b-a,2,light);
   rect(a,c+(side<0?0:-4),b-a,4,0x192a34,.40);
   // Block joints make the raised curb legible at the game's normal zoom.
   for(let s=a+24;s<b-8;s+=50)rect(s,c+(side<0?-12:1),2,10,0x36434a,.55);
   // Cast contact shade onto the asphalt, not a giant extra collision boundary.
   rect(a,c+(side<0?3:-9),b-a,6,0x14242e,.13);
  }
  for(let s=a+95;s<b-90;s+=285){
   rect(s,77,43,14,0x182c35,.8);rect(s,77,43,2,0xb1bdba,.6);
   for(let k=3;k<40;k+=6)rect(s+k,80,2,8,0x536771);
  }
 };
 for(const y of roads.horizontal){
  const crosses=roads.vertical.filter(x=>y>=(roads.verticalStarts?.[x]||0)-107);
  for(const [a,b]of curbSegments(city.width,crosses))edge(a,b,y,false);
 }
 for(const x of roads.vertical)for(const [a,b]of curbSegments(city.height,roads.horizontal,roads.verticalStarts?.[x]||0))edge(a,b,x,true);
 // Recessed access covers: rim, inner bevel and concentric stamped metal.
 for(const y of roads.horizontal)for(const x of roads.vertical){
  if(y<(roads.verticalStarts?.[x]||0))continue;
  const cx=x+47,cy=y+36;
  g.fillStyle(0x10212b,.36).fillEllipse(cx+3,cy+4,55,31);
  g.fillStyle(night?0x354854:0x7c8989).fillEllipse(cx,cy,51,27);
  g.lineStyle(2,night?0x647d88:0xb4bcb0,.9).strokeEllipse(cx,cy-1,48,24);
  g.lineStyle(2,0x263a42,.8).strokeEllipse(cx,cy,34,15);
  for(let i=-2;i<=2;i++)g.lineBetween(cx-15,cy+i*3,cx+15,cy+i*3);
 }
 return g;
}

export function buildingRelief(scene,image,b,geometry,night){
 const {x,y,w,h,footprint:f}=geometry;
 // Use the actual facade alpha, projected flat onto the ground. Transparent
 // corners stay transparent; this does not add a rectangular shadow behind art.
 const key=image.texture.key+'-ground-shadow';
 if(!scene.textures.exists(key)){
  const src=image.texture.getSourceImage(),c=document.createElement('canvas');
  c.width=src.width+Math.ceil(src.height*.22);c.height=Math.ceil(src.height*.22)+10;
  const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;
  ctx.setTransform(1,0,-.22,-.20,src.height*.22,src.height*.20);
  ctx.drawImage(src,0,0);ctx.setTransform(1,0,0,1,0,0);
  ctx.globalCompositeOperation='source-in';ctx.fillStyle='#152331';ctx.fillRect(0,0,c.width,c.height);
  scene.textures.addCanvas(key,c).setFilter(0);
 }
 const shadow=scene.add.image(x-w/2,y-3,key).setOrigin(0).setScale(image.scaleX).setAlpha(night?.16:.24).setDepth(-21);
 const g=scene.add.graphics().setDepth(-20);
 g.fillStyle(0x152832,night?.4:.26).fillRoundedRect(f.x-4,f.y+f.h-6,f.w+8,13,5);
 // Ground plinth and its sun-facing lip are narrower than the painted base.
 g.fillStyle(night?0x3e4d57:0x788789).fillRect(f.x,f.y+f.h-8,f.w,9);
 g.fillStyle(night?0x718089:0xc4cbc3).fillRect(f.x,f.y+f.h-8,f.w,2);
 for(let bx=f.x+45;bx<f.x+f.w-4;bx+=62){g.fillStyle(0x384f59,.5).fillRect(bx,f.y+f.h-5,2,5);}
 return {shadow,foundation:g};
}
