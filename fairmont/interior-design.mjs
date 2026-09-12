// Room dressing and collision share one plan. Coordinates are at an object's
// bottom centre, matching the existing Fairmont props and actor depth sorting.
const asset=(type,x,y,scale=1,w=120,h=45)=>({type,x,y,scale,w,h});
const fixture=(type,x,y,w=150,h=55,extra={})=>({type,x,y,w,h,solid:true,...extra});
const decor=(type,x,y,w,h,extra={})=>fixture(type,x,y,w,h,{solid:false,...extra});
const person=(id,name,x,y,row,text)=>({id,name,x,y,row,text,fixed:true});
const blank=()=>({props:[],details:[],actors:[],service:null});

function ordinaryRoom(id){
 const d=blank(),p=d.props,a=d.details;
 p.push(asset('plant',230,470,1.05,58,35),asset('plant',1330,470,1.05,58,35));
 if(id==='cafe'||id==='diner'){
  a.push(fixture('counter',1090,525,460,65),decor('espresso',1120,452,235,130),decor('menu',1090,250,330,102));
  p.push(asset('shelf',1270,385,.75,140,40));
  for(const [x,y]of [[400,550],[390,825],[1120,840]]){
   a.push(fixture('cafe-table',x,y,150,55),fixture('chair',x-100,y+5,52,32),fixture('chair',x+90,y-40,52,32));
  }
  a.push(decor('rug',1060,680,450,105,{color:0x806b4c}),decor('pastries',950,457,145,62),decor('coffee-shelf',430,285,345,70));
  d.service={x:870,y:555};
  d.actors.push(person(id+'-brewer','Emil · Coffee Brewer',1280,585,0,'The grinder is the only machine in this city I want to hear before breakfast.'),person(id+'-guest-one','June',480,510,1,'I came here to read. So far I have read the pastry menu three times.'),person(id+'-guest-two','Martin',1195,795,0,'Actual coffee. In an actual cup. I am trying to remember what the delivery fee was for.'));
  if(id==='diner'){a.push(decor('griddle',1140,439,215,115));d.actors[0].name='Walt · Line Cook';}
 }else if(id==='apartment'){
  p.push(asset('bed',390,565,1.6,195,92),asset('sofa',1090,815,1.25,260,70),asset('desk',1110,500,1.2,220,65),asset('shelf',405,850,1.15,225,60));
  a.push(decor('rug',1020,740,500,230,{color:0x4e7071}),fixture('kitchenette',1100,390,370,55),fixture('coffee-table',1080,695,185,55),decor('television',920,500,120,110),decor('books',405,780,110,42));
 }else if(id==='clinic'){
  for(const x of [365,550])p.push(asset('bed',x,555,1.1,136,65));
  p.push(asset('desk',1110,510,1.3,240,65),asset('bench',435,840,1.8,270,40));
  a.push(fixture('medical-cabinet',1120,400,325,65),fixture('medical-cart',635,525,75,48),fixture('screen',1040,865,280,45),decor('rug',420,785,420,170,{color:0x73958e}),decor('first-aid',1110,233,85,80));
 }else if(['radio','gear','books'].includes(id)){
  for(const [x,y]of [[355,460],[555,460],[390,850]])p.push(asset('shelf',x,y,1.1,208,60));
  p.push(asset('desk',1110,535,1.55,282,70),asset('crates',1270,840,.8,106,42));
  a.push(fixture(id==='books'?'book-display':'parts-bins',1040,850,240,70),decor(id==='books'?'books':'electronics',1115,430,235,95),decor('rug',480,685,440,105,{color:0x62646e}));
  if(id!=='books')a.push(fixture('workbench',1120,382,350,60),decor('toolboard',445,255,400,110));
  else a.push(decor('book-art',1090,250,370,110),fixture('cafe-table',410,665,140,45));
 }else if(id==='terminal'){
  p.push(asset('bench',400,520,1.45,225,45),asset('bench',400,815,1.45,225,45),asset('desk',1120,525,1.35,244,60));
  a.push(fixture('ticket-kiosks',1120,850,300,70),decor('departures',1090,230,365,118),decor('rug',460,675,400,105,{color:0x717b86}),decor('luggage',540,830,110,80));
 }else{
  p.push(asset('desk',1080,510,1.4,250,65),asset('sofa',405,560,1.4,275,75),asset('shelf',420,850,1.1,210,50));
  a.push(fixture('coffee-table',420,700,175,45),decor('rug',440,680,480,255,{color:0x556c73}),decor('television',1110,410,150,100));
 }
 return d;
}

function hotelRoom(id){
 const d=blank(),p=d.props,a=d.details;
 if(id==='fairmont-hotel'){
  a.push(fixture('reception',1080,520,410,70),decor('key-rack',1080,240,340,112),decor('rug',710,800,410,200,{color:0x846543}),fixture('coffee-table',425,715,180,48),decor('television',440,315,200,110),decor('luggage',1080,848,145,85));
  p.push(asset('sofa',420,535,1.4,285,75),asset('sofa',425,860,1.1,225,70),asset('plant',235,460,1.2,65,40),asset('plant',1270,445,1.1,60,40));
  d.service={x:870,y:570};
  d.actors.push(person('hotel-guest','The Early Check-in',490,610,0,'I asked for a room away from the freight line. She asked which freight line.'),person('hotel-porter','Nico · Porter',1170,775,0,'The lift is for luggage. People take the stairs. The luggage has a union.'));
 }else if(id==='fairmont-hotel-upstairs'){
  a.push(decor('rug',795,665,1070,185,{color:0x806243}),fixture('linen-cart',405,858,120,55),decor('wall-art',430,230,140,90),decor('wall-art',1100,230,140,90));
  p.push(asset('bench',1100,850,1.2,190,38),asset('plant',1350,510,1.1,58,35),asset('plant',230,810,1.1,58,35));
 }else{
  p.push(asset('bed',415,580,1.65,230,100),asset('desk',1100,515,1.3,230,65),asset('sofa',1110,845,1.1,228,70),asset('plant',225,445,1,55,35));
  a.push(decor('rug',460,690,450,270,{color:0x536c85}),fixture('nightstand',270,535,78,38),fixture('wardrobe',1130,390,265,60),fixture('coffee-table',1100,707,165,45),decor('kettle',1100,435,130,78),decor('wall-art',420,223,145,96));
 }
 return d;
}

function workRoom(map){
 const d=blank(),p=d.props,a=d.details,title=(map.rooms?.[0]?.title||map.title.split(' · ').at(-1)).toLowerCase(),i=map.roomIndex,market=map.isMarket;
 // Both cross aisles remain clear. Objects stay in four work bays, leaving all
 // original doors, terminal coordinates, supplies and encounter lanes intact.
 const benches=()=>{a.push(fixture('workbench',390,512,330,60),fixture('workbench',1130,515,330,60),decor('toolboard',400,252,360,110),decor('toolboard',1110,252,340,110));};
 const storage=()=>{for(const [x,y]of [[345,480],[565,480],[1080,480],[1290,480]])p.push(asset('shelf',x,y,.8,154,50));a.push(fixture('parts-bins',380,865,290,65),fixture('parts-bins',1110,880,285,55));};
 if(i===0){
  p.push(asset('bench',390,515,1.4,214,45),asset('shelf',1130,445,.85,162,45),asset('crates',1130,875,.8,108,45));
  a.push(fixture('security-desk',1110,540,300,55),decor('departments',390,240,345,100),fixture('lockers',380,855,330,65),decor('floor-guide',770,720,170,260));
 }else if(map.boss){
  for(const [x,y]of [[330,495],[1190,465]])p.push(asset('server',x,y,1.15,108,65));
  a.push(fixture('network-bank',420,865,340,65),fixture('power-distributor',470,470,190,75),decor('circuit-floor',815,590,500,390),decor('wall-conduit',1000,260,470,80));
  if(market){a.push(fixture('power-distributor',1140,535,250,90),decor('toolboard',410,250,360,90));}
  else a.push(fixture('network-bank',1090,375,270,45),decor('containment-line',820,770,450,65));
 }else if(/office|control|routing/.test(title)){
  p.push(asset('desk',370,510,1.4,252,65),asset('desk',1120,500,1.5,264,65),asset('shelf',1180,390,.7,132,45));
  a.push(decor('electronics',370,423,190,90),decor('electronics',1115,406,220,95),fixture('filing-cabinet',530,435,98,48),fixture('meeting-table',1090,870,355,65),fixture('chair',330,550,55,30),decor('wall-chart',405,250,355,115),decor('wall-conduit',1110,240,335,70));
  if(!map.rest)a.push(fixture('filing-cabinet',1290,825,92,50));
 }else if(i===2||/stockroom|storage|reserve|components/.test(title)){
  storage();a.push(decor('wall-conduit',960,240,580,75),decor('pallet-lane',785,545,190,270));
  p.push(asset('crates',470,875,.85,112,42),asset('crates',1285,865,.8,104,42));
  if(map.rest){a.push(decor('first-aid',1120,280,85,85),fixture('medical-cabinet',1140,515,265,65));d.props=d.props.filter(x=>x.x<900);}
 }else if(/demonstration|premium|consumer/.test(title)){
  for(const [x,y]of [[375,515],[1135,515]]){a.push(fixture('display-plinth',x,y,245,50));p.push(asset('droneDock',x,y-40,1.1,0,0));}
  p.push(asset('shelf',365,875,1.3,248,55),asset('shelf',1140,875,1.3,248,55));
  a.push(decor('wall-chart',385,245,360,108),decor('product-screen',1125,250,325,112),decor('rug',770,670,310,180,{color:0x667f82}));
 }else if(/weld|assembly|repair|returned/.test(title)){
  benches();p.push(asset('assemblyArm',435,480,1.12,130,55),asset('conveyor',1110,865,1.2,305,65),asset('crates',365,870,.85,110,45));
  a.push(fixture('press',1120,510,230,90),decor('safety-line',1130,580,330,25),fixture('tool-trolley',555,860,95,50));
 }else if(/test|validation|flight|calibration|isolation|sensor/.test(title)){
  a.push(fixture('test-rig',385,515,310,70),fixture('test-rig',1140,510,305,70),fixture('network-bank',1110,875,320,60),decor('test-grid',770,610,230,250),decor('wall-chart',380,250,335,105),decor('product-screen',1110,250,335,105));
  p.push(asset('droneDock',390,470,.95,0,0),asset('console',405,855,1.1,105,42));
  if(/flight/.test(title))a.push(decor('flight-rings',800,480,195,210));
 }else if(/freight|receiving|intake|loading/.test(title)){
  storage();p.push(asset('conveyor',420,510,1.1,275,60),asset('crates',1120,510,1.4,175,75));a.push(decor('safety-line',415,575,380,25),decor('cargo-scale',780,510,210,150));
 }else{
  // Access/stair rooms still serve a department: service lockers, electrical
  // equipment and maintenance carts make their generous area purposeful.
  a.push(fixture('lockers',375,485,335,65),fixture('power-distributor',1110,490,280,80),fixture('tool-trolley',430,860,105,50),decor('wall-conduit',1030,245,495,80),decor('departments',395,245,320,98));
  p.push(asset('shelf',1115,875,1.2,225,55));
 }
 a.push(decor('floor-drain',600,875,75,32),decor('floor-drain',1295,580,55,26));
 return d;
}

export function interiorDesignFor(location,map=null){
 if(map?.baseId)return workRoom(map);
 if(location==='fairmont-hotel'||location.startsWith('fairmont-hotel-'))return hotelRoom(location);
 return ordinaryRoom(location.replace(/^fairmont-/,''));
}

export function furnishingObstacles(design){
 return [...design.props,...design.details.filter(p=>p.solid)].filter(p=>p.w>0&&p.h>0).map(p=>({x:p.x-p.w/2,y:p.y-p.h,w:p.w,h:p.h}));
}

// Small code-native fixtures complement the illustrated atlas: layered fronts,
// inset controls, handles, cables and work surfaces, all on a coarse pixel grid.
export function drawInteriorDetails(scene,design){
 return design.details.map(d=>drawFixture(scene,d));
}
function drawFixture(scene,d){
 const g=scene.add.graphics().setPosition(d.x,d.y).setDepth(d.solid?d.y:(['rug','floor-guide','floor-drain','safety-line','circuit-floor','test-grid','pallet-lane','cargo-scale','containment-line'].includes(d.type)?-27:d.y));
 const w=d.w,h=d.h,rect=(x,y,ww,hh,c,a=1)=>g.fillStyle(c,a).fillRect(Math.round(x),Math.round(y),Math.round(ww),Math.round(hh));
 const edge=(x,y,ww,hh,c=0x263741)=>g.lineStyle(3,c).strokeRect(x,y,ww,hh);
 const box=(width=w,height=h,color=0x526873)=>{rect(-width/2+8,-height+10,width,height,0x14252e,.23);rect(-width/2,-height,width,height,color);rect(-width/2,-height-15,width,18,0x9aacad);edge(-width/2,-height-15,width,height+15);rect(-width/2+8,-8,width-16,8,0x263944);};
 const cup=(x,y)=>{rect(x-8,y-14,16,16,0xeee0bd);rect(x-5,y-13,10,4,0x48372d);edge(x+6,y-10,7,9,0xd7c9ab);};
 const screen=(x,y,width=55,height=38)=>{rect(x,y,width,height,0x263c48);rect(x+5,y+5,width-10,height-10,0x537b80);for(let j=0;j<3;j++)rect(x+11,y+11+j*7,width*(.3+j*.1),3,j===1?0xc5c992:0x8ec3b6);rect(x+width/2-4,y+height,8,10,0x65747a);};
 const screws=()=>{for(const x of [-w/2+9,w/2-9])for(const y of [-h+9,-9])rect(x,y,4,4,0xd4d6c5);};
 if(['rug','floor-guide','pallet-lane','cargo-scale','circuit-floor','test-grid','containment-line'].includes(d.type)){
  const c=d.color||0x66848b;rect(-w/2,-h,w,h,c,d.type==='rug'?.7:.22);edge(-w/2+7,-h+7,w-14,h-14,d.type==='rug'?0xbda77c:0xa6b9a5);
  if(d.type==='rug'){edge(-w/2+17,-h+17,w-34,h-34,0x8e9a94);for(let x=-w/2+30;x<w/2-20;x+=48)rect(x,-h+25,8,h-50,0xb9b19b,.2);}
  else for(let y=-h+30;y<0;y+=38)for(let x=-w/2+20;x<w/2;x+=38){rect(x,y,12,2,0xb6cfc9,.55);rect(x,y,2,12,0xb6cfc9,.55);}
  return g;
 }
 if(d.type==='floor-drain'){rect(-w/2,-h,w,h,0x253944);for(let x=-w/2+5;x<w/2;x+=9)rect(x,-h+3,4,h-6,0x859394);return g;}
 if(d.type==='safety-line'){for(let x=-w/2;x<w/2;x+=22)rect(x,-h,17,h,Math.round(x/22)%2?0xc5a75c:0x405158);return g;}
 if(['menu','key-rack','coffee-shelf','book-art','wall-art','toolboard','departures','departments','wall-chart','product-screen'].includes(d.type)){
  rect(-w/2-6,-h-6,w+12,h+12,0x493d35);rect(-w/2,-h,w,h,['menu','departures'].includes(d.type)?0x243a3a:0x748487);edge(-w/2,-h,w,h,0xd1b180);
  if(d.type==='wall-art'||d.type==='book-art'){rect(-w/2+12,-h+12,w-24,h-24,0x467680);for(let j=0;j<6;j++)rect(-w/2+20+j*w/7,-h*.35-j%3*12,w/9,h*.3+j%3*12,0x273f52);}
  else for(let row=0;row<3;row++)for(let col=0;col<5;col++){const x=-w/2+18+col*(w-30)/5,y=-h+18+row*(h-24)/3;rect(x,y,d.type==='key-rack'?7:(w-40)/7,4,0xd7cda9);rect(x+4,y+8,d.type==='toolboard'?5:13,10,d.type==='key-rack'?0xcba96b:0xadc5b6);}
  return g;
 }
 if(['counter','reception','workbench','security-desk','kitchenette'].includes(d.type)){
  box(w,h,['counter','reception'].includes(d.type)?0x795843:0x5c727c);
  for(let x=-w/2+12;x<w/2-20;x+=w/4){edge(x,-h+8,w/4-16,h-24,0x38454a);rect(x+10,-h+18,28,5,0xbdc1ae);}
  if(d.type==='reception'||d.type==='security-desk'){screen(-55,-h-70,90,48);rect(45,-h-35,55,22,0xe5d6b0);cup(w/2-45,-h-18);}
  if(d.type==='workbench'){screen(-80,-h-60);for(let j=0;j<5;j++)rect(30+j*17,-h-27,10,5,0xc39b5d);}
  if(d.type==='kitchenette'){rect(25,-h-8,75,26,0x23353d);edge(30,-h-7,65,20,0xc5c6b5);rect(-90,-h-23,45,35,0x27363a);}
 }else if(['cafe-table','coffee-table','meeting-table'].includes(d.type)){
  rect(-w/2+12,-10,11,24,0x3e3938);rect(w/2-23,-10,11,24,0x3e3938);box(w,h,0x886b4e);rect(-w/2+8,-h-13,w-16,12,0xb4966c);cup(-w/4,-h-10);cup(w/4,-h-10);rect(-20,-h-16,45,19,0xd5c7a4);for(let j=0;j<3;j++)rect(-16,-h-12+j*4,30,2,0x88776d);
 }else if(d.type==='chair'){
  box(w,h,0x765444);rect(-w/2,-h-38,w,35,0xa08667);edge(-w/2,-h-38,w,35);rect(-w/2+6,-h-29,w-12,12,0x565b5d);
 }else if(d.type==='espresso'||d.type==='griddle'){
  box(w,h*.6,0x889a9b);rect(-w/2+8,-h*.6-30,w-16,30,0x334851);screen(-w/2+20,-h*.6-24,38,20);for(let j=0;j<3;j++){const x=-10+j*52;rect(x,-h*.6+15,8,26,0x263b44);cup(x+3,-14);}rect(-w/2+12,-8,w-24,4,0xd4d9c6);rect(w/2-36,-h-10,32,50,0x293e48);rect(w/2-34,-h-30,28,25,0xb4c1b8);
 }else if(d.type==='pastries'){
  box(w,h*.6,0x514744);rect(-w/2+5,-h,w-10,h*.65,0xa4c5bf,.62);edge(-w/2+5,-h,w-10,h*.65,0xc3cbb7);for(let j=0;j<4;j++){rect(-w/2+15+j*29,-h*.4,21,13,0xcf9f58);rect(-w/2+18+j*29,-h*.4,15,4,0xe8c47f);}
 }else if(['parts-bins','book-display','filing-cabinet','lockers','medical-cabinet','wardrobe'].includes(d.type)){
  const tall=['lockers','medical-cabinet','wardrobe'].includes(d.type);box(w,tall?h+110:h+40,tall?0x708486:0x596c77);
  for(let x=-w/2+8;x<w/2-14;x+=w/Math.max(2,Math.round(w/70)))for(let y=-(tall?h+95:h+25);y<-15;y+=34){rect(x,y,Math.min(54,w/3),25,d.type==='book-display'?0x6d5147:0x354f5b);rect(x+8,y+5,22,6,0xc4b894);if(d.type==='book-display')for(let j=0;j<4;j++)rect(x+4+j*10,y+9,7,13,[0xbc7054,0xc7b474,0x608c91,0x94728a][j]);}
 }else if(['network-bank','ticket-kiosks','electronics','television'].includes(d.type)){
  const count=d.type==='television'?1:Math.max(2,Math.round(w/90));if(d.solid)box();
  for(let j=0;j<count;j++){const x=-w/2+j*w/count+6;screen(x,-h-(d.solid?45:0),w/count-14,d.type==='television'?h:55);if(d.solid)for(let k=0;k<3;k++)rect(x+7,-h+14+k*11,w/count-26,4,k===1?0x98b6a5:0x293f4d);}
 }else if(['press','test-rig','power-distributor'].includes(d.type)){
  box(w,h,0x536974);rect(-w/2,-h-120,28,120,0x8b9d9d);rect(w/2-28,-h-120,28,120,0x8b9d9d);rect(-w/2,-h-135,w,24,0xb7bca8);edge(-w/2,-h-135,w,24);for(let j=0;j<3;j++)rect(-w/2+43+j*45,-h-100,17,80,0x30434b);
  if(d.type==='press'){rect(-w/2+35,-h-65,w-70,28,0xaa9769);rect(-40,-h-44,80,36,0x334851);}else{screen(-w/2+40,-h-108,w-80,70);}
  rect(-w/2+12,-h+15,12,12,0x7fb89e);rect(-w/2+32,-h+15,12,12,0xd9b572);screws();
 }else if(d.type==='wall-conduit'){
  for(let j=0;j<3;j++){rect(-w/2,-h+18+j*17,w,9,[0x586d79,0xb5a56d,0x81969a][j]);for(let x=-w/2+35;x<w/2;x+=75)rect(x,-h+12+j*17,9,21,0x394d59);}
 }else if(d.type==='first-aid'){
  rect(-w/2,-h,w,h,0xc0d3c7);edge(-w/2,-h,w,h);rect(-10,-h+12,20,h-24,0x579079);rect(-w/2+12,-h/2-10,w-24,20,0x579079);
 }else if(d.type==='flight-rings'){
  for(let j=0;j<3;j++){const ww=w-j*46;edge(-ww/2,-h+j*36,ww,Math.max(24,ww*.55),j%2?0x798fa0:0xa9b5ad);}
 }else if(d.type==='screen'){
  box(w,h+105,0x9eafa5);for(let x=-w/2+12;x<w/2-10;x+=25)rect(x,-h-90,9,h+75,0x7c9993);rect(-w/2+10,0,14,8,0x253b45);rect(w/2-24,0,14,8,0x253b45);
 }else{
  box(w,h,0x747b73);for(let j=0;j<3;j++){rect(-w/2+14+j*(w-30)/3,-h-32,Math.max(12,w/5),30,[0x9c8b6c,0x627c83,0xa6b5a3][j]);}screws();
 }
 return g;
}
