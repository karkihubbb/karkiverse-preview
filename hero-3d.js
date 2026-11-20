(()=>{'use strict';
const canvas=document.getElementById('hero-world-canvas');if(!canvas)return;
const ctx=canvas.getContext('2d',{alpha:true});if(!ctx)return;
let w=0,h=0,dpr=1,raf=0;const pointer={x:-1000,y:-1000,active:0};
const chars=['·','.',':','+','*','×','░','▒','▓','█'];
const palettes=[[255,82,112],[255,154,76],[255,210,105],[94,220,190],[88,158,255],[178,116,255],[255,110,202]];
function resize(){w=innerWidth;h=innerHeight;dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);canvas.style.width='100%';canvas.style.height='100%';ctx.setTransform(dpr,0,0,dpr,0,0);}
function field(x,y,t){
 const nx=x/w,ny=y/h,wave=Math.sin(nx*8.2+ny*3.4+t*.00042)*.5+Math.cos(ny*9.5-nx*4.2-t*.00031)*.5;
 const blobs=[[w*.18+Math.sin(t*.00023)*w*.06,h*.28+Math.cos(t*.00019)*h*.08,w*.30],[w*.78+Math.cos(t*.00017)*w*.05,h*.34+Math.sin(t*.00021)*h*.07,w*.34],[w*.53+Math.sin(t*.00013)*w*.08,h*.83,w*.32]];
 let total=0,blend=[0,0,0];blobs.forEach((b,i)=>{const dx=(x-b[0])/b[2],dy=(y-b[1])/b[2],q=Math.exp(-(dx*dx+dy*dy)*2.1),col=palettes[(i*2+1)%palettes.length];for(let k=0;k<3;k++)blend[k]+=col[k]*q;total+=q;});
 const hue=(Math.sin(nx*5-ny*3+t*.0002)+1)*.5,base=palettes[Math.floor(hue*(palettes.length-1))],mix=Math.min(.9,total*.8);
 return {level:Math.max(0,Math.min(1,total*.45+wave*.12+.12)),color:base.map((v,i)=>Math.round(v*(1-mix)+(blend[i]/Math.max(total,.001))*mix))};
}
function draw(now){const t=now||0;ctx.clearRect(0,0,w,h);const cell=Math.max(13,Math.min(20,w/90)),cols=Math.ceil(w/cell),rows=Math.ceil(h/cell);ctx.textAlign='center';ctx.textBaseline='middle';
 for(let gy=0;gy<rows;gy++)for(let gx=0;gx<cols;gx++){const x=gx*cell+cell*.5,y=gy*cell+cell*.5,f=field(x,y,t),dx=x-pointer.x,dy=y-pointer.y,dist=Math.hypot(dx,dy),influence=pointer.active*Math.exp(-dist/Math.max(90,Math.min(w,h)*.22)),ripple=(Math.sin(dist*.075-t*.006)*.5+.5)*influence,light=Math.max(0,Math.min(1,f.level*.75+influence*.34+ripple*.2)),idx=Math.min(chars.length-1,Math.floor(light*(chars.length-1))),rgb=f.color.map(v=>Math.min(255,Math.round(v*(.34+light*.72))));ctx.fillStyle='rgba('+rgb.join(',')+','+(.13+light*.62)+')';ctx.font=(8+light*5)+'px ui-monospace, SFMono-Regular, Menlo, monospace';ctx.fillText(chars[idx],x+(influence?dx/Math.max(dist,1)*influence*10:0),y+(influence?dy/Math.max(dist,1)*influence*10:0));}
 const v=ctx.createRadialGradient(w*.5,h*.48,Math.min(w,h)*.12,w*.5,h*.48,Math.max(w,h)*.72);v.addColorStop(0,'rgba(7,8,12,0.04)');v.addColorStop(1,'rgba(7,8,12,0.68)');ctx.fillStyle=v;ctx.fillRect(0,0,w,h);if(pointer.active>0)pointer.active=Math.max(0,pointer.active-.0028);raf=requestAnimationFrame(draw);}
window.addEventListener('pointermove',e=>{pointer.x=e.clientX;pointer.y=e.clientY;pointer.active=1;},{passive:true});window.addEventListener('pointerleave',()=>{pointer.active=0;},{passive:true});window.addEventListener('resize',resize,{passive:true});document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelAnimationFrame(raf);else raf=requestAnimationFrame(draw);});resize();if(!matchMedia('(prefers-reduced-motion: reduce)').matches)raf=requestAnimationFrame(draw);else draw(0);
})();