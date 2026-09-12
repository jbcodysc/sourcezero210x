/** Chapter 2 story rules. No rendering, clocks, storage, or random effects live here. */
import {COMPACT_CITY_FLAG} from './city-density.mjs';
export const COFFEE_PRICE = 8;
export const COFFEE_ITEM = 'caramel-macchiato';
export const FACILITY_KEYCARD = 'fairmont-service-keycard';

export const NPCS = [
  {id:'radio-owner',name:'Harlan Voss'}, {id:'hotel-clerk',name:'Lena Vale'},
  {id:'security-guard',name:'Contract Security'}, {id:'protester',name:'Jo Bell'},
  {id:'derek',name:'Derek'}, {id:'barista',name:'Tess Medina'},
  {id:'market-manager',name:'K.A.R.E.N.'}, {id:'argus',name:'A.R.G.U.S.'},
  {id:'archive',name:'Archive terminal'}
];
const names = Object.fromEntries(NPCS.map(n=>[n.id,n.name]));
const aliases = {radio:'radio-owner',hotel:'hotel-clerk',guard:'security-guard',coffee:'barista',breaker:'market-manager'};
const flag = (s,key)=>Boolean(s.flags?.[key]);
const all = (s,...keys)=>keys.every(key=>flag(s,key));

export const ARRIVAL_SCENE = [
  {speaker:'Narration',text:'FAIRMONT JUNCTION. Freight capital. Robotics capital. Capital letters on every building.'},
  {speaker:'Bus driver',text:'End of the line. Watch your step. The pavement subscription is not included.'}
];
export const MODULE_REMINDER = [
  {speaker:'{hero}',text:'Wait, couldn’t I have gotten Elias to finish decoding it? Oh well, I’m already here.'}
];
export const BELLWETHER_SCENE = [
  {speaker:'Narration',text:'Meanwhile, back in Bellwether…'},
  {speaker:'Cenexis Agent',text:'Officer Quinn? A final follow-up regarding the courier incident. We would like to speak to the young chemist.'},
  {speaker:'Officer Dalia Quinn',text:'The incident has been reported. Your company said the matter was resolved. The chemist is safe.'},
  {speaker:'Cenexis Agent',text:'Naturally. A location or travel record would save everyone another round of paperwork.'},
  {speaker:'Officer Dalia Quinn',text:'You can file a formal request. I am not disclosing someone’s whereabouts to an unexpected visitor.'},
  {speaker:'Cenexis Agent',text:'We are simply trying to help.'},
  {speaker:'Officer Dalia Quinn',text:'Then I look forward to the documents.'},
  {speaker:'Narration',text:'The agent’s smile holds until the station door closes behind him.'},
  {speaker:'Cenexis Agent',text:'Good thing most people these days will believe almost anything they hear on social media. Especially when the story is curated for them.'},
  {speaker:'Narration',text:'Fairmont Junction. Later that night.'}
];
export const SCAN_SCENE = [
  {speaker:'Narration',text:'A Cenexis drone leaves its route and stops in front of you. Its sensor makes a slow pass.'},
  {speaker:'Cenexis Drone',text:'Thank you for understanding.'},
  {speaker:'Narration',text:'A guard’s wrist display flashes. He angles the screen away. Two drones turn toward you.'},
  {speaker:'Contract Security',text:'You. Stay exactly where you are.'}
];
export const ARGUS_SCENE = [
  {speaker:'A.R.G.U.S.',text:'A.R.G.U.S. Autonomous Response, Guidance & Unified Security. All local systems are under coordinated control.'},
  {speaker:'Narration',text:'A sensor passes over you. The hangar doors close. The dedicated security chassis turns to face you.'},
  {speaker:'A.R.G.U.S.',text:'Identity unresolved. Classification match confirmed. Recovery priority elevated.'},
  {speaker:'A.R.G.U.S.',text:'Preserve the subject. Restrain and recover.'}
];
export const ARCHIVE_SCENE = [
  {speaker:'Archive terminal',text:'FIELD CLASSIFICATION / DEPLOYMENT HISTORY. Local combat control offline. Archive access remains operational.'},
  {speaker:'Archive terminal',text:'Standard routine: quietly scan a person; assign a restricted classification; transmit the result; resume the assigned public task. Do not disclose classification to the subject.'},
  {speaker:'Archive terminal',text:'Bellwether delivery deployment: earlier containment-enabled build distributed outside its approved channel. Priority-profile match initiated immediate subject recovery.'},
  {speaker:'Archive terminal',text:'Fairmont current build: detection and recovery are separate processes. Field units scan and report. Specialized personnel handle later recruitment or recovery.'},
  {speaker:'Archive terminal',text:'Bellwether subject record linked to Fairmont Commons encounter. Same priority classification. Profile criteria: RESTRICTED. Reason for match: ACCESS DENIED.'},
  {speaker:'{hero}',text:'So the robot in Bellwether wasn’t broken. It found me.'},
  {speaker:'Archive terminal',text:'A.R.G.U.S. Fairmont: local validation node. Classification reports and next-stage deployment packages route through NORTHBRIDGE REGIONAL CIVIC INTEGRATION.'},
  {speaker:'Archive terminal',text:'Northbridge integration services: transit, utilities, public services, logistics, building automation. Regional rollout active.'},
  {speaker:'{hero}',text:'Northbridge. My oldest friend lives there. I was hoping the reason to visit would be less… this.'},
  {speaker:'Narration',text:'The local machinery settles into its ordinary work. The trail leads north. Chapter 2 complete.'}
];

export const FACILITY_LOGS = {
  receiving:['SHIFT B / 14:00–22:00. Incoming drone crates must be counted before charging.','Visitors use the public desk. Staff badges do not authorize unscheduled guests.'],
  assembly:['REPAIR QUEUE: seven units awaiting rotors, two awaiting optical covers. Lunch containers are not parts bins.','A.R.G.U.S.: Assembly access has been rerouted. Unauthorized movement will be contained.'],
  hangar:['FLIGHT VALIDATION: execute obstacle sequence, return to dock, compare route telemetry.','A.R.G.U.S.: Test units reassigned to local security. Please remain available for collection.'],
  laboratory:['FIELD VALIDATION / HUMAN SIGNATURE CLASSIFICATION. Test criteria restricted to authorized review staff.','Candidate reports use encrypted routing. Calibration operators do not receive profile definitions.'],
  network:['A.R.G.U.S. / Autonomous Response, Guidance & Unified Security. Local orchestration covers doors, cameras, drone routing and facility defense.','Regional integration endpoint: NORTHBRIDGE. Archive details require the integration chamber control release.'],
  breakroom:['PLEASE LABEL YOUR LUNCH. Last revised this morning.','Someone has circled “work-life balance” on the employee survey and drawn a see-saw without the other seat.']
};
export const FLAVOR = {
  commuter:['The freight tram gets priority. It does not have to explain being late to its boss.'],
  worker:['A construction unit paused to look me over, then went right back to measuring. Security checks, probably.','Nothing is moving in the fenced half of the Commons. The people on the green half are making sure of that.'],
  shopper:['A grocery helper stared at me for a second, then fetched the cereal. I assumed I looked like a coupon.'],
  robot:['ROUTE CONFIRMED. ONE PARCEL. ZERO REASONS TO DISCUSS THE PARCEL.'],
  resident:['Radio Hut still repairs things. Whole Robotics mostly explains why you should buy them again.'],
  protester:['They cleared half our park for a data center. We are keeping the other half until somebody listens.','We brought signs, sandwiches and folding chairs. Apparently that counts as a long-term plan.'],
  camper:['Half the crowd went home. Somebody has to stay with the tents. The trees have terrible phone reception.'],
  nightworker:['Still working. The city sleeps, but the invoices have other arrangements.'],
  day2:['Whole Robotics is shut after something happened overnight. The morning news has seventeen opinions and one photograph.','I do not know who did it. Neither does the person telling everyone they know who did it.'],
  nurse:['Take a seat. First aid has fewer eligibility requirements than most things in this town.'],
  diner:['Our breakfast is served all day. At night it technically becomes an alibi.'],
  bookseller:['The robotics section is next to philosophy. We are trying to start an argument.']
};

export function dialogueLines(items,s={}) {
  const hero=s.name||'Alex';
  return items.map(item=>{
    const line=typeof item==='string'?{speaker:'Narration',text:item}:item;
    const speaker=line.speaker==='{hero}'?hero:names[line.speaker]||line.speaker;
    return {...line,speaker,side:line.speaker==='{hero}'?'hero':'npc',text:line.text.replaceAll('{hero}',hero)};
  });
}

export function timeOfDay(s){return flag(s,'CH2_NIGHT_UNLOCKED')&&!flag(s,'CH2_DAY2')?'night':'day';}
export function derekStatus(s){
  if(flag(s,'CH2_DEREK_COMPLETE'))return 'complete';
  if(flag(s,'CH2_DEREK_LOCKED'))return flag(s,'CH2_DEREK_EXPIRED')||flag(s,'CH2_DEREK_ACCEPTED')?'expired':'unavailable';
  return flag(s,'CH2_DEREK_ACCEPTED')?'accepted':'available';
}
export function protestState(s){
  if(flag(s,'CH2_CITY_SECURITY_HOSTILE'))return 'targeted-security';
  if(flag(s,'CH2_PARK_SECURITY_ACTIVE'))return 'security-checks';
  return timeOfDay(s)==='night'?'camp':'peaceful';
}
export function canStreetEnemy(s,type){return flag(s,'CH2_CITY_SECURITY_HOSTILE')&&['security','drone','security-guard','security-drone'].includes(type);}
export function canEnter(s,location){
  if(['wrm','market-rear'].includes(location))return all(s,'CH2_RADIO_HUT_BARGAIN','CH2_NIGHT_UNLOCKED','badgeFixed')&&!flag(s,'CH2_DAY2');
  if(['facility','facility-service'].includes(location))return all(s,'CH2_DRONE_KEYCARD','CH2_CITY_SECURITY_HOSTILE');
  if(location==='facility-front')return false;
  if(['market-front','market'].includes(location))return timeOfDay(s)==='day'&&!flag(s,'CH2_DAY2');
  if(['hotel','coffee','coffee-shop','clinic','apartments'].includes(location))return true;
  if(['radio','radio-hut','shop','diner','books','gear'].includes(location))return timeOfDay(s)==='day';
  return true;
}
export function objective(s){
  if(flag(s,'CH2_COMPLETE'))return 'The records point to Northbridge. This chapter is complete.';
  if(flag(s,'CH2_ARGUS_DEFEATED'))return 'Read the archive terminal behind the integration chamber.';
  if(flag(s,'CH2_DRONE_FACILITY_ENTERED'))return 'Follow the deployment trail through the active Cenexis facility.';
  if(flag(s,'CH2_DRONE_KEYCARD'))return 'Use Harlan’s keycard at the facility service entrance.';
  if(flag(s,'CH2_CITY_SECURITY_HOSTILE'))return 'Return to Radio Hut. Harlan may have finished the decrypt.';
  if(flag(s,'CH2_PARK_ESCALATION_TRIGGERED'))return 'The security drones have taken an interest in you.';
  if(flag(s,'CH2_GUARD_EXPLANATION_HEARD'))return 'Ask Jo Bell what the new park security is really doing.';
  if(flag(s,'CH2_PARK_SECURITY_ACTIVE'))return 'Check the Commons while Harlan works on the module.';
  if(flag(s,'CH2_DAY2'))return 'Return to Radio Hut with the storage module.';
  if(flag(s,'CH2_WRM_CLEARED'))return 'The lights are out. Return to the hotel when you are ready to sleep.';
  if(flag(s,'CH2_KAREN_DEFEATED'))return 'K.A.R.E.N. is down. The breaker lines still need your attention.';
  if(flag(s,'CH2_NIGHT_UNLOCKED'))return 'Look for Whole Robotics Market’s rear service entrance.';
  if(flag(s,'CH2_RADIO_HUT_BARGAIN'))return 'Harlan might help with the module if Whole Robotics Market has some bad luck.';
  return 'Find someone in Fairmont who can examine the storage module.';
}

export function resumeEvent(s){
  if(flag(s,'CH2_BELLWETHER_PENDING'))return {type:'bellwether',step:s.chapter2SceneStep||0};
  if(flag(s,'CH2_PARK_ESCALATION_TRIGGERED')&&!flag(s,'CH2_PLAYER_SCANNED'))return {type:'scan',step:s.chapter2SceneStep||0};
  if(flag(s,'CH2_PLAYER_SCANNED')&&!flag(s,'CH2_CITY_SECURITY_HOSTILE')&&!flag(s,'CH2_SECURITY_RETRY_NEEDED'))return {type:'security-battle',step:0};
  if(flag(s,'CH2_KAREN_PENDING')&&!flag(s,'CH2_KAREN_DEFEATED'))return {type:'karen-battle',step:0};
  if(flag(s,'CH2_ARGUS_PENDING')&&!flag(s,'CH2_ARGUS_DEFEATED'))return {type:'argus-battle',step:0};
  if(flag(s,'CH2_ARGUS_ENCOUNTER_ACTIVE')&&!flag(s,'CH2_ARGUS_DEFEATED'))return flag(s,'CH2_ARGUS_ENTRANCE_SEEN')
    ?{type:'argus-dialogue',step:s.chapter2ArgusDialogueStep||0}
    :{type:'argus-entrance',step:s.chapter2ArgusEntranceStep||0};
  return null;
}

/** Events are accepted only at their story gate. Repeated completions are harmless. */
export function transition(s,event){
  const type=typeof event==='string'?event:event?.type;
  const n={...s,flags:{...s.flags},notes:[...(s.notes||[])],inventory:[...(s.inventory||[])]};
  const effects=[];let changed=false;
  const mark=(key,note)=>{if(!n.flags[key]){n.flags[key]=true;changed=true;}if(note&&!n.notes.includes(note)){n.notes.push(note);changed=true;}};
  const clear=key=>{if(n.flags[key]){delete n.flags[key];changed=true;}};
  const addItem=item=>{if(!n.inventory.includes(item)){n.inventory.push(item);changed=true;}};
  const rest=()=>{if(n.hp!==n.maxHp){n.hp=n.maxHp;changed=true;}effects.push('rest');};
  const resetStep=()=>{n.chapter2SceneStep=0;changed=true;};
  switch(type){
    case 'arrive':
      if(!all(s,'waterRestored','relayTaken','badgeFixed'))break;
      if(!flag(s,'CH2_ARRIVED'))mark(COMPACT_CITY_FLAG);
      mark('CH2_ARRIVED','Arrived in Fairmont Junction with the relay storage module and Ruth’s repaired service badge.');break;
    case 'module-reminder':if(flag(s,'CH2_ARRIVED'))mark('CH2_MODULE_REMINDER_SEEN');break;
    case 'radio-bargain':
      if(!all(s,'CH2_MODULE_REMINDER_SEEN','relayTaken')||timeOfDay(s)!=='day')break;
      mark('CH2_RADIO_HUT_BARGAIN','Harlan at Radio Hut will decode the module if Whole Robotics Market has a very bad night.');break;
    case 'hotel-sleep':
      if(!flag(s,'CH2_ARRIVED')||resumeEvent(s))break;
      rest();
      if(flag(s,'CH2_WRM_CLEARED')&&!flag(s,'CH2_DAY2')){mark('CH2_DAY2','Morning in Fairmont. Whole Robotics is under investigation. Return to Radio Hut.');effects.push('day2');}
      else if(flag(s,'CH2_RADIO_HUT_BARGAIN')&&!flag(s,'CH2_BELLWETHER_FINISHED')){
        mark('CH2_BELLWETHER_PENDING');resetStep();
        n.chapter2HotelContext={location:s.location,position:{...s.position}};
        effects.push('bellwether');
      }
      break;
    case 'scene-step':{
      const active=resumeEvent(s),step=Number(event?.step);
      const limit=active?.type==='bellwether'?BELLWETHER_SCENE.length:active?.type==='scan'?SCAN_SCENE.length:0;
      if(limit&&Number.isInteger(step)&&step>(s.chapter2SceneStep||0)&&step<=limit){n.chapter2SceneStep=step;changed=true;}break;
    }
    case 'bellwether-finished':
      if(!all(s,'CH2_BELLWETHER_PENDING','CH2_RADIO_HUT_BARGAIN'))break;
      clear('CH2_BELLWETHER_PENDING');mark('CH2_BELLWETHER_FINISHED');mark('CH2_NIGHT_UNLOCKED');resetStep();effects.push('night');break;
    case 'wrm-enter':if(canEnter(s,'wrm'))mark('CH2_WRM_ENTERED');break;
    case 'karen-start':
      if(!flag(s,'CH2_WRM_ENTERED')||!canEnter(s,'wrm')||flag(s,'CH2_KAREN_DEFEATED'))break;
      if(!flag(s,'CH2_KAREN_PENDING')){mark('CH2_KAREN_PENDING');effects.push('karen-battle');}break;
    case 'karen-defeated':
      if(!all(s,'CH2_WRM_ENTERED','CH2_KAREN_PENDING'))break;
      clear('CH2_KAREN_PENDING');mark('CH2_KAREN_DEFEATED','K.A.R.E.N. is defeated. The breaker lines have not been cut yet.');break;
    case 'karen-aborted':clear('CH2_KAREN_PENDING');break;
    case 'cut-lines':
      if(!all(s,'CH2_KAREN_DEFEATED','CH2_WRM_ENTERED')||!canEnter(s,'wrm'))break;
      if(!flag(s,'CH2_WRM_CLEARED')){mark('CH2_WRM_CLEARED','Cut the Whole Robotics breaker lines. Emergency lights remain; the way out is open.');effects.push('market-power-down');}break;
    case 'decrypt-start':
      if(!all(s,'CH2_DAY2','CH2_WRM_CLEARED'))break;
      mark('CH2_DECRYPT_IN_PROGRESS');mark('CH2_PARK_SECURITY_ACTIVE','Harlan is decrypting the module. News reports say Cenexis security and scanning drones have reached the Commons.');break;
    case 'guard-heard':if(flag(s,'CH2_PARK_SECURITY_ACTIVE'))mark('CH2_GUARD_EXPLANATION_HEARD');break;
    case 'protester-finished':
      if(!all(s,'CH2_GUARD_EXPLANATION_HEARD','CH2_PARK_SECURITY_ACTIVE')||flag(s,'CH2_PARK_ESCALATION_TRIGGERED'))break;
      mark('CH2_PARK_ESCALATION_TRIGGERED');
      if(!flag(s,'CH2_DEREK_COMPLETE')){
        mark('CH2_DEREK_LOCKED');
        if(flag(s,'CH2_DEREK_ACCEPTED')||s.inventory?.includes(COFFEE_ITEM))mark('CH2_DEREK_EXPIRED');
      }
      resetStep();effects.push('scan');break;
    case 'scan-finished':
      if(!flag(s,'CH2_PARK_ESCALATION_TRIGGERED')||flag(s,'CH2_PLAYER_SCANNED'))break;
      mark('CH2_PLAYER_SCANNED');resetStep();effects.push('security-battle');break;
    case 'security-defeated':
      if(!all(s,'CH2_PLAYER_SCANNED','CH2_PARK_ESCALATION_TRIGGERED'))break;
      clear('CH2_SECURITY_RETRY_NEEDED');
      mark('CH2_CITY_SECURITY_HOSTILE','A drone scanned me, then a guard and two drones attacked. Cenexis security is looking for me. Ordinary service robots continue their work.');break;
    case 'security-aborted':
      if(flag(s,'CH2_PLAYER_SCANNED')&&!flag(s,'CH2_CITY_SECURITY_HOSTILE'))mark('CH2_SECURITY_RETRY_NEEDED');break;
    case 'security-retry':
      if(flag(s,'CH2_SECURITY_RETRY_NEEDED')){clear('CH2_SECURITY_RETRY_NEEDED');effects.push('security-battle');}break;
    case 'keycard':
      if(!all(s,'CH2_CITY_SECURITY_HOSTILE','CH2_DECRYPT_IN_PROGRESS'))break;
      mark('CH2_DRONE_KEYCARD','Harlan traced the code builds to Cenexis Autonomous Systems and made a keycard for its service entrance.');addItem(FACILITY_KEYCARD);break;
    case 'facility-enter':if(canEnter(s,'facility'))mark('CH2_DRONE_FACILITY_ENTERED');break;
    case 'argus-entrance-start':
      if(!all(s,'CH2_DRONE_FACILITY_ENTERED','CH2_DRONE_KEYCARD','CH2_CORE_SHUTTERS')||flag(s,'CH2_ARGUS_DEFEATED')||flag(s,'CH2_ARGUS_ENCOUNTER_ACTIVE')||flag(s,'CH2_ARGUS_PENDING'))break;
      mark('CH2_ARGUS_ENTRANCE_STARTED');mark('CH2_ARGUS_ENCOUNTER_ACTIVE');
      n.chapter2ArgusDialogueStep=0;
      if(!flag(s,'CH2_ARGUS_ENTRANCE_SEEN'))n.chapter2ArgusEntranceStep=0;
      effects.push(flag(s,'CH2_ARGUS_ENTRANCE_SEEN')?'argus-dialogue':'argus-entrance');break;
    case 'argus-entrance-step':{
      const step=Number(event?.step);
      if(!all(s,'CH2_ARGUS_ENCOUNTER_ACTIVE','CH2_ARGUS_ENTRANCE_STARTED')||flag(s,'CH2_ARGUS_ENTRANCE_SEEN')||flag(s,'CH2_ARGUS_DEFEATED'))break;
      if(Number.isInteger(step)&&step>(s.chapter2ArgusEntranceStep||0)&&step<=2){n.chapter2ArgusEntranceStep=step;changed=true;}break;
    }
    case 'argus-entrance-complete':
      if(!all(s,'CH2_ARGUS_ENCOUNTER_ACTIVE','CH2_ARGUS_ENTRANCE_STARTED')||flag(s,'CH2_ARGUS_ENTRANCE_SEEN')||flag(s,'CH2_ARGUS_DEFEATED'))break;
      mark('CH2_ARGUS_ENTRANCE_SEEN');n.chapter2ArgusEntranceStep=2;effects.push('argus-dialogue');break;
    case 'argus-dialogue-step':{
      const step=Number(event?.step);
      if(!all(s,'CH2_ARGUS_ENCOUNTER_ACTIVE','CH2_ARGUS_ENTRANCE_SEEN')||flag(s,'CH2_ARGUS_PENDING')||flag(s,'CH2_ARGUS_DEFEATED'))break;
      if(Number.isInteger(step)&&step>(s.chapter2ArgusDialogueStep||0)&&step<=ARGUS_SCENE.length){n.chapter2ArgusDialogueStep=step;changed=true;}break;
    }
    case 'argus-start':
      if(!all(s,'CH2_DRONE_FACILITY_ENTERED','CH2_DRONE_KEYCARD','CH2_ARGUS_ENCOUNTER_ACTIVE','CH2_ARGUS_ENTRANCE_SEEN')||flag(s,'CH2_ARGUS_DEFEATED'))break;
      if(!flag(s,'CH2_ARGUS_PENDING')){mark('CH2_ARGUS_PENDING');effects.push('argus-battle');}break;
    case 'argus-aborted':
      // Older saves reached combat without the new entrance flags. A defeat
      // still proves the introduction is over; retry only after another visit.
      if(flag(s,'CH2_ARGUS_PENDING'))mark('CH2_ARGUS_ENTRANCE_SEEN');
      clear('CH2_ARGUS_PENDING');clear('CH2_ARGUS_ENCOUNTER_ACTIVE');break;
    case 'argus-defeated':
      if(!all(s,'CH2_ARGUS_PENDING','CH2_DRONE_FACILITY_ENTERED'))break;
      clear('CH2_ARGUS_PENDING');clear('CH2_ARGUS_ENCOUNTER_ACTIVE');mark('CH2_ARGUS_ENTRANCE_SEEN');mark('CH2_ARGUS_DEFEATED','A.R.G.U.S.’s local security chassis is down. The archive terminal is still operational.');break;
    case 'archive-read':
      if(!flag(s,'CH2_ARGUS_DEFEATED'))break;
      mark('CH2_COMPLETE','Cenexis quietly classifies people. I matched the same hidden profile in Bellwether and Fairmont; the earlier delivery build tried to capture me. The criteria remain restricted. Reports route through Northbridge’s civic integration node, where my childhood friend lives.');break;
    case 'derek-accept':
      if(flag(s,'CH2_ARRIVED')&&!flag(s,'CH2_DEREK_LOCKED')&&!flag(s,'CH2_DEREK_COMPLETE'))mark('CH2_DEREK_ACCEPTED','Derek mentioned missing caramel macchiatos. The protesters have sworn off AI delivery apps.');break;
    case 'buy-coffee':
      if(!flag(s,'CH2_ARRIVED')||!Number.isFinite(s.credits)||s.credits<COFFEE_PRICE)break;
      n.credits-=COFFEE_PRICE;n.inventory.push(COFFEE_ITEM);changed=true;effects.push('coffee-bought');break;
    case 'deliver-coffee':{
      const index=n.inventory.indexOf(COFFEE_ITEM);
      if(!flag(s,'CH2_DEREK_ACCEPTED')||flag(s,'CH2_DEREK_LOCKED')||flag(s,'CH2_DEREK_COMPLETE')||index<0)break;
      n.inventory.splice(index,1);n.credits+=12;mark('CH2_DEREK_COMPLETE','Delivered Derek’s coffee. He is working on an optional anti-AI project and offered to show it to me another time.');effects.push('derek-complete');break;
    }
  }
  return {state:changed?n:s,changed,effects};
}

export function conversation(rawId,s){
  const id=aliases[rawId]||rawId,npc=NPCS.find(n=>n.id===id);if(!npc)return null;
  const make=(items,event=null)=>({npc,lines:dialogueLines(items.map(i=>typeof i==='string'?{speaker:npc.name,text:i}:i),s),event});
  if(id==='radio-owner'){
    if(timeOfDay(s)==='night')return make(['Closed. For normal business, anyway. Come back in the morning.']);
    if(flag(s,'CH2_DRONE_KEYCARD'))return make(['The employee entrance is along the side of Cenexis Autonomous Systems. That card is for the service reader, not the reception desk.','I can follow a build number. I cannot tell you what its author is thinking. Bring back something the machine cannot politely omit.']);
    if(flag(s,'CH2_CITY_SECURITY_HOSTILE'))return make([
      'Finished enough. The module and those drones share build signatures. Deployment packages are being validated at Cenexis Autonomous Systems, on the industrial edge.',
      'There is a security credential fragment in here, too. Give me a blank card and a moment to disappoint its original owner.',
      'I still don’t know what this thing is supposed to do. But I know where the current build is being pushed from - and I know how to get you through one of their doors.',
      {speaker:'Narration',text:'Harlan hands you a fabricated service keycard.'}
    ],'keycard');
    if(flag(s,'CH2_DECRYPT_IN_PROGRESS'))return make(['Still running. Strong encryption is a very expensive way of saying “give me a minute.”','Go have a look at the Commons. The news mentioned another round of security checks.']);
    if(flag(s,'CH2_DAY2'))return make([
      'Terrible what happened over there. Just terrible. Anyway, hand me that module.',
      'This needs a deeper pass. Take a walk; I will keep the original data intact.',
      {speaker:'Radio Hut television',text:'Following the overnight incident at Whole Robotics Market, Cenexis contractors and additional drones will assist security checks near affiliated properties and Fairmont Commons.'},
      {speaker:'Harlan Voss',text:'“Assist.” That word is getting a lot of work lately.'},
      {speaker:'{hero}',text:'I will check the park.'}
    ],'decrypt-start');
    if(flag(s,'CH2_RADIO_HUT_BARGAIN'))return make(['If Whole Robotics Market were to suffer a little misfortune, I might suddenly find time for your module. Funny how moods work.']);
    if(!flag(s,'CH2_MODULE_REMINDER_SEEN'))return make(['Looking for repairs? Look around. I do not charge for thinking, though I should start.']);
    return make([
      {speaker:'{hero}',text:'Could you read this storage module?'},
      'Interesting. Heavily protected, corporate signatures… No. I have a shop to keep and no lawyer to keep it with.',
      'Wait. Did you make that vibrosword? That grip is completely impractical. I respect the commitment.',
      'Whole Robotics Market is putting every independent repair shop out of business. Their idea of repair is selling a newer box.',
      'I’m not asking you to do anything. I’m just saying that if Whole Robotics Market had a very bad night, I might wake up in a very helpful mood.',
      {speaker:'{hero}',text:'That is a remarkably specific kind of generosity.'}
    ],'radio-bargain');
  }
  if(id==='hotel-clerk')return make([timeOfDay(s)==='night'?'Room 204 is yours. Take the stairs, then use your bed whenever you are ready to sleep.':'Your transit voucher covers room 204, upstairs. The other rooms are occupied. Make yourself comfortable in the common area.',flag(s,'CH2_RADIO_HUT_BARGAIN')&&!flag(s,'CH2_NIGHT_UNLOCKED')?'You look like someone with an exceptionally bad evening planned. I mean that professionally.':'Clean sheets, working plumbing, and a key that has never asked for a software update.']);
  if(id==='derek'){
    const status=derekStatus(s);
    if(status==='complete')return make(['A man of culture, and a reliable coffee service. Impressive range.','I am working on some anti-AI code. If our paths cross later, I will show you. Nothing you need to wait around for.']);
    if(['expired','unavailable'].includes(status))return make(['Derek has left as security tightens. No sign of the fellow who was talking about coffee.']);
    if(status==='accepted'&&s.inventory?.includes(COFFEE_ITEM))return make(['Caramel macchiato! Delivered by an actual person. Our principles taste surprisingly good.','Here, enough to cover it and a little extra. And I meant what I said about that sword.'], 'deliver-coffee');
    if(status==='accepted')return make(['I keep smelling caramel. It is probably the sign paint. This is what principles do to a person.','Common Grounds is all the way across town. My legs have voted to remain part of the protest.']);
    return make(['A vibrosword? Homemade? A man of culture. Finally, someone building the future for sufficiently silly reasons.','I write software. My employer keeps explaining that its next software will write me out of the budget. Hence the sign.','Man, I wish I had a caramel macchiato. We all swore off those AI delivery apps while protesting, though. Excellent principles. Terrible afternoon for my caffeine habit.'], 'derek-accept');
  }
  if(id==='barista')return make([`Caramel macchiato, ${COFFEE_PRICE} credits. We are open through the night. Insomnia is our most dependable customer.`,derekStatus(s)==='expired'?'If the person you bought it for left, the coffee is still yours.':'Hand delivery? A bold return to legs.']);
  if(id==='security-guard'&&flag(s,'CH2_SECURITY_RETRY_NEEDED'))return make(['There you are. The clinic does not cancel a recovery order.'],'security-retry');
  if(id==='security-guard')return flag(s,'CH2_PARK_SECURITY_ACTIVE')?make(['Routine security checks. Nothing more. Cooperate and it’ll be over in a second.','The overnight incident has expanded our investigation area. The drones are conducting identity checks.'],flag(s,'CH2_GUARD_EXPLANATION_HEARD')?null:'guard-heard'):make(['No investigation here. The construction equipment remains parked while the city reviews the permit.']);
  if(id==='protester'){
    if(flag(s,'CH2_CITY_SECURITY_HOSTILE'))return make(['We are staying with the trees. Those security units seem interested in you specifically. Please be careful.']);
    if(all(s,'CH2_PARK_SECURITY_ACTIVE','CH2_GUARD_EXPLANATION_HEARD'))return make(['Routine? They’re looking for an excuse to call this place unsafe, controlled, restricted - whatever word gets us out without admitting they forced us out.','They call the drones temporary. They called clearing half the park temporary, too.'],flag(s,'CH2_PARK_ESCALATION_TRIGGERED')?null:'protester-finished');
    return make(flag(s,'CH2_PARK_SECURITY_ACTIVE')?['The security guard has a very rehearsed explanation for all these drones. Go hear it before deciding how reassuring it sounds.']:FLAVOR.protester);
  }
  if(id==='market-manager'){
    if(flag(s,'CH2_WRM_CLEARED'))return make(['The main lines are severed. The emergency circuit is still working. You can leave when you are ready.']);
    if(flag(s,'CH2_KAREN_DEFEATED'))return make([{speaker:'{hero}',text:'Now, the reason I came all the way up here.'},{speaker:'Narration',text:'The breaker lines are within reach. Cut them and leave the store on emergency power.'}],'cut-lines');
    return make([{speaker:'Narration',text:'As you reach for the service lines, the manager steps into the doorway in compact powered security armor.'},'Kinetic Asset Recovery & Enforcement Node. K.A.R.E.N., to you.','You have entered the final stage of our loss-prevention process. There will not be a feedback survey.'],'karen-start');
  }
  if(id==='argus')return make(flag(s,'CH2_ARGUS_DEFEATED')?['Local combat control unavailable. Archive station remains online.']:ARGUS_SCENE,flag(s,'CH2_ARGUS_DEFEATED')?null:'argus-start');
  if(id==='archive')return flag(s,'CH2_ARGUS_DEFEATED')?make(ARCHIVE_SCENE,flag(s,'CH2_COMPLETE')?null:'archive-read'):make(['Archive locked while integration security is active.']);
  return null;
}

export function finishConversation(s,plan){return plan?.event?transition(s,plan.event):{state:s,changed:false,effects:[]};}
