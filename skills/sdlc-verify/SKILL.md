---
name: sdlc-verify
description: Final verification against spec with full evidence chain. Use after sdlc-execute to confirm feature is complete.
---

> **Model auto-switch:** Extension switches to `fast` tier automatically (verify just checks, no heavy reasoning needed).
>
> **Principle:** Evidence before claims, always.
>
> **Previous:** `/skill:sdlc-execute` | **Next:** `/skill:sdlc-spec` (new feature)

# SDLC Verify

## Overview

Final verification: full test suite, every acceptance criterion, build check, evidence report.

**Core rule:** Never claim pass without evidence.

## Process

### Step 0: Check Approval

```
plan_tracker_ide:
  action: check_approval
  phase: verify
```

If **APPROVED**, feature already verified. Show report location, skip re-verification.

### Step 1: Load Context

1. Read `docs/specs/{feature}/spec.md`
2. Read all task files
3. Check tracker: `plan_tracker_ide(action: "status")`

**Incomplete tasks?** → **HARD STOP**, suggest `/skill:sdlc-execute`

### Step 2: Full Test Suite

```bash
{testCommand from config}
```

Show: full output, total/pass/fail counts, exit code.

**Fail: HARD STOP**

### Step 3: Acceptance Criteria

Walk EVERY criterion from spec:

```markdown
1. [Criterion]
   - Status: ✓ PASS
   - Evidence: {test name, manual check, etc.}

2. [Criterion]
   - Status: ✗ FAIL
   - Gap: {what's missing}
```

**Any fail: HARD STOP**

### Step 4: Build

```bash
{buildCommand from config}
```

Show output, exit code. **Fail: HARD STOP**

### Step 5: Generate Report

Save to `docs/specs/{feature}/verification-report.md`:

```markdown
# {Feature} Verification Report

**Date:** YYYY-MM-DD
**Status:** ✓ PASS

## Test Results
- Total: {N}
- Passed: {N}
- Failed: 0

## Acceptance Criteria
| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | {text} | ✓ | {proof} |

## Build
Exit code: 0

## Files Changed
{git diff --stat}

## Conclusion
Ready for: PR / Merge / Deploy
```

### Step 6: Save

1. Sync to memctx:

```
memctx_save:
  type: observation
  title: {feature} Completed
  path: 60-observations/{feature}-completed.md
  tags: [sdlc, verify, complete, {feature}]
```

2. Update spec status → `Complete`
3. Commit:

```bash
git commit -m "docs({feature}): verification complete"
```

4. Approve phase:

```
plan_tracker_ide:
  action: approve
  phase: verify
  summary: "All {N} criteria passed, tests green, build clean"
```

5. Clear tracker:

```
plan_tracker_ide:
  action: clear
```

## Evidence Standards

**Never claim pass without:**
- Actual command output
- Exit codes verified
- Counts confirmed

**Red flags (STOP):**
- "Should pass"
- "Looks good"
- "I believe it works"

## Handoff

**Pass:**
> Feature verified. Report: `docs/specs/{feature}/verification-report.md`
>
> Next: Create PR, merge, or start new feature with `/skill:sdlc-spec`

**Fail:**
> Verification FAILED.
>
> Failures: {list}
>
> Fix issues, then re-run `/skill:sdlc-verify`
