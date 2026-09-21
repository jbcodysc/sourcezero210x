/** Opt-in developer starts. Never add these entries to the normal chapter menu. */
import {createChapterProgress} from '../city/chapter-start.mjs';
import {award,xpThreshold} from '../city/progress.mjs';
import {transition} from './story.mjs';

export const DEV_CHAPTERS=Object.freeze([
 {id:'3-arrival',badge:'DEV',title:'Chapter 3 — Solace arrival',description:'Developer checkpoint. Arrive by bus; phone call and Lou’s service visit.'},
 {id:'3-investigation',badge:'DEV',title:'Chapter 3 — First investigation',description:'Developer checkpoint. Reunion complete; all three leads available.'},
 {id:'3-megacomplex',badge:'DEV',title:'Chapter 3 — Megacomplex',description:'Developer checkpoint. Lou joined and jammer active; normal residential lobby.'},
 {id:'3-nr4',badge:'DEV',title:'Chapter 3 — NR4 investigation',description:'Developer checkpoint. Rooftop escape complete; follow the medical transport clue.'}
]);
export const developerCheckpointsEnabled=search=>new URLSearchParams(search).get('dev')==='1';

export function createSolaceCheckpoint(id,name='Alex'){
 if(!DEV_CHAPTERS.some(p=>p.id===id))throw new RangeError('Unknown Solace developer checkpoint');
 let s=createChapterProgress('2-facility',name);
 Object.assign(s.flags,{CH2_DRONE_FACILITY_ENTERED:true,CH2_CORE_SHUTTERS:true,CH2_ARGUS_ENTRANCE_STARTED:true,CH2_ARGUS_ENTRANCE_SEEN:true,CH2_SCRAP_NAMED:true,CH2_ARGUS_DEFEATED:true,CH2_ARGUS_ESCAPE_SEEN:true,CH2_ARGUS_WALL_BREACHED:true,CH2_ARGUS_REFLECTION_SEEN:true,CH2_COMPLETE:true});
 s.notes.push('The archive at Fairmont traces the deployment software toward Solace.');
 const apply=event=>{s=transition(s,event).state;};
 const finish=()=>{let guard=0;while(s.chapter3Sequence&&guard++<8)apply('sequence-complete');};
 apply('arrive');
 let level=26;s.location='solace-transit';s.position={x:1030,y:1410};
 if(id!=='3-arrival'){
  finish();apply('reunion-start');finish();s.location='solace-commercial';s.position={x:1140,y:1410};
 }
 if(['3-megacomplex','3-nr4'].includes(id)){
  for(const event of ['transit-lead','delivery-lead','vending-use','vending-lead','attack-start'])apply(event);
  finish();apply('attack-defeated');apply('join-start');finish();
  level=27;s.location='solace-mega-lobby';s.position={x:768,y:810};
 }
 if(id==='3-nr4'){
  for(const event of ['concierge','lockdown-start'])apply(event);finish();apply('lobby-service');
  apply({type:'circuit8',circuits:['west','east']});apply('west8');apply('east8');apply({type:'circuit8',circuits:['east','stair']});
  apply('relay14');apply('bypass14');apply({type:'circuit21',circuits:['shutters','vent']});apply({type:'transfer21',circuits:['traction','vent']});apply('west31');apply('east31');
  apply('roof-start');finish();apply('boss-defeated');apply('cache-start');finish();apply('roof-escape');
  level=30;s.location='solace-north';s.position={x:1140,y:1410};
 }
 award(s,Math.max(0,xpThreshold(level)-s.xp),0);s.hp=s.maxHp;s.credits=5000;s.snacks=10;
 for(const item of ['field-meal','caramel-macchiato']){s.inventory=s.inventory.filter(x=>x!==item);s.inventory.push(...Array(10).fill(item));}
 // Re-create neither membership nor story. Level and restore the same saved allies.
 for(const member of s.party||[]){while(member.level<s.level){member.level++;member.maxHp+=member.growth?.health||14;member.attack+=member.growth?.attack||3;member.defense+=member.growth?.defense||2;member.speed+=member.growth?.speed||1;}member.xp=s.xp;member.hp=member.maxHp;}
 s.visited=[...new Set([...s.visited,'solace-transit',s.location])];
 return s;
}
