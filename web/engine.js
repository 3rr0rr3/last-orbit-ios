/* Deterministic rules shared by tests and the offline iPhone app. */
(function(root){
'use strict';
const data=typeof module!=='undefined'&&module.exports?require('./content.js'):root.OrbitData;
const {people,items,recipes,places,events}=data,VERSION=2,DAYS=12;
function random(s){let x=s.rng|0;x^=x<<13;x^=x>>>17;x^=x<<5;s.rng=x>>>0;return s.rng/4294967296;}
function shuffle(s,a){const out=a.slice();for(let i=out.length-1;i>0;i--){const j=Math.floor(random(s)*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
function create(seed=Date.now(),now=Date.now(),options={}){
 const s={version:VERSION,phase:'gather',seed:Number(seed)>>>0||1,rng:Number(seed)>>>0||1,day:0,food:6,air:7,parts:3,meds:0,hull:5,morale:5,trust:5,signal:0,clues:0,route:'home',flags:{},upgrades:{},packed:[],remainingMs:60000,deadline:now+60000,expedition:null,acted:false,log:[],outcome:null};
 s.difficulty=options.difficulty==='relaxed'?'relaxed':'survival';s.report=null;s.conversations=[];s.bonds={};
 if(s.difficulty==='relaxed'){s.food+=4;s.air+=4;s.parts+=2;}
 const variants=[{name:'A lucky pantry',food:2},{name:'Engineering deck',parts:2},{name:'Emergency air reserve',air:2},{name:'A bruised escape',parts:3,hull:-1}];
 const v=variants[Math.floor(random(s)*variants.length)];s.startName=v.name;
 for(const[k,n]of Object.entries(v))if(k!=='name')s[k]+=n;
 s.crew=['mira',...shuffle(s,['juno','bean','sol']).slice(0,2)].map(id=>({id,health:3,stress:0,trust:5}));
 s.supplyOrder=shuffle(s,items.map(i=>i.id));
 s.deck=['cargo','leak',...shuffle(s,['traveler','dinner','storm','market','garden','ghost','radiation','argument']).slice(0,4),'blackbox',...shuffle(s,['dinner','garden','ghost','market','argument']).slice(0,3),'signal','final'];
 if(options.variety){const extras=shuffle(s,['derelict','alien','rescue','echo']);s.deck[4]=extras[0];s.deck[8]=extras[1];}
 return s;
}
const active=s=>s.crew.filter(c=>c.health>0&&(!s.expedition||s.expedition.crew!==c.id));
const canPay=(s,cost)=>Object.entries(cost).every(([k,v])=>s[k]>=v);
function pay(s,cost){for(const[k,v]of Object.entries(cost))s[k]-=v;}
function clamp(s){const cap=s.upgrades.storage?28:18;for(const k of ['food','air','parts'])s[k]=Math.min(cap,s[k]);for(const k of ['morale','trust'])s[k]=Math.max(0,Math.min(8,s[k]));s.hull=Math.min(5,s.hull);}
function gain(s,values){for(const[k,v]of Object.entries(values))s[k]+=v;clamp(s);}
function log(s,message){s.log.unshift({day:s.day,message});s.log=s.log.slice(0,40);s.last=message;}
function pack(s,id){const item=items.find(i=>i.id===id);if(s.phase!=='gather'||!item||s.packed.includes(id)||s.packed.length>=6)return false;s.packed.push(id);gain(s,item.gain);if(item.flag)s.flags[item.flag]=true;return true;}
function pause(s,now=Date.now()){if(s.phase==='gather'&&s.deadline!==null){s.remainingMs=Math.max(0,s.deadline-now);s.deadline=null;}}
function resumeClock(s,now=Date.now()){if(s.phase==='gather'&&s.deadline===null)s.deadline=now+s.remainingMs;}
function tick(s,now=Date.now()){if(s.phase!=='gather'||s.deadline===null)return;s.remainingMs=Math.max(0,s.deadline-now);if(!s.remainingMs)launch(s);}
function launch(s){if(s.phase!=='gather')return false;s.phase='survive';s.day=1;s.deadline=null;s.remainingMs=0;s.dayStart={food:s.food,air:s.air,parts:s.parts,hull:s.hull,meds:s.meds};log(s,'The pod clears the station. Three heartbeats. One more chance.');return true;}
function event(s){return s.flags.guest&&!s.flags.guestDone?events.guest:events[s.deck[s.day-1]];}
const taskReady=s=>s.phase==='survive'&&!s.acted;
function craft(s,id){
 const r=Object.hasOwn(recipes,id)?recipes[id]:null;if(!r||!taskReady(s)||!canPay(s,r.cost)||(s.upgrades[id]&&!['repair','medkit'].includes(id))||(id==='repair'&&s.hull>=5)||!active(s).some(c=>c.health>=2&&c.stress<5))return false;
 pay(s,r.cost);if(id==='repair')gain(s,{hull:2});else if(id==='medkit')s.meds++;else{s.upgrades[id]=true;if(id==='garden'&&s.flags.seeds)gain(s,{food:2});}
 const worker=active(s).find(c=>c.id==='juno')||active(s)[0];if(worker)worker.activity='work';
 s.acted=true;log(s,r.name+' completed. One crew task used today.');return true;
}
function treat(s,id){const c=active(s).find(c=>c.id===id);if(!taskReady(s)||!c||(c.health>=3&&c.stress===0)||s.meds<1)return false;s.meds--;c.health=Math.min(3,c.health+1);c.stress=Math.max(0,c.stress-2);c.memory='The captain brought me medical care.';c.trust=Math.min(8,c.trust+1);s.acted=true;log(s,people[id].name+' received medical care.');return true;}
function rest(s,id){const c=active(s).find(c=>c.id===id);if(!taskReady(s)||!c||c.stress<1)return false;c.stress=Math.max(0,c.stress-3);c.activity='sleep';c.memory='The captain let me rest when I needed it.';c.trust=Math.min(8,c.trust+1);s.acted=true;gain(s,{morale:1});log(s,people[id].name+' rests. Sometimes surviving means slowing down.');return true;}
function expedition(s,placeId,crewId,gear='tether'){
 const p=places[placeId],c=active(s).find(c=>c.id===crewId),cost=p&&{air:p.air,parts:gear==='none'?0:1};
 if(!p||!c||c.health<3||c.stress>=5||!taskReady(s)||s.expedition||s.day+p.days>DAYS||!['none','tether','scanner'].includes(gear)||!canPay(s,cost))return false;
 pay(s,cost);s.expedition={place:placeId,crew:crewId,gear,returnDay:s.day+p.days,roll:random(s)};s.acted=true;c.stress=Math.min(6,c.stress+1);
 log(s,people[crewId].name+' left for '+p.name+'. Returns day '+s.expedition.returnDay+'.');return true;
}
function returnExpedition(s){
 const e=s.expedition;if(!e||s.day<e.returnDay)return;const p=places[e.place],c=s.crew.find(c=>c.id===e.crew),risk=Math.max(.05,p.risk-(e.gear==='tether'?.2:0));
 if(e.roll<risk){c.health=Math.max(1,c.health-1);gain(s,{parts:1,morale:-1});log(s,people[c.id].name+' limps home with one scrap. A medical charge can treat the injury.');}
 else{const haul={...p.gain};if(c.id==='juno')haul.parts=(haul.parts||0)+1;if(s.upgrades.storage)haul.food=(haul.food||0)+2;if(e.gear==='scanner')haul.parts=(haul.parts||0)+1;gain(s,haul);if(p.flag)s.flags[p.flag]=true;c.trust=Math.min(8,c.trust+1);log(s,people[c.id].name+' returns with supplies'+(p.gain.clues?' and evidence of a deliberate evacuation.':'.'));}
 s.expedition=null;
}
function condition(s,c){if(s.expedition&&s.expedition.crew===c.id)return'AWAY · DAY '+s.expedition.returnDay;if(c.health<3)return'INJURED';if(s.food<=2)return'HUNGRY';if(c.stress>=4)return'EXHAUSTED';if(s.air<=2)return'GASPING';return c.trust<=2?'DISTRUSTFUL':'HOLDING ON';}
function routeInfo(s){return{
 home:{name:'The way home',text:'Rescue lane · 8 signal',ready:s.signal>=8},
 colony:{name:'A new little world',text:'Moon map + garden + 3 rations + 3 oxygen',ready:!!(s.flags.planet&&s.upgrades.garden&&s.food>=3&&s.air>=3)},
 caravan:{name:'Among the wanderers',text:'Caravan contact + 6 crew trust',ready:!!s.flags.caravan&&s.trust>=6},
 mystery:{name:'The truth survives',text:'2 evidence + antenna + 6 signal',ready:s.clues>=2&&!!s.upgrades.antenna&&s.signal>=6}
};}
function setRoute(s,id){if(s.phase!=='survive'||!Object.hasOwn(routeInfo(s),id))return false;s.route=id;return true;}
function finish(s,id,message,won=false){s.phase='end';s.outcome={id,won,message,survivors:s.crew.length};for(const k of ['food','air','parts','hull'])s[k]=Math.max(0,s[k]);log(s,message);}
function choose(s,id){
 if(s.phase!=='survive')return false;const ev=event(s),ch=ev.choices.find(c=>c.id===id);if(!ch||!canPay(s,ch.cost)||(ch.requireTrust&&s.trust<ch.requireTrust))return false;
 const before=s.dayStart||{food:s.food,air:s.air,parts:s.parts,hull:s.hull,meds:s.meds},finishedDay=s.day;
 for(const c of s.crew)delete c.activity;
 pay(s,ch.cost);const delta={...ch.gain};if(delta.signal>0&&s.upgrades.antenna)delta.signal++;gain(s,delta);if(ch.flag)s.flags[ch.flag]=true;
 for(const c of active(s)){c.stress=Math.max(0,Math.min(6,c.stress+(ch.stress||0)));if(delta.trust)c.trust=Math.max(0,Math.min(8,c.trust+delta.trust+(c.id===ch.actor?1:0)));}
 log(s,ch.result||ch.label+'. The crew makes it through another decision.');
 if(ch.special==='guest'){s.flags.guestDone=true;if(s.trust>=5){gain(s,{food:4,parts:2,trust:1});log(s,'The courier shares the crate and a convoy frequency. Kindness paid off.');s.flags.caravan=true;}else{s.air-=3;log(s,'Distrust turns to theft. The courier escapes with three oxygen.');}}
 if(ch.special==='recruit'){s.crew.push({id:'nix',health:3,stress:0,trust:s.trust});s.flags.caravan=true;log(s,'Nix joins the crew. Four mouths now use 2 rations and 2 oxygen daily.');}
 if(ch.special==='injury'&&s.difficulty!=='relaxed')for(const c of active(s))c.health=Math.max(1,c.health-1);
 const daily=s.difficulty==='relaxed'?1:s.crew.length>3?2:1;s.food-=daily;s.air-=s.upgrades.recycler&&s.day%2===0?0:daily;if(s.upgrades.garden)s.food++;
 if(s.upgrades.garden&&active(s).some(c=>c.id==='sol')&&s.day%3===0)s.food++;
 if(active(s).some(c=>c.id==='bean'))gain(s,{morale:1});
 for(const c of active(s)){if(c.id==='mira'&&s.air<=2)c.stress=Math.min(6,c.stress+1);if(s.morale<=2)c.stress=Math.min(6,c.stress+1);}
 if(s.trust<=2)gain(s,{morale:-1});
 if(s.food<0)finish(s,'hunger','The pantry is empty. The little pod falls silent.');
 else if(s.air<0)finish(s,'oxygen','The final oxygen alarm fades into the dark.');
 else if(s.hull<=0)finish(s,'hull','The patched walls cannot withstand another impact.');
 else if(s.day===DAYS){
  const r=routeInfo(s)[s.route],ends={home:'A docking clamp. A familiar voice. You found your way home.',colony:'Purple soil. A first seedling. A tiny crew builds a new home.',caravan:'The caravan opens its airlock. Home is the people who kept you alive.',mystery:'The archive proves the station was evacuated to hide an experiment. Your crew broadcasts the evidence and reaches the rescue ship.'};
  if(r.ready)finish(s,s.route,ends[s.route],true);else finish(s,'adrift','Your chosen course was not ready. The last rescue lights slip beyond the horizon.');
 }else{s.day++;s.acted=false;returnExpedition(s);}
 clamp(s);
 const speaker=active(s)[finishedDay%active(s).length];
 if(speaker){speaker.memory=ch.label;speaker.trust=Math.max(0,Math.min(8,speaker.trust+(delta.trust?Math.sign(delta.trust):0)));}
 s.bonds??={};const together=active(s);if(together.length>1){const key=together.slice(0,2).map(c=>c.id).sort().join(':');s.bonds[key]=Math.max(-3,Math.min(3,(s.bonds[key]||0)+(delta.trust<0?-1:delta.trust>0?1:0)));}
 s.conversations=active(s).slice(0,2).map((c,i)=>({id:c.id,text:i===0?(delta.trust<0?'I will remember that order. We need to listen to each other.':delta.trust>0?'You listened. That makes this pod feel like home.':s.air<=2?'The air feels thin. Please check the recycler.':s.hull<3?'Every creak makes me jump. Can we patch the walls?':'Another day together. I am glad you are still here.'):(s.trust>=6?'We make a good team, '+people[active(s)[0].id].name+'. I will watch your back.':s.trust<=2?'We cannot keep arguing like this.':'Let us take the next watch together.')}));
 s.report={day:finishedDay,changes:Object.fromEntries(Object.keys(before).map(k=>[k,s[k]-before[k]])),entries:s.log.filter(e=>e.day===finishedDay||e.day===s.day).slice(0,5).map(e=>e.message)};
 s.dayStart={food:s.food,air:s.air,parts:s.parts,hull:s.hull,meds:s.meds};
 return true;
}
function serialize(s,now=Date.now()){const copy=JSON.parse(JSON.stringify(s));pause(copy,now);return JSON.stringify(copy);}
function load(text){
 try{
  const s=JSON.parse(text);
  if(!s||s.version!==VERSION||!['gather','survive','end'].includes(s.phase)||!Number.isInteger(s.day)||s.day<0||s.day>DAYS||(s.phase!=='gather'&&s.day<1))return null;
  for(const k of ['food','air','parts','meds','hull','morale','trust','signal','clues','rng','seed','remainingMs'])if(!Number.isFinite(s[k])||s[k]<0||s[k]>(['rng','seed'].includes(k)?4294967295:k==='remainingMs'?60000:10000))return null;
  if(!Array.isArray(s.crew)||(s.crew.length<3||s.crew.length>4)||new Set(s.crew.map(c=>c.id)).size!==s.crew.length||s.crew.some(c=>!Object.hasOwn(people,c.id)||![c.health,c.stress,c.trust].every(Number.isFinite)||c.health<1||c.health>3||c.stress<0||c.stress>6||c.trust<0||c.trust>8))return null;
  if(!Array.isArray(s.deck)||s.deck.length!==DAYS||s.deck.some(id=>!Object.hasOwn(events,id))||!Array.isArray(s.supplyOrder)||s.supplyOrder.length!==9||new Set(s.supplyOrder).size!==9||s.supplyOrder.some(id=>!items.some(i=>i.id===id))||!Array.isArray(s.packed)||s.packed.length>6||new Set(s.packed).size!==s.packed.length||s.packed.some(id=>!items.some(i=>i.id===id)))return null;
  if(!s.flags||typeof s.flags!=='object'||Array.isArray(s.flags)||!s.upgrades||typeof s.upgrades!=='object'||Array.isArray(s.upgrades)||!Object.hasOwn(routeInfo(s),s.route)||!Array.isArray(s.log)||s.log.length>40||s.log.some(e=>typeof e.message!=='string'||!Number.isInteger(e.day))||typeof s.acted!=='boolean')return null;
  if(Object.keys(s.flags).some(k=>!['seeds','guest','guestDone','caravan','planet','archive'].includes(k)||typeof s.flags[k]!=='boolean')||Object.keys(s.upgrades).some(k=>!['recycler','garden','antenna','storage'].includes(k)||s.upgrades[k]!==true))return null;
  if(s.expedition&&(!Object.hasOwn(places,s.expedition.place)||!s.crew.some(c=>c.id===s.expedition.crew)||!['none','tether','scanner'].includes(s.expedition.gear)||!Number.isInteger(s.expedition.returnDay)||s.expedition.returnDay<=s.day||s.expedition.returnDay>DAYS||!Number.isFinite(s.expedition.roll)||s.expedition.roll<0||s.expedition.roll>=1))return null;
  if(s.phase==='end'&&(!s.outcome||typeof s.outcome.message!=='string'||typeof s.outcome.won!=='boolean'||!['home','colony','caravan','mystery','hunger','oxygen','hull','adrift'].includes(s.outcome.id)))return null;
  if(s.bonds!==undefined&&(!s.bonds||typeof s.bonds!=='object'||Array.isArray(s.bonds)||Object.entries(s.bonds).some(([k,v])=>k.split(':').length!==2||k.split(':')[0]===k.split(':')[1]||k.split(':').some(id=>!Object.hasOwn(people,id))||!Number.isInteger(v)||v< -3||v>3)))return null;
  if(s.dayStart!==undefined&&(!s.dayStart||!['food','air','parts','hull'].every(k=>Number.isFinite(s.dayStart[k])&&s.dayStart[k]>=0&&s.dayStart[k]<=10000)))return null;
  if(s.crew.some(c=>c.activity!==undefined&&!['work','sleep'].includes(c.activity)))return null;
  if(s.difficulty!==undefined&&!['relaxed','survival'].includes(s.difficulty))return null;
  if(s.conversations!==undefined&&(!Array.isArray(s.conversations)||s.conversations.length>4||s.conversations.some(c=>!Object.hasOwn(people,c.id)||typeof c.text!=='string'||c.text.length>500)))return null;
  if(s.report!==undefined&&s.report!==null&&(!Number.isInteger(s.report.day)||!s.report.changes||!['food','air','parts','hull'].every(k=>Number.isFinite(s.report.changes[k]))||!Array.isArray(s.report.entries)||s.report.entries.length>5||s.report.entries.some(e=>typeof e!=='string')))return null;
  if(s.crew.some(c=>c.memory!==undefined&&(typeof c.memory!=='string'||c.memory.length>250)))return null;
  s.deadline=null;return s;
 }catch{return null;}
}
const api={...data,VERSION,DAYS,create,random,pack,pause,resumeClock,tick,launch,event,active,canPay,craft,treat,rest,expedition,condition,routeInfo,setRoute,choose,serialize,load};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OrbitEngine=api;
})(typeof window!=='undefined'?window:globalThis);
