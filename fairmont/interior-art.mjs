// Standalone illustrated furniture. Original RGBA files stay untouched; frames
// remove only transparent outside margins so physical scale is predictable.
export const INTERIOR_ART=Object.freeze({
 'clinic-bed':{file:'clinic-bed.png',width:210},
 'clinic-cabinet':{file:'clinic-cabinet.png',width:155},
 'clinic-cart':{file:'clinic-cart.png',width:100},
 'clinic-screen':{file:'clinic-screen.png',width:230},
 'woven-rug':{file:'woven-rug.png',width:380,floor:true},
 'public-hotel-reception':{file:'public-hotel-reception.png',width:390},
 'public-waiting-chairs':{file:'public-waiting-chairs.png',width:220},
 'public-hotel-cart':{file:'public-hotel-cart.png',width:130},
 'public-cafe-setting':{file:'public-cafe-setting.png',width:270},
 'robotics-retail-display':{file:'robotics-retail-display.png',width:220},
 'robotics-retail-shelves':{file:'robotics-retail-shelves.png',width:255},
 'robotics-assembly-cell':{file:'robotics-assembly-cell.png',width:340},
 'robotics-test-rig':{file:'robotics-testing-rig.png',width:270},
});
export function preloadInteriorArt(scene){
 for(const [type,{file}]of Object.entries(INTERIOR_ART)){
  const key='fm-interior-'+type;
  if(!scene.textures.exists(key))scene.load.image(key,new URL('./assets/interior-v2/'+file,import.meta.url).href);
 }
}
export function prepareInteriorArt(scene){
 for(const type of Object.keys(INTERIOR_ART)){
  const texture=scene.textures.get('fm-interior-'+type);if(texture.has('object'))continue;
  const image=texture.getSourceImage(),canvas=document.createElement('canvas');
  canvas.width=image.width;canvas.height=image.height;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
  const rgba=ctx.getImageData(0,0,image.width,image.height).data;
  let left=image.width,top=image.height,right=-1,bottom=-1;
  for(let y=0;y<image.height;y++)for(let x=0;x<image.width;x++)if(rgba[(y*image.width+x)*4+3]>=32){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  if(right<left)throw new Error('Empty furniture sprite: '+type);
  texture.add('object',0,left,top,right-left+1,bottom-top+1);texture.setFilter(0);
 }
}
export function drawInteriorSprite(scene,type,x,y,width=INTERIOR_ART[type]?.width,depth){
 const definition=INTERIOR_ART[type];if(!definition)throw new Error('Unknown interior art: '+type);
 const sprite=scene.add.image(x,y,'fm-interior-'+type,'object').setOrigin(.5,1);
 sprite.setScale(width/sprite.width).setDepth(depth??(definition.floor?-27:y));
 return sprite;
}
