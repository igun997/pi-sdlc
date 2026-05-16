---
name: sdlc-verify
description: Final verification against spec with full evidence chain. Use after sdlc-execute to confirm feature is complete.
---

> **Related skills:** Execute tasks first with `/skill:sdlc-execute`. Start new feature with `/skill:sdlc-spec`.

# SDLC Verify

## Overview

Final verification: run full test suite, walk every acceptance criterion, confirm build, generate evidence report. Hard stop on any failure.

**Announce at start:** "I'm using the sdlc-verify skill for final feature verification."

**Core principle:** Evidence before claims, always.

## The Process

### Step 1: Load Context

1. Read spec from `docs/specs/{feature}/spec.md`
2. Read all task files from `docs/specs/{feature}/tasks/`
3. Read config from `docs/specs/{feature}/config.json`
4. Check plan tracker status:

```
plan_tracker_ide:
  action: status
```

**If incomplete tasks exist:**
- Report: "Found incomplete tasks: {list}"
- **HARD STOP** - cannot verify incomplete work
- Suggest: "Complete remaining tasks with `/skill:sdlc-execute`"

### Step 2: Full Test Suite

Run complete test suite (not just task-related tests):

```bash
{testCommand from config}
```

**Evidence required:**
- Full command output
- Total tests run
- Pass/fail count
- Exit code

**Pass criteria:**
- Exit code 0
- 0 failures

**If fail: HARD STOP**
- Show full test output
- List failing tests
- Do not proceed

### Step 3: Spec Acceptance Criteria

Walk through EVERY criterion from spec:

```markdown
## Acceptance Criteria Verification

### From Spec

1. [Criterion 1]
   - **Status:** ✓ PASS
   - **Evidence:** {how verified - test name, manual check, etc.}

2. [Criterion 2]
   - **Status:** ✓ PASS
   - **Evidence:** {specific proof}

3. [Criterion 3]
   - **Status:** ✗ FAIL
   - **Gap:** {what's missing}
```

**If ANY criterion fails: HARD STOP**
- Report which criteria failed
- Show what's missing
- Do not proceed

### Step 4: Build Verification

```bash
{buildCommand from config}
```

**Evidence required:**
- Full command output
- Exit code

**Pass criteria:**
- Exit code 0
- No errors

**If fail: HARD STOP**

### Step 5: Generate Report

Create verification report:

```markdown
# {Feature} Verification Report

**Date:** YYYY-MM-DD
**Status:** ✓ PASS | ✗ FAIL

## Summary

- **Spec:** docs/specs/{feature}/spec.md
- **Tasks:** {N} tasks completed
- **Duration:** {time from first task to verification}

## Test Results

```
{full test output}
```

- **Total:** {N} tests
- **Passed:** {N}
- **Failed:** 0
- **Exit code:** 0

## Acceptance Criteria

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | {criterion} | ✓ | {evidence} |
| 2 | {criterion} | ✓ | {evidence} |

**All criteria satisfied:** ✓

## Build

```
{build output}
```

- **Exit code:** 0

## Files Changed

{git diff --stat from feature start}

## Conclusion

Feature "{feature}" is complete and verified.
Ready for: PR / Merge / Deploy
```

### Step 6: Save and Sync

1. Save report to `docs/specs/{feature}/verification-report.md`

2. Sync to memctx:

```
memctx_save:
  type: observation
  title: {feature} Completed
  path: 60-observations/{feature}-completed.md
  content: |
    # {Feature} - Completed
    
    Spec: [[20-context/{feature}-spec]]
    Tasks: [[60-observations/{feature}-tasks]]
    
    ## Verification Summary
    - Tests: {N} passed
    - Criteria: {N}/{N} satisfied
    - Build: PASS
    
    ## Key Deliverables
    - {deliverable 1}
    - {deliverable 2}
    
    Verified: YYYY-MM-DD
  tags: [sdlc, verify, complete, {feature}]
```

3. Update spec status:
   - Edit `docs/specs/{feature}/spec.md`
   - Change `Status: In Progress` → `Status: Complete`

4. Commit:

```bash
git add docs/specs/{feature}/
git commit -m "docs({feature}): verification complete"
```

5. Clear plan tracker (optional):

```
plan_tracker_ide:
  action: clear
```

## Evidence Standards

**Never claim pass without:**
- Actual command output shown
- Exit codes verified
- Counts confirmed (X/Y tests, N criteria)

**Red flags - STOP:**
- "Should pass"
- "Looks good"
- "I believe it works"
- Any claim without evidence

## Handoff

After verification passes:

**"Feature '{feature}' verified and complete.**

**Verification report:** `docs/specs/{feature}/verification-report.md`

**Next steps:**
- Create PR
- Merge to main
- Start new feature with `/skill:sdlc-spec`"

---

After verification fails:

**"Verification FAILED for '{feature}'.**

**Failures:**
{list of failures with details}

**To resolve:**
1. Fix the issues
2. Re-run `/skill:sdlc-verify`"
