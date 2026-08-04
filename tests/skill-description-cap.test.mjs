/**
 * Skill Description Cap Tests
 *
 * Claude Code injects every model-invocable skill's `name` + `description` into
 * context on EVERY turn, capped per skill by `skillListingMaxDescChars`
 * (default 1536). Over the cap the harness keeps `full[:1535]` and appends an
 * ellipsis — it cuts mid-word. Every `"..."` trigger phrase past that point is
 * dead: the skill cannot fire on it, and nothing reports the loss.
 *
 * This test runs the vendored gate (scripts/check_skill_descriptions.py,
 * vendored from wan-huiyan/context-police) over the repo and fails the build if
 * any description is over the cap or has lost a trigger phrase to truncation.
 *
 * NOTE ON SKIPPING: this test deliberately FAILS rather than skips when python3
 * is unavailable. See the "Test-suite gotcha" in SKILL.md Step 2.5 — a
 * graceful-degradation guard produces green tests over a broken repo, which is
 * exactly the failure mode this gate exists to prevent.
 */
import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const GATE = resolve(ROOT, "scripts/check_skill_descriptions.py");

function runGate() {
  for (const bin of ["python3", "python"]) {
    const res = spawnSync(bin, [GATE, ROOT, "--json"], { encoding: "utf-8" });
    if (res.error) continue;
    // exit 2 = bad path / usage error — the gate itself is broken, not the repo
    assert.notEqual(res.status, 2, `gate failed to run: ${res.stderr}`);
    assert.ok(res.stdout, `gate produced no output (stderr: ${res.stderr})`);
    return { data: JSON.parse(res.stdout), status: res.status };
  }
  assert.fail(
    "python3 is required to run the skill-description gate " +
      "(scripts/check_skill_descriptions.py). Install Python 3 and re-run."
  );
}

describe("Skill description cap", () => {
  it("the gate is vendored into scripts/", () => {
    assert.ok(existsSync(GATE), "scripts/check_skill_descriptions.py must exist");
    const src = readFileSync(GATE, "utf-8");
    assert.match(
      src,
      /Vendored from wan-huiyan\/context-police/,
      "vendored gate must keep its upstream provenance note"
    );
  });

  let gate;
  before(() => {
    gate = runGate();
  });

  it("finds at least one model-invocable skill", () => {
    assert.ok(
      gate.data.counts.model_invocable > 0,
      "expected at least one model-invocable SKILL.md in the repo"
    );
  });

  it("no description exceeds the per-skill listing cap", () => {
    const over = gate.data.skills.filter((s) => s.over);
    const detail = over
      .map(
        (s) =>
          `${s.name} (${relative(ROOT, s.path)}): ${s.desc_chars} chars, ` +
          `${s.desc_chars - gate.data.cap} over the ${gate.data.cap}-char cap`
      )
      .join("\n  ");
    assert.equal(
      over.length,
      0,
      over.length
        ? `Descriptions truncated mid-word in the skill listing:\n  ${detail}\n` +
            `Run: python3 scripts/check_skill_descriptions.py . --triggers`
        : ""
    );
  });

  it("no trigger phrase is lost to truncation", () => {
    const lossy = gate.data.skills.filter((s) => s.lost_triggers.length > 0);
    const detail = lossy
      .map((s) => `${s.name}: ${s.lost_triggers.map((t) => `"${t}"`).join(", ")}`)
      .join("\n  ");
    assert.equal(
      lossy.length,
      0,
      lossy.length
        ? `Trigger phrases past the cut are INVISIBLE to the model:\n  ${detail}`
        : ""
    );
  });

  it("the whole listing fits the shared listing budget", () => {
    assert.ok(
      gate.data.within_budget,
      `listing needs ${gate.data.listing_chars} chars but the budget is ` +
        `${gate.data.budget_chars} — some skills will be collapsed to bare names`
    );
  });

  it("gate exits 0 over the repo", () => {
    assert.equal(gate.status, 0, "check_skill_descriptions.py must exit 0");
  });

  it("every description keeps headroom under the cap", () => {
    // A description landing at cap-2 is one edit away from breaking again.
    const MIN_HEADROOM = 20;
    for (const s of gate.data.skills) {
      if (s.disabled) continue;
      const headroom = gate.data.cap - s.desc_chars;
      assert.ok(
        headroom >= MIN_HEADROOM,
        `${s.name}: only ${headroom} chars of headroom under the ` +
          `${gate.data.cap}-char cap (want >= ${MIN_HEADROOM})`
      );
    }
  });
});
