# Obsidian Vault Rules

The handoff system for this project is the Obsidian vault at `vault/`, inside this
repo and committed to git so it travels with the code.

**The vault is updated as part of doing the work, never as a wrap-up step.** A
change and its note land in the same commit.

## Vault detection
The vault is `vault/` in the repo root. Read the relevant notes before starting —
they are the context, so you don't have to ask the user to re-explain.

## Always keep it current
Update immediately, in the same change, whenever:

- **A bug is found** — add `bugs/<name>.md` with `Status: not-fixed` the moment it
  is confirmed, whether it came from a review, a user report, or from noticing it
  mid-task. Don't wait for a documentation pass.
- **A bug is fixed** — flip that note to `Status: fixed` in the change that fixes it.
- **A feature ships** — add `features/<name>.md` with `Status: shipped`.
- **An enhancement is proposed** — add `enhancements/<name>.md` with
  `Status: planned` as soon as it's agreed, before work starts.
- **An enhancement ships** — move the file to `features/`, set `Status: shipped`.
- **A feature is removed or superseded** — set `Status: deprecated`. Never delete
  the note.

## Categories

| Folder | Contents | Has status? |
|---|---|---|
| `bugs/` | one note per bug | yes |
| `enhancements/` | one note per proposed/in-progress improvement | yes |
| `features/` | one note per shipped, working feature | yes |
| `pages/` | one note per screen/route | no — structural only |

## Status & colour

| Category | Open | Colour | Resolved | Dimmed |
|---|---|---|---|---|
| `bugs/` | `not-fixed` | red `#FF0000` | `fixed` | `#7F0000` |
| `enhancements/` | `planned` | amber `#FFA500` | `done` | `#7F5200` |
| `features/` | `shipped` | purple `#800080` | `deprecated` | `#400040` |
| `pages/` | — | blue `#0000FF` | — | — |

The colours are already in `vault/.obsidian/graph.json`. Open state renders in full
colour, resolved in a dimmed variant, so graph view shows progress at a glance.

## Connections — no orphans
Every note wikilinks (`[[...]]`) to what it connects to. A note added without links
is a bug in the vault itself.

- **Page → page**: if a screen navigates to another, both get
  `Connects to: [[Other Page]]`. Link both directions.
- **Page → feature**: a page lists the features on it; the feature lists its pages.
- **Page → bug**: a page lists bugs found on it; the bug lists its pages.
- **Page → enhancement**: same pattern.
- **Cross-links**: a bug caused by a feature links to it, and back.

## Templates

**`bugs/<bug-name>.md`**
```md
# <Bug name>

Status: not-fixed
Found: <file:line, or "reported by user">
Summary: <one sentence — what's wrong>

## Details
<repro or symptom, suspected cause>

## Related
- Feature: [[<Feature Name>]]
- Page: [[<Page Name>]]
```

**`enhancements/<name>.md`**
```md
# <Enhancement name>

Status: planned
Summary: <one sentence>

## Notes
<what's known, where the idea came from>

## Related
- Page: [[<Page Name>]]
```

**`features/<name>.md`**
```md
# <Feature name>

Status: shipped
Summary: <one sentence — what it does for the user>

## Details
<how it works, key files>

## Related
- Page: [[<Page Name>]]
- Bugs: [[<Bug Name>]]
```

**`pages/<name>.md`**
```md
# <Page name>

Route: <RootStack / Tab route name and file>
Summary: <one sentence>

## Related
- Connects to: [[<Other Page>]]
- Features: [[<Feature Name>]]
- Bugs: [[<Bug Name>]]
- Enhancements: [[<Enhancement Name>]]
```
