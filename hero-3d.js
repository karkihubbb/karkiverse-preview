(()=>{'use strict';
const canvas=document.getElementById('hero-world-canvas');
if(!canvas)return;
const fallback=()=>{canvas.style.background='radial-gradient(ellipse at 50% 52%,rgba(95,102,116,.22),transparent 58%),radial-gradient(ellipse at 80% 20%,rgba(126,58,46,.09),transparent 38%)';};
if(!window.THREE){fallback();return;}
try{
 const THREE=window.THREE;
 const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.6));
 renderer.setClearColor(0x000000,0);
 const scene=new THREE.Scene();
 const camera=new THREE.PerspectiveCamera(48,1,.1,100);
 camera.position.set(0,0,8.4);
 const uniforms={
  uTime:{value:0},
  uPointer:{value:new THREE.Vector2(.5,.5)},
  uPointerOn:{value:0},
  uResolution:{value:new THREE.Vector2(1,1)}
 };
 const material=new THREE.ShaderMaterial({
  transparent:true,depthWrite:false,uniforms,
  vertexShader:`
   uniform float uTime;
   uniform vec2 uPointer;
   uniform float uPointerOn;
   varying vec2 vUv;
   varying float vDepth;
   void main(){
    vUv=uv;
    vec3 p=position;
    vec2 pointer=(uPointer-.5)*vec2(16.0,9.0);
    float d=distance(p.xy,pointer);
    float influence=exp(-d*d*.16)*uPointerOn;
    float wave=sin(p.x*.72+uTime*.42)*.20+cos(p.y*.9-uTime*.32)*.14;
    float ripple=sin(d*2.6-uTime*1.7)*.38*influence;
    p.z+=wave+ripple+influence*.48;
    p.x+= (p.x-pointer.x)*influence*.018;
    p.y+= (p.y-pointer.y)*influence*.018;
    vDepth=p.z;
    gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
   }`,
  fragmentShader:`
   uniform float uTime;
   uniform vec2 uPointer;
   uniform float uPointerOn;
   varying vec2 vUv;
   varying float vDepth;
   float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
   float line(float v,float at,float w){return 1.0-smoothstep(w,w+.018,abs(v-at));}
   void main(){
    vec2 grid=vUv*vec2(128.0,72.0);
    vec2 id=floor(grid);
    vec2 f=fract(grid);
    float seed=hash(id);
    float glyph=0.0;
    float style=floor(seed*5.0);
    if(style<1.0){
      glyph=max(line(f.x,.25,.055),max(line(f.y,.22,.045),line(f.y,.76,.045)));
      glyph*=step(.12,f.x)*step(f.x,.86);
    }else if(style<2.0){
      glyph=max(line(f.x,.5,.06),line(f.y,.5,.06));
    }else if(style<3.0){
      glyph=max(line(f.y,.25,.045),line(f.y,.72,.045));
      glyph*=step(.18,f.x)*step(f.x,.82);
    }else if(style<4.0){
      glyph=1.0-smoothstep(.12,.2,distance(f,vec2(.5)));
      glyph*=step(.36,seed);
    }else{
      glyph=max(line(f.x,.28,.045),line(f.x,.72,.045));
      glyph*=step(.15,f.y)*step(f.y,.85);
    }
    float field=0.55+0.45*sin(id.x*.035+id.y*.022+uTime*.22);
    vec2 p=(vUv-uPointer)*vec2(1.0,.72);
    float cursorGlow=exp(-dot(p,p)*17.0)*uPointerOn;
    float depth=clamp(.72+vDepth*.18,0.35,1.0);
    float alpha=glyph*(.16+field*.24+cursorGlow*.45)*depth;
    vec3 cool=vec3(.64,.68,.72);
    vec3 warm=vec3(.82,.35,.24);
    vec3 col=mix(cool,warm,clamp(cursorGlow*.55+step(.94,seed)*.12,0.0,.5));
    gl_FragColor=vec4(col,alpha);
   }`
 });
 const geometry=new THREE.PlaneGeometry(16,9,180,112);
 const field=new THREE.Mesh(geometry,material);
 scene.add(field);
 function resize(){
  const w=window.innerWidth,h=window.innerHeight,aspect=w/h;
  renderer.setSize(w,h,false);
  camera.aspect=aspect;
  camera.position.z=8.4;
  camera.updateProjectionMatrix();
  const visibleH=2*camera.position.z*Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
  const visibleW=visibleH*aspect;
  field.scale.set(visibleW/16,visibleH/9,1);
  uniforms.uResolution.value.set(w,h);
 }
 let px=.5,py=.5,active=0,lastMove=0,raf=0;
 function pointer(e){px=e.clientX/window.innerWidth;py=1-e.clientY/window.innerHeight;active=1;lastMove=performance.now();}
 window.addEventListener('pointermove',pointer,{passive:true});
 window.addEventListener('pointerleave',()=>{active=0;},{passive:true});
 window.addEventListener('resize',resize,{passive:true});
 resize();
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 function tick(now){
  uniforms.uTime.value=reduced?0:now*.001;
  uniforms.uPointer.value.set(px,py);
  if(now-lastMove>1600)active=Math.max(0,active-.008);
  uniforms.uPointerOn.value=active;
  renderer.render(scene,camera);
  raf=requestAnimationFrame(tick);
 }
 if(!reduced)raf=requestAnimationFrame(tick);else{uniforms.uPointerOn.value=0;renderer.render(scene,camera);}
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);}else if(!reduced){raf=requestAnimationFrame(tick);}});
}catch(err){console.warn('3D background unavailable:',err);fallback();}
})();