/* Durable saves. Keep the old localStorage bytes until the database transaction commits. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.LightStorage=api;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
'use strict';
const KEY='next-stop-greatness-rmb-v1',POINTER='NSG-IDB1|',RESET='NSG-RESET1|';
function create({engine:E,storage,idb,timeout=2500}){
 let database=null,opening,mode='local',blocked=false;
 const readLocal=()=>{try{return storage.getItem(KEY);}catch{return null;}};
 function decode(raw){
  if(typeof raw==='string'&&raw.startsWith(RESET)){const revision=Number(raw.slice(RESET.length));return Number.isSafeInteger(revision)&&revision>=0?{state:null,revision}:null;}
  const state=raw&&E.restore(raw);return state?{state,revision:state.saveRevision||0}:null;
 }
 function decodeRecord(record){
  if(!record||!Number.isSafeInteger(record.revision)||record.revision<0)return null;
  if(record.payload===null)return {state:null,revision:record.revision};
  const value=decode(record.payload);return value&&value.revision===record.revision?value:null;
 }
 function newest(a,b){return !a?b:!b?a:b.revision>=a.revision?b:a;}
 function mark(revision){try{storage.setItem(KEY,POINTER+revision);}catch{/* The committed database remains authoritative even when localStorage is disabled. */}}
 async function open(){
  if(opening)return opening;
  opening=new Promise(resolve=>{
   if(!idb){resolve();return;}
   let request,finished=false;
   const done=db=>{if(finished){db?.close();return;}finished=true;clearTimeout(timer);database=db;mode=db?'database':'local';resolve();};
   const timer=setTimeout(()=>done(null),timeout);
   try{request=idb.open(KEY,1);request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains('saves'))request.result.createObjectStore('saves');};request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>{db.close();database=null;blocked=true;};done(db);};request.onerror=()=>done(null);request.onblocked=()=>done(null);}catch{done(null);}
  });return opening;
 }
 // Read and compare inside the same read/write transaction as the commit, across tabs.
 function transaction(candidate,expected,migrate=false){return new Promise((resolve,reject)=>{
  if(!database){reject(new Error('存档数据库暂时不可用，请刷新后重试'));return;}
  let tx,result;
  try{
   tx=database.transaction('saves','readwrite');const store=tx.objectStore('saves'),request=store.get(KEY);
   request.onsuccess=()=>{try{
    const raw=readLocal(),local=decode(raw),record=decodeRecord(request.result),latest=newest(local,record);
    if(request.result&&!record){throw new Error('未能读取数据库存档，请保留备份');}
    if(migrate){
     if(!latest&&raw?.startsWith(POINTER))throw new Error('未能找到数据库存档，请导入备份');
     result={ok:true,state:latest?.state||null,revision:latest?.revision||0,damaged:!!raw&&!local&&!raw.startsWith(POINTER)};
     if(local&&(!record||local.revision>record.revision))store.put({revision:local.revision,payload:local.state?E.saveText(local.state):null},KEY);
     return;
    }
    if(latest&&latest.revision>expected){result={ok:false,conflict:true,...latest};return;}
    const revision=expected+1,payload=candidate?E.saveText({...candidate,saveRevision:revision}):null;
    store.put({revision,payload},KEY);result={ok:true,revision};
   }catch(error){result={error};tx.abort();}};
   tx.oncomplete=()=>{if(result?.ok&&(result.state||!migrate||result.revision))mark(result.revision);resolve(result);};
   tx.onabort=tx.onerror=()=>reject(result?.error||tx.error||new Error('浏览器未能写入存档'));
  }catch(error){reject(error);}
 });}
 async function load(){
  await open();
  if(blocked)throw new Error('存档数据库暂时不可用，请刷新后重试');
  if(mode==='database')try{return await transaction(null,0,true);}catch(error){
   // A failed migration must still let the player view/export the readable original.
   const original=decode(readLocal());if(original){error.state=original.state;error.revision=original.revision;}throw error;
  }
  const raw=readLocal();blocked=!!raw?.startsWith(POINTER);
  if(blocked)throw new Error('浏览器暂时无法打开存档数据库，请刷新后重试');
  const value=decode(raw);return {state:value?.state||null,revision:value?.revision||0,damaged:!!raw&&!value};
 }
 async function save(candidate,expected){
  await open();if(blocked)throw new Error('存档数据库暂时不可用，请刷新后重试');
  if(mode==='database')return transaction(candidate,expected);
  const raw=storage.getItem(KEY);if(raw?.startsWith(POINTER))throw new Error('存档数据库暂时不可用，请刷新后重试');
  const latest=decode(raw);if(latest&&latest.revision>expected)return {ok:false,conflict:true,...latest};
  const revision=expected+1;storage.setItem(KEY,candidate?E.saveText({...candidate,saveRevision:revision}):RESET+revision);return {ok:true,revision};
 }
 return {load,save,reset:revision=>save(null,revision),get mode(){return mode;}};
}
return {create,KEY};
});
