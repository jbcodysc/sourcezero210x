export class BattleMusic {
 constructor(url,{contextFactory=()=>new (globalThis.AudioContext||globalThis.webkitAudioContext)(),fetcher=(...args)=>globalThis.fetch(...args),onError=()=>{},onReady=()=>{},resumeOnStart=false}={}){
  this.url=url;this.contextFactory=contextFactory;this.fetcher=fetcher;this.onError=onError;this.onReady=onReady;
  this.enabled=true;this.active=false;this.visible=true;this.context=null;this.buffer=null;this.loading=null;this.pending=null;this.source=null;this.failed=false;this.error=null;
  this.resumeOnStart=resumeOnStart;this.offset=0;this.startedAt=0;
 }
 // Called directly from a key or pointer gesture; creating no music in the lab.
 unlock({retry=false}={}){
  if(this.pending){
   // A later touch/key gesture can unlock a context whose first resume is waiting.
   // Keep the download shared, but do not discard the new user activation.
   if(this.context&&this.context.state!=='running'&&this.context.state!=='closed'){
    try{Promise.resolve(this.context.resume()).catch(()=>{});}catch{}
   }
   return this.pending;
  }
  if(this.failed&&!retry)return Promise.resolve(false);
  if(retry){this.failed=false;this.error=null;this.loading=null;}
  try{
   if(!retry&&this.buffer&&this.context?.state==='running'&&!this.failed){this.sync();return Promise.resolve(true);}
   if(!this.context||this.context.state==='closed'){this.silence();this.context=this.contextFactory();}
   const resume=this.context.state!=='running'?this.context.resume():Promise.resolve();
   // Native fetch requires its global receiver, supplied by the default wrapper.
   if(!this.buffer&&!this.loading)this.loading=Promise.resolve().then(()=>this.fetcher(this.url)).then(response=>{if(!response.ok)throw new Error('Music download failed (HTTP '+response.status+').');return response.arrayBuffer();}).then(bytes=>this.context.decodeAudioData(bytes)).then(buffer=>{this.buffer=buffer;});
   this.pending=Promise.all([resume,this.loading]).then(()=>{this.sync();this.onReady();return true;}).catch(error=>{this.fail(error);return false;}).finally(()=>{this.pending=null;});
   return this.pending;
  }catch(error){this.fail(error);return Promise.resolve(false);}
 }
 fail(error){this.failed=true;this.error=error;this.loading=null;this.silence();this.onError(error);}
 start(){this.active=true;this.sync();}
 stop(){this.active=false;this.silence();}
 setEnabled(enabled){this.enabled=enabled;this.sync();}
 setVisible(visible){this.visible=visible;this.sync();}
 silence(){if(this.source){if(this.resumeOnStart&&this.buffer?.duration>0)this.offset=(this.offset+Math.max(0,(this.context.currentTime||0)-this.startedAt))%this.buffer.duration;this.source.stop();this.source.disconnect();this.source=null;}if(this.gain){this.gain.disconnect();this.gain=null;}}
 sync(){
  if(!this.active||!this.enabled||!this.visible||this.failed){this.silence();return;}
  if(this.source||!this.buffer||this.context?.state!=='running')return;
  const source=this.context.createBufferSource(),gain=this.context.createGain();
  source.buffer=this.buffer;source.loop=true;gain.gain.value=.55;source.connect(gain);gain.connect(this.context.destination);
  this.source=source;this.gain=gain;this.startedAt=this.context.currentTime||0;source.start(0,this.resumeOnStart?this.offset:0);
 }
}
