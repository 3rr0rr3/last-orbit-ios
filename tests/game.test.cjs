const assert=require('node:assert/strict');
const E=require('../web/engine.js');
let passed=0;
function test(name,fn){fn();passed++;console.log('PASS '+name);}
function flight(seed=123456789){const s=E.create(seed,0);for(const id of ['rations','air','tools','wire','filter','battery'])E.pack(s,id);E.launch(s);return s;}
const priority={derelict:['chart'],alien:['guide'],rescue:['relay'],echo:['record'],cargo:['drift'],leak:['patch','seal'],traveler:['welcome','trade','refuse'],guest:['open'],dinner:['jokes'],storm:['armor','dodge','ride'],market:['listen','trade'],garden:['harvest','course'],ghost:['boost','soft'],radiation:['shield','treat','expose'],argument:['vote'],blackbox:['decode','broadcast','rest'],signal:['beacon','caravan'],final:['all','coords']};
function decide(s){const ev=E.event(s),id=Object.keys(E.events).find(k=>E.events[k]===ev);return priority[id].find(id=>{const c=ev.choices.find(c=>c.id===id);return c&&E.canPay(s,c.cost);});}
test('same seed repeats crew, supplies, and story; different seeds vary them',()=>{
 const a=E.create(123456789,0),b=E.create(123456789,0);assert.deepEqual(a,b);
 const runs=Array.from({length:16},(_,i)=>E.create((i+1)*2654435761,0));
 assert(new Set(runs.map(s=>s.supplyOrder.join())).size>12);
 assert(new Set(runs.map(s=>s.crew.map(c=>c.id).join())).size>3);
 assert(new Set(runs.map(s=>s.startName)).size===4);
});
test('six unique supplies; illegal and repeated packing do not mutate resources',()=>{
 const s=E.create(1,0);assert(E.pack(s,'rations'));const before=JSON.stringify(s);
 assert.equal(E.pack(s,'rations'),false);assert.equal(E.pack(s,'not-an-item'),false);assert.equal(JSON.stringify(s),before);
 for(const id of ['air','tools','wire','filter','battery'])assert(E.pack(s,id));
 assert.equal(E.pack(s,'soup'),false);assert.equal(s.packed.length,6);
 E.launch(s);assert.equal(E.pack(s,'soup'),false);
});
test('timer pauses, serializes, and resumes without charging background time',()=>{
 const s=E.create(3,1000);E.tick(s,11000);assert.equal(s.remainingMs,50000);
 E.pause(s,21000);assert.equal(s.remainingMs,40000);E.tick(s,999999);assert.equal(s.remainingMs,40000);
 const loaded=E.load(E.serialize(s,999999));assert(loaded);E.resumeClock(loaded,2000000);
 E.tick(loaded,2039999);assert.equal(loaded.phase,'gather');E.tick(loaded,2040000);assert.equal(loaded.phase,'survive');assert.equal(loaded.day,1);
});
test('save preserves upgrades, expedition roll, route, relationships, and journal',()=>{
 const s=flight();E.craft(s,'garden');E.choose(s,'drift');E.expedition(s,'relay',s.crew[1].id,'tether');
 s.route='mystery';const loaded=E.load(E.serialize(s));assert(loaded);assert.deepEqual(loaded,s);assert.equal(loaded.expedition.roll,s.expedition.roll);
});
test('rejects malformed, old, nonfinite, duplicate-crew and unknown-content saves',()=>{
 assert.equal(E.load('garbage'),null);assert.equal(E.load('{"version":1}'),null);
 for(const modify of [s=>s.food=null,s=>s.crew[1].id=s.crew[0].id,s=>s.deck[0]='evil',s=>s.upgrades.evil=true,s=>s.flags.evil=true,s=>s.route='__proto__',s=>s.expedition={place:'void'},s=>s.day=99]){
 const s=flight();modify(s);assert.equal(E.load(JSON.stringify(s)),null);}
});
test('one crew task per day and unaffordable crafts leave state intact',()=>{
 const s=flight();assert(E.craft(s,'garden'));const parts=s.parts;
 assert.equal(E.craft(s,'recycler'),false);assert.equal(E.expedition(s,'wreck',s.crew[1].id),false);assert.equal(s.parts,parts);
 E.choose(s,'drift');assert(E.craft(s,'recycler'));assert.equal(E.craft(s,'garden'),false);
 E.choose(s,'patch');s.parts=0;assert.equal(E.craft(s,'antenna'),false);
});
test('garden, recycler, antenna, storage and patching affect survival',()=>{
 const s=flight();E.craft(s,'garden');const food=s.food;E.choose(s,'drift');assert.equal(s.food,food);
 E.craft(s,'recycler');const air=s.air;E.choose(s,'seal');assert.equal(s.air,air);
 s.acted=false;E.craft(s,'antenna');s.day=7;const signal=s.signal;E.choose(s,'broadcast');assert.equal(s.signal,signal+3);
 s.acted=false;s.parts=5;E.craft(s,'storage');assert(s.upgrades.storage);
 s.acted=false;s.hull=2;assert(E.craft(s,'repair'));assert.equal(s.hull,4);
});
test('expeditions remove a crew member, preserve risk across saves and return loot',()=>{
 const s=flight(),id=s.crew[1].id,parts=s.parts;assert(E.expedition(s,'wreck',id,'scanner'));
 assert.equal(E.active(s).length,2);assert(E.condition(s,s.crew[1]).startsWith('AWAY'));
 assert.equal(E.expedition(s,'moon',id),false);s.expedition.roll=.99;E.choose(s,'drift');
 assert.equal(s.expedition,null);assert.equal(E.active(s).length,3);
 assert.equal(s.parts,parts-1+3+1+(id==='juno'?1:0));
});
test('injuries, medical care, rest, and late or exhausted expeditions are enforced',()=>{
 const s=flight(),id=s.crew[1].id;E.expedition(s,'wreck',id,'none');s.expedition.roll=0;E.choose(s,'drift');
 assert.equal(s.crew[1].health,2);s.meds=1;assert(E.treat(s,id));assert.equal(s.crew[1].health,3);
 assert.equal(E.rest(s,id),false);s.acted=false;s.crew[1].stress=6;assert.equal(E.expedition(s,'wreck',id),false);assert(E.rest(s,id));assert.equal(s.crew[1].stress,3);
 s.acted=false;s.day=12;assert.equal(E.expedition(s,'moon',id),false);
});
test('stranger branch follows up next day and changes outcome with trust',()=>{
 for(const trust of [1,6]){const s=flight();s.day=3;s.deck[2]='traveler';s.trust=trust;E.choose(s,'welcome');assert.equal(E.event(s),E.events.guest);
 const air=s.air,food=s.food;E.choose(s,'open');assert(s.flags.guestDone);
 if(trust===1){assert.equal(s.air,air-4);assert(!s.flags.caravan);}else{assert(s.flags.caravan);assert.equal(s.food,food+3);}
 }
});
test('each of four ending requirements is checked after final daily costs',()=>{
 for(const route of ['home','colony','caravan','mystery']){
 const s=flight();s.day=12;s.route=route;s.signal=8;s.clues=2;s.flags={planet:true,caravan:true};s.upgrades={garden:true,antenna:true};s.trust=6;
 assert(E.choose(s,'coords'));assert.equal(s.outcome.id,route);assert.equal(s.outcome.won,true);assert(E.load(E.serialize(s)));
 }
 const s=flight();s.day=12;s.signal=0;E.choose(s,'coords');assert.equal(s.outcome.id,'adrift');
});
test('oxygen, hunger, and hull losses save and cannot advance again',()=>{
 for(const [key,value,decision,ending]of [['air',0,'drift','oxygen'],['food',0,'drift','hunger'],['hull',0,'drift','hull']]){
 const s=flight();s[key]=value;E.choose(s,decision);assert.equal(s.outcome.id,ending);assert(E.load(E.serialize(s)));assert.equal(E.choose(s,'drift'),false);
 }
});
test('32 real seeded home campaigns are winnable without editing resources',()=>{
 for(let seed=1;seed<=32;seed++){
 const s=flight(seed*2654435761);
 while(s.phase==='survive'){
 if(s.day===1)E.craft(s,'garden');if(s.day===2)E.craft(s,'recycler');if(s.day===3)E.craft(s,'antenna');
 assert(E.choose(s,decide(s)),'legal decision on day '+s.day);
 }
 assert.equal(s.outcome.id,'home','seed '+seed+': '+s.outcome.message);
 }
});

test('a rescued courier can join the crew with real daily supply costs',()=>{
 const s=flight();s.day=3;s.deck[2]='traveler';E.choose(s,'welcome');const food=s.food,air=s.air;
 assert(E.choose(s,'recruit'));assert.equal(s.crew.length,4);assert.equal(s.food,food-4);assert.equal(s.air,air-2);
 assert.equal(s.crew[3].id,'nix');assert(s.flags.caravan);assert(E.load(E.serialize(s)));
});
test('all four endings can be earned in full campaigns without changing resources',()=>{
 for(const route of ['home','colony','caravan','mystery']){
 const s=flight();E.setRoute(s,route);
 while(s.phase==='survive'){
 if(s.day===1)E.craft(s,'garden');if(s.day===2)E.craft(s,'recycler');if(s.day===3)E.craft(s,'antenna');
 if(route==='mystery'&&s.day>=4&&s.day<=10&&s.clues<2&&!s.expedition){
 const c=E.active(s).find(c=>c.health===3&&c.stress<5);if(c)E.expedition(s,'relay',c.id,'tether');
 }
 assert(E.choose(s,decide(s)));
 }
 assert.equal(s.outcome.id,route);
 }
});

test('daily reports include repairs, decisions, consumption and saved memories',()=>{
 const s=E.create(123456789,0);s.hull=3;E.pack(s,'tools');E.launch(s);const initial={food:s.food,air:s.air,parts:s.parts,hull:s.hull};
 E.craft(s,'repair');assert(s.crew.some(c=>c.activity==='work'));E.choose(s,'catch');
 for(const k of Object.keys(initial))assert.equal(s.report.changes[k],s[k]-initial[k]);
 assert(s.report.entries.some(e=>e.includes('Patch the hull')));assert.equal(s.report.day,1);assert.equal(s.conversations.length,2);assert(s.crew.some(c=>c.memory==='Catch the capsule'));
 assert(Object.values(s.bonds).some(n=>n>0));const loaded=E.load(E.serialize(s));assert(loaded);assert.deepEqual(loaded.report,s.report);assert.deepEqual(loaded.bonds,s.bonds);
 const c=E.active(s)[0];c.stress=3;const trust=c.trust;E.rest(s,c.id);assert.equal(c.activity,'sleep');assert.equal(c.trust,Math.min(8,trust+1));assert(c.memory.includes('rest'));
});
test('Relaxed difficulty is saved and supplies gentler survival rules',()=>{
 const a=E.create(91,0),b=E.create(91,0,{difficulty:'relaxed'});
 assert.equal(b.food,a.food+4);assert.equal(b.air,a.air+4);assert.equal(b.parts,a.parts+2);
 E.launch(b);b.deck[0]='radiation';E.choose(b,'expose');assert(b.crew.every(c=>c.health===3));assert.equal(E.load(E.serialize(b)).difficulty,'relaxed');
 const old=flight();for(const key of ['difficulty','report','conversations','bonds','dayStart'])delete old[key];assert(E.load(JSON.stringify(old)),'Existing v2 saves still load');
 for(const mutate of [s=>s.difficulty='unknown',s=>s.bonds={'mira:juno':999},s=>s.report={day:1,changes:{},entries:[]},s=>s.crew[0].activity='invalid']){const s=flight();mutate(s);assert.equal(E.load(JSON.stringify(s)),null);}
});
test('expanded encounters support complete deterministic campaigns on both difficulties',()=>{
 const seen=new Set();for(const difficulty of ['survival','relaxed'])for(let seed=1;seed<=64;seed++){
 const s=E.create(seed*1234567,0,{difficulty,variety:true}),copy=E.create(seed*1234567,0,{difficulty,variety:true});assert.deepEqual(s.deck,copy.deck);s.deck.forEach(id=>seen.add(id));
 for(const id of ['rations','air','tools','wire','filter','battery'])E.pack(s,id);E.launch(s);
 while(s.phase==='survive'){if(s.day===1)E.craft(s,'garden');if(s.day===2)E.craft(s,'recycler');if(s.day===3)E.craft(s,'antenna');assert(E.choose(s,decide(s)));assert(E.load(E.serialize(s)));}
 assert.equal(s.outcome.id,'home','Expanded campaign '+difficulty+' '+seed);
 }for(const id of ['derelict','alien','rescue','echo'])assert(seen.has(id));
});

console.log(passed+' simulation suites passed.');
module.exports={flight,decide};
