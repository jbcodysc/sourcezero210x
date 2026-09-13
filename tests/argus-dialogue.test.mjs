import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {ARGUS_PANEL_IMAGE,isArgusLine,argusPanelMarkup,argusTextMarkup} from '../city/argus-dialogue.mjs';
import {Typewriter} from '../lab/presentation.mjs';
import {CityAudio} from '../city/audio.mjs';

const escape=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const withoutHighlights=markup=>markup.replace(/<\/?span(?: class="argus-(?:cyan|gold)")?>/g,'');

test('Argus panel uses the supplied local artwork and keeps authored text out of HTML',()=>{
 const bytes=readFileSync(new URL(ARGUS_PANEL_IMAGE));
 assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(bytes.readUInt32BE(16),1448);assert.equal(bytes.readUInt32BE(20),1086);
 const text='Morgan <img src=x onerror="attack()"> has RESONANCE & GREAT PROMISE.';
 const html=argusPanelMarkup({speaker:'A.R.G.U.S.',text});
 assert.ok(html.includes('href="'+escape(ARGUS_PANEL_IMAGE)+'"'));
 assert.ok(html.includes('aria-label="A.R.G.U.S. transmission"'));
 assert.ok(html.includes('class="dialog-speaker">A.R.G.U.S.</span>'));
 assert.ok(html.includes('<span class="sr-only">'+escape(text)+'</span>'));
 assert.ok(!html.includes('<img'),'dialogue is never interpreted as user-controlled HTML');
 assert.ok(html.includes('data-action="dialogue-next"'),'the established continue action remains available');
 assert.ok(!html.includes('ARCHON UNIT'),'the sample speaker is not a live dialogue label');
});

test('electronic text highlights complete keywords without coloring unrelated words',()=>{
 const text='MAINTENANCE REMAINS: AI HAS SUPERIOR ABILITIES. CLASSIFIED RESONANCE SHOWS GREAT PROMISE.';
 const html=argusTextMarkup(text);
 assert.ok(html.startsWith('MAINTENANCE REMAINS: '));
 for(const word of ['AI','SUPERIOR','ABILITIES','RESONANCE','GREAT PROMISE'])assert.ok(html.includes('<span class="argus-cyan">'+word+'</span>'));
 assert.ok(html.includes('<span class="argus-gold">CLASSIFIED</span>'));
 assert.equal(withoutHighlights(html),text);
 for(const partial of ['R','RESONAN','GREAT PROM','ARTIFICIAL INTELLIGEN'])assert.equal(argusTextMarkup(partial),partial);
 assert.equal(withoutHighlights(argusTextMarkup('<AI> & "HUMANS"')),escape('<AI> & "HUMANS"'));
});

// Exercise the real Base scene's dialogue methods, not a second test-only
// renderer. Phaser world creation is unnecessary for these DOM/input rules.
const source=readFileSync(new URL('../city/city.js',import.meta.url),'utf8');
function dialogueHarness(){
 const overlay={className:'',_html:''},stage={clientWidth:1200,clientHeight:800},prompt={hidden:false};
 let box,typed;
 Object.defineProperty(overlay,'innerHTML',{get(){return this._html;},set(html){this._html=html;box=html?{style:{},offsetWidth:330,offsetHeight:120}:null;typed=html.includes('data-typing')?{innerHTML:'',textContent:''}:null;}});
 const $=selector=>selector==='#overlay'?overlay:selector==='#stage'?stage:selector==='#prompt'?prompt:selector==='#overlay .dialog-box'?box:selector==='#overlay [data-typing]'?typed:null;
 const voices=[],anchors=[],resets=[];
 const helpers=source.slice(source.indexOf('function textSlot('),source.indexOf('function sceneUI('));
 const methods=source.slice(source.indexOf(' showDialogue('),source.indexOf('\n openJournal('));
 assert.ok(methods.includes(' closeDialogue('),'the actual dialogue lifecycle is included');
 const sandbox={$: $,Typewriter,isArgusLine,argusPanelMarkup,argusTextMarkup,esc:escape,heroName:()=> 'Morgan',heroLines:items=>items,
  sound:{letter(character,voice){voices.push({character,voice});}},resetControls:()=>resets.push('controls'),VIEW:{width:1200,height:800},
  conversationAnchor(...args){anchors.push(args);return {x:17,y:29};}};
 const api=vm.runInNewContext(helpers+'\nclass DialogueScene {'+methods+'}\n({DialogueScene,advanceText,finishText})',sandbox);
 const scene=new api.DialogueScene();scene.player={x:700,y:650,name:'Morgan',row:0};
 scene.npcs=[{x:450,y:500,id:'mira',name:'Mira',row:4}];scene.cameras={main:{scrollX:10,scrollY:20}};
 scene.input={keyboard:{resetKeys(){resets.push('keys');}}};
 return {scene,api,overlay,prompt,voices,anchors,resets,get box(){return box;},get typed(){return typed;}};
}

test('Argus is fixed at the top while mixed hero and NPC replies keep their regular boxes and voices',()=>{
 const h=dialogueHarness(),argus={x:800,y:440,name:'A.R.G.U.S.',row:7};let completed=0;
 h.scene.showDialogue([
  {speaker:'A.R.G.U.S.',text:'Your resonance is classified.'},
  {speaker:'Alex',text:'My what?'},
  {speaker:'Mira',speakerId:'mira',text:'I heard that.'}
 ],argus,()=>completed++);
 assert.equal(h.scene.locked,true);assert.equal(h.prompt.hidden,true);
 assert.ok(h.overlay.innerHTML.includes('dialog-argus'));assert.equal(h.scene.voice,'argus');
 assert.equal(h.anchors.length,0,'the global transmission is not placed beside the offscreen speaker');
 assert.deepEqual(h.box.style,{});assert.equal(h.scene.writer.characters.join(''),'YOUR RESONANCE IS CLASSIFIED.');
 h.api.finishText(h.scene);h.scene.advanceDialogue();
 assert.ok(h.overlay.innerHTML.includes('dialog-hero'));assert.ok(!h.overlay.innerHTML.includes('dialog-argus'));
 assert.ok(h.overlay.innerHTML.includes('Morgan'));assert.equal(h.scene.voice,0);assert.equal(h.scene.writer.characters.join(''),'My what?');
 assert.equal(h.anchors.at(-1).at(-1),true);assert.equal(h.box.style.left,'17%');
 h.api.finishText(h.scene);h.scene.advanceDialogue();
 assert.ok(h.overlay.innerHTML.includes('dialog-npc'));assert.equal(h.scene.voice,4);assert.equal(h.scene.dialog.activeSpeaker,h.scene.npcs[0]);
 assert.equal(h.anchors.at(-1).at(-1),false);h.api.finishText(h.scene);h.scene.advanceDialogue();
 assert.equal(completed,1);assert.equal(h.scene.dialog,null);assert.equal(h.scene.writer,null);assert.equal(h.overlay.innerHTML,'');
 assert.ok(!h.scene.locked);assert.ok(h.resets.length>=4);
});

test('typewriter builds safe partial Argus markup, completes once, and leaves ordinary dialogue casing alone',()=>{
 const h=dialogueHarness(),text='RESONANCE & <AI>.';
 h.scene.showDialogue([{speaker:'Facility intercom',presentation:'argus',text}],h.scene.player);
 let previous='';
 for(let i=0;i<text.length;i++){
  h.api.advanceText(h.scene,1000/44+.001);
  const visible=h.typed.innerHTML;
  assert.equal(withoutHighlights(visible),escape(text.slice(0,i+1)));
  assert.equal((visible.match(/<span /g)||[]).length,(visible.match(/<\/span>/g)||[]).length,'each reveal produces balanced markup');
  assert.ok(visible.length>=previous.length);previous=visible;
 }
 assert.ok(h.typed.innerHTML.includes('argus-cyan'));assert.equal(h.api.finishText(h.scene),false);
 assert.ok(h.voices.every(v=>v.voice==='argus'));const soundCount=h.voices.length;h.api.advanceText(h.scene,1000);assert.equal(h.voices.length,soundCount);
 h.scene.showDialogue([{speaker:'Mira',text:'Mixed <b>case</b> & punctuation.'}],h.scene.npcs[0]);
 h.api.advanceText(h.scene,100);assert.equal(h.typed.innerHTML,'');assert.equal(h.typed.textContent,'Mixe');
 assert.equal(h.api.finishText(h.scene),true);assert.equal(h.typed.textContent,'Mixed <b>case</b> & punctuation.');
 assert.equal(h.api.finishText(h.scene),false);
});

function audioHarness(){
 const nodes=[],gains=[];
 const parameter=()=>({value:0,events:[],setValueAtTime(value,time){this.value=value;this.events.push({method:'set',value,time});},linearRampToValueAtTime(value,time){this.value=value;this.events.push({method:'linear',value,time});},exponentialRampToValueAtTime(value,time){this.value=value;this.events.push({method:'exponential',value,time});}});
 const context={state:'running',currentTime:1,destination:{},
  createOscillator(){const node={frequency:parameter(),connect(gain){this.gain=gain;},disconnect(){this.disconnected=true;},start(time){this.startTime=time??context.currentTime;},stop(time){this.stopTime=time??context.currentTime;}};nodes.push(node);return node;},
  createGain(){const gain={gain:parameter(),connect(){},disconnect(){this.disconnected=true;}};gains.push(gain);return gain;},
  advanceTo(time){this.currentTime=time;for(const node of nodes)if(!node.ended&&node.stopTime<=time){node.ended=true;node.onended?.();}}
 };
 const audio=new CityAudio();audio.context=context;return {audio,context,nodes,gains};
}

test('Argus typing has a distinct electronic voice, rate limiting, soft edges, and no lingering sources',()=>{
 const h=audioHarness();h.audio.letter('R','argus');assert.equal(h.nodes.length,2);
 assert.deepEqual(h.nodes.map(n=>n.type),['square','sine']);
 for(const node of h.nodes){
  assert.equal(node.startTime,1);assert.equal(node.stopTime,1.05);
  assert.equal(node.gain.gain.events[0].value,0,'voice begins silently to avoid clicks');
  assert.ok(node.gain.gain.events.some(e=>e.method==='linear'&&e.value>0));
  assert.ok(node.gain.gain.events.at(-1).value<=.0001,'voice decays before stopping');
 }
 h.audio.letter('E','argus');h.context.currentTime=1.039;h.audio.letter('S','argus');assert.equal(h.nodes.length,2,'fast updates do not pile on voices');
 h.context.advanceTo(1.06);assert.equal(h.audio.playingEffects.size,0);assert.ok(h.nodes.every(n=>n.disconnected&&n.gain.disconnected));
 h.audio.letter(' ','argus');assert.equal(h.nodes.length,2,'whitespace is silent');
 h.audio.letter('O','argus');assert.equal(h.nodes.length,4);h.context.advanceTo(1.12);
 h.audio.letter('M',4);assert.equal(h.nodes.length,5);assert.equal(h.nodes.at(-1).type,'triangle');assert.equal(h.nodes.at(-1).frequency.value,410,'Mira retains her existing voice');
 h.context.advanceTo(1.2);assert.equal(h.audio.playingEffects.size,0);
});

test('muting, hiding, and explicit scene cleanup stop Argus syllables and never replay them',()=>{
 for(const mode of ['mute','hide','stop-effects','stop']){
  const h=audioHarness();h.audio.letter('A','argus');assert.equal(h.audio.playingEffects.size,2);
  if(mode==='mute')h.audio.setEnabled(false);else if(mode==='hide')h.audio.setVisible(false);else if(mode==='stop-effects')h.audio.stopEffects('argus-letter');else h.audio.stop();
  assert.equal(h.audio.playingEffects.size,0,mode);assert.ok(h.nodes.every(n=>n.stopTime===1&&n.disconnected&&n.gain.disconnected),mode);
  if(mode==='mute'||mode==='hide'){
   h.context.currentTime=2;h.audio.letter('B','argus');assert.equal(h.nodes.length,2,mode+' suppresses new letters');
   h.audio.setEnabled(true);h.audio.setVisible(true);assert.equal(h.nodes.length,2,'restoring audio does not replay old dialogue');
  }
  h.context.advanceTo(3);assert.equal(h.audio.playingEffects.size,0,'late ended callbacks are harmless after cleanup');
 }
 for(const state of ['suspended','closed']){const h=audioHarness();h.context.state=state;h.audio.letter('C','argus');assert.equal(h.nodes.length,0,state);}
});
