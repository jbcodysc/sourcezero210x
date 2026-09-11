import {NPCS,BEATS} from './story-data.mjs';
import {mark,storyReward} from './progress.mjs';
import {FIRST_MIRA,SCARED_MIRA,startDelivery,requestPoliceReport} from './opening.mjs';
export {NPCS,BEATS};
const names=Object.fromEntries(NPCS.map(n=>[n.id,n.name]));
export function lines(items,name='Alex',heroName='Alex',side=name===heroName?'hero':'npc'){return items.map(item=>typeof item==='string'?{speaker:name,side,text:item.replaceAll('{hero}',heroName)}:{speaker:names[item.speaker]||(item.speaker==='Alex'?heroName:item.speaker.replaceAll('{hero}',heroName)),side:['Alex','{hero}'].includes(item.speaker)?'hero':'npc',speakerId:item.speaker,text:item.text.replaceAll('{hero}',heroName)});}
export function completed(beat,s){return beat.grants.every(f=>s.flags[f]);}
export function conversation(id,s){
 const npc=NPCS.find(n=>n.id===id);if(!npc)return null;
 const hero=s.name||'Alex',say=items=>lines(items,npc.name,hero,'npc');
 if(id==='dalia'&&s.flags.factoryDone){
  if(s.flags.waterRestored)return {npc,lines:say(['The south road is clear. Sana says the regulator is back to normal. Your records are staying with this investigation.','Fairmont Junction is still the next address. For once, the road and the paperwork agree.'])};
  if(s.flags.waterAccess)return {npc,lines:say(['Sana is waiting at the waterworks entrance. My clearance is on file.','The overflow began the same morning as your courier incident. Follow it to the regulator, and keep the service records intact.'])};
  return {npc,waterEvent:'access',lines:say([
   'Beck’s records give me something concrete to reopen. I will attach the fake order and the original footage.',
   'But you cannot get to Fairmont yet. The water control station lost control on the morning your courier attacked. It has been spilling into the south road ever since.',
   'I held the station closed while the company kept telling us it was a maintenance issue. That explanation has expired.',
   'I will authorize Sana to let you in. The regulator is four basement floors down. Find what is holding the discharge valves open.'
  ])};
 }
 if(id==='sana')return {npc,lines:say(s.flags.waterRestored?['Normal pressure. No unauthorized orders. I could get used to this.','The stream across the south road is draining. You can reach the Fairmont approach now.']:s.flags.waterAccess?['Quinn called. You can go in. The overflow started on the same morning as the laboratory incident.','Our scrubbers and maintenance units have turned aggressive. There are rats in the leaking galleries, and Cenexis guards where there should be municipal workers.','The stairs lead down through four floors. Bring supplies. The only working first-aid cabinet is on the third floor. There is one ration left in the first-floor spares room, and one in the fourth-floor reserve locker.','The regulator itself may still be recoverable. Stop its override without destroying the control core.']:['Station closed. I am keeping everyone clear of the machinery and the overflow.','That stream on the south road is ours. The trouble started the same morning as the lab incident.','I need Officer Quinn’s authorization before I can let you past this door.'])};
 if(id==='mira'&&s.opening==='await_mira')return {npc,lines:say(FIRST_MIRA),openingEvent:'delivery'};
 if(id==='mira'&&s.opening==='aftermath')return {npc,lines:say(SCARED_MIRA),openingEvent:'police'};
 if(id==='mira'&&['intro','courier_entering','courier_ready'].includes(s.opening))return {npc,lines:say(['The shipment is at receiving. Please check in with the courier when it arrives.'])};
 if(id==='nikhil'&&['intro','await_mira','courier_entering','courier_ready'].includes(s.opening))return {npc,lines:say(['I recalibrated the spectrometer. It and I have different ideas about precision.','Mira is organizing the shipment. I am organizing reasons not to help.'])};
 if(s.flags.bellwetherComplete&&npc.after)return {npc,lines:say(npc.after)};
 const candidates=BEATS.filter(b=>b.npc===id&&b.id!=='b7').reverse();
 const ready=candidates.find(b=>!completed(b,s)&&b.requiresAll.every(f=>s.flags[f]));
 if(ready)return {npc,beat:ready,lines:say(ready.dialogue),choice:ready.choices||null};
 const previous=candidates.find(b=>completed(b,s));
 const body=previous?previous.repeat:candidates.length?candidates.at(-1).early:(s.flags.bellwetherComplete&&npc.after?npc.after:npc.lines);
 return {npc,lines:say(body)};
}
export function finishConversation(s,plan){
 if(plan.waterEvent==='access'){mark(s,'waterAccess','Quinn authorized entry to the waterworks. Sana will let me in. The corrupted regulator is four basement floors below the station.');return true;}
 if(plan.openingEvent==='delivery')return startDelivery(s);
 if(plan.openingEvent==='police')return requestPoliceReport(s);
 if(plan.npc.fact)mark(s,'witness:'+plan.npc.fact);
 if(!plan.beat||completed(plan.beat,s))return false;
 for(const flag of plan.beat.grants)mark(s,flag);
 storyReward(s,plan.beat.id);
 if(plan.beat.journal&&!s.notes.includes(plan.beat.journal))s.notes.push(plan.beat.journal);
 if(plan.beat.id==='b1')s.opening='complete';
 if(plan.beat.id==='b8')s.credits+=80;
 return true;
}
export const FLAVOR={
 runner:['That courier skipped the usual pharmacy run. Mabel at the post office keeps every delivery receipt. Some of them emotionally.'],
 gardener:['I keep the flower beds free of weeds. The weeds keep submitting appeals.','Waterworks looks after the fountain. I just apologize to the flowers when it splashes.'],
 'park-reader':['I threw a coin in and wished for cheaper groceries. The fountain returned it.'],
 'park-robot':['PUBLIC RELAXATION AREA. PLEASE RELAX WITHIN THE MARKED AREA.','THE FOUNTAIN HAS NO APPOINTMENTS AVAILABLE.'],
 'mail-robot':['DELIVERY COMPLETE. I WILL NOW CONSIDER THE COMPLETENESS OF THE DELIVERY.'],
 dogwalker:['The dog is at home. I am practicing the route before inviting criticism.'],
 'old-timer':['Beck’s shop is east of the park. He can fix anything except the expression on his own face.'],
 shopper:['I bought one onion. The store robot offered a family plan.'],
 jogger:['This is a recovery lap. All my laps are recovery laps.'],
 neighbor:['Ruth lives by the eastern end of River Street. She used to work at Plant 4.','People keep asking about the factory. I prefer questions about tomatoes.'],
 delivery:['MRS. ALVAREZ REQUESTED APPLES. I HAVE OBTAINED APPLES. A SATISFACTORY NARRATIVE.'],
 'clerk-walk':['Quinn is following up on the courier incident at Town Hall.','I work with forms. People are unfortunately more complicated.'],
 'mechanic-walk':['A robot tried to collect a storm drain. It is going to need a much bigger bag.']
};
