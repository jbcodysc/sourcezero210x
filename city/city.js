import {loadCharacterSheets} from './character-sheets.mjs';
import {LOCATIONS as FAIRMONT_LOCATIONS,ARRIVAL as FAIRMONT_ARRIVAL} from '../fairmont/world.mjs';
import {transition as fairmontTransition} from '../fairmont/story.mjs';
import {createFairmontScene,finishFairmontBattle,abortFairmontBattle,markDefeated as defeatFairmontSpawn} from '../fairmont/scene.mjs';
import {touchingBounds,encounterBounds,sweptTouchingBounds,postBattleImmune,grantPostBattleImmunity} from './encounter-contact.mjs';
import {updateWorldOcclusion} from './occlusion.mjs';
import {CITY,VIEW,STREETS,PARK,BUILDINGS,BUILDING_PATHS,PARK_PATHS,TREES,BENCHES,ROOMS,ROOM_EXIT,OUTDOOR_NPCS,cityWalkable,roomWalkable,freeArrival,walk,pointInZone,newSpawns,updateSpawns,defeatedSpawn,contains} from './city-world.mjs';
import {canStand as labStand,normalizedMovement,direction} from '../lab/world-rules.mjs';
import {Typewriter,drawBattleBackdrop} from '../lab/presentation.mjs';
import {prepareArt,actor,drawActor} from './art.mjs';
import {FACADE_WIDTH,BUILDING_SIGNS} from './city-art-data.mjs';
import {NPCS,BEATS,FLAVOR,conversation,finishConversation,lines} from './story.mjs';
import {freshProgress,mark,award,buy,restore,playerStats,xpThreshold,SANDWICH_HEAL,SANDWICH_PRICE,VEST_DEFENSE,GEAR,equipArmor,equipVest,milestone,storyReward} from './progress.mjs';
import {SaveSlots} from './save-slots.mjs';
import {CoreGameUI} from './core-ui.mjs';
import {hasMagic} from './core-status.mjs';
import {canInteractDoor} from './doors.mjs';
import {CHAPTERS,createChapterProgress} from './chapter-start.mjs';
import {validateName} from './name-policy.mjs';
import {conversationAnchor} from './dialogue-layout.mjs';
import {isArgusLine,argusPanelMarkup,argusTextMarkup} from './argus-dialogue.mjs';
import {fitBattleText,watchBattleText} from './battle-text-layout.mjs';
import {normalizeName,resumeOpening,courierPresent,finishDelivery,finishIntro,finishPoliceReport,PICKUP,POLICE_NARRATION} from './opening.mjs';
import {BattleTransition,BATTLE_START_MS} from './transition.mjs';
import {createEncounter,playerAction,enemyAction,rollHealth,ENEMIES,livingEnemies,targetEnemy,selectTarget,encounterRewards} from './encounters.mjs';
import {CityAudio} from './audio.mjs';
import {explorationMusicMode,combatMusicMode} from './music-routing.mjs';
import {DUNGEON,WATER_FLOORS,floorData,dungeonWalkable,newDungeonSpawns,seedFoyer,updateDungeonSpawns,chaseStep,southernWalkable,floodActive,FAIRMONT_EXIT} from './waterworks.mjs';
import {prepareWaterArt,waterActor,facilityProp,drawFacility,drawSouthernRoute,drawFlood} from './waterworks-art.mjs';
const P=window.Phaser,SceneBase=P?.Scene||class {},$=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const control={up:false,down:false,left:false,right:false};
const resetControls=()=>Object.keys(control).forEach(k=>control[k]=false);
let storage;try{storage=globalThis.localStorage;}catch{}
const saveFiles=new SaveSlots(storage);
let progress=freshProgress(),saveAvailable=saveFiles.available;
const locations=new Set([...FAIRMONT_LOCATIONS,'city','plant-floor','plant-relay',...WATER_FLOORS,...BUILDINGS.map(b=>b.id)]);
if(!locations.has(progress.location))progress.location='lab';
const state={scene:null,slots:newSpawns(),dungeonSlots:{},origin:null,encounter:null,activeSlot:null};
const sound=new CityAudio(()=>{const b=$('#sound');b.innerHTML='♪ <span>'+(sound.failed?'Retry audio':sound.enabled?'Sound on':'Sound off')+'</span>';b.setAttribute('aria-label',sound.failed?'Retry audio':sound.enabled?'Turn sound off':'Turn sound on');});
function save(){if(state.activeSlot===null)return;saveAvailable=saveFiles.write(state.activeSlot,progress);}
function remember(scene){if(!scene.player||scene.cutscene||['intro','week_later'].includes(progress.opening))return;progress.location=scene.location;progress.position={x:scene.player.x,y:scene.player.y,facing:scene.player.dir};save();}
const heroName=()=>progress.name||'Alex';
const heroLines=(items,speaker=heroName())=>lines(items,speaker,heroName());
function screenMode(mode){document.body.dataset.screen=mode;$('#restart').hidden=mode!=='game';}
function textSlot(text){return '<span class="type-reserve" aria-hidden="true">'+esc(text)+'</span><span class="type-visible" data-typing aria-hidden="true"></span><span class="sr-only">'+esc(text)+'</span>';}
function beginText(scene,text,voice=0){scene.writer=new Typewriter(text,44);scene.writerNode=$('#overlay [data-typing]');scene.writtenCount=0;scene.voice=voice;}
function advanceText(scene,delta){if(!scene.writer||!scene.writerNode)return;scene.writer.advance(delta);if(scene.writtenCount!==scene.writer.count){if(scene.voice==='argus')scene.writerNode.innerHTML=argusTextMarkup(scene.writer.text);else scene.writerNode.textContent=scene.writer.text;sound.letter(scene.writer.characters[scene.writtenCount]||'',scene.voice);scene.writtenCount=scene.writer.count;}}
function finishText(scene){if(!scene.writer||scene.writer.done)return false;scene.writer.finish();advanceText(scene,0);return true;}
function sceneUI(label){$('#scene-status').hidden=false;$('#scene-status b').textContent=label;$('#prompt').hidden=true;$('#overlay').innerHTML='';$('#overlay').className='';}
function chooseKeyboardButton(e){if(document.activeElement?.matches('input,textarea'))return;const key=e.key.toLowerCase();if(!['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'].includes(key))return;const buttons=[...document.querySelectorAll('#overlay button:not(:disabled)')];if(!buttons.length)return;e.preventDefault();let i=buttons.indexOf(document.activeElement);i=(i+(['arrowleft','arrowup','w','a'].includes(key)?-1:1)+buttons.length)%buttons.length;buttons[i]?.focus();}
class StartScene extends SceneBase{
 constructor(){super('Start');}
 init(data){this.newSlot=data?.newSlot;this.phase='power';this.slot=null;this.name='Alex';this.chapter=1;}
 create(){
  state.scene=this;resetControls();screenMode('start');$('#loading').hidden=true;$('#scene-status').hidden=true;$('#prompt').hidden=true;this.input.keyboard.clearCaptures();sound.setMode('title');this.cameras.main.setBackgroundColor('#101d29');
  this.onKey=e=>{if(e.repeat)return;const k=e.key.toLowerCase();if(this.phase==='name-rejected'){if(k==='tab'){e.preventDefault();$('#overlay [data-action="name-dismiss"]').focus();return;}if(['enter','escape','z',' '].includes(k)){e.preventDefault();this.dismissNameRejection();}return;}if(this.phase==='name'){if(k==='enter'&&document.activeElement?.matches('input')){e.preventDefault();this.handleAction('name-check');}else if(k==='escape'){e.preventDefault();this.showSlots();}return;}chooseKeyboardButton(e);if(['enter','z',' '].includes(k)){e.preventDefault();(document.activeElement?.closest('#overlay button')||$('#overlay button'))?.click();}else if(k==='escape'&&this.phase!=='power'){e.preventDefault();this.showSlots();}};
  this.input.keyboard.on('keydown',this.onKey);this.events.once('shutdown',()=>{this.input.keyboard.off('keydown',this.onKey);resetControls();});
  if(Number.isInteger(this.newSlot)){this.slot=this.newSlot;this.showName();}else this.showPower();
 }
 showPower(){this.phase='power';sound.setMode('title');$('#overlay').className='start-ui';$('#overlay').innerHTML='<section class="power-screen"><small>POWER ON</small><h1>SOURCE<br><span>ZERO</span></h1><p class="title-year">210X</p><button class="power-button" data-action="power">PRESS ENTER <span>TO BEGIN</span></button></section>';$('#footer-hint').textContent='Enter or click to begin.';}
 showSlots(){this.phase='slots';sound.setMode('menu');$('#overlay').className='start-ui';$('#overlay').innerHTML='<section class="save-screen"><small>SOURCE ZERO · 210X</small><h2>Choose a file</h2><div class="save-files">'+saveFiles.slots.map((s,i)=>'<button class="save-file" data-action="slot-'+i+'"><b>'+String(i+1).padStart(2,'0')+'</b><span><strong>'+esc(s?s.name:'New game')+'</strong><small>'+(s?'LV '+s.level+' · '+esc(s.location.startsWith('fairmont')?'Fairmont Junction':BUILDINGS.find(b=>b.id===s.location)?.name||'Bellwether'):'An ordinary day, still ahead.')+'</small></span><em>'+(s?'CONTINUE':'START')+'</em></button>').join('')+'</div><p class="slot-note">'+(saveAvailable?'Three files. Each keeps its own story.':'Saving is unavailable in this browser. These files will last while this page stays open.')+'</p><button class="back-button" data-action="chapter-menu">Start at a chapter…</button><button class="back-button" data-action="erase-menu">Erase a file…</button><button class="back-button" data-action="power-back">Back</button></section>';$('#footer-hint').textContent='↑ ↓ choose · Enter select';}
 showChapters(){this.phase='chapters';sound.setMode('menu');$('#overlay').className='start-ui';$('#overlay').innerHTML='<section class="save-screen"><small>NEW CHAPTER START</small><h2>Where shall we begin?</h2><div class="save-files">'+CHAPTERS.map(c=>'<button class="save-file" data-action="chapter-'+c.id+'"><b>'+esc(c.badge||'0'+c.id)+'</b><span><strong>'+esc(c.title)+'</strong><small>'+esc(c.description)+'</small></span></button>').join('')+'</div><p>Choose a save file next. Your other files stay as they are.</p><button class="back-button" data-action="slots">Back to files</button></section>';}
 showChapterSlots(){this.phase='chapter-slots';$('#overlay').innerHTML='<section class="save-screen"><small>CHAPTER '+esc(this.chapter==='2-facility'?'2 — Drone Facility':this.chapter)+' · NEW START</small><h2>Use which file?</h2><div class="save-files">'+saveFiles.slots.map((s,i)=>'<button class="save-file" data-action="chapter-slot-'+i+'"><b>0'+(i+1)+'</b><span><strong>'+esc(s?s.name:'Empty file')+'</strong><small>'+(s?'LV '+s.level+' · You will confirm before replacing this file.':'Start here without replacing a save.')+'</small></span></button>').join('')+'</div><button class="back-button" data-action="chapter-menu">Choose another chapter</button></section>';}
 confirmChapterSlot(index){this.slot=index;this.name=saveFiles.read(index)?.name||'Alex';if(!saveFiles.read(index)){this.showName();return;}this.phase='chapter-overwrite';$('#overlay').innerHTML='<section class="save-screen"><small>FILE '+(index+1)+'</small><h2>Replace '+esc(this.name)+'?</h2><p>Starting Chapter '+esc(this.chapter==='2-facility'?'2 — Drone Facility':this.chapter)+' here replaces this file’s progress. Your other two files are kept.</p><button data-action="chapter-files">Keep this file</button><button class="erase-button" data-action="chapter-replace">Replace this file and choose a name →</button></section>';$('#overlay [data-action="chapter-files"]').focus();}
 showName(){this.phase='name';sound.setMode('menu');$('#overlay').className='start-ui';$('#overlay').innerHTML='<section class="name-screen"><small>FILE '+(this.slot+1)+' · CHAPTER '+esc(this.chapter==='2-facility'?'2 — Drone Facility':this.chapter)+'</small><h2>What’s your name?</h2><form id="name-form"><label for="hero-name">Know-it-all chemist</label><input id="hero-name" name="hero-name" type="text" maxlength="16" autocomplete="off" spellcheck="false" value="'+esc(this.name)+'"><p>Up to 16 characters. Reputation sold separately.</p><button data-action="name-check" type="button">That sounds right →</button></form><button class="back-button" data-action="slots">Back to files</button></section>';this.time.delayedCall(60,()=>{const input=$('#hero-name');input?.focus();input?.select();});$('#footer-hint').textContent='Type a name · Enter to confirm';}
 showNameCheck(){this.name=normalizeName($('#hero-name')?.value||this.name);const verdict=validateName(this.name);if(!verdict.ok){this.showNameRejection(verdict.message);return;}this.phase='confirm';$('#overlay').innerHTML='<section class="name-screen"><small>FILE '+(this.slot+1)+'</small><h2>'+esc(this.name)+'</h2><p>Know-it-all chemist.<br>'+esc(this.chapter==='2-facility'?'Begin at the Drone Facility entrance.':this.chapter===2?'Begin at Fairmont Junction.':'Ready for another ordinary day?')+'</p><button data-action="name-start">That’s me. Begin →</button><button class="back-button" data-action="name-edit">Let me think about the name.</button></section>';document.activeElement?.blur();}
 showNameRejection(message){this.phase='name-rejected';$('#overlay .name-screen').inert=true;$('#overlay').insertAdjacentHTML('beforeend','<div class="name-rejection" role="alertdialog" aria-modal="true" aria-labelledby="name-rejection-title"><div><h2 id="name-rejection-title">'+esc(message)+'</h2><button data-action="name-dismiss">Try another name</button></div></div>');$('#overlay [data-action="name-dismiss"]').focus();}
 dismissNameRejection(){$('#overlay .name-rejection')?.remove();$('#overlay .name-screen').inert=false;this.phase='name';$('#hero-name')?.focus();$('#hero-name')?.select();}
 showEraseFiles(){this.phase='erase';$('#overlay').innerHTML='<section class="save-screen"><small>SAVE FILES</small><h2>Erase which file?</h2><div class="save-files">'+saveFiles.slots.map((s,i)=>'<button class="save-file" data-action="erase-'+i+'" '+(!s?'disabled':'')+'><b>'+String(i+1).padStart(2,'0')+'</b><span><strong>'+esc(s?s.name:'Empty file')+'</strong><small>'+(s?'LV '+s.level+' · '+s.xp+' XP':'Nothing to erase')+'</small></span></button>').join('')+'</div><button class="back-button" data-action="slots">Keep my files</button></section>';$('#overlay [data-action="slots"]').focus();}
 confirmErase(index){if(!saveFiles.read(index))return;this.eraseSlot=index;this.phase='erase-confirm';$('#overlay').innerHTML='<section class="save-screen"><small>FILE '+(index+1)+'</small><h2>Erase '+esc(saveFiles.read(index).name)+'?</h2><p>This removes this file’s progress from this browser. It cannot be undone.</p><button data-action="erase-menu">Keep this file</button><button class="erase-button" data-action="erase-confirm">Erase this file</button></section>';$('#overlay [data-action="erase-menu"]').focus();}
 launch(s){progress=s;state.activeSlot=this.slot;state.slots=newSpawns();state.dungeonSlots={};state.fairmontSlots={};state.origin=null;state.encounter=null;state.encounterImmunityUntil=0;if(!locations.has(progress.location))progress.location='lab';save();$('#overlay').innerHTML='';$('#overlay').className='';$('#loading').hidden=false;this.scene.start(progress.location.startsWith('fairmont')?'Fairmont':'Explore',resumeOpening(progress));}
 handleAction(action){if(action==='chapter-menu'){this.showChapters();return;}if(CHAPTERS.some(c=>'chapter-'+c.id===action)){this.chapter=CHAPTERS.find(c=>'chapter-'+c.id===action).id;this.showChapterSlots();return;}if(action==='chapter-files'){this.showChapterSlots();return;}if(/^chapter-slot-[0-2]$/.test(action)){this.confirmChapterSlot(Number(action.slice(13)));return;}if(action==='chapter-replace'&&this.phase==='chapter-overwrite'){this.showName();return;}if(this.phase==='name-rejected'){if(action==='name-dismiss')this.dismissNameRejection();return;}if(action==='erase-menu'){this.showEraseFiles();return;}if(action==='erase-confirm'&&this.phase==='erase-confirm'){saveAvailable=saveFiles.erase(this.eraseSlot);if(saveAvailable)this.showSlots();else{if(!$('#erase-error'))$('#overlay section').insertAdjacentHTML('beforeend','<p id="erase-error" role="alert">Could not erase this file. Browser storage is unavailable. Your file has been kept.</p>');}return;}if(/^erase-[0-2]$/.test(action)){this.confirmErase(Number(action.slice(6)));return;}if(action==='power'||action==='slots')this.showSlots();else if(action==='power-back')this.showPower();else if(action.startsWith('slot-')){this.slot=Number(action.slice(5));const saved=saveFiles.read(this.slot);if(saved)this.launch(saved);else{this.chapter=1;this.name='Alex';this.showName();}}else if(action==='name-check')this.showNameCheck();else if(action==='name-edit')this.showName();else if(action==='name-start'&&validateName(this.name).ok)this.launch(createChapterProgress(this.chapter,this.name));}
}
const ROOM_CONTENT={
 homeA:['The television is showing a cooking robot patiently arguing with a potato.','A couch worn into the shape of somebody’s favorite afternoon.'],
 homeB:['A family photo, a half-finished crossword, and a remote nobody can find.','The home office has three calendars. They disagree about trash day.'],
 store:['Cereal, detergent, batteries. Shelf label: “Please do not sample the batteries.”','The checkout terminal has a handwritten note: ASK OWEN ABOUT BULK ONIONS.'],
 hotel:['A room key and a brochure: “Bellwether. You could do worse.”','A small television. Every channel is somehow a home renovation show.'],
 office:['Filing cabinets, municipal notices, and a printer awaiting emotional support.','An office plant has its own maintenance request number.'],
 workshop:['An orderly wall of tools. One wrench has been labeled “the good one.”','Parts trays, a service terminal, and cups with suspiciously permanent coffee.'],
 diner:['The menu promises real coffee. This is a legally ambitious promise.','A booth, a jukebox, and thirty years of extremely local gossip.'],
 clinic:['The waiting-room magazines contain yesterday’s future of medicine.','Clean cabinets and a reassuringly ordinary examination table.'],
 library:['A shelf of local history. The oldest photograph shows exactly the same pothole.','A reading desk. Somebody underlined the word “quiet” in the library rules.']
};
class ExploreScene extends SceneBase{
 constructor(key='Explore'){super(key);}
 init(data){this.coreUI=null;this.location=data?.location||progress.location;this.entry=data?.position||progress.position;this.cinematic=data?.cinematic||null;if(this.location==='water'&&!progress.flags.waterAccess){this.location='city';this.entry={x:3840,y:4030};}this.floor=floorData(this.location);this.cutscene=null;this.arrival=false;this.player=null;this.courier=null;this.bastion=null;this.regulator=null;this.floodGraphics=null;this.locked=false;this.dialog=null;this.menu=null;this.transitioning=false;this.npcs=[];this.enemies=new Map();this.interactables=[];this.occlusionObjects=[];this.spawnClock=0;this.returnedFromBattle=!!data?.afterBattle;}
 preload(){
  loadCharacterSheets(this);
  this.load.on('progress',n=>{const el=$('#load-percent');if(el)el.textContent=' '+Math.round(n*100)+'%';});
  this.load.on('loaderror',file=>{$('#loading').hidden=false;$('#loading').innerHTML='<p>Could not load '+esc(file.key)+'. Please reload Bellwether.</p>';});
  for(const [key,path]of Object.entries({'city-atlas':'assets/city-atlas.png',interiors:'assets/interiors.png','town-characters':'assets/town-characters.png','lab-day':'../lab/assets/lab-day.png','lab-characters':'../lab/assets/characters.png','courier-battle':'../lab/assets/courier-battle.png','water-enemies':'assets/waterworks-enemies.png','water-props':'assets/waterworks-props.png'}))if(!this.textures.exists(key))this.load.image(key,path);
 }
 create(){
  if(!['city-atlas','interiors','town-characters','lab-day','lab-characters','courier-battle','water-enemies','water-props'].every(k=>this.textures.exists(k)))return;
  state.scene=this;prepareArt(this);prepareWaterArt(this);resetControls();screenMode('game');this.writer=null;$('#loading').hidden=true;
  const building=BUILDINGS.find(b=>b.id===this.location);this.building=building;
  const chapter=$('.chapter');if(chapter)chapter.innerHTML='<span>01</span><div>BELLWETHER<small>An ordinary American afternoon</small></div>';
  sceneUI(this.floor?this.floor.title.toUpperCase():this.location==='city'?'BELLWETHER · TOWN STREETS':this.location==='plant-floor'?'PLANT 4 · ASSEMBLY':this.location==='plant-relay'?'PLANT 4 · RELAY ROOM':building?.name.toUpperCase());
  sound.setMode(this.floor||this.location==='water'?'dungeon':this.location==='city'?'city':this.location==='lab'?'lab':'interior');
  if(this.floor)this.createDungeon();else if(this.location==='city')this.createCity();else if(this.location==='lab')this.createLab();else this.createRoom();
  const fallback=this.floor?this.floor.arrival:this.location==='city'?{x:768,y:710}:this.location==='lab'?{x:768,y:838}:{x:768,y:850},actors=[...this.npcs,...(this.courier?[this.courier]:[]),...(this.bastion?[this.bastion]:[]),...(this.regulator?[this.regulator]:[])];
  const p=freeArrival(this.entry,fallback,(x,y)=>this.canStand(x,y,actors));
  this.heroOutfit=['intro','await_mira','courier_entering','courier_ready'].includes(progress.opening)?'lab':['aftermath','week_later'].includes(progress.opening)?'injured':'normal';
  this.player=actor(this,p.x,p.y,0,110,true);if(this.entry?.facing)this.player.dir=this.entry.facing;this.beginRecovery();
  if(this.location==='city'||this.floor){const world=this.floor?DUNGEON:CITY;this.cameras.main.setBounds(0,0,world.width,world.height);this.cameras.main.startFollow(this.player.sprite,true,1,1);this.cameras.main.centerOn(p.x,p.y);}else this.cameras.main.setBounds(0,0,VIEW.width,VIEW.height);
  this.keys=this.input.keyboard.addKeys({up:'W',down:'S',left:'A',right:'D',up2:'UP',down2:'DOWN',left2:'LEFT',right2:'RIGHT'});
  this.installCoreUI();
  this.input.keyboard.addCapture([13,32,37,38,39,40,90]);
  this.onResize=()=>this.positionDialogue();window.addEventListener('resize',this.onResize);
  this.events.once('shutdown',()=>{this.writer=null;window.removeEventListener('resize',this.onResize);resetControls();});
  if(!progress.visited.includes(this.location)&&BUILDINGS.some(b=>b.id===this.location))progress.visited.push(this.location);
  if(this.floor){progress.waterCheckpoint={location:this.location,position:{...this.floor.arrival}};if(!progress.visited.includes(this.location))progress.visited.push(this.location);}
  remember(this);this.cameras.main.fadeIn(230,23,46,45);
  $('#footer-hint').textContent='Talk. Listen. Take the long way home.';
  if(this.location==='plant-relay'&&progress.flags.bastionDefeated&&!progress.flags.relayTaken)this.time.delayedCall(350,()=>this.collectRelay());
  if(this.cinematic==='intro-city')this.startCityIntroduction();else if(this.cinematic==='intro-lab')this.startLabIntroduction();else if(this.cinematic==='police')this.startPoliceNarration();else if(this.location==='lab'&&progress.opening==='courier_entering')this.startCourierArrival();
 }
 createCity(){
  this.add.tileSprite(0,0,CITY.width,CITY.height,'grass').setOrigin(0).setDepth(-20);
  // Six continuous roads; sidewalks and crossings do not create extra streets.
  for(const y of STREETS.horizontal){this.add.tileSprite(0,y,CITY.width,244,'sidewalk').setOrigin(0,.5).setDepth(-18);this.add.tileSprite(0,y,CITY.width,164,'asphalt').setOrigin(0,.5).setDepth(-17);}
  for(const x of STREETS.vertical){this.add.tileSprite(x,0,244,CITY.height,'sidewalk').setOrigin(.5,0).setDepth(-18);this.add.tileSprite(x,0,164,CITY.height,'asphalt').setOrigin(.5,0).setDepth(-17);}
  const markings=this.add.graphics().setDepth(-16);markings.fillStyle(0xdddba6,.63);
  for(const y of STREETS.horizontal)for(let x=25;x<CITY.width;x+=125)if(!STREETS.vertical.some(v=>Math.abs(x-v)<180))markings.fillRect(x,y-3,48,6);
  for(const x of STREETS.vertical)for(let y=30;y<CITY.height;y+=125)if(!STREETS.horizontal.some(v=>Math.abs(y-v)<170))markings.fillRect(x-3,y,6,48);
  markings.fillStyle(0xe6e4d4,.55);for(const x of STREETS.vertical)for(const y of STREETS.horizontal)for(let i=-3;i<=3;i++){markings.fillRect(x+i*20-5,y-131,10,35);markings.fillRect(x-131,y+i*20-5,35,10);}
  for(const path of [...BUILDING_PATHS,...PARK_PATHS])this.add.tileSprite(path.x,path.y,path.w,path.h,'path').setOrigin(0).setDepth(-19);
  for(const b of BUILDINGS){
   this.add.ellipse(b.x+16,b.y-17,508,92,0x15291e,.19).setDepth(-10);
   this.add.ellipse(b.x,b.y-6,451,29,0x15291e,.25).setDepth(-9);
   const facade=this.add.image(0,0,'city-atlas','building-'+b.art).setOrigin(.5,1);facade.setScale(FACADE_WIDTH/facade.width);
   // A single depth-sorted entity keeps its wall plaque behind foreground actors.
   const building=this.add.container(b.x,b.y,[facade]).setDepth(b.y);this.occlusionObjects.push({sprite:building,kind:'building'});
   const sign=BUILDING_SIGNS[b.id];
   if(sign){
    const plaque=this.add.rectangle(0,-sign.rise,sign.width,32,0x304a42).setStrokeStyle(3,0xc2b57c);
    const label=this.add.text(0,-sign.rise,sign.text,{fontFamily:'monospace',fontSize:'17px',fontStyle:'bold',color:'#f7edc9',align:'center'}).setOrigin(.5);
    building.add([plaque,label]);
   }
   this.interactables.push({...b.door,id:'door-'+b.id,name:'Enter '+b.name,kind:'door',building:b,range:130});
  }
  this.add.ellipse(PARK.fountain.x+8,PARK.fountain.y+12,306,115,0x15291e,.23).setDepth(-10);
  const fountain=this.add.image(PARK.fountain.x,PARK.fountain.y+40,'city-atlas','fountain').setOrigin(.5,1).setScale(1.32).setDepth(PARK.fountain.y+40);
  this.fountainSprite=fountain;
  for(const {x,y}of BENCHES){this.add.ellipse(x+10,y-12,267,53,0x15291e,.2).setDepth(-10);this.add.image(x,y,'city-atlas','benches').setOrigin(.5,1).setScale(1.25).setDepth(y);}
  this.add.text(PARK.x,1810,'BELLWETHER COMMON',{fontFamily:'monospace',fontSize:'20px',color:'#455b3d',backgroundColor:'#d4d1a4',padding:{x:16,y:8}}).setOrigin(.5).setDepth(1810);
  for(const {x,y,scale}of TREES){
   this.add.ellipse(x+30*scale,y-14*scale,165*scale,49*scale,0x122c20,.18).setDepth(-10);
   this.add.ellipse(x,y-5,42*scale,16*scale,0x12251a,.3).setDepth(-9);
   this.occlusionObjects.push({sprite:this.add.image(x,y,'city-atlas','tree').setOrigin(.5,1).setScale(scale).setDepth(y),kind:'tree'});
  }
  const streetNames=['Orchard Street','Mercy Street','Clover Street','River Street'];for(let i=0;i<4;i++)this.add.text(1635,STREETS.horizontal[i]-133,streetNames[i],{fontFamily:'monospace',fontSize:'18px',color:'#e4e4bf',backgroundColor:'#3c5b51',padding:{x:8,y:4}}).setDepth(5000);
  this.add.text(3170,4010,'BUS · FAIRMONT JUNCTION →',{fontFamily:'monospace',fontSize:'17px',color:'#eee7c6',backgroundColor:'#385848',padding:{x:8,y:7}}).setDepth(4010);
  for(const spec of OUTDOOR_NPCS)this.addNPC(spec);
  for(const [id,x,y]of [['sweep',3450,1470],['ida',1280,2300],['step',1330,2290],['hal',3350,680],['nell',2610,1920]]){const n=NPCS.find(n=>n.id===id);this.addNPC({...n,x,y,zone:{x:x-50,y:y-35,w:100,h:70}});}
  this.interactables.push({id:'fountain',name:'Listen to the fountain',x:2304,y:2250,range:140,kind:'flavor',text:'The fountain carries on splashing, entirely uninterested in corporate misconduct.'});
  const sana=NPCS.find(n=>n.id==='sana'),sx=progress.flags.waterAccess?4000:3840;this.addNPC({...sana,x:sx,y:3960,zone:{x:sx,y:3960,w:0,h:0}});
  drawSouthernRoute(this,progress);this.interactables.push({...FAIRMONT_EXIT,id:'fairmont-road',name:'Take the road to Fairmont',kind:'ending',range:150});
  this.interactables.push({x:3840,y:4180,id:'flood-bank',name:'Examine the south road',kind:'flavor',text:floodActive(progress)?'The overflow has become a fast-moving stream. It runs from the waterworks outlet straight across the Fairmont approach.':'The water has drained away. The south road is passable.',range:110});
  for(const slot of state.slots)if(slot.enemy)this.addEnemy(slot.enemy);
 }
 createLab(){
  this.add.image(0,0,'lab-day').setOrigin(0).setDisplaySize(VIEW.width,VIEW.height).setDepth(-20);
  this.addNPC({id:'mira',name:'Mira',x:820,y:530,row:1,labRole:1,zone:{x:720,y:380,w:200,h:410}});
  this.addNPC({id:'nikhil',name:'Nikhil Sen',x:1060,y:750,row:0,labRole:2,zone:{x:985,y:590,w:95,h:265}});
  if(courierPresent(progress)&&progress.opening!=='courier_entering'){this.courier=actor(this,465,646,4,120);if(progress.flags.courierDone)this.courier.sprite.setTint(0x869585);this.interactables.push({id:'courier',name:progress.flags.courierDone?'Examine courier':'Talk to the courier',x:465,y:646,kind:'courier',speaker:this.courier});}
  this.interactables.push({id:'lab-exit',name:'Go outside',x:235,y:588,kind:'exit',range:120});
 }
 createRoom(){
  this.roomType=this.building?.room||'workshop';
  this.add.image(0,0,'interiors','room-'+ROOMS[this.roomType]).setOrigin(0).setDisplaySize(VIEW.width,VIEW.height).setDepth(-20);
  this.add.text(768,950,'↓ EXIT',{fontFamily:'monospace',fontSize:'21px',color:'#e2e8c9',backgroundColor:'#304c43',padding:{x:12,y:6}}).setOrigin(.5).setDepth(1000);
  this.interactables.push({...ROOM_EXIT,id:'exit',name:this.location==='plant-floor'?'Return to service counter':this.location==='plant-relay'?'Return to workshop':'Go outside',kind:'exit',range:110});
  const residents=NPCS.filter(n=>n.building===this.location&&this.location!=='water');residents.forEach((n,i)=>this.addNPC({...n,x:i%2===0?610:965,y:i<2?610:740,zone:{x:i%2===0?530:880,y:530,w:140,h:210}}));
  if(this.location==='water'){facilityProp(this,'down',768,540,220);this.interactables.push({id:'water-stairs',x:768,y:565,name:'Descend to the intake galleries',kind:'dungeon-enter',range:120});}
  if(this.location==='plant'||this.location==='plant-floor'){
   this.add.rectangle(768,419,155,96,0x314d50).setStrokeStyle(4,0xb3b59a).setDepth(418);
   this.add.text(768,410,this.location==='plant'?'SERVICE ACCESS':'RELAY ROOM',{fontFamily:'monospace',fontSize:'15px',color:'#e1e3bb',align:'center'}).setOrigin(.5).setDepth(419);
   this.interactables.push({id:'rear',name:this.location==='plant'?'Use service door':'Enter relay room',x:768,y:477,kind:'rear',range:115});
  }
  if(this.location==='plant-relay'){
   this.bastion=actor(this,800,600,3,148);if(progress.flags.bastionDefeated)this.bastion.sprite.setTint(0x6e7978);
   this.interactables.push({id:'bastion',name:progress.flags.bastionDefeated?'Talk to June':'Approach BASTION-7',x:800,y:600,kind:'boss',speaker:this.bastion,range:140});
   if(progress.flags.bastionDefeated)this.addNPC({id:'june',name:'June Calder',x:600,y:620,row:1,zone:{x:540,y:540,w:120,h:190}});
  }
  const content=ROOM_CONTENT[this.roomType];for(let i=0;i<2;i++)this.interactables.push({id:'furniture-'+i,name:i?'Look around':'Examine furnishings',x:i?1080:448,y:i?800:735,kind:'flavor',text:content[i],range:112});
  if(this.location==='player-home'){this.interactables.find(n=>n.id==='furniture-0').text='Your work bag, a cold cup of coffee, and a copy of the police report. You are dressed for another day at the lab.';this.interactables.find(n=>n.id==='furniture-1').text='Chemistry books, a comfortable couch, and a television with exactly one channel worth watching. Home.';}
 }
 createDungeon(){
  const f=this.floor;drawFacility(this,f,progress);const slots=state.dungeonSlots[f.id]||(state.dungeonSlots[f.id]=newDungeonSpawns(f));
  this.interactables.push({...f.up,id:'stairs-up',name:f.index?'Climb to '+floorData(WATER_FLOORS[f.index-1]).title:'Return to the station',kind:'stairs-up',range:135});
  if(f.index<3)this.interactables.push({...f.down,id:'stairs-down',name:'Descend to '+floorData(WATER_FLOORS[f.index+1]).title,kind:'stairs-down',range:135});
  for(const supply of f.supplies)this.interactables.push({...supply,name:'Open the reserve locker',kind:'dungeon-supply',range:125});
  if(f.rest)this.interactables.push({...f.rest,name:'Use the first-aid cabinet',kind:'dungeon-rest',range:125});
  if(f.index===3){this.interactables.push({...f.vest,id:'insulated-vest',name:'Inspect the insulated equipment locker',kind:'vest',range:120});this.regulator=waterActor(this,f.boss.x,f.boss.y,'water-5',210);if(progress.flags.waterRestored)this.regulator.sprite.setTint(0xa3ddc3);this.interactables.push({...f.boss,id:'regulator',name:progress.flags.waterRestored?'Talk to the water regulator':'Approach the corrupted regulator',kind:'regulator',speaker:this.regulator,range:160});this.interactables.push({x:f.boss.x+230,y:f.boss.y+60,id:'surface-lift',name:'Use the surface lift',kind:'surface-lift',range:115});}
  if(!progress.flags.waterRestored){seedFoyer(slots,f,this.entry||f.arrival);for(const slot of slots)if(slot.enemy)this.addEnemy(slot.enemy);}
 }
 worldSlots(){return this.floor?state.dungeonSlots[this.floor.id]:state.slots;}
 addNPC(spec){const n={...actor(this,spec.x,spec.y,spec.row,104,false,spec.labRole??null),...spec,wait:700+Math.random()*2400,target:null,stuck:0};this.npcs.push(n);return n;}
 addEnemy(spec){const type=ENEMIES[spec.kind],base=type.frame?waterActor(this,spec.x,spec.y,type.frame,type.kind==='animal'?68:108):actor(this,spec.x,spec.y,type.kind==='human'?2:3,110);const e={...base,...spec,wait:300,target:null,stuck:0};this.enemies.set(spec.id,e);}
 removeEnemy(id){const e=this.enemies.get(id);if(e){e.sprite.destroy();e.shadow.destroy();this.enemies.delete(id);}}
 canStand(x,y,blockers=[]){
  if(this.floor)return dungeonWalkable(this.floor,x,y,blockers);
  if(this.location==='city')return cityWalkable(x,y,blockers)&&southernWalkable(x,y,progress);
  if(this.location==='lab')return labStand(x,y,blockers);
  return roomWalkable(x,y,blockers);
 }
 startNarration(pages,done,black=false){this.cutscene={pages:pages.map(p=>typeof p==='string'?{text:p}:p),index:0,hold:0,done,black};this.locked=true;resetControls();this.input.keyboard.resetKeys();screenMode('cinematic');$('#scene-status').hidden=true;$('#prompt').hidden=true;this.renderNarration();}
 renderNarration(){const cut=this.cutscene,page=cut.pages[cut.index];cut.hold=0;$('#overlay').className='film-ui'+(cut.black?' film-black':'');$('#overlay').innerHTML='<section class="cinematic-caption"><p class="typed-copy">'+textSlot(page.text)+'</p><button data-action="narration-next" aria-label="Continue narration">▸</button></section>';beginText(this,page.text);if(page.pan)this.cameras.main.pan(page.pan[0],page.pan[1],page.pan[2],'Sine.easeInOut',true);}
 advanceNarration(){if(!this.cutscene||finishText(this))return;const cut=this.cutscene;cut.index++;if(cut.index<cut.pages.length)this.renderNarration();else{this.cutscene=null;this.writer=null;cut.done();}}
 startCityIntroduction(){this.player.sprite.setVisible(false);this.player.shadow.setVisible(false);this.cameras.main.stopFollow();this.cameras.main.centerOn(850,1220);this.startNarration([{text:'The year is 210X.',pan:[1580,1630,3500],hold:2600},{text:'Bellwether. A small city in the United States.',pan:[2670,2080,4300],hold:2800}],()=>this.travel('lab',{x:768,y:838},{cinematic:'intro-lab'}));}
 startLabIntroduction(){sound.setMode('lab');this.startNarration([{text:'Know-it-all Chemist, '+heroName(),hold:2400}],()=>{finishIntro(progress);this.cinematic=null;this.locked=false;$('#overlay').innerHTML='';$('#overlay').className='';screenMode('game');$('#scene-status').hidden=false;resetControls();this.input.keyboard.resetKeys();save();});}
 startPoliceNarration(){sound.setMode('narration');this.startNarration(POLICE_NARRATION,()=>{finishPoliceReport(progress);save();this.travel(progress.location,progress.position);},true);}
 startCourierArrival(){
  if(this.arrival||progress.opening!=='courier_entering')return;this.arrival=true;this.locked=true;screenMode('cinematic');$('#prompt').hidden=true;resetControls();this.input.keyboard.resetKeys();
  this.player.walking=false;drawActor(this.player,0);this.courier=this.courier||actor(this,132,525,4,120);this.courier.sprite.setAlpha(.1);this.tweens.add({targets:this.courier.sprite,alpha:1,duration:280});
  const route=[{x:235,y:588},{x:270,y:610},{x:465,y:646}],next=i=>{if(i===route.length){this.courier.walking=false;this.courier.dir='down';drawActor(this.courier,0);finishDelivery(progress);this.interactables=this.interactables.filter(n=>n.id!=='courier');this.interactables.push({id:'courier',name:'Talk to the courier',x:465,y:646,kind:'courier',speaker:this.courier});this.arrival=false;this.locked=false;screenMode('game');resetControls();this.input.keyboard.resetKeys();remember(this);return;}const p=route[i];this.courier.dir=direction(p.x-this.courier.x,p.y-this.courier.y);this.courier.walking=true;this.tweens.add({targets:this.courier,x:p.x,y:p.y,duration:Math.hypot(p.x-this.courier.x,p.y-this.courier.y)/115*1000,ease:'Linear',onUpdate:()=>drawActor(this.courier,16),onComplete:()=>next(i+1)});};next(0);
 }
 update(time,delta){
  if(this.coreUI?.mode)return;advanceText(this,delta);if(!this.player)return;this.updateOcclusion();
  if(this.cutscene){if(this.writer?.done){this.cutscene.hold+=Math.min(delta,100);if(this.cutscene.hold>=(this.cutscene.pages[this.cutscene.index].hold||2100))this.advanceNarration();}return;}
  if(this.location==='city'){drawFlood(this,progress,time);sound.fountain(Math.hypot(this.player.x-PARK.fountain.x,this.player.y-PARK.fountain.y));}
  if(this.locked){for(const n of [this.player,...this.npcs])if(n.sheetCharacter){n.walking=false;n.talking=this.dialog?.activeSpeaker===n;drawActor(n,delta);}this.updateOcclusion();return;}this.player.talking=false;if(this.engageTouchingEnemy())return;const playerContactBefore=encounterBounds(this.player);const dt=Math.min(delta,45)/1000,k=this.keys;
  const dx=Number(k.right.isDown||k.right2.isDown||control.right)-Number(k.left.isDown||k.left2.isDown||control.left),dy=Number(k.down.isDown||k.down2.isDown||control.down)-Number(k.up.isDown||k.up2.isDown||control.up);
  const step=normalizedMovement(dx,dy,this.floor?305:this.location==='city'?335:255,dt),blockers=[...this.npcs,...(this.courier?[this.courier]:[]),...(this.bastion?[this.bastion]:[]),...(this.regulator?[this.regulator]:[])];
  const p=walk(this.player,step.x,step.y,(x,y)=>this.canStand(x,y,blockers));Object.assign(this.player,p,{walking:p.moved});if(dx||dy)this.player.dir=direction(dx,dy);drawActor(this.player,delta);
  for(const npc of this.npcs)this.roam(npc,npc.zone,delta,dt,70);
  if((this.location==='city'||this.floor)&&!(this.floor&&progress.flags.waterRestored)){
   this.spawnClock+=delta;const camera=this.cameras.main,slots=this.worldSlots(),view={x:camera.scrollX,y:camera.scrollY,w:VIEW.width,h:VIEW.height};
   if(this.spawnClock>300){this.spawnClock=0;const events=this.floor?updateDungeonSpawns(slots,this.floor,this.player,view):updateSpawns(slots,this.player,view);for(const event of events){if(event.type==='spawn')this.addEnemy(event);else this.removeEnemy(event.id);}}
   for(const enemy of this.enemies.values()){
    const enemyContactBefore=encounterBounds(enemy),slot=slots.find(s=>s.area.id===enemy.id);if(!slot)continue;const zone=slot.area,distance=Math.hypot(enemy.x-this.player.x,enemy.y-this.player.y),chasing=distance<(this.floor?620:480)&&(this.floor||contains(this.player,zone,45));
    if(chasing){enemy.navClock=(enemy.navClock||0)+delta;if(this.floor){if(!enemy.target||enemy.navClock>500||Math.hypot(enemy.target.x-enemy.x,enemy.target.y-enemy.y)<45){enemy.target=chaseStep(this.floor,enemy,this.player);enemy.navClock=0;}}else enemy.target={x:Math.max(zone.x,Math.min(zone.x+zone.w,this.player.x)),y:Math.max(zone.y,Math.min(zone.y+zone.h,this.player.y))};enemy.wait=0;}
    this.roam(enemy,chasing&&this.floor?{x:0,y:0,w:DUNGEON.width,h:DUNGEON.height}:zone,delta,dt,chasing?DUNGEON.chaseSpeed:68);
    if(slot.enemy){slot.enemy.x=enemy.x;slot.enemy.y=enemy.y;}
    if(!postBattleImmune(state)&&sweptTouchingBounds(playerContactBefore,encounterBounds(this.player),enemyContactBefore,encounterBounds(enemy))){this.beginBattle(enemy.kind,enemy.id);return;}
   }
  }
  this.updateOcclusion();const near=this.nearest(),prompt=$('#prompt');if(near){prompt.hidden=false;prompt.innerHTML='<b>Z / ENTER</b>'+esc(near.kind==='npc'?'Talk to '+near.name:near.name);}else prompt.hidden=true;
 }
 beginRecovery(){if(this.returnedFromBattle){grantPostBattleImmunity(state);this.returnedFromBattle=false;}}
 updateOcclusion(){updateWorldOcclusion(this.occlusionObjects,[this.player,...this.npcs,...this.enemies.values()]);}
 engageTouchingEnemy(){
  if(!this.player||this.locked||this.transitioning||this.cutscene||this.arrival||postBattleImmune(state))return false;
  const playerBox=encounterBounds(this.player);
  for(const enemy of this.enemies.values())if(touchingBounds(playerBox,encounterBounds(enemy))){this.beginBattle(enemy.kind,enemy.id);return true;}
  return false;
 }
 roam(npc,zone,delta,dt,speed){
  npc.walking=false;if(!zone){drawActor(npc,delta);return;}
  if(npc.wait>0)npc.wait-=delta;
  else if(!npc.target){for(let i=0;i<15;i++){const t=pointInZone(zone);if(this.canStand(t.x,t.y)){npc.target=t;break;}}if(!npc.target)npc.wait=900;}
  else {const vx=npc.target.x-npc.x,vy=npc.target.y-npc.y;if(Math.hypot(vx,vy)<8){npc.target=null;npc.wait=1100+Math.random()*2300;npc.stuck=0;}else{const step=normalizedMovement(vx,vy,speed,dt),p=walk(npc,step.x,step.y,(x,y)=>this.canStand(x,y,[this.player,...this.npcs.filter(n=>n!==npc)]),zone);Object.assign(npc,p,{walking:p.moved,dir:direction(vx,vy)});npc.stuck=p.moved?0:npc.stuck+delta;if(npc.stuck>650){npc.target=null;npc.wait=500;npc.stuck=0;}}}
  drawActor(npc,delta);
 }
 nearest(){return [...this.interactables,...this.npcs.map(n=>({...n,kind:'npc',speaker:n,range:120}))].map(n=>({...n,distance:Math.hypot(n.x-this.player.x,n.y-this.player.y)})).filter(n=>n.distance<=(n.range||122)&&(!n.facilityDoor||canInteractDoor(this.player,n))).sort((a,b)=>a.distance-b.distance)[0];}
 interact(){
  if(this.cutscene){this.advanceNarration();return;}
  if(this.dialog){if(!finishText(this))this.advanceDialogue();return;}if(this.locked||this.transitioning)return;
  const near=this.nearest();if(!near)return;
  if(this.handleWaterInteraction(near))return;
  if(near.kind==='npc'){
   const plan=conversation(near.id,progress),speaker=near.speaker;speaker.dir=direction(this.player.x-speaker.x,this.player.y-speaker.y);speaker.walking=false;drawActor(speaker,0);
   if(plan)this.showDialogue(plan.lines,speaker,()=>{finishConversation(progress,plan);save();if(plan.openingEvent==='delivery')this.startCourierArrival();else if(plan.openingEvent==='police')this.startPoliceNarration();else this.offerService(near.id);},plan.choice);
   else this.showDialogue((FLAVOR[near.id]||['A quiet day in Bellwether. At least, that was the plan.']).map(text=>({speaker:near.name,text})),speaker);
  }else if(near.kind==='door'){if(near.building.id==='water'&&!progress.flags.waterAccess){const sana=this.npcs.find(n=>n.id==='sana');this.showDialogue(conversation('sana',progress).lines,sana);return;}this.travel(near.building.id,near.building.id==='lab'?{x:235,y:650}:{x:768,y:850});}
  else if(near.kind==='exit'){
   if(this.location==='lab'&&!['back_to_work','complete'].includes(progress.opening)){this.showDialogue([{speaker:heroName(),side:'hero',text:progress.opening==='aftermath'?'Mira looks shaken. I should speak to her before going anywhere.':progress.opening==='await_mira'?'I should check in with Mira before starting the day.':'The courier is waiting for the shipment. I should address it first.'}],this.player);return;}
   if(this.location==='plant-floor')this.travel('plant',{x:768,y:565});else if(this.location==='plant-relay')this.travel('plant-floor',{x:768,y:565});else {const b=BUILDINGS.find(b=>b.id===this.location);this.travel('city',{x:b.door.x,y:b.door.y+55});}
  }else if(near.kind==='courier'){if(progress.flags.courierDone)this.showDialogue([{speaker:heroName(),side:'hero',text:'Its visor is dark. Mira is still shaking. I should talk to her.'}],near.speaker);else this.showDialogue(heroLines(PICKUP),near.speaker,()=>this.beginBattle('courier'));}
  else if(near.kind==='rear'){
   const pass=this.location==='plant'?progress.flags.badgeFixed:progress.flags.resinCleared;
   if(pass)this.travel(this.location==='plant'?'plant-floor':'plant-relay',{x:768,y:850});
   else this.showDialogue([{speaker:this.location==='plant'?'Service reader':'Alex',text:this.location==='plant'?'Service authorization required. The old reader clicks, then waits.':'The assembly route is covered in hardened resin. June probably knows what happened.'}],near);
  }else if(near.kind==='boss'){
   const beat=BEATS.find(b=>b.id==='b7');if(progress.flags.bastionDefeated){if(!progress.flags.relayTaken)this.collectRelay();else this.showDialogue(heroLines(beat.repeat),near.speaker);}else this.showDialogue(heroLines(beat.dialogue),near.speaker,()=>this.beginBattle('bastion'));
  }else this.showDialogue([{speaker:'Alex',text:near.text}],near);
 }
 handleWaterInteraction(near){
  const f=this.floor,say=(text,who=this.player)=>this.showDialogue([{speaker:who===this.player?heroName():near.name,side:who===this.player?'hero':'npc',text}],who);
  if(near.kind==='npc'&&near.id==='omari'&&progress.flags.factoryDone){this.showDialogue([{speaker:near.name,side:'npc',text:progress.flags.waterRestored?'The Fairmont approach is clear. Follow the path south of the waterworks. I can finally retire my imaginary boat schedule.':'The south approach is a stream now. I drive a bus, not an aquarium. Quinn is handling access to the water station.'}],near.speaker);return true;}
  if(near.kind==='dungeon-enter'){if(!progress.flags.waterAccess){say('Sana needs Officer Quinn’s authorization first.');return true;}this.travel(WATER_FLOORS[0],floorData(WATER_FLOORS[0]).arrival);return true;}
  if(near.kind==='stairs-up'){if(f.index===0)this.travel('water',{x:768,y:820});else{const upper=floorData(WATER_FLOORS[f.index-1]);this.travel(upper.id,upper.returnArrival);}return true;}
  if(near.kind==='stairs-down'){const next=floorData(WATER_FLOORS[f.index+1]);if(milestone(progress,'survey-'+f.id,110))mark(progress,'survey:'+f.id,'Surveyed '+f.title+'. The next staircase leads to '+next.title+'.');save();this.travel(next.id,next.arrival);return true;}
  if(near.kind==='dungeon-supply'){
   if(progress.flags[near.id])say('The supply locker is empty.');else{mark(progress,near.id);progress.snacks+=near.count;save();say('A sealed emergency ration. You take one pocket sandwich.');}return true;
  }
  if(near.kind==='dungeon-rest'){restore(progress);save();say('The first-aid cabinet still works. HP fully restored. Someone has written “PLEASE CONTINUE EXISTING” on the door.');return true;}
  if(near.kind==='vest'){if(progress.flags.vestFound)say('The insulated gear locker is empty. Your vest is in the Items menu.');else{mark(progress,'vestFound','Found an insulated work vest near the fourth-floor stairs. It adds '+VEST_DEFENSE+' defense when equipped.');progress.inventory??=[];if(!progress.inventory.includes('insulated-vest'))progress.inventory.push('insulated-vest');progress.armor='insulated-vest';save();say('An insulated work vest, still in its protective wrapper. You put it on. Defense +'+VEST_DEFENSE+'. You can change equipment in the Items menu.');}return true;}
  if(near.kind==='regulator'){
   if(progress.flags.waterRestored)this.showDialogue(heroLines([{speaker:'DELUGE',text:'REMOTE OVERRIDE REMOVED. MUNICIPAL CONTROL RESTORED. DISCHARGE VALVES CLOSED.'},{speaker:'DELUGE',text:'SOUTHERN OVERFLOW DRAINING. SURFACE LIFT READY. THANK YOU FOR YOUR UNORTHODOX MAINTENANCE.'},{speaker:'{hero}',text:'Let’s try keeping it routine from here.'}]),near.speaker);
   else this.showDialogue(heroLines([{speaker:'DELUGE',text:'CENEXIS COMMAND RETAINED. ALL DISCHARGE VALVES: OPEN.'},{speaker:'{hero}',text:'You are flooding the road. And half your own building.'},{speaker:'DELUGE',text:'PUBLIC SAFETY PARAMETERS OVERRIDDEN. REMOVING INTERFERENCE.'}]),near.speaker,()=>this.beginBattle('regulator'));return true;
  }
  if(near.kind==='surface-lift'){if(!progress.flags.waterRestored)say('The lift is locked while the regulator holds the station in emergency discharge.');else this.showDialogue(heroLines([{speaker:'Station intercom',text:'Normal pressure restored. The south-road overflow is receding. Surface lift authorized.'}]),near,()=>this.travel('city',{x:3840,y:4050}));return true;}
  if(near.kind==='ending'){if(!progress.flags.waterRestored)say('The waterworks overflow blocks the road to Fairmont.');else{mark(progress,'chapterComplete','Bellwether’s water regulator is restored. The Fairmont road is open.');this.startNarration(['The water falls back into its channels.','You board the regional bus with the storage module and the repaired service key.','Fairmont Junction. The next stop on the Cenexis trail.'],()=>{Object.assign(progress,fairmontTransition(progress,'arrive').state);progress.location='fairmont';progress.position={...FAIRMONT_ARRIVAL};save();this.scene.start('Fairmont',{location:'fairmont',position:FAIRMONT_ARRIVAL});},true);}return true;}
  return false;
 }
 collectRelay(){const beat=BEATS.find(b=>b.id==='b7');this.showDialogue(heroLines(beat.postWin),this.npcs.find(n=>n.id==='june')||this.bastion,()=>{for(const f of beat.grants)mark(progress,f);storyReward(progress,'b7');if(!progress.notes.includes(beat.journal))progress.notes.push(beat.journal);save();});}
 showDialogue(messages,speaker,complete=()=>{},choice=null){this.locked=true;this.dialog={messages:messages.map(m=>({...m,side:m.side||(m.speaker==='Alex'?'hero':'npc'),speaker:m.speaker==='Alex'?heroName():m.speaker})),index:0,speaker:speaker||this.player,complete,choice,choiceDone:false,choiceVisible:false};resetControls();this.input.keyboard.resetKeys();$('#prompt').hidden=true;this.renderDialogue();}
 renderDialogue(){const d=this.dialog,line=d.messages[d.index],hero=line.side==='hero';d.activeSpeaker=hero?this.player:(this.npcs.find(n=>n.id===line.speakerId||n.name===line.speaker||n.id===line.speaker)||d.speaker);d.hero=hero;d.argus=isArgusLine(line);$('#overlay').className='';$('#overlay').innerHTML=d.argus?argusPanelMarkup(line):'<section class="dialog-box '+(hero?'dialog-hero':'dialog-npc')+'" aria-label="Conversation"><div class="dialog-speaker">'+esc(line.speaker)+':</div><p class="typed-copy">'+textSlot(line.text)+'</p><button data-action="dialogue-next" aria-label="Continue dialogue">▾</button></section>';beginText(this,d.argus?line.text.toUpperCase():line.text,d.argus?'argus':d.activeSpeaker?.row||0);this.positionDialogue();}
 positionDialogue(){const d=this.dialog,box=$('#overlay .dialog-box');if(!d||!box||d.argus&&!d.choiceVisible)return;const camera=this.cameras.main,who=d.choiceVisible?this.player:d.activeSpeaker||d.speaker,point=conversationAnchor({x:who.x-camera.scrollX,y:who.y-camera.scrollY},VIEW,{width:$('#stage').clientWidth,height:$('#stage').clientHeight},{width:box.offsetWidth,height:box.offsetHeight},d.choiceVisible||d.hero);box.style.left=point.x+'%';box.style.top=point.y+'%';}
 advanceDialogue(){const d=this.dialog;if(d.choiceVisible)return;d.index++;if(d.index<d.messages.length){this.renderDialogue();return;}if(d.choice&&!d.choiceDone){d.choiceVisible=true;this.writer=null;$('#overlay').innerHTML='<section class="dialog-box dialog-hero"><div class="dialog-speaker">'+esc(heroName()).toUpperCase()+'</div><p>'+esc(d.choice.prompt)+'</p>'+d.choice.options.map((t,i)=>'<button class="choice" data-action="choice-'+i+'">'+esc(t)+'</button>').join('')+'</section>';this.positionDialogue();return;}const done=d.complete;this.closeDialogue();done();}
 closeDialogue(){this.dialog=null;this.writer=null;this.locked=this.arrival||!!this.cutscene||this.transitioning;$('#overlay').innerHTML='';$('#overlay').className='';resetControls();this.input.keyboard.resetKeys();}
 offerService(id){if(id==='sol'){restore(progress);save();this.showDialogue([{speaker:'Dr. Mercer',text:'All patched up. HP restored. First aid is free, and you can come back whenever you need.'}],this.npcs.find(n=>n.id===id));}else if(['owen','pia','beck','marty'].includes(id))this.openService(id);}
 openService(id,message=''){this.locked=true;this.menu=id;this.writer=null;const offerings=id==='pia'?[['hotel','Rest · 14 credits','Restore all HP']]:id==='beck'?[['upgrade','Insulated grip · 85 credits',progress.upgrade?'Already equipped':'+6 attack']]:[['snack','Pocket sandwich · '+SANDWICH_PRICE+' credits','Restore '+SANDWICH_HEAL+' HP']];$('#overlay').className='menu-ui';$('#overlay').innerHTML='<section class="notebook service"><small>BELLWETHER · '+progress.credits+' CREDITS</small><h2>'+esc(id==='pia'?'Juniper Hotel':id==='beck'?'Beck’s workbench':id==='marty'?'Harvest Diner':'Harrow General Store')+'</h2><p>'+esc(message||'Take a moment before heading out.')+'</p>'+offerings.map(([key,label,sub])=>'<button data-action="buy-'+key+'">'+esc(label)+'<small>'+esc(sub)+'</small></button>').join('')+'<button class="quiet" data-action="menu-close">Back to town life <span>ESC</span></button></section>';resetControls();this.input.keyboard.resetKeys();}
 installCoreUI(){
  this.coreUI=new CoreGameUI(this,{progress:()=>progress,save,reset:resetControls,overlay:$('#overlay'),prompt:$('#prompt')});
  this.chooseMenuKey=chooseKeyboardButton;const up=e=>this.coreUI?.keyup(e),down=e=>this.coreUI?.key(e);
  // DOM key-up still arrives after Phaser resetKeys clears a key during a modal change.
  const blur=()=>this.coreUI?.held.clear();window.addEventListener('keydown',down);window.addEventListener('keyup',up,true);window.addEventListener('blur',blur);
  this.events.once('shutdown',()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up,true);window.removeEventListener('blur',blur);this.coreUI?.destroy();});
 }
 openJournal(){if(this.coreUI?.open('menu'))remember(this);}
 closeMenu(){if(this.coreUI?.mode){this.coreUI.close();return;}this.menu=null;this.locked=!!(this.dialog||this.cutscene||this.arrival||this.transitioning);$('#overlay').innerHTML='';$('#overlay').className='';resetControls();this.input.keyboard.resetKeys();}

 handleAction(action){
  if(this.coreUI?.action(action))return;
  if(action==='narration-next'){this.advanceNarration();return;}
  if(action==='dialogue-next'){this.interact();return;}
  if(action.startsWith('choice-')&&this.dialog?.choiceVisible){const d=this.dialog;d.choiceDone=true;d.choiceVisible=false;d.messages=heroLines(d.choice.after);d.index=0;this.renderDialogue();return;}
  if(action==='ending-back'){this.closeMenu();$('#scene-status').hidden=false;return;}
  if(action==='menu-close'){this.closeMenu();return;}
  if(action.startsWith('buy-')&&this.menu){const id=this.menu,message=buy(progress,action.slice(4));save();this.openService(id,message);return;}
  if(action==='equip-vest'){equipVest(progress);save();this.openJournal();return;}if(action==='equip-laminate'){equipArmor(progress,'laminate-vest');save();this.openJournal();return;}
  if(action==='eat'){if(progress.snacks&&progress.hp<progress.maxHp){progress.snacks--;progress.hp=Math.min(progress.maxHp,progress.hp+SANDWICH_HEAL);}save();this.openJournal();return;}
  if(action==='new-game'){$('#overlay .notebook').innerHTML='<small>NEW GAME</small><h2>Begin again at the lab?</h2><p>This replaces only the currently selected save file. Your other files are kept.</p><button data-action="confirm-new">Begin again</button><button class="quiet" data-action="menu-close">Keep exploring</button>';return;}
  if(action==='confirm-new'){this.scene.start('Start',{newSlot:state.activeSlot});}
  if(action==='title'){remember(this);this.scene.start('Start');}
 }
 travel(location,position,extra={}){if(this.transitioning)return;this.transitioning=true;this.locked=true;progress.location=location;progress.position=position;save();resetControls();$('#prompt').hidden=true;this.cameras.main.fadeOut(180,23,46,45);this.time.delayedCall(180,()=>this.scene.restart({location,position,...extra}));}
 beginBattle(id,spawnId=null){if(this.transitioning)return;remember(this);state.origin={location:this.location,position:{x:this.player.x,y:this.player.y}};state.encounter={id,spawnId,region:this.location};this.transitioning=true;this.locked=true;resetControls();screenMode('cinematic');$('#prompt').hidden=true;$('#scene-status').hidden=true;let started=false;const start=source=>{if(started||!this.sys.isActive())return;started=true;this.scene.start('Battle',{transitionSource:source||null});};try{this.game.renderer.snapshot(source=>start(source));}catch{start(null);}this.time.delayedCall(700,()=>start(null));}
}
const FairmontScene=createFairmontScene({Base:ExploreScene,getProgress:()=>progress,state,save,remember,control,resetControls,screenMode,sceneUI,advanceText,finishText,chooseKeyboardButton,VIEW,sound,actor,drawActor,prepareArt,prepareWaterArt});
class BattleScene extends SceneBase{
 constructor(){super('Battle');}
 init(data){this.transitionSource=data?.transitionSource||null;this.transition=null;this.transitionElapsed=0;}
 create(){
  state.scene=this;this.closed=false;this.rewarded=false;this.notice=null;this.actionPresentation=null;this.battle=createEncounter(state.encounter.id,progress,state.encounter.ids);const b=this.battle;resetControls();$('#scene-status').hidden=true;$('#prompt').hidden=true;$('#overlay').innerHTML='';
  this.pattern=this.textures.exists('battle-pattern')?this.textures.get('battle-pattern'):this.textures.createCanvas('battle-pattern',384,240);drawBattleBackdrop(this.pattern.context,0);this.pattern.refresh();this.patternTime=0;
  this.add.image(0,0,'battle-pattern').setOrigin(0).setDisplaySize(VIEW.width,VIEW.height);
  this.enemySprites=new Map();this.renderEnemies();
  screenMode('cinematic');this.transition=new BattleTransition(this,this.transitionSource);this.transitionSource=null;sound.setMode('transition');sound.effect('fanfare');
  this.time.delayedCall(BATTLE_START_MS,()=>{if(this.closed)return;this.transition?.destroy();this.transition=null;screenMode('battle');this.renderHUD();sound.setMode(combatMusicMode(this));this.input.keyboard.resetKeys();});
  this.onKey=e=>{if(e.repeat||this.transition)return;if(this.notice){if(['z','enter',' '].includes(e.key.toLowerCase())){e.preventDefault();this.handleAction('notice-next');}return;}chooseKeyboardButton(e);if(['z','enter',' '].includes(e.key.toLowerCase())){e.preventDefault();if(finishText(this))return;(document.activeElement?.closest('#overlay button:not(:disabled)')||$('#overlay button:not(:disabled)'))?.click();}};
  this.stopWatchingBattleText=watchBattleText($('#overlay'),$('#stage'));
  this.input.keyboard.addCapture([13,32,37,38,39,40,90]);this.input.keyboard.on('keydown',this.onKey);this.events.once('shutdown',()=>{this.closed=true;this.stopWatchingBattleText?.();this.writer=null;this.transition?.destroy();this.transition=null;sound.battle.stop();sound.argus.stop();sound.stopEffects('fanfare');sound.stopEffects('victory');this.input.keyboard.off('keydown',this.onKey);resetControls();});
 }
 update(time,delta){if(this.closed)return;if(time-this.patternTime>=32){drawBattleBackdrop(this.pattern.context,time);this.pattern.refresh();this.patternTime=time;}if(this.transition){this.transitionElapsed+=delta;this.transition.draw(this.transitionElapsed);return;}if(this.notice)return;advanceText(this,delta);if(this.actionPresentation&&this.writer?.done){this.actionPresentation.remaining-=Math.min(delta,100);if(this.actionPresentation.remaining<=0){this.actionPresentation=null;if(this.battle.phase==='victory'){this.renderHUD();return;}this.resolveEnemyTurn();}}const before=this.battle.phase;rollHealth(this.battle,delta/1000);this.updateVitals();if(before!==this.battle.phase&&this.battle.phase==='defeat'){this.actionPresentation=null;this.renderHUD();}}
 reward(){if(this.rewarded)return;this.rewarded=true;sound.setMode('victory');sound.effect('victory');const b=this.battle;progress.hp=Math.max(1,Math.ceil(b.hp));progress.snacks=b.snacks;const rewards=encounterRewards(b);const beforeStats=playerStats(progress);this.levels=award(progress,rewards.xp,rewards.credits);if(this.levels)this.notice={kind:'level',page:0,before:beforeStats,after:playerStats(progress),level:progress.level,name:heroName()};if(b.id==='courier'){mark(progress,'courierDone');progress.opening='aftermath';}if(b.id==='bastion')mark(progress,'bastionDefeated');if(b.id==='regulator')mark(progress,'waterRestored','The regulator is free of the Cenexis override. The overflow has stopped, and the south road can drain.');if(state.origin?.scene==='Fairmont'){finishFairmontBattle(progress,state.encounter);if(state.encounter.spawnId)defeatFairmontSpawn(state.fairmontSlots?.[state.encounter.region],state.encounter.spawnId);}else if(state.encounter.spawnId)defeatedSpawn(state.dungeonSlots[state.encounter.region]||state.slots,state.encounter.spawnId);save();}
 renderHUD(){
  const b=this.battle,finished=['victory','defeat'].includes(b.phase)&&!this.actionPresentation,foe=targetEnemy(b),rewards=encounterRewards(b);this.renderEnemies();if(b.phase==='victory'&&!this.actionPresentation)this.reward();if(b.phase==='defeat')sound.setMode('defeat');$('#overlay').className='battle-ui'+(finished?' battle-finished':'')+(livingEnemies(b).length>1?' battle-multiple':'');
  const button=(label,action,sub,disabled=false)=>'<button class="battle-action" data-action="'+action+'" '+(disabled?'disabled':'')+'><span>'+label+'</span><small>'+sub+'</small></button>';
  const panel=finished?'<section class="result"><small>'+(b.phase==='victory'?'ENCOUNTER COMPLETE':'A MOMENT TO RECOVER')+'</small><h2>'+(b.phase==='victory'?(b.id==='regulator'?'Pressure restored.':b.enemy.kind==='human'?'They back down.':b.enemy.kind==='animal'?'They scurry away.':'Signal interrupted.'):'Still here.')+'</h2><p>'+(b.phase==='victory'?'+'+rewards.xp+' XP · '+rewards.credits+' credits':(b.id==='courier'?'Take a breath. You can try the pickup again.':WATER_FLOORS.includes(state.encounter.region)?'The emergency system brings you back to this floor’s stair lobby. Your discoveries and equipment are safe.':'The clinic can get you back on your feet. Your notes are safe.'))+'</p><button data-action="return">'+(b.phase==='victory'?'Continue →':(b.id==='courier'?'Try the pickup again →':WATER_FLOORS.includes(state.encounter.region)?'Recover at the stair lobby →':'Recover at the clinic →'))+'</button></section>':'<section class="battle-panel"><div class="battle-panel-head"><span>'+esc(heroName()).toUpperCase()+'</span><small>YOUR MOVE</small></div>'+button('Attack','attack','Vibrosword'+(progress.upgrade>=2?' · resonant edge':progress.upgrade?' · insulated grip':''),b.phase!=='command')+button('Guard','guard','Brace for the next hit',b.phase!=='command')+button('Goods','snack','Pocket sandwich × '+b.snacks,b.phase!=='command'||!b.snacks)+'<p class="battle-tip">HP rolls down after a hit.<br>A quick sandwich can keep you standing.</p></section>';
  $('#overlay').innerHTML='<div class="battle-topline"><div><span>UNSCHEDULED ENCOUNTER</span><h1>'+esc(b.enemy.name)+'</h1></div><small>TURN '+b.turn+'</small></div><div class="battle-log" role="status"><div class="typed-copy">'+textSlot(b.message)+'</div></div>'+panel+this.targetButtons()+'<div class="enemy-status"><span>'+esc(foe.stats.name.toUpperCase())+'</span><div><i id="enemy-hp"></i></div><small>'+(b.charged?(foe.stats.kind==='human'?'WINDING UP':'CAPACITORS CHARGING'):'HOSTILE INTENT')+'</small></div><section class="hero-vitals"><div class="vital-title"><b>'+esc(heroName()).toUpperCase()+'</b><small>LV '+String(progress.level).padStart(2,'0')+' · CHEMIST</small></div><div class="hp-number"><span>HP</span><strong id="hero-hp"></strong><small>/ '+b.maxHp+'</small></div><div class="vital-track"><i id="hero-hp-bar"></i></div><div class="vital-bottom">Homemade vibrosword'+(hasMagic(progress)?'<span>MP '+(progress.mp??0)+' / '+(progress.maxMp??0)+'</span>':'')+'</div></section>';
  if(finished)this.writer=null;else beginText(this,b.message);this.updateVitals();fitBattleText($('#overlay'));if(this.notice)this.renderNotice();
 }
 renderNotice(){
  this.writer=null;
  const n=this.notice,level=n.kind==='level',stats=level&&n.page===1;
  for(const button of $('#overlay').querySelectorAll('button')){button.disabled=true;button.tabIndex=-1;}
  const title=level?(stats?'Stronger than before.':n.name+' rose to level '+n.level+'!'):n.recovered+' HP recovered';
  const detail=stats?'<dl class="level-gains">'+[['health','Maximum HP'],['attack','Attack'],['defense','Defense']].map(([key,label])=>'<div><dt>'+label+'</dt><dd><strong>+'+(n.after[key]-n.before[key])+'</strong><span>'+n.before[key]+' → '+n.after[key]+'</span></dd></div>').join('')+'</dl>':'';
  $('#overlay').insertAdjacentHTML('beforeend','<div class="battle-notice-shade"><section class="battle-notice '+(level?'level-notice':'heal-notice')+'" role="dialog" aria-modal="true" aria-label="'+(level?'Level up':'Healing confirmation')+'"><small>'+(level?'LEVEL UP':'POCKET SANDWICH')+'</small><h2 class="'+(level&&!stats?'rainbow-level':'')+'">'+esc(title)+'</h2>'+detail+'<button data-action="notice-next">'+(stats?'Continue →':'Continue')+' <span>ENTER</span></button></section></div>');
  this.input.keyboard.resetKeys();resetControls();$('#overlay [data-action="notice-next"]').focus();
 }
 advanceNotice(){
  const n=this.notice;if(!n)return;
  if(n.kind==='level'&&n.page===0){n.page=1;$('#overlay .battle-notice-shade').remove();this.renderNotice();return;}
  this.notice=null;
  if(n.kind==='level'){this.handleAction('return');return;}
  $('#overlay .battle-notice-shade').remove();
  this.writer=null;this.actionPresentation=null;this.input.keyboard.resetKeys();resetControls();
  this.resolveEnemyTurn();
 }
 renderEnemies(){const live=livingEnemies(this.battle),shown=live.length?live:[targetEnemy(this.battle)];for(const foe of this.battle.enemies){let sprite=this.enemySprites.get(foe.uid);if(!sprite){sprite=this.add.image(1010,838,foe.stats.portrait,foe.stats.frame||(foe.stats.portrait==='courier-battle'?undefined:'portrait')).setOrigin(.5,1);this.enemySprites.set(foe.uid,sprite);}const index=shown.indexOf(foe);sprite.setVisible(index>=0);if(index>=0){const count=shown.length,x=count===1?1010:count===2?860+index*430:765+index*300;sprite.setPosition(x,count===1?838:790).setScale(Math.min((count===1?635:470)/sprite.height,(count===1?610:count===2?365:260)/sprite.width));sprite.setAlpha(foe.hp>0?1:.5);}}}
 targetButtons(){const b=this.battle;if(livingEnemies(b).length<2||['victory','defeat'].includes(b.phase))return '';return '<div class="battle-targets" aria-label="Choose attack target">'+livingEnemies(b).map((e,i)=>'<button data-action="target-'+e.uid+'" aria-pressed="'+(targetEnemy(b).uid===e.uid)+'" '+(b.phase!=='command'?'disabled':'')+'><span>'+esc(e.stats.name)+' '+String.fromCharCode(65+i)+'</span><small>'+e.hp+' / '+e.maxHp+' HP'+(e.charged?' · Charging':'')+'</small></button>').join('')+'</div>';}
 resolveEnemyTurn(){if(this.closed||this.battle.phase!=='resolving')return;const response=enemyAction(this.battle);if(response.damage){sound.effect('bash');this.cameras.main.shake(90,.002);}this.renderHUD();if(this.battle.phase==='resolving')this.time.delayedCall(Math.max(950,this.writer.duration+350),()=>this.resolveEnemyTurn());}
 updateVitals(){const b=this.battle;if($('#hero-hp'))$('#hero-hp').textContent=String(Math.ceil(b.hp)).padStart(3,'0');if($('#hero-hp-bar'))$('#hero-hp-bar').style.width=b.hp/b.maxHp*100+'%';if($('#enemy-hp'))$('#enemy-hp').style.width=b.enemyHp/b.enemyMaxHp*100+'%';}
 handleAction(action){
  if(this.closed||this.transition)return;if(this.notice){if(action==='notice-next')this.advanceNotice();return;}if(this.actionPresentation)return;const b=this.battle;if(action==='return'&&['victory','defeat'].includes(b.phase)){this.closed=true;if(b.phase==='defeat'&&state.origin?.scene==='Fairmont'){abortFairmontBattle(progress,state.encounter);restore(progress);progress.snacks=b.snacks;if(state.encounter.spawnId)defeatFairmontSpawn(state.fairmontSlots?.[state.encounter.region],state.encounter.spawnId);const checkpoint={location:'fairmont-clinic',position:{x:768,y:760}};progress.location=checkpoint.location;progress.position=checkpoint.position;save();this.scene.start('Fairmont',{...checkpoint,afterBattle:true});return;}if(b.phase==='defeat'){restore(progress);progress.snacks=b.snacks;if(state.encounter.spawnId)defeatedSpawn(state.dungeonSlots[state.encounter.region]||state.slots,state.encounter.spawnId);const inFacility=WATER_FLOORS.includes(state.encounter.region);const tutorial=b.id==='courier'&&!progress.flags.policeReported;progress.location=inFacility?state.encounter.region:tutorial?'lab':'clinic';progress.position=inFacility?{...floorData(state.encounter.region).arrival}:{x:768,y:838};if(tutorial){progress.opening='courier_ready';}save();this.scene.start('Explore',{location:progress.location,position:progress.position,afterBattle:true});}else this.scene.start(state.origin.scene||'Explore',{...state.origin,afterBattle:true});return;}
  if(action.startsWith('target-')){if(selectTarget(b,Number(action.slice(7))))this.renderHUD();return;}
  if(finishText(this))return;const result=playerAction(b,action);if(!result.ok){if(result.message){b.message=result.message;this.renderHUD();}return;}
  if(action==='attack'){sound.effect('vibrosword');const sprite=this.enemySprites.get(result.targetUid);if(!result.miss&&sprite){sprite.setTintFill(0xd6f3d7);this.time.delayedCall(100,()=>sprite.clearTint());}}
  b.message=result.actionMessage;this.actionPresentation={remaining:action==='snack'?300:1800};
  if(action==='snack')this.notice={kind:'healing',recovered:result.recovered};
  this.renderHUD();
 }
}
if(!P)$('#loading').innerHTML='<p>The game engine could not load. Please reload the page.</p>';
else {
 $('#overlay').addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(b&&!b.disabled)state.scene?.handleAction(b.dataset.action);});
 $('#overlay').addEventListener('submit',e=>{e.preventDefault();if(state.scene instanceof StartScene&&state.scene.phase==='name')state.scene.handleAction('name-check');});
 for(const event of ['pointerdown','pointerup','keydown'])window.addEventListener(event,()=>sound.unlock(),{capture:true});
 $('#sound').onclick=()=>{if(sound.failed){sound.setEnabled(true);sound.unlock(true);}else sound.setEnabled(!sound.enabled);};
 $('#restart').onclick=()=>{if(state.scene instanceof ExploreScene){if(state.scene.menu)state.scene.closeMenu();else state.scene.openJournal();}};
 document.querySelectorAll('[data-dir]').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);control[b.dataset.dir]=true;};b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>control[b.dataset.dir]=false;});
 $('#touch-act').onclick=()=>{const s=state.scene;if(s instanceof ExploreScene&&!s.menu&&!s.dialog?.choiceVisible)s.interact();else $('#overlay button:not(:disabled)')?.click();};
 window.addEventListener('blur',resetControls);document.addEventListener('visibilitychange',()=>{resetControls();sound.setVisible(!document.hidden);});window.addEventListener('pagehide',()=>{if(state.scene instanceof ExploreScene&&!state.scene.transitioning)remember(state.scene);sound.stop();});
 window.addEventListener('pageshow',e=>{if(!e.persisted)return;sound.setVisible(!document.hidden);const s=state.scene;if(s instanceof StartScene)sound.setMode(s.phase==='power'?'title':'menu');else if(s instanceof ExploreScene)sound.setMode(explorationMusicMode(s));else if(s instanceof BattleScene&&!['victory','defeat'].includes(s.battle.phase))sound.setMode(combatMusicMode(s));});
 new P.Game({type:P.AUTO,parent:'phaser',width:VIEW.width,height:VIEW.height,backgroundColor:'#101d29',pixelArt:true,roundPixels:true,antialias:false,scale:{mode:P.Scale.FIT,autoCenter:P.Scale.CENTER_BOTH},scene:[StartScene,ExploreScene,FairmontScene,BattleScene],input:{keyboard:true,touch:true},render:{powerPreference:'low-power'},audio:{noAudio:true}});
}
