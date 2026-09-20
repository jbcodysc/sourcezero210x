// Reuse the supplied panel's first frame. The original PNG is unmodified;
// clipping and two opaque text wells replace its example labels at render time.
export const ARGUS_PANEL_IMAGE=new URL('../fairmont/assets/argus-panel-reference.png',import.meta.url).href;
const escape=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const isArgusLine=line=>line?.presentation==='argus'||['[Classified]','S.C.R.A.P.'].includes(line?.speaker);
const DESIGNATION='SECURITY COMBAT RESPONSE AUTONOMOUS PURSUER';
export function argusTypingStyle(line){const start=line.emphasizeDesignation?line.text.toUpperCase().indexOf(DESIGNATION):-1;return start<0?null:{designationStart:start,slowRanges:[{start,end:start+DESIGNATION.length,rate:14}]};}
export function argusTextMarkup(text,designationStart=-1){
 if(designationStart>=0&&text.length>designationStart){const end=designationStart+DESIGNATION.length;return argusTextMarkup(text.slice(0,designationStart))+'<em class="argus-designation">'+escape(text.slice(designationStart,end))+'</em>'+argusTextMarkup(text.slice(end));}
 return String(text).split(/\b(RESONANCE|GREAT PROMISE|SUPERIOR|CLASSIFIED|RESTRICTED|HUMANS|EMPLOYEES|MANUFACTURED|ABILITIES|ARTIFICIAL INTELLIGENCE|AI)\b/g).map(part=>{
  const color=/^(CLASSIFIED|RESTRICTED|HUMANS|EMPLOYEES)$/.test(part)?'gold':/^(RESONANCE|GREAT PROMISE|SUPERIOR|MANUFACTURED|ABILITIES|ARTIFICIAL INTELLIGENCE|AI)$/.test(part)?'cyan':null;
  return color?'<span class="argus-'+color+'">'+escape(part)+'</span>':escape(part);
 }).join('');
}
export function argusPanelMarkup(line){
 const text=line.text.toUpperCase(),style=argusTypingStyle(line);
 return '<section class="dialog-box dialog-argus" aria-label="Security transmission">'+
  '<svg class="argus-frame" viewBox="95 80 1280 285" preserveAspectRatio="none" aria-hidden="true">'+
  '<defs><clipPath id="argus-frame-edge"><path d="M180 119 L200 90 L615 90 L668 125 L1150 124 Q1250 54 1310 131 Q1340 152 1325 205 Q1380 230 1341 306 L1287 347 L230 351 L189 319 Q113 347 134 258 Q82 204 128 153 Z"/></clipPath></defs>'+
  '<g clip-path="url(#argus-frame-edge)"><image href="'+escape(ARGUS_PANEL_IMAGE)+'" x="0" y="0" width="1448" height="1086"/>'+
  '<path fill="#0c151b" d="M318 104 H614 L625 117 V139 L614 148 H318 Z"/>'+
  '<path fill="#0c151b" d="M236 178 H1206 L1242 207 V265 L1180 305 H236 Z"/></g></svg>'+
  '<div class="argus-heading"><span class="dialog-speaker">'+escape(line.speaker||'[Classified]')+'</span></div>'+
  '<p class="typed-copy"><span class="type-reserve" aria-hidden="true">'+argusTextMarkup(text,style?.designationStart)+'</span><span class="type-visible" data-typing aria-hidden="true"></span><span class="sr-only">'+escape(line.text)+'</span></p>'+
  '<button data-action="dialogue-next" aria-label="Continue security transmission"><span aria-hidden="true">▾</span></button></section>';
}
