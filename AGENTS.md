# Repository agent instructions

## Mandatory Graphify workflow

This repository has a local Graphify knowledge graph. These requirements apply to every human and AI contributor, including contractors and automation:

1. After cloning, run `./scripts/install-graphify-hooks.sh` once.
2. After every `git pull`, confirm the hook printed `Graphify: local graph updated`; if not, run `./scripts/graphify-update.sh pull-manual`.
3. Before a material change, use `graphify query` against `graphify-out/graph.json` to inspect affected relationships, then verify the cited source directly.
4. After material code, content, route, integration, or deployment changes, run `./scripts/graphify-update.sh contributor-change` before opening or updating a pull request. The post-commit hook also updates it automatically.
5. Complete the Graphify checklist in the pull-request template.
6. Never commit, upload, or deploy `graphify-out/`. It is local, ignored, and potentially source-sensitive.
7. Graphify is a navigation aid, not proof. Source review and tests remain mandatory.

Full setup and safety details: `docs/graphify.md`.
