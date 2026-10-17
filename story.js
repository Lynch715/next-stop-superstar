/* Campus to professional career chapters. Story choices never fabricate match statistics. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./season-two.js'):root.GreatnessSeasonTwo,typeof module==='object'&&module.exports?require('./season-three.js'):root.GreatnessSeasonThree,typeof module==='object'&&module.exports?require('./season-four.js'):root.GreatnessSeasonFour,typeof module==='object'&&module.exports?require('./season-five.js'):root.GreatnessSeasonFive,typeof module==='object'&&module.exports?require('./season-six.js'):root.GreatnessSeasonSix);if(typeof module==='object'&&module.exports)module.exports=api;else root.GreatnessStory=api;})(typeof globalThis!=='undefined'?globalThis:this,function(Second,Third,Fourth,Fifth,Sixth){
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const chapters=['第一件背心','队长的空位','铃声与哨声','把话说在场上','不只看得分','再见，临川','举起的那只手','队长也会犹豫','两张表的余白','对手递来的本子','第三次临川','灯灭之前',...Second.chapters,...Third.chapters,...Fourth.chapters,...Fifth.chapters,...Sixth.chapters];
const known=['w1-pre','w1-extra','w1-post','w2-pre','w2-extra','w2-post','w3-pre','w3-post','w4-pre','w4-post','w5-pre','w5-post','w6-pre','w6-post',...Array.from({length:6},(_,i)=>[`w${i+7}-pre`,...([8,10].includes(i+7)?[`w${i+7}-extra`]:[]),`w${i+7}-post`]).flat(),...Second.ids,...Third.ids,...Fourth.ids,...Fifth.ids,...Sixth.ids];
const cast={...Third.cast,...Fourth.cast,...Fifth.cast,...Sixth.cast,lin:{name:'林野',job:'高一后卫',letter:'林'},captain:{name:'顾言',job:'高二队长',letter:'顾'},manager:{name:'许知夏',job:'球队记录员',letter:'许'},coach:{name:'周远山',job:'校队主教练',letter:'周'},rival:{name:'周砚',job:'临川中学后卫',letter:'砚'}};
const init=week=>({version:1,startWeek:week,history:[],feedback:null});
function chosen(s,id){return s.story?.history.find(h=>h.id===id)?.index;}
const opt=(title,hint,text,effects={},goal=null)=>({title,hint,text,effects,goal});
const target=(stat,n,label,max=false)=>({stat,n,label,max});
function goal(s,week=s.week){const h=s.story?.history.find(h=>h.id===`w${week}-pre`);return h?.goal?{...h.goal}:null;}
function measured(s){const g=goal(s),r=s.lastReport;if(!g||r?.kind!=='weekly'||r.week!==s.week)return null;const value=r.stats[g.stat];return {...g,value,met:g.max?value<=g.n:value>=g.n};}
function scoreLine(s){const r=s.lastReport,team=r.competition?.teamName||'江岚';return `${r.win?team+'赢下了比赛':r.draw?'双方打成平局':team+'没能赢下比赛'}，比分 ${r.score[0]} : ${r.score[1]}。你的记录是 ${r.stats.points} 分、${r.stats.assists} 次助攻、${r.stats.rebounds} 个篮板、${r.stats.turnovers} 次失误。`;}
function lastBall(s){const events=s.lastReport.records.flatMap(r=>r.execution?.events||[]),shots=events.filter(e=>e.kind==='shot'&&e.actor==='player');if(!shots.length&&(s.lastReport.stats.attempts||s.lastReport.stats.points))return '旧记录里没有保留每次出手的球路。许知夏把已有统计摊开：「先从能确认的地方复盘，不替没记下来的那一球下结论。」';if(!shots.length)return '你没有亲自出手。许知夏把其他技术统计也摊在桌上：「没投篮，不代表没参与；参与了什么，要一件件看。」';const last=shots.at(-1),made=events.some(e=>e.t>=last.t&&e.kind==='make'&&e.actor==='player');return made?'你最后一次出手命中了。顾言没有让你只盯着那个进球：「把它之前的退防和传球也记住。」':'你最后一次出手没进。林野拿来球：「明天还在这个位置练。今天没进，不等于以后都不敢投。」';}
function reportAt(s,week){return s.matches.find(r=>r.week===week&&r.kind==='weekly')||null;}
function promiseLine(s,week){const g=goal(s,week),r=reportAt(s,week);if(!g||!r)return `第 ${week} 周没有留下完整的赛前约定记录。你们把能确认的比赛记录摊开，决定从这里接着练。`;const v=r.stats[g.stat],met=g.max?v<=g.n:v>=g.n;return `第 ${week} 周，你约定「${g.label}」，实际记录是 ${v}，${met?'这件事做到了':'那次还没做到'}。林野没有把这一页撕掉：「今天还要接着打。」`;}
function linThread(s){const i=chosen(s,'w2-extra');return i===0?'林野举起左手。你认出了第二周一起约定的接应信号。他问：「如果我急了，你还会这样提醒我吗？」':i===1?'林野还记得第二周你先说自己跑早的那一次：「你先承认自己的问题，我才敢把传晚的那次说出来。」':i===2?'林野把战术板上的几处箭头擦掉：「队长那次带我们慢速走过。现在能不能自己走明白，不总等他来救？」':'你们没有留下第二周沟通方式的记录。林野没有假装你一定记得某个暗号，而是重新把手举给你看：「从现在约，也来得及。」';}
function captainThread(s){const i=chosen(s,'w4-pre');return i===0?'你记得第四周曾叫大家拉开，给持球人留出口。顾言把那支笔递过来：「这次我也在场上，你照样可以叫我的名字。」':i===1?'第四周你先喊过投篮后卡位。顾言指着那张站位图：「你能提醒大家争一次球，也能提醒我漏掉的位置。」':i===2?'顾言记得你第四周喊过「有人接、有人留、丢球先回」：「简单的话，不一定非得由队长说。」':'你们没有留下第四周的站位约定。顾言把战术板摆到两个人中间：「不补一段没说过的话。今天，先说清楚这一组。」';}
function rivalLine(s,until=s.week-1){const rs=s.matches.filter(r=>r.kind==='weekly'&&r.opponent==='临川中学'&&r.week<=until).sort((a,b)=>a.week-b.week);if(!rs.length)return '记录本里还没有你对临川的完整比赛。周砚没有替这段空白编一个胜负：「那就从下一场开始记。」';return `记录本上，对临川已留下 ${rs.length} 场：${rs.map(r=>`第${r.week}周 ${r.score[0]}:${r.score[1]}（${r.win?'胜':r.draw?'平':'负'}）`).join('，')}。周砚把这一行看完：「记得比分，也别只记比分。」`;}
function seasonSummary(s){
const records=[...new Map(s.matches.filter(r=>r.kind==='weekly'&&r.week>=1&&r.week<=12).map(r=>[r.week,r])).values()].sort((a,b)=>a.week-b.week),stats={points:0,assists:0,rebounds:0,steals:0,blocks:0,turnovers:0};let wins=0,draws=0,quality=0;
for(const r of records){wins+=Number(r.win);draws+=Number(r.draw);quality+=r.grade;for(const k of Object.keys(stats))stats[k]+=r.stats[k];}
const promises=(s.story?.history||[]).filter(h=>h.goal&&h.id.endsWith('-pre')&&h.week<=12).map(h=>({h,r:records.find(r=>r.week===h.week)})).filter(x=>x.r);const achieved=promises.filter(({h,r})=>h.goal.max?r.stats[h.goal.stat]<=h.goal.n:r.stats[h.goal.stat]>=h.goal.n).length;
const shared={'w1-pre':[0],'w1-post':[0,1],'w2-extra':[0,1],'w3-post':[1],'w4-pre':[0],'w6-post':[0],'w7-pre':[0],'w7-post':[0],'w8-extra':[2],'w9-post':[1],'w10-post':[0],'w11-post':[1],'w12-pre':[0]},leading={'w2-post':[0],'w4-pre':[0,2],'w4-post':[0],'w6-post':[1],'w8-pre':[0,2],'w8-post':[0,1],'w11-pre':[2],'w11-post':[0],'w12-pre':[2]};
const count=map=>Object.entries(map).filter(([id,choices])=>choices.includes(chosen(s,id))).length,cooperation=count(shared),leadership=count(leading),average=records.length?Math.round(quality/records.length):0;
const ending=cooperation>=3&&stats.assists>=3?{key:'together',title:'并肩的名字',text:'你不只说过愿意配合，也在比赛中把机会交到了队友手里。林野把自己的名字写在你旁边，顾言没有再把所有箭头都画回自己。',reason:`${cooperation} 次配合方向的选择，赛季实际 ${stats.assists} 次助攻。`}:leadership>=2&&average>=60?{key:'voice',title:'敢接下一声',text:'你开始接住队长交来的决定，也用比赛中的判断证明自己能承担。顾言把战术板留在桌子中间，等你先叫下一次集合。',reason:`${leadership} 次承担决定的选择，已记录比赛平均评价 ${average}。`}:{key:'unfinished',title:'还没写满的那一页',text:'有的约定做到了，有的还要继续练。林野把球放回架子，顾言替本子留了一页空白。你们约好，下一季还从同一块球场出发。',reason:`已核对 ${promises.length} 项约定，完成 ${achieved} 项；其余留作下一季的练习。`};
return {played:records.length,wins,draws,losses:records.length-wins-draws,stats,average,goals:promises.length,achieved,cooperation,leadership,ending};
}
function seasonValid(x){return x&&(x.leagueAverage===undefined||Number.isInteger(x.leagueAverage)&&x.leagueAverage>=0&&x.leagueAverage<=100)&&(x.registrationWeek===undefined||Number.isInteger(x.registrationWeek)&&x.registrationWeek>=0&&x.registrationWeek<=72)&&['contractOffer','overseasSeat','contractSigned','overseasEnrolled','northAmericaInvite'].every(k=>x[k]===undefined||typeof x[k]==='boolean')&&['trialPlayed','academyPlayed','prepPlayed','selectionPlayed','exchangePlayed','reservePlayed','jointPlayed','firstPlayed','clubPlayed','cbaPlayed','u19Played','leaguePlayed','leagueWins','leagueLosses'].every(k=>x[k]===undefined||Number.isInteger(x[k])&&x[k]>=0&&x[k]<=12)&&(x.route===undefined||typeof x.route==='string'&&x.route.length<200)&&(x.core===undefined||Number.isInteger(x.core)&&x.core>=0&&x.core<=96)&&['played','wins','draws','losses','average','goals','achieved','cooperation','leadership'].every(k=>Number.isInteger(x[k])&&x[k]>=0&&x[k]<=100)&&x.played<=12&&x.wins+x.draws+x.losses===x.played&&x.achieved<=x.goals&&x.goals<=12&&x.stats&&['points','assists','rebounds','steals','blocks','turnovers'].every(k=>Number.isInteger(x.stats[k])&&x.stats[k]>=0)&&x.ending&&['together','voice','unfinished'].includes(x.ending.key)&&['title','text','reason'].every(k=>typeof x.ending[k]==='string'&&x.ending[k].length<3000);}
function sameSeasonData(a,b){return seasonValid(a)&&seasonValid(b)&&a.core===b.core&&['trialPlayed','academyPlayed','prepPlayed','selectionPlayed','exchangePlayed','reservePlayed','jointPlayed','firstPlayed','clubPlayed','route','contractOffer','overseasSeat','contractSigned','overseasEnrolled','northAmericaInvite','leagueAverage','registrationWeek','cbaPlayed','u19Played','leaguePlayed','leagueWins','leagueLosses'].every(k=>a[k]===b[k])&&['played','wins','draws','losses','average','goals','achieved','cooperation','leadership'].every(k=>a[k]===b[k])&&Object.keys(b.stats).every(k=>a.stats[k]===b.stats[k])&&a.ending.key===b.ending.key;}
function sameSeason(a,b){return sameSeasonData(a,b)&&['title','text','reason'].every(k=>a.ending[k]===b.ending[k]);}
function seasonSix(s){return s.story?.seasonSix?JSON.parse(JSON.stringify(s.story.seasonSix)):null;}
function seasonFive(s){return s.story?.seasonFive?JSON.parse(JSON.stringify(s.story.seasonFive)):null;}
function seasonFour(s){return s.story?.seasonFour?JSON.parse(JSON.stringify(s.story.seasonFour)):null;}
function seasonThree(s){return s.story?.seasonThree?JSON.parse(JSON.stringify(s.story.seasonThree)):null;}
function seasonTwo(s){return s.story?.seasonTwo?JSON.parse(JSON.stringify(s.story.seasonTwo)):null;}
function season(s){return s.story?.season?JSON.parse(JSON.stringify(s.story.season)):null;}

function sceneData(s,id){
const p=s.player,role={guard:'后卫先看清两侧，再决定球往哪里走。',wing:'侧翼不只有得分，还得知道什么时候把球交出去。',big:'内线不必每次都碰球，但要让每次卡位都有意义。'}[p.role],origin={street:'你习惯了野球场上用一球回应质疑，现在要学着把回应留在整场比赛里。',school:'你以前也有过队服，可这一次，上面的名字要重新赢得队友认可。',fresh:'第一次跟完整的校队训练，你连收球和排队的位置都在认真记。'}[p.origin];
const build=(title,place,speaker,paragraphs,options)=>({id,week:s.week,chapter:chapters[s.week-1],title,place,speaker:cast[speaker],paragraphs,options});
if(id==='w1-pre')return build('背心上的名字，还很陌生。','周一 · 器材室','coach',[
'器材室里有洗衣粉和旧木头的味道。周教练从纸箱里拿出训练背心，示意你自己挑一件合身的。林野已经穿好了，号码歪在背后，他还在低头拽衣角。',
{rotation:'「进入轮换，不等于每次都先给你球。」教练指了指战术板，「你得让这组人打得更顺。」',bench:'「先从替补练起。」教练没把箱子盖上，「坐在边线时，也要知道自己上去能做什么。」',observe:'「留队观察，也是队里的一员。」教练把背心递到你手上，「不用一天补齐所有短板，先把一件事做好。」'}[s.placement],origin,
'周五，临川中学来打友谊赛。教练没有给你定得分数，只问：「第一周，你想先让大家记住什么？」'],[
opt('先把球传到该到的人手里','本周约定：至少 1 次助攻 · 默契 +2','你把手放在战术板的弱侧。林野看了一眼：「那我跑到了，你得看见。」教练在名单旁写下一个小小的箭头。',{bond:2},target('assists',1,'至少送出 1 次助攻')),
opt('先守住每一个能争的篮板','本周约定：至少 1 个篮板 · 信任 +1','你指了指篮下。教练点头：「先找到人，再找到球。抢不到，也得把位置卡住。」林野替你拍掉背心上的灰。',{trust:1},target('rebounds',1,'至少抢到 1 个篮板')),
opt('少丢球，先把简单的球处理好','本周约定：失误不超过 1 次 · 信任 +1','「慢半拍看清楚，不是坏事。」教练把球传给你。你接稳，才发现林野已经在身旁张开了手。',{trust:1},target('turnovers',1,'失误不超过 1 次',true))]);
if(id==='w1-extra')return build('熄灯前，篮网还响着。','第一次训练后 · 露天球场','lin',[
`你刚完成「${s.training[0]&&({shooting:'投篮加练',tactics:'团队合练',strength:'力量与篮板',dribble:'运球与突破',study:'上课与复盘',rest:'休息恢复'}[s.training[0]])}」，林野又抱着球追上来。他说周五临川的后卫周砚很快。暑假在这块场上打三对三，林野那支临时队就输过他。`,
'「再练十分钟？」他伸出两根手指，又改成一根，「我给你传，你给我传。刚才有几球……我没看见你。」',
'值班老师已经开始关教学楼的灯。你的书包还在长椅上，明天第一节也不是体育课。'],[
opt('约十分钟，只练传切','默契 +3 · 体力 -3 · 不占训练次数','你们约好最后十个来回。林野第一次跑早了，第二次你传慢了。第三次球刚好从防守标志桶外侧穿过去。离开前，他把球递给你收。',{bond:3,energy:-3}),
opt('今天到这，明天提早来','体力 +3 · 默契 +1','你指了指熄灭的走廊灯，认真约了明早的时间。林野把球夹在腰间：「行，别让我一个人等。」这次，他没有再催。',{energy:3,bond:1}),
opt('坐下聊聊那场输给临川的球','默契 +2 · 记住临川后卫周砚','林野说，自己暑假那场只顾着追分，队友举了很久的手。他笑了一下：「所以我知道被晾在那边是什么感觉。只是有时又会忘。」你们把球留在脚边，听完了最后一阵风。',{bond:2})]);
if(id==='w1-post')return build('记分牌熄灭以后。','首场校园赛后 · 长椅','lin',[
scoreLine(s),s.lastReport.win?'林野用鞋底轻轻蹭着地线，想笑，又像怕显得太得意。周教练让所有人先把散在场边的球捡回来，再集合。':s.lastReport.draw?'林野盯着相同的两个数字：「再多打一分钟会怎样？」顾言把记分牌翻过去：「下次的球，留到下次打。」':'林野把毛巾盖在头上，过了一会儿才掀开：「我有几次该早点看你的。」周教练没让任何人一个人留下受罚。',
lastBall(s),'你们还不是一支成熟的球队，但今天已经有了一整场共同经历。林野问：「明天，先练哪段？」'],[
opt('一起找一次能做得更好的配合','默契 +3','你们从一次普通的传切说起，没有把责任全推给进不进。林野掏出笔，在许知夏的记录纸背面画了一条歪歪的跑位线。',{bond:3}),
opt('先向队友说声谢谢','默契 +2 · 信任 +1','你把毛巾递过去，谢过每一个回防和接应的人。顾言最后才站起来：「知道是谁替你补了位置，下次就记得替他补。」',{bond:2,trust:1}),
opt('把自己的问题写下来','信任 +2','你在本子上写下一件具体的事，没有写「以后一定赢」。教练经过时看见了：「下周我会问你，练到哪一步了。」',{trust:2})]);
if(id==='w2-pre')return build('队长把空位让给了你。','第二周 · 分组训练前','captain',[
'顾言把两组背心分好，特意站到了你的对面。高二队长没有说要考新人，只在你接球前退开了一步。',
chosen(s,'w1-pre')===0?'「上周你说先找队友。」他朝底角抬了抬下巴，「可对手让你投的时候，你敢不敢承担？」':chosen(s,'w1-pre')===1?'「上周你想先争篮板。」顾言把球弹给你，「不过拿到球以后，我们还得往前走。」':'「稳妥很好。」顾言看了一眼边线，「可稳妥不是把每个决定都留给别人。」',
role,'林野站在另一侧，等着看你怎么回答。你明白，队长想听的是下场球的打算。'],[
opt('看清机会，传给空位队友','本周约定：至少 1 次助攻 · 默契 +1','「那就让传球有方向。」顾言用手指点了两处接应点，「人真的跑到了再给。别为了助攻把球硬塞过去。」',{bond:1},target('assists',1,'至少送出 1 次助攻')),
opt('用篮板和回防争取信任','本周约定：至少 2 个篮板 · 信任 +1','顾言把自己的位置换到了外线：「这次篮下交给你。记得，投丢时两边都有人要往里面跑。」',{trust:1},target('rebounds',2,'至少抢到 2 个篮板')),
opt('先控制失误，再承担出手','本周约定：失误不超过 1 次 · 信任 +1','你没有保证每球都进。顾言这才认真贴上来：「好，那我也认真防。空位要你自己跑出来。」',{trust:1},target('turnovers',1,'失误不超过 1 次',true))]);
if(id==='w2-extra')return build('有些默契，需要说出口。','训练间歇 · 饮水机旁','lin',[
'林野连续两次把球传到你身后。第三次，你跑过去，他却又收球自己冲了进去。你们停下时，谁也没先开口。',
chosen(s,'w1-extra')===0?'他记得那晚只练十分钟的约定，低声说：「没防守的时候明明能传出来，一有人贴上来，我就急。」':chosen(s,'w1-extra')===1?'「那天你说早点休息，我还以为你嫌我烦。」林野拧了半天瓶盖，「后来想想，你是真的约了第二天。」':'「你听过我讲输给临川那场。」他把水瓶放下，「刚才又像那时候了，是吧？」',
'顾言没有替你们回答，只把下一组训练的球放在脚边。'],[
opt('约一个举手接应的信号','默契 +3','你们约好：你举起左手才表示准备接，林野拍一下球表示还要等。信号很简单，足够在最吵的时候让两个人听懂。',{bond:3}),
opt('把自己跑早的地方也说清楚','默契 +2 · 信任 +1','你先讲了自己启动太早的一次。林野接着说了传晚的那次。顾言这才把球扔回来：「既然都知道，重来。」',{bond:2,trust:1}),
opt('请队长带着慢速走一遍','信任 +2 · 体力 +2','顾言让所有人先不加速，只走站位和接球角度。你终于看见那条传球线什么时候出现，也看见它什么时候又被自己跑没了。',{trust:2,energy:2})]);
if(id==='w2-post')return build('一句“我的”，不是认输。','对青禾赛后 · 器材架旁','captain',[
scoreLine(s),s.lastReport.stats.turnovers>=2?'许知夏念到你的失误数时停了一下。你刚想解释，顾言先开口：「可以说原因。但先分清楚，哪些是你能改的。」':'许知夏把失误一栏念完。顾言点了点头：「少丢球是开始，下一步是让队友接球时更舒服。」',
chosen(s,'w2-extra')===0?'林野举了举左手，你认出了训练时约定的信号。他说，没跑出来的那几次，也要一起重看。':'林野把记录纸挪到两个人中间，没有再急着给某一球找一个人负责。',
'顾言问你愿不愿意在下一次集合时，自己说一件做得不够好的事。'],[
opt('说清一次判断，提出下一步练法','信任 +2 · 默契 +1','你讲完那次判断，也把想练的接应路线指给大家看。顾言替你接住最后一句：「下周训练，我们给你把这条线跑出来。」',{trust:2,bond:1}),
opt('请林野也说说他的视角','默契 +3','林野讲到半途才发现，你们看到的是同一球的两边。你记下他的视线被挡住的位置，他记下你等球的时间。',{bond:3}),
opt('把问题留在录像本里逐条改','信任 +1 · 体力 +2','你向大家说自己会写清楚，训练时再验证。顾言没有逼你马上多说，只提醒：「本子要带到场上，别只带回家。」',{trust:1,energy:2})]);
if(id==='w3-pre')return build('黑板上的日期，和赛程挤在一起。','第三周 · 午休教室','manager',[
'许知夏把登记表放在你的课本旁。表上除了训练安排，还多了一行月测日期。后排的林野正在用战术板垫着作业本。',
'「周教练让我记训练出勤，班主任让我记作业。」她看着两张表叹气，「我不想拿一张表去盖住另一张。」',
'你下意识想把本周加满。她指了指空着的休息栏：「真正做到的安排，比写满的安排有用。」本周对南港，教练仍然等你给出一个场上目标。'],[
opt('先排学习时间，场上专注传球','本周约定：至少 1 次助攻 · 体力 +3','你把晚上的一段时间留给作业，决定训练时把传球和观察练扎实。许知夏在表上画了两个分开的方框：「都记得去。」',{energy:3},target('assists',1,'至少送出 1 次助攻')),
opt('与林野一起安排，少做无效加练','本周约定：失误不超过 1 次 · 默契 +2','你们把重复加练划掉一项，把复盘留了下来。林野问完一道题，又指着战术板问另一道。你们约定一次只解决一个问题。',{bond:2},target('turnovers',1,'失误不超过 1 次',true)),
opt('保持训练，但把篮板基本功练细','本周约定：至少 1 个篮板 · 信任 +1','你写下具体的卡位练习，也给作业留出时间。许知夏把表推回来：「我会记你做了什么，不会替你把没做的勾上。」',{trust:1},target('rebounds',1,'至少抢到 1 个篮板'))]);
if(id==='w3-post')return build('没被记在得分栏里的事。','对南港赛后 · 校门口','manager',[
scoreLine(s),'许知夏把六个人的作业本抱在怀里，又从最上面抽出比赛记录。她说教练让大家在下一次训练前各找一件值得留下的习惯。',
chosen(s,'w3-pre')===0?'「你上周在表上留了学习时间。」她没有替你宣布成绩，「有没有照着做，你自己最清楚。下周还要这样排吗？」':chosen(s,'w3-pre')===1?'林野还记得你们划掉的那段无效加练。他问，下一次能不能把学不会的题和看不懂的防守各带一道来。':'你翻到记录本的卡位示意图。纸上的箭头不会替你完成动作，但至少让下一次训练有了起点。',
'校门外的路灯亮了。你忽然发现，成为校队的人之后，回家的路并没有变短。'],[
opt('把训练和学习安排继续写下去','体力 +3 · 信任 +1','你把下一周要完成的事写在两栏里，没有拿一边的努力替另一边交差。许知夏把记录纸折好，还给了你。',{energy:3,trust:1}),
opt('约林野一起复盘，再一起写作业','默契 +3','「先各做自己的，不会的再问。」你加了一句。林野把差点脱口而出的“借我看看”咽回去，认真点头。',{bond:3}),
opt('承认自己排得太满，先调整休息','体力 +5','你没有说自己一定能扛住。许知夏把一块空白留在表上：「空白也可以是安排。」第二天，你按时去了训练。',{energy:5})]);
if(id==='w4-pre')return build('这次，轮到你开口。','第四周 · 迎战北辰前','captain',[
'分组训练中，顾言站到边线，让你在下一组开始前叫一次站位。林野嘴上说「声音大点」，自己却先往前挪了一步。',
chosen(s,'w2-post')===0?'你想起那次自己在集合时说过的问题。现在，要把“下一步练法”说给正在等你的人听。':chosen(s,'w2-post')===1?'你记得听林野讲同一个球时，自己漏掉了多少角度。这一次，你先确认所有人都看见你。':'你摸了摸带到场边的录像本。顾言看见了：「现在把纸上的一句话喊出来。」',
'北辰的防守喜欢夹击持球人。周教练说，不需要喊一串术语，叫出一个明确的接应点就够。'],[
opt('叫队友拉开，我来找传球出口','本周约定：至少 2 次助攻 · 默契 +2','你先叫出林野的名字，再指向弱侧。顾言没有纠正你的用词，只让大家照着跑了一遍。',{bond:2},target('assists',2,'至少送出 2 次助攻')),
opt('提醒大家投篮后一起卡位','本周约定：至少 2 个篮板 · 信任 +1','「投了别站着看！」你的第一声有点急，第二声清楚了。顾言抬手示意收到，把篮下的位置留给你。',{trust:1},target('rebounds',2,'至少抢到 2 个篮板')),
opt('先喊退防，控制冒险传球','本周约定：失误不超过 1 次 · 信任 +1','你把最简单的三句话说完：有人接、有人留、丢球先回。顾言笑了：「听得懂，才跟得上。」',{trust:1},target('turnovers',1,'失误不超过 1 次',true))]);
if(id==='w4-post')return build('你的声音，传到了另一侧。','对北辰赛后 · 收球时','captain',[
scoreLine(s),'顾言让你走到球场另一侧，自己留在边线。他问，从那里能不能听见刚才集合时的声音。',
'「组织不是只属于后卫。」他说，「谁看见了空位，谁就能提醒。谁丢了球，也都该先回头。」你低头看了看鞋尖，这段话没有写在技术统计表上。',
'林野隔着半场喊你的名字。你下意识应了一声，顾言笑着把最后一个球滚了过来。'],[
opt('下一次继续叫出明确的接应点','默契 +3','你把球拦住，朝另一侧指出一个位置。林野真的跑了过去。收球结束前，你们又完成了一次没有计分的传球。',{bond:3}),
opt('请队长指出一次没看见的轮转','信任 +2','顾言带你回到当时的位置，让你转身看背后。他说得很慢，直到你能自己指向下一个该补的人。',{trust:2}),
opt('记住队友回应自己的那一刻','默契 +2 · 体力 +2','你没有再喊得更大声，只向林野举了举手。有人回应，让你第一次觉得站在场上并不总是一个人。',{bond:2,energy:2})]);
if(id==='w5-pre')return build('校门口有人问，你场均几分。','第五周 · 对明德赛前','lin',[
'明德的队员提前来踩场，一名同年级学生在校门口问你是不是江岚的新生，又问你场均得多少分。林野刚想替你答，就被顾言叫去搬水。',
'你可以报出一个数字，但记起来的还有给队友拉开的空间、落地时碰到的肩膀，以及没接住的球。',
'周教练在球场里招手：「别在门口打完一场比赛。进来，讲讲你准备做什么。」'],[
opt('用一次干净的得分回应','本周约定：个人至少 2 分 · 信任 +1','你没有报出夸张的目标，只说想把该出手的球投好。教练把球弹过来：「那就先跑到该出手的位置。」',{trust:1},target('points',2,'个人至少得到 2 分')),
opt('让队友得到更舒服的出手机会','本周约定：至少 1 次助攻 · 默契 +2','林野搬完水回来，听见了最后一句：「那我也得把跑位跑好。」你们先把球传了一圈，才开始热身。',{bond:2},target('assists',1,'至少送出 1 次助攻')),
opt('把篮板和第二次机会抓住','本周约定：至少 2 个篮板 · 信任 +1','你抬头看篮筐，没有急着看记分牌。教练提醒你：「争球要积极，抢不到时也别忘了退防。」',{trust:1},target('rebounds',2,'至少抢到 2 个篮板'))]);
if(id==='w5-post')return build('数字后面，是怎样的一场球。','对明德赛后 · 记录桌','manager',[
scoreLine(s),s.lastReport.stats.points===0?'得分栏是零。许知夏没有把纸翻过去，而是让你把其他栏目也读完。她说：「别让一个数字替你总结全部，也别拿别的栏目遮住真正的问题。」':`许知夏把你的 ${s.lastReport.stats.points} 分圈了起来，又把出手数与失误数挪到旁边：「放在一起看，才像同一场比赛。」`,
lastBall(s),'下周，临川又要来了。林野站在门口等你，手里捏着第一周那张画歪的跑位纸。'],[
opt('带着今天的记录，准备再打临川','信任 +2','你把整张记录带走，没有只撕下最好看的一栏。周教练说，下一场开始时，上一场的分数不会替你得分。',{trust:2}),
opt('和林野重新画第一周的跑位','默契 +3','你们把旧纸摊开，发现当时连接应点都画反了。林野笑得停不下来，最后在正确的位置画了一个小小的圈。',{bond:3}),
opt('先恢复，把急于证明的劲缓下来','体力 +5','你把本子收好，按时离开球场。不是每一次准备都要以多投几十个球结束。明天见到队友时，你仍然想打。',{energy:5})]);
if(id==='w6-pre')return build('同一个人，已经不是第一次见。','第六周 · 临川再次来访','rival',[
'临川的大巴停在校门口。周砚下车时认出了林野，又看了你一眼：「这次，应该不需要介绍了。」他说完就进场热身，没有留下等一句漂亮的回话。',
(()=>{const first=s.matches.find(r=>r.week===1);return first?`你记得第一场对临川的 ${first.score[0]} : ${first.score[1]}。${first.win?'那场赢过，不代表这场已经赢了。':first.draw?'那场没分出胜负，这一次仍要从每次球权开始。':'那场输过，也不代表这次只能追着同一个结果跑。'}`:'你没有留下第一场的完整记录。眼前这场，就从现在能做到的事情开始。';})(),
chosen(s,'w1-extra')===2?'林野把球传给你：「我还记得第一周跟你说的，那场我只顾自己追分。今天提醒着我点。」':'林野抬手等球，这一次没有先埋头冲向篮筐。你已经知道，他抬手时还会看哪一个方向。',
'顾言把大家叫到一起。周教练没有长篇动员，只留下一句：「把你们这六周练过的，连着打出来。」'],[
opt('用配合回应，争取两次助攻','本周约定：至少 2 次助攻 · 默契 +1','你和林野碰了一下拳，没有约好谁得最后一分，只约好不要把看见的队友漏掉。',{bond:1},target('assists',2,'至少送出 2 次助攻')),
opt('守住篮板，给球队再一次机会','本周约定：至少 2 个篮板 · 信任 +1','你先在篮下找准站位。顾言从身后拍了拍你的肩：「球下来之前，先记住你身边的人。」',{trust:1},target('rebounds',2,'至少抢到 2 个篮板')),
opt('稳住每次球权，不急着证明自己','本周约定：失误不超过 1 次 · 体力 +2','你把呼吸放慢，最后一个走进集合圈。周教练看你准备好了，才吹响热身结束的哨子。',{energy:2},target('turnovers',1,'失误不超过 1 次',true))]);
if(id==='w6-post')return build('下一站，先成为真正的队友。','临川再战之后 · 傍晚的球场','coach',[
scoreLine(s),s.lastReport.win?'周砚来和你碰拳，说了句「下次再打」。林野没有急着跑去看比分，而是先回头找齐了队友。':s.lastReport.draw?'周砚把最后的比分看了一遍，过来碰拳：「还没分出来，下次。」林野应了一声，眼睛仍亮着。':'周砚走过来碰拳：「下次再打。」林野沉默了一会儿，还是抬手回应。他没有像以前那样一个人抱着球离开。',
(()=>{const early=s.story.history.find(h=>h.id==='w1-pre');return early?`六周前，你说过想「${early.choice}」。那时你还在拉训练背心的衣角，现在已经能叫出场上每个人的名字。`:'你加入故事时，已经走过一段自己的路。这几周的球，也终于有了可以一起回头看的人。';})(),
'周教练把门钥匙交给顾言，示意你们把灯关好。「这只是第一段。」他说，「下一次想成为什么样的人，别只在赢球那天回答。」'],[
opt('还想赢，也想让身边的人打得更好','默契 +3 · 收录六周纪念','你帮林野一起收球。他说，下次谁跑到空位，就把球传给谁。你答应了，这一次不是因为那听起来像一句正确的话。',{bond:3}),
opt('把现在的短板，练成下一段的起点','信任 +2 · 收录六周纪念','你在本子的下一页写好日期。顾言问你明天几点来，你没有报一个逞强的时间，而是约了真正能到的那一刻。',{trust:2}),
opt('记住这六周，继续过好球场内外的日子','体力 +4 · 收录六周纪念','许知夏拍下空下来的球场，没有让任何人摆出胜利的姿势。照片背面写着：第一段路，大家都在。',{energy:4})]);
if(id==='w7-pre')return build('举起的那只手，还算数吗？','第七周 · 合练集合','lin',[
'新一周，林野没有抢第一个球。他等你放好书包，才把折出白边的跑位纸摊在长椅上。第六周之后，他想赢的劲没有少，话却比以前慢了一点。',
linThread(s),promiseLine(s,6),
(()=>{const i=chosen(s,'w6-post');return i===0?'他记得你说想让身边的人打得更好：「那不如这一周，真的把互相接应放在最前面。」':i===1?'你上次说要把短板练成起点，林野指着纸上的出口：「这一次，能不能把我的问题也放进练法里？」':i===2?'你上次说要把球场内外的日子都过好。林野先问你什么时候该回去，再问什么时候一起练。':'你没有留下六周收尾的回应。林野没有替你补上一句承诺，只问这次准备怎么配合。';})()], [
opt('把接应说清楚，先让球流动起来','本周约定：至少 2 次助攻 · 默契 +2','你让林野先说自己看得见哪条线，再告诉他你会在哪等。你们没有约定一定互相助攻，只约定看见空位时别故意漏掉。',{bond:2},target('assists',2,'至少送出 2 次助攻')),
opt('我来争篮板，你准备第一时间接应','本周约定：至少 2 个篮板 · 信任 +1','你把篮下和外侧接应点连起来。林野说自己会准备跑，你提醒他：「先看是谁拿到球，别只顾着往前冲。」',{trust:1},target('rebounds',2,'至少抢到 2 个篮板')),
opt('先把每次球权接稳，不追着数字打','本周约定：失误不超过 1 次 · 体力 +2','你把纸上太长的箭头擦短了。林野看了半天，终于把急着喊出的下一步收回来：「好，先接稳这一球。」',{energy:2},target('turnovers',1,'失误不超过 1 次',true))]);
if(id==='w7-post')return build('没落到你手里的球。','对青禾赛后 · 器材室门口','lin',[
scoreLine(s),s.lastReport.stats.assists>0?`你这场有 ${s.lastReport.stats.assists} 次助攻。林野没有把所有配合都算到自己头上，只说：「有人跑到了，有人也真的看见了。」`:'你的助攻栏还是零。林野把纸放平：「不能只凭这一栏说你没传球。可我们说过的接应，到底哪里没有接起来，得认真看。」',
chosen(s,'w7-pre')===0?'你们刚约过让球流动，林野没有用输赢替这项约定作答，先指向了传球的起点和接球的出口。':chosen(s,'w7-pre')===1?'林野还记得你想先争篮板：「球拿下来以后，第二个人也得准备好。不是只看你一个人跳得多高。」':chosen(s,'w7-pre')===2?'你们约过把球权处理稳。林野问，耐心到底是看清了再做，还是怕犯错而一直不做。':'没有留下这一周的赛前约定。林野没有替你补一个承诺，只把这场能确认的记录摊开。',
'顾言从器材室出来，没有替你们把讨论结束。他把门撑住，等两个人一起进去。'],[
opt('把一次未接好的配合重画给彼此看','默契 +3','你说自己看见了什么，也让林野把他看见的补上。纸上的两个箭头终于指向同一个地方，下一次仍要到场上验证。',{bond:3}),
opt('先说清自己该承担的那一步','信任 +2 · 默契 +1','你没有包揽所有责任，只说了自己能改的那一步。林野接着说了他的，顾言这才把收球的筐推过来。',{trust:2,bond:1}),
opt('约好明天再练，今天按时回去','体力 +4','你们把纸夹回本子，没有在最累的时候一遍遍赌气加练。林野先收好自己的球，和你一起走到校门口。',{energy:4})]);
if(id==='w8-pre')return build('队长也会说“我不知道”。','第八周 · 战术板前','captain',[
'顾言盯着擦到发灰的战术板，笔尖停了很久。你以为他在等大家安静，他却先开口：「刚才那组，我也没想好。」',
captainThread(s),
(()=>{const r=reportAt(s,7);return r?`上一场对青禾是 ${r.score[0]} : ${r.score[1]}。${r.win?'赢球以后，他仍愿意把没想好的地方摆出来。':r.draw?'平局没有替任何人回答下一次该怎么站。':'输过一场，也不该让所有人把决定都推回队长手里。'}`:'你们没有上一场的完整记录。顾言让大家只谈眼前这一组，不把猜测说成复盘。';})(),
'「这周对南港。」他把笔横放在板沿，「你们先说，我来听。真出了问题，我们一起改。」'],[
opt('我先叫一个明确的接应点','本周约定：至少 1 次助攻 · 默契 +2','你没有复述一整套战术，只叫出一个接应点。顾言退到队员的位置，认真回了一声「收到」。',{bond:2},target('assists',1,'至少送出 1 次助攻')),
opt('先守住篮下，再决定怎么向前','本周约定：至少 2 个篮板 · 信任 +1','你把篮下的两处位置指给大家看。顾言补了一句自己看见的风险，然后把笔留给了你。',{trust:1},target('rebounds',2,'至少抢到 2 个篮板')),
opt('承担决定，也把风险说给队友听','本周约定：失误不超过 1 次 · 信任 +1','你先说准备怎样处理逼抢，再说如果出口被封住该找谁。顾言没有替你改成自己的话：「就这样，让大家都听懂。」',{trust:1},target('turnovers',1,'失误不超过 1 次',true))]);
if(id==='w8-extra')return build('被擦掉的那一页。','训练后 · 空下来的看台','captain',[
'顾言翻到一本旧训练册。某一页被橡皮擦破，纸背贴着透明胶。他说高一时总想在每一次集合里答得最快，后来连不确定也不敢说。',
chosen(s,'w2-post')===0?'他记得你第二周在集合时说过自己的判断：「你那次说得不漂亮，但具体。比我当年一句“我都明白”有用。」':chosen(s,'w2-post')===1?'你第二周愿意听林野讲同一个球的另一面。顾言说，当时他站在旁边，也发现自己漏看了一个角度。':chosen(s,'w2-post')===2?'你第二周说要把问题带到录像本里。顾言拍了拍旧册子：「本子不是拿来证明自己一直正确的。」':'你们没有第二周谈话的记录。顾言没有借一段不存在的往事劝你，只把自己擦破的那页递过来。',
'他问，你愿不愿意把这一页留着，下次队友也卡住的时候拿出来看。'],[
opt('留着，也记下今天没想明白的问题','信任 +2','你没有把破损的纸重新誊成干净答案，只在旁边写下今天的问题。顾言看了一会儿，把训练册合上：「明天一起找。」',{trust:2}),
opt('告诉他，自己也有不敢出声的时候','默契 +2 · 体力 +2','你讲了那种怕一开口就错的感觉，没有替自己编一场英雄式的补救。顾言说，他现在也不是每次都敢，只是开始愿意等别人回答。',{bond:2,energy:2}),
opt('下次请大家一起慢速走过那组站位','默契 +3','你问能不能把纸上的问题变成下一次合练的起点。顾言把册子留在公共球筐旁，不再一个人抱走。',{bond:3})]);
if(id==='w8-post')return build('答错了，也别把笔收回去。','对南港赛后 · 战术板旁','captain',[
scoreLine(s),s.lastReport.win?'顾言先和大家碰拳，才把板上的箭头擦掉：「赢了，刚才没看清的地方也还在。下次照样可以问我。」':s.lastReport.draw?'顾言把相同的两个分数记下，没有替平局编出一个输球的人：「决定是大家一起做的，下次也一起改。」':'顾言把笔放回你面前：「输球以后，最容易把所有决定都拿回我这里。可那样，下场你们还是不敢说。」',
chosen(s,'w8-extra')===0?'你们那页没写完的问题还在。顾言让你在旁边添上这场真正看清的一件事。':chosen(s,'w8-extra')===1?'你说过自己有时不敢出声。顾言没有当着所有人提起，只在集合前给你留了一个开口的空隙。':chosen(s,'w8-extra')===2?'那本旧册子已经放在公共球筐旁。林野也凑过来看，问下一次能不能由自己先叫一组站位。':'这周没有留下看台谈话的记录。顾言没有追问，只把笔放在大家够得着的地方。',
'周教练等你说下一句，没有用分数替你说。'],[
opt('继续承担，也请队友指出盲区','信任 +2 · 默契 +1','你把自己的判断说完，停下来听了另外两种看法。顾言没有收回笔，只替你扶稳了板子。',{trust:2,bond:1}),
opt('把没想明白的地方说清楚再练','信任 +2','你没有为了显得像队长，马上给出每一个答案。周教练记下你问的问题，让下一次训练从那里开始。',{trust:2}),
opt('谢谢队长，也把鼓励传给林野','默契 +3','林野接过笔时握得太紧，第一条线画歪了。你没有抢过来，等他把后半句说完。',{bond:3})]);
if(id==='w9-pre')return build('两张表上，同一个名字。','第九周 · 午休的记录桌','manager',[
'许知夏把课业安排与比赛记录并排放着。林野的书包靠在桌脚，顾言从旁边挪出一张空椅子。谁都没有先说自己一定忙得过来。',
(()=>{const i=chosen(s,'w3-pre');return i===0?'第三周你先排过学习时间。许知夏没有替你宣布学业结果，只问：「现在的安排，还是你真正能做到的吗？」':i===1?'你第三周和林野划掉过无效加练。林野指了指最近又写满的边角：「是不是又开始用加得多，代替练得清楚了？」':i===2?'你第三周选过把卡位基本功练细。许知夏翻到那页：「这件具体的事，后来有没有被更响亮的目标挤掉？」':'第三周的安排没有留下完整记录。许知夏给你一张新表：「不用补交一份假的过去，先排这一周。」';})(),
`你现在的体力记录是 ${s.energy} / 100。${s.energy<65?'你决定把恢复也认真放进安排里，而不是在最累时再想。':'还有余力，也不代表每个晚上都必须写满。'}`,
'周五对北辰。周教练只让你留一项清楚的场上约定，其他时间照着真正能执行的安排来。'],[
opt('留出恢复时间，把简单球处理稳','本周约定：失误不超过 1 次 · 体力 +4','你把一段留白写成休息，没有拿它与努力对立。许知夏只提醒你，比赛时仍要看清该传和该投的机会。',{energy:4},target('turnovers',1,'失误不超过 1 次',true)),
opt('和林野分工复盘，练清接应角度','本周约定：至少 1 次助攻 · 默契 +2','你们各找一处能确认的站位问题，再合成下一次训练的内容。纸上少了很多箭头，却更容易看懂。',{bond:2},target('assists',1,'至少送出 1 次助攻')),
opt('保留基本功，把篮板动作做扎实','本周约定：至少 2 个篮板 · 信任 +1','你把卡位、找球和退防分开写，没有只写一个篮板总数。周教练经过时说，动作还要到场上兑现。',{trust:1},target('rebounds',2,'至少抢到 2 个篮板'))]);
if(id==='w9-post')return build('空白不是缺席。','对北辰赛后 · 教室后排','manager',[
scoreLine(s),s.lastReport.stats.turnovers>=2?`这场有 ${s.lastReport.stats.turnovers} 次失误。许知夏把数字留在原处：「这不是你整个人的分数，但也得找到其中能改的判断。」`:'许知夏把失误一栏念完，让你继续看得分、助攻和篮板：「低失误值得保留，下一步还得看你帮助球队做成了什么。」',
chosen(s,'w9-pre')===0?'你本周为恢复留过位置。许知夏没有拿一场输赢证明休息对不对，只问下周还能不能按时到场、认真判断。':chosen(s,'w9-pre')===1?'林野把分工找来的记录放回桌上。你们决定，下次也只给彼此一个真正看清的问题。':chosen(s,'w9-pre')===2?'你这周保留了篮板基本功。许知夏把那页夹在比赛统计后，提醒你别让计划只留在封面上。':'本周没有留下赛前安排的回应。许知夏把能确认的比赛记录夹好，没有替你补上一项选择。',
'窗外的球场已经安静下来。顾言过来借回战术板，先问你们的安排写完了没有。'],[
opt('把恢复安排保留下来，不用加练惩罚自己','体力 +4','你没有再用一个临时加练盖住整场的问题。明天要做什么写清楚以后，才把本子收好。',{energy:4}),
opt('带上林野的视角，约下一次复盘','默契 +3','你们约好先各自看，再一起说。林野把纸夹得很正，没有替你把该写的那一半也写掉。',{bond:3}),
opt('把最需要改的一项交给教练看','信任 +2','你只挑了一项具体的判断，讲清楚准备怎么练。周教练问你下次希望他看哪里，这一次你能答上来。',{trust:2})]);
if(id==='w10-pre')return build('对手递来的本子。','第十周 · 明德来访前的公开训练','rival',[
'周砚跟着临川的老师来旁观一次公开训练。他没有穿比赛背心，手里拿着的本子却和你们那本一样卷了边。林野先看见他，脚步顿了一下，还是让出了长椅的一端。',
rivalLine(s),
(()=>{const r=reportAt(s,6);return r?`第六周，你个人的记录是 ${r.stats.points} 分、${r.stats.assists} 次助攻、${r.stats.rebounds} 个篮板。周砚把这张表和训练页放在一起，问起你们后来怎样继续练。`:'第六周的个人记录没有完整留下。你们先把能确认的页码找齐，再开始讨论。';})(),
'这周的对手是明德，下周才再打临川。周砚把本子推过来：「今天可以讲清楚，比赛时我还是会认真防。你们也一样。」'],[
opt('先把自己的合理出手机会打好','本周约定：个人至少 4 分 · 信任 +1','你没有把交流变成得分赌约，只说想在合适的位置承担出手。林野说自己会准备好接应，周砚把那句话也记了下来。',{trust:1},target('points',4,'个人至少得到 4 分')),
opt('把看懂的防守，变成给队友的机会','本周约定：至少 2 次助攻 · 默契 +2','你把本子转向林野，让他也说一处接球的出口。周砚抬起笔，先听你们把各自的视角讲完。',{bond:2},target('assists',2,'至少送出 2 次助攻')),
opt('先把篮板争稳，再谈下一步','本周约定：至少 2 个篮板 · 信任 +1','你指着篮下的空白，没有保证每个球都会落到手里。周砚说，落点看得到，身边的人也要看得到。',{trust:1},target('rebounds',2,'至少抢到 2 个篮板'))]);
if(id==='w10-extra')return build('“不放水”，也可以认真说。','公开训练结束 · 长椅','rival',[
'周砚准备离开时，林野叫住了他。你以为两个人又要争一句谁更快，林野却问起暑假那次三对三：当时，到底哪条线最容易被堵住。',
chosen(s,'w1-extra')===2?'你听过第一周林野讲那场球。现在，另一边的人也坐在这里，旧故事终于可以多一个视角。':chosen(s,'w1-extra')===0?'你第一周约过只练十分钟传切。周砚看着你们画出的接应线，说先把一处讲清楚，比把时间拖得更长有用。':chosen(s,'w1-extra')===1?'你第一周选择过按时回去、明天再练。天色暗下来时，林野先看了眼时间，才约好只问最后一个问题。':'那段暑假旧球赛没有留下你的谈话记录。你没有假装早已听过，先请两个人从能确认的地方说起。',
'临川老师在门口招手。周砚合上本子：「下周见。不放水。」你决定带走哪一件事。'],[
opt('带走一个双方都说清楚的问题','信任 +2','你记下的是一个待验证的问题，没有把对手的说法当成下场必然发生的答案。回到队里，先请教练看你理解得对不对。',{trust:2}),
opt('把接应角度讲给林野，下一次一起试','默契 +3','你把两边的视角画到同一张纸上。林野没急着宣布自己懂了，约你下次训练一起走一遍。',{bond:3}),
opt('约好场上认真打，场下照样交流','体力 +2 · 信任 +1','你们没有交换胜负的保证，只约好比赛结束后还能把本子摊开。周砚朝林野点头，跟上门口等他的老师。',{energy:2,trust:1})]);
if(id==='w10-post')return build('看懂之后，还是要自己做。','对明德赛后 · 记录桌','lin',[
scoreLine(s),lastBall(s),
chosen(s,'w10-extra')===0?'你带回了一个待验证的问题。顾言没有问它是不是“从对手那里学来的”，只问它和今天能确认的记录有没有对上。':chosen(s,'w10-extra')===1?'林野记得你说要一起走过接应角度：「别因为看过一次，就以为每次都能跑出来。」他把纸留给下一次训练。':chosen(s,'w10-extra')===2?'你和周砚约过场上认真打、场下继续交流。林野把这句话写在纸角，下周的对手也终于不只是一个要赢过的名字。':'公开训练后的谈话没有留下回应。林野把本周比赛记录摆在中间：「就从我们真正打过的这些看。」',
'下周再见临川。你们要带过去的，不该只有一句想赢。'],[
opt('把能用的接应方法留给全队','默契 +3','你让林野先说，再请顾言补上没看见的一边。方法没有归给某一个人，下一次还得在防守面前继续练。',{bond:3}),
opt('记下这场还没做到的一个判断','信任 +2','你把问题写成能练的动作，没有写成一句必须战胜谁的口号。顾言把日期补在旁边。',{trust:2}),
opt('先恢复，把劲留到真正开球时','体力 +4','你按时收好球，没有和林野在疲惫时赌最后一球。走到校门口，他已经开始认真想下一次该站哪里。',{energy:4})]);
if(id==='w11-pre')return build(s.matches.filter(r=>r.opponent==='临川中学'&&r.week<11).length>=2?'第三次，把旧纸带回来。':'临川，把这一页写清楚。','第十一周 · 迎战临川','rival',[
'周砚下车时没有再问名字。林野把那张旧跑位纸折好，放进训练册。顾言叫大家集合，等每个人都回应了才开始热身。',
rivalLine(s),promiseLine(s,6),
chosen(s,'w10-extra')===2?'你们约过“不放水，也继续交流”。周砚先碰拳，再回到临川那一侧。那句约定没有替任何一队预订胜利。':chosen(s,'w10-extra')===1?'林野记得那次一起拆过的接应角度。他把手举给你看，没有保证同一条线今天还会敞开。':chosen(s,'w10-extra')===0?'你们带回过一个待验证的问题。周砚看见本子，笑了一下：「这次，防守也会给新问题。」':'没有留下公开训练后约定的记录，你们就在开球前重新碰拳，认真打完眼前这一场。'],[
opt('让配合经得住这一次认真防守','本周约定：至少 2 次助攻 · 默契 +2','你和林野没有指定谁来完成最后一攻，只把彼此能接应的位置说清楚。顾言听完，把最后一句提醒交给你。',{bond:2},target('assists',2,'至少送出 2 次助攻')),
opt('从篮板开始，给球队再一次机会','本周约定：至少 3 个篮板 · 信任 +1','你把篮下与退防的分工又确认了一次。林野说自己会看谁先拿到球，再决定快下还是接应。',{trust:1},target('rebounds',3,'至少抢到 3 个篮板')),
opt('叫清站位，承担每次球权的决定','本周约定：失误不超过 1 次 · 信任 +1','你先叫出第一个接应点，又提醒大家丢球后立刻回头。顾言回了一声「收到」，站回队友的位置。',{trust:1},target('turnovers',1,'失误不超过 1 次',true))]);
if(id==='w11-post')return build('碰拳之后，先听完对方。','临川再战后 · 边线','rival',[
scoreLine(s),s.lastReport.win?'周砚和你碰拳：「这次你们赢了。」林野没有替对手找借口，也没有急着给自己加一句漂亮总结。':s.lastReport.draw?'周砚看着相同的分数，碰拳时说：「这次还是没分出胜负。球倒是真打完了一整场。」':'周砚先过来碰拳，没有拿胜利再追一句话。林野抬手回应，过了一会儿才说：「下次，还要认真防我们。」',
(()=>{const a=reportAt(s,6),b=s.lastReport;return a?`第六周对临川的分差是 ${a.score[0]-a.score[1]}，这次是 ${b.score[0]-b.score[1]}（正数表示江岚领先）。许知夏把两场都保留下来，没有只挑更好看的一场。`:'第六周的完整比分没有留下。许知夏把这次的记录夹好，没有替缺失的一场补写分差。';})(),
chosen(s,'w8-post')===0?'你说过会继续承担，也听队友指出盲区。顾言这次没有先发言，等你和林野把各自看见的说完。':chosen(s,'w8-post')===1?'你说过不明白的地方要先问清楚。周砚把本子拿来，先问你们想从哪一处开始。':chosen(s,'w8-post')===2?'你把顾言的鼓励传给过林野。林野这次没有等别人替自己开口，先向周砚问起一个接应角度。':'没有留下第八周赛后回应的记录，顾言就从今天这场开始，等你们先开口。',
'赛季还剩一场，对青禾。周砚收好自己的本子，没有把你们的收官抢成他和林野两个人的较量。'],[
opt('我先说，再听队友补上看不见的一边','信任 +2 · 默契 +1','你没有把比分当作每个判断的答案。顾言替你按住翻动的纸，林野补上自己的视角，周砚也把听到的问题写回了本子。',{trust:2,bond:1}),
opt('把这段较劲，变成继续练的约定','默契 +3','你和林野没有答应下一场一定赢，只约好还要看见对方。周砚把笔放回包里：「那下次，就继续认真打。」',{bond:3}),
opt('向对手道谢，把收官留给江岚全队','体力 +3 · 信任 +1','你谢过周砚，回头帮队友收球。临川的大巴离开时，顾言还在等最后一个人回到集合圈。',{energy:3,trust:1})]);
if(id==='w12-pre')return build('这一次，所有人的名字都在。','第十二周 · 赛季收官前','coach',[
'许知夏给训练册换了封皮，旧纸一张也没扔。林野递来一张改过很多次的跑位图，顾言也从自己的旧册子里选出一页。青禾来访的时间写在最后一行。',
(()=>{const a=seasonSummary(s);return `赛前已留下 ${a.played} 场正式比赛记录：${a.wins} 胜、${a.draws} 平、${a.losses} 负。周教练没有提前写上第十二场的结果：「最后这一页，还是得自己打。」`;})(),
(()=>{const h=s.story.history.find(h=>h.id==='w1-pre');return h?`第一周你说过「${h.choice}」。教练让你把这句话再读一遍，不是要你重新选成当初那个人，而是看现在会怎样兑现。`:'你加入故事时，前面的选择没有完整留下。教练没有让你补一个好看的开头，只让你认真写下已经走到这里的部分。';})(),
'顾言把笔放在大家中间。林野举起手，不急着说自己来。周教练问，收官这一场，你准备怎样帮助这支球队。'],[
opt('让队友都有接应，连着打完这场球','本周约定：至少 2 次助攻 · 默契 +2','你没有把收官写成自己的独角戏，先叫清楚两侧的出口。林野和顾言各回了一声，等你把最后一句说完。',{bond:2},target('assists',2,'至少送出 2 次助攻')),
opt('从篮板和二次机会开始争取胜利','本周约定：至少 3 个篮板 · 信任 +1','你确认每个人投篮后的去向，也确认丢球时谁先退。教练没有加一个必须完成的得分数，只让你记住这个分工。',{trust:1},target('rebounds',3,'至少抢到 3 个篮板')),
opt('叫清每一次站位，做稳自己的决定','本周约定：失误不超过 1 次 · 信任 +1','你先把话说给身边的人听，再接过球。顾言把队长的身份暂时放在那块板子旁，像队友一样等你开球。',{trust:1},target('turnovers',1,'失误不超过 1 次',true))]);
if(id==='w12-post'){const a=seasonSummary(s);return build('灯灭之前，还有下一页。','对青禾收官之后 · 江岚球场','coach',[
scoreLine(s),s.lastReport.win?'你们赢下收官，林野笑着把球举了一下，又先递给旁边的队友。顾言让大家站齐，没把合影缩成几个得分最多的人。':s.lastReport.draw?'收官打成平局。林野看了记分牌很久，仍把队友叫到一起。顾言说，合影不用等一个更漂亮的比分。':'收官没能赢下。林野把球抱在怀里，最后还是递到大家中间。顾言没催任何人马上笑，却让每个人都留下来。',
`这一季已记录 ${a.played} 场：${a.wins} 胜、${a.draws} 平、${a.losses} 负。你得到 ${a.stats.points} 分、${a.stats.assists} 次助攻、${a.stats.rebounds} 个篮板；有记录可核对的 ${a.goals} 项约定，完成 ${a.achieved} 项。${a.played===12&&a.goals===12?'许知夏把最后一个数字写好，抬头等你们一起读完。':'没留下的比赛和约定留白，你们从已经写下的这些接着往前。'}`,
(()=>{const i=chosen(s,'w10-extra');return i===2?'许知夏把周砚在公开训练时写的“不放水，也继续交流”抄在照片背面。那一行留住了一个对手认真听完你们的时刻。':i===1?'你和林野把从周砚那里讨论过的接应角度留在册子里。它没有替球队赢下每一场，却成了你们愿意一起验证的一个问题。':i===0?'你带回过周砚本子上的一个问题，顾言把后来补上的练法也夹在旁边。问题没有因为赛季结束就被划掉。':'周砚那段训练后的交流没有留下回应。你们把真正打过的临川比赛记在册子里，没有补上一句并未说过的约定。';})(),
`周教练读完记录，把这一段命名为「${a.ending.title}」。${a.ending.text}`,
'灯要关了。顾言把钥匙交回去，林野在门口等你。下一季还没开打，你想把什么留在这一页的最后。'],[
opt('把彼此的名字，写在下一季的接应点旁','默契 +3 · 收录赛季收官纪念','你把名字写在空位旁，没有指定谁一定当主角。林野把那张旧纸夹进新封皮，顾言把笔留在大家都够得到的位置。',{bond:3}),
opt('留下一项没完成的约定，明天接着练','信任 +2 · 收录赛季收官纪念','你没有替所有问题画勾，只挑一项准备继续练的事。周教练把日期留空，等你下一次真的做到时再写。',{trust:2}),
opt('先和大家一起回家，下次准时来','体力 +4 · 收录赛季收官纪念','你们关好灯，一起走到校门口。没有人保证下一季会怎样，但约定好的时间，每个人都认真记下了。',{energy:4})]);}

return (s.week>=61?Sixth:s.week>=49?Fifth:s.week>=37?Fourth:s.week>=25?Third:Second).scene(s,id,{opt,target,cast,scoreLine,lastBall,promiseLine,rivalLine,captainThread});
}
function current(s){if(!s.story||!['home','result'].includes(s.stage)||s.week<s.story.startWeek||s.week>72)return null;const f=s.story.feedback;if(f&&f.week===s.week&&f.stage===s.stage)return {...f,season: f.id==='w12-post'?season(s):f.id==='w24-post'?seasonTwo(s):f.id==='w36-post'?seasonThree(s):f.id==='w48-post'?seasonFour(s):f.id==='w60-post'?seasonFive(s):f.id==='w72-post'?seasonSix(s):null,settled:true};const ids=s.stage==='home'?[`w${s.week}-pre`,...(s.training.length&&[1,2,8,10,...Second.extras,...Third.extras,...Fourth.extras,...Fifth.extras,...Sixth.extras].includes(s.week)?[`w${s.week}-extra`]:[])]:s.lastReport?.kind==='weekly'?[`w${s.week}-post`]:[];const id=ids.find(id=>!s.story.history.some(h=>h.id===id));if(!id)return null;const data=sceneData(s,id),result=s.stage==='result'?measured(s):null;const coachName=data.speaker.name==='梁正'?'梁教练':data.speaker.name==='陈牧'?'陈教练':data.speaker.name==='埃利斯'?'埃利斯':s.week>=25&&data.speaker.name==='陆峥'?'陆教练':'周教练';if(result)data.paragraphs.splice(data.paragraphs.length-1,0,result.met?`${coachName}翻出你赛前写的「${result.label}」，在旁边画了一个勾：「答应过的事，你做到了。下次继续把它放进整场配合里。」`:`${coachName}指着赛前的「${result.label}」：「今天还没做到。不用找一句好听的话盖过去，先想清楚下一次怎么练。」`);return {...data,goalResult:result,season:id==='w12-post'?seasonSummary(s):id==='w24-post'?Second.summary(s):id==='w36-post'?Third.summary(s):id==='w48-post'?Fourth.summary(s):id==='w60-post'?Fifth.summary(s):id==='w72-post'?Sixth.summary(s):null,settled:false};}
function choose(s,index,id){const sc=current(s);if(!sc||sc.settled||sc.id!==id||!Number.isInteger(index)||!sc.options[index])return false;const a=sc.options[index],effects=[];for(const [key,delta]of Object.entries(a.effects)){const before=s[key];s[key]=clamp(before+delta,0,100);const actual=s[key]-before;if(actual)effects.push(`${{bond:'球队默契',trust:'教练信任',energy:'体力'}[key]} ${actual>0?'+':''}${actual}`);}
// The coach's trust has the same placement meaning as weekly match trust.
s.placement=s.trust>=62?'rotation':s.trust>=43?'bench':'observe';
const h={season:sc.season||null,paragraphs:[...sc.paragraphs],id:sc.id,week:s.week,index,title:sc.title,choice:a.title,text:a.text,effects,goal:a.goal?{...a.goal}:null,goalResult:sc.goalResult?{...sc.goalResult}:null};s.story.history.push(h);s.story.feedback={...h,stage:s.stage,chapter:sc.chapter,speaker:sc.speaker,place:sc.place};
if(id==='w6-post'&&!s.album.some(x=>x.key==='six-weeks'))s.album.push({key:'six-weeks',week:s.week,title:'第一段路，大家都在',text:`你和江岚的队友走过了六周。对临川的最后一场比分是 ${s.lastReport.score[0]} : ${s.lastReport.score[1]}。${a.text}`});if(id==='w12-post'){s.story.season=sc.season;if(!s.album.some(x=>x.key==='first-season-story'))s.album.push({key:'first-season-story',week:s.week,title:'赛季收官 · '+sc.season.ending.title,text:`这一季记录 ${sc.season.played} 场，${sc.season.wins} 胜 ${sc.season.draws} 平 ${sc.season.losses} 负。${sc.season.ending.text}${a.text}`});}if(id==='w24-post'){s.story.seasonTwo=sc.season;if(!s.album.some(x=>x.key==='second-season-story'))s.album.push({key:'second-season-story',week:s.week,title:'第二季收官 · '+sc.season.ending.title,text:sc.season.ending.text+' '+a.text});}if(id==='w36-post'){s.story.seasonThree=sc.season;if(!s.album.some(x=>x.key==='third-season-story'))s.album.push({key:'third-season-story',week:s.week,title:'第三季收官 · '+sc.season.ending.title,text:sc.season.ending.text+' '+a.text});}if(id==='w48-post'){s.story.seasonFour=sc.season;if(!s.album.some(x=>x.key==='fourth-season-story'))s.album.push({key:'fourth-season-story',week:s.week,title:'第四季收官 · '+sc.season.ending.title,text:sc.season.ending.text+' '+a.text});}if(id==='w60-post'){s.story.seasonFive=sc.season;if(!s.album.some(x=>x.key==='fifth-season-story'))s.album.push({key:'fifth-season-story',week:s.week,title:'第五季收官 · '+sc.season.ending.title,text:sc.season.ending.text+' '+a.text});}if(id==='w72-post'){s.story.seasonSix=sc.season;if(!s.album.some(x=>x.key==='sixth-season-story'))s.album.push({key:'sixth-season-story',week:s.week,title:'第六阶段收官 · '+sc.season.ending.title,text:sc.season.ending.text+' '+a.text});}return true;}
function advance(s){const c=current(s);if(!c?.settled)return false;s.story.feedback=null;return true;}
function valid(s){const st=s.story;if(st===undefined)return true;if(!st||st.version!==1||!Number.isInteger(st.startWeek)||st.startWeek<1||st.startWeek>s.week||!Array.isArray(st.history)||st.history.length>known.length)return false;const str=x=>typeof x==='string'&&x.length<3000;const g=x=>x===null||x&&['points','assists','rebounds','turnovers','steals','blocks'].includes(x.stat)&&Number.isInteger(x.n)&&x.n>=0&&x.n<=10&&str(x.label)&&typeof x.max==='boolean';const entry=h=>h&&known.includes(h.id)&&Number.isInteger(h.week)&&h.week>=st.startWeek&&h.week<=s.week&&h.week===Number(h.id.match(/^w(\d+)-/)[1])&&Number.isInteger(h.index)&&h.index>=0&&h.index<3&&['title','choice','text'].every(k=>str(h[k]))&&(h.paragraphs===undefined||Array.isArray(h.paragraphs)&&h.paragraphs.length<=8&&h.paragraphs.every(str))&&(h.season===undefined||h.season===null||['w12-post','w24-post','w36-post','w48-post','w60-post','w72-post'].includes(h.id)&&seasonValid(h.season))&&Array.isArray(h.effects)&&h.effects.length<=3&&h.effects.every(str)&&g(h.goal)&&(h.goalResult===null||g(h.goalResult)&&Number.isInteger(h.goalResult.value)&&h.goalResult.value>=0&&typeof h.goalResult.met==='boolean');if(!st.history.every(entry)||new Set(st.history.map(h=>h.id)).size!==st.history.length)return false;if(st.season!==undefined){const close=st.history.find(h=>h.id==='w12-post');if(!Array.isArray(s.matches)||!s.matches.every(r=>r&&r.stats&&Number.isFinite(r.grade))||!seasonValid(st.season)||!close||!sameSeason(st.season,close.season)||st.feedback?.id==='w12-post'&&!sameSeason(st.season,st.feedback.season)||!sameSeasonData(st.season,seasonSummary(s)))return false;}else if(st.history.some(h=>h.id==='w12-post'))return false;if(st.seasonTwo!==undefined){const close=st.history.find(h=>h.id==='w24-post');if(!Array.isArray(s.matches)||!s.matches.every(r=>r&&r.stats&&Number.isFinite(r.grade))||!seasonValid(st.seasonTwo)||!close||!sameSeason(st.seasonTwo,close.season)||st.feedback?.id==='w24-post'&&!sameSeason(st.seasonTwo,st.feedback.season)||!sameSeasonData(st.seasonTwo,Second.summary(s)))return false;}else if(st.history.some(h=>h.id==='w24-post'))return false;if(st.seasonThree!==undefined){const close=st.history.find(h=>h.id==='w36-post');if(!Array.isArray(s.matches)||!s.matches.every(r=>r&&r.stats&&Number.isFinite(r.grade))||!seasonValid(st.seasonThree)||!close||!sameSeason(st.seasonThree,close.season)||st.feedback?.id==='w36-post'&&!sameSeason(st.seasonThree,st.feedback.season)||!sameSeasonData(st.seasonThree,Third.summary(s)))return false;}else if(st.history.some(h=>h.id==='w36-post'))return false;if(st.seasonFour!==undefined){const close=st.history.find(h=>h.id==='w48-post');if(!Array.isArray(s.matches)||!s.matches.every(r=>r&&r.stats&&Number.isFinite(r.grade))||!seasonValid(st.seasonFour)||!close||!sameSeason(st.seasonFour,close.season)||st.feedback?.id==='w48-post'&&!sameSeason(st.seasonFour,st.feedback.season)||!sameSeasonData(st.seasonFour,Fourth.summary(s)))return false;}else if(st.history.some(h=>h.id==='w48-post'))return false;if(st.seasonFive!==undefined){const close=st.history.find(h=>h.id==='w60-post');if(!Array.isArray(s.matches)||!s.matches.every(r=>r&&r.stats&&Number.isFinite(r.grade))||!seasonValid(st.seasonFive)||!close||!sameSeason(st.seasonFive,close.season)||st.feedback?.id==='w60-post'&&!sameSeason(st.seasonFive,st.feedback.season)||!sameSeasonData(st.seasonFive,Fifth.summary(s)))return false;}else if(st.history.some(h=>h.id==='w60-post'))return false;if(st.seasonSix!==undefined){const close=st.history.find(h=>h.id==='w72-post');if(!Array.isArray(s.matches)||!s.matches.every(r=>r&&r.stats&&Number.isFinite(r.grade))||!seasonValid(st.seasonSix)||!close||!sameSeason(st.seasonSix,close.season)||st.feedback?.id==='w72-post'&&!sameSeason(st.seasonSix,st.feedback.season)||!sameSeasonData(st.seasonSix,Sixth.summary(s)))return false;}else if(st.history.some(h=>h.id==='w72-post'))return false;if(!Sixth.registrationValid(s))return false;const f=st.feedback;return f===null||entry(f)&&['home','result'].includes(f.stage)&&st.history.some(h=>h.id===f.id)&&str(f.chapter)&&str(f.place)&&f.speaker&&Object.values(cast).some(c=>c.name===f.speaker.name&&c.job===f.speaker.job&&c.letter===f.speaker.letter);}
return {seasonSix,league:Sixth.status,leagueCore:Sixth.coreNow,enroll:Sixth.enroll,seasonFive,career:Fifth.status,careerCore:Fifth.coreNow,seasonFour,preparation:Fourth.status,prepCore:Fourth.coreNow,seasonThree,seasonTwo,youth:Third.status,youthCore:Third.currentCore,eventValid:(e,w,o)=>typeof e?.key==='string'&&e.key.startsWith('league-')?Sixth.eventValid(e,w,o):typeof e?.key==='string'&&e.key.startsWith('career-')?Fifth.eventValid(e,w,o):typeof e?.key==='string'&&e.key.startsWith('prep-')?Fourth.eventValid(e,w,o):Third.eventValid(e,w,o),fixture:(week,s)=>week>=61?Sixth.fixture(week,s):week>=49?Fifth.fixture(week,s):week>=37?Fourth.fixture(week,s):week>=25?Third.fixture(week,s):Second.fixture(week),dossier:Second.dossier,relations:s=>s.week>=61?Sixth.relations(s):s.week>=49?Fifth.relations(s):s.week>=37?Fourth.relations(s):s.week>=25?Third.relations(s):Second.relations(s),chapters,total:known.length,cast,season,seasonSummary,init,current,choose,advance,goal,measured,valid};
});
