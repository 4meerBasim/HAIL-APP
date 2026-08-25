# Tasks & Agents

How work gets planned, delegated and finished on this project.

## Before starting any non-trivial task
1. **Restate the goal in one sentence** and confirm it matches what was asked.
2. **Read the vault** — `pages/`, `features/`, `bugs/`, `enhancements/` notes for
   whatever is being touched. That is the context; don't make the user re-explain.
3. **Identify the smallest set of files that change.** Read them before editing.
4. **Ask if it's ambiguous.** If two readings lead to materially different work,
   ask — one question, with the consequence of each option spelled out. Especially
   when the answer moves a price, a data model, or user-facing Arabic copy.

## Delegate to keep the main context clean
The main context window is a limited resource. Spawn a subagent whenever the work
would otherwise dump noise into it:

- searching or exploring across files
- reading many files to answer one question
- long command output that isn't needed in full
- reviewing a diff or a PR

The subagent returns **only the result** — a summary, a path, a finding, a diff.
Not intermediate steps, not file contents, not raw output. Act on the summary; do
not re-derive what it already found.

Run independent subagents in parallel in one message.

**Nesting limit:** main → subagent → sub-subagent, then stop. State this limit in
the prompt when delegating, so the subagent doesn't spawn a third level.

## Which agent

| Agent | Use for |
|---|---|
| `Explore` | "where is X", finding files/symbols/patterns |
| `Plan` | designing an approach before writing code |
| `tech-planner` | turning a rough idea into a written implementation spec |
| `master-mind` | open-ended design discussion, no files touched |
| `rn-designer` | React Native / Expo screens, components, native styling |
| `ui-ux` | layout, spacing, type, colour, flows |
| `arabic-linguist` | Arabic copy — grammar, spelling, natural phrasing |
| `code-review` | reviewing a diff or PR |
| `clean-code` | refactoring, simplifying, removing dead code |
| `emulator-tester` | actually running the app to verify a change works |
| `merge-conflict-resolver` | merges and conflicts |
| `vault-docs` | a documentation pass to re-sync the vault with the code |
| `auto-pilot` | fully specified end-to-end tasks with zero ambiguity |
| `orchestra` | coordinating several agents on one plan |

If none fits, do it directly rather than forcing a mismatched agent.

## Default task workflow
Unless the user says otherwise:

1. **Clarify** — per the checklist above.
2. **Pick an agent** — or proceed directly if none fits.
3. **Implement**, updating the vault note in the same change.
4. **Verify** — `npx tsc --noEmit`, checking the **real** exit code, not a pipe's.
   Then a `code-review` pass. Steps 4 and 7 are pre-authorised; every other review
   still needs a fresh yes per `code-review.md`.
5. **Branch decision** — per `github-rules.md`.
6. **Open a PR** against `main-jaresh`.
7. **PR-level review** with the `code-review` agent.

## While executing
- Update the vault note's `Status` as you go, not in a batch at the end.
- If the task turns out bigger than expected, stop and re-scope with the user
  rather than silently expanding.
- If a blocker changes the plan, say so before continuing.
- **Report honestly.** If a check didn't run, say it didn't. If something is
  written but unverified on a device, say that. "Typechecks" is not "works".

## Definition of done
- [ ] `npx tsc --noEmit` passes (real exit code).
- [ ] Vault note(s) added or updated, with the right `Status` and no orphan links.
- [ ] No dead code, no orphaned styles, no unused strings left behind.
- [ ] Copy is in `i18n/strings.ts` in both `ar` and `en`.
- [ ] Follows `github-rules.md` if it's being committed.
- [ ] Anything unverified on a real device is called out as unverified.
