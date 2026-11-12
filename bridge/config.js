import {readFileSync} from 'node:fs';
export const root=new URL('../',import.meta.url);
export const settings=JSON.parse(readFileSync(new URL('config/game-settings.json',root)));
export const gifts=JSON.parse(readFileSync(new URL('config/gifts.json',root)));
export const port=Number(process.env.PORT||3210);
if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('PORT phải từ 1024 đến 65535');
export const host='127.0.0.1';
