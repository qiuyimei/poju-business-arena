import {readFile,writeFile,mkdir,readdir,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,relative} from 'node:path';
import {deflateRawSync} from 'node:zlib';
import {createHash} from 'node:crypto';

// Small UTF-8 ZIP writer. Runtime files are explicitly selected; private data is never traversed.
const root=fileURLToPath(new URL('../',import.meta.url)),out=resolve(root,'build');
const version=JSON.parse(await readFile(resolve(root,'package.json'),'utf8')).version;
if(!/^\d+\.\d+\.\d+$/.test(version))throw Error('Invalid release version');
const selected=['package.json','server.mjs','server','lib','drizzle','public','docs','third_party','THIRD_PARTY.md','README.md','启动-本机预览.cmd','部署说明.txt','.env.example','.dockerignore','Dockerfile','compose.yaml','Caddyfile','Caddyfile.ip'];
const files=[];
async function collect(name){
 const full=resolve(root,name);if(!full.startsWith(root))throw Error('Path outside project');
 const s=await stat(full);if(s.isDirectory()){for(const child of (await readdir(full)).sort())await collect(name+'/'+child);}else files.push({name:name.replaceAll('\\','/'),data:await readFile(full)});
}
for(const name of selected)await collect(name);
if(!files.some(f=>/^public\/assets\/.+\.js$/.test(f.name)))throw Error('Build frontend before packaging');
for(const {name} of files)if(/(^|\/)(data|node_modules|\.git|build)(\/|$)/.test(name)||/\.sqlite|owner-code\.txt/.test(name))throw Error('Private file selected');
const table=Uint32Array.from({length:256},(_,i)=>{let c=i;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
function crc32(data){let c=0xffffffff;for(const b of data)c=table[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
const chunks=[],central=[];let offset=0;
for(const {name,data} of files){
 const label=Buffer.from(name),compressed=deflateRawSync(data),crc=crc32(data);
 const h=Buffer.alloc(30);h.writeUInt32LE(0x04034b50);h.writeUInt16LE(20,4);h.writeUInt16LE(0x800,6);h.writeUInt16LE(8,8);h.writeUInt16LE(33,12);h.writeUInt32LE(crc,14);h.writeUInt32LE(compressed.length,18);h.writeUInt32LE(data.length,22);h.writeUInt16LE(label.length,26);
 const c=Buffer.alloc(46);c.writeUInt32LE(0x02014b50);c.writeUInt16LE(20,4);c.writeUInt16LE(20,6);c.writeUInt16LE(0x800,8);c.writeUInt16LE(8,10);c.writeUInt16LE(33,14);c.writeUInt32LE(crc,16);c.writeUInt32LE(compressed.length,20);c.writeUInt32LE(data.length,24);c.writeUInt16LE(label.length,28);c.writeUInt32LE(offset,42);
 chunks.push(h,label,compressed);central.push(c,label);offset+=h.length+label.length+compressed.length;
}
const directory=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(files.length,8);end.writeUInt16LE(files.length,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);
const zip=Buffer.concat([...chunks,directory,end]),name='Poju-Deploy-v'+version+'.zip',filename=resolve(out,name),sha256=createHash('sha256').update(zip).digest('hex');
await mkdir(out,{recursive:true});await writeFile(filename,zip);await writeFile(resolve(out,'SHA256SUMS.txt'),sha256+'  '+name+'\n');
await writeFile(resolve(out,'package-info.json'),JSON.stringify({version,filename,sha256,size:zip.length,files:files.map(f=>f.name)},null,2));
console.log(JSON.stringify({version,archive:relative(root,filename),files:files.length,bytes:zip.length,sha256}));
