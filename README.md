# SIMVERSE v0.6 — Cinematic Command HQ / Player-Aware Sports Simulation

A GitHub Pages-ready sports intelligence prototype featuring a **cinematic SIMVERSE headquarters**, interactive analyst stations, an animated NBA/MLB arena, player-linked action generation, source-aware upcoming fixtures, a player desk, and an off-main-thread Monte Carlo lab.

![HQ art direction](assets/command-hq.webp)

## Start here

The current site is configured as a GitHub Pages project at `https://awesomegummyworms-svg.github.io/simverse/`. The owner's existing repository previously contained a redirect to `SIMVERSE_v05_GITHUB_PAGES/`.

### Fastest first deployment (no Git command line)

1. Extract `SIMVERSE_v06_GITHUB_ROOT.zip` on your PC.
2. Open your GitHub repository: `https://github.com/awesomegummyworms-svg/simverse`.
3. To replace the **existing root `index.html`**, open the file, click the pencil/edit icon, replace its content with `index.html` from this package, and commit. Do **not** delete the existing file then leave the repo without an index.
4. Use **Add file → Upload files** at repository root for the remaining assets and files: `styles.css`, `app.js`, `engine.js`, `sim_worker.js`, `assets/command-hq.webp`, `data/`, `scripts/`, `tests/`, `.github/`, `.nojekyll`, and documentation. Preserve the file paths. Do **not** upload everything inside another folder.
5. If deploying by **Branch → `main` → `/(root)`**, your website can work immediately after GitHub Pages builds. The refresh workflows need the `GitHub Actions` Pages source (see below).

> Note: GitHub's browser upload may handle same-name files differently; if it rejects an existing filename, **edit that existing file** to replace its contents instead. A git clone/push via GitHub Desktop is easier for repeated multi-file updates.

### Recommended automatic deployment/data-refresh setup

1. Verify `index.html`, `engine.js`, `app.js`, `sim_worker.js`, `styles.css` and `assets/` are **directly at repository root**. Also verify `.github/workflows/deploy-pages.yml` and `.github/workflows/refresh-sports.yml` exist at their proper paths.
2. Open **Settings → Pages → Build and deployment → Source** and select **GitHub Actions** (not "Deploy from a branch").
3. Under **Actions**, run **Deploy SIMVERSE 0.6 to GitHub Pages** once, and wait for the green checkmark.
4. Under **Actions**, run **Refresh NBA and MLB data + deploy** once. It fetches published fixtures, rosters, previous NBA regular-season statistics, recent preseason minutes, MLB hitter statistics if available, probable pitchers and lineup confirmations when reported. It stores published results in `data/snapshot.json` and also publishes the site.
5. The refresh workflow checks hourly (`cron: 23 * * * *`); GitHub Actions schedules may run late or pause on inactive repos. **It is not real time.** The Data & Players page also attempts best-effort direct public requests if the site snapshot is missing or stale; browser CORS can block these.

Do not add provider API keys to committed files. Official licensing and provider terms should be checked before a commercial launch.

## What's new compared with v0.5

- **HQ directly matches the approved creative vision**: the generated command-room image is the actual HQ stage background rather than an unrelated geometric illustration; its six analyst stations are clickable and the action is clearly labelled conceptual artwork.
- **Real named athletes from public sources when available**: IDs, positions, jerseys and official/source-provided headshot URLs. The animation uses simplified procedural avatars; it does **not** claim face-perfect 3D reconstructions or reproduce real tracking data.
- **Player-dependent play generation**: NBA possession choice uses each athlete's available shooting, shot mix, ballhandling proxy, assist tendency, rebounding and defensive proxies. MLB uses hitter walk, K, HR and contact probabilities when stats are published.
- **Shrinkage and provenance**: current preseason box scores are highly volatile, so estimates blend limited observed data with previous-season information or cautious position priors. Missing stats remain labelled **unknown/priors**, not "expert-rated".
- **Season distinctions**: preseason starter minutes phase down sharply; regular rotations are more continuous; playoff rotations tighten; MLB regular season extras use the automatic runner while playoff extras do not.
- **Named matchups**: each NBA action identifies shooter, ballhandler and defending role; each MLB at-bat identifies a batter. The Data Desk shows exactly where an athlete's data came from.
- **Smoother animation**: six-stage action loops, camera modes, subs entering from sidelines, pass and shot arcs, baserunner paths, and stepping through individual actions.
- **Worker-based simulations**: three independently executed 10,000-run scenario batches (30,000 total), each with score, win rate, total percentile intervals and scenario sensitivity. A fixed random seed per run is displayed.

## Where the model is still exploratory

1. **Not verified as predictive**: There is no backtested NBA/MLB season-specific calibration, out-of-sample validation, historical error analysis, or model-derived betting edge.
2. **Not a full real-player motion engine**: player movement, shot arcs and hit trajectories are generated programmatically, not sampled from Second Spectrum, Statcast or live tracking. Full biomechanics, player likeness rigs, coaching actions, route trees, defensive coverage/field positioning, and physics remain future developments requiring data, licensing and substantial animation work.
3. **Not a confirmed minutes-cap feed**: a documented `minutesCap` or `pitchCap` in `data/overrides.json` affects the model only when it has a clear source and timestamp. If no limits are published, the status remains **unknown**.
4. **Lineup uncertainty remains real**: NBA rosters do not confirm starting fives; MLB active rosters do not confirm batting orders. Projected orders and fallback positions are not labelled confirmed.
5. **Provider caveat**: ESPN's site API is undocumented/unofficial, so it may change, throttle or block browser access. MLB StatsAPI is a publicly accessible read-only source but its availability is not guaranteed. Stable production usage likely requires contractual data vendors.
6. **Not an odds engine**: no bookmaker market feeds or model edge computations. Simulations should not be used as betting recommendations without published market prices and validation.

## Source provenance

- NBA fixtures & rosters: `site.api.espn.com` (unofficial public site endpoints).
- Previous-season NBA player statistics: `site.web.api.espn.com` season-filtered per-player statistical endpoints. 2025–26 information is clearly treated as a **prior**, never as the current 2026–27 season.
- Recent NBA preseason minutes and box scores: reported ESPN completed-game summaries only. No imputed minutes are represented as observed values.
- MLB fixtures, probable pitchers, confirmed batting orders and rosters: `statsapi.mlb.com`. Seasonal batting statistics are used only if the endpoint returns a compatible actual stats record.
- Manually documented restrictions: `data/overrides.json`; source and ISO timestamp required.
- Date presentation: `Australia/Melbourne`, including daylight-saving changes.

## Project structure

```text
index.html                 # Multi-view HQ, arena, player desk and simulation lab
styles.css                 # Dark, responsive product UI
app.js                     # UI, source adapter, animation, selection & controls
engine.js                  # Pure possession and at-bat statistical model
sim_worker.js              # Background 10k×3 Monte Carlo runner
assets/command-hq.webp     # Approved generated HQ artwork
data/snapshot.json         # Generated public sports data; initially empty
# data/profile_cache.json  # Cached prior-season player statistics; public only
scripts/update_data.py     # Hourly published fixtures, roster and game metadata
scripts/player_data.py     # Actual player stat parsing and sample handling
scripts/validate_snapshot.py
scripts/build_site.py
.github/workflows/         # Source update + Pages deployment
README.md
SIMVERSE_V06_MASTER_SPEC.md
```

## Tests

```bash
node --check app.js
node --check engine.js
node --check sim_worker.js
node tests/engine.test.js
python -m unittest discover -s tests -p 'test_*.py' -v
python scripts/validate_snapshot.py
python scripts/build_site.py
```

### Source/data policy

The HQ image contains text and apparent matchups as **concept art only**. Those labels, numbers and lineups in the painting are **not live data**. All functional published fixtures live in the Data Desk with their real feed source and timestamp. The simulation is a what-if engine and does not start from an in-progress game's live score.
