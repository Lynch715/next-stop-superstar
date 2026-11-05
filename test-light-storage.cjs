(async()=>{
/* Lossless storage and full-quota recovery: no player data is used in these fixtures. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),E=require('./light-engine');
let seed=1;function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed;}
const examples=['','a','中文🙂\u0000\ud800\udfff','ab'.repeat(100000),Array.from({length:65536},(_,i)=>String.fromCharCode(i)).join(''),Array.from({length:130000},()=>String.fromCharCode(random()>>>16)).join('')];
for(let n=0;n<40;n++)examples.push(Array.from({length:n*133},()=>String.fromCharCode(random()>>>16)).join(''));
for(const text of examples){const packed=E.packSave(text);assert.equal(E.unpackSave(packed),text);assert.equal(E.packSave(text),packed);}
const payload=E.packSave(JSON.stringify(E.create({seed:71})));for(const bad of [payload.slice(0,-1),payload+'a',payload.slice(0,-3)+'\uffff'+payload.slice(-2),payload.replace(/^NSG1\|[0-9]+/, 'NSG1|4500001')])assert.equal(E.restore(bad),null);
console.log('PASS · Unicode/lone-surrogate/large-dictionary roundtrips · bounded expansion · corruption rejection');
const KEY='next-stop-greatness-rmb-v1';
async function boot(backing,capacity){
 const nodes=new Map(),events={},win={};let limit=capacity;
 function node(q){if(!nodes.has(q))nodes.set(q,{innerHTML:'',textContent:'',open:false,hidden:false,scrollTop:0,scrollHeight:400,style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(n,f){this[n]=f;},querySelector(){return null;},querySelectorAll(){return[];},showModal(){this.open=true;},close(){this.open=false;},click(){}});return nodes.get(q);}
 const storage={getItem:k=>backing.get(k)||null,removeItem:k=>backing.delete(k),setItem(k,v){let size=k.length+v.length;for(const [key,value] of backing)if(key!==k)size+=key.length+value.length;if(size>limit){const e=new Error('full');e.name='QuotaExceededError';throw e;}backing.set(k,v);}};
 const context={LightStorage:require('./light-storage'),LightCareer:E,HoopsClubs:require('./team-data'),LightMini:{mount:()=>({dispose(){},pause(){},resume(){}})},localStorage:storage,document:{hidden:false,body:node('body'),querySelector:node,querySelectorAll:()=>[],addEventListener:(n,f)=>events[n]=f,createElement:()=>node('a')},window:{addEventListener:(n,f)=>win[n]=f,scrollTo(){}},setTimeout:()=>1,clearTimeout(){},Date,Math,Blob,URL:{createObjectURL:()=>'',revokeObjectURL(){}},console};
 const source=fs.readFileSync('light-ui.js','utf8').replace(/render\(\);\s*\}\)\(\);\s*$/,`window.StorageTest={get:()=>S,mutate,persist,control};render();})();`);await vm.runInNewContext(source,context);
 return {...context.window.StorageTest,backing,win,node,limit:n=>limit=n,click:action=>events.click({preventDefault(){},target:{closest:()=>({dataset:{action}})}})};
}
let state=E.create({seed:62});E.beginMatch(state);let raw=JSON.stringify(state);const untouched='other games keep all their data',backing=new Map([[KEY,raw],['other-game',untouched]]);const cap=[...backing].reduce((n,[k,v])=>n+k.length+v.length,0);
const h=await boot(backing,cap);assert.equal(backing.get('other-game'),untouched);assert(backing.get(KEY).length<raw.length);assert.deepEqual(E.restore(backing.get(KEY)),state);assert(h.control(),'compaction must free space for the match controller');
for(let i=0;h.get().match.phase!=='result'&&i<600;i++){
 assert((await h.mutate(()=>{const s=h.get();if(s.match.phase==='moment'){const mo=E.currentMoment(s);return E.applyMoment(s,E.simulatedInput(s,mo,'expert'),mo.id);}return E.advanceBroadcast(s);},{quiet:true})).ok);
 assert(E.restore(backing.get(KEY)));
}
assert.equal(h.get().match.phase,'result');const finished=JSON.stringify(h.get());const reloaded=await boot(backing,cap);assert.equal(JSON.stringify(reloaded.get()),finished);
// Under an entirely unwritable store, retain the original bytes and roll back the operation.
const beforeDisk=backing.get(KEY),beforeState=JSON.stringify(reloaded.get());reloaded.limit(0);assert.equal(await reloaded.mutate(()=>E.dismissResult(reloaded.get())),false);assert.equal(backing.get(KEY),beforeDisk);assert.equal(JSON.stringify(reloaded.get()),beforeState);reloaded.click('export');assert.equal(backing.get(KEY),beforeDisk);
const denied=new Map([[KEY,raw],['other-game',untouched]]);const d=await boot(denied,0);assert.equal(denied.get(KEY),raw);assert.deepEqual(d.get(),state);
// A newer compressed save from another window wins; no regression to the old revision.
reloaded.limit(cap);const newer=E.copy(reloaded.get());newer.saveRevision+=5;newer.wallet+=100;backing.set(KEY,E.saveText(newer));assert.equal(await reloaded.mutate(()=>E.dismissResult(reloaded.get())),false);assert.equal(reloaded.get().wallet,newer.wallet);assert.equal(backing.get('other-game'),untouched);
const eventState=E.copy(newer);eventState.saveRevision++;eventState.wallet++;backing.set(KEY,E.saveText(eventState));await reloaded.win.storage({key:KEY,newValue:E.saveText(eventState)});assert.equal(reloaded.get().wallet,eventState.wallet);
console.log('PASS · quota exactly full -> in-place compaction -> controller -> complete match -> reload · denied writes preserve original · export without writes · compressed cross-tab conflicts/events · other game data preserved');

})().catch(error=>{console.error(error);process.exitCode=1;});
