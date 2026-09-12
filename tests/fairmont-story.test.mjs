import test from 'node:test';
import assert from 'node:assert/strict';
import {
  transition,conversation,finishConversation,timeOfDay,canEnter,canStreetEnemy,
  resumeEvent,derekStatus,protestState,objective,dialogueLines,
  NPCS,BELLWETHER_SCENE,ARCHIVE_SCENE,SCAN_SCENE,ARGUS_SCENE,FACILITY_LOGS,FLAVOR,
  COFFEE_ITEM,COFFEE_PRICE,FACILITY_KEYCARD
} from '../fairmont/story.mjs';

function seed(){return {
  version:1,name:'Morgan',opening:'complete',flags:{waterRestored:true,relayTaken:true,badgeFixed:true,bellwetherComplete:true},
  hp:155,maxHp:218,level:10,xp:2100,credits:100,snacks:1,upgrade:1,armor:'insulated-vest',
  notes:['Bellwether investigation.'],inventory:['insulated-vest'],visited:['lab','city','water:4'],
  location:'fairmont-hotel',position:{x:400,y:550},party:[{id:'hero',hp:155}]
};}
const sequence=[
  'arrive','module-reminder','radio-bargain','hotel-sleep','bellwether-finished','wrm-enter',
  'karen-start','karen-defeated','cut-lines','hotel-sleep','decrypt-start','guard-heard',
  'protester-finished','scan-finished','security-defeated','keycard','facility-enter',
  'argus-entrance-start','argus-entrance-complete','argus-start','argus-defeated','archive-read'
];
// The existing network console sets its puzzle flag outside the story reducer.
function storyStep(s,event){if(event==='argus-entrance-start')s={...s,flags:{...s.flags,CH2_CORE_SHUTTERS:true}};return transition(s,event);}
function run(events,s=seed()){for(const event of events)s=storyStep(s,event).state;return s;}
function until(event,s=seed()){return run(sequence.slice(0,sequence.indexOf(event)+1),s);}
function reload(s){return JSON.parse(JSON.stringify(s));}

test('Derek mentions coffee casually without assigning a delivery errand',()=>{
  const arrived=until('arrive'),first=conversation('derek',arrived);
  assert.match(first.lines.map(l=>l.text).join(' '),/wish I had a caramel macchiato/);
  assert.doesNotMatch(first.lines.map(l=>l.text).join(' '),/could you bring|bring me|get me/i);
  const heard=transition(arrived,first.event).state;
  assert.doesNotMatch(conversation('derek',heard).lines.map(l=>l.text).join(' '),/then back here|bring me|get me/i);
  const purchased=transition({...heard,credits:100},'buy-coffee').state;
  assert.equal(conversation('derek',purchased).event,'deliver-coffee');
});

test('Radio Hut hints at helping after market misfortune without giving hotel or entrance directions',()=>{
  const arrived=until('module-reminder'),first=conversation('radio',arrived);
  assert.equal(first.event,'radio-bargain');
  const heard=finishConversation(arrived,first).state,repeated=conversation('radio',heard);
  assert.equal(heard.flags.CH2_RADIO_HUT_BARGAIN,true);
  assert.equal(heard.flags.CH2_NIGHT_UNLOCKED,undefined);
  assert.equal(repeated.event,null);
  assert.doesNotMatch(objective(heard),/hotel|closed store|front door|rear|service reader|go to/i);
  for(const exchange of [first,repeated]){
    const text=exchange.lines.map(line=>line.text).join(' ');
    assert.match(text,/Whole Robotics Market/);
    assert.match(text,/helpful mood|find time for your module/);
    assert.doesNotMatch(text,/hotel|front door|rear|service reader|locked|go to/i);
  }
});

test('losing the scripted attack leaves room to recover and consciously return for a retry',()=>{
  const scanned=until('scan-finished');
  const recovering=transition(scanned,'security-aborted').state;
  assert.equal(resumeEvent(recovering),null);
  assert.equal(conversation('security-guard',recovering).event,'security-retry');
  const retry=transition(recovering,'security-retry');
  assert.ok(retry.effects.includes('security-battle'));
  assert.equal(resumeEvent(retry.state).type,'security-battle');
  const won=transition(retry.state,'security-defeated').state;
  assert.equal(won.flags.CH2_CITY_SECURITY_HOSTILE,true);
  assert.equal(won.flags.CH2_SECURITY_RETRY_NEEDED,undefined);
});

test('Chapter 2 completes with Derek entirely absent; version and Chapter 1 history survive',()=>{
  const before=seed();let s=before;
  for(const event of sequence){const next=storyStep(s,event);assert.equal(next.changed,true,event);s=reload(next.state);}
  assert.equal(s.flags.CH2_COMPLETE,true);
  assert.equal(s.version,1);assert.equal(s.opening,'complete');
  assert.equal(s.flags.bellwetherComplete,true);assert.equal(s.notes[0],before.notes[0]);
  assert.equal(s.flags.CH2_DEREK_ACCEPTED,undefined);assert.equal(s.flags.CH2_DEREK_COMPLETE,undefined);
  assert.ok(s.inventory.includes(FACILITY_KEYCARD));
  assert.deepEqual(s.party,before.party);assert.deepEqual(s.visited,before.visited);
  assert.match(objective(s),/Northbridge/);
});

test('arrival requires the completed water route, retained storage module, and repaired Chapter 1 badge',()=>{
  for(const gate of ['waterRestored','relayTaken','badgeFixed']){
    const s=seed();delete s.flags[gate];assert.equal(transition(s,'arrive').changed,false,gate);
  }
  assert.equal(until('arrive').flags.CH2_ARRIVED,true);
});

test('main beats cannot be skipped from the arrival state',()=>{
  const s=until('arrive');
  for(const event of ['radio-bargain','bellwether-finished','wrm-enter','karen-start','karen-defeated','cut-lines','decrypt-start','guard-heard','protester-finished','scan-finished','security-defeated','keycard','facility-enter','argus-entrance-start','argus-entrance-complete','argus-start','argus-defeated','archive-read']){
    assert.equal(transition(s,event).changed,false,event);
  }
});

test('reducer never changes the supplied save, and story transitions do not consume unrelated supplies',()=>{
  const s=until('radio-bargain'),copy=reload(s);
  Object.freeze(s.flags);Object.freeze(s.inventory);Object.freeze(s.notes);Object.freeze(s);
  const result=transition(s,'hotel-sleep');
  assert.deepEqual(s,copy);assert.notEqual(result.state,s);
  assert.equal(result.state.snacks,s.snacks);assert.equal(result.state.credits,s.credits);
  assert.equal(result.state.armor,s.armor);assert.deepEqual(result.state.inventory,s.inventory);
});

test('ordinary hotel rest before bargain heals without changing time or launching the cutscene',()=>{
  const s=until('module-reminder');const result=transition(s,'hotel-sleep');
  assert.equal(result.state.hp,s.maxHp);assert.equal(timeOfDay(result.state),'day');
  assert.deepEqual(result.effects,['rest']);assert.equal(resumeEvent(result.state),null);
  assert.equal(result.state.flags.CH2_NIGHT_UNLOCKED,undefined);
});

test('hotel cutscene starts once and stores its exact hotel context',()=>{
  let s=until('hotel-sleep');
  assert.deepEqual(resumeEvent(s),{type:'bellwether',step:0});
  assert.deepEqual(s.chapter2HotelContext,{location:'fairmont-hotel',position:{x:400,y:550}});
  const repeated=transition(s,'hotel-sleep');assert.equal(repeated.changed,false);assert.deepEqual(repeated.effects,[]);
  s=transition(s,{type:'scene-step',step:4}).state;
  assert.deepEqual(resumeEvent(reload(s)),{type:'bellwether',step:4});
  assert.equal(transition(s,{type:'scene-step',step:2}).changed,false);
  assert.equal(transition(s,{type:'scene-step',step:999}).changed,false);
  const finished=transition(s,'bellwether-finished');
  s=finished.state;
  assert.equal(timeOfDay(s),'night');assert.equal(resumeEvent(s),null);
  assert.equal(s.flags.CH2_BELLWETHER_FINISHED,true);assert.deepEqual(finished.effects,['night']);
  assert.equal(transition(s,'bellwether-finished').changed,false);
  for(let i=0;i<3;i++){
    const rest=transition(reload(s),'hotel-sleep');s=rest.state;
    assert.equal(timeOfDay(s),'night');assert.deepEqual(rest.effects,['rest']);
    assert.equal(resumeEvent(s),null);
  }
});

test('market dungeon entrance requires bargain, actual night, and old repaired badge',()=>{
  assert.equal(canEnter(until('module-reminder'),'wrm'),false);
  assert.equal(canEnter(until('radio-bargain'),'market-rear'),false);
  const night=until('bellwether-finished');assert.equal(canEnter(night,'market-rear'),true);
  const missing=reload(night);delete missing.flags.badgeFixed;assert.equal(canEnter(missing,'wrm'),false);
  const day2=run(sequence.slice(0,10));assert.equal(canEnter(day2,'wrm'),false);
  assert.equal(canEnter(night,'market-front'),false);
});

test('K.A.R.E.N. defeat does not clear store; explicit wire cut is required and time remains night',()=>{
  let s=until('karen-start');assert.deepEqual(resumeEvent(reload(s)),{type:'karen-battle',step:0});
  s=transition(s,'karen-defeated').state;
  assert.equal(s.flags.CH2_KAREN_DEFEATED,true);assert.equal(s.flags.CH2_WRM_CLEARED,undefined);
  assert.equal(resumeEvent(s),null);assert.equal(transition(s,'karen-start').changed,false);
  s=transition(s,'hotel-sleep').state;assert.equal(timeOfDay(s),'night');
  const lines=conversation('breaker',s);assert.equal(lines.event,'cut-lines');
  s=finishConversation(s,lines).state;assert.equal(s.flags.CH2_WRM_CLEARED,true);
  assert.equal(timeOfDay(s),'night');assert.equal(s.flags.CH2_DAY2,undefined);
  assert.equal(transition(s,'cut-lines').changed,false);
  s=transition(reload(s),'hotel-sleep').state;
  assert.equal(s.flags.CH2_DAY2,true);assert.equal(timeOfDay(s),'day');
  assert.equal(transition(s,'hotel-sleep').effects.includes('bellwether'),false);
});

test('an aborted K.A.R.E.N. or ARGUS battle can be retried without claiming victory',()=>{
  let s=until('karen-start');s=transition(s,'karen-aborted').state;
  assert.equal(resumeEvent(s),null);assert.equal(s.flags.CH2_KAREN_DEFEATED,undefined);
  assert.equal(transition(s,'karen-start').changed,true);
  s=until('argus-start');s=transition(s,'argus-aborted').state;
  assert.equal(resumeEvent(s),null);assert.equal(s.flags.CH2_ARGUS_DEFEATED,undefined);
  const retry=transition(s,'argus-entrance-start');assert.deepEqual(retry.effects,['argus-dialogue']);s=retry.state;
  assert.equal(transition(s,'argus-start').changed,true);
});

test('night retains coffee, hotel, clinic and apartments but closes ordinary shops',()=>{
  const s=until('bellwether-finished');
  for(const location of ['coffee','hotel','clinic','apartments'])assert.equal(canEnter(s,location),true,location);
  for(const location of ['radio-hut','shop','gear','diner','books'])assert.equal(canEnter(s,location),false,location);
  assert.equal(protestState(s),'camp');
});

test('guard then protester then scan then battle is strict, and hostility begins only after victory',()=>{
  let s=run(sequence.slice(0,10));
  assert.equal(protestState(s),'peaceful');assert.equal(transition(s,'guard-heard').changed,false);
  s=transition(s,'decrypt-start').state;assert.equal(protestState(s),'security-checks');
  assert.equal(transition(s,'protester-finished').changed,false);
  assert.equal(transition(s,'scan-finished').changed,false);
  s=finishConversation(s,conversation('guard',s)).state;
  assert.equal(s.flags.CH2_GUARD_EXPLANATION_HEARD,true);
  s=finishConversation(s,conversation('protester',s)).state;
  assert.equal(s.flags.CH2_DEREK_LOCKED,true);
  assert.deepEqual(resumeEvent(s),{type:'scan',step:0});
  assert.equal(s.flags.CH2_PLAYER_SCANNED,undefined);
  assert.equal(transition(s,'security-defeated').changed,false);
  assert.equal(transition(s,'keycard').changed,false);
  assert.equal(canStreetEnemy(s,'security'),false);
  s=transition(s,{type:'scene-step',step:2}).state;
  assert.deepEqual(resumeEvent(reload(s)),{type:'scan',step:2});
  s=transition(s,'scan-finished').state;
  assert.deepEqual(resumeEvent(reload(s)),{type:'security-battle',step:0});
  assert.equal(canStreetEnemy(s,'drone'),false);assert.equal(transition(s,'keycard').changed,false);
  s=transition(s,'security-defeated').state;
  assert.equal(resumeEvent(s),null);assert.equal(protestState(s),'targeted-security');
  for(const hostile of ['security','drone','security-guard','security-drone'])assert.equal(canStreetEnemy(s,hostile),true);
  for(const ordinary of ['service','cleaner','civilian','protester','delivery'])assert.equal(canStreetEnemy(s,ordinary),false);
});

test('Derek may be completed during required night and rewards only once',()=>{
  let s=until('bellwether-finished');s=transition(s,'derek-accept').state;
  const balance=s.credits;s=transition(s,'buy-coffee').state;
  assert.equal(s.credits,balance-COFFEE_PRICE);assert.ok(s.inventory.includes(COFFEE_ITEM));
  assert.equal(conversation('derek',s).event,'deliver-coffee');
  s=finishConversation(s,conversation('derek',s)).state;
  assert.equal(derekStatus(s),'complete');assert.equal(s.credits,balance-COFFEE_PRICE+12);
  assert.equal(s.inventory.includes(COFFEE_ITEM),false);
  assert.equal(transition(s,'deliver-coffee').changed,false);
  s=run(sequence.slice(5,13),s);
  assert.equal(derekStatus(s),'complete');assert.equal(s.flags.CH2_DEREK_LOCKED,undefined);
});

test('late coffee cannot reopen Derek after escalation, including after reload',()=>{
  let s=until('guard-heard');s=transition(s,'derek-accept').state;s=transition(s,'buy-coffee').state;
  s=transition(s,'protester-finished').state;
  assert.equal(derekStatus(s),'expired');assert.equal(s.flags.CH2_DEREK_EXPIRED,true);
  assert.ok(s.inventory.includes(COFFEE_ITEM));
  for(const event of ['deliver-coffee','derek-accept'])assert.equal(transition(reload(s),event).changed,false,event);
  assert.equal(conversation('derek',reload(s)).event,null);
  assert.equal(transition({...s,credits:COFFEE_PRICE-1},'buy-coffee').changed,false);
});

test('a coffee purchased before requesting the favor also expires at quest lock',()=>{
  let s=until('guard-heard');s=transition(s,'buy-coffee').state;s=transition(s,'protester-finished').state;
  assert.equal(derekStatus(s),'expired');assert.equal(s.flags.CH2_DEREK_ACCEPTED,undefined);
});

test('facility keycard comes from decoder after security battle and cannot be duplicated',()=>{
  let s=until('security-defeated');
  assert.equal(canEnter(s,'facility-service'),false);assert.equal(conversation('radio',s).event,'keycard');
  s=finishConversation(s,conversation('radio',s)).state;
  assert.equal(canEnter(s,'facility-service'),true);assert.equal(canEnter(s,'facility-front'),false);
  s=transition(s,'keycard').state;assert.equal(s.inventory.filter(i=>i===FACILITY_KEYCARD).length,1);
  assert.equal(transition(s,'facility-enter').state.flags.CH2_DRONE_FACILITY_ENTERED,true);
});

test('ARGUS gates archive reveal; interrupted fight resumes and defeated boss does not respawn',()=>{
  let s=until('facility-enter');
  assert.equal(transition(s,'archive-read').changed,false);assert.equal(conversation('archive',s).event,null);
  assert.equal(transition(s,'argus-defeated').changed,false);
  const intro=conversation('argus',s);
  assert.ok(intro.lines.some(l=>l.text==='Identity unresolved. Classification match confirmed. Recovery priority elevated.'));
  assert.equal(finishConversation(s,intro).changed,false,'dialogue cannot bypass the physical entrance');
  s=run(['argus-entrance-start','argus-entrance-complete'],s);
  s=finishConversation(s,intro).state;assert.deepEqual(resumeEvent(reload(s)),{type:'argus-battle',step:0});
  s=transition(s,'argus-defeated').state;assert.equal(s.flags.CH2_COMPLETE,undefined);
  assert.equal(transition(s,'argus-start').changed,false);assert.equal(resumeEvent(s),null);
  assert.equal(conversation('argus',s).event,null);assert.equal(conversation('archive',s).event,'archive-read');
  s=finishConversation(s,conversation('archive',s)).state;
  assert.equal(s.flags.CH2_COMPLETE,true);assert.equal(transition(s,'archive-read').changed,false);
});

test('A.R.G.U.S. entrance is gated, resumes each physical phase, and cannot start twice',()=>{
  const ready={...until('facility-enter'),flags:{...until('facility-enter').flags,CH2_CORE_SHUTTERS:true}};
  for(const gate of ['CH2_DRONE_FACILITY_ENTERED','CH2_DRONE_KEYCARD','CH2_CORE_SHUTTERS']){
    const missing=reload(ready);delete missing.flags[gate];
    assert.equal(transition(missing,'argus-entrance-start').changed,false,gate);
  }
  let result=transition(ready,'argus-entrance-start'),s=result.state;
  assert.deepEqual(result.effects,['argus-entrance']);assert.equal(s.flags.CH2_ARGUS_ENCOUNTER_ACTIVE,true);
  assert.deepEqual(resumeEvent(reload(s)),{type:'argus-entrance',step:0});
  assert.equal(transition(s,'argus-entrance-start').changed,false);
  assert.equal(transition(s,'argus-start').changed,false);
  for(const step of [1,2]){
    s=transition(s,{type:'argus-entrance-step',step}).state;
    assert.deepEqual(resumeEvent(reload(s)),{type:'argus-entrance',step});
    assert.equal(transition(s,{type:'argus-entrance-step',step}).changed,false);
  }
  for(const step of [-1,0,1,3,Infinity,NaN])assert.equal(transition(s,{type:'argus-entrance-step',step}).changed,false);
  result=transition(s,'argus-entrance-complete');s=result.state;
  assert.deepEqual(result.effects,['argus-dialogue']);assert.equal(s.flags.CH2_ARGUS_ENTRANCE_SEEN,true);
  assert.deepEqual(resumeEvent(reload(s)),{type:'argus-dialogue',step:0});
  assert.equal(transition(s,'argus-entrance-complete').changed,false);
  assert.equal(transition(s,'argus-entrance-start').changed,false);
  for(let step=1;step<=ARGUS_SCENE.length;step++){
    s=transition(s,{type:'argus-dialogue-step',step}).state;
    assert.deepEqual(resumeEvent(reload(s)),{type:'argus-dialogue',step});
  }
  assert.equal(transition(s,{type:'argus-dialogue-step',step:ARGUS_SCENE.length+1}).changed,false);
  assert.equal(transition(s,{type:'argus-dialogue-step',step:1}).changed,false);
  result=transition(s,'argus-start');s=result.state;
  assert.deepEqual(result.effects,['argus-battle']);assert.deepEqual(resumeEvent(reload(s)),{type:'argus-battle',step:0});
  assert.equal(transition(s,'argus-start').changed,false);
});

test('A.R.G.U.S. defeat recovery allows clinic rest and retry dialogue without repeating the entrance',()=>{
  let s=until('argus-start');s=transition(s,'argus-aborted').state;
  assert.equal(resumeEvent(reload(s)),null);
  assert.equal(s.flags.CH2_ARGUS_ENCOUNTER_ACTIVE,undefined);assert.equal(s.flags.CH2_ARGUS_PENDING,undefined);
  assert.equal(s.flags.CH2_ARGUS_ENTRANCE_SEEN,true);
  assert.equal(transition(s,'argus-start').changed,false,'a clinic reload does not restart combat');
  const retry=transition(reload(s),'argus-entrance-start');s=retry.state;
  assert.deepEqual(retry.effects,['argus-dialogue']);assert.deepEqual(resumeEvent(s),{type:'argus-dialogue',step:0});
  assert.equal(transition(s,'argus-entrance-complete').changed,false);
  s=transition(s,'argus-start').state;s=transition(s,'argus-defeated').state;
  assert.equal(resumeEvent(reload(s)),null);
  for(const event of ['argus-entrance-start','argus-entrance-complete','argus-start','argus-defeated'])assert.equal(transition(s,event).changed,false,event);
  assert.equal(conversation('archive',s).event,'archive-read');
});

test('legacy pending A.R.G.U.S. saves resume the fight and still recover safely after defeat',()=>{
  const legacy=until('facility-enter');legacy.flags.CH2_ARGUS_PENDING=true;
  assert.deepEqual(resumeEvent(reload(legacy)),{type:'argus-battle',step:0});
  const won=transition(legacy,'argus-defeated').state;
  assert.equal(won.flags.CH2_ARGUS_DEFEATED,true);assert.equal(resumeEvent(won),null);
  assert.equal(conversation('archive',won).event,'archive-read');
  const lost=transition(legacy,'argus-aborted').state;
  assert.equal(resumeEvent(lost),null);assert.equal(lost.flags.CH2_ARGUS_DEFEATED,undefined);assert.equal(lost.flags.CH2_ARGUS_ENTRANCE_SEEN,true);
  lost.flags.CH2_CORE_SHUTTERS=true;
  assert.deepEqual(transition(lost,'argus-entrance-start').effects,['argus-dialogue']);
});

test('player-facing text withholds forbidden explanations; scans disclose no classification result',()=>{
  const visible=[BELLWETHER_SCENE,ARCHIVE_SCENE,SCAN_SCENE,FACILITY_LOGS,FLAVOR];
  for(let i=1;i<=sequence.length;i++){
    const s=run(sequence.slice(0,i));for(const npc of NPCS)visible.push(conversation(npc.id,s).lines);
    visible.push(s.notes,objective(s));
  }
  assert.doesNotMatch(JSON.stringify(visible),/\bmagic\b|biological resonance|resonance-capable|cyborg|magically/i);
  assert.doesNotMatch(JSON.stringify(SCAN_SCENE),/positive|candidate|classification|resonance/i);
  assert.match(JSON.stringify(ARCHIVE_SCENE),/Northbridge/i);
  assert.match(JSON.stringify(ARCHIVE_SCENE),/transit, utilities, public services, logistics, building automation/);
});

test('hero dialogue resolves the saved name and is visually distinguished from NPC dialogue',()=>{
  const result=dialogueLines([{speaker:'{hero}',text:'I am {hero}.'},{speaker:'radio-owner',text:'Of course.'}],seed());
  assert.deepEqual(result,[{speaker:'Morgan',text:'I am Morgan.',side:'hero'},{speaker:'Harlan Voss',text:'Of course.',side:'npc'}]);
});
