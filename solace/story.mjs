/** Chapter 3's story rules are independent of scenes, timers, storage and input. */
import {joinLou} from '../city/party.mjs';

export const has=(s,key)=>Boolean(s.flags?.[key]);
const all=(s,...keys)=>keys.every(key=>has(s,key));
export const LEAD_FLAGS=['CH3_TRANSIT_LEAD','CH3_DELIVERY_LEAD','CH3_VENDING_LEAD'];
export const investigationComplete=s=>LEAD_FLAGS.every(key=>has(s,key));
export const CONTAINMENT_NAME='Adaptive Behavioral Containment Unit — Series 8';
const line=(speaker,text,extra={})=>({speaker,text,...extra});
const hero=text=>line('{hero}',text);
const lou=(text,extra={})=>line('Lou',text,extra);
const narration=(text,extra={})=>line('Narration',text,extra);

export const SCENES=Object.freeze({
 arrival:[
  narration('SOLACE. Life, simplified.',{action:'bus-disembark'}),
  line('Bus driver','Solace Transit District. Take your time getting down.'),
  narration('A delivery cart waits for a pedestrian. Above it, a camera quietly follows the next bus into its bay.'),
  hero('The deployment records lead here. And Lou is here. I should call him.')
 ],
 phone:[
  lou('Hey! It has been a while. Everything okay?'),
  hero('I am in Solace.'),
  lou('You are? Oh, that is great. When did you get here?'),
  hero('Just now. There is something strange I have been looking into. Could we meet?'),
  lou('Of course. I am finishing an electrical job on the south residential side. I will send you my address. Meet me there.'),
  hero('Thanks, Lou.'),
  narration('Lou sends an address in the Northern District. The route crosses the commercial center and residential quarter.')
 ],
 'lou-job':[
  narration('Meanwhile, at a residential service call…'),
  line('Mrs. Salcedo','The milk is warm again. And the oven has been preheating since breakfast.'),
  line('Apartment assistant','KITCHEN ELECTRICAL SYSTEMS ARE OPERATING WITHIN NORMAL PARAMETERS.'),
  line('Mrs. Salcedo','It says the electrics are fine. Maybe I picked the wrong oven setting.'),
  lou('Let me check the load side.',{action:'lou-check-controller'}),
  lou('The sensor is upstream of this contactor. The contacts downstream are pitted; the appliances lose their connection under load.'),
  narration('Lou isolates the circuit, verifies it is dead, and replaces the failing contactor.',{action:'lou-repair-controller'}),
  narration('He restores the circuit. The refrigerator compressor starts. The oven indicator begins climbing.',{action:'appliances-start'}),
  line('Apartment assistant','KITCHEN ELECTRICAL SYSTEMS ARE OPERATING WITHIN NORMAL PARAMETERS.'),
  lou('Now they are.'),
  line('Mrs. Salcedo','Huh.'),
  narration('She checks the oven, then approves Lou’s invoice. He packs his tools.',{action:'lou-pack-tools'})
 ],
 reunion:[
  lou('There you are! Come in. It is good to see you.'),
  hero('You too. Nice place.'),
  lou('Still figuring out where everything goes. Wait—what is that? You built a vibrosword?'),
  hero('Yeah.'),
  lou('Seriously?'),
  narration('Lou leans closer to look at the grip and the blade assembly.'),
  lou('That is awesome. Hold on.',{action:'lou-fetch-halberd'}),
  narration('Lou disappears into the workroom. He returns with a long electro-halberd.',{action:'lou-return-halberd'}),
  hero('You kept building things too.'),
  lou('Yeah. Turns out I never stopped. So, what brought you all this way?'),
  hero('A delivery robot attacked me in Bellwether. It knew my name. Following its software took me to Fairmont.'),
  hero('There were hidden scanning routines, and drones at a manufacturing facility. Their security machine called itself Security Combat Response Autonomous Pursuer.'),
  lou('That is a mouthful.'),
  hero('S.C.R.A.P. He said something about my “resonance,” then tried to take it back. The records behind him route through Solace.'),
  lou('I have seen machines do things that looked deliberate. Bad sensors, conflicting instructions, a controller trusting the wrong reading.'),
  lou('Usually I tell people to stay clear and call the owner. But you are saying these ones went looking for you?'),
  hero('They recognized me in two different cities. They had orders to take me alive.'),
  lou('Okay. That sounds different. I cannot tell you what it means yet. Let us take a look.'),
  lou('The transit gates, the delivery routes, and those fingerprint service kiosks all use the city integration network. Someone will have noticed something.')
 ],
 'targeted-attack':[
  lou('That camera has followed you all the way across the plaza.',{action:'camera-tracks-player'}),
  hero('I have seen this before.'),
  line('Cenexis private security','{hero}. Remain where you are. This is a private recovery operation.'),
  line('Cenexis drone','BELLWETHER IDENTITY CONFIRMED. RESONANCE PROFILE MATCH. RECOVERY AUTHORIZED.'),
  lou('They just said your name. And that word.'),
  hero('Stay back.'),
  lou('No. We are doing this together.',{action:'lou-ready-halberd'}),
  narration('Both allies now take turns. Each can attack, guard, or use an item. A healing item or Guard acts before attacks.')
 ],
 'lou-join':[
  lou('Okay. That was not a bad sensor. They were sent for you.'),
  hero('I still do not know why.'),
  lou('Neither do I. But I am coming with you.'),
  narration('Two more Cenexis drones turn into the street.',{action:'drones-approach'}),
  hero('More of them.'),
  lou('Wait. These use the same control protocol. Let me try something.'),
  narration('Lou switches on a small device at his tool belt.',{action:'jammer-on'}),
  lou('It is on. It disrupts their radio control link. Only that drone system; the rest of the street will keep working.'),
  narration('The approaching drones lose control and settle hard onto the pavement. They do not get up.',{action:'drones-drop'}),
  lou('I will leave it running. Let us get off the street. The residential complex has rooms we can sit in.')
 ],
 lockdown:[
  line('Concierge','Your private meeting room is ready. Please make yourselves comfortable.'),
  lou('Just a few minutes to think.'),
  narration('The normal lights shut off.',{action:'lockdown-blackout'}),
  narration('Dim red emergency lights come on. The door locks.',{action:'lockdown-emergency'}),
  line('Building announcement','Please remain where you are. Temporary access restrictions are in effect.'),
  lou('This door has a local release. Give me a moment.',{action:'lou-release-door'}),
  narration('Lou removes the cover and operates the isolated release. The latch opens.'),
  lou('We should check the lobby.')
 ],
 'roof-intro':[
  line(CONTAINMENT_NAME,'{hero}. Your recovery has been assigned to me. Please remain alive and available.'),
  hero('Another Cenexis machine.'),
  line(CONTAINMENT_NAME,'You have demonstrated considerable persistence, including your encounter with the Security Combat Response Autonomous Pursuer.'),
  hero('Oh. You mean S.C.R.A.P.?'),
  line(CONTAINMENT_NAME,'That designation was not intended as an acronym.'),
  hero('Maybe it should have been.'),
  line(CONTAINMENT_NAME,'…I concede that is amusing.'),
  line(CONTAINMENT_NAME,'Spontaneous humor remains an interesting human capability. It does not alter my instructions.'),
  line(CONTAINMENT_NAME,'Restraint systems armed. Recovery condition: alive.')
 ],
 'mission-cache':[
  line(CONTAINMENT_NAME,'Movement system unavailable. Containment probability… unacceptable.'),
  lou('The local service port still has power. I can read its mission cache.',{action:'lou-read-cache'}),
  line('Mission cache','TARGET: BELLWETHER SUBJECT\nSTATUS: RECOVERY AUTHORIZED\nCONDITION: ALIVE'),
  line('Mission cache','TRANSFER DESTINATION: SLC-NR4\nROUTE: SECURE MEDICAL TRANSPORT'),
  hero('SLC-NR4.'),
  lou('Whatever NR4 is, they wanted you taken there alive.'),
  lou('There is a maintenance bridge to the next building. We can get down that way.')
 ],
 'service-elevator':[
  lou('The old feeder goes behind this wall. Same branch as the section missing from the public plan.'),
  narration('Lou opens the service controller’s cover.',{action:'lou-check-elevator'}),
  line('Service controller','LOCAL DESTINATIONS: BASEMENT / SERVICE ACCESS / NR4 — DISABLED'),
  hero('There it is.'),
  lou('The public elevators do not list it. This controller still does.'),
  narration('Lou tests the local control wiring and bridges the disabled service input.',{action:'lou-enable-elevator'}),
  line('Service controller','NR4 SERVICE ROUTE AVAILABLE. CAR RESPONSE CONFIRMED.'),
  lou('It still runs. This is the way.'),
  hero('Then this is where the trail leads.')
 ]
});

export const LEAD_DIALOGUE=Object.freeze({
 transit:[line('Gate attendant','A second scan? It does that sometimes. My pass still works.'),lou('The maintenance interface is separate from the passenger display.'),line('Transit maintenance','PRIMARY: TRAVEL AUTHORIZATION. SECONDARY: CIVIC INTEGRATION / CENEXIS BUILD FAMILY C-17.'),hero('That is the same software family I saw in Fairmont.'),lou('The extra process is not needed to open a gate. Its job is not listed here.')],
 delivery:[line('Nadia, parcel shop','They stop and look at people sometimes. Customer recognition, I suppose. Then they get on with the delivery.'),lou('There is the route upload. And another packet just after it.'),line('Delivery diagnostics','ROUTE TELEMETRY: ACKNOWLEDGED. SECONDARY PAYLOAD: UPLOADED. DESTINATION: ENCRYPTED.'),hero('It is sending something else.'),lou('Yes. Small packets, nothing to do with parcel weight or its route. I cannot read the destination.')],
 vending:[line('Vending assistant','FINGERPRINT ACCEPTED. ACCOUNT CHARGED. THANK YOU.'),lou('Wait. Payment finished, but it is still checking something.'),line('Service diagnostics','PROCESS A: PAYMENT AUTHENTICATION — COMPLETE.\nPROCESS B: HUMAN RESPONSE CLASSIFICATION — COMPLETE.'),hero('Human response classification?'),lou('Two separate processes. That second one is not charging for your drink. I do not know what it is measuring.')]
});

export const NPCS=Object.freeze({
 lou:{name:'Lou'},concierge:{name:'Residential concierge'},'transit-lead':{name:'Gate attendant'},'delivery-lead':{name:'Nadia, parcel shop'},'vending-lead':{name:'Vending assistant'},'therapy-patient':{name:'Theo'},
 'medical-routes':{name:'Anika, medical dispatch'},'medical-worker':{name:'Marta, transport technician'},'records-return':{name:'Anika, medical dispatch'},'neuro-reception':{name:'Rehabilitation receptionist'},'power-trace':{name:'Lou'},
 commuter:{name:'Maren'},recommendations:{name:'Davi'},waiting:{name:'Felix'},groceries:{name:'Ada'},resident:{name:'Kenji'},manual:{name:'Talia'},runner:{name:'Imani'},gardener:{name:'Rosa'},musician:{name:'Beckett'},student:{name:'Milo'},nurse:{name:'Nurse Bell'},barista:{name:'Jules'},machinist:{name:'Faye'},deli:{name:'Marco'}
});
export const AMBIENT=Object.freeze({
 commuter:['The annex? I know I have been there. Ask the street terminal; I follow its directions.'],
 recommendations:['It gave me four restaurants today. Usually it just picks one. I have been standing here longer than lunch takes.'],
 waiting:['Seventeen minutes remaining. That is what it said when I came back from breakfast.'],
 groceries:['The little cart carries the milk. I carry the flowers. This arrangement makes sense to both of us.'],
 resident:['My apartment assistant schedules the deliveries. I only notice when there are too many bananas.'],
 manual:['It wants me to type the appointment time myself. I suppose I do know when I am free.'],
 runner:['The canal loop is good for running. Early in the morning you can have almost the whole path to yourself.'],
 gardener:['Those planters are real. The watering is automatic, but pruning is still my favorite part.'],
 musician:['We rehearse above the deli. If you hear the same eight bars six times, we are getting somewhere.'],
 student:['I am meeting my sister after her shift. She promised to tell me which of these cafés actually bakes on site.'],
 nurse:['A few minutes of first aid and you will be on your feet. Your friend can sit over there.'],
 barista:['Welcome in. There is a quieter table by the window if you want to sit down.'],
 machinist:['I repair controllers and fit proper parts. Bring the old assembly; measurements beat product recommendations.'],
 deli:['The hot meals are ready. Take something substantial if you are walking across town.']
});

export function dialogueLines(items,s={}){return items.map(item=>{const p=typeof item==='string'?narration(item):item;return {...p,speaker:p.speaker==='{hero}'?(s.name||'Alex'):p.speaker,side:p.speaker==='{hero}'||p.speaker===(s.name||'Alex')?'hero':'npc',text:p.text.replaceAll('{hero}',s.name||'Alex')};});}
export function objective(s){
 if(has(s,'CH3_NR4_ELEVATOR_FOUND'))return 'Enter NR4.';
 if(has(s,'CH3_POWER_TRACE'))return 'Follow the old feeder through the neurological center’s service basement.';
 if(has(s,'CH3_RECORDS_REMOVED'))return has(s,'CH3_NEURO_PUBLIC_CONTEXT')?'Find physical evidence in the neurological center’s contractor electrical plans.':'Visit the neurological center’s public reception to locate its contractor records.';
 if(has(s,'CH3_NR4_IDENTIFIED'))return 'Return to medical dispatch and compare the old NR4 supply records.';
 if(has(s,'CH3_NR4_ROUTES'))return 'Find someone who remembers the neurological center’s receiving areas.';
 if(has(s,'CH3_ROOF_ESCAPED'))return 'Find out what SLC-NR4 means. Start with medical transport.';
 if(has(s,'CH3_NR4_CODE'))return 'Cross the rooftop maintenance bridge and descend to the street.';
 if(has(s,'CH3_BOSS_DEFEATED'))return 'Have Lou inspect the containment unit’s local mission cache.';
 if(has(s,'CH3_FLOOR31_COMPLETE'))return 'Reach the rooftop emergency access.';
 if(has(s,'CH3_FLOOR21_COMPLETE'))return 'Find the two roof-stair overrides in opposite upper residential wings.';
 if(has(s,'CH3_FLOOR14_COMPLETE'))return 'Restore the service elevator through the mechanical floor’s local power controls.';
 if(has(s,'CH3_FLOOR8_COMPLETE'))return 'Restore the amenity-floor elevator: local power, then security authorization.';
 if(has(s,'CH3_LOBBY_SERVICE_OPEN'))return 'Route emergency power across Level 8 and release the next stair shutter.';
 if(has(s,'CH3_LOCKDOWN'))return 'Escape the megacomplex. Check the lobby and its service panel.';
 if(has(s,'CH3_MEETING_ASSIGNED'))return 'Enter the concierge’s private meeting room.';
 if(has(s,'CH3_JAMMER_ACTIVE'))return 'Find somewhere to sit in the nearby residential megacomplex.';
 if(has(s,'CH3_ATTACK_COMPLETE'))return 'Check on Lou after the attack.';
 if(investigationComplete(s))return 'Compare the three leads with Lou in the central plaza.';
 if(has(s,'CH3_LOU_MEETING_COMPLETE'))return 'Investigate the transit gate, parcel deliveries, and biometric vending with Lou.';
 if(has(s,'CH3_LOU_JOB_SEEN'))return 'Meet Lou at his apartment in the Northern District.';
 return 'Arrive in Solace and call Lou.';
}

export function canAccess(s,gate){
 const flags={meeting:'CH3_MEETING_ASSIGNED',floor8:'CH3_LOBBY_SERVICE_OPEN',floor14:'CH3_FLOOR8_COMPLETE',floor21:'CH3_FLOOR14_COMPLETE',floor31:'CH3_FLOOR21_COMPLETE',roof:'CH3_FLOOR31_COMPLETE',bridge:'CH3_NR4_CODE',nr4service:'CH3_RECORDS_REMOVED',nr4access:'CH3_POWER_TRACE'};
 if(gate==='circuit8-west'||gate==='circuit8-east')return has(s,'CH3_FLOOR8_COMPLETE')||Boolean(s.chapter3Circuit8?.includes(gate.slice(9)));
 if(gate==='circuit21-shutters')return has(s,'CH3_FLOOR21_COMPLETE')||Boolean(s.chapter3Circuit21?.includes('shutters')&&s.chapter3Circuit21?.includes('vent'));
 if(gate==='meeting-exit')return has(s,'CH3_MEETING_RELEASED');
 if(gate==='nr4service')return all(s,'CH3_RECORDS_REMOVED','CH3_NEURO_PUBLIC_CONTEXT');
 return gate==='mega'?has(s,'CH3_JAMMER_ACTIVE'):gate?.startsWith('CH3_')?has(s,gate):flags[gate]?has(s,flags[gate]):false;
}

/** Saved sequences resume their current line; pending fights resume only at their encounter map. */
export function resumeEvent(s){
 const pending=s.chapter3Sequence;
 if(pending&&SCENES[pending.id])return {type:'sequence',id:pending.id,step:Math.max(0,Math.min(SCENES[pending.id].length,Number(pending.step)||0)),lines:dialogueLines(SCENES[pending.id],s)};
 if(has(s,'CH3_ATTACK_PENDING')&&!has(s,'CH3_ATTACK_COMPLETE'))return {type:'solace-battle',step:0};
 if(has(s,'CH3_ROOF_BATTLE_PENDING')&&!has(s,'CH3_BOSS_DEFEATED'))return {type:'containment-battle',step:0};
 return null;
}

/** Idempotent, guarded events. A plain JSON save contains every decision and sequence checkpoint. */
export function transition(s,event){
 const type=typeof event==='string'?event:event?.type;
 const n={...s,flags:{...(s.flags||{})},notes:[...(s.notes||[])],inventory:[...(s.inventory||[])],party:s.party?.map(p=>({...p}))};
 let changed=false;const effects=[];
 const mark=(key,note)=>{if(!n.flags[key]){n.flags[key]=true;changed=true;}if(note&&!n.notes.includes(note)){n.notes.push(note);changed=true;}};
 const clear=key=>{if(n.flags[key]){delete n.flags[key];changed=true;}};
 const set=(key,value)=>{if(JSON.stringify(n[key])!==JSON.stringify(value)){n[key]=value;changed=true;}};
 const sequence=id=>{set('chapter3Sequence',{id,step:0});effects.push('sequence');};
 const finish8=()=>{if(all(n,'CH3_FLOOR8_WEST_CHECKED','CH3_FLOOR8_EAST_CHECKED')&&n.chapter3Circuit8?.includes('stair'))mark('CH3_FLOOR8_COMPLETE','Released Level 8’s stair shutter using the local emergency circuits.');};
 const circuits=(values,allowed)=>Array.isArray(values)&&values.length===2&&new Set(values).size===2&&values.every(x=>allowed.includes(x));
 switch(type){
  case 'arrive':
   if(!has(s,'CH2_COMPLETE')||has(s,'CH3_STARTED'))break;
   mark('CH3_SOLACE_UNLOCKED');mark('CH3_STARTED','Followed the Fairmont deployment records to Solace by bus. Lou lives in the Northern District.');sequence('arrival');break;
  case 'sequence-step':{
   const p=s.chapter3Sequence,step=Number(event.step);if(!p||!SCENES[p.id]||!Number.isInteger(step)||step<=p.step||step>SCENES[p.id].length)break;
   set('chapter3Sequence',{id:p.id,step});break;
  }
  case 'sequence-complete':{
   const id=s.chapter3Sequence?.id;if(!SCENES[id])break;
   set('chapter3Sequence',null);
   if(id==='arrival'){mark('CH3_ARRIVAL_SEEN');sequence('phone');}
   if(id==='phone'){mark('CH3_PHONE_COMPLETE');sequence('lou-job');}
   if(id==='lou-job'){mark('CH3_LOU_JOB_SEEN');effects.push('return-to-arrival');}
   if(id==='reunion')mark('CH3_LOU_MEETING_COMPLETE','Met Lou at his apartment. He brought his electro-halberd and agreed to investigate three civilian systems with me.');
   if(id==='targeted-attack'){mark('CH3_ATTACK_PENDING');clear('CH3_ATTACK_RETRY');joinLou(n);changed=true;effects.push('solace-battle');}
   if(id==='lou-join'){joinLou(n);mark('CH3_LOU_JOINED');mark('CH3_JAMMER_ACTIVE','Lou joined me. His continuously active device disrupts only the familiar Cenexis drones’ radio protocol.');effects.push('jammer-active');}
   if(id==='lockdown'){mark('CH3_LOCKDOWN');mark('CH3_MEETING_RELEASED');}
   if(id==='roof-intro'){mark('CH3_ROOF_INTRO_SEEN');mark('CH3_ROOF_BATTLE_PENDING');clear('CH3_ROOF_RETRY');effects.push('containment-battle');}
   if(id==='mission-cache'){mark('CH3_NR4_CODE','Containment mission cache: BELLWETHER SUBJECT / RECOVERY AUTHORIZED / ALIVE / SLC-NR4 / SECURE MEDICAL TRANSPORT.');}
   if(id==='service-elevator'){mark('CH3_NR4_ELEVATOR_FOUND');mark('CH3_NR4_AVAILABLE','Lou confirmed the hidden service elevator still has a functioning NR4 route.');effects.push('chapter-endpoint');}
   break;
  }
  case 'reunion-start':if(has(s,'CH3_LOU_JOB_SEEN')&&!has(s,'CH3_LOU_MEETING_COMPLETE')&&!s.chapter3Sequence)sequence('reunion');break;
  case 'transit-lead':if(has(s,'CH3_LOU_MEETING_COMPLETE'))mark('CH3_TRANSIT_LEAD','Transit gate: unnecessary secondary scanning uses the same Cenexis build family seen in Fairmont.');break;
  case 'delivery-lead':if(has(s,'CH3_LOU_MEETING_COMPLETE'))mark('CH3_DELIVERY_LEAD','Delivery robot: extra data packets go to an encrypted destination, separate from normal route telemetry.');break;
  case 'vending-use':
   if(!has(s,'CH3_STARTED')||has(s,'CH3_VENDING_USED')||s.credits<8)break;
   n.credits-=8;n.inventory.push('caramel-macchiato');mark('CH3_VENDING_USED');effects.push('fingerprint-payment');break;
  case 'vending-lead':if(all(s,'CH3_LOU_MEETING_COMPLETE','CH3_VENDING_USED'))mark('CH3_VENDING_LEAD','Biometric terminal: payment authentication and HUMAN RESPONSE CLASSIFICATION are separate processes.');break;
  case 'attack-start':
   if(!investigationComplete(s)||has(s,'CH3_ATTACK_COMPLETE')||has(s,'CH3_ATTACK_PENDING')||s.chapter3Sequence)break;
   if(has(s,'CH3_ATTACK_RETRY')){mark('CH3_ATTACK_PENDING');clear('CH3_ATTACK_RETRY');joinLou(n);changed=true;effects.push('solace-battle');}else sequence('targeted-attack');break;
  case 'attack-defeated':if(has(s,'CH3_ATTACK_PENDING')&&!has(s,'CH3_ATTACK_COMPLETE')){clear('CH3_ATTACK_PENDING');mark('CH3_ATTACK_COMPLETE','Cenexis private security identified me by name and mentioned resonance. Lou witnessed the deliberate recovery attempt.');}break;
  case 'attack-aborted':if(has(s,'CH3_ATTACK_PENDING')){clear('CH3_ATTACK_PENDING');mark('CH3_ATTACK_RETRY');}break;
  case 'join-start':if(has(s,'CH3_ATTACK_COMPLETE')&&!has(s,'CH3_LOU_JOINED')&&!s.chapter3Sequence)sequence('lou-join');break;
  case 'jammer-activate':if(s.chapter3Sequence?.id==='lou-join'&&!has(s,'CH3_JAMMER_ACTIVE')){mark('CH3_JAMMER_ACTIVE');effects.push('jammer-active');}break;
  case 'concierge':if(all(s,'CH3_LOU_JOINED','CH3_JAMMER_ACTIVE'))mark('CH3_MEETING_ASSIGNED');break;
  case 'lockdown-start':if(has(s,'CH3_MEETING_ASSIGNED')&&!has(s,'CH3_LOCKDOWN')&&!s.chapter3Sequence)sequence('lockdown');break;
  case 'lobby-service':if(has(s,'CH3_LOCKDOWN'))mark('CH3_LOBBY_SERVICE_OPEN','The lobby exit is sealed behind a heavy steel barrier. Lou opened a local service route toward the upper floors.');break;
  case 'circuit8':
   if(!has(s,'CH3_LOBBY_SERVICE_OPEN')||!circuits(event.circuits,['west','east','stair']))break;
   set('chapter3Circuit8',[...event.circuits]);finish8();break;
  case 'west8':case 'east8':{
   const wing=type==='west8'?'west':'east';if(!has(s,'CH3_LOBBY_SERVICE_OPEN')||!s.chapter3Circuit8?.includes(wing))break;
   mark(wing==='west'?'CH3_FLOOR8_WEST_CHECKED':'CH3_FLOOR8_EAST_CHECKED');finish8();break;
  }
  case 'relay14':if(has(s,'CH3_FLOOR8_COMPLETE'))mark('CH3_FLOOR14_RELAY');break;
  case 'bypass14':if(all(s,'CH3_FLOOR8_COMPLETE','CH3_FLOOR14_RELAY')){mark('CH3_FLOOR14_BYPASS');mark('CH3_FLOOR14_COMPLETE','Restored the amenity-floor elevator power and local authorization.');}break;
  case 'circuit21':
   if(!has(s,'CH3_FLOOR14_COMPLETE')||!circuits(event.circuits,['shutters','vent','traction']))break;
   set('chapter3Circuit21',[...event.circuits]);if(event.circuits.includes('shutters')&&event.circuits.includes('vent'))mark('CH3_FLOOR21_REMOTE_ACCESS');break;
  case 'transfer21':
   if(!all(s,'CH3_FLOOR14_COMPLETE','CH3_FLOOR21_REMOTE_ACCESS')||!s.chapter3Circuit21?.includes('shutters')||!s.chapter3Circuit21?.includes('vent'))break;
   if(!circuits(event.circuits,['shutters','vent','traction'])||!event.circuits.includes('traction')||!event.circuits.includes('vent'))break;
   set('chapter3Circuit21',[...event.circuits]);mark('CH3_FLOOR21_COMPLETE','Reached the remote mechanical controls, transferred emergency power, and restored the upper service elevator.');break;
  case 'west31':case 'east31':
   if(!has(s,'CH3_FLOOR21_COMPLETE'))break;
   mark(type==='west31'?'CH3_FLOOR31_WEST':'CH3_FLOOR31_EAST');if(all(n,'CH3_FLOOR31_WEST','CH3_FLOOR31_EAST'))mark('CH3_FLOOR31_COMPLETE');break;
  case 'roof-start':
   if(!has(s,'CH3_FLOOR31_COMPLETE')||has(s,'CH3_BOSS_DEFEATED')||has(s,'CH3_ROOF_BATTLE_PENDING')||s.chapter3Sequence)break;
   if(has(s,'CH3_ROOF_INTRO_SEEN')){mark('CH3_ROOF_BATTLE_PENDING');clear('CH3_ROOF_RETRY');effects.push('containment-battle');}else sequence('roof-intro');break;
  case 'boss-defeated':if(has(s,'CH3_ROOF_BATTLE_PENDING')){clear('CH3_ROOF_BATTLE_PENDING');mark('CH3_BOSS_DEFEATED');}break;
  case 'boss-aborted':if(has(s,'CH3_ROOF_BATTLE_PENDING')){clear('CH3_ROOF_BATTLE_PENDING');mark('CH3_ROOF_RETRY');}break;
  case 'cache-start':if(has(s,'CH3_BOSS_DEFEATED')&&!has(s,'CH3_NR4_CODE')&&!s.chapter3Sequence)sequence('mission-cache');break;
  case 'roof-escape':if(has(s,'CH3_NR4_CODE')){mark('CH3_ROOF_ESCAPED');mark('CH3_NR4_INVESTIGATION_STARTED');}break;
  case 'medical-routes':if(has(s,'CH3_ROOF_ESCAPED'))mark('CH3_NR4_ROUTES','Medical dispatch codes: GH1 = General Hospital; CR2 = Cardiac Recovery; NR3 = Neurorehabilitation Annex; NR4 = RESTRICTED.');break;
  case 'medical-worker':if(has(s,'CH3_NR4_ROUTES'))mark('CH3_NR4_IDENTIFIED','A transport technician remembers the neurological center’s fourth receiving area. It supposedly closed years ago, but automated supply requests still appear.');break;
  case 'records-return':if(has(s,'CH3_NR4_IDENTIFIED'))mark('CH3_RECORDS_REMOVED','The NR4 supply entries disappeared while we investigated. Lou suggested following infrastructure instead of a public directory.');break;
  case 'neuro-reception':if(has(s,'CH3_RECORDS_REMOVED'))mark('CH3_NEURO_PUBLIC_CONTEXT','The neurological center provides genuine rehabilitation. Its public receptionist directed us to the separate contractor records office.');break;
  case 'power-trace':if(all(s,'CH3_RECORDS_REMOVED','CH3_NEURO_PUBLIC_CONTEXT'))mark('CH3_POWER_TRACE','Old distribution drawings show an unlisted section drawing power. Lou traced its feeder toward the neurological center’s service basement.');break;
  case 'elevator-start':if(has(s,'CH3_POWER_TRACE')&&!has(s,'CH3_NR4_ELEVATOR_FOUND')&&!s.chapter3Sequence)sequence('service-elevator');break;
 }
 return {state:changed?n:s,changed,effects};
}

const NPC_ALIASES=Object.freeze({
 'dispatch-worker':'medical-routes','medical-logistics':'medical-routes','rehab-reception':'neuro-reception','power-records':'power-trace',
 restaurants:'recommendations','resident-waiting':'waiting','residential-neighbor':'resident','north-local':'manual','walking-neighbor':'runner','courtyard-reader':'student','gallery-guest':'musician','delivery-owner':'delivery-lead',
 'solace-nurse':'nurse','solace-machinist':'machinist'
});
export function conversation(rawId,s){
 const id=NPC_ALIASES[rawId]||rawId;
 const npc=NPCS[id];if(!npc)return null;
 const make=(lines,event=null)=>({npc:{id,...npc},lines:dialogueLines(lines.map(p=>typeof p==='string'?line(npc.name,p):p),s),event});
 if(id==='lou')return make([objective(s)]);
 if(id==='therapy-patient')return make(['A month ago I needed help getting down these steps. Today I walked here on my own.','The rehabilitation team says small improvements count. This one feels pretty big to me.']);
 if(id==='concierge')return has(s,'CH3_LOCKDOWN')?make(['Temporary access restrictions remain in effect. Please use the designated upper emergency route.']):has(s,'CH3_LOU_JOINED')?make([hero('Is there somewhere private we can sit for a few minutes?'),'Certainly. Meeting room C is available through the corridor. Please make yourselves comfortable.'],'concierge'):make(['Welcome. Residents may collect packages on the right; guests can wait in the common area.']);
 if(id==='transit-lead'||id==='delivery-lead'||id==='vending-lead'){
  if(!has(s,'CH3_LOU_MEETING_COMPLETE'))return make([id==='transit-lead'?'A second scan? It does that sometimes. My pass still works.':id==='delivery-lead'?'The delivery carts stop to look at people. Customer recognition, I assume.':'Fingerprint payment. No wallet needed. One bottled coffee is eight credits.']);
  if(id==='vending-lead'&&!has(s,'CH3_VENDING_USED'))return make(['Place a finger on the reader. One bottled coffee is eight credits.']);
  return make(LEAD_DIALOGUE[id.split('-')[0]],id);
 }
 if(id==='medical-routes'||id==='records-return'){
  if(!has(s,'CH3_ROOF_ESCAPED'))return make(['Medications, sterile equipment, prosthetic parts. Our carts spend the whole day moving between clinics.']);
  if(has(s,'CH3_NR4_IDENTIFIED'))return make(['Let me pull that receiving record up again.',line('Dispatch terminal','SLC-NR4 — RECORD UNAVAILABLE.'),'That is weird. That was here earlier. The ordinary deliveries are all still listed.',lou('We copied the route code. They cannot remove the actual wiring from a directory.')],'records-return');
  return make([hero('Does SLC-NR4 look like one of your medical route codes?'),'The format does. These are receiving destinations.',line('Dispatch terminal','SLC-GH1 — SOLACE GENERAL HOSPITAL\nSLC-CR2 — CARDIAC RECOVERY'),line('Dispatch terminal','SLC-NR3 — NEUROREHABILITATION ANNEX\nSLC-NR4 — RESTRICTED'),'That last destination is not on my public list. Marta repairs the transport equipment; she has worked this district longer than I have.'],'medical-routes');
 }
 if(id==='medical-worker')return !has(s,'CH3_NR4_ROUTES')?make(['The rehab center does good work. I mostly keep its transport equipment moving.']):make(['NR4? The neurological center used to have four receiving areas. Only three are public now.','Four closed years ago, during some restructuring. The automated supplies still request it sometimes. I assumed the route table needed cleaning up.',hero('It still receives supplies?'),'Requests, anyway. I do not unload those runs. Dispatch would have the records.'],'medical-worker');
 if(id==='neuro-reception')return make(['Our teams work with neurological injuries, stroke recovery, prosthetics and mobility support.','My brother learned to walk again here. I am glad the place exists.',has(s,'CH3_RECORDS_REMOVED')?'Contractor drawings are at Northline Maintenance, the separate service office west of here. We keep patient areas private.':'Appointments are through the public desk. Transport operations have a separate service entrance.'],has(s,'CH3_RECORDS_REMOVED')?'neuro-reception':null);
 if(id==='power-trace')return has(s,'CH3_RECORDS_REMOVED')?make([lou('The public floor plan ends here. But this old distribution drawing has another branch.'),line('Electrical drawing','FEEDER N-4: SERVICE BASEMENT / AUXILIARY RECEIVING. METER STATUS: ACTIVE.'),lou('That is a live load, not an obsolete route label. The feeder runs into the old service basement.'),hero('Then we follow it.')],'power-trace'):make([lou('A distribution drawing. We should find out which part of the building we are looking for first.')]);
 return AMBIENT[id]?make(AMBIENT[id]):null;
}
export function finishConversation(s,plan){return plan?.event?transition(s,plan.event):{state:s,changed:false,effects:[]};}
