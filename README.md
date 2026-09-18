# opencode-orchestrator-plugin

Orchestrator-only OpenCode setup: a tool-less primary agent that delegates everything to three subagents.

- `orchestrator` (primary, `cliproxy/gpt-5.6-sol#high`): sees only `subagent` (+ `question`). No `read/edit/shell` schemas.
- `orchestrator/explore` (subagent, DeepSeek `#max`): read-only research.
- `orchestrator/shell-runner` (subagent, DeepSeek `#max`): commands + read. Trusted with host shell.
- `orchestrator/coder` (subagent, DeepSeek `#max`): write + shell + verify.

Permissions are the security boundary; per-request tool stripping (`context`/`compaction`/`generate` hooks) keeps the orchestrator's context small.

## Install

The plugin self-installs its agents on first load: `setup()` writes any
missing `.opencode/agents/orchestrator*.md` files for the current location
(never overwrites) and reloads agents. So installing the package is enough:

```jsonc
{ "plugins": ["opencode-orchestrator-plugin"] }
```

Disable with `{ "options": { "installAgents": false } }` and manage files by hand:

```sh
# Manual alternative
mkdir -p ~/.config/opencode/agents
cp agents/orchestrator.md ~/.config/opencode/agents/orchestrator.md
cp -r agents/orchestrator ~/.config/opencode/agents/orchestrator
```

Then `opencode service restart`.

> Note: the plugin also calls `editor.default("orchestrator")`, but in
> practice the reliable default mechanism is config. Set it explicitly:
>
> ```jsonc
> {
>   "default_agent": "orchestrator",
>   "model": "cliproxy/gpt-5.6-sol" // root default retains no variant; pick #high via /models
> }
> ```

Project-local alternative: copy `agents/` into `.opencode/agents/` and reference the package from project `opencode.jsonc`.

## Options

```jsonc
{
  "package": "/abs/path/opencode-orchestrator",
  "options": {
    "orchestratorModel": "cliproxy/gpt-5.6-sol#high",
    "workerModel": "opencode/muse-spark-1.3-contributor-free#xhigh",
    "workerFallbackModel": "opencode/muse-spark-1.3-contributor-free#high",
    "maxVariantSettings": { "reasoningEffort": "max" },
    "enableQuestion": true,
    "setDefault": true
  }
}
```

Precedence is fill-unset: explicit user `agents.*` config always wins over the plugin. Worker agent files default to `opencode/muse-spark-1.3-contributor-free#xhigh`; the plugin probes the live provider catalog at setup and falls back to `workerFallbackModel` when the preferred variant isn't served (check logs for `[orchestrator]`).

## Notes

- Default-only: `build`/`plan` remain selectable as an escape hatch.
- Sessions store their model separately: after install, pick `cliproxy/gpt-5.6-sol#high` via `/models` for orchestrator sessions, or set root `model` in config.
- `shell-runner` is host-capable despite `edit:deny` (shell can write). Scope is trust-based.
