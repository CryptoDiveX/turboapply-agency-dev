# Local Graphify code knowledge graph

## Scope and safety

- Canonical source: this `CryptoDiveX/turboapply-agency` repository. Do not graph the generated `turboapply-agency-dev` or `turboapply-sales-site` artifact repos.
- Official upstream/package: `https://github.com/safishamsi/graphify` / `graphifyy`.
- Build mode: local AST only (`update --no-cluster`); no paid API or LLM backend.
- Generated output: `graphify-out/` is local-only, ignored by Git, and must not be uploaded or published. Treat it as potentially source-sensitive.
- Keep worker count at one on shared Macs to limit memory pressure.

## Install

Use an isolated environment outside this source repository. The project PM setup uses:

```sh
TOOL_ROOT=/Users/vasyl/Hermes/projects/turboapply-websites/.tools/graphify-0.9.12
uv venv --python 3.13 "$TOOL_ROOT"
uv pip install --python "$TOOL_ROOT/bin/python" 'graphifyy==0.9.12'
"$TOOL_ROOT/bin/graphify" --version
```

## Build

From the repository root:

```sh
GRAPHIFY=/Users/vasyl/Hermes/projects/turboapply-websites/.tools/graphify-0.9.12/bin/graphify
env -u OPENAI_API_KEY -u ANTHROPIC_API_KEY -u GEMINI_API_KEY \
  -u GOOGLE_API_KEY -u DEEPSEEK_API_KEY -u MOONSHOT_API_KEY \
  GRAPHIFY_MAX_WORKERS=1 "$GRAPHIFY" update . --no-cluster
```

Expected local artifact: `graphify-out/graph.json`.

## Query and verify

```sh
GRAPHIFY=/Users/vasyl/Hermes/projects/turboapply-websites/.tools/graphify-0.9.12/bin/graphify
"$GRAPHIFY" query "How are website interactions and lead endpoints connected?" \
  --graph graphify-out/graph.json --budget 600
"$GRAPHIFY" explain "script.js" --graph graphify-out/graph.json
"$GRAPHIFY" benchmark graphify-out/graph.json
git status --short --ignored graphify-out/
```

Use Graphify for navigation and impact analysis, then verify cited source files and tests before editing or making behavioral claims. Rebuild after material code changes. Do not install Git hooks without explicit project approval.
