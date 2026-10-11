#!/usr/bin/env python3
"""Prevent publishing malformed or silently promoted lineup data."""
import json
from datetime import datetime
from pathlib import Path

path = Path(__file__).resolve().parents[1] / 'data' / 'snapshot.json'
content = json.loads(path.read_text(encoding='utf-8'))
assert content.get('schema') == 1
assert isinstance(content.get('games'), list)
assert isinstance(content.get('errors', []), list)
if content.get('generatedAt'):
    datetime.fromisoformat(content['generatedAt'].replace('Z', '+00:00'))
for game in content['games']:
    assert game['sport'] in ('NBA','MLB'), game
    assert game['away'] != game['home'], game
    assert game['phase'] in ('preseason','regular','playoffs','unknown'), game
    assert game.get('startUTC'), game
    datetime.fromisoformat(game['startUTC'].replace('Z', '+00:00'))
    for team, data in (game.get('lineups') or {}).items():
        assert team in (game['away'],game['home'])
        assert data.get('status') in ('confirmed','projected','pending','unknown')
        if data.get('status') == 'confirmed':
            assert len(data.get('players', [])) == (5 if game['sport']=='NBA' else 9)
            assert data.get('source')
    for restriction in game.get('restrictions', []):
        assert restriction.get('source') and restriction.get('updatedAt') and restriction.get('player')
print(f"Validated {len(content['games'])} events; no unsourced confirmed lineup or restriction.")
