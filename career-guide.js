/* Read-only guidance from the same season, eligibility and role rules as the game. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.CareerGuide=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const focus={guard:['pass','handle','shot'],wing:['shot','drive','defense'],big:['rebound','body','defense']};
 function matchTraining(s,H){
  const r=s.lastReport,G=H.Growth,preferred=focus[s.player.role];
  if(!r?.league||r.league.season!==s.career.year||r.league.teamId!==s.career.teamId)return null;
  const st=r.stats,issues=[];
  if(r.minutes>0){
   if(st.turnovers>=3)issues.push({id:'handle',why:'本场 '+st.turnovers+' 次失误，下一次练控球，先把球护稳。'});
   if(st.attempts>=3&&st.made/st.attempts<.4)issues.push({id:s.player.role==='big'?'drive':'shot',why:'本场投篮 '+st.made+' / '+st.attempts+'，先练'+(s.player.role==='big'?'篮下终结':'出手时机')+'，再把命中率找回来。'});
   const boardLost=(r.records||[]).some(x=>x.execution?.mode==='rebound'&&x.execution.events?.some(e=>e.kind==='rebound'&&e.actor==='opponent')&&!x.execution.events?.some(e=>e.kind==='rebound'&&e.actor==='player'));
   if(boardLost||s.player.role==='big'&&r.minutes>=12&&st.rebounds===0)issues.push({id:'rebound',why:boardLost?'争板片段里，篮板被对手收走。下一次练卡位和起跳。':'本场出场 '+r.minutes.toFixed(1)+' 分钟，未抢到篮板。下一次重点练卡位和起跳。'});
   if(st.fouls>=3)issues.push({id:'defense',why:'本场 '+st.fouls+' 次犯规，下一次练跟防，减少失位后的扑抢。'});
   if(s.player.role==='guard'&&r.minutes>=12&&st.assists===0)issues.push({id:'pass',why:'本场还没有助攻。下一次练传球，争取把机会送到队友手里。'});
  }
  const issue=issues.find(x=>s.player.attrs[x.id]<96);
  if(issue)return {...issue,evidence:true};
  const id=[...preferred].sort((a,b)=>s.player.attrs[a]-s.player.attrs[b]).concat(G.keys).find(k=>s.player.attrs[k]<96);
  if(!id)return {id:null,why:'各项能力已达上限，保持状态，准备下一场。',evidence:false};
  return {id,why:r.minutes===0?'本场未出场。先练'+H.attrs[id]+'，继续争取轮换机会。':issues.length?'本场需要打磨的专项已练满，下一次补强'+H.attrs[id]+'，再到球场检验。':'这场没有明显短板，下一次继续打磨'+H.attrs[id]+'。',evidence:false};
 }
 function matchFeedback(s,H){
  const r=s.lastReport,g=r.growthReward,recommendation=matchTraining(s,H),G=H.Growth,q={...s,stage:'home'};
  const spent=Number.isFinite(r.energySpent)&&r.energySpent>=0?r.energySpent:null;
  const energyBefore=s.stage==='result'&&spent!==null&&s.energy+spent<=100?s.energy+spent:null;
  const reward=g?g.total:r.league.official?null:0;
  let rewardNote=g?'表现 '+g.base+' 点 · 职责 '+g.bonus+' 点':r.league.official?'旧记录未保存本场奖励':'本次不发放训练点';
  if(g?.development&&r.minutes===0)rewardNote='本场未出场，已有奖励进度保留';
  else if(g?.development)rewardNote=(g.total===0?'本场未兑换整点。':'')+'表现累计 '+Math.floor(g.development.baseCarry/g.development.rate[1]*100)+'% · 职责累计 '+Math.floor(g.development.bonusCarry/g.development.rate[1]*100)+'%';
  const opportunity=!r.league.official&&r.league.kind!=='assessment',ended=r.league.official&&s.career.phase==='offseason'&&!!s.career.summary;
  const recover=s.energy<60&&G.preview(q,'rest').available,target=recover?'rest':recommendation?.id;
  const canTrain=target&&G.preview(q,target).available;
  const action={type:'home',label:ended?'查看赛季总结':opportunity?'回到球队，查看机会':recover?'回到球队，先恢复':canTrain?'回到球队，练'+H.attrs[target]:'回到球队，安排下一场',target:!opportunity&&!ended&&canTrain?target:null};
  const note=ended?'这一季已结束，回到球队查看收官与下季安排。':opportunity?'本次考核已记录，先查看球队机会。':recover?'精力偏低，先恢复，再安排专项。':s.growth.used>=2?'本周安排已用完，先完成赛程；下周优先练这项。':target&&!canTrain?G.preview(q,target).reason+'；先回到球队安排下一步。':'回队后还可安排 '+(2-s.growth.used)+' 次训练。';
  return {recommendation,reward,rewardNote,tpBefore:g&&s.stage==='result'&&s.growth.tp>=g.total?s.growth.tp-g.total:null,tpAfter:s.growth.tp,energyBefore,energyAfter:s.energy,spent,action,note,roleFrom:g?G.roles[g.oldRole].name:null,roleTo:g?G.roles[g.newRole].name:G.role(s).name};
 }
 function seasonTraining(s,H){
  const a=s.career?.summary;if(!a)return [];
  const G=H.Growth,p=a.player,st=p.stats,apps=p.apps,minutes=apps?p.seconds/60/apps:0,candidates=[];
  if(apps>=4&&st.turnovers/apps>=2.5)candidates.push({id:'handle',why:'本季场均 '+(st.turnovers/apps).toFixed(1)+' 次失误，下季先把球护稳。'});
  if(st.attempts>=20&&st.made/st.attempts<.4)candidates.push({id:s.player.role==='big'?'drive':'shot',why:'本季投篮命中率 '+Math.round(st.made/st.attempts*100)+'%，下季重点练'+(s.player.role==='big'?'篮下终结':'出手时机')+'。'});
  if(s.player.role==='big'&&apps>=6&&minutes>=10&&st.rebounds/apps<3)candidates.push({id:'rebound',why:'本季场均 '+(st.rebounds/apps).toFixed(1)+' 个篮板，下季重点练卡位和起跳。'});
  if(s.player.role==='guard'&&apps>=6&&minutes>=10&&st.assists/apps<2)candidates.push({id:'pass',why:'本季场均 '+(st.assists/apps).toFixed(1)+' 次助攻，下季争取更稳定地带动队友。'});
  if(apps>=6&&minutes>=10&&st.fouls/apps>=2.5)candidates.push({id:'defense',why:'本季场均 '+(st.fouls/apps).toFixed(1)+' 次犯规，下季先练防守脚步。'});
  for(const id of [...focus[s.player.role]].sort((a,b)=>s.player.attrs[a]-s.player.attrs[b]))candidates.push({id,why:apps<4?'本季出场样本较少，先补强'+H.attrs[id]+'，争取稳定轮换。':'继续补强'+H.attrs[id]+'，让下季的拿手本领更稳。'});
  for(const id of G.keys)candidates.push({id,why:'继续补强'+H.attrs[id]+'，为下季留足准备。'});
  return candidates.filter((x,i,list)=>s.player.attrs[x.id]<96&&list.findIndex(y=>y.id===x.id)===i).slice(0,2);
 }
 function seasonFeedback(s,H){
  const c=s.career,a=c?.summary;if(!a||a.year!==c.year||c.phase!=='offseason')return null;
  const L=H.League,P=L.Path,G=H.Growth,p=a.player,apps=p.apps,st=p.stats,avg=n=>apps?n/apps:null;
  const growth=G.keys.map(id=>{const from=c.startAttrs?.[id],gain=a.gains[id];return {id,label:H.attrs[id],gain,from:Number.isFinite(from)?from:null,to:Number.isFinite(from)?from+gain:null};});
  const coreFrom=growth.every(x=>x.from!==null)?Math.round(growth.reduce((sum,x)=>sum+x.from*(G.weights[s.player.role][x.id]||0),0)):null;
  const coreTo=growth.every(x=>x.to!==null)?Math.round(growth.reduce((sum,x)=>sum+x.to*(G.weights[s.player.role][x.id]||0),0)):null;
  let finish='未进入季后赛';
  if(a.championId===a.teamId)finish='本季冠军';
  else{const rounds=[...c.postHistory,c.post].filter(Boolean).flatMap(post=>post.series.filter(sr=>[sr.a,sr.b].includes(a.teamId)).map(sr=>({post,sr})));const last=rounds.at(-1);if(last){const label=last.post.label||(last.post.series.length===1?'决赛':'季后赛第 '+(last.post.index+1)+' 轮');finish=last.post.series.length===1&&last.sr.winner!==a.teamId?'本季亚军':'止步'+label;}}
  const e=L.eligibility(s),international=P.eligibility(s),sample=e.sample,routes=[];
  const route=(id,title,ready,limits,note)=>routes.push({id,title,ready,checks:limits.map(([label,value,target,op='≥'])=>({label,value:Number.isFinite(value)?Math.floor(value*10+1e-8)/10:0,target,op,met:op==='≤'?value<=target:value>=target})),note});
  if(c.tier==='school'&&e.age<18)route('youth','青年队 / 海外青年试训',e.youth,[['下季年龄',e.age,17,'≤'],['有效出场',sample.apps,6],['出场分钟',sample.minutes,60],['位置综合',sample.core,60],['本季均评',sample.average,60]],'先争取青年队席位，成年后再积累职业联赛机会。');
  else if(c.tier==='school')route('development','成年发展赛事',true,[['下季年龄',e.age,18]],'先到成年发展赛事比赛，再争取 CBA 或海外球队考察。');
  else if(['youth','overseasYouth','development'].includes(c.tier)){
   route('cba','CBA 试训与合同',e.cba,[['下季年龄',e.age,18],['有效出场',sample.apps,10],['出场分钟',sample.minutes,120],['位置综合',sample.core,70],['本季均评',sample.average,68],['国内关注',c.domestic,40]],'通过初筛后还需获得球队机会、完成考核并签约注册。');
   if(c.path)route('overseas','NBA G League 席位',international.overseas,[['下季年龄',e.age,18],['有效出场',sample.apps,10],['出场分钟',sample.minutes,120],['位置综合',sample.core,68],['本季均评',sample.average,65],['海外关注',c.path.scouts.overseas.attention,35]],'达到考察基线后，去球队机会里比较可签席位。');
  }
  if(['cba','overseas','development'].includes(c.tier)){
   const bar=P.standards(s);route('nba','NBA 训练营 / 选秀',!!c.path&&international.nba,[['下季年龄',e.age,19],['有效出场',sample.apps,12],['出场分钟',sample.minutes,180],['位置综合',sample.core,bar.core],['本季均评',sample.average,bar.average],['NBA 关注',c.path?.scouts.nba.attention||0,50]],c.path?'正式合同还需综合 '+bar.contractCore+'、NBA 关注 70，并通过训练营或选秀后的合同考察。':'接入海外与 NBA 生涯后可查看国际考察。');
  }
  const next=describe(s,H);
  if(c.tier==='nba')routes.push({id:'role',title:next.goal,ready:next.checks.length>0&&next.checks.every(x=>x.met),checks:next.checks.map(x=>({...x,op:x.label==='队内排序'?'≤':'≥'})),note:'继续用正式比赛争取角色与续约；下季会延续已有的 NBA 经验。'});
  const level={school:0,youth:1,overseasYouth:1,development:2,cba:3,overseas:3,nba:4};
  const higher=c.offers.filter(o=>['available','contract'].includes(o.status)&&level[o.tier]>level[c.tier]);
  const finalYear=s.player.age>=38&&!!c.path;
  return {summary:a,finish,finalYear,apps,minutes:p.seconds/60,points:avg(st.points),assists:avg(st.assists),rebounds:avg(st.rebounds),average:apps?p.average:null,shooting:st.attempts?st.made/st.attempts*100:null,growth,coreFrom,coreTo,training:finalYear?[]:seasonTraining(s,H),routes:finalYear?[]:routes,higher,pending:c.pending,next};
 }
 function training(s,H){
  const q={...s,stage:'home'},G=H.Growth,review=s.career.phase==='offseason'?seasonTraining(s,H)[0]:matchTraining(s,H),keys=focus[s.player.role];let id;
  if(s.energy<60&&G.preview(q,'rest')?.available)return {id:'rest',label:'先恢复精力',why:'先把体力找回来，下一场的脚步和出手才稳。',preview:G.preview(q,'rest')};
  id=review?.id;
  const candidates=[...new Set([id,...keys.slice().sort((a,b)=>s.player.attrs[a]-s.player.attrs[b]),...H.Growth.keys])].filter(Boolean);
  id=candidates.find(k=>G.preview(q,k)?.available);if(!id)return null;
  return {id,label:G.preview(q,id).name,why:id===review?.id?review.why:'先练好一项拿手本领，再到比赛里检验。',preview:G.preview(q,id)};
 }
 function trainingSuggestions(s,H){
  const G=H.Growth,primary=training(s,H),preferred=focus[s.player.role]||G.keys;
  if(primary?.id==='rest')return [{id:'rest',reason:'精力偏低，先恢复再上场。'}];
  const ranked=[...preferred].sort((a,b)=>s.player.attrs[a]-s.player.attrs[b]);
  const candidates=[...new Set([primary?.id,...ranked,...G.keys,'rest','tactics','study'])].filter(Boolean);
  const available=candidates.filter(id=>G.preview(s,id)?.available);
  const selected=(available.length?available:ranked.filter(id=>s.player.attrs[id]<96)).slice(0,2);
  return selected.map((id,i)=>({id,reason:id==='rest'?'补足精力，准备下一次上场。':id==='tactics'?'跑一遍配合，增加球队默契。':id==='study'?'看比赛录像，磨练专项熟练度。':i===0&&primary?.id===id&&!primary.why.startsWith('先练好')?primary.why:i===0?H.roles[s.player.role].name+' · '+G.effects[id]:H.attrs[id]+'是当前打法的重点，继续补强。'}));
 }
 function trainingSnapshot(s,H){
  if(!s?.career||!s.growth)return null;
  return {week:s.week,year:s.career.year,team:s.career.teamId,phase:s.career.phase,round:s.career.round,matches:s.matches.length,attrs:{...s.player.attrs},progress:{...s.growth.progress},needs:Object.fromEntries(H.Growth.keys.map(k=>[k,H.Growth.cost(s,s.player.attrs[k])])),practice:{...s.growth.practice},energy:s.energy,tp:s.growth.tp,used:s.growth.used,bond:s.bond,count:s.training.length};
 }
 function trainingFeedback(before,s,H){
  if(!before||s.growth.used<=before.used)return null;
  const G=H.Growth,ids=s.training.slice(before.count),changed=G.keys.filter(k=>ids.includes(k)||s.player.attrs[k]!==before.attrs[k]),cells=[];
  for(const id of changed){
   const from=before.attrs[id],to=s.player.attrs[id],gain=to-from,bank=before.progress[id]||0,left=s.growth.progress?.[id]||0;
   cells.push({label:H.attrs[id]+'能力',from:String(from),to:String(to),note:gain?'能力 +'+gain:'能力未提升',kind:gain?'gain':'neutral'});
   const advanced=from>=85||to>=85,need=to<96?G.cost(s,to):0;
   cells.push({label:H.attrs[id]+'累计进度',from:from>=85?bank+' / '+before.needs[id]:'无需累计',to:to>=96?'已达上限':advanced?left+' / '+need:'直接提升',note:gain&&advanced?'已提升 '+gain+' 级'+(need?'，剩余进度保留':''):advanced?'本次累计 +'+(left-bank):'本阶段直接增加能力',kind:advanced&&!gain&&left>bank?'gain':'neutral'});
  }
  if(!changed.length){
   if(ids.includes('tactics'))cells.push({label:'球队默契',from:String(before.bond),to:String(s.bond),note:'默契 +'+(s.bond-before.bond),kind:s.bond>before.bond?'gain':'neutral'});
   if(ids.includes('study')){const id=s.growth.plan.find(k=>G.keys.includes(k))||'defense';cells.push({label:H.attrs[id]+'熟练度',from:String(before.practice[id]||0),to:String(s.growth.practice[id]||0),note:'熟练度不直接增加属性',kind:'gain'});}
   if(!cells.length)cells.push({label:'能力',from:'',to:'保持不变',note:'恢复不增加体能属性',kind:'neutral'});
   cells.push({label:'累计进度',from:'',to:'全部保留',note:'各项能力累计进度不变',kind:'neutral'});
  }
  const energy=s.energy-before.energy,spent=before.tp-s.growth.tp;
  cells.push({label:'精力',from:String(before.energy),to:String(s.energy),note:ids.length>1&&energy?'合计 '+(energy>0?'+':'')+energy:energy>0?'恢复 +'+energy:energy<0?'消耗 '+(-energy):'精力不变',kind:energy>0?'gain':energy<0?'cost':'neutral'});
  cells.push({label:'训练点',from:String(before.tp),to:String(s.growth.tp),note:spent?'本次花费 '+spent+' 点':'未消耗训练点',kind:spent?'cost':'neutral'});
  const next=describe(s,H),action={...next.action};
  if(action.type==='train')action.label=action.value==='rest'?'恢复精力':'继续练'+H.attrs[action.value];
  return {title:ids.length===1&&ids[0]==='rest'?'恢复完成':'训练完成',projects:ids.map(id=>G.preview(s,id).name).join(' · '),cells,used:s.growth.used-before.used,left:2-s.growth.used,next:{title:next.title,detail:next.detail,action}};
 }
 function describe(s,H){
  if(!s?.career||!s.growth||s.career.phase==='retired')return null;
  const L=H.League,c=s.career,G=H.Growth,P=L.Path,a=L.samples(s),r=G.role(s),f=L.describe(s),t=training(s,H),checks=[];
  const add=(label,value,target)=>checks.push({label,value,target,met:value+1e-8>=target});
  const tierNames={school:'校队',youth:'青年联赛',overseasYouth:'海外青年队',development:'国内发展赛事',cba:'CBA',overseas:'NBA G League',nba:'NBA'};
  const step=c.tier==='school'?0:['youth','overseasYouth','development'].includes(c.tier)?1:c.tier==='nba'?3:2;
  let goal,reason;
  if(c.tier==='nba'){
   if(r.index<4){const p=r.progress;goal='从'+r.name+'争取'+G.roles[p.next].name;reason='先达到各项要求，再通过后续正式出场积累晋升评价。训练营不替代联赛积累。';add('NBA 经验',p.apps,p.bar.apps);add('本队有效出场',p.localApps,Math.min(p.bar.window,Math.ceil(p.bar.apps*p.scale)));add('位置综合',a.core,p.bar.core);add('近期均评',Number(p.average.toFixed(1)),p.bar.average);add('教练信任',s.trust,p.bar.trust);checks.push({label:'队内排序',value:p.rank+1,target:p.bar.rank+1,met:p.rank<=p.bar.rank});add('精力',s.energy,40);add('晋升积累',p.streak,p.bar.streak);}
   else {goal='守住核心位置，冲击季后赛';reason='保持状态、完成赛程，再为球队争取更远的一轮。';add('续约出场',a.apps,10);add('位置综合',a.core,80);add('赛季均评',Number(a.average.toFixed(1)),65);}
  }else if(c.tier==='school'){
   if(s.player.age+1>=18){goal='完成校园赛季，进入成年发展赛事';reason='下季已到成年年龄，先打完这一季，再选择成年球队。';add('常规赛进度',c.round,c.schedule.length);}
   else {goal='争取青年队试训';reason='把校队比赛打稳，赛季结束后看青年队和海外青年队的机会。';add('有效出场',a.apps,6);add('出场分钟',Math.floor(a.minutes),60);add('位置综合',a.core,60);add('赛季均评',Number(a.average.toFixed(1)),60);}
  }else if(['youth','overseasYouth'].includes(c.tier)){
   const overseas=c.tier==='overseasYouth';goal=overseas?'争取海外职业球队席位':'争取 CBA 试训与合同';reason='成年后才能签职业合同。这里跟进'+(overseas?'海外':'国内')+'考察标准，其他方向的邀请也会保留在球队机会里。';add('下季年龄',s.player.age+1,18);add('有效出场',a.apps,10);add('出场分钟',Math.floor(a.minutes),120);add('位置综合',a.core,overseas?68:70);add('赛季均评',Number(a.average.toFixed(1)),overseas?65:68);add(overseas?'海外关注':'国内关注',overseas?(c.path?.scouts.overseas.attention||0):c.domestic,overseas?35:40);
  }else {const bar=P.standards(s);goal='争取 NBA 训练营或选秀';reason='先在'+tierNames[c.tier]+'打出稳定表现，休赛期再争取 NBA 的考察机会。';add('下季年龄',s.player.age+1,19);add('有效出场',a.apps,12);add('出场分钟',Math.floor(a.minutes),180);add('位置综合',a.core,bar.core);add('赛季均评',Number(a.average.toFixed(1)),bar.average);add('NBA 关注',c.path?.scouts.nba.attention||0,50);}
  let title,detail,action;
  const set=(name,text,type,label,extra={})=>{title=name;detail=text;action={type,label,...extra};};
  if(s.stage==='match')set('先打完眼前这一场','关键机会会直接上场，投丢也能争板、退防，继续参与比赛。','continue','回到当前比赛');
  else if(s.stage==='result'&&s.lastReport?.league?.trialPassed)set('考核通过，下一步查看球队机会','本次考核已记录。回到球队查看可签合同，签约后再完成下季注册。','home','回到球队，查看机会');
  else if(s.stage==='result')set(t?.id==='rest'?'下一场前，先恢复':t?'下一步，练'+H.attrs[t.id]:'下一步，准备下一场',t?.why||'这场表现已记入赛季，回到球队继续安排。','home','回到训练与下一场');
  else if(c.pending)set('合同已签，下一步完成注册',L.configs[c.pending.tier].name+'的新合同在下一赛季生效。注册后开始新的赛程。','new-season','注册并进入新赛季');
  else if(c.phase==='offseason'){
   const d=c.path?.draft,offers=c.offers.filter(o=>o.status==='available'||o.status==='contract');
   if(s.player.age>=38&&c.path)set('本季结束，整理生涯记录','完成剩余日历，留下你的球队履历、荣誉和数据。','retire-player','查看退役结算');
   else if(s.week<c.seasonStart+40)set('推进休赛期，等待球队窗口','第 41 周开放试训和签约；现在可以训练，也可以推进日历恢复。','calendar','推进休赛期');
   else if(d?.status==='registered'&&!d.combine)set('已报名，接下来参加联合试训','用一次实操考核补上选秀评价，再决定开始选秀或撤回。','draft-combine','参加联合试训');
   else if(d?.status==='registered')set('试训已完成，下一步决定选秀','本届评价已记录，可以开始选秀；也可以到选秀页撤回报名。','guide-panel','查看选秀决定',{focus:'draft'});
   else if(offers.length)set('球队机会已到，决定下一站','可以比较球队角色、薪酬和试训要求；签约后还要进入新赛季注册。','guide-panel','查看试训与合同',{focus:'offers'});
   else if(c.path&&c.tier!=='nba'&&P.eligibility(s).nba&&!c.path.draftHistory.some(x=>x.status==='selected')&&(!d||['none','withdrawn'].includes(d.status)))set('达到报名条件，决定是否参加选秀','报名后可参加联合试训；已有合同继续保留。','guide-panel','查看选秀报名',{focus:'draft'});
   else set('本季已结束，准备下一季',c.contract.end>=c.year+1?'现有合同继续有效，可以留队开始新赛季。':'本次没有可签的合同。可以继续训练；进入下季时，未成年保留适龄赛事，成年球员进入国内发展赛事。','new-season','准备下一赛季');
  }else if(!f)set(c.post?.byes?.includes(c.teamId)?'本轮轮空，先完成其他比赛':'本队赛程已结束，查看赛季收官','其他球队打完这一轮，才会生成后续对阵或进入休赛期。','skip-playoffs','推进季后赛');
  else if(s.energy<60&&t?.id==='rest')set('先恢复，再准备出场',`精力 ${s.energy} → ${t.preview.afterEnergy}，使用一次本周安排。`,'train','休息恢复',{value:'rest'});
  else if(f.minutes===0&&(!c.assessmentWeek||s.week-c.assessmentWeek>=4))set('暂未进轮换，争取队内考核','打一次队内实操，让教练重新评估；也可继续训练和跟随正式比赛。','assessment','参加队内考核');
  else if(t&&t.id!=='rest'&&c.phase==='regular')set('赛前先练一项，带到下一场',`${t.label}：${t.preview.gain?H.attrs[t.id]+' +'+t.preview.gain:t.preview.advanced?'练后累计 '+t.preview.progress+' / '+t.preview.need:''}，花费 ${t.preview.spent} 点，精力 ${s.energy} → ${t.preview.afterEnergy}。${t.why}`,'train',t.label,{value:t.id});
  else if(f.week>s.week)set('训练安排告一段落，推进到比赛周','先预览这段日历的恢复和训练，再去打下一场。','calendar','推进至比赛周');
  else set(f.phase==='playoffs'?'下一步，打好这场淘汰赛':'下一步，上场检验训练',`${f.opponent}在等你。${f.minutes?'预计出场 '+f.minutes+' 分钟；'+G.duty(s).label+'。'+(s.energy<60?'本周安排已用完，先控制消耗，下周优先恢复。':''):'本场暂未进轮换，先在场边跟随战报，继续积累训练。'}`,'weekly','进入下一场比赛');
  const note=c.pending?'这份合同已签妥，进入下一季后完成注册。':c.tier==='nba'?'角色由正式比赛中的持续表现逐步调整，不需要为晋升重新签约。':'达到考察条件后仍需获得邀请、通过考核并签约注册。';
  return {note,stage:tierNames[c.tier],step,goal,reason,checks,title,detail,action,training:t,duty:G.duty(s).label,fixture:f};
 }
 return {describe,training,trainingSuggestions,trainingSnapshot,trainingFeedback,matchTraining,matchFeedback,seasonTraining,seasonFeedback};
});
