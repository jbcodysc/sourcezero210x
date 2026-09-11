// Source bounds follow complete silhouettes, not the atlas's approximate grid.
// Hotel, town hall and tree roots extend below the first 256-pixel row.
export const CITY_FRAMES={
 'building-0':[18,10,227,243], 'building-1':[271,54,227,202],
 'building-2':[524,15,233,243], 'building-3':[779,10,237,251],
 'building-4':[1036,10,232,247], 'building-5':[12,302,233,200],
 'building-6':[265,314,239,184], 'building-7':[520,314,238,181],
 'building-8':[774,332,247,163], 'building-9':[1037,309,229,187],
 'building-10':[10,534,237,205], 'building-11':[269,536,235,205],
 'building-12':[522,530,236,211], 'building-13':[774,522,244,226],
 'building-14':[1037,513,230,238],
 tree:[1302,32,213,231], fountain:[1297,330,222,168], benches:[1300,569,216,184]
};
export const FACADE_WIDTH=490;
// Plaques attach to facade surfaces; grocery and hotel already have painted signs.
export const BUILDING_SIGNS={
 lab:{text:'BELLWETHER LAB',rise:183,width:242},
 hall:{text:'TOWN HALL',rise:223,width:183},
 plant:{text:'PLANT 4 · SERVICE',rise:155,width:253},
 library:{text:'PUBLIC LIBRARY',rise:235,width:240},
 clinic:{text:'MERCY STREET CLINIC',rise:158,width:305},
 beck:{text:'BECK’S REPAIR',rise:173,width:245},
 diner:{text:'HARVEST DINER',rise:201,width:270},
 post:{text:'POST OFFICE',rise:188,width:230},
 water:{text:'WATERWORKS',rise:169,width:219}
};
