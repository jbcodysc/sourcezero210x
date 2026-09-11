import {BattleMusic} from '../lab/battle-music.mjs';
import {fountainVolume} from './city-world.mjs';
export class CityAudio {
 constructor(onChange=()=>{}){
  this.enabled=true;this.context=null;this.effects={};this.effectLoads={};this.lastLetter=0;this.onChange=onChange;this.mode='title';this.visible=true;this.playingEffects=new Set();
  const options={contextFactory:()=>this.getContext(),onError:()=>this.onChange(),onReady:()=>{if(this.menu?.gain)this.menu.gain.gain.value=.5;this.onChange();}};
  this.town=new BattleMusic(new URL('./assets/town.wav',import.meta.url).href,{...options,resumeOnStart:true});
  this.battle=new BattleMusic(new URL('../lab/assets/robot-in-the-reagent-room.wav',import.meta.url).href,options);
  this.water=new BattleMusic(new URL('./assets/fountain.wav',import.meta.url).href,options);
  this.menu=new BattleMusic(new URL('./assets/name-select.wav',import.meta.url).href,options);
  this.dungeon=new BattleMusic(new URL('./assets/below-the-intake-waterworks.mp3',import.meta.url).href,{...options,resumeOnStart:true});
  this.waterDistance=Infinity;
 }
 get tracks(){return [this.town,this.battle,this.water,this.menu,this.dungeon];}
 get failed(){return this.tracks.some(t=>t.failed)||this.effectFailed;}
 getContext(){if(!this.context||this.context.state==='closed')this.context=new (globalThis.AudioContext||globalThis.webkitAudioContext)();return this.context;}
 unlock(retry=false){
  for(const track of this.tracks)track.unlock({retry:retry&&track.failed});
  const files={vibrosword:'vibrosword-electric',bash:'bash-heavy',fanfare:'battle-start-guitar',victory:'battle-victory'};
  if(retry){this.effectFailed=false;for(const key of Object.keys(files))if(!this.effects[key])delete this.effectLoads[key];}
  for(const [key,file]of Object.entries(files))if(!this.effectLoads[key])this.effectLoads[key]=globalThis.fetch(new URL('./assets/'+file+'.wav',import.meta.url)).then(r=>{if(!r.ok)throw new Error('Effect unavailable');return r.arrayBuffer();}).then(b=>this.getContext().decodeAudioData(b)).then(b=>{this.effects[key]=b;this.onChange();}).catch(()=>{this.effectFailed=true;this.onChange();});
 }
 setMode(mode){this.mode=mode;if(mode==='dungeon')this.dungeon.start();else this.dungeon.stop();if(mode==='city'||mode==='interior')this.town.start();else this.town.stop();if(mode==='battle')this.battle.start();else this.battle.stop();if(mode==='menu'){this.menu.start();if(this.menu.gain)this.menu.gain.gain.value=.5;}else this.menu.stop();if(mode!=='city')this.water.stop();if(mode!=='transition')this.stopEffects('fanfare');if(mode!=='victory')this.stopEffects('victory');}
 setEnabled(enabled){this.enabled=enabled;for(const track of this.tracks)track.setEnabled(enabled);if(!enabled)this.stopEffects();this.onChange();}
 setVisible(visible){this.visible=visible;for(const track of this.tracks)track.setVisible(visible);if(!visible)this.stopEffects();}
 fountain(distance){this.waterDistance=distance;const volume=fountainVolume(distance);if(this.mode==='city'&&volume>.001){this.water.start();if(this.water.gain)this.water.gain.gain.setTargetAtTime(volume,this.context.currentTime,.12);}else this.water.stop();}
 effect(key){if(!this.enabled||!this.visible||this.context?.state!=='running'||(key==='fanfare'&&this.mode!=='transition')||(key==='victory'&&this.mode!=='victory'))return;const buffer=this.effects[key];if(buffer){const node=this.context.createBufferSource(),gain=this.context.createGain(),playing={key,node,gain};node.buffer=buffer;gain.gain.value=key==='bash'?.70:key==='victory'?.63:.65;node.connect(gain);gain.connect(this.context.destination);this.playingEffects.add(playing);node.onended=()=>{node.disconnect();gain.disconnect();this.playingEffects.delete(playing);};node.start();}}
 stopEffects(key){for(const effect of this.playingEffects)if(!key||key===effect.key){effect.node.stop();effect.node.disconnect();effect.gain.disconnect();this.playingEffects.delete(effect);}}
 letter(character,voice=0){
  const c=this.context;if(!this.enabled||!this.visible||c?.state!=='running'||!/\S/.test(character)||c.currentTime-this.lastLetter<.04)return;
  this.lastLetter=c.currentTime;const osc=c.createOscillator(),gain=c.createGain();osc.type='triangle';osc.frequency.value=voice===4?410:640+(character.codePointAt(0)%7)*32+voice*70;gain.gain.setValueAtTime(.024,c.currentTime);gain.gain.exponentialRampToValueAtTime(.0001,c.currentTime+.035);osc.connect(gain);gain.connect(c.destination);osc.onended=()=>{osc.disconnect();gain.disconnect();};osc.start();osc.stop(c.currentTime+.04);
 }
 stop(){for(const track of this.tracks)track.stop();this.stopEffects();}
}
