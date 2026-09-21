import * as story from './story.mjs';
import {mapFor,walkable,ALL_LOCATIONS} from './world.mjs';
import {preloadSolaceArt,prepareSolaceArt,drawSolaceMap,createLouActor,drawLouActor,equipLouHalberd} from './art.mjs';
import {preloadFairmontArt,prepareFairmontArt} from '../fairmont/art.mjs';
import {loadCitizenSheets,prepareCitizenSheets,createCitizenActor,drawCitizenActor} from '../fairmont/citizen-sheets.mjs';
import {SOLACE_ENEMIES} from './enemies.mjs';
import {ENEMIES} from '../city/encounters.mjs';
import {disableNearbyDrones,disabledDrone} from './drone-jammer.mjs';
import {normalizedMovement,direction} from '../lab/world-rules.mjs';
import {walk} from '../city/city-world.mjs';
import {canInteractDoor} from '../city/doors.mjs';
import {encounterBounds,sweptTouchingBounds,postBattleImmune} from '../city/encounter-contact.mjs';
import {restoreParty} from '../city/party.mjs';
import {CONSUMABLES,GEAR,buy,restore} from '../city/progress.mjs';
import {explorationMusicMode} from '../city/music-routing.mjs';
import {ARRIVAL as FAIRMONT_ARRIVAL} from '../fairmont/world.mjs';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function createSolaceScene(api){
 const {Base,getProgress,state,save,remember,control,resetControls,screenMode,sceneUI,advanceText,finishText,VIEW,sound,actor,drawActor,prepareArt,prepareWaterArt}=api;
 const paint=(a,dt=0)=>a.solaceLou?drawLouActor(a,dt):a.fairmontCitizen?drawCitizenActor(a,dt):drawActor(a,dt);
 return class SolaceScene extends Base{
  constructor(){super('Solace');}
  init(data){super.init(data);this.location=ALL_LOCATIONS.includes(data?.location)?data.location:'solace-transit';this.map=mapFor(this.location);this.entry=data?.position||this.map.arrival;this.fromBus=!!data?.fromBus;this.sequence=null;this.actionBusy=false;this.lou=null;this.spawnClock=0;this.solvedAction=null;this.followTrail=[];this.qaWalkPath=[];}
  preload(){super.preload();preloadFairmontArt(this);loadCitizenSheets(this);preloadSolaceArt(this);}
  create(){
   const p=getProgress();state.scene=this;this.progressFlags=p.flags;prepareArt(this);prepareWaterArt(this);prepareFairmontArt(this);prepareCitizenSheets(this);prepareSolaceArt(this);resetControls();screenMode('game');$('#loading').hidden=true;
   sceneUI(this.map.title.toUpperCase());$('.chapter').innerHTML='<span>03</span><div>SOLACE<small>Life, simplified.</small></div>';$('#scene-status span').textContent=this.map.exterior?'DAYLIGHT':this.map.dungeon&&p.flags.CH3_LOCKDOWN?'EMERGENCY POWER':'INTERIOR';document.title='SOURCE ZERO · Solace';$('#stage').setAttribute('aria-label','Explore '+this.map.title);
   const drawn=drawSolaceMap(this,this.map,p);this.occlusionObjects=drawn?.objects||[];
   this.interactables=[...(this.map.doors||[]).map(d=>({...d,kind:'door',facilityDoor:!!d.side,range:d.range||180})),...(this.map.interactions||[])];
   for(const n of this.map.npcs||[])this.addPerson(n);
   const point=this.safePoint(this.entry);this.player=actor(this,point.x,point.y,0,110,true);this.player.dir=this.entry.facing||'down';this.beginRecovery();
   if(p.flags.CH3_LOU_MEETING_COMPLETE||this.location==='solace-lou-apartment'||this.location==='solace-job-apartment')this.addLou();
   const slots=state.solaceSlots??={};this.slots=slots[this.location]??=(this.map.spawns||[]).map(s=>({...s,rolled:false,enemy:null}));
   for(const slot of this.slots){const fallen=disabledDrone(p,this.location,slot.id);if(fallen)this.addPatrol({...slot,...fallen},true);else if(slot.enemy)this.addPatrol(slot);}
   for(const [key,point]of Object.entries(p.solaceDisabledDrones||{}))if(key.startsWith(this.location+':'))this.addPatrol({id:key.slice(this.location.length+1),kind:'solaceDrone',...point},true);
   this.cameras.main.setBounds(0,0,this.map.width,this.map.height).startFollow(this.player.sprite,true,1,1);this.cameras.main.centerOn(point.x,point.y);this.cameras.main.fadeIn(220,16,28,37);
   this.keys=this.input.keyboard.addKeys({up:'W',down:'S',left:'A',right:'D',up2:'UP',down2:'DOWN',left2:'LEFT',right2:'RIGHT'});this.installCoreUI();this.input.keyboard.addCapture([13,32,37,38,39,40,90]);
   this.onResize=()=>this.positionDialogue();window.addEventListener('resize',this.onResize);this.events.once('shutdown',()=>{window.removeEventListener('resize',this.onResize);this.writer=null;resetControls();});
   if(!p.visited.includes(this.location))p.visited.push(this.location);sound.fountain(Infinity);sound.setMode(explorationMusicMode(this));remember(this);this.updateObjective();
   if(this.location==='solace-mega-roof'){const stats=SOLACE_ENEMIES.containment8;this.roofUnit=this.add.image(940,685,stats.mapTexture).setOrigin(.5,1).setDisplaySize(104,165).setDepth(685);if(p.flags.CH3_BOSS_DEFEATED)this.roofUnit.setAngle(14).setTint(0x91a9ab);}
   if(this.map.dungeon&&(p.flags.CH3_LOCKDOWN||p.chapter3Sequence?.id==='lockdown'&&p.chapter3Sequence.step>=3))this.emergencyLight=this.add.rectangle(0,0,VIEW.width,VIEW.height,0x2d1015,.21).setOrigin(0).setScrollFactor(0).setDepth(9000);
   this.time.delayedCall(260,()=>this.resumeStory());
  }
  updateObjective(){$('#footer-hint').textContent=story.objective(getProgress());}
  safePoint(point){if(walkable(this.location,point.x,point.y,getProgress()))return point;for(let r=30;r<600;r+=30)for(let i=0;i<16;i++){const t=i*Math.PI/8,x=point.x+Math.cos(t)*r,y=point.y+Math.sin(t)*r;if(walkable(this.location,x,y,getProgress()))return {x,y};}return this.map.arrival;}
  canStand(x,y,blockers=[]){return walkable(this.location,x,y,getProgress())&&!blockers.some(n=>n!==this.lou&&Math.hypot(n.x-x,n.y-y)<35);}
  addPerson(n){let visual;if(n.id==='lou')visual=createLouActor(this,n.x,n.y,110,!!getProgress().flags.CH3_LOU_MEETING_COMPLETE);else if(n.robot){const sprite=this.add.sprite(n.x,n.y,'fairmont-enemy-cleaner-map','portrait').setOrigin(.5,1);sprite.setScale(80/sprite.width).setDepth(n.y);visual={x:n.x,y:n.y,sprite,shadow:this.add.ellipse(n.x,n.y,35,10,0x243b45,.2).setDepth(n.y-.2),staticFrame:true,dir:'down',elapsed:0};}else visual=createCitizenActor(this,n.x,n.y,n.sheet||n.sheetIndex||[6,7,8,9,10][this.npcs.length%5],104);const citizen={...visual,...n,zone:n.fixed?null:n.zone||{x:n.x-65,y:n.y-40,w:130,h:80},wait:1000+Math.random()*2500,target:null,stuck:0};this.npcs.push(citizen);return citizen;}
  addLou(){const origin=this.map.lou||(this.location==='solace-job-apartment'?{x:1010,y:610}:{x:this.player.x+85,y:this.player.y});this.lou=this.npcs.find(n=>n.id==='lou')||this.addPerson({id:'lou',name:'Lou',...origin,sheet:9,fixed:true});this.lou.follower=getProgress().flags.CH3_LOU_MEETING_COMPLETE&&this.location!=='solace-job-apartment';}
  roam(n,zone,delta,dt,speed){super.roam(n,zone,delta,dt,speed);paint(n,0);}
  applyEvent(event){const p=getProgress();if(this.player&&Number.isFinite(this.player.x)&&Number.isFinite(this.player.y)){p.location=this.location;p.position={x:this.player.x,y:this.player.y};}const r=story.transition(p,event);Object.assign(p,r.state);this.progressFlags=p.flags;save();this.updateObjective();return r;}
  showLines(lines,speaker=this.lou||this.player,done=()=>{}){this.showDialogue(story.dialogueLines(lines,getProgress()),speaker,done);}
  say(text,speaker=this.player,done=()=>{}){this.showLines([{speaker:speaker===this.player?'{hero}':speaker.name||'Notice',side:speaker===this.player?'hero':'npc',text}],speaker,done);}
  travel(location,position,extra={}){if(this.transitioning)return;for(const slot of this.slots||[])if(!disabledDrone(getProgress(),this.location,slot.id)){slot.enemy=null;slot.rolled=false;}super.travel(location,position||mapFor(location)?.arrival,extra);}
  resumeStory(){
   if(this.transitioning||this.dialog||this.cutscene)return;const p=getProgress();
   if(!p.flags.CH3_STARTED&&this.location==='solace-transit'){
    const arrived=this.applyEvent('arrive');if(!arrived.changed){this.locked=false;return;}
   }
   const pending=story.resumeEvent(p);
   if(pending?.type==='sequence'){
    const destination=pending.id==='lou-job'?'solace-job-apartment':pending.id==='reunion'?'solace-lou-apartment':pending.id==='arrival'||pending.id==='phone'?'solace-transit':pending.id==='targeted-attack'||pending.id==='lou-join'?'solace-commercial':pending.id==='roof-intro'||pending.id==='mission-cache'?'solace-mega-roof':pending.id==='lockdown'?'solace-mega-meeting':pending.id==='service-elevator'?'solace-nr4-access':null;
    if(destination&&this.location!==destination){this.travel(destination,mapFor(destination).arrival);return;}
    if(!this.lou&&['lou-job','reunion','lou-join','targeted-attack','lockdown','roof-intro','mission-cache','service-elevator'].includes(pending.id))this.addLou();
    this.runSequence(pending);return;
   }
   if(pending?.type==='solace-battle'){
    if(this.location==='solace-clinic'){this.applyEvent('attack-aborted');this.locked=false;return;}
    if(this.location!=='solace-commercial'){this.travel('solace-commercial',mapFor('solace-commercial').arrival);return;}
    this.beginBattle('solaceSecurity',null,['solaceSecurity','solaceDrone']);return;
   }
   if(pending?.type==='containment-battle'){
    if(this.location==='solace-clinic'){this.applyEvent('boss-aborted');this.locked=false;return;}
    if(this.location!=='solace-mega-roof'){this.travel('solace-mega-roof',mapFor('solace-mega-roof').arrival);return;}
    this.beginBattle('containment8');return;
   }
   if(p.flags.CH3_ATTACK_COMPLETE&&!p.flags.CH3_LOU_JOINED&&this.location==='solace-commercial'){this.applyEvent('join-start');this.resumeStory();return;}
   if(p.flags.CH3_BOSS_DEFEATED&&!p.flags.CH3_NR4_CODE&&this.location==='solace-mega-roof'){this.applyEvent('cache-start');this.resumeStory();return;}
   this.locked=false;this.arrival=false;
  }
  disembark(done){this.arrival=true;this.locked=true;this.player.x-=105;paint(this.player);this.tweens.add({targets:this.player,x:this.player.x+105,duration:900,onUpdate:()=>{this.player.dir='right';this.player.walking=true;paint(this.player,20);},onComplete:()=>{this.player.walking=false;paint(this.player);this.arrival=false;this.locked=false;done();}});}
  runSequence(pending){
   if(this.sequence||this.dialog)return;
   const id=pending.id,offset=pending.step||0;this.sequence={id,offset};
   if(id==='lou-join'&&offset>=4)this.demonstrateJammer(true);
   if(id==='lou-job'){this.player.sprite.setVisible(false);this.player.shadow.setVisible(false);this.cameras.main.stopFollow();this.cameras.main.centerOn(this.map.width/2,this.map.height/2);}
   const complete=()=>{this.sequence=null;const result=this.applyEvent('sequence-complete');
    if(result.effects.includes('solace-battle')){this.beginBattle('solaceSecurity',null,['solaceSecurity','solaceDrone']);return;}
    if(result.effects.includes('containment-battle')){this.beginBattle('containment8');return;}
    if(id==='lou-job'){this.travel('solace-transit',{x:1030,y:1410});return;}
    if(id==='lockdown'){this.travel(this.location,{x:this.player.x,y:this.player.y});return;}
    if(id==='lou-join'){if(!this.lou)this.addLou();this.lou.follower=true;}
    if(id==='service-elevator'){this.showEndpoint();return;}
    this.resumeStory();
   };
   const remaining=(pending.lines||story.dialogueLines(story.SCENES[id]||[],getProgress())).slice(offset);
   if(!remaining.length){complete();return;}
   this.showLines(remaining,this.lou||this.player,complete);
  }
  renderDialogue(){super.renderDialogue();if(this.sequence){const line=this.dialog.messages[this.dialog.index];if(line.action)this.sceneAction(line.action);}}
  advanceDialogue(){if(this.actionBusy)return;if(this.sequence)this.applyEvent({type:'sequence-step',step:this.sequence.offset+this.dialog.index+1});super.advanceDialogue();}
  sceneAction(action){
   const key=this.sequence.id+':'+this.dialog.index+':'+action;if(this.solvedAction===key)return;this.solvedAction=key;
   const move=(who,x,y,duration=850,done=()=>{})=>{if(!who)return done();this.actionBusy=true;who.staging=true;who.dir=direction(x-who.x,y-who.y);this.tweens.add({targets:who,x,y,duration,ease:'Sine.easeInOut',onUpdate:()=>{who.walking=true;paint(who,20);},onComplete:()=>{who.walking=false;who.staging=false;paint(who);this.actionBusy=false;done();}});};
   const weapon=()=>{if(this.lou)equipLouHalberd(this.lou);};
   if(action==='bus-disembark'&&!getProgress().flags.CH3_ARRIVAL_SEEN){this.actionBusy=true;this.disembark(()=>{this.actionBusy=false;this.locked=true;});}
   if(action==='lou-check-controller')move(this.lou,990,590,1000);
   if(action==='lou-repair-controller'){this.actionBusy=true;sound.automaticDoor();this.lou.dir='up';this.time.delayedCall(1000,()=>{this.actionBusy=false;});}
   if(action==='appliances-start'){sound.automaticDoor();const lamp=this.add.circle(1180,400,5,0x80e2b2).setDepth(600);this.tweens.add({targets:lamp,alpha:.5,duration:550,yoyo:true,repeat:2});}
   if(action==='lou-pack-tools')move(this.lou,920,690,700);
   if(action==='lou-fetch-halberd'){this.lou.homePoint={x:this.lou.x,y:this.lou.y};move(this.lou,1320,670,850,()=>move(this.lou,1320,455,500,()=>{this.lou.sprite.setVisible(false);this.lou.shadow.setVisible(false);}));}
   if(action==='lou-return-halberd'){this.lou.sprite.setVisible(true);this.lou.shadow.setVisible(true);weapon();const target=this.lou.homePoint||{x:850,y:670};move(this.lou,1320,670,500,()=>move(this.lou,target.x,target.y,850));}
   if(action==='lou-ready-halberd')weapon();
   if(action==='camera-tracks-player'){
    this.cameras.main.pan(this.player.x,this.player.y-75,600,'Sine.easeInOut');
    for(const [id,kind,dx]of [['response-officer','solaceSecurity',-180],['response-drone','solaceDrone',190]])this.addPatrol({id,kind,x:this.player.x+dx,y:this.player.y-180});
   }
   if(action==='drones-approach'){this.demonstrateJammer();for(const e of this.enemies.values())if(e.id.startsWith('jammer-demo'))move(e,this.player.x+120+(e.id.endsWith('1')?100:0),this.player.y-80,1200);}
   if(action==='jammer-on')this.applyEvent('jammer-activate');
   if(action==='drones-drop'){for(const e of disableNearbyDrones(getProgress(),this.location,this.lou,this.enemies.values()))this.fallDrone(e);save();}
   if(action==='lockdown-blackout'){sound.powerDown();this.actionBusy=true;this.blackout=this.add.rectangle(0,0,VIEW.width,VIEW.height,0x03090c,.94).setOrigin(0).setScrollFactor(0).setDepth(9001);this.time.delayedCall(850,()=>this.actionBusy=false);}
   if(action==='lockdown-emergency'){this.blackout?.destroy();if(!this.emergencyLight)this.emergencyLight=this.add.rectangle(0,0,VIEW.width,VIEW.height,0x490812,.35).setOrigin(0).setScrollFactor(0).setDepth(9000);sound.setMode('dungeon');}
   if(action==='lou-release-door')move(this.lou,865,815,900,()=>sound.automaticDoor());
   if(action==='lou-read-cache')move(this.lou,1090,750,650);
   if(action==='lou-check-elevator')move(this.lou,840,465,750);
   if(action==='lou-enable-elevator'){sound.automaticDoor();this.cameras.main.shake(180,.001);}
  }
  demonstrateJammer(approached=false){for(let i=0;i<2;i++)this.addPatrol({id:'jammer-demo-'+i,kind:'solaceDrone',x:this.player.x+(approached?120:310)+i*100,y:this.player.y-(approached?80:110)});}
  addPatrol(slot,disabled=false){if(this.enemies.has(slot.id))return;const stats=SOLACE_ENEMIES[slot.kind]||ENEMIES[slot.kind];if(!stats)return;const x=slot.enemy?.x??slot.x,y=slot.enemy?.y??slot.y;const key=stats.mapTexture||'water-enemies',frame=stats.mapTexture?(key.startsWith('solace-')?'__BASE':'portrait'):'water-3';const sprite=this.add.sprite(x,y,key,frame).setOrigin(.5,1);sprite.setScale((stats.containment?140:100)/sprite.height).setDepth(y);const enemy={x,y,sprite,shadow:this.add.ellipse(x,y-2,45,12,0x132637,.25).setDepth(y-.2),kind:slot.kind,id:slot.id,dir:'down',elapsed:0,staticFrame:true,wait:0,target:null,disabled,slot};this.enemies.set(slot.id,enemy);if(disabled)this.fallDrone(enemy,true);}
  fallDrone(enemy,instant=false){enemy.disabled=true;enemy.target=null;const finish=()=>{enemy.sprite.setAngle(80).setAlpha(.75).setDepth(enemy.y-25);enemy.shadow.setAlpha(.1);};if(instant)finish();else{sound.powerDown();this.tweens.add({targets:enemy.sprite,y:enemy.y+15,angle:80,alpha:.75,duration:380,onComplete:finish});}}
  beginBattle(id,spawnId=null,ids=null){if(this.transitioning)return;super.beginBattle(id,spawnId);state.origin.scene='Solace';state.encounter.ids=ids;state.encounter.noRun=id==='solaceSecurity'&&!getProgress().flags.CH3_ATTACK_COMPLETE||id==='containment8';state.encounter.checkpoint={scene:'Solace',location:'solace-clinic',position:mapFor('solace-clinic').arrival};state.origin.onBattleWon=(p,encounter)=>{if(encounter.id==='solaceSecurity'&&!p.flags.CH3_ATTACK_COMPLETE)Object.assign(p,story.transition(p,'attack-defeated').state);if(encounter.id==='containment8')Object.assign(p,story.transition(p,'boss-defeated').state);const slot=state.solaceSlots?.[encounter.region]?.find(s=>s.id===encounter.spawnId);if(slot){slot.enemy=null;slot.rolled=true;slot.defeated=true;}};state.origin.onBattleLost=(p,encounter)=>{if(encounter.id==='solaceSecurity')Object.assign(p,story.transition(p,'attack-aborted').state);if(encounter.id==='containment8')Object.assign(p,story.transition(p,'boss-aborted').state);};}
  update(time,delta){
   if(this.coreUI?.mode)return;advanceText(this,delta);if(!this.player)return;this.updateOcclusion();if(this.cutscene){if(this.writer?.done){this.cutscene.hold+=Math.min(delta,100);if(this.cutscene.hold>=(this.cutscene.pages[this.cutscene.index].hold||2300))this.advanceNarration();}return;}

   if(this.locked){for(const n of [this.player,...this.npcs]){if(n.staging)continue;n.walking=false;n.talking=this.dialog?.activeSpeaker===n;paint(n,delta);}return;}
   const p=getProgress(),dt=Math.min(delta,45)/1000,k=this.keys,before=encounterBounds(this.player);let dx=Number(k.right.isDown||k.right2.isDown||control.right)-Number(k.left.isDown||k.left2.isDown||control.left),dy=Number(k.down.isDown||k.down2.isDown||control.down)-Number(k.up.isDown||k.up2.isDown||control.up);
   if(new URLSearchParams(location.search).get('dev')==='1'&&this.qaWalkPath?.length){const dest=this.qaWalkPath[0];if(Math.hypot(dest.x-this.player.x,dest.y-this.player.y)<14)this.qaWalkPath.shift();else{dx=dest.x-this.player.x;dy=dest.y-this.player.y;}}
   const step=normalizedMovement(dx,dy,325,dt),moved=walk(this.player,step.x,step.y,(x,y)=>this.canStand(x,y,this.npcs));Object.assign(this.player,moved,{walking:moved.moved,talking:false});if(dx||dy)this.player.dir=direction(dx,dy);paint(this.player,delta);
   for(const n of this.npcs)if(n!==this.lou)this.roam(n,n.zone,delta,dt,52);
   if(this.lou?.follower){if(moved.moved)this.followTrail.push({x:this.player.x,y:this.player.y});if(this.followTrail.length>13){const target=this.followTrail.shift(),step=normalizedMovement(target.x-this.lou.x,target.y-this.lou.y,355,dt),m=walk(this.lou,step.x,step.y,(x,y)=>this.canStand(x,y));this.lou.dir=direction(step.x,step.y);Object.assign(this.lou,m,{walking:m.moved});}else this.lou.walking=false;paint(this.lou,delta);}
   for(const drone of disableNearbyDrones(p,this.location,this.lou,this.enemies.values())){this.fallDrone(drone);save();}
   if(this.map.exterior&&p.flags.CH3_TRANSIT_LEAD&&p.flags.CH3_DELIVERY_LEAD&&p.flags.CH3_VENDING_LEAD&&!p.flags.CH3_ATTACK_COMPLETE&&!p.flags.CH3_ATTACK_STARTED&&this.location==='solace-commercial'&&Math.hypot(this.player.x-1140,this.player.y-920)<=245){this.applyEvent('attack-start');this.resumeStory();return;}
   this.spawnClock+=delta;if(this.spawnClock>500){this.spawnClock=0;for(const slot of this.slots){const distance=Math.hypot(slot.x-this.player.x,slot.y-this.player.y);if(slot.defeated&&distance>1200){slot.defeated=false;slot.rolled=false;}if(slot.rolled||distance>780||slot.requiresFlag&&!p.flags[slot.requiresFlag]||this.map.dungeon&&!p.flags.CH3_LOCKDOWN||this.map.exterior&&!p.flags.CH3_JAMMER_ACTIVE)continue;slot.rolled=true;if(Math.random()<(slot.chance??.75)){slot.enemy={x:slot.x,y:slot.y};this.addPatrol(slot);}}}
   for(const enemy of this.enemies.values()){
    if(enemy.disabled)continue;const slot=enemy.slot;if(slot?.defeated){this.removeEnemy(enemy.id);continue;}const ebefore=encounterBounds(enemy),distance=Math.hypot(enemy.x-this.player.x,enemy.y-this.player.y);
    if(distance<620){const step=normalizedMovement(this.player.x-enemy.x,this.player.y-enemy.y,365,dt),m=walk(enemy,step.x,step.y,(x,y)=>this.canStand(x,y));Object.assign(enemy,m,{walking:m.moved});if(!m.moved){const detour=walk(enemy,step.y,-step.x,(x,y)=>this.canStand(x,y));Object.assign(enemy,detour);}}
    paint(enemy,delta);if(slot?.enemy)Object.assign(slot.enemy,{x:enemy.x,y:enemy.y});
    if(disableNearbyDrones(p,this.location,this.lou,[enemy]).length){this.fallDrone(enemy);save();continue;}
    if(!postBattleImmune(state)&&sweptTouchingBounds(before,encounterBounds(this.player),ebefore,encounterBounds(enemy))){this.beginBattle(enemy.kind,enemy.id);return;}
   }
   this.updateOcclusion();const near=this.nearest();$('#prompt').hidden=!near;if(near)$('#prompt').innerHTML='<b>Z / ENTER</b>'+esc(near.kind==='npc'?'Talk to '+near.name:near.name||'Examine');
  }
  interact(){
   if(this.actionBusy)return;if(this.dialog){if(!finishText(this))this.advanceDialogue();return;}if(this.locked||this.transitioning)return;const near=this.nearest();if(!near)return;const p=getProgress();
   if(near.kind==='building'){const actual=(this.map.doors||[]).find(d=>d.target===near.target);if(actual&&Math.hypot(actual.x-this.player.x,actual.y-this.player.y)<=180)this.interactDoor(actual);return;}
   if(near.kind==='door'){
    this.interactDoor(near);return;
   }
   if(near.kind==='npc'){
    if(near.id==='lou'&&this.location==='solace-lou-apartment'&&!p.flags.CH3_LOU_MEETING_COMPLETE){this.applyEvent('reunion-start');this.resumeStory();return;}
    if(near.service){this.showLines([{speaker:near.name,text:near.text||'Good afternoon. What can I do for you?'}],near.speaker,()=>this.openSolaceService(near.service));return;}
    const plan=story.conversation(near.id,p);if(plan){const lines=plan.lines.map(line=>line.speaker===plan.npc.name?{...line,speaker:near.name}:line);this.showLines(lines,near.speaker,()=>{if(plan.event)this.applyEvent(plan.event);this.resumeStory();});return;}
    this.say(near.text||near.flavor||'My stop is the next one. I always bring a book.',near.speaker);return;
   }
   this.activateFeature(near);
  }
  nearest(){
   const candidates=[...(this.interactables||[]),...(this.npcs||[]).map(n=>({...n,kind:'npc',speaker:n,range:120}))].map(n=>({...n,distance:Math.hypot(n.x-this.player.x,n.y-this.player.y)})).filter(n=>n.distance<=(n.range||122)&&(!n.facilityDoor||canInteractDoor(this.player,n))).sort((a,b)=>a.distance-b.distance);
   // A following party member should never intercept an intended door or panel.
   const intended=candidates.find(n=>n.id!=='lou'||!this.lou?.follower)||candidates[0];
   const door=candidates.find(n=>n.kind==='door'&&n.facilityDoor&&n.distance<135);
   const facing={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[this.player.dir]||[0,1];
   const npcAhead=intended?.kind==='npc'&&intended.id!=='lou'&&intended.distance<75&&((intended.x-this.player.x)*facing[0]+(intended.y-this.player.y)*facing[1])/Math.max(1,intended.distance)>.65;
   return door&&!npcAhead?door:intended;
  }
  interactDoor(near){
   if(!canInteractDoor(this.player,near))return;const p=getProgress(),gates=Array.isArray(near.gate)?near.gate:[near.gate].filter(Boolean);
   if(gates.some(gate=>!story.canAccess(p,gate))||near.blockedBy&&p.flags[near.blockedBy]){
    const hints={'circuit8-west':'West hall access needs power from the emergency routing panel.','circuit8-east':'East hall access needs power from the emergency routing panel.','circuit21-shutters':'The remote control passage needs both security shutters and ventilation energized.',nr4service:'The contractor records office requires a referral from the rehabilitation center’s public reception.','meeting-exit':'The meeting room latch is locked. Lou is checking its local release.'};
    this.say(near.lockedText||hints[gates.find(gate=>!story.canAccess(p,gate))]||'The access indicator remains locked. The local controls can release it.',this.lou||this.player);return;
   }
   if(!mapFor(near.target))return;
   if(near.event)this.applyEvent(near.event);sound.automaticDoor();
   if(near.visual==='elevator')this.startNarration(['The lift doors close.','The floor indicator advances.'],()=>this.travel(near.target,near.position),true);
   else this.travel(near.target,near.position);
  }
  activateFeature(near){
   const p=getProgress(),aliases={'medical-logistics':'medical-routes','power-records':'power-trace','nr4-elevator':'elevator-start','meeting-rest':'lockdown-start',containment8:'roof-start','mission-cache':'cache-start'},raw=near.action||near.event||near.id,id=aliases[raw]||raw;
   if(near.gate&&!story.canAccess(p,near.gate)){this.say('The local system is not available yet.');return;}
   if(id==='bus'){
    this.startNarration(['The regional bus heads back toward Fairmont Junction.','Bellwether connections leave from the same terminal.'],()=>{p.location='fairmont';p.position={...FAIRMONT_ARRIVAL};save();this.scene.start('Fairmont',{location:'fairmont',position:p.position});},true);return;
   }
   if(near.kind==='shop'){this.openSolaceService(near.service||'food');return;}
   if(near.kind==='rest'||id==='rest'){restore(p);restoreParty(p);save();this.say('The first-aid supplies are intact. Everyone’s HP is restored.');return;}
   if(near.kind==='item'||id==='supply'){const flag='CH3_PICKUP_'+near.id;if(p.flags[flag]){this.say('The supply compartment is empty.');return;}const item=near.item||'field-meal';if(item==='sandwich')p.snacks++;else p.inventory.push(item);p.flags[flag]=true;save();this.say('Found '+(CONSUMABLES[item]?.name||'a supply item')+'.');return;}
   if(near.kind==='vending'||id==='vending-lead'||id==='vending'){this.useVending();return;}
   if(['circuit8','circuit21','transfer21'].includes(id)){
    const needed=id==='circuit8'?'CH3_LOBBY_SERVICE_OPEN':'CH3_FLOOR14_COMPLETE';if(!p.flags[needed]){this.say('The emergency supply is isolated until the preceding floor’s route is restored.');return;}
    this.openCircuit(id);return;
   }
   if(['roof-start','lockdown-start','elevator-start','reunion-start','cache-start'].includes(id)){
    if(id==='elevator-start'&&p.flags.CH3_NR4_ELEVATOR_FOUND){this.showEndpoint();return;}
    const result=this.applyEvent(id);if(result.changed||story.resumeEvent(p))this.resumeStory();else this.say(id==='roof-start'&&p.flags.CH3_BOSS_DEFEATED?'The containment unit’s movement systems remain disabled.':id==='cache-start'&&p.flags.CH3_NR4_CODE?'The mission fragment is safely copied: SLC-NR4, secure medical transport, alive.':'The local controls are waiting for the previous requirements.');return;
   }
   if(id==='plaza-camera'){if(story.investigationComplete(p)&&!p.flags.CH3_ATTACK_COMPLETE){this.applyEvent('attack-start');this.resumeStory();}else this.say('A standard city camera turns above the pedestrian route.');return;}
   if(id==='main-lift'){this.say(p.flags.CH3_LOCKDOWN?'MAIN ELEVATORS: ACCESS RESTRICTED. The call button remains red.':'Resident access is required. The concierge can assign a meeting room.');return;}
   if(id==='meeting-bypass'){this.say(p.flags.CH3_MEETING_RELEASED?'Lou has released the meeting-room latch. We should check the lobby.':'The latch is under local control. The meeting room is ready; we can sit first.',this.lou||this.player);return;}
   if(id==='job-relay'){this.say('The replaced contactor is secure. The load-side voltage is steady.',this.lou||this.player);return;}
   if(id==='directory'){this.say('TRANSIT: regional buses and shops. CENTRAL: services and cafés. RESIDENTIAL: Orchard Court and Meridian Megacomplex. NORTH: Lou’s Northline address, clinics and medical transport.');return;}
   const plan=story.conversation(id,p);if(plan){this.showLines(plan.lines,this.lou||this.player,()=>{if(plan.event)this.applyEvent(plan.event);this.resumeStory();});return;}
   const feedback={
    'lobby-service':['The front entrance has a physical steel barrier behind it. I cannot shift that quickly. This local relay opens the protected stair route.','The service route is already enabled. The only practical way out is upward.'],
    west8:['West distribution test passed. Its inspection contact is latched.','West inspection requires the west hall circuit to be energized.'],east8:['East distribution test passed. Its inspection contact is latched.','East inspection requires the east hall circuit to be energized.'],
    relay14:['The elevator power relay is restored. Its security authorization still needs the separate management panel.','The local elevator power relay is already restored.'],
    bypass14:['Local authorization accepted. The service elevator can reach Level 21.','The authorization panel needs the elevator power relay restored first.'],
    west31:['West roof override latched. The roof stair also needs the east-wing release.','The west roof release remains latched.'],east31:['East roof override latched. The roof stair also needs the west-wing release.','The east roof release remains latched.']
   };
   if(feedback[id]){const result=this.applyEvent(id);this.say(near.text||feedback[id][result.changed?0:1],this.lou||this.player,()=>this.resumeStory());return;}
   if(near.event){const result=this.applyEvent(near.event);this.say(near.text||(result.changed?'The controller acknowledges the change.':'The controller is waiting for the other local requirements.'),this.lou||this.player,()=>this.resumeStory());return;}
   this.say(near.text||'The display shows normal service.');
  }
  openSolaceService(type){if(type==='clinic'){restore(getProgress());restoreParty(getProgress());save();this.say('Take a seat. We can patch you both up.');return;}
   type=type==='parts'?'gear':type==='cafe'?'coffee':type;
   const ids=type==='gear'?['resonant-drive','laminate-vest']:type==='coffee'?['caramel-macchiato','snack','field-meal']:['snack','field-meal'];
   const offers=ids.map(id=>{const item=id==='snack'?CONSUMABLES.sandwich:CONSUMABLES[id]||GEAR[id];return [id,item.name+' · '+item.price+' credits',item.heal?'Restores '+item.heal+' HP':item.attack?'Attack +'+item.attack:'Defense +'+item.defense];});
   this.openShop({title:this.map.title,region:'SOLACE',offers,purchase:id=>buy(getProgress(),id)});
  }
  useVending(){
   const p=getProgress(),inspect=()=>{
    if(p.flags.CH3_LOU_MEETING_COMPLETE&&!p.flags.CH3_VENDING_LEAD){const plan=story.conversation('vending-lead',p);this.showLines(plan.lines,this.lou||this.player,()=>{if(plan.event)this.applyEvent(plan.event);});}
    else this.say(p.flags.CH3_VENDING_LEAD?'The saved diagnostic shows two processes: payment authentication and human response classification.':'The fingerprint reader charged the account automatically. The receipt is saved.');
   };
   if(p.flags.CH3_VENDING_USED){inspect();return;}
   this.showLines([{speaker:'Vending terminal',text:'One bottled coffee: eight credits. Place a finger on the identification pad. Payment is linked to your transit account.'},{speaker:'{hero}',side:'hero',text:'All right.'}],this.player,()=>{
    if(p.credits<8){this.say('Insufficient balance. The terminal returns to its welcome screen.');return;}
    const result=this.applyEvent('vending-use');if(!result.changed)return;
    this.showLines([{speaker:'Vending terminal',text:'PAYMENT AUTHENTICATION COMPLETE. Eight credits charged. Your coffee is ready.'}],this.player,inspect);
   });
  }
  openCircuit(id){this.locked=true;this.menu='solace-circuit';this.writer=null;this.circuit=id;this.circuits=[];this.renderCircuit();}
  renderCircuit(message=''){const labels=this.circuit==='circuit8'?{west:'WEST HALL',east:'EAST HALL',stair:'STAIR CONTROL'}:{traction:'ELEVATOR TRACTION',shutters:'SECURITY SHUTTERS',vent:'FIRE / VENTILATION'};$('#overlay').className='menu-ui';$('#overlay').innerHTML='<section class="notebook service solace-circuit"><small>LOCAL EMERGENCY DISTRIBUTION</small><h2>Route two circuits</h2><p>'+esc(message||'Only two circuits can be energized. Inspect the floor and choose a route before changing the supply.')+'</p>'+Object.entries(labels).map(([id,label])=>'<button data-action="solace-circuit:'+id+'" aria-pressed="'+this.circuits.includes(id)+'">'+(this.circuits.includes(id)?'■ ':'□ ')+label+'</button>').join('')+'<button data-action="solace-circuit-apply">Apply routing</button><button data-action="menu-close">Close panel</button></section>';}
  showEndpoint(){this.locked=false;this.arrival=false;this.say('NR4. The hidden service route is powered and ready. Lou leaves the controller set; we finally know where Cenexis wanted to take me.',this.player);}
  handleAction(action){if(action.startsWith('solace-circuit:')&&this.menu==='solace-circuit'){const id=action.split(':')[1];if(this.circuits.includes(id))this.circuits=this.circuits.filter(c=>c!==id);else if(this.circuits.length<2)this.circuits.push(id);this.renderCircuit();$('#overlay [data-action="'+action+'"]').focus();return;}if(action==='solace-circuit-apply'&&this.menu==='solace-circuit'){if(this.circuits.length!==2){this.renderCircuit('Choose exactly two circuits.');return;}const result=this.applyEvent({type:this.circuit,circuits:this.circuits});this.renderCircuit(result.changed?'Routing accepted. The local status indicators change.':'That route cannot be energized yet. Check the other control points.');sound.automaticDoor();return;}super.handleAction(action);}
 };
}



