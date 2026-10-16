# CEO perk modal flow audit — 2026-10-08

## Verdict: NOT READY

Both repositories are on `feat-add-new-perks`. Backend source and database were not modified. Existing frontend work was preserved. This follow-up fixes frontend routing, offer correlation, cancellation and listener lifecycle; it cannot supply missing production backend triggers without violating the backend-only-read constraint.

## Backend contract

All four flows require an enrolled owner, matching CEO archetype, sufficient level, unlocked flag, teacher approval and applicable usage/cooldown checks. Backend rejects `level < requiredPerkLevel(perk_type)`; CORE requires 3, ULTRA requires 5. FE availability uses the same threshold plus `is_unlocked`; instructor unlock does not bypass level. Current real student level was not available from a running authenticated session.

| UI flow / backend key | Level | Real trigger and event | Input and request | Response / state |
| --- | --- | --- | --- | --- |
| DangerZone / `danger_zone` | CORE 3 | Activate emits `perk-approve-request`; teacher approval executes phase 1 and emits `perk-activated` with `perkId`, `requiresSelection`, own skillTree, rivals, pointsToRemove=2, msToSteal=2 | Choose an eligible rival and exactly 2 available integer own skill points. `perk-complete-with-target` `{classId,studentId,perkId,targetStudentId,skillDeductions}` | `perk-activated` used, or `perk-activation-error` keyed by perkId. Skill entries / market share broadcasts refresh UI. Cancel uses `perk-cancel`; keyed `perk-cancel-confirmed`. |
| FanTheFlames / `fan_the_flames` | ULTRA 5 | Approved Phoenix intercepts a supported incoming attack. `fan-the-flames-offer` provides pendingKey=`classId:studentId:timestamp`, eligible rivals and 10-second decision window | Choose eligible redirect rival. `fan-the-flames-redirect` `{classId,pendingKey,targetStudentId}` | `fan-the-flames-redirect-result` omits pendingKey; `fan-the-flames-expired` includes it. Redirect acceptance precedes final effect application; FE does not claim immediate game-effect success. |
| ScenarioPrediction / `prophecy` | CORE 3 | Approval returns waitingForTrigger. **No production prompt event exists.** Gateway only receives prototype-gated `scenario-prediction-submitted` | `predictedType`: market/crisis/opportunity/challenge. `{classId,studentId,predictedType}` | `scenario-prediction-result`, plus perk execution on success. Contract unavailable in production. |
| TargetRival / `star_power`, `extortion` | CORE 3 / ULTRA 5 | Star Power needs an Elite task-score event; Extortion needs scenario-started. Both currently prototype gated. Valid phase 1 emits `perk-activated` with actual perkId, rivals and msToSteal / skillPointsToSteal | Choose eligible rival. `perk-complete-with-target` `{classId,studentId,perkId,targetStudentId}` | Keyed activation/error; Extortion temporary effects expire on `scenario-temporary-effects-ended`. |

Modal confirmations use Socket.IO events, not invented HTTP endpoints. Socket authentication uses the existing session cookie / handshake access token. Existing HTTP controller has POST `/class/:cid/students/:sid/perks/:pid` and PATCH its `/activate` route; these are not substituted for modal-specific socket contracts.

## Trace and fixes

1. `HeroSelectCardLiveActionButton` → live card `onActivate` → `approvePerk` retains level/unlock/transport checks and emits the canonical approval request. `LeftPanel.PerkCard` remains a read-only dashboard summary.
2. `usePerkActivatedDispatcher` resolves received perkId against the current student's API perks, routes by stable backend key, validates phase-specific shape, sets data and ID before modal open. Completed `used` payloads cannot enter a picker branch. Unknown IDs and another owner's events cannot open these modals. This prevents shape/title-based misrouting and old selection payloads reopening completed perks. Legacy Sabotage aliases remain supported.
3. `HeroCardModals` receives current flow props: DangerZoneModal `open/data/onSubmit`, FanTheFlamesModal `open/offer/onRedirect`, TargetRivalPerkModal `open/current title/rivals/onSelectTarget`, ScenarioPredictionModal `open/onSubmit`. The Dialog components render against those open props. These prop chains were source-traced; browser rendering was not verified.
4. Removed orphan window `perk-activated`, `open-danger-zone`, `open-scenario-prediction` adapters and the unsupported `scenario-prediction-prompt` subscription. No replacement fake emitter, direct Activate→prediction-open shortcut, timer opener or invented scenario data was added.
5. `useFanTheFlamesFlow` filters actual pendingKey owner/class, queues offers and holds the submitted offer independently of its display expiry. Since redirect results lack a key, only one redirect is allowed in flight. A late result for A cannot consume queued offer B. Failed live submissions remain retryable; expired offers are not reused. Cancel declines the displayed offer; it does not fabricate server cancellation.
6. `usePerkSubmission` uses a synchronous ref lock. A timeout reports uncertainty and refetches but does not permit a duplicate uncertain mutation. An unrelated generic ws-error no longer releases every modal request. Correlated results or disconnect release the lock. This does not provide exactly-once semantics across reload/reconnect; backend has no idempotency/recovery contract for that.
7. `useDangerZoneFlow` cancellation retains picker data until acknowledged; failure restores the picker. Double cancel and confirm in flight are blocked. Cancellation success clears data. `useTargetRivalFlow` close preserves the pending choice and existing Continue selection entry reopens it; new server data replaces it.
8. `usePerkSelectionInvalidation` clears Danger/Target/Fan data on matching instructor lock/reset/denial and successful cancellation. Cleanup removes only the hook's own callback. CEO card key includes class/student/CEO to remount state on session changes.
9. `useClassSocket` now unregisters exact callbacks rather than clearing all shared subscribers. Refreshes consume real completion/temporary-effect events and teacher action confirmations; business errors retain the server message. Existing level/card/CORE-preview/XP/dashboard fixes remain present. Shared listener preservation and rerender deduplication are tested.
10. Teacher cancellation failure no longer clears perk approval/use state; it displays the server error and refetches.
11. Removed existing trailing whitespace in HeroSelectCardPerkItem so `git diff --check` passes.

## Remaining blockers

- `commerceclash-backend/src/class/class.gateway.ts:1192`, `handleScenarioPrediction`: receives `scenario-prediction-submitted` only. No backend `scenario-prediction-prompt` emitter supplies a production opening context. `useScenarioPredictionFlow` therefore starts closed and has no legitimate production open transition. Approval/result must not be misrepresented as a prompt.
- Gateway `task-score-submitted` at 1106 and `scenario-started` at 1308 call `prototypeAccess.student` with its default prototype gate. `src/class/prototype-perk-access.ts` requires NODE_ENV=development and ENABLE_PROTOTYPE_PERKS=true. The source itself states there is no task-grading system yet. Star Power / Extortion have correct FE phase-1 consumers but lack an enabled production task/scenario lifecycle supplying that phase.
- GET assigned CEO hydrates level, unlock/approval/use/status flags. It exposes no pending selection payload, attack offer, prediction context or recovery API. Refresh cannot reliably reconstruct pending pickers/offers; FE does not fabricate them. Fan's transient timer and pending state live in gateway memory.
- No Playwright/Cypress/E2E setup was found. Browser tool inventory returned `{apps:[],browsers:[]}`. Authenticated browser interaction, actual network requests, mobile/tablet layout and full server/UI effects are NOT VERIFIED.

## Perk Modal Status

✅ means source tracing / isolated hook checks, **not browser E2E**. FAIL* means full-flow acceptance is NOT VERIFIED because browser E2E was unavailable. FAIL without * indicates a missing production contract.

| Perk | Click | Trigger | Listener | Dispatcher | Modal | Data | Confirm | API | State | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DangerZone | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | FAIL* |
| FanTheFlames | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | FAIL* |
| ScenarioPrediction | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | FAIL |
| TargetRival | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | FAIL |

Prediction Confirm is implemented/tested against the prototype payload only. Its ❌ Listener denotes missing opening event; result listeners still exist. TargetRival ✅ cells describe consumption of a valid phase-1 event, not availability of the upstream production trigger.

## Required answers

1. DangerZone: eligible Activate requests approval; valid BE phase 1 opens the correct modal. It does not open immediately before approval. Source and hook tests verified; real browser not verified.
2. FanTheFlames: Activate arms approval; only a valid incoming-loss offer opens its modal. Source and hook tests verified; browser not verified.
3. ScenarioPrediction: **No production modal opening**. Missing backend prompt/context and prototype-only submit contract.
4. TargetRival: valid Star Power/Extortion phase-1 payload opens the correct modal. Production grading/scenario trigger is missing/gated, so Activate alone does not reach it.
5. Danger/Target use `perk-activated`; Fan uses `fan-the-flames-offer`; Prediction has no production opening event.
6. Yes: Prediction prompt and production task/scenario lifecycle for TargetRival remain missing.
7. No fake/manual production opening adapter was added; obsolete window opening routes were removed. Existing close/Continue controls operate current server-derived selection only.
8. Identified stale offer, revoked picker and session-switch risks were fixed and hook-tested. Pending state after reload remains unrecoverable under current BE contract.
9. Identified destructive teacher cleanup was fixed; exact cleanup and no duplicate registration on rerender were tested. Multi-page real browser subscriptions remain unverified.
10. Danger/Fan/Target confirm payloads match BE. Prediction's submit payload matches its prototype handler, but its production API is disabled.
11. Approval request occurs before modal Confirm by design. Picker completion / Fan redirect requests wait for Confirm; no fake automatic execution was introduced.
12. Backend flags rehydrate. Pending selection/offer/prediction recovery is unavailable in the backend contract; full re-enter flow is not verified.
13. Real browser E2E has **not** passed.

## Verification

- FE tests: 37/37 PASS (`npm run test:perks`). These execute actual hook handlers with isolated transport/React/timer adapters; they are not browser E2E. Prediction request tests do not prove a production opener.
- BE tests: 180/180 executed PASS; 29 skipped DB tests (`env -u PERK_TEST_DATABASE_URL npm test -- --runInBand`). No application database fixture writes.
- Typecheck: PASS (`./node_modules/.bin/tsc -b --pretty false`).
- Build: PASS (`npm run build`); Vite production bundle completed.
- Scoped changed game hooks/components lint: PASS. Global lint: FAIL (37 existing errors, 13 warnings), including teacher hook `any` types.
- E2E: NOT RUN. Browser verification: NOT VERIFIED.
- Backend modified: NO; backend git status and diff are empty.
- FE baseline already contained unrelated uncommitted files. Those were preserved; full working-tree diff is not attributed solely to this follow-up.

## Acceptance

Danger/Fan have traced real source flows and passing hook checks; neither has an end-to-end browser PASS. Prediction and TargetRival remain blocked by production backend contract limitations. Overall: **NOT READY**.
