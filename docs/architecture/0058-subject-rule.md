# 0058 — Subject rule: a conquered capital bound rather than taken

Rules/save **39** adds a fifth settlement-capture outcome, **Make subject**, to the
existing occupy / sack / raze / liberate choice. It is the "client rule" outcome
the M1 roadmap and Gate H list beside liberation: a political end to a war that
leaves the hearth where it stands and binds its realm instead.

## When it is offered

A capture decision quotes the subject outcome only when, at the moment the
hearth falls:

- the fallen hearth is the defeated realm's **capital** (`land.capitals`);
- the defeated realm still holds **another hearth** to rule as a subject;
- the rules-22 patronage chain allows it: the capturer answers to no patron, the
  defeated realm has no patron and no clients of its own, and the capturer is
  below the client limit.

The quoted terms are fixed by `subjectTerms`: no subsidy, tribute of three coin
per hearth the defeated realm holds (at most 200) and a thirty-turn term. When
the outcome is absent, the capturer's observation carries an `unavailable`
entry naming the first failing reason, and the capture panel shows it; the
canonical decision record is untouched.

## What it does

Resolving `subject` keeps the hearth with its owner with the same consequences as
liberation (population and buildings kept, +10 devastation, one turn of
recovery, production cancelled, the capturer's army stays beside it), then:

1. **imposes peace** (`imposePeace`): the war pair is removed, standing peace
   offers between the pair lapse, any older treaty between them is replaced by a
   binding peace of the term's length, and the relation's war start is cleared;
2. **swears the bond** (`imposeClient`): an ordinary rules-22 client bond with
   the quoted terms, so tribute, lapse after three missed payments, release,
   lawful expiry, early renunciation as a breach, war refusal between the pair
   and hearths counted behind the patron's Unification bid all follow the
   existing rules without a second code path;
3. records conquest memory as a subject outcome (+15 grievance, +10 respect) and
   lets the ordinary post-command siege reconciliation lift every other siege
   between the two realms, since they are no longer at war.

The defeated realm keeps its capital. It may renounce the oath early, which is a
breach: the imposed peace ends and the patron is free to answer.

## AI

`chooseCaptureOption` scores the subject outcome at 55, rising to 100 when the
capturer is already at war with another realm, against 100 for holding the
capital. A realm fighting on one front keeps the capital; a realm fighting on
two prefers the peace and the tribute. The scoring reads only the capturer's
observation.

## Compatibility

- Rules 39 decisions carry `rulesVersion: 39`; rules 16–38 decisions keep their
  frozen `16` and never quote the outcome, so a v38 save with a pending capture
  loads unchanged and validates against its own quote.
- `captureOutcomeV38Schema` freezes the four-outcome enum for every command
  schema up to 38; only the rules-39 command schema accepts `subject`.
- The content pack is unchanged. A v38 envelope migrates with an identical
  state. Projecting a campaign to version ≤38 is refused only while a rules-39
  decision is pending; a sworn bond is ordinary rules-22 state and projects.
- Quoted modern decisions (16 and 39) keep the uncapped treasury limit; the one
  billion cap applies only to decisions quoted before rules 16.

## Limits

Transfers of hearths between patron and client, imposing subject rule on a realm
that already has clients, and AI strategy that targets capitals for the sake of
the oath remain open. Only the capital qualifies; a realm reduced to its capital
alone cannot be made a subject because nothing would remain to rule.
