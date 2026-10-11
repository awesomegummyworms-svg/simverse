# SIMVERSE v0.5 — Command HQ + NBA / MLB Simulation Arena

Standalone browser simulation with an isometric command room, animated analysts, a detailed basketball/baseball sequence layer, a data-verification desk and a 10,000-game-per-scenario simulation lab.

## IMPORTANT MODEL LIMITATIONS

The player avatars and game outcomes are **synthetic demo simulations**, not live NBA/MLB player tracking. Team ratings are generated illustrative values, not historical performance estimates. The model is exploratory, not calibrated or validated for betting. The Data Desk only displays source-published information; selecting a verified fixture does not make player-specific inputs active in the simulation.

## A) Publish on GitHub Pages — no Netlify

**Target repository:** `https://github.com/awesomegummyworms-svg/simverse`  
**Expected website after the first successful deployment:** `https://awesomegummyworms-svg.github.io/simverse/`

1. Open your new **simverse** repo, choose **Add file → Upload files**, and drag all the **contents** of this folder into it, preserving the folder structure (`.github/workflows`, `scripts`, `tests`, and `data`). Do not upload this ZIP as one file. Commit the files to the **main** branch. If the browser upload hides `.github`, create that folder using GitHub's web editor or upload using GitHub Desktop.
2. In the repo, open **Settings → Pages → Build and deployment → Source**, and choose **GitHub Actions**. The included `Deploy SIMVERSE to GitHub Pages` workflow builds and publishes the site from `main`.
3. Open the **Actions** tab. If asked, enable workflows, then open **Deploy SIMVERSE to GitHub Pages → Run workflow** to trigger the first deployment. Wait for a green check before opening the site.
4. To turn on schedule updates, in the repo go to **Settings → Actions → General → Workflow permissions**, choose **Read and write permissions**, then save. Use **Actions → Refresh sports data and republish SIMVERSE → Run workflow** once to check the providers and publishing. The workflow asks only for the `GITHUB_TOKEN` permissions configured in its YAML. Some repo policies may restrict this workflow; check the logs if a run fails.
5. Future file changes on `main` trigger deployment. When the hourly refresh finishes, it **publishes the site inside the same workflow**, because a commit made using `GITHUB_TOKEN` does not trigger a second Pages workflow.

**Critical:** This is a public repository. Everything you commit—including `scripts`, `data/overrides.json`, GitHub Actions logs and commit history—may be publicly visible, even when omitted from the built Pages site. Do not commit private keys, API credentials or personal information. Store future secrets in repository Actions secrets and keep them out of client-side JavaScript.

**Deployment note:** ChatGPT has not published to your repository or turned on Pages from this conversation. A successful GitHub account login does not mean this chat has GitHub repository write access.

## B) Data refresh and provenance

- `scripts/update_data.py` reads the **unofficial public ESPN NBA scoreboard/box score endpoint** and **MLB StatsAPI** for schedule/status and published player information. Provider access and schema can change.
- NBA starters are `confirmed` **only if exactly five starter flags are actually present in a published box score**. This typically happens around or after tipoff, not necessarily pregame.
- MLB batting orders are `confirmed` **only if an explicit nine-player batting order is published**. Pitchers reported through the schedule API stay **probable** until independently confirmed.
- Actual NBA injuries, minutes limits, rest decisions, MLB pitch restrictions, and estimated lineups are **not reliably available from these feeds**; absence of a report must not be interpreted as unrestricted or available.
- Manual editorial data belongs in `data/overrides.json` with an attributable source and timestamp. Manually entered projections are never promoted to confirmed by the software.
- The client clearly displays the timestamp and labels stale feeds; on load and on demand it reads the latest published snapshot. It does not stream live stat tracking.
- The GitHub workflow updates the published JSON and commits it to the repo. If your Netlify site is connected to that repo, a build can publish the new snapshot automatically. This pipeline has not been activated against your actual GitHub/Netlify accounts from ChatGPT.

## C) Different rules for game types

| League | Preseason | Regular season | Playoffs |
|---|---|---|---|
| NBA | Starters gradually give way to reserves, shorter veteran exposure | More stable starter rotation | Tighter rotation and longer starter share |
| MLB | Shorter starting-pitcher outings; ties may stand after nine | Full nine innings, automatic second-base runner in extras | More conservative workload and extras **without** automatic runner |

The workload slider and A/B/C scenarios are **what-if adjustments**, not automatically verified individual minutes or pitch limits. Actual individual-player modelling is a future backend milestone.

## D) Browser controls

- **HQ**: click any workstation or analyst card. The analyst briefing updates with the chosen specialist and recent simulated activity.
- **Arena**: choose sport, teams, season, starter/bench scenario, tempo and restriction factor. Play/Pause, one-action Step and Reset. Three camera angles.
- **Data Desk**: see source timestamps and lineup certainty. Select an actual fixture to load its teams/season into the arena (still with synthetic ratings).
- **Scenario Lab**: 10,000 seeded simulations under **each** of A/B/C (30,000 total), outcome rates, mean score and 10–90 percentile total interval; reproducible for the same settings.

## E) Validation performed in this build

- `node --check app.js`
- `python -m unittest discover -s tests -v`
- `python scripts/validate_snapshot.py`
- Browser interface smoke test for HQ, NBA, MLB, mobile layout and 3 × 10,000-run lab with browser screenshots generated via in-memory HTML; browser navigation to local files was restricted by environment policy.

## F) Future production milestones

1. Real player IDs and roster versioning; per-player projected minutes/innings and data-source conflicts.
2. Injury confirmation pipelines with update timestamps, lineup probability distribution and unavailable-player fallbacks.
3. Backtestable, historically calibrated NBA possessions and MLB plate appearances with uncertainty and correlation.
4. Proper WebGL / Three.js character rigs, camera travel, dribbling/passing cycles and fielders/runners in 3D.
5. Reliable scheduled backend with provider-licensed data, observability and deployment rollback.

Copyright and data licensing: verify rights before using team trademarks, official player data or third-party source feeds commercially.
