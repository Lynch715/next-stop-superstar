/* Read-only guidance from the same season, eligibility and role rules as the game. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.CareerGuide=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const focus={guard:['pass','handle','shot'],wing:['shot','drive','defense'],big:['rebound','body','defense']};
 function training(s,H){
  const q={...s,stage:'home'},G=H.Growth,r=s.lastReport,keys=focus[s.player.role];let id;
  if(s.energy<60&&G.preview(q,'rest')?.available)return {id:'rest',label:'先恢复精力',why:'先把体力找回来，下一场的脚步和出手才稳。',preview:G.preview(q,'rest')};
  if(r?.league?.season===s.career.year&&r.league.teamId===s.career.teamId){if(r.stats.turnovers>=3)id='handle';else if(r.stats.attempts>=3&&r.stats.made/r.stats.attempts<.4)id=s.player.role==='big'?'drive':'shot';}
  const candidates=[...new Set([id,...keys.slice().sort((a,b)=>s.player.attrs[a]-s.player.attrs[b]),...H.Growth.keys])].filter(Boolean);
  id=candidates.find(k=>G.preview(q,k)?.available);if(!id)return null;
  return {id,label:G.preview(q,id).name,why:id==='handle'&&r?.stats.turnovers>=3?'上一场失误偏多，先把球护稳。':id==='shot'&&r?.stats.attempts>=3&&r.stats.made/r.stats.attempts<.4?'上一场出手不够稳，下一场把时机找回来。':'先练好一项拿手本领，再到比赛里检验。',preview:G.preview(q,id)};
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
  else if(t&&t.id!=='rest'&&c.phase==='regular')set('赛前先练一项，带到下一场',`${t.label}：${t.preview.gain?H.attrs[t.id]+' +'+t.preview.gain:t.preview.advanced?'进阶累计 '+t.preview.progress+' / '+t.preview.need:''}，花费 ${t.preview.spent} 点，精力 ${s.energy} → ${t.preview.afterEnergy}。${t.why}`,'train',t.label,{value:t.id});
  else if(f.week>s.week)set('训练安排告一段落，推进到比赛周','先预览这段日历的恢复和训练，再去打下一场。','calendar','推进至比赛周');
  else set(f.phase==='playoffs'?'下一步，打好这场淘汰赛':'下一步，上场检验训练',`${f.opponent}在等你。${f.minutes?'预计出场 '+f.minutes+' 分钟；'+G.duty(s).label+'。'+(s.energy<60?'本周安排已用完，先控制消耗，下周优先恢复。':''):'本场暂未进轮换，先在场边跟随战报，继续积累训练。'}`,'weekly','进入下一场比赛');
  const note=c.pending?'这份合同已签妥，进入下一季后完成注册。':c.tier==='nba'?'角色由正式比赛中的持续表现逐步调整，不需要为晋升重新签约。':'达到考察条件后仍需获得邀请、通过考核并签约注册。';
  return {note,stage:tierNames[c.tier],step,goal,reason,checks,title,detail,action,training:t,duty:G.duty(s).label,fixture:f};
 }
 return {describe,training};
});
