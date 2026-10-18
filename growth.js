/* Player development. Independent of the legacy weekly story. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HoopsGrowth=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const keys=['shot','drive','pass','handle','rebound','defense','body','stamina'];
  const labels={shot:'投篮',drive:'突破',pass:'传球',handle:'控球',rebound:'篮板',defense:'防守',body:'对抗',stamina:'体能'};
  const effects={shot:'投篮绿区更宽，松手更从容',drive:'突破启动更快，篮下终结更稳',pass:'出球更快，顺下接球更容易',handle:'持球脚步更快，护球更稳',rebound:'争板范围更大，起跳时机更宽',defense:'跟防更快，抢断和封盖时机更宽',body:'掩护更快站稳，卡位更有力',stamina:'疲劳时更能保持脚步和手感'};
  const weights={guard:{pass:.25,handle:.25,shot:.15,drive:.15,defense:.1,stamina:.1},wing:{shot:.25,drive:.25,defense:.2,handle:.1,body:.1,stamina:.1},big:{rebound:.25,defense:.25,body:.25,shot:.1,stamina:.1,pass:.05}};
  const perks={
    catchShoot:{name:'接球投手',attr:'shot',need:70,practice:8,text:'接球后 3 秒内，空位出手窗口扩大 12%'},
    ballHandler:{name:'控球突破',attr:'handle',need:70,practice:8,text:'持球变向启动提高 6%，正面碰撞失误距离缩小 8%'},
    playmaker:{name:'挡拆组织',attr:'pass',need:70,practice:8,text:'掩护配合中出球速度提高 12%'},
    board:{name:'篮板支柱',attr:'rebound',need:70,practice:8,text:'正确卡位后争板范围增加 8，卡位优势提高'},
    rim:{name:'禁区守护',attr:'defense',need:70,practice:8,text:'站在篮下合理防守位置时，封堵范围增加 10'},
    finisher:{name:'稳定终结',attr:'drive',need:70,practice:8,text:'篮下合理终结受到的防守干扰降低 15%'}
  };
  const roles=[{name:'待命',minutes:2},{name:'替补',minutes:6},{name:'轮换',minutes:12},{name:'首发',minutes:18},{name:'核心',minutes:22}];
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  // Carry integer numerators so dense schedules do not multiply development or lose fractions on save.
  const rates={nba:[30,82],cba:[22,38]};
  function developmentRate(r){return r.league?.official&&r.league.format===2&&rates[r.league.tier]?.[1]===r.league.regularGames?rates[r.league.tier]:null;}
  function developmentBank(s,tier){const g=s.growth;g.development||={};return g.development[tier]||={base:0,bonus:0,practice:Object.fromEntries(keys.map(k=>[k,0]))};}
  function core(s){return Math.round(Object.entries(weights[s.player.role]).reduce((n,[k,w])=>n+s.player.attrs[k]*w,0));}
  function init(s,migrated=false){
    if(s.growth)return s;
    s.growth={version:1,tp:6,used:Math.min(2,s.training.length),paidWeek:s.week,settled:[],practice:Object.fromEntries(keys.map(k=>[k,0])),unlocked:[],equipped:[],plan:[s.player.role==='big'?'rebound':s.player.role==='guard'?'handle':'shot','rest'],role:1,lastReward:null,migrated,
      roster:['陈越','余川','韩泽'].map((name,i)=>({name,core:64-i*5+(s.seed%3),form:70-i*6,trust:62-i*3}))};
    refresh(s,true);return s;
  }
  function cost(s,value){return Math.max(1,(s.career&&value>=85?(value<90?10:value<94?18:28):value<60?1:value<75?2:value<85?3:value<92?4:5)+(s.player.age<23?0:s.player.age<30?1:2)-(s.career?.support.training?1:0));}
  function preview(s,id){
    const g=s.growth;if(!g)return null;
    const energy=id==='rest'?-24:id==='tactics'?8:10;
    let gain=0,spent=0,progress=s.career?(g.progress?.[id]||0):0,need=0;
    if(keys.includes(id)){let v=s.player.attrs[id],budget=Math.min(5,g.tp);while(v<96&&(spent<budget||s.career&&v>=85&&progress>=cost(s,v))){const price=cost(s,v);if(s.career&&v>=85){const add=Math.min(budget-spent,Math.max(0,price-progress));spent+=add;progress+=add;if(progress<price)break;progress-=price;v++;gain++;}else{if(spent+price>budget)break;spent+=price;v++;gain++;}}need=v<96?cost(s,v):0;}
    const reason=s.career?.phase==='retired'?'已退役，可进入自由练习':s.stage!=='home'?'回到球队后才能安排':g.used>=2?'本周两次安排已完成':s.energy<Math.max(0,energy)?'精力不足，请先恢复':keys.includes(id)&&!gain&&!spent?(s.player.attrs[id]>=96?'能力已达上限':!s.career&&cost(s,s.player.attrs[id])>5?'单级费用已超过本次 5 点上限':'训练点不足'):id==='rest'&&s.energy===100?'精力已满':null;
    return {id,progress,need,advanced:!!s.career&&keys.includes(id)&&(s.player.attrs[id]>=85||s.player.attrs[id]+gain>=85),name:labels[id]?labels[id]+'专项':{rest:'休息恢复',tactics:'团队合练',study:'录像学习'}[id],gain,spent,energy,afterEnergy:clamp(s.energy-energy,0,100),reason,available:!reason};
  }
  function unlock(s){const g=s.growth,got=[];for(const [id,p] of Object.entries(perks))if(!g.unlocked.includes(id)&&s.player.attrs[p.attr]>=p.need&&g.practice[p.attr]>=p.practice){g.unlocked.push(id);got.push(p.name);if(g.equipped.length<2)g.equipped.push(id);}return got;}
  function train(s,id){
    if(!keys.includes(id)&&!['rest','tactics','study'].includes(id))return false;
    const p=preview(s,id);if(!p?.available)return false;const g=s.growth,beforeEnergy=s.energy;
    g.used++;g.tp-=p.spent;s.energy=p.afterEnergy;
    let text;
    if(keys.includes(id)){s.player.attrs[id]+=p.gain;if(s.career){g.progress||=Object.fromEntries(keys.map(k=>[k,0]));g.progress[id]=p.progress;}g.practice[id]++;text=`${p.name}：${p.gain?labels[id]+' +'+p.gain+'，':''}${p.advanced&&p.need?'进阶进度 '+p.progress+' / '+p.need+'，':''}花费 ${p.spent} 训练点，精力 -10。`;}
    else if(id==='rest')text='休息恢复：精力 +'+(s.energy-beforeEnergy)+'，不增加体能属性。';
    else if(id==='tactics'){const old=s.bond;s.bond=clamp(s.bond+4,0,100);text=`团队合练：默契 +${s.bond-old}，精力 -8。`;}
    else {const attr=g.plan.find(x=>keys.includes(x))||'defense';g.practice[attr]++;text=`录像学习：${labels[attr]}熟练度 +1，精力 -10；不直接增加属性。`;}
    const got=unlock(s);if(got.length)text+=' 解锁特技：'+got.join('、')+'。';
    s.training.push(id);s.lastTraining=text;s.diary.unshift({week:s.week,text});s.diary=s.diary.slice(0,30);return true;
  }
  function setPlan(s,plan){if(s.stage!=='home'||!Array.isArray(plan)||plan.length!==2||!plan.every(id=>keys.includes(id)||['rest','tactics','study'].includes(id)))return false;s.growth.plan=[...plan];return true;}
  function runPlan(s){if(s.stage!=='home')return false;let changed=false;while(s.growth.used<2){const id=s.growth.plan[s.growth.used];if(!train(s,id))break;changed=true;}return changed;}
  function equip(s,id){if(s.stage!=='home'||!s.growth.unlocked.includes(id))return false;const g=s.growth,i=g.equipped.indexOf(id);if(i>=0){g.equipped.splice(i,1);return true;}if(g.equipped.length>=2)return false;g.equipped.push(id);return true;}
  function standings(s){
    const recent=(s.career?s.matches.filter(r=>r.league?.official&&r.league.teamId===s.career.teamId&&r.minutes>0):s.matches).slice(-5),avg=recent.length?recent.reduce((n,r)=>n+r.grade,0)/recent.length:55;
    const assessed=s.career&&s.growth.assessment&&s.week-s.growth.assessment.week<=4?Math.max(avg,s.growth.assessment.grade):avg;
    const player={name:s.player.name,core:core(s),form:Math.round(assessed),trust:s.trust,energy:s.energy,player:true};
    return [player,...s.growth.roster.map(r=>({...r,energy:80}))].map(r=>({...r,score:Math.round((r.core*.5+r.form*.3+r.trust*.15+r.energy*.05)*10)/10})).sort((a,b)=>b.score-a.score||Number(b.player)-Number(a.player));
  }
  // NBA roles are earned through official samples, not repeated refreshes or camp scores.
  function nbaTarget(s){
    const g=s.growth,n=g.nbaRole,all=s.matches.filter(r=>r.league?.official&&r.league.tier==='nba'&&r.minutes>=8),local=all.filter(r=>r.league.teamId===s.career.teamId&&r.week>=(n?.joinedWeek||s.career.seasonStart));
    const scale=s.career.format===2?82/30:1,next=Math.min(4,g.role+1),bars={1:{apps:0,core:75,average:60,trust:45,rank:2,window:6,streak:1},2:{apps:6,core:80,average:68,trust:50,rank:2,window:6,streak:3},3:{apps:32,core:85,average:72,trust:65,rank:1,window:8,streak:3},4:{apps:80,core:90,average:75,trust:80,rank:0,window:12,streak:4}},bar={...bars[next],window:Math.ceil(bars[next].window*scale),streak:Math.ceil(bars[next].streak*scale)},credit=all.reduce((n,r)=>n+Math.min(1,30/(r.league.regularGames||30)),0),recent=local.slice(-bar.window),average=recent.length?recent.reduce((a,r)=>a+r.grade,0)/recent.length:0,rank=standings(s).findIndex(r=>r.player);
    const ready=credit+1e-8>=bar.apps&&recent.length>=Math.min(bar.window,Math.ceil(bar.apps*scale))&&core(s)>=bar.core&&average>=bar.average&&s.trust>=bar.trust&&rank<=bar.rank&&s.energy>=40;
    const baseKeep={2:[6,62],3:[8,66],4:[12,70]}[g.role],keep=baseKeep?[Math.ceil(baseKeep[0]*scale),baseKeep[1]]:null,held=keep?local.slice(-keep[0]):[],maintenance=keep?{window:keep[0],bar:keep[1],samples:held.length,average:held.length?held.reduce((n,r)=>n+r.grade,0)/held.length:0,warnings:n?.bad||0,limit:Math.ceil(3*scale)}:null;
    return {maintenance,next,bar,apps:Math.floor(credit+1e-8),rawApps:all.length,scale,warningLimit:Math.ceil(3*scale),localApps:local.length,average,rank,ready,streak:n?.good||0,reviewed:n?.reviewed||null};
  }
  function nbaRefresh(s,r){
    const g=s.growth,c=s.career;if(!r?.league?.official||r.league.tier!=='nba')return;
    if(!g.nbaRole||g.nbaRole.teamId!==c.teamId)g.nbaRole={teamId:c.teamId,joinedWeek:c.seasonStart,good:0,bad:0,reviewed:null,history:g.nbaRole?.history||[]};
    const n=g.nbaRole;if(c.format===2)n.format=2;if(n.reviewed===r.league.id)return;n.reviewed=r.league.id;
    if(g.role===0&&g.assessment&&s.week-g.assessment.week<=4&&g.assessment.grade>=65&&core(s)>=75&&s.energy>=40){g.role=1;n.good=n.bad=0;n.history.push({week:s.week,from:0,to:1});return;}
    if(r.minutes<8)return;const target=nbaTarget(s),held=target.maintenance,poor=r.grade<58||held&&held.samples===held.window&&held.average<held.bar;n.bad=poor?Math.min(target.warningLimit,n.bad+1):0;
    if(n.bad>=target.warningLimit&&g.role>1){const from=g.role;g.role--;n.good=n.bad=0;n.history.push({week:s.week,from,to:g.role});return;}
    if(g.role>=4)return;n.good=target.ready?n.good+1:0;
    if(n.good>=target.bar.streak){const from=g.role;g.role++;n.good=n.bad=0;n.history.push({week:s.week,from,to:g.role});}
  }
  function refresh(s,initial=false,receipt){if(s.career?.tier==='nba'){if(!initial)nbaRefresh(s,receipt);return;}const g=s.growth,rank=standings(s).findIndex(r=>r.player),avg=(s.career?s.matches.filter(r=>r.league?.official&&r.league.teamId===s.career.teamId&&r.minutes>0):s.matches).slice(-5).reduce((n,r,_,a)=>n+r.grade/a.length,0);let target=rank===0?(s.matches.length>=5&&avg>=80&&core(s)>=75?4:3):rank===1?2:rank===2?1:0;if(s.energy<40)target=Math.min(target,1);g.role=initial?clamp(target,0,2):g.role+Math.sign(target-g.role);}
  function role(s){const g=s.growth;return {...roles[g.role],index:g.role,rows:standings(s),...(s.career?.tier==='nba'?{progress:nbaTarget(s)}:{}),reason:s.career?.tier==='nba'?(s.career.format===2?'保持稳定出场和近期表现，逐步争取更多机会；留队续约会延续当前角色。':'用正式比赛争取教练信任，持续低迷会影响出场机会。'):'练好自己的优势，在比赛里争取更多上场机会。'};}
  function duty(s){return s.player.role==='big'?{stat:'rebounds',n:1,label:'抢到 1 个篮板'}:s.player.role==='guard'?{stat:'assists',n:1,label:'完成 1 次助攻'}:{stat:'made',n:1,label:'完成 1 次合理命中'};}
  function settle(s,r){
    const g=s.growth,id=r.league?'league:'+r.league.id:`${r.kind}:${r.week}`;if(r.kind!=='weekly'||r.league&&!r.league.official||g.settled.includes(id))return;
    const d=duty(s),events=r.records.flatMap(x=>x.execution?.events||[]),sim=r.parts?.simulated.stats,efficient=sim?.made>0&&sim.made/Math.max(1,sim.attempts)>=.4,met=(r.stats[d.stat]||0)>=d.n&&(s.player.role!=='wing'||efficient||events.some(e=>e.kind==='make'&&e.actor==='player')&&r.quality>=8);
    const rawBase=r.league&&r.minutes===0?0:clamp(1+Math.floor(Math.max(0,r.grade-50)/15),1,4),oldRole=g.role,rate=developmentRate(r),bank=rate?developmentBank(s,r.league.tier):null;
    const credit=(key,n)=>{if(!rate)return n;const total=bank[key]+n*rate[0],paid=Math.floor(total/rate[1]);bank[key]=total%rate[1];return paid;};
    const base=credit('base',rawBase),bonus=credit('bonus',Number(met));
    g.settled.push(id);g.tp+=base+bonus;
    const add=(k,n)=>{if(rate){const total=bank.practice[k]+n*rate[0];bank.practice[k]=total%rate[1];n=Math.floor(total/rate[1]);}g.practice[k]=Math.min(100000,g.practice[k]+n);};
    if(!r.league||r.minutes>0){add('shot',Math.min(3,r.stats.made));add('drive',Math.min(2,events.filter(e=>e.kind==='shot'&&e.actor==='player'&&e.points===2).length));add('pass',Math.min(3,r.stats.assists));add('handle',r.stats.turnovers===0?1:0);add('rebound',Math.min(3,r.stats.rebounds));add('defense',Math.min(3,r.stats.steals+r.stats.blocks));add('body',Math.min(2,events.filter(e=>e.kind==='screen'&&e.actor==='player').length));}
    const got=unlock(s);refresh(s,false,r);g.lastReward={week:r.week,base,bonus,total:base+bonus,duty:d.label,met,oldRole,newRole:g.role,unlocked:got,...(rate?{development:{tier:r.league.tier,rate:[...rate],rawBase,rawBonus:Number(met),baseCarry:bank.base,bonusCarry:bank.bonus}}:{})};r.growthReward=JSON.parse(JSON.stringify(g.lastReward));
  }
  function week(s){const g=s.growth;if(g.paidWeek>=s.week)return;g.paidWeek=s.week;g.tp++;g.used=0;s.training=[];}
  function fixture(s){const opponents=['临川中学','北辰中学','青禾中学','南港中学','明德中学'];return {opponent:opponents[(s.week-1)%opponents.length],label:'校园训练赛',minutes:role(s).minutes,venue:'江岚球场'};}
  function rewardValid(r){const d=r?.development,int=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b,scaled=d&&rates[d.tier];if(d!==undefined&&(!scaled||!Array.isArray(d.rate)||d.rate.length!==2||d.rate.some((n,i)=>n!==scaled[i])||!int(d.rawBase,0,4)||d.rawBonus!==Number(r.met)||!int(d.baseCarry,0,scaled[1]-1)||!int(d.bonusCarry,0,scaled[1]-1)||!int(r.base*scaled[1]+d.baseCarry-d.rawBase*scaled[0],0,scaled[1]-1)||!int(r.bonus*scaled[1]+d.bonusCarry-d.rawBonus*scaled[0],0,scaled[1]-1)))return false;return !!(r&&Number.isInteger(r.week)&&r.week>=1&&int(r.base,0,4)&&[0,1].includes(r.bonus)&&r.total===r.base+r.bonus&&typeof r.met==='boolean'&&(d!==undefined||r.bonus===Number(r.met))&&['抢到 1 个篮板','完成 1 次助攻','完成 1 次合理命中'].includes(r.duty)&&[r.oldRole,r.newRole].every(n=>int(n,0,4))&&Array.isArray(r.unlocked)&&r.unlocked.every(x=>Object.values(perks).some(p=>p.name===x)));}
  function valid(s){
    const g=s.growth,integer=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
    if(g?.development!==undefined&&(!g.development||Array.isArray(g.development)||Object.keys(g.development).some(t=>!rates[t])||Object.entries(g.development).some(([t,b])=>!b||!integer(b.base,0,rates[t][1]-1)||!integer(b.bonus,0,rates[t][1]-1)||!b.practice||Object.keys(b.practice).length!==keys.length||!keys.every(k=>integer(b.practice[k],0,rates[t][1]-1)))))return false;
    if(g?.progress!==undefined&&(!g.progress||Object.keys(g.progress).length!==keys.length||!keys.every(k=>integer(g.progress[k],0,99))))return false;
    if(g?.nbaRole!==undefined){const n=g.nbaRole;if(!n||!/^nba-\d+$/.test(n.teamId)||!integer(Number(n.teamId.split('-')[1]),0,29)||!integer(n.joinedWeek,1,s.week)||!integer(n.good,0,n.format===2||s.career?.format===2?11:4)||!integer(n.bad,0,n.format===2||s.career?.format===2?9:3)||(n.reviewed!==null&&typeof n.reviewed!=='string')||!Array.isArray(n.history)||n.history.length>2000||!n.history.every(x=>integer(x.week,1,s.week)&&integer(x.from,0,4)&&integer(x.to,0,4)&&Math.abs(x.from-x.to)===1))return false;}
    return !!(g&&g.version===1&&integer(g.tp,0,1000000)&&integer(g.used,0,2)&&integer(g.paidWeek,1,s.week)&&integer(g.role,0,4)&&typeof g.migrated==='boolean'&&(g.assessment===undefined||g.assessment&&integer(g.assessment.week,1,s.week)&&integer(g.assessment.grade,0,100))&&(g.lastReward===null||rewardValid(g.lastReward))&&Array.isArray(g.settled)&&g.settled.length<=s.week*2&&new Set(g.settled).size===g.settled.length&&g.settled.every(x=>(/^weekly:\d+$/.test(x)&&Number(x.split(':')[1])<=s.week||/^league:y\d+-[a-z0-9-]+$/.test(x)))&&g.practice&&keys.every(k=>integer(g.practice[k],0,100000))&&['unlocked','equipped'].every(k=>Array.isArray(g[k])&&new Set(g[k]).size===g[k].length&&g[k].every(id=>Object.hasOwn(perks,id)))&&g.equipped.length<=2&&g.equipped.every(id=>g.unlocked.includes(id))&&Array.isArray(g.plan)&&g.plan.length===2&&g.plan.every(id=>keys.includes(id)||['rest','tactics','study'].includes(id))&&Array.isArray(g.roster)&&g.roster.length===3&&g.roster.every(r=>typeof r.name==='string'&&r.name.length<=20&&['core','form','trust'].every(k=>integer(r[k],0,100))));
  }
  return {keys,labels,effects,weights,perks,roles,developmentRate,nbaTarget,core,init,cost,preview,train,unlock,setPlan,runPlan,equip,refresh,role,duty,settle,week,fixture,rewardValid,valid};
});
