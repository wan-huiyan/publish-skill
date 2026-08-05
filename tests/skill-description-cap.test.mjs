/**
 * Skill Description Cap Tests
 *
 * Claude Code injects every model-invocable skill's `name` + `description` into
 * context on EVERY turn, capped per skill by `skillListingMaxDescChars`
 * (default 1536). Over the cap the harness keeps `full[:1535]` and appends an
 * ellipsis — it cuts mid-word. Every `"..."` trigger phrase past that point is
 * dead: the skill cannot fire on it, and nothing reports the loss.
 *
 * This test runs the vendored gate (vendored from wan-huiyan/context-police)
 * over the repo and fails the build if any description is over the cap or has
 * lost a trigger phrase to truncation.
 *
 * NOTE ON LOCATION: the gate lives INSIDE the plugin source dir declared by
 * marketplace.json (plugins/publish-skill/scripts/), not at repo-root scripts/.
 * Only the source dir is shipped on `claude plugin install`, and SKILL.md's
 * REQUIRED Description Cap Gate step shells out to it — a repo-root copy is
 * present for CI and absent for every installed user. `ships inside the plugin
 * source dir` below asserts that invariant.
 *
 * NOTE ON SKIPPING: this test deliberately FAILS rather than skips when python3
 * is unavailable. See the "Test-suite gotcha" under SKILL.md's "Verify the
 * layout locally BEFORE pushing" — a
 * graceful-degradation guard produces green tests over a broken repo, which is
 * exactly the failure mode this gate exists to prevent.
 */
import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const MARKETPLACE = JSON.parse(
  readFileSync(resolve(ROOT, ".claude-plugin/marketplace.json"), "utf-8")
);
// marketplace.json declares what actually ships. Derive the gate path from it so
// this test breaks if the gate ever drifts back outside the installed tree.
const PLUGIN_SOURCE = MARKETPLACE.plugins[0].source.replace(/^\.\//, "");
const GATE_REL = `${PLUGIN_SOURCE}/scripts/check_skill_descriptions.py`;
const GATE = resolve(ROOT, GATE_REL);

function runGate() {
  // Check this first: a missing gate makes every spawn below exit 2, and the
  // resulting `before()` failure reports subtests as "cancelled" with no cause.
  assert.ok(
    existsSync(GATE),
    `the gate must exist at ${GATE_REL} — SKILL.md's REQUIRED Description Cap ` +
      `Gate step resolves it as $CLAUDE_PLUGIN_ROOT/scripts/, so a copy outside ` +
      `${PLUGIN_SOURCE}/ is unrunnable for every installed user`
  );
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
      `(${GATE_REL}). Install Python 3 and re-run.`
  );
}

describe("Skill description cap", () => {
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
            `Run: python3 ${GATE_REL} . --triggers`
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

  it("no description is corrupted by a folded-scalar line wrap", () => {
    // `description: |` joins its lines with a SPACE, and textwrap.wrap() breaks on
    // hyphens by default — so a machine re-wrap turns `awesome-list` into
    // `awesome- list` in the injected text. The char count is unchanged, so the cap
    // assertions above cannot see it. Re-wrap with break_on_hyphens=False.
    const corrupt = gate.data.skills.filter((s) => s.wrap_corruption.length > 0);
    const detail = corrupt
      .map((s) => `${s.name}: ${s.wrap_corruption.join(", ")}`)
      .join("\n  ");
    assert.equal(
      corrupt.length,
      0,
      corrupt.length
        ? `Hyphenated tokens split across folded-scalar lines:\n  ${detail}`
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

describe("Description Cap Gate wiring", () => {
  const skill = readFileSync(resolve(ROOT, PLUGIN_SOURCE, "SKILL.md"), "utf-8");

  it("the gate ships inside the plugin source dir declared by marketplace.json", () => {
    assert.ok(
      existsSync(GATE),
      `the gate must exist at ${GATE_REL} — SKILL.md's REQUIRED Description Cap ` +
        `Gate step resolves it as $CLAUDE_PLUGIN_ROOT/scripts/, so a copy outside ` +
        `${PLUGIN_SOURCE}/ is unrunnable for every installed user`
    );
    assert.ok(
      !existsSync(resolve(ROOT, "scripts/check_skill_descriptions.py")),
      "a repo-root scripts/ copy would drift from the shipped one — keep a single copy"
    );
    const src = readFileSync(GATE, "utf-8");
    assert.match(
      src,
      /Vendored from wan-huiyan\/context-police/,
      "vendored gate must keep its upstream provenance note"
    );
  });

  it("the vendored gate matches the upstream revision it was vendored from, byte for byte", () => {
    // WHY A DIGEST AND NOT A FEW GREPS. This assertion used to check that the file
    // contained `find_wrap_corruption(`, `compare_descriptions(` and `MAX_DESC_CHARS - 1)`,
    // and was named "current with upstream, not a stale fork". It was a false negative:
    // the copy vendored at context-police v2.2.0 carried all three substrings AND a
    // find_wrap_corruption() that reported a bogus BROKEN BY LINE-WRAP on every skill
    // written `description: >-`. The test stayed green through the whole drift.
    //
    // WHAT THIS CAN AND CANNOT SEE:
    //   CAN    -- any local edit to the vendored file, and any drift from the pinned revision.
    //   CANNOT -- upstream moving on. CI has no access to the upstream repo. Re-vendoring
    //             stays a deliberate act; this only guarantees that what is here is what
    //             was vendored, and forces the pin to be updated when it changes.
    const UPSTREAM_SHA256 =
      "f210ccd2feb4a3f76289e078bdc5621919ca657026f3d86cc5d7cb1201985fb0";
    const OPEN =
      "--8<-- vendoring note (local addition; stripped before the parity hash) --8<--\n";
    const CLOSE = "--8<-- end vendoring note --8<--\n\n";

    const local = readFileSync(GATE, "utf-8");
    const start = local.indexOf(OPEN);
    assert.notEqual(start, -1, "vendoring note opening marker is missing from the gate");
    const end = local.indexOf(CLOSE, start);
    assert.notEqual(end, -1, "vendoring note closing marker is missing from the gate");

    const stripped = local.slice(0, start) + local.slice(end + CLOSE.length);
    const digest = createHash("sha256").update(stripped, "utf8").digest("hex");

    assert.equal(
      digest,
      UPSTREAM_SHA256,
      "the vendored gate no longer matches its pinned upstream revision " +
        "(context-police@eedad0f, version 2.2.1). Do not patch it here: fix it upstream, " +
        "re-vendor, and update UPSTREAM_SHA256 plus the commit reference in the vendoring note."
    );
  });

  it("the coverage harness ships next to the gate, so quoted numbers are re-runnable", () => {
    // A coverage figure in a PR body that a reviewer cannot reproduce is not evidence.
    const scorerRel = `${PLUGIN_SOURCE}/scripts/score_trigger_coverage.py`;
    const scorer = resolve(ROOT, scorerRel);
    assert.ok(
      existsSync(scorer),
      `${scorerRel} must ship with the plugin — the Description Cap Gate step tells ` +
        `the agent to run it, so it has to be inside the marketplace source path`
    );
    assert.match(
      readFileSync(scorer, "utf-8"),
      /Adapted from wan-huiyan\/agent-review-panel/,
      "vendored scorer must keep its upstream provenance note"
    );
  });

  it("SKILL.md resolves the gate through CLAUDE_PLUGIN_ROOT, not repo-root scripts/", () => {
    assert.match(
      skill,
      /\$CLAUDE_PLUGIN_ROOT\/scripts\/check_skill_descriptions\.py/,
      "the REQUIRED gate step must resolve the gate inside the installed plugin"
    );
    assert.doesNotMatch(
      skill,
      /python3 scripts\/check_skill_descriptions\.py/,
      "repo-root scripts/ is not shipped — that command is unrunnable once installed"
    );
  });

  it("the CI gate step points at the same path the test does", () => {
    const wf = readFileSync(resolve(ROOT, ".github/workflows/test.yml"), "utf-8");
    assert.ok(
      wf.includes(`python3 ${GATE_REL} . --no-color --triggers`),
      `CI must run the gate at ${GATE_REL}; a stale path makes CI green over a missing gate`
    );
  });

  it("no stage anywhere in the file is decimal-numbered", () => {
    // SKILL.md's own "Phase Numbering" guidance forbids decimal sub-phases (1.5, 3.5).
    // Scoped to the whole file, not just the gate stage: a skill that tells other
    // authors to avoid decimal sub-phases has to hold itself to it. Letter suffixes
    // (Step 5b, Step 8a) are the sanctioned form and are unaffected.
    const decimals = skill.match(/Step \d+\.\d+/g) ?? [];
    assert.deepEqual(
      decimals,
      [],
      `decimal sub-phases contradict this file's own Phase Numbering rule: ` +
        `${[...new Set(decimals)].join(", ")}`
    );
    assert.match(
      skill,
      /^## Description Cap Gate \(REQUIRED\)$/m,
      "expected the named `## Description Cap Gate (REQUIRED)` stage heading"
    );
  });

  it("Step 5c propagates the gate to every repo this skill publishes", () => {
    const step5c = skill.slice(
      skill.indexOf("## Step 5c:"),
      skill.indexOf("## Step 6:")
    );
    assert.ok(step5c.length > 0, "Step 5c section not found");
    for (const needle of [
      "tests/skill-description-cap.test.mjs",
      "check_skill_descriptions.py",
      "actions/setup-python",
    ]) {
      assert.ok(
        step5c.includes(needle),
        `Step 5c must generate ${needle} — otherwise published skills inherit no gate`
      );
    }
  });

  it("Dependencies declares python3 for the REQUIRED gate", () => {
    const deps = skill.slice(
      skill.indexOf("### Dependencies"),
      skill.indexOf("### Error Handling")
    );
    assert.ok(deps.length > 0, "Dependencies section not found");
    assert.match(
      deps,
      /python3/,
      "python3 is required by the Description Cap Gate and must be declared"
    );
  });
});
