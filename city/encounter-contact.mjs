// Use world-space sprite rectangles, including touching edges, for encounter contact.
export const POST_BATTLE_IMMUNITY_MS=2000;
export const postBattleImmune=(state,now=performance.now())=>now<(state.encounterImmunityUntil||0);
export function grantPostBattleImmunity(state,now=performance.now()){state.encounterImmunityUntil=now+POST_BATTLE_IMMUNITY_MS;}

export function touchingBounds(a,b){
 return a.x<=b.x+b.width&&a.x+a.width>=b.x&&a.y<=b.y+b.height&&a.y+a.height>=b.y;
}

// Encounter boxes enclose the entire visible actor, rather than its walking
// footprint. Padding catches outlines and touching head/foot pixels consistently.
export function encounterBounds(actor,padding=3){
 const r=actor.sprite.getBounds();
 const x=Math.min(r.x,r.x+r.width),y=Math.min(r.y,r.y+r.height);
 return {x:x-padding,y:y-padding,width:Math.abs(r.width)+padding*2,height:Math.abs(r.height)+padding*2};
}

// Continuous relative AABB test: fast movement cannot step across contact
// between two rendered frames. Frame animation uses the larger box that frame.
export function sweptTouchingBounds(a0,a1,b0,b1){
 if(touchingBounds(a0,b0)||touchingBounds(a1,b1))return true;
 let entry=0,exit=1;
 for(const [axis,size]of [['x','width'],['y','height']]){
  const relative=a0[axis]-b0[axis];
  const velocity=(a1[axis]-a0[axis])-(b1[axis]-b0[axis]);
  const low=-Math.max(a0[size],a1[size]),high=Math.max(b0[size],b1[size]);
  if(Math.abs(velocity)<1e-9){if(relative<low||relative>high)return false;continue;}
  const t0=(low-relative)/velocity,t1=(high-relative)/velocity;
  entry=Math.max(entry,Math.min(t0,t1));exit=Math.min(exit,Math.max(t0,t1));
  if(entry>exit)return false;
 }
 return entry<=exit;
}
