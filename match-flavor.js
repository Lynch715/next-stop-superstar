/* Contextual opportunities and factual commentary; never changes the score or growth ledger. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HoopsMatchFlavor=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const catalog={
  transition:{tag:'转换机会',title:'前场有空当，跟上这一波。',text:'队友把球往前送，两侧有人快下。你接球推进，退防球员正在向篮下收缩。',tip:'看清追防的位置，再决定自己终结还是分球。',label:'接管这次快攻',hint:'推进、分球或上篮',skill:'drive',type:'drive',fastbreak:true},
  jumper:{tag:'接球出手',title:'接应点有空间，稳住这次出手。',text:'球转到你这一侧，队友拉开接应。你可以调整脚步投篮，也能趁防守靠近时把球送出去。',tip:'没把握就多传一次，投丢后仍能跟进争板。',label:'接球寻找出手机会',hint:'投篮、转移球与跟进争板',skill:'shot',type:'shot',points:3},
  attack:{tag:'突破分球',title:'向篮下施压，看看协防怎么选。',text:'你在侧翼持球，队友分布在外线和篮下。用变向寻找突破路线，逼防守作出选择。',tip:'协防过来时，接应的队友也可能得到机会。',label:'持球打开局面',hint:'变向、终结或突破分球',skill:'drive',type:'drive'},
  connect:{tag:'组织进攻',title:'把球送到队友最舒服的位置。',text:'队友一边空切，一边拉开接应。你在外线控球，先找到传球角度，再决定这一攻怎么打。',tip:'路线被封就继续移动，别急着把球塞过去。',label:'组织这次进攻',hint:'观察跑位、传球与自己出手',skill:'pass',type:'assist'},
  pick:{tag:'挡拆组织',title:'叫一个掩护，带着防守作选择。',text:'你在弧顶持球，队友准备上提。叫出掩护后，观察顺下与外线接应，防守退开时也能自己投。',tip:'掩护到位再启动，留意回追和协防。',label:'发起挡拆配合',hint:'呼叫掩护、突破与出球',skill:'pass',type:'assist'},
  screen:{tag:'掩护顺下',title:'帮队友挡住追防，再向篮下走。',text:'持球队友在侧翼等你。进入掩护位置，站稳身体，再顺下接球完成这次配合。',tip:'掩护后别站着看，顺下或接应都能帮上忙。',label:'为队友搭好掩护',hint:'站稳掩护、顺下与接球终结',skill:'body',type:'screen'},
  board:{tag:'二次进攻',title:'篮下还有一次机会。',text:'投篮弹了出来，你和防守人一起靠近落点。先抢住位置，把活球变成球队的新机会。',tip:'抢到后可以补篮，也可以稳下来传回外线。',label:'冲抢这个篮板',hint:'卡位、起跳与补篮分球',skill:'rebound',type:'rebound'},
  contain:{tag:'守住突破',title:'把这次突破挡在身前。',text:'对方持球试探，你需要留在人与篮筐之间。跟住脚步，逼他在干扰下处理球。',tip:'先跟住人，等球暴露出来再伸手。',label:'上场守住这一攻',hint:'跟防、干扰与反击',skill:'defense',type:'defend'},
  steal:{tag:'球权争夺',title:'盯紧持球人，等他露出破绽。',text:'对手正在找突破路线。保持距离跟上去，等运球离身的一瞬间争取球权。',tip:'抢断有风险，断下后可以直接发动反击。',label:'寻找抢断时机',hint:'跟防、抢断与转换进攻',skill:'defense',type:'steal'},
  rim:{tag:'篮下防线',title:'守在通向篮筐的路上。',text:'对手持球压上来。补到合适的位置，判断他的出手，再争取封盖或防守篮板。',tip:'别提前起跳，先把防守位置站稳。',label:'保护篮下',hint:'协防、封盖与篮板',skill:'defense',type:'help'},
  safe:{tag:'稳住球权',title:'领先在手，这一球更要处理稳。',text:'对手贴上来施压，你持球寻找接应。拉开距离，护好篮球，别轻易送出反击机会。',tip:'可以护球，也可以传给接应的队友；看到好机会再出手。',label:'稳住这一攻',hint:'护球、接应与控制节奏',skill:'handle',type:'protect'},
  chaseThree:{tag:'外线追分',title:'比分落后，外线这一球很关键。',text:'球队需要追分，队友把球交到你手里。寻找三分线外的出手空间，防守扑近时也可以转移球。',tip:'三分线外出手才计三分，别被追分压力逼成强投。',label:'寻找外线出手',hint:'拉开空间、三分与分球',skill:'shot',type:'shot',points:3},
  level:{tag:'咬住比分',title:'分差不大，把眼前这一攻打好。',text:'比赛进入后段，你持球面对防守。可以突破到篮下，也可以把球分给跑出机会的队友。',tip:'先争取一次好出手，失手后继续争板和退防。',label:'处理这次关键进攻',hint:'突破、分球与篮下终结',skill:'drive',type:'drive'},
  stop:{tag:'关键防守',title:'比分咬得紧，守住这一球。',text:'对手掌握球权，下一次防守可能改变局面。先落位跟防，再寻找干扰和争板的机会。',tip:'守成后比赛还在继续，拿回球权就向前推进。',label:'守住关键一攻',hint:'稳守、干扰与反击',skill:'defense',type:'defend'}
 };
 const hash=text=>{let h=2166136261;for(const c of String(text)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
 const key=s=>`${s.seed}|${s.week}|${s.player.role}|${s.match.league?.id||s.match.kind}`;
 const choose=(list,seed)=>list[seed%list.length];
 function schedule(s,total){const n=hash(key(s));return [.13+(n%140)/1000,.43+((n>>>8)%160)/1000,.90+((n>>>16)%70)/1000].map(x=>Math.min(total-22,Math.floor(total*x)));}
 function select(s){
  const m=s.match,h=m.highlights,a=s.player.attrs,r=s.player.role,gap=m.score[0]-m.score[1],late=h.elapsed>=h.total*.85,previous=h.moments.filter(Boolean).map(x=>catalog[x].type),last=previous.at(-1),used=new Set(h.moments),weights={};
  for(const [id,c] of Object.entries(catalog)){
   let w=8+Math.max(0,a[c.skill]-35)*.55;
   if(r==='guard'&&['connect','pick','steal','safe'].includes(id))w*=1.7;
   if(r==='wing'&&['attack','jumper','transition'].includes(id))w*=1.7;
   if(r==='big'&&['board','screen','rim'].includes(id))w*=2;
   if(a[c.skill]<45)w*=.45;
   if((m.league?.opposition||m.competition?.opposition||1)>1.12&&['connect','pick','screen'].includes(id))w*=1.35;
   if(s.energy<40&&['attack','transition','steal'].includes(id))w*=.45;
   if(s.energy<40&&['connect','screen','safe'].includes(id))w*=1.5;
   if(m.stats.turnovers>=2&&['safe','connect'].includes(id))w*=1.6;
   if(m.stats.attempts>=3&&m.stats.made*3<m.stats.attempts&&['board','pick','connect'].includes(id))w*=1.6;
   if(m.stats.fouls>=3&&['steal','rim'].includes(id))w*=.3;
   if(id==='safe')w*=late&&gap>0?5:0;
   if(id==='chaseThree')w*=late&&gap<=-3?6:0;
   if(id==='level')w*=late&&gap>=-2&&gap<=0?4:0;
   if(id==='stop')w*=late&&Math.abs(gap)<=5?4:0;
   if(id==='board'&&h.lastSpan?.misses>0)w*=1.5;
   if(id==='transition'&&h.lastSpan?.steals>0)w*=2;
   if(used.has(id))w=0;else if(c.type===last)w*=.08;
   weights[id]=w;
  }
  const total=Object.values(weights).reduce((a,b)=>a+b,0);let ticket=hash(key(s)+'|moment|'+m.turn+'|'+h.elapsed+'|'+m.score.join(':'))/4294967296*total;
  for(const [id,w] of Object.entries(weights))if((ticket-=w)<0)return id;
  return 'connect';
 }
 function scene(id){const c=catalog[id];return {tag:c.tag,title:c.title,text:c.text,tip:c.tip,options:[{title:c.label,hint:c.hint+' · 约 20 秒',skill:c.skill,q:3,team:c.type==='assist'||c.type==='screen'?4:3,p:.7,type:c.type,val:c.points||2}]};}
 function broadcast(s,before,delta,segment,final){
  const m=s.match,h=m.highlights,d=m.league,n=hash(key(s)+'|report|'+h.elapsed),gap=m.score[0]-m.score[1],oldGap=before[0]-before[1],swing=delta[0]-delta[1],parts=[];
  const line=gap===0?['两队回到同一起跑线，下一次攻防都很要紧。','比分再次打平，谁也没能把对方甩开。']:gap>0&&oldGap<0?['这一段攻防把比分翻了过来，球队取得领先。']:gap<0&&oldGap>0?['对手反超了比分，球队需要稳住下一次攻防。']:delta[0]===0&&delta[1]>0?['这一段进攻没能得分，对手趁机把握住机会。','球队的进攻暂时停了下来，防守端还得继续顶住。']:swing>=6?['球队连续拿分，这一波打出了气势。','进攻端找回节奏，这一段明显占了上风。']:swing<=-6?['对手打出一波攻势，场边在提醒大家尽快落位。','这一段被对手压住了，球队要先把球处理稳。']:Math.abs(gap)<=5?['比分咬得很紧，双方都在争取下一次好机会。','场上仍是拉锯，每一次球权都很关键。','两边还在纠缠，分差没有拉开。','场上难分高下，下一球仍有悬念。','胜负还悬着，攻防两端都不能松。']:gap>0?['球队保持领先，还在耐心寻找出手。','优势还在手里，场上继续一攻一防地争。','球队没有交出领先，接下来要控制好节奏。','比分暂时占优，下一次回防仍不能松。']:['球队仍在追分，接应和出球都要更及时。','分差还在，球队努力把下一次攻防打好。','球队还没追上，眼下要把每次球权用好。','追分还得耐心，场上正在寻找更好的配合。','比分仍然落后，先把接下来的防守站稳。'];
  const fresh=line.filter(text=>!h.feed.slice(-5).some(entry=>entry.text.startsWith(text)));
  const fallback=line.filter(text=>!h.feed.at(-1)?.text.startsWith(text));
  parts.push(choose(fresh.length?fresh:fallback.length?fallback:line,n));
  if(segment){
   const mine=segment.box[d.mine],other=segment.box[1-d.mine],me=mine.find(p=>p.player),st=me.stats,leader=mine.filter(p=>!p.player&&p.stats.points).sort((a,b)=>b.stats.points-a.stats.points)[0],visitor=other.filter(p=>p.stats.points).sort((a,b)=>b.stats.points-a.stats.points)[0];
   if(st.points)parts.push(choose([`你把握出手机会，这一段得到 ${st.points} 分，投篮 ${st.made}/${st.attempts}。`,`你这一段拿下 ${st.points} 分，${st.attempts} 次出手命中 ${st.made} 球。`],n>>>2));
   else if(st.attempts)parts.push(`你这一段 ${st.attempts} 次出手未能命中，还要继续找节奏。`);
   if(st.assists)parts.push(choose([`你送出 ${st.assists} 次助攻，让队友完成终结。`,`你找到接应的队友，记下 ${st.assists} 次助攻。`],n>>>3));
   if(st.rebounds)parts.push(`你收下 ${st.rebounds} 个篮板，为球队争得球权。`);
   if(st.steals||st.blocks)parts.push([st.steals?`你完成 ${st.steals} 次抢断`:'',st.blocks?`${st.steals?'另有':'你送出'} ${st.blocks} 次封盖`:''].filter(Boolean).join('，')+'，防守端有所贡献。');
   if(st.turnovers)parts.push(`你出现 ${st.turnovers} 次失误，这一段的球权处理还不够稳。`);
   if(leader)parts.push(choose([`${leader.name}这一段得到 ${leader.stats.points} 分。`,`${leader.name}接过得分任务，拿下 ${leader.stats.points} 分。`],n>>>4));
   if(visitor)parts.push(`对方的${visitor.name}得到 ${visitor.stats.points} 分。`);
   h.lastSpan={misses:mine.reduce((n,p)=>n+p.stats.attempts-p.stats.made,0),steals:st.steals};
  }else{h.lastSpan={misses:0,steals:0};}
  if(h.elapsed>=h.total*.85)parts.push(gap>0?`进入收尾阶段，球队领先 ${gap} 分。`:gap<0?`时间越来越少，还落后 ${-gap} 分。`:'收尾阶段依然平分，关键要看接下来的处理。');
  parts.push(`这段比分 ${delta[0]} : ${delta[1]}。`);
  if(final)parts.push(gap>0?'终场哨响，这场胜利收下了。':gap<0?'终场哨响，带着这场的问题回去再练。':'终场哨响，双方战成平局。');
  return parts.join('');
 }
 return {catalog,schedule,select,scene,broadcast};
});
