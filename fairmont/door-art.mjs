// Pixel-aligned glass, metal rails and sensor hardware embedded in the room shell.
export function drawElectronicDoor(scene,door,locked=false){
 const g=scene.add.graphics().setPosition(door.x,door.y).setDepth(door.side==='south'?door.y:door.y+1);
 const side=['west','east'].includes(door.side),w=side?62:184,h=side?202:142,x=-w/2,y=side?-h/2:door.side==='south'?-28:-h+28;
 const fill=(c,a=1)=>g.fillStyle(c,a),rect=(c,dx,dy,rw,rh,a=1)=>{fill(c,a);g.fillRect(x+dx,y+dy,rw,rh);};
 rect(0x15242f,-6,-6,w+12,h+12);rect(0x6c8692,0,0,w,h);rect(0xb9c6c7,3,3,w-6,5);rect(0x354b5b,5,9,w-10,h-14);rect(0x93a7ac,8,10,4,h-19);rect(0x172734,w-12,10,4,h-18);
 rect(0x102e40,16,17,w-32,h-33);rect(0x356073,19,20,w-38,h-40);rect(0x173d51,23,24,w-46,h-48);
 // Two glass leaves: fine horizontal lamination and sharply cut reflections.
 for(let yy=32;yy<h-28;yy+=13)rect(0x6bb4c4,24,yy,w-48,1,.24);
 rect(0x122d3c,w/2-2,19,4,h-36);rect(0x81c8d4,w/2+2,23,2,h-46,.7);
 for(let i=0;i<3;i++)rect(0xbcebf0,26+i*4,25+i*6,Math.max(3,w/2-43),3,.28-i*.06);
 rect(0x9eafb0,10,h-15,w-20,5);rect(0x243848,9,h-9,w-18,4);
 rect(0x071922,w/2-19,5,38,8);rect(locked?0xefb573:0x68e2ec,w/2-15,7,30,3);
 rect(0x172a36,w-19,h/2-14,15,29);rect(0x8bb8c4,w-17,h/2-12,11,24);rect(0x133744,w-15,h/2-10,7,15);rect(locked?0xe6a35f:0x8becdd,w-14,h/2-7,5,5);
 for(const xx of [6,w-9])for(const yy of [7,h-8])rect(0xd5d9c9,xx,yy,3,3);
 return g;
}
