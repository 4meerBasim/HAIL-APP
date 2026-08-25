# CustomPlanCard did not exist

Status: fixed
Found: `src/screens/PlansScreen.tsx:15`, `src/screens/BoxesScreen.tsx:8`
Summary: Two screens imported `../components/CustomPlanCard`, which was not on disk and never in git — the app could not resolve it.

## Details
`git cat-file -e HEAD:src/components/CustomPlanCard.tsx` → does not exist. `tsc` reported TS2307 twice; Metro could not have resolved it either.

It went unnoticed for several turns because typecheck was being run as `npx tsc --noEmit | head -10; echo $?` — that reads the **pipe's** exit code, so a failing typecheck looked clean. See [[typecheck-exit-code-masked]].

Fixed by writing the component.

## Related
- Page: [[plans]], [[boxes]]
- Feature: [[pressable-plan-cards]]
- Bug: [[typecheck-exit-code-masked]]
