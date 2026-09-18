import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { AGENT_FILES } from "./agents";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("AGENT_FILES", () => {
  test("covers all four managed agents", () => {
    expect(Object.keys(AGENT_FILES).sort()).toEqual([
      "orchestrator.md",
      "orchestrator/coder.md",
      "orchestrator/explore.md",
      "orchestrator/shell-runner.md",
    ]);
  });

  test("embedded contents match the agents/*.md source files", () => {
    for (const [rel, content] of Object.entries(AGENT_FILES)) {
      const onDisk = readFileSync(join(root, "agents", rel), "utf8");
      expect(content).toBe(onDisk);
    }
  });
});
