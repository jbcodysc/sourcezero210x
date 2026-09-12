import {touchingBounds} from './encounter-contact.mjs';

// Ground depth still determines front/behind. Roofs become translucent while
// someone is behind them. Canopies also draw below overlapping characters so
// neither the player nor a wandering NPC disappears into foliage.
export function updateWorldOcclusion(objects,actors){
 for(const {sprite,kind}of objects||[]){
  if(!sprite?.active||!sprite.getBounds)continue;
  const bounds=sprite.getBounds();let covered=false;
  for(const actor of actors){
   if(!actor?.sprite?.active||actor.sprite.visible===false||actor.y>sprite.depth)continue;
   if(touchingBounds(bounds,actor.sprite.getBounds())){
    covered=true;
    if(kind==='tree')actor.sprite.setDepth(Math.max(actor.sprite.depth,sprite.depth+.5));
   }
  }
  sprite.setAlpha(covered?(kind==='tree'?.28:.32):1);
 }
}
