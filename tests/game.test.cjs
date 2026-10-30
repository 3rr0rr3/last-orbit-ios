const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const nodes=new Map();
function element(){return {textContent:'',innerHTML:'',children:[],append(x){this.children.push(x)},getContext(){return new Proxy({},{get:()=>()=>{},set:()=>true})}}}
const sandbox={document:{querySelector(s){if(!nodes.has(s))nodes.set(s,element());return nodes.get(s)},createElement:element},matchMedia:()=>({matches:true}),setInterval:()=>1,clearInterval(){},console};
vm.createContext(sandbox);vm.runInContext(fs.readFileSync('web/game.js','utf8'),sandbox);
const run=s=>vm.runInContext(s,sandbox);
assert.equal(run('state.phase'),'intro');run('start()');assert.equal(run('state.left'),60);
// Exercise the actual packing buttons; re-render replaces their container contents in a browser.
for(let i=0;i<6;i++){nodes.get('.items').children.at(-9+i).onclick()}
assert.equal(run('state.packed.length'),6);
assert(nodes.get('.items').children.slice(-9).every(b=>b.disabled));
run('launch()');assert.equal(run('state.day'),1);run('launch()');assert.equal(run('state.day'),1);
run('state.food=30;state.air=30;state.parts=20;state.hull=5;state.signal=0');
run('choose(true)');assert.equal(run('state.food'),33);assert.equal(run('state.air'),27);
run('state.parts=0;renderDay()');assert.equal(nodes.get('#actions').children.at(-2).disabled,true);
run('state.parts=20;state.food=50;state.air=50');for(let i=0;i<11;i++)run('choose(true)');
assert.equal(run('state.phase'),'end');assert.equal(nodes.get('#phase').textContent,'CREW RECOVERED');
run('start();launch();state.air=0;choose(false)');assert.equal(nodes.get('#phase').textContent,'SIGNAL LOST');
run('start();launch();state.food=0;choose(false)');assert.equal(run('state.phase'),'end');
run('start();launch();state.day=6;state.hull=1;choose(false)');assert.equal(run('state.phase'),'end');
run('start();launch();state.day=12;state.food=10;state.air=10;state.signal=0;choose(false)');assert.equal(nodes.get('#phase').textContent,'SIGNAL LOST');
console.log('Passed: packing, launch, resource costs, disabled choices, rescue, oxygen, food, hull, weak signal.');
