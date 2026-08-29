# SideQuest Product Brief

Status: Draft for approval  
Owner: Product  
Scope: Consumer mobile MVP

## Vision

Help people turn spare time into memorable real-world experiences. SideQuest answers “What should I do now?” with one actionable Quest, not an endless recommendation feed.

## Problem

People often have time and willingness to do something, but choosing an activity requires too much searching, comparison, and coordination. Existing discovery products optimize for browsing places; they do not provide a playful, bounded action that fits the user’s time, budget, mood, and travel radius.

## Proposed solution

A mobile-first app that asks for four context inputs, deterministically matches a safe Quest Template, personalizes it into a Quest Instance, and guides the user through acceptance, real-world action, proof, completion, and XP.

Core loop: **Discover → Find Quest → Accept → Do → Proof → Complete → Earn XP → Discover Again**.

## Target audience

Primary: urban and peri-urban adults aged roughly 18–35 who have unplanned free time, use a smartphone while out, and want low-commitment novelty. The product is initially localized for Indonesia (IDR, Indonesian/English-ready copy), but the domain model must not hard-code one city.

## Value proposition

“Tell SideQuest what fits right now and get one safe, achievable real-world Quest within seconds.”

## Differentiation

- Action over browsing: one Quest with instructions and a finish state.
- Context fit: explicit time, budget, mood, and distance constraints.
- Lightweight progression: completion produces meaningful XP and history.
- Deterministic MVP: curated templates make recommendations explainable, testable, and safe.

## Product principles

1. Mobile-first and usable on the move.
2. Quest, not recommendation.
3. Low friction: reach a result quickly.
4. Playful and premium, never childish.
5. Optimize for leaving the app to act.
6. Make progress legible and meaningful.
7. Default to safe, lawful, public exploration.
8. Prove the smallest useful loop before expanding.

## Goals

- Validate that users accept and complete context-matched Quests.
- Return a valid result in at least 95% of eligible searches in seeded launch areas.
- Make the entire active Quest lifecycle recoverable across app restarts.
- Build an auditable foundation for content, privacy, and reward integrity.

## Non-goals

The MVP is not a social network, city guide, marketplace, navigation provider, AI content generator, background location tracker, or creator platform. It does not independently verify that a proof depicts the requested activity.

## Success definition

Product readiness is demonstrated by a healthy core funnel, not downloads alone. Initial validation targets (to revisit after a 2-week baseline):

- ≥40% of users who receive a Quest accept one.
- ≥50% of accepted Quests are completed.
- Median time from search start to Quest result ≤3 seconds under normal connectivity.
- ≥25% of completers return and start another search within 7 days.
- Safety-related Quest incidents: zero; confirmed inappropriate-template rate <0.5%.

These are product hypotheses, not contractual service-level objectives.

## Decision references

Scope is controlled by [03-mvp-scope.md](03-mvp-scope.md); measurable behavior by [08-functional-requirements.md](08-functional-requirements.md); unresolved decisions by [23-open-questions.md](23-open-questions.md).
