import sys
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
import update_data as u

class SportsFeedParsingTests(unittest.TestCase):
    def test_mlb_game_types(self):
        self.assertEqual(u.mlb_phase('R'),'regular')
        self.assertEqual(u.mlb_phase('S'),'preseason')
        self.assertEqual(u.mlb_phase('W'),'playoffs')
        self.assertEqual(u.mlb_phase('X'),'unknown')
    def test_mlb_team_aliases(self):
        for code in ['CHW','SDP','SFG','TBR','KCR','ATH']:
            self.assertIn(code,u.MLB_IDS.values())
    def test_not_confirmed_on_partial_batting_order(self):
        box={'teams':{'away':{'players':{'ID1':{'battingOrder':'100','person':{'fullName':'Example 1'},'position':{'abbreviation':'1B'}}}}}}
        self.assertEqual(u.parse_mlb_lineup(box,'away')['status'],'pending')
    def test_confirmed_mlb_requires_nine_batters(self):
        players={str(i):{'battingOrder':str(i*100),'person':{'fullName':f'Example {i}'},'position':{'abbreviation':'1B'}} for i in range(1,10)}
        box={'teams':{'home':{'players':players}}}
        result=u.parse_mlb_lineup(box,'home')
        self.assertEqual(result['status'],'confirmed')
        self.assertEqual(len(result['players']),9)
    def test_nba_starters_not_inferred(self):
        source={'boxscore':{'players':[{'team':{'abbreviation':'BOS'},'statistics':[{'athletes':[{'starter':True,'athlete':{'fullName':'Example'}}]}]}]}}
        self.assertEqual(u.parse_starters(source),{})

if __name__=='__main__':unittest.main()
