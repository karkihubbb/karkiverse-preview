(()=>{'use strict';
const canvas=document.getElementById('ascii-canvas'),ctx=canvas.getContext('2d',{alpha:true,desynchronized:true}),loading=document.getElementById('ascii-loading');
const sample=document.createElement('canvas'),sctx=sample.getContext('2d',{willReadFrequently:true});
const fxCanvas=document.createElement('canvas'),fxCtx=fxCanvas.getContext('2d');
const maskCanvas=document.createElement('canvas'),maskCtx=maskCanvas.getContext('2d');let maskImage=null,maskInvert=false;
const pipeline={bgBlur:12,bgOpacity:90,edgeEmphasis:0,density:0,toneCurve:[{x:0,y:0},{x:1,y:1}],tint:'#3ca6ff',tintOpacity:0,overlayBlend:'multiply',blurType:'off',blurAmount:35,lights:{enabled:false,points:[]}};
const photo=new Image();photo.crossOrigin='anonymous';photo.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1400&q=88';
const $=id=>document.getElementById(id),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t;
const pfx={vignette:38,bloom:25,scanLines:40,chromatic:15,filmGrain:30,glitch:20,pixelate:15,halftone:20,filmDust:20};
const defaults={renderMode:'mosaic',bgMode:'solid',cellSize:16,coverage:100,invert:false,brightness:12,contrast:115,saturation:100,grayscale:0,tint:'#3ca6ff',tintOpacity:0,animated:true,animStyle:'wave',animSpeed:100,animIntensity:60,charSet:'standard'};
let imageReady=false,sourceImage=photo,raf=0,startedAt=performance.now(),last=0,w=900,h=675,dpr=1,phase=0,frame=0;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function val(id){return $(id).value}
function fit(){const box=canvas.parentElement.getBoundingClientRect();dpr=Math.min(devicePixelRatio||1,1.5);w=Math.max(320,Math.round(box.width*dpr));h=Math.round(w*.75);canvas.width=w;canvas.height=h;sample.width=w;sample.height=h;$('ascii-dimensions').textContent=w+' × '+h;render(performance.now())}
function average(data,x,y,size){let r=0,g=0,b=0,n=0;const sx=Math.max(0,Math.floor(x)),sy=Math.max(0,Math.floor(y)),ex=Math.min(w,sx+size),ey=Math.min(h,sy+size);for(let yy=sy;yy<ey;yy+=2){for(let xx=sx;xx<ex;xx+=2){const i=(yy*w+xx)*4;r+=data[i];g+=data[i+1];b+=data[i+2];n++}}if(!n)return[0,0,0];return[r/n,g/n,b/n]}
function lum(c){return(.2126*c[0]+.7152*c[1]+.0722*c[2])/255}
function adjust(c){let [r,g,b]=c;const br=Number(val('brightness')),ct=Number(val('contrast'))/100,sat=Number(val('saturation'))/100;r+=br;g+=br;b+=br;r=(r-128)*ct+128;g=(g-128)*ct+128;b=(b-128)*ct+128;const l=.2126*r+.7152*g+.0722*b;r=l+(r-l)*sat;g=l+(g-l)*sat;b=l+(b-l)*sat;const gray=Number($('grayscale').value)/100,gl=.2126*r+.7152*g+.0722*b;r=mix(r,gl,gray);g=mix(g,gl,gray);b=mix(b,gl,gray);const tint=$('tint').value,ta=Number($('tintOpacity').value)/100,tr=parseInt(tint.slice(1,3),16),tg=parseInt(tint.slice(3,5),16),tb=parseInt(tint.slice(5,7),16);if(ta){if(pipeline.overlayBlend==='screen'){r=mix(r,255-(255-r)*(255-tr)/255,ta);g=mix(g,255-(255-g)*(255-tg)/255,ta);b=mix(b,255-(255-b)*(255-tb)/255,ta)}else{r=mix(r,r*tr/255,ta);g=mix(g,g*tg/255,ta);b=mix(b,b*tb/255,ta)}}return[clamp(r,0,255),clamp(g,0,255),clamp(b,0,255)]}
function color(c,a=1){return'rgba('+Math.round(c[0])+','+Math.round(c[1])+','+Math.round(c[2])+','+a+')'}
function polygon(points,fill){ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);ctx.closePath();ctx.fillStyle=fill;ctx.fill()}
function glyph(c,l,x,y,s,mode,t){const inv=$('invert').checked?1-l:l,bright=clamp(inv,0,1),alpha=.18+bright*.82;ctx.save();ctx.translate(x+s/2,y+s/2);ctx.fillStyle=color(c,alpha);ctx.strokeStyle=color(c,alpha);ctx.lineWidth=Math.max(1,s*.09);const q=s*(.14+bright*.76);
switch(mode){
case'characters':{const sets={standard:'@%#*+=-:. ',blocks:'█▓▒░ ',minimal:'●•· ',binary:'10 '};const chars=sets[val('charSet')]||sets.standard;const ch=chars[Math.min(chars.length-1,Math.floor((1-bright)*(chars.length-1)))];ctx.font='bold '+Math.max(7,s*.9)+'px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(ch,0,0);break}
case'dither':case'halftone':{const radius=Math.max(.5,q*.48);ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.fill();break}
case'pixel':case'mosaic':ctx.fillRect(-s/2,-s/2,s,s);break;
case'dots':ctx.beginPath();ctx.arc(0,0,q*.35,0,Math.PI*2);ctx.fill();break;
case'cross':ctx.fillRect(-q*.12,-q/2,q*.24,q);ctx.fillRect(-q/2,-q*.12,q,q*.24);break;
case'diamond':polygon([[0,-q/2],[q/2,0],[0,q/2],[-q/2,0]],color(c,alpha));break;
case'voxel':case'lego':ctx.fillRect(-q/2,-q/2,q,q);ctx.fillStyle='rgba(255,255,255,.16)';ctx.fillRect(-q/2,-q/2,q,q*.18);if(mode==='lego'){ctx.beginPath();ctx.arc(0,-q*.32,q*.12,0,Math.PI*2);ctx.fill()}break;
case'lines':ctx.beginPath();ctx.moveTo(-s/2,0);ctx.lineTo(s/2,0);ctx.stroke();break;
case'diagonal':ctx.beginPath();ctx.moveTo(-q/2,q/2);ctx.lineTo(q/2,-q/2);ctx.stroke();break;
case'braille':{const dots=[[ -.22,-.3],[-.22,0],[-.22,.3],[.22,-.3],[.22,0],[.22,.3]];dots.forEach((p,i)=>{if(bright>(i+1)/7){ctx.beginPath();ctx.arc(p[0]*s,p[1]*s,Math.max(1,s*.075),0,Math.PI*2);ctx.fill()}});break}
case'disco':ctx.beginPath();ctx.arc(0,0,q*.48,0,Math.PI*2);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.6)';ctx.beginPath();ctx.arc(0,0,q*.48,0,Math.PI*2);ctx.stroke();break;
case'hexdump':ctx.font='bold '+Math.max(6,s*.58)+'px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(Math.floor(bright*15).toString(16).toUpperCase(),0,0);break;
case'matrix':ctx.font='bold '+Math.max(7,s*.85)+'px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='rgba(75,255,145,'+alpha+')';ctx.fillText('01'[Math.floor((x+y+t/80)%2)],0,0);break;
case'rings':ctx.beginPath();ctx.arc(0,0,q*.45,0,Math.PI*2);ctx.lineWidth=Math.max(1,s*.09);ctx.stroke();break;
case'hearts':{const z=q*.035;ctx.scale(z,z);ctx.beginPath();ctx.moveTo(0,8);ctx.bezierCurveTo(-22,-8,-12,-22,0,-10);ctx.bezierCurveTo(12,-22,22,-8,0,8);ctx.fill();break}
case'stars':{const pts=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?q*.22:q*.5;pts.push([Math.cos(a)*r,Math.sin(a)*r])}polygon(pts,color(c,alpha));break}
case'hexagons':{const pts=[];for(let i=0;i<6;i++){const a=i*Math.PI/3;pts.push([Math.cos(a)*q*.5,Math.sin(a)*q*.5])}polygon(pts,color(c,alpha));break}
case'triangles':polygon([[-q/2,q/2],[0,-q/2],[q/2,q/2]],color(c,alpha));break;
case'bubbles':ctx.beginPath();ctx.arc(0,0,q*.45,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(-q*.12,-q*.12,q*.08,0,Math.PI*2);ctx.fill();break;
case'hatch':for(let k=-1;k<=1;k++){ctx.beginPath();ctx.moveTo(-q/2,k*q/3-q/2);ctx.lineTo(q/2,k*q/3+q/2);ctx.stroke()}break;
case'contour':{for(let ring=1;ring<=3;ring++){ctx.beginPath();ctx.ellipse(0,0,q*.16*ring,q*.12*ring,0,0,Math.PI*2);ctx.stroke()}break}
case'halfblocks':ctx.fillRect(-s/2,-s/2,s,s/2);ctx.fillStyle=color(c,alpha*.72);ctx.fillRect(-s/2,0,s,s/2);break;
default:ctx.fillRect(-s/2,-s/2,s,s)
}ctx.restore()}
function animateOffset(x,y,s,t){const intensity=Number(val('animIntensity'))/100,speed=Number(val('animSpeed'))/100;if(!$('animated').checked||reduced||intensity===0)return[0,0];const tt=t*speed*.001;switch(val('animStyle')){case'pulse':return[0,Math.sin(tt*2)*s*.13*intensity];case'shimmer':return[0,Math.sin(tt*3+x*.08)*s*.08*intensity];case'ripple':{const d=Math.hypot(x-w/2,y-h/2)/Math.max(w,h);return[Math.cos(tt*2-d*18)*s*.16*intensity,Math.sin(tt*2-d*18)*s*.16*intensity]}case'flicker':return[0,(Math.sin(tt*13+x*.1+y*.13)*.5)*s*.09*intensity];default:return[0,Math.sin(tt*1.7+x*.012+y*.006)*s*.2*intensity]}}
function render(t){if(!imageReady)return;const size=Number(val('cellSize'))*dpr,cols=Math.ceil(w/size),rows=Math.ceil(h/size);sctx.clearRect(0,0,w,h);if(pipeline.blurType==='off'){sctx.drawImage(sourceImage,0,0,w,h)}else{sctx.filter='blur('+pipeline.blurAmount/10+'px)';sctx.drawImage(sourceImage,0,0,w,h);sctx.filter='none'}let pixels;try{pixels=sctx.getImageData(0,0,w,h).data}catch(e){$('ascii-status').textContent='IMAGE BLOCKED';return}
ctx.globalCompositeOperation='source-over';if(val('bgMode')==='none'){ctx.clearRect(0,0,w,h)}else{ctx.fillStyle='#101114';ctx.fillRect(0,0,w,h)}
if(val('bgMode')==='original'){ctx.globalAlpha=pipeline.bgOpacity/100;ctx.drawImage(sourceImage,0,0,w,h);ctx.globalAlpha=1;ctx.fillStyle='rgba(8,9,12,.12)';ctx.fillRect(0,0,w,h)}
if(val('bgMode')==='blurred'){ctx.save();ctx.filter='blur('+pipeline.bgBlur+'px) brightness(.42)';ctx.globalAlpha=pipeline.bgOpacity/100;ctx.drawImage(sourceImage,-20,-20,w+40,h+40);ctx.restore()}

const mode=val('renderMode'),coverage=Number(val('coverage'))/100,blend='source-over';ctx.globalCompositeOperation=blend;
for(let gy=0;gy<rows;gy++){for(let gx=0;gx<cols;gx++){const x=gx*size,y=gy*size;if(((gx*17+gy*31)%997)/997>coverage)continue;let c=adjust(average(pixels,x,y,size)),l=lum(c);if($('invert').checked)l=1-l;const [ox,oy]=animateOffset(x,y,size,t);const pulse=$('animated').checked&&!reduced&&val('animStyle')==='flicker'?(Math.sin(t*.02+gx*2+gy)*.08):0;const edge=pipeline.edgeEmphasis?clamp(Math.abs(l-lum(average(pixels,x+size,y,size)))*pipeline.edgeEmphasis,0,.5):0;const cc=c.map(v=>clamp(v+pulse*255+edge*255,0,255));glyph(cc,l,x+ox,y+oy,size*(1+pipeline.density/100*.35),mode,t)}
}
ctx.globalCompositeOperation='source-over';
postEffects(t);applyLights();applyMask();
$('ascii-status').textContent=$('animated').checked&&!reduced?'LIVE / ANIMATED':'LIVE / STATIC';
}
function postEffects(t){const get=k=>document.querySelector('[data-pfx="'+k+'"]').checked?pfx[k]/100:0;const v=get('vignette');if(v){const g=ctx.createRadialGradient(w*.5,h*.48,Math.min(w,h)*.12,w*.5,h*.5,Math.max(w,h)*.72);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,'+v*.86+')');ctx.fillStyle=g;ctx.fillRect(0,0,w,h)}
const bloom=get('bloom');if(bloom){fxCanvas.width=w;fxCanvas.height=h;fxCtx.clearRect(0,0,w,h);fxCtx.drawImage(canvas,0,0);ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=bloom*.48;ctx.filter='blur('+Math.max(2,18*bloom)+'px)';ctx.drawImage(fxCanvas,0,0);ctx.restore();ctx.filter='none'}
const scan=get('scanLines');if(scan){ctx.fillStyle='rgba(0,0,0,'+(scan*.28)+')';for(let y=0;y<h;y+=Math.max(3,4*dpr))ctx.fillRect(0,y,w,1*dpr)}
const chrom=get('chromatic');if(chrom){const shift=Math.max(1,Math.round(chrom*5*dpr));fxCanvas.width=w;fxCanvas.height=h;fxCtx.drawImage(canvas,0,0);ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=chrom*.12;ctx.drawImage(fxCanvas,shift,0);ctx.globalCompositeOperation='multiply';ctx.globalAlpha=chrom*.09;ctx.drawImage(fxCanvas,-shift,0);ctx.restore()}
const grain=get('filmGrain');if(grain){const count=Math.floor(w*h/1600*grain);ctx.fillStyle='rgba(255,255,255,'+(grain*.22)+')';for(let i=0;i<count;i++){const x=Math.random()*w,y=Math.random()*h;ctx.fillRect(x,y,1*dpr,1*dpr)}}
const glitch=get('glitch');if(glitch&&Math.random()<glitch*.6){fxCanvas.width=w;fxCanvas.height=h;fxCtx.drawImage(canvas,0,0);const y=Math.random()*h,hh=Math.max(1,glitch*8*dpr);ctx.drawImage(fxCanvas,0,y,w,hh,(Math.random()-.5)*glitch*30*dpr,y,w,hh)}
const pixel=get('pixelate');if(pixel){const sw=Math.max(1,Math.floor(w/(1+pixel*7))),sh=Math.max(1,Math.floor(h/(1+pixel*7)));const tmp=document.createElement('canvas');tmp.width=sw;tmp.height=sh;tmp.getContext('2d').drawImage(canvas,0,0,sw,sh);ctx.imageSmoothingEnabled=false;ctx.drawImage(tmp,0,0,sw,sh,0,0,w,h);ctx.imageSmoothingEnabled=true}
const half=get('halftone');if(half){ctx.save();ctx.globalAlpha=half*.32;ctx.fillStyle='#000';const gap=7*dpr;for(let y=gap/2;y<h;y+=gap)for(let x=gap/2;x<w;x+=gap){ctx.beginPath();ctx.arc(x,y,gap*.12,0,Math.PI*2);ctx.fill()}ctx.restore()}
const dust=get('filmDust');if(dust){ctx.fillStyle='rgba(255,255,255,'+(dust*.45)+')';for(let i=0;i<Math.floor(70*dust);i++){ctx.beginPath();ctx.arc(Math.random()*w,Math.random()*h,Math.random()*1.8*dpr,0,Math.PI*2);ctx.fill()}}
}
function applyLights(){if(!pipeline.lights.enabled)return;for(const p of pipeline.lights.points){const x=p.x*w,y=p.y*h,r=p.radius*Math.max(w,h),g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(255,255,255,'+clamp(p.intensity,0,1)+')');g.addColorStop(1,'rgba(255,255,255,0)');ctx.globalCompositeOperation='screen';ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2)}ctx.globalCompositeOperation='source-over'}
function applyMask(){if(!maskImage)return;maskCanvas.width=w;maskCanvas.height=h;maskCtx.clearRect(0,0,w,h);maskCtx.drawImage(maskImage,0,0,w,h);const md=maskCtx.getImageData(0,0,w,h),mp=md.data;for(let i=0;i<mp.length;i+=4){let a=(.2126*mp[i]+.7152*mp[i+1]+.0722*mp[i+2]);if(maskInvert)a=255-a;mp[i+3]=a}maskCtx.putImageData(md,0,0);fxCanvas.width=w;fxCanvas.height=h;fxCtx.clearRect(0,0,w,h);fxCtx.drawImage(sourceImage,0,0,w,h);fxCtx.globalCompositeOperation='destination-in';fxCtx.drawImage(maskCanvas,0,0);fxCtx.globalCompositeOperation='source-over';ctx.drawImage(fxCanvas,0,0)}
function loop(t){if(t-last>30){render(t);last=t}raf=requestAnimationFrame(loop)}
function start(){cancelAnimationFrame(raf);if($('animated').checked&&!reduced)raf=requestAnimationFrame(loop);else render(performance.now())}
photo.onload=()=>{imageReady=true;loading.classList.add('is-hidden');fit();start()};
photo.onerror=()=>{loading.textContent='UPLOAD A PHOTO TO BEGIN';$('ascii-status').textContent='IMAGE UNAVAILABLE'};
$('ascii-upload').addEventListener('change',e=>{const file=e.target.files&&e.target.files[0];if(!file)return;const url=URL.createObjectURL(file),img=new Image();img.onload=()=>{sourceImage=img;imageReady=true;loading.classList.add('is-hidden');fit();URL.revokeObjectURL(url)};img.onerror=()=>{loading.textContent='COULD NOT LOAD IMAGE'};img.src=url});
['renderMode','bgMode','cellSize','coverage','invert','brightness','contrast','saturation','grayscale','tint','tintOpacity','animated','animStyle','animIntensity','animSpeed','charSet'].forEach(id=>$(id).addEventListener('input',()=>{const out=$(id+'Out');if(out){const suffix=id==='cellSize'?' px':id==='coverage'||id==='contrast'||id==='saturation'||id==='animIntensity'||id==='animSpeed'?'%':'';out.textContent=(id==='brightness'&&Number($(id).value)>0?'+':'')+$(id).value+suffix}start()}));
document.querySelectorAll('[data-pfx]').forEach(el=>el.addEventListener('change',start));
$('mask-upload').addEventListener('change',e=>{const file=e.target.files&&e.target.files[0];if(!file)return;const url=URL.createObjectURL(file),img=new Image();img.onload=()=>{maskImage=img;start();URL.revokeObjectURL(url)};img.src=url});
$('resetAscii').addEventListener('click',()=>{Object.entries(defaults).forEach(([k,v])=>{const el=$(k);if(!el)return;if(el.type==='checkbox')el.checked=v;else el.value=v});document.querySelectorAll('[data-pfx]').forEach(el=>el.checked=['vignette','bloom'].includes(el.dataset.pfx));['cellSize','coverage','brightness','contrast','saturation','grayscale','tintOpacity','animIntensity','animSpeed'].forEach(id=>$(id).dispatchEvent(new Event('input')));start()});
new ResizeObserver(()=>fit()).observe(canvas.parentElement);
if(reduced)$('animated').checked=false;
})();