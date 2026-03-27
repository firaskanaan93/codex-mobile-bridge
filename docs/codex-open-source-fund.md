# Codex Open Source Fund Application Blurb

## Short Description

Codex Mobile Bridge turns Codex Desktop into a mobile-accessible remote workspace. It lets users browse their local Codex projects and threads from a phone, then send a message back into the real desktop conversation on macOS through a desktop automation bridge.

## Why This Project Matters

Codex is powerful on desktop, but many users step away from their laptop while a task is still active. This project closes that gap by making Codex sessions readable and actionable from mobile without rethinking the user’s existing local workflow.

Instead of creating a parallel chat client, the project reads Codex’s local state and transcript files, maps them into a mobile-first web interface, and sends instructions back into the real Codex Desktop UI. That makes it useful for solo developers, founders, and operators who need lightweight remote control over an active Codex session.

## Open Source Value

- documents a practical integration pattern around Codex local storage
- provides a reusable mobile-first UI for reading Codex threads
- explores safe, explicit boundaries between transcript reading and desktop control
- offers a foundation for future authentication, stable tunneling, Linux/Windows support, and more reliable desktop automation

## Current Focus

The current release prioritizes:
- mobile browsing of local Codex projects and threads
- remote message sending back into Codex Desktop on macOS
- simple public access through Cloudflare quick tunnels

## Where Funding Would Help

Funding would accelerate:
- more robust desktop automation across Codex UI states
- a safer auth layer for public exposure
- support for stable named tunnels and deployable self-hosting flows
- cross-platform support beyond macOS
- improved transcript compatibility as Codex evolves
