import test from 'node:test';
import assert from 'node:assert/strict';
import {fitBattleText,fittingFontSize,watchBattleText} from '../city/battle-text-layout.mjs';

test('text fitting preserves the preferred size when readable and finds a fitting size for long messages',()=>{
 assert.equal(fittingFontSize(21.6,size=>size<=24),21.6);
 const chosen=fittingFontSize(22,size=>size<=14.9);
 assert.equal(chosen,14.75);assert.ok(chosen<=14.9);assert.ok(chosen+.25>14.9);
 assert.equal(fittingFontSize(22,size=>size<=4.2),4,'even unusually long messages can use the entire box without truncation');
});

function layout(text,{width=1100,height=730,preferred=19.8}={}){
 const listeners=new Map(),fontListeners=new Map();let fontReady,observer;
 const fonts={ready:new Promise(resolve=>{fontReady=resolve;}),addEventListener:(name,fn)=>fontListeners.set(name,fn),removeEventListener:(name,fn)=>{if(fontListeners.get(name)===fn)fontListeners.delete(name);}};
 const view={addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:(name,fn)=>{if(listeners.get(name)===fn)listeners.delete(name);},
  getComputedStyle:()=>({fontSize:preferred+'px',maxHeight:'32%'}),
  ResizeObserver:class{constructor(fn){this.callback=fn;observer=this;}observe(target){this.target=target;}disconnect(){this.disconnected=true;}}
 };
 const ownerDocument={defaultView:view,fonts},style={fontSize:'',maxHeight:''};
 const frame={width,height},font=()=>parseFloat(style.fontSize)||preferred;
 const contentWidth=()=>frame.width*.42-30;
 const naturalHeight=()=>Math.ceil(Math.max(1,text.length*font()*.56/contentWidth()))*font()*1.35+20;
 const maxHeight=()=>parseFloat(style.maxHeight)||frame.height*.32;
 const copy={textContent:text,get scrollWidth(){return contentWidth();},get clientWidth(){return contentWidth();}};
 const log={ownerDocument,style,querySelector:()=>copy,getClientRects:()=>[{}],getBoundingClientRect:()=>({left:frame.width*.04,right:frame.width*.46,top:frame.height*.2,width:frame.width*.42}),
  get scrollHeight(){return Math.ceil(naturalHeight());},get clientHeight(){return Math.min(naturalHeight(),maxHeight()-4);}};
 const vitals={getClientRects:()=>[{}],getBoundingClientRect:()=>({left:frame.width*.04,right:frame.width*.35,top:frame.height-198})};
 const commands={getClientRects:()=>[{}],getBoundingClientRect:()=>({left:frame.width*.04,right:frame.width*.96,top:frame.height-80})};
 const overlay={ownerDocument,querySelector:()=>log,querySelectorAll:()=>[vitals,commands],getBoundingClientRect:()=>({...frame})};
 const stage={};
 return {overlay,log,copy,frame,stage,listeners,fontListeners,fontReady,get observer(){return observer;},setPreferred(value){preferred=value;},fits:()=>log.scrollHeight<=log.clientHeight+1};
}

test('the entire reserved message fits without changing its text, and can grow again after resizing',()=>{
 const text='A.R.G.U.S. redirects auxiliary power to its defensive field. Morgan braces against the electrical outburst and takes 127 damage. The capacitors begin charging again. ';
 const h=layout(text.repeat(3));const before=h.copy.textContent;
 const size=fitBattleText(h.overlay);assert.ok(size<19.8);assert.ok(h.fits());assert.equal(h.copy.textContent,before);
 h.frame.width=1400;h.frame.height=940;h.setPreferred(22);
 const larger=fitBattleText(h.overlay);assert.ok(larger>size);assert.ok(larger<=22);assert.ok(h.fits());assert.equal(h.copy.textContent,before);
 const short=layout('Morgan guards.');assert.equal(fitBattleText(short.overlay),19.8);assert.ok(short.fits());
});

test('the narration height respects nearby vitals instead of overlapping them in a short desktop window',()=>{
 const h=layout('A.R.G.U.S. unleashes an electrical outburst. '.repeat(7),{width:810,height:540,preferred:14.58});
 fitBattleText(h.overlay);
 const boxTop=h.frame.height*.2,topOfVitals=h.frame.height-198;
 assert.ok(parseFloat(h.log.style.maxHeight)<=topOfVitals-boxTop-8);assert.ok(h.fits());
 assert.equal(h.copy.textContent,'A.R.G.U.S. unleashes an electrical outburst. '.repeat(7));
});

test('stage and font changes remeasure messages, while shutdown removes every hook',async()=>{
 const h=layout('A long battle message. '.repeat(22)),stop=watchBattleText(h.overlay,h.stage);
 assert.equal(h.observer.target,h.stage);
 h.observer.callback();const first=parseFloat(h.log.style.fontSize);assert.ok(h.fits());
 h.frame.width=830;h.frame.height=555;h.listeners.get('resize')();assert.ok(parseFloat(h.log.style.fontSize)<first);assert.ok(h.fits());
 h.frame.width=1400;h.frame.height=940;h.setPreferred(22);h.fontListeners.get('loadingdone')();assert.ok(parseFloat(h.log.style.fontSize)>first);assert.ok(h.fits());
 const last=h.log.style.fontSize;stop();assert.equal(h.listeners.size,0);assert.equal(h.fontListeners.size,0);assert.equal(h.observer.disconnected,true);
 h.frame.width=600;h.frame.height=400;h.observer.callback();h.fontReady();await Promise.resolve();
 assert.equal(h.log.style.fontSize,last,'late observer and font-ready callbacks do not touch the next scene');
});

test('finished battles and absent text boxes require no layout or font work',()=>{
 assert.equal(fitBattleText(null),undefined);
 assert.equal(fitBattleText({querySelector:()=>null}),undefined);
 const h=layout('Victory.');h.log.getClientRects=()=>[];assert.equal(fitBattleText(h.overlay),undefined);assert.equal(h.log.style.fontSize,'');
});
