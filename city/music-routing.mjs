// Shared by initial scene entry and browser back/forward-cache restoration.
export function explorationMusicMode(scene){
 if(scene.argusEntrance||scene.argusDialogue)return 'argus-entrance';
 if(scene.cutscene)return 'narration';
 if(scene.map)return scene.map.isMarket?'dungeon':'factory';
 if(scene.floor||scene.location==='water')return 'dungeon';
 if(scene.location==='fairmont')return 'fairmont-city';
 if(scene.location?.startsWith('fairmont-'))return 'fairmont-interior';
 if(scene.location==='city')return 'city';
 return scene.location==='lab'?'lab':'interior';
}
export function combatMusicMode(scene){
 if(scene.transition)return 'transition';
 if(scene.battle.phase==='defeat')return 'defeat';
 if(scene.battle.phase==='victory')return 'victory';
 return scene.battle.id==='argus'?'argus-battle':'battle';
}
