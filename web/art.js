/* Code-native pixel sprites: cyan glasses, magenta buns, ink outlines. */
(function(root){
'use strict';
const D=root.OrbitData,ink='#17112d',cyan='#43cde7',pale='#e3daf5';
function box(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(x,y,w,h);}
function sprite(c,id,condition='HOLDING ON',wave=true){
 const p=D.people[id]||D.people.mira;
 const r=(x,y,w,h,color)=>box(c,x,y,w,h,color);
 const skin=p.skin||pale;
 function eyes(x=9,y=17){r(x,y,2,2,ink);r(x+7,y,2,2,ink);r(x+3,y+4,3,1,ink);}
 function boots(color){r(7,35,5,9,ink);r(14,35,5,9,ink);r(8,35,3,7,color);r(15,35,3,7,color);r(6,42,7,3,ink);r(14,42,7,3,ink);r(7,43,5,1,'#857894');r(15,43,5,1,'#857894');}
 function arms(sleeve,raised=false){r(4,24,4,3,ink);r(3,27,3,7,ink);r(4,28,2,4,sleeve);r(5,32,3,3,ink);r(6,32,2,2,skin);
  if(raised&&wave){r(18,24,4,3,ink);r(20,20,3,6,ink);r(20,17,3,4,ink);r(21,18,1,3,skin);r(18,25,3,1,sleeve);r(21,22,1,3,sleeve);}
  else{r(18,25,4,10,ink);r(19,26,2,6,sleeve);r(19,32,2,2,skin);}
 }
 function conditionMarks(){
  if(condition==='INJURED'){r(9,29,6,3,'#efe4d2');r(11,29,2,3,'#e1799b');}
  if(condition==='EXHAUSTED'||condition==='GASPING'){r(7,24,12,17,'#17112d33');r(9,18,2,1,ink);r(16,18,2,1,ink);}
  if(condition==='HUNGRY')r(12,21,3,1,ink);
 }
 if(id==='bean'){
  // A compact android: square face display, antenna, ear bolts, articulated limbs.
  r(11,2,2,7,ink);r(10,1,4,3,'#e9b969');r(5,8,15,2,ink);r(3,10,19,13,ink);
  r(5,10,15,11,'#ded5b8');r(2,13,3,7,'#716c81');r(20,13,3,7,'#716c81');
  r(6,12,13,8,'#25364a');r(8,14,3,3,cyan);r(15,14,3,3,cyan);r(11,18,4,1,cyan);
  r(10,23,5,2,ink);r(5,25,16,13,ink);r(7,26,12,10,'#ded5b8');r(8,27,10,3,'#e7a052');
  r(9,31,8,4,'#48516b');r(10,32,2,2,cyan);r(14,32,2,2,'#ef92bd');
  r(2,26,3,9,ink);r(1,29,3,5,'#958fa4');r(2,34,4,3,ink);r(3,34,2,2,'#ded5b8');
  r(21,26,3,9,ink);r(22,29,2,5,'#958fa4');r(20,34,4,3,ink);r(21,34,2,2,'#ded5b8');
  r(7,38,5,5,'#716c81');r(15,38,5,5,'#716c81');r(5,42,8,3,ink);r(14,42,8,3,ink);r(7,43,5,1,'#e7a052');r(15,43,5,1,'#e7a052');
  conditionMarks();return;
 }
 if(id==='mira'){
  // Sleek violet bob, round cyan spectacles, navy captain's jacket and gold trim.
  r(7,4,11,2,ink);r(5,6,15,3,ink);r(4,9,17,12,ink);r(6,7,12,8,p.hair);r(5,10,3,11,p.hair);
  r(8,12,11,11,ink);r(9,13,9,9,skin);r(7,10,9,3,p.hair);r(17,11,2,4,p.hair);
  r(6,15,7,5,ink);r(14,15,7,5,ink);r(7,16,5,3,cyan);r(15,16,5,3,cyan);r(12,16,3,1,ink);r(9,16,1,2,ink);r(17,16,1,2,ink);r(12,21,3,1,ink);
  r(7,23,12,14,ink);r(8,24,10,12,'#4a5988');r(9,24,3,4,pale);r(14,24,3,4,pale);r(12,25,2,10,ink);
  r(7,24,4,2,'#e4c675');r(16,24,4,2,'#e4c675');r(15,28,2,3,'#e4c675');r(8,34,10,2,'#e4c675');
  boots('#343550');arms('#4a5988',true);
 }else if(id==='juno'){
  // Spiky teal undercut and welding goggles pushed up over orange work overalls.
  r(6,5,3,4,ink);r(10,3,3,6,ink);r(14,5,5,4,ink);r(4,8,17,8,ink);
  r(6,8,13,6,p.hair);r(7,6,2,4,p.hair);r(11,5,2,5,p.hair);r(17,7,2,4,p.hair);
  r(6,13,14,10,ink);r(7,14,12,8,skin);r(7,11,12,3,'#e4a66c');r(8,11,4,3,'#596b86');r(14,11,4,3,'#596b86');eyes(8,16);
  r(6,23,14,14,ink);r(7,24,12,12,'#5b4a63');r(9,24,8,12,'#e79a54');r(8,24,2,7,'#f0bc71');r(16,24,2,7,'#f0bc71');r(11,28,5,4,'#955b43');r(12,29,3,1,'#f2c87c');
  boots('#b97545');arms('#5b4a63');
  r(17,31,4,7,'#bfbac9');r(17,31,1,2,ink);r(20,31,1,2,ink);r(18,35,2,5,'#bfbac9');r(7,35,3,2,'#837487');
 }else if(id==='sol'){
  // Broad field hat, visible curls, green poncho, pale trousers and a leaf badge.
  r(7,4,11,2,ink);r(6,6,13,6,ink);r(7,6,11,5,'#d7ba7f');r(4,11,18,3,ink);r(5,11,16,2,'#e4cc93');
  r(5,14,16,7,ink);r(6,14,14,4,p.hair);r(7,16,12,7,ink);r(8,16,10,6,skin);r(6,16,2,5,p.hair);r(19,16,2,6,p.hair);eyes(9,17);
  r(8,23,10,2,ink);r(6,25,14,3,ink);r(4,28,18,9,ink);r(7,25,12,11,'#74a78a');r(5,29,16,6,'#74a78a');
  r(10,24,6,2,'#cbe0ad');r(12,26,2,9,'#4c796b');r(16,28,3,2,'#bbdb8c');r(17,27,1,4,'#bbdb8c');r(6,33,4,2,skin);r(18,33,3,2,skin);
  boots('#d8c9b0');r(6,42,7,3,'#5a494e');r(14,42,7,3,'#5a494e');
 }else{
  // Asymmetric white crop, crimson flight jacket, teal scarf and messenger bag.
  r(8,5,11,2,ink);r(6,7,15,5,ink);r(5,11,17,10,ink);r(7,7,12,5,p.hair);r(6,10,8,5,p.hair);
  r(8,13,12,10,ink);r(9,14,10,8,skin);r(8,11,5,5,p.hair);r(18,13,3,4,'#7f7195');eyes(10,17);r(20,19,1,2,'#e8c477');
  r(7,23,13,14,ink);r(8,24,11,12,'#b65b79');r(9,24,4,4,'#df8e9f');r(14,27,1,9,ink);
  r(9,23,10,3,'#61c3bf');r(16,25,3,6,'#61c3bf');r(10,29,9,2,'#7f5263');r(8,32,5,6,ink);r(9,33,3,4,'#d2a473');r(10,34,1,1,'#f0d19b');
  boots('#48445f');arms('#b65b79');r(17,34,4,2,'#df8e9f');
 }
 conditionMarks();
}

function portrait(canvas,id,condition){const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.clearRect(0,0,canvas.width,canvas.height);c.save();c.scale(2,2);sprite(c,id,condition);c.restore();}
let last=0,frame=null;
function requestScene(){if(frame===null)frame=requestAnimationFrame(t=>{frame=null;scene(t);});}
function reduced(){return root.OrbitSettings?.reduceMotion??matchMedia("(prefers-reduced-motion: reduce)").matches;}
function scene(t=0,still=false){
 const canvas=document.querySelector('#scene');if(!canvas)return;const c=canvas.getContext('2d'),s=root.OrbitState,E=root.OrbitEngine;
 if(!still&&t&&t-last<110){requestScene();return;}last=t;c.imageSmoothingEnabled=false;
 const r=(x,y,w,h,color)=>box(c,x,y,w,h,color);
 r(0,0,384,264,'#1a1234');for(let i=0;i<76;i++)r((i*67+13)%384,(i*31+7)%240,i%9===0?2:1,1,i%3?'#715993':'#d6b2f0');
 c.fillStyle='#5d3c84';c.beginPath();c.arc(319,106,101,0,Math.PI*2);c.fill();c.strokeStyle='#c785d4';c.lineWidth=3;c.beginPath();c.arc(319,106,99,Math.PI,Math.PI*1.8);c.stroke();
 for(let i=0;i<12;i++)r(270+i*6,74+i*7,64-i*3,2,'#795096');
 r(34,62,312,164,ink);r(24,80,332,132,ink);r(18,101,344,91,ink);
 r(37,68,306,151,'#9165b0');r(29,85,322,121,'#9165b0');r(24,105,332,79,'#9165b0');r(39,74,301,5,'#ce96dd');
 r(37,88,308,101,'#76518f');r(43,94,296,92,'#9a6ab1');
 for(let x=45;x<337;x+=4){r(x,95,1,90,'#b782ca');for(let y=98;y<186;y+=6)r(x,y,2,1,'#704888');}
 r(40,188,304,24,'#694983');for(let i=0;i<11;i++)r(43+i*28,192,23,2,'#bc8dcb');r(40,212,304,7,'#3e2b5b');
 // Window and on-board instruments.
 r(145,84,95,68,ink);r(150,89,85,58,'#c092d1');r(155,94,75,48,'#261b48');r(164,109,2,2,pale);r(214,99,2,2,cyan);r(196,129,2,2,'#dd92da');r(189,94,3,48,'#8c65ab');r(155,118,75,3,'#8c65ab');
 r(44,119,51,47,ink);r(48,123,43,28,'#a885c8');r(52,127,35,20,'#23445f');
 for(let i=0;i<4;i++)r(56,131+i*4,12+i*4,1,cyan);r(45,155,49,14,'#ba87c7');r(52,159,6,3,'#ef83cf');r(64,159,6,3,cyan);r(50,169,4,18,ink);r(88,169,4,18,ink);
 r(288,111,40,66,ink);r(292,115,32,58,'#b480c7');r(296,121,24,19,'#36234e');r(298,125,5,11,cyan);r(306,129,11,2,cyan);r(296,149,23,2,'#e2bae5');r(296,160,23,2,'#e2bae5');
 // Visible supplies disappear from the shelves.
 const food=s?s.food:10;for(let i=0;i<Math.min(5,Math.ceil(food/3));i++){r(46+i*9,178,7,9,ink);r(47+i*9,180,5,5,i%2?'#e698b6':'#e5c18e');}
 if(s&&s.upgrades.garden){r(145,169,34,14,ink);r(147,174,30,7,'#b1779b');for(let i=0;i<3;i++){r(151+i*9,161,2,13,'#66ceb0');r(148+i*9,165,8,3,'#8ce3b6');}}
 if(s&&s.upgrades.recycler){r(51,91,21,25,ink);r(54,94,15,19,cyan);r(59,97,4,13,'#327999');}
 if(s&&s.upgrades.storage){r(299,179,25,28,ink);r(301,181,21,24,'#af7eae');r(301,191,21,2,ink);r(311,182,2,22,ink);}
 if(s&&s.upgrades.antenna){r(188,44,3,18,ink);r(176,40,27,3,cyan);r(180,44,19,2,'#af83cf');}
 const crew=s?s.crew:[{id:'mira'},{id:'juno'},{id:'bean'}],spots=crew.length===4?[[81,119],[141,124],[201,119],[261,124]]:[[102,119],[195,124],[251,124]];
 crew.forEach((person,i)=>{
  const[x,y]=spots[i],away=s&&s.expedition&&s.expedition.crew===person.id;
  if(away){r(x+5,207,40,2,'#c991da');c.fillStyle='#d7b5e6';c.font='6px monospace';c.fillText('ON EVA',x+11,204);return;}
  const condition=s?E.condition(s,person):'HOLDING ON',bob=reduced()?0:Math.floor(Math.sin(t/650+i)*1.2);
  c.save();c.translate(x,y+bob);c.scale(2,2);sprite(c,person.id,condition,i===0||Math.sin(t/1000+i)>.3);c.restore();
 });
 // Damage and warnings remain visible alongside crew conditions.
 if(s&&s.hull<4){r(251,91,2,13,ink);r(253,101,5,2,ink);r(257,102,2,13,ink);r(259,113,5,2,ink);}
 if(s&&s.hull<2){r(77,89,2,17,ink);r(80,102,7,2,ink);r(85,103,2,14,ink);}
 if(s&&s.air<=2){r(319,95,8,5,'#f17fba');r(317,94,2,7,ink);}
 r(10,227,365,2,'#3d2a5a');r(48,231,30,5,'#38264f');r(297,231,30,5,'#38264f');
 for(let y=0;y<264;y+=3)r(0,y,384,1,'#140e2513');
 if(!still&&!reduced()&&!document.querySelector("#game-screen")?.hidden)requestScene();
}
root.OrbitArt={portrait,redraw:()=>scene(0,true),start:()=>{if(!reduced()&&!document.querySelector("#game-screen")?.hidden)requestScene();},setMotion:reduce=>{if(frame!==null){cancelAnimationFrame(frame);frame=null;}scene(0,true);if(!reduce&&!document.querySelector("#game-screen")?.hidden)requestScene();}};
requestScene();
})(window);
