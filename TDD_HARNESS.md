# TDD Harness Mode

Use this file only when the developer explicitly asks for TDD Harness Mode, TDD,
or red/green/check/review.

## Explicit Triggers

TDD Harness Mode is active only when the developer explicitly asks for it.

Explicit triggers include:

- "TDD harness mode"
- "TDD로 구현"
- "TDD 기반으로 작업"
- "red/green/check/review로 진행"
- direct use of the `tdd-harness-mode` skill

For ordinary coding requests, follow the repo's normal instructions and do not
force the TDD harness workflow.

## Task-Local Workflow

Use the task-local harness workflow:

```bash
./scripts/tdd-cycle start --id <task-id> --reset
./scripts/tdd-cycle paths --task <task-id>
./scripts/tdd-cycle plan --task <task-id> --summary ... --test-command ... --playwright ...
./scripts/tdd-cycle red --task <task-id> -- <targeted test command>
./scripts/tdd-cycle confirm-red --task <task-id> --category <category> --reason <reason>
./scripts/tdd-cycle green --task <task-id> -- <same targeted test command>
./scripts/tdd-cycle check --task <task-id>
./scripts/tdd-cycle review --task <task-id>
./scripts/tdd-cycle done --task <task-id>
```

Each task writes its active documents and evidence under:

```text
.agent/tasks/<task-id>/SPEC.md
.agent/tasks/<task-id>/TODO.md
.agent/tasks/<task-id>/state.json
.agent/tasks/<task-id>/logs/
.agent/tasks/<task-id>/report.md
```

Root `SPEC.md` and `TODO.md` are templates. In TDD Harness Mode, read and update
the task-local `SPEC.md` and `TODO.md` shown by `./scripts/tdd-cycle paths`, not
the root templates.

## Required TDD Sequence

When TDD Harness Mode is active:

1. Read `AGENTS.md`, this file, and the relevant source/test files before
   editing.
2. Run `./scripts/tdd-cycle start --id <task-id> --reset`, then
   `./scripts/tdd-cycle paths --task <task-id>`.
3. Read and update the task-local `SPEC.md` and `TODO.md` shown by `paths`.
4. Infer likely use cases, edge cases, and acceptance criteria from the request
   and current codebase.
5. Ask concise clarification questions before writing tests when ambiguity
   changes what "correct" means.
6. For detailed UI changes or frontend-originated flows, ask whether
   Playwright/browser verification should be included.
7. Record the plan gate before editing tests.
8. Add or update a focused failing test before changing production code.
9. Run the red gate and confirm the failure is caused by the intended missing
   behavior, not syntax, imports, fixtures, environment setup, or bad assertions.
10. Run semantic red confirmation.
11. Implement the smallest production change that can make the focused test pass.
12. Run the green gate with the same targeted command used for red.
13. Refactor only after green, then rerun the focused test if refactoring changed
    behavior-sensitive code.
14. Run full check before claiming completion.
15. Run review and inspect the final diff.
16. Run done after a passing full check.

Do not claim TDD Harness Mode completion when `./scripts/tdd-cycle check --task
<task-id>` failed or was not run.

## Clarification Gate

Ask the developer before generating tests when a decision affects user-visible
behavior, API contracts, security, permissions, data model, billing, side
effects, performance budgets, or backwards compatibility.

Typical blockers:

- limits, thresholds, timeouts, retries, or rate-limit windows;
- authorization, role, tenant, ownership, or privacy behavior;
- API status codes, error messages, response shape, or compatibility;
- persistence, migration, cleanup, idempotency, or concurrency rules;
- billing, quota, audit, notification, or external side effects;
- UI copy, accessibility behavior, empty states, or destructive actions;
- whether detailed UI changes or frontend-originated flows should be verified
  with Playwright/browser E2E tests.

Do not ask for details that can be discovered from the repository, such as the
test runner, existing naming style, or nearby helper APIs. If ambiguity is
non-blocking, proceed with a documented assumption and include it in the final
report.

Do not add Playwright or browser-test dependencies without developer approval.
If Playwright already exists and the developer wants browser verification, prefer
the repository's existing Playwright command and test conventions.

Record the final UI/browser decision with:

```bash
./scripts/tdd-cycle ui-decision --task <task-id> --playwright yes|no|not-applicable
```

## Forbidden Shortcuts

- Do not implement production behavior before proving a failing test, unless the
  developer explicitly asks to bypass TDD.
- Do not run red before a passing plan gate.
- Do not run green before semantic red is confirmed.
- Do not delete, skip, loosen, or snapshot-away tests to get green.
- Do not mark the task done after only a targeted test; full check is required.
- Do not hide failing logs. Summarize the failure and fix the root cause.
- Do not make broad refactors unrelated to the spec.
- Do not touch secrets, production credentials, production databases, or deploy
  settings without explicit approval.

## Test Quality Bar

Tests should verify behavior that matters to users or callers. Prefer a narrow
test that fails for the missing behavior and passes after the minimal fix.

Acceptable tests:

- API contract or handler tests for backend behavior.
- Component interaction tests for UI behavior.
- Playwright/browser E2E tests for approved detailed UI or frontend-originated
  flow verification.
- Unit tests around pure domain logic.
- Regression tests that would have caught the bug.

Weak tests:

- Tests that only assert implementation details.
- Snapshot-only tests for new behavior.
- Tests that pass before the fix.
- Tests that require network services unless the spec explicitly requires them.

## Completion Criteria

Before final response, provide:

- changed files;
- plan gate result;
- red gate command and result;
- semantic red confirmation;
- green gate command and result;
- full check command and result;
- review result and report path;
- any remaining risks or skipped checks.
