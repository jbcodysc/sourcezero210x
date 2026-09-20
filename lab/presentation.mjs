// The original opening-arc battle's rolling, three-colour interference pattern.
export const BATTLE_COLORS = Object.freeze(['#293f57','#436e75','#79876f']);
export function drawBattleBackdrop(context,time){
 for(let y=0;y<240;y+=2){
  const wave=Math.sin(y*.052+time*.0006)*30;
  for(let x=0;x<384;x+=6){
   const z=Math.sin(x*.03+wave*.08+time*.0004)+Math.sin(y*.08-time*.001);
   context.fillStyle=BATTLE_COLORS[z>.55?2:z>-.45?1:0];context.fillRect(x,y,6,2);
  }
 }
 context.fillStyle='#16283b44';context.fillRect(0,0,384,240);
}

// Reveal a complete message without changing its layout as letters arrive.
export class Typewriter {
 constructor(text,charactersPerSecond=48,slowRanges=[]){this.characters=Array.from(text);this.rate=charactersPerSecond;this.elapsed=0;this.count=0;if(slowRanges.length){let time=0;this.schedule=this.characters.map((_,index)=>time+=1000/(slowRanges.find(r=>index>=r.start&&index<r.end)?.rate||this.rate));}}
 get done(){return this.count>=this.characters.length;}
 get text(){return this.characters.slice(0,this.count).join('');}
 advance(milliseconds){if(this.done)return this.text;if(Number.isFinite(milliseconds)&&milliseconds>0){this.elapsed+=milliseconds;if(this.schedule){while(!this.done&&this.elapsed>=this.schedule[this.count])this.count++;}else this.count=Math.min(this.characters.length,Math.floor(this.elapsed*this.rate/1000));}return this.text;}
 finish(){this.elapsed=this.duration;this.count=this.characters.length;return this.text;}
 get duration(){return this.schedule?.at(-1)??this.characters.length/this.rate*1000;}
}

// World coordinates become percentages so a dialogue stays beside its speaker.
export function dialogueAnchor(speaker,world,viewport,box){
 const margin=12,scaleY=viewport.height/world.height;
 const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
 const left=clamp(speaker.x/world.width*viewport.width-box.width/2,margin,viewport.width-box.width-margin);
 const above=(speaker.y-135)*scaleY-box.height-10;
 const top=clamp(above>=margin?above:speaker.y*scaleY+12,margin,viewport.height-box.height-margin);
 return {x:left/viewport.width*100,y:top/viewport.height*100};
}
