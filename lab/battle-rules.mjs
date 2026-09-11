export function createBattle(){return {phase:'command',turn:1,hp:110,targetHp:110,maxHp:110,enemyHp:180,enemyMaxHp:180,snacks:3,guarding:false,charged:false,message:'Biological variance confirmed. Subject retrieval authorized.',lastAction:null};}
export function rollHealth(state,deltaSeconds){if(!Number.isFinite(deltaSeconds)||deltaSeconds<=0)return;state.hp=Math.max(state.targetHp,state.hp-Math.min(deltaSeconds,.1)*24);if(state.hp<=0&&state.phase!=='victory'){state.phase='defeat';state.message='Your knees give way. There is still time to try again.';}}
export function playerAction(state,action){if(state.phase!=='command')return {ok:false};if(!['attack','guard','snack'].includes(action))return {ok:false};if(action==='snack'&&(!state.snacks||state.hp>=state.maxHp&&state.targetHp>=state.maxHp))return {ok:false,message:state.snacks?'Your HP is already full.':'No sandwiches left.'};
 state.lastAction=action;state.guarding=action==='guard';state.phase='resolving';
 if(action==='attack'){const damage=state.charged?35:31;state.enemyHp=Math.max(0,state.enemyHp-damage);state.message='Your vibrosword strikes its chassis. '+damage+' damage!';}
 if(action==='guard')state.message='You brace behind the vibrosword. Incoming damage will be reduced.';
 if(action==='snack'){state.snacks--;state.targetHp=Math.min(state.maxHp,state.targetHp+58);state.hp=Math.min(state.maxHp,Math.max(state.hp,state.targetHp));state.message='You eat a pocket sandwich. 58 HP recovered.';}
 if(state.enemyHp===0){state.phase='victory';state.targetHp=state.hp;state.message='The courier shuts down. Whatever this was, it was not a normal collection.';}
 return {ok:true};
}
export function enemyAction(state){if(state.phase!=='resolving')return {ok:false};let damage=0;
 if(state.charged){damage=38;state.charged=false;state.message='The courier releases a charged restraint pulse!';}
 else if(state.turn%3===0){state.charged=true;state.message='Its capacitor starts to whine. A powerful pulse is coming. Guard!';}
 else {damage=state.turn%2===0?18:15;state.message=state.turn%2===0?'A gripping arm snaps toward you.':'The courier drives a plated shoulder into you.';}
 if(state.guarding)damage=Math.ceil(damage*.3);
 state.targetHp=Math.max(0,state.targetHp-damage);if(damage)state.message+=' '+damage+' damage.';
 state.turn++;state.guarding=false;state.phase='command';return {ok:true,damage};
}
