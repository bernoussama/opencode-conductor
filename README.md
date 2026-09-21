# opencode-conductor

Conductor-only OpenCode setup: a tool-less primary agent that delegates everything to three subagents.

- `conductor` (primary, `cliproxy/gpt-5.6-sol#high`): sees only `subagent` (+ `question`). No `read/edit/shell` schemas.
- `conductor/explore` (subagent, DeepSeek `#max`): read-only research.
- `conductor/shell-runner` (subagent, DeepSeek `#max`): commands + read. Trusted with host shell.
- `conductor/coder` (subagent, DeepSeek `#max`): write + shell + verify.

Permissions are the security boundary; per-request tool stripping (`context`/`compaction`/`generate` hooks) keeps the conductor's context small.

## Install

The plugin self-installs its agents on first load: `setup()` writes any
missing `.opencode/agents/conductor*.md` files for the current location
(never overwrites) and reloads agents. So installing the package is enough:

```jsonc
{ "plugins": ["@bernoussama/opencode-conductor"] }
```

Disable with `{ "options": { "installAgents": false } }` and manage files by hand:

```sh
# Manual alternative
mkdir -p ~/.config/opencode/agents
cp agents/conductor.md ~/.config/opencode/agents/conductor.md
cp -r agents/conductor ~/.config/opencode/agents/conductor
```

Then `opencode service restart`.

> Note: the plugin also calls `editor.default("conductor")`, but in
> practice the reliable default mechanism is config. Set it explicitly:
>
> ```jsonc
> {
>   "default_agent": "conductor",
>   "model": "cliproxy/gpt-5.6-sol" // root default retains no variant; pick #high via /models
> }
> ```

Project-local alternative: copy `agents/` into `.opencode/agents/` and reference the package from project `opencode.jsonc`.

## Options

```jsonc
{
  "package": "/abs/path/opencode-conductor",
  "options": {
    "conductorModel": "cliproxy/gpt-5.6-sol#high",
    "workerModel": "cliproxy/revcmd/deepseek-v4.1-flash#max",
    "workerFallbackModel": "cliproxy/revcmd/deepseek-v4.1-flash#high",
    "maxVariantSettings": { "reasoningEffort": "max" },
    "enableQuestion": true,
    "setDefault": true
  }
}
```

Precedence is fill-unset: explicit user `agents.*` config always wins over the plugin. Worker agent files default to `cliproxy/revcmd/deepseek-v4.1-flash#max`; the plugin registers that variant via provider transform when the source catalog lacks it, and falls back to `workerFallbackModel` only if registration itself fails.

## Max-thinking workers

Worker agents default to `cliproxy/revcmd/deepseek-v4.1-flash#max`. The proxy
only advertises `low/medium/high`, so `#max` must be declared as a custom
variant in a **project-level** config (it deep-merges correctly there):

```jsonc
// opencode.jsonc (project root — NOT the global file)
{
  "$schema": "https://opencode.ai/config.json",
  "providers": {
    "cliproxy": {
      "models": {
        "revcmd/deepseek-v4.1-flash": {
          "variants": [{ "id": "max", "settings": { "reasoningEffort": "max" } }]
        }
      }
    }
  }
}
```

Do not put this in the global `opencode.json` next to the legacy `provider`
key: `providers` replaces `provider` for the same id within one document and
the proxy entry breaks (likewise, `variants` inside the legacy entry
invalidates the model). If `#max` is unavailable, the plugin falls back to
`workerFallbackModel` (`#high`).

## Notes

- Default-only: `build`/`plan` remain selectable as an escape hatch.
- Sessions store their model separately: after install, pick `cliproxy/gpt-5.6-sol#high` via `/models` for conductor sessions, or set root `model` in config.
- `shell-runner` is host-capable despite `edit:deny` (shell can write). Scope is trust-based.
