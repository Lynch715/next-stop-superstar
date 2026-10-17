/* Deterministic, DOM-free basketball controls and ball trajectories. */
(function(root, factory) { const api = factory(); if (typeof module === 'object' && module.exports) module.exports = api; else root.BasketCourt = api; })(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  const attrKeys=['shot','drive','pass','handle','rebound','defense','body','stamina'],perkKeys=['catchShoot','ballHandler','playmaker','board','rim','finisher'];
  const ability=(s,k)=>s.config.attributes?.[k]??s.config.skill;
  const perk=(s,k)=>s.config.perks?.includes(k)||false;
  const tired=s=>s.config.attributes?1-Math.max(0,60-s.config.energy)/(150+ability(s,'stamina')*2):1;
  const W = 900, H = 540, FULL_H=1044, hoop = { x: 450, y: 122, z: 55 },awayHoop={x:450,y:922,z:55};
  const modes = {
    shot: { name: '投篮', title: '把出手，交给自己的手感。', steps: '移动寻找出手位置 → 按住投篮 → 绿区松手', task: '绿区松手。在三分线外出手计三分，走进线内出手计两分。', action: '按住投篮', limit: 24 },
    pass: { name: '传球', title: '球，比人跑得更快。', steps: '移动拉开角度 → 观察移动的防守 → 选择接球队友', task: '绿色路线可以传；红色路线可能被截。按 1 / 2 / 3 传给队友。', action: '传给林野', limit: 24 },
    screen: { name: '挡拆', title: '站稳这一步，再向篮筐跑。', steps: '进入金色掩护圈 → 站稳挡住追防 → 向篮下顺下接球', task: '进入金色圆圈，站稳掩护；配合发动后向篮下的绿色圆圈顺下。', action: '站稳掩护', limit: 24 },
    rebound: { name: '篮板', title: '篮板，先争位置，再争高度。', steps: '观察篮板落点 → 移动卡住对手 → 进入绿区起跳', task: '移动到金色落点附近，点击卡位，再在绿色时机起跳。', action: '起跳抢板', limit: 24 },
    drive: { name: '突破', title: '变向，把防守留在身后。', steps: '观察防守横移 → 左右变向绕开 → 篮下按住投篮', task: '别直撞防守人。绕开他，到篮下绿色区域完成终结。', action: '按住终结', limit: 24 },
    defense: { name: '防守', title: '你的脚步，就是这道防线。', steps: '移动跟住持球人 → 保持在人与篮筐之间 → 合适时机封堵', task: '守住金色防守点；等持球人靠近，再按抢断或封堵。', action: '抢断 / 封堵', limit: 7 },
    protect: { name: '护球', title: '最后几秒，把球留在我们手里。', steps: '移动避开逼抢 → 不撞入包围 → 稳稳守到时间结束', task: '用移动拉开距离。守住球权，不必为了高光强行出手。', action: '压低重心护球', limit: 7 }
  };
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const dist = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
  const mix = (a,b,t) => a+(b-a)*t;
  const copy = x => JSON.parse(JSON.stringify(x));
  function segment(p,a,b) { const dx=b.x-a.x,dy=b.y-a.y, q=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1),0,1); return Math.hypot(p.x-a.x-q*dx,p.y-a.y-q*dy); }
  const statKeys=['points','assists','rebounds','steals','blocks','turnovers','fouls','made','attempts'];
  const emptyStats=()=>Object.fromEntries(statKeys.map(k=>[k,0]));
  const names=['左翼队友','林野','篮下队友'];
  const mateName=(s,i)=>(s.config.teammates||names)[i];
  function create(config) {
    if(!config||!Object.hasOwn(modes,config.mode))throw Error('未知球场项目');
    config=copy(config);for(const [k,d,max] of [['skill',55,96],['energy',80,100],['bond',30,100],['stamina',55,96]])config[k]=clamp(Number.isFinite(config[k])?config[k]:d,0,max);
    if(config.attributes&&Number.isFinite(config.attributes.stamina))config.stamina=config.attributes.stamina;
    config.seed=Number.isInteger(config.seed)?config.seed>>>0:1;config.number=Number.isInteger(config.number)&&config.number>=0&&config.number<=99?config.number:7;config.role=['guard','wing','big'].includes(config.role)?config.role:'wing';
    const mode=config.mode,p={x:mode==='screen'?305:450,y:mode==='rebound'?320:mode==='screen'?410:mode==='drive'?440:mode==='defense'?240:mode==='shot'&&config.points===3?440:mode==='shot'&&config.role==='big'?235:365,z:0};
    const s={v:2,config,flow:mode,owner:mode==='rebound'?'loose':mode==='screen'?'mate':mode==='defense'?'opponent':'player',carrier:1,carrierPos:null,phase:'ready',paused:false,t:0,phaseAt:0,stage:mode==='screen'?'position':mode==='drive'?'drive':'aim',p,ball:{x:p.x+15,y:p.y,z:34},mates:[],defenders:[],target:null,charging:false,chargeAt:0,planted:false,plantTime:0,box:false,boxTime:0,defenseTime:0,flight:null,outcome:null,notice:'',noticeUntil:0,landing:{x:365+config.seed%170,y:262+config.seed%29},jumpAt:3.5,reboundAt:.8,reboundFrom:{...hoop},screenSpot:{x:450,y:282},rollSpot:{x:450,y:182},cutAt:0,clock:24,gameClock:Number.isFinite(config.timeLimit)?clamp(config.timeLimit,1,90):['protect','defense'].includes(mode)?7:90,stats:emptyStats(),teamPoints:0,opponentPoints:0,events:[],decisions:[],grades:[],lastPass:null,screenUntil:0};
    actors(s);if(config.liveMatch)initRun(s);if(mode==='screen')s.carrierPos=copy(s.mates[1]);ball(s);return s;
  }
  const jobs=['拉开空间','空切','接应','持球','上提掩护','站稳掩护','顺下','冲抢篮板','退防保护','跟防','贴防','协防','回位','抢篮板','被掩护挡住','持球突破','快下接应','退防','推进反击','发球接应','防守卡位'];
  function agent(p,mark=-1){return {...p,vx:0,vy:0,gx:p.x,gy:p.y,job:'拉开空间',mark,speed:175};}
  function initAI(s,preserve=false){
    const bases=[{x:165,y:250},{x:735,y:265},{x:465,y:188}];
    s.mates=bases.map((p,i)=>agent(preserve&&s.mates[i]?s.mates[i]:s.config.mode==='screen'&&i===1?{x:655,y:255}:p,i));
    const spots=[{x:s.p.x+12,y:clamp(s.p.y-(s.config.mode==='drive'?140:s.config.decision===0?48:115),165,390)},...s.mates.map(m=>({x:m.x+(450-m.x)*.09,y:Math.max(150,m.y-52)}))];
    s.defenders=spots.map((p,i)=>({...agent(preserve&&s.defenders[i]?s.defenders[i]:p,i-1),job:i===0?'贴防':'跟防'}));
    if(!preserve&&s.flow==='screen')s.screenSpot={x:605,y:253};
    s.ai={version:1,nextThink:s.t,cutIndex:-1,cutUntil:s.t,nextCut:s.t+.65,pickIndex:-1,pickPhase:'none',pickUntil:s.t,nextPick:s.t+2.6,contact:false,helpIndex:-1,boardResolved:false};
    if(s.pickSpot&&s.screenUntil>s.t){s.ai.pickIndex=1;s.ai.pickPhase='approach';s.ai.pickUntil=s.screenUntil;}
    if(s.owner==='mate'&&s.carrierPos){Object.assign(s.mates[s.carrier],s.carrierPos);}
    if(s.flow==='rebound')s.ai.boardResolved=false;
  }
  function passDuration(s,range=300){if(s.run)return clamp(range/(s.config.attributes?480+ability(s,'pass')*1.6:560),.40,1.5)*(1-(s.config.bond-30)*.001)/(perk(s,'playmaker')&&s.screenUntil>s.t?1.12:1);return clamp(.66*(1-(s.config.bond-30)*.002),.48,.73);}
  function goal(a,p,job,speed=175){a.gx=clamp(p.x,100,800);a.gy=clamp(p.y,135,a.maxY||465);a.job=job;a.speed=speed;}
  function project(a,seconds){const d=Math.hypot(a.gx-a.x,a.gy-a.y),q=Math.min(1,(a.speed||175)*seconds/(d||1));return {x:mix(a.x,a.gx,q),y:mix(a.y,a.gy,q)};}
  function blockers(s,t){return s.defenders.map(a=>project(a,Math.max(0,t-s.t)));}
  function callPick(s,manual=false){
    if(s.owner!=='player'||s.owner==='loose'||s.phase!=='playing')return false;
    const ai=s.ai;if(ai.pickPhase!=='none'&&s.t<ai.pickUntil)return false;
    const i=ai.cutIndex===1&&s.t<ai.cutUntil?2:1,near=s.defenders.reduce((a,b)=>dist(a,s.p)<dist(b,s.p)?a:b),d=dist(near,s.p)||1;
    s.pickSpot={x:clamp(s.p.x+(near.x-s.p.x)/d*52+(s.p.x<450?-18:18),120,780),y:clamp(s.p.y+(near.y-s.p.y)/d*52,175,425)};s.pickFrom=copy(s.mates[i]);s.screenUntil=s.t+5.5;
    ai.pickIndex=i;ai.pickPhase='approach';ai.pickUntil=s.t+5.5;ai.nextPick=s.t+9;ai.contact=false;
    if(manual){s.flow='shot';s.stage='pick';notify(s,mateName(s,i)+'正在上提；等他站稳，再绕过掩护。');}
    return true;
  }
  function think(s){
    const ai=s.ai,loose=s.owner==='loose',air=s.phase==='flight'&&s.flight.kind==='shot',ballP=s.owner==='mate'?s.mates[s.carrier]:s.owner==='opponent'?s.defenders[0]:s.p;
    if(s.run&&s.run.side==='away'&&!loose&&!(s.phase==='flight'&&s.flight.kind==='oppShot')){awayThink(s);return;}
    if(loose||air||s.phase==='flight'&&s.flight.kind==='oppShot'){
      const landing=loose?s.landing:landingFor(s,s.flight);
      s.mates.forEach((m,i)=>goal(m,i===0?{x:220,y:385}:{x:landing.x+(i===1?-21:21),y:landing.y-12},i===0?'退防保护':'冲抢篮板',172));
      s.defenders.forEach((d,i)=>goal(d,{x:landing.x+[-18,24,-30,30][i],y:landing.y+[14,16,-9,-18][i]},'抢篮板',158));
      return;
    }
    if(s.flow==='defense'&&!s.run){
      const handler=s.defenders[0],side=s.p.x<handler.x?1:-1;
      goal(handler,{x:clamp(s.p.x+side*115,250,650),y:Math.max(185,340-s.t*18)},'持球突破',95);
      s.defenders.slice(1).forEach((d,i)=>goal(d,{x:[180,715,490][i],y:[245,250,185][i]},i===2?'空切':'接应',145));
      s.mates.forEach((m,i)=>goal(m,{x:mix(s.defenders[i+1].x,handler.x,.17),y:s.defenders[i+1].y-42},i===2&&dist(handler,hoop)<230?'协防':'跟防',145));return;
    }
    if(s.t>=ai.nextCut&&s.owner!=='opponent'){
      const candidates=[0,1,2].filter(i=>i!==s.carrier||s.owner!=='mate').filter(i=>i!==ai.pickIndex||ai.pickPhase==='none');
      ai.cutIndex=candidates.sort((a,b)=>ballP.x<450?s.mates[b].x-s.mates[a].x:s.mates[a].x-s.mates[b].x)[0]??-1;
      ai.cutUntil=s.t+2.5;ai.nextCut=s.t+5.1;
    }
    if(s.owner==='player'&&s.flow!=='protect'&&s.t>=ai.nextPick&&ai.pickPhase==='none')callPick(s);
    if(ai.pickPhase!=='none'&&s.t>=ai.pickUntil){ai.pickPhase='none';ai.pickIndex=-1;s.screenUntil=s.t;if(s.stage==='pick')s.stage='aim';}
    s.mates.forEach((m,i)=>{
      if(s.run&&ballP.y>510&&!(s.phase==='flight'&&s.flight.kind==='pass'&&i===s.selected)){if(s.owner==='mate'&&i===s.carrier){goal(m,{x:clamp(m.x+(m.x<450?-40:40),160,740),y:Math.max(300,m.y-190)},'推进反击',s.run.fastUntil>s.t?180:155);}else goal(m,{x:[165,735,450][i],y:Math.max(200,ballP.y-230-i*20)},'快下接应',190);return;}
      if(s.phase==='flight'&&['pass','return','rollpass'].includes(s.flight.kind)&&i===s.selected&&s.flight.kind==='pass'){goal(m,s.flight.to,'接应',190);return;}
      if(s.owner==='mate'&&i===s.carrier){
        if(s.flow==='screen'&&s.stage==='roll'){goal(m,{x:s.screenSpot.x-80,y:s.screenSpot.y-48},'持球突破',120);return;}
        if(s.charging||s.flow==='screen'||s.flow==='protect'||s.phase==='flight'){goal(m,m,'持球',0);return;}
        const guard=s.defenders[i+1],away=guard?dist(m,guard)<62: false;
        goal(m,away?{x:clamp(m.x+(m.x<450?-1:1)*48,145,755),y:clamp(m.y+25,200,365)}:m,'持球',105);return;
      }
      if(i===ai.pickIndex&&ai.pickPhase!=='none'){
        const spot=ai.pickPhase==='roll'?{x:s.pickSpot.x<450?405:495,y:182}:s.pickSpot;
        goal(m,spot,ai.pickPhase==='roll'?'顺下':dist(m,spot)<13?'站稳掩护':'上提掩护',185);return;
      }
      if(i===ai.cutIndex&&s.t<ai.cutUntil&&s.flow!=='screen'){
        goal(m,{x:i===0?425:i===1?475:ballP.x<450?515:385,y:178},'空切',175);return;
      }
      const base=[{x:160,y:260},{x:740,y:275},{x:ballP.x<450?565:335,y:205}][i],lane=s.defenders.some(d=>segment(d,ballP,m)<35&&dist(d,m)>38),support=dist(ballP,m)>440||lane;
      goal(m,support?{x:clamp(ballP.x+(i===0?-200:i===1?200:ballP.x<450?150:-150),135,765),y:clamp(ballP.y+(i===2?-85:48),190,445)}:base,support?'接应':'拉开空间',160);
    });
    const mark=s.owner==='player'?0:s.carrier+1,guard=s.defenders[mark],drive=dist(ballP,hoop)<230&&(dist(guard,ballP)>72||ballP.y<guard.y+18),helper=drive?s.defenders.map((d,i)=>({i,d:dist(d,ballP)})).filter(x=>x.i!==mark).sort((a,b)=>a.d-b.d)[0]?.i:-1;
    ai.helpIndex=helper??-1;
    s.defenders.forEach((d,i)=>{
      const target=i===0?s.p:s.mates[i-1],onBall=i===mark;
      if(i===helper){const range=dist(ballP,hoop)||1;goal(d,{x:ballP.x+(hoop.x-ballP.x)/range*44,y:ballP.y+(hoop.y-ballP.y)/range*44},'协防',155);return;}
      if(s.flow==='protect'&&onBall){const r=dist(ballP,hoop)||1;goal(d,s.box?{x:ballP.x+(hoop.x-ballP.x)/r*32,y:ballP.y+(hoop.y-ballP.y)/r*32}:ballP,'贴防',145);return;}
      const separation=onBall?48:43,range=dist(target,hoop)||1;
      goal(d,{x:target.x+(hoop.x-target.x)/range*separation,y:target.y+(hoop.y-target.y)/range*separation},onBall?'贴防':d.job==='协防'?'回位':'跟防',onBall?146:139);
    });
  }
  function steer(s,a,dt,team,index){
    let gx=a.gx,gy=a.gy;if(a.blockUntil>s.t&&a.screenPoint){gx=a.screenPoint.x+(a.x<a.screenPoint.x?-46:46);gy=a.screenPoint.y+20;a.job='被掩护挡住';}
    // A planted body changes the actual path of the pursuer; no position jumps.
    const screens=team==='defender'?[...(s.planted?[{...s.p,player:true}]:[]),...(s.ai.pickPhase==='set'?[s.mates[s.ai.pickIndex]]:[]),...(s.box&&s.owner==='loose'?[{...s.p,box:true}]:[])]:[];
    for(const p of screens){
      if(dist(a,p)<(p.player&&s.config.attributes?66+ability(s,'body')*.18:76)&&segment(p,a,{x:gx,y:gy})<30){
        const side=a.x<p.x?-1:1;gx=p.x+side*(p.box?47:42);gy=p.y+(p.box?38:16);
        if(p.player)s.playerScreenContact=s.t;
        if(!p.box){a.job='被掩护挡住';a.blockUntil=s.t+(p.player&&s.config.attributes?.body!==undefined?.4+ability(s,'body')*.004:.6);a.screenPoint={x:p.x,y:p.y};if(!s.ai.contact&&s.ai.pickPhase==='set'){s.ai.contact=true;s.ai.pickPhase='roll';s.ai.pickUntil=s.t+2.2;record(s,'screen','mate',mateName(s,s.ai.pickIndex)+'站稳挡住追防，随后顺下接应。');}}
      }
    }
    if(s.run&&team==='defender'&&s.run.side==='away'&&s.run.carrier===index){const wall=[s.p,...s.mates].find(p=>p.y>a.y&&p.y<a.y+65&&dist(p,a)<57&&segment(p,a,{x:gx,y:gy})<32);if(wall){gx=a.x+(a.x<wall.x?-95:95);gy=a.y+40;}}
    const dx=gx-a.x,dy=gy-a.y,len=Math.hypot(dx,dy),speed=Math.min(a.speed*(team==='defender'?(s.config.opposition||1):1),len/(dt||1));let vx=len>1?dx/len*speed:0,vy=len>1?dy/len*speed:0;
    const near=team==='mate'?[...s.mates.filter((_,i)=>i!==index),s.p]:s.defenders.filter((_,i)=>i!==index);
    for(const p of near){const d=dist(a,p);if(d>1&&d<29){vx+=(a.x-p.x)/d*(29-d)*3;vy+=(a.y-p.y)/d*(29-d)*3;}}
    const mag=Math.hypot(vx,vy),cap=a.speed*(team==='defender'?(s.config.opposition||1):1);if(mag>cap&&mag>0){vx=vx/mag*cap;vy=vy/mag*cap;}
    if(a.speed===0){vx=0;vy=0;}
    a.vx=vx;a.vy=vy;a.x=clamp(a.x+vx*dt,100,800);a.y=clamp(a.y+vy*dt,135,a.maxY||465);
  }
  function actors(s,dt=0){
    if(!s.ai)initAI(s,s.mates.length>0);
    if(!dt)return;
    if(s.t+1e-8>=s.ai.nextThink){think(s);s.ai.nextThink+=.125;if(s.ai.nextThink<s.t)s.ai.nextThink=s.t+.125;}
    s.mates.forEach((m,i)=>{
      if(s.run&&s.phase==='flight'&&s.flight.kind==='inbound'&&s.run.side==='home'&&s.owner==='mate'&&s.carrier===i){m.vx=0;m.vy=0;return;}
      if(s.phase==='flight'&&s.flight.kind==='rebound'&&s.flight.result.boardOwner==='mate'&&s.flight.result.boardIndex===i){m.vx=0;m.vy=0;return;}
      if(s.phase==='flight'&&s.flight.shooter?.actor==='mate'&&s.flight.shooter.index===i){m.vx=0;m.vy=0;return;}
      steer(s,m,dt,'mate',i);
    });
    s.defenders.forEach((d,i)=>{if(s.run&&s.phase==='flight'&&((s.flight.kind==='inbound'&&s.run.side==='away')||s.flight.kind==='oppShot')&&s.run.carrier===i){d.vx=0;d.vy=0;return;}if(s.phase==='flight'&&s.flight.kind==='rebound'&&s.flight.result.boardOwner==='opponent'&&s.flight.result.boardIndex===i){d.vx=0;d.vy=0;}else steer(s,d,dt,'defender',i);});
    if(s.owner==='mate')s.carrierPos={x:s.mates[s.carrier].x,y:s.mates[s.carrier].y};
    if(s.ai.pickPhase==='approach'&&dist(s.mates[s.ai.pickIndex],s.pickSpot)<13){s.ai.pickPhase='set';s.ai.pickUntil=s.t+1.6;const m=s.mates[s.ai.pickIndex];goal(m,m,'站稳掩护',0);}
    if(s.ai.pickPhase==='set'&&s.ai.pickUntil-s.t<.2){s.ai.pickPhase='roll';s.ai.pickUntil=s.t+2.2;}
  }
  function reboundWindow(s){return (.22+ability(s,'rebound')*.003)*tired(s);}
  function contest(s,attempt=false){
    const box=s.boxTime>=.24&&dist(s.p,s.landing)<85,gap=Math.abs(s.t-s.jumpAt),reach=(42+ability(s,'rebound')*.4+(box&&perk(s,'board')?8:0))*tired(s);
    const candidates=[...s.mates.map((p,i)=>({owner:'mate',index:i,p,score:52+(s.config.seed+i*7)%17-dist(p,s.landing)})),...s.defenders.map((p,i)=>({owner:'opponent',index:i,p,score:54+(s.config.seed+i*11)%15-dist(p,s.landing)-(box&&dist(p,s.p)<90?(s.config.attributes?15+ability(s,'body')*.25+(perk(s,'board')?8:0):30):0)}))];
    if(attempt&&gap<reboundWindow(s)&&dist(s.p,s.landing)<reach)candidates.push({owner:'player',index:-1,p:s.p,score:reach-dist(s.p,s.landing)-gap*55+(box?(s.config.attributes?18+ability(s,'body')*.25:32):-10)});
    return candidates.sort((a,b)=>b.score-a.score)[0];
  }
  function reboundFlight(s,attempt=false){
    if(s.phase!=='playing'||s.owner!=='loose')return false;
    const winner=contest(s,attempt);if(!attempt&&dist(winner.p,s.landing)>78&&s.t<s.jumpAt+.85)return false;
    s.ai.boardResolved=true;const success=winner.owner==='player',text=success?'你卡位后抢下进攻篮板，还能继续补篮或分球。':winner.owner==='mate'?mateName(s,winner.index)+'冲抢拿到进攻篮板，继续这次球权！':'对手抢先卡住落点，收下防守篮板。';
    if(attempt)grade(s,success?95:35,dist(s.p,s.landing)<85&&s.boxTime>=.24?3:1);
    const r=outcome(s,success,success?95:35,text,{boardOwner:winner.owner,boardIndex:winner.index});
    return fly(s,copy(s.ball),{x:winner.p.x+12,y:winner.p.y,z:65},.4,24,r,'rebound');
  }
  function intercept(s){
    const f=s.flight;if(!['pass','return','rollpass'].includes(f.kind)||f.intercepted)return;
    const receiver=f.kind==='pass'?s.mates[s.selected]:s.p;
    const d=s.defenders.find(d=>dist(d,s.ball)<22&&s.ball.z<47&&dist(d,s.ball)+4<dist(receiver,s.ball));
    if(d){f.result.opponentIndex=s.defenders.indexOf(d);f.intercepted=true;f.result.success=false;f.result.turnover=true;f.result.reason='对手跟进球路，伸手截下传球。';f.from=copy(s.ball);f.to={x:d.x,y:d.y,z:32};f.duration=.12;f.arc=0;s.phaseAt=s.t;}
  }
  function start(s){if(s.phase!=='ready')return false;s.phase='playing';if(s.flow==='rebound')record(s,'miss','mate','队友投篮弹出，进攻篮板仍有机会。');think(s);s.ai.nextThink=s.t+.125;return true;}
  function pause(s,flag=true){if(s.phase==='done')return;s.paused=flag;s.target=null;}
  function notify(s,text){s.notice=text;s.noticeUntil=s.t+2.6;}
  function record(s,kind,actor,text,extra={}){s.events.push({kind,actor,text,t:Number(s.t.toFixed(3)),...extra});notify(s,text);}
  function grade(s,score,decision){s.grades.push(clamp(score,0,100));s.decisions.push(clamp(decision,0,3));}
  function canMove(s){if(s.run&&s.phase==='flight'&&(s.flight.kind==='steal'||s.flight.kind==='inbound'&&s.owner==='player'))return false;return !s.paused&&(s.phase==='playing'||s.phase==='flight'&&['shot','pass','oppShot','oppPass','inbound','steal'].includes(s.flight.kind));}
  function aim(s,x,y){if(!canMove(s)||s.charging)return false;s.target={x:clamp(x,90,810),y:clamp(y,150,s.run?965:480)};return true;}
  function shooter(s){return s.owner==='mate'?s.mates[s.carrier]:s.p;}
  function meter(s){
    if((s.phase==='flight'||s.phase==='done')&&s.release)return {...s.release};
    const p=shooter(s),range=dist(p,hoop),pressure=Math.max(0,68-Math.min(...s.defenders.map(d=>dist(d,p))))/68;
    const player=s.owner==='player',skill=s.config.attributes?(player?(range<160?ability(s,'drive')*.65+ability(s,'body')*.35:ability(s,'shot')):58+s.config.bond*.08):s.config.skill;
    const contact=player&&range<160&&perk(s,'finisher')?pressure*.85:pressure;
    let width=clamp(.20+skill/650-range/6500-contact*.07-(s.config.energy<(s.config.attributes?60:50)?.025*(1-(s.config.stamina-50)/100):0),.10,.33);
    if(player&&perk(s,'catchShoot')&&s.catchAt!==undefined&&s.t-s.catchAt<=3&&pressure<.25)width*=1.12;
    return {value:s.charging?(1-Math.cos((s.t-s.chargeAt)*Math.PI/1.3))/2:0,center:.64,width,range,pressure};
  }
  function outcome(s,success,score,reason,extra={}){return {mode:s.config.mode,success,score:Math.round(clamp(score,0,100)),reason,finisher:'mate',foul:false,turnover:false,decision:clamp(s.config.decision??3,0,3),...extra};}
  function end(s,reason,extra={}){
    if(s.phase==='done')return false;if(s.run){if(s.gameClock<=0)return finalWhistle(s);return possessionEnd(s,reason,extra);}
    s.phase='done';s.p.z=0;s.charging=false;s.planted=false;s.target=null;
    const score=s.grades.length?s.grades.reduce((a,b)=>a+b,0)/s.grades.length:extra.success?90:0;
    const decision=s.decisions.length?Math.round(s.decisions.reduce((a,b)=>a+b,0)/s.decisions.length):s.config.decision??3;
    s.outcome=outcome(s,s.teamPoints>0,score,reason,{...extra,decision,continuous:true,stats:copy(s.stats),teamPoints:s.teamPoints,opponentPoints:s.opponentPoints,events:copy(s.events)});return true;
  }
  function fly(s,from,to,duration,arc,result,kind='shot',shooterInfo){
    if(s.phase!=='playing')return false;s.phase='flight';s.phaseAt=s.t;s.charging=false;s.planted=false;
    s.flight={from:copy(from),to:copy(to),duration,arc,result,kind,...(shooterInfo?{shooter:copy(shooterInfo)}:{})};return true;
  }
  function shoot(s){
    if(s.phase!=='playing'||!s.charging||!['player','mate'].includes(s.owner))return false;
    const m=meter(s),error=Math.abs(m.value-m.center),quality=clamp(100-error*180-m.pressure*8,0,100),success=error<=m.width/2&&m.range<=420,p=shooter(s),actor=s.owner;
    const points=m.range>=285?3:2,decision=m.range>420?0:m.pressure<.25?3:m.pressure<.6?2:0;
    s.release={...m,t:s.t};grade(s,quality,decision);if(actor==='player')s.stats.attempts++;
    record(s,'shot',actor,`${actor==='player'?'你':mateName(s,s.carrier)}${points===3?'三分出手':'投篮出手'}，跟进准备争抢篮板。`,{points,index:actor==='mate'?s.carrier:-1});
    const result=outcome(s,success,quality,success?'篮球入网！':m.value<m.center?'出手偏早，篮球砸在前沿。':'出手偏晚，球弹在后沿。',{points,finisher:actor,decision});
    return fly(s,{x:p.x+14,y:p.y,z:58},{x:hoop.x+(success?0:m.value<m.center?-17:20),y:hoop.y,z:hoop.z},1.05,145,result,'shot',{x:p.x,y:p.y,actor,index:s.carrier});
  }
  function lanes(s){
    if(s.phase==='flight'&&s.passLanes&&s.flight.kind==='pass')return s.passLanes;
    return s.mates.map((mate,i)=>{const duration=passDuration(s,dist(s.p,mate)),from={x:s.p.x+14,y:s.p.y},to=project(mate,duration);let clearance=999;
      for(let k=1;k<=15;k++){const q=k/15,point={x:mix(from.x,to.x,q),y:mix(from.y,to.y,q)};const receiver=project(mate,duration*q);for(const d of blockers(s,s.t+duration*q))if(dist(d,point)+4<dist(receiver,point))clearance=Math.min(clearance,dist(point,d));}
      return {index:i,clearance,open:clearance>27,to,job:mate.job};});
  }
  function beginScreen(s){
    if(s.owner==='player'){const called=callPick(s,true);if(!called)notify(s,'队友已在掩护配合中；绕过掩护后可继续投或传。');return called;}
    if(s.owner!=='mate')return false;
    if(s.flow!=='screen'){s.flow='screen';s.stage='position';s.plantTime=0;s.screenSpot={x:clamp(s.carrierPos.x+(s.carrierPos.x<450?75:-75),120,780),y:clamp(s.carrierPos.y+35,190,365)};notify(s,'移动到金色圈，为持球队友站稳掩护。');return true;}
    if(s.stage==='roll'){aim(s,s.rollSpot.x,s.rollSpot.y);notify(s,'正在顺下接应。接球后可自己投，也可继续传。');return true;}
    if(dist(s.p,s.screenSpot)>40){notify(s,'先移动到金色掩护圈，再站稳。');return false;}
    s.planted=!s.planted;s.plantTime=0;s.playerScreenContact=undefined;s.target=null;return true;
  }
  function press(s,act,value){
    if(s.run&&['defend','track','contain'].includes(act))return defensiveInput(s,act);
    if(s.phase!=='playing'||s.paused)return false;
    if(act==='advance'&&s.run&&['player','mate'].includes(s.owner)){s.run.fastUntil=s.t+6;if(s.owner==='player')aim(s,450,300);else {goal(s.mates[s.carrier],{x:450,y:300},'推进反击',180);aim(s,s.p.x<450?300:600,340);}notify(s,'推进到上方前场；方向键可以接管跑动。');return true;}
    if(act==='shoot'&&['player','mate'].includes(s.owner)){
      if(s.flow==='drive'&&s.stage==='drive'){notify(s,'先绕开防守，运到篮下绿色区域。');return false;}
      if(!s.charging){s.release=null;s.charging=true;s.chargeAt=s.t;s.target=null;return true;}return shoot(s);
    }
    if(act==='release')return shoot(s);
    if(s.charging)return false;
    if(act==='pass'&&s.owner==='player'){
      if(![0,1,2].includes(value))return false;s.passLanes=lanes(s);const route=s.passLanes[value];s.selected=value;
      const result=outcome(s,true,route.open?Math.min(100,70+route.clearance/2):25,route.open?'接球成功，继续配合。':'传球被截，球权丢失。',{turnover:!route.open,receiver:mateName(s,value),decision:route.open?3:1});grade(s,result.score,result.decision);
      const from={x:s.p.x+14,y:s.p.y,z:32};const to={...route.to,z:30};
      goal(s.mates[value],route.to,'接应',190);s.ai.nextThink=s.t;
      record(s,'pass','player',`你传给${['空切','顺下','接应'].includes(s.mates[value].job)?'正在'+s.mates[value].job+'的':''}${mateName(s,value)}。`);return fly(s,from,to,passDuration(s,dist(from,to)),10,result,'pass');
    }
    if(act==='return'&&s.owner==='mate'){
      const from={...s.mates[s.carrier],z:32},to={x:s.p.x+12,y:s.p.y,z:32},safe=true;
      return fly(s,from,to,.55,14,outcome(s,safe,safe?85:25,safe?'回传到手，可以继续进攻。':'回传路线被对手切断。',{turnover:!safe}),'return');
    }
    if(act==='plant')return beginScreen(s);
    if(act==='box'&&s.owner==='loose'){s.box=!s.box;return true;}
    if(act==='jump'&&s.owner==='loose'){
      s.jumpTime=s.t;return reboundFlight(s,true);
    }
    if(act==='defend'&&s.flow==='defense'){
      const d=s.defenders[0],gap=dist(s.p,d),timely=Math.sin(s.t*5)>.15,success=gap<95&&timely,foul=gap<105&&!timely;
      return fly(s,copy(s.ball),success?{...s.p,z:32}:{...hoop},.8,success?30:105,outcome(s,success,success?90:30,success?'你封住球路，球队拿回球权。':foul?'伸手早了一拍，打到了对手手臂，被吹犯规。':'对手找到空当完成得分。',{foul,defensive:s.config.variant==='help'?'block':'steal'}),'defense');
    }
    if(act==='shield'&&s.flow==='protect'){s.box=!s.box;return true;}return false;
  }
  function ball(s){
    if(s.phase==='flight'){const f=s.flight,q=clamp((s.t-s.phaseAt)/f.duration,0,1);s.ball={x:mix(f.from.x,f.to.x,q),y:mix(f.from.y,f.to.y,q),z:mix(f.from.z,f.to.z,q)+f.arc*Math.sin(Math.PI*q)};return;}
    if(s.phase==='done')return;
    if(s.owner==='loose'){const q=clamp((s.t-s.reboundAt)/(s.jumpAt-s.reboundAt),0,1);s.ball={x:mix(s.reboundFrom.x,s.landing.x,q),y:mix(s.reboundFrom.y,s.landing.y,q),z:mix(s.reboundFrom.z,60,q)+95*Math.sin(q*Math.PI)};}
    else {const p=s.owner==='mate'?s.mates[s.carrier]:s.owner==='opponent'?s.defenders[s.run?.carrier??0]:s.p;s.ball={x:p.x+16,y:p.y,z:s.charging?58:14+Math.abs(Math.sin(s.t*7))*24};}
  }
  function live(s,owner){s.phase='playing';s.owner=owner;s.flow='shot';s.stage='aim';s.charging=false;s.release=null;s.planted=false;s.box=false;s.boxTime=0;s.p.z=0;s.flight=null;s.target=null;delete s.jumpTime;}
  function miss(s,f){
    record(s,'miss',f.shooter.actor,f.result.reason+' 球还活着，跟进抢板！');s.lastPass=null;
    if(s.gameClock<=0){end(s,'终场哨响，最后一投弹筐而出。',{end:'clock'});return;}
    s.phase='playing';s.flow='rebound';s.owner='loose';s.stage='board';s.charging=false;s.box=false;s.boxTime=0;s.release=null;s.reboundAt=s.t;s.reboundFrom=copy(s.ball);s.jumpAt=s.t+2.05;delete s.jumpTime;
    s.landing=landingFor(s,f);s.flight=null;s.ai.nextThink=s.t;s.ai.pickPhase='none';s.ai.pickIndex=-1;s.screenUntil=s.t;s.ai.boardResolved=false;
  }
  function finishFlight(s){
    const f=s.flight;if(s.t-s.phaseAt+1e-8<f.duration)return;
    if(s.run&&['oppShot','oppPass','inbound','steal'].includes(f.kind)){finishLiveFlight(s,f);return;}
    if(f.kind==='shot'){
      if(!f.result.success){miss(s,f);return;}
      const actor=f.shooter.actor,points=f.result.points;s.teamPoints+=points;
      if(actor==='player'){s.stats.made++;s.stats.points+=points;}else if(s.lastPass?.actor==='player'&&s.lastPass.receiver===s.carrier)s.stats.assists++;
      record(s,'make',actor,`${actor==='player'?'你':mateName(s,s.carrier)}${points===3?'三分':'两分'}命中${actor==='mate'&&s.stats.assists?'，你的助攻也记下了':''}！`,{points,index:f.shooter.index});
      s.ball={x:hoop.x,y:hoop.y+13,z:25};end(s,s.events.slice(-5).map(e=>e.text).join(' '),{success:true,points,finisher:actor,end:'make'});return;
    }
    if(['pass','return','rollpass'].includes(f.kind)){
      if(!f.result.success){if(f.kind==='pass')s.stats.turnovers++;record(s,'turnover',f.kind==='pass'?'player':'mate',f.result.reason);end(s,f.result.reason,{turnover:true,end:'lost'});return;}
      if(f.kind==='pass'){
        if(dist(s.mates[s.selected],f.to)>32){s.stats.turnovers++;record(s,'turnover','player','接应被防守挡住，队友没能在落点接住球。');end(s,'接应没跟上，这次传球出了边线。',{turnover:true,end:'lost'});return;}
        live(s,'mate');s.carrier=s.selected;s.carrierPos={x:s.mates[s.selected].x,y:s.mates[s.selected].y};s.lastPass={actor:'player',receiver:s.carrier};actors(s);record(s,'catch','mate',`${mateName(s,s.carrier)}接稳了！你可以跑位掩护、要回传，或控制他的投篮。`);
        if(s.config.variant==='protectPass'){s.flow='protect';s.stage='hold';}return;
      }
      live(s,'player');s.catchAt=s.t;s.lastPass=null;s.carrierPos=null;s.ai.nextThink=s.t;actors(s);record(s,'catch','player','回传接到了！现在可以投篮，也可以继续分球。');return;
    }
    if(f.kind==='rebound'){
      if(s.gameClock<=0){end(s,'终场哨响，未能在时间内控制篮板。',{end:'clock'});return;}
      const winner=f.result.boardOwner||(f.result.success?'player':'opponent');
      if(s.run){finishLiveBoard(s,f,winner);return;}
      if(winner==='player'){s.stats.rebounds++;s.clock=14;live(s,'player');s.lastPass=null;s.carrierPos=null;s.ai.nextThink=s.t;record(s,'rebound','player','进攻篮板 +1！球权还在，补篮、传球或重新组织。');ball(s);}
      else if(winner==='mate'){const i=f.result.boardIndex;s.clock=14;live(s,'mate');s.carrier=i;s.carrierPos={x:s.mates[i].x,y:s.mates[i].y};s.lastPass=null;s.ai.nextThink=s.t;record(s,'rebound','mate',mateName(s,i)+'冲抢拿下进攻篮板！你可以要回传或继续配合。');ball(s);}
      else{record(s,'rebound','opponent',f.result.reason);s.owner='opponent';end(s,f.result.reason,{end:'lost'});}return;
    }
    if(f.kind==='defense'){
      if(f.result.foul)s.stats.fouls++;
      if(f.result.success){if(f.result.defensive==='steal')s.stats.steals++;if(f.result.defensive==='block')s.stats.blocks++;}else s.opponentPoints+=2;
      grade(s,f.result.score,f.result.foul?1:3);record(s,'stop','player',f.result.reason);
      if(s.run&&!f.result.success){record(s,'make','opponent','对方完成已出手的旧回合，2分命中。',{points:2});if(s.gameClock<=0)finalWhistle(s);else homeInbound(s);return;}
      end(s,f.result.reason,{...f.result,end:'stop'});return;
    }
    // Legacy pending flight upgrade: a gathered pass or roll now gives live possession.
    if(f.kind==='gather'){const own=f.shooter?.actor==='player';live(s,own?'player':'mate');s.carrierPos=own?null:{x:f.to.x,y:f.to.y};record(s,'catch',s.owner,'接球到手，继续这一回合。');return;}
    if(f.result.foul){s.stats.fouls++;record(s,'foul','player',f.result.reason);}
    else if(f.result.turnover){s.stats.turnovers++;record(s,'turnover','player',f.result.reason);}
    end(s,f.result.reason,{...f.result,end:f.result.foul?'foul':f.result.success?'protected':'lost'});
  }
  function move(s,dt,input){
    if(!canMove(s))return;let dx=clamp(input.x||0,-1,1),dy=clamp(input.y||0,-1,1);if(dx||dy){s.target=null;if(s.run)s.run.tracking=false;}
    if(s.target){const d=dist(s.p,s.target);if(d<3)s.target=null;else{dx=(s.target.x-s.p.x)/d;dy=(s.target.y-s.p.y)/d;}}
    const moving=Math.hypot(dx,dy)>.01;
    if(s.planted&&moving){if(s.plantTime>.36&&s.plantTime<.75){s.stats.fouls++;grade(s,20,0);record(s,'foul','player','接触时仍在移动，被吹移动掩护。');end(s,'移动掩护犯规，球权交给对手。',{foul:true,end:'foul'});return;}s.planted=false;s.plantTime=0;}
    const mag=Math.hypot(dx,dy)||1,speed=(155+(s.config.attributes?(s.owner==='opponent'?ability(s,'defense'):ability(s,'drive')):s.config.skill)*.7)*(s.owner==='player'&&perk(s,'ballHandler')?1.06:1)*(1-Math.max(0,65-s.config.energy)/(180+s.config.stamina*2))*(s.box?.65:1)*(s.charging?0:1)*(s.run?.containing?.82:1)*(input.analog?Math.min(1,mag):1);
    if(moving){s.p.x=clamp(s.p.x+dx/mag*speed*dt,88,812);s.p.y=clamp(s.p.y+dy/mag*speed*dt,153,s.run?965:478);}
  }
  function substep(s,dt,input){
    if(s.paused||s.phase==='ready'||s.phase==='done')return;
    s.t+=dt;if(!(s.run&&s.phase==='flight'&&s.flight.kind==='inbound'))s.gameClock=Math.max(0,s.gameClock-dt);
    if(s.run){const focus=Math.abs(s.ball.y-s.p.y)>420?s.ball.y:(s.ball.y+s.p.y)/2,target=clamp(focus-285,0,FULL_H-H);s.run.cameraY=mix(s.run.cameraY,target,Math.min(1,dt*4));if(s.run.tracking&&s.owner==='opponent')s.target=defenseSpot(s);}if(s.phase==='playing'&&s.owner!=='loose'||s.phase==='flight'&&['pass','return','rollpass','oppPass'].includes(s.flight.kind))s.clock=Math.max(0,s.clock-dt);
    if(s.run&&s.gameClock<=0&&!(s.phase==='flight'&&['shot','oppShot'].includes(s.flight.kind))){finalWhistle(s);return;}
    move(s,dt,input);actors(s,dt);if(s.phase==='done')return;
    if(s.phase==='flight'){s.p.z=s.flight.kind==='rebound'&&s.jumpTime!==undefined?48*Math.sin(Math.PI*clamp((s.t-s.phaseAt)/.5,0,1)):0;ball(s);if(s.run&&s.flight.kind==='oppPass')interceptAway(s);else if(s.phase==='flight')intercept(s);if(s.phase==='flight')finishFlight(s);if(s.phase==='flight'&&['pass','return','rollpass','oppPass'].includes(s.flight.kind)&&(s.clock<=0||s.gameClock<=0)){if(s.run&&s.flight.kind==='oppPass'){record(s,'turnover','opponent','对方传球时进攻超时。');const i=closest([s.p,...s.mates],s.ball);claim(s,'home',i===0?'player':'mate',i-1,'对方超时，我方发球。',true);return;}if(s.flight.kind==='pass')s.stats.turnovers++;record(s,'turnover','mate','传球尚未接稳，时间已经耗尽。');end(s,'时间耗尽，传球未能形成出手。',{turnover:true,end:'clock'});}return;}
    if(s.run&&s.owner==='opponent'){awayTick(s);ball(s);return;}
    if(s.flow==='screen'&&s.owner==='mate'){
      if(s.planted&&dist(s.p,s.screenSpot)<42)s.plantTime+=dt;
      if(s.stage==='position'&&s.plantTime>=(s.config.attributes?.body!==undefined?.8*(1-(ability(s,'body')-55)*.003):.8)&&(!s.config.attributes||s.playerScreenContact!==undefined&&s.t-s.playerScreenContact<1)){s.stage='roll';s.planted=false;s.cutAt=s.t;grade(s,95,3);record(s,'screen','player','掩护成功！向篮下绿色圆圈顺下，接球后继续处理。');}
      if(s.stage==='roll'&&dist(s.p,s.rollSpot)<8){fly(s,{x:s.mates[s.carrier].x+12,y:s.mates[s.carrier].y,z:50},{x:s.p.x+12,y:s.p.y,z:32},.55,75,outcome(s,true,95,'顺下接到回传。'),'rollpass');ball(s);return;}
    }
    if(s.owner==='loose'){
      if(s.box&&dist(s.p,s.landing)<90)s.boxTime+=dt;
      if(s.t>s.jumpAt+.3){reboundFlight(s);ball(s);return;}
    }
    if(s.flow==='drive'&&s.owner==='player'){
      if(s.stage==='drive'&&dist(s.p,s.defenders[0])<(s.config.attributes?clamp(40-ability(s,'handle')*.11,28,40)*(perk(s,'ballHandler')?.92:1):34)){s.stats.turnovers++;record(s,'turnover','player','撞进防守人的正面，运球被断。');end(s,'突破被断，球权交给对手。',{turnover:true,end:'lost'});return;}
      if(s.stage==='drive'&&dist(s.p,hoop)<132){s.stage='aim';notify(s,'突破成功！可以投篮终结，也可以传球。');}
    }
    if(s.flow==='defense'&&!s.run){
      const d=s.defenders[0];if(dist(s.p,{x:d.x,y:d.y-65})<75)s.defenseTime+=dt;
      if(s.t>=6.1){const win=s.defenseTime>=2;fly(s,copy(s.ball),win?{x:540,y:200,z:0}:{...hoop},.9,100,outcome(s,win,Math.min(100,s.defenseTime*30),win?'你持续守住路线，对手在干扰下投丢。':'没能持续跟住持球人，对手完成得分。'),'defense');ball(s);return;}
    }
    if(s.flow==='protect'&&s.owner==='player'&&s.defenders.some(d=>dist(s.p,d)<(s.box?(s.config.attributes?30-ability(s,'handle')*.1:24):37))){s.stats.turnovers++;record(s,'turnover','player','对手逼抢切走篮球。');end(s,'护球失误，球权交给对手。',{turnover:true,end:'lost'});return;}
    if(s.gameClock<=0&&s.flow==='protect'){record(s,'stop',s.owner,'终场哨响，球队守住球权和领先。');end(s,'你们控制住球权，稳稳把优势保留到哨响。',{success:true,end:'protected'});return;}
    if(s.gameClock<=0||s.clock<=0){if(s.owner==='player')s.stats.turnovers++;record(s,'turnover',s.owner,'时间耗尽，未能完成出手。');end(s,'时间耗尽，这次进攻结束。',{turnover:true,end:'clock'});return;}
    ball(s);
  }
  function step(s,seconds,input={}){if(!Number.isFinite(seconds)||seconds<=0||s.paused)return s;let remaining=Math.min(seconds,.25);while(remaining>1e-9){const dt=Math.min(remaining,1/120);substep(s,dt,input);remaining-=dt;}return s;}
  function landingFor(s,f){
    const side=f.to.x<450?-1:1;
    return {x:clamp(450+side*(38+s.config.seed%35),310,590),y:f.kind==='oppShot'?awayHoop.y-140-s.config.seed%50:245+s.config.seed%50};
  }
  function initRun(s,resume=false){
    const duration=clamp(Number(s.config.matchSeconds)||120,1,600);
    s.run={version:1,duration,side:s.owner==='opponent'?'away':'home',carrier:0,possessions:1,started:s.t,fastUntil:0,nextAction:s.t+1.5,shots:0,passes:0,stealAt:0,blockAt:0,tracking:false,containing:false,cameraY:0,baseScore:Array.isArray(s.config.baseScore)?copy(s.config.baseScore):[0,0],inbound:false};
    s.gameClock=resume?Math.max(.1,duration-s.t):duration;
    [...s.mates,...s.defenders].forEach(a=>a.maxY=965);
    if(s.flow==='defense'){s.run.side='away';if(!resume){s.p.y+=580;[...s.mates,...s.defenders].forEach(a=>{a.y=Math.min(965,a.y+580);a.gy=Math.min(965,a.gy+580);});}s.run.cameraY=clamp((s.p.y+s.defenders[0].y)/2-285,0,FULL_H-H);}
    else if(s.config.fastbreak&&s.flow==='drive'&&!resume){
      s.p.x=450;s.p.y=640;s.run.fastUntil=8;
      s.mates.forEach((p,i)=>{p.x=[190,710,510][i];p.y=[500,565,735][i];p.gx=p.x;p.gy=p.y;});
      s.defenders.forEach((p,i)=>{p.x=[420,250,675,520][i];p.y=[405,480,725,810][i];p.gx=p.x;p.gy=p.y;});
      s.run.cameraY=clamp(s.p.y-300,0,FULL_H-H);
    }
  }
  function defenseSpot(s){const p=s.defenders[s.run?.carrier??0],g=s.run?awayHoop:hoop,d=dist(p,g)||1;return {x:clamp(p.x+(g.x-p.x)/d*48,90,810),y:clamp(p.y+(g.y-p.y)/d*48,153,s.run?965:478)};}
  function resetPlay(s){
    s.phase='playing';s.flight=null;s.outcome=null;s.release=null;s.charging=false;s.planted=false;s.box=false;s.boxTime=0;s.p.z=0;s.lastPass=null;s.target=null;delete s.jumpTime;
    s.ai.pickPhase='none';s.ai.pickIndex=-1;s.ai.nextThink=s.t;s.ai.nextPick=s.t+2.6;s.ai.cutUntil=s.t;s.ai.nextCut=s.t+.65;s.screenUntil=s.t;
    [...s.mates,...s.defenders].forEach(a=>{delete a.blockUntil;delete a.screenPoint;});
  }
  function claim(s,side,owner,index,why,inbound=false){
    resetPlay(s);s.run.side=side;s.run.carrier=side==='away'?index:0;s.owner=side==='away'?'opponent':owner;s.carrier=side==='home'&&owner==='mate'?index:s.carrier;
    s.carrierPos=s.owner==='mate'?{x:s.mates[s.carrier].x,y:s.mates[s.carrier].y}:null;s.flow=side==='away'?'defense':'shot';s.stage='aim';s.clock=24;
    s.run.possessions++;s.run.started=s.t;s.run.nextAction=s.t+1.1;s.run.passes=0;s.run.tracking=false;s.run.containing=false;s.run.fastUntil=inbound?0:s.t+6;s.run.inbound=inbound;
    record(s,'possession',s.owner,why,{side,number:s.run.possessions});
    if(inbound){const p=s.owner==='opponent'?s.defenders[index]:s.owner==='mate'?s.mates[index]:s.p;fly(s,copy(s.ball),{x:p.x+12,y:p.y,z:32},.65,12,outcome(s,true,70,'发球接稳。'),'inbound');}
    else ball(s);
  }
  function closest(list,point){return list.map((p,i)=>({i,d:dist(p,point)})).sort((a,b)=>a.d-b.d)[0].i;}
  function homeInbound(s){const list=[s.p,...s.mates],i=closest(list,s.ball);claim(s,'home',i===0?'player':'mate',i-1,'对方得分，我方发球，继续进攻。',true);}
  function possessionEnd(s,reason,e){
    if(e.end==='make'){const home=[s.p,...s.mates],i=s.defenders.map((p,i)=>({i,score:Math.min(...home.map(h=>dist(h,p)))-dist(p,s.ball)*.2})).sort((a,b)=>b.score-a.score)[0].i;claim(s,'away','opponent',i,'我方命中，对方发球。立即退防！',true);return true;}
    if(e.end==='stop'&&e.success){claim(s,'home','player',-1,'防守成功！带球向前场发动反击。');return true;}
    const i=s.flight?.result?.opponentIndex??closest(s.defenders,s.ball);
    claim(s,'away','opponent',i,e.end==='clock'?'进攻超时，对方接管球权。马上退防！':e.end==='foul'?'进攻犯规，对方发球。':'球权丢失，对手发动反击！',e.end==='clock'||e.end==='foul');return true;
  }
  function finishLiveBoard(s,f,winner){
    const offensive=(s.run.side==='home')===(winner!=='opponent');
    if(winner==='player')s.stats.rebounds++;
    const text=winner==='player'?(offensive?'进攻篮板 +1，继续投传配合！':'防守篮板 +1！带球向上方球篮发动反击。'):winner==='mate'?(offensive?mateName(s,f.result.boardIndex)+'拿到进攻篮板，继续配合。':mateName(s,f.result.boardIndex)+'拿到防守篮板！前场接应，准备反击。'):(offensive?'对手抢下进攻篮板，继续防守！':'对手收下防守篮板，马上退防！');
    record(s,'rebound',winner,text,{offensive,index:f.result.boardIndex});
    if(offensive){const side=s.run.side,idx=f.result.boardIndex;resetPlay(s);s.run.side=side;s.clock=14;s.owner=winner;s.flow=side==='away'?'defense':'shot';s.stage='aim';if(winner==='mate')s.carrier=idx;if(winner==='opponent')s.run.carrier=idx;s.run.nextAction=s.t+.9;ball(s);return;}
    claim(s,winner==='opponent'?'away':'home',winner,f.result.boardIndex,text);
  }
  function finalWhistle(s){
    if(s.phase==='done')return false;
    if(s.config.noDraw&&s.run.baseScore[0]+s.teamPoints===s.run.baseScore[1]+s.opponentPoints){s.run.overtimes=(s.run.overtimes||0)+1;s.run.duration+=300;s.gameClock=300;record(s,'overtime','player',`双方战平，进入第${s.run.overtimes}个加时，继续五分钟攻防。`);const away=s.run.overtimes%2===1;claim(s,away?'away':'home',away?'opponent':'player',away?0:-1,'加时开始，球权已确定，继续比赛。',true);return true;}
    s.phase='done';s.p.z=0;s.charging=false;s.planted=false;s.target=null;s.run.tracking=false;
    const a=s.run.baseScore[0]+s.teamPoints,b=s.run.baseScore[1]+s.opponentPoints,decision=s.decisions.length?Math.round(s.decisions.reduce((a,b)=>a+b,0)/s.decisions.length):1,score=s.grades.length?Math.round(s.grades.reduce((a,b)=>a+b,0)/s.grades.length):0;
    record(s,'whistle','player',s.config.highlight?`关键片段结束，${a} : ${b}。回到比赛战报。`:`终场哨响，${a} : ${b}。本段比赛已结束。`);
    s.outcome=outcome(s,a>=b,score,`${s.config.highlight?'本段结束':'终场'} ${a} : ${b}。你得到 ${s.stats.points} 分、${s.stats.rebounds} 个篮板、${s.stats.assists} 次助攻、${s.stats.steals} 次抢断。`,{decision,continuous:true,liveMatch:true,duration:s.run.duration,...(s.config.noDraw?{noDraw:true,overtimes:s.run.overtimes||0}:{}),possessions:s.run.possessions,stats:copy(s.stats),teamPoints:s.teamPoints,opponentPoints:s.opponentPoints,events:copy(s.events),end:'whistle'});return true;
  }
  function awayThink(s){
    const r=s.run,b=s.defenders[r.carrier],guard=s.owner==='opponent'?defenseSpot(s):null;
    s.defenders.forEach((d,i)=>{
      if(i===r.carrier){if(s.phase==='flight'){goal(d,d,'持球',0);return;}const close=[s.p,...s.mates].filter(p=>p.y>d.y&&dist(p,d)<95).sort((a,b)=>dist(a,d)-dist(b,d))[0];goal(d,{x:close?clamp(d.x+(d.x<close.x?-95:95),180,720):450+(i%2?-90:90),y:Math.min(awayHoop.y-95,d.y+210)},r.fastUntil>s.t?'推进反击':'持球突破',r.fastUntil>s.t?184:160);return;}
      if(s.phase==='flight'&&s.flight.kind==='oppPass'&&s.flight.result.opponentIndex===i){goal(d,s.flight.to,'接应',190);return;}
      goal(d,{x:[180,720,365,565][i],y:clamp(b.y+140+(i%2?30:0),340,840)},r.fastUntil>s.t?'快下接应':i===(r.carrier+1)%4?'空切':'拉开空间',178);
    });
    s.mates.forEach((m,i)=>{const target=s.defenders[i+1],onBall=i+1===r.carrier,help=r.carrier===0&&i===2&&dist(b,awayHoop)<210;const g=help?b:target,range=dist(g,awayHoop)||1;goal(m,{x:g.x+(awayHoop.x-g.x)/range*(onBall||help?44:42),y:g.y+(awayHoop.y-g.y)/range*(onBall||help?44:42)},help?'协防':r.fastUntil>s.t?'退防':onBall?'贴防':'跟防',r.fastUntil>s.t?187:166);});
  }
  function fixedNoise(seed,n){let v=(seed+Math.imul(n+1,2654435761))>>>0;v^=v>>>16;v=Math.imul(v,2246822507)>>>0;v^=v>>>13;return (v>>>0)/4294967296;}
  function safeAwayRoute(s,from,to){
    const end=project(to,.65),home=[s.p,...s.mates];for(let k=1;k<12;k++){const q=k/12,point={x:mix(from.x+12,end.x,q),y:mix(from.y,end.y,q)},receiver=project(to,.65*q);for(const h of home){const p=h===s.p?h:project(h,.65*q);if(dist(p,point)<29&&dist(p,point)+4<dist(receiver,point))return false;}}return true;
  }
  function awayTick(s){
    if(s.gameClock<=0){finalWhistle(s);return;}if(s.clock<=0){record(s,'turnover','opponent','对方进攻超时，我方接管球权。');const i=closest([s.p,...s.mates],s.ball);claim(s,'home',i===0?'player':'mate',i-1,'守住了！我方发球继续比赛。',true);return;}
    const r=s.run,p=s.defenders[r.carrier],home=[s.p,...s.mates],gap=Math.min(...home.map(a=>dist(a,p)-(a===s.p&&r.containing?22:0))),range=dist(p,awayHoop);
    if(s.t<r.nextAction)return;
    const options=s.defenders.map((a,i)=>({i,a,gap:Math.min(...home.map(h=>dist(h,a))),ahead:a.y-p.y})).filter(x=>x.i!==r.carrier&&x.ahead>25&&x.gap>52&&safeAwayRoute(s,p,x.a)).sort((a,b)=>(b.gap+b.ahead*.2)-(a.gap+a.ahead*.2));
    if(r.passes<2&&options.length&&(gap<68||range>280)&&s.t-r.started>1.2){const target=options[0],to={...project(target.a,.65),z:32};r.passes++;r.nextAction=s.t+1.3;record(s,'pass','opponent','对手向前场传球。');fly(s,{x:p.x+12,y:p.y,z:32},to,.65,12,outcome(s,true,70,'对方接应收球。',{opponentIndex:target.i}),'oppPass');s.ai.nextThink=s.t;return;}
    if(range<145||range<280&&(gap>66||s.t-r.started>5.5)||s.clock<1.3){
      const pressure=clamp((86-gap)/86,0,1),points=range>=285?3:2,chance=range>420?0:clamp(.72-pressure*.44*(s.config.attributes?(0.7+ability(s,'defense')/180):1)-(range>200?.1:0)+((s.config.opposition||1)-1)*.35,.16,.84),made=fixedNoise(s.config.seed,++r.shots)<chance;
      if(dist(s.p,p)<95)grade(s,78,3);
      record(s,'shot','opponent',`对手${points===3?'三分出手':'起跳投篮'}，准备封盖或争板。`,{points,index:r.carrier});
      fly(s,{x:p.x+12,y:p.y,z:58},{x:awayHoop.x+(made?0:23),y:awayHoop.y,z:55},.95,135,outcome(s,made,70,made?'对手命中。':'对方出手弹筐而出。',{points}),'oppShot',{x:p.x,y:p.y,actor:'opponent',index:r.carrier});return;
    }
    r.nextAction=s.t+.35;
  }
  function finishLiveFlight(s,f){
    if(f.kind==='inbound'){s.phase='playing';s.flight=null;s.run.inbound=false;s.ai.nextThink=s.t;s.run.started=s.t;s.run.nextAction=s.t+.5;s.run.stealAt=Math.max(s.run.stealAt,s.t+1.1);ball(s);return;}
    if(f.kind==='steal'){claim(s,'home','player',-1,'抢断到手！向上方球篮发动反击。');return;}
    if(f.kind==='oppPass'){s.run.carrier=f.result.opponentIndex;s.phase='playing';s.flight=null;s.ai.nextThink=s.t;s.run.nextAction=s.t+.55;record(s,'catch','opponent','对方接球继续推进，跟住持球人。');ball(s);return;}
    if(f.kind==='oppShot'){
      if(f.result.success){s.opponentPoints+=f.result.points;record(s,'make','opponent',`对手${f.result.points}分命中，我方发球。`,{points:f.result.points,index:f.shooter?.index??s.run.carrier});s.ball={x:awayHoop.x,y:awayHoop.y+12,z:25};if(s.gameClock<=0)finalWhistle(s);else homeInbound(s);return;}
      miss(s,f);return;
    }
  }
  function defensiveInput(s,act){
    if(s.paused||s.phase==='ready'||s.phase==='done'||s.owner!=='opponent')return false;
    if(act==='track'){s.run.tracking=!s.run.tracking;notify(s,s.run.tracking?'正在跟随持球人，方向键可随时接管。':'已取消跟防辅助。');return true;}
    if(act==='contain'){s.run.containing=!s.run.containing;notify(s,s.run.containing?'保持在人与篮筐之间，等待抢断时机。':'继续移动跟防。');return true;}
    const p=s.defenders[s.run.carrier];
    if(s.phase==='flight'){
      const f=s.flight;if(f.kind!=='oppShot'||s.t<s.run.blockAt)return false;s.run.blockAt=s.t+.8;
      const q=(s.t-s.phaseAt)/f.duration,near=dist(s.p,p)<(s.config.attributes?68+ability(s,'defense')*.4:90)||dist(s.p,awayHoop)<(105+(perk(s,'rim')&&s.p.y>=p.y&&s.p.y<=awayHoop.y+10?10:0));
      if(near&&q>.08&&q<.65&&!f.result.blocked){f.result.success=false;f.result.blocked=true;f.result.reason='你封到了篮球！落点处准备收板。';s.stats.blocks++;grade(s,95,3);record(s,'block','player','封盖成功！篮球仍是活球，跟进抢板。');}else notify(s,'没碰到球，赶快准备争板。');return true;
    }
    if(s.t<s.run.stealAt)return false;s.run.stealAt=s.t+1.1;
    const gap=dist(s.p,p),low=s.ball.z<30;
    if(gap<(s.config.attributes?30+ability(s,'defense')*.15:38)*tired(s)&&low){s.stats.steals++;grade(s,95,3);record(s,'steal','player','你切下篮球，反击机会来了！');fly(s,copy(s.ball),{x:s.p.x+12,y:s.p.y,z:32},.3,12,outcome(s,true,95,'抢断成功。'),'steal');}
    else if(gap<32&&!low){s.stats.fouls++;grade(s,25,0);record(s,'foul','player','伸手碰到对手手臂，犯规。对方重新发球。');claim(s,'away','opponent',s.run.carrier,'防守犯规，对手边线发球继续。',true);}
    else {grade(s,35,1);notify(s,gap>=38?'距离太远，先用脚步靠近持球人。':'对方把球护住了，等运球落低再伸手。');}return true;
  }
  function interceptAway(s){
    const f=s.flight;if(f.kind!=='oppPass')return;const receiver=s.defenders[f.result.opponentIndex],list=[s.p,...s.mates],i=list.findIndex(h=>dist(h,s.ball)<(h===s.p&&s.config.attributes?20+ability(s,'defense')*.08:24)&&s.ball.z<48&&dist(h,s.ball)+4<dist(receiver,s.ball));
    if(i<0)return;if(i===0)s.stats.steals++;record(s,'steal',i===0?'player':'mate',i===0?'你拦下对方传球，立即反击！':'队友断下传球！跑向前场接应。');claim(s,'home',i===0?'player':'mate',i-1,'断球成功，我方发动反击。');
  }
  function validRun(s){const r=s.run;return r.version===1&&['home','away'].includes(r.side)&&['duration','started','fastUntil','nextAction','shots','passes','stealAt','blockAt','cameraY'].every(k=>Number.isFinite(r[k]))&&r.duration>=1&&r.duration<=(s.config.noDraw?86400:600)&&(r.overtimes===undefined||Number.isInteger(r.overtimes)&&r.overtimes>=0)&&(s.config.noDraw?r.duration===s.config.matchSeconds+(r.overtimes||0)*300:!r.overtimes)&&r.cameraY>=0&&r.cameraY<=FULL_H-H&&Number.isInteger(r.carrier)&&r.carrier>=0&&r.carrier<4&&Number.isInteger(r.possessions)&&r.possessions>=1&&r.possessions<=(s.config.noDraw?20000:500)&&typeof r.tracking==='boolean'&&typeof r.containing==='boolean'&&typeof r.inbound==='boolean'&&Array.isArray(r.baseScore)&&r.baseScore.length===2&&r.baseScore.every(x=>Number.isInteger(x)&&x>=0);}
  function receiptOK(r){
    if(r.continuous===undefined)return true;
    const st=r.stats,keys=statKeys;if(r.continuous!==true||!st||!keys.every(k=>Number.isInteger(st[k])&&st[k]>=0&&st[k]<=(r.liveMatch?1000:100))||st.made>st.attempts||!Number.isInteger(r.teamPoints)||r.teamPoints<0||r.teamPoints>(r.liveMatch?1000:3)||!Number.isInteger(r.opponentPoints)||r.opponentPoints<0||r.opponentPoints>(r.liveMatch?1000:2)||st.points>r.teamPoints||!Array.isArray(r.events)||r.events.length>((r.noDraw||r.config?.noDraw)?20000:r.liveMatch?2000:150))return false;
    return r.events.every(e=>e&&typeof e.kind==='string'&&typeof e.text==='string'&&e.text.length<300&&['player','mate','loose','opponent'].includes(e.actor)&&Number.isFinite(e.t)&&e.t>=0&&e.t<=((r.noDraw||r.config?.noDraw)?86400:r.liveMatch?1200:180));
  }
  function resultValid(r,receivers=names){return !!(r&&Object.hasOwn(modes,r.mode)&&typeof r.success==='boolean'&&Number.isFinite(r.score)&&r.score>=0&&r.score<=100&&typeof r.reason==='string'&&r.reason.length<1000&&['player','mate'].includes(r.finisher)&&typeof r.foul==='boolean'&&typeof r.turnover==='boolean'&&(r.points===undefined||[2,3].includes(r.points))&&(r.defensive===undefined||['steal','block','stop'].includes(r.defensive))&&(r.decision===undefined||Number.isInteger(r.decision)&&r.decision>=0&&r.decision<=3)&&(r.receiver===undefined||receivers.includes(r.receiver))&&receiptOK(r));}
  function valid(s){
    if(!s||s.v!==2||!s.config||!Object.hasOwn(modes,s.config.mode)||!Object.hasOwn(modes,s.flow)||!['ready','playing','flight','done'].includes(s.phase)||!['player','mate','loose','opponent'].includes(s.owner)||typeof s.paused!=='boolean'||!Number.isFinite(s.t)||s.t<0||s.t>(s.config?.noDraw?86400:s.config?.liveMatch?1200:180))return false;
    const cfg=s.config;if(cfg.attributes!==undefined&&(!cfg.attributes||!attrKeys.every(k=>Number.isFinite(cfg.attributes[k])&&cfg.attributes[k]>=0&&cfg.attributes[k]<=96)))return false;if(cfg.perks!==undefined&&(!Array.isArray(cfg.perks)||cfg.perks.length>2||new Set(cfg.perks).size!==cfg.perks.length||!cfg.perks.every(k=>perkKeys.includes(k))))return false;if(cfg.noDraw!==undefined&&(typeof cfg.noDraw!=='boolean'||cfg.noDraw&&!cfg.liveMatch))return false;if(cfg.teamName!==undefined&&(typeof cfg.teamName!=='string'||!cfg.teamName.length||cfg.teamName.length>30))return false;if(cfg.teammates!==undefined&&(!Array.isArray(cfg.teammates)||cfg.teammates.length!==3||!cfg.teammates.every(n=>typeof n==='string'&&n.length>0&&n.length<=20)))return false;if(cfg.opposition!==undefined&&(!Number.isFinite(cfg.opposition)||cfg.opposition<1||cfg.opposition>1.4))return false;if(!['skill','energy','bond','stamina'].every(k=>Number.isFinite(cfg[k])&&cfg[k]>=0&&cfg[k]<=({skill:96,stamina:96}[k]||100))||!Number.isInteger(cfg.number)||cfg.number<0||cfg.number>99||!Number.isInteger(cfg.seed)||cfg.seed<0||cfg.seed>4294967295||!['guard','wing','big'].includes(cfg.role))return false;
    const point=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&Math.abs(p.x)<2000&&Math.abs(p.y)<2000;
    if(!point(s.p)||!point(s.ball)||!point(s.landing)||!point(s.screenSpot)||!point(s.rollSpot)||!point(s.reboundFrom)||!Array.isArray(s.mates)||!s.mates.every(point)||!Array.isArray(s.defenders)||!s.defenders.every(point)||s.carrierPos&&!point(s.carrierPos)||!Number.isInteger(s.carrier)||s.carrier<0||s.carrier>2)return false;
    if(!['phaseAt','chargeAt','plantTime','boxTime','defenseTime','jumpAt','reboundAt','cutAt','screenUntil','noticeUntil','clock','gameClock'].every(k=>Number.isFinite(s[k]))||s.clock<0||s.clock>24||s.gameClock<0||s.gameClock>(s.config.liveMatch?600:90)||typeof s.notice!=='string'||!['charging','planted','box'].every(k=>typeof s[k]==='boolean'))return false;
    if(!receiptOK({...s,continuous:true,liveMatch:!!s.run})||!Array.isArray(s.decisions)||!s.decisions.every(x=>Number.isFinite(x)&&x>=0&&x<=3)||!Array.isArray(s.grades)||!s.grades.every(x=>Number.isFinite(x)&&x>=0&&x<=100))return false;
    if(s.phase==='flight'&&(!s.flight||!point(s.flight.from)||!point(s.flight.to)||!Number.isFinite(s.flight.duration)||s.flight.duration<=0||!Number.isFinite(s.flight.arc)||!resultValid(s.flight.result,s.config.teammates)||!['shot','pass','return','rollpass','rebound','defense','gather','protect','timeout','drive','screen','oppShot','oppPass','inbound','steal'].includes(s.flight.kind)||s.flight.kind==='shot'&&(!s.flight.shooter||!['player','mate'].includes(s.flight.shooter.actor))))return false;
    if(s.phase==='flight'&&s.flight.kind==='pass'&&![0,1,2].includes(s.selected))return false;
    if(s.phase==='flight'&&s.flight.kind==='rebound'&&s.flight.result.boardOwner&&(!['player','mate','opponent'].includes(s.flight.result.boardOwner)||s.flight.result.boardOwner==='mate'&&![0,1,2].includes(s.flight.result.boardIndex)||s.flight.result.boardOwner==='opponent'&&![0,1,2,3].includes(s.flight.result.boardIndex)))return false;
    if(s.release&&!['value','center','width','range','pressure','t'].every(k=>Number.isFinite(s.release[k])))return false;
    if(s.passLanes&&(!Array.isArray(s.passLanes)||s.passLanes.length!==3||!s.passLanes.every((r,i)=>r&&r.index===i&&Number.isFinite(r.clearance)&&typeof r.open==='boolean'&&point(r.to))))return false;
    if(s.ai){const a=s.ai;if(a.version!==1||!['nextThink','cutUntil','nextCut','pickUntil','nextPick'].every(k=>Number.isFinite(a[k]))||![-1,0,1,2].includes(a.cutIndex)||![-1,0,1,2].includes(a.pickIndex)||!['none','approach','set','roll'].includes(a.pickPhase)||typeof a.contact!=='boolean'||typeof a.boardResolved!=='boolean'||![-1,0,1,2,3].includes(a.helpIndex)||a.pickPhase!=='none'&&(a.pickIndex<0||!point(s.pickSpot))||s.mates.length!==3||s.defenders.length!==4||![...s.mates,...s.defenders].every(x=>['vx','vy','gx','gy','speed'].every(k=>Number.isFinite(x[k]))&&jobs.includes(x.job)&&x.speed>=0&&x.speed<=250&&(x.blockUntil===undefined||Number.isFinite(x.blockUntil)&&point(x.screenPoint))))return false;}
    if(s.run&&!validRun(s))return false;
    if(s.target&&!point(s.target))return false;if(s.lastPass&&(s.lastPass.actor!=='player'||![0,1,2].includes(s.lastPass.receiver)))return false;
    return s.phase!=='done'||resultValid(s.outcome,s.config.teammates);
  }
  function restore(data){
    try{if(data?.v===2){if(!valid(data))return null;const s=copy(data);if(!s.ai)initAI(s,true);if(s.config.liveMatch&&!s.run)initRun(s,true);return valid(s)?s:null;}if(data?.v!==1||!data.config)return null;
      const s=Object.assign(create(data.config),copy(data),{v:2});s.flow=data.config.mode;s.clock=Math.max(.1,24-s.t);s.gameClock=Math.max(.1,(data.config.timeLimit||(['protect','defense'].includes(s.flow)?7:90))-s.t);
      if(s.flow==='screen'){s.owner='mate';s.carrierPos=copy(s.mates[1]);}if(s.flow==='rebound'){s.owner='loose';s.reboundAt=.8;}
      if(s.phase==='flight'){
        const f=s.flight;if(f.kind==='protectPass')f.kind='pass';
        if(f.kind==='shot'||f.kind==='gather'){const own=f.result.finisher==='player';f.shooter={...(f.shooter||s.p),actor:own?'player':'mate',index:s.selected??1};s.carrier=s.selected??1;s.owner=own?'player':'mate';if(f.kind==='shot'&&own)s.stats.attempts=1;if(!own&&s.config.mode==='pass')s.lastPass={actor:'player',receiver:s.carrier};}
      }
      if(s.phase==='done')return null;initAI(s,true);if(s.config.liveMatch)initRun(s,true);return valid(s)?s:null;
    }catch(_){return null;}
  }
  return {W,H,FULL_H,hoop,awayHoop,defenseSpot,modes,create,restore,start,pause,aim,press,step,meter,reboundWindow,lanes,valid,resultValid,canMove,project,dist,segment,copy,clamp};
});
