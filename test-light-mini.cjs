/* Rendering safety and real mount input/replay lifecycle; browser QA covers appearance. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),E=require('./light-engine'),Mini=require('./light-mini');
let paints=0;
function context(){const texts=[];const c=new Proxy({texts,createLinearGradient(){return {addColorStop(){}};},createRadialGradient(){return {addColorStop(){}};}},{get(o,k){if(k in o)return o[k];return (...args)=>{for(const n of args)if(typeof n==='number')assert(Number.isFinite(n),`${String(k)} received ${n}`);if(k==='fillText')texts.push(args[0]);paints++;};},set(o,k,v){if(typeof v==='number')assert(Number.isFinite(v));o[k]=v;return true;}});return c;}
const s=E.create({seed:62,name:'场景验收'});
for(const kind of Object.keys(E.kinds))for(const mode of ['success','fail','timeout','finish-miss']){
 const m=E.practice(s,kind);if(mode==='finish-miss')m.finishRoll=.999;
 const input=mode==='timeout'?{timeout:true}:kind==='drive'?{side:1,lean:mode==='fail'?1:-1}:{marker:mode==='fail'?0:m.center,lane:m.lane};
 const result=E.miniOutcome(s,m,input),before=JSON.stringify(s),momentBefore=JSON.stringify(m),c=context();
 for(const progress of [0,.15,.4,.6,.8,1])Mini.renderScene(c,{moment:m,params:E.miniParams(s,m),elapsed:2,marker:m.center,lean:-.8,result,input,progress,number:99});
 assert(c.texts.includes(result.text));assert.equal(JSON.stringify(s),before);assert.equal(JSON.stringify(m),momentBefore);
 for(const marker of [0,m.center,1])Mini.renderScene(c,{moment:m,params:E.miniParams(s,m),marker,lean:marker*2-1,number:7});
}
// Visible depth regression: back-facing arms/chest-held ball must be under the jersey.
function depthContext(){const draws=[],c=context();let path=[];c.createLinearGradient=c.createRadialGradient=()=>({stops:[],addColorStop(at,color){this.stops.push(color);}});c.beginPath=()=>path=[];c.moveTo=(x,y)=>path.push([x,y]);c.lineTo=(x,y)=>path.push([x,y]);c.fill=()=>draws.push({type:'fill',stops:c.fillStyle?.stops||[]});c.stroke=()=>draws.push({type:'stroke',path:[...path],color:c.strokeStyle});return {c,draws};}
let depthCases=0;
for(const kind of Object.keys(E.kinds))for(const mode of ['success','fail','timeout'])for(const side of [-1,1])for(const captured of [0,1.234,5.8,6])for(const progress of [null,.25,.47,.73,.95]){
 const moment=E.practice(s,kind);moment.finishRoll=0;moment.lane=depthCases%3;const input={visualTime:captured,...(mode==='timeout'?{timeout:true}:kind==='drive'?{side,lean:mode==='safe-pass'?0:mode==='blocked'?-side*.1:mode==='fail'?side:-side}:{marker:mode==='fail'?0:moment.center,lane:moment.lane})},config={moment,params:E.miniParams(s,moment),elapsed:captured,marker:input.marker??moment.center,lean:input.lean??0,input,...(progress===null?{}:{result:E.miniOutcome(s,moment,input),progress})},frame=Mini.poseFrame(config),{c,draws}=depthContext();Mini.renderScene(c,config);
 const ball=draws.flatMap((x,i)=>x.stops?.includes('#ffba62')?[i]:[]),back=draws.findIndex(x=>x.stops?.includes('#f2eee0'));assert.equal(ball.length,1,'paint each basketball exactly once');if(!frame.ball.owner||frame.ball.owner==='you')assert(ball[0]<back,'front-held/flying ball must be behind the playable athlete: '+kind+'/'+mode+'/'+progress);
 for(const a of frame.actors){const jersey=draws.findIndex(x=>x.stops?.includes(a.opponent?'#dc775b':'#f2eee0'));for(const side of ['L','R'])for(const [fromKey,toKey] of [['shoulder','elbow'],['elbow','hand']]){const from=a.rig[fromKey+side],to=a.rig[toKey+side],arm=draws.findIndex(x=>x.type==='stroke'&&x.color==='#dba779'&&x.path.length===2&&Math.hypot(x.path[0][0]-from.x,x.path[0][1]-from.y,x.path[1][0]-to.x,x.path[1][1]-to.y)<1e-6);assert(arm>=0);assert(a.opponent?arm>jersey:arm<jersey,'arm depth must agree with facing direction');}}
 if(frame.ball.owner==='opponent')assert(ball[0]>draws.findIndex(x=>x.stops?.includes('#dc775b')),'front-facing ball must stay over the chest');
 depthCases++;
}
console.log('PASS · '+depthCases+' facing/depth scenes · arms and held ball stay in front of body · one ball paint');
function rig(m){const queue=new Map(),c=context(),listeners={},win={},buttons=[-1,0,1,2].map(n=>node({dataset:{mini:String(n)}})),canvas=node({getContext:()=>c,getBoundingClientRect:()=>({left:10,top:0,width:310,height:200})}),nodes={canvas,'.mini-status':node(),'.mini-marker':node(),'.mini-window':node()},classes=new Set(),after=node({disabled:true});let serial=0,submits=[],presented=0,checkpoints=[];
 function node(extra={}){const e={events:{},style:{},disabled:false,addEventListener(k,fn){this.events[k]=fn;},removeEventListener(k){delete this.events[k];},...extra};return e;}
 const container={classList:{toggle(k,on){on?classes.add(k):classes.delete(k);},add:k=>classes.add(k)},querySelector:k=>nodes[k],querySelectorAll:k=>k==='[data-mini]'?buttons:k==='[data-after-replay]'?[after]:[]};
 const document={hidden:false,addEventListener(k,fn){listeners[k]=fn;},removeEventListener(k){delete listeners[k];}},window={devicePixelRatio:3,addEventListener(k,fn){win[k]=fn;},removeEventListener(k){delete win[k];}};
 const sandbox={window,document,console,requestAnimationFrame(fn){queue.set(++serial,fn);return serial;},cancelAnimationFrame:id=>queue.delete(id)};vm.runInNewContext(fs.readFileSync('light-mini.js','utf8'),sandbox);
 const mount=sandbox.LightMini.mount({engine:E,state:s,moment:m,container,onSubmit:x=>submits.push(x),onPresented:()=>presented++,onCheckpoint:x=>checkpoints.push(x)});
 return {mount,canvas,buttons,queue,after,classes,document,listeners,win,submits,checkpoints,get presented(){return presented;},step(ts){const jobs=[...queue.values()];queue.clear();jobs.forEach(fn=>fn(ts));},click(x){canvas.events.pointerdown({preventDefault(){},clientX:x});}};
}
// Preparation and duplicate touch/keyboard events cannot create a second submission.
for(const kind of ['shot','rebound','steal','drive']){const r=rig(E.practice(s,kind));r.step(0);r.click(300);assert.equal(r.submits.length,0);r.step(1000);r.click(300);r.click(30);r.buttons[2].events.click({detail:0});assert.equal(r.submits.length,1);if(kind==='rebound')assert.equal(r.submits[0].lane,2,'310px CSS canvas must map to right landing lane');if(kind==='drive')assert.equal(r.submits[0].side,1);r.mount.dispose();assert.equal(r.queue.size,0);assert(!r.canvas.events.pointerdown);assert.equal(Object.keys(r.listeners).length,0);}
// A timeout saves the last displayed pose as well, rather than replaying an older half-second checkpoint.
const timeoutRig=rig(E.practice(s,'drive'));timeoutRig.step(0);timeoutRig.step(7000);assert.equal(timeoutRig.submits.length,1);assert(timeoutRig.submits[0].timeout);assert.equal(timeoutRig.submits[0].visualTime,6);assert.equal(timeoutRig.submits[0].marker,E.pointerAt(6,E.practice(s,'drive').phase/(Math.PI*2)));assert.equal(timeoutRig.submits[0].lean,E.leanAt(6,E.practice(s,'drive').phase));timeoutRig.mount.dispose();
// Stored feedback replays, including a pause, without applying another game action.
const m=E.practice(s,'drive');m.input={side:1,lean:-1};m.result=E.miniOutcome(s,m,m.input);const r=rig(m);r.step(0);r.step(500);r.mount.pause();r.step(50000);assert.equal(r.presented,0);r.mount.resume();r.step(50000);r.step(51000);r.step(52000);r.click(300);assert.equal(r.submits.length,0);assert.equal(r.presented,1);assert(r.classes.has('is-presented'));assert.equal(r.after.disabled,false);r.step(53000);assert.equal(r.presented,1);assert.equal(r.queue.size,0);r.mount.dispose();assert.equal(r.checkpoints.length,0,'feedback cannot overwrite the original elapsed checkpoint');
// A background interval freezes the input clock rather than timing out on return.
const b=rig(E.practice(s,'shot'));b.step(0);b.step(1000);b.document.hidden=true;b.listeners.visibilitychange();b.step(100000);assert.equal(b.submits.length,0);b.document.hidden=false;b.listeners.visibilitychange();b.step(100000);b.step(100800);b.click(100);assert.equal(b.submits.length,1);b.mount.dispose({checkpoint:false});

// Physical continuity: the input frame, release/catch frames and attached hands must agree.
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);let maxStep=0,maxContactRatio=0,poseCases=0,boundaryChecks=0,maxBoundaryGap=0;
const boundaries=[.12,.13,.15,.16,.17,.18,.19,.2,.22,.24,.28,.29,.3,.31,.32,.34,.36,.38,.4,.42,.44,.47,.48,.5,.53,.54,.55,.56,.57,.59,.6,.61,.62,.63,.65,.7,.72,.73,.74,.75,.76,.77,.8,.83,.84,.86,.91,.92,.93,.95];
for(const kind of Object.keys(E.kinds))for(const mode of ['success','fail','timeout','finish-miss','wrong-lane','safe-pass','blocked'])for(const captured of [0,.2,1.234,3.4,5.8,6])for(const side of [-1,1]){
 if((mode==='safe-pass'||mode==='blocked')&&kind!=='drive')continue;if(mode==='wrong-lane'&&kind!=='rebound')continue;const mo=E.practice(s,kind);mo.lane=poseCases%3;if(mode==='finish-miss')mo.finishRoll=.999;
 const input={visualTime:captured,...(mode==='timeout'?{timeout:true}:kind==='drive'?{side,lean:mode==='safe-pass'?0:mode==='blocked'?-side*.1:mode==='fail'?side:-side}:{marker:mode==='fail'?0:mo.center,lane:mode==='wrong-lane'?(mo.lane+1)%3:mo.lane})},result=E.miniOutcome(s,mo,input),config={moment:mo,params:E.miniParams(s,mo),elapsed:captured,marker:input.marker??.5,lean:input.lean??0,input};
 const live=Mini.poseFrame(config);let last=Mini.poseFrame({...config,result,progress:0});assert(distance(live.ball,last.ball)<1e-8,kind+' must not move the ball when accepting input');
 for(const a of last.actors){const b=live.actors.find(x=>x.id===a.id);for(const k of Object.keys(a.rig))assert(distance(a.rig[k],b.rig[k])<1e-8,kind+' must preserve the input pose '+k);}
 for(let i=1;i<=600;i++){
  const f=Mini.poseFrame({...config,result,progress:i/600});maxStep=Math.max(maxStep,distance(f.ball,last.ball));assert(distance(f.ball,last.ball)<4.5,kind+' ball teleported at '+i/600);
  for(const a of f.actors){const old=last.actors.find(x=>x.id===a.id);for(const k of Object.keys(a.rig)){const d=distance(a.rig[k],old.rig[k]);maxStep=Math.max(maxStep,d);assert(d<4.5,kind+' joint jumped: '+k+' at '+i/600);}
   for(const k of ['L','R']){const shoulder=a.rig['shoulder'+k],hand=a.rig['hand'+k],elbow=a.rig['elbow'+k];assert(elbow.y>=Math.min(shoulder.y,hand.y)-1e-6,'raised hands must not invert the elbow over the ball');const hip=a.rig['hip'+k],foot=a.rig['foot'+k],knee=a.rig['knee'+k];assert(distance(knee,{x:(hip.x+foot.x)/2,y:(hip.y+foot.y)/2})<=3.37*a.scale,'knees must bend into depth without a splayed silhouette');for(const [from,to,length] of [['shoulder','elbow',19],['elbow','hand',19],['hip','knee',21],['knee','foot',21]]){const n=distance(a.rig[from+k],a.rig[to+k]);assert(n<=length*a.scale+1e-6,'projected limb must not stretch');}}
  }
  if(f.ball.owner){const a=f.actors.find(x=>x.id===f.ball.owner);for(const k of f.ball.hand==='both'?['L','R']:[f.ball.hand==='left'?'L':'R']){const ratio=distance(f.ball,a.rig['hand'+k])/f.ball.r;maxContactRatio=Math.max(maxContactRatio,ratio);assert(ratio<=1.02,'held ball must stay in contact with the owning palm');}}
  last=f;
 }
 // Sample both sides of every authored transition. Regular 60 Hz stepping can miss a small snap.
 for(const edge of boundaries){const a=Mini.poseFrame({...config,result,progress:edge-1e-7}),b=Mini.poseFrame({...config,result,progress:edge+1e-7}),check=(p,q)=>{const gap=distance(p,q);maxBoundaryGap=Math.max(maxBoundaryGap,gap);assert(gap<.001,kind+'/'+mode+' snapped at '+edge+': '+gap);};check(a.ball,b.ball);for(const actor of a.actors){const other=b.actors.find(x=>x.id===actor.id);for(const key of Object.keys(actor.rig))check(actor.rig[key],other.rig[key]);}boundaryChecks++;}
 for(const event of [last.release,last.contact].filter(Boolean)){const f=Mini.poseFrame({...config,result,progress:event.at});assert(distance(f.ball,event.point)<1e-6,kind+' ball snapped at a release or catch');const actor=f.actors.find(a=>a.id===(event.actor||'you')),head={x:actor.rig.head.x,y:actor.rig.head.y+(actor.opponent?3:4)*actor.scale},clearance=((f.ball.x-head.x)/(10.5*actor.scale+f.ball.r))**2+((f.ball.y-head.y)/(12.5*actor.scale+f.ball.r))**2;assert(clearance>=1,kind+' release/catch must clear the head, not pass through the face');}
 poseCases++;
}
// The visual timestamp is part of the saved input, not a second result or RNG draw.
const saved=E.create({seed:62});E.beginMatch(saved);E.nextMoment(saved);const op=E.currentMoment(saved),click={...E.simulatedInput(saved,op,'expert'),visualTime:1.234};E.applyMoment(saved,click,op.id);const restored=E.restore(JSON.stringify(saved));assert(restored);assert.equal(E.currentMoment(restored).input.visualTime,1.234);
console.log('PASS · '+poseCases+' motion cases · no input/release/catch snaps · bounded projected limbs · held-ball contact · max step '+maxStep.toFixed(2)+' px · contact radius '+maxContactRatio.toFixed(2));
console.log('PASS · '+boundaryChecks+' authored transitions · max gap '+maxBoundaryGap.toFixed(6)+' px · left/right safe pass and turnover branches');
assert(paints>1000);console.log('PASS · 16 result scenes + live boundaries · finite DPR drawing · render purity · scaled court taps · single submission · replay without settlement · pause/background · listener cleanup');
