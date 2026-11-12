import {DEFAULT_GIFTS} from './core.js';
export function guideAction(item,gifts=DEFAULT_GIFTS){return item.event==='follow'||item.event==='like'?'wave':gifts.byName?.[item.giftName]??gifts.defaultAction;}
export async function mountGuide(){
 const config=await (await fetch('config/interactions.json')).json();const root=document.getElementById('interaction-list');let key='';
 return gifts=>{const next=JSON.stringify(gifts);if(key===next)return;key=next;root.replaceChildren();for(const item of config.items){const row=document.createElement('div');row.className='interaction-item';const icon=document.createElement('span');icon.textContent=item.icon;const body=document.createElement('div');const title=document.createElement('strong');title.textContent=item.label;const description=document.createElement('p');description.textContent=config.actions[guideAction(item,gifts)]||'Theo cấu hình quà của chủ xóm';body.append(title,description);row.append(icon,body);root.append(row);}document.getElementById('interaction-note').textContent=config.note;};
}
