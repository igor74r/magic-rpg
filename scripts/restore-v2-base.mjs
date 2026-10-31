import fs from 'node:fs';
import path from 'node:path';
const src='C:\\Users\\Igor\\Desktop\\magic-rpg_safety_20261031_193115';
const dst='C:\\Users\\Igor\\Desktop\\magic-rpg';
const files=['index.html','main.js','css/shards-rift-v2.css','css/ui-polish.css','ui/interface-v2.js','systems/item-tiers.js','data/rift-nodes.js'];
for (const rel of files) {
 const from=path.join(src,rel), to=path.join(dst,rel);
 if (!fs.existsSync(from)) throw new Error('Missing source: '+rel);
 fs.mkdirSync(path.dirname(to),{recursive:true});
 if (fs.existsSync(to)) fs.copyFileSync(to,to+'.before-v2-restore');
 fs.copyFileSync(from,to);
 console.log('RESTORED '+rel);
}
