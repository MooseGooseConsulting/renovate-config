# MooseGoose Renovate Config

Shared, secret-free Renovate policy for MooseGooseConsulting and Coldaine repositories.

There does not appear to be an official Renovate-authored agent `SKILL.md`.
This repo includes a local `renovate-config` skill that refreshes and uses
official Renovate documentation before any config edit.

## Use From A Repo

Add this to `renovate.json`:

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["github>MooseGooseConsulting/renovate-config"]
}
```

MooseGooseConsulting repos can also inherit the same policy automatically through
`org-inherited-config.json` when the Mend Renovate app is installed for the org.

## Policy Shape

- Do not require the Dependency Dashboard. Renovate PRs are the inbox.
- Wait for checks to finish before opening ordinary PRs when possible.
- Keep only a small number of Renovate branches/PRs active per repo.
- Request Patrick's review on Renovate PRs.
- Group minor/patch updates by dependency family.
- Let vulnerability-fix PRs bypass ordinary scheduling and release-age delays.

This repository intentionally contains no secrets or host rules.

## Local Guardrails

Install repo-managed hooks after cloning:

```sh
npm run hooks:install
```

The pre-push hook runs `npm run renovate:validate` and refuses direct pushes from
`main`/`master`. GitHub branch protection on `main` enforces the same PR flow
remotely.
