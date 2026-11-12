// Optional Windows/Linux helper. Never touches another repository or prints tokens.
import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
function run(args,{allowFailure=false}={}){const r=spawnSync('gh',args,{encoding:'utf8',stdio:['ignore','pipe','pipe']});if(r.error)throw Error('Cần cài GitHub CLI từ cli.github.com');if(r.status&&!allowFailure)throw Error(r.stderr||'GitHub command failed');return r;}
try {
 run(['auth','status']);const login=run(['api','user','--jq','.login']).stdout.trim();if(!/^[a-zA-Z0-9-]+$/.test(login))throw Error('Không xác định được owner');
 const repo=login+'/xom-online-live';const existing=run(['repo','view',repo,'--json','name'],{allowFailure:true});
 if(existing.status===0)throw Error('Repo '+repo+' đã tồn tại. Script từ chối ghi đè; kiểm tra trước khi thao tác thủ công.');
 if(!existing.stderr.includes('Could not resolve to a Repository')&&!existing.stderr.includes('Not Found'))throw Error('Không xác minh được repo chưa tồn tại; dừng an toàn.');
 if(!existsSync('.git'))throw Error('Cần git init, git add và git commit trong đúng thư mục dự án trước.');
 run(['repo','create',repo,'--public','--source=.','--remote=origin','--push','--description','XÓM ONLINE LIVE · Quán 3D tương tác TikTok LIVE, DEMO và cầu nối Windows']);
 console.log('Đã tạo và push: https://github.com/'+repo);
 run(['api','--method','POST','repos/'+repo+'/pages','-f','build_type=workflow']);
 run(['workflow','run','pages.yml','--repo',repo]);
 console.log('Đã yêu cầu Pages deployment. Chưa xác nhận thành công.');
 console.log('Theo dõi gh run list --repo '+repo+' rồi gh run watch <id> --repo '+repo);
 console.log('Chỉ dùng URL do gh api repos/'+repo+'/pages --jq .html_url trả về sau khi build thành công.');
}catch(e){console.error(e.message);process.exitCode=1;}
