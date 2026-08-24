# Code Review Rules

## Always confirm before starting
- Never start a review — inline, via the `code-review` subagent, or any other route
  — without asking first and getting a yes.
- This applies every time, not just the first review on a PR. Re-reviews after new
  commits need a fresh yes.
- If the answer is no, record on the PR that it has **not been reviewed** — don't
  silently skip it and don't imply it was checked.

## Tooling: Claude only
Review is done with Claude Code's own capabilities: this model directly, the
`code-review` / `clean-code` subagents, or `/code-review`. Never defer to a
third-party bot — CodeRabbit, Copilot review, SonarQube — for this project.

## What to check, in order
1. **Correctness** — does it do what it claims? Edge cases, off-by-one, null
   handling, race conditions.
2. **Security / data** — nothing logged that shouldn't be, no credentials, no
   unguarded user input.
3. **Structure** — right folder, right naming, no logic duplicated from somewhere
   that already has it.
4. **Simplicity** — no premature abstraction, no dead code, no config flag added
   "for later".
5. **Tests** — are the changed paths covered, do existing ones still make sense.
6. **Style** — consistent with the surrounding file.

## This project's specifics
Every review confirms these, not just the generic list:

- **Verify with the real exit code.** `npx tsc --noEmit` — do **not** pipe it into
  `head`, or `$?` reports the pipe's status and a failing typecheck reads as clean.
  There is no ESLint config in this repo; `tsc` is the check.
- **Expo Go is the runtime.** Nothing may be added that Expo Go for the current SDK
  does not already carry. Reanimated stays uninstalled (its worklets crash Expo Go
  on SDK 57). `bundledNativeModules.json` is Expo's *version pinning* list, **not**
  proof a module is in the Expo Go binary — `@react-native-picker/picker` is listed
  and is not there. See [[picker-native-module-missing]].
- **Arabic-first, RTL.** No hardcoded `left`/`right` — use `start`/`end`, and
  `textAlign: 'auto'` rather than `'right'`. A clock or a number run stays LTR even
  in Arabic. Digits are always Western (`i18n/digits.ts`) — never Arabic-Indic.
- **Copy lives in `i18n/strings.ts`**, both `ar` and `en`, never inline in a screen.
  Arabic counts one, two, 3–10 and 11+ differently — use `i18n/count.ts`, don't
  paste a digit in front of a fixed plural.
- **State is React Context**, one per domain under `src/state/`. No Redux, no
  Zustand, no second global-state library.
- **Navigation is React Navigation**, not expo-router.
- **Animation is core `Animated` + `PanResponder`.** Never mix drivers on one
  transform — a native-driven value sharing a transform with a JS `setValue` throws
  at runtime, and `tsc` will not catch it.
- **Empty is `[]`, not `null`,** in the plan grid. `if (!cell)` on an array is
  always false; test `.length`. See [[empty-cell-truthiness]].
- **Gesture code is guilty until proven innocent.** A `PanResponder` inside a
  `ScrollView`, or a `Pressable` wrapping one, is a bug waiting to happen — see
  [[drag-reorder-unreliable]] and [[time-wheel-blocked-by-pressable]]. Prefer a
  design with no gesture at all.

## Clean code for React Native
- Components small and single-purpose; split when one does fetching *and* layout
  *and* business logic.
- Rules of Hooks: no conditional or looped hook calls. Early returns go **after**
  every hook.
- No inline anonymous functions or style objects passed into a list row where it
  costs re-renders.
- `StyleSheet.create`, not ad hoc inline objects, when a shared style exists.
- No dead code, no commented-out code, no unused imports, no orphaned styles left
  behind by a restructure.

## How to review
- Review the diff, not the whole file, unless context demands more.
- Rank findings by severity. Don't bury a real bug under five nitpicks.
- Every finding states a concrete failure: "if X, then Y breaks". Not a preference.
- If nothing is wrong, say so. Don't invent findings.

## Use the subagent
Use the `code-review` subagent for a diff or PR — it keeps the noisy diff-reading
out of the main context and returns only the findings. Review inline only for a
single small file already open.

**Every confirmed finding becomes a `bugs/` note with `Status: not-fixed`, right
then** — see `obsidian-vault-rules.md`.

## Before merging
- Everything above nitpick severity is resolved or explicitly accepted by the user.
- `npx tsc --noEmit` passes.
- Vault notes reflect the actual shipped state.
