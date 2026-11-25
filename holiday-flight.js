(()=>{'use strict';
const canvas=document.getElementById('kv-holiday-flight');
if(!canvas)return;
const ctx=canvas.getContext('2d',{alpha:true});
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse=window.matchMedia('(pointer: coarse)').matches;
let w=0,h=0,dpr=1,raf=0,last=0,elapsed=0,stars=[],snow=[],sprite=null,audioCtx=null,master=null,soundTimer=null,soundOn=false;
const soundButton=document.getElementById('kv-holiday-sound');
const rand=(a,b)=>a+Math.random()*(b-a);
function resize(){
  dpr=Math.min(window.devicePixelRatio||1,1.5);w=innerWidth;h=innerHeight;
  canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
  canvas.style.width=w+'px';canvas.style.height=h+'px';ctx.setTransform(dpr,0,0,dpr,0,0);
  stars=Array.from({length:Math.max(55,Math.round(w*h/8500))},()=>({x:rand(0,w),y:rand(0,h*.76),r:rand(.65,1.8),p:rand(0,6.28),s:rand(.5,1.5)}));
  snow=Array.from({length:Math.min(70,Math.round(w/8))},()=>({x:rand(0,w),y:rand(0,h),r:rand(.5,1.25),v:rand(7,19),d:rand(-5,5)}));
}
function makeSprite(){
  const c=document.createElement('canvas');c.width=184;c.height=82;const g=c.getContext('2d');
  const R=(x,y,a,b,col)=>{g.fillStyle=col;g.fillRect(x,y,a,b)};
  const L=(x1,y1,x2,y2,col)=>{let dx=Math.abs(x2-x1),sx=x1<x2?1:-1,dy=-Math.abs(y2-y1),sy=y1<y2?1:-1,err=dx+dy;for(;;){R(x1,y1,1,1,col);if(x1===x2&&y1===y2)break;let e=2*err;if(e>=dy){err+=dy;x1+=sx}if(e<=dx){err+=dx;y1+=sy}}};
  const red='#ed3f35',darkred='#a9232c',gold='#ffd64d',cream='#fff1d5',white='#fff9ee',skin='#f3b18a',brown='#b96e39',brown2='#8b4d2c',hoof='#e5c17c',black='#17151a',green='#65d99b';
  // Sleigh runners and golden frame
  L(5,67,59,67,gold);L(8,70,55,70,gold);L(5,67,2,73,gold);L(55,70,62,64,gold);
  L(10,60,61,60,gold);L(12,61,60,61,gold);
  // Sleigh body
  R(12,48,45,12,red);R(17,45,37,3,'#ff6a48');R(10,54,48,4,darkred);
  R(7,48,7,9,gold);R(7,47,4,2,gold);R(54,49,7,3,gold);
  R(13,60,44,2,gold);R(17,63,35,1,cream);
  // Gift sack behind Santa
  R(13,34,12,12,'#3c9c69');R(16,31,7,4,green);R(18,29,3,3,gold);R(13,39,12,2,'#a6edaa');
  // Santa body
  R(25,38,17,15,red);R(22,46,22,5,red);R(27,52,12,3,cream);R(29,54,8,3,black);
  R(25,43,17,2,cream);R(32,45,3,3,gold);
  // Santa face and beard
  R(29,25,13,13,skin);R(27,31,3,7,white);R(30,35,12,7,white);R(35,39,8,4,white);
  R(31,29,2,2,black);R(38,29,2,2,black);R(35,33,3,2,'#d77a70');
  // Hat
  R(27,22,17,4,red);R(30,17,12,6,red);R(33,13,7,5,red);R(37,10,4,4,red);R(27,22,17,2,white);R(40,9,5,5,white);
  // Arm holding reins
  L(39,42,51,36,red);R(49,34,4,4,skin);
  // Reins, glowing dotted red/gold line
  L(52,36,109,25,'#e84b3f');L(52,38,109,27,gold);
  // Lead reindeer body
  R(115,31,28,11,brown);R(119,28,20,4,brown);R(136,28,8,6,brown2);
  // Neck and head
  L(139,31,148,20,brown);R(145,17,12,9,brown);R(154,20,8,5,brown);R(161,23,5,3,cream);
  R(152,19,2,2,black);R(163,22,2,2,'#e5a1a0');R(146,16,3,3,brown2);
  // Antlers
  L(148,18,143,10,hoof);L(143,10,139,7,hoof);L(143,11,147,6,hoof);L(153,17,157,9,hoof);L(157,9,163,6,hoof);L(158,10,155,4,hoof);
  // Legs and hooves
  L(120,40,116,53,brown2);L(129,40,128,54,brown);L(137,40,139,52,brown2);L(143,37,148,49,brown);
  R(113,53,6,2,hoof);R(125,54,6,2,hoof);R(136,52,6,2,hoof);R(146,49,6,2,hoof);
  // Tail
  L(115,32,109,28,cream);R(107,26,3,3,cream);
  // Smaller second reindeer in the distance
  R(96,19,13,6,'#9a5934');R(104,15,7,7,'#9a5934');R(109,13,6,5,'#c47a45');
  L(108,14,106,8,hoof);L(106,8,103,6,hoof);L(111,14,114,8,hoof);
  L(99,24,97,32,'#8b4d2c');L(105,24,107,31,'#8b4d2c');
  // tiny sparkle pixels around the sleigh
  R(4,39,2,2,gold);R(66,53,2,2,cream);R(88,13,2,2,white);
  return c;
}
sprite=makeSprite();
const spritePixels=sprite.getContext('2d').getImageData(0,0,sprite.width,sprite.height).data;
function dot(x,y,r,color,alpha=1){ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1}
function drawMountains(t){
  const base=h*.865,step=5,scale=Math.max(.65,Math.min(1.1,w/900));
  const peaks=[.04,.10,.07,.17,.12,.22,.14,.19,.10,.15,.06,.12,.04];
  ctx.fillStyle='#080d18';ctx.beginPath();ctx.moveTo(0,h);ctx.lineTo(0,base);
  for(let x=0;x<=w+step;x+=step){const q=x/w*12,idx=Math.min(11,Math.floor(q)),f=q-idx,y=base-(peaks[idx]*(1-f)+peaks[idx+1]*f)*h*.34;ctx.lineTo(x,y)}
  ctx.lineTo(w,h);ctx.closePath();ctx.fill();
  // dotted snow-lit ridgelines, like the reference's LED mountain pixels
  for(let x=0;x<w;x+=6){const q=x/w*12,idx=Math.min(11,Math.floor(q)),f=q-idx,y=base-(peaks[idx]*(1-f)+peaks[idx+1]*f)*h*.34;dot(x,y,1.05,'#30384f',.58);if((Math.floor(x/6)%4)===0)dot(x,y+5,0.7,'#566079',.28)}
  // lower distant ridge
  ctx.fillStyle='#070a12';ctx.beginPath();ctx.moveTo(0,h);ctx.lineTo(0,h*.92);
  for(let x=0;x<=w;x+=8){const y=h*.92+Math.sin(x*.012+t*.08)*h*.018+Math.sin(x*.027)*h*.009;ctx.lineTo(x,y)}
  ctx.lineTo(w,h);ctx.closePath();ctx.fill();
}
function draw(t,dt){
  ctx.clearRect(0,0,w,h);
  // faint night haze
  const haze=ctx.createRadialGradient(w*.78,h*.16,4,w*.78,h*.16,Math.max(w,h)*.62);
  haze.addColorStop(0,'rgba(30,39,61,.22)');haze.addColorStop(1,'rgba(4,6,12,0)');
  ctx.fillStyle=haze;ctx.fillRect(0,0,w,h);
  // moon with tiny LED-like dots
  const mx=w*.78,my=h*.17,mr=Math.min(43,Math.max(24,w*.045));
  for(let yy=-mr;yy<=mr;yy+=4)for(let xx=-mr;xx<=mr;xx+=4){if(xx*xx+yy*yy<mr*mr)dot(mx+xx,my+yy,1.65,'#f5edcf',.82)}
  dot(mx+mr*.35,my-mr*.35,mr*.74,'#080d18',.9);
  // stars twinkle gently
  for(const s of stars){const a=.35+.55*(.5+.5*Math.sin(t*s.s+s.p));dot(s.x,s.y,s.r,'#f4f2e9',a)}
  // drifting snow
  for(const p of snow){p.y+=p.v*dt;p.x+=p.d*dt;if(p.y>h*.88){p.y=-4;p.x=rand(0,w)}if(p.x<0)p.x=w;if(p.x>w)p.x=0;dot(p.x,p.y,p.r,'#c9d6e9',.38)}
  drawMountains(t);
  // sleigh passes through the sky, scaled for phone and desktop
  const scale=Math.min(w/720,1.0);const sw=sprite.width*scale,sh=sprite.height*scale;
  const travel=w+sw*2;const cycle=17;
  const progress=((t%cycle)/cycle);
  const x=-sw+(progress*travel);
  const y=h*(coarse?.43:.39)+Math.sin(t*.75)*Math.min(13,h*.012);
  const tilt=Math.sin(t*.75)*.035;
  ctx.save();ctx.translate(x+sw/2,y);ctx.rotate(tilt);
  const cols=sprite.width,rows=sprite.height,pixels=spritePixels;
  const cell=scale*3.35, radius=cell*.39;
  for(let yy=0;yy<rows;yy++)for(let xx=0;xx<cols;xx++){const i=(yy*cols+xx)*4;if(pixels[i+3]>0){dot((xx-cols/2)*cell,(yy-rows/2)*cell,radius,'rgb('+pixels[i]+','+pixels[i+1]+','+pixels[i+2]+')',.98)}}
  // shimmering gold trail behind the sleigh
  for(let k=0;k<18;k++){const tx=-sw*.45-k*scale*7,ty=sh*.32+Math.sin(t*2+k)*2;dot(tx,ty,scale*1.25,k%3?'#ffd84c':'#fff0a0',.72-k*.025)}
  ctx.restore();
}
function bell(freq,when,duration=.48,volume=.12){
  if(!audioCtx||!master)return;
  const osc=audioCtx.createOscillator(),gain=audioCtx.createGain(),overtone=audioCtx.createOscillator(),g2=audioCtx.createGain();
  osc.type='sine';osc.frequency.setValueAtTime(freq,when);
  overtone.type='sine';overtone.frequency.setValueAtTime(freq*2.76,when);
  gain.gain.setValueAtTime(.0001,when);gain.gain.exponentialRampToValueAtTime(volume,when+.012);gain.gain.exponentialRampToValueAtTime(.0001,when+duration);
  g2.gain.setValueAtTime(.0001,when);g2.gain.exponentialRampToValueAtTime(volume*.22,when+.01);g2.gain.exponentialRampToValueAtTime(.0001,when+duration*.55);
  osc.connect(gain).connect(master);overtone.connect(g2).connect(master);
  osc.start(when);overtone.start(when);osc.stop(when+duration+.03);overtone.stop(when+duration+.03);
}
function startSound(){
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
  if(!audioCtx){audioCtx=new AC();master=audioCtx.createGain();master.gain.value=.35;master.connect(audioCtx.destination)}
  audioCtx.resume();soundOn=true;soundButton?.setAttribute('aria-pressed','true');soundButton?.classList.add('is-on');if(soundButton)soundButton.textContent='♫ Sound on';
  const notes=[784,988,1175,988,880,1047,1319,1047,784,988,1175,1568];
  let n=0;soundTimer=setInterval(()=>{if(!soundOn)return;const now=audioCtx.currentTime;bell(notes[n%notes.length],now,.52,.11);if(n%3===0)bell(notes[(n+4)%notes.length]*.5,now+.06,.65,.035);n++},390);
}
function stopSound(){soundOn=false;if(soundTimer)clearInterval(soundTimer);soundTimer=null;if(master&&audioCtx){master.gain.setTargetAtTime(.0001,audioCtx.currentTime,.035)}if(soundButton){soundButton.setAttribute('aria-pressed','false');soundButton.classList.remove('is-on');soundButton.textContent='♫ Sound off'}}
soundButton?.addEventListener('click',()=>{if(soundOn)stopSound();else{if(master)master.gain.setTargetAtTime(.35,audioCtx.currentTime,.04);startSound()}});
function frame(now){if(!last)last=now;const dt=Math.min(.05,(now-last)/1000);last=now;elapsed+=dt;draw(elapsed,dt);raf=requestAnimationFrame(frame)}
resize();addEventListener('resize',resize,{passive:true});
if(!reduced)raf=requestAnimationFrame(frame);else draw(0,0);
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);stopSound()}else if(!reduced){last=0;raf=requestAnimationFrame(frame)}});
})();