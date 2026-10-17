/* Second season: authored fiction, progression derived only from saved basketball records. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GreatnessSeasonTwo=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const chapters=['第二本训练册','掩护之后','把远方写具体','被研究的你','篮板决定下一攻','半程不看热闹','更快的第一步','对手的新答案','弱侧也有主角','把职责交出去','观察席有人','门外的下一站'];
const extras=[14,15,18,22],ids=Array.from({length:12},(_,i)=>[`w${i+13}-pre`,...(extras.includes(i+13)?[`w${i+13}-extra`]:[]),`w${i+13}-post`]).flat();
const schedule=[['南港中学','校际交流赛'],['北辰中学','校际交流赛'],['明德中学','校际交流赛'],['临川中学','战术交流赛'],['青禾中学','校际交流赛'],['南港中学','半程检验赛'],['江州发展队','青年梯队交流赛'],['临川中学','战术复测赛'],['海岳青年队','青年梯队交流赛'],['北辰中学','校际交流赛'],['江州发展队','青训观察赛'],['海岳青年队','赛季收官观察赛']];
function fixture(week){const pair=schedule[week-13];return pair?{opponent:pair[0],label:pair[1],opposition:[19,21,23,24].includes(week)?(week>=23?1.16:1.12):1.04}:{opponent:['临川中学','青禾中学','南港中学','北辰中学','明德中学'][(week-1)%5],label:week%12===0?'赛季收官战':'校园友谊赛',opposition:1};}
const choice=(s,id)=>s.story?.history.find(h=>h.id===id)?.index;
function records(s,lo=13,hi=24){return [...new Map((s.matches||[]).filter(r=>r.kind==='weekly'&&r.week>=lo&&r.week<=hi).map(r=>[r.week,r])).values()].sort((a,b)=>a.week-b.week);}
function ledger(s){const rs=records(s),stats={points:0,assists:0,rebounds:0,steals:0,blocks:0,turnovers:0};for(const r of rs)for(const k of Object.keys(stats))stats[k]+=r.stats[k];const promises=(s.story?.history||[]).filter(h=>h.week>=13&&h.week<=24&&h.id.endsWith('-pre')&&h.goal).map(h=>({h,r:rs.find(r=>r.week===h.week)})).filter(x=>x.r);return {played:rs.length,wins:rs.filter(r=>r.win).length,draws:rs.filter(r=>r.draw).length,losses:rs.filter(r=>!r.win&&!r.draw).length,stats,average:rs.length?Math.round(rs.reduce((a,r)=>a+r.grade,0)/rs.length):0,goals:promises.length,achieved:promises.filter(({h,r})=>h.goal.max?r.stats[h.goal.stat]<=h.goal.n:r.stats[h.goal.stat]>=h.goal.n).length,cooperation:promises.filter(({h,r})=>h.goal.stat==='assists'&&r.stats.assists>=h.goal.n).length,leadership:promises.filter(({h,r})=>h.goal.stat==='turnovers'&&r.stats.turnovers<=h.goal.n).length};}
function dossier(s){const a=ledger(s),attrs=s.player.attrs,keys={guard:['pass','handle','defense'],wing:['shot','drive','defense'],big:['rebound','defense','body']}[s.player.role],core=records(s).find(r=>r.week===24)?.developmentCore??s.story?.seasonTwo?.core??Math.round(keys.reduce((n,k)=>n+attrs[k],0)/keys.length),observed=records(s).filter(r=>[19,21,23,24].includes(r.week)&&r.opponent===fixture(r.week).opponent),observation=observed.length?Math.round(observed.reduce((n,r)=>n+r.grade,0)/observed.length):0;
 const checks=[{label:'第二季比赛记录',value:a.played,target:8},{label:'第二季平均评价',value:a.average,target:60},{label:'位置核心能力均值',value:core,target:62},{label:'赛前目标兑现',value:a.achieved,target:4},{label:'青年对抗记录',value:observed.length,target:2},{label:'青年对抗平均评价',value:observation,target:60}];
 const production=a.stats.points>=20||a.stats.assists>=8||a.stats.rebounds>=16;checks.push({label:'实际贡献：20分 / 8助攻 / 16篮板任一',value:production?1:0,target:1,detail:`${a.stats.points}分 · ${a.stats.assists}助攻 · ${a.stats.rebounds}篮板`});for(const c of checks)c.met=c.value>=c.target;
 const ready=checks.every(c=>c.met),watch=a.played>=4&&a.average>=45,completed=!!s.story?.seasonTwo,decision=s.week===24&&s.stage==='result'||completed,routeIndex=choice(s,'w15-extra'),route=['国内青训方向','海外发展准备','双线评估后再决定'][routeIndex]||'尚未选择发展方向';
 const key=ready?'invite':watch?'watch':'foundation',title=ready?(decision?'获得青年队试训邀请':'达到试训推荐线，等待收官确认'):watch?(decision?'进入持续观察名单':'持续积累观察记录'):a.played<4&&!decision?'建立第二赛季比赛档案':'先补齐校队基本功';
 return {key,title,ready,decision,route,core,checks,stats:a.stats,played:a.played,average:a.average,focus:keys,focusText:{guard:'挡拆出球、护球与领防；团队合练配合运球训练。',wing:'接球终结、突破后的分球与侧翼防守；投篮配合运球训练。',big:'卡位护筐、掩护顺下与接球处理；力量篮板配合团队合练。'}[s.player.role],next:ready?'江州青年发展中心愿意安排一次青年队试训。下一阶段需面对完整训练评估，再争取青年队席位。':watch?'江州青年发展中心保留你的观察档案；先补齐未达标项，再争取试训。':'周教练会继续带你打校际比赛。完成训练、兑现赛前目标，再把记录带到青年对抗中。'};
}
function relations(s){const a=ledger(s),t=s.story?.history||[],did=id=>t.some(h=>h.id===id),linReads=['w14-pre','w17-pre','w20-pre','w21-pre','w23-pre'].filter(id=>choice(s,id)===0).length,first=s.story?.season?.ending.key;
return [{name:'林野',state:linReads>=2&&a.stats.assists>=4?'相互读懂的搭档':a.stats.assists>=4?'在比赛中累积的新默契':linReads?'正在磨合的新分工':first==='together'?'从旧默契重新出发':'从接应重新建立信任',text:`第二季实际 ${a.stats.assists} 次助攻。林野开始学习掩护和弱侧接应，你们约过的分工，还要一场场继续磨合。`},{name:'顾言',state:a.achieved>=4?'可以交出一部分职责':did('w18-extra')?'共同复盘，而非代你决定':'队长仍在观察',text:`第二季兑现 ${a.achieved} / ${a.goals} 项赛前目标。顾言把部分战术提醒交给你，自己也在练习听完队友的方案。`},{name:'周砚',state:did('w22-extra')?'互相检验的竞争者':did('w16-post')||did('w20-post')?'带着新课题的对手':'下一场继续检验',text:'他也在争取更高水平的训练机会；你们可以交流阅读方法，正式交手仍各自争胜。'}];}
function summary(s){const a=ledger(s),d=dossier(s);return {...a,core:d.core,ending:d.ready?{key:'together',title:'试训名单上的名字',text:d.next,reason:'比赛评价、核心能力、目标兑现与青年对抗七项标准全部达标；这是一份试训邀请。'}:d.key==='watch'?{key:'voice',title:'留在观察册里',text:d.next,reason:`已记录 ${a.played} 场第二季比赛，平均评价 ${a.average}；仍有 ${d.checks.filter(c=>!c.met).length} 项推荐要求需要补齐。`}:{key:'unfinished',title:'把基本功带到明天',text:d.next,reason:`已记录 ${a.played} 场第二季比赛，完成 ${a.achieved} 项赛前目标。下一步仍是训练与真实比赛。`}};}
function scene(s,id,ctx){const {opt,target,cast,scoreLine,lastBall,promiseLine,rivalLine,captainThread}=ctx,w=s.week,d=dossier(s),a=ledger(s),first=s.story?.season,prev=records(s,13,w-1).at(-1),r=s.lastReport;
const build=(title,place,speaker,paragraphs,options)=>({id,week:w,chapter:chapters[w-13],title,place,speaker:cast[speaker],paragraphs,options});
const assist=n=>target('assists',n,`至少送出 ${n} 次助攻`),board=n=>target('rebounds',n,`至少抢到 ${n} 个篮板`),safe=()=>target('turnovers',1,'失误不超过 1 次',true),point=n=>target('points',n,`至少得到 ${n} 分`);
const common=[opt('读懂协防，把球送到弱侧','本周目标：至少 2 次助攻 · 默契 +1','你把弱侧接应点叫给林野听，约好等防守真的移动再传。顾言补上一句：「看到窗口，比背下来路线重要。」',{bond:1},assist(2)),opt('先卡位，再把篮板变成下一攻','本周目标：至少 3 个篮板 · 信任 +1','你先确认谁冲板、谁退防。周教练提醒，拿到防守篮板先看出口，进攻篮板也可以重新分球。',{trust:1},board(3)),opt('承担球权，控制处理球风险','本周目标：失误不超过 1 次 · 信任 +1','你把停球时的接应点说清楚，也答应空位时承担出手。少失误要靠观察和站位，不能靠整场躲开球。',{trust:1},safe())];
// An old save may already be playing a different opponent. Never relabel that game as youth observation.
if(id.endsWith('-post')&&r?.opponent!==fixture(w).opponent)return build('旧赛程的一场，照实接着记。','原赛程比赛后 · 记录台','coach',[scoreLine(s),`这场对${r.opponent}的比赛来自此前保留的赛程，按原对手和实际结果记入第二季；青年对抗样本只认对应的青年队比赛。`,w===24?`第二季收官：「${summary(s).ending.title}」。${summary(s).ending.text}`:'教练保留完整比赛档案，下一周再按新赛程准备。','把眼前这场留下的功课带进训练，不补一场并未打过的青年对抗。'],[opt('和队友复盘接应路线','默契 +2','你和林野把能确认的处理球问题留下，再和顾言讨论下一周的分工。',{bond:2}),opt('核对真实数据，再定下周任务','信任 +2','许知夏保留原赛程的对手与比分，教练按实际比赛给出训练建议。',{trust:2}),opt('先恢复，按新赛程准备下一场','体力 +4','你收好比赛档案，按计划恢复，等下一次真正走上球场。',{energy:4})]);
if(id==='w13-pre')return build('第二本训练册，先翻旧页。','第二赛季开训 · 录像室','coach',[
first?`第一赛季收官是「${first.ending.title}」：${first.wins} 胜 ${first.draws} 平 ${first.losses} 负，实际 ${first.stats.assists} 次助攻、平均评价 ${first.average}。周教练把原册留好，新一季另开一页。`:'第一赛季没有完整的剧情收官档案。周教练保留已有比赛，不替你补选旧对白：「从现在这本开始记。」',
first?.ending.key==='together'?'林野把旧接应纸铺开：「以前认得你的手，现在还得认得防守。」顾言准备把第二侧的出球交给你们。':first?.ending.key==='voice'?'顾言还记得你接过决定的那一声：「现在别人也会研究你。让队友参与决定，才撑得住更快的比赛。」':'林野没有要求你先证明上一季不算数。他把球放在两人中间：「先打出一个能重复的配合。」',
'新赛季先打校际交流，再迎来江州发展队和海岳青年队。两支地区青年梯队会提供高水平交流与选材观察，胜负和个人表现都必须在球场上打出来。',
'周教练在远处写下 CBA、NBA：「想去更大的联赛，就先学会在更快的防守里做决定。青年队试训，是这一季能争取的下一步。」'],common);
if(id==='w13-post')return build('开门的第一球，算到下一次。','南港赛后 · 录像室','coach',[scoreLine(s),lastBall(s),first?`上一季平均评价 ${first.average}，这场 ${r.grade}。教练把两季分开记：「一场好坏都不能替十二周下结论。」`:'上一季收官档案缺失，这场单独记入第二季，旧记录仍然保留。','林野按住录像进度：「我们先选一个下周能练的东西。」'],[
opt('把接应路线拆成接球前后两步','默契 +2','你和林野先走接球前的拉开，再走传球后的切入。顾言把两步分开，不让一次漂亮出手遮住中间的停顿。',{bond:2}),opt('从自己最容易丢球的位置查起','信任 +2','你把压力最大的停球位置圈出来。教练让你下周把出口练熟，再逐步提速。',{trust:2}),opt('保留这场，先恢复再加量','体力 +4','你保存了完整记录，按计划恢复。下一场的功课留在训练册首页。',{energy:4})]);
if(id==='w14-pre')return build('挡住人以后，路往哪边开？','北辰赛前 · 挡拆训练','lin',[
'林野以前总想抢第一步，这次却站到你防守人的侧面，试着先替你挡一次。顾言要求掩护站稳，别一边横移一边追人。',
choice(s,'w2-extra')===0?'你们还认得第二周的举手信号。林野又补了一个手势，表示准备拆开接球。':choice(s,'w2-extra')===1?'你们以前一起认过跑早和传晚。这次林野先问：「我拆的时候，你还看得见吗？」':'你们重新约定挡拆后的接应，不把没留下的旧暗号当作前提。',
'对手换防时可以找错位，夹击持球人时顺下或弱侧会出现窗口；如果防守退得很深，也可以选择空位出手。教练让你把本周重点说清楚。'],[
common[0],opt('利用退防距离，承担空位终结','本周目标：至少得到 4 分 · 信任 +1','林野答应先站稳掩护，你答应看清距离后再起跳。得分目标必须靠实战出手兑现，回应本身不加得分。',{trust:1},point(4)),common[2]]);
if(id==='w14-extra')return build('别急着拆，等他撞上选择。','第一次训练后 · 两人挡拆','lin',[
'你和林野把一次挡拆慢走了三遍。他一挡完就跑，防守人还没绕过来，传球窗口已经被自己关上。','「我以前总怕跑慢了接不到球。」林野停在罚球线旁，「原来有时候，要等防守先做决定。」','你要给他一个能带进比赛的提醒。'],[
opt('叫一声“等”，再看顺下与外弹','默契 +3','你们约定先用声音确认，再根据站位拆开。林野把“先看防守”写在自己的号码旁。',{bond:3}),opt('交换角色，我来给你做掩护','默契 +2 · 体力 -2','轮到你站稳时，才感到他接球的角度有多窄。两个人把问题讲成站位，没讲成谁欠谁一次球。',{bond:2,energy:-2}),opt('请顾言加一个弱侧接应点','信任 +2','顾言站到侧翼，把被夹击时的出口跑给你们看：「挡拆从来不只两个人。」',{trust:2})]);
if(id==='w14-post')return build('配合看第二次，才知道是不是会了。','北辰赛后 · 边线','lin',[scoreLine(s),`本场实际 ${r.stats.assists} 次助攻、${r.stats.turnovers} 次失误。${r.stats.assists>=2?'林野指着助攻记录，愿意接着检验两人的接应。':'林野没有说“已经练成”，把下次接球角度画在记录旁。'}`,choice(s,'w14-extra')===1?'交换过掩护角色后，你们知道对方等待的时间也算配合。':choice(s,'w14-extra')===2?'顾言提醒你们，弱侧出口有没有真正被看见，还要回到场上验证。':choice(s,'w14-extra')===0?'那个“等”字留在纸上，下一次仍要看防守什么时候移动。':'训练后没有留下额外约定，就从实际比赛记录开始复盘。','林野把明德的名字写到下一页。'],[
opt('把成功的传球和失误一起保留','默契 +2','你没有只截最好看的一次。林野也把自己没跑到的位置补上，两人带着完整问题继续练。',{bond:2}),opt('下次给林野一次组织的机会','默契 +2 · 信任 +1','顾言同意训练时轮换持球职责。球权不是奖励，是让两个人都学会读防守。',{bond:2,trust:1}),opt('先把掩护后的脚步练稳','信任 +2','你把练习重点收窄到站位和拆开的时机，不把一次命中当作所有细节都正确。',{trust:2})]);
if(id==='w15-pre')return build('远方不是报名表上的两个字。','明德赛前 · 发展说明会','coach',[
'周教练带来江州青年发展中心的观察表：位置能力、比赛评价、实际贡献、目标兑现和青年对抗，一栏也没有写“主角”。','「国内可以争取青年队培养机会，继续朝 CBA 走；海外准备还要面对语言、学习和更高强度比赛，NBA 更在远处。」他把表留在桌面。',`${s.player.age} 岁的你仍在高中阶段。这一季争取的是青年训练与试训机会，之后才可能谈青年队席位、职业轮换和更大的联赛。`,'先把对明德的场上目标写好。完成一次周安排后，再和教练谈你想准备的发展方向。'],common);
if(id==='w15-extra')return build('把 CBA、NBA 写成每天要做的事。','第一次训练后 · 教练办公室','coach',[
'教练没有递合同，只递来三份准备清单。林野想争取国内青训机会，顾言则想先把自己在校队的职责练扎实。你不必和他们走成同一条线。','国内方向重视梯队对抗与完整比赛档案；海外准备还需要学习与沟通。两条路的基础都一样：能力、判断、身体和能核对的比赛。','这次选的是准备方向，试训推荐仍由同一套实战标准决定。'],[
opt('先争取国内青训，再向 CBA 走','选择国内青训方向 · 信任 +1','你把青年队试训写在近期目标里，把 CBA 写在更远的一栏。教练让你先拿出稳定的比赛档案。',{trust:1}),opt('准备海外发展，把 NBA 当长期目标','选择海外发展准备 · 信任 +1','你把海外发展和 NBA 写在远期页，旁边补上学习、语言和高水平对抗。眼前先争取青年队试训，之后才有更具体的选择。',{trust:1}),opt('先补能力，保留国内与海外两种可能','选择双线评估 · 信任 +1','你先列出需要补齐的能力，不急着替尚未到来的选择作决定。教练把两份清单都留下。',{trust:1})]);
if(id==='w15-post')return build('准备方向，得由场上的记录支撑。','明德赛后 · 球员档案桌','manager',[scoreLine(s),`你的准备方向：${d.route}。第二季已打 ${a.played} 场，平均评价 ${a.average}，已兑现 ${a.achieved} / ${a.goals} 项赛前目标。`,'许知夏把场上记录夹在发展清单后面：「写下目标很快，证明自己要一场场来。」','林野没有问你的远方是不是和他相同，只问下周对临川愿意一起研究哪一段。'],[
opt('和林野先看临川的夹击位置','默契 +2','你把个人方向收回档案，拿出下一场的战术纸。不同的远方，仍要先打好同一场球。',{bond:2}),opt('请顾言指出最该补的一个短板','信任 +2','顾言从你的位置职责说起，没有替你作职业承诺。你把建议放进下周训练。',{trust:2}),opt('给训练、学习与恢复留出固定时间','体力 +4','许知夏把三项安排标清楚，让远期目标有可以坚持的日常。',{energy:4})]);
if(id==='w16-pre')return build('这一次，你也在对手的研究本里。','再战临川 · 热身前','rival',[rivalLine(s),
'周砚的本子多了江岚的接应图。他说自己正在练挡拆后的二次判断，不准备只凭速度冲第一道防守。',choice(s,'w10-extra')===0?'你曾从公开训练带回过一个问题。这次，周砚也把你们画进了他的研究本。':choice(s,'w10-extra')===1?'你和林野曾一同走过接应角度。现在，周砚正站在那条熟悉的线路上。':choice(s,'w10-extra')===2?'你们约过“不放水，也继续交流”。周砚先碰拳，再把本子收回临川那一侧。':'第一次公开训练后的约定没有留下回应，你们从已经记录的交手开始研究。',
'林野发现你们熟悉的一条传球线被预先站住。顾言提醒：被研究说明旧办法需要变化，传切、弱侧接应和篮板后的反击都可能成为新出口。','周砚回到临川一侧，等你用这一场给出答案。'],common);
if(id==='w16-post')return build('对手变快，你也得换一个问题。','临川赛后 · 球场出口','rival',[scoreLine(s),rivalLine(s,16),`周砚先看本场 ${r.stats.assists} 次助攻和 ${r.stats.turnovers} 次失误：「我想堵住的那条线，你下次会怎么处理？」他没有把输赢说成天赋的判决。`,'林野站在你身旁，等你先说自己的判断。'],[
opt('聊清阅读思路，保留下一场的变化','默契 +2','你们交流如何看协防脚步，没有交换各自球队下一场的战术部署。林野第一次主动问起第二侧接应。',{bond:2}),opt('承认一处被限制，回去练新出口','信任 +2','你把能确认的处理球问题写下来。周砚合上本子，认真约了下一次交手。',{trust:2}),opt('先回到江岚，和队长一起复盘','体力 +3 · 信任 +1','你谢过对手，回头跟上队友。顾言等大家坐齐，才打开比赛记录。',{energy:3,trust:1})]);
if(id==='w17-pre')return build('篮板落下前，反击已经开始。','青禾赛前 · 卡位与出口训练','captain',[
'顾言把一次防守拆成三段：挡住第一步、找到对位、拿球后看出口。林野已经跑向前场，却被叫回来：「球没拿到，谁给你传？」',
s.player.role==='big'?'你在篮下承担更多卡位。教练提醒你，防守篮板后先接稳，进攻篮板后也不必急着顶人补篮。':s.player.role==='guard'?'你从外线回收长篮板，也要在队友拿球后成为第一个安全出口。': '你站在侧翼，既能冲长篮板，也要判断什么时候该留在退防路线。',
'实战里，投丢后继续争板，拿到防守篮板就能推进或长传；篮板没有清空前，别提前庆祝下一攻。'],[common[0],common[1],opt('把第二次机会转成有效终结','本周目标：至少得到 4 分 · 信任 +1','你答应在抢板后先看空间，再选择补篮或传球。所有得分仍必须在连续实战里完成。',{trust:1},point(4))]);
if(id==='w17-post')return build('有些进攻，是从背对篮筐开始的。','青禾赛后 · 篮下','captain',[scoreLine(s),`本场实际 ${r.stats.rebounds} 个篮板、${r.stats.points} 分。顾言提醒，统计能确认拿下几次球，却不能凭空证明每一次卡位都正确。`,promiseLine(s,14),'林野拿起球，先问下一次谁负责出口，不再只喊自己先跑。'],[
opt('让林野先接出口，我补第二条线','默契 +3','你们在训练中分配第一和第二接应点。顾言站到后面，留意失误后的保护。',{bond:3}),opt('我先争板，请顾言提醒退防人数','信任 +2','你把篮板职责说具体，也把冒险冲板后需要的保护说出来。',{trust:2}),opt('先恢复，再逐项检查篮板后的处理','体力 +4','你没有加一组疲劳争抢，把复盘留给完整训练时段。',{energy:4})]);
if(id==='w18-pre')return build('半程，先说自己能做什么。','南港赛前 · 半程会议','coach',[
`第二季前半程已记录 ${a.played} 场，${a.wins} 胜 ${a.draws} 平 ${a.losses} 负，平均评价 ${a.average}；兑现 ${a.achieved} / ${a.goals} 项目标。`,
first?`第一季「${first.ending.title}」仍在纪念册里。周教练没有拿旧结语替这一季评分，而是把现在的训练和比赛放在一起看。`:'第一季没有完整结语，教练从现有档案开始比较，不补一个并未发生的转折。',
captainThread(s),
'下周江州发展队来交流。观察者要看位置职责和连续判断，校际赛的高分也不等于已经适应青年对抗。','顾言想让你在半程会议上先定一项能被检验的任务。'],common);
if(id==='w18-extra')return build('队长把暂停板转向了你。','第一次训练后 · 半场站位','captain',[
'顾言让你讲一次停球后的接应。林野先站错了位置，顾言伸手想提醒，又把手收回来，等你说明理由。',`到目前为止，你已兑现 ${a.achieved} 项第二季目标。${a.achieved>=2?'顾言愿意再交出一点职责，但没有要求你替所有人决定。':'顾言把任务缩小到一个明确的接应点，让承担从能做到的地方开始。'}`,
'「我也得练放手。」他把笔留下，「但你可以问我，不需要装成什么都知道。」'],[
opt('先听林野的看法，再定接应点','默契 +3','你先让队友讲看到的防守，再把出口叫清楚。顾言记下的是讨论过程，没急着更换谁的身份。',{bond:3}),opt('讲清自己的方案，请队长纠正盲区','信任 +2','你把话说完整，也把不确定的地方指出。顾言补上保护路线，让你带着修正再走一遍。',{trust:2}),opt('只负责这一组，先把小任务做稳','信任 +1 · 体力 +2','顾言同意按组轮换职责。你不用一天变成队长，但得对自己接下的任务负责。',{trust:1,energy:2})]);
if(id==='w18-post')return build('一半的赛程，带得走的是什么？','半程赛后 · 录像室','coach',[scoreLine(s),`半程档案：${a.played} 场，平均评价 ${a.average}，${a.stats.points} 分、${a.stats.assists} 助攻、${a.stats.rebounds} 篮板。`,choice(s,'w18-extra')===0?'林野先说了自己的视角，顾言等你把讨论收拢。':choice(s,'w18-extra')===1?'顾言把你指出的不确定处留下，准备在青年对抗里继续验证。':choice(s,'w18-extra')===2?'你接下的小任务也留在记录里，下一次能否重复，比讲话长短更重要。':'没有留下额外战术会议回应，教练从本场记录开始分配下周任务。','下周换一个级别的对手。教练让你先带上自己的位置职责。'],[
opt('带上配合记录，接受更快的防守','默契 +2','你和林野把接应写成两种可能，不期待青年队也照原来的节奏防。',{bond:2}),opt('带上短板清单，先把球处理稳','信任 +2','你没有删掉失误和未达标目标，把完整档案带进下一次训练。',{trust:2}),opt('降低额外加练量，留足恢复','体力 +4','你把强度留给正式训练和比赛，不在上场前用疲劳证明决心。',{energy:4})]);
if(id==='w19-pre')return build('球还在你手里，空间已经小了。','江州发展队交流 · 青年训练馆','coach',[
'江州发展队来自江州青年发展中心。这场交流的表现将进入观察档案；教练让你先打好每次攻防，不急着谈职业合同。',
'对手收缩和回位更快。林野的空切需要更早看见，顾言要求被夹击时别等停球才找出口。拿到防守篮板后，反击也要先看接应是否真的跑出来。',
`你的位置核心能力均值为 ${d.core}。${d.focusText}`,'周教练只给一句要求：「先证明你在这个速度下，还能做对自己的事。」'],common);
if(id==='w19-post')return build('观察表，先记这一场。','青年交流赛后 · 记录台','coach',[scoreLine(s),`本场评价 ${r.grade}。青年对抗记录从实际比赛建立；当前试训推荐共有 ${d.checks.filter(c=>c.met).length} / ${d.checks.length} 项达标。`,r.grade>=60?'观察员保留了你的比赛档案，准备继续看稳定性。林野说，下一次得把相同的判断再做出来。':'观察员留下待改进项目，没有给这一场贴上职业潜力结论。顾言把短板圈小，让你有能练的起点。','发展中心会继续观察第二季后半段。下一场临川，周砚也带了新课题。'],[
opt('和林野练更早的接应，不盲目提速','默契 +3','你们先把接球角度走对，再逐步提高速度。更快是训练结果，不是多按一次传球。',{bond:3}),opt('把位置短板列进下周训练','信任 +2','你按位置核心能力检查训练安排，让青年队交流留下具体功课。',{trust:2}),opt('保存完整记录，先恢复体力','体力 +4','许知夏把本场观察记录和全部统计一起留下，没有剪成只有高光的片段。',{energy:4})]);
if(id==='w20-pre')return build('周砚也不想只当熟悉的对手。','临川战术复测 · 热身区','rival',[rivalLine(s),
'周砚说自己也在争取青年训练机会。他没有得到任何保证，正在练被夹击后的出球，也要面对自己习惯路线被封住的时刻。',
choice(s,'w16-post')===0?'你们上次聊过阅读思路，这次各自保留了新的变化。林野说，真正听懂了，就要在防守里再认一遍。':choice(s,'w16-post')===1?'周砚记得你承认过被限制的处理球问题：「这次，我还是会认真堵那条线。」':choice(s,'w16-post')===2?'你上次先回到江岚复盘。周砚把问候留在场边，等比赛检验你们准备的新出口。':'上次没有留下赛后交流的回应，你们把话题放回眼前这次对抗。',
'顾言把这场当作复测：面对熟悉你的人，你能不能用新的方法把球打起来。'],common);
if(id==='w20-post')return build('越想去远方，越不能省掉这一场。','临川复测赛后 · 场边','rival',[scoreLine(s),rivalLine(s,20),promiseLine(s,16),'周砚问起你的准备方向。你说了自己的计划，也问他哪一个处理球问题还没解决。你们的关系从只想赢过对方，走向愿意互相检验；比分仍如实记下。'],[
opt('约下一次交流，正式比赛各自争胜','默契 +2','周砚答应交流公开的练习方法。林野补上一句：「下一场我们也不会让。」三个人都笑了。',{bond:2}),opt('把这一场和第十六周并排复盘','信任 +2','你保留两场完整数据，不用较好的一次抹掉较差的一次。顾言等你先提出一个能练的差别。',{trust:2}),opt('先回队整理青年对抗的准备','体力 +3 · 信任 +1','你收好临川这一页，和队友确认下一场各自的职责。',{energy:3,trust:1})]);
if(id==='w21-pre')return build('弱侧没拿球，也在改变这一攻。','海岳青年队交流 · 战术板前','captain',[
'海岳青年队的防守会提前收缩。顾言指着无球一侧：有人切入，另一个人就得补到安全出口；有人冲篮板，就得有人先退。',
choice(s,'w14-extra')===1?'林野记得你们交换过掩护角色。这次他主动问，自己持球时你希望从哪里接到回传。':'林野开始练持球之外的任务，主动确认空切以后谁来接应下一次传球。',
'实战中可以传给接应队友、自己跑位再要回传，也可以站稳掩护后顺下；投丢后这一攻仍然继续。','顾言把组织第二侧的职责交给你，自己也进入跑位。'],[common[0],common[1],opt('把弱侧空位转成实际终结','本周目标：至少得到 6 分 · 信任 +1','你约好先移动出接球角度，再承担空位投篮。能否达标由本场真实得分决定。',{trust:1},point(6))]);
if(id==='w21-post')return build('球不在手里，名字仍在这场球里。','海岳交流赛后 · 录像室','captain',[scoreLine(s),lastBall(s),`顾言请你先讲第二侧的处理，再对照本场 ${r.stats.assists} 次助攻、${r.stats.rebounds} 个篮板。他让你把接球前后的脚步重新走一遍，找出下一次还能怎样提供出口。`,'林野把持球和无球的箭头画在同一张纸上，等你决定下一次练哪一边。'],[
opt('轮换持球职责，让两边都能接上','默契 +3','你们把组织分成第一和第二侧，避免每次停球都只剩顾言一个出口。',{bond:3}),opt('挑一段无球路线，训练时验证','信任 +2','你把无球路线的问题写清楚，和队友换位体验一次，再把修正带回下一场。',{trust:2}),opt('先恢复，把完整档案留给观察员','体力 +4','你没有用一球总结整场，许知夏把出手、失误和青年对抗评价一并保存。',{energy:4})]);
if(id==='w22-pre')return build('同一套防守，现在由你先叫。','北辰赛前 · 分组训练','captain',[
'顾言仍然戴着队长袖标，却不再替每个人抢着回答。他让你先说这组人投丢后怎样退、拿板后怎样出球。',
`第二季已兑现 ${a.achieved} / ${a.goals} 项目标。${a.achieved>=4?'他愿意把一部分战术提醒交给你，也要求你听见队友的反馈。':'他让你先负责一项能检查的小任务，别为了显得成熟把所有事都揽走。'}`,
'林野想先持球发起。你们要决定的是怎么帮助彼此，而不是谁配当唯一主角。','周末还有一次公开训练交流，周砚也会来。先把对北辰的任务写清楚。'],common);
if(id==='w22-extra')return build('三个人，三条路，同一个防守问题。','第一次训练后 · 公开训练交流','rival',[
'周砚在公开练习里做持球人，林野试着给他挡拆，你站到弱侧。顾言拿着战术板，看三个人如何面对夹击。练习不计入正式比赛统计。',
`你目前选择「${d.route}」。林野仍想争取国内青训，周砚也要接受他那边的训练评估。没有谁已经拿到职业席位。`,
'顾言让你提一个问题，把交流带回下周的观察赛。'],[
opt('夹击来了，谁先提供安全出口？','默契 +3','你们轮换站位，分别体验持球、掩护和弱侧接应。周砚把“先出现出口”记在自己的练习本里。',{bond:3}),opt('面对更强身体，怎样接稳第一下？','信任 +2','顾言先示范接球前找角度，再让你们在可控强度里轮换。你把力量、护球和接应一起列进训练。',{trust:2}),opt('投丢以后，怎样分清冲板和退防？','信任 +1 · 默契 +2','林野不再只画一根向篮下的箭头。周砚补上出口，你把留后保护圈出来。',{trust:1,bond:2})]);
if(id==='w22-post')return build('交出来的是职责，不是所有答案。','北辰赛后 · 集合圈','captain',[scoreLine(s),`顾言把本场评价 ${r.grade} 和赛前目标放在一起。${r.grade>=60?'「这一次可以继续交给你。下次也要听队友怎么说。」':'「这一组先复盘，再来。承担不是答应以后不再犯错。」'}`,choice(s,'w22-extra')===0?'你们公开训练时问过安全出口，这个问题将带进观察赛。':choice(s,'w22-extra')===1?'你们练过接稳第一下，教练要求观察赛里继续看接球前的角度。':choice(s,'w22-extra')===2?'你们把冲板和退防分工留在纸上，下一场要看球落下后怎么执行。':'公开训练交流没有留下回应，球队从现有比赛档案准备观察赛。','许知夏把第二季档案的最后两页留出来。'],[
opt('把林野和顾言的提醒写进比赛准备','默契 +3','你让每个人只提一条最重要的提醒，再把自己的职责写在旁边。',{bond:3}),opt('逐项核对试训推荐要求','信任 +2','你打开发展档案，明确哪些数字达标、哪些仍差一点。教练没有提前替观察员写邀请。',{trust:2}),opt('按计划恢复，别在观察赛前透支','体力 +4','你按时收球，把剩下的劲留给训练和正式比赛。',{energy:4})]);
if(id==='w23-pre')return build('观察席上有人，球场还是同一块。','江州发展队 · 青训观察赛','coach',[
`当前推荐进度 ${d.checks.filter(c=>c.met).length} / ${d.checks.length} 项：第二季 ${a.played} 场、平均评价 ${a.average}，已完成 ${a.achieved} 项目标。具体差距可在发展档案逐项查看。`,
'观察员希望看到稳定的位置职责和连续判断。个人贡献可以通过得分、助攻或篮板体现；没有要求每一种起步类型都成为同一个球员。',
choice(s,'w15-extra')===1?'你在远期页写过 NBA。教练提醒，海外准备也要建立在今天能核对的表现上，不能跳过青年阶段。':choice(s,'w15-extra')===0?'你把 CBA 当作远期目标，眼前这一步仍是青年队试训推荐，不是职业注册。':'你保留着发展方向的选择权，眼前先把自己在青年对抗里的表现打出来。',
'林野帮你把背心拉平，顾言只问：「第一攻，我们怎么接？」'],common);
if(id==='w23-post')return build('观察不会在一声哨后结束。','观察赛后 · 档案桌','coach',[scoreLine(s),`本场评价 ${r.grade}；当前状态：${d.title}。${d.checks.filter(c=>!c.met).length?'还未达标的要求会在发展档案中继续显示。':'七项标准当前均已达到，仍需收官确认并接受后续试训评估。'}`,
'观察员留下一句要求：带上完整赛季记录，不删失误，不补不存在的高光。下周海岳青年队收官，对手和你一样想把这一场打好。','林野和顾言等你一起回到训练场。'],[
opt('先和队友核对最后一场的分工','默契 +3','你没有把收官变成个人数据任务，先确认接应、冲板和退防。',{bond:3}),opt('按未达标项安排最后一周训练','信任 +2','你把发展档案的差距转成三项周安排，是否达标还要看训练后的能力与实际比赛。',{trust:2}),opt('保持节奏，恢复后准备收官','体力 +4','你按时收好档案，不在紧张时临时加满所有训练。',{energy:4})]);
if(id==='w24-pre')return build('名字写在门外，球还得自己打。','第二季收官 · 海岳青年队赛前','coach',[
`赛前记录 ${a.played} 场：${a.wins} 胜 ${a.draws} 平 ${a.losses} 负；当前 ${d.title}。最后一场的结果和目标尚未结算。`,
first?`你们从第一季「${first.ending.title}」走到这里。林野学着在持球之外提供接应，顾言学着把职责交给别人，周砚也在自己的球队继续接受竞争。`:'你们从保存下来的比赛走到这里。旧选择缺失的部分留白，今天的配合和决定仍由你完成。',
'周教练把 CBA 和 NBA 留在远期页，把青年队试训放在眼前。若达标，获得试训邀请；差一点，保留观察；基础仍需补齐，就继续从校队练起。',
'林野举起手，顾言站到弱侧。没人替你写最后一个回合。'],common);
if(id==='w24-post'){const end=summary(s);return build('这一季结束，下一站更靠近篮球。','收官后 · 青年训练馆门口','coach',[scoreLine(s),`第二季实际 ${a.played} 场，${a.wins} 胜 ${a.draws} 平 ${a.losses} 负；${a.stats.points} 分、${a.stats.assists} 助攻、${a.stats.rebounds} 篮板，兑现 ${a.achieved} / ${a.goals} 项目标。`,
`收官结果：「${end.ending.title}」。${end.ending.text}`,
`你的准备方向是「${d.route}」。下一阶段先面对青年训练和试训评估，再逐步争取职业机会；想走到 CBA、NBA，还需要后续更长的训练、竞争和评估。`,
relations(s).map(x=>`${x.name}：${x.state}。`).join(''),
'林野把球递来，顾言替你合好训练册。周砚发来他那边还在准备训练的消息。你要给这一季留下一句能继续练的话。'],[
opt('把下一站写进训练计划，也记住接应的人','默契 +3 · 收录第二季收官','你把发展档案和队友的名字留在同一册里。门外更大的球场，不会让你忘记先看清身边的接应。',{bond:3}),opt('保留没达标的项目，逐项练到能被核对','信任 +2 · 收录第二季收官','你没有替未来提前签字。教练把下一阶段的空页留下，等新的训练和比赛真正发生。',{trust:2}),opt('先恢复，再和大家按时回到球场','体力 +4 · 收录第二季收官','你和队友一起离开训练馆，带走完整的记录，也带走下一次准时集合的约定。',{energy:4})]);}
return null;
}
return {chapters,extras,ids,fixture,dossier,relations,summary,scene};
});
