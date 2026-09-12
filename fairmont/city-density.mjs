import {buildingGeometry} from './building-geometry.mjs';

// Keep the commons intact while bringing the working city into compact blocks.
// Positions describe the visible roof corner, not an oversized art allocation.
export const CITY_LAYOUT_VERSION=2;
export const COMPACT_CITY_FLAG='CH2_COMPACT_CITY_LAYOUT_V2';
export const COMPACT_CITY={width:4190,height:3770};
export const COMPACT_ROADS={horizontal:[1100,1930,2790,3580],vertical:[750,2840],verticalStarts:{750:1100}};
export const COMPACT_ARRIVAL={x:760,y:3460};
const layout={
 terminal:[100,2940,570,550],hotel:[970,2930,700,525],
 diner:[1550,1240,470,580],apartment:[2230,2930,500,550],
 clinic:[3010,2930,500,550],radio:[990,1240,530,580],
 cafe:[1750,2930,430,550],gear:[2090,1240,580,580],
 market:[985,2080,1120,600],books:[2220,410,530,500],
 facility:[3040,270,650,650],freight:[3010,1240,630,600],
 supplier:[3010,2080,640,600],civic:[100,2080,510,600],
 homes:[100,1240,510,580],utility:[2090,2080,580,600],
 dispatch:[3710,2080,420,420],lofts:[3690,1240,440,530],
};

function place(b,left,top,w,h){
 const result={...b,x:0,y:0,w,h},geo=buildingGeometry(result);
 result.x=left-(w-geo.w)/2;result.y=top-(h-geo.h);
 result.door={x:left+geo.w/2,y:top+geo.h+50};
 return result;
}
export const compactBuilding=b=>layout[b.id]?place(b,...layout[b.id]):b;
export const INFILL_BUILDINGS=[
 place({id:'market-annex',name:'',type:'apartment',enter:false,decorative:true},1580,2080,440,580),
 place({id:'rail-workers-homes',name:'',type:'apartment',enter:false,decorative:true},3520,2930,580,550),
];

// These alleys cross blocks between streets, so density never forces a long walk
// around a continuous row. Their complete north/south routes are tested.
export const CROSS_BLOCK_ALLEYS=[
 {x:1518,from:1260,to:1900},{x:2045,from:1260,to:1900},
 {x:1545,from:2100,to:2760},{x:2055,from:2100,to:2760},
 {x:1710,from:2950,to:3550},{x:2200,from:2950,to:3550},
 {x:3650,from:1260,to:1900},{x:3650,from:2100,to:2760},
 {x:3460,from:2950,to:3550},
];

export const CITY_NPC_POINTS={
 commuter:{x:865,y:3470},'courier-local':{x:2750,y:3280},
 technician:{x:2960,y:1480},shopper:{x:1750,y:1870},
 reader:{x:2720,y:1030},worker:{x:2960,y:2240},
 neighbor:{x:920,y:2860},'service-local':{x:630,y:2010},
};
export const CITY_FIXTURES={
 lamps:COMPACT_ROADS.horizontal.flatMap(y=>[600,2960,4060].map(x=>({x,y:y-140}))),
 bus:{x:510,y:3690,width:365},departureBoard:{x:605,y:3700},
};
export const CITY_PATROLS=[{x:3010,y:1100},{x:3990,y:1930},{x:750,y:1480},{x:2840,y:2440},{x:2200,y:2790},{x:2840,y:3490}];

function remap(value,oldStops,newStops){
 if(value<=oldStops[0])return newStops[0];
 for(let i=1;i<oldStops.length;i++)if(value<=oldStops[i])return newStops[i-1]+(value-oldStops[i-1])/(oldStops[i]-oldStops[i-1])*(newStops[i]-newStops[i-1]);
 return newStops.at(-1);
}
/** Only for a pre-layout-2 saved outdoor position; room coordinates never change. */
export function compactLegacyCityPoint(point){
 if(!Number.isFinite(point?.x)||!Number.isFinite(point?.y))return {...COMPACT_ARRIVAL};
 return {
  x:remap(point.x,[0,2100,3300,4800],[0,2100,2840,COMPACT_CITY.width]),
  y:remap(point.y,[0,1100,2100,3400,4200,4500],[0,1100,1930,2790,3580,COMPACT_CITY.height]),
 };
}

/** Run when a saved adventure first loads any Fairmont area. New arrivals are
 * tagged by the arrive event. Loading an old interior only adds the tag: its
 * coordinates and every later doorway destination already use the new layout. */
export function migrateCompactCityLayout(progress,location,entry){
 const point={...(entry||COMPACT_ARRIVAL)};
 progress.flags||={};
 if(progress.flags[COMPACT_CITY_FLAG])return point;
 const savedOutdoors=location==='fairmont'&&progress.location==='fairmont';
 const migrated=savedOutdoors?compactLegacyCityPoint(point):point;
 progress.flags[COMPACT_CITY_FLAG]=true;
 if(savedOutdoors)progress.position={...migrated};
 return migrated;
}
