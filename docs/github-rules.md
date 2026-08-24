# GitHub Rules

## Repo
- Remote: https://github.com/4meerBasim/jareesh-app.git
- Default branch: `main-jaresh` (this is what `origin/HEAD` points at — **not** `main`)
- Other long-lived branches: `main`, `main-resturant` — older lines, do not target them
  without being told to.

## Branch strategy
This repo has no `dev`/`stage` pair. Work flows:

```
feat|fix|chore/<short-description>  →  PR  →  main-jaresh
```

- Branch off `main-jaresh` unless told otherwise.
- Pattern `[type]/[short-description]`, lowercase kebab-case, descriptive but short:
  - `feat/...` — new feature (`feat/plan-builder-and-subscription-flow`)
  - `fix/...` — bug fix (`fix/dashed-divider`)
  - `chore/...` — tooling, deps, config, non-behaviour changes
  - `enhancement/...` — improvement to something that already works
- One branch per task. Don't stack unrelated changes on one branch.
- Never generic: no `fix/bug1`, no `patch`, no `test`.

## Golden rule: commit messages
- Every commit gets a clean, professional message. No exceptions.
- **No emojis, no icons, no decorative symbols** in subject or body.
- Format: short imperative subject, blank line, then body explaining *why* if the
  diff doesn't already say it.
- Never `fix stuff`, `updates`, `wip`.
- Conventional Commits prefixes: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`,
  `test:`.

## Pushing
- Run `git status` and `git diff` before committing to confirm scope.
- Never push, force-push, or open/close/merge a PR without explicit confirmation for
  that specific action.
- Never push to `main-jaresh`, `main` or `main-resturant` directly.
- Never `--no-verify`.
- Never force-push a shared branch.

## Pull requests
- Title short and professional, matching the commit convention. No emojis.
- Description always says: what changed, why it was needed, and how to test it.
  Never leave it empty or templated.
- Link the vault note(s) the change belongs to (see `obsidian-vault-rules.md`) so a
  reviewer can find the context without reading the whole diff.
- Do not merge your own PR unless explicitly allowed.

## Never
- Never commit secrets, `.env` files, or credentials.
- Never `git reset --hard`, `git clean -f`, or delete a branch without asking.
- Never rewrite published history (rebase or amend anything already pushed).
