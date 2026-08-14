# CLAUDE.md

Rules for Claude Code when working in this repository.

## Security

- **Never push keys or secrets to GitHub.** No API keys, tokens, passwords, or `.env*` files in any commit. Before every commit, check the diff for secrets. Env files stay local only (`.env.local`, `.env`).

## Workflow

1. **Never assume — always read the code first.** When asked anything about the codebase, verify by reading the actual source before answering. Use **parallel subagents** to explore/search the codebase when the question spans multiple files or areas, then report the findings.
2. **Always plan first and get approval.** Before making changes, present a plan and wait for the user to approve it. Only implement after approval.
3. **Always maintain a todo list** for whatever task is in progress, so the user can track what is being done.
4. **Create tests** for the changes made, run them, and only then push.
5. **Push to the current working branch** (never directly to `main`).

## Commits

- Every commit must have a **proper, descriptive commit message** explaining what changed and why.

## Database

- **Never create/run migrations and never delete anything from the database.** No destructive database operations of any kind (DROP, DELETE, TRUNCATE, schema changes). If a schema change seems needed, stop and ask the user.

## Changelog

- Maintain `CHANGELOG.md` at the repo root. **Every change made must be recorded there** (date, what changed, why) as part of the same piece of work.
