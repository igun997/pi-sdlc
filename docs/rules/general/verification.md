# Verification Rules

> Evidence-first verification with exact status labels.

## Status Labels (MANDATORY)

Use explicit status language in all updates:

| Status | Meaning |
|--------|---------|
| `changed` | You edited or produced something |
| `verified` | You proved a claim with relevant check |
| `unverified` | Work exists but required proof not run |
| `blocked` | Required progress/proof failed |
| `assumption` | Choice depends on inference, not evidence |

**NEVER use** `done`, `fixed`, `working`, `resolved` without naming proof immediately after.

## Claim & Evidence Rules

- Match proof to strongest claim you make
- Name exact evidence for completion claims
- Separate observation from inference
- If intended verification failed → say "implemented but unverified"

## Minimum Proof by Change Type

| Change Type | Minimum Proof |
|-------------|---------------|
| Localized edit | Re-read or targeted static check |
| Backend/API change | Targeted test, command, or runtime request |
| UI/interaction change | Browser/user-surface verification + static |
| Integration change | Build/typecheck + focused behavior check |
| New app/scaffold | Install succeeds, startup succeeds, build succeeds, one happy-path works |

## Verification Order

```
1. Smallest relevant static check
2. Focused executable or user-surface proof
3. Broader validation only when warranted
```

## Stuck Loop Policy

After **2 failed attempts** on same hypothesis:

1. **STOP** repeating same fix
2. Document evidence from attempts
3. Switch strategy:
   - Smaller patch
   - Read wider area of codebase
   - Ask user one concrete question

**DO NOT** loop on identical reasoning without changing inputs.

## Closeout Contract (PR-Style)

Every completion summary must include:

```markdown
## Summary
[Outcome in one paragraph]

## Files Changed
- path/to/file.ts
- path/to/other.ts

## Verification Evidence
- Command: `npm test` → exit 0, 15 passed
- Manual: Clicked login → redirected to dashboard
- Browser: No console errors

## Status
✓ verified | ⚠ unverified | ✗ blocked

## Risks & Unverified
- [ ] Integration tests not run
- [ ] Edge case X not tested
- Assumption: Y behaves like Z
```

## When Verification Fails

```
1. State failing check and evidence
2. Form smallest corrective hypothesis
3. Make smallest corrective change
4. Re-run exact check that proves fix
5. If 2 failures → switch strategy (see Stuck Loop)
```

**NEVER claim completion while required proof is failing.**
