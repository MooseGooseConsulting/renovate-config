---
title: MooseGoose Renovate Config North Star
date: 2026-06-20
author: Patrick
status: living
last_confirmed: 2026-06-20
---

# MooseGoose Renovate Config North Star

## Why This Exists

This repository exists so MooseGooseConsulting and selected Coldaine repositories can use Renovate effectively for whatever Renovate is good at managing, without turning dependency maintenance into noisy, repo-by-repo babysitting.

## Goals

G1. **Use Renovate broadly and honestly.** Let Renovate manage dependency surfaces it can manage well, including package manifests, lockfiles, GitHub Actions, container images, devcontainers, and other supported sources as they become relevant.

G2. **Share a useful default across repositories.** Keep the shared preset flexible enough for different repositories, but specific enough that extending it gives immediate value.

G3. **Balance central coordination with repo autonomy.** Put common policy in this repo, and let consumer repositories keep narrow local overrides when their CI, release process, ecosystem, or risk profile requires them.

G4. **Keep Renovate quiet enough to trust.** Use grouping, throttling, scheduling, and delayed PR creation so routine updates are reviewable instead of overwhelming.

G5. **Make Renovate PRs agent-reviewable.** Label, assign, and describe dependency PRs so humans and agents can triage, verify, merge, close, defer, or escalate them from GitHub PR state.

## Requirements

G1-R1. The shared preset remains valid under `renovate-config-validator --no-global --strict`.

G1-R2. Current official Renovate documentation is consulted before changing Renovate config behavior. The generated local docs snapshot is an optional cache, not a policy source.

G2-R1. Consumer repositories can opt into the shared default with `extends: ["github>MooseGooseConsulting/renovate-config"]`.

G2-R2. `org-inherited-config.json` stays a thin Mend-hosted inheritance bridge unless a maintainer explicitly chooses otherwise.

G3-R1. Local overrides in consumer repositories should be narrow, intentional, and explainable from repo-specific constraints.

G4-R1. Routine updates should be paced through the shared preset rather than handled by ad hoc per-repo throttles.

G4-R2. Security and vulnerability fixes are treated as a faster lane than routine dependency updates.

G5-R1. Renovate PR metadata should support PR-list triage without requiring a maintainer to open a Dependency Dashboard by habit.

## Anti-Goals

A1. **This is not a hidden magic policy.** Repositories should be able to see and trace the shared preset they rely on.

A2. **This is not a repo-specific exception dump.** One-off behavior belongs in the consumer repo unless it has become a repeated shared pattern.

A3. **This is not a secret store.** Host tokens, registry passwords, `.env` values, and private credentials do not belong in this repository.

A4. **This is not a dashboard-first operating model.** A repository may opt into dashboard workflows when needed, but the shared default treats Renovate PRs as the operational inbox.

## Pillars

### Transparent Centralization

Prefer explicit shared presets over invisible behavior. We accept a little local configuration ceremony so repository owners and agents can trace where Renovate behavior comes from.

### Quiet, Not Silent

Reduce PR noise without hiding important work. Routine updates can wait for schedules, grouping, release age, and CI signal; security work needs a faster path.

### Local Exceptions Stay Local Until Proven Common

Do not make the shared preset worse for ordinary repositories to solve one unusual repository. Repeated local overrides are candidates for shared policy; isolated needs stay local.

### Evidence Beats Preference

Changes to Renovate policy should be justified by validation, official docs, PR queue behavior, consumer repo examples, or rubric results.
