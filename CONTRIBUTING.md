# Contributing to TurboApply Agency

## Graphify is required

Every contributor must maintain the local Graphify code graph. Do not open a pull request for material website changes without updating and checking the graph.

### One-time clone setup

1. Install the pinned package into an isolated environment: `graphifyy==0.9.12`.
2. Run `GRAPHIFY_BIN=/absolute/path/to/graphify ./scripts/install-graphify-hooks.sh`.
3. Confirm `git config --get core.hooksPath` returns `.githooks`.

On Vasiliy's shared Mac, the approved isolated binary is auto-discovered.

### Required daily flow

1. `git pull` — the post-merge or post-rewrite hook refreshes Graphify automatically.
2. Confirm `graphify-out/graph.json` exists. If the hook did not run, execute `./scripts/graphify-update.sh pull-manual`.
3. Query the graph before broad changes; verify all cited source files directly.
4. Make and test the change.
5. Commit — the post-commit hook performs an incremental low-memory refresh.
6. Before pushing, run `./scripts/graphify-update.sh pre-push` and complete the PR checklist.

The updater forces one worker, removes supported LLM/API keys from its environment, and runs local AST mode only. Generated graphs must never be committed, published, or deployed. See `docs/graphify.md`.
