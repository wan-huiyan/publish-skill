---
name: publish-skill
version: 2.1.0
description: |
  Publish a Claude Code skill to GitHub as a polished, adoptable open-source repo, AND
  diagnose `claude plugin install` failures on a published skill. Use when the user says
  "publish this skill", "put this on GitHub", "share this skill", "release this skill publicly",
  "open source my skill", "make this skill installable", "create a GitHub repo for my skill",
  "package this skill for the marketplace", or wants to update an existing published skill
  repo. Also trigger when the user says "submit to awesome-claude-skills", "add my skill to
  the awesome list", "how do I let others install my skill?", "I finished my skill, now what?",
  "push my skill to a public repo", "generate a README and publish", "bump the version and
  republish", or "turn my local skill into a polished repo".
  ALSO trigger on `claude plugin install` failures and diagnostic questions: `Plugin X not
  found in any configured marketplace`, `Plugin X not found in marketplace Y`, `Invalid
  schema: plugins.0.source: Invalid input`, `Failed to add marketplace: Failed to parse
  marketplace file`, "my plugin install is failing", "why can't I install my own skill?",
  "claude plugin marketplace add is silently failing", "plugin not found in marketplace",
  "marketplace add appears to work but install fails", "debug plugin install", "wrong
  marketplace.json path", "wrong plugin source field". The Common failure modes section
  (Step 2.5) documents the three bug layers (deprecated command, wrong manifest path, wrong
  source path) with symptoms, diagnoses, and fixes that apply to BOTH new publishes and
  already-published broken skills.
  Covers: canonical `plugins/<name>/` subdirectory layout (v2.0.0+), `.claude-plugin/marketplace.json`
  packaging, README generation with demo screenshots via puppeteer, multi-agent review panel
  for README quality, research verification of thresholds/claims, visual distinction of
  grounded vs heuristic thresholds, GitHub repo metadata (description, topics), PR submission
  to awesome-claude-skills, PDF output for HTML-generating skills, and end-to-end install
  flow verification before publishing.
  Do NOT use for creating new skills from scratch (use skill-creator instead), improving
  skill trigger accuracy or quality (use schliff instead), general code deployment,
  writing READMEs for non-skill projects, or non-skill package management.
---

# Publish Skill to GitHub

Turn a local Claude Code skill into a polished, adoptable open-source GitHub repo.

## When to Use

- User says "publish this skill", "share this skill", "put this on GitHub"
- User wants to update an already-published skill repo
- User asks to submit a skill to awesome-claude-skills or a marketplace

## Companion Skills (optional, recommended)

These skills automate the hardest parts of safe publishing. If installed, they'll
be invoked automatically at the relevant steps:

- **[skill-anonymizer](https://github.com/wan-huiyan/skill-anonymizer)** — Automates Step 0 (client data audit). Three-category scan + git history cleaning.
  `git clone https://github.com/wan-huiyan/skill-anonymizer.git ~/.claude/skills/skill-anonymizer`
- **[data-provenance-verifier](https://github.com/wan-huiyan/data-provenance-verifier)** — Automates data file verification for skills that ship with datasets.
  `git clone https://github.com/wan-huiyan/data-provenance-verifier.git ~/.claude/skills/data-provenance-verifier`
- **repo-hygiene** — Pre-publish cleanup checklist (stale files, secrets, .gitignore, __pycache__). Run before Step 1.
- **schliff** — Score skill quality on 7 dimensions (triggers, examples, structure) before investing in packaging. Run before Step 0.
- **agent-review-panel** — Multi-agent adversarial review for README quality. Already used in Step 6.
- **skill-sync** — Ongoing sync of published skills with their GitHub repos. Run `/skill-sync init` after publishing to register the new skill for future updates.

## Step 0: Client Data Audit (CRITICAL — do this FIRST)

If `skill-anonymizer` is installed, run `/skill-anonymizer` first — it automates this step.

Scan for client-identifying data before publishing. Combination risk: even innocuous details (campaign type + currency + dates + industry) can identify a client when combined.

**Scan targets:** SKILL.md, README.md, demo screenshots/HTML, marketplace.json (no employer email), supporting files (references/, docs/, examples/).

**Sanitization checklist:**
- [ ] Replace client/institution names with generic labels
- [ ] Change specific amounts to synthetic numbers AND switch currency
- [ ] Replace employer email with personal email or remove
- [ ] Regenerate screenshots from sanitized HTML source
- [ ] Clean git history via orphan branch + force-push (old commits expose prior versions)
- [ ] Add disclaimer: "All examples use synthetic data"
- [ ] Check demo screenshots for identifiable field names
- [ ] Verify demo scenario is domain-distant from real client work

**Demo domain selection:** Use common domains (e-commerce, churn, retail, SaaS) or public datasets (NYC taxi, MovieLens). Avoid niche verticals where your team has few clients. Even sanitized data in the same domain as client work raises questions.

## Step 1: Locate the Skill

Find the SKILL.md to publish:
```
~/.claude/skills/{skill-name}/SKILL.md
```

Read the frontmatter to extract: name, description, version, author.

## Step 2: Create Repo Structure

**⚠️ BREAKING CHANGE IN v2.0.0:** The canonical Claude Code plugin layout places
`marketplace.json` INSIDE `.claude-plugin/` (not at repo root) and each plugin lives
in its own `plugins/<name>/` subdirectory. Skills published with the v1.x layout
will fail the `claude plugin install` flow with `Invalid schema: plugins.0.source:
Invalid input`. See "Common failure modes" section at the end of this skill for
details. Mirror the layout of [claude-plugins-official](https://github.com/anthropics/claude-plugins-official)
and [voltagent-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents) —
they are the canonical reference implementations.

```
skill-name/                          # ← repo root (becomes the marketplace)
├── .claude-plugin/
│   └── marketplace.json            # ← MUST be inside .claude-plugin/ (NOT at repo root)
├── plugins/
│   └── skill-name/                 # ← each plugin in its own subdirectory
│       ├── .claude-plugin/
│       │   └── plugin.json         # ← plugin manifest INSIDE plugins/<name>/.claude-plugin/
│       ├── SKILL.md                # ← canonical plugin skill location
│       ├── hooks/                  # ← plugin-specific hooks (if applicable)
│       │   └── {hook-name}.sh
│       └── references/             # ← files referenced by SKILL.md
├── docs/                           # ← repo-level (screenshots, case studies)
│   ├── demo-{name}.html
│   └── demo-{name}.png
├── tests/                          # ← repo-level (manifest consistency, etc.)
├── README.md                       # ← repo-level (GitHub browsers see this)
├── LICENSE                         # ← MIT (see "Why MIT" below)
└── package.json                    # ← optional, for npm-based tests
```

**Why MIT?** Standard for Claude Code skills (~44% of GitHub). Apache 2.0 if patent protection matters; avoid GPL.

**Key rules** (verified against the Claude Code docs at
https://code.claude.com/docs/en/plugin-marketplaces):

1. `marketplace.json` lives at `.claude-plugin/marketplace.json`, NOT at the repo root.
   The old v1.x layout (marketplace.json at root) silently fails `claude plugin marketplace add` —
   the marketplace never registers in `~/.claude/plugins/known_marketplaces.json` and the
   subsequent error message is misleading.
2. Each plugin lives in `plugins/<plugin-name>/`, never at the marketplace root. Claude Code
   copies the plugin directory into a cache on install — if the plugin were the marketplace
   directory, this would be recursive self-reference, and the schema validator rejects it.
3. `plugins[0].source` in marketplace.json must start with `./` AND point to a subdirectory.
   Valid: `"./plugins/skill-name"`. Invalid: `"."` or `"./"` (rejected by schema validator).
4. The plugin's manifest lives at `plugins/<plugin-name>/.claude-plugin/plugin.json`, NOT at
   the repo root.
5. SKILL.md lives at `plugins/<plugin-name>/SKILL.md` (the canonical skill location).
   Do NOT keep a second SKILL.md at the repo root — if the two fall out of sync, only the
   nested one is loaded when users install via `claude plugin install`, and the root copy
   becomes stale and misleading.

**Why MIT?** Standard for Claude Code skills (~44% of GitHub). Apache 2.0 if patent protection matters; avoid GPL.

**plugin.json template** (place at `plugins/{skill-name}/.claude-plugin/plugin.json`):
```json
{
  "name": "{skill-name}",
  "description": "{from SKILL.md frontmatter}",
  "version": "{version}",
  "author": { "name": "{user's name}" },
  "repository": "https://github.com/{username}/{skill-name}",
  "license": "MIT",
  "keywords": ["{domain-tags}"]
}
```

**marketplace.json template** (place at `.claude-plugin/marketplace.json` — NOT the repo root):
```json
{
  "$schema": "https://anthropic.com/claude-code/marketplace.schema.json",
  "name": "{username}-{skill-name}",
  "description": "{one-line marketplace description — required by validators}",
  "owner": { "name": "{user's name}" },
  "plugins": [{
    "name": "{skill-name}",
    "source": "./plugins/{skill-name}",
    "description": "{one-line plugin description}",
    "version": "{version}"
  }]
}
```

**CRITICAL — distinguishing names:**

- **Plugin name** (`plugins[0].name`): what users type in the install command, e.g. `skill-name`.
  Must match the `name` field in `plugin.json`.
- **Marketplace name** (top-level `name`): the marketplace identifier, e.g. `{username}-{skill-name}`.
  Can be owner-prefixed to avoid collisions across users publishing plugins with the same name.
- Users install with: `/plugin install {skill-name}@{username}-{skill-name}` — note the `@` separator.

The two names are DIFFERENT. A common mistake is to make them identical or to assume the
install command takes just the marketplace name — both fail.

### Step 2.5: Verify the layout locally BEFORE pushing

After creating the files, verify the install flow works locally before publishing. This
catches all three layout bugs that cost 4+ PRs to debug in the wild:

```bash
# 1. Verify marketplace.json is in .claude-plugin/ (NOT repo root)
test -f .claude-plugin/marketplace.json && echo "✓ marketplace.json in right place" || echo "✗ WRONG PATH"

# 2. Verify plugin.json is inside plugins/<name>/.claude-plugin/
test -f plugins/{skill-name}/.claude-plugin/plugin.json && echo "✓ plugin.json in right place" || echo "✗ WRONG PATH"

# 3. Verify source path in marketplace.json starts with ./plugins/
grep '"source"' .claude-plugin/marketplace.json  # should show "./plugins/{skill-name}", never "." or "./"

# 4. Locally test the marketplace add (requires a committed working tree on a local path)
claude plugin marketplace add ./

# 5. Verify it actually registered
cat ~/.claude/plugins/known_marketplaces.json | grep {marketplace-name}
# If nothing appears, the marketplace add silently failed — the layout is wrong

# 6. Clean up the local test marketplace before pushing
claude plugin marketplace remove {marketplace-name}
```

Alternatively, validate via the built-in CLI (faster, no side effects):

```bash
claude plugin validate .
# or inside a Claude Code session:
# /plugin validate .
```

Do NOT skip this step. The three layout bugs below all pass git/GitHub syntactically but
fail Claude Code's schema validator or silently mis-register the marketplace.

### Common failure modes (learned the hard way)

These are the three bug layers that v1.x of this skill produced. If you follow the v2.0.0
layout above, you will avoid all of them. If you inherit a v1.x skill repo, expect to hit
them in sequence.

**Layer 1: Deprecated install command in README** — v1.x READMEs sometimes showed
`claude skill install <owner/repo>`. This command DOES NOT EXIST; the deprecated form was
`claude install skill` which was removed. Users get "command not found" or confusing errors.
Fix: always use the two-step flow `claude plugin marketplace add <owner/repo>` then
`claude plugin install <plugin-name>@<marketplace-name>`.

**Layer 2: marketplace.json at the wrong path** — v1.x placed `marketplace.json` at the
repo root. Claude Code looks for it at `.claude-plugin/marketplace.json`. When the file is
missing at the expected path, `claude plugin marketplace add` **silently fails** to register
the marketplace — it doesn't error, it just doesn't write to
`~/.claude/plugins/known_marketplaces.json`. The subsequent `plugin install` then reports a
misleading error: `Plugin "X" not found in marketplace "Y"` (implying the plugin is missing,
when the marketplace was never registered). Always verify via `cat ~/.claude/plugins/known_marketplaces.json`
after running marketplace add — if your marketplace name isn't there, the path is wrong.

**Layer 3: Plugin at the marketplace root** — v1.x used `"source": "."` or
`"source": "./"` in `marketplace.json`, trying to make the repo root itself the plugin.
Claude Code's schema validator rejects both with `Invalid schema: plugins.0.source: Invalid input`.
Reason: Claude Code copies the plugin directory into a cache on install, so the plugin
cannot BE the marketplace directory (self-reference). The docs explicitly state: "Local
directory within the marketplace repo. Must start with `./`" — meaning a subdirectory,
not the current directory. Always use `"source": "./plugins/<plugin-name>"`.

**Test-suite gotcha:** If you use the `tests/manifest-consistency.test.mjs` pattern common
in skill repos, check that it uses an ASSERTIVE check (`assert.ok(existsSync(path))`) rather
than a GRACEFUL-DEGRADATION guard (`if (existsSync(path)) describe(...)`). The graceful form
silently skips all marketplace.json assertions when the file is missing, producing green tests
despite a broken repo. This masks the Layer 2 bug indefinitely.

**Additional test-writing rule:** NEVER assert `marketplaceJson.name === pluginJson.name`.
The marketplace name is owner-prefixed (e.g., `wan-huiyan-causal-impact-campaign`) while the
plugin name is unprefixed (e.g., `causal-impact-campaign`). The real invariant to check is
`marketplaceJson.plugins[0].name === pluginJson.name` — that's what users type in the
install command after the `@`.

## Step 3: Write the README

Follow this structure (order matters for first-time visitor conversion):

1. **Title + one-line descriptor** — what it IS, factual. Not a scenario.
1b. **Badge row** — immediately after the title. Provides at-a-glance trust signals.

   **Prefer dynamic badges** (auto-update from GitHub API) over static ones:

   ```markdown
   [![GitHub release](https://img.shields.io/github/v/release/{USERNAME}/{SKILL_NAME})]({REPO_URL}/releases)
   [![license](https://img.shields.io/github/license/{USERNAME}/{SKILL_NAME})](LICENSE)
   [![last commit](https://img.shields.io/github/last-commit/{USERNAME}/{SKILL_NAME})]({REPO_URL}/commits)
   [![python](https://img.shields.io/badge/python-{PY_VERSIONS}-yellow)](https://www.python.org/)
   [![Claude Code](https://img.shields.io/badge/Claude_Code-skill-orange)](https://claude.com/claude-code)
   ```

   **Dynamic badges** (no manual updates needed):
   - `github/v/release` — reads from GitHub Releases (create a release first!)
   - `github/license` — reads from repo metadata
   - `github/last-commit` — shows repo activity (signals maintenance)

   **Static badges** (update manually or via skill-sync):
   - `badge/python-{PY_VERSIONS}-yellow` — no GitHub API source
   - `badge/Claude_Code-skill-orange` — constant marker
   - `badge/eval_assertions-{N}_passed-brightgreen` — if eval-suite.json exists
   - `badge/grounded_in-{N}%2B_papers-blueviolet` — if references/ with bibliography

   **Important:** Dynamic version badge requires a GitHub Release. Create one:
   ```bash
   gh release create v{VERSION} --title "v{VERSION}" --notes "Release notes"
   ```

   **Where to get values:**
   - `{USERNAME}/{SKILL_NAME}`: GitHub owner/repo (e.g., `wan-huiyan/causal-impact-campaign`)
   - `{PY_VERSIONS}`: from SKILL.md description or requirements (e.g., "3.9--3.12")
   - `{N}` assertions: count entries in eval-suite.json `assertions` array
   - `{N}` papers: count entries in references/bibliography.md

2. **Screenshot** (if visual output) — above the fold. This is the #1 adoption driver.
3. **Quick Start** — conversation example showing usage flow
4. **Installation** — Claude Code + Cursor:

   **Claude Code:**
   ```bash
   # Plugin install (recommended — requires plugin packaging)
   /plugin marketplace add {username}/{skill-name}
   /plugin install {skill-name}@{username}-{skill-name}

   # Git clone (always works)
   git clone https://github.com/{username}/{skill-name}.git ~/.claude/skills/{skill-name}
   ```

   **Cursor** (Cursor 2.4+, global discovery can be flaky):
   ```bash
   # Per-project rule (most reliable)
   mkdir -p .cursor/rules
   # Create .cursor/rules/{skill-name}.mdc with SKILL.md content + alwaysApply: true

   # npx skills CLI
   npx skills add {username}/{skill-name} --global

   # Manual global install
   git clone https://github.com/{username}/{skill-name}.git ~/.cursor/skills/{skill-name}
   ```

   **IMPORTANT:** `claude install-skill` is NOT a real command. Never use it in READMEs.
   The correct plugin install command is: `claude plugin install <plugin-name>`
   For git-based installs: `git clone https://github.com/{username}/{skill-name}.git ~/.claude/skills/{skill-name}`
5. **Suggested Hook** (if applicable) — skills that benefit from automatic triggering should
   include a ready-to-use hook config. See "Bundling Hooks with Skills" below.
6. **What You Get** — concrete, tangible outputs
7. **Comparison table** — "Typical Ad-Hoc vs With Skill" (realistic baseline, not strawman)
8. **How It Works** — step table
9. **Key Design Decisions** — the non-obvious architectural choices
10. **Limitations** — what it does NOT do. Builds trust with technical audiences.
11. **Dependencies** — required vs optional. Explain what happens *without* each.
12. **Quality Checklist** in `<details>` — what the skill guarantees
13. **Related Skills** — cross-link companion skills with hyperlinks
14. **Research/References** in `<details>` — citations with hyperlinks, if applicable
15. **Version History** — even 3 lines. Trust signal that it's maintained.
16. **License** — MIT

### README Anti-Patterns (from review panels)

- No screenshot for a visual-output skill — "disqualifying" per Devil's Advocate
- Domain-specific examples that confuse general audiences (use SaaS churn, e-commerce)
- Thresholds presented as universal truths without provenance
- "Without" column that strawmans incompetence ("you'd just eyeball it")
- Missing limitations section — every serious tool documents what it can't do
- Installation buried below 5 sections of detail
- "Refuses to proceed" language — sounds adversarial. Use "asks" instead.
- Removed Quality Checklist — it was the only place answering "what does this guarantee?"
- No Version History — signals abandoned/untested tool
- **Pitfalls section too narrow/implementation-focused** — leading with XGBoost `.fillna(0)` tips when the skill's real value is "safe training window extension" makes it look like a niche tool. Visitors scan pitfalls to decide "is this for me?" — implementation details don't answer that question.

### Pitfalls / "What This Catches" Section

Structure pitfalls in two tiers:
- **Tier 1: Strategic pitfalls** (lead) — broad problems that cost weeks, model-agnostic. Answer "do I need this?"
- **Tier 2: Implementation pitfalls** (follow) — code-level traps, framework-specific. Answer "is this thorough?"

Apply this strategic-first ordering to ALL list/table sections (pitfalls, "what worked", "key lessons", "what you get"). If the README already has strong narrative sections, keep them but add a scannable "What This Catches" list as a quick entry point.

### Narrative Sections ("Journey", "Case Study")

Frame narratives as methodology, not anecdote. The intro must show the story illustrates the skill's *systematic process*, not one lucky outcome. Bad: "we achieved X." Good: "Every analysis follows this pattern — here's one run."

### Decision Criteria Tables with Provenance

If the skill uses numeric thresholds, visually distinguish grounded vs heuristic:

```markdown
Thresholds in **bold** are grounded in published sources.
Thresholds in *italic* are practitioner heuristics — adjust for your domain.

| Criterion | Threshold | Source |
|-----------|-----------|--------|
| Gain ratio | **Rank-based** | [Quinlan (1993)](link) |
| Coverage gaps | *>20%* | Heuristic |
```

### Bundling Hooks with Skills

Some skills benefit from automatic triggering via Claude Code hooks. If your skill can
enhance existing workflows without user invocation (e.g., post-commit checks, post-write
formatting, pre-tool validation), include a suggested hook configuration.

**When to include a hook:**

| Skill type | Hook event | Example |
|---|---|---|
| Git workflow tools | `PostToolUse` on `Bash` (filter for `git commit`) | Squash hint after trivial commits |
| Code quality tools | `PostToolUse` on `Write\|Edit` | Auto-lint, type-check, or validate |
| Safety/audit tools | `PreToolUse` on `Bash` | Block dangerous commands |
| Session lifecycle | `Stop` or `SessionStart` | Save learnings, load context |

**What to include in the published skill:**

1. **A `hooks/` directory** with the ready-to-use script(s). Users copy to `~/.claude/hooks/`.
2. **A "Suggested Hook" section in SKILL.md** with:
   - The `settings.json` snippet (hook config JSON)
   - Explanation of what it does and when it fires
   - Merge note: "If you already have PostToolUse hooks, add to the existing array"
3. **A brief mention in README** (between Installation and What You Get) with an example
   of what the hook output looks like, linking to SKILL.md for the full setup.

**Hook design principles:**

- **Passive, not active.** Hooks should suggest, not act. A squash hint is fine; auto-squashing
  without confirmation is dangerous.
- **Fast.** Hooks run on every matching tool call. Keep them under 5 seconds (set `timeout: 5`).
- **Silent on non-match.** If the hook doesn't apply (e.g., the Bash command wasn't `git commit`),
  exit immediately with no output. Don't print "no action needed."
- **Use `hookSpecificOutput.additionalContext`** to inject suggestions into the conversation
  (the model sees it). Use `systemMessage` for user-visible warnings.
- **Merge-friendly.** Document that users should add your hook entry to existing arrays,
  not replace them. Show the minimal JSON snippet, not a full settings.json.

**Example from git-squash skill:**

```json
// In settings.json — PostToolUse array
{
  "matcher": "Bash",
  "hooks": [{
    "type": "command",
    "command": "~/.claude/hooks/squash-hint.sh",
    "timeout": 5,
    "statusMessage": "Checking commit..."
  }]
}
```

The hook script checks if the command was `git commit`, scores the last commit on message/diff/timing
heuristics, and injects a `/squash` suggestion if the score is 60+.

## Step 4: Generate Demo Screenshots

For skills that produce visual output (HTML slides, diagnostics, reports):

1. Create demo HTML at `docs/demo-{name}.html` using a **generic use case**
   (SaaS churn, e-commerce conversion — NOT university enrollment, specific client names)
2. Install puppeteer and screenshot:
```bash
cd /tmp/{repo} && npm install puppeteer
```
```javascript
const puppeteer = require('puppeteer');
const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 900, height: 1200, deviceScaleFactor: 2 });
await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 2000)); // wait for fonts

const element = await page.$('.panel'); // or '.slide', '.section'
const box = await element.boundingBox();
await page.screenshot({
  path: 'docs/demo-screenshot.png',
  clip: { x: box.x - 20, y: box.y - 10, width: box.width + 40, height: box.height + 20 },
});
```
3. **Multi-section screenshots** — for skills with rich, sectioned output (conference notes,
   dashboards, multi-step reports), capture 2–4 focused screenshots of different sections rather
   than a single hero image. This lets viewers see the variety of output without scrolling through
   a massive single screenshot. Example sections: header+themes, session detail with research panel,
   prioritised next steps. Name them `demo-header.png`, `demo-session.png`, `demo-actions.png` etc.
   Use element-targeted clips (`page.$('#section-id').boundingBox()`) for each.
4. Clean up `node_modules/`, `package.json`, `package-lock.json` before committing

## Step 5: Verify Claims and Thresholds

If the skill uses numeric thresholds or cites academic papers, run parallel
research agents to verify each claim:

```
Launch 1 agent per threshold/claim in parallel. Each agent searches for:
- Does the cited paper actually specify this threshold?
- Is this a ranking metric used with a fixed cutoff (likely wrong)?
- What do popular implementations use as defaults?
```

**Common findings (from verifying ML thresholds across 5 skills):**

| Threshold | Verdict | What to do instead |
|-----------|---------|-------------------|
| Gain ratio >0.3 | **Invented.** Quinlan uses ranking only. | Rank-based: above-average info gain filter |
| AUC >0.005 | **Invented.** No paper defines this. | DeLong test p<0.05 (DeLong 1988) |
| Conditional MI >50% | **Invented.** Brown et al. uses ranking. | Rank-based: JMI/CMIM scoring |
| PSI <0.10/0.25 | **Industry convention.** Siddiqi 2006. | Keep but note sample-size dependent (Yurdakul 2018) |
| Population >200 | **Misattributed.** Van der Ploeg = 200 EPV. | 20-300 range (LightGBM docs) |

**Rule:** Label honestly. Bold for published, italic for heuristic.

If the skill ships with data files (CSV, JSON, examples/), run `data-provenance-verifier`
to ensure all data is genuine and has provenance documentation before publishing.

## Step 5b: Portability Check (Skills Built from Project Work)

For each piece of guidance, ask: "Would this apply with a different database/language/framework?" If not, abstract further.

**Checklist:**
- [ ] No vendor-specific table/column names (unless skill is explicitly vendor-scoped)
- [ ] Patterns described by what they solve, not the specific tool
- [ ] Specific technology references include the general pattern for other stacks

## Step 5c: Generate Tests and CI

Generate an automated test suite from the skill's eval-suite.json and manifest files.
This catches version mismatches, invalid regex patterns, duplicate IDs, and structural
issues before they reach users. Tests run on every push via GitHub Actions.

**Generated files:**
- `tests/manifest-consistency.test.mjs` — cross-validates plugin.json, SKILL.md, eval-suite versions/names
- `tests/eval-suite-integrity.test.mjs` — validates structure, regex compilation, ID uniqueness, trigger balance
- `tests/trigger-classification.test.mjs` — validates trigger entries and skill name references
- `.github/workflows/test.yml` — CI pipeline (Node.js 20+22 matrix)
- `package.json` (if not present) — minimal, with `"test": "node --test tests/*.test.mjs"`

**Templates location:** `~/Documents/skill-test-templates/` (generalized from agent-review-panel's 363-test suite)

**Process:**
1. Copy the 3 test templates from `~/Documents/skill-test-templates/` into the repo's `tests/` directory
2. Copy `test.yml` into `.github/workflows/`
3. Generate `package.json` if missing (parameterized from plugin.json name/version/description)
4. Run `npm test` to verify all tests pass
5. If tests fail, fix the underlying issues (version mismatches, invalid regexes, duplicate IDs) before proceeding

**Or use the backfill script:** `~/Documents/skill-test-templates/backfill.sh /path/to/repo`

**Skills WITHOUT eval-suite.json:** Only manifest-consistency tests are generated. eval-suite and trigger tests skip gracefully.

After generating, add a Tests badge to the README:
```markdown
[![Tests](https://github.com/{owner}/{repo}/actions/workflows/test.yml/badge.svg)](https://github.com/{owner}/{repo}/actions/workflows/test.yml)
```

**⚠️ Critical test-writing rule:** When generating `manifest-consistency.test.mjs`, use
**assertive** existence checks for required manifests, not graceful-degradation guards.
```js
// BAD — silently skips all assertions if marketplace.json is at the wrong path
if (existsSync(marketplaceJsonPath)) {
  describe("marketplace.json", () => { /* ... */ });
}

// GOOD — fails loudly if the file is missing or at the wrong path
assert.ok(
  existsSync(marketplaceJsonPath),
  `marketplace.json must exist at .claude-plugin/marketplace.json`
);
```
The graceful form masks the Layer 2 bug described in Step 2.5 — 160 tests pass green while
the repo is actually broken for `claude plugin install`. Similarly, NEVER assert
`marketplace.name === plugin.name` — those are different by convention (marketplace is
owner-prefixed). The real invariant is `marketplace.plugins[0].name === plugin.name`.

## Step 6: Review Panel for README (Recommended)

Run `/agent-review-panel` on the README before publishing:

```
Review the README at {path}. Evaluate whether it would attract a first-time
visitor to install this Claude Code skill. Use 3 reviewers
(Clarity Editor, Completeness Checker, Devil's Advocate).
```

Common panel findings across 5 repo reviews:
- Missing demo screenshot (#1 issue for visual tools)
- Threshold inconsistency between README and SKILL.md
- Overclaiming in comparison tables
- Missing limitations section
- Quality Checklist removed (it was the quality contract)
- Opening hook excludes non-target audiences

## Step 6b: Verify All Links (REQUIRED)

Before pushing, verify every link in the README actually works and points to the
correct source. This catches two common problems:

**1. Broken links (404s):** Schliff, Claudeception, and other tools get forked and
moved. The repo you linked last month may not exist today.

```bash
# Extract all GitHub repo links and check each one
grep -oP 'https://github\.com/[a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+' README.md | sort -u | while read url; do
  repo=$(echo "$url" | sed 's|https://github.com/||')
  if gh api "repos/$repo" --jq .full_name 2>/dev/null > /dev/null; then
    echo "OK: $url"
  else
    echo "BROKEN: $url"
  fi
done
```

**2. Wrong attribution (fork instead of upstream):** When you install a skill from
someone else's repo, your README should link to the ORIGINAL author's repo, not your
own fork. Common mistakes:
- `brainstorming` / `using-superpowers` → should link to `obra/superpowers`, not your fork
- `schliff` → should link to `Zandereins/schliff`, not any fork
- `claudeception` → built-in skill, no separate repo (don't link to a random repo)

**Rule of thumb:** If you didn't write the skill, link to the upstream repo. Check
with `gh api repos/OWNER/REPO --jq .fork` — if it returns `true`, find the parent.

## Step 7: Create GitHub Repo and Push

```bash
gh repo create {username}/{skill-name} --public \
  --description "{one-line}" --source . --push
```

Set default branch to `main` if created as `master`:
```bash
gh api repos/{username}/{skill-name} -X PATCH -f default_branch=main
git branch -m master main && git push origin main
git push origin --delete master
```

Set topics:
```bash
gh api repos/{username}/{skill-name}/topics -X PUT --input - <<'EOF'
{"names":["claude-code","claude-code-skill","{domain-1}","{domain-2}"]}
EOF
```

**Fork contributions:** `gh repo edit` and the topics API require admin/owner access.
If you're contributing via a fork PR (not the repo owner), you cannot set topics programmatically.
Instead, include a "Suggested repo settings" section in the PR description listing recommended
topics for the owner to add manually.

## Step 8: Submit to awesome-claude-skills (Optional)

### 8a: Choose the Right Category

The repo uses these categories (from CONTRIBUTING.md):
- **Business & Marketing** — lead generation, competitive research, branding
- **Communication & Writing** — content creation, conversation analysis
- **Creative & Media** — images, video, audio, creative content
- **Development & Code Tools** — software dev, documentation, technical workflows
- **Data & Analysis** — data processing, ML, research, databases
- **Productivity & Organization** — file management, task management

Add your entry **in alphabetical order** within the chosen category.

### 8b: Write the Awesome-List Entry

**Format (strict):**
```markdown
- [Skill Name](https://github.com/{username}/{skill-name}) - One-sentence description. *By [@username](https://github.com/{username})*
```

**Format rules:**
- No emojis
- Consistent punctuation (period at end of description)
- Alphabetical order within category

**Description length: aim for ~130 characters** (the norm across the repo). Descriptions
over ~150 chars will likely be flagged by reviewers.

**What to INCLUDE in the description:**
- What the skill does for the user (the core value proposition)
- The distinctive approach if it's not obvious from the name

**What to DROP from the description** (move to your repo's README instead):
- Paper/research references (e.g., "Based on ChatEval, AutoGen, DebateLLM")
- Specific counts/lists (e.g., "17-strategy taxonomy, 39-issue registry")
- Implementation details (e.g., "entropy/gain ratio, conditional MI, incremental CV AUC")
- Step counts only if they don't add clarity (e.g., "10-step diagnostic" IS useful, "covers Q1-Q8" is NOT)

**Rule of thumb:** Drop paper references, specific counts, and implementation details from the description. Keep the core value proposition.

### 8c: Create the PR

```bash
# Clone your fork (or create one)
gh repo fork ComposioHQ/awesome-claude-skills --clone
cd awesome-claude-skills
git checkout -b add-{skill-name}

# Add entry to README.md in the appropriate category, alphabetical order
git add README.md && git commit -m "Add {skill-name} skill"
```

**PR title:** "Add {skill-name} skill" (or "Add {skill-1} and {skill-2} skills" for multiple)

**PR description** (from CONTRIBUTING.md — reviewers expect these):
```bash
gh pr create --title "Add {skill-name} skill" --body "$(cat <<'EOF'
## What problem it solves
{One paragraph on the real-world use case}

## Who uses this workflow
{Target audience — ML engineers, data scientists, etc.}

## Example usage
{Brief conversation example or trigger phrase}

## Links
- Repo: https://github.com/{username}/{skill-name}
- License: MIT
EOF
)"
```

### 8d: Responding to Reviews

Reviewers commonly flag:
- **Description too long** — shorten to ~130 chars, drop implementation details
- **Wrong category** — check the categories above
- **Not alphabetical** — re-sort within the category
- **Missing attribution** — add `*By [@username](profile)*` suffix

When amending per review feedback, use `git commit --amend` + `git push --force-with-lease`
to keep the PR clean (single commit).

**Important:** Never create multiple PRs from the same fork to the same upstream.
Update existing PRs with `git commit --amend && git push --force-with-lease`.

### 8e: Editing a PR on Someone Else's Repo

When you need to update a PR that targets an upstream repo (yours or someone else's), the
PR may come from any fork. Don't guess — look it up:

```bash
# Step 1: Find which fork and branch the PR comes from
gh api repos/{owner}/{repo}/pulls/{num} --jq '.head.repo.full_name, .head.ref'
# Output: wan-huiyan/field-notes
#         fix/installation-guide

# Step 2: Clone THAT FORK (not the upstream repo)
git clone https://github.com/{fork-full-name}.git /tmp/{repo}

# Step 3: Checkout THAT BRANCH
cd /tmp/{repo} && git checkout {branch}

# Step 4: Make changes, commit, push to THAT FORK
git add . && git commit -m "..." && git push origin {branch}
```

**Common mistake:** Cloning the upstream repo and fetching `pull/{num}/head` gives you a
detached ref you can't push back to. Always clone the fork directly.

## Step 9: Register for Ongoing Sync

After publishing, register the skill so future updates can be pushed with `/skill-sync`:

```
/skill-sync init
```

This scans your GitHub repos and matches them to local skill directories.
For ongoing updates (editing SKILL.md, eval-suite.json, etc.), use `/skill-sync push {name}`
instead of manually cloning and copying. See the **skill-sync** companion skill for details.

## PDF Output for HTML-Generating Skills

If the skill generates HTML (slides, reports, diagnostics), add PDF as an output.
Key CSS rules for clean page breaks:

```css
@media print {
  .section, .card, .callout { break-inside: avoid; }
  p { break-inside: avoid; }
  h1, h2, h3 { break-after: avoid; }
  .section-header + .section-desc { break-before: avoid; }
  .page-break-before { break-before: page; }
}
```

- `flex-wrap: nowrap` on flow diagrams prevents node wrapping to second row
- `break-inside: avoid` on paragraphs prevents text splitting mid-sentence
- Explicit page breaks between major sections via `.page-break-before` class

## Updating an Existing Published Skill

For ongoing updates to already-published skills, use the **skill-sync** companion skill:

```
/skill-sync push {skill-name}
```

This handles cloning, copying tracked files, committing, and pushing automatically.
For version bumps (not just content edits), skill-sync includes a full checklist
covering all 7 files that need version updates. See `/skill-sync` for details.

## Phase Numbering in SKILL.md Workflows

For 7+ phase workflows, use named stages (Gather/Analyze/Apply/Finalize) with sequential numbering. Avoid decimal sub-phases (1.5, 3.5) — they imply sub-phases are secondary and accumulate confusingly. Fix numbering early (pre-v2.0).

## Commit Message Convention

```bash
git commit -m "$(cat <<'EOF'
{type}: {description}

{body explaining what and why}

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

Types: `feat:` (new feature), `docs:` (README/docs), `fix:` (bug fix), `chore:` (packaging)

## Composability & Integration

### Input / Output Contract

**Input:** A target skill path (e.g., `~/.claude/skills/{name}/SKILL.md`) containing valid
frontmatter with `name` and `description` fields. The skill must exist locally before publishing.

**Output:** A complete GitHub repository with `SKILL.md`, `README.md`, `LICENSE`, `plugin.json`,
`marketplace.json`, and optionally `docs/` with demo screenshots. Returns the GitHub repo URL
and (optionally) the awesome-claude-skills PR URL.

### Dependencies

- Requires `git` (any version) for repo creation and pushing
- Requires `gh` CLI (GitHub CLI) for `gh repo create`, `gh api`, and PR creation. If `gh` is not
  available, fall back to manual GitHub workflow instructions
- Optionally depends on `npm` + `puppeteer` for screenshot generation (skip gracefully if unavailable)
- Compatible with Claude Code v1.0+ and works with Cursor 2.4+ via `.cursor/rules/` copy

### Error Handling

- If SKILL.md is not found at the target path, report the error and ask for the correct path
- If `gh` CLI fails (auth, network), provide manual git + GitHub web UI fallback instructions
- If puppeteer screenshot generation fails, skip screenshots and note the gap in the README
- If the GitHub repo already exists, detect and offer update flow instead of failing on create

### Idempotency

Safe to re-run on the same skill. Running publish-skill twice produces the same repo structure.
Updating an already-published skill is an explicit supported workflow (version bump + push).
No destructive side effects on the local skill installation.

### Scope Boundaries

- **Use this skill when** the user wants to publish, share, release, or update a skill repo
- **Do NOT use for** creating new skills from scratch (use `skill-creator` instead),
  improving skill quality/triggers (use `schliff`), general code deployment to cloud providers,
  or writing READMEs for non-skill projects
- **Hand off to** `skill-creator` if the user needs to build a skill first, then come back here;
  hand off to `schliff` if the user wants to improve the skill before publishing;
  hand off to `agent-review-panel` for README quality review (this skill invokes it as a sub-step)

### Namespace

All generated files are scoped to the `publish-skill` workflow namespace:
`plugin.json`, `marketplace.json`, and repo structure under `{skill-name}/`. Does not modify
files outside the target repo directory or `~/.claude/skills/{name}/`.
