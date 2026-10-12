# SIMVERSE — Master Product & Model Specification (v0.6)

## Vision
A premium, immersive sports intelligence centre where a user sits as the commander, selects an actual upcoming NBA or MLB fixture, reviews verified starting information and player-specific matchup intelligence, watches a plausible modeled game sequence and compares thousands of scenario outcomes.

## Nonnegotiable acceptance gates

| Gate | Required | v0.6 status |
| --- | --- | --- |
| HQ matches cinematic target | Command image, 6 clickable specialist desks, central operator, data panels | PARTIAL: static cinematic scene with interactive hotspots |
| Named NBA / MLB rosters | Source IDs, photos, team memberships, timestamps | IMPLEMENTED when provider responds |
| Official confirmed starters | Confirmed only if explicitly published | IMPLEMENTED label gate; availability varies |
| Player-type matchups | Player-specific shot choice / rebounding / usage or hitting type when stats exist | EXPLORATORY implementation |
| Authentic player tracking | Real 3D rigs, facial likenesses, detailed movement signatures | NOT IMPLEMENTED |
| Minutes / workload restrictions | Explicitly sourced, applied to rotations and stamina | PARTIAL; manual sourced overrides + season-phase priors |
| Preseason / regular / playoffs | Separate rotations, fatigue, MLB extra-inning rules | IMPLEMENTED simplified rules |
| 10,000 Monte Carlo games per scenario | Actually executed; reproducible seed; histograms | IMPLEMENTED and tested |
| Calibration / backtesting | Historical held-out results, Brier/log loss, reliability curves | NOT IMPLEMENTED |
| Stable daily feed | Licensed supported feed with SLA, injury and lineup monitoring | NOT IMPLEMENTED; best-effort provider + hourly GitHub job |
| Live game tracking | Actual possession feed, score synchronization | NOT IMPLEMENTED |
| Odds / player-prop pricing | Time-stamped bookmaker lines and implied probability | NOT IMPLEMENTED |
| Automated GitHub delivery | Correct root files, Pages workflow | IMPLEMENTED but user must upload and activate |
| Offline safety | No fake 'confirmed' lineups when source unavailable | IMPLEMENTED |

## Definitive model contract

### NBA

- For each player: team and identity, position, current-season evidence, previous-season prior, last three preseason minutes if reported, minutes-projection low/expected/high, any documented absence or cap, plus explicit data quality.
- Sample shrinkage: 1–3 preseason performances are weak evidence. Previous-season strengths receive stronger prior weight when available. Only actual reported values are displayed as observations.
- Possession model: lineups sampled per 3-minute stint, shooter/handler/defender selected from skill/usage proxies, choice of three/rim/mid/post shot, turnover pressure, foul and free throws, rebounds and second chances.
- Quarter model: Q1 often starters, Q2 mixed, Q3 veteran phase-down and Q4 deeper bench for preseason. Regular and playoff rules have more sustained starter use. Individual evidence overrides generic season patterns where known.
- Full game / overtime: 4×12-minute quarters with 5-minute overtime if tied.

### MLB

- For each player: verified identity, team, reported batting order if available, hitter current/previous-season stats, probable/confirmed pitcher with distinct status and source, role and pitch limits when reported.
- At-bat model: walk, strikeout, single, double, home run and productive out, first/second/third and runs, three outs per half, walk-off endings. Pitcher stamina drives scenario bullpen handoff.
- Regular extras use the automatic runner on second; postseason extra innings do not.
- Still missing: granular pitch repertoire, handedness-specific splits, defense locations, catcher framing, stolen bases, park factors, weather/wind, real fatigue usage in previous three days, closer availability.

### Model uncertainty / risk discipline

- No prediction should be called "high confidence" without historical calibration and actual player availability.
- Scenario A / B / C must not be given evidence-based probabilities unless those scenario weights have sourced support.
- If any critical roster or cap field is missing, display UNKNOWN and condition outcomes on assumptions; do not automatically declare a player healthy or available.
- Historical outcomes, upcoming slate and modeled alternative worlds must be kept separate. Do not pretend the generated action was a real game.
- If a game has begun, any hypothetical replay starts from 0–0 and is explicitly labelled as such; do not claim it is a live forecast.

## Roadmap — highest-value unfilled gaps

1. **Reliable commercial-grade sports feed** covering NBA/MLB schedules, injuries, lineups, rotations, live play-by-play, official stats, and source timestamps. Store a versioned snapshot and maintain fallback/error behaviour.
2. **Backtesting** by game type (preseason/regular/playoffs), 1+ seasons with honest holdout periods and Brier/log-loss checks; publish uncertainty and avoid overprecise win rates.
3. **Rotation optimization** using player-level last-three minutes distributions, actual coach substitution tendencies, bench overlap, restrictions, and active/inactive records. Derive possession-level lineup continuity.
4. **Advanced NBA matchup modelling**: tracking shot zones, spacing, coverage scheme, pick-and-roll pairings, movement profiles, foul rates, offensive rebound chance and on/off combinations; input licensing required.
5. **Advanced MLB matchup modelling**: Statcast pitch mix, velocity, spin, release, platoon splits, barrel/whiff, park factors, weather, defense and bullpen leverage + workload.
6. **Real 3D world** with WebGL engine, optimized sport-specific procedural rigs, licensed player likenesses, locomotion/throw/pass/shot transitions, user fly-through camera, collision and ball physics. The HQ art remains moodboard; replace with actual 3D playable environment.
7. **Authentic UI data binding**: never paint invented scoreboards or false player info into active app panels; keep the art marked as conceptual. Clickable analysts should deliver real auditable model reports from verified source outputs.
8. **User workflows**: bookmarked matches, saved simulations and seeds, shareable reports, automated lineup-change alerts, scenario diff and player props only when data and pricing support them.
9. **Performance/accessibility QA**: mobile cap, WebGL fallback, low-end GPU, keyboard navigation, reduced motion, WCAG AA, monitored browser errors and regression tests.
10. **Source compliance/security**: licensing, rate limits, audit logs, privacy of user preferences, secret management, no server-side credentials exposed in GitHub Pages.

## Launch rule
v0.6 is an immersive demonstrator and exploratory analytics environment—not a validated sports betting prediction system, verified same-day player movement reproduction, or official league product.
