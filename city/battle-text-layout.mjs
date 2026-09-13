// The reserve span contains the complete message while its visible twin types.
// Fit that complete layout once, so the box never grows or scrolls mid-sentence.
export function fittingFontSize(preferred,fits){
 if(fits(preferred))return preferred;
 let low=4,high=Math.max(low,Math.floor(preferred*4)),best=low;
 while(low<=high){const middle=Math.floor((low+high)/2);if(fits(middle/4)){best=middle;low=middle+1;}else high=middle-1;}
 return best/4;
}

export function fitBattleText(overlay){
 const log=overlay?.querySelector('.battle-log'),copy=log?.querySelector('.typed-copy');
 if(!copy||!log.getClientRects().length)return;
 const view=log.ownerDocument.defaultView;
 log.style.fontSize='';log.style.maxHeight='';
 const style=view.getComputedStyle(log),preferred=parseFloat(style.fontSize),rect=log.getBoundingClientRect();
 if(!Number.isFinite(preferred)||!rect.width)return;
 let available=parseFloat(style.maxHeight);
 if(style.maxHeight.endsWith('%'))available=overlay.getBoundingClientRect().height*available/100;
 if(!Number.isFinite(available))available=overlay.getBoundingClientRect().height*.32;
 for(const item of overlay.querySelectorAll('.hero-vitals,.battle-panel')){
  if(!item.getClientRects().length)continue;
  const other=item.getBoundingClientRect();
  if(other.left<rect.right&&other.right>rect.left&&other.top>rect.top)available=Math.min(available,other.top-rect.top-8);
 }
 log.style.maxHeight=Math.max(1,available)+'px';
 const size=fittingFontSize(preferred,value=>{
  log.style.fontSize=value+'px';
  return log.scrollHeight<=log.clientHeight+1&&copy.scrollWidth<=copy.clientWidth+1;
 });
 log.style.fontSize=size+'px';
 return size;
}

// Observe the game surface, not the text box being resized by the fit itself.
export function watchBattleText(overlay,stage){
 const document=overlay.ownerDocument,view=document.defaultView;
 let active=true;
 const fit=()=>{if(active)fitBattleText(overlay);};
 const observer=view.ResizeObserver?new view.ResizeObserver(fit):null;
 observer?.observe(stage);view.addEventListener('resize',fit);
 document.fonts?.addEventListener('loadingdone',fit);document.fonts?.ready.then(fit);
 return ()=>{active=false;observer?.disconnect();view.removeEventListener('resize',fit);document.fonts?.removeEventListener('loadingdone',fit);};
}
