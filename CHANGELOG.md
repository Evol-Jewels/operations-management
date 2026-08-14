# Changelog

All notable changes to this project are recorded here, newest first.

## 2026-08-14

- PostHog now identifies logged-in users by **email** (falling back to the better-auth user ID only if email is missing) in `components/providers/PostHogAnalytics.tsx`, so persons in PostHog are recognizable by email. Note: users previously tracked under their ID will appear as new person profiles under their email.
- Added `CLAUDE.md` with working rules for Claude Code (no secrets in git, plan-then-approve workflow, parallel subagent code reading, tests before push, descriptive commits, no database migrations/deletions, changelog + todo list maintenance).
- Added this `CHANGELOG.md` to track all future changes.
