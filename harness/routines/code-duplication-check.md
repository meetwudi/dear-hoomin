# Code Duplication Check

## Purpose

Check whether repeated code, queries, UI structures, or workflow logic should be consolidated to keep the codebase DRY.

## Inputs

- Current code
- `harness/development-principles.md`
- Nearby `AGENTS.md` files

## Preferred Workflow

Use both automated search and judgment:

```sh
npx jscpd apps --min-lines 8 --min-tokens 60
```

If `jscpd` is unavailable, use focused repository search instead:

```sh
rg "repeated phrase or helper name"
```

Review repeated code in context before recommending consolidation. Treat small, local repetition as acceptable when an abstraction would reduce clarity or expand scope.

## Output

For review, report:

- Duplication that should be consolidated.
- Acceptable repetition that should remain local.
- Suggested abstraction boundaries or existing helpers to reuse.
- Questions requiring developer clarification.
