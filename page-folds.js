/* Fold long panels without touching player saves or hiding primary training controls. */
(function(root){
 'use strict';const memory=new Map(),prefix='next-stop-folds:';
 const config={
  '东部排名':['standings',true],'西部排名':['standings',true],'联赛排名':['standings',true],
  '季后赛与附加赛':['playoffs',false],'完整赛程与全联赛赛果':['schedule',false],'个人数据榜':['leaders',false],'生涯赛季记录':['archives',false],
  '球探报告':['scouts',true],'当前合同与注册':['contract',true],'职业初筛':['screening',false],'NBA 生涯与续约':['nba-career',false],
  'NBA 选秀与联合试训':['draft',false],'本次休赛期机会':['offers',true],'专业支持':['support',false],'招牌特技':['perks',false],'位置竞争':['competition',false],'职业资源':['resources',false]
 };
 function read(key,fallback){if(memory.has(key))return memory.get(key);try{const v=sessionStorage.getItem(prefix+key);if(v!==null)return v==='1';}catch(_){}return fallback;}
 function store(key,open){memory.set(key,open);try{sessionStorage.setItem(prefix+key,open?'1':'0');}catch(_){}}
 function remember(container){container?.querySelectorAll('details[data-fold-key]').forEach(d=>store(d.dataset.foldKey,d.open));}
 function bind(d,key,open){d.dataset.foldKey=key;d.open=read(key,open);d.addEventListener('toggle',()=>{if(d.isConnected)store(key,d.open);});}
 function enhance(container,view,state){
  if(!container||!['career','season','opportunities','team','album'].includes(view)||view==='career'&&state?.stage!=='home')return;
  container.querySelectorAll('section.card,.home-aside>.card').forEach(panel=>{
   if(panel.closest('details'))return;
   const title=panel.querySelector('h2,h3'),entry=title&&config[title.textContent.trim()];if(!entry)return;
   const wrapper=title.parentElement.classList.contains('section-title')?title.parentElement:title;
   const d=document.createElement('details'),summary=document.createElement('summary'),body=document.createElement('div');
   d.className=panel.className+' fold-card';body.className='fold-body';summary.append(wrapper);while(panel.firstChild)body.append(panel.firstChild);d.append(summary,body);panel.replaceWith(d);
   bind(d,view+':'+entry[0],entry[0]==='playoffs'?state?.career?.phase!=='regular':entry[1]);
  });
  // The team record title and table are siblings in older layouts.
  container.querySelectorAll('.section-title').forEach(heading=>{if(heading.querySelector('h2')?.textContent.trim()!=='比赛记录')return;const table=heading.nextElementSibling;if(!table?.classList.contains('table-wrap'))return;const d=document.createElement('details'),summary=document.createElement('summary'),body=document.createElement('div');d.className='card fold-card';body.className='fold-body';heading.replaceWith(d);summary.append(heading);body.append(table);d.append(summary,body);bind(d,view+':match-history',false);});
  container.querySelectorAll('details:not([data-fold-key])').forEach((d,i)=>{const title=d.querySelector(':scope>summary')?.textContent.trim();if(title)bind(d,d.dataset.trainingFold?view+':training:'+(d.dataset.trainingContext||'group')+':'+d.dataset.trainingFold:d.dataset.seasonRecord?view+':season-record:'+d.dataset.seasonRecord:d.dataset.offerRecord?view+':offer:'+d.dataset.offerRecord:d.dataset.profileRecord?view+':profile:'+d.dataset.profileRecord:view+':native:'+title.slice(0,120),d.open);});
 }
 root.PageFolds={enhance,remember};
})(typeof globalThis!=='undefined'?globalThis:this);
