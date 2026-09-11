export function conversationAnchor(speaker,world,viewport,box,hero=false){
 const margin=12,clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
 const x=speaker.x/world.width*viewport.width,y=speaker.y/world.height*viewport.height;
 const left=hero?x+24:x-box.width-24;
 const above=y-135/world.height*viewport.height-box.height-10;
 const below=y+18;
 const top=hero?(below+box.height<=viewport.height-margin?below:above):(above>=margin?above:below);
 return {x:clamp(left,margin,viewport.width-box.width-margin)/viewport.width*100,y:clamp(top,margin,viewport.height-box.height-margin)/viewport.height*100};
}
