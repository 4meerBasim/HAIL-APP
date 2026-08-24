# Never Do

Hard rules. If a task seems to need one of these, stop and ask — don't find a
workaround that technically avoids the letter of the rule.

## Git
- Never push, force-push, or open/close/merge a PR without confirmation for that
  specific action.
- Never commit directly to `main-jaresh`, `main` or `main-resturant`.
- Never `git reset --hard`, `git clean -f`, or delete a branch without asking.
- Never skip hooks (`--no-verify`).
- Never rewrite pushed history.

## Dependencies
- Never add a native module without checking it is in the **Expo Go binary** for
  this SDK. `bundledNativeModules.json` is a version-pinning list, not proof —
  see [[picker-native-module-missing]].
- Never reinstall Reanimated. Its worklets crash Expo Go on SDK 57.
- Never introduce a second state library alongside React Context.

## Code
- Never leave commented-out code, placeholder code, or half-finished work.
- Never add abstractions, config flags or "future-proofing" beyond the task.
- Never hardcode `left`/`right` in styles.
- Never put user-facing copy inline in a screen — it goes in `i18n/strings.ts`,
  both languages.
- Never render Arabic-Indic digits. Western digits everywhere, both languages.
- Never mix animation drivers on one transform.
- Never test an array for emptiness with `!value`.

## Verification
- Never pipe `tsc` into `head` and read `$?` — that is the pipe's exit code, and a
  failing typecheck will read as clean.
- Never claim a UI change works without running it when a device is available.
  "Typechecks" is not "works".

## Vault
- Never delete a vault note — mark it `fixed` / `done` / `deprecated`.
- Never leave a note orphaned with no wikilinks.
