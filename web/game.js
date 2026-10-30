/* UI, local autosave, sound, and lifecycle handling. */
(function(){
'use strict';
const E=window.OrbitEngine,$=s=>document.querySelector(s),KEY='last-orbit-save-v2',META='last-orbit-endings-v2';
let state=null,tab='log',saveError='',saved=null,replacePrompt=false,sound=false,audioCtx,lastSecond=-1;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const names={food:'rations',air:'oxygen',parts:'scrap',meds:'medical',hull:'hull',morale:'morale',trust:'trust',signal:'signal',clues:'evidence'};
const settings=readOptions();let crewIndex=0;
function readSave(){try{const text=localStorage.getItem(KEY);saved=text?E.load(text):null;if(text&&!saved)saveError='Old or damaged save could not be loaded. You can start a new run.';}catch{saveError='Saving is unavailable. Keep the game open.';}return saved;}
function save(){if(!state)return;try{localStorage.setItem(KEY,E.serialize(state));saved=E.load(localStorage.getItem(KEY));saveError='';}catch{saveError='Autosave failed. Keep the game open to preserve this run.';}saveBadge();}
function endings(){try{const a=JSON.parse(localStorage.getItem(META)||'[]');return Array.isArray(a)?a.filter(x=>['home','colony','caravan','mystery'].includes(x)):[];}catch{return[];}}
function recordEnding(){if(!state.outcome?.won)return;try{localStorage.setItem(META,JSON.stringify([...new Set([...endings(),state.outcome.id]) ]));}catch{saveError='Ending collection could not be saved.';}}
function saveBadge(){for(const id of ['save-status','game-save-status']){const el=$('#'+id);el.textContent=saveError||(!state?'OFFLINE · AUTOSAVE READY':'AUTOSAVED');el.classList.toggle('warning',!!saveError);}}
function readOptions(){
 const defaults={sound:false,reduceMotion:matchMedia('(prefers-reduced-motion: reduce)').matches,largeText:false};
 try{const s=JSON.parse(localStorage.getItem('last-orbit-options-v1')||'{}');for(const k of Object.keys(defaults))if(typeof s[k]==='boolean')defaults[k]=s[k];}catch{}
 return defaults;
}
function applyOptions(){
 sound=settings.sound;window.OrbitSettings=settings;
 document.body.classList.toggle('large-text',settings.largeText);
 $('#opt-sound').checked=settings.sound;$('#opt-motion').checked=settings.reduceMotion;$('#opt-text').checked=settings.largeText;
 window.OrbitArt.setMotion(settings.reduceMotion);if(settings.reduceMotion){document.getAnimations().forEach(a=>a.finish());document.querySelectorAll(".story-skip").forEach(b=>b.remove());}
}
function openOptions(){
 if(state?.phase==='gather'){E.pause(state);save();}
 applyOptions();$('#options-dialog').showModal();
}
function updateOptions(){
 settings.sound=$('#opt-sound').checked;settings.reduceMotion=$('#opt-motion').checked;settings.largeText=$('#opt-text').checked;
 try{localStorage.setItem('last-orbit-options-v1',JSON.stringify(settings));}catch{saveError='Settings could not be saved on this device.';saveBadge();}
 applyOptions();beep();
}
function beep(f=440){if(!sound)return;try{audioCtx??=new(window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='square';o.frequency.value=f;g.gain.setValueAtTime(.02,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+.1);o.connect(g).connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+.1);}catch{}}
function button(parent,label,fn,opt={}){
 const b=document.createElement('button');b.type='button';b.className=opt.primary?'primary':'choice';b.disabled=!!opt.disabled;b.textContent=label;
 if(opt.id)b.dataset[opt.kind||'action']=opt.id;
 if(opt.detail){const sm=document.createElement('small');sm.textContent=opt.detail;b.append(sm);}
 b.onclick=()=>{beep();fn();};parent.append(b);return b;
}
function focusPanel(){$('#content').scrollTop=0;$('#actions').scrollTop=0;}
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
 $('#title-message').textContent=replacePrompt?'Replace the saved run? Your ending collection will stay.':'60 seconds to pack. 12 days to find home.';
 $('#title-collection').textContent='ENDINGS FOUND '+endings().length+' / 4';
 const a=$('#title-actions');a.innerHTML='';
 if(replacePrompt){
  button(a,'KEEP SAVED RUN',()=>{replacePrompt=false;resume();},{primary:true});
  button(a,'REPLACE & START',start);
 }else{
  if(saved)button(a,'CONTINUE · '+(saved.phase==='end'?'LAST ENDING':'DAY '+saved.day),resume,{primary:true});
  button(a,'START GAME',()=>{if(saved&&saved.phase!=='end'){replacePrompt=true;render();}else start();},{primary:!saved});
 }
}
function start(){const param=new URLSearchParams(location.search).get('seed');const seed=param===null?crypto.getRandomValues(new Uint32Array(1))[0]:Number(param);state=E.create(seed);replacePrompt=false;tab='log';lastSecond=-1;save();render();focusPanel();}
function resume(){state=readSave();if(!state)return render();E.resumeClock(state);tab='log';save();render();focusPanel();}
function menu(){if(state){E.pause(state);save();}state=null;window.OrbitState=null;replacePrompt=false;readSave();render();}
$('#save-menu').onclick=menu;document.querySelector('header a').onclick=e=>{e.preventDefault();menu();};
function gather(){
 $('#phase').textContent='PACKING';$('#chapter').textContent='PACK THE POD';$('#day').textContent='00 / 12';
 $('#content').innerHTML='<div class="gather-head"><span class="timer"><span id="countdown">'+Math.ceil(state.remainingMs/1000)+'</span>s</span><h2>'+(6-state.packed.length)+' slots left</h2></div><p class="copy">'+esc(state.startName)+'. Tap supplies, then launch.</p>';
 const a=$('#actions');const grid=document.createElement('div');grid.className='items';a.append(grid);
 for(const id of state.supplyOrder){const i=E.items.find(i=>i.id===id);button(grid,(state.packed.includes(id)?'✓ ':'')+i.name,()=>commit(()=>E.pack(state,id)),{id,kind:'pack',disabled:state.packed.includes(id)||state.packed.length>=6,detail:changeText(i.gain)});}
 button(a,'LAUNCH ESCAPE POD →',()=>commit(()=>E.launch(state)),{primary:true});
 $('#hint').textContent='Six items maximum. Menu and Options pause the timer.';
}
function revealStory(){
 const story=$('#content .copy');
 if(!story||settings.reduceMotion)return;
 const text=story.textContent,words=text.match(/\S+\s*/g)||[];
 story.textContent='';story.classList.add('story-reveal');
 const animations=words.map((word,i)=>{const span=document.createElement('span');span.textContent=word;story.append(span);return span.animate([{opacity:0},{opacity:1}],{duration:110,delay:i*Math.min(40,1500/Math.max(1,words.length)),fill:'both'});});
 const skip=document.createElement('button');skip.type='button';skip.className='story-skip';skip.textContent='Show full story';story.after(skip);
 const finish=()=>{animations.forEach(a=>a.finish());skip.remove();};
 story.onclick=finish;skip.onclick=finish;
 Promise.all(animations.map(a=>a.finished.catch(()=>{}))).then(()=>skip.remove());
}
function logView(){
 const ev=E.event(state);
 $('#content').innerHTML='<p class="result" role="status">'+esc(state.last)+'</p><h2>'+esc(ev.title)+'</h2><p class="copy">'+esc(ev.text)+(ev.choices.some(c=>c.special==='recruit')?' A fourth crew member uses 2 rations and 2 oxygen daily.':'')+'</p>';
 for(const ch of ev.choices)button($('#actions'),ch.label,()=>commit(()=>E.choose(state,ch.id)),{id:ch.id,kind:'choice',disabled:!E.canPay(state,ch.cost)||(ch.requireTrust&&state.trust<ch.requireTrust),detail:[changeText(ch.cost,true),changeText(ch.gain),ch.stress?(ch.stress>0?'+':'')+ch.stress+' stress':'',ch.requireTrust?'Needs '+ch.requireTrust+' trust':''].filter(Boolean).join(' · ')||'No extra supply cost'});
 const daily=state.crew.length>3?2:1,food=daily-(state.upgrades.garden?1:0),air=state.upgrades.recycler&&state.day%2===0?0:daily;
 $('#hint').textContent='Daily cost: '+food+' ration · '+air+' oxygen. '+(state.acted?'Crew task used.':'One crew task available first.');
}
function crewView(){
 crewIndex%=state.crew.length;const member=state.crew[crewIndex],p=E.people[member.id],away=state.expedition?.crew===member.id;
 $('#content').innerHTML='<div class="crew-card"><canvas id="crew-profile" class="portrait" width="50" height="92" aria-label="'+p.name+' portrait"></canvas><div><h3>'+esc(p.name)+'<span>'+esc(p.role)+'</span></h3><strong>'+esc(E.condition(state,member))+'</strong><p>Health '+member.health+'/3 · Stress '+member.stress+'/6 · Trust '+member.trust+'/8</p></div></div><p class="copy">'+esc(p.trait)+'</p>';
 window.OrbitArt.portrait($('#crew-profile'),member.id,E.condition(state,member));
 const a=$('#actions'),switcher=document.createElement('div');switcher.className='crew-switcher';a.append(switcher);
 const prev=button(switcher,'‹',()=>{crewIndex=(crewIndex-1+state.crew.length)%state.crew.length;render();focusPanel();});prev.setAttribute('aria-label','Previous crew member');
 const label=document.createElement('span');label.textContent='CREW '+(crewIndex+1)+' / '+state.crew.length+' · '+state.meds+' MEDICAL';switcher.append(label);
 const next=button(switcher,'›',()=>{crewIndex=(crewIndex+1)%state.crew.length;render();focusPanel();});next.setAttribute('aria-label','Next crew member');
 const tasks=document.createElement('div');tasks.className='crew-task-actions';a.append(tasks);
 button(tasks,'Treat '+p.name,()=>commit(()=>E.treat(state,member.id)),{disabled:state.acted||away||state.meds<1||(member.health===3&&member.stress===0),detail:'−1 medical · +1 health · −2 stress'});
 button(tasks,'Rest '+p.name,()=>commit(()=>E.rest(state,member.id)),{disabled:state.acted||away||member.stress===0,detail:'−3 stress · +1 morale'});
 $('#hint').textContent='Crew trust '+state.trust+'/8 · Morale '+state.morale+'/8. Treatment or rest uses today’s task.';
}
function workshop(){
 $('#content').innerHTML='<h2>Make this tin can home.</h2><p class="copy">Build one upgrade, repair, craft, rest, treat, or dispatch an expedition each day. Then return to the log to advance time.</p>';
 const a=$('#actions'),worker=E.active(state).some(c=>c.health>=2&&c.stress<5);
 for(const[id,r]of Object.entries(E.recipes)){const built=!!state.upgrades[id];button(a,(built?'✓ INSTALLED · ':'')+r.name,()=>commit(()=>E.craft(state,id)),{id,kind:'craft',disabled:built||state.acted||!worker||!E.canPay(state,r.cost)||(id==='repair'&&state.hull>=5),detail:changeText(r.cost,true)+' · '+r.text});}
 $('#hint').textContent=state.acted?'CREW TASK COMPLETE. RETURN TO THE LOG.':'ONE TASK AVAILABLE · UPGRADES APPEAR INSIDE YOUR POD';
}
function expeditions(){
 $('#content').innerHTML='<h2>Beyond the airlock.</h2><p class="copy" id="exp-summary">Pick a destination, explorer, and equipment.</p>';
 const a=$('#actions');
 if(state.expedition){const e=state.expedition;$('#content').innerHTML+='<div class="brief">'+esc(E.people[e.crew].name)+' is exploring '+esc(E.places[e.place].name)+'.<br>Returns on day '+e.returnDay+'.</div>';$('#hint').textContent='Return to Log to advance the day.';return;}
 const fields=document.createElement('div');fields.className='expedition-fields';
 fields.innerHTML='<label>Crew<select id="exp-crew">'+E.active(state).map(c=>'<option value="'+c.id+'" '+(c.health<3||c.stress>=5?'disabled':'')+'>'+esc(E.people[c.id].name)+(c.health<3||c.stress>=5?' · needs care':'')+'</option>').join('')+'</select></label><label>Equipment<select id="exp-gear"><option value="tether">Tether · 1 scrap</option><option value="scanner">Scanner · 1 scrap</option><option value="none">No equipment</option></select></label><label class="full">Destination<select id="exp-place">'+Object.entries(E.places).map(([id,p])=>'<option value="'+id+'">'+esc(p.name)+'</option>').join('')+'</select></label>';a.append(fields);
 const ready=E.active(state).find(c=>c.health>=3&&c.stress<5);if(ready)$('#exp-crew').value=ready.id;
 function update(){
  a.querySelectorAll('[data-expedition]').forEach(b=>b.remove());
  const id=$('#exp-place').value,p=E.places[id],gear=$('#exp-gear').value,member=E.active(state).find(c=>c.id===$('#exp-crew').value),risk=Math.round(Math.max(.05,p.risk-(gear==='tether'?.2:0))*100);
  $('#exp-summary').textContent=p.text+' '+changeText(p.gain)+(p.flag?' · moon map':'')+'.';
  button(a,'Explore '+p.name,()=>commit(()=>E.expedition(state,id,$('#exp-crew').value,$('#exp-gear').value)),{id,kind:'expedition',disabled:state.acted||!member||member.health<3||member.stress>=5||state.day+p.days>12||!E.canPay(state,{air:p.air,parts:gear==='none'?0:1}),detail:'−'+p.air+' oxygen'+(gear==='none'?'':' · −1 scrap')+' · '+p.days+' day(s) · '+risk+'% injury risk'});
 }
 for(const id of ['exp-crew','exp-gear','exp-place'])$('#'+id).onchange=update;
 update();$('#hint').textContent='An injured return brings 1 scrap. Tethers lower risk; scanners add scrap.';
}
function routes(){
 $('#content').innerHTML='<h2>What does home mean?</h2><p class="copy">Set your course. Requirements are checked after the final daily cost on day 12. Selecting a route uses no crew task.</p><div class="brief">Signal '+state.signal+' · Evidence '+state.clues+' · Trust '+state.trust+'/8<br>Map '+(state.flags.planet?'found':'missing')+' · Caravan '+(state.flags.caravan?'contacted':'unknown')+'</div>';
 const a=$('#actions');for(const[id,r]of Object.entries(E.routeInfo(state)))button(a,(state.route===id?'◈ SELECTED · ':'')+r.name,()=>commit(()=>E.setRoute(state,id)),{id,kind:'route',detail:r.text+' · '+(r.ready?'READY NOW':'requirements not yet met')});
 $('#hint').textContent='RELAY EXPEDITIONS AND THE BLACK BOX REVEAL WHAT HAPPENED TO THE STATION.';
}
function journal(){
 $('#content').innerHTML='<h2>The captain’s journal.</h2><ol class="journal">'+state.log.map(e=>'<li><span>DAY '+e.day+'</span>'+esc(e.message)+'</li>').join('')+'</ol>';
 $('#hint').textContent='Your latest 40 entries are saved on this device.';
}
function ending(){
 const o=state.outcome;$('#chapter').textContent='FINAL TRANSMISSION';$('#phase').textContent=o.won?'CREW RECOVERED':'SIGNAL LOST';
 $('#content').innerHTML='<p class="eyebrow">'+(o.won?'SOMEONE WAS LISTENING.':'THE VOID REMEMBERS.')+'</p><h2>'+(o.won?esc(E.routeInfo(state)[o.id].name):'Until the next orbit.')+'</h2><p class="copy">'+esc(o.message)+'</p><div class="brief">Survived '+state.day+' days · '+(o.won?o.survivors+' crew safe':'Signal '+state.signal)+'<br>Endings discovered '+endings().length+'/4</div>';
 button($('#actions'),'TRY ANOTHER ORBIT ↗',menu,{primary:true});$('#hint').textContent='YOUR ENDING COLLECTION STAYS ON THIS DEVICE.';
}
function render(){
 window.OrbitState=state;$('#actions').innerHTML='';$('#actions').className='';
 $('#title-screen').hidden=!!state;$('#game-screen').hidden=!state;$('#game-screen').dataset.phase=state?.phase||'title';$('#game-screen').dataset.tab=tab;
 $('#tabs').hidden=!state||state.phase!=='survive';$('#save-menu').disabled=!state;
 $('#day').textContent=state?String(state.day).padStart(2,'0')+' / 12':'00 / 12';
 $('#scene-label').textContent=state?'DAY '+state.day+' / '+(state.expedition?'CREW ON EVA':'STILL OUT HERE'):'';
 $('#scene-time').textContent=state?'SIGNAL '+state.signal+' / 8':'';
 if(state){
  $('#hud-resources').innerHTML=resources();$('#ship-status').textContent='HULL '+state.hull*20+'%';
  $('#hud-signal').textContent='SIGNAL '+state.signal+' / 8';$('#hud-task').textContent=state.phase==='gather'?'PACKING':state.acted?'TASK USED':'TASK READY';
 }
 if(!state)intro();else if(state.phase==='gather')gather();else if(state.phase==='end')ending();else{
  $('#phase').textContent='SURVIVING';$('#chapter').textContent='CAPTAIN’S LOG';$('#tabs').innerHTML='';
  for(const[id,label]of Object.entries({log:'Log',crew:'Crew',workshop:'Build',expeditions:'Explore',routes:'Course',journal:'Journal'})){
   const b=button($('#tabs'),label,()=>{tab=id;render();focusPanel();},{id,kind:'tab'});b.setAttribute('aria-pressed',String(tab===id));
  }
  ({log:logView,crew:crewView,workshop,expeditions,routes,journal})[tab]();
 }
 if(state?.phase==='survive'&&tab==='log')revealStory();
 portraits();saveBadge();window.OrbitArt.redraw();window.OrbitArt.start();
}
function pauseAndSave(){if(state){E.pause(state);save();}}
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseAndSave();else if(state&&!$('#options-dialog').open){E.resumeClock(state);save();}});
window.addEventListener('pagehide',pauseAndSave);window.addEventListener('pageshow',()=>{if(state&&!$('#options-dialog').open)E.resumeClock(state);});
setInterval(()=>{if(!state||state.phase!=='gather'||document.hidden||$('#options-dialog').open)return;E.tick(state);const sec=Math.ceil(state.remainingMs/1000);if(state.phase!=='gather'){save();render();focusPanel();}else if(sec!==lastSecond){lastSecond=sec;const el=$('#countdown');if(el)el.textContent=sec;save();}},250);
window.LastOrbit={getState:()=>state?JSON.parse(E.serialize(state)):null};
$('#title-options').onclick=openOptions;$('#game-options').onclick=openOptions;
$('#close-options').onclick=()=>$('#options-dialog').close();$('#done-options').onclick=()=>$('#options-dialog').close();
$('#options-dialog').addEventListener('close',()=>{if(state?.phase==='gather'&&!document.hidden){E.resumeClock(state);save();}});
for(const id of ['opt-sound','opt-motion','opt-text'])$('#'+id).onchange=updateOptions;
applyOptions();readSave();render();
})();
