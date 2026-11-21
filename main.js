(()=>{'use strict';
const d=document,root=d.documentElement,reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,coarse=matchMedia('(pointer:coarse)').matches;
root.classList.add('js-ready');

const progress=d.querySelector('.scroll-progress');const updateProgress=()=>{if(!progress)return;const max=d.documentElement.scrollHeight-innerHeight;progress.style.width=(max>0?Math.min(100,scrollY/max*100):0)+'%'};addEventListener('scroll',updateProgress,{passive:true});addEventListener('resize',updateProgress);updateProgress();
if(!reduce&&window.Lenis){const lenis=new Lenis({duration:1.1,easing:t=>1-Math.pow(1-t,3),smoothWheel:true});if(window.gsap&&window.ScrollTrigger){gsap.registerPlugin(ScrollTrigger);lenis.on('scroll',ScrollTrigger.update);gsap.ticker.add(t=>lenis.raf(t*1000));gsap.ticker.lagSmoothing(0)}else{const raf=t=>{lenis.raf(t);requestAnimationFrame(raf)};requestAnimationFrame(raf)}}

/* KarkiVerse immersive artwork: animated orbital silk sculpture + pointer/scroll parallax. */
const hero=d.querySelector('.hero');
if(hero){
  const art=d.createElement('canvas');art.className='hero-art-canvas';art.setAttribute('aria-hidden','true');hero.prepend(art);
  const c=art.getContext('2d');let w=0,h=0,dpr=1,mx=0,my=0,sy=0,frame=0,raf=0;
  const pointer=e=>{const r=hero.getBoundingClientRect();mx=((e.clientX-r.left)/r.width-.5);my=((e.clientY-r.top)/r.height-.5)};
  hero.addEventListener('pointermove',pointer,{passive:true});hero.addEventListener('pointerleave',()=>{mx=0;my=0});
  const resize=()=>{const r=hero.getBoundingClientRect();w=r.width;h=r.height;dpr=Math.min(devicePixelRatio||1,1.6);art.width=Math.round(w*dpr);art.height=Math.round(h*dpr);art.style.width=w+'px';art.style.height=h+'px';c.setTransform(dpr,0,0,dpr,0,0)};
  if('ResizeObserver'in window)new ResizeObserver(resize).observe(hero);else addEventListener('resize',resize);resize();
  const draw=()=>{
    frame+=.0032;const scroll= Math.max(-.5,Math.min(1, -hero.getBoundingClientRect().top/Math.max(h,1)));
    c.clearRect(0,0,w,h);
    const cx=w*(w<700?.70:.72)+mx*22,cy=h*.51+my*18+scroll*42,rx=Math.min(w*.29,h*.39),ry=Math.min(w*.35,h*.46);
    const glow=c.createRadialGradient(cx,cy,2,cx,cy,Math.max(rx,ry)*1.22);
    glow.addColorStop(0,'rgba(177,126,83,.17)');glow.addColorStop(.48,'rgba(164,79,56,.075)');glow.addColorStop(1,'rgba(164,79,56,0)');
    c.fillStyle=glow;c.fillRect(0,0,w,h);
    c.save();c.translate(cx,cy);c.rotate(Math.sin(frame*.7)*.09+mx*.08);
    for(let layer=0;layer<5;layer++){
      c.beginPath();const steps=260;
      for(let i=0;i<=steps;i++){
        const t=i/steps*Math.PI*2,turn=t*2.35+frame+layer*.42;
        const wave=Math.sin(t*3+frame*1.7+layer)*.11;
        const x=Math.cos(t+frame*.24+layer*.13)*rx*(.68+layer*.085+wave)+Math.cos(turn)*rx*.12;
        const y=Math.sin(t+frame*.19+layer*.1)*ry*(.67+layer*.07)+Math.sin(turn*1.3)*ry*.12;
        if(i===0)c.moveTo(x,y);else c.lineTo(x,y);
      }
      c.closePath();c.strokeStyle=['rgba(164,79,56,.35)','rgba(91,101,75,.30)','rgba(185,143,99,.34)','rgba(74,83,64,.22)','rgba(164,79,56,.20)'][layer];c.lineWidth=layer===2?1.25:.8;c.stroke();
    }
    for(let i=0;i<34;i++){
      const a=i/34*Math.PI*2+frame*.22,rad=1+Math.sin(frame*1.4+i)*.025;
      const x=Math.cos(a)*rx*.78*rad,y=Math.sin(a)*ry*.78*rad;
      c.beginPath();c.arc(x,y,1.1+(i%4)*.25,0,Math.PI*2);c.fillStyle=i%3?'rgba(91,101,75,.38)':'rgba(164,79,56,.48)';c.fill();
    }
    c.restore();
    if(!reduce)raf=requestAnimationFrame(draw);
  };
  if(!reduce)draw();else{frame=0;draw()}
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelAnimationFrame(raf);else if(!reduce){cancelAnimationFrame(raf);raf=requestAnimationFrame(draw)}});
}

const pre=d.querySelector('.preloader');if(pre){let n=0;const count=pre.querySelector('.preloader-count');const tick=()=>{n=Math.min(100,n+4);if(count)count.textContent=String(n).padStart(3,'0');if(n<100){setTimeout(tick,18)}else{setTimeout(()=>{pre.style.transition='transform 900ms cubic-bezier(.22,1,.36,1)';pre.style.transform='translateY(-100%)';setTimeout(()=>pre.remove(),950)},100)}};tick()}
if(!reduce&&window.gsap){const title=d.querySelector('.hero-wordmark');if(title)gsap.from(title,{yPercent:105,opacity:0,duration:1.15,ease:'power3.out',delay:.18});d.querySelectorAll('.page-title .title-line').forEach(el=>gsap.from(el,{yPercent:110,opacity:0,duration:1,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 88%'}}));d.querySelectorAll('.intro-statement').forEach(el=>gsap.from(el,{y:28,opacity:0,duration:1.1,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 88%'}}));d.querySelectorAll('.world-row,.photo,.game-panel,.voice-tool,.ai-feature').forEach((el,i)=>gsap.from(el,{y:34,opacity:0,duration:.9,delay:(i%3)*.06,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 92%'}}));}
/* Custom cursor intentionally disabled: keep native pointer behaviour accessible. */
if(!coarse&&!reduce){d.querySelectorAll('.action-button').forEach(el=>{el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect();el.style.transform='translate('+((e.clientX-r.left-r.width/2)*.06)+'px,'+((e.clientY-r.top-r.height/2)*.08)+'px)'});el.addEventListener('pointerleave',()=>{el.style.transform=''})})}
d.querySelectorAll('a[href]').forEach(a=>{let u;try{u=new URL(a.href,location.href)}catch(_){return}if(u.origin!==location.origin||a.target==='_blank'||a.hash||a.hasAttribute('download'))return;a.addEventListener('click',e=>{if(reduce)return;const curtain=d.querySelector('.page-curtain');if(!curtain)return;e.preventDefault();curtain.style.transition='transform 700ms cubic-bezier(.22,1,.36,1)';curtain.style.transform='translateY(0)';setTimeout(()=>location.href=u.href,700)})});
const viewer=d.querySelector('.photo-viewer');if(viewer){const photos=[...d.querySelectorAll('.photo img')],large=viewer.querySelector('img'),caption=viewer.querySelector('.viewer-caption');let current=0;const show=i=>{current=(i+photos.length)%photos.length;large.src=photos[current].src;large.alt=photos[current].alt;caption.textContent=photos[current].closest('figure').querySelector('figcaption').textContent.trim()};d.querySelectorAll('[data-photo]').forEach(b=>b.addEventListener('click',()=>{show(Number(b.dataset.photo));viewer.showModal()}));viewer.querySelector('.viewer-close').addEventListener('click',()=>viewer.close());viewer.querySelector('[data-viewer-prev]').addEventListener('click',()=>show(current-1));viewer.querySelector('[data-viewer-next]').addEventListener('click',()=>show(current+1));viewer.addEventListener('click',e=>{if(e.target===viewer)viewer.close()})}
const voiceSelect=d.querySelector('#speech-voice'),deepSelect=d.querySelector('#speech-deep'),voiceStatus=d.querySelector('#voice-status');if(voiceSelect&&'speechSynthesis'in window){const loadVoices=()=>{const voices=speechSynthesis.getVoices();voiceSelect.innerHTML='';voices.forEach((v,i)=>voiceSelect.add(new Option(v.name+' ('+v.lang+')',String(i))));const en=voices.findIndex(v=>v.lang.toLowerCase().startsWith('en'));if(en>=0)voiceSelect.value=String(en);if(!voices.length)voiceSelect.add(new Option('Default device voice',''))};loadVoices();speechSynthesis.addEventListener('voiceschanged',loadVoices);d.querySelector('#speak-button').addEventListener('click',()=>{const text=d.querySelector('#speech-text').value.trim();if(!text){voiceStatus.textContent='Type something first.';return}speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text),voices=speechSynthesis.getVoices();if(voiceSelect.value!==''&&voices[Number(voiceSelect.value)])utterance.voice=voices[Number(voiceSelect.value)];if(deepSelect.value==='deep'){utterance.rate=.94;utterance.pitch=.78}else{utterance.rate=1;utterance.pitch=1}utterance.onstart=()=>voiceStatus.textContent='Speaking…';utterance.onend=()=>voiceStatus.textContent='Finished.';utterance.onerror=()=>voiceStatus.textContent='Speech could not be played in this browser.';voiceStatus.textContent='Preparing voice…';speechSynthesis.speak(utterance)});d.querySelector('#stop-button').addEventListener('click',()=>{speechSynthesis.cancel();voiceStatus.textContent='Stopped.'})}else if(voiceSelect){voiceSelect.innerHTML='<option>Speech synthesis is not available in this browser.</option>';}
const snakeCanvas=d.querySelector('#snake-board');if(snakeCanvas){const ctx=snakeCanvas.getContext('2d'),size=20,cell=20;let snake=[{x:9,y:10},{x:8,y:10},{x:7,y:10}],dir={x:1,y:0},next={x:1,y:0},food={x:14,y:10},score=0,timer=null,running=false;const status=d.querySelector('#snake-status'),scoreEl=d.querySelector('#snake-score');function placeFood(){do{food={x:Math.floor(Math.random()*size),y:Math.floor(Math.random()*size)}}while(snake.some(p=>p.x===food.x&&p.y===food.y))}function paint(){ctx.fillStyle='#101012';ctx.fillRect(0,0,400,400);ctx.strokeStyle='#202024';ctx.lineWidth=1;for(let i=1;i<size;i++){ctx.beginPath();ctx.moveTo(i*cell,0);ctx.lineTo(i*cell,400);ctx.stroke();ctx.beginPath();ctx.moveTo(0,i*cell);ctx.lineTo(400,i*cell);ctx.stroke()}ctx.fillStyle='#f4f2ee';snake.forEach((p,i)=>{ctx.fillRect(p.x*cell+2,p.y*cell+2,cell-4,cell-4)});ctx.fillStyle='#8a8a8f';ctx.fillRect(food.x*cell+4,food.y*cell+4,cell-8,cell-8)}function step(){dir=next;const head={x:snake[0].x+dir.x,y:snake[0].y+dir.y};if(head.x<0||head.y<0||head.x>=size||head.y>=size||snake.some(p=>p.x===head.x&&p.y===head.y)){stop();status.textContent='Game over. Start again?';return}snake.unshift(head);if(head.x===food.x&&head.y===food.y){score++;scoreEl.textContent=String(score).padStart(3,'0');placeFood()}else snake.pop();paint()}function stop(){clearInterval(timer);timer=null;running=false}function start(){stop();snake=[{x:9,y:10},{x:8,y:10},{x:7,y:10}];dir=next={x:1,y:0};score=0;scoreEl.textContent='000';placeFood();status.textContent='Use arrow keys or the controls.';running=true;timer=setInterval(step,115);paint()}function turn(x,y){if(x!==-dir.x||y!==-dir.y)next={x,y}}d.querySelector('#snake-start').addEventListener('click',start);d.querySelectorAll('[data-dir]').forEach(b=>b.addEventListener('click',()=>{const map={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};turn(...map[b.dataset.dir])}));addEventListener('keydown',e=>{if(!snakeCanvas.isConnected||!running)return;const map={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]};if(map[e.key]){e.preventDefault();turn(...map[e.key])}});paint()}
if(d.getElementById('flappyCanvas')){
const flappyCanvas = document.getElementById("flappyCanvas");
const fctx = flappyCanvas.getContext("2d");

let bird = {x:80,y:220,velocity:0};
let pipes = [];
let flappyScore = 0;
let flappyRunning = false;
let flappyStarted = false;
let flappyFrame = null;
let pipeTimer = 0;

function drawFlappy() {
  fctx.fillStyle = "#70c5ce";
  fctx.fillRect(0,0,360,480);

  fctx.fillStyle = "#ffffff";
  fctx.beginPath();
  fctx.arc(65,75,20,0,Math.PI*2);
  fctx.arc(90,70,27,0,Math.PI*2);
  fctx.arc(115,77,19,0,Math.PI*2);
  fctx.fill();

  fctx.beginPath();
  fctx.arc(245,140,17,0,Math.PI*2);
  fctx.arc(270,132,24,0,Math.PI*2);
  fctx.arc(293,142,17,0,Math.PI*2);
  fctx.fill();

  pipes.forEach(p=>{
    fctx.fillStyle = "#73bf2e";
    fctx.fillRect(p.x,0,55,p.top);
    fctx.fillRect(p.x,p.bottom,55,480-p.bottom);

    fctx.fillStyle = "#4c9822";
    fctx.fillRect(p.x-4,p.top-18,63,18);
    fctx.fillRect(p.x-4,p.bottom,63,18);
  });

  fctx.fillStyle = "#ded895";
  fctx.fillRect(0,460,360,20);
  fctx.fillStyle = "#8bc34a";
  fctx.fillRect(0,455,360,7);

  fctx.fillStyle = "#ffdf00";
  fctx.beginPath();
  fctx.arc(bird.x,bird.y,15,0,Math.PI*2);
  fctx.fill();

  fctx.fillStyle = "#f4a900";
  fctx.beginPath();
  fctx.ellipse(bird.x-5,bird.y+5,8,5,-.3,0,Math.PI*2);
  fctx.fill();

  fctx.fillStyle = "white";
  fctx.beginPath();
  fctx.arc(bird.x+6,bird.y-6,5,0,Math.PI*2);
  fctx.fill();

  fctx.fillStyle = "#111";
  fctx.beginPath();
  fctx.arc(bird.x+8,bird.y-6,2,0,Math.PI*2);
  fctx.fill();

  fctx.fillStyle = "#ff7800";
  fctx.beginPath();
  fctx.moveTo(bird.x+12,bird.y);
  fctx.lineTo(bird.x+25,bird.y+4);
  fctx.lineTo(bird.x+12,bird.y+8);
  fctx.fill();

  if(!flappyRunning) {
    fctx.fillStyle = "#ffffff";
    fctx.font = "bold 23px Arial";
    fctx.textAlign = "center";
    fctx.fillText(
      flappyStarted ? "GAME OVER" : "FLAPPY BIRD",
      180,210
    );
    fctx.font = "15px Arial";
    fctx.fillText(
      flappyStarted ? "Press Start to play again" : "Tap Start, then tap to fly!",
      180,240
    );
  }
}

function startFlappy() {
  cancelAnimationFrame(flappyFrame);

  bird = {x:80,y:220,velocity:0};
  pipes = [];
  flappyScore = 0;
  pipeTimer = 0;
  flappyRunning = true;
  flappyStarted = true;

  document.getElementById("flappyScore").textContent = 0;
  document.getElementById("flappyStatus").textContent = "Fly!";
  drawFlappy();
  flappyLoop();
}

function flap() {
  if(!flappyRunning) {
    if(!flappyStarted) startFlappy();
    else return;
  }

  bird.velocity = -6.5;
}

function flappyLoop() {
  if(!flappyRunning) return;

  bird.velocity += 0.32;
  bird.y += bird.velocity;

  pipeTimer++;

  if(pipeTimer>95) {
    const top = 65+Math.random()*190;
    pipes.push({
      x:370,
      top:top,
      bottom:top+145,
      scored:false
    });
    pipeTimer = 0;
  }

  pipes.forEach(p=>{
    p.x -= 2.4;

    if(!p.scored && p.x+55<bird.x) {
      p.scored = true;
      flappyScore++;
      document.getElementById("flappyScore").textContent = flappyScore;
    }

    const hitPipe =
      bird.x+12>p.x &&
      bird.x-12<p.x+55 &&
      (bird.y-12<p.top || bird.y+12>p.bottom);

    if(hitPipe) endFlappy();
  });

  pipes = pipes.filter(p=>p.x>-70);

  if(bird.y>445 || bird.y<0) endFlappy();

  if(flappyRunning) {
    drawFlappy();
    flappyFrame = requestAnimationFrame(flappyLoop);
  }
}

function endFlappy() {
  flappyRunning = false;
  document.getElementById("flappyStatus").textContent =
    "Game Over! Your score: "+flappyScore;
  drawFlappy();
}

flappyCanvas.addEventListener("pointerdown",e=>{
  e.preventDefault();
  if(flappyRunning) flap();
});

document.addEventListener("keydown",e=>{
  if(e.code==="Space") {
    const active = document.activeElement;
    if(active && active.tagName==="BUTTON") return;
    e.preventDefault();
    flap();
  }
});

d.getElementById("flappy-start").addEventListener("click",startFlappy);
d.getElementById("flappy-flap").addEventListener("click",flap);
drawFlappy();
}
const board=d.querySelector('#board-2048');if(board){let grid,score=0;const scoreNode=d.getElementById('2048-score'),status=d.getElementById('2048-status');function spawn(){const empty=[];grid.forEach((row,y)=>row.forEach((v,x)=>{if(!v)empty.push([x,y])}));if(empty.length){const [x,y]=empty[Math.floor(Math.random()*empty.length)];grid[y][x]=Math.random()<.9?2:4}}function render(){board.innerHTML='';grid.flat().forEach(v=>{const cell=d.createElement('div');cell.className='tile-2048';cell.dataset.value=String(v);cell.textContent=v||'';cell.setAttribute('role','gridcell');board.append(cell)});scoreNode.textContent=String(score).padStart(3,'0')}function reset(){grid=Array.from({length:4},()=>[0,0,0,0]);score=0;spawn();spawn();status.textContent='Make your first move.';render()}function move(dir){let changed=false;for(let i=0;i<4;i++){let vals=[];for(let j=0;j<4;j++){const x=dir==='left'?j:dir==='right'?3-j:i,y=dir==='up'?j:dir==='down'?3-j:i;vals.push(grid[y][x])}const compact=vals.filter(Boolean);for(let k=0;k<compact.length-1;k++){if(compact[k]===compact[k+1]){compact[k]*=2;score+=compact[k];compact.splice(k+1,1)}}while(compact.length<4)compact.push(0);for(let j=0;j<4;j++){const x=dir==='left'?j:dir==='right'?3-j:i,y=dir==='up'?j:dir==='down'?3-j:i;if(grid[y][x]!==compact[j])changed=true;grid[y][x]=compact[j]}}if(changed){spawn();render();if(grid.some(row=>row.includes(2048)))status.textContent='2048 — nice work.';else status.textContent='Keep going.'}}d.getElementById('2048-new').addEventListener('click',reset);addEventListener('keydown',e=>{if(!board.isConnected)return;const map={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'};if(map[e.key]&&d.activeElement.tagName!=='TEXTAREA'){e.preventDefault();move(map[e.key])}});let touch=null;board.addEventListener('touchstart',e=>{touch=[e.touches[0].clientX,e.touches[0].clientY]},{passive:true});board.addEventListener('touchend',e=>{if(!touch)return;const dx=e.changedTouches[0].clientX-touch[0],dy=e.changedTouches[0].clientY-touch[1];if(Math.max(Math.abs(dx),Math.abs(dy))>24)move(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up'));touch=null},{passive:true});reset()}
const rps=d.querySelectorAll('[data-rps]');if(rps.length){let wins=0;const result=d.querySelector('#rps-result'),computer=d.querySelector('#rps-computer'),winsNode=d.querySelector('#rps-wins');rps.forEach(b=>b.addEventListener('click',()=>{const user=b.dataset.rps,choices=['rock','paper','scissors'],cpu=choices[Math.floor(Math.random()*3)];computer.textContent='COMPUTER: '+cpu.toUpperCase();if(user===cpu)result.textContent='It’s a draw.';else if((user==='rock'&&cpu==='scissors')||(user==='paper'&&cpu==='rock')||(user==='scissors'&&cpu==='paper')){wins++;winsNode.textContent=String(wins).padStart(3,'0');result.textContent='You win this round.'}else result.textContent='Computer wins this round.'}))}
})();