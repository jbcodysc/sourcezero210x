import {upgradeProgress} from './progress.mjs';
export const OPENING_STAGES=['intro','await_mira','courier_entering','courier_ready','aftermath','week_later','back_to_work','complete'];
export const HOME_POSITION={x:768,y:770};
export function normalizeName(value){return Array.from(String(value??'').normalize('NFC').replace(/[\p{C}<>]/gu,'').replace(/\s+/g,' ').trim()).slice(0,16).join('')||'Alex';}
export function migrateOpening(saved){
 const s=JSON.parse(JSON.stringify(saved));s.name=normalizeName(s.name);
 const later=['manifestChecked','sampleTaken','beckMet','badge','badgeFixed','resinCleared','relayTaken','factoryDone','bellwetherComplete'].some(f=>s.flags[f]);
 if(later){s.opening='complete';s.flags.policeReported=true;s.flags.courierArrived=true;s.flags.courierDone=true;s.flags.manifestChecked=true;s.flags.sampleTaken=true;}
 else if(!OPENING_STAGES.includes(s.opening)){s.opening=s.flags.courierDone?'aftermath':'await_mira';s.location='lab';s.position={x:768,y:838};}
 return upgradeProgress(s);
}
export function courierPresent(s){return !s.flags.policeReported&&['courier_entering','courier_ready','aftermath','week_later'].includes(s.opening);}
export function startDelivery(s){if(s.opening!=='await_mira')return false;s.opening='courier_entering';return true;}
export function finishDelivery(s){if(s.opening!=='courier_entering')return false;s.opening='courier_ready';s.flags.courierArrived=true;return true;}
export function finishIntro(s){if(s.opening!=='intro')return false;s.opening='await_mira';s.location='lab';s.position={x:768,y:838};return true;}
export function requestPoliceReport(s){if(!s.flags.courierDone||s.opening!=='aftermath')return false;s.opening='week_later';return true;}
export function finishPoliceReport(s){if(s.opening!=='week_later')return false;s.flags.policeReported=true;s.opening='back_to_work';s.location='player-home';s.position={...HOME_POSITION};s.hp=s.maxHp;const note='The police took my statement. A frustrating week has passed. Time to go back to the lab.';if(!s.notes.includes(note))s.notes.push(note);return true;}
export function resumeOpening(s){if(s.opening==='intro')return {location:'city',position:{x:768,y:730},cinematic:'intro-city'};if(s.opening==='week_later')return {location:'lab',position:{x:768,y:838},cinematic:'police'};if(['await_mira','courier_entering','courier_ready','aftermath'].includes(s.opening))return {location:'lab',position:s.location==='lab'?s.position:{x:768,y:838}};return {location:s.location,position:s.position};}
export const FIRST_MIRA=[
 {speaker:'mira',text:'Morning, {hero}. The shipment is ready. For once, the paperwork and the actual materials agree.'},
 {speaker:'{hero}',text:'A dangerous precedent.'},
 {speaker:'mira',text:'And put away that silly sword. It is weird enough that you own one. Working on it at work is somehow even weirder.'},
 {speaker:'{hero}',text:'It is a prototype.'},
 {speaker:'mira',text:'So is the excuse. Please move your prototype off my sample tray.'},
 {speaker:'mira',text:'The courier is due any moment. Could you handle the pickup? I still have two samples to finish.'}
];
export const PICKUP=[
 {speaker:'Cenexis Courier',text:'GOOD MORNING. COLLECTION AUTHORIZATION C-04. PLEASE PREPARE THE REQUESTED MATERIALS FOR—'},
 {speaker:'Cenexis Courier',text:'…'},
 {speaker:'{hero}',text:'For pickup?'},
 {speaker:'Cenexis Courier',text:'SCANNING.'},
 {speaker:'Cenexis Courier',text:'BIOLOGICAL VARIANCE CONFIRMED. MATERIAL COLLECTION CANCELLED.'},
 {speaker:'{hero}',text:'That does not sound like a delivery problem.'},
 {speaker:'Cenexis Courier',text:'SUBJECT RETRIEVAL AUTHORIZED.'}
];
export const SCARED_MIRA=[
 {speaker:'mira',text:'{hero}… are you hurt? I thought it was going to drag you through the door.'},
 {speaker:'{hero}',text:'It was.'},
 {speaker:'mira',text:'Well. Good thing I told you to always keep that sword handy.'},
 {speaker:'{hero}',text:'That is not what you said.'},
 {speaker:'mira',text:'I am revising my position. Very quickly.'},
 {speaker:'mira',text:'My hands will not stop shaking. That was not a faulty wheel. It looked straight at you.'},
 {speaker:'mira',text:'We have to report this to the police. Right now. I will keep the pickup records and your service-plate photo.'},
 {speaker:'{hero}',text:'All right. Let’s go.'}
];
export const POLICE_NARRATION=[
 'You report the incident to the Bellwether Police Department.',
 'Statements are taken. Reports are filed. Calls go unanswered.',
 'One frustrating week later…'
];
