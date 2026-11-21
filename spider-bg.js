(()=>{'use strict';
const canvas=document.getElementById('spider-web-bg');if(!canvas)return;
const ctx=canvas.getContext('2d',{alpha:true});if(!ctx)return;
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
let w=0,h=0,dpr=1,raf=0,start=0;
const hero=document.querySelector('.hero-wordmark');
function resize(){w=innerWidth;h=innerHeight;dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);canvas.style.width=w+'px';canvas.style.height=h+'px';ctx.setTransform(dpr,0,0,dpr,0,0);}
function spider(x,y,dir,t){
 ctx.save();ctx.translate(x,y);ctx.rotate(dir);
 const step=Math.sin(t*.014)*1.15;
 ctx.strokeStyle='rgba(238,224,218,.98)';ctx.lineWidth=1.35;ctx.lineCap='round';
 for(let side of [-1,1])for(let i=0;i<4;i++){
  const sy=(i-1.5)*2.5,reach=6+(i%2)*1.3,phase=step*(i%2?1:-1);
  ctx.beginPath();ctx.moveTo(side*1.2,sy);
  ctx.quadraticCurveTo(side*(reach*.55),sy-3.5+phase,side*(reach+2),sy+(i<2?-5:5)-phase);
  ctx.stroke();
 }
 ctx.fillStyle='#d9c7c0';ctx.beginPath();ctx.ellipse(0,0,2.5,3.4,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#e74731';ctx.shadowColor='#e74731';ctx.shadowBlur=9;ctx.beginPath();ctx.arc(0,-3.8,1.55,0,Math.PI*2);ctx.fill();ctx.restore();
}
function frame(t){
 if(!start)start=t;ctx.clearRect(0,0,w,h);
 if(hero){
  const r=hero.getBoundingClientRect();
  if(r.width>0&&r.bottom>0&&r.top<h){
   const pad=Math.min(20,r.width*.035),left=r.left+pad,right=r.right-pad;
   const span=Math.max(1,right-left),cycle=((t-start)*.00012)%(2);
   const progress=cycle<1?cycle:2-cycle;
   const x=left+span*progress;
   const y=Math.max(18,r.top-12+Math.sin(t*.006)*2);
   // Fine silk thread above the spider, with a tiny glint.
   ctx.save();ctx.strokeStyle='rgba(211,190,182,.55)';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(x,y-24);ctx.lineTo(x,y-4);ctx.stroke();
   ctx.fillStyle='rgba(232,65,44,.18)';ctx.shadowColor='#e74731';ctx.shadowBlur=10;ctx.beginPath();ctx.arc(x,y,7,0,Math.PI*2);ctx.fill();ctx.restore();
   spider(x,y,cycle<1?0:Math.PI,t);
  }
 }
 if(!reduce)raf=requestAnimationFrame(frame);
}
addEventListener('resize',resize,{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelAnimationFrame(raf);else if(!reduce)raf=requestAnimationFrame(frame)});
resize();frame(0);
})();