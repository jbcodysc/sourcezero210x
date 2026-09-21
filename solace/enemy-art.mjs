const ENEMY_RECTS={
 cleaner:{map:[100,80,290,235],battle:[515,0,440,340]},
 porter:{map:[95,375,300,300],battle:[490,340,465,345]},
 maintenance:{map:[100,755,310,325],battle:[530,670,405,420]},
 containment:{map:[120,1150,230,375],battle:[550,1090,320,446]}
};
export function preloadSolaceEnemies(scene){if(!scene.textures.exists('solace-enemies-raw'))scene.load.image('solace-enemies-raw',new URL('./assets/residential-enemies.png',import.meta.url).href);}
export function prepareSolaceEnemies(scene){
 const source=scene.textures.get('solace-enemies-raw').getSourceImage();
 for(const [name,views]of Object.entries(ENEMY_RECTS))for(const [view,[x,y,w,h]]of Object.entries(views)){
  const key=`solace-${name}-${view}`;if(scene.textures.exists(key))continue;
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingEnabled=false;ctx.drawImage(source,x,y,w,h,0,0,w,h);
  const pixels=ctx.getImageData(0,0,w,h);let left=w,top=h,right=0,bottom=0;
  // A neighboring row's antenna/wheel can enter the loose atlas rectangle.
  // Keep the main connected silhouette rather than importing those fragments.
  if(view==='battle'&&(name==='porter'||name==='maintenance')){
   const seen=new Uint8Array(w*h);let largest=[];
   for(let seed=0;seed<w*h;seed++){if(seen[seed]||pixels.data[seed*4+3]<32)continue;const component=[seed];seen[seed]=1;for(let q=0;q<component.length;q++){const at=component[q],xx=at%w,yy=Math.floor(at/w);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=xx+dx,ny=yy+dy;if(nx<0||ny<0||nx>=w||ny>=h)continue;const next=ny*w+nx;if(!seen[next]&&pixels.data[next*4+3]>=32){seen[next]=1;component.push(next);}}}if(component.length>largest.length)largest=component;}
   const keep=new Uint8Array(w*h);for(const i of largest)keep[i]=1;for(let i=0;i<w*h;i++)if(!keep[i])pixels.data[i*4+3]=0;
  }
  for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){const i=(yy*w+xx)*4;if(pixels.data[i+3]<32){pixels.data[i+3]=0;continue;}left=Math.min(left,xx);top=Math.min(top,yy);right=Math.max(right,xx);bottom=Math.max(bottom,yy);}
  ctx.putImageData(pixels,0,0);const trim=document.createElement('canvas');trim.width=right-left+1;trim.height=bottom-top+1;trim.getContext('2d').drawImage(canvas,left,top,trim.width,trim.height,0,0,trim.width,trim.height);const texture=scene.textures.addCanvas(key,trim);texture.setFilter(0);texture.add('portrait',0,0,0,trim.width,trim.height);
 }
}
