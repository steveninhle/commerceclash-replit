# Scenario perk prototype

Run `npm run test:perks` with Docker available. The runner creates a local
PostgreSQL 16 container, initializes the schema, runs the Jest suite, and removes
the container afterward. It overrides database URLs and never uses the application
database. `npm test -- --runInBand` runs unit tests; database tests are skipped
unless `PERK_TEST_DATABASE_URL` points to a local database named `perk_tests`.

The suite covers Afterburner, Extortion, Insider Trading, permanent skill edits
during an effect, concurrent activation and cleanup, database write failures,
provisioning races, authorization, and the duplicate-perk migration.

## Local prototype controls

Enable `NODE_ENV=development` and `ENABLE_PROTOTYPE_PERKS=true` on the backend,
and `VITE_ENABLE_PROTOTYPE_PERKS=true` in the frontend development environment.
Prototype events are disabled in production even if the flags are set.
Sign in normally: events verify the session cookie and class membership.
Students can trigger their own test events. Only the class instructor can end
the scenario, using the square icon in the teacher Skills toolbar.

Permanent skill `value` stays allocatable. `temporaryValue` is a signed scenario
modifier; `effectiveValue` is the total clamped to 0-8. The skill allocator shows
the modifier separately. Scenario resolution should consume `effectiveValue`
when that system is implemented. Ending a scenario removes modifiers and closes
unfinished Extortion selections without refunding or deducting permanent points.

## Database rollout

Apply `20261005000000_unique_student_perk` through the project's Prisma migration
deployment process. It merges duplicate instances, preserves usage records and
used state, and adds uniqueness on `(enrollment_id, perk_id)`.

Older prototype effects that directly changed skill values are retired by the
legacy cleanup path once. That path cannot reconstruct permanent edits already
made while an old effect was active; inspect such historical balances before
resuming a live class. New modifier records do not have this ambiguity.


## Teacher approval flow (2026-10-06)

All 12 new CEO perks are provisioned on CEO assignment and visible in student
cards and the teacher approval table. Core perks unlock at level 3 (20 XP),
Ultra perks at level 5 (40 XP). Students request approval; only a verified class
instructor can approve or deny through the socket approval flow. Runtime policy
requires approval even when an existing template still has `auto_approve=true`.

Approval immediately applies Afterburner and Blueprint. Danger Zone opens its
selection flow and applies only after the skill sacrifice and rival are chosen.
Approval enables the eight reactive perks and Fan the Flames without applying
an effect. Reactive events reserve an existing approved instance; they never
create or approve one themselves. Star Power and Extortion open target selection
only after their event. Fan the Flames offers loss redirection only while approved.

Usage consumes approval. Repeatable perks need another student request and
teacher approval after their two-minute cooldown. Failed reactive reservations
release back to the approved state so the same approval can retry. Scenario end
cancels unfinished Extortion selection. The prototype task/scenario events still
require development mode and explicit opt-in.

Deploy `20261006000000_teacher_approval_new_perks` after the uniqueness migration.
It disables auto-approval for new templates, removes old system-created reactive
approvals, and backfills missing student instances at the correct level. It
preserves used state, cooldowns, usage history, and active scenario modifiers.
Existing reactive perks require fresh instructor approval after rollout.

`src/class/new-perks-approval.spec.ts` and the gateway tests verify requests,
approval/denial, waiting for events, level checks, cooldown/approval boundaries,
and target completion. The PostgreSQL suite also verifies migration/backfill,
concurrent event reservation, and recovery from ledger failures.
