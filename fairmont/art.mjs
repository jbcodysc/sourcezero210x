// Original Fairmont assets. The raw atlases use a magenta matte, removed once at load.
// World geometry belongs to the map; these helpers only draw individual objects.
export const FAIRMONT_BUILDING_FRAMES = {
 hotel:[16,48,364,491],radio:[400,122,338,416],market:[744,44,442,492],cafe:[1190,125,328,414],
 apartment:[15,570,315,377],warehouse:[350,590,365,357],facility:[737,542,451,405],terminal:[1199,633,325,311]
};
export const FAIRMONT_PROP_FRAMES = {
 tree:[57,8,277,280],tent:[395,50,358,229],crates:[825,23,270,251],bench:[1160,90,352,185],
 console:[94,292,208,225],shelf:[427,284,296,243],server:[874,273,170,247],droneDock:[1191,354,300,146],
 assemblyArm:[30,519,311,252],fence:[424,525,307,235],lamppost:[918,511,79,270],sofa:[1159,560,355,202],
 desk:[27,766,320,252],bed:[458,764,231,249],plant:[858,779,203,232],conveyor:[1150,784,372,227]
};
export const FAIRMONT_CITIZEN_ROLES = ['shopkeeper','guard','worker','olderwoman','derek','protester'];
export const FAIRMONT_GROUND_KEYS = ['fm-asphalt','fm-paving','fm-grass','fm-wood','fm-industrial','fm-retail'];
// New sprites are paired views of the same six original machine designs.
export const FAIRMONT_ENEMY_FRAMES = {
 cleaner:{map:[197,101,147,130],battle:[480,50,381,190]},
 'stock-hauler':{map:[179,318,178,121],battle:[458,272,422,184]},
 compliance:{map:[204,518,129,176],battle:[480,472,432,245]},
 'test-drone':{map:[188,769,171,135],battle:[465,741,428,190]},
 'heavy-drone':{map:[156,1000,213,146],battle:[445,952,475,243]},
 'assembly-arm':{map:[158,1260,194,168],battle:[451,1200,462,266]},
};
export const FAIRMONT_PARK_FRAMES = {
 dirtMound:[0,103,393,405],uprootedStump:[394,103,368,402],fallenTree:[756,8,412,500],excavator:[1168,60,368,448],
 brokenPath:[0,542,393,450],flowerbed:[397,542,389,444],parkBench:[788,619,366,346],fountain:[1155,511,381,487],
};
const SOURCES = {'fairmont-buildings-raw':'fairmont-buildings.png','fairmont-props-raw':'fairmont-props.png','fairmont-citizens-raw':'fairmont-citizens.png','fairmont-bosses-raw':'fairmont-bosses.png','fairmont-ground-raw':'fairmont-ground.png','fairmont-bus-raw':'fairmont-bus.png','fairmont-machines-raw':'fairmont-machines.png','fairmont-enemies-v2-raw':'fairmont-enemies-v2.png','fairmont-park-details-raw':'fairmont-park-details.png','fairmont-hotel-two-storey-raw':'fairmont-hotel-two-storey.png'};
const PROP_WIDTH = {tree:250,tent:208,crates:134,bench:166,console:108,shelf:218,server:106,droneDock:160,assemblyArm:220,fence:218,lamppost:54,sofa:220,desk:186,bed:140,plant:80,conveyor:260,dirtMound:180,uprootedStump:130,fallenTree:310,excavator:300,brokenPath:240,flowerbed:160,parkBench:166,fountain:240};
const ALIASES = {crate:'crates',robot:'droneDock',drone:'droneDock',shelves:'shelf',terminal:'console',computer:'console',arm:'assemblyArm',lamp:'lamppost',counter:'desk',locker:'server',couch:'sofa',barrier:'fence'};

export function preloadFairmontArt(scene){
 for(const [key,file] of Object.entries(SOURCES)) if(!scene.textures.exists(key)) scene.load.image(key,new URL('./assets/'+file,import.meta.url).href);
}

function keyedTexture(scene,sourceKey,targetKey,rect,baseWidth=1536,baseHeight=1024){
 if(scene.textures.exists(targetKey))return scene.textures.get(targetKey);
 const image=scene.textures.get(sourceKey).getSourceImage();
 const sx=image.width/baseWidth,sy=image.height/baseHeight;
 const [x,y,w,h]=rect.map((n,i)=>Math.round(n*(i%2?sy:sx)));
 const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
 const context=canvas.getContext('2d',{willReadFrequently:true});context.imageSmoothingEnabled=false;
 context.drawImage(image,x,y,w,h,0,0,w,h);
 const pixels=context.getImageData(0,0,w,h),d=pixels.data;
 let left=w,top=h,right=-1,bottom=-1;
 for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){
  const i=(yy*w+xx)*4,r=d[i],g=d[i+1],b=d[i+2];
  // The matte has no green channel. Keep real teal, warm wood and plum clothing.
  if((r>155&&b>140&&r-g>95&&b-g>95)||(targetKey==='fairmont-prop-fence'&&r>40&&b>45&&r-g>25&&b-g>25)){d[i+3]=0;continue;}
  if(d[i+3]>32){left=Math.min(left,xx);right=Math.max(right,xx);top=Math.min(top,yy);bottom=Math.max(bottom,yy);}
 }
 context.putImageData(pixels,0,0);
 if(right<left){left=0;top=0;right=w-1;bottom=h-1;}
 const trimmed=document.createElement('canvas');trimmed.width=right-left+1;trimmed.height=bottom-top+1;
 trimmed.getContext('2d').drawImage(canvas,left,top,trimmed.width,trimmed.height,0,0,trimmed.width,trimmed.height);
 const texture=scene.textures.addCanvas(targetKey,trimmed);texture.setFilter(0);
 texture.add('portrait',0,0,0,trimmed.width,trimmed.height);
 return texture;
}

// Scene-lighting variants leave the generated source PNGs untouched. Bright midday
// exteriors and the story's night overlay share exactly the same object silhouettes.
function daylightTexture(scene,sourceKey,targetKey){
 if(scene.textures.exists(targetKey))return;
 const source=scene.textures.get(sourceKey).getSourceImage();
 const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
 const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(source,0,0);
 const pixels=context.getImageData(0,0,canvas.width,canvas.height),d=pixels.data;
 for(let i=0;i<d.length;i+=4){if(!d[i+3])continue;d[i]=Math.min(255,d[i]*1.12+24);d[i+1]=Math.min(255,d[i+1]*1.15+27);d[i+2]=Math.min(255,d[i+2]*1.12+25);}
 context.putImageData(pixels,0,0);scene.textures.addCanvas(targetKey,canvas).setFilter(0);
}

function prepareGroundTiles(scene){
 const source=scene.textures.get('fairmont-ground-raw').getSourceImage();
 const width=source.width/3,height=source.height/2,quarter=256;
 FAIRMONT_GROUND_KEYS.forEach((key,i)=>{
  if(scene.textures.exists(key))return;
  const canvas=document.createElement('canvas');canvas.width=quarter*2;canvas.height=quarter*2;
  const context=canvas.getContext('2d',{willReadFrequently:true});context.imageSmoothingEnabled=false;
  // A reflected repeat makes opposing edges agree without blurring the pixel texture.
  // This also prevents visible hard seams on large streets and floors.
  for(let row=0;row<2;row++)for(let col=0;col<2;col++){
   context.save();context.translate(col?quarter*2:0,row?quarter*2:0);context.scale(col?-1:1,row?-1:1);
   context.drawImage(source,(i%3)*width+1,Math.floor(i/3)*height+1,width-2,height-2,0,0,quarter,quarter);
   context.restore();
  }
  const pixels=context.getImageData(0,0,canvas.width,canvas.height);
  for(let a=0;a<pixels.data.length;a+=4){
   // Outside materials need sunlit values, not the dark original atlas's ambience.
   if(i<3){pixels.data[a]=Math.min(255,pixels.data[a]*1.18+28);pixels.data[a+1]=Math.min(255,pixels.data[a+1]*1.2+30);pixels.data[a+2]=Math.min(255,pixels.data[a+2]*1.16+28);}
   pixels.data[a+3]=255;
  }
  context.putImageData(pixels,0,0);scene.textures.addCanvas(key,canvas).setFilter(0);
 });
}

export function prepareFairmontArt(scene){
 for(const [name,rect]of Object.entries(FAIRMONT_BUILDING_FRAMES)){
  keyedTexture(scene,'fairmont-buildings-raw','fairmont-building-'+name,rect);
  daylightTexture(scene,'fairmont-building-'+name,'fairmont-building-'+name+'-day');
 }
 for(const [name,rect]of Object.entries(FAIRMONT_PROP_FRAMES))keyedTexture(scene,'fairmont-props-raw','fairmont-prop-'+name,rect);
 keyedTexture(scene,'fairmont-hotel-two-storey-raw','fairmont-hotel-two-storey',[0,0,1536,1024]);
 for(const [name,rect]of Object.entries(FAIRMONT_PARK_FRAMES))keyedTexture(scene,'fairmont-park-details-raw','fairmont-prop-'+name,rect);
 for(const [name,views]of Object.entries(FAIRMONT_ENEMY_FRAMES))for(const [view,rect]of Object.entries(views))keyedTexture(scene,'fairmont-enemies-v2-raw',`fairmont-enemy-${name}-${view}`,rect,1024,1536);
 FAIRMONT_CITIZEN_ROLES.forEach((name,i)=>keyedTexture(scene,'fairmont-citizens-raw','fairmont-citizen-'+name,[i*362,0,362,724],2172,724));
 keyedTexture(scene,'fairmont-bosses-raw','fairmont-karen',[42,101,600,908]);
 keyedTexture(scene,'fairmont-bosses-raw','fairmont-argus',[650,20,864,990]);
 keyedTexture(scene,'fairmont-bus-raw','fairmont-bus',[0,0,1536,1024]);
 keyedTexture(scene,'fairmont-machines-raw','fairmont-survey-drone',[15,240,520,370],1774,887);
 keyedTexture(scene,'fairmont-machines-raw','fairmont-heavy-drone',[538,150,670,572],1774,887);
 keyedTexture(scene,'fairmont-machines-raw','fairmont-assembly-arm',[1213,70,545,742],1774,887);
 prepareGroundTiles(scene);
}

export function drawFairmontBus(scene,x,y,width=440,night=false){
 const bus=scene.add.image(x,y,'fairmont-bus').setOrigin(.5,1).setDepth(y);
 bus.setScale(width/bus.width);if(night)bus.setTint(0xa1aac9);return bus;
}

function buildingType(b){
 const value=String(b.type||b.id||'').toLowerCase();
 if(/hotel|inn/.test(value))return 'hotel';
 if(/radio|gear|repair|shop/.test(value))return 'radio';
 if(/market|retail|whole|wrm/.test(value))return 'market';
 if(/cafe|coffee|diner/.test(value))return 'cafe';
 if(/facility|drone|cenexis/.test(value))return 'facility';
 if(/terminal|bus|transit/.test(value))return 'terminal';
 if(/warehouse|freight|industrial|utility|supply/.test(value))return 'warehouse';
 return 'apartment';
}

export function drawFairmontBuilding(scene,b,night=false){
 const type=buildingType(b),x=b.x+b.w/2,y=b.y+b.h;
 const container=scene.add.container(x,y).setDepth(y);
 const hotel=b.id==='hotel';
 const image=scene.add.image(0,0,hotel?'fairmont-hotel-two-storey':'fairmont-building-'+type+(night?'':'-day')).setOrigin(.5,1);
 const scale=Math.min(b.w/image.width,b.h/image.height);image.setScale(scale);
 if(night)image.setTint(0xa1aac9);
 const shadow=scene.add.ellipse(8,-4,image.displayWidth*.96,32,0x16202c,night?.45:.24);
 container.add([shadow,image]);
 // Signs are mounted on business facades; residences deliberately remain unsigned.
 if(type!=='apartment'&&b.name){
  const levels={hotel:.238,radio:.275,market:.262,cafe:.276,warehouse:.466,facility:.322,terminal:.379};
  const panelY=-image.displayHeight*(hotel?.455:(levels[type]||.27));
  const panelWidth=Math.min(image.displayWidth*.65,Math.max(96,b.name.length*9));
  const plate=scene.add.rectangle(0,panelY,panelWidth,28,night?0x192c3b:0x233a42,1).setStrokeStyle(2,0xb99664);
  const name=scene.add.text(0,panelY,String(b.shortName||b.name).toUpperCase(),{fontFamily:'monospace',fontSize:'15px',fontStyle:'bold',color:night?'#ffe8a8':'#f6e3b9',align:'center'}).setOrigin(.5);
  if(name.width>panelWidth-12)name.setScale((panelWidth-12)/name.width);
  container.add([plate,name]);
 }
 container.facade=image;return container;
}

export function drawFairmontProp(scene,type,x,y,scale=1){
 type=ALIASES[type]||type;if(!FAIRMONT_PROP_FRAMES[type]&&!FAIRMONT_PARK_FRAMES[type])type='crates';
 const image=scene.add.image(x,y,'fairmont-prop-'+type).setOrigin(.5,1);
 image.setScale((PROP_WIDTH[type]||140)*scale/image.width).setDepth(y);
 return image;
}

export function createFairmontCitizen(scene,x,y,role='protester',height=104){
 if(Number.isInteger(role))role=FAIRMONT_CITIZEN_ROLES[((role%6)+6)%6];
 role=({merchant:'shopkeeper',owner:'shopkeeper',security:'guard',technician:'worker',elder:'olderwoman',student:'derek',woman:'protester'})[role]||role;
 if(!FAIRMONT_CITIZEN_ROLES.includes(role))role='protester';
 const key='fairmont-citizen-'+role,sprite=scene.add.sprite(x,y,key).setOrigin(.5,1).setDepth(y);
 sprite.setScale(height/sprite.height);
 const shadow=scene.add.ellipse(x,y-2,37,10,0x16222a,.25).setDepth(y-.2);
 return {x,y,sprite,shadow,key,row:0,role,staticFrame:true,dir:'down',elapsed:0,walking:false,scale:sprite.scaleX};
}

/** Optional opaque floor underneath map geometry. All rectangles are top-left anchored. */
export function drawFairmontGround(scene,width,height,{night=false,roads=[],sidewalks=[],grass=[]}={}){
 const ground=scene.add.graphics().setDepth(-100);
 ground.fillStyle(night?0x28313c:0xafa994).fillRect(0,0,width,height);
 for(const r of grass){ground.fillStyle(night?0x234437:0x64865b).fillRect(r.x,r.y,r.w,r.h);}
 for(const r of sidewalks){ground.fillStyle(night?0x525664:0xc1baa8).fillRect(r.x,r.y,r.w,r.h);}
 for(const r of roads){
  ground.fillStyle(night?0x1d2838:0x535e64).fillRect(r.x,r.y,r.w,r.h);
  ground.lineStyle(3,night?0x576372:0x859191).strokeRect(r.x+2,r.y+2,r.w-4,r.h-4);
  ground.fillStyle(night?0x8f8c73:0xd3c7a1,.6);
  if(r.w>r.h)for(let x=r.x+30;x<r.x+r.w-40;x+=100)ground.fillRect(x,r.y+r.h/2,45,4);
  else for(let y=r.y+30;y<r.y+r.h-40;y+=100)ground.fillRect(r.x+r.w/2,y,4,45);
 }
 return ground;
}
