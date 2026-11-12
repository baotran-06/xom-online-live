import {cp,mkdir,rm} from 'node:fs/promises';
await mkdir('frontend/assets/vendor',{recursive:true});
await cp('node_modules/three/build/three.module.js','frontend/assets/vendor/three.module.js');
await cp('node_modules/three/LICENSE','frontend/assets/vendor/THREE-LICENSE.txt');
await rm('dist',{recursive:true,force:true});await mkdir('dist',{recursive:true});
await cp('frontend','dist',{recursive:true});
console.log('Build OK: dist/ (frontend độc lập, không chứa bridge hoặc thông tin xác thực).');
