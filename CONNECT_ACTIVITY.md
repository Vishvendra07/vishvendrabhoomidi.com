# Automatic activity sync

The site refreshes from both connected Codex accounts on GitHub-hosted runners approximately every six hours. Your computer and Codex desktop app can be closed. The previous local automation is paused.

## Hosted flow

1. GitHub starts the main-branch `Hosted activity sync` workflow on its schedule.
2. The runner presents a short-lived GitHub OpenID Connect token to the Cloudflare activity vault. The vault requires this exact repository, numeric owner and repository IDs, workflow path, main branch, a scheduled/manual workflow event, and a GitHub-hosted runner.
3. The vault leases the two existing account sign-ins to that run. They are encrypted at rest with AES-256-GCM; the master key is a Cloudflare secret. No OpenAI credentials or long-lived GitHub access tokens are stored in repository source or workflow variables.
4. The pinned official Codex CLI reads provider activity. Both private account identities are checked. Any refreshed sign-in state is persisted back to the vault, including after a partial collection failure.
5. Only whitelisted aggregate data enters `src/data/activity.json`. Unit tests, lint and the production static build must pass before an automatic fast-forward push.
6. Cloudflare Pages deploys the change. The hosted job waits for its deployment check, then opens the public site and verifies the lifetime total, both streaks, sync state and privacy boundaries.

The workflow can also be run from the repository’s Actions tab for diagnosis. Routine updates need no manual refresh, review or publishing step. The public site shows “Awaiting sync” if its last successful refresh is more than 36 hours old.

## What is published

Lifetime tokens sum the two provider lifetime summaries, independently of the chart range. Missing summary totals remain unavailable. Daily, weekly and cumulative charts use returned daily buckets. One account’s absent record is not assumed to be zero.

Active days and streaks use the union of positive daily records across the accounts. A positive partial-coverage record still proves activity. The current observed streak can end today or yesterday, allowing today to remain in progress. Missing dates break an observed run; the longest observed streak may understate unreported historical work. Provider calendar labels are preserved because the Codex endpoint does not declare their timezone. UTC selects the refresh reference date.

## Failure behavior

Revoked sign-ins, new provider authentication challenges, upstream outages or deployment failures stop publication and preserve the previous public snapshot. GitHub exposes failures in the workflow. Provider security decisions can require one-time owner verification; no integration can guarantee that revocation or mandatory verification will never happen.

The vault denies public, fork, pull-request, other-workflow and other-repository identities. A per-run lease and version check prevent overlapping runs from overwriting renewed credentials. The workflow never force-pushes or stages unrelated files.

## Cursor history assessment

Cursor’s individual-account dashboard supports CSV export. The first requested account’s actual export was verified privately: 6,537 events, 8,384,607,536 tokens, September 5, 2025–March 27, 2026. This proves a historical import is feasible; it does not establish full lifetime coverage or daily API availability.

No documented general personal-account usage API was found. Cursor documents team administration usage endpoints and Enterprise analytics API access. The three individual accounts would therefore need verified exports for an initial historical import. They are not claimed as connected or included in the current Codex lifetime total. Raw exports and their account identities stay private, and repeated exports should replace each account’s import rather than be appended. Use each CSV’s Total Tokens field without adding overlapping cache/input columns again.

Sources: https://cursor.com/docs/account/teams/admin-api and https://cursor.com/docs/account/teams/analytics; individual usage API discussion: https://forum.cursor.com/t/usage-api-cli-command/160967.

Official Codex protocol: https://learn.chatgpt.com/docs/app-server.
