export const RESERVED_NAMES=new Set('ness ninten sans cloud lucas'.split(' '));
// Match whole names/tokens and explicitly listed compounds, never arbitrary
// substrings: Cassandra, Dickinson, Scunthorpe and silly names stay welcome.
export const BANNED_NAMES=new Set(`
 fuck fucking fucker fuckers fuckface fuckhead fuckboy fuckoff fuckyou motherfucker motherfucking
 shit shits shitty bullshit shithead shitlord eatshit bitch bitches bitchy cunt cunts asshole assholes ass
 bastard bastards damn dammit goddamn goddammit hell crap piss pissed pissoff dumbass jackass twat wank wanker jerkoff
 sex sexy sexual porn porno pornography pornstar horny orgasm orgasms cum cumming semen sperm penis vagina
 dick dicks cock cocks pussy pussies dildo dildos anal anus blowjob handjob rimjob fellatio cunnilingus
 masturbate masturbation incest sexting tits titties boobs
 kill killer killers killing murder murderer murderers murdering massacre genocide terrorist terrorists terrorism
 torture torturer rape rapist rapists assassin assassination stab stabbing decapitate decapitation
 serialkiller massmurderer suicidebomber killyourself killpeople killall fck fuk fcuk sht shyt
`.trim().split(/\s+/));
export function validateName(raw){
 const folded=String(raw??'').normalize('NFKD').replace(/[\p{M}\p{Cf}]/gu,'').toLowerCase();
 const leet=one=>folded.replace(/[01345789@$!+|]/g,c=>({'0':'o','1':one,'3':'e','4':'a','5':'s','7':'t','8':'b','9':'g','@':'a','$':'s','!':'i','+':'t','|':one}[c]));
 const whole=[],candidates=new Set();
 for(const form of [folded,leet('i'),leet('l')]){
  const tokens=form.match(/[a-z0-9]+/g)||[];whole.push(tokens.join(''));let run='';
  const finishRun=()=>{if(run.length>=3)candidates.add(run);run='';};
  for(const token of tokens){candidates.add(token);candidates.add(token.replace(/^[x0-9]+|[x0-9]+$/g,''));if(/^[a-z]$/.test(token))run+=token;else finishRun();}
  finishRun();candidates.add(tokens.join(''));
 }
 if([...candidates].some(n=>BANNED_NAMES.has(n)))return {ok:false,message:'haha, no.'};
 if(whole.some(n=>RESERVED_NAMES.has(n)))return {ok:false,message:'Wrong game'};
 return {ok:true,message:null};
}
