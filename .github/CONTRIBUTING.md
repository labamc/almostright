# Contributing

## Workflow

Every story ships via a feature branch and pull request. Direct pushes to `main` are not permitted.

```
git checkout -b feat/story-XX-short-description
# implement
git commit -m "feat(scope): description (STORY-XX)"
gh pr create
# reviewer approves PR → merge → Atono story moves to Done
```

## Branch naming

| Type | Pattern | Example |
|---|---|---|
| Feature | `feat/story-XX-description` | `feat/story-34-sample-spec` |
| Bug fix | `fix/bug-XX-description` | `fix/bug-3-url-truncation` |
| Chore | `chore/description` | `chore/upgrade-dependencies` |

## Commit convention

```
type(scope): short description (STORY-XX)
```

| Type | When |
|---|---|
| `feat` | New feature or behaviour |
| `fix` | Bug fix |
| `chore` | Maintenance, deps, config |
| `docs` | Documentation only |

**Examples:**
```
feat(SpecForm): add sample spec pre-fill (STORY-34)
fix(ResultsDisplay): handle empty issues array (BUG-3)
chore(ci): add type-check GitHub Action (STORY-35)
```

## Pull requests

Use the PR template. Every PR must:
- Reference the Atono story handle
- Check off each AC
- Include steps to test

The PR review step = the Atono Review step. Adam's PR approval closes the loop in both systems.

## CI

TypeScript type-check runs on every push and PR. PRs cannot merge with type errors.
