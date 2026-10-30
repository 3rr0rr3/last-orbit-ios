const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path'),fs=require('node:fs'),E=require('../web/engine.js');
const url=pathToFileURL(path.resolve('web/index.html')).href+'?seed=123456789';
const priority={cargo:['drift'],leak:['patch','seal'],traveler:['welcome','trade','refuse'],guest:['open'],dinner:['jokes'],storm:['armor','dodge','ride'],market:['listen','trade'],garden:['harvest','course'],ghost:['boost','soft'],radiation:['shield','treat','expose'],argument:['vote'],blackbox:['decode','broadcast','rest'],signal:['beacon','caravan'],final:['all','coords']};
(async()=>{
 fs.mkdirSync('test-results',{recursive:true});
 const engines=process.env.ORBIT_LOCAL_CHROME?[['chromium',chromium]]:[['chromium',chromium],['webkit',webkit]];
 for(const[name,engine]of engines){
 const browser=await engine.launch(process.env.ORBIT_LOCAL_CHROME?{channel:'chrome'}:{});
 try{
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const state=()=>page.evaluate(()=>window.LastOrbit.getState());

 const visibleControls=async selector=>{
  const result=await page.locator(selector).evaluateAll(elements=>elements.map(el=>{const r=el.getBoundingClientRect();return{text:el.textContent,visible:r.top>=0&&r.left>=0&&r.bottom<=innerHeight+1&&r.right<=innerWidth+1,height:r.height};}));
  assert(result.length>0,'Expected controls for '+selector);
  assert(result.every(x=>x.visible&&x.height>=43),'Controls must fit without scrolling: '+JSON.stringify(result));
  assert(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1),'No page scrolling needed');
 };

 const tab=id=>page.locator('[data-tab="'+id+'"]').click();
 const shot=label=>page.screenshot({path:'test-results/'+name+'-'+label+'.png',fullPage:true});
 await page.clock.install();
 await page.goto(url);await page.getByRole('button',{name:'START GAME'}).waitFor();
 await shot('title');

 await page.getByRole('button',{name:'OPTIONS',exact:true}).click();
 await page.getByLabel('Sound effects').check();
 await page.getByLabel('Larger text').check();
 await page.getByRole('button',{name:'DONE',exact:true}).click();
 await page.reload();await page.getByRole('button',{name:'OPTIONS',exact:true}).click();
 assert(await page.getByLabel('Sound effects').isChecked(),'Sound choice survives reload');
 assert(await page.getByLabel('Larger text').isChecked(),'Text choice survives reload');
 await page.getByLabel('Sound effects').uncheck();
 await page.getByLabel('Larger text').uncheck();
 await page.getByRole('button',{name:'DONE',exact:true}).click();
 assert(await page.locator('.title-icon').evaluate(img=>img.complete&&img.naturalWidth===256),'Title icon loads');

 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No iPhone horizontal overflow');
 await page.getByRole('button',{name:'START GAME'}).click();
 for(const id of ['rations','air','tools','wire','filter','battery'])await page.locator('[data-pack="'+id+'"]').click();
 assert.equal(await page.locator('.items button:disabled').count(),9);

 const beforeOptions=(await state()).remainingMs;
 await page.locator('#game-options').click();
 await page.clock.runFor(90000);
 assert.equal((await state()).phase,'gather','Options pauses packing');
 await page.getByRole('button',{name:'DONE',exact:true}).click();
 assert(Math.abs((await state()).remainingMs-beforeOptions)<1000,'Closing Options preserves remaining packing time');
 const packed=(await state()).packed;
 await page.getByRole('button',{name:'SAVE & MENU'}).click();await page.reload();
 await page.getByRole('button',{name:'CONTINUE'}).click();assert.deepEqual((await state()).packed,packed);
 await page.getByRole('button',{name:'LAUNCH ESCAPE POD'}).click();
 assert.equal((await state()).day,1);await visibleControls('[data-choice]');
 await tab('workshop');await page.locator('[data-craft="garden"]').click();
 assert.equal((await state()).upgrades.garden,true);
 assert(await page.locator('[data-craft="recycler"]').isDisabled(),'One task each day');
 await tab('crew');assert.equal(await page.locator('.crew-card').count(),1);await page.getByRole('button',{name:'Next crew member'}).click();assert((await page.locator('.crew-switcher').textContent()).includes('2 / 3'));
 await tab('log');await page.locator('[data-choice="drift"]').click();
 assert.equal((await state()).day,2);
 await tab('workshop');await page.locator('[data-craft="recycler"]').click();
 await tab('log');await page.locator('[data-choice="patch"]').click();
 await tab('workshop');await page.locator('[data-craft="antenna"]').click();
 await tab('log');
 let s=await state(),ev=E.event(s),id=Object.keys(E.events).find(k=>E.events[k]===ev);
 let choice=priority[id].find(id=>{const c=ev.choices.find(c=>c.id===id);return c&&E.canPay(s,c.cost);});
 await visibleControls('[data-choice]');await page.locator('[data-choice="'+choice+'"]').click();
 assert.equal((await state()).day,4);
 await tab('expeditions');await page.locator('#exp-place').selectOption('relay');await page.locator('[data-expedition="relay"]').click();
 const trip=(await state()).expedition;assert(trip);assert.equal(E.active(await state()).length,2);
 await shot('expedition');
 await page.reload();await page.getByRole('button',{name:'CONTINUE'}).click();
 assert.deepEqual((await state()).expedition,trip,'Reload cannot reroll expedition or lose away crew');
 await tab('routes');await page.locator('[data-route="home"]').click();
 await tab('journal');assert((await page.locator('.journal').textContent()).includes('left for'));
 await tab('log');await shot('survival');
 while((s=await state()).phase==='survive'){
 ev=E.event(s);id=Object.keys(E.events).find(k=>E.events[k]===ev);
 choice=priority[id].find(id=>{const c=ev.choices.find(c=>c.id===id);return c&&E.canPay(s,c.cost);});
 assert(choice,'An affordable choice must remain');
 await page.locator('[data-choice="'+choice+'"]').click();
 }
 assert.equal((await state()).outcome.id,'home','Full rescue campaign through visible controls');
 await shot('ending');
 await page.reload();await page.getByRole('button',{name:'CONTINUE'}).click();
 assert.equal((await state()).outcome.id,'home');
 assert((await page.locator('#content').textContent()).includes('1/4'));
 await page.getByRole('button',{name:'TRY ANOTHER ORBIT'}).click();

 await page.getByRole('button',{name:'START GAME'}).click();
 await page.clock.runFor(5000);
 await page.getByRole('button',{name:'SAVE & MENU'}).click();
 const snapshot=await page.evaluate(()=>JSON.parse(localStorage.getItem('last-orbit-save-v2')));
 await page.clock.runFor(120000);
 await page.getByRole('button',{name:'CONTINUE'}).click();
 assert(Math.abs((await state()).remainingMs-snapshot.remainingMs)<250,'Menu pauses the countdown; allow a fraction of a second after resuming');
 await page.clock.runFor(61000);await page.clock.runFor(500);
 assert.equal((await state()).day,1,'Countdown launches automatically');

 // Restore a valid campaign at its visitor branch, then recruit through the UI.
 const recruit=E.create(123456789,0);
 for(const item of ['rations','air','tools','wire','filter','battery'])E.pack(recruit,item);
 E.launch(recruit);
 while(!(recruit.flags.guest&&!recruit.flags.guestDone)){
 if(recruit.day===1)E.craft(recruit,'garden');if(recruit.day===2)E.craft(recruit,'recycler');if(recruit.day===3)E.craft(recruit,'antenna');
 const ev=E.event(recruit),id=Object.keys(E.events).find(k=>E.events[k]===ev);
 const ch=priority[id].find(id=>{const c=ev.choices.find(c=>c.id===id);return c&&E.canPay(recruit,c.cost);});
 E.choose(recruit,ch);assert.equal(recruit.phase,'survive');
 }
 await page.getByRole('button',{name:'SAVE & MENU'}).click();
 await page.evaluate(text=>localStorage.setItem('last-orbit-save-v2',text),E.serialize(recruit));
 await page.reload();await page.getByRole('button',{name:'CONTINUE'}).click();
 await page.locator('[data-choice="recruit"]').click();assert.equal((await state()).crew.length,4);
 assert.equal(await page.locator('#crew-strip .portrait').count(),4);
 await shot('four-crew');
 await page.reload();await page.getByRole('button',{name:'CONTINUE'}).click();
 assert.equal((await state()).crew.length,4,'Fourth crew survives save/resume');

 await page.getByRole('button',{name:'SAVE & MENU'}).click();
 await page.evaluate(()=>localStorage.setItem('last-orbit-save-v2','{"version":2,"phase":"survive","day":99}'));
 await page.reload();assert((await page.locator('#save-status').textContent()).includes('could not be loaded'));
 assert(await page.getByRole('button',{name:'START GAME'}).isVisible());
 await page.setViewportSize({width:320,height:740});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No 320px horizontal overflow');
 await shot('small-phone');

 // Every choice stays on-screen on common and small iPhones, including larger text.
 for(const viewport of [{width:390,height:844},{width:375,height:667},{width:320,height:568}]){
  await page.setViewportSize(viewport);
  for(const largeText of [false,true]){
   for(const eventId of ['cargo','dinner','radiation','guest']){
    const sample=E.create(123456789,0);E.launch(sample);sample.day=3;sample.deck[2]=eventId;
    await page.evaluate(({save,largeText})=>{localStorage.setItem('last-orbit-save-v2',save);localStorage.setItem('last-orbit-options-v1',JSON.stringify({sound:false,reduceMotion:true,largeText}));},{save:E.serialize(sample),largeText});
    await page.reload();await page.getByRole('button',{name:'CONTINUE'}).click();
    await visibleControls('[data-choice]');
    for(const view of ['workshop','routes','expeditions','crew']){
     await tab(view);await visibleControls('#actions button');
    }
    await page.getByRole('button',{name:'SAVE & MENU'}).click();
   }
  }
 }
 await page.setViewportSize({width:390,height:844});
 await page.getByRole('button',{name:'START GAME'}).click();
 await page.getByRole('button',{name:'REPLACE & START'}).click();
 await visibleControls('[data-pack]');await visibleControls('#actions .primary');
 await page.getByRole('button',{name:'SAVE & MENU'}).click();

 assert.deepEqual(errors,[]);
 console.log(name+': title screen, saved options, no-scroll decisions, packing, crafts, crew, expeditions, journal, course, save/resume, complete rescue, ending collection, paused timer, auto-launch, corrupt save recovery, and small phone layout passed.');
 }finally{await browser.close();}
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
