# Task Specification

Use this file for one task at a time. Keep it concrete enough that a test can be
written before implementation.

## Goal

Describe the behavior to add, change, or fix.

## User-Visible Behavior

- What should a user, caller, or operator observe?
- What should not change?

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Open Questions

List developer decisions that must be answered before tests are generated.

- Question:
- Answer:
- Assumption if unanswered:

## UI And Flow Verification

For detailed UI changes or frontend-originated flows, decide whether browser-level
verification should be included.

- Is Playwright/browser verification required?
- Target browser flow:
- Existing command to use:

## Test Plan

Write the targeted test command the agent should use for red and green.

```bash
./scripts/tdd-cycle red -- ./scripts/test-target <test command>
./scripts/tdd-cycle green -- ./scripts/test-target <test command>
```

## Edge Cases

- Empty input:
- Invalid input:
- Permission or auth boundaries:
- Race or retry behavior:

## Non-Goals

- Out-of-scope item 1
- Out-of-scope item 2

## Constraints

- Existing APIs to preserve:
- Performance constraints:
- Compatibility constraints:
- Files or modules that should not be changed:

## Done Means

- [ ] Plan gate passed.
- [ ] Failing test was written first.
- [ ] Red gate proved the intended failure.
- [ ] Semantic red confirmation was recorded.
- [ ] Minimal implementation passed the focused test.
- [ ] Full check passed.
- [ ] Final diff was reviewed.
