# Typecheck exit code masked by a pipe

Status: fixed
Found: process, not code
Summary: `npx tsc --noEmit | head -10; echo $?` reports the exit status of `head`, so a failing typecheck read as passing.

## Details
Hid [[missing-custom-plan-card]] — two unresolved-module errors — across several changes that were each reported as "typecheck clean".

Fix: run `npx tsc --noEmit` unpiped and read the real code. Written into `docs/never-do.md` and `docs/code-review.md`.

## Related
- Bug: [[missing-custom-plan-card]]
