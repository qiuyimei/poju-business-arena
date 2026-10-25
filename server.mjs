import http from 'node:http';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {statSync,createReadStream} from 'node:fs';
import {pipeline} from 'node:stream/promises';
import {GET,POST} from './server/api.mjs';
import {closeDatabase,databaseFile,ownerCodeFile} from './server/runtime.mjs';
const root=dirname(fileURLToPath(import.meta.url)),publicRoot=resolve(root,'public');
const port=Number(process.env.PORT||8080),host=process.env.HOST||'0.0.0.0',origin=process.env.APP_ORIGIN||'http://localhost:'+port;
if(!Number.isInteger(port)||port<1||port>65535)throw new Error('PORT 无效');
const configured=new URL(origin);if(configured.origin!==origin||!['http:','https:'].includes(configured.protocol))throw new Error('APP_ORIGIN 应为完整网址来源，例如 https://training.example.com，不含结尾斜杠');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.json':'application/json; charset=utf-8','.woff2':'font/woff2'};
const security={'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','X-Frame-Options':'DENY','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"};
function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...security});res.end(JSON.stringify(data));}
const server=http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,origin);
 if(url.pathname==='/healthz'){json(res,200,{ok:true});return;}
 if(url.pathname==='/api/platform'){
  if(!['GET','POST'].includes(req.method)){json(res,405,{error:'请求方法不支持。'});return;}
  let body;if(req.method==='POST'){const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>32768){json(res,413,{error:'请求过大。'});return;}chunks.push(chunk);}body=Buffer.concat(chunks);}
  const headers=new Headers(req.headers);const remote=req.socket.remoteAddress||'';
  const trusted=(process.env.TRUST_LOCAL_PROXY==='1'&&['127.0.0.1','::1','::ffff:127.0.0.1'].includes(remote))||process.env.TRUST_PRIVATE_GATEWAY==='1';
  headers.set('cf-connecting-ip',trusted?(req.headers['x-real-ip']||remote):remote);
  const request=new Request(url,{method:req.method,headers,...(body?{body}:{} )});
  const result=await (req.method==='GET'?GET:POST)(request);res.writeHead(result.status,{...security,...Object.fromEntries(result.headers)});res.end(Buffer.from(await result.arrayBuffer()));return;
 }
 if(!['GET','HEAD'].includes(req.method)){json(res,405,{error:'请求方法不支持。'});return;}
 let relative;try{relative=decodeURIComponent(url.pathname);}catch{json(res,400,{error:'网址无效。'});return;}
 const filename=resolve(publicRoot,'.'+(relative==='/'?'/index.html':relative));
 if(!filename.startsWith(publicRoot+'/')&&!filename.startsWith(publicRoot+'\\')){json(res,404,{error:'页面不存在。'});return;}
 let stat;try{stat=statSync(filename);}catch{json(res,404,{error:'页面不存在。'});return;}if(!stat.isFile()){json(res,404,{error:'页面不存在。'});return;}
 res.writeHead(200,{...security,'Content-Type':mime[extname(filename)]||'application/octet-stream','Content-Length':stat.size,'Cache-Control':relative.startsWith('/assets/')?'public,max-age=31536000,immutable':'no-cache'});
 if(req.method==='HEAD')res.end();else await pipeline(createReadStream(filename),res);
}catch(e){console.error('请求处理失败：',e.message);if(!res.headersSent)json(res,500,{error:'服务暂时不可用。'});else res.destroy();}});
server.requestTimeout=15000;server.headersTimeout=10000;server.keepAliveTimeout=5000;
server.listen(port,host,()=>{console.log('破局训练场已启动：'+origin);console.log('数据文件：'+databaseFile);console.log('负责人码位置：'+ownerCodeFile+'（请仅由负责人保管）');});
function stop(){server.close(()=>{closeDatabase();process.exit(0);});setTimeout(()=>process.exit(1),8000).unref();}
process.once('SIGINT',stop);process.once('SIGTERM',stop);
