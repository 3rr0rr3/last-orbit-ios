/* Original scenarios and inventory for Last Orbit. */
(function(root){
'use strict';
const people={
 nix:{name:'Nix',role:'Courier',trait:'A new friend. Four crew use 2 rations and 2 oxygen daily.',hair:'#e1d8ec',skin:'#e7bdac',style:'crop'},
 mira:{name:'Mira',role:'Commander',trait:'Protective. Low oxygen raises her stress.',hair:'#8b4cba',skin:'#e7d2d9',style:'bob'},
 juno:{name:'Juno',role:'Engineer',trait:'Reckless. Brings extra scrap home from expeditions.',hair:'#4ba9ad',skin:'#bb806b',style:'spikes'},
 bean:{name:'Bean',role:'Little android',trait:'Optimistic. Restores one morale each dawn.',hair:'#ded5b8',skin:'#ded5b8',style:'robot'},
 sol:{name:'Sol',role:'Botanist',trait:'Patient. Grows an extra ration every third day.',hair:'#543b59',skin:'#ce967d',style:'hat'}
};
const items=[
 {id:'rations',name:'RATION BOX',gain:{food:6}},{id:'air',name:'O2 CANISTER',gain:{air:6}},
 {id:'tools',name:'REPAIR KIT',gain:{parts:4}},{id:'soup',name:'SPACE SOUP',gain:{food:5}},
 {id:'filter',name:'AIR RESERVE',gain:{air:5}},{id:'wire',name:'SPARE WIRES',gain:{parts:4}},
 {id:'seeds',name:'SEED BANK',gain:{food:2},flag:'seeds'},{id:'meds',name:'MEDICAL BAG',gain:{meds:2}},
 {id:'battery',name:'BEACON CELL',gain:{parts:3,signal:1}}
];
const recipes={
 recycler:{name:'Air recycler',cost:{parts:3},text:'No oxygen cost on even days.'},
 garden:{name:'Hydroponic garden',cost:{parts:3},text:'Grows 1 ration every dawn. Sol grows more.'},
 antenna:{name:'Long-range antenna',cost:{parts:3},text:'+1 signal whenever a decision earns signal.'},
 storage:{name:'Cargo rack',cost:{parts:2},text:'Storage 18 → 28. Expeditions bring +2 rations.'},
 repair:{name:'Patch the hull',cost:{parts:1},text:'Restore 2 hull, up to 5.'},
 medkit:{name:'Craft a medkit',cost:{parts:2},text:'Make 1 medical charge for treating injuries.'}
};
const places={
 wreck:{name:'Drifting freighter',days:1,air:1,risk:.25,gain:{food:2,parts:3},text:'A short salvage trip. Supplies and scrap.'},
 moon:{name:'Garden moon',days:2,air:2,risk:.35,gain:{food:6,parts:1},flag:'planet',text:'Find food and a possible new home.'},
 relay:{name:'Silent research relay',days:2,air:2,risk:.35,gain:{signal:3,parts:2,clues:1},text:'Recover transmissions about the station.'}
};
const c=(id,label,cost={},gain={},extra={})=>({id,label,cost,gain,...extra});
const events={
 cargo:{title:'A knock in the void.',text:'A cargo capsule brushes the window. Catching it means a short spacewalk. Mira would rather keep everyone inside.',choices:[
 c('catch','Catch the capsule',{air:2},{food:4,trust:1},{stress:1,result:'Supplies secured. Mira checks the tether twice.'}),
 c('drift','Let it drift',{}, {morale:1},{result:'Everyone stays safe. The capsule disappears into violet dust.'})]},
 leak:{title:'Something is hissing.',text:'A silver thread of frost crawls along a pipe. There is time to fix it, or seal off part of the cabin.',choices:[
 c('patch','Patch the pipe',{parts:1},{air:3,trust:1}),c('seal','Seal the cabin',{}, {hull:-1},{result:'The leak stops. Living space is now a generous cupboard.'})]},
 traveler:{title:'A stranger at the airlock.',text:'A stranded courier offers a sealed crate for shelter. Welcoming them builds trust, but the crate is not on any manifest.',choices:[
 c('welcome','Offer shelter',{food:1},{trust:2},{flag:'guest',result:'The courier stays overnight. Tomorrow will reveal what is in that crate.'}),
 c('trade','Trade through the airlock',{air:1},{food:3,parts:1}),c('refuse','Keep the airlock closed',{}, {trust:-1})]},
 guest:{title:'The crate opens.',text:'The courier reaches for the crate. The mood in the cabin matters more than the lock.',choices:[
 c('open','Open it together',{}, {},{special:'guest'}),c('recruit','Invite courier aboard',{food:2},{morale:1},{special:'recruit',flag:'guestDone',requireTrust:5}),c('escort','Escort the courier out',{}, {trust:-1,signal:1},{flag:'guestDone'})]},
 dinner:{title:'Dinner for three?',text:'Equal portions or an extra meal for the next spacewalker? The argument is becoming less about dinner and more about being heard.',choices:[
 c('share','Share a proper meal',{food:2},{morale:2,trust:2},{stress:-1}),c('jokes','Tell terrible jokes',{}, {morale:1}),
 c('favor','Reward the risk taker',{food:1},{parts:2,trust:-2},{actor:'juno'})]},
 storm:{title:'Meteor shower. No wishes.',text:'The stars are moving. Unfortunately, the moving ones are rocks. Your crew braces for impact.',choices:[
 c('armor','Reinforce the hull',{parts:1},{hull:1}),c('dodge','Spend oxygen on thrusters',{air:2},{signal:1}),
 c('ride','Ride it out',{}, {hull:-2,morale:-1},{stress:1})]},
 market:{title:'A wandering caravan.',text:'A convoy offers oxygen, stories, and a place among its stars. They remember captains who treat people fairly.',choices:[
 c('trade','Trade a hot meal',{food:2},{air:5,trust:1},{flag:'caravan'}),c('listen','Exchange frequencies',{}, {signal:1,trust:1},{flag:'caravan'})]},
 garden:{title:'The purple greenhouse.',text:'A garden ship contains seed trays and old maps to a habitable moon. This could be the beginning of a different kind of home.',choices:[
 c('harvest','Harvest and copy the map',{air:2},{food:5},{flag:'planet'}),c('seeds','Take seeds instead',{parts:1},{food:2},{flag:'seeds'}),
 c('course','Stay on course',{}, {signal:1})]},
 ghost:{title:'A voice through static.',text:'A buoy answers in a voice from home. An antenna can carry your answer further, if you have built one.',choices:[
 c('boost','Boost the transmission',{parts:1},{signal:2,morale:1}),c('soft','Transmit softly',{}, {signal:1})]},
 radiation:{title:'The lights turn violet.',text:'A radiation squall passes over the pod. The medical bag is small. Your responsibility is not.',choices:[
 c('shield','Rig a shield',{parts:1},{trust:1}),c('treat','Use a medical charge',{meds:1},{morale:1}),
 c('expose','Shelter under the bunks',{}, {morale:-1},{special:'injury',stress:1})]},
 argument:{title:'Who gets to decide?',text:'Mira wants the rescue lane. The others want a detour. Give everyone a voice, or push the crew harder for more salvage.',choices:[
 c('vote','Let the crew vote',{}, {trust:2},{stress:-1}),c('order','Order everyone back to work',{}, {parts:2,trust:-2},{stress:1})]},
 blackbox:{title:'The station speaks.',text:'An encrypted black box repeats a warning: the evacuation alarm was sent before the reactor failed. Someone knew.',choices:[
 c('decode','Decode the black box',{parts:1},{clues:1,signal:1},{flag:'archive'}),c('broadcast','Broadcast the warning',{}, {signal:2}),
 c('rest','Let the crew rest',{}, {morale:2},{stress:-1})]},
 signal:{title:'A light on the horizon.',text:'A rescue pilot and a caravan captain both answer. There is more than one way to find home. Check your course before tomorrow.',choices:[
 c('beacon','Fire a beacon',{parts:1},{signal:3}),c('caravan','Answer the caravan',{}, {signal:1,trust:1},{flag:'caravan'})]},
 final:{title:'The final orbit.',text:'The searchlight sweeps the dark. Finish your preparations, choose your course, and make one final transmission.',choices:[
 c('all','Broadcast everything',{air:1},{signal:2}),c('coords','Send coordinates',{}, {signal:1})]}
};
const data={people,items,recipes,places,events};
if(typeof module!=='undefined'&&module.exports)module.exports=data;else root.OrbitData=data;
})(typeof window!=='undefined'?window:globalThis);
