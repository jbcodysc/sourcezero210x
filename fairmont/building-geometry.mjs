// Dimensions after the same magenta removal and alpha trimming used by art.mjs.
// Map allocations are maximum drawing sizes, not building collision rectangles.
export const BUILDING_ART_SIZES={
 hotel:[354,482],radio:[331,403],market:[422,480],cafe:[313,404],
 apartment:[307,369],warehouse:[351,346],facility:[437,392],terminal:[315,304],
 'hotel-two-storey':[1076,807],
};

export function buildingType(b){
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

export function buildingGeometry(b){
 const type=buildingType(b),[width,height]=BUILDING_ART_SIZES[b.id==='hotel'?'hotel-two-storey':type];
 const scale=Math.min(b.w/width,b.h/height),w=width*scale,h=height*scale;
 const x=b.x+b.w/2,y=b.y+b.h;
 // Solid ground base, with the upper walls and roof free to overlap people behind it.
 const inset=w*.035,depth=Math.max(60,Math.min(132,h*.19));
 const footprint={x:x-w/2+inset,y:y-depth,w:w-inset*2,h:depth-5};
 return {type,x,y,w,h,scale,facade:{x:x-w/2,y:y-h,w,h},footprint};
}

export const buildingFootprint=b=>buildingGeometry(b).footprint;
export function rearServiceEntrance(b){
 const {x,footprint}=buildingGeometry(b);
 return {x,y:footprint.y-36,side:'north',facing:'down'};
}
