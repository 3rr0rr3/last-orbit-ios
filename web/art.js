/* Code-native pixel sprites: cyan glasses, magenta buns, ink outlines. */
(function(root){
'use strict';
const D=root.OrbitData,ink='#17112d',cyan='#43cde7',pale='#e3daf5';
function box(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(x,y,w,h);}
function sprite(c,id,condition='HOLDING ON',wave=true){
 const p=D.people[id]||D.people.mira,hair=p.hair,blue=condition==='EXHAUSTED'?'#4795be':cyan;
 const r=(x,y,w,h,color)=>box(c,x,y,w,h,color);
 // Tilted bun and stepped magenta silhouette.
 r(2,1,6,2,ink);r(1,3,10,6,ink);r(3,3,6,5,hair);r(5,7,12,3,ink);
 r(5,5,10,2,ink);r(6,7,11,3,hair);r(4,10,17,8,ink);r(6,9,12,7,hair);
 r(8,7,7,1,'#ec81cf');r(5,10,4,2,cyan);r(8,8,3,2,cyan);
 if(p.style==='sweep'){r(3,4,10,3,hair);r(15,8,5,5,hair);}
 if(p.style==='curl'){r(3,4,4,4,hair);r(7,6,3,3,hair);}
 if(p.style==='antenna'){r(10,0,2,6,ink);r(9,0,4,2,cyan);r(3,5,14,3,hair);}
 r(7,14,13,9,ink);r(8,15,11,7,pale);r(9,21,3,2,pale);r(14,21,3,1,ink);
 // Oversized round, connected goggles with single-pixel pupils.
 r(6,14,6,1,ink);r(5,15,8,5,ink);r(6,20,6,1,ink);r(14,14,6,1,ink);r(13,15,8,5,ink);r(14,20,6,1,ink);
 r(7,15,4,1,cyan);r(6,16,6,3,cyan);r(7,19,4,1,cyan);r(15,15,4,1,cyan);r(14,16,6,3,cyan);r(15,19,4,1,cyan);r(12,16,2,1,ink);
 r(9,16,1,2,ink);r(16,16,1,2,ink);
 if(condition==='EXHAUSTED'||condition==='GASPING'){r(7,16,4,1,ink);r(15,16,4,1,ink);}
 // Thin cyan uniform, white collar, black central seam.
 r(7,23,11,14,ink);r(8,24,9,12,blue);r(10,23,5,3,ink);r(11,23,3,2,pale);r(12,26,1,8,ink);r(10,33,5,1,ink);
 // Hand on hip on the left; raised greeting on the right.
 r(4,24,4,3,ink);r(3,27,3,6,ink);r(5,32,3,3,ink);r(5,26,2,2,blue);r(4,28,2,4,blue);r(6,32,2,2,pale);
 if(wave){r(18,23,3,3,ink);r(20,19,3,6,ink);r(20,16,3,4,ink);r(21,17,1,3,pale);r(18,24,2,1,blue);r(20,21,1,3,blue);}
 else{r(18,25,3,9,ink);r(18,27,2,5,blue);r(18,32,2,2,pale);}
 r(7,36,5,8,ink);r(14,36,5,8,ink);r(8,36,3,6,blue);r(15,36,3,6,blue);r(7,43,6,2,ink);r(14,43,6,2,ink);r(8,43,4,1,'#8875a5');r(15,43,4,1,'#8875a5');
 if(condition==='INJURED'){r(9,28,5,3,pale);r(11,28,1,3,'#c75eac');}
 if(condition==='HUNGRY'){r(15,25,1,2,'#7393bd');r(11,21,4,1,ink);}
}
function portrait(canvas,id,condition){const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.clearRect(0,0,canvas.width,canvas.height);c.save();c.scale(2,2);sprite(c,id,condition);c.restore();}
let last=0;
function scene(t=0,still=false){
 const canvas=document.querySelector('#scene');if(!canvas)return;const c=canvas.getContext('2d'),s=root.OrbitState,E=root.OrbitEngine;
 if(!still&&t&&t-last<110){requestAnimationFrame(scene);return;}last=t;c.imageSmoothingEnabled=false;
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
  const condition=s?E.condition(s,person):'HOLDING ON',bob=matchMedia('(prefers-reduced-motion: reduce)').matches?0:Math.floor(Math.sin(t/650+i)*1.2);
  c.save();c.translate(x,y+bob);c.scale(2,2);sprite(c,person.id,condition,i===0||Math.sin(t/1000+i)>.3);c.restore();
 });
 // Damage and warnings remain visible alongside crew conditions.
 if(s&&s.hull<4){r(251,91,2,13,ink);r(253,101,5,2,ink);r(257,102,2,13,ink);r(259,113,5,2,ink);}
 if(s&&s.hull<2){r(77,89,2,17,ink);r(80,102,7,2,ink);r(85,103,2,14,ink);}
 if(s&&s.air<=2){r(319,95,8,5,'#f17fba');r(317,94,2,7,ink);}
 r(10,227,365,2,'#3d2a5a');r(48,231,30,5,'#38264f');r(297,231,30,5,'#38264f');
 for(let y=0;y<264;y+=3)r(0,y,384,1,'#140e2513');
 if(!still&&!matchMedia('(prefers-reduced-motion: reduce)').matches)requestAnimationFrame(scene);
}
root.OrbitArt={portrait,redraw:()=>scene(0,true)};
requestAnimationFrame(scene);
})(window);
