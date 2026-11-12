import test from 'node:test';import assert from 'node:assert/strict';
import {Tavern} from '../frontend/js/scene.js';
import {World,demoEvent} from '../frontend/js/core.js';
test('3D scene construction, instancing, avatar actions and cleanup (renderer stub; no GPU claim)',()=>{
 const context={fillRect(){},strokeRect(){},fillText(){},beginPath(){},roundRect(){},fill(){}};
 globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>context})};globalThis.window={addEventListener(){},removeEventListener(){}};globalThis.devicePixelRatio=1;
 const renderer={shadowMap:{},setPixelRatio(){},setSize(){},setAnimationLoop(){},render(){},dispose(){}};
 const scene=new Tavern({clientWidth:1920,clientHeight:1080},renderer);
 let batches=0;scene.scene.traverse(o=>{if(o.isInstancedMesh)batches++;});assert.ok(batches>10);assert.equal(scene.camera.aspect,16/9);
 const w=new World();for(let i=0;i<40;i++)w.enqueue(demoEvent('join',i));while(w.queue.length)w.tick();scene.update(w.snapshot());assert.equal(scene.avatars.size,28);
 for(const action of ['wave','cheers','flowers','spotlight']){for(const a of scene.avatars.values()){a.user.action=action;a.born=scene.time-4;}scene.frame();for(const a of scene.avatars.values())assert.ok(Number.isFinite(a.group.position.x));}
 const first=scene.avatars.values().next().value;let disposed=false;first.texture.addEventListener('dispose',()=>{disposed=true;});w.reset();scene.update(w.snapshot());assert.equal(scene.avatars.size,0);assert.ok(disposed);scene.dispose();
 delete globalThis.document;delete globalThis.window;delete globalThis.devicePixelRatio;
});
