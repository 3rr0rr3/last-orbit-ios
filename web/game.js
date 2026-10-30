/* UI, local autosave, sound, and lifecycle handling. */
(function(){
'use strict';
const E=window.OrbitEngine,$=s=>document.querySelector(s),KEY='last-orbit-save-v2',META='last-orbit-endings-v2';
let state=null,tab='log',saveError='',saved=null,replacePrompt=false,sound=false,audioCtx,lastSecond=-1;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const names={food:'rations',air:'oxygen',parts:'scrap',meds:'medical',hull:'hull',morale:'morale',trust:'trust',signal:'signal',clues:'evidence'};
function readSave(){try{const text=localStorage.getItem(KEY);saved=text?E.load(text):null;if(text&&!saved)saveError='Old or damaged save could not be loaded. You can start a new run.';}catch{saveError='Saving is unavailable. Keep the game open.';}return saved;}
function save(){if(!state)return;try{localStorage.setItem(KEY,E.serialize(state));saved=E.load(localStorage.getItem(KEY));saveError='';}catch{saveError='Autosave failed. Keep the game open to preserve this run.';}saveBadge();}
function endings(){try{const a=JSON.parse(localStorage.getItem(META)||'[]');return Array.isArray(a)?a.filter(x=>['home','colony','caravan','mystery'].includes(x)):[];}catch{return[];}}
function recordEnding(){if(!state.outcome?.won)return;try{localStorage.setItem(META,JSON.stringify([...new Set([...endings(),state.outcome.id]) ]));}catch{saveError='Ending collection could not be saved.';}}
function saveBadge(){$('#save-status').textContent=saveError||(!state?'OFFLINE · AUTOSAVE READY':'AUTOSAVED · DAY '+state.day);$('#save-status').classList.toggle('warning',!!saveError);}
function beep(f=440){if(!sound)return;try{audioCtx??=new(window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='square';o.frequency.value=f;g.gain.setValueAtTime(.02,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+.1);o.connect(g).connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+.1);}catch{}}
$('#sound').onclick=()=>{sound=!sound;$('#sound').textContent=sound?'SOUND ON':'SOUND OFF';beep();};
function button(parent,label,fn,opt={}){
 const b=document.createElement('button');b.type='button';b.className=opt.primary?'primary':'choice';b.disabled=!!opt.disabled;b.textContent=label;
 if(opt.id)b.dataset[opt.kind||'action']=opt.id;
 if(opt.detail){const sm=document.createElement('small');sm.textContent=opt.detail;b.append(sm);}
 b.onclick=()=>{beep();fn();};parent.append(b);return b;
}
function focusPanel(){if(innerWidth<761)$('#panel').scrollIntoView({block:'start'});}
function commit(fn){if(!state)return;if(fn()===false){saveError='That action is not available. Check supplies and today’s crew task.';saveBadge();return;}save();if(state.phase==='end')recordEnding();render();focusPanel();}
function resources(){return'<div class="resources">'+['food','air','parts'].map(k=>'<div class="'+(state[k]<=2?'low':'')+'"><b>'+state[k]+'</b>'+names[k].toUpperCase()+'</div>').join('')+'</div>';}
function changeText(values,negative=false){return Object.entries(values).map(([k,v])=>(negative?'−':v<0?'−':'+')+Math.abs(v)+' '+names[k]).join(' · ');}
function portraits(){
 const holder=$('#crew-strip');holder.innerHTML='';holder.classList.toggle('four',!!state&&state.crew.length===4);
 const list=state?state.crew:[{id:'mira',health:3,stress:0,trust:5},{id:'juno',health:3,stress:0,trust:5},{id:'bean',health:3,stress:0,trust:5}];
 for(const c of list){const p=E.people[c.id],condition=state?E.condition(state,c):'READY';const card=document.createElement('div');card.className='crew-mini';
 const canvas=document.createElement('canvas');canvas.width=50;canvas.height=92;canvas.setAttribute('aria-label',p.name+' pixel portrait');canvas.className='portrait';card.append(canvas);
 const text=document.createElement('span');text.innerHTML=esc(p.name.toUpperCase())+'<small>'+esc(p.role.toUpperCase())+'</small><em>'+esc(condition)+'</em>';card.append(text);holder.append(card);window.OrbitArt.portrait(canvas,c.id,condition);}
}
function intro(){
 $('#chapter').textContent='MISSION BRIEFING';$('#day').textContent='00 / 12';$('#phase').textContent='AWAITING LAUNCH';
 const count=endings().length;
 $('#content').innerHTML=replacePrompt?'<h2>Start a new orbit?</h2><p class="copy">This replaces the saved run. Your discovered endings stay in your collection.</p>':'<p class="eyebrow">THE NEXT CHAPTER / V2</p><h2>A little crew.<br><span>A much bigger story.</span></h2><p class="copy">Pack in 60 seconds. Keep three survivors alive for 12 days. Explore wrecks, build a better pod, and choose what home means.</p><div class="brief">One optional crew task each day.<br>Then make your daily decision.<br>Four endings. Every orbit is different.</div><p class="collection">ENDINGS FOUND '+count+' / 4</p>';
 const a=$('#actions');a.innerHTML='';
 if(replacePrompt){button(a,'KEEP MY SAVED RUN',()=>{replacePrompt=false;resume();},{primary:true});button(a,'REPLACE & BEGIN',start);}
 else{if(saved)button(a,'RESUME SAVED RUN · '+(saved.phase==='end'?'ENDING':'DAY '+saved.day),resume,{primary:true});button(a,'BEGIN EVACUATION →',()=>{if(saved&&saved.phase!=='end'){replacePrompt=true;render();}else start();},{primary:!saved});}
 $('#hint').textContent='SAVED ON THIS DEVICE · PACKING TIMER PAUSES IN THE BACKGROUND';
}
function start(){const param=new URLSearchParams(location.search).get('seed');const seed=param===null?crypto.getRandomValues(new Uint32Array(1))[0]:Number(param);state=E.create(seed);replacePrompt=false;tab='log';lastSecond=-1;save();render();focusPanel();}
function resume(){state=readSave();if(!state)return render();E.resumeClock(state);tab='log';save();render();focusPanel();}
function menu(){if(state){E.pause(state);save();}state=null;window.OrbitState=null;replacePrompt=false;readSave();render();window.scrollTo(0,0);}
$('#save-menu').onclick=menu;document.querySelector('header a').onclick=e=>{e.preventDefault();menu();};
function gather(){
 $('#phase').textContent='EVACUATION IN PROGRESS';$('#chapter').textContent='PACK THE POD';$('#day').textContent='00 / 12';
 $('#content').innerHTML='<div class="gather-head"><span class="timer"><span id="countdown">'+Math.ceil(state.remainingMs/1000)+'</span>s</span><span class="run-code">FLIGHT '+state.seed.toString(36).toUpperCase()+'</span></div><h2>Room for <span>'+(6-state.packed.length)+' more.</span></h2><p class="copy">'+esc(state.startName)+'. A different crew and shuffled supplies each run. Six slots; each item can be taken once. Supply storage: 18.</p>'+resources();
 const a=$('#actions');a.innerHTML='';const grid=document.createElement('div');grid.className='items';a.append(grid);
 for(const id of state.supplyOrder){const i=E.items.find(i=>i.id===id);button(grid,(state.packed.includes(id)?'✓ ':'')+i.name,()=>commit(()=>E.pack(state,id)),{id,kind:'pack',disabled:state.packed.includes(id)||state.packed.length>=6,detail:changeText(i.gain)+(i.flag?' · garden bonus':'')});}
 button(a,'LAUNCH ESCAPE POD →',()=>commit(()=>E.launch(state)),{primary:true});
 $('#hint').textContent='OXYGEN, FOOD, AND SCRAP ALL MATTER. THE POD LAUNCHES AT ZERO.';
}
function logView(){
 const ev=E.event(state);
 $('#content').innerHTML=resources()+'<p class="result" role="status">'+esc(state.last)+'</p><h2>'+esc(ev.title)+'</h2><p class="copy">'+esc(ev.text)+'</p>';
 const a=$('#actions');for(const ch of ev.choices)button(a,ch.label,()=>commit(()=>E.choose(state,ch.id)),{id:ch.id,kind:'choice',disabled:!E.canPay(state,ch.cost)||(ch.requireTrust&&state.trust<ch.requireTrust),detail:[changeText(ch.cost,true),changeText(ch.gain),ch.stress?(ch.stress>0?'+':'')+ch.stress+' crew stress':'',ch.requireTrust?'requires '+ch.requireTrust+' trust; fourth crew uses 2 food + 2 air daily':''].filter(Boolean).join(' · ')||'No extra supply cost'});
 const daily=state.crew.length>3?2:1,food=daily-(state.upgrades.garden?1:0),air=state.upgrades.recycler&&state.day%2===0?0:daily;
 $('#hint').textContent='AFTER THIS DECISION: −'+food+' RATION · −'+air+' OXYGEN. '+(state.acted?'TODAY’S CREW TASK IS USED.':'YOU MAY DO ONE CREW TASK FIRST.');
}
function crewView(){
 $('#content').innerHTML='<h2>People, not cargo.</h2><p class="copy">Crew trust '+state.trust+'/8 · Morale '+state.morale+'/8 · Medical charges '+state.meds+'. Injured or exhausted crew cannot leave on expeditions. Rest and treatment use today’s crew task.</p>';
 const a=$('#actions');
 for(const c of state.crew){const p=E.people[c.id],card=document.createElement('section');card.className='crew-card';const canvas=document.createElement('canvas');canvas.width=50;canvas.height=92;canvas.className='portrait';canvas.setAttribute('aria-label',p.name+' portrait');card.append(canvas);
 const info=document.createElement('div');info.innerHTML='<h3>'+esc(p.name)+' <span>'+esc(p.role)+'</span></h3><p>'+esc(p.trait)+'</p><strong>'+esc(E.condition(state,c))+'</strong><p>Health '+c.health+'/3 · Stress '+c.stress+'/6 · Trust '+c.trust+'/8</p>';card.append(info);a.append(card);window.OrbitArt.portrait(canvas,c.id,E.condition(state,c));
 const away=!!state.expedition&&state.expedition.crew===c.id;
 button(a,'Treat '+p.name,()=>commit(()=>E.treat(state,c.id)),{disabled:state.acted||away||state.meds<1||(c.health===3&&c.stress===0),detail:'−1 medical · +1 health · −2 stress'});
 button(a,'Rest '+p.name,()=>commit(()=>E.rest(state,c.id)),{disabled:state.acted||away||c.stress===0,detail:'−3 stress · +1 morale · no supplies'});}
 $('#hint').textContent='TRUST CHANGES VISITOR OUTCOMES. YOUR CREW REMEMBERS HOW YOU TREAT THEM.';
}
function workshop(){
 $('#content').innerHTML=resources()+'<h2>Make this tin can home.</h2><p class="copy">Build one upgrade, repair, craft, rest, treat, or dispatch an expedition each day. Then return to the log to advance time.</p>';
 const a=$('#actions'),worker=E.active(state).some(c=>c.health>=2&&c.stress<5);
 for(const[id,r]of Object.entries(E.recipes)){const built=!!state.upgrades[id];button(a,(built?'✓ INSTALLED · ':'')+r.name,()=>commit(()=>E.craft(state,id)),{id,kind:'craft',disabled:built||state.acted||!worker||!E.canPay(state,r.cost)||(id==='repair'&&state.hull>=5),detail:changeText(r.cost,true)+' · '+r.text});}
 $('#hint').textContent=state.acted?'CREW TASK COMPLETE. RETURN TO THE LOG.':'ONE TASK AVAILABLE · UPGRADES APPEAR INSIDE YOUR POD';
}
function expeditions(){
 $('#content').innerHTML=resources()+'<h2>Beyond the airlock.</h2><p class="copy">A crew member stays away for 1–2 days. Tethers lower injury risk; scanners add scrap. Returns happen when you advance the daily log.</p>';
 const a=$('#actions');
 if(state.expedition){const e=state.expedition;a.innerHTML='<div class="brief">'+esc(E.people[e.crew].name)+' is exploring '+esc(E.places[e.place].name)+'.<br>Returns on day '+e.returnDay+'. Their trait is unavailable while away.</div>';$('#hint').textContent='CONTINUE THE DAILY LOG WHILE YOUR EXPLORER IS AWAY.';return;}
 const fields=document.createElement('div');fields.className='expedition-fields';fields.innerHTML='<label>Crew member<select id="exp-crew">'+E.active(state).map(c=>'<option value="'+c.id+'" '+(c.health<3||c.stress>=5?'disabled':'')+'>'+esc(E.people[c.id].name)+(c.health<3||c.stress>=5?' · needs care':'')+'</option>').join('')+'</select></label><label>Equipment<select id="exp-gear"><option value="tether">Tether · 1 scrap · safer</option><option value="scanner">Scanner · 1 scrap · +1 scrap haul</option><option value="none">None · higher injury risk</option></select></label>';a.append(fields);
 const ready=E.active(state).find(c=>c.health>=3&&c.stress<5);if(ready)$('#exp-crew').value=ready.id;
 function cards(){a.querySelectorAll('[data-expedition]').forEach(b=>b.remove());const gear=$('#exp-gear').value;for(const[id,p]of Object.entries(E.places)){const risk=Math.round(Math.max(.05,p.risk-(gear==='tether'?.2:0))*100);button(a,'Explore '+p.name,()=>commit(()=>E.expedition(state,id,$('#exp-crew').value,$('#exp-gear').value)),{id,kind:'expedition',disabled:state.acted||!ready||state.day+p.days>12||!E.canPay(state,{air:p.air,parts:gear==='none'?0:1}),detail:p.days+' day(s) · −'+p.air+' oxygen · '+risk+'% injury risk · '+changeText(p.gain)+(p.flag?' · moon map':'')});}}
 $('#exp-gear').onchange=cards;cards();$('#hint').textContent='AN INJURED RETURN BRINGS ONLY 1 SCRAP. EQUIPMENT IS CONSUMED AT DEPARTURE.';
}
function routes(){
 $('#content').innerHTML='<h2>What does home mean?</h2><p class="copy">Set your course. Requirements are checked after the final daily cost on day 12. Selecting a route uses no crew task.</p><div class="brief">Signal '+state.signal+' · Evidence '+state.clues+' · Trust '+state.trust+'/8<br>Map '+(state.flags.planet?'found':'missing')+' · Caravan '+(state.flags.caravan?'contacted':'unknown')+'</div>';
 const a=$('#actions');for(const[id,r]of Object.entries(E.routeInfo(state)))button(a,(state.route===id?'◈ SELECTED · ':'')+r.name,()=>commit(()=>E.setRoute(state,id)),{id,kind:'route',detail:r.text+' · '+(r.ready?'READY NOW':'requirements not yet met')});
 $('#hint').textContent='RELAY EXPEDITIONS AND THE BLACK BOX REVEAL WHAT HAPPENED TO THE STATION.';
}
function journal(){
 $('#content').innerHTML='<h2>Every little decision.</h2><p class="copy">Flight '+state.seed.toString(36).toUpperCase()+' · '+esc(state.startName)+'. Your latest 40 entries are kept with the save.</p>';
 $('#actions').innerHTML='<ol class="journal">'+state.log.map(e=>'<li><span>DAY '+e.day+'</span>'+esc(e.message)+'</li>').join('')+'</ol>';$('#hint').textContent='SAME FLIGHT SEED. SAME RANDOM OUTCOMES. RELOADING CANNOT REROLL AN EXPEDITION.';
}
function ending(){
 const o=state.outcome;$('#chapter').textContent='FINAL TRANSMISSION';$('#phase').textContent=o.won?'CREW RECOVERED':'SIGNAL LOST';
 $('#content').innerHTML='<p class="eyebrow">'+(o.won?'SOMEONE WAS LISTENING.':'THE VOID REMEMBERS.')+'</p><h2>'+(o.won?esc(E.routeInfo(state)[o.id].name):'Until the next orbit.')+'</h2><p class="copy">'+esc(o.message)+'</p><div class="brief">Survived '+state.day+' days · '+(o.won?o.survivors+' crew safe':'Signal '+state.signal)+'<br>Endings discovered '+endings().length+'/4</div>';
 button($('#actions'),'TRY ANOTHER ORBIT ↗',menu,{primary:true});$('#hint').textContent='YOUR ENDING COLLECTION STAYS ON THIS DEVICE.';
}
function render(){
 window.OrbitState=state;$('#actions').innerHTML='';$('#tabs').hidden=!state||state.phase!=='survive';$('#save-menu').disabled=!state;$('#day').textContent=state?String(state.day).padStart(2,'0')+' / 12':'00 / 12';
 $('#scene-label').textContent=state?'DAY '+String(state.day).padStart(2,'0')+' / '+(state.expedition?'CREW ON EVA':'STILL OUT HERE'):'THE QUIET BEFORE THE END';
 $('#scene-time').textContent=state?'SIGNAL '+state.signal+' / 8':'SECTOR 09 · DRIFTING';
 $('#ship-status').textContent='HULL INTEGRITY '+(state?state.hull*20:100)+'%';
 if(!state)intro();else if(state.phase==='gather')gather();else if(state.phase==='end')ending();else{
  $('#phase').textContent='SURVIVAL MODE';$('#chapter').textContent='CAPTAIN’S LOG';$('#tabs').innerHTML='';
  for(const[id,label]of Object.entries({log:'Log',crew:'Crew',workshop:'Workshop',expeditions:'Explore',routes:'Course',journal:'Journal'})){const b=button($('#tabs'),label,()=>{tab=id;render();focusPanel();},{id,kind:'tab'});b.setAttribute('aria-pressed',String(tab===id));}
  ({log:logView,crew:crewView,workshop,expeditions,routes,journal})[tab]();
 }
 portraits();saveBadge();window.OrbitArt.redraw();
}
function pauseAndSave(){if(state){E.pause(state);save();}}
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseAndSave();else if(state){E.resumeClock(state);save();}});
window.addEventListener('pagehide',pauseAndSave);window.addEventListener('pageshow',()=>{if(state)E.resumeClock(state);});
setInterval(()=>{if(!state||state.phase!=='gather'||document.hidden)return;E.tick(state);const sec=Math.ceil(state.remainingMs/1000);if(state.phase!=='gather'){save();render();focusPanel();}else if(sec!==lastSecond){lastSecond=sec;const el=$('#countdown');if(el)el.textContent=sec;save();}},250);
window.LastOrbit={getState:()=>state?JSON.parse(E.serialize(state)):null};
readSave();render();
})();
