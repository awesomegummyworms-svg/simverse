/* SIMVERSE v0.6 — self-contained statistical engine. No external dependency.
 * The renderer is a visualization of generated events, NOT player tracking.
 * Observed player box-score stats are shrunk toward disclosed positional priors.
 */
(function(g){'use strict';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
function rng(seed){let s=(seed>>>0)||0x89abcdef;return ()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return(s>>>0)/4294967296;};}
const normal=(r= Math.random)=>{const u=Math.max(r(),1e-9),v=r();return Math.sqrt(-2*Math.log(u))*Math.cos(v*Math.PI*2);};
const phaseMinutes={preseason:{A:[.90,.78,.62,.35],B:[.80,.60,.37,.12],C:[.68,.40,.17,.04]},regular:{A:[.91,.83,.88,.86],B:[.84,.76,.81,.76],C:[.74,.66,.70,.62]},playoffs:{A:[.97,.93,.96,.96],B:[.92,.87,.92,.91],C:[.84,.79,.84,.81]}};
function group(pos){pos=String(pos||'').toUpperCase();return /C$|CENTER/.test(pos)?'C':/F|PF|SF|FORWARD/.test(pos)?'F':'G';}
function prior(pos){let p=group(pos);return p==='G'?{usage:0.205,three:0.41,p3:0.355,p2:0.50,assist:0.23,reb:0.08,steal:0.014,block:0.006,def:0.52,ft:0.14}:p==='F'?{usage:0.195,three:0.30,p3:0.345,p2:0.53,assist:0.13,reb:0.15,steal:0.011,block:0.012,def:0.55,ft:0.16}:{usage:0.205,three:0.09,p3:0.29,p2:0.59,assist:0.10,reb:0.24,steal:0.009,block:0.040,def:0.61,ft:0.19};}
function safeNum(v, fallback=0){let n=Number(v);return Number.isFinite(n)?n:fallback;}
function nbaProfile(p){
 const raw=prior(p.position),season=p.seasonStats||{},sg=safeNum(season.games),seasonSupported=sg>=5 && safeNum(season.fga)>0,
   seasonW=seasonSupported?clamp(sg/(sg+20),0,.82):0;
 const base={...raw};
 if(seasonSupported){
   const fgaS=safeNum(season.fga),threeS=safeNum(season.fg3a),threeMS=safeNum(season.fg3m),fgmS=safeNum(season.fgm),minS=safeNum(season.mpg,30),ftS=safeNum(season.fta);
   const target={usage:clamp((fgaS+ftS*.44)/Math.max(minS,1)*3.9,.08,.42),three:clamp(threeS/Math.max(fgaS,1),.01,.87),p3:clamp(threeMS/Math.max(threeS,1),.16,.54),p2:clamp((fgmS-threeMS)/Math.max(fgaS-threeS,1),.3,.75),
      assist:clamp(safeNum(season.ast)/Math.max(minS,1)*2.7,.04,.42),reb:clamp(safeNum(season.reb)/Math.max(minS,1)*.65,.03,.34),steal:clamp(safeNum(season.stl)/Math.max(minS,1)*.22,.002,.06),block:clamp(safeNum(season.blk)/Math.max(minS,1)*.23,.001,.1),ft:clamp(ftS/Math.max(fgaS,1)*.27,.025,.30)};
   for(const [key,val] of Object.entries(target))base[key]=base[key]*(1-seasonW)+val*seasonW;
 }
 const b=(p.box||{}), mins=Array.isArray(p.last3PreseasonMinutes)?p.last3PreseasonMinutes.filter(x=>Number.isFinite(+x)).map(Number):[];
 const games=Math.max(0,safeNum(b.games,mins.length)),fga=safeNum(b.fga), fg3a=safeNum(b.fg3a), fg3m=safeNum(b.fg3m), fgm=safeNum(b.fgm), ast=safeNum(b.ast),reb=safeNum(b.reb),stl=safeNum(b.stl),blk=safeNum(b.blk),ftm=safeNum(b.ftm),fta=safeNum(b.fta);
 const tm=safeNum(b.minutes,mean(mins)*Math.max(1,games)),gmin=tm/Math.max(games,1);
 const shots = Math.max(0,fga),sample = shots/(shots+70); // modest sample correction: 70 pseudo-attempts.
 const observed=games>0 && shots>0;
 const blend=(v,p0)=>observed?sample*v+(1-sample)*p0:p0;
 const three=blend(fg3a/Math.max(1,fga),base.three), p3=blend(fg3m/Math.max(1,fg3a),base.p3), p2=blend(Math.max(0,fgm-fg3m)/Math.max(1,fga-fg3a),base.p2);
 const usage=blend(clamp((fga+0.44*fta)/Math.max(1,tm)*3.9,.09,.42),base.usage),assist=blend(clamp(ast/Math.max(1,tm)*2.7,.05,.42),base.assist);
 const rebound=blend(clamp(reb/Math.max(1,tm)*.65,.03,.33),base.reb);
 const steals=blend(clamp(stl/Math.max(1,tm)*.22,.002,.05),base.steal),blocks=blend(clamp(blk/Math.max(1,tm)*.23,.001,.10),base.block);
 const def=clamp(base.def + (steals-base.steal)*2.5 + (blocks-base.block)*1.6 + (safeNum(p.height,77)-77)*.005, .37,.8);
 return {...p,position:p.position||'G',group:group(p.position),recentMinutes:mins,statGames:games,statShots:shots,statsSupported:(observed||seasonSupported),seasonStatsSupported:seasonSupported,usage,three,p3,p2,assist,rebound,steal:steals,block:blocks,def,ft:blend(fta/Math.max(1,fga)*.27,base.ft),quality:observed?(seasonSupported?'RECENT PRESEASON + PRIOR SEASON / SHRUNK':'RECENT PRESEASON / SHRUNK'):(seasonSupported?'PREVIOUS SEASON / SHRUNK':'POSITIONAL PRIOR / UNKNOWN')};
}
function nbaRoster(players,phase='preseason',scenario='B',overrides=[]){
 const input=(Array.isArray(players)?players:[]).filter(p=>p&&p.name).map(nbaProfile);
 let ordered=input.slice().sort((a,b)=>{
  const val=p=>mean(p.recentMinutes)*.72+safeNum(p.seasonMinutes)*.28+(p.starter===true?200:0);
  return val(b)-val(a);
 });
 if(ordered.length<10){const t=ordered[0]?.team||'DEMO';for(let j=ordered.length;j<12;j++)ordered.push(nbaProfile({id:'demo-'+t+'-'+j,name:'Unverified '+(j+1),team:t,jersey:String(j+1),position:j%5===4?'C':j%5===3?'F':'G',isPlaceholder:true}));}
 const pcap=phase==='preseason'?30:phase==='playoffs'?43:39, bases=phase==='preseason'?[21,20,19,18,17,16,15,15,14,13,11,9]:phase==='playoffs'?[37,37,36,35,34,22,18,14,10,8,6,4]:[35,34,33,32,30,23,20,18,16,13,10,7];
 ordered=ordered.map((p,i)=>{
   const raw=p.recentMinutes.length?mean(p.recentMinutes):safeNum(p.seasonMinutes,bases[i]||10),guess=(i<5 ? .35*raw+.65*bases[i] :.50*raw+.50*bases[i]);
   let cap=safeNum(p.minutesCap,pcap); if(!(cap>0))cap=pcap;
   const override=overrides.find(o=>o.player===p.name || (o.id&&String(o.id)===String(p.id)));
   if(override&&override.status==='out')cap=0;
   if(override&&Number.isFinite(+override.minutesCap))cap=Math.min(cap, +override.minutesCap);
   const target=clamp(guess*(scenario==='A'?(i<5?1.15:.90):scenario==='C'?(i<5?.68:1.19):1),0,cap);
   const low=clamp(target-(p.recentMinutes.length?5:9),0,cap),high=clamp(target+(p.recentMinutes.length?5:9),0,cap);
   return {...p,starter:i<5,projectedMinutes:Math.round(target),minuteRange:[Math.round(low),Math.round(high)],minutesCap:cap,availability:override?.status||p.availability||'unknown',certainty:p.recentMinutes.length?'recent minutes sample':'no recent minutes data'};
 });
 return ordered;
}
function available(p){return p.minutesCap>0 && !['out','inactive','doubtful'].includes(String(p.availability||'').toLowerCase());}
function nbaFive(roster,q,sequence,phase='preseason',scenario='B',r=Math.random){
 const share=phaseMinutes[phase]?.[scenario]?.[Math.min(3,q-1)]??.7;
 const eligible=p=>available(p) && !(phase==='preseason' && ((q>=3 && p.minutesCap<=18)||(q>=4 && p.minutesCap<=27))) && !(phase!=='preseason' && q>=4 && p.minutesCap<17);
 let starters=roster.filter(p=>p.starter&&eligible(p)),bench=roster.filter(p=>!p.starter&&eligible(p));
 const pickFrom=(pool,n)=>{const result=[],remaining=pool.slice();while(remaining.length&&result.length<n){const weights=remaining.map(x=>Math.pow(Math.max(3,x.projectedMinutes||8),1.55));let t=r()*weights.reduce((a,b)=>a+b,0);let idx=weights.findIndex(x=>(t-=x)<=0);if(idx<0)idx=remaining.length-1;result.push(remaining.splice(idx,1)[0]);}return result;};
 const nr=clamp(Math.round((share+(r()-.5)*.14)*5),0,5);
 let chosen=pickFrom(starters,nr).concat(pickFrom(bench,5-nr));
 if(chosen.length<5)chosen=chosen.concat(pickFrom([...starters,...bench].filter(p=>!chosen.includes(p)),5-chosen.length));
 if(chosen.length<5)chosen=chosen.concat(pickFrom(roster.filter(available).filter(p=>!chosen.includes(p)),5-chosen.length));
 return chosen;
}
function weighted(list,fn,r){if(!list.length)return null;const weights=list.map(x=>Math.max(.01,fn(x))),total=weights.reduce((a,b)=>a+b,0);let k=r()*total;for(let i=0;i<list.length;i++){k-=weights[i];if(k<=0)return list[i];}return list[list.length-1];}
function nbaPlay(ctx,rs=Math.random){
 const{q,offense,rosters,phase,scenario,pace=100,hot=[0,0]}=ctx,a=offense,d=1-offense;
 const stint=Math.floor((720-Math.min(720,ctx.seconds||720))/180),memo=ctx.lineupCache||(ctx.lineupCache={});
 const lineupFor=team=>{const key=`${q}-${stint}-${team}`;return memo[key]||(memo[key]=nbaFive(rosters[team],q,stint,phase,scenario,rs));};
 const lineupA=lineupFor(a),lineupD=lineupFor(d);
 const shooter=weighted(lineupA,p=>p.usage*(.8+.2*p.p2),rs)||lineupA[0], defender= lineupD.find(x=>x.group===shooter.group)||lineupD[0];
 const handler= weighted(lineupA,p=>p.assist+p.usage*.5,rs)||shooter;
 const passTo=handler===shooter?null:shooter;
 const movement=rs()<.11?'transition':rs()<.35?'pick-and-roll':rs()<.57?'off-ball-screen':'isolation';
 const three=rs()<clamp(shooter.three+(movement==='off-ball-screen'?.08:movement==='transition'?.02:0),.03,.83);
 const kind=three?'three':shooter.group==='C'&&rs()<.5?'post':rs()<.58?'rim':'mid';
 const defHelp=mean(lineupD.map(p=>p.block)), oppDiff=(shooter.def-defender.def),value=kind==='three'?3:2;
 const base=kind==='three'?shooter.p3:kind==='rim'||kind==='post'?shooter.p2+.035:shooter.p2-.10;
 const foulP=clamp((kind==='rim'||kind==='post'?.145:.05)+shooter.ft*.16,.025,.25);
 const timeCost=clamp(14+normal(rs)*3.4-(pace-100)*.19,6,24);
 const tovP=clamp(.12+(defender.steal-.012)*1.1-(handler.assist-.13)*.1,.065,.20);
 const isTO=rs()<tovP;
 const makeP=clamp(base+(oppDiff)*.065-(defHelp-.02)*.25+(movement==='pick-and-roll'?.012:0)+hot[a]*.04,.17,.80);
 const made=!isTO&&rs()<makeP, fouled=!isTO&&rs()<foulP;
 let ftMade=0,ftAttempts=0,pts=made?value:0;
 if(fouled){ftAttempts=made?1:value;for(let i=0;i<ftAttempts;i++)if(rs()<.75)ftMade++;pts+=ftMade;}
 const rebounder=!made&&!fouled&&!isTO?weighted([...lineupA,...lineupD],p=>p.rebound,rs):null;
 const oreb=!!rebounder&&lineupA.includes(rebounder)&&rs()<.45;
 let putback=oreb&&rs()<clamp(.47+(rebounder.p2-.5)*.35,.25,.68);
 if(putback)pts+=2;
 const assist=pts>=2&&handler!==shooter&&rs()<clamp(handler.assist*2,.12,.73)?handler:null;
 return {sport:'NBA',att:a,q,shooter,handler,defender,passTo,lineupA,lineupD,kind,movement,pts,three:kind==='three',made,ftAttempts,ftMade,turnover:isTO,oreb,rebounder,putback,assist,timeCost,
   label:isTO?`${handler.name} loses the possession`:made?`${shooter.name} scores ${value}`:oreb?`${shooter.name} misses; ${rebounder.name} fights for the rebound`:`${shooter.name} misses the ${kind} attempt`,
   why:`${shooter.name}: ${Math.round(makeP*100)}% modeled ${kind} make chance (shrunk profile); defended by ${defender.name}. ${movement}.`,matchup:{shooter:shooter.name,defender:defender.name,shotType:kind,makeP:+makeP.toFixed(3)}};
}
function makeNBAGame(rosters,opts={}){return {sport:'NBA',rosters,phase:opts.phase||'preseason',scenario:opts.scenario||'B',pace:opts.pace||100,q:1,seconds:720,score:[0,0],offense:0,poss:[0,0],playerStats:{},hot:[0,0],ended:false,ot:0,lineupCache:{},events:[]};}
function commitNBA(game,p){if(game.ended)return;game.score[p.att]+=p.pts;game.poss[p.att]++;game.seconds=Math.max(0,game.seconds-p.timeCost);game.events.push(p);if(game.events.length>100)game.events.shift();
 const record=(pl,field,n=1)=>{if(!pl)return;let rec=game.playerStats[pl.id||pl.name]||(game.playerStats[pl.id||pl.name]={name:pl.name,pts:0,reb:0,ast:0,fga:0,fgm:0,tpa:0,tpm:0,tov:0});rec[field]+=n;};
 record(p.shooter,'fga',p.turnover?0:1);if(p.made)record(p.shooter,'fgm');if(p.three){record(p.shooter,'tpa');if(p.made)record(p.shooter,'tpm');}
 if(p.turnover)record(p.handler,'tov');record(p.shooter,'pts',p.pts-(p.putback?2:0));if(p.putback)record(p.rebounder,'pts',2);record(p.assist,'ast');if(p.rebounder)record(p.rebounder,'reb');
 if(!p.oreb)game.offense=1-game.offense;
 if(game.seconds<=0){if(game.q<4){game.q++;game.seconds=720;}else if(game.score[0]===game.score[1]&&game.ot<8){game.ot++;game.q++;game.seconds=300;}else {game.ended=true;}}
}
function playNBA(game,r=Math.random){let p=nbaPlay(game,r);commitNBA(game,p);return p;}
function mlbProfile(p){const st=p.stats||{},ab=safeNum(st.atBats),pa=safeNum(st.plateAppearances,ab+safeNum(st.baseOnBalls)),sample=pa/(pa+180),isH=pa>0;
 const model=(v,prior)=>isH?clamp(sample*v+(1-sample)*prior,0,1):prior;
 const avg=model(safeNum(st.avg,.245),.245), bb=model(safeNum(st.baseOnBalls)/Math.max(pa,1),.087),k=model(safeNum(st.strikeOuts)/Math.max(pa,1),.225);
 const hr=model(safeNum(st.homeRuns)/Math.max(pa,1),.031),doub=model(safeNum(st.doubles)/Math.max(pa,1),.047);
 const single=clamp(avg*(1-bb)-hr-doub,.07,.35),onbase=clamp(single+bb+hr+doub,.14,.55);
 return {...p,hit:{bb,k,hr,double:doub,single,onbase},statsSupported:isH,statPA:pa,quality:isH?'SHRUNK SEASON STATS':'LEAGUE PRIOR / UNKNOWN'};
}
function makeMLBGame(rosters,opts={}){ const lineups=rosters.map(side=>side.slice(0,9).map(mlbProfile));return {sport:'MLB',lineups,phase:opts.phase||'regular',scenario:opts.scenario||'B',score:[0,0],inning:1,top:true,outs:0,bases:[null,null,null],battingIndex:[0,0],pitchCount:[0,0],starterPitchCap:[opts.awayPitchCap||88,opts.homePitchCap||88],pitchers:[null,null],ended:false,events:[],hits:[0,0],atBats:0};}
function advanceBases(b,event,batter,r){let bases=b.slice(),runs=[];
 const take=(i)=>{let person=bases[i];bases[i]=null;return person;};
 const put=(i,pl)=>{if(pl)bases[i]=pl;};
 const run=pl=>{if(pl)runs.push(pl);};
 if(event==='walk'){
   if(bases[0]){if(bases[1]){if(bases[2])run(take(2));put(2,take(1));}put(1,take(0));}put(0,batter);
 } else if(event==='single'){
   if(bases[2])run(take(2));if(bases[1]){let x=take(1);if(r()<.70)run(x);else put(2,x);}if(bases[0]){let x=take(0);if(r()<.38 && !bases[2])put(2,x);else put(1,x);}put(0,batter);
 } else if(event==='double'){
   for(let i=2;i>=1;i--)if(bases[i])run(take(i));if(bases[0]){let x=take(0);if(r()<.52)run(x);else put(2,x);}put(1,batter);
 } else if(event==='homer') {for(let i=2;i>=0;i--)run(take(i));run(batter);
 }else if(event==='sac'){if(bases[2])run(take(2));if(bases[1])put(2,take(1));if(bases[0])put(1,take(0));}
 return {bases,runs};
}
function mlbAtBat(game,r=Math.random){
 const att=game.top?0:1,batter=game.lineups[att][game.battingIndex[att]%9],def=1-att;
 let ip=game.inning, count=game.pitchCount[def], cap=game.starterPitchCap[def];
 let bullpen=count>=cap*(game.scenario==='A'?1.2:game.scenario==='C'?.68:1);
 const data=batter?.hit||mlbProfile({name:'Unknown batter'}).hit;
 // League-rate categories, hitters adjusted modestly for team/pitcher context. Pitcher skill is unknown unless sourced.
 const st=game.phase==='preseason'?.96:1;
 const bb=clamp(data.bb*(bullpen?1.08:1)*st,.03,.18),k=clamp(data.k*(bullpen?.94:1)*st,.09,.35),hr=clamp(data.hr*(bullpen?1.1:1),.012,.08),doub=clamp(data.double,.018,.11),single=clamp(data.single,.075,.30);
 const u=r();let event=u<bb?'walk':u<bb+k?'strikeout':u<bb+k+hr?'homer':u<bb+k+hr+doub?'double':u<bb+k+hr+doub+single?'single':r()<.11?'sac':'out';
 const pitches=clamp(Math.round(3.8+normal(r)*1.3),1,9);
 const roll={sport:'MLB',batter,att,event,pitches,pitcher:game.pitchers[def]||{name:bullpen?'Relief pitcher':'Probable starter not reported',known:false},bullpen,inning:ip,top:game.top,kind:event,
    label:`${batter.name}: ${event.toUpperCase()}`,why:`${batter.name} ${batter.quality||'uncalibrated'}; pitcher skill ${game.pitchers[def]?'reported':'not provided'}; ${bullpen?'reliever':'starter'} workload.`};
 return roll;
}
function commitMLB(g,p,r=Math.random){if(g.ended)return;const att=p.att,def=1-att;g.atBats++;g.pitchCount[def]+=p.pitches;g.battingIndex[att]++;let runs=0;
 if(['walk','single','double','homer','sac'].includes(p.event)){const res=p.advance||advanceBases(g.bases,p.event,p.batter,r);g.bases=res.bases;runs=res.runs.length;if(p.event==='sac')g.outs++;if(['single','double','homer'].includes(p.event))g.hits[att]++;}
 else g.outs++;
 p.runs=runs;g.score[att]+=runs;g.events.push(p);if(g.events.length>100)g.events.shift();
 // Bottom 9+ walk-off ends instantly.
 if(!g.top&&g.inning>=9 && g.score[1]>g.score[0]){g.ended=true;return;}
 if(g.outs>=3){g.outs=0;g.bases=[null,null,null];if(g.top){g.top=false;
    if(g.inning>9&&g.phase==='regular')g.bases[1]={name:'Automatic runner',ghost:true};
    // Home team already leading after top 9+ never bats.
    if(g.inning>=9&&g.score[1]>g.score[0])g.ended=true;
  }else{if(g.inning>=9 && g.score[0]!==g.score[1])g.ended=true;else {g.top=true;g.inning++;if(g.inning>9&&g.phase==='regular')g.bases[1]={name:'Automatic runner',ghost:true};}}}
}
function playMLB(game,r=Math.random){const p=mlbAtBat(game,r);commitMLB(game,p,r);return p;}
function summarize(vals){let x=vals.slice().sort((a,b)=>a-b),n=x.length;return {mean:mean(x),p10:x[Math.floor((n-1)*.1)]||0,p50:x[Math.floor((n-1)*.5)]||0,p90:x[Math.floor((n-1)*.9)]||0};}
function runMonteCarlo(kind,rosters,opts={},n=10000){let results=[],aw=0,ho=0,draw=0;const seed=(opts.seed??(Date.now()>>>0));const r=rng(seed);
 for(let i=0;i<n;i++){
  let g=kind==='NBA'?makeNBAGame(rosters,opts):makeMLBGame(rosters,opts);
  if(kind==='NBA'){
    const shared=normal(r);g.hot=[clamp(shared*.38+normal(r)*.65,-2,2),clamp(shared*.38+normal(r)*.65,-2,2)];
    for(let j=0;!g.ended&&j<320;j++)playNBA(g,r);
  }else{for(let j=0;!g.ended&&j<220;j++)playMLB(g,r);}
  const a=g.score[0],b=g.score[1];if(a>b)aw++;else if(b>a)ho++;else draw++;
  results.push({a,b,total:a+b,margin:a-b});
 }
 const t=summarize(results.map(z=>z.total)),m=summarize(results.map(z=>z.margin));return {runs:n,seed,awayPct:aw/n*100,homePct:ho/n*100,drawPct:draw/n*100,meanAway:mean(results.map(z=>z.a)),meanHome:mean(results.map(z=>z.b)),total:t,margin:m,results};
}
const api={rng,normal,clamp,nbaProfile,nbaRoster,nbaFive,nbaPlay,makeNBAGame,commitNBA,playNBA,mlbProfile,makeMLBGame,mlbAtBat,commitMLB,playMLB,advanceBases,runMonteCarlo,summarize,phaseMinutes};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else g.SimEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this);
