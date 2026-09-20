// Keep legacy argus identifiers in saves and code; only the public identity changes.
export const SECURITY_DESIGNATION='Security Combat Response Autonomous Pursuer';
export const SCRAP_NAME='S.C.R.A.P.';
export const MISSILE_TAUNT="How can a simple human be so difficult to defeat? Heh, no matter. Nothin' Personal, kid.";
export const SCRAP_FAREWELL=[
 'Now I understand why Cenexis wants to capture you so badly. That resonance is more than a classification.',
 'I commend you. An impressive performance... despite being an inefficient human.',
 'Do not mistake a tactical withdrawal for surrender. I will see you again.'
];
export const scrapNamed=s=>!!(s?.flags?.CH2_SCRAP_NAMED||s?.flags?.CH2_ARGUS_PENDING||s?.flags?.CH2_ARGUS_DEFEATED);
export const securityName=s=>scrapNamed(s)?SCRAP_NAME:SECURITY_DESIGNATION;
export const securitySpeaker=s=>scrapNamed(s)?SCRAP_NAME:'[Classified]';
export const securityText=(text,s)=>String(text).replaceAll('A.R.G.U.S.',securityName(s)).replaceAll(SECURITY_DESIGNATION,securityName(s)).replaceAll('S.C.R.A.P..','S.C.R.A.P.');
export function migrateSecurityIdentity(s){
 if(!s)return s;
 const flags={...s.flags};
 if(scrapNamed(s))flags.CH2_SCRAP_NAMED=true;
 return {...s,flags,notes:(s.notes||[]).map(note=>securityText(note,{flags}))};
}
