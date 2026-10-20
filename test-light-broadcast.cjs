/* A live broadcast must reveal the authoritative match, not create another result. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const E=require('./light-engine'),KEY='next-stop-greatness-rmb-v1';
let parity=0;
for(const seed of [17,62,190])for(const role of ['guard','wing','big'])for(const rest of [false,true]){
 const start=E.create({seed,role});assert(E.beginMatch(start,{rest}).ok);
 const instant=E.copy(start);let live=E.copy(start),ticks=0,seen=new Set(),previousScore=[0,0];
 assert(E.simulateRemaining(instant,'expert').ok);
 while(live.match.phase!=='result'&&ticks++<600){
  const before=live.match.clock;
  if(live.match.phase==='moment'){const mo=E.currentMoment(live);assert(E.applyMoment(live,E.simulatedInput(live,mo,'expert'),mo.id).ok);}
  else assert(E.advanceBroadcast(live).ok);
  assert(live.match.clock>=before);
  for(const f of live.match.feed){const id=[f.clock,f.text,...f.score].join('|');if(seen.has(id))continue;seen.add(id);for(let side=0;side<2;side++){const difference=f.score[side]-previousScore[side];assert.equal(difference,side===f.side?(f.points||0):0,'a war report must match the scored possession');}previousScore=f.score;}
  if(ticks%7===0){live=E.restore(JSON.stringify(live));assert(live,'broadcast save must resume at the same possession');}
 }
 assert(ticks<600);assert.deepEqual(live,instant,'live and instant play must consume the same random events and settle once');
 assert(live.lastReport.feed.every(f=>!f.text.includes('比赛推进至')));
 parity++;
}
// A tie returns to the broadcast for overtime and eventually pays exactly once.
const overtime=E.create({seed:51});E.beginMatch(overtime);overtime.match.moments=[];overtime.match.clock=overtime.match.total;
for(const b of overtime.match.box)for(const p of b)p.seconds=overtime.match.total/2;
assert(E.advanceBroadcast(overtime).ok);assert.equal(overtime.match.overtimes,1);assert.equal(overtime.match.phase,'broadcast');
for(let n=0;overtime.match.phase!=='result'&&n<600;n++){if(overtime.match.phase==='moment'){const mo=E.currentMoment(overtime);E.applyMoment(overtime,E.simulatedInput(overtime,mo,'expert'),mo.id);}else E.advanceBroadcast(overtime);}
assert.equal(overtime.match.phase,'result');assert.equal(overtime.records.length,1);const settled=JSON.stringify(overtime);assert(!E.advanceBroadcast(overtime).ok);assert.equal(JSON.stringify(overtime),settled);
console.log('PASS · '+parity+' live/instant match parity cases · scored war reports · save/resume · rest · overtime · one settlement');

function ui(state){
 let now=100000,serial=0,currentMini=null;const jobs=new Map(),nodes=new Map(),events={},win={},backing=new Map([[KEY,JSON.stringify(state)]]);
 function node(q){if(!nodes.has(q))nodes.set(q,{innerHTML:'',textContent:'',open:false,hidden:false,scrollTop:0,scrollHeight:400,style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelector(){return null;},querySelectorAll(){return[];},showModal(){this.open=true;},close(){this.open=false;}});return nodes.get(q);}
 const doc={hidden:false,body:node('body'),querySelector:node,querySelectorAll:()=>[],addEventListener:(n,fn)=>events[n]=fn,createElement:()=>node('a')};
 const box={LightCareer:E,HoopsClubs:require('./team-data'),LightMini:{mount(options){const m={options,paused:false,presented:false,dispose(){},pause(){this.paused=true;},resume(){this.paused=false;},present(){this.presented=true;options.onPresented?.();},submit(input){options.onSubmit(input);}};currentMini=m;return m;}},localStorage:{getItem:k=>backing.get(k)||null,setItem:(k,v)=>backing.set(k,v),removeItem:k=>backing.delete(k)},document:doc,window:{addEventListener:(n,fn)=>win[n]=fn,scrollTo(){}},setTimeout:(fn,ms=0)=>{jobs.set(++serial,{fn,at:now+ms});return serial;},clearTimeout:id=>jobs.delete(id),Date:class extends Date{static now(){return now;}},Math,Blob,URL:{},console};
 let source=fs.readFileSync('light-ui.js','utf8').replace(/render\(\);\s*\}\)\(\);\s*$/,`window.BroadcastTest={get:()=>S,render};render();})();`);vm.runInNewContext(source,box);
 function tick(){const job=[...jobs].sort((a,b)=>a[1].at-b[1].at)[0];assert(job,'automatic play must schedule its next step');jobs.delete(job[0]);now=job[1].at;job[1].fn();}
 function advance(ms){const end=now+ms;let guard=0;while([...jobs.values()].some(x=>x.at<=end)&&guard++<1000)tick();assert(guard<1000);now=end;}
 return {get:()=>box.window.BroadcastTest.get(),html:()=>node('#content').innerHTML,node,events,win,doc,jobs,backing,tick,advance,get mini(){return currentMini;},render:()=>box.window.BroadcastTest.render(),click(action){events.click({preventDefault(){},target:{closest:()=>({dataset:{action}})}});}};
}
const entry=ui(E.create({seed:81}));entry.click('play');assert.equal(entry.get().match.phase,'broadcast');assert(!entry.node('#dialog').open);assert(!entry.html().includes('自动上场'));
const state=E.create({seed:62});E.beginMatch(state);const h=ui(state);
assert(h.html().includes('滚动比赛战报'));assert(!h.html().includes('data-action="next"'));
const first=h.get().match.clock;h.tick();assert(h.get().match.clock>first);assert.equal(h.node('#match-feed').scrollTop,400);
h.click('pause');const paused=h.get().match.clock;h.advance(5000);assert.equal(h.get().match.clock,paused);h.click('pause');
let guard=0;while(h.get().match.phase!=='moment'&&guard++<100)h.tick();assert(guard<100);assert(h.html().includes('mini-panel'));
const mo=E.currentMoment(h.get());h.mini.submit(E.simulatedInput(h.get(),mo,'expert'));assert.equal(h.get().match.phase,'feedback');assert(h.html().includes('比赛继续…'));assert(!h.html().includes('data-action="next"'));
const fixed=JSON.stringify(h.get().match);h.render();assert.equal(JSON.stringify(h.get().match),fixed,'replaying the result must not settle it again');
h.mini.present();h.click('pause');h.advance(5000);assert.equal(h.get().match.phase,'feedback');h.click('pause');h.advance(799);assert.equal(h.get().match.phase,'feedback');h.advance(1);assert.equal(h.get().match.phase,'broadcast');assert(h.html().includes('滚动比赛战报'));assert(h.html().includes(mo.result.text));
const beforeHidden=h.get().match.clock;h.doc.hidden=true;h.events.visibilitychange();h.advance(20000);assert.equal(h.get().match.clock,beforeHidden);h.doc.hidden=false;h.events.visibilitychange();h.tick();assert(h.get().match.clock>beforeHidden,'returning after the lease expires must resume the broadcast');
// The saved broadcast resumes; the first window has no authority after takeover.
const saved=E.restore(h.backing.get(KEY)),resumed=ui(saved);assert.equal(resumed.get().match.clock,h.get().match.clock);resumed.tick();assert(resumed.get().match.clock>saved.match.clock);
h.backing.set(KEY+'-controller',JSON.stringify({tab:'other-window',until:99999999}));h.events.visibilitychange();const frozen=h.get().match.clock;h.advance(2000);assert.equal(h.get().match.clock,frozen);assert(h.html().includes('另一窗口'));
for(let i=0;resumed.get().match.phase!=='result'&&i<600;i++){if(resumed.get().match.phase==='moment'){const op=E.currentMoment(resumed.get());resumed.mini.submit(E.simulatedInput(resumed.get(),op,'expert'));}if(resumed.get().match.phase==='feedback')resumed.mini.present();if(resumed.get().match.phase!=='result')resumed.tick();}
assert.equal(resumed.get().match.phase,'result');assert.equal(resumed.get().records.length,1);assert(resumed.html().includes('比赛结束'));const end=JSON.stringify(resumed.get());resumed.advance(5000);assert.equal(JSON.stringify(resumed.get()),end);
console.log('PASS · automatic feed → mini → feed → final · pause · hidden tab · refresh · controller takeover · no continue button');
