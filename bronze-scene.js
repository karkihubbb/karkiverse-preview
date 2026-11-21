import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { GLTFLoader } from "https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

(() => {
  "use strict";
  const ASSET_BASE_URL = "https://api.getlayers.ai/storage/v1/object/public/public/assets/laocoon-59f84455c6";
  const canvas = document.querySelector("#webgl");
  const hero = document.querySelector("#cinematic-hero");
  if (!canvas || !hero) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer:fine)").matches;
  const clock = new THREE.Clock();
  const sizes = { width: innerWidth, height: innerHeight };
  let scene, camera, renderer, modelPivot, gltfModel, mixer, sparkParticles, bgMaterial;
  let currentScroll = 0, mouseX = 0, mouseY = 0, targetMouseX = 0, targetMouseY = 0;
  let cursorX = innerWidth / 2, cursorY = innerHeight / 2;
  let outerCursorX = cursorX, outerCursorY = cursorY;
  const sparkCount = 450, sparkData = [];
  const shaderUniforms = {
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(innerWidth, innerHeight) },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uScroll: { value: 0 }
  };

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const smoothstep = (a, b, x) => { const t = clamp((x-a)/(b-a),0,1); return t*t*(3-2*t); };

  function createBackgroundShader() {
    const vertexShader = `
      varying vec2 vUv;
      void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}
    `;
    const fragmentShader = `
      varying vec2 vUv;
      uniform float uTime;
      uniform vec2 uResolution;
      uniform vec2 uMouse;
      uniform float uScroll;
      float hash(float n){return fract(sin(n)*43758.5453123);}
      float noise(in vec3 x){
        vec3 p=floor(x),f=fract(x);f=f*f*(3.0-2.0*f);
        float n=p.x+p.y*57.0+113.0*p.z;
        return mix(mix(mix(hash(n),hash(n+1.0),f.x),mix(hash(n+57.0),hash(n+58.0),f.x),f.y),
          mix(mix(hash(n+113.0),hash(n+114.0),f.x),mix(hash(n+170.0),hash(n+171.0),f.x),f.y),f.z);
      }
      void main(){
        vec2 uv=(gl_FragCoord.xy-.5*uResolution.xy)/uResolution.y;
        float aspect=uResolution.x/uResolution.y;
        float time=uTime*.08,scroll=uScroll;
        float angle1=.6,angle2=-.7,angle3=1.2;
        float freq1=2.4,freq2=3.2,freq3=4.0;
        vec2 warpedUv=uv;
        float scrollDeform=scroll*5.0;
        warpedUv.x+=sin(uv.y*2.5+time*.2+scrollDeform)*.35;
        warpedUv.y+=cos(uv.x*2.5-time*.15-scrollDeform*.8)*.35;
        warpedUv.x+=sin(uv.y*1.2-time*.1-scrollDeform*1.5)*.25;
        warpedUv.y+=cos(uv.x*1.2+time*.18+scrollDeform*1.2)*.25;
        vec2 scrollDrift=vec2(scroll*.04,-scroll*.02);
        vec2 mouseShift=vec2(uMouse.x*aspect*.05,uMouse.y*.05);
        warpedUv+=scrollDrift+mouseShift;
        vec2 dir1=vec2(cos(angle1),sin(angle1)),dir2=vec2(cos(angle2),sin(angle2)),dir3=vec2(cos(angle3),sin(angle3));
        float w1=sin(dot(warpedUv,dir1)*freq1+time);
        float w2=cos(dot(warpedUv,dir2)*freq2-time*1.4+w1*.4);
        float w3=sin(dot(warpedUv,dir3)*freq3+time*1.8+w2*.5);
        float waveField=w1*.50+w2*.35+w3*.15;
        float wideSheen=pow(max(0.0,1.0-abs(waveField-.1)),2.5);
        float crispSpecular=pow(max(0.0,1.0-abs(waveField-.15)),8.0);
        float crest=wideSheen*.5+crispSpecular*.9;
        vec3 c0_shadow=vec3(.0010,.0006,.0004),c0_wave1=vec3(.085,.040,.015),c0_wave2=vec3(.050,.022,.008),c0_crest=vec3(.45,.30,.18);
        vec3 c1_shadow=vec3(.0004,.0006,.0012),c1_wave1=vec3(.015,.035,.065),c1_wave2=vec3(.008,.020,.045),c1_crest=vec3(.18,.35,.55);
        float t=smoothstep(0.0,1.0,scroll);
        vec3 colShadow=mix(c0_shadow,c1_shadow,t),colWave1=mix(c0_wave1,c1_wave1,t),colWave2=mix(c0_wave2,c1_wave2,t),colCrest=mix(c0_crest,c1_crest,t);
        vec3 color=colShadow;
        color=mix(color,colWave2,smoothstep(-.6,.2,waveField));
        color=mix(color,colWave1,smoothstep(0.0,.8,waveField));
        color+=colCrest*crest*1.4;
        float vignette=1.0-dot(uv,uv)*.12;
        color*=vignette;
        gl_FragColor=vec4(color,1.0);
      }
    `;
    bgMaterial = new THREE.ShaderMaterial({
      vertexShader, fragmentShader, uniforms: shaderUniforms,
      depthWrite: false, depthTest: false
    });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(30,30), bgMaterial);
    plane.position.set(0,0,-8);
    plane.renderOrder = -10;
    camera.add(plane);
  }

  function createSparkTexture() {
    const c = document.createElement("canvas"); c.width = c.height = 16;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(8,8,0,8,8,8);
    g.addColorStop(0,"rgba(255,255,255,1)");
    g.addColorStop(.25,"rgba(255,255,255,.85)");
    g.addColorStop(.6,"rgba(255,255,255,.3)");
    g.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=g;ctx.fillRect(0,0,16,16);
    return new THREE.CanvasTexture(c);
  }

  function createSparks() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(sparkCount*3);
    const colors = new Float32Array(sparkCount*3);
    for(let i=0;i<sparkCount;i++){
      positions[i*3]=(Math.random()-.5)*6.5;
      positions[i*3+1]=(Math.random()-.5)*5-.5;
      positions[i*3+2]=(Math.random()-.5)*6.5;
      if(Math.random()<.6){
        colors[i*3]=1;colors[i*3+1]=.4+Math.random()*.15;colors[i*3+2]=.05+Math.random()*.1;
      }else{
        colors[i*3]=.55+Math.random()*.15;colors[i*3+1]=.82+Math.random()*.12;colors[i*3+2]=1;
      }
      sparkData.push({
        speedX:(Math.random()-.5)*.4,speedY:.15+Math.random()*.3,speedZ:(Math.random()-.5)*.4,
        swaySpeed:.5+Math.random()*1.5,swayRadius:.05+Math.random()*.15,phase:Math.random()*Math.PI*2
      });
    }
    geometry.setAttribute("position",new THREE.BufferAttribute(positions,3));
    geometry.setAttribute("color",new THREE.BufferAttribute(colors,3));
    const material = new THREE.PointsMaterial({
      size:.025,vertexColors:true,transparent:true,opacity:.85,
      blending:THREE.AdditiveBlending,depthWrite:false,map:createSparkTexture()
    });
    sparkParticles = new THREE.Points(geometry,material);
    scene.add(sparkParticles);
  }

  function loadModel() {
    const loader = new GLTFLoader();
    loader.load(ASSET_BASE_URL+"/bronze_horse.glb", gltf => {
      gltfModel = gltf.scene;
      modelPivot = new THREE.Group();
      scene.add(modelPivot);modelPivot.add(gltfModel);
      gltfModel.traverse(child=>{
        if(!child.isMesh)return;
        child.castShadow=true;child.receiveShadow=true;
        const mats=Array.isArray(child.material)?child.material:[child.material];
        mats.forEach(mat=>{
          if(!mat)return;
          mat.roughness=.42;mat.metalness=.92;mat.flatShading=false;
          if(mat.map)mat.map.anisotropy=renderer.capabilities.getMaxAnisotropy();
          mat.needsUpdate=true;
        });
      });
      if(gltf.animations?.length){
        mixer=new THREE.AnimationMixer(gltfModel);
        gltf.animations.forEach(clip=>mixer.clipAction(clip).play());
      }
      const initial=new THREE.Box3().setFromObject(gltfModel);
      const size=initial.getSize(new THREE.Vector3());
      const maxDim=Math.max(size.x,size.y,size.z);
      gltfModel.scale.setScalar(3.5/(maxDim>.0001?maxDim:1));
      gltfModel.updateMatrixWorld(true);
      const center=new THREE.Box3().setFromObject(gltfModel).getCenter(new THREE.Vector3());
      gltfModel.position.sub(center);
      modelPivot.position.y=-.4;
    },undefined,error=>console.warn("Bronze sculpture could not be loaded:",error));
  }

  function createScene() {
    scene=new THREE.Scene();
    scene.background=new THREE.Color("#000000");
    scene.fog=new THREE.FogExp2("#000000",.01);
    camera=new THREE.PerspectiveCamera(50,sizes.width/sizes.height,.1,100);
    camera.position.set(0,.2,3);scene.add(camera);
    createBackgroundShader();
    renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:"high-performance"});
    renderer.setSize(sizes.width,sizes.height);
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
    renderer.shadowMap.enabled=true;
    renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=2.2;
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    scene.add(new THREE.AmbientLight("#ffffff",.1));
    const key=new THREE.SpotLight("#ffffff",18);
    key.position.set(4,6,3);key.angle=Math.PI/4;key.penumbra=.9;key.castShadow=true;
    key.shadow.mapSize.set(1024,1024);key.shadow.camera.near=1;key.shadow.camera.far=15;key.shadow.bias=-.001;
    scene.add(key);
    const rim=new THREE.DirectionalLight("#e3f2ff",10);rim.position.set(-5,3,-4);scene.add(rim);
    const fill=new THREE.DirectionalLight("#fff3e6",.8);fill.position.set(-2,-4,2);scene.add(fill);
    createSparks();
    loadModel();
  }

  function splitTitles() {
    document.querySelectorAll(".slide-title").forEach(title=>{
      const parts=title.innerHTML.split(/(<br\s*\/?\s*>)/i);
      let html="",index=0;
      parts.forEach(part=>{
        if(/^<br/i.test(part)){html+=part;return;}
        for(const ch of part){
          if(ch===" "){html+=" ";continue;}
          html+='<span class="char" style="transition-delay:'+index*.035+'s">'+ch.replace(/&/g,"&amp;").replace(/</g,"&lt;")+'</span>';
          index++;
        }
      });
      title.innerHTML=html;
    });
  }

  function updateSlides(scroll) {
    const ranges=[[0,-.1,.12],[1,.28,.4],[2,.56,.68],[3,.84,1.05]];
    ranges.forEach(([idx,start,end])=>{
      const el=document.getElementById("slide-"+(idx+1));
      if(el)el.classList.toggle("active",scroll>=start&&scroll<=end);
      if(idx===1){
        const image=document.getElementById("slide-2-img");
        if(image)image.classList.toggle("active",scroll>=start&&scroll<=end);
      }
      const fill=document.getElementById("dash-fill-"+(idx+1));
      if(fill)fill.style.height=(clamp((scroll-start)/(end-start),0,1)*100)+"%";
    });
  }

  function updateDots(scroll) {
    document.querySelectorAll(".grid-dot").forEach((dot,i)=>{
      let speed=90+(i*55)%180;if(i%2===0)speed=-speed;
      let y=( ((i*17)%80+10)+scroll*speed )%100;
      dot.style.top=((y+100)%100)+"%";
    });
  }

  function onResize() {
    sizes.width=innerWidth;sizes.height=innerHeight;
    if(!camera||!renderer)return;
    camera.aspect=sizes.width/sizes.height;camera.updateProjectionMatrix();
    renderer.setSize(sizes.width,sizes.height);
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
    shaderUniforms.uResolution.value.set(sizes.width,sizes.height);
  }

  function animate() {
    requestAnimationFrame(animate);
    const dt=Math.min(clock.getDelta(),.05);
    if(mixer)mixer.update(dt);
    const maxScroll=Math.max(1,hero.offsetHeight-innerHeight);
    const targetScroll=clamp(scrollY/maxScroll,0,1);
    currentScroll+=(targetScroll-currentScroll)*.025;
    mouseX+=(targetMouseX-mouseX)*.05;
    mouseY+=(targetMouseY-mouseY)*.05;
    outerCursorX+=(cursorX-outerCursorX)*.2;
    outerCursorY+=(cursorY-outerCursorY)*.2;
    const outer=document.querySelector(".cursor-outer");
    if(outer&&finePointer){outer.style.left=outerCursorX+"px";outer.style.top=outerCursorY+"px";}
    if(modelPivot){modelPivot.rotation.y=mouseX*.25;modelPivot.rotation.x=mouseY*.15;}
    if(sparkParticles){
      const p=sparkParticles.geometry.attributes.position.array;
      const time=clock.elapsedTime,velocity=Math.abs(targetScroll-currentScroll);
      const multiplier=1+velocity*9,turbulence=velocity*.8;
      for(let i=0;i<sparkCount;i++){
        const k=i*3,d=sparkData[i];
        p[k]+=d.speedX*dt*multiplier;p[k+1]+=d.speedY*dt*multiplier;p[k+2]+=d.speedZ*dt*multiplier;
        const sway=d.swayRadius*(1+turbulence*4);
        p[k]+=Math.sin(time*d.swaySpeed+d.phase)*sway*dt;
        p[k+2]+=Math.cos(time*d.swaySpeed+d.phase)*sway*dt;
        if(p[k+1]>3||Math.abs(p[k])>3.5||Math.abs(p[k+2])>3.5){
          p[k+1]=-2.5;p[k]=(Math.random()-.5)*3;p[k+2]=(Math.random()-.5)*3;
        }
      }
      sparkParticles.geometry.attributes.position.needsUpdate=true;
    }
    const phi=currentScroll*Math.PI*2;
    const y=.35+Math.sin(currentScroll*Math.PI)*.8;
    const radius=4.2-Math.sin(currentScroll*Math.PI)*.6;
    const x=radius*Math.sin(phi),z=radius*Math.cos(phi);
    const ease=(Math.cos(clamp(currentScroll/.28,0,1)*Math.PI)+1)*.5;
    const targetPos=new THREE.Vector3(x,y,z);
    camera.position.lerp(targetPos,.025);
    camera.lookAt(new THREE.Vector3(-.9*ease,-.15,0));
    shaderUniforms.uTime.value=clock.elapsedTime;
    shaderUniforms.uMouse.value.set(mouseX,-mouseY);
    shaderUniforms.uScroll.value=currentScroll;
    updateSlides(currentScroll);updateDots(currentScroll);
    const visibleProgress=targetScroll;
    canvas.style.opacity=String(1-smoothstep(.965,1.02,visibleProgress));
    if(visibleProgress<1.02)renderer.render(scene,camera);
  }

  window.addEventListener("mousemove",e=>{
    cursorX=e.clientX;cursorY=e.clientY;
    const inner=document.querySelector(".cursor-inner");
    if(inner){inner.style.left=cursorX+"px";inner.style.top=cursorY+"px";}
    targetMouseX=e.clientX/innerWidth*2-1;targetMouseY=e.clientY/innerHeight*2-1;
  },{passive:true});
  window.addEventListener("resize",onResize,{passive:true});
  splitTitles();
  try{createScene();onResize();animate();}
  catch(error){console.error("Cinematic scene could not start:",error);canvas.style.display="none";}
})();
