const assert=require('node:assert/strict'),H=require('./engine'),L=H.League,C=require('./court');let checks=0,clips=0;
const ok=(v,m)=>{assert.ok(v,m);checks++;},eq=(a,b,m)=>{assert.deepEqual(a,b,m);checks++;},copy=x=>JSON.parse(JSON.stringify(x));
function saved(s){ok(H.valid(s),'state valid '+s.stage+' '+s.match?.highlights?.phase);const restored=H.restore(H.snapshot(s));ok(restored,'save restores');eq(restored,s,'checkpoint round trip');}
function fresh(role='guard',mode='career'){const s=H.create({name:'比赛验收',number:7,role,origin:'school',seed:42,careerMode:mode});H.introduction(s,1);ok(H.beginHighlights(s));return s;}
function control(q){if(q.owner==='opponent'){if(!q.run.tracking)C.press(q,'track');if(q.phase==='flight'&&q.flight.kind==='oppShot')C.press(q,'defend');else C.press(q,'defend');}else if(q.owner==='loose'){C.aim(q,q.landing.x,q.landing.y);if(!q.box)C.press(q,'box');if(q.t>=q.jumpAt-.03)C.press(q,'jump');}else if(q.phase==='playing'){if(q.flow==='screen')C.press(q,'plant');const a=q.owner==='mate'?q.mates[q.carrier]:q.p;if(C.dist(a,C.hoop)>360)C.press(q,'advance');else if(!q.charging)C.press(q,'shoot');else if(C.meter(q).value>=.63)C.press(q,'release');}}
function play(s){const p=H.startPlay(s,0);ok(p);eq(p.config.matchSeconds,20);eq(p.config.noDraw,false);ok(!H.startPlay(s,1));const q=C.create(p.config);ok(C.valid(q));C.start(q);for(let i=0;i<5000&&q.phase!=='done';i++){control(q);C.step(q,1/120);if(i===200){ok(H.checkpointPlay(s,p.id,q));saved(s);}}eq(q.phase,'done');eq(q.outcome.duration,20);ok(H.completePlay(s,p.id,q.outcome));ok(!H.completePlay(s,p.id,q.outcome),'duplicate callback rejected');clips++;saved(s);return q.outcome;}
function finish(s,manual=false){let guard=0;while(s.stage==='match'&&guard++<12){if(s.match.highlights.phase==='moment'){if(manual)play(s);else ok(H.skipHighlight(s));}else ok(H.advanceHighlights(s));saved(s);}eq(s.stage,'result');eq(s.lastReport.records.length,4);}
function season(s){let guard=0;while(s.career.phase!=='offseason'&&guard++<180){if(!L.fixture(s)){ok(L.skipPost(s));continue;}if(L.fixture(s).week>s.week)ok(L.advance(s,false));ok(H.quickMatch(s));ok(H.goHome(s));}eq(s.career.phase,'offseason');}
function pro(tier,role='guard'){const s=fresh(role);finish(s);ok(H.goHome(s));season(s);s.player.age=22;const year=s.career.year+1;s.career.pending={id:'test-'+tier,tier,teamId:tier+'-0',start:year,end:year+1,salary:120,bonus:8,role:1};ok(L.nextSeason(s,false));saved(s);return s;}
// All three roles enter short context-specific clips, return to text, and still reach training.
for(const role of ['guard','wing','big']){const s=fresh(role);saved(s);ok(!H.startPlay(s,0),'opening starts as text');ok(H.advanceHighlights(s));ok(['shot','drive','assist','screen','rebound','defend','steal','help'].includes(H.scene(s).options[0].type));ok(!H.choose(s,0),'text moments must pass through the real court or simulation');finish(s,true);eq(s.lastReport.highlights.played,3);ok(s.lastReport.highlights.elapsed>=300);ok(s.lastReport.stats.points>=0);const reward=s.growth.tp;ok(!H.advanceHighlights(s));eq(s.growth.tp,reward);ok(H.goHome(s));saved(s);}
// Older growth-only and story saves can also start text matches without a career ledger.
for(const mode of ['growth',undefined]){const s=fresh('wing',mode);finish(s);ok(H.goHome(s));ok(H.beginHighlights(s,'weekly'));finish(s);saved(s);}
// Full professional totals use exactly one ledger and the original minutes/energy/reward settlement.
for(const tier of ['nba','cba','overseas'])for(const role of ['guard','wing','big']){const s=pro(tier,role),fixture=L.fixture(s),games=s.career.games.length,planned=L.minutes(s)*60,energy=s.energy;ok(H.beginHighlights(s,'weekly'));eq(s.match.score,[0,0]);eq(s.match.league.prefix.seconds,0);saved(s);ok(H.advanceHighlights(s));finish(s,true);const r=s.lastReport;eq(r.league.id,fixture.id);eq(r.league.method,'highlights');eq(r.parts.manual.seconds,60);eq(r.parts.manual.seconds+r.parts.simulated.seconds,Math.round(r.minutes*60));ok(Math.round(r.minutes*60)>=planned&&Math.round(r.minutes*60)<=planned+r.league.overtimes*300);eq(r.league.seconds,L.duration(tier)+r.league.overtimes*300);for(const k of L.statKeys)eq(r.stats[k],r.parts.manual.stats[k]+r.parts.simulated.stats[k]);eq(r.score,r.parts.simulated.score.map((n,i)=>n+r.parts.manual.score[i]));eq(s.career.games.filter(g=>g.id===fixture.id).length,1);ok(s.career.games.length>games);eq(r.energySpent,energy-s.energy);ok(!H.quickMatch(s));saved(s);}
// Non-league evaluations use the same short clips without advancing the official schedule.
{const s=pro('cba','big'),round=s.career.round,matches=s.matches.length;ok(H.beginHighlights(s,'assessment'));eq(s.match.highlights.total,120);finish(s,true);eq(s.career.round,round);eq(s.matches.length,matches);eq(s.lastReport.minutes,2);saved(s);}
// A partially played possession can hand over to simulation without losing actions or granting a second reward.
{const s=pro('nba');H.beginHighlights(s,'weekly');H.advanceHighlights(s);const p=H.startPlay(s,0),q=C.create(p.config);C.start(q);for(let i=0;i<3000&&q.gameClock>15;i++){control(q);C.step(q,1/120);}ok(H.checkpointPlay(s,p.id,q));saved(s);const points=q.stats.points;ok(H.quickMatch(s));ok(s.lastReport.parts.manual.seconds>=5&&s.lastReport.parts.manual.seconds<=20);ok(s.lastReport.parts.manual.stats.points>=points);saved(s);const count=s.matches.length,tp=s.growth.tp;ok(!H.quickMatch(s));eq(s.matches.length,count);eq(s.growth.tp,tp);}
// No appearance means no forced clips and no invented player box score.
{const s=pro('nba');s.growth.role=0;eq(L.minutes(s),0);H.beginHighlights(s,'weekly');ok(H.advanceHighlights(s));eq(s.stage,'result');eq(s.lastReport.minutes,0);eq(s.lastReport.highlightCount,0);eq(s.lastReport.stats,L.zero());saved(s);}
// Save corruption cannot silently double the manual segment or change the score.
{const s=pro('cba');H.beginHighlights(s,'weekly');H.advanceHighlights(s);play(s);const data=H.snapshot(s),bad=copy(data);bad.match.highlights.manual.seconds++;eq(H.restore(bad),null);const score=copy(data);score.match.score[0]++;eq(H.restore(score),null);}
console.log(`PASS · ${checks} text match checks · ${clips} real 20-second clips · score/box/minutes/energy/reward/save/skip checks`);

if(process.env.FULL_TEXT_SEASON==='1')for(const tier of ['nba','cba']){
 const s=pro(tier,'wing');let games=0,guard=0;
 while(s.career.phase!=='offseason'&&guard++<180){
  if(!L.fixture(s)){ok(L.skipPost(s));continue;}
  if(L.fixture(s).week>s.week)ok(L.advance(s,false));
  ok(H.beginHighlights(s,'weekly'));finish(s,true);ok(H.goHome(s));games++;
 }
 eq(s.career.phase,'offseason');saved(s);
 const packed=JSON.stringify(H.snapshot(s));
 console.log(tier,'all-text-and-clips season',games,'games',packed.length,'save chars');
 ok(packed.length<2500000,'whole highlight season stays within conservative save budget');
 require('node:fs').writeFileSync('qa/v0.21-'+tier+'-finish.json',packed);
}
