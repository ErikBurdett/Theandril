---
name: theandril-multiplayer
description: Use when implementing Colyseus rooms, online turns, commands, reconnect, hidden information, match persistence, multiplayer save/resume, player seats, or network security.
---

# Theandril Multiplayer

The server is authoritative.

## Architecture

Reuse `packages/sim`.

The server owns canonical state and deterministic resolution.

Clients send commands/intents only.

## Hidden information

Never serialize full state to clients.

Create faction-scoped observations:
- explored world;
- current visibility;
- known armies;
- diplomatic intel;
- public statistics.

Test that hidden enemy objects do not appear in network payloads.

## Turn flow

Default:
- simultaneous planning;
- submitted/ready status;
- timer if configured;
- canonical resolution;
- broadcast permitted deltas;
- next planning phase.

Resolve simultaneous conflicts by documented deterministic rules, not packet arrival time.

## Security

Validate:
- authenticated player/seat;
- faction ownership;
- turn/phase;
- resource cost;
- visibility prerequisites;
- command schema;
- rate limits.

## Reliability

Implement:
- reconnect token/session;
- idempotent command sequence handling;
- room snapshot persistence;
- host migration only if architecture supports it safely; otherwise authoritative hosted room recovery;
- save/resume.

## Tests

At minimum run an integration test with two independent clients:
- join;
- issue commands;
- ready;
- resolve;
- reconnect one;
- continue;
- verify state hashes/server authority.
