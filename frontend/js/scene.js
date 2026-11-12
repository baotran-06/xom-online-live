import * as T from '../assets/vendor/three.module.js';
export function shortName(name,max=20){const chars=Array.from(String(name));return chars.length>max?chars.slice(0,max-1).join('')+'…':chars.join('');}
export const TABLES=[[-6, -1.4],[0,-1.4],[6,-1.4],[-7,3.8],[-2.35,3.8],[2.35,3.8],[7,3.8]];
const COLORS=[0xefa74e,0x45a9a0,0xd66d69,0x7c8bd1,0xb0b95e,0xf6c97b,0x8ebbb3,0xc78ab2];
export class Tavern {
  constructor(canvas,renderer=null) {
    this.renderer=renderer||new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.35;
    this.scene=new T.Scene();this.scene.background=new T.Color('#244c45');this.scene.fog=new T.Fog('#244c45',33,60);
    this.camera=new T.PerspectiveCamera(42,1,.1,100);this.camera.position.set(0,11.5,23.7);this.camera.lookAt(0,1.15,0);
    this.geometries={box:new T.BoxGeometry(1,1,1),sphere:new T.SphereGeometry(1,14,10),cylinder:new T.CylinderGeometry(1,1,1,18),cone:new T.ConeGeometry(1,1,12),torus:new T.TorusGeometry(1,.18,7,18)};
    this.materials=new Map();this.avatars=new Map();this.staticRoot=new T.Group();this.scene.add(this.staticRoot);this.clock=new T.Clock();this.time=0;
    this.scene.add(new T.HemisphereLight(0xffecd0,0x4f6d62,2.1));const sun=new T.DirectionalLight(0xffdfad,3.6);sun.position.set(-5,16,10);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-15,right:15,top:12,bottom:-12,near:.5,far:50});sun.shadow.bias=-.001;this.scene.add(sun);
    const fill=new T.DirectionalLight(0x94e5d7,1.4);fill.position.set(10,7,-3);this.scene.add(fill);
    this.build();this.instanceStatic();this.resize=()=>{const w=canvas.clientWidth,h=canvas.clientHeight;this.viewportWidth=w;this.viewportHeight=h;this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.fov=2*T.MathUtils.radToDeg(Math.atan(Math.tan(T.MathUtils.degToRad(21))*Math.max(1,(16/9)/(w/h))));this.camera.updateProjectionMatrix();};this.resize();window.addEventListener('resize',this.resize);
    this.effect=new T.Group();this.scene.add(this.effect);for(let i=0;i<70;i++){const m=this.mesh('box',COLORS[i%8],[.08,.16,.04],[0,-10,0],this.effect);m.userData={seed:i*2.399};}this.effectUntil=0;
    this.renderer.setAnimationLoop(()=>this.frame());
  }
  instanceStatic(){
    // Share static meshes by geometry/material; reduce thousands of draw calls.
    this.staticRoot.updateMatrixWorld(true);const batches=new Map();
    const shared=new Set(Object.values(this.geometries));
    this.staticRoot.traverse(o=>{if(o.isMesh&&shared.has(o.geometry)){const key=o.geometry.uuid+o.material.uuid;if(!batches.has(key))batches.set(key,[]);batches.get(key).push(o);}});
    for(const meshes of batches.values()){const first=meshes[0];const batch=new T.InstancedMesh(first.geometry,first.material,meshes.length);batch.castShadow=true;batch.receiveShadow=true;meshes.forEach((m,i)=>{batch.setMatrixAt(i,m.matrixWorld);m.parent.remove(m);});batch.instanceMatrix.needsUpdate=true;this.scene.add(batch);}
  }
  material(color){if(!this.materials.has(color))this.materials.set(color,new T.MeshStandardMaterial({color,roughness:.72,metalness:.04}));return this.materials.get(color);}
  mesh(type,color,scale,pos,parent=this.staticRoot){const m=new T.Mesh(this.geometries[type],this.material(color));m.scale.set(...scale);m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  group(pos,parent=this.staticRoot){const g=new T.Group();g.position.set(...pos);parent.add(g);return g;}
  box(c,s,p,g){return this.mesh('box',c,s,p,g);}
  cyl(c,r,h,p,g){return this.mesh('cylinder',c,[r,h,r],p,g);}
  sphere(c,s,p,g){return this.mesh('sphere',c,s,p,g);}
  sign(text,width,height,color,bg,pos,parent=this.staticRoot,size=80){
    const c=document.createElement('canvas');c.width=1024;c.height=Math.round(1024*height/width);const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,c.width,c.height);ctx.strokeStyle=color;ctx.lineWidth=8;ctx.strokeRect(16,16,c.width-32,c.height-32);ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;ctx.font=`900 ${size}px Arial`;ctx.fillText(text,512,c.height/2,950);
    const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;const geo=new T.PlaneGeometry(width,height);const mat=new T.MeshBasicMaterial({map:tx});const m=new T.Mesh(geo,mat);m.position.set(...pos);parent.add(m);return m;
  }
  mug(pos,parent=this.staticRoot,scale=1){const g=this.group(pos,parent);g.scale.setScalar(scale);this.cyl(0xefae33,.16,.32,[0,.16,0],g);this.cyl(0xfff0c2,.17,.07,[0,.33,0],g);const h=this.mesh('torus',0xf5d89c,[.12,.12,.12],[.18,.18,0],g);return g;}
  bottle(pos,parent=this.staticRoot){const g=this.group(pos,parent);this.cyl(0x2e7050,.09,.4,[0,.2,0],g);this.cyl(0x316b43,.045,.22,[0,.5,0],g);this.cyl(0xd5ad50,.05,.025,[0,.62,0],g);this.box(0xe6c890,[.17,.15,.17],[0,.22,0],g);return g;}
  plant(pos,scale=1){const g=this.group(pos);g.scale.setScalar(scale);this.cyl(0xc3774f,.34,.6,[0,.3,0],g);this.cyl(0xda9766,.39,.13,[0,.6,0],g);for(let i=0;i<8;i++){const a=i*2.4;const leaf=this.sphere(i%2?0x5d9960:0x7aaf68,[.16,.7,.23],[Math.sin(a)*.3,1.1,Math.cos(a)*.3],g);leaf.rotation.z=Math.sin(a)*.6;}}
  chair(pos,angle){const g=this.group(pos);g.rotation.y=angle;this.box(0x4e9993,[.66,.12,.62],[0,.5,0],g);this.box(0x5ea9a2,[.64,.65,.12],[0,.88,-.27],g);for(const x of [-.25,.25])for(const z of [-.22,.22])this.box(0x386f6a,[.065,.5,.065],[x,.24,z],g);}
  build(){
    const wood=0x91643f;
    this.box(0x688d76,[27,.4,18],[0,-.35,0]);this.box(0xc5ac7b,[25,.2,16],[0,-.1,0]);
    // Individual terracotta tiles, with grout and patterned border.
    for(let x=-12;x<12;x+=1.2)for(let z=-7.2;z<8;z+=1.2)this.box((Math.round(x+z)*7%3)?0xc99e71:0xd3af81,[1.16,.025,1.16],[x+.6,.02,z+.6]);
    this.box(0xded1aa,[25,6,.35],[0,2.9,-7.5]);this.box(0x719588,[25,.8,.4],[0,.4,-7.25]);
    for(let x=-12;x<=12;x+=4)this.box(0x8c643f,[.22,7,.22],[x,3.4,-7]);
    this.box(0x6b4b35,[25,.22,.35],[0,6.2,-7]);
    // Side wall and warm open-air patio pergola.
    for(const x of [-12.3,12.3]){this.box(0x846244,[.22,6,.22],[x,3,3]);this.box(0x6b4b35,[.25,.22,14],[x,6.1,0]);}
    this.box(0x6b4b35,[24.6,.22,.25],[0,6.1,3]);
    for(let x=-12;x<13;x+=2)this.box(0x8b6d43,[.09,.09,10],[x,6.15,-2]);
    // Main sign, 3D framing and marquee bulbs.
    this.box(0x8a5734,[9.5,2.25,.25],[0,4.6,-7.05]);this.sign('XÓM ONLINE',9,1.65,'#ffe5a3','#174c3b',[0,4.75,-6.89],undefined,145);
    this.sign('G H É   X Ó M   ·   N Â N G   L Y   ·   K Ế T   B Ạ N',8.5,.35,'#f2d394','#174c3b',[0,3.77,-6.88],undefined,33);
    for(let x=-4.5;x<=4.5;x+=.55)this.sphere(0xffd96c,[.055,.055,.055],[x,5.6,-6.75]);
    // Counter, stools and detailed back-bar shelving.
    const bar=this.group([4.2,0,-5.7]);this.box(0x447565,[7.7,1.6,1.15],[0,.8,0],bar);this.box(0x89573a,[8, .16,1.5],[0,1.65,0],bar);
    for(let x=-3.5;x<=3.5;x+=.5)this.box(0x8ca27c,[.035,1.3,.025],[x,.85,.59],bar);
    this.sign('MỒI NGON · BẠN HIỀN',4,.5,'#f3d486','#386756',[0,.88,.59],bar,65);
    for(let x=-2.8;x<3;x+=1.4){this.cyl(0xd69649,.33,.13,[x,.85,1.5],bar);this.cyl(0x535c44,.055,.8,[x,.4,1.5],bar);this.mug([x,1.75,0],bar);}
    for(let y=2;y<=3;y+=.65){this.box(wood,[6,.12,.4],[5,y,-7]);for(let x=2.4;x<8;x+=.4)this.bottle([x,y+.06,-6.9]);}
    this.sign('BẾP XÓM',2.2,.55,'#f5e9bd','#b16d46',[9.2,3.3,-7.1],undefined,115);
    // Fridge and jars.
    this.box(0xdce1c5,[1.35,2.6,1],[10.4,1.3,-5.8]);this.box(0x6c9f92,[1.1,1.65,.04],[10.4,1.65,-5.27]);this.box(0xd8e1bd,[.8,.035,.03],[10.4,1.5,-5.22]);
    for(let i=0;i<3;i++)this.bottle([10.15+i*.23,1.52,-5.23]);
    // Stage with speakers, striped backdrop and a little microphone.
    this.box(0x845541,[4.5,.35,2.7],[-8.4,.2,-5.35]);this.box(0xb98853,[4.7,.09,2.85],[-8.4,.42,-5.35]);
    for(let x=-10.5;x<-6.3;x+=.4)this.box(0xd09558,[.03,.025,2.6],[x,.48,-5.35]);
    this.sign('HÁT CHO XÓM NGHE',3.7,.65,'#ffe4ac','#b56a52',[-8.4,3.7,-7.15],undefined,80);
    for(const x of [-10.2,-6.6]){this.box(0x263e36,[.6,1.25,.55],[x,1.1,-6]);const speaker=this.mesh('sphere',0x122c28,[.21,.21,.035],[x,1.2,-5.7]);}
    this.cyl(0x35483e,.035,1.4,[-8.4,1.15,-5]);this.cyl(0x35483e,.25,.04,[-8.4,.5,-5]);const mic=this.cyl(0xaaa48c,.07,.3,[-8.4,1.9,-5]);mic.rotation.z=.8;
    // Ceiling garlands. Curves and hanging bulbs are real geometry.
    for(let row=0;row<3;row++){
      const z=-4+row*4;const points=[];for(let i=0;i<=24;i++){const x=-12+i;points.push(new T.Vector3(x,6.25-.8*Math.sin(i/24*Math.PI),z));}
      const curve=new T.CatmullRomCurve3(points);const wire=new T.Mesh(new T.TubeGeometry(curve,40,.018,5,false),this.material(0x394a35));this.staticRoot.add(wire);
      for(let i=1;i<24;i+=2){const x=-12+i,y=6.25-.8*Math.sin(i/24*Math.PI);this.cyl(0x6b7250,.035,.22,[x,y-.1,z]);this.sphere(i%3?0xffe3a0:0xff9e74,[.095,.13,.095],[x,y-.24,z]);}
    }
    for(const x of [-5.4,5.4]){this.cyl(0xac6440,.045,.7,[x,5.7,-4.3]);this.mesh('sphere',0xf3b55e,[.38,.47,.38],[x,5.15,-4.3]);this.cyl(0xc77c45,.24,.08,[x,4.72,-4.3]);}
    // Posters, wall fan and entrance props.
    this.sign('100% VUI VẺ',2.1,1.1,'#214b3d','#f0c974',[-3.9,2.55,-7.22],undefined,85);
    this.sign('KHÔNG SAY KHÔNG VỀ',2.2,.65,'#f8e5bb','#8e5d43',[-.9,2.55,-7.22],undefined,59);
    const fan=this.group([-11.2,3.8,-6.85]);this.mesh('torus',0x517b6d,[.55,.55,.55],[0,0,0],fan);for(let i=0;i<3;i++){const g=this.group([0,0,0],fan);g.rotation.z=i*Math.PI*2/3;this.sphere(0x799a7e,[.13,.38,.04],[0,.22,0],g);}this.sphere(0x48685c,[.13,.13,.08],[0,0,.06],fan);
    this.plant([-11,0,5.8],1.5);this.plant([11.3,0,5.6],1.5);this.plant([-5.7,0,-5.9],1.1);
    for(let i=0;i<4;i++){this.box(0xb34f3d,[.8,.35,.55],[11,.2+i*.35,1]);this.box(0xc8794a,[.72,.06,.45],[11,.38+i*.35,1]);}
    // Seven shared tables with four seats, snacks, chopsticks, mugs and beer.
    TABLES.forEach(([x,z],id)=>{
      const g=this.group([x,0,z]);this.cyl(0x4a6b56,.17,1.1,[0,.55,0],g);this.cyl(0x527c65,.65,.12,[0,.1,0],g);this.cyl(0xc59454,1.28,.13,[0,1.12,0],g);this.cyl(0xdfb676,1.23,.035,[0,1.2,0],g);
      this.cyl(0xf3e9c7,.35,.04,[0,1.24,0],g);for(let i=0;i<8;i++){const a=i*2.4;this.sphere(i%2?0x8ea052:0xd18749,[.1,.065,.09],[Math.sin(a)*.22,1.3,Math.cos(a)*.22],g);}
      this.bottle([.5,1.23,-.2],g);this.cyl(0xf3e9c7,.19,.06,[-.5,1.26,.2],g);
      for(let s=0;s<4;s++){const a=s*Math.PI/2+Math.PI/4;const xx=Math.sin(a),zz=Math.cos(a);this.mug([xx*.85,1.23,zz*.85],g,.8);this.box(0x62462c,[.035,.03,.43],[xx*.7+.15,1.25,zz*.7],g);this.box(0x62462c,[.035,.03,.43],[xx*.7+.22,1.25,zz*.7],g);this.chair([x+xx*1.65,0,z+zz*1.65],a+Math.PI);}
      const number=this.sign(String(id+1).padStart(2,'0'),.4,.25,'#f9e0a2','#5b7961',[0,1.43,0],g,130);number.rotation.x=-.25;
    });
    // Small counter host is part of the world rather than a UI image.
    const host=this.createAvatar({id:'host',name:'Chủ xóm',seat:0},true);host.group.position.set(4,0,-6.3);host.group.rotation.y=0;this.staticRoot.add(host.group);
  }
  seatPosition(seat){const [x,z]=TABLES[Math.floor(seat/4)];const a=seat%4*Math.PI/2+Math.PI/4;return {x:x+Math.sin(a)*1.65,z:z+Math.cos(a)*1.65,angle:a+Math.PI};}
  createAvatar(user,host=false){
    let hash=0;for(const c of user.id)hash=(hash*31+c.charCodeAt(0))>>>0;
    const g=new T.Group();this.scene.add(g);const body=this.group([0,0,0],g);const shirt=host?0xefe4bb:COLORS[hash%COLORS.length];const skin=[0xe5ac7c,0xf2c397,0xc88d65][hash%3];
    const torso=this.sphere(shirt,[.29,.38,.2],[0,1.02,0],body);this.cyl(skin,.09,.13,[0,1.41,0],body);this.sphere(skin,[.27,.3,.25],[0,1.68,0],body);
    this.sphere(0x45362c,[.28,.17,.25],[0,1.86,-.035],body);if(hash%3===0)this.sphere(0x45362c,[.28,.23,.12],[0,1.68,-.19],body);
    for(const x of [-.09,.09]){this.sphere(0x302d25,[.025,.038,.018],[x,1.7,.234],body);this.sphere(0xfdf1da,[.009,.012,.008],[x+.008,1.714,.248],body);this.sphere(0xdf8f70,[.045,.023,.012],[x*1.7,1.6,.22],body);}
    const smile=this.mesh('torus',0x85533b,[.06,.035,.03],[0,1.59,.243],body);smile.rotation.z=Math.PI;
    const arms=[];for(const side of [-1,1]){const arm=this.group([side*.31,1.26,0],body);this.sphere(shirt,[.11,.19,.12],[0,-.1,0],arm);this.cyl(skin,.075,.32,[0,-.31,0],arm);this.sphere(skin,[.09,.095,.09],[0,-.49,0],arm);arms.push(arm);}
    const legs=[];for(const side of [-1,1]){const leg=this.group([side*.14,.76,0],body);this.cyl(0x465c59,.10,.38,[0,-.16,0],leg);const shin=this.group([0,-.34,0],leg);this.cyl(0x465c59,.09,.34,[0,-.15,0],shin);this.sphere(0xeee0bd,[.12,.07,.19],[0,-.32,.06],shin);legs.push({leg,shin});}
    const mug=this.mug([0,-.48,.10],arms[1],.8);mug.visible=false;
    const flowers=this.group([0,-.45,.04],arms[1]);for(let i=0;i<5;i++){this.cyl(0x52885b,.012,.4,[i*.035-.07,.15,0],flowers);this.sphere(i%2?0xf297ac:0xf2d17a,[.08,.08,.08],[i*.07-.14,.39+Math.sin(i)*.06,0],flowers);}flowers.visible=false;
    const c=document.createElement('canvas');c.width=512;c.height=96;const ctx=c.getContext('2d');ctx.fillStyle=host?'#d8ab4d':'#fff8df';ctx.beginPath();ctx.roundRect(6,8,500,78,30);ctx.fill();ctx.font='bold 34px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#224b3f';ctx.fillText(shortName(user.name),256,48,470);
    const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;const label=new T.Sprite(new T.SpriteMaterial({map:texture,depthTest:false}));label.scale.set(2.15,.4,1);label.position.set(0,2.3,0);g.add(label);
    return {group:g,body,arms,legs,mug,flowers,label,texture,born:this.time,from:new T.Vector3(-12,0,6),seat:user.seat,name:user.name,joinedAt:user.joinedAt,host};
  }
  update(state){
    this.state=state;this.stateAt=this.time;const live=new Set();
    for(const u of state.users){if(u.seat===null)continue;live.add(u.id);let a=this.avatars.get(u.id);if(a&&a.joinedAt!==u.joinedAt){this.disposeAvatar(a);this.avatars.delete(u.id);a=null;}if(!a){a=this.createAvatar(u);this.avatars.set(u.id,a);}if(a.name!==u.name){const ctx=a.texture.image.getContext('2d');ctx.fillStyle='#fff8df';ctx.fillRect(0,0,512,96);ctx.fillStyle='#224b3f';ctx.fillText(shortName(u.name),256,48,470);a.texture.needsUpdate=true;a.name=u.name;}a.user=u;}
    for(const [id,a] of this.avatars)if(!live.has(id)){this.disposeAvatar(a);this.avatars.delete(id);}
    if(state.groupUntil>state.serverTime)this.effectUntil=this.time+Math.min(6,(state.groupUntil-state.serverTime)/1000);
  }
  disposeAvatar(a){this.scene.remove(a.group);a.texture.dispose();a.label.material.dispose();}
  departurePath(a){
    const start=a.group.position.clone();const [tx]=TABLES[Math.floor(a.user.seat/4)];const side=start.x>=tx?1:-1;const lane=1.03+(a.user.seat%4)*.11;const outer=-12.5-Math.floor(a.user.seat/4)*.16;
    return [start,new T.Vector3(tx+side*2.05,0,start.z),new T.Vector3(tx+side*2.05,0,lane),new T.Vector3(outer,0,lane),new T.Vector3(outer,0,9.8),new T.Vector3(-30,0,10.5)];
  }
  alongPath(points,progress){const lengths=points.slice(1).map((p,i)=>p.distanceTo(points[i]));let distance=lengths.reduce((a,b)=>a+b,0)*T.MathUtils.clamp(progress,0,1);for(let i=0;i<lengths.length;i++){if(distance<=lengths[i]||i===lengths.length-1)return {position:points[i].clone().lerp(points[i+1],Math.min(1,distance/(lengths[i]||1))),angle:Math.atan2(points[i+1].x-points[i].x,points[i+1].z-points[i].z)};distance-=lengths[i];}}
  layoutLabels(){
    this.camera.updateMatrixWorld();const placed=[];const w=this.renderer.domElement?.clientWidth||this.viewportWidth||1920;const h=this.renderer.domElement?.clientHeight||this.viewportHeight||1080;
    for(const a of [...this.avatars.values()].sort((a,b)=>a.user.seat-b.user.seat)){
      a.label.position.set(0,2.3,0);a.label.visible=true;const point=a.group.localToWorld(new T.Vector3(0,2.3,0));const ndc=point.clone().project(this.camera);if(ndc.x < -1.1||ndc.x>1.1||ndc.z>1){a.label.visible=false;continue;}
      let y=(1-ndc.y)*h/2;const x=(ndc.x+1)*w/2;const depth=point.distanceTo(this.camera.position);const px=h/(2*Math.tan(T.MathUtils.degToRad(this.camera.fov/2))*depth);const width=2.15*px;const height=.4*px;
      for(let row=0;row<14;row++){if(!placed.some(p=>Math.abs(p.x-x)<(p.width+width)/2+3&&Math.abs(p.y-y)<(p.height+height)/2+3))break;y-=height+4;}
      a.label.position.y+=( (1-ndc.y)*h/2-y)/px;placed.push({x,y,width,height});
    }
  }
  frame(){
    const delta=Math.min(.05,this.clock.getDelta());this.time+=delta;const t=this.time;
    for(const a of this.avatars.values()){
      const u=a.user;const target=this.seatPosition(u.seat);const progress=Math.min(1,(t-a.born)/3);let walking=progress<1;const leaving=Boolean(u.departedAt);
      const eased=progress*progress*(3-2*progress);a.group.position.set(T.MathUtils.lerp(-12,target.x,eased),0,T.MathUtils.lerp(6,target.z,eased));a.group.rotation.y=walking?Math.atan2(target.x+12,target.z-6):target.angle;
      if(leaving){
        if(!a.exit){a.exit={at:t,points:this.departurePath(a)};}
        const elapsed=Math.max(0,(this.state.serverTime-u.departedAt)/1000+(t-this.stateAt));
        const move=this.alongPath(a.exit.points,(elapsed-.9)/16.8);a.group.position.copy(move.position);walking=elapsed>=.9;
        const turn=Math.min(1,elapsed/.9);a.group.rotation.y=T.MathUtils.lerp(target.angle,move.angle,turn);
        a.stand=Math.min(1,elapsed/.7);
      }

      a.body.position.y=walking?Math.sin(t*12)*.035:-.24+Math.sin(t*1.8+a.seat)*.012;
      if(leaving&&!walking)a.body.position.y=-.24*(1-a.stand);
      a.legs.forEach(({leg,shin},i)=>{leg.rotation.x=walking?Math.sin(t*10+i*Math.PI)*.6:leaving?-Math.PI/2*(1-a.stand):-Math.PI/2;shin.rotation.x=walking?0:leaving?Math.PI/2*(1-a.stand):Math.PI/2;});
      a.arms.forEach((arm,i)=>{arm.rotation.x=walking?Math.sin(t*10+i*Math.PI)*.4:-.25;arm.rotation.z=0;});a.mug.visible=false;a.flowers.visible=false;
      const group=this.effectUntil>t;
      if(u.action==='wave'){a.arms[1].rotation.z=-2.5+Math.sin(t*9)*.3;}
      if(u.action==='cheers'||group){a.arms[1].rotation.x=-1.8+Math.sin(t*4)*.08;a.mug.visible=true;}
      if(u.action==='flowers'){a.arms[1].rotation.x=-1.8;a.flowers.visible=true;}
      if(u.action==='spotlight'){a.body.position.y+=Math.abs(Math.sin(t*6))*.16;a.arms[0].rotation.z=2.3;a.arms[1].rotation.z=-2.3;}
      a.group.scale.setScalar(1+Math.sin(t*2+a.born)*.005);
    }
    this.effect.visible=this.effectUntil>t;
    if(this.effect.visible)for(const m of this.effect.children){const s=m.userData.seed;m.position.set(Math.sin(s)*11,((t*1.7+s)%7),Math.cos(s)*6);m.rotation.set(t+s,t*.8,s);}
    this.scene.updateMatrixWorld(true);this.layoutLabels();
    this.renderer.render(this.scene,this.camera);
  }
  dispose(){this.renderer.setAnimationLoop(null);window.removeEventListener('resize',this.resize);this.scene.traverse(o=>{if(o.material?.map)o.material.map.dispose();if(o.material&&!this.materials.has(o.material))o.material.dispose?.();});for(const g of Object.values(this.geometries))g.dispose();for(const m of this.materials.values())m.dispose();this.renderer.dispose();}
}
