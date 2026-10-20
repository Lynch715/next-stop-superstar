/* Fixed-coordinate court scenes. Results are committed before their visual replay. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.LightMini=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const WIDTH=620,HEIGHT=400,TAU=Math.PI*2,clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n)),ease=n=>{n=clamp(n);return n*n*(3-2*n);},mix=(a,b,t)=>a+(b-a)*t;
function clock(elapsed=0){let last=null,prep=.8,paused=false;return {get elapsed(){return elapsed;},get preparing(){return prep>0;},get paused(){return paused;},pause(){paused=true;last=null;},resume(){paused=false;last=null;prep=.8;},tick(ts){if(paused)return elapsed;if(last===null){last=ts;return elapsed;}let dt=Math.max(0,(ts-last)/1000);last=ts;if(prep>0){const used=Math.min(dt,prep);prep-=used;dt-=used;}elapsed=Math.min(6,elapsed+dt);return elapsed;}};}
// Joint coordinates and ball possession share one pose model, independent of rendering.
const pt=(x,y)=>({x,y}),lerpPt=(a,b,t)=>pt(mix(a.x,b.x,t),mix(a.y,b.y,t)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),seq=(t,keys)=>{for(let i=1;i<keys.length;i++)if(t<=keys[i][0])return mix(keys[i-1][1],keys[i][1],ease((t-keys[i-1][0])/(keys[i][0]-keys[i-1][0])));return keys.at(-1)[1];};
const vec=(t,keys)=>pt(seq(t,keys.map(([u,v])=>[u,v.x])),seq(t,keys.map(([u,v])=>[u,v.y]))),arc=(a,b,u,h)=>pt(mix(a.x,b.x,u),mix(a.y,b.y,u)-4*h*u*(1-u));
function joint(a,b,length,bend=1){const d=Math.max(.001,dist(a,b)),reach=Math.min(d,length*1.995),end=lerpPt(a,b,reach/d),mid=lerpPt(a,end,.5),h=Math.sqrt(Math.max(0,length*length-reach*reach/4));return {mid:pt(mid.x-(end.y-a.y)/reach*h*bend,mid.y+(end.x-a.x)/reach*h*bend),end};}
// The elbow can turn through depth as the hand crosses shoulder height; its projection shortens, never stretches.
function armJoint(a,b,length){const solved=joint(a,b,length,1),center=lerpPt(a,solved.end,.5),u=ease(clamp((b.y-a.y+length*.32)/(length*.64))),depth=u<.5?.75*(1-2*u):.28*(2*u-1),bend=Math.tanh((b.x-a.x)/(length*.25))*depth;return {mid:lerpPt(center,solved.mid,bend),end:solved.end};}
// Knees bend mainly into court depth. Keep their screen silhouette close to the hip-foot line.
function legJoint(a,b,length,side){const solved=joint(a,b,length,side),center=lerpPt(a,solved.end,.5),full=solved.mid;return {mid:lerpPt(center,full,.16),end:solved.end};}
function actorPose(spec){
 const a={x:310,y:330,scale:1.4,crouch:0,jump:0,lean:0,step:0,opponent:false,...spec},s=a.scale,drop=a.crouch*9,bias=a.lean*7,W=p=>pt(a.x+p.x*s,a.y-a.jump+p.y*s);
 const hipL=W(pt(-6+bias*.28,-37+a.crouch*12)),hipR=W(pt(6+bias*.28,-37+a.crouch*12)),shoulderL=W(pt(-13+bias,-64+a.crouch*12)),shoulderR=W(pt(13+bias,-64+a.crouch*12));
 const footL=a.feet?.left||W(pt(-11+Math.sin(a.step)*3,0)),footR=a.feet?.right||W(pt(11-Math.sin(a.step)*3,0));
 const handL=W(a.left||pt(-19+bias,-42+drop)),handR=W(a.right||pt(20+bias,-43+drop));
 const armL=armJoint(shoulderL,handL,19*s),armR=armJoint(shoulderR,handR,19*s),legL=legJoint(hipL,footL,21*s,1),legR=legJoint(hipR,footR,21*s,-1);
 return {...a,rig:{hipL,hipR,shoulderL,shoulderR,elbowL:armL.mid,elbowR:armR.mid,handL:armL.end,handR:armR.end,kneeL:legL.mid,kneeR:legR.mid,footL:legL.end,footR:legR.end,head:W(pt(bias*1.06,-82+a.crouch*12))}};
}
function blendPose(start,end,u){const a={...end,x:mix(start.x,end.x,u),y:mix(start.y,end.y,u),scale:mix(start.scale,end.scale,u),jump:mix(start.jump,end.jump,u),crouch:mix(start.crouch,end.crouch,u),lean:mix(start.lean,end.lean,u)};a.left=local(a,lerpPt(start.rig.handL,end.rig.handL,u));a.right=local(a,lerpPt(start.rig.handR,end.rig.handR,u));a.feet={left:lerpPt(start.rig.footL,end.rig.footL,u),right:lerpPt(start.rig.footR,end.rig.footR,u)};return actorPose(a);}
function local(a,p){return pt((p.x-a.x)/a.scale,(p.y-a.y+a.jump)/a.scale);}
function hold(a,center=pt(12,-53),hand='both'){
 const r=7.8*a.scale,drop=a.crouch*9,at=pt(center.x,center.y+drop),b={...a};
 if(hand==='both'){b.left=pt(at.x-6.4,at.y+1.8);b.right=pt(at.x+6.4,at.y+1.8);}else b[hand==='left'?'left':'right']=pt(at.x,at.y-6.1);
 const pose=actorPose(b),h=hand==='both'?lerpPt(pose.rig.handL,pose.rig.handR,.5):pose.rig[hand==='left'?'handL':'handR'];
 return {actor:pose,ball:{x:h.x,y:h.y+(hand==='both'?-1.8:6.1)*a.scale,r,owner:a.id,hand,spin:0}};
}
function dribble(a,time,side=1,wide=0){
 const u=((time/.72)%1+1)%1,drop=a.crouch*9,at=pt(side*(24+wide),-43+drop),r=7.8*a.scale;
 const follow=1-ease(clamp(Math.min(u,1-u)/.17)),spec={...a,[side<0?'left':'right']:pt(at.x,at.y+4*(1-follow))},pose=actorPose(spec),h=pose.rig[side<0?'handL':'handR'],top=pt(h.x,a.y-a.jump+(at.y+6.1)*a.scale),ground=a.y-r,fall=u<.5?(2*u)**2:(2*(1-u))**2;
 return {actor:pose,ball:{x:top.x,y:mix(top.y,ground,fall),r,owner:null,hand:null,spin:time*5,dribble:true,contact:u<.025||u>.975?a.id:null}};
}
function moving(a,from,to,u){
 const v=clamp(u),d=dist(from,to),steps=Math.max(2,Math.ceil(d/25)),root=lerpPt(from,to,ease(v)),feet={};
 for(const [name,offset,side] of [['left',0,-1],['right',.5,1]]){const phase=v*steps+offset,n=Math.floor(phase),f=phase-n,lo=clamp((n-offset)/steps),hi=clamp((n+1-offset)/steps),swing=ease(clamp((f-.52)/.48)),base=lerpPt(lerpPt(from,to,ease(lo)),lerpPt(from,to,ease(hi)),swing),settle=ease(clamp((v-.86)/.14));feet[name]=pt(mix(base.x,root.x,settle)+side*11*a.scale,clamp(mix(base.y,root.y,settle),root.y-4*a.scale,root.y+4*a.scale)-Math.sin(Math.PI*swing)*7*a.scale*(1-settle));}
 return {...a,x:root.x,y:root.y,feet,step:v*steps*TAU};
}
function cubic(a,b,c,d,t){const u=1-t;return pt(u*u*u*a.x+3*u*u*t*b.x+3*u*t*t*c.x+t*t*t*d.x,u*u*u*a.y+3*u*u*t*b.y+3*u*t*t*c.y+t*t*t*d.y);}
function followThrough(a,side,relax,bend){const shooting=side==='R'?'right':'left',guide=side==='R'?'left':'right',b={...a},target=pt(side==='R'?-19+a.lean*7:20+a.lean*7,-42+a.crouch*9);b[guide]=lerpPt(a[guide],target,relax);b[shooting]=pt(a[shooting].x+(side==='R'?1:-1)*1.5*bend,a[shooting].y+3*bend);b.flick={side,amount:bend};return actorPose(b);}
function poseFrame({moment:m,params:p,elapsed=0,marker=.5,lean=0,result=null,input={},progress=0}){
 const done=!!result,t=clamp(progress),time=done&&Number.isFinite(input.visualTime)?clamp(input.visualTime,0,6):elapsed,read=done?(input.marker??marker):marker,L=done?(input.lean??lean):lean,good=!!result?.success;
 const own={id:'you',x:310,y:330,scale:1.45,crouch:.18+.035*Math.sin(time*3),lean:.035*Math.sin(time*2),jump:0,step:0},opp={id:'opponent',opponent:true,x:310,y:250,scale:1.16,crouch:.22,jump:0,step:0,lean:0,left:pt(-29,-51),right:pt(29,-51)};
 let actors=[],ball,phase='准备',contact=null,release=null;
 function setHold(a,center,hand='both'){const held=hold(a,center,hand);actors.push(held.actor);return held.ball;}
 function setDribble(a,at,side=1,wide=0){const d=dribble(a,at,side,wide);actors.push(d.actor);return d.ball;}
 function resultBall(a,b,u,height=60){const q=arc(a,b,clamp(u),height);return {x:q.x,y:q.y,r:mix(a.r||10,b.r||7,clamp(u)),owner:null,hand:null,spin:(a.spin||0)+clamp(u)*5};}
 if(m.kind==='shot'){
  const base={...own,x:294,y:326,scale:1.5},start=hold(base,pt(15,-57)),releaseAt=.31;
  if(!done){actors=[start.actor];ball=start.ball;phase='持球';}
  else if(result.timeout){function passer(q){const a={...base,crouch:seq(q,[[0,base.crouch],[.2,.38],[.48,.2],[1,.12]])};return hold(a,pt(seq(q,[[0,15],[.24,6],[1,0]]),seq(q,[[0,-57],[.24,-47],[1,-43]])));}const h=passer(t),r=passer(.24).ball;actors=[h.actor];ball=t<.24?h.ball:resultBall(r,{x:102,y:280,r:8},(t-.24)/.76,24);release={at:.24,point:r};phase=t<.24?'回传准备':'安全回传';}
  else{
   function shooter(q){const jump=q<.19||q>.72?0:22*4*((q-.19)/.53)*(1-(q-.19)/.53),a={...base,crouch:seq(q,[[0,base.crouch],[.15,.9],[.3,.02],[.65,.04],[.76,.65],[1,.12]]),jump,lean:seq(q,[[0,base.lean],[.2,-.08],[.4,.08],[1,0]])},center=pt(seq(q,[[0,15],[.15,12],[releaseAt,9],[.62,9],[1,15]]),seq(q,[[0,-57],[.15,-54],[releaseAt,-98],[.62,-99],[1,-57]]));return hold(a,center);}
   const pose=shooter(t),launch=shooter(releaseAt).ball;actors=[t<releaseAt?pose.actor:followThrough(pose.actor,'R',ease(clamp((t-.34)/.35)),ease(clamp((t-releaseAt)/.12))*(1-ease(clamp((t-.7)/.3))))];release={at:releaseAt,point:launch};
   if(t<releaseAt){ball=pose.ball;phase=t<.18?'屈膝蓄力':'蹬地抬臂';}
   else{const u=clamp((t-releaseAt)/.43),v=clamp((t-.74)/.26),rim={x:good?310:328,y:132,r:7};ball=resultBall(launch,rim,u,79);if(u>=1){const q=good?pt(310,132+58*ease(v)):arc(rim,pt(385,207),ease(v),26);Object.assign(ball,q);}phase=t<.74?'压腕出手':good?'入网落地':'碰筐回弹';}
  }
 }
 if(m.kind==='rebound'){
  const xs=[166,310,454],target=xs[m.lane],lane=Number.isInteger(input.lane)?input.lane:1,chosen=xs[lane],base={...own,x:270,scale:1.32},def={...opp,x:340,y:324,scale:1.15},u=clamp(.08+read*.85),initial={...arc(pt(310,139),pt(target,272),u,55),r:mix(7,10,u),owner:null,hand:null,spin:time*4};
  if(!done){actors=[actorPose(base),actorPose(def)];ball=initial;phase='判断落点';}
  else{
   const catchAt=.47;
   function jumper(q,isYou){const wins=isYou?good:!good,b=isYou?base:def,end=pt(isYou?chosen:target+17,306),move=moving(b,pt(b.x,b.y),end,clamp(q/.36)),j=q<.22||q>.83?0:4*((q-.22)/.61)*(1-(q-.22)/.61)*(wins?39:28),a={...move,feet:q>=.22&&q<=.83?null:move.feet,jump:j,crouch:seq(q,[[0,b.crouch],[.16,.8],[.31,0],[.77,.12],[.86,.8],[1,.22]]),lean:seq(q,[[0,b.lean],[.23,(end.x-b.x)/300],[.5,0],[1,0]])},h=pt(0,seq(q,[[0,-43],[.19,-52],[catchAt,-101],[.57,-79],[.84,-48],[1,-47]]));
    // Begin with the same relaxed hands as the live pose, then gather overhead.
    if(q<.16){const v=ease(q/.16);a.left=lerpPt(b.left||pt(-19+b.lean*7,-42+b.crouch*9),pt(-6.4,h.y+a.crouch*9+1.8),v);a.right=lerpPt(b.right||pt(20+b.lean*7,-43+b.crouch*9),pt(6.4,h.y+a.crouch*9+1.8),v);return {actor:actorPose(a),ball:null};}
    if(q>=.22)a.step=0;if(q>=.22&&q<.32){const v=ease((q-.22)/.1);a.feet={left:lerpPt(move.feet.left,pt(a.x-11*a.scale,a.y-j),v),right:lerpPt(move.feet.right,pt(a.x+11*a.scale,a.y-j),v)};}
    return hold(a,h);
   }
   const a=jumper(t,true),b=jumper(t,false),winner=good?a:b,catchPose=jumper(catchAt,good);actors=[a.actor,b.actor];contact={at:catchAt,actor:good?'you':'opponent',point:catchPose.ball};
   ball=t<catchAt?resultBall(initial,catchPose.ball,ease(t/catchAt),28):winner.ball;phase=t<.2?'卡位蓄力':t<catchAt?'蹬地争抢':t<.83?'双手收球':'屈膝落地';
  }
 }
 if(m.kind==='steal'){
  const exposure=clamp(1-Math.abs(read-m.center)/(p.W*.72)),def={...opp,crouch:.2+.035*Math.sin(time*5)},initial=dribble(def,time,1,exposure*19),base={...own,crouch:own.crouch+.16};
  if(!done){actors=[initial.actor,actorPose(base)];ball=initial.ball;phase=exposure>.4?'露球':'盯住持球手';}
  else if(result.timeout){const d=dribble(def,time+t*1.65,1,exposure*19);actors=[d.actor,actorPose({...base,crouch:base.crouch+.05*Math.sin(t*Math.PI)})];ball=d.ball;phase='保持站位';}
  else{
   const pokeAt=.29,gatherAt=.61,pick=dribble(def,time+pokeAt*1.65,1,exposure*19).ball;
   function thief(q){const u=clamp(q/.32),back=ease(clamp((q-.36)/.64)),a=moving({...base,crouch:seq(q,[[0,base.crouch],[.28,.48],[.53,.27],[1,.26]]),lean:seq(q,[[0,base.lean],[.27,.36],[.6,-.1],[1,0]])},pt(base.x,base.y),pt(325,300),u);a.x-=back*(good?20:14);a.y+=back*(good?21:13);if(back>0)a.feet=null;return a;}
   const a=thief(t),gather=hold(thief(gatherAt),pt(8,-47)),carry=hold(a,pt(8,-47));
   if(good){const transfer=ease(clamp((t-pokeAt)/(gatherAt-pokeAt))),movingBall=t<pokeAt?dribble(def,time+t*1.65,1,exposure*19).ball:t<gatherAt?{...resultBall(pick,gather.ball,transfer,0),...cubic(pick,pt(pick.x+12,Math.max(pick.y+22,gather.ball.y+10)),pt(gather.ball.x+28,gather.ball.y+20),gather.ball,transfer)}:carry.ball;
    if(t<gatherAt){const g=ease(clamp((t-.42)/.19)),target=local(a,pt(movingBall.x+movingBall.r*.82051282*g,movingBall.y+movingBall.r*mix(-.78,.23076923,g))),v=ease(clamp(t/pokeAt));a.right=lerpPt(pt(20+base.lean*7,-43+base.crouch*9),target,v);if(t>.42)a.left=lerpPt(pt(-19+a.lean*7,-42+a.crouch*9),local(a,pt(movingBall.x-movingBall.r*.82051282,movingBall.y+movingBall.r*.23076923)),g);actors=[actorPose(a)];}else actors=[carry.actor];
    const opponent=hold({...def,x:310+ease(clamp((t-pokeAt)/.71))*12,crouch:mix(def.crouch,.28,ease(clamp((t-pokeAt)/.3)))},pt(10,-47));actors.unshift(t<pokeAt?dribble(def,time+t*1.65,1,exposure*19).actor:blendPose(dribble(def,time+pokeAt*1.65,1,exposure*19).actor,opponent.actor,ease(clamp((t-pokeAt)/.2))));ball=movingBall;contact={at:pokeAt,actor:'you',point:pick};if(t>=pokeAt&&t<gatherAt){ball.owner='you';ball.hand='right';}phase=t<pokeAt?'压低伸手':t<gatherAt?'捅球收回':'护球站稳';
   }else{function shield(q){return hold({...def,crouch:seq(q,[[0,def.crouch],[.28,.5],[1,.24]]),lean:-ease(q/.4)*.28},pt(seq(q,[[0,24+exposure*19],[.4,3],[1,3]]),seq(q,[[0,-43],[.4,-48],[1,-48]])));}const h=shield(t),cut=.38,closed=shield(cut).ball;ball=t<cut?resultBall(initial.ball,closed,ease(t/cut),0):h.ball;const v=ease(t/.29)*(1-ease(clamp((t-.4)/.5))),reach=local(a,pt(pick.x+18,pick.y-8));a.right=lerpPt(pt(20+base.lean*7,-43+base.crouch*9),reach,v);actors=[blendPose(initial.actor,h.actor,ease(clamp(t/cut))),actorPose(a)];phase=t<.38?'伸手试探':'护球回位';}
  }
 }
 if(m.kind==='drive'){
  const side=input.side||1,def={...opp,lean:L*.9,crouch:.28+Math.abs(L)*.08},base={...own,crouch:own.crouch+.12},initial=dribble(base,time),rest=actorPose(def);
  if(!done){actors=[rest,initial.actor];ball=initial.ball;phase=Math.abs(L)>=p.T?(L>0?'左侧空当':'右侧空当'):'观察重心';}
  else if(!good){
   function stopped(q){return moving({...base,crouch:seq(q,[[0,base.crouch],[.18,.64],[.45,.44],[1,.23]]),lean:seq(q,[[0,base.lean],[.24,side*.3],[1,0]])},pt(310,330),pt(310+(result.timeout?0:side*24),312),clamp(q/.5));}
   function defender(q){const d=moving({...def,lean:mix(def.lean,-side*.25,ease(q/.45))},pt(310,250),pt(310+(result.turnover?side*28:0),270),clamp(q/.5));return hold(d,pt(14,-43));}
   const a=stopped(t),h=hold(a,pt(12,-46)),gatherAt=.24,releaseAt=.38,launch=hold(stopped(releaseAt),pt(12,-46)).ball,closed=hold(stopped(gatherAt),pt(12,-46)).ball,d=defender(t),catchAt=.54,end=defender(catchAt).ball;
   if(t<gatherAt){ball=resultBall(initial.ball,closed,ease(t/gatherAt),0);const g=ease(clamp((t-.12)/.12)),r=local(a,pt(ball.x+ball.r*.82051282*g,ball.y+ball.r*mix(-.78,.23076923,g))),l=local(a,pt(ball.x-ball.r*.82051282,ball.y+ball.r*.23076923));a.right=lerpPt(local(a,initial.actor.rig.handR),r,ease(t/.12));a.left=lerpPt(pt(-19+a.lean*7,-42+a.crouch*9),l,ease(t/gatherAt));actors=[actorPose(a)];}
   else if(t<releaseAt){ball=h.ball;actors=[h.actor];}
   else{if(result.turnover){ball=t<catchAt?resultBall(launch,end,ease((t-releaseAt)/(catchAt-releaseAt)),9):d.ball;contact={at:catchAt,actor:'opponent',point:end};}else ball=resultBall(launch,{x:95,y:292,r:8},ease((t-releaseAt)/.62),19);const extend=Math.sin(Math.PI*clamp((t-releaseAt)/.54));a.left=lerpPt(local(a,h.actor.rig.handL),pt(-29,-47+a.crouch*9),extend);a.right=lerpPt(local(a,h.actor.rig.handR),pt(-12,-46+a.crouch*9),extend);actors=[actorPose(a)];}
   actors.unshift(blendPose(rest,d.actor,ease(clamp(t/catchAt))));phase=t<releaseAt?'急停护球':result.turnover?'球被切走':'回传重组';
  }else{
   const releaseAt=.73,catchAt=.32;
   function runner(q){const cut=clamp(q/.6),a=moving({...base,scale:mix(base.scale,1.13,ease(clamp((q-.28)/.36))),crouch:seq(q,[[0,base.crouch],[.13,.76],[.32,.35],[.59,.7],[.72,.02],[.93,.1],[1,.65]]),lean:seq(q,[[0,base.lean],[.18,-side*.2],[.4,side*.5],[.63,side*.12],[1,0]])},pt(310,330),pt(310+side*75,235),cut),jump=q<.63?0:25*4*((q-.63)/.37)*(1-(q-.63)/.37);a.jump=jump;if(q>=.63)a.feet=null;return a;}
   function carry(q){const a=runner(q),center=pt(side*seq(q,[[0,24],[.32,25],[.56,20],[releaseAt,13],[1,13]]),seq(q,[[0,-43],[.32,-44],[.55,-46],[releaseAt,-97],[.91,-98],[1,-60]])),one=hold(a,center,side<0?'left':'right'),two=hold(a,center),u=ease(clamp((q-.44)/.12));return {actor:blendPose(one.actor,two.actor,u),ball:{...one.ball,...lerpPt(one.ball,two.ball,u),hand:u>=1?'both':one.ball.hand}};}

   const a=runner(t),h=carry(t),gatherRight=hold(runner(.13),pt(25,-44),'right'),crossEnd=carry(catchAt),launch=carry(releaseAt).ball;
   if(t<.13)ball=resultBall(initial.ball,gatherRight.ball,ease(t/.13),0);
   else if(t<catchAt){const u=ease((t-.13)/(catchAt-.13)),q=lerpPt(gatherRight.ball,crossEnd.ball,u);q.y+=Math.sin(Math.PI*u)*29;ball={...q,r:mix(gatherRight.ball.r,crossEnd.ball.r,u),owner:null,hand:null,spin:time*5+t*8};}
   else if(t<releaseAt)ball=h.ball;
   else{const rim={x:result.stats.made?310:328,y:132,r:7},u=clamp((t-releaseAt)/.19),v=clamp((t-.92)/.08);ball=resultBall(launch,rim,u,47);if(u>=1)Object.assign(ball,result.stats.made?pt(310,132+45*ease(v)):arc(rim,pt(371,185),ease(v),18));}
   if(t<catchAt){const target=local(a,pt(ball.x,ball.y-ball.r*.78205128));if(t<.13)a.right=lerpPt(local(a,initial.actor.rig.handR),target,ease(t/.13));else{a.right=lerpPt(pt(25,-50.1+a.crouch*9),pt(20+a.lean*7,-43+a.crouch*9),ease(clamp((t-.13)/.14)));if(side>0)a.right=lerpPt(a.right,target,ease(clamp((t-.2)/.12)));else a.left=lerpPt(pt(-19+a.lean*7,-42+a.crouch*9),target,ease(clamp((t-.2)/.12)));}actors=[actorPose(a)];}else actors=[t<releaseAt?h.actor:followThrough(h.actor,side>0?'R':'L',ease(clamp((t-.75)/.2)),ease(clamp((t-releaseAt)/.1))*(1-ease(clamp((t-.93)/.07))))];
   const lag=ease(clamp((t-.17)/.42)),d=moving({...def,crouch:def.crouch+.25*Math.sin(Math.PI*lag),lean:mix(def.lean,-side*.3,lag)},pt(310,250),pt(310-side*24,268),lag);actors.unshift(actorPose(d));release={at:releaseAt,point:launch};contact={at:catchAt,actor:'you',point:crossEnd.ball};phase=t<.13?'压低重心':t<catchAt?'换手蹬地':t<.57?'侧身加速':t<releaseAt?'收球起跳':t<.92?'抬臂挑篮':'缓冲落地';
  }
 }
 // The result overlay is presentation only; this function never changes a saved opportunity.
 return {actors,ball,phase,contact,release};
}

function renderScene(c,{moment:m,params:p,elapsed=0,marker=.5,lean=0,result=null,input={},progress=0,number=7}){
 const done=!!result,t=clamp(progress),good=result?.success,green='#a9edbc',white='#fffaea',ink='#17382f';
 function path(points,fill,stroke,width=1){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
 function line(points,color,width=2){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();}
 function ellipse(x,y,rx,ry,fill,stroke){c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
 function rect(x,y,w,h,r,fill,stroke){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}}
 function text(str,x,y,size=13,color=white,weight=600,align='center'){c.fillStyle=color;c.font=`${weight} ${size}px -apple-system,"PingFang SC",sans-serif`;c.textAlign=align;c.textBaseline='middle';c.fillText(str,x,y);}
 function tag(str,x,y,hot=false){const w=Math.max(38,str.length*12+18);rect(x-w/2,y-10,w,20,10,hot?'#235a44e8':'#132c2ce0');text(str,x,y,11,hot?green:'#e4e8dd');}
 function floor(x,z){const y=132+z*270;return [310+(x-310)*(.49+.74*z),y];}
 function court(){
  c.clearRect(0,0,WIDTH,HEIGHT);const g=c.createLinearGradient(0,0,0,HEIGHT);g.addColorStop(0,'#0d252c');g.addColorStop(.34,'#214640');g.addColorStop(.35,'#a17343');g.addColorStop(1,'#d6ad6d');c.fillStyle=g;c.fillRect(0,0,WIDTH,HEIGHT);
  // Quiet stands, light banks and arena fascia remain still while the action moves.
  for(let row=0;row<4;row++)for(let i=0;i<38;i++){const x=8+i*17+(row%2)*5,y=39+row*14,shade=['#3a5755','#6b7770','#b3b39a','#58726d'][(i*7+row*3)%4];ellipse(x,y,2.1,2.4,shade);}
  c.fillStyle='#142f31';c.fillRect(0,99,620,30);text('NEXT STOP',25,113,10,'#e8d49a',700,'left');text('巨 星 球 场',595,113,10,'#d0d9c9',600,'right');
  for(const x of [72,310,548]){const light=c.createRadialGradient(x,4,0,x,4,140);light.addColorStop(0,'#efffd72a');light.addColorStop(1,'#efffd700');c.fillStyle=light;c.fillRect(x-140,0,280,140);rect(x-27,3,54,3,1,'#f6f0ce');}
  for(let i=0;i<18;i++){const x=i*40-40;path([[310+(x-310)*.49,132],[310+(x+40-310)*.49,132],[310+(x+40-310)*1.23,402],[310+(x-310)*1.23,402]],i%2?'#edc88c12':'#5b37151c');line([[310+(x-310)*.49,132],[310+(x-310)*1.23,402]],'#704d3025',.7);}
  for(let i=1;i<7;i++)line([floor(-80,i/7),floor(700,i/7)],'#75482218',.6);
  path([floor(220,0),floor(400,0),floor(400,.58),floor(220,.58)],'#2a584ccc','#ffecd4a0',1.6);
  line([floor(20,0),floor(20,1),floor(600,1),floor(600,0)],'#fff3d9ba',2);
  const arc=[];for(let i=0;i<=40;i++){const a=i*Math.PI/40;arc.push(floor(310+255*Math.cos(a),.05+.82*Math.sin(a)));}line(arc,'#fff2d7c7',2);
  ellipse(310,289,79,23,null,'#fff1d6a8');line([floor(220,.17),floor(400,.17)],'#fff0d7aa',1.5);
  // Glass backboard, white target, orange rim and woven net.
  line([[353,67],[371,104],[371,141]],'#162e30',6);rect(269,59,82,59,3,'#e4f4e51c','#d9e8d1');rect(294,87,32,25,1,null,'#f6f4de');line([[269,118],[351,118]],'#e4ddbc',4);
  path([[296,133],[302,155],[318,155],[324,133]],'#fffbe623');for(let i=0;i<5;i++){const x=296+i*7;line([[x,134],[302+i*4,155]],'#f8f2d1a6',1);}
  line([[300,144],[321,144]],'#f8f2d17d',1);ellipse(310,132,17,5,'#1c373525','#f08235');
  const v=c.createRadialGradient(310,250,80,310,230,390);v.addColorStop(0,'#06292b00');v.addColorStop(1,'#06292b60');c.fillStyle=v;c.fillRect(0,130,620,270);
 }
 function player(a){
  const j=a.rig,S=a.scale,skin='#dba779',stripe=a.opponent?'#813d38':'#285c47',shorts=a.opponent?'#783e3b':'#285246',xy=p=>[p.x,p.y];
  function arms(){for(const side of ['L','R']){line([xy(j['shoulder'+side]),xy(j['elbow'+side])],skin,6*S);line([xy(j['elbow'+side]),xy(j['hand'+side])],skin,5*S);ellipse(j['hand'+side].x,j['hand'+side].y,2.8*S,3.1*S,skin);if(a.flick?.side===side){const h=j['hand'+side],u=a.flick.amount;line([[h.x,h.y],[h.x+(side==='R'?-1:1)*S,h.y+u*5*S]],skin,2.6*S);}}}
  ellipse(a.x,a.y+3,20*S*(1-a.jump/150),5*S*(1-a.jump/150),'#18332d3d');
  // The playable athlete faces the basket: arms and ball are beyond the back, not painted over it.
  if(!a.opponent){arms();if(!frame.ball.owner||frame.ball.owner===a.id)paintBall();}
  for(const side of ['L','R']){line([xy(j['hip'+side]),xy(j['knee'+side]),xy(j['foot'+side])],skin,6*S);const foot=j['foot'+side];line([[foot.x-3*S,foot.y],[foot.x+5*S,foot.y-1*S]],'#f6efdc',4*S);line([[foot.x-3*S,foot.y+1.5*S],[foot.x+6*S,foot.y+.5*S]],'#c5c5b0',1.1*S);}
  path([[j.hipL.x-7*S,j.hipL.y-5*S],[j.hipR.x+7*S,j.hipR.y-5*S],[j.hipR.x+8*S,j.hipR.y+8*S],[j.hipL.x-8*S,j.hipL.y+8*S]],shorts);line([[(j.hipL.x+j.hipR.x)/2,j.hipL.y],[(j.hipL.x+j.hipR.x)/2,j.hipL.y+7*S]],'#aebd9e',1*S);
  const g=c.createLinearGradient(j.shoulderL.x,j.shoulderL.y,j.shoulderR.x,j.hipR.y);g.addColorStop(0,a.opponent?'#dc775b':'#f2eee0');g.addColorStop(1,a.opponent?'#b35948':'#cad8c4');
  path([[j.shoulderL.x+3*S,j.shoulderL.y-3*S],[j.shoulderR.x-3*S,j.shoulderR.y-3*S],[j.shoulderR.x+2*S,j.shoulderR.y+7*S],[j.hipR.x+7*S,j.hipR.y-2*S],[j.hipL.x-7*S,j.hipL.y-2*S],[j.shoulderL.x-2*S,j.shoulderL.y+7*S]],g);
  line([[j.shoulderL.x+2*S,j.shoulderL.y+1*S],[j.hipL.x-4*S,j.hipL.y-3*S]],stripe,2.5*S);line([[j.shoulderR.x-2*S,j.shoulderR.y+1*S],[j.hipR.x+4*S,j.hipR.y-3*S]],stripe,2.5*S);
  const chest=lerpPt(lerpPt(j.shoulderL,j.shoulderR,.5),lerpPt(j.hipL,j.hipR,.5),.43);text(String(a.opponent?23:number),chest.x,chest.y,13*S,stripe,750);
  const neck=lerpPt(j.shoulderL,j.shoulderR,.5);line([[neck.x,neck.y-2*S],[j.head.x,j.head.y+7*S]],skin,7*S);
  // Back-facing players need a full rear hair silhouette, rather than a face with a thin cap.
  c.save();c.translate(j.head.x,j.head.y+(a.opponent?3:4)*S);c.rotate(a.lean*.12);c.scale(S,S);
  ellipse(-8.2,1.4,1.8,2.7,skin);ellipse(8.2,1.4,1.8,2.7,skin);
  if(a.opponent){
   const face=c.createLinearGradient(-8,-4,8,8);face.addColorStop(0,'#efc39b');face.addColorStop(1,skin);
   c.beginPath();c.moveTo(-8,-4);c.bezierCurveTo(-9,2,-6,8,-3,9);c.quadraticCurveTo(0,11,3,9);c.bezierCurveTo(6,8,9,2,8,-4);c.closePath();c.fillStyle=face;c.fill();
   // Raised, swept short hair, with sideburns framing a compact face.
   c.beginPath();c.moveTo(-8.6,2);c.lineTo(-9.2,-4);c.bezierCurveTo(-10,-10,-4,-12,1,-11);c.lineTo(5,-12);c.lineTo(4,-10);c.bezierCurveTo(9,-10,11,-5,8.3,2);c.lineTo(7,-3);c.lineTo(4,-5);c.quadraticCurveTo(-1,-1,-7,-4);c.lineTo(-7,2);c.closePath();c.fillStyle='#242a2a';c.fill();
   line([[-6,-7],[-2,-9],[2,-9]],'#485151',1.3);
   line([[-5,-.4],[-2.6,-.9]],'#4b352a',.8);line([[2.6,-.9],[5,-.4]],'#4b352a',.8);
   ellipse(-3.5,1,.65,.85,'#292b29');ellipse(3.5,1,.65,.85,'#292b29');
   line([[.5,2],[1.2,4],[0,4.5]],'#bf8d67',.65);line([[-1.8,6.7],[1.8,6.7]],'#9e6852',.7);
  }else{
   // Full crown and tapered nape: the playable athlete is facing the basket.
   c.beginPath();c.moveTo(-8.5,2);c.bezierCurveTo(-11,-5,-8,-10,-3,-11);c.lineTo(1,-12.5);c.lineTo(1,-10.8);c.lineTo(5,-12);c.lineTo(4.5,-10.2);c.bezierCurveTo(10,-9,11,-2,8.2,3);c.lineTo(6.5,6);c.quadraticCurveTo(0,9.5,-6.5,6);c.closePath();
   const hair=c.createLinearGradient(-6,-10,7,7);hair.addColorStop(0,'#404b4a');hair.addColorStop(.42,'#26302f');hair.addColorStop(1,'#1c2626');c.fillStyle=hair;c.fill();
   c.strokeStyle='#172323';c.lineWidth=.8;c.stroke();
   c.beginPath();c.moveTo(-5,-6);c.quadraticCurveTo(-1,-10,4,-8);c.moveTo(-6.2,-2.4);c.quadraticCurveTo(-3.5,-5,0,-5.4);c.strokeStyle='#596360';c.lineWidth=1.1;c.lineCap='round';c.stroke();
   line([[-5,5.2],[0,6.8],[5,5.2]],'#172322',1.2);
  }
  c.restore();
  if(a.opponent){arms();if(frame.ball.owner===a.id)paintBall();}
 }
 function ball(x,y,r=10,spin=elapsed*3,shadowY=null){if(shadowY!==null)ellipse(x,shadowY,r*1.05,r*.3,'#18332d36');c.save();c.translate(x,y);c.rotate(spin);const g=c.createRadialGradient(-r*.35,-r*.4,1,0,0,r);g.addColorStop(0,'#ffba62');g.addColorStop(.55,'#e78b35');g.addColorStop(1,'#a84b20');ellipse(0,0,r,r,g,'#713817');c.strokeStyle='#6b361bd9';c.lineWidth=Math.max(1,r*.1);c.beginPath();c.moveTo(-r,0);c.lineTo(r,0);c.moveTo(0,-r);c.lineTo(0,r);c.moveTo(-r*.75,-r*.7);c.bezierCurveTo(r*.2,-r*.5,r*.2,r*.5,-r*.75,r*.7);c.moveTo(r*.75,-r*.7);c.bezierCurveTo(-r*.2,-r*.5,-r*.2,r*.5,r*.75,r*.7);c.stroke();c.restore();}
 function trail(x1,y1,x2,y2,height=75){c.save();c.setLineDash([2,9]);c.strokeStyle='#fff7d58c';c.lineWidth=2;c.beginPath();c.moveTo(x1,y1);c.quadraticCurveTo((x1+x2)/2,Math.min(y1,y2)-height,x2,y2);c.stroke();c.restore();}
 function arrow(x,y,side,hot){const a=hot?'#b9f3b1':'#fff0cc70';path([[x-side*20,y-7],[x+side*2,y-7],[x+side*2,y-18],[x+side*23,y],[x+side*2,y+18],[x+side*2,y+7],[x-side*20,y+7]],a);}
 court();
 const frame=poseFrame({moment:m,params:p,elapsed,marker,lean,result,input,progress});
 if(m.kind==='rebound'){const xs=[166,310,454];for(let i=0;i<3;i++){const hot=i===m.lane;ellipse(xs[i],298,49,14,hot?'#1e654e50':'#263a3420',hot?'#b5e6a7':'#fff0d866');tag(['左侧','中间','右侧'][i],xs[i],323,hot);}if(!done)trail(310,141,xs[m.lane],265,45);}
 if(m.kind==='shot'&&!done)trail(frame.ball.x,frame.ball.y,310,132,67);
 if(m.kind==='drive'&&!done){const hotL=lean>=p.T,hotR=-lean>=p.T;for(const [x,hot,s] of [[157,hotL,-1],[463,hotR,1]]){path([[x-48,317],[x+48,317],[x+32,241],[x-32,241]],hot?'#b7f1a23d':'#fff2d50a');arrow(x,284,s,hot);}tag(frame.phase,310,159,hotL||hotR);}
 const b=frame.ball,owner=frame.actors.find(a=>a.id===b.owner);let ballPainted=false;
 function paintBall(){if(ballPainted)return;ballPainted=true;ball(b.x,b.y,b.r,b.spin??elapsed*5);if(owner){for(const side of b.hand==='both'?['L','R']:[b.hand==='left'?'L':'R']){const hand=owner.rig['hand'+side];ellipse(hand.x,hand.y,2.7*owner.scale,2.8*owner.scale,'#dba779');}}}
 // Shadows stay on the floor; a front-facing opponent holds the ball over the chest,
 // while a back-facing player hides the front-held ball with the jersey and head.
 ellipse(b.x,Math.max(245,Math.min(335,b.y+65)),b.r*1.05,b.r*.3,'#18332d36');
 if(m.kind==='steal'&&!done&&Math.abs(marker-m.center)<=p.W/2){ellipse(b.x,b.y,b.r+7,b.r+7,'#c6f9b72b','#c4efae');tag('露球',414,190,true);}
 frame.actors.sort((a,b)=>a.y-b.y).forEach(player);paintBall();
 // A short result card overlays the same scene after the action, never replacing it with a blank panel.
 if(done&&t>.83){c.save();c.globalAlpha=ease((t-.83)/.12);const color=good?'#bde9a7':result.turnover?'#f2b09b':'#ebd5a7';rect(133,18,354,59,9,'#102d2bf0','#c5d4b13b');text(result.text,310,39,21,color,750);text(good?(result.perfect?'时机漂亮':'动作完成'):result.timeout?'继续下一球':'调整节奏，再来一球',310,61,11,'#c1cec0',500);c.restore();}
}
function mount({engine:E,state:s,moment:mo,container,energy,onSubmit,onCheckpoint=()=>{},onPresented=()=>{}}){
 const canvas=container.querySelector('canvas'),ctx=canvas.getContext('2d'),hint=container.querySelector('.mini-status'),markerEl=container.querySelector('.mini-marker'),windowEl=container.querySelector('.mini-window'),buttons=[...container.querySelectorAll('[data-mini]')],p=E.miniParams(s,mo,energy),replay=!!mo.result,timer=clock(mo.elapsed||0),dpr=Math.min(window.devicePixelRatio||1,3);
 canvas.width=WIDTH*dpr;canvas.height=HEIGHT*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);windowEl.style.left=(mo.center-p.W/2)*100+'%';windowEl.style.width=p.W*100+'%';
 let raf=null,disposed=false,submitted=replay,saved=timer.elapsed,manualPause=false,currentMarker=mo.input?.marker??E.pointerAt(timer.elapsed,mo.phase/TAU),currentLean=mo.input?.lean??E.leanAt(timer.elapsed,mo.phase),anim=0,last=null,presented=false;
 function submit(sideOrLane,timeout=false){if(disposed||submitted||timer.paused||timer.preparing)return;submitted=true;cancelAnimationFrame(raf);buttons.forEach(b=>b.disabled=true);const input={marker:currentMarker,lean:currentLean,...(timeout?{timeout:true}:mo.kind==='drive'?{side:sideOrLane,lean:currentLean}:{marker:currentMarker,lane:sideOrLane}),visualTime:timer.elapsed};onSubmit(input);}
 function frame(ts){if(disposed)return;const elapsed=timer.tick(ts);if(replay){if(last!==null&&!timer.paused)anim+=Math.max(0,(ts-last)/1000);last=timer.paused?null:ts;}else{currentMarker=E.pointerAt(elapsed,mo.phase/TAU);currentLean=E.leanAt(elapsed,mo.phase);}
  markerEl.style.left=currentMarker*100+'%';container.classList.toggle('is-ready',!replay&&!timer.preparing&&!timer.paused&&(mo.kind==='drive'?Math.abs(currentLean)>=p.T:Math.abs(currentMarker-mo.center)<=p.W/2));
  renderScene(ctx,{moment:mo,params:p,elapsed,marker:currentMarker,lean:currentLean,result:mo.result,input:mo.input||{},progress:replay?anim/1.65:0,number:s.player.number});
  hint.textContent=timer.paused?'已暂停':replay?(anim>=1.65?mo.result.text:''):timer.preparing?'准备':'剩余 '+Math.max(0,6-elapsed).toFixed(1)+' 秒';buttons.forEach(b=>b.disabled=replay||timer.paused||timer.preparing);
  if(replay&&anim>=1.65){if(!presented){presented=true;container.classList.add('is-presented');container.querySelectorAll('[data-after-replay]').forEach(b=>b.disabled=false);onPresented();}return;}
  if(!replay&&elapsed-saved>=.5){saved=elapsed;onCheckpoint(elapsed);}if(!replay&&elapsed>=6&&!timer.paused){submit(null,true);return;}raf=requestAnimationFrame(frame);
 }
 function key(e){if(disposed||submitted||e.repeat||e.target.matches('input,select,textarea'))return;if(mo.kind==='drive'&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();submit(e.key==='ArrowLeft'?-1:1);}else if(mo.kind==='rebound'&&['ArrowLeft','ArrowDown','ArrowRight','1','2','3'].includes(e.key)){e.preventDefault();submit({'ArrowLeft':0,'ArrowDown':1,'ArrowRight':2,'1':0,'2':1,'3':2}[e.key]);}else if(e.code==='Space'&&!e.target.matches('button')&&!['drive','rebound'].includes(mo.kind)){e.preventDefault();submit(null);}}
 const events=buttons.map(b=>{const fn=e=>{e.preventDefault();submit(Number(b.dataset.mini));};b.addEventListener('pointerdown',fn);const click=e=>{if(e.detail===0)submit(Number(b.dataset.mini));};b.addEventListener('click',click);return [b,fn,click];});
 function canvasInput(e){e.preventDefault();const r=canvas.getBoundingClientRect(),x=clamp((e.clientX-r.left)/r.width);submit(mo.kind==='rebound'?Math.min(2,Math.floor(x*3)):mo.kind==='drive'?(x<.5?-1:1):null);}
 canvas.addEventListener('pointerdown',canvasInput);
 function pause(){timer.pause();last=null;}function resume(){if(!disposed){timer.resume();last=null;if(presented)return;}}
 function visible(){if(document.hidden)pause();else if(!manualPause)resume();}function blur(){pause();}function focus(){if(!document.hidden&&!manualPause)resume();}
 document.addEventListener('keydown',key);document.addEventListener('visibilitychange',visible);window.addEventListener('blur',blur);window.addEventListener('focus',focus);if(document.hidden)pause();raf=requestAnimationFrame(frame);
 return {pause(){manualPause=true;pause();},resume(){manualPause=false;resume();},get paused(){return timer.paused;},get presented(){return presented;},dispose(options={}){disposed=true;cancelAnimationFrame(raf);canvas.removeEventListener('pointerdown',canvasInput);document.removeEventListener('keydown',key);document.removeEventListener('visibilitychange',visible);window.removeEventListener('blur',blur);window.removeEventListener('focus',focus);for(const [b,fn,click] of events){b.removeEventListener('pointerdown',fn);b.removeEventListener('click',click);}if(!replay&&options.checkpoint!==false)onCheckpoint(timer.elapsed);}};
}
return {clock,mount,renderScene,poseFrame,actorPose,WIDTH,HEIGHT};
});
