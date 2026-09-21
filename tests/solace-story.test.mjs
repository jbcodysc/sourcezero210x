import test from 'node:test';
import assert from 'node:assert/strict';
import {freshProgress,validProgress} from '../city/progress.mjs';
import {CHAPTERS} from '../city/chapter-start.mjs';
import {transition,resumeEvent,SCENES,conversation,finishConversation,dialogueLines,objective,canAccess,investigationComplete} from '../solace/story.mjs';
import {DEV_CHAPTERS,developerCheckpointsEnabled,createSolaceCheckpoint} from '../solace/checkpoints.mjs';
const copy=value=>JSON.parse(JSON.stringify(value));
const event=(state,type)=>transition(state,type).state;
const done=s=>event(s,'sequence-complete');
function run(s,events){for(const step of events)s=event(s,step);return s;}
function completeIntro(s){while(s.chapter3Sequence)s=done(s);return s;}
function leads(){return run(createSolaceCheckpoint('3-investigation','Morgan'),['transit-lead','delivery-lead','vending-use','vending-lead']);}

test('Solace only begins after Chapter 2; arrival, phone and electrician scene resume in order',()=>{
 const fresh=freshProgress('Morgan');assert.equal(transition(fresh,'arrive').changed,false);
 let s=event({...fresh,flags:{CH2_COMPLETE:true}},'arrive');assert.equal(s.flags.CH3_STARTED,true);assert.equal(resumeEvent(s).id,'arrival');
 assert.equal(transition(s,'arrive').changed,false);
 s=event(s,{type:'sequence-step',step:2});assert.equal(resumeEvent(copy(s)).step,2);
 s=done(s);assert.equal(resumeEvent(s).id,'phone');s=done(s);assert.equal(resumeEvent(s).id,'lou-job');
 s=event(s,{type:'sequence-step',step:7});assert.equal(resumeEvent(copy(s)).step,7);
 s=done(s);assert.equal(s.flags.CH3_LOU_JOB_SEEN,true);assert.equal(resumeEvent(s),null);assert.match(objective(s),/Northern District/);
 assert.equal(transition(s,'sequence-complete').changed,false);
});

test('the three leads permit any order, require Lou reunion and separate biometric payment',()=>{
 let s=createSolaceCheckpoint('3-arrival');assert.equal(transition(s,'transit-lead').changed,false);s=completeIntro(s);assert.equal(transition(s,'delivery-lead').changed,false);
 for(const order of [['transit-lead','delivery-lead','vending-lead'],['delivery-lead','vending-lead','transit-lead'],['vending-lead','transit-lead','delivery-lead']]){
  let current=createSolaceCheckpoint('3-investigation');assert.equal(transition(current,'vending-lead').changed,false);const credits=current.credits,count=current.inventory.length;
  current=event(current,'vending-use');assert.equal(current.credits,credits-8);assert.equal(current.inventory.length,count+1);assert.equal(transition(current,'vending-use').changed,false);
  for(const lead of order){current=event(copy(current),lead);assert.equal(transition(current,lead).changed,false);}
  assert.equal(investigationComplete(current),true);assert.equal(current.flags.CH3_LOU_JOINED,undefined);assert.equal(current.party?.length||0,0);
 }
});

test('Cenexis attack is resumable and introduces Lou only upon witnessing deliberate targeting',()=>{
 let s=leads();assert.equal(transition({...s,flags:{...s.flags,CH3_DELIVERY_LEAD:false}},'attack-start').changed,false);
 s=event(s,'attack-start');assert.equal(s.chapter3Sequence.id,'targeted-attack');assert.equal(s.party?.length||0,0);assert.equal(transition(s,'attack-start').changed,false);
 s=done(s);assert.equal(resumeEvent(copy(s)).type,'solace-battle');assert.equal(s.party.length,1);assert.equal(s.party[0].id,'lou');assert.equal(s.flags.CH3_LOU_JOINED,undefined);
 s=event(s,'attack-aborted');assert.equal(resumeEvent(copy(s)),null);assert.equal(s.flags.CH3_ATTACK_RETRY,true);
 s=event(s,'attack-start');assert.equal(s.party.length,1);assert.equal(resumeEvent(s).type,'solace-battle');
 s=event(s,'attack-defeated');assert.equal(s.flags.CH3_ATTACK_COMPLETE,true);assert.equal(resumeEvent(s),null);
 s=event(s,'join-start');s=event(s,'jammer-activate');assert.equal(s.flags.CH3_JAMMER_ACTIVE,true);s=done(s);
 assert.equal(s.flags.CH3_LOU_JOINED,true);assert.equal(s.party.length,1);assert.equal(copy(s).party[0].weapon,'electro-halberd');assert.equal(transition(s,'join-start').changed,false);
 assert.equal(transition(s,'attack-start').changed,false);
});

test('lockdown and successive floors cannot skip local routing or opposite-wing controls',()=>{
 let s=createSolaceCheckpoint('3-megacomplex');assert.equal(canAccess(s,'floor8'),false);assert.equal(canAccess(s,'meeting'),false);
 s=event(s,'concierge');assert.equal(canAccess(s,'meeting'),true);s=event(s,'lockdown-start');assert.equal(canAccess(s,'meeting-exit'),false);s=done(s);assert.equal(canAccess(s,'meeting-exit'),true);
 assert.equal(transition(s,'relay14').changed,false);s=event(s,'lobby-service');
 assert.equal(transition(s,'west8').changed,false);assert.equal(transition(s,{type:'circuit8',circuits:['west','east','stair']}).changed,false);
 s=event(s,{type:'circuit8',circuits:['west','east']});assert.equal(canAccess(s,'circuit8-west'),true);assert.equal(canAccess(s,'circuit8-east'),true);
 s=run(s,['west8','east8']);assert.equal(canAccess(s,'floor14'),false);s=event(s,{type:'circuit8',circuits:['east','stair']});assert.equal(canAccess(s,'floor14'),true);
 assert.equal(transition(s,'bypass14').changed,false);s=run(s,['relay14','bypass14']);assert.equal(canAccess(s,'floor21'),true);
 assert.equal(transition(s,{type:'transfer21',circuits:['traction','vent']}).changed,false);
 s=event(s,{type:'circuit21',circuits:['shutters','vent']});assert.equal(canAccess(s,'circuit21-shutters'),true);
 assert.equal(transition(s,{type:'transfer21',circuits:['traction','shutters']}).changed,false);s=event(s,{type:'transfer21',circuits:['traction','vent']});assert.equal(canAccess(s,'floor31'),true);assert.equal(canAccess(s,'circuit21-shutters'),true);
 s=event(s,'east31');assert.equal(canAccess(s,'roof'),false);s=event(s,'west31');assert.equal(canAccess(s,'roof'),true);
 assert.equal(transition(s,'cache-start').changed,false);s=event(s,'roof-start');assert.equal(s.chapter3Sequence.id,'roof-intro');s=done(s);assert.equal(resumeEvent(copy(s)).type,'containment-battle');
 s=event(s,'boss-aborted');assert.equal(resumeEvent(copy(s)),null);s=event(s,'roof-start');assert.equal(resumeEvent(s).type,'containment-battle');
 s=event(s,'boss-defeated');s=event(s,'cache-start');s=done(s);assert.equal(canAccess(s,'bridge'),true);assert.equal(transition(s,'roof-start').changed,false);assert.equal(transition(s,'cache-start').changed,false);
});

test('medical investigation requires multiple leads, cleanup then physical evidence, ending at elevator',()=>{
 let s=createSolaceCheckpoint('3-nr4');assert.equal(s.flags.CH3_NR4_CODE,true);assert.equal(s.flags.CH3_NR4_IDENTIFIED,undefined);
 for(const action of ['medical-worker','records-return','power-trace','elevator-start'])assert.equal(transition(s,action).changed,false,action);
 s=finishConversation(s,conversation('medical-routes',s)).state;assert.equal(s.flags.CH3_NR4_ROUTES,true);assert.equal(s.flags.CH3_NR4_IDENTIFIED,undefined);
 s=finishConversation(s,conversation('medical-worker',s)).state;assert.equal(s.flags.CH3_NR4_IDENTIFIED,true);
 s=finishConversation(s,conversation('medical-routes',s)).state;assert.equal(s.flags.CH3_RECORDS_REMOVED,true);
 assert.equal(canAccess(s,'nr4service'),false);assert.equal(transition(s,'power-trace').changed,false);
 s=finishConversation(s,conversation('neuro-reception',s)).state;assert.equal(s.flags.CH3_NEURO_PUBLIC_CONTEXT,true);assert.equal(canAccess(s,'nr4service'),true);
 const proof=conversation('power-trace',s);s=finishConversation(s,proof).state;assert.equal(s.flags.CH3_POWER_TRACE,true);
 s=event(s,'elevator-start');assert.equal(resumeEvent(copy(s)).id,'service-elevator');s=done(s);assert.equal(s.flags.CH3_NR4_ELEVATOR_FOUND,true);assert.equal(s.flags.CH3_NR4_AVAILABLE,true);assert.equal(objective(s),'Enter NR4.');
 assert.equal(resumeEvent(s),null);assert.equal(transition(s,'elevator-start').changed,false);assert.equal(transition(s,'enter-nr4').changed,false);
 assert.equal(s.location,'solace-north','story reducer never invents an NR4 map transition');
});

test('outdoor rehabilitation patient cannot replace the public reception referral',()=>{
 let s=run(createSolaceCheckpoint('3-nr4'),['medical-routes','medical-worker','records-return']);
 const patient=conversation('therapy-patient',s);
 assert.equal(patient.npc.name,'Theo');assert.equal(patient.event,null);
 assert.match(patient.lines.map(p=>p.text).join(' '),/rehabilitation team/);
 s=finishConversation(s,patient).state;
 assert.equal(s.flags.CH3_NEURO_PUBLIC_CONTEXT,undefined);
 assert.equal(canAccess(s,'nr4service'),false);
 assert.equal(transition(s,'power-trace').changed,false);
 s=finishConversation(s,conversation('neuro-reception',s)).state;
 assert.equal(s.flags.CH3_NEURO_PUBLIC_CONTEXT,true);
 assert.equal(canAccess(s,'nr4service'),true);
});

test('story scripts keep identity private, practical repair and no premature explanation',()=>{
 const text=Object.values(SCENES).flat().map(p=>p.text).join(' ');
 assert.doesNotMatch(text,/\bmagic\b|magical|test subjects|human experimentation/i);
 assert.match(SCENES['lou-job'].map(p=>p.text).join(' '),/upstream.*downstream.*contactor/s);
 assert.equal(SCENES['lou-job'].filter(p=>p.text==='KITCHEN ELECTRICAL SYSTEMS ARE OPERATING WITHIN NORMAL PARAMETERS.').length,2);
 assert.match(SCENES.reunion.map(p=>p.text).join(' '),/built a vibrosword.*awesome.*electro-halberd/s);
 assert.match(SCENES['targeted-attack'].map(p=>p.text).join(' '),/private recovery operation/);
 assert.match(SCENES['roof-intro'].map(p=>p.text).join(' '),/Security Combat Response Autonomous Pursuer.*S\.C\.R\.A\.P\..*amusing/s);
 assert.match(SCENES['mission-cache'].map(p=>p.text).join(' '),/CONDITION: ALIVE.*SLC-NR4.*SECURE MEDICAL TRANSPORT/s);
 const formatted=dialogueLines(SCENES['targeted-attack'],{name:'Morgan'});assert.ok(formatted.some(p=>p.text.includes('Morgan')));assert.ok(formatted.some(p=>p.speaker==='Morgan'&&p.side==='hero'));
});

test('developer starts are opt-in and seed complete playable saves without exposing NR4 contents',()=>{
 assert.equal(developerCheckpointsEnabled('?dev=1'),true);assert.equal(developerCheckpointsEnabled(''),false);assert.equal(developerCheckpointsEnabled('?dev=false'),false);
 assert.ok(CHAPTERS.every(c=>!String(c.id).startsWith('3-')));
 const expected=[['3-arrival',26,false],['3-investigation',26,false],['3-megacomplex',27,true],['3-nr4',30,true]];
 assert.equal(DEV_CHAPTERS.length,4);
 for(const [id,level,joined] of expected){const s=createSolaceCheckpoint(id,'Morgan');assert.equal(validProgress(s),true);assert.equal(s.level,level);assert.equal(s.name,'Morgan');assert.equal(s.flags.CH2_COMPLETE,true);assert.equal(s.credits,5000);assert.equal(Boolean(s.flags.CH3_LOU_JOINED),joined);assert.equal(s.flags.CH3_NR4_ELEVATOR_FOUND,undefined);assert.equal(s.flags.CH3_NR4_AVAILABLE,undefined);if(joined){assert.equal(s.party[0].level,level);assert.equal(s.party[0].hp,s.party[0].maxHp);}assert.deepEqual(copy(s).flags,s.flags);}
 assert.throws(()=>createSolaceCheckpoint('3-final-boss'),RangeError);
});
