<<<<<<< SEARCH
# PoliticalEngine — Detailed Documentation

Path: src/political-engine.js

Overview
--------
The PoliticalEngine is a periodic analytics and persistence component that evaluates in-game telemetry and faction standings to produce human-readable "Political Climate" reports and machine-readable gamification modifiers. It is designed to run autonomously (via an interval) and on-demand, and to persist outputs into the Websim-backed database for UI consumption and historical auditing.

Primary responsibilities
------------------------
- Periodically snapshot key telemetry (score, inventory, account balance, faction standings, metrics).
- Compute per-faction threat/stability indices and gamification multipliers.
- Produce a concise textual summary for UI/notifications.
- Persist reports to the `political_reports` collection and maintain a `political_latest` pointer per user for quick access.
- Dispatch a store action (`POLITICAL_REPORT_UPDATE`) to surface reports in the client UI when available.
- Guard DB writes to avoid repetitive identical entries (simple dedupe via snapshot key).

Public API
----------
- constructor({ intervalMs = 30000 }):
  Create an engine instance. `intervalMs` controls automatic evaluation cadence.

- async init():
  Ensures DB initialization (best-effort). Safe to call multiple times.

- startAutoUpdate():
  Starts periodic evaluation if not already running. Immediately invokes a first pass.

- stopAutoUpdate():
  Stops periodic evaluation.

- async snapshot():
  Returns a lightweight telemetry object capturing:
    - timestamp
    - score
    - inventoryCount
    - accountBalance (from db.getAccount())
    - metrics (store.metrics)
    - standings (db.getFactionStandings())
    - currentLevel

  Useful for testing, previewing report inputs, or creating deterministic reports off-line.

- async evaluate(snapshot = null):
  Accepts an optional snapshot (object) or uses snapshot() internally. Produces:
    {
      summary: string,
      entries: { factionId: { faction, standing, effectLabel, threatScore, gamification, stabilityIndex } },
      snapshot: <the snapshot used>,
      generated_at: <timestamp>
    }

  Key calculations:
    - globalThreat = score/5000 + damageTaken/100
    - threatScore = combination of base hostility derived from standing, effect.threat, effect.gamification.spawnModifier, and scaled globalThreat
    - bountyModifier = scaled effect.gamification.bountyMultiplier adjusted by negative standing
    - marketPriceModifier = scaled effect.gamification.marketMultiplier adjusted by standing
    - spawnRateModifier = effect.gamification.spawnModifier + small globalThreat factor
    - stabilityIndex = scaled positive standing and account health heuristic

- async persistReport(report):
  Writes the report to `political_reports` and upserts a per-username record into `political_latest`. Handles errors gracefully and logs warnings.

- async evaluateAndPersist():
  High-level workflow that:
    1. Ensures initialization
    2. Builds a snapshot
    3. Skips DB write if snapshot key equals lastSnapshot (simple duplication guard)
    4. Runs evaluate(snapshot)
    5. Persists the report via persistReport
    6. Dispatches `POLITICAL_REPORT_UPDATE` to the store

- async generateReport({ persist = true } = {}):
  Convenience method to compute a fresh report and optionally persist; returns the report object.

Design & Implementation Notes
-----------------------------
- Idempotency / DB churn: evaluateAndPersist produces a compact "key" string based on score/accountBalance/standings to reduce duplicate writes when nothing meaningful changed.
- Extensibility: The evaluate() function composes entries across the FACTIONS map and leverages getPoliticalStandingEffect(standing) to centralize standing->effect mapping.
- Gamification outputs: Each entry includes both raw gamification seeds from the faction and computed modifiers (bountyModifier, marketPriceModifier, spawnRateModifier) for downstream systems (market pricing, spawn controllers, reward calculators).
- Small stability index: higher when standing is positive and account balance healthy

Operational guidance
--------------------
- Tuning interval: Default 30s. For faster feedback during development, set a lower interval; for production scale consider increasing to reduce DB writes.
- Snapshot dedupe: If you need more sensitivity, refine the `lastSnapshot` key to include additional metrics (e.g., inventoryCount, metrics.enemiesDestroyed) or compute a hash.
- Testing: Use generateReport({persist:false}) to validate outputs without DB writes.
- Security: Persistence uses WebsimSocket collections; ensure collection names exist and users have permission to create records (the shim will emulate in offline cases).

Examples
--------
- Quick one-off report:
  ```js
  import { politicalEngine } from './political-engine.js';
  const report = await politicalEngine.generateReport({ persist: false });
  console.log(report.summary, report.entries);