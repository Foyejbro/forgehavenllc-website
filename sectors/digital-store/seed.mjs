import fs from 'node:fs';
const p=JSON.parse(fs.readFileSync('catalog.json','utf8'));
const quote=s=>"'"+s.replaceAll("'","''")+"'";
fs.writeFileSync('worker/seed.sql',p.map(p=>`INSERT INTO products(id,data) VALUES(${quote(p.id)},${quote(JSON.stringify(p))}) ON CONFLICT(id) DO UPDATE SET data=excluded.data;`).join('\n'));
console.log('worker/seed.sql generated');
