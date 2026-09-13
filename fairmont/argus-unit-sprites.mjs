// The supplied source sheet is preserved intact, including its labels and black matte.
// Only these measured robot poses are drawn into the runtime texture.
export const ARGUS_BATTLE_TEXTURE='fairmont-argus-sentinel-battle';
export const ARGUS_BATTLE_URL=new URL('./assets/argus-sentinel-battle.png',import.meta.url).href;
export const ARGUS_UNIT_TEXTURE='fairmont-argus-unit';
export const ARGUS_UNIT_SOURCE={key:'fairmont-argus-unit-source',width:1448,height:1086,url:new URL('./assets/argus-manufactured-unit-sheet.png',import.meta.url).href};
export const ARGUS_UNIT_FRAMES={
 down:[[69,76,163,179],[337,76,166,178],[612,73,163,182]],
 left:[[76,334,153,172],[352,329,143,177],[620,330,148,179]],
 right:[[70,583,152,169],[350,584,146,169],[625,577,143,174]],
 up:[[69,831,163,187],[337,827,166,191],[612,825,164,201]],
};
export const ARGUS_UNIT_FRAME_MS=145;
const DIRECTIONS=Object.keys(ARGUS_UNIT_FRAMES),CELL_WIDTH=180,CELL_HEIGHT=208;

/** Remove only dark pixels connected to a crop edge, preserving black armor details. */
export function keyArgusUnitMatte(data,width,height){
 const seen=new Uint8Array(width*height),queue=new Uint32Array(width*height);let head=0,tail=0;
 const visit=p=>{if(seen[p])return;seen[p]=1;const i=p*4;if(Math.max(data[i],data[i+1],data[i+2])>24)return;queue[tail++]=p;};
 for(let x=0;x<width;x++){visit(x);visit((height-1)*width+x);}
 for(let y=0;y<height;y++){visit(y*width);visit(y*width+width-1);}
 while(head<tail){const p=queue[head++],x=p%width,y=Math.floor(p/width);data[p*4+3]=0;if(x)visit(p-1);if(x<width-1)visit(p+1);if(y)visit(p-width);if(y<height-1)visit(p+width);}
 return data;
}

export function loadArgusUnitSprites(scene){
 if(!scene.textures.exists(ARGUS_BATTLE_TEXTURE))scene.load.image(ARGUS_BATTLE_TEXTURE,ARGUS_BATTLE_URL);
 if(!scene.textures.exists(ARGUS_UNIT_SOURCE.key))scene.load.image(ARGUS_UNIT_SOURCE.key,ARGUS_UNIT_SOURCE.url);
}

export function prepareArgusUnitSprites(scene){
 if(scene.textures.exists(ARGUS_UNIT_TEXTURE))return;
 const source=scene.textures.get(ARGUS_UNIT_SOURCE.key).getSourceImage();
 if(source.width!==ARGUS_UNIT_SOURCE.width||source.height!==ARGUS_UNIT_SOURCE.height)throw new Error('A.R.G.U.S. unit sheet has unexpected dimensions.');
 const atlas=document.createElement('canvas');atlas.width=CELL_WIDTH*3;atlas.height=CELL_HEIGHT*4;
 const destination=atlas.getContext('2d');destination.imageSmoothingEnabled=false;
 const frames=[];
 DIRECTIONS.forEach((dir,row)=>ARGUS_UNIT_FRAMES[dir].forEach(([x,y,w,h],pose)=>{
  const crop=document.createElement('canvas');crop.width=w;crop.height=h;
  const context=crop.getContext('2d',{willReadFrequently:true});context.imageSmoothingEnabled=false;
  context.drawImage(source,x,y,w,h,0,0,w,h);
  const pixels=context.getImageData(0,0,w,h);keyArgusUnitMatte(pixels.data,w,h);context.putImageData(pixels,0,0);
  const dx=pose*CELL_WIDTH,dy=row*CELL_HEIGHT;destination.drawImage(crop,dx,dy);
  frames.push({name:dir+'-'+pose,bounds:[dx,dy,w,h]});
 }));
 const texture=scene.textures.addCanvas(ARGUS_UNIT_TEXTURE,atlas);texture.setFilter(0);
 for(const frame of frames)texture.add(frame.name,0,...frame.bounds);
 texture.add('portrait',0,...frames[0].bounds);
}

export function selectArgusUnitFrame({dir='down',walking=false,elapsed=0}={}){
 const facing=DIRECTIONS.includes(dir)?dir:'down',sequence=[1,0,2,0],pose=walking?sequence[Math.floor(Math.max(0,elapsed)/ARGUS_UNIT_FRAME_MS)%sequence.length]:0;
 return {key:ARGUS_UNIT_TEXTURE,frame:facing+'-'+pose,bounds:ARGUS_UNIT_FRAMES[facing][pose]};
}

export function createArgusUnitActor(scene,x,y,height=116){
 const selected=selectArgusUnitFrame(),scale=height/selected.bounds[3];
 const sprite=scene.add.sprite(x,y,selected.key,selected.frame).setOrigin(.5,1).setScale(scale).setDepth(y);
 const shadow=scene.add.ellipse(x,y-2,45,12,0x112337,.3).setDepth(y-.2);
 return {x,y,sprite,shadow,key:ARGUS_UNIT_TEXTURE,scale,argusUnit:true,staticFrame:true,dir:'down',elapsed:0,walking:false};
}

export function drawArgusUnitActor(actor,delta=0){
 if(!actor?.argusUnit)return;
 actor.elapsed=(actor.elapsed||0)+delta;const selected=selectArgusUnitFrame(actor);
 // Uniform source scale preserves body proportions; every pose remains feet-anchored.
 actor.sprite.setTexture(selected.key,selected.frame).setFlipX(false).setScale(actor.scale).setPosition(actor.x,actor.y).setDepth(actor.y);
 actor.shadow.setPosition(actor.x,actor.y-2).setDepth(actor.y-.2);
}
