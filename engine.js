/* 下一站 巨星 — pure, seeded career simulation; no DOM or network. */
(function (root, factory) {
  const api = factory(typeof module === 'object' && module.exports ? require('./story.js') : root.GreatnessStory, typeof module === 'object' && module.exports ? require('./growth.js') : root.HoopsGrowth, typeof module === 'object' && module.exports ? require('./career-league.js') : root.HoopsLeague);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Hoops = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Story, Growth, League) {
  'use strict';
  const VERSION = 1;
  const attrs = { shot: '投篮', drive: '突破', pass: '传球', handle: '控球', rebound: '篮板', defense: '防守', body: '对抗', stamina: '体能' };
  const roles = {
    guard: { name: '灵巧后卫', en: 'PLAYMAKER', short: '后卫', height: 171, ceiling: 184, text: '用节奏撕开防线，让球找到对的人。', plus: '控球 · 传球', minus: '身体对抗偏弱', stats: [51, 58, 66, 68, 34, 48, 37, 56] },
    wing: { name: '得分侧翼', en: 'ALL-AROUND SCORER', short: '侧翼', height: 178, ceiling: 194, text: '能突，也能投。成为球队需要的得分点。', plus: '突破 · 投篮', minus: '组织与协防一般', stats: [62, 64, 43, 53, 47, 44, 51, 54] },
    big: { name: '潜力内线', en: 'PAINT PROTECTOR', short: '内线', height: 185, ceiling: 206, text: '守住篮下，每一次起跳都为球队多争一球。', plus: '篮板 · 护筐', minus: '运球与远投偏弱', stats: [37, 40, 43, 32, 69, 65, 65, 50] }
  };
  const origins = {
    street: { name: '街头野球', text: '敢打敢变，擅长临场突破。', bonus: { drive: 4, handle: 3 }, dialogue: '野球场教会你相信本能。今天，你想试试让这份本能融入一支球队。', trait: '街头节奏' },
    school: { name: '校队基础', text: '懂配合，对团队战术更熟悉。', bonus: { pass: 4, defense: 3 }, dialogue: '熟悉的哨声让你安心。但到了高中，一切都得重新赢得。', trait: '战术意识' },
    fresh: { name: '刚接触系统训练', text: '体能充沛，愿意从基本功学起。', bonus: { stamina: 4, body: 3 }, dialogue: '这是你第一次参加正式选拔。你把鞋带系紧，认真听清教练的每一句话。', trait: '训练热忱' }
  };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function rng(s) { s.seed = (Math.imul(s.seed, 1664525) + 1013904223) >>> 0; return s.seed / 4294967296; }
  function create({ name, number, role, origin, seed, careerMode }) {
    name = String(name || '').trim();
    if (!name || Array.from(name).length > 10) throw Error('姓名请填写 1–10 个字。');
    if (!Number.isInteger(Number(number)) || Number(number) < 0 || Number(number) > 99 || String(number).trim() === '') throw Error('球衣号码请填写 0–99 的整数。');
    if (!Object.hasOwn(roles, role) || !Object.hasOwn(origins, origin)) throw Error('请选择起步类型和篮球经历。');
    const a = Object.fromEntries(Object.keys(attrs).map((k, i) => [k, roles[role].stats[i]]));
    Object.entries(origins[origin].bonus).forEach(([k, v]) => a[k] += v);
    const state = { story: Story.init(1), version: VERSION, seed: (seed === undefined ? Date.now() : seed) >>> 0, stage: 'arrival', player: { name, number: Number(number), role, origin, age: 15, height: roles[role].height, attrs: a }, week: 1, energy: 90, trust: 40, bond: 30, training: [], lastTraining: '', diary: [], album: [], matches: [], match: null, placement: null, totals: { points: 0, assists: 0, rebounds: 0, steals: 0, blocks: 0 }, lastReport: null };
    if(["growth","career"].includes(careerMode))Growth.init(state);if(careerMode==="career")League.init(state);return state;
  }
  function introduction(s, choice) {
    if (s.stage !== 'arrival' || ![0, 1, 2].includes(choice)) return false;
    const messages = [
      '你拍了拍手示意要球。林野犹豫一秒，把球传了过来。「行，下个回合看你的。」你们终于有了第一次交流。',
      '你转身站稳，为林野挡住追防。他趁机切入，回头朝你点了一下头。没有得分入账，但你们开始像队友了。',
      '你跑向弱侧底角，把防守人带走。林野的突破路线宽了起来。教练抬头，记下了你的跑位。'
    ];
    s.bond += [2, 8, 5][choice]; s.trust += [1, 3, 3][choice];
    s.introChoice = choice; s.introText = messages[choice]; s.stage = 'introFeedback'; return true;
  }
  function begin(s, kind = 'tryout') {
    if(s.career&&['weekly','trial','assessment'].includes(kind))return beginCareer(s,kind==='weekly'?'official':kind,arguments[2]);
    if (!['tryout', 'weekly'].includes(kind)) return false;
    if ((kind === 'tryout' && s.stage !== 'introFeedback') || (kind === 'weekly' && s.stage !== 'home')) return false;
    const fixture=kind==='weekly'?(s.growth?Growth.fixture(s):Story.fixture(s.week,s)):null;
    const opponent = kind === 'tryout' ? '蓝队' : fixture.opponent;
    const mine = kind === 'tryout' ? 2 : 30 + Math.floor(rng(s) * 10);
    s.match = { kind, opponent,...(fixture?.program?{competition:fixture}:{}), minutes: kind === 'tryout' ? 5 : fixture?.minutes??(fixture?.program==='trial'?10:fixture?.program==='academy'?14:{ rotation: 18, bench: 10, observe: 5 }[s.placement]), turn: 0, score: [mine, mine], records: [], feedback: null, stats: { points: 0, assists: 0, rebounds: 0, steals: 0, blocks: 0, turnovers: 0, fouls: 0, made: 0, attempts: 0 }, quality: 0, team: 0, performance: 0, complete: false };
    if(s.growth)s.match.growthMode=true;
    s.stage = 'match'; prepare(s); return true;
  }
  const action = (title, hint, skill, q, team, p, type, val = 0) => ({ title, hint, skill, q, team, p, type, val });
  function scene(s){const sc=sceneRaw(s),name=s.match?.competition?.teammates?.[1];if(!name||name==='林野')return sc;const replace=x=>typeof x==='string'?x.replaceAll('林野',name):x;return {...sc,title:replace(sc.title),text:replace(sc.text),tip:replace(sc.tip),options:sc.options.map(a=>({...a,title:replace(a.title),hint:replace(a.hint)}))};}
  function sceneRaw(s) {
    if(s.match.feedback){const f=s.match.feedback;return f.context?{...f.context,options:[]}:{title:'本回合已结束',tag:['阅读防守','无球配合','防守考验','最后一攻'][s.match.turn],text:'这一回合的动作已经完成。查看实际表现，再继续比赛。',tip:'每个回合只结算一次。',options:[]};}
    const r = s.player.role, t = s.match.turn;
    if (t === 0) {
      if (r === 'guard') return { title: '防守收缩，机会在外线', tag: '阅读防守', text: '你在弧顶接球。防守人后退一步封突破，右侧队友借掩护跑出了空位。你有出手空间，也有一条清楚的传球路线。', tip: '看见空位，也是能力的一部分。', options: [action('空位跳投', '把握已有空间 · 控制出手节奏', 'shot', 3, 1, .52, 'shot', 2), action('加速突破', '对方正在等你 · 失误风险较高', 'drive', 0, 0, .38, 'drive', 2), action('传给右侧空位', '让队友轻松出手 · 团队贡献高', 'pass', 3, 3, .78, 'assist', 2)] };
      if (r === 'wing') return { title: '防守扑上来，左侧露出空当', tag: '阅读防守', text: '你在侧翼接球，防守人正急着扑向你的投篮手。左侧突破路线敞开，篮下还有队友接应。', tip: '利用防守的重心，而不是与它硬碰。', options: [action('迎着封盖跳投', '两只手已到眼前 · 高难度出手', 'shot', 0, 0, .25, 'shot', 2), action('顺左侧突破', '抓住重心差 · 合理进攻', 'drive', 3, 1, .69, 'drive', 2), action('分球给篮下队友', '看见协防再传 · 团队配合', 'pass', 3, 3, .72, 'assist', 2)] };
      return { title: '低位接球，包夹正在靠近', tag: '阅读防守', text: '你在篮下要到位置，第二名防守人正在靠近。外线队友无人盯防；现在转身尚有机会，拖久了就会被围住。', tip: '内线的威胁，也能变成外线的机会。', options: [action('快速转身攻筐', '赶在包夹形成前 · 对抗考验', 'body', 2, 1, .65, 'shot', 2), action('顶着包夹强起', '两人封堵 · 命中与失误风险高', 'body', 0, 0, .26, 'drive', 2), action('回传外线空位', '破解包夹 · 创造轻松出手', 'pass', 3, 3, .77, 'assist', 2)] };
    }
    if (t === 1) return { title: r === 'big' ? '球在外线，你能做些什么？' : '没有球，也能改变这一回合', tag: '无球配合', text: r === 'big' ? '林野持球，盯防他的对手贴得很紧。你在罚球线附近，可以上提掩护，也可以利用身高寻找二次进攻。' : '林野再次拿球，这次他朝你看了一眼。你的防守人只顾着盯球，底角有空间；持球人也需要一道掩护。', tip: '掩护和跑位不会都记在技术统计里，但教练会看见。', options: [action('跑向空位接应', '拉开防守 · 接球后顺势出手', 'shot', r === 'big' ? 2 : 3, 2, r === 'big' ? .45 : .64, 'shot', 2), action('为林野做掩护', '站稳后再接触 · 为队友创造空间', 'body', 3, 4, .83, 'screen', 2), action('冲抢进攻篮板', '争取二次球 · 留意退防', 'rebound', r === 'big' ? 3 : 1, 2, r === 'big' ? .77 : .43, 'rebound')] };
    if (t === 2) return { title: r === 'big' ? '对方突破，篮筐在你身后' : '防守回合，守住你的选择', tag: '防守考验', text: r === 'big' ? '外线队友被过掉，对方正冲向篮筐。你在合理冲撞区外站稳了位置，但身后的对手也在等传球。' : '对方后卫在你面前运球，另一侧队友被一步突破。你可以守住自己的位置，也可以靠过去补防，但贸然伸手可能会犯规。', tip: '一次稳健的防守，不一定需要抢断或盖帽。', options: [action('稳住位置防守', '不轻易失位 · 最稳健的选择', 'defense', 3, 2, .76, 'defend'), action('协防保护篮下', '补上空缺 · 需要判断与对抗', 'defense', 3, 3, r === 'big' ? .8 : .60, 'help'), action('冒险伸手抢断', '成功即反击 · 失败可能赔上犯规', 'handle', 1, 0, .35, 'steal')] };
    const diff = s.match.score[0] - s.match.score[1];
    if (diff > 0) return { title: `领先 ${diff} 分，守住最后 9 秒`, tag: '最后一攻', text: '对手开始上前逼抢。你握着球，林野在侧面接应。领先的这一刻，保护球权也是一种帮助球队的方式。', tip: '领先时的耐心，与落后时的勇气一样重要。', options: [action('稳稳护球，消耗时间', '利用控球基本功 · 避免不必要出手', 'handle', 3, 2, .87, 'protect'), action('传给林野，转移球权', '避开逼抢 · 一起守住优势', 'pass', 3, 4, .88, 'protectPass'), action('继续强攻篮筐', '提前出手 · 需要承担额外风险', r === 'big' ? 'body' : 'drive', 1, 0, .6, 'drive', 2)] };
    const down = -diff;
    const title = down === 2 ? '落后两分，还剩最后 9 秒' : down === 0 ? '比分相同，还剩最后 9 秒' : `落后 ${down} 分，还剩最后 9 秒`;
    return { title, tag: '最后一攻', text: r === 'big' ? '你在禁区边缘接到球，身边有人贴防，底角的林野正举手要球。时间足够完成一次配合。' : '球到了你手上。篮下有一条突破路线，三分线外也能出手。林野借掩护跑向底角，这次，他在等你的传球。', tip: '最后一球决定比分，但不会独自决定你的未来。', options: [action(down === 2 ? '攻筐争取追平' : down < 2 ? '攻筐争取绝杀' : '攻筐追近比分', '两分机会 · 考验突破与终结', r === 'big' ? 'body' : 'drive', down >= 3 ? 1 : 3, 1, .63, 'drive', 2), action(down < 3 ? '三分绝杀' : down === 3 ? '三分争取追平' : '三分追近比分', r === 'big' ? '远投短板 · 风险很高' : '三分机会 · 也可能遗憾收场', 'shot', down >= 3 ? 3 : r === 'big' ? 0 : 2, 0, r === 'big' ? .16 : .36, 'shot', 3), action('为林野创造空位', '最后一次信任 · 队友三分机会', 'pass', 3, 4, .69, 'assist', 3)] };
  }
  function prepare(s) {
    if(s.match.league){s.match.simText=s.match.league.official?`全场 ${League.duration(s.career.tier)/60} 分钟，已模拟前段；接下来连续操作 ${s.match.league.manualSeconds/60} 分钟。`:'实操考核，不计入正式联赛统计。';return;}
    const m = s.match;
    // Other possessions are simulated once per transition, using the same score ledger.
    if (m.turn > 0 && m.turn < 3) {
      const a = 2 + 2 * Math.floor(rng(s) * 2), b = 2 + 2 * Math.floor(rng(s) * 2);
      m.score[0] += a; m.score[1] += b;
      m.simText = `其他回合快速模拟：我方 +${a}，对方 +${b}。`;
    } else if (m.turn === 3 && m.kind === 'tryout') {
      const target = Math.max(...m.score) + 2;
      const a = target - m.score[0], b = target + 2 - m.score[1];
      m.score = [target, target + 2];
      m.simText = `时间快进到最后 9 秒：我方 +${a}，对方 +${b}。现在落后两分。`;
    } else if (m.turn === 3) {
      const a = 2 + 2 * Math.floor(rng(s) * 2), b = 2 + 2 * Math.floor(rng(s) * 2);
      m.score[0] += a; m.score[1] += b;
      m.simText = `时间快进到最后 9 秒：我方 +${a}，对方 +${b}。此前每个回合的比分都保留。`;
    } else m.simText = m.kind === 'tryout' ? '选拔赛共 5 分钟。选择起手打法后，连续打完剩余比赛。' : '比赛进入下半场最后四分钟。进场后连续攻防，直到终场。';
  }
  const playModes = { shot:'shot', drive:'drive', assist:'pass', screen:'screen', rebound:'rebound', defend:'defense', help:'defense', steal:'defense', protect:'protect', protectPass:'pass' };
  function liveSeconds(m){if(m.league)return m.league.manualSeconds;if(m.growthMode&&m.kind==='weekly'&&m.turn===0)return Math.min(240,m.minutes*60);return (m.kind==='tryout'?[252,166,81,9]:[240,166,81,9])[m.turn];}
  function startPlay(s,index) {
    const m=s.match;
    if(s.stage!=='match'||!m||m.feedback||m.complete||![0,1,2].includes(index))return null;
    if(m.league&&m.league.manualSeconds===0)return null;
    if(m.play)return m.play.index===index?m.play:null;
    const a=scene(s).options[index];rng(s);
    m.play={id:`${s.week}-${m.kind}-${m.turn}-${s.seed}`,index,config:{mode:playModes[a.type],variant:a.type,seed:s.seed,skill:s.player.attrs[a.skill],energy:s.energy,bond:s.bond,stamina:s.player.attrs.stamina,number:s.player.number,role:s.player.role,points:a.val,decision:a.q,...(s.match.league?{opposition:s.match.league.opposition,teamName:s.match.league.teamName,teammates:[...s.match.league.teammates],...(s.match.league.official?{noDraw:true}:{})}:{}),...(s.growth?{attributes:{...s.player.attrs},perks:[...s.growth.equipped]}:{}),...(m.competition?{opposition:m.competition.opposition,teamName:m.competition.teamName,teammates:[...m.competition.teammates],...(m.competition.official?{noDraw:true}:{})}:!s.growth&&m.kind==='weekly'&&s.week>=13&&s.week<=24?{opposition:Story.fixture(s.week).opposition}:{}),liveMatch:true,matchSeconds:liveSeconds(m),baseScore:[...m.score],...(m.turn===3?{timeLimit:9}:{})},model:null};
    return m.play;
  }
  function checkpointPlay(s,id,model) {
    if(s.stage!=='match'||!s.match?.play||s.match.play.id!==id||s.match.feedback||!model||![1,2].includes(model.v)||model.config?.mode!==s.match.play.config.mode)return false;
    if(!['skill','energy','bond','stamina','number','role','seed','decision','points','variant','timeLimit','liveMatch','matchSeconds','opposition','teamName','noDraw'].every(k=>model.config[k]===s.match.play.config[k]))return false;
    if(JSON.stringify(model.config.teammates)!==JSON.stringify(s.match.play.config.teammates)||JSON.stringify(model.config.attributes)!==JSON.stringify(s.match.play.config.attributes)||JSON.stringify(model.config.perks)!==JSON.stringify(s.match.play.config.perks))return false;
    s.match.play.model=JSON.parse(JSON.stringify(model));return true;
  }
  function continuousValid(e){
    if(e.continuous===undefined)return true;
    const st=e.stats,keys=['points','assists','rebounds','steals','blocks','turnovers','fouls','made','attempts'];
    return e.continuous===true&&st&&keys.every(k=>Number.isInteger(st[k])&&st[k]>=0&&st[k]<=(e.liveMatch?1000:100))&&st.made<=st.attempts&&Number.isInteger(e.teamPoints)&&e.teamPoints>=0&&e.teamPoints<=(e.liveMatch?1000:3)&&Number.isInteger(e.opponentPoints)&&e.opponentPoints>=0&&e.opponentPoints<=(e.liveMatch?1000:2)&&st.points<=e.teamPoints&&Array.isArray(e.events)&&e.events.length<=(e.noDraw?20000:e.liveMatch?2000:150)&&e.events.every(x=>x&&typeof x.kind==='string'&&typeof x.text==='string'&&x.text.length<300&&['player','mate','loose','opponent'].includes(x.actor)&&Number.isFinite(x.t)&&x.t>=0&&x.t<=(e.noDraw?86400:e.liveMatch?1200:180));
  }
  function executionValid(e){return !!(e&&Object.values(playModes).includes(e.mode)&&typeof e.success==='boolean'&&Number.isFinite(e.score)&&e.score>=0&&e.score<=100&&typeof e.reason==='string'&&e.reason.length<1000&&['mate','player'].includes(e.finisher)&&typeof e.foul==='boolean'&&typeof e.turnover==='boolean'&&(e.points===undefined||[2,3].includes(e.points))&&(e.defensive===undefined||['steal','block','stop'].includes(e.defensive))&&(e.decision===undefined||Number.isInteger(e.decision)&&e.decision>=0&&e.decision<=3)&&(e.receiver===undefined||['左翼队友','林野','篮下队友'].includes(e.receiver))&&continuousValid(e));}
  function completePlay(s,id,execution){
    if(s.stage!=='match'||!s.match?.play||s.match.play.id!==id||!executionValid(execution)||execution.mode!==s.match.play.config.mode)return false;
    if(execution.liveMatch)return completeLive(s,execution);
    if(s.match.play.config.liveMatch)return false;
    return choose(s,s.match.play.index,execution);
  }
  function completeLive(s,e){
    const m=s.match,p=m.play;if(!p.config.liveMatch||e.end!=='whistle'||(p.config.noDraw?e.noDraw!==true||!Number.isInteger(e.overtimes)||e.overtimes<0||e.duration!==p.config.matchSeconds+e.overtimes*300||m.score[0]+e.teamPoints===m.score[1]+e.opponentPoints:e.noDraw===true||e.duration!==p.config.matchSeconds)||!Number.isInteger(e.possessions)||e.possessions<1||e.events.at(-1)?.kind!=='whistle')return false;
    if(p.config.noDraw&&e.events.filter(x=>x.kind==='overtime').length!==e.overtimes)return false;
    const makes=e.events.filter(x=>x.kind==='make'),home=makes.filter(x=>x.actor!=='opponent').reduce((a,x)=>a+(x.points||0),0),away=makes.filter(x=>x.actor==='opponent').reduce((a,x)=>a+(x.points||0),0);
    if(home!==e.teamPoints||away!==e.opponentPoints)return false;
    const base=[...m.score],remaining=4-m.records.length,sc=scene(s),decision=Math.max(0,Math.min(3,e.decision??1)),teamLevel=Math.min(4,1+Math.round((e.stats.assists+e.stats.rebounds+e.stats.steals+e.stats.blocks+e.events.filter(x=>x.kind==='screen'&&x.actor==='player').length)/Math.max(1,e.possessions)*5));
    for(const k of Object.keys(m.stats))m.stats[k]+=e.stats[k];m.score[0]+=home;m.score[1]+=away;
    m.quality=Math.min(12,m.quality+decision*remaining);m.team=Math.min(14,m.team+teamLevel*remaining);m.performance+=Math.min(10,e.stats.made*2+e.stats.assists*2+e.stats.rebounds+e.stats.steals+e.stats.blocks);
    if(e.events.some(x=>x.kind==='pass'&&x.actor==='player'||x.kind==='screen'&&x.actor==='player'))s.bond=clamp(s.bond+3,0,100);
    const elapsed=e.events.at(-1).t||e.duration;
    for(let group=0;group<remaining;group++){
      const events=e.events.filter(x=>Math.min(remaining-1,Math.floor(x.t/elapsed*remaining))===group),through=e.events.filter(x=>x.t<=elapsed*(group+1)/remaining),sum=actor=>through.filter(x=>x.kind==='make'&&(actor==='home'?x.actor!=='opponent':x.actor==='opponent')).reduce((a,x)=>a+(x.points||0),0),score=[base[0]+sum('home'),base[1]+sum('away')];
      const i=m.records.length,feedback={title:group===remaining-1?'终场哨响，故事继续。':'攻防仍在继续。',text:`这一阶段比分 ${score[0]} : ${score[1]}。`+events.slice(-3).map(x=>x.text).join(' '),judgment:decision>=3?'合理决策':decision===2?'可以理解的尝试':'继续打磨判断',coach:decision>=2?'把判断和脚步用在连续攻防里。进球后退防，断球后寻找队友。':'回去复盘球权转换的处理，下一场继续练习。',success:score[0]>=score[1],animation:p.config.variant||'shot',action:['开场与第一段攻防','转换进攻与配合','退防、篮板与反击','终场前的攻防'][i],chance:1,context:{title:sc.title,tag:'连续实战',text:'进球和丢球后继续交换球权，直至终场。',tip:'比分与个人数据来自这段实战的全部动作。'},...(group===remaining-1?{execution:JSON.parse(JSON.stringify(e))}:{})};
      m.records.push({turn:i,title:feedback.action,...feedback,q:decision,team:teamLevel,score});
    }
    if(m.league)m.careerResult=League.complete(s,m,e);
    m.actualSeconds=e.duration;m.turn=3;m.feedback=null;m.play=null;m.liveMatch=true;m.simText='进球与失误后在场内直接交换球权，全部实战数据已在终场统一结算。';return finish(s);
  }
  function choose(s, index, execution = null) {
    if (s.match?.competition?.official||s.match?.league) return false;
    if (s.stage !== 'match' || !s.match || s.match.feedback || s.match.complete || ![0, 1, 2].includes(index)) return false;
    if(execution&&!executionValid(execution))return false;
    if(s.match.play&&(!execution||s.match.play.index!==index))return false;
    const m = s.match, sc = scene(s), a = sc.options[index], st = m.stats;
    const fatigue = Math.max(0, 65 - s.energy) * .003 * (1 - (s.player.attrs.stamina - 50) / 100);
    const chance = clamp(a.p + (s.player.attrs[a.skill] - 55) * .004 + (s.bond - 30) * .001 - fatigue, .08, .94);
    const success = execution ? execution.success : rng(s) < chance;
    let text = '', animation = a.type;
    if(execution?.continuous){
      for(const k of Object.keys(st))st[k]+=execution.stats[k];
      m.score[0]+=execution.teamPoints;m.score[1]+=execution.opponentPoints;
      m.performance+=Math.min(4,execution.stats.made*2+execution.stats.assists*2+execution.stats.rebounds+execution.stats.steals+execution.stats.blocks+(execution.success?1:0));
      if(execution.events.some(e=>e.kind==='pass'||e.kind==='screen'))s.bond=clamp(s.bond+2,0,100);
      text=execution.reason;
    } else if (a.type === 'shot' || a.type === 'drive') {
      st.attempts++;
      if (success) { const points=execution?.points||a.val;st.made++; st.points += points; m.score[0] += points; m.performance += 2; text = points === 3 ? '篮球划过弧线，三分入网！场边响起一阵欢呼。' : '你把握住机会，篮球擦过篮网，两分到手。'; }
      else { text = a.q >= 2 ? '球弹筐而出。机会创造出来了，只差最后一点手感。' : '防守已经到位，勉强出手未能命中。下次可以更早观察队友。'; if (execution ? execution.turnover : a.type === 'drive' && rng(s) < .35) { st.turnovers++; st.attempts--; text = '你启动后被防守挡住了去路，球被碰出控制。对方接管球权。'; } }
    } else if (a.type === 'assist') {
      if (success) { const points=execution?.points||a.val;st.assists++; m.score[0] += points; m.performance += 2; text = `球穿过防线，林野接球命中${points === 3 ? '三分' : '两分'}！一次及时的传球，让他轻松完成终结。`; }
      else { const lost = execution ? execution.turnover : rng(s) < .3; if (lost) st.turnovers++; text = lost ? '传球稍慢了半拍，被对方碰走了。你读到了空位，接下来要练传球时机。' : '林野获得空位，出手却偏了。他朝你举手：「传得好，是我的。」'; }
      s.bond = clamp(s.bond + 2, 0, 100);
    } else if (a.type === 'screen') {
      if (success) { m.score[0] += 2; m.performance++; if(execution?.finisher==='player'){st.points+=2;st.made++;st.attempts++;m.performance++;}text = '你站稳完成掩护，林野绕过防守上篮得分。他和你击掌：「这个挡得漂亮！」'; }
      else text = '你完成了掩护，林野的出手却弹筐而出。教练仍然朝你点头：这个配合值得再打一次。';
      s.bond = clamp(s.bond + 3, 0, 100);
    } else if (a.type === 'rebound') {
      if (success) { st.rebounds++; m.performance++; text = '你提前卡住位置，抢下进攻篮板，把球交回外线。球队又多了一次机会。'; }
      else { m.score[1] += 2; text = '篮板弹向另一侧。你未能及时退防，对方趁机反击得手。'; }
    } else if (a.type === 'protect' || a.type === 'protectPass') {
      if (success) { m.performance++; text = a.type === 'protectPass' ? '你把球转移到林野手上，他避开逼抢。终场哨响，你们一起守住了优势。' : '你压低重心，把球牢牢控制在身侧。终场哨响，领先的比分被保留到了最后。'; }
      else { st.turnovers++; m.score[1] += 2; text = '对手的逼抢打乱了节奏，切下篮球后反击得到两分。终场哨紧接着响起。'; }
    } else {
      if (success) {
        m.performance++; if(execution){if(execution.defensive==='steal')st.steals++;else if(execution.defensive==='block')st.blocks++;}else if (a.type === 'steal') { st.steals++; text = '你判断准了运球节奏，干净地切下篮球，球队拿回球权！'; }
        else if (a.type === 'help' && s.player.role === 'big') { st.blocks++; text = '你在起跳前守住位置，伸直手臂，把对方的上篮封了下来！'; }
        else { text = a.type === 'help' ? '你补到突破路线上，迫使对方仓促出手。队友收下篮板。' : '你保持距离，没有吃晃。对手在干扰下投丢，这是一回合扎实的防守。'; }
      } else { m.score[1] += 2; if (a.type === 'steal' && !execution) { st.fouls++; text = '你伸手慢了一拍，犯规送对方两次罚球，对方两罚全中。'; } else text = '对方在你干扰下仍然命中。防守的位置没有错，回去还能再练脚步。'; }
    }
    if(execution){text=execution.reason;if(execution.foul&&!execution.continuous)st.fouls++;}
    const decisionScore=Math.max(0,(execution?.decision??a.q)-(execution&&(execution.foul||(execution.mode==='pass'&&execution.turnover))?1:0));
    const contribution=execution?.continuous?Math.min(4,execution.events.filter(e=>e.kind==='screen'||e.kind==='rebound'&&e.actor==='player'||e.kind==='catch'&&e.actor==='mate').length*2):0;
    const teamScore=Math.max(0,Math.max(a.team,contribution)-(execution?.foul?1:0));
    m.quality += decisionScore; m.team = Math.min(14,m.team + teamScore);
    const judgment = decisionScore >= 3 ? '合理决策' : decisionScore === 2 ? '可以理解的尝试' : decisionScore === 1 ? '风险偏高' : '选择需要调整';
    const coach = decisionScore >= 3 ? (success ? '抓住合理机会，也照顾到了球队。保持这样的判断。' : '这次没打成，但选择是对的。我看的是你怎么打球。') : decisionScore === 2 ? '机会可以尝试。继续观察防守，别让每个回合都变成单打。' : '先读懂防守，再决定怎么打。场上还有队友可以接应。';
    m.feedback = { title: success ? '这一球，值得记住。' : m.turn === 3 ? '这场结束，故事继续。' : '下一回合，再来。', text, judgment, coach, success, animation, action: execution?.mode==='pass'&&execution.receiver?'传给'+execution.receiver:a.title, chance, context:{title:sc.title,tag:sc.tag,text:sc.text,tip:sc.tip}, ...(execution?{execution:JSON.parse(JSON.stringify(execution))}:{}) };
    m.play=null;
    m.records.push({ turn: m.turn, title: sc.title, ...m.feedback, q: decisionScore, team: teamScore, score: [...m.score] });
    return true;
  }
  function next(s) {
    if (s.stage !== 'match' || !s.match.feedback) return false;
    const m = s.match;
    m.feedback = null;
    if (m.turn === 3) { finish(s); return true; }
    m.turn++; prepare(s); return true;
  }
  function finish(s) {
    if(s.match?.league)return finishCareer(s);
    const m = s.match; if (m.complete) return false;
    m.complete = true;
    const grade = Math.round(m.quality / 12 * 45 + m.team / 14 * 35 + Math.min(10, m.performance) / 10 * 20);
    const placement = grade >= 72 ? 'rotation' : grade >= 46 ? 'bench' : 'observe';
    const isTryout = m.kind === 'tryout';
    const report = { ...JSON.parse(JSON.stringify(m)), grade, placement, week: s.week, win: m.score[0] > m.score[1], draw: m.score[0] === m.score[1] };
    if(s.growth&&m.actualSeconds){report.projectedMinutes=m.minutes;report.minutes=Math.ceil(m.actualSeconds/60);}
    if (isTryout) {
      s.placement = placement;
      s.trust = { rotation: 65, bench: 48, observe: 33 }[placement];
      if(s.growth)s.growth.role={rotation:2,bench:1,observe:0}[placement];
      s.album.push({ key: 'first-vest', week: 1, title: '第一件训练背心', text: '今天，你第一次穿上江岚中学的训练背心。' });
    } else {
      s.trust = clamp(s.trust + (grade >= 70 ? 5 : grade >= 45 ? 2 : -3), 10, 100);
      s.placement = s.trust >= 62 ? 'rotation' : s.trust >= 43 ? 'bench' : 'observe';
      if(!s.growth&&s.week>=13&&s.week<=24)report.developmentCore=Story.dossier(s).core;
      if(!s.growth&&s.week>=25&&s.week<=36)report.youthCore=Story.youthCore(s);
      if(!s.growth&&s.week>=37&&s.week<=48)report.prepCore=Story.prepCore(s);
      if(!s.growth&&s.week>=49&&s.week<=60)report.careerCore=Story.careerCore(s);
      if(!s.growth&&s.week>=61&&s.week<=72)report.leagueCore=Story.leagueCore(s);
      s.matches.push(report);
      Object.keys(s.totals).forEach(k => s.totals[k] += m.stats[k]);
      if (report.win && !s.album.some(x => x.key === 'first-win')) s.album.push({ key: 'first-win', week: s.week, title: '我们的第一场胜利', text: `你和队友一起战胜${m.opponent}，林野把比赛用球高高举起。` });
      if (!s.growth && s.week % 12 === 0) s.album.push({ key: 'season-' + s.week, week: s.week, title: '这一季的汗水', text: `一个校园赛季结束了。你已经打过 ${s.matches.length} 场比赛，下一段路从新的训练开始。` });
    }
    s.energy = clamp(s.energy - (isTryout ? 12 : s.growth ? Math.round((m.actualSeconds || 240) / 60 * (.95 - s.player.attrs.stamina * .004) + 4) : Math.round(m.minutes * .8 + 4)), 0, 100);
    if(s.growth)Growth.settle(s,report);
    s.lastReport = report; s.stage = 'result'; return true;
  }
  function goHome(s) {
    if (s.stage !== 'result') return false;
    if(s.career&&s.lastReport.league){s.stage='home';return true;}
    if (s.lastReport.kind === 'weekly') {
      s.week++; s.training = []; s.lastTraining = ''; s.energy = clamp(s.energy + 28, 0, 100);
      s.player.age = Math.min(s.growth?38:18, 15 + Math.floor((s.week - 1) / (s.growth?52:36)));
      s.player.height = Math.round(roles[s.player.role].height + (roles[s.player.role].ceiling - roles[s.player.role].height) * Math.min(1, (s.week - 1) / (s.growth?156:108)));
    }
    s.stage = 'home'; if(s.growth)Growth.week(s);return true;
  }
  const training = {
    shooting: { name: '投篮加练', text: '定点出手、接球投篮与终结', icon: 'target', cost: 16, gains: { shot: 2, handle: 1 } },
    tactics: { name: '团队合练', text: '传切、掩护与协防轮转', icon: 'team', cost: 13, gains: { pass: 2, defense: 1 } },
    strength: { name: '力量与篮板', text: '核心对抗、卡位和起跳', icon: 'bolt', cost: 18, gains: { body: 2, rebound: 2 } },
    dribble: { name: '运球与突破', text: '弱手控球、变向和第一步', icon: 'ball', cost: 15, gains: { handle: 2, drive: 2 } },
    study: { name: '上课与复盘', text: '完成学业，再看一段比赛录像', icon: 'book', cost: -5, gains: { defense: 1, pass: 1 } },
    rest: { name: '休息恢复', text: '放松身体，给下一场留点余力', icon: 'sun', cost: -27, gains: { stamina: 1 } }
  };
  function train(s, id) {
    if(s.growth)return Growth.train(s,id);
    const t = training[id];
    if (s.stage !== 'home' || !Object.hasOwn(training, id) || s.training.length >= 3 || s.energy < Math.max(0, t.cost)) return false;
    const changes = [];
    Object.entries(t.gains).forEach(([k, val]) => {
      const before = s.player.attrs[k], gain = before >= 85 ? 1 : val;
      s.player.attrs[k] = clamp(before + gain, 0, 96);
      if (s.player.attrs[k] > before) changes.push(`${attrs[k]} +${s.player.attrs[k] - before}`);
    });
    const before = s.energy; s.energy = clamp(s.energy - t.cost, 0, 100);
    if (id === 'tactics') { s.bond = clamp(s.bond + 4, 0, 100); changes.push('默契 +4'); }
    s.training.push(id);
    s.lastTraining = `${t.name}完成：${changes.join('，') || '基本功得到巩固'}；体力 ${s.energy - before >= 0 ? '+' : ''}${s.energy - before}。`;
    s.diary.unshift({ week: s.week, text: s.lastTraining }); s.diary = s.diary.slice(0, 30); return true;
  }
  const placements = {
    rotation: { name: '进入轮换', minutes: '16–20', headline: '球队里，有你的位置。', text: '你知道什么时候自己来，也愿意让队友变得更好。先进入轮换，下一场继续证明自己。', goal: '继续保持合理选择，带动队友打好配合。' },
    bench: { name: '替补入队', minutes: '8–12', headline: '替补席，也是起跑线。', text: '有些回合打得不错，还有些细节需要磨练。你先跟队训练，从替补开始争取机会。', goal: '训练补足短板，上场时先把简单的球处理好。' },
    observe: { name: '留队观察', minutes: '4–6', headline: '故事，才刚刚开始。', text: '今天还有不少需要改进的选择。但我看到了你的投入。留下来训练，用下一次表现争取位置。', goal: '先学会读懂防守，通过掩护和稳守帮助球队。' }
  };
  function beginCareer(s,kind='official',offerId){
    const d=League.prepare(s,kind,offerId);if(!d)return false;
    const stats={...League.personal(d.prefix).stats};
    s.match={kind:'weekly',opponent:d.opponent,minutes:d.planned/60,league:d,growthMode:true,turn:0,score:[d.prefix.score[d.mine],d.prefix.score[1-d.mine]],stats,records:[],feedback:null,quality:0,team:0,performance:0,complete:false};s.stage='match';prepare(s);return true;
  }
  function finishCareer(s){
    const m=s.match;if(m.complete||!m.careerResult)return false;
    const result=League.record(s,m,m.careerResult);if(!result)return false;
    const d=m.league,grade=result.grade,placement=grade>=72?'rotation':grade>=46?'bench':'observe';
    const r={kind:'weekly',opponent:d.opponent,minutes:result.minutes,actualSeconds:result.parts.manual.seconds,week:s.week,grade,placement,stats:result.stats,score:[m.careerResult.total.score[d.mine],m.careerResult.total.score[1-d.mine]],records:JSON.parse(JSON.stringify(m.records)),quality:m.quality,team:m.team,performance:m.performance,win:m.careerResult.total.score[d.mine]>m.careerResult.total.score[1-d.mine],draw:m.careerResult.total.score[0]===m.careerResult.total.score[1],league:result.meta,parts:result.parts,liveMatch:true};
    const cost=Math.round((r.minutes*(.95-s.player.attrs.stamina*.004)+(r.minutes?4:0))*(d.official?League.loadFactor(s):1)),beforeEnergy=s.energy;s.energy=clamp(s.energy-cost,0,100);r.energySpent=beforeEnergy-s.energy;
    if(d.official){if(r.minutes>0)s.trust=clamp(s.trust+(grade>=75?4:grade>=60?1:grade<45?-2:0),10,100);s.matches.push(r);Object.keys(s.totals).forEach(k=>s.totals[k]+=r.stats[k]);Growth.settle(s,r);}
    m.complete=true;m.play=null;m.careerResult=null;s.lastReport=r;s.stage='result';return true;
  }
  function quickMatch(s){
    if(!s.career)return false;if(s.stage==='home'&&!beginCareer(s))return false;
    const m=s.match;if(s.stage!=='match'||!m.league||m.complete||!m.league.official)return false;
    let model=m.play?.model;
    if(model){const C=typeof module==='object'&&module.exports?require('./court.js'):globalThis.BasketCourt;model=C.restore(model);if(!model)return false;C.pause(model,false);let guard=0;while(model.phase!=='done'&&(model.phase==='flight'||model.owner==='loose')&&guard++<2400)C.step(model,1/120);if(model.phase==='done')return completePlay(s,m.play.id,model.outcome);}
    m.careerResult=League.quick(s,m,model);m.score=m.careerResult.total.score.map((_,i)=>m.careerResult.total.score[i===0?m.league.mine:1-m.league.mine]);m.quality=8;m.team=8;m.performance=5;
    // Keep the decisions and events actually played before handing over to simulation.
    let played=null;if(model){const decision=model.decisions.length?Math.round(model.decisions.reduce((a,b)=>a+b,0)/model.decisions.length):1,st=model.stats,teamLevel=Math.min(4,1+Math.round((st.assists+st.rebounds+st.steals+st.blocks+model.events.filter(e=>e.kind==='screen'&&e.actor==='player').length)/Math.max(1,model.run.possessions)*5));m.quality=decision*4;m.team=Math.min(14,teamLevel*4);m.performance=Math.min(10,st.made*2+st.assists*2+st.rebounds+st.steals+st.blocks);played={mode:model.config.mode,success:model.teamPoints>=model.opponentPoints,score:model.grades.length?Math.round(model.grades.reduce((a,b)=>a+b,0)/model.grades.length):0,reason:'你已完成的攻防也留在这场比赛里。',finisher:'player',foul:false,turnover:false,decision,continuous:true,liveMatch:true,...(model.config.noDraw?{noDraw:true}:{}),stats:JSON.parse(JSON.stringify(st)),teamPoints:model.teamPoints,opponentPoints:model.opponentPoints,events:JSON.parse(JSON.stringify(model.events))};}

    m.records=Array.from({length:4},(_,i)=>({turn:i,title:'比赛回顾',action:'模拟剩余比赛',text:'球队按原定轮换打完了比赛。',coach:'根据本场统计安排下一次训练。',judgment:'比赛统计已结算',success:m.score[0]>m.score[1],animation:'shot',chance:1,q:played?.decision??2,team:2,score:[...m.score],...(i===3&&played?{execution:played}:{})}));m.turn=3;m.feedback=null;return finishCareer(s);
  }
  function valid(s) {
    if (!s || !Story.valid(s) || s.version !== VERSION || !s.player || !Object.hasOwn(roles, s.player.role) || !Object.hasOwn(origins, s.player.origin)) return false;
    if (typeof s.player.name !== 'string' || !s.player.name.trim() || Array.from(s.player.name).length > 10 || !Number.isInteger(s.player.number) || s.player.number < 0 || s.player.number > 99) return false;
    if (!Number.isInteger(s.seed) || s.seed < 0 || s.seed > 4294967295 || !Number.isInteger(s.week) || s.week < 1) return false;
    if (!['arrival', 'introFeedback', 'match', 'result', 'home'].includes(s.stage)) return false;
    if (![s.energy, s.trust, s.bond].every(x => Number.isFinite(x) && x >= 0 && x <= 100)) return false;
    if (!s.player.attrs || !Object.keys(attrs).every(k => Number.isFinite(s.player.attrs[k]) && s.player.attrs[k] >= 0 && s.player.attrs[k] <= 96)) return false;
    if (![s.training, s.album, s.diary, s.matches].every(Array.isArray) || s.training.length > 3 || !s.training.every(k => Object.hasOwn(training, k)||(s.growth&&Growth.keys.includes(k)))) return false;
    if(s.growth!==undefined&&!Growth.valid(s))return false;
    if(s.career&&!League.valid(s))return false;
    if(s.match?.play?.config?.attributes!==undefined){const cfg=s.match.play.config;if(!cfg.attributes||!Object.keys(attrs).every(k=>Number.isFinite(cfg.attributes[k])&&cfg.attributes[k]>=0&&cfg.attributes[k]<=96)||!Array.isArray(cfg.perks)||cfg.perks.length>2||!cfg.perks.every(k=>Object.hasOwn(Growth.perks,k)))return false;}
    if(s.match?.play?.model&&(JSON.stringify(s.match.play.model.config?.attributes)!==JSON.stringify(s.match.play.config.attributes)||JSON.stringify(s.match.play.model.config?.perks)!==JSON.stringify(s.match.play.config.perks)))return false;
    if (!Number.isInteger(s.player.age) || s.player.age < 15 || s.player.age > (s.growth?38:18) || !Number.isFinite(s.player.height) || s.player.height < 150 || s.player.height > 220 || typeof s.lastTraining !== 'string') return false;
    if (s.stage === 'introFeedback' && typeof s.introText !== 'string') return false;
    const str = x => typeof x === 'string' && x.length < 3000;
    const wk = x => Number.isInteger(x) && x >= 1 && x <= s.week;
    if (!s.album.every(x => x && str(x.key) && wk(x.week) && str(x.title) && str(x.text)) || !s.diary.every(x => x && wk(x.week) && str(x.text))) return false;
    const statKeys = ['points', 'assists', 'rebounds', 'steals', 'blocks', 'turnovers', 'fouls', 'made', 'attempts'];
    const statsOK = st => st && statKeys.every(k => Number.isInteger(st[k]) && st[k] >= 0) && st.made <= st.attempts;
    const scoreOK = a => Array.isArray(a) && a.length === 2 && a.every(x => Number.isInteger(x) && x >= 0);
    const feedbackOK = f => f && ['title', 'text', 'judgment', 'coach', 'action'].every(k => str(f[k])) && typeof f.success === 'boolean' && ['shot', 'drive', 'assist', 'screen', 'rebound', 'defend', 'help', 'steal', 'protect', 'protectPass'].includes(f.animation) && Number.isFinite(f.chance) && f.chance >= 0 && f.chance <= 1 && (!f.execution || executionValid(f.execution)) && (!f.context || ['title','tag','text','tip'].every(k=>str(f.context[k])));
    const recordsOK = r => Array.isArray(r) && r.length <= 4 && r.every((x, i) => x && x.turn === i && feedbackOK(x) && scoreOK(x.score) && Number.isFinite(x.q) && x.q >= 0 && x.q <= 3 && Number.isFinite(x.team) && x.team >= 0 && x.team <= 4);
    const reportOK = r => r && (!r.league||League.reportValid(r)) && (r.growthReward===undefined||Growth.rewardValid(r.growthReward)) && (!r.competition?.official||r.draw===false&&r.score?.[0]!==r.score?.[1]) && (r.leagueCore===undefined||Number.isInteger(r.leagueCore)&&r.leagueCore>=0&&r.leagueCore<=96) && (r.careerCore===undefined||Number.isInteger(r.careerCore)&&r.careerCore>=0&&r.careerCore<=96) && (r.prepCore===undefined||Number.isInteger(r.prepCore)&&r.prepCore>=0&&r.prepCore<=96) && (r.competition===undefined||Story.eventValid(r.competition,r.week,r.opponent)) && (r.youthCore===undefined||Number.isInteger(r.youthCore)&&r.youthCore>=0&&r.youthCore<=96) && (r.developmentCore===undefined||Number.isInteger(r.developmentCore)&&r.developmentCore>=0&&r.developmentCore<=96) && (r.league?Number.isFinite(r.minutes)&&r.minutes>=0&&r.minutes<=200:Number.isInteger(r.minutes)&&r.minutes>=1&&r.minutes<=40) && ['tryout', 'weekly'].includes(r.kind) && str(r.opponent) && wk(r.week) && scoreOK(r.score) && statsOK(r.stats) && recordsOK(r.records) && r.records.length === 4 && Number.isFinite(r.grade) && r.grade >= 0 && r.grade <= 100 && Object.hasOwn(placements, r.placement) && ['quality', 'team', 'performance'].every(k => Number.isFinite(r[k]) && r[k] >= 0) && typeof r.win === 'boolean' && typeof r.draw === 'boolean';
    if (!s.matches.every(reportOK) || (s.lastReport && !reportOK(s.lastReport))) return false;
    if (!s.totals || !['points', 'assists', 'rebounds', 'steals', 'blocks'].every(k => Number.isInteger(s.totals[k]) && s.totals[k] >= 0)) return false;
    if ((s.stage === 'result' || s.stage === 'home') && (!Object.hasOwn(placements, s.placement) || !reportOK(s.lastReport))) return false;
    if(s.stage==='match'&&s.match?.competition!==undefined&&!Story.eventValid(s.match.competition,s.week,s.match.opponent))return false;
    if(s.match?.play?.config?.opposition!==undefined&&(!Number.isFinite(s.match.play.config.opposition)||s.match.play.config.opposition<1||s.match.play.config.opposition>1.4))return false;
    if (s.stage === 'match' && (!s.match || !['tryout', 'weekly'].includes(s.match.kind) || !Number.isInteger(s.match.turn) || s.match.turn < 0 || s.match.turn > 3 || !Array.isArray(s.match.records) || !Array.isArray(s.match.score) || s.match.score.length !== 2 || !s.match.score.every(x => Number.isInteger(x) && x >= 0) || !s.match.stats || !Object.keys({ points: 0, assists: 0, rebounds: 0, steals: 0, blocks: 0, turnovers: 0, fouls: 0, made: 0, attempts: 0 }).every(k => Number.isInteger(s.match.stats[k]) && s.match.stats[k] >= 0) || !['quality', 'team', 'performance'].every(k => Number.isFinite(s.match[k])))) return false;
    if (s.stage === 'match' && (!Number.isInteger(s.match.minutes) || s.match.minutes < (s.match.league?0:1) || s.match.minutes > 40 || !str(s.match.opponent) || !str(s.match.simText) || !recordsOK(s.match.records) || !statsOK(s.match.stats) || s.match.complete !== false || s.match.records.length !== s.match.turn + (s.match.feedback ? 1 : 0) || (s.match.feedback && !feedbackOK(s.match.feedback)) || (s.match.kind === 'weekly' && !Object.hasOwn(placements, s.placement)))) return false;
    if(s.stage==='match'&&s.match?.competition&&s.match.play){const p=s.match.play.config,e=s.match.competition;if(!!p.noDraw!==!!e.official||p.teamName!==e.teamName||p.opposition!==e.opposition||JSON.stringify(p.teammates)!==JSON.stringify(e.teammates))return false;}
    if(s.stage==='match'&&s.match.play){const p=s.match.play;if(s.match.feedback||!str(p.id)||![0,1,2].includes(p.index)||!p.config||!Object.values(playModes).includes(p.config.mode)||!Number.isFinite(p.config.skill)||p.config.skill<0||p.config.skill>96||!Number.isFinite(p.config.energy)||p.config.energy<0||p.config.energy>100||!Number.isInteger(p.config.number)||p.config.number<0||p.config.number>99||!Number.isInteger(p.config.seed)||!Object.hasOwn(roles,p.config.role)||p.config.mode!==playModes[scene(s).options[p.index].type]||(p.model&&(!p.model.config||p.model.config.mode!==p.config.mode||![1,2].includes(p.model.v))))return false;}
    return true;
  }
  function restore(data) {
    try {
      if (!data || data.version !== VERSION) return null;
      const s = JSON.parse(JSON.stringify(data));
      if(s.career?.gameLedger){if(s.career.games!==undefined)return null;s.career.games=League.unpackGames(s.career.gameLedger);delete s.career.gameLedger;}
      if(s.story===undefined)s.story=Story.init(s.week);
      if(s.match?.play?.config&&s.match.play.config.liveMatch===undefined){const p=s.match.play;p.config.liveMatch=true;p.config.matchSeconds=liveSeconds(s.match);p.config.baseScore=[...s.match.score];if(p.model?.config){p.model.config.liveMatch=true;p.model.config.matchSeconds=p.config.matchSeconds;p.model.config.baseScore=[...s.match.score];}}
      const minutes = r => r.kind === 'tryout' ? 5 : ({ rotation: 18, bench: 10, observe: 5 }[r.placement || s.placement] || 5);
      for (const r of [...(Array.isArray(s.matches) ? s.matches : []), s.lastReport, s.match]) if (r && r.minutes === undefined) r.minutes = minutes(r);
      if(s.match?.play?.config){const p=s.match.play;if(!Number.isFinite(p.config.bond))p.config.bond=s.bond;if(p.model?.config&&!Number.isFinite(p.model.config.bond))p.model.config.bond=p.config.bond;if(!Number.isFinite(p.config.stamina))p.config.stamina=s.player.attrs.stamina;if(p.model?.config&&!Number.isFinite(p.model.config.stamina))p.model.config.stamina=p.config.stamina;}
      return valid(s) ? s : null;
    } catch (_) { return null; }
  }
  return { snapshot:League.snapshot, Growth, League, beginCareer, quickMatch, upgrade:s=>{if(!valid(s)||s.stage==='match'||s.career)return null;const q=JSON.parse(JSON.stringify(s));if(q.stage==='result'){q.stage='home';if(q.lastReport.kind==='weekly'){q.week++;q.training=[];q.lastTraining='';q.energy=clamp(q.energy+28,0,100);if(q.growth)Growth.week(q);}}if(!q.growth)Growth.init(q,true);return League.init(q)?q:null;}, migrate:s=>{if(s.growth||!valid(s)||s.stage==='match')return null;return Growth.init(JSON.parse(JSON.stringify(s)),true);}, league:Story.league, enroll:(s,route)=>!Story.current(s)&&Story.enroll(s,route), storySeasonSix:Story.seasonSix, career:Story.career, storySeasonFive:Story.seasonFive, preparation:Story.preparation, storySeasonFour:Story.seasonFour, youth:Story.youth, storySeasonThree:Story.seasonThree, fixture:(week,s)=>s?.career?(League.describe(s)||{opponent:'休赛期',label:'赛季收官',teamName:s.career.teams.find(t=>t.id===s.career.teamId).name}):s?.growth?Growth.fixture(s):Story.fixture(week,s), development:Story.dossier, relations:Story.relations, storySeasonTwo:Story.seasonTwo, storyScene:s=>s?.growth?null:Story.current(s), storySeason:Story.season, storyTotal:Story.total, storyChoose:Story.choose, storyAdvance:Story.advance, storyGoal:s=>s?.growth?null:Story.goal(s), storyChapters:Story.chapters, storyCast:Story.cast, VERSION, attrs, roles, origins, placements, training, create, introduction, begin, scene, choose, startPlay, checkpointPlay, completePlay, executionValid, next, goHome, train, valid, restore, clamp };
});
