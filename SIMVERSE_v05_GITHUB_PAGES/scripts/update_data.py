#!/usr/bin/env python3
"""SIMVERSE schedule and published-lineup snapshot.

No API keys. ESPN's publicly accessible, unofficial NBA site endpoint and MLB
StatsAPI are read-only. Treat absent lineups as UNKNOWN, never as confirmed.
"""
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data' / 'snapshot.json'
MEL = ZoneInfo('Australia/Melbourne')
NBA_ALIAS = {'GS':'GSW','GSW':'GSW','SA':'SAS','SAS':'SAS','NY':'NYK','NO':'NOP','NOR':'NOP','PHO':'PHX','UTAH':'UTA','UTAH JAZZ':'UTA','WSH':'WAS','BKN':'BKN'}
MLB_IDS = {108:'LAA',109:'ARI',110:'BAL',111:'BOS',112:'CHC',113:'CIN',114:'CLE',115:'COL',116:'DET',117:'HOU',118:'KCR',119:'LAD',120:'WSH',121:'NYM',133:'ATH',134:'PIT',135:'SDP',136:'SEA',137:'SFG',138:'STL',139:'TBR',140:'TEX',141:'TOR',142:'MIN',143:'PHI',144:'ATL',145:'CHW',146:'MIA',147:'NYY',158:'MIL'}

def get_json(url):
    req = urllib.request.Request(url, headers={'User-Agent':'SIMVERSE-Lab/0.3 (personal sports simulation dashboard)', 'Accept':'application/json'})
    for attempt in range(2):
        try:
            with urllib.request.urlopen(req, timeout=18) as response:
                return json.load(response)
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
            if attempt: raise RuntimeError(f'{type(exc).__name__}: {str(exc)[:150]}') from exc
            time.sleep(1.5)

def get_time(s):
    if not s: return ''
    try:
        dt = datetime.fromisoformat(s.replace('Z','+00:00'))
        return dt.astimezone(timezone.utc).isoformat().replace('+00:00','Z')
    except (ValueError, TypeError): return ''

def local_date(utc):
    try: return datetime.fromisoformat(utc.replace('Z','+00:00')).astimezone(MEL).date().isoformat()
    except (ValueError, TypeError, AttributeError): return ''

def nba_phase(event):
    phase = (event.get('season') or {}).get('type') or event.get('seasonType')
    return {1:'preseason',2:'regular',3:'playoffs'}.get(int(phase), 'unknown') if str(phase).isdigit() else 'unknown'

def parse_starters(summary):
    starters={}
    for group in (summary.get('boxscore') or {}).get('players', []):
        code = NBA_ALIAS.get((group.get('team') or {}).get('abbreviation','').upper(), (group.get('team') or {}).get('abbreviation','').upper())
        if not code: continue
        got=[]
        for stat in group.get('statistics',[]):
            for item in stat.get('athletes',[]):
                if item.get('starter') is True:
                    a=item.get('athlete') or {}
                    name=a.get('displayName') or a.get('fullName')
                    if name and name not in got: got.append(name)
        if len(got)==5: starters[code]={'status':'confirmed','players':got,'source':'ESPN box score (reported starters)'}
    return starters

def nba_games(days):
    events={}
    for day in days:
        date=day.strftime('%Y%m%d')
        url=f'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates={date}&limit=1000'
        feed=get_json(url)
        for event in feed.get('events',[]):
            comps=event.get('competitions') or []
            comp=comps[0] if comps else {}
            sides={}
            for t in comp.get('competitors', []):
                side=t.get('homeAway')
                code=(t.get('team') or {}).get('abbreviation','').upper()
                if code: sides[side]=NBA_ALIAS.get(code,code)
            if 'home' not in sides or 'away' not in sides: continue
            start=get_time(event.get('date'))
            if not start: continue
            status=((event.get('status') or {}).get('type') or {})
            state=status.get('state') or 'unknown'
            game={
                'id':'NBA-'+str(event.get('id')), 'sport':'NBA', 'away':sides['away'], 'home':sides['home'],
                'startUTC':start,'dateMelbourne':local_date(start),'phase':nba_phase(event),
                'status':status.get('description') or status.get('name') or state,
                'state':state, 'source':'ESPN scoreboard','lineups':{},'pitchers':{},'restrictions':[],
                'urls':{'scoreboard':url}}
            events[game['id']]=game
    # ESPN provides starter flags mostly during/after tip-off; do not fabricate pregame starters.
    for game in list(events.values()):
        if game['state'] not in ('in','post'): continue
        try:
            uri='https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event='+game['id'][4:]
            game['lineups']=parse_starters(get_json(uri))
            game['urls']['lineup']=uri
        except Exception as exc:
            game['lineupWarning']='Starter report unavailable: '+str(exc)[:100]
    return list(events.values())

def mlb_phase(code):
    code = str(code or '').upper()
    if code in ('S','E'): return 'preseason'
    if code == 'R': return 'regular'
    if code in ('F','D','L','W'): return 'playoffs'
    return 'unknown'

def parse_mlb_lineup(payload,side):
    box=(payload.get('teams') or {}).get(side) or {}
    players=box.get('players') or {}
    slots={}
    for p in players.values():
        code=str(p.get('battingOrder') or '')
        person=p.get('person') or {}
        name=person.get('fullName')
        if not code or not code.isdigit() or not name:continue
        n=int(code)//100
        if not 1<=n<=9:continue
        sub=int(code)%100
        # Prefer original lineup card; exclude later substitutions when available.
        if n not in slots or sub==0:
            slots[n]={'name':name,'position':(p.get('position') or {}).get('abbreviation',''),'sub':sub}
    if len(slots)!=9: return {'status':'pending','players':[],'source':'MLB game box score'}
    return {'status':'confirmed','players':[slots[n]['name'] for n in range(1,10)],'source':'MLB published batting order'}

def mlb_games(days):
    start=min(days).strftime('%Y-%m-%d');end=max(days).strftime('%Y-%m-%d')
    url='https://statsapi.mlb.com/api/v1/schedule?'+urllib.parse.urlencode({'sportId':'1','startDate':start,'endDate':end,'hydrate':'probablePitcher'})
    feed=get_json(url)
    events=[]
    for bundle in feed.get('dates', []):
        for event in bundle.get('games',[]):
            sides={};pitchers={}
            for side in ('home','away'):
                t=(event.get('teams') or {}).get(side) or {}
                ident=(t.get('team') or {}).get('id')
                code=MLB_IDS.get(ident)
                if code:sides[side]=code
                p=t.get('probablePitcher') or {}
                if p.get('fullName'): pitchers[code]={'name':p['fullName'],'status':'probable','source':'MLB schedule probable pitcher'}
            if len(sides)!=2:continue
            startutc=get_time(event.get('gameDate'))
            if not startutc:continue
            state=(event.get('status') or {}).get('abstractGameState','Unknown')
            game={'id':'MLB-'+str(event.get('gamePk')),'sport':'MLB','away':sides['away'],'home':sides['home'],
                'startUTC':startutc,'dateMelbourne':local_date(startutc),'phase':mlb_phase(event.get('gameType')),
                'status':(event.get('status') or {}).get('detailedState') or state,'state':state.lower(),
                'source':'MLB StatsAPI schedule','lineups':{},'pitchers':pitchers,'restrictions':[],
                'urls':{'scoreboard':url}}
            events.append(game)
    # Obtain batting orders for near-term, live and final matches. No inferred lineups.
    now=datetime.now(timezone.utc)
    for game in events:
        startdt=datetime.fromisoformat(game['startUTC'].replace('Z','+00:00'))
        if not (-36*3600 <= (startdt-now).total_seconds() <= 36*3600):continue
        uri=f'https://statsapi.mlb.com/api/v1/game/{game["id"][4:]}/boxscore'
        try:
            box=get_json(uri)
            for side in ('home','away'):
                result=parse_mlb_lineup(box,side)
                if result['status']=='confirmed': game['lineups'][game[side]]=result
            game['urls']['lineup']=uri
        except Exception as exc:
            game['lineupWarning']='MLB batting order unavailable: '+str(exc)[:100]
    return events

def apply_overrides(games):
    filename=ROOT/'data'/'overrides.json'
    try: overrides=json.loads(filename.read_text(encoding='utf-8'))
    except (FileNotFoundError, ValueError):return
    # Manually maintained overrides; they are NEVER promoted to "official" automatically.
    for g in games:
        info=(overrides.get('games') or {}).get(g['id']) or {}
        for team, lineup in (info.get('expectedLineups') or {}).items():
            if team not in (g['away'],g['home']):continue
            if team not in g['lineups'] and isinstance(lineup,list):
                g['lineups'][team]={'status':'projected','players':[str(n)[:100] for n in lineup[:9]],'source':str(info.get('source') or 'Manual editorial override')[:160]}
        for o in info.get('restrictions',[]):
            if not isinstance(o,dict):continue
            if o.get('team') not in (g['away'],g['home']):continue
            row={k:o.get(k) for k in ('player','team','role','status','minutesCap','minutesLow','minutesHigh','pitchCap','certainty','source','updatedAt') if k in o}
            if row.get('source') and row.get('updatedAt') and row.get('player'):
                g['restrictions'].append(row)

def run():
    now=datetime.now(timezone.utc); today=datetime.now(MEL).date()
    days=[today+timedelta(days=d) for d in range(-2,3)]
    games=[];errors=[];succeeded=[]
    old_games=[]
    try:
        old_snapshot=json.loads(OUT.read_text(encoding='utf-8'))
        old_games=old_snapshot.get('games', [])
    except (FileNotFoundError,ValueError,TypeError): pass
    keep_dates={d.isoformat() for d in days}
    for name,fn in [('NBA',nba_games),('MLB',mlb_games)]:
        try:
            part=fn(days)
            for g in part:
                g['observedAt']=now.isoformat().replace('+00:00','Z')
                g['sourceState']='current'
            games+=part;succeeded.append(name)
        except Exception as exc:
            errors.append(name+': '+str(exc))
            # Preserve the old fixtures, but mark them clearly stale rather than
            # silently dropping the sport or implying a successful live refresh.
            for old in old_games:
                if old.get('sport') != name or old.get('dateMelbourne') not in keep_dates: continue
                stale=dict(old);stale['sourceState']='stale'
                games.append(stale)
    if not succeeded:
        print('No providers available. Preserving last good snapshot.', file=sys.stderr)
        for e in errors:print(e,file=sys.stderr)
        sys.exit(1)
    apply_overrides(games)
    games=sorted(games,key=lambda g:(g.get('startUTC',''),g['sport'],g['id']))
    snapshot={'schema':1,'generatedAt':now.isoformat().replace('+00:00','Z'), 'timeZone':'Australia/Melbourne',
              'sportsUpdated':succeeded,'errors':errors,'games':games,'dataPolicy':{'confirmed':'Only published NBA starter flags or a complete MLB batting order','projected':'Explicitly labelled editorial projections','unknown':'No independently confirmed lineup','minutesRestrictions':'Only sourced overrides. Unknown means unknown, not unrestricted.'}}
    OUT.parent.mkdir(parents=True,exist_ok=True)
    tmp=OUT.with_suffix('.json.tmp');tmp.write_text(json.dumps(snapshot,indent=2,ensure_ascii=False)+'\n',encoding='utf-8');tmp.replace(OUT)
    print(f'Published {len(games)} games from {succeeded}. Errors: {errors}')

if __name__=='__main__':run()
