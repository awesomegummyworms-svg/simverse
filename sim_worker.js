/* Keep 30,000 game evaluations off the UI thread. */
importScripts('engine.js');
self.onmessage=e=>{const {sport,rosters,phase,seed,pace,pitchCaps,n=10000}=e.data,engine=self.SimEngine;
 try{const scenarios={};for(const scenario of ['A','B','C']){
    const opts={phase,scenario,pace,seed:seed+scenario.charCodeAt(0),awayPitchCap:pitchCaps?.[0]||90,homePitchCap:pitchCaps?.[1]||90};
    const out=engine.runMonteCarlo(sport,rosters,opts,n);
    scenarios[scenario]={runs:out.runs,seed:out.seed,awayPct:out.awayPct,homePct:out.homePct,drawPct:out.drawPct,meanAway:out.meanAway,meanHome:out.meanHome,total:out.total,margin:out.margin,totals:out.results.map(x=>x.total)};
    self.postMessage({status:'progress',scenario,completed:Object.keys(scenarios).length,total:3});
  }self.postMessage({status:'complete',scenarios});
 }catch(err){self.postMessage({status:'error',message:String(err&&err.stack||err)})};
};
