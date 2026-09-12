import {BattleMusic} from '../lab/battle-music.mjs';
import {fountainVolume} from './city-world.mjs';
const EFFECT_FILES={vibrosword:'vibrosword-electric',bash:'bash-heavy',fanfare:'battle-start-guitar',victory:'battle-victory','security-alarm':'argus-security-alarm','argus-boosters':'argus-blue-boosters','argus-stabilize':'argus-stabilize'};
const ENTRANCE_EFFECTS=new Set(['security-alarm','argus-boosters','argus-stabilize']);
const LOOP_EFFECTS=new Set(['security-alarm','argus-boosters']);
export class CityAudio {
 constructor(onChange=()=>{}){
  this.enabled=true;this.context=null;this.effects={};this.effectLoads={};this.lastLetter=0;this.onChange=onChange;this.mode='title';this.visible=true;this.playingEffects=new Set();this.requestedLoops=new Set();
  const options={contextFactory:()=>this.getContext(),onError:()=>this.onChange(),onReady:()=>{if(this.menu?.gain)this.menu.gain.gain.value=.5;this.onChange();}};
  this.town=new BattleMusic(new URL('./assets/town.wav',import.meta.url).href,{...options,resumeOnStart:true});
  this.fairmontTown=new BattleMusic(new URL('./assets/fairmont-junction-industrial-town.wav',import.meta.url).href,{...options,resumeOnStart:true});
  this.fairmontCity=new BattleMusic(new URL('./assets/fairmont-city-machine.wav',import.meta.url).href,{...options,resumeOnStart:true});
  this.battle=new BattleMusic(new URL('../lab/assets/robot-in-the-reagent-room.wav',import.meta.url).href,options);
  // Distance-controlled ambience must begin silently. Starting at the music
  // player's normal gain caused a full-volume transient before the first ramp.
  this.water=new BattleMusic(new URL('./assets/fountain.wav',import.meta.url).href,{...options,initialVolume:0});
  this.menu=new BattleMusic(new URL('./assets/name-select.wav',import.meta.url).href,options);
  this.dungeon=new BattleMusic(new URL('./assets/below-the-intake-waterworks.mp3',import.meta.url).href,{...options,resumeOnStart:true});
  this.factory=new BattleMusic(new URL('./assets/ch2_drone_factory_theme.wav',import.meta.url).href,{...options,resumeOnStart:true});
  this.argus=new BattleMusic(new URL('./assets/ch2_argus_battle_theme.wav',import.meta.url).href,options);
  this.waterDistance=Infinity;
 }
 get tracks(){return [this.town,this.fairmontTown,this.fairmontCity,this.battle,this.water,this.menu,this.dungeon,this.factory,this.argus];}
 get failed(){return this.tracks.some(t=>t.failed)||this.effectFailed;}
 getContext(){if(!this.context||this.context.state==='closed')this.context=new (globalThis.AudioContext||globalThis.webkitAudioContext)();return this.context;}
 unlock(retry=false){
  const loads=this.tracks.map(track=>track.unlock({retry:retry&&track.failed}));
  const files=EFFECT_FILES;
  if(retry){this.effectFailed=false;for(const key of Object.keys(files))if(!this.effects[key])delete this.effectLoads[key];}
  for(const [key,file]of Object.entries(files))if(!this.effectLoads[key])this.effectLoads[key]=globalThis.fetch(new URL('./assets/'+file+'.wav',import.meta.url)).then(r=>{if(!r.ok)throw new Error('Effect unavailable');return r.arrayBuffer();}).then(b=>this.getContext().decodeAudioData(b)).then(b=>{this.effects[key]=b;if(this.requestedLoops.has(key))this.effect(key);this.onChange();}).catch(()=>{this.effectFailed=true;this.onChange();});
  return Promise.all([...loads,...Object.values(this.effectLoads)]).then(results=>{for(const key of this.requestedLoops)this.effect(key);return results;});
 }
 setMode(mode){
  this.mode=mode;
  // Stop all nonselected sources before starting the new one. In particular,
  // the entrance has no music and the boss never shares a source with its factory.
  const selected=mode==='fairmont-city'||mode==='fairmont-industrial'?this.fairmontCity:mode==='fairmont-interior'?this.fairmontTown:mode==='dungeon'?this.dungeon:mode==='factory'?this.factory:mode==='argus-battle'?this.argus:mode==='battle'?this.battle:mode==='menu'?this.menu:mode==='city'||mode==='interior'?this.town:null;
  for(const track of this.tracks)if(track!==selected&&(track!==this.water||!['city','fairmont-city'].includes(mode)))track.stop();
  selected?.start();if(selected===this.menu&&this.menu.gain)this.menu.gain.gain.value=.5;
  if(mode!=='transition')this.stopEffects('fanfare');if(mode!=='victory')this.stopEffects('victory');
  if(mode!=='argus-entrance')for(const key of ENTRANCE_EFFECTS)this.stopEffects(key);
 }
 setEnabled(enabled){this.enabled=enabled;for(const track of this.tracks)track.setEnabled(enabled);if(!enabled)this.silenceEffects();else this.resumeLoops();this.onChange();}
 setVisible(visible){this.visible=visible;for(const track of this.tracks)track.setVisible(visible);if(!visible)this.silenceEffects();else this.resumeLoops();}
 resumeLoops(){if(this.mode==='argus-entrance'&&this.enabled&&this.visible)for(const key of this.requestedLoops)this.effect(key);}
 fountain(distance){this.waterDistance=distance;const volume=fountainVolume(distance);if(['city','fairmont-city'].includes(this.mode)&&volume>.001){this.water.start();if(this.water.gain)this.water.gain.gain.setTargetAtTime(volume,this.context.currentTime,.12);}else this.water.stop();}
 effect(key){
  if((ENTRANCE_EFFECTS.has(key)&&this.mode!=='argus-entrance')||(key==='fanfare'&&this.mode!=='transition')||(key==='victory'&&this.mode!=='victory'))return;
  if(LOOP_EFFECTS.has(key))this.requestedLoops.add(key);
  if(!this.enabled||!this.visible)return;
  if(this.context?.state!=='running')return;
  if(LOOP_EFFECTS.has(key)&&[...this.playingEffects].some(effect=>effect.key===key))return;
  const buffer=this.effects[key];if(!buffer)return;
  const node=this.context.createBufferSource(),gain=this.context.createGain(),playing={key,node,gain};
  node.buffer=buffer;node.loop=LOOP_EFFECTS.has(key);
  const volume=key==='bash'?.70:key==='victory'?.63:key==='security-alarm'?.82:key==='argus-boosters'?.70:key==='argus-stabilize'?.75:.65;
  if(node.loop){gain.gain.setValueAtTime(0,this.context.currentTime);gain.gain.linearRampToValueAtTime(volume,this.context.currentTime+.015);}else gain.gain.value=volume;
  node.connect(gain);gain.connect(this.context.destination);this.playingEffects.add(playing);
  node.onended=()=>{node.disconnect();gain.disconnect();this.playingEffects.delete(playing);};node.start();
 }
 stopEffects(key){
  if(key)this.requestedLoops.delete(key);else this.requestedLoops.clear();
  this.silenceEffects(key);
 }
 // Temporary mute/visibility suspension silences nodes but retains only the
 // active entrance's loop intent. Explicit stop/scene cleanup clears it above.
 silenceEffects(key){
  for(const effect of this.playingEffects)if(!key||key===effect.key){effect.node.stop();effect.node.disconnect();effect.gain.disconnect();this.playingEffects.delete(effect);}
 }
 powerDown(){const c=this.context;if(!this.enabled||!this.visible||c?.state!=='running')return;for(let i=0;i<3;i++){const node=c.createOscillator(),gain=c.createGain(),start=c.currentTime+i*.55;node.type='triangle';node.frequency.setValueAtTime(460,start);node.frequency.exponentialRampToValueAtTime(180,start+.4);gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(.07,start+.03);gain.gain.exponentialRampToValueAtTime(.0001,start+.45);node.connect(gain);gain.connect(c.destination);const playing={key:'powerdown',node,gain};this.playingEffects.add(playing);node.onended=()=>{node.disconnect();gain.disconnect();this.playingEffects.delete(playing);};node.start(start);node.stop(start+.46);}}
 letter(character,voice=0){
  const c=this.context;if(!this.enabled||!this.visible||c?.state!=='running'||!/\S/.test(character)||c.currentTime-this.lastLetter<.04)return;
  this.lastLetter=c.currentTime;const osc=c.createOscillator(),gain=c.createGain();osc.type='triangle';osc.frequency.value=voice===4?410:640+(character.codePointAt(0)%7)*32+voice*70;gain.gain.setValueAtTime(.024,c.currentTime);gain.gain.exponentialRampToValueAtTime(.0001,c.currentTime+.035);osc.connect(gain);gain.connect(c.destination);osc.onended=()=>{osc.disconnect();gain.disconnect();};osc.start();osc.stop(c.currentTime+.04);
 }
 stop(){for(const track of this.tracks)track.stop();this.stopEffects();}
}
