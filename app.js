(()=>{'use strict';
const E=window.SimEngine, $=id=>document.getElementById(id), clamp=E.clamp;
const nbaNames=[['ATL','Atlanta','Hawks','#ea7468'],['BOS','Boston','Celtics','#49d09e'],['BKN','Brooklyn','Nets','#bac4cf'],['CHA','Charlotte','Hornets','#44c9cf'],['CHI','Chicago','Bulls','#e45c72'],['CLE','Cleveland','Cavaliers','#c8946b'],['DAL','Dallas','Mavericks','#70a7ff'],['DEN','Denver','Nuggets','#e6b46c'],['DET','Detroit','Pistons','#ee8391'],['GSW','Golden State','Warriors','#f2cb68'],['HOU','Houston','Rockets','#f36b79'],['IND','Indiana','Pacers','#e9ce74'],['LAC','Los Angeles','Clippers','#91b8e7'],['LAL','Los Angeles','Lakers','#ae94ed'],['MEM','Memphis','Grizzlies','#8db9de'],['MIA','Miami','Heat','#ff8e75'],['MIL','Milwaukee','Bucks','#67b08d'],['MIN','Minnesota','Timberwolves','#7db9ed'],['NOP','New Orleans','Pelicans','#d1b999'],['NYK','New York','Knicks','#f7a65b'],['OKC','Oklahoma City','Thunder','#70b9f5'],['ORL','Orlando','Magic','#6d9edb'],['PHI','Philadelphia','76ers','#5caaff'],['PHX','Phoenix','Suns','#ffa462'],['POR','Portland','Trail Blazers','#de7c87'],['SAC','Sacramento','Kings','#aa92e8'],['SAS','San Antonio','Spurs','#c0d2d9'],['TOR','Toronto','Raptors','#e67184'],['UTA','Utah','Jazz','#ab98d4'],['WAS','Washington','Wizards','#88a4d4']];
const mlbNames=[['ARI','Arizona','Diamondbacks','#c46e7e'],['ATL','Atlanta','Braves','#8cbcea'],['ATH','','Athletics','#e9c97a'],['BAL','Baltimore','Orioles','#f4a45e'],['BOS','Boston','Red Sox','#ee7885'],['CHC','Chicago','Cubs','#76a2fa'],['CHW','Chicago','White Sox','#c4cdd8'],['CIN','Cincinnati','Reds','#ed7688'],['CLE','Cleveland','Guardians','#b389dc'],['COL','Colorado','Rockies','#a98ddd'],['DET','Detroit','Tigers','#e9a77f'],['HOU','Houston','Astros','#e99a6a'],['KCR','Kansas City','Royals','#76b4ff'],['LAA','Los Angeles','Angels','#f68783'],['LAD','Los Angeles','Dodgers','#68aaf4'],['MIA','Miami','Marlins','#68c9df'],['MIL','Milwaukee','Brewers','#e4bd76'],['MIN','Minnesota','Twins','#f59b93'],['NYM','New York','Mets','#f0a466'],['NYY','New York','Yankees','#93a5d5'],['PHI','Philadelphia','Phillies','#ef7286'],['PIT','Pittsburgh','Pirates','#e5c76d'],['SDP','San Diego','Padres','#d9bd86'],['SEA','Seattle','Mariners','#6cc9b5'],['SFG','San Francisco','Giants','#f2b579'],['STL','St. Louis','Cardinals','#f38c8e'],['TBR','Tampa Bay','Rays','#a1bbef'],['TEX','Texas','Rangers','#73a9ff'],['TOR','Toronto','Blue Jays','#78b9e7'],['WSN','Washington','Nationals','#e89a9a']];
const TEAMS={NBA:Object.fromEntries(nbaNames.map(x=>[x[0],{id:x[0],city:x[1],name:x[2],color:x[3]}])),MLB:Object.fromEntries(mlbNames.map(x=>[x[0],{id:x[0],city:x[1],name:x[2],color:x[3]}]))};
const ESPN_NBA_REMAP={'GS':'GSW','SA':'SAS','NY':'NYK','NO':'NOP','NOR':'NOP','PHO':'PHX','WSH':'WAS','UTAH':'UTA'};
const MLB_IDS={ARI:109,ATL:144,ATH:133,BAL:110,BOS:111,CHC:112,CHW:145,CIN:113,CLE:114,COL:115,DET:116,HOU:117,KCR:118,LAA:108,LAD:119,MIA:146,MIL:158,MIN:142,NYM:121,NYY:147,PHI:143,PIT:134,SDP:135,SEA:136,SFG:137,STL:138,TBR:139,TEX:140,TOR:141,WSN:120};
const analysts=[
 {name:'Rotation Analyst',sub:'Minutes • Lineups • Bench impact',icon:'◷',insight:'Compares each player’s observed minutes with season-specific workload limits. The biggest preseason threat is a strong starting unit giving way to a weak reserve group.',load:67},
 {name:'Scouting Desk',sub:'Offence • Defence • Matchups',icon:'⌖',insight:'Matches the named shooter and on-ball defender; weighs three-point selection, rim pressure, blocks, rebounding and source-quality-adjusted shot rates.',load:76},
 {name:'Simulation Operations',sub:'Possessions • Scenarios • Monte Carlo',icon:'◈',insight:'Runs possession or at-bat sequences, then stress-tests starter-heavy, expected and reserve-heavy versions in a separate worker.',load:87},
 {name:'Injury & Availability',sub:'Statuses • Sources • Restrictions',icon:'☷',insight:'Checks that player absences, minutes caps and baseball lineup cards have explicit sources and timestamps. An unknown limit never means unrestricted.',load:49},
 {name:'Broadcast Director',sub:'Camera • Sequence detail • Storylines',icon:'◎',insight:'Coordinates continuous setup, passing, screening, drives, release and rebound sequences. The action is procedural, not a recreation of actual tracked games.',load:60},
 {name:'Model Calibration & Risk',sub:'Confidence • Data gaps • Variance',icon:'◇',insight:'Penalizes tiny samples and exposes simulation disagreement across rotation scenarios. The model is not historically validated and cannot claim a proven betting edge.',load:55}
];
const state={view:'hq',sport:'NBA',away:'BOS',home:'PHI',phase:'preseason',scenario:'B',restriction:0,speed:1,camera:'broadcast',fixtureId:'',fixture:null,fixtures:[],playerIndex:{NBA:{},MLB:{}},dataAt:null,dataMode:'OFFLINE',errors:[],nbaIds:null,sourceQuality:'DEMO',dataLoaded:false,selectedAnalyst:0,focusPlayer:null,filter:'ALL',currentGame:null,playing:false,stepOnly:false,anim:null,actors:[],ball:{x:0,y:0,z:0},frameTime:0,log:[],priorMatchup:null,visualBench:[],startRequested:false};
const percent=n=>Math.round(n*100)+'%',esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const statusDate=s=>{try{return new Date(s).toLocaleString('en-AU',{timeZone:'Australia/Melbourne',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});}catch(e){return 'Unknown time';}};
const stateStr=()=>`${state.sport} · ${state.away} @ ${state.home} · ${state.phase.toUpperCase()}`;
function view(name){state.view=name;document.querySelectorAll('.screen').forEach(n=>n.classList.toggle('active',n.id==='page-'+name));document.querySelectorAll('.navitem').forEach(n=>n.classList.toggle('active',n.dataset.view===name));window.scrollTo({top:0,behavior:'instant'});if(name==='lab')syncAssumptions();}
function analystSelect(i){state.selectedAnalyst=i;document.querySelectorAll('.hQHotspot').forEach((n,k)=>n.classList.toggle('active',k===i));const a=analysts[i];$('analystCode').textContent=`STATION ${String(i+1).padStart(2,'0')} / 06`;$('analystSymbol').textContent=a.icon;$('analystTitle').textContent=a.name;$('analystSub').textContent=a.sub;$('analystInsight').textContent=a.insight;$('analystLoad').style.width=a.load+'%';}
function setSourceBadge(){const ready=Object.values(state.playerIndex[state.sport]||{}).some(t=>t.players?.length && t.observedAt && Date.now()-Date.parse(t.observedAt)<48*3600000);const recent=state.dataAt&&Date.now()-new Date(state.dataAt).getTime()<86400000;
 $('sourceChip').innerHTML=`<i class="statusDot ${recent&&ready?'':'orange'}"></i>${recent&&ready?'PUBLISHED PLAYER DATA':state.dataMode==='LIVE'?'LIVE SCHEDULE / MIXED DATA':'UNVERIFIED OR STALE'}`;
 $('feedState').textContent=state.fixtures.length?`${state.fixtures.length} fixtures loaded`:'No published fixtures'; $('rosterState').textContent=ready?'Named roster data':'Not connected';
 $('lastVerified').textContent=state.dataAt?statusDate(state.dataAt):'No timestamp';$('modelState').textContent='Exploratory · not calibrated';
 $('dataAge').textContent=recent?'RECENT INPUTS':'STALE / UNAVAILABLE';$('healthTitle').textContent=recent?'Published sports-data snapshot loaded':state.fixtures.length?'Published fixtures — check freshness':'No current reliable fixture data';
 $('healthMessage').textContent=state.errors.length?`Some feeds failed: ${state.errors.slice(0,2).join(' / ')}. Missing inputs remain unknown.`:'Lineups are not confirmed unless the publisher explicitly reports them. NBA rosters alone do not identify tonight’s starters.';
 $('healthGames').textContent=state.fixtures.length; $('healthTeams').textContent=Object.values(state.playerIndex).reduce((a,obj)=>a+Object.keys(obj).length,0);
 $('healthWhen').textContent=state.dataAt?statusDate(state.dataAt):'N/A';$('dataMode').textContent=state.dataMode+' SOURCE';
}
function currentRows(sport=state.sport,team=state.away){return state.playerIndex[sport]?.[team]?.players||[];}
function rosterStatus(team){const obj=state.playerIndex[state.sport]?.[team];return obj?.players?.length?`${obj.players.length} rostered`:'roster unavailable';}
function displayTeam(sport,key){const t=TEAMS[sport]?.[key];return t?[t.city,t.name].filter(Boolean).join(' '):key;}
function gameIsUpcoming(g){const t=Date.parse(g.startUTC||0);return Number.isFinite(t)&&t>=Date.now()-240000&&String(g.state||'').toLowerCase()!=='post';}
function renderMissions(){const games=state.fixtures.filter(gameIsUpcoming).slice(0,5);$('hqFixtures').replaceChildren();if(!games.length){$('hqFixtures').innerHTML='<div class="emptyMini">No verified upcoming games in the connected window.<br>Use the Data Desk to refresh or simulate a manual matchup.</div>';return;}
 for(const g of games){let b=document.createElement('button');b.className='missionRow';b.innerHTML=`<span class="league">${g.sport}</span><span><strong>${g.away} @ ${g.home}</strong><small>${statusDate(g.startUTC)} AEDT/AEST · ${String(g.phase||'unknown').toUpperCase()}</small></span><span class="rightArrow">↗</span>`;b.onclick=()=>selectFixture(g.id,true);$('hqFixtures').append(b);}}
function renderFixtureOptions(){let sel=$('fixtureSelect'),old=state.fixtureId;sel.replaceChildren(new Option('Manual matchup / select published game',''));
 for(const g of state.fixtures.filter(x=>x.sport===state.sport && Date.parse(x.startUTC)>Date.now()-3*86400000).sort((a,b)=>Date.parse(a.startUTC)-Date.parse(b.startUTC))){sel.add(new Option(`${g.away} @ ${g.home} • ${statusDate(g.startUTC)} • ${(g.phase||'?').toUpperCase()}`,g.id));}sel.value=old||'';}
function populateTeams(){for(const side of ['away','home']){const sel=$(side+'Select');sel.replaceChildren();for(const key of Object.keys(TEAMS[state.sport]).sort()){let t=TEAMS[state.sport][key];sel.add(new Option(`${key} · ${[t.city,t.name].filter(Boolean).join(' ')}`,key));}sel.value=state[side];}renderFixtureOptions();}
function applyControls(){document.querySelectorAll('[data-sport]').forEach(x=>x.classList.toggle('chosen',x.dataset.sport===state.sport));document.querySelectorAll('[data-season]').forEach(x=>x.classList.toggle('chosen',x.dataset.season===state.phase));document.querySelectorAll('[data-scenario]').forEach(x=>x.classList.toggle('chosen',x.dataset.scenario===state.scenario));document.querySelectorAll('[data-rate]').forEach(x=>x.classList.toggle('chosen',Number(x.dataset.rate)===state.speed));document.querySelectorAll('[data-camera]').forEach(x=>x.classList.toggle('active',x.dataset.camera===state.camera));
 $('restrictionVal').textContent=state.restriction+'%';$('restriction').value=state.restriction;$('feedTitle').textContent=`${state.sport} • ${state.sport==='NBA'?'BASKETBALL':'BASEBALL'} SIMULATION`;$('scenarioLabel').textContent=`${state.phase.toUpperCase()} · ${state.scenario==='A'?'STARTER+':state.scenario==='B'?'EXPECTED':'BENCH+'}`;
 $('rosterBadge').textContent=currentRows(state.sport,state.away).length&&currentRows(state.sport,state.home).length?'NAMED ROSTERS · SOURCED':'ROSTER GAPS · PRIOR MODE';
 $('feedQuality').textContent=`${state.fixture?.source||'MANUAL MATCHUP'} · NOT LIVE TRACKING`;
 $('fixtureDetail').textContent=state.fixture? `${state.fixture.status||'Scheduled'} · ${statusDate(state.fixture.startUTC)} Melbourne · ${state.fixture.source||'Provider unknown'}${['in','post','final'].includes(String(state.fixture.state||'').toLowerCase())?' · WHAT-IF FROM 0–0, NOT LIVE STATE':''}` : 'Manual what-if mode · no confirmed starters or live game assumed.';
 for(const s of ['A','B']){const id=s==='A'?state.away:state.home;const t=TEAMS[state.sport][id];$(s==='A'?'crestA':'crestB').textContent=id;$(s==='A'?'teamAName':'teamBName').textContent=displayTeam(state.sport,id).toUpperCase();$(s==='A'?'crestA':'crestB').style.borderColor=t?.color||'#456';}
 $('playerSport').value=state.sport;fillTeamPicker();syncAssumptions();updateScore();}
function selectFixture(id,goArena){const f=state.fixtures.find(x=>x.id===id);if(!f)return;state.fixture=f;state.fixtureId=f.id;state.sport=f.sport;state.away=f.away;state.home=f.home;if(['preseason','regular','playoffs'].includes(f.phase))state.phase=f.phase;
 populateTeams();applyControls();reset();ensureRoster(state.sport,state.away);ensureRoster(state.sport,state.home);if(goArena)view('arena');}
function chooseManual(){state.fixture=null;state.fixtureId='';$('fixtureSelect').value='';reset();}
const fallback=(team,sport,count)=>Array.from({length:count},(_,i)=>({id:`DEMO-${sport}-${team}-${i}`,name:`Unverified ${i+1}`,team,jersey:String(i+1),position:sport==='NBA'?(i%5===4?'C':i%5>=2?'F':'G'):(i%9===0?'C':'OF'),isPlaceholder:true}));
function getLineupForTeam(team){const original=currentRows(state.sport,team);if(state.sport==='NBA'){
 const ln=state.fixture?.lineups?.[team];let source=original.slice();if(ln?.status==='confirmed'&&ln.players?.length===5){const confirmed=ln.players.map(n=>original.find(p=>p.name===n)).filter(Boolean);source=confirmed.concat(original.filter(p=>!confirmed.includes(p)));source.forEach((p,i)=>p.starter=i<5);}
 if(!source.length)source=fallback(team,'NBA',12);
 const overrides=(state.fixture?.restrictions||[]).filter(x=>x.team===team);
 const enriched=E.nbaRoster(source,state.phase,state.scenario,overrides);
 if(state.restriction){for(const [i,p] of enriched.entries()){if(i<5){p.minutesCap=Math.min(p.minutesCap,Math.round(p.minutesCap*(1-state.restriction/180)));p.projectedMinutes=Math.min(p.projectedMinutes,p.minutesCap);}}}
 return enriched;
 }
 let order=original.filter(x=>!(/^P$|^SP$|^RP$/.test(x.position||''))).sort((a,b)=>Number(b.stats?.plateAppearances||0)-Number(a.stats?.plateAppearances||0));
 const ln=state.fixture?.lineups?.[team];if(['confirmed','projected'].includes(ln?.status)&&ln.players?.length===9){order=ln.players.map(n=>original.find(p=>p.name===n)).filter(Boolean).concat(order.filter(x=>!ln.players.includes(x.name)));}
 if(order.length<9)order=order.concat(fallback(team,'MLB',9-order.length));return order.slice(0,9);
}
function buildGame(){let a=getLineupForTeam(state.away),b=getLineupForTeam(state.home),opts={phase:state.phase,scenario:state.scenario,pace:100};if(state.sport==='MLB'){
 const f=state.fixture,p=f?.pitchers||{};opts.awayPitchCap=90*(1-state.restriction/175);opts.homePitchCap=90*(1-state.restriction/175);let game=E.makeMLBGame([a,b],opts);
 game.pitchers=[p[state.away]?.name?{name:p[state.away].name,known:true}:null,p[state.home]?.name?{name:p[state.home].name,known:true}:null];return game;
 }return E.makeNBAGame([a,b],opts);
}
function reset(){state.playing=false;state.stepOnly=false;state.anim=null;state.actors=[];state.visualBench=[];state.log=[];state.priorMatchup=null;state.currentGame=buildGame();$('playPause').textContent='▶ PLAY SIMULATION';updateScore();renderLog();renderUnits();$('playPhase').textContent='READY';$('playTitle').textContent='Model ready · Press Play';$('arenaWhy').textContent='Animations are generated sequences, not observed gameplay or player-tracking data.';renderTactics(null);}
function updateScore(){const game=state.currentGame;if(!game)return;$('scoreA').textContent=game.score[0];$('scoreB').textContent=game.score[1];if(state.sport==='NBA'){
 $('period').textContent=game.q>4?'OT '+(game.q-4):'Q'+game.q;$('clock').textContent=Math.floor(game.seconds/60)+':'+String(Math.floor(game.seconds%60)).padStart(2,'0');
 }else{$('period').textContent=`${game.top?'TOP':'BOT'} ${game.inning}`;$('clock').textContent=`${game.outs} OUT · ${game.bases.filter(Boolean).length} ON`;} $('gameStatus').textContent=game.ended?'FINAL • SIMULATED':state.playing?'SIMULATION RUNNING':'READY / PAUSED';}
function logPlay(p){state.log.unshift({period:state.sport==='NBA'?'Q'+p.q:(p.top?'TOP ':'BOT ')+p.inning,label:p.label||p.event,reason:p.why});state.log=state.log.slice(0,40);renderLog();}
function renderLog(){let box=$('eventFeed');box.replaceChildren();$('playCount').textContent=state.log.length+' PLAYS';if(!state.log.length){box.innerHTML='<div class="emptyMini">Start the simulated game to see generated play-by-play.</div>';return;}
 state.log.forEach(x=>{let div=document.createElement('div');div.className='eventRow';div.innerHTML=`<b>${esc(x.period)}</b><p><strong>${esc(x.label)}</strong><br>${esc(x.reason)}</p>`;box.append(div);});}
function updateFocus(p){if(!p)return;state.focusPlayer=p;$('focusName').textContent=p.name;$('focusTeam').textContent=`${p.team||'?'} · #${p.jersey||'—'}`;$('focusRole').textContent=`${p.position||'ROLE UNKNOWN'} · ${p.quality||'DATA NOT VERIFIED'}`;
 const img=$('focusImage');if(p.headshot&&/^https:\/\//i.test(p.headshot)){img.src=p.headshot;img.style.display='block';img.onerror=()=>{img.removeAttribute('src');img.style.display='none'};}else{img.removeAttribute('src');img.style.display='none';}
 let facts=state.sport==='NBA'?[
 ['3PT SELECTION',percent(p.three||.33)],['3PT MODEL',percent(p.p3||.35)],['2PT MODEL',percent(p.p2||.50)],['EXPECTED MINUTES',(p.projectedMinutes??'?')+' min'],
 ['MINUTE RANGE',p.minuteRange?`${p.minuteRange[0]}–${p.minuteRange[1]}`:'Unknown'],['OBSERVED GAMES',String(p.statGames||0)]
 ]:[['HIT MODEL',percent(p.hit?.single||.19)],['HR / PA',percent(p.hit?.hr||.03)],['WALK / PA',percent(p.hit?.bb||.09)],['K / PA',percent(p.hit?.k||.23)],['SAMPLE PA',String(p.statPA||0)],['ROLE',p.position||'Unknown']];
 $('focusTraits').innerHTML=facts.map(x=>`<div class="trait"><small>${esc(x[0])}</small><strong>${esc(x[1])}</strong></div>`).join('');$('focusSource').textContent=(p.dataSource||'No verified individual stats')+' · '+(p.quality||'No validated player profile')+'. Calculated attributes are shrinkage-model estimates, not official ratings.';
 $('focusStatus').textContent=p.statsSupported?'OBSERVED SAMPLE':'POSITION / LEAGUE PRIOR';}
function renderUnits(){const g=state.currentGame;if(!g)return;let a=state.sport==='NBA'?(state.visualBench[0]?.length?state.visualBench[0]:E.nbaFive(g.rosters[0],g.q,0,g.phase,g.scenario)):g.lineups[0].slice(0,9),b=state.sport==='NBA'?(state.visualBench[1]?.length?state.visualBench[1]:E.nbaFive(g.rosters[1],g.q,0,g.phase,g.scenario)):g.lineups[1].slice(0,9);
 state.visualBench=[a,b];let side=(club,arr)=>`<div class="unitGroup"><strong>${esc(club)} ${state.sport==='NBA'?'ON COURT':'BATTING ORDER'}</strong>${arr.map(p=>`<button class="unitPlayer" data-player="${esc(p.id)}">${esc(p.name)} ${p.jersey?'#'+esc(p.jersey):''}${p.isPlaceholder?' · demo':''}</button>`).join('')}</div>`;
 $('floorUnits').innerHTML=side(state.away,a)+side(state.home,b);
 $('floorUnits').querySelectorAll('[data-player]').forEach(btn=>btn.onclick=()=>{const person=[...a,...b].find(p=>String(p.id)===btn.dataset.player);if(person)updateFocus(person);});
 const lineA=state.fixture?.lineups?.[state.away]?.status||'unknown',lineB=state.fixture?.lineups?.[state.home]?.status||'unknown';
 $('lineupDisclaimer').textContent=`${state.away}: ${lineA.toUpperCase()} · ${state.home}: ${lineB.toUpperCase()} · ${state.sport==='NBA'?'five-man rotation projected; published roster ≠ confirmed starting five':'batting order only confirmed with a published nine-player card'}.`;
}
function renderTactics(p){let out=$('tacticalReport');if(!p){out.innerHTML='<div class="emptyMini">Tactical notes appear as the engine generates matchups.</div>';return;}let rows=state.sport==='NBA'?[
 ['PRIMARY MATCHUP',`${p.shooter.name} vs ${p.defender.name}`],['PLAY DESIGN',`${p.movement.replaceAll('-',' ')} → ${p.kind.toUpperCase()}`],['SOURCE QUALITY',`${p.shooter.quality}; defence uses ${p.defender.quality}`],['MODELLED SHOT CHANCE',percent(p.matchup.makeP)]
 ]:[['HITTER',p.batter.name],['PITCHING STAGE',p.bullpen?'Relief exposure':'Starter exposure'],['RESULT',p.event.toUpperCase()],['PROFILE QUALITY',p.batter.quality]];
 out.innerHTML=rows.map(x=>`<div class="tactic"><strong>${esc(x[0])}</strong><p>${esc(x[1])}</p></div>`).join('');}
function drawAssumptionProfile(){const a=getLineupForTeam(state.away),b=getLineupForTeam(state.home),scores=[a,b].map(side=>side.length?Math.round(side.reduce((t,p)=>t+(p.statsSupported?1:0),0)/side.length*100):0);return scores;}
function syncAssumptions(){const q=drawAssumptionProfile(), f=state.fixture;
 const rows=[['Sport / Matchup',stateStr()],['Game source',f?.source||'Manual what-if matchup'],['Game status',f?.status||'No scheduled game selected'],['Away / Home profiles',`${q[0]}% / ${q[1]}% observed player samples`],['Rotation scenario',state.scenario==='A'?'More starters':state.scenario==='C'?'More bench':'Expected'],['Restriction sensitivity',`${state.restriction}% MANUAL (not confirmed)`],['NBA minutes logic',state.phase==='preseason'?'Aggressive veteran phase-down':state.phase==='playoffs'?'Tighter postseason rotation':'Regular-season rotation'],['MLB extra innings',state.phase==='playoffs'?'No automatic runner':'Automatic runner in regular season'],['Calibration','Not historically validated']];
 $('assumptionRows').innerHTML=rows.map(([k,v])=>`<div class="assumption"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('');
 $('matchupLab').innerHTML=`<p><b>${esc(state.away)}</b>: ${q[0]}% player stat sample coverage. ${esc(rosterStatus(state.away))}. Shoot/pass/contact roles are modelled with sample shrinkage.</p><p><b>${esc(state.home)}</b>: ${q[1]}% player stat sample coverage. ${esc(rosterStatus(state.home))}. Defensive and substitution uncertainty remain material.</p><p>Heavy bench use is tested independently. Without sourced lineup minutes and prior box scores, treat any resulting win rate as illustrative.</p>`;}
const canvas=$('gameCanvas'),ctx=canvas.getContext('2d');const W=canvas.width,H=canvas.height;
let _now=0;
function proj(x,y,z=0){const mode=state.camera;if(mode==='tactical')return {x:W/2+(x-.5)*1110,y:H*.53+(y-.5)*505-z*290};if(mode==='court')return{x:W/2+(x-.5)*1180+(y-.5)*65,y:H*.68+(y-.5)*315-(x-.5)*23-z*325};return{x:W/2+(x-.5)*1025+(y-.5)*95,y:H*.58+(y-.5)*365-(x-.5)*44-z*275};}
function line(a,b,color,width=2){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
function polygon(points,fill,stroke=null,width=1){ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);points.slice(1).forEach(p=>ctx.lineTo(p.x,p.y));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.lineWidth=width;ctx.strokeStyle=stroke;ctx.stroke();}}
function ellipse(x,y,rx,ry,fill,stroke='',lw=1){ctx.beginPath();ctx.ellipse(x,y,Math.max(1,rx),Math.max(1,ry),0,0,Math.PI*2);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke();}}
function circle(x,y,r,fill,stroke='',lw=1){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke();}}
function drawBackdrop(sport){const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#102842');sky.addColorStop(.47,'#071927');sky.addColorStop(1,'#09182a');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
 // Upper tier stadium architecture and animated light arrays.
 for(let j=0;j<3;j++){const y=130+j*65;ctx.fillStyle=j===1?'#12263d':'#102138';ctx.fillRect(0,y,W,49);for(let i=0;i<140;i++){const a=.21+Math.abs(Math.sin(i*3.14+j*7))*.24;ctx.fillStyle=i%9===0?`rgba(117,186,225,${a+.11})`:`rgba(120,143,170,${a})`;ctx.fillRect((i*29+j*11)%W,y+5+(i%4)*7,11,5);}}
 let glow=ctx.createRadialGradient(W/2,310,30,W/2,310,650);glow.addColorStop(0,'#184f6959');glow.addColorStop(1,'transparent');ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
 const roof=ctx.createLinearGradient(0,0,0,130);roof.addColorStop(0,'#102942');roof.addColorStop(1,'#061323');ctx.fillStyle=roof;ctx.fillRect(0,0,W,105);
 for(let i=0;i<14;i++){ctx.fillStyle=i%3?'#4f859b':'#6db9e6';ctx.globalAlpha=.13;ctx.fillRect(i*115-35,95,78,3);ctx.globalAlpha=1;}
 ctx.fillStyle='#0e2035';ctx.fillRect(0,H-120,W,120);
 ctx.fillStyle='#66bce555';ctx.font='900 19px sans-serif';ctx.textAlign='center';ctx.fillText(`SIMVERSE / ${sport} LIVE SIMULATION STAGE`,W/2,90);}
function drawCourt(){const corners=[proj(.06,.13),proj(.94,.13),proj(.94,.87),proj(.06,.87)],wood=ctx.createLinearGradient(0,230,W,H);wood.addColorStop(0,'#b47b50');wood.addColorStop(.44,'#bd895e');wood.addColorStop(1,'#895f43');polygon(corners,wood,'#f7dfbf',4);
 ctx.save();ctx.beginPath();ctx.moveTo(corners[0].x,corners[0].y);for(let i=1;i<4;i++)ctx.lineTo(corners[i].x,corners[i].y);ctx.closePath();ctx.clip();for(let x=.08;x<.94;x+=.018){line(proj(x,.13),proj(x,.87),'#38251a20',1.4);}const len=.74;line(proj(.5,.13),proj(.5,.87),'#fff2d6ba',4);
 const cent=proj(.5,.5);ellipse(cent.x,cent.y,70,state.camera==='tactical'?69:34,'','#fff3dbb9',3);
 for(const flip of [false,true]){const bx=flip?.79:.11;const x0=flip?.79:.11;const xa=flip?.94:.06;const yl=.36,yh=.64;const p1=proj(Math.min(x0,xa),yl),p2=proj(Math.max(x0,xa),yl),p3=proj(Math.max(x0,xa),yh),p4=proj(Math.min(x0,xa),yh);polygon([p1,p2,p3,p4],'#184f554e','#fff1ddb8',2.6);
 const hoop=proj(flip?.90:.10,.5),mid=proj(flip?.78:.22,.5);ellipse(hoop.x,hoop.y,14,9,'','#ff855f',4);ellipse(mid.x,mid.y,50,23,'','#fff1ddb7',2);
 for(let a=-1.18;a<=1.18;a+=.07){const x=flip?.90-.24*Math.cos(a):.10+.24*Math.cos(a),y=.5+Math.sin(a)*.43;if(a===-1.18){ctx.beginPath();const z=proj(x,y);ctx.moveTo(z.x,z.y);}else{const z=proj(x,y);ctx.lineTo(z.x,z.y);} }ctx.strokeStyle='#fff3ddb3';ctx.lineWidth=2.5;ctx.stroke();}
 ctx.restore();const c=proj(.5,.5);ctx.fillStyle='#ffffff17';ctx.font='900 24px sans-serif';ctx.textAlign='center';ctx.fillText('SIMVERSE',c.x,c.y+8);}
function jerseyPlayer(pl,highlight=false){const p=proj(pl.x,pl.y,0),scale=state.camera==='court'?1.25:state.camera==='tactical'?.82:1.0;
 const color=TEAMS.NBA[pl.team===0?state.away:state.home]?.color||'#72adff';
 ellipse(p.x,p.y+17*scale,19*scale,7*scale,'#08101a8a');if(highlight){circle(p.x,p.y-35*scale,35*scale,'','#6debd18b',1.5);}
 const move=(pl.speed||0)*Math.sin(_now/180+pl.index)*5,hip=p.y-8*scale,neck=p.y-37*scale;
 line({x:p.x-7*scale,y:hip},{x:p.x-8*scale-move,y:p.y+13*scale},'#192b39',6*scale);
 line({x:p.x+7*scale,y:hip},{x:p.x+8*scale+move,y:p.y+13*scale},'#152d43',6*scale);
 polygon([{x:p.x-12*scale,y:neck},{x:p.x+12*scale,y:neck},{x:p.x+13*scale,y:hip},{x:p.x-13*scale,y:hip}],color,'#edf9ff77',1.2);
 line({x:p.x-11*scale,y:neck+4},{x:p.x-17*scale+move,y:hip+4},'#be8d71',5*scale);
 line({x:p.x+11*scale,y:neck+4},{x:p.x+18*scale-move,y:hip+4},'#be8d71',5*scale);
 circle(p.x,p.y-49*scale,11*scale,'#b18f78','#513e38',1);
 ctx.textAlign='center';ctx.font=`900 ${11*scale}px system-ui`;ctx.fillStyle='#071a23';ctx.fillText(String(pl.player.jersey||((pl.index%5)+1)),p.x,p.y-17*scale);
 const last=pl.player.name?.split(' ').slice(-1)[0]||'UNKNOWN';const text=String(last).slice(0,13);ctx.font=`800 ${10*scale}px system-ui`;let tw=ctx.measureText(text).width;ctx.fillStyle=highlight?'#1e5362ed':'#0a1d31d8';ctx.fillRect(p.x-tw/2-8,p.y+22*scale,tw+16,16*scale);ctx.fillStyle=highlight?'#effffc':'#d0e3f7';ctx.fillText(text,p.x,p.y+34*scale);
}
function paintBall(point,large=false){const p=proj(point.x,point.y,point.z||0);circle(p.x+2,p.y+8,large?11:9,'#040f1777');circle(p.x,p.y,large?11:9,'#eab46b','#603922',1.3);ctx.strokeStyle='#5e3823';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(p.x-8,p.y-2);ctx.quadraticCurveTo(p.x+1,p.y+1,p.x+8,p.y+6);ctx.stroke();}
function drawNBAPaint(){drawBackdrop('NBA');drawCourt();let arr=state.actors;if(!arr.length){const home=state.currentGame?.rosters?.[1]||[],away=state.currentGame?.rosters?.[0]||[];const p0=E.nbaFive(away,1,0,state.phase,state.scenario),p1=E.nbaFive(home,1,0,state.phase,state.scenario);arr=[...p0.map((p,i)=>({player:p,team:0,index:i,x:.25+i*.04,y:.17+i*.16,speed:0})),...p1.map((p,i)=>({player:p,team:1,index:i+5,x:.75-i*.04,y:.17+i*.16,speed:0}))];}
 arr.slice().sort((a,b)=>a.y-b.y).forEach(pl=>{const active=state.anim?.event?.shooter?.id===pl.player.id;jerseyPlayer(pl,active);});
 if(state.actors.length)paintBall(state.ball,true);
 drawCourtInfo();}
function drawCourtInfo(){const w=W;ctx.fillStyle='#082438ce';ctx.fillRect(28,H-145,215,42);ctx.fillStyle='#c1eced';ctx.textAlign='left';ctx.font='900 12px sans-serif';ctx.fillText('◉ MOTION ENGINE ACTIVE',42,H-118);ctx.fillStyle='#80acc6';ctx.font='11px sans-serif';ctx.fillText('Animated model events • Not player tracking',42,H-102);}
function baseballP(x,y,z=0){const c=state.camera;return {x:W/2+(x-.5)*(c==='court'?1170:940),y: H*.64+(y-.5)*(c==='tactical'?750:650)-z*270};}
function drawBaseball(){drawBackdrop('MLB');const grass=ctx.createLinearGradient(0,130,W,H);grass.addColorStop(0,'#153d31');grass.addColorStop(.54,'#1f5f3e');grass.addColorStop(1,'#0f3b2c');
 const left=baseballP(.03,.90),top=baseballP(.50,.06),right=baseballP(.97,.90);polygon([left,top,right],grass,'#acd9a566',4);
 ctx.save();ctx.beginPath();ctx.moveTo(left.x,left.y);ctx.lineTo(top.x,top.y);ctx.lineTo(right.x,right.y);ctx.closePath();ctx.clip();for(let i=-5;i<7;i++){ctx.fillStyle=i%2?'#225d3eb8':'#184e3a9c';ctx.save();ctx.translate(W/2,H*.6);ctx.rotate(-.5);ctx.fillRect(-750+i*230,-750,130,1500);ctx.restore();}ctx.restore();
 const h=baseballP(.5,.86),first=baseballP(.72,.65),second=baseballP(.5,.43),third=baseballP(.28,.65);
 polygon([h,first,second,third],'#ab815a','#eacda1bb',4);
 polygon([baseballP(.5,.82),baseballP(.70,.64),baseballP(.50,.46),baseballP(.30,.64)],'#c4966c66');
 const mound=baseballP(.5,.64);ellipse(mound.x,mound.y,30,19,'#ad8865','#d7c3a3',2);
 for(const p of [h,first,second,third]){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.PI/4);ctx.fillStyle='#f8ead4';ctx.fillRect(-7,-7,14,14);ctx.restore();}
 const game=state.currentGame,p=state.anim?.event;
 const defending=game?.top?state.home:state.away,defRoster=currentRows('MLB',defending),teamColor=TEAMS.MLB[defending]?.color||'#74bdde';
 const fielders=[[.50,.64],[.33,.57],[.72,.57],[.50,.44],[.29,.34],[.49,.25],[.70,.34],[.50,.80]];
 fielders.forEach((spot,i)=>{let pr=baseballP(...spot);drawBasePerson(pr,teamColor,'',i)});
 const batter=p?.batter||game?.lineups?.[game?.top?0:1]?.[(game?.battingIndex[game?.top?0:1]||0)%9];if(batter)drawBasePerson(baseballP(.55,.83),TEAMS.MLB[game?.top?state.away:state.home]?.color||'#e6c282',batter.name,9,true);
 const runners=state.anim?.baseRunners||game?.bases?.map((x,i)=>x?{name:x.name,x:[.72,.50,.28][i],y:[.65,.43,.65][i]}:null).filter(Boolean)||[];
 for(const runner of runners){let q=baseballP(runner.x,runner.y);drawBasePerson(q,'#eab26d',runner.name||'',10,true);}
 const bp=state.anim?.ball||{x:.50,y:.64,z:.10};let q=baseballP(bp.x,bp.y,bp.z);circle(q.x,q.y,6,'#f4f7fb','#789ac2',1);
 ctx.fillStyle='#cbf3e8';ctx.font='900 15px system-ui';ctx.textAlign='center';ctx.fillText('SIMVERSE • BASEBALL PARK',W/2,H-38);
}
function drawBasePerson(p,color,name,idx=0,highlight=false){ellipse(p.x,p.y+11,14,5,'#010d15ac');if(highlight)circle(p.x,p.y-15,27,'','#55edd270',1.4);
 line({x:p.x-6,y:p.y-8},{x:p.x-6+Math.sin(_now/225+idx)*2,y:p.y+10},'#152b3c',5);
 line({x:p.x+6,y:p.y-8},{x:p.x+6-Math.sin(_now/225+idx)*2,y:p.y+10},'#152b3c',5);
 polygon([{x:p.x-11,y:p.y-28},{x:p.x+11,y:p.y-28},{x:p.x+10,y:p.y-8},{x:p.x-10,y:p.y-8}],color,'#d4f0ff76',1);circle(p.x,p.y-40,9,'#c49b7b','#735339');if(name){ctx.font='800 12px system-ui';ctx.fillStyle='#ebfcff';ctx.textAlign='center';ctx.fillText(String(name).split(' ').slice(-1)[0].slice(0,16),p.x,p.y-59);}}
function canvasFrame(t){_now=t;ctx.clearRect(0,0,W,H);state.sport==='NBA'?drawNBAPaint():drawBaseball();}
const ease=t=>t*t*(3-2*t),mix=(a,b,f)=>a+(b-a)*f;
function makeNBAAnim(p){const attacker=p.att,side=attacker===0?1:-1,old=state.actors,oldById=new Map(old.map(x=>[String(x.player.id),x]));
 const actors=[],use=[p.lineupA,p.lineupD];
 for(let group=0;group<2;group++)for(let i=0;i<5;i++){
  const team=group===0?attacker:1-attacker,player=use[group][i],existing=oldById.get(String(player.id));
  // Individuals start from previous coordinates; substitutions enter from the sideline instead of teleporting.
  const base={x:group===0?(attacker===0?.24:.76):(attacker===0?.68:.32),y:[.22,.38,.5,.64,.79][i]};
  let dest={x:base.x+(i-2)*.025,y:base.y};
  if(group===0){if(player.id===p.shooter.id)dest={x:attacker===0?.66:.34,y:i%2?.29:.53};if(player.id===p.handler.id)dest={x:attacker===0?.45:.55,y:.48};}
  if(group===1 && player.group===p.defender.group)dest={x:attacker===0?.73:.27,y:.53};
  const was=existing||{x:.50,y:team===0?1.05:-.05};
  actors.push({player,team,index:group*5+i,x:was.x,y:was.y,startX:was.x,startY:was.y,endX:dest.x,endY:dest.y,speed:.8});
 }
 state.actors=actors;const handler=actors.find(x=>x.player.id===p.handler.id&&x.team===attacker)||actors[0],shooter=actors.find(x=>x.player.id===p.shooter.id&&x.team===attacker)||actors[0];
 state.ball={x:handler.x,y:handler.y,z:.1};
 return {event:p,progress:0,duration:6.7,actors,handler,shooter,phases:['SUBSTITUTION / SETUP','OFF-BALL MOVEMENT','SCREEN AND PASS','ATTACKING SHOT ZONE','SHOT RELEASE','REBOUND / RESULT']};
}
function progressNBAAnim(anim,dt){anim.progress=clamp(anim.progress+dt*state.speed/anim.duration,0,1);const f=anim.progress;
 for(const a of anim.actors){const move=ease(clamp((f-.02)/.67,0,1));a.x=mix(a.startX,a.endX,move);a.y=mix(a.startY,a.endY,move);a.speed=f>.03&&f<.65?.9:0;}
 const h=anim.handler,s=anim.shooter,sh=anim.event,hoop=sh.att===0?.88:.12;
 if(f<.42){state.ball={x:h.x,y:h.y,z:.10+Math.sin(f*70)*.045};}
 else if(f<.56){let t=ease((f-.42)/.14);state.ball={x:mix(h.x,s.x,t),y:mix(h.y,s.y,t),z:.12+.17*Math.sin(Math.PI*t)};}
 else if(f<.71){state.ball={x:s.x,y:s.y,z:.12+Math.sin(f*80)*.04};}
 else if(f<.92){let t=ease((f-.71)/.21);state.ball={x:mix(s.x,hoop,t),y:mix(s.y,.5,t),z:.14+Math.sin(Math.PI*t)*.56};}
 else {let t=clamp((f-.92)/.08,0,1);state.ball={x:hoop+(sh.oreb?(sh.att===0?-.11:.11)*t:0),y:.5,z:sh.made?Math.max(0,.35-.6*t):.1};}
 const idx=Math.min(5,Math.floor(f*6));$('playPhase').textContent=anim.phases[idx];$('playTitle').textContent=sh.label;
 $('arenaWhy').textContent=sh.why;
 return f>=1;
}
function baseSpot(i){return [{x:.72,y:.65},{x:.50,y:.43},{x:.28,y:.65}][i];}
function makeMLBAnim(p){const g=state.currentGame, before=g.bases.slice();
 p.advance=E.advanceBases(before,p.event,p.batter,Math.random); // Same base advance used by the visible path and commit.
 const tracks=[];for(let i=0;i<3;i++)if(before[i]){const start=baseSpot(i);const destIdx=p.advance.bases.indexOf(before[i]);const dest=destIdx>=0?baseSpot(destIdx):{x:.50,y:.86};tracks.push({runner:before[i],start,dest});}
 const destIdx=p.advance.bases.indexOf(p.batter);if(!['out','strikeout','sac'].includes(p.event)){tracks.push({runner:p.batter,start:{x:.55,y:.83},dest:destIdx>=0?baseSpot(destIdx):{x:.50,y:.86}});}
 const obj={event:p,progress:0,duration:6.4,phases:['PITCHER SET','WINDUP AND RELEASE','PITCH FLIGHT','SWING / CONTACT','BALL IN PLAY','BASERUNNERS / RESULT'],tracks,baseRunners:[],ball:{x:.50,y:.64,z:.08}};state.anim=obj;return obj;
}
function progressMLBAnim(anim,dt){anim.progress=clamp(anim.progress+dt*state.speed/anim.duration,0,1);const f=anim.progress;const p=anim.event;
 if(f<.33){const t=ease(f/.33);anim.ball={x:.50,y:mix(.62,.82,t),z:.15+Math.sin(Math.PI*t)*.11};}
 else if(f<.62){const t=ease((f-.33)/.29);const out=['strikeout','walk'].includes(p.event);anim.ball={x:mix(.55,out?.56:.73,t),y:mix(.82,out?.83:.31,t),z:out?.02:.1+Math.sin(Math.PI*t)*.38};}
 else {const t=clamp((f-.62)/.38,0,1);anim.ball={x:mix(.73,.80,t),y:mix(.31,.22,t),z:Math.max(0,.24*(1-t))};}
 const trackProgress=ease(clamp((f-.47)/.49,0,1));anim.baseRunners=anim.tracks.map(t=>({name:t.runner.name,x:mix(t.start.x,t.dest.x,trackProgress),y:mix(t.start.y,t.dest.y,trackProgress)}));
 $('playPhase').textContent=anim.phases[Math.min(5,Math.floor(f*6))];$('playTitle').textContent=p.label;$('arenaWhy').textContent=p.why;return f>=1;}
function nextVisualPlay(){
 const g=state.currentGame;if(!g||g.ended){state.playing=false;return;}
 if(state.sport==='NBA'){const play=E.nbaPlay(g,Math.random);state.visualBench=play.att===0?[play.lineupA,play.lineupD]:[play.lineupD,play.lineupA];state.anim=makeNBAAnim(play);}
 else state.anim=makeMLBAnim(E.mlbAtBat(g,Math.random));
 updateFocus(state.sport==='NBA'?state.anim.event.shooter:state.anim.event.batter);
 renderTactics(state.anim.event);
}
function commitVisualPlay(){const g=state.currentGame,a=state.anim;if(!a)return;const p=a.event;if(state.sport==='NBA')E.commitNBA(g,p);else E.commitMLB(g,p,Math.random);logPlay(p);renderUnits();updateScore();state.anim=null;
 if(g.ended){state.playing=false;$('playPause').textContent='▶ REPLAY GAME';$('playPhase').textContent='GAME COMPLETE';$('playTitle').textContent=`${state.away} ${g.score[0]} — ${g.score[1]} ${state.home}`;}
 else if(state.stepOnly){state.playing=false;state.stepOnly=false;$('playPause').textContent='▶ PLAY SIMULATION';$('playPhase').textContent='PAUSED BETWEEN PLAYS';}
}
function gameFrame(t){const dt=state.frameTime?Math.min(.055,(t-state.frameTime)/1000):0;state.frameTime=t;
 if(state.playing){if(!state.anim)nextVisualPlay();if(state.anim){const done=state.sport==='NBA'?progressNBAAnim(state.anim,dt):progressMLBAnim(state.anim,dt);if(done)commitVisualPlay();}}
 if(state.view==='arena')canvasFrame(t);
 requestAnimationFrame(gameFrame);}
function playPause(){const g=state.currentGame;if(g?.ended)reset();state.playing=!state.playing;state.stepOnly=false;$('playPause').textContent=state.playing?'❚❚ PAUSE SIMULATION':'▶ RESUME SIMULATION';updateScore();}
function step(){state.playing=true;state.stepOnly=true;$('playPause').textContent='STEP IN PROGRESS…';}
function renderFixtures(){const box=$('fixtures');const filtered=state.fixtures.filter(x=>(state.filter==='ALL'||x.sport===state.filter)&&Date.parse(x.startUTC)>Date.now()-2*86400000).sort((a,b)=>Date.parse(a.startUTC)-Date.parse(b.startUTC));$('fixtureNum').textContent=filtered.length+' EVENTS';box.replaceChildren();if(!filtered.length){box.innerHTML='<div class="emptyMini">No games are published for this filter and date window. Schedule access may be offline or the league may have no fixtures.</div>';return;}
 for(const g of filtered.slice(0,60)){
  let e=document.createElement('article');e.className='fixtureCard'+(g.sourceState==='stale'?' stale':'');
  const ln=g.lineups||{},sA=ln[g.away]?.status||'unknown',sB=ln[g.home]?.status||'unknown';
  const pitchers=Object.entries(g.pitchers||{}).map(([team,x])=>x?.name?`${team}: ${x.name} (${x.status||'probable'})`:null).filter(Boolean);
  e.innerHTML=`<div><strong><span class="seasonTag">${esc(g.sport)}</span> ${esc(g.away)} @ ${esc(g.home)}</strong><p>${esc(statusDate(g.startUTC))} · ${esc((g.phase||'unknown').toUpperCase())} · ${esc(g.status||'status unknown')}</p><p>LINEUPS: ${esc(sA)} / ${esc(sB)}${pitchers.length?' · '+esc(pitchers.join(' • ')):''}</p><p style="opacity:.75">Source: ${esc(g.source||'unknown')} ${g.sourceState==='stale'?'· STALE':''}</p></div>`;
  let b=document.createElement('button');b.textContent='SIMULATE ↗';b.onclick=()=>selectFixture(g.id,true);e.append(b);box.append(e);
 }
}
function fillTeamPicker(){const sel=$('playerTeam'),sport=$('playerSport').value;let keys=Object.keys(TEAMS[sport]).sort();const old=sel.value;sel.replaceChildren();keys.forEach(key=>sel.add(new Option(`${key} · ${displayTeam(sport,key)}`,key)));sel.value=keys.includes(old)?old:(sport===state.sport?state.away:keys[0]);renderPlayerRows();}
function renderPlayerRows(){const sport=$('playerSport').value,team=$('playerTeam').value,box=$('playerRows');const rows=currentRows(sport,team);box.replaceChildren();if(!rows.length){box.innerHTML='<div class="emptyMini">No published roster for this team in the current snapshot. A live roster lookup will be attempted when the team is selected.</div>';return;}
 rows.forEach(p=>{const b=document.createElement('button');b.className='playerItem';const head=String(p.headshot||'');b.innerHTML=`<img alt="" src="${/^https:\/\//.test(head)?esc(head):''}" onerror="this.style.visibility='hidden'"><span><b>${esc(p.name)}</b><br><small>${esc(p.position||'?')} · #${esc(p.jersey||'—')}</small></span><small>${p.box?.games?'STATS':'ROSTER'}</small>`;b.onclick=()=>showPlayerProfile(p);box.append(b);});}
function showPlayerProfile(p){const box=$('profilePanel'),pre=E.nbaProfile(p),isNBA=$('playerSport').value==='NBA';const minutes=Array.isArray(p.last3PreseasonMinutes)?p.last3PreseasonMinutes.map(n=>Number(n).toFixed(1)).join(' / '):'';
 const s=isNBA?`<p><b>Previous preseason minutes:</b> ${esc(minutes||'Not published')}</p><p><b>Observed games:</b> ${pre.statGames} · shot attempts in sample: ${pre.statShots}. ${esc(pre.quality)}</p><p>Model 3PT tendency ${percent(pre.three)}, 3PT shooting ${percent(pre.p3)} (shrunk).</p>`:`<p><b>Hitting sample:</b> ${E.mlbProfile(p).statPA||0} PA · ${esc(E.mlbProfile(p).quality)}</p><p>MLB batting-order confirmation is separate from a roster listing.</p>`;
 box.innerHTML=`<img alt="" src="${/^https:\/\//.test(p.headshot||'')?esc(p.headshot):''}" onerror="this.style.visibility='hidden'"><strong>${esc(p.name)} · ${esc(p.team||'')}</strong><p>Role ${esc(p.position||'?')} · No. ${esc(p.jersey||'—')}</p>${s}<p><b>Availability:</b> ${esc(p.availability||'Unknown')}</p><p><b>Source:</b> ${esc(p.dataSource||'No verified personal performance data')}</p>`;
 document.querySelectorAll('.playerItem').forEach(b=>b.classList.toggle('active',b.textContent.includes(p.name)));}
async function fetchJson(url,ms=11000){const ac=new AbortController(),timeout=setTimeout(()=>ac.abort(),ms);try{const res=await fetch(url,{signal:ac.signal,cache:'no-store'});if(!res.ok)throw Error(`HTTP ${res.status}`);return await res.json();}finally{clearTimeout(timeout);}}
function parseNBAEvent(e){const comp=e.competitions?.[0]||{},t={};for(const x of comp.competitors||[]){let ab=String(x.team?.abbreviation||'').toUpperCase();t[x.homeAway]=ESPN_NBA_REMAP[ab]||ab;}
 const when=e.date||comp.date;if(!TEAMS.NBA[t.away]||!TEAMS.NBA[t.home]||!when)return null;const phase={'1':'preseason','2':'regular','3':'playoffs'}[String(e.season?.type||e.seasonType||'')]||'unknown';return {id:'NBA-'+e.id,sport:'NBA',away:t.away,home:t.home,startUTC:when,phase,state:e.status?.type?.state||'pre',status:e.status?.type?.description||'Scheduled',lineups:{},pitchers:{},restrictions:[],source:'ESPN public scoreboard (unofficial API)',sourceState:'current'};}
function parseMLBGames(feed){const aliases=Object.fromEntries(Object.entries(MLB_IDS).map(([k,v])=>[v,k])),out=[];
 for(const day of feed.dates||[])for(const x of day.games||[]){const t=x.teams||{},away=aliases[t.away?.team?.id],home=aliases[t.home?.team?.id];if(!away||!home||!x.gameDate)continue;const pitchers={};if(t.away?.probablePitcher?.fullName)pitchers[away]={name:t.away.probablePitcher.fullName,status:'probable',source:'MLB schedule'};
 if(t.home?.probablePitcher?.fullName)pitchers[home]={name:t.home.probablePitcher.fullName,status:'probable',source:'MLB schedule'};
 const phase={S:'preseason',E:'preseason',R:'regular',F:'playoffs',D:'playoffs',L:'playoffs',W:'playoffs'}[x.gameType]||'unknown';out.push({id:'MLB-'+x.gamePk,sport:'MLB',away,home,startUTC:x.gameDate,phase,status:x.status?.detailedState||'Scheduled',state:x.status?.abstractGameState||'Pre',lineups:{},pitchers,restrictions:[],source:'MLB StatsAPI official schedule',sourceState:'current'});}
 return out;}
function mergeFixtures(f){const by=new Map(state.fixtures.map(g=>[g.id,g]));for(const game of f){if(!game?.id||!game.startUTC)continue;const prior=by.get(game.id);by.set(game.id,{...prior,...game,lineups:{...(prior?.lineups||{}),...(game.lineups||{})},pitchers:{...(prior?.pitchers||{}),...(game.pitchers||{})}});}state.fixtures=[...by.values()].sort((a,b)=>Date.parse(a.startUTC)-Date.parse(b.startUTC));setSourceBadge();renderMissions();renderFixtureOptions();renderFixtures();}
async function readSnapshot(){try{const raw=await fetchJson(`data/snapshot.json?v=${Date.now()}`,7000);if(!Array.isArray(raw.games))throw Error('Malformed source');state.playerIndex=raw.players||{NBA:{},MLB:{}};state.dataAt=raw.generatedAt;state.dataMode='SNAPSHOT';state.errors=raw.errors||[];mergeFixtures(raw.games);state.dataLoaded=true;renderPlayerRows();applyControls();}catch(e){state.errors.push('Local snapshot: '+e.message);state.dataMode='OFFLINE';setSourceBadge();}
 // Attempt fresh provider requests only when the published feed is missing or over two hours old.
 const recent=state.dataAt && Date.now()-Date.parse(state.dataAt)<2*3600000;if(!recent||!state.fixtures.length)refreshLive();}
async function refreshLive(){state.dataMode='LOADING';$('healthTitle').textContent='Querying public NBA + MLB schedules…';const dates=[];let d=new Date();d.setUTCHours(0,0,0,0);for(let i=-1;i<4;i++){let a=new Date(d.getTime()+i*86400000);dates.push(a.toISOString().slice(0,10));}
 const ESPN_URI=`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${dates[0].replaceAll('-','')}-${dates.at(-1).replaceAll('-','')}&limit=250`;
 const MLB_URI=`https://statsapi.mlb.com/api/v1/schedule?sportId=1&startDate=${dates[0]}&endDate=${dates.at(-1)}&hydrate=probablePitcher`;
 const two=await Promise.allSettled([fetchJson(ESPN_URI),fetchJson(MLB_URI)]);let found=[],successful=0;
 if(two[0].status==='fulfilled'){found.push(...(two[0].value.events||[]).map(parseNBAEvent).filter(Boolean));successful++;}else state.errors.push('ESPN browser feed blocked: '+two[0].reason?.message);
 if(two[1].status==='fulfilled'){found.push(...parseMLBGames(two[1].value));successful++;}else state.errors.push('MLB browser feed blocked: '+two[1].reason?.message);
 if(successful){state.dataMode='LIVE';state.dataAt=new Date().toISOString();mergeFixtures(found);}else state.dataMode='OFFLINE';
 setSourceBadge();$('healthTitle').textContent=successful?'Live public fixture lookup complete':'Direct data lookup unavailable';if(successful&&!state.fixture){let next=state.fixtures.find(gameIsUpcoming);if(next)selectFixture(next.id,false);}
}
async function nbaTeamIDs(){if(state.nbaIds)return state.nbaIds;const src=await fetchJson('https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams');const rows=src.sports?.[0]?.leagues?.[0]?.teams||[];const out={};for(const item of rows){const t=item.team||item;const k=ESPN_NBA_REMAP[t.abbreviation]||t.abbreviation;if(k&&t.id)out[k]=t.id;}state.nbaIds=out;return out;}
function parseESPNRoster(raw,team){let athletes=[];for(const x of raw.athletes||[])if(Array.isArray(x.items))athletes.push(...x.items);else athletes.push(x);return athletes.filter(p=>p.id&&p.displayName).map(p=>({id:String(p.id),name:p.displayName,jersey:String(p.jersey||''),team,position:p.position?.abbreviation||'G',height:p.height,headshot:p.headshot?.href||'',availability:(p.injuries||[]).length?'injury reported — clearance unknown':'unknown',last3PreseasonMinutes:[],box:null,dataSource:'ESPN published roster. Individual play-style stats unavailable unless snapshot enriched.'}));}
async function ensureRoster(sport,team){const known=state.playerIndex[sport]?.[team];if(known?.players?.length&&Date.now()-Date.parse(known.observedAt||'')<24*3600*1000)return;try{let people;if(sport==='NBA'){const ids=await nbaTeamIDs(),id=ids[team];if(!id)throw Error('No team ID');people=parseESPNRoster(await fetchJson(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${id}/roster`),team);}
 else{const raw=await fetchJson(`https://statsapi.mlb.com/api/v1/teams/${MLB_IDS[team]}/roster?rosterType=active&season=${new Date().getUTCFullYear()}`);people=(raw.roster||[]).filter(p=>p.person?.id).map(p=>({id:String(p.person.id),name:p.person.fullName,jersey:p.jerseyNumber,position:p.position?.abbreviation||'?',team,headshot:`https://img.mlbstatic.com/mlb-photos/image/upload/w_180,q_auto:best/v1/people/${p.person.id}/headshot/67/current`,stats:null,dataSource:'MLB official active roster; batting stats unavailable'}));}
 if(!people.length)throw Error('No athletes in roster feed');state.playerIndex[sport][team]={players:people,source:sport==='NBA'?'ESPN':'MLB StatsAPI',observedAt:new Date().toISOString()};
 setSourceBadge();if(sport===state.sport &&(team===state.away||team===state.home))reset();renderPlayerRows();syncAssumptions();
 }catch(e){state.errors.push(`${sport} ${team} roster: ${e.message}`);setSourceBadge();}}
function changeSport(sport){state.sport=sport;state.away=sport==='NBA'?'BOS':'NYY';state.home=sport==='NBA'?'PHI':'LAD';state.phase=sport==='NBA'?'preseason':'playoffs';state.fixture=null;state.fixtureId='';state.actors=[];populateTeams();applyControls();reset();ensureRoster(sport,state.away);ensureRoster(sport,state.home);}
let worker=null;
function monte(){if(worker){worker.terminate();worker=null;}
 const g=buildGame(),rosters=state.sport==='NBA'?g.rosters:g.lineups;
 const n=10000,seed=(Date.now()>>>0);$('mcProgress').textContent='STARTING 3 × 10,000';$('runMonte').disabled=true;$('runMonte').textContent='RUNNING MODEL…';
 try{worker=new Worker('sim_worker.js');worker.onmessage=e=>{const msg=e.data||{};
 if(msg.status==='progress')$('mcProgress').textContent=`${msg.completed} / 3 SCENARIOS · ${(msg.completed*n).toLocaleString()} GAMES`;
 if(msg.status==='error'){alert('Simulation error: '+msg.message);cleanup();}
 if(msg.status==='complete'){renderMonte(msg.scenarios,seed);cleanup();}
 };worker.onerror=e=>{alert('Simulation worker unavailable. Please open SIMVERSE through a hosted website rather than file://');cleanup();};worker.postMessage({sport:state.sport,rosters,phase:state.phase,seed,n,pace:100,pitchCaps:state.sport==='MLB'?[g.starterPitchCap[0],g.starterPitchCap[1]]:null});
 }catch(e){$('mcProgress').textContent='WORKER NOT AVAILABLE';alert('Worker could not start: '+e.message);cleanup();}
 function cleanup(){$('runMonte').disabled=false;$('runMonte').textContent='RUN 30,000 GAMES ↗';if(worker){worker.terminate();worker=null;}}
}
function plotHistogram(totals){const c=$('distCanvas'),x=c.getContext('2d'),W=c.width,H=c.height;x.clearRect(0,0,W,H);x.fillStyle='#0f1d30';x.fillRect(0,0,W,H);
 for(let j=0;j<=4;j++){x.strokeStyle='#30506b55';x.lineWidth=1;x.beginPath();x.moveTo(40,25+j*45);x.lineTo(W-25,25+j*45);x.stroke();}
 if(!totals?.length){x.textAlign='center';x.font='700 14px sans-serif';x.fillStyle='#6f94b4';x.fillText('Distribution will appear after actual Monte Carlo execution',W/2,H/2);return;}
 const min=Math.floor(Math.min(...totals)),max=Math.ceil(Math.max(...totals)),k=38,bins=Array(k).fill(0),delta=Math.max(1,(max-min)/k);for(const value of totals){const i=Math.min(k-1,Math.floor((value-min)/delta));bins[i]++;}
 const peak=Math.max(...bins);for(let i=0;i<k;i++){const barW=(W-85)/k,barH=bins[i]/peak*(H-70);const grad=x.createLinearGradient(0,H-39-barH,0,H-39);grad.addColorStop(0,'#6bdbe0');grad.addColorStop(1,'#327aab');x.fillStyle=grad;x.fillRect(46+i*barW,H-39-barH,barW-3,barH);}
 x.font='800 11px sans-serif';x.fillStyle='#8babc7';x.textAlign='left';x.fillText(String(min),44,H-16);x.textAlign='right';x.fillText(String(max),W-30,H-16);x.textAlign='center';x.fillText('SIMULATED TOTAL (not a bookmaker line)',W/2,H-16);
}
function renderMonte(all,seed){const fmt=v=>state.sport==='NBA'?Math.round(v):v.toFixed(1),base=all[state.scenario];if(!base)return;
 $('mcAway').textContent=base.awayPct.toFixed(1)+'%';$('mcHome').textContent=base.homePct.toFixed(1)+'%';$('mcScore').textContent=fmt(base.meanAway)+' – '+fmt(base.meanHome);$('mcInterval').textContent=base.total.p10+' – '+base.total.p90;
 $('mcProgress').textContent='30,000 EXECUTED GAMES';plotHistogram(base.totals);$('scenarioResults').replaceChildren();
 for(const [code,title] of [['A','Starter-heavy'],['B','Expected rotations'],['C','Bench-heavy']]){const r=all[code],card=document.createElement('div');card.className='scenarioCard';
 card.innerHTML=`<div class="scenarioTop"><strong>${esc(code)} / ${esc(title)}</strong><span>${esc(state.away)} ${r.awayPct.toFixed(1)}% · ${esc(state.home)} ${r.homePct.toFixed(1)}%</span></div><div class="scenarioBar"><i style="width:${r.awayPct}%"></i></div><p>Average ${fmt(r.meanAway)}–${fmt(r.meanHome)} · Total ${r.total.mean.toFixed(1)} · 10–90%: ${r.total.p10}–${r.total.p90}${r.drawPct?` · Ties ${r.drawPct.toFixed(1)}%`:''}</p>`;$('scenarioResults').append(card);}
 const quality=drawAssumptionProfile();$('mcDisclosure').textContent=`Executed ${3*base.runs} model games; RNG seed ${seed}. Player-stat coverage: ${quality[0]}% (${state.away}) / ${quality[1]}% (${state.home}). ${state.phase} rotation assumptions, unvalidated calibration, missing injuries or data can materially alter the results. These are scenario outputs, NOT confirmed real-game win probabilities or betting edges.`;
}
function bind(){document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>view(b.dataset.view)));
 $('launchBtn').onclick=()=>view('arena');document.querySelectorAll('[data-analyst]').forEach(b=>b.addEventListener('click',()=>analystSelect(+b.dataset.analyst)));
 document.querySelectorAll('[data-sport]').forEach(b=>b.onclick=()=>changeSport(b.dataset.sport));
 document.querySelectorAll('[data-season]').forEach(b=>b.onclick=()=>{state.phase=b.dataset.season;state.fixtureId='';state.fixture=null;applyControls();reset();});
 document.querySelectorAll('[data-scenario]').forEach(b=>b.onclick=()=>{state.scenario=b.dataset.scenario;applyControls();reset();});
 document.querySelectorAll('[data-rate]').forEach(b=>b.onclick=()=>{state.speed=+b.dataset.rate;applyControls();});
 document.querySelectorAll('[data-camera]').forEach(b=>b.onclick=()=>{state.camera=b.dataset.camera;applyControls();});
 $('fixtureSelect').onchange=e=>{if(e.target.value)selectFixture(e.target.value,false);else chooseManual();};
 $('awaySelect').onchange=e=>{state.away=e.target.value;chooseManual();applyControls();ensureRoster(state.sport,state.away);};
 $('homeSelect').onchange=e=>{state.home=e.target.value;chooseManual();applyControls();ensureRoster(state.sport,state.home);};
 $('restriction').oninput=e=>{$('restrictionVal').textContent=e.target.value+'%';};$('restriction').onchange=e=>{state.restriction=+e.target.value;applyControls();reset();};
 $('playPause').onclick=playPause;$('stepPlay').onclick=step;$('resetGame').onclick=reset;$('runMonte').onclick=monte;
 $('refreshButton').onclick=async()=>{await refreshLive();const games=state.fixtures.filter(gameIsUpcoming).slice(0,3);for(const f of games){ensureRoster(f.sport,f.away);ensureRoster(f.sport,f.home);}};
 document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{state.filter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(n=>n.classList.toggle('chosen',n===b));renderFixtures();});
 canvas.addEventListener('click',e=>{if(state.sport==='NBA'){const rect=canvas.getBoundingClientRect(),xx=(e.clientX-rect.left)/rect.width*W,yy=(e.clientY-rect.top)/rect.height*H;let best=null,dist=45;for(const a of state.actors){let p=proj(a.x,a.y),d=Math.hypot(xx-p.x,yy-(p.y-28));if(d<dist){dist=d;best=a.player;}}if(best)updateFocus(best);}else{const game=state.currentGame,b=state.anim?.event?.batter||game?.lineups?.[game.top?0:1]?.[game.battingIndex[game.top?0:1]%9];if(b)updateFocus(b);}});
 $('playerSport').onchange=()=>fillTeamPicker();$('playerTeam').onchange=()=>{renderPlayerRows();ensureRoster($('playerSport').value,$('playerTeam').value);};
 document.addEventListener('keydown',e=>{if(e.code==='Space'&&state.view==='arena'&&!/INPUT|SELECT|BUTTON/.test(document.activeElement?.tagName||'')){e.preventDefault();playPause();}});
}
function init(){analystSelect(0);populateTeams();applyControls();bind();reset();setSourceBadge();plotHistogram([]);renderMissions();renderFixtures();readSnapshot();requestAnimationFrame(gameFrame);}
init();
})();
