(()=>{'use strict';
const canvas=document.getElementById('spider-web-bg');if(!canvas)return;
const ctx=canvas.getContext('2d',{alpha:true});if(!ctx)return;
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
let w=0,h=0,dpr=1,raf=0,last=0;
const pointer={x:-1000,y:-1000};
const webs=[];
function resize(){
 w=innerWidth;h=innerHeight;dpr=Math.min(devicePixelRatio||1,1.5);
 canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
 ctx.setTransform(dpr,0,0,dpr,0,0);
 webs.length=0;
 webs.push({x:w*.94,y:h*.035,r:Math.min(w*.38,h*.43,330),opacity:.27,phase:0});
 webs.push({x:w*.015,y:h*.78,r:Math.min(w*.23,h*.3,210),opacity:.105,phase:1.7});
}
function webPoint(web,ring,angle,t){const wobble=Math.sin(angle*3+web.phase+t*.00022)*1.7;return{x:web.x+Math.cos(angle)*(ring+wobble),y:web.y+Math.sin(angle)*(ring+wobble)}}
function drawWeb(web,t){
 const spokes=web===webs[0]?15:12,rings=web===webs[0]?10:8;
 ctx.save();ctx.lineWidth=.75;ctx.strokeStyle='rgba(198,177,171,'+web.opacity+')';
 for(let s=0;s<spokes;s++){
  const a=(Math.PI*2*s/spokes)+web.phase*.08;
  const p=webPoint(web,web.r,a,t);ctx.beginPath();ctx.moveTo(web.x,web.y);ctx.lineTo(p.x,p.y);ctx.stroke();
 }
 for(let r=1;r<=rings;r++){
  const radius=web.r*r/rings;ctx.beginPath();
  for(let s=0;s<=spokes*3;s++){
   const a=(Math.PI*2*s/(spokes*3))+web.phase*.08;
   const p=webPoint(web,radius,a,t);if(!s)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);
  }
  ctx.stroke();
 }
 ctx.restore();
}
function drawSpider(x,y,angle){
 ctx.save();ctx.translate(x,y);ctx.rotate(angle);
 ctx.strokeStyle='rgba(238,220,213,.9)';ctx.lineWidth=1.25;ctx.lineCap='round';
 for(let side of [-1,1])for(let i=0;i<4;i++){
  const yy=(i-1.5)*2.2,reach=5+i*.45;
  ctx.beginPath();ctx.moveTo(side*1.3,yy);ctx.quadraticCurveTo(side*reach,yy-4,side*(reach+2),yy+(i%2?5:-5));ctx.stroke();
 }
 ctx.fillStyle='#d7c5bf';ctx.beginPath();ctx.ellipse(0,0,2.3,3.3,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#e8412c';ctx.shadowColor='#e8412c';ctx.shadowBlur=8;ctx.beginPath();ctx.arc(0,-3.5,1.45,0,Math.PI*2);ctx.fill();ctx.restore();
}
function frame(t){
 if(!last)last=t;ctx.clearRect(0,0,w,h);
 webs.forEach((web,i)=>{
  drawWeb(web,t);
  if(i===0){
   const phase=(t*.000045)%(Math.PI*2),angle=-Math.PI*.72+phase*.9;
   const radius=web.r*(.26+.62*(.5+.5*Math.sin(t*.00031)));
   const p=webPoint(web,radius,angle,t);
   drawSpider(p.x,p.y,angle+Math.PI/2);
  }
 });
 const glow=ctx.createRadialGradient(pointer.x,pointer.y,0,pointer.x,pointer.y,150);
 glow.addColorStop(0,'rgba(232,65,44,.055)');glow.addColorStop(1,'rgba(232,65,44,0)');
 ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
 if(!reduce)raf=requestAnimationFrame(frame);
}
addEventListener('resize',resize,{passive:true});
addEventListener('pointermove',e=>{pointer.x=e.clientX;pointer.y=e.clientY},{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelAnimationFrame(raf);else if(!reduce)raf=requestAnimationFrame(frame)});
resize();frame(0);
})();