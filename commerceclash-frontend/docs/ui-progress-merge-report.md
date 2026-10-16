# ui-progress → feat-add-new-perks merge review

## Git state

Source: `ui-progress` (`7212a391a656c2cde11bc692e81f27c4e9db3a8a`).
Target: `feat-add-new-perks` (`bbebe1aaa5c3e315347cf9ee7eef437f1a4961c2` before merge).
Merge base: `6532a2f00f0e8ef3bb0e3e71e98669ce83689692`.
Source-specific commits: `feb36ef` (fix ui progress), `7212a39` (ui).

Frontend working tree was clean before switching from ui-progress to the target. Earlier perk fixes were already committed on the target. Existing files/changes in the parent repository and backend were preserved.

Ran a real `git merge --no-edit ui-progress`. Git stopped on one content conflict. It is now resolved and staged, with no unmerged files or conflict markers. **Merge is PENDING COMMIT**, not completed in branch history. No new commit was created because the user explicitly prohibited creating a new commit without permission; the initial merge did not auto-create one after the conflict.

## Files receiving source changes

- `src/components/ui/ProgressBar.tsx`: retain source formatting; calculations unchanged.
- `src/features/game/components/heroSelectCard/HeroSelectCard.tsx`: pass theme accent, character title and actual preview level to the new progress UI.
- `src/features/game/components/heroSelectCard/HeroSelectCardLive.tsx`: source progress props (`levelProgress`, accentColor, characterTitle) plus all target perk hooks, reconnect handling, level guard, dispatcher and modal wiring.
- `src/features/game/components/heroSelectCard/HeroSelectCardLiveActionButton.tsx`: source theme-colored active text; target status resolver, disabled/click conditions, Approved semantics and tooltip preserved.
- `src/features/game/components/heroSelectCard/HeroSelectCardProgress.tsx`: source track, character-specific XP fill, theme border/glow, text sizing, fill-reset-overflow level-up animation. Added exact RAF cancellation and stale-callback guards.

The other three source-touched files (`HeroSelectCardLevelBadge.tsx`, `sampleData.ts`, `RegisterPage.tsx`) contained trailing whitespace only. Normalizing it leaves them identical to the target; no UI change was omitted.

## Conflict resolution

File: `HeroSelectCardLive.tsx`.
Conflict: source whitespace was inserted where target added Fan the Flames, Danger Zone, Scenario Prediction and Target Rival hook setup.
Logic from: feat-add-new-perks, kept the complete existing hook block.
UI from: ui-progress, retained progress component props in the presentation section.
Resolution: manually resolved the conflict hunk, kept reconnect subscription and exact cleanup, all dispatcher IDs/setters and every modal callback. No whole-file ours/theirs checkout.

## Integration adjustments

- The source's `IN USE` label check was adapted to the target's actual `approved` status for theme coloring. Button still reads APPROVED, stays disabled, and waits for its backend gameplay trigger. Used/pending/requesting/locked behavior is unchanged.
- The source animation scheduled nested RAFs without canceling them. Added tracked frame IDs and a cancellation guard so a newer server XP update or unmount cannot let old callbacks overwrite progress or schedule more timers.
- Preview now passes its real level so the shared progress animation receives the same input shape as the live card.

## Logic protection

Perk logic: PRESERVED.
Approval flow: PRESERVED.
Socket contract: PRESERVED.
Modal conditions: PRESERVED.
Game flow: PRESERVED.
State management: PRESERVED.

Compared 44 protected files against the pre-merge target HEAD: no changes. These include game hooks/utils, context, API, teacher hooks, CEO, Gamification, skill allocator and perk/reward modals. The remaining live-card diff contains only progress props. No socket/API event or payload was modified. No fake production trigger was added for Scenario Prediction, Star Power or Extortion. Existing backend production limitations remain unchanged.

XP/level calculation remains on the target: existing XP_PER_LEVEL/MAX_LEVEL handling computes the XP displayed by the UI. Source animation only interpolates display state. Pool/pillar calculations and state synchronization remain byte-for-byte unchanged.

## UI improvements retained

Theme-colored border and glow; character-specific XP artwork; readable responsive XP text; updated progress height/layout; level-up fill/reset/overflow animation; theme-colored Activate/Approved text. No backend, business formula, approval or game-flow change.

## Validation

- Baseline perk tests: 42/42 PASS.
- Post-merge perk tests: 42/42 PASS (`npm run test:perks`).
- New UI integration tests: 9/9 PASS (`node --test tests/ui-progress-merge.test.mjs`). Actual component code with isolated React/timer adapters; not browser rendering.
- Typecheck: PASS (`tsc -b`, run by `npm run build`; no standalone typecheck npm script exists).
- Build: PASS (`npm run build`).
- Global lint: FAIL, 37 errors / 13 warnings. Same count as before merge.
- Scoped merged components and new UI tests lint: PASS.
- `git diff --check` and `git diff --cached --check`: PASS.
- Unmerged files: NONE. Conflict markers: NONE in src/tests.
- Browser / responsive visual verification: NOT VERIFIED. Browser inventory has no enabled apps or browsers.
- Backend modified: NO. Parent repository changes were not discarded or committed.

## Remaining step

The resolved merge and its regression tests are ready for review. Creating the merge commit requires user permission under the explicit no-new-commit instruction. No push, squash, rebase, reset or stash was performed.
