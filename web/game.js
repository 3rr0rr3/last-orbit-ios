/* UI, local autosave, sound, and lifecycle handling. */
(function(){
'use strict';
const E=window.OrbitEngine,$=s=>document.querySelector(s),KEY='last-orbit-save-v2',META='last-orbit-endings-v2';
let state=null,tab='log',saveError='',saved=null,replacePrompt=false,sound=false,audioCtx,lastSecond=-1;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const names={food:'rations',air:'oxygen',parts:'scrap',meds:'medical',hull:'hull',morale:'morale',trust:'trust',signal:'signal',clues:'evidence'};
const settings=readOptions();let crewIndex=0,ambientNodes=null,lastWarningDay=-1;
function achievements(){try{const stored=JSON.parse(localStorage.getItem('last-orbit-achievements-v1')||'[]');return (Array.isArray(stored)?stored:[]).filter(x=>['builder','sixdays','friend','rescued'].includes(x));}catch{return[];}}
function unlocks(){const a=new Set(achievements());if(endings().length)a.add('rescued');if(state){if(Object.keys(state.upgrades).length)a.add('builder');if(state.day>=6)a.add('sixdays');if(state.crew.length===4)a.add('friend');if(state.outcome?.won)a.add('rescued');}try{localStorage.setItem('last-orbit-achievements-v1',JSON.stringify([...a]));}catch{}return a;}

function readSave(){try{const text=localStorage.getItem(KEY);saved=text?E.load(text):null;if(text&&!saved)saveError='Old or damaged save could not be loaded. You can start a new run.';}catch{saveError='Saving is unavailable. Keep the game open.';}return saved;}
function save(){if(!state)return;try{localStorage.setItem(KEY,E.serialize(state));saved=E.load(localStorage.getItem(KEY));saveError='';}catch{saveError='Autosave failed. Keep the game open to preserve this run.';}saveBadge();}
function endings(){try{const a=JSON.parse(localStorage.getItem(META)||'[]');return Array.isArray(a)?a.filter(x=>['home','colony','caravan','mystery'].includes(x)):[];}catch{return[];}}
function recordEnding(){if(!state.outcome?.won)return;try{localStorage.setItem(META,JSON.stringify([...new Set([...endings(),state.outcome.id]) ]));}catch{saveError='Ending collection could not be saved.';}}
function saveBadge(){for(const id of ['save-status','game-save-status']){const el=$('#'+id);el.textContent=saveError||(!state?'OFFLINE · AUTOSAVE READY':'AUTOSAVED');el.classList.toggle('warning',!!saveError);}}
function readOptions(){
 const defaults={sound:false,reduceMotion:matchMedia('(prefers-reduced-motion: reduce)').matches,largeText:false,ambient:false};
 try{const s=JSON.parse(localStorage.getItem('last-orbit-options-v1')||'{}');for(const k of Object.keys(defaults))if(typeof s[k]==='boolean')defaults[k]=s[k];}catch{}
 try{const s=JSON.parse(localStorage.getItem('last-orbit-options-v1')||'{}');defaults.difficulty=s.difficulty==='relaxed'?'relaxed':'survival';defaults.outfit=s.outfit==='starlight'&&achievements().length?'starlight':'original';defaults.decor=s.decor==='stars'&&achievements().some(x=>['sixdays','rescued'].includes(x))?'stars':'none';}catch{}
 return defaults;
}
function applyOptions(){
 sound=settings.sound;window.OrbitSettings=settings;
 $('#opt-ambient').checked=settings.ambient;$('#opt-difficulty').value=settings.difficulty||'survival';
 const earned=achievements(),outfit=earned.length>0,decor=earned.some(x=>['sixdays','rescued'].includes(x));
 $('#opt-outfit option[value=starlight]').disabled=!outfit;$('#opt-decor option[value=stars]').disabled=!decor;
 $('#opt-outfit').value=settings.outfit||'original';$('#opt-decor').value=settings.decor||'none';
 $('#outfit-lock').textContent=outfit?'Starlight unlocked!':'Unlock: build an upgrade, reach day 6, recruit Nix, or win.';$('#decor-lock').textContent=decor?'Hanging stars unlocked!':'Unlock: reach day 6 or earn an ending.';
 $('#achievement-list').textContent='Achievements '+earned.length+' / 4 · '+(earned.join(' · ')||'Build an upgrade · survive 6 days · recruit Nix · earn an ending');
 syncAmbient();
 document.body.classList.toggle('large-text',settings.largeText);
 $('#opt-sound').checked=settings.sound;$('#opt-motion').checked=settings.reduceMotion;$('#opt-text').checked=settings.largeText;
 window.OrbitArt.setMotion(settings.reduceMotion);if(settings.reduceMotion){document.getAnimations().forEach(a=>a.finish());document.querySelectorAll(".story-skip").forEach(b=>b.remove());}
}
function openOptions(){
 if(state?.phase==='gather'){E.pause(state);save();}
 applyOptions();$('#options-dialog').showModal();
}
function updateOptions(){
 settings.ambient=$('#opt-ambient').checked;settings.difficulty=$('#opt-difficulty').value;settings.outfit=$('#opt-outfit').value;settings.decor=$('#opt-decor').value;
 settings.sound=$('#opt-sound').checked;settings.reduceMotion=$('#opt-motion').checked;settings.largeText=$('#opt-text').checked;
 try{localStorage.setItem('last-orbit-options-v1',JSON.stringify(settings));}catch{saveError='Settings could not be saved on this device.';saveBadge();}
 applyOptions();syncAmbient(true);beep();
}
function beep(f=440){if(!sound)return;try{audioCtx??=new(window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='square';o.frequency.value=f;g.gain.setValueAtTime(.02,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+.1);o.connect(g).connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+.1);}catch{}}
function button(parent,label,fn,opt={}){
 const b=document.createElement('button');b.type='button';b.className=opt.primary?'primary':'choice';b.disabled=!!opt.disabled;b.textContent=label;
 if(opt.id)b.dataset[opt.kind||'action']=opt.id;
 if(opt.detail){const sm=document.createElement('small');sm.textContent=opt.detail;b.append(sm);}
 b.onclick=()=>{syncAmbient(true);beep();fn();};parent.append(b);return b;
}
function focusPanel(){$('#content').scrollTop=0;$('#actions').scrollTop=0;}
function commit(fn){if(!state)return;const previousDay=state.day;if(fn()===false){saveError='That action is not available. Check supplies and today’s crew task.';saveBadge();return;}save();if(state.phase==='end')recordEnding();render();focusPanel();if(state.day>previousDay&&state.phase==='survive')animateDay();}
function animateDay(){
 document.querySelector('.day-transition')?.remove();
 if(settings.reduceMotion||!state||state.phase!=='survive')return;
 const overlay=document.createElement('div');overlay.className='day-transition';overlay.setAttribute('role','status');
 overlay.innerHTML='<span>STILL OUT HERE</span><strong>DAY '+state.day+'</strong><small>OF 12</small>';
 if(state.report){const note=document.createElement('p');note.className='day-summary';note.textContent='Yesterday: '+Object.entries(state.report.changes).map(([k,v])=>(v>0?'+':'')+v+' '+names[k]).join(' · ');overlay.append(note);}
 $('#game-screen').append(overlay);
 const animation=overlay.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)',offset:.2},{opacity:1,transform:'translateY(0)',offset:.7},{opacity:0,transform:'translateY(-6px)'}],{duration:1500,easing:'ease-in-out'});
 animation.finished.then(()=>overlay.remove()).catch(()=>overlay.remove());
}
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
function start(){const param=new URLSearchParams(location.search).get('seed');const seed=param===null?crypto.getRandomValues(new Uint32Array(1))[0]:Number(param);state=E.create(seed,Date.now(),{difficulty:settings.difficulty,variety:true});replacePrompt=false;tab='log';lastSecond=-1;save();render();focusPanel();}
function resume(){state=readSave();if(!state)return render();E.resumeClock(state);tab='log';save();render();focusPanel();}
function menu(){document.querySelector(".day-transition")?.remove();if(state){E.pause(state);save();}state=null;window.OrbitState=null;replacePrompt=false;readSave();render();}
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
 const daily=state.difficulty==='relaxed'?1:state.crew.length>3?2:1,food=daily-(state.upgrades.garden?1:0),air=state.upgrades.recycler&&state.day%2===0?0:daily;
 $('#hint').textContent=(state.difficulty==='relaxed'?'RELAXED · ':'')+'Daily cost: '+food+' ration · '+air+' oxygen. '+(state.acted?'Crew task used.':'One crew task available first.');
}
function crewView(){
 crewIndex%=state.crew.length;const member=state.crew[crewIndex],p=E.people[member.id],away=state.expedition?.crew===member.id;
 $('#content').innerHTML='<div class="crew-card"><canvas id="crew-profile" class="portrait" width="50" height="92" aria-label="'+p.name+' portrait"></canvas><div><h3>'+esc(p.name)+'<span>'+esc(p.role)+'</span></h3><strong>'+esc(E.condition(state,member))+'</strong><p>Health '+member.health+'/3 · Stress '+member.stress+'/6 · Trust '+member.trust+'/8</p></div></div><p class="copy">'+esc(p.trait)+'</p>';
 $('#content').insertAdjacentHTML('beforeend','<div class="crew-memory">'+esc(member.memory?'Remembers: '+member.memory:'A fresh start. No shared decisions yet.')+'<br>'+esc(member.trust>=6?'Feels close to the crew.':member.trust<=2?'Feels unheard.':'Still learning to trust everyone.')+'</div>');
 const friends=Object.entries(state.bonds||{}).filter(([key])=>key.split(':').includes(member.id));if(friends.length)$('#content').insertAdjacentHTML('beforeend','<p class="copy">'+friends.map(([key,value])=>esc(E.people[key.split(':').find(id=>id!==member.id)].name)+': '+(value>=2?'close friend':value<0?'strained relationship':'getting to know each other')).join(' · ')+'</p>');
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
function reportView(){
 const r=state.report;
 $('#content').innerHTML='<h2>Daily report</h2>'+(r?'<p class="copy">Day '+r.day+' completed · net supply changes</p><div class="brief">'+Object.entries(r.changes).map(([k,v])=>esc(names[k])+': '+(v>0?'+':'')+v).join(' · ')+'</div><ul class="journal">'+r.entries.map(e=>'<li>'+esc(e)+'</li>').join('')+'</ul>':'<p class="copy">Your first report arrives after today’s decision.</p>')+'<h3>Overheard in the cabin</h3>'+(state.conversations||[]).map(c=>'<blockquote><b>'+esc(E.people[c.id].name)+'</b><p>'+esc(c.text)+'</p></blockquote>').join('');
 $('#hint').textContent='Repairs, daily costs, choices, and returning explorers are included in net changes.';
}
function syncAmbient(gesture=false){
 const on=settings.ambient&&state&&!document.hidden;
 if(!on){if(ambientNodes){ambientNodes.forEach(n=>{try{n.stop();}catch{}});ambientNodes=null;}return;}
 if(!audioCtx&&!gesture)return;
 try{audioCtx??=new(window.AudioContext||window.webkitAudioContext)();if(gesture)audioCtx.resume();if(ambientNodes)return;
 const hum=audioCtx.createOscillator(),g=audioCtx.createGain();hum.type='sine';hum.frequency.value=55;g.gain.value=.018;hum.connect(g).connect(audioCtx.destination);hum.start();
 const buffer=audioCtx.createBuffer(1,audioCtx.sampleRate*2,audioCtx.sampleRate),samples=buffer.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=(Math.random()*2-1)*.12;
 const noise=audioCtx.createBufferSource(),filter=audioCtx.createBiquadFilter(),ng=audioCtx.createGain();noise.buffer=buffer;noise.loop=true;filter.type='bandpass';filter.frequency.value=1400;ng.gain.value=.018;noise.connect(filter).connect(ng).connect(audioCtx.destination);noise.start();ambientNodes=[hum,noise];
 }catch{}
}
function render(){
 unlocks();syncAmbient();

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
  for(const[id,label]of Object.entries({log:'Log',crew:'Crew',workshop:'Build',expeditions:'Explore',routes:'Course',journal:'Journal',report:'Report'})){
   const b=button($('#tabs'),label,()=>{tab=id;render();focusPanel();},{id,kind:'tab'});b.setAttribute('aria-pressed',String(tab===id));
  }
  ({log:logView,crew:crewView,workshop,expeditions,routes,journal,report:reportView})[tab]();
 }
 if(state?.phase==='survive'&&tab==='log')revealStory();
 if(state?.phase==='survive'&&tab==='log'&&state.conversations?.length){const c=state.conversations[0];$('#content').insertAdjacentHTML('beforeend','<blockquote class="crew-quote"><b>'+esc(E.people[c.id].name)+'</b> '+esc(c.text)+' <button type="button" id="open-report">Daily report</button></blockquote>');$('#open-report').onclick=()=>{tab='report';render();focusPanel();};}
 if(state&&state.day!==lastWarningDay&&(state.air<=2||state.food<=2)){lastWarningDay=state.day;if(settings.ambient){const old=sound;sound=true;beep(180);sound=old;}}
 portraits();saveBadge();window.OrbitArt.redraw();window.OrbitArt.start();
}
function pauseAndSave(){if(state){E.pause(state);save();}}
document.addEventListener('visibilitychange',()=>{if(document.hidden){pauseAndSave();syncAmbient();}else if(state&&!$('#options-dialog').open){E.resumeClock(state);save();}});
document.addEventListener('visibilitychange',()=>syncAmbient());
window.addEventListener('pagehide',pauseAndSave);window.addEventListener('pageshow',()=>{if(state&&!$('#options-dialog').open)E.resumeClock(state);});
setInterval(()=>{if(!state||state.phase!=='gather'||document.hidden||$('#options-dialog').open)return;E.tick(state);const sec=Math.ceil(state.remainingMs/1000);if(state.phase!=='gather'){save();render();focusPanel();animateDay();}else if(sec!==lastSecond){lastSecond=sec;const el=$('#countdown');if(el)el.textContent=sec;save();}},250);
window.LastOrbit={getState:()=>state?JSON.parse(E.serialize(state)):null};
$('#title-options').onclick=openOptions;$('#game-options').onclick=openOptions;
$('#close-options').onclick=()=>$('#options-dialog').close();$('#done-options').onclick=()=>$('#options-dialog').close();
$('#options-dialog').addEventListener('close',()=>{if(state?.phase==='gather'&&!document.hidden){E.resumeClock(state);save();}});
for(const id of ['opt-sound','opt-motion','opt-text','opt-ambient','opt-difficulty','opt-outfit','opt-decor'])$('#'+id).onchange=updateOptions;
applyOptions();readSave();render();
})();
