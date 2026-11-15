# Connect both Codex accounts

This connects account token activity to “Proof of Building.” It does not merge OpenAI accounts or move conversations between them. The site remains static, with no OpenAI credentials in Cloudflare or GitHub.

## First connection

Use the installed official `codex` executable and Node 22 from this project directory:

```powershell
npm run activity:connect -- --profile a --login
npm run activity:connect -- --profile b --login
```

Run these sequentially. Each command saves a temporary sign-in URL in `.private/codex/login-a.json` or `login-b.json`. Open the URL in your browser, select the correct account, and complete OpenAI verification. The command waits up to ten minutes. Use a different OpenAI account for each profile. If the link expires, rerun the command.

The collector launches the official `codex app-server` with its own profile directory and file-based credential storage. It never reads, copies, signs out, or overwrites the desktop app’s current credentials. Credentials and snapshots remain in ignored `.private/codex/`; never share or commit that directory. This directory contains sensitive sign-in state and should remain on your private computer.

## Review and publish

```powershell
npm run activity:connect -- --publish
# Review .private/codex/public-preview.json: only dates, aggregate counts and source labels.
npm run activity:connect -- --publish --reviewed
npm run lint
npm test
npm run build:static
```

Review `git diff -- src/data/activity.json`, then commit and push the sanitized dataset to `main`. The existing Cloudflare Pages integration deploys the update. The connection command itself does not push or deploy.

## Refresh later

```powershell
npm run activity:connect -- --refresh
npm run activity:connect -- --publish
npm run activity:connect -- --publish --reviewed
```

Both snapshots must be refreshed within 24 hours before publishing. If an account needs reauthentication, rerun its `--profile a --login` or `--profile b --login` command. The website shows a published snapshot, not a continuously updating feed. No scheduled background job is installed.

## What the numbers mean

- Source: the official app-server `account/usage/read` method, using subscription-backed Codex sign-in. API keys do not provide these account records.
- Only daily buckets are combined. Account lifetime summaries, peak values, and streaks are not added together.
- All explicitly reported daily records contribute to observed totals. Days reported by only one account are labeled partial. Dates absent from both accounts remain missing; no zeroes are inferred.
- Dates retain the provider’s calendar labels. The endpoint does not declare the bucket timezone. UTC is used only for formatting snapshot timestamps.
- Stable account identities are hashed privately to prevent connecting one account twice. No identity hashes, addresses, auth data, prompts, conversation titles, repositories, or raw account responses enter the website dataset.
- Daily history is optional upstream. Missing/empty history, duplicate dates, unsafe counts, duplicate accounts stop publication and preserve existing public data.
- Repeated refreshes replace each account’s snapshot and rebuild totals. They do not append usage or count it twice.

Official protocol: https://learn.chatgpt.com/docs/app-server

The separate `activity:import` workflow remains available for owner-reviewed token CSV/JSON imports. ChatGPT conversation exports are a different source and do not establish measured Codex token usage.
