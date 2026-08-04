# Publish Skill - Claude Code Skill
[![GitHub release](https://img.shields.io/github/v/release/wan-huiyan/publish-skill)](https://github.com/wan-huiyan/publish-skill/releases) [![Claude Code](https://img.shields.io/badge/Claude_Code-skill-orange)](https://claude.com/claude-code) [![license](https://img.shields.io/github/license/wan-huiyan/publish-skill)](LICENSE) [![last commit](https://img.shields.io/github/last-commit/wan-huiyan/publish-skill)](https://github.com/wan-huiyan/publish-skill/commits)

Publishing a Claude Code skill involves a dozen error-prone steps — repo structure, README, screenshots, marketplace submission, and client data scanning. This skill handles the full workflow so you only have to do each mistake once.

## How It Works

```
Step 0: Client Data Audit     → Scan for company names, amounts, field names in
                                SKILL.md, README, screenshots, git history

Step 1: Repo Structure         → .claude-plugin packaging, skills/ directory, LICENSE
                                (MIT — with independent rationale, not self-referential)

Description Cap Gate           → SKILL.md description vs the 1,536-char skill-listing cap.
  (REQUIRED, between 1 and 2)   Over the cap, trigger phrases are silently truncated away

Step 2: Write README           → 16-section template: screenshots, installation, limitations,
                                version history. Pitfalls in strategic-then-implementation order

Step 3: Hook Bundling          → If the skill benefits from auto-triggering, include
                                hooks/ directory with ready-to-use scripts + settings.json snippet

Step 4: Demo Screenshots       → Puppeteer-generated. For rich output, capture 2–4 focused
                                sections (not one massive hero image)

Step 5: Verify Claims          → Parallel research agents check thresholds and citations

Step 6: Review Panel           → Multi-agent adversarial review of the README

Step 7: GitHub Setup           → Create repo, set topics (or suggest in PR if contributing
                                via fork — API requires owner access)

Step 8: Awesome Lists          → (Optional) Submit PRs with correct formatting per list
```

## When to Use

- A skill is ready to share publicly
- You say "publish this skill", "put this on GitHub", or "share this skill"
- You want to submit a skill to awesome-claude-skills marketplaces
- You need to update an already-published skill's GitHub presence
- "Submit to awesome-claude-skills" / "add my skill to the awesome list"
- "How do I let others install my skill?" / "I finished my skill, now what?"
- "Push my skill to a public repo" / "generate a README and publish"
- "Bump the version and republish" / "turn my local skill into a polished repo"

## Hard-Won Lessons Encoded

These rules were learned from real incidents during publishing:

| Lesson | What Happened |
|--------|--------------|
| No "Test plan" in PR body | 3 of 4 awesome-list PRs had unnecessary test plan sections — inappropriate for doc-only PRs |
| Never multi-PR from same fork | Two PRs to the same upstream from one fork — second push auto-closed the first |
| Always add links in Origin | Bare paper references without URLs look incomplete — always add arxiv/DOI/GitHub links |
| Interactive skills need process examples | Example Output showing a static taxonomy dump contradicts the claim that the skill is an "interactive diagnostic" |
| Check list format before submitting | Each awesome-list has its own table/list format — match it exactly |
| GitHub can't delete PRs | Only repo admins can delete PRs — be careful with what you open |
| Fork contributors can't set topics | `gh repo edit --add-topic` requires admin access — suggest topics in PR description instead |
| Multi-section screenshots beat single hero | For rich output skills, 2–4 focused section screenshots show variety better than one long image |
| Don't cite your own skill as authority | "MIT because publish-skill says so" is circular — justify recommendations with independent reasoning |
| A long description is not a rich description | This repo's own description hit 2,385 chars against a 1,536-char skill-listing cap. The 849 overflow chars — the whole `Covers:` list and the entire `Do NOT use for` precision list — were written on every turn and thrown away unread. v2.1.0's commit message said "extend triggers"; every char it added past 1535 delivered nothing. Gate the description in CI |
| Update SKILL.md FIRST, metadata second | Updated eval-suite, README, plugin.json, and marketplace.json to v1.5 — but forgot to add a version field to SKILL.md itself. The skill content is the primary artifact; metadata files follow it, not the other way around |

## Example: What the Skill Produces

When you say "publish this skill", the skill walks through each phase:

<details>
<summary><b>Phase 1: Pre-Flight</b> — checks skill readiness</summary>

> I've read the skill. A few things before we publish:
>
> - Version: 2.0.0 (update, not new)
> - The skill has an interactive 4-phase process — good, this isn't a static doc
> - No sensitive content detected
> - The GitHub repo `wan-huiyan/ai-trust-evaluation` already exists with v1.0
>
> Ready to update the repo with v2.0?
</details>

<details>
<summary><b>Phase 3: README</b> — writes a structured README with links</summary>

> I've written the README with:
> - "How It Works" process flow diagram
> - "Example Output" showing the interactive diagnostic across 4 phases
>   (not a static taxonomy dump)
> - All 8 research papers linked to arxiv/Nature/USENIX
> - Installation instructions
> - Origin section with methodology and paper table
</details>

<details>
<summary><b>Phase 5: Awesome Lists</b> — optional, correct formatting</summary>

> Submitted to ComposioHQ/awesome-claude-skills:
> - Forked repo, created branch `add-ai-trust-evaluation`
> - Added entry alphabetically in the correct table format
> - PR body has Summary section only (no test plan)
> - PR #425: https://github.com/ComposioHQ/awesome-claude-skills/pull/425
</details>

## Installation

### Claude Code

**Option 1: Plugin install (recommended)**
```bash
/plugin marketplace add wan-huiyan/publish-skill
/plugin install publish-skill@wan-huiyan-publish-skill
```

**Option 2: Git clone**
```bash
git clone https://github.com/wan-huiyan/publish-skill.git ~/.claude/skills/publish-skill
```

### Cursor

Cursor supports skills via `~/.cursor/skills/` (Cursor 2.4+), though global discovery can be flaky. Options from most to least reliable:

**Option 1: Per-project rule (most reliable)**
```bash
mkdir -p .cursor/rules
# Create .cursor/rules/publish-skill.mdc with the content of SKILL.md
# Add frontmatter: alwaysApply: true
```

**Option 2: npx skills CLI**
```bash
npx skills add wan-huiyan/publish-skill --global
```

**Option 3: Manual global install**
```bash
git clone https://github.com/wan-huiyan/publish-skill.git ~/.cursor/skills/publish-skill
```

## Eval Suite Coverage

The skill includes a comprehensive evaluation suite (`eval-suite.json`) with **45 trigger tests**, **12 functional test cases**, and **16 edge cases**.

<details>
<summary><b>Trigger tests (45)</b> — validate when the skill should and shouldn't activate</summary>

- 25 positive triggers: "publish this skill", "republish", "share my .claude skill", compound intents, etc.
- 20 negative triggers: "deploy to production", "publish my npm package", "make a GitHub repo" (no skill context), "improve this skill's quality", etc.
</details>

<details>
<summary><b>Functional test cases (12)</b> — cover every major workflow step</summary>

| Test case | What it validates |
|---|---|
| `basic_publish_flow` | Full publish pipeline: SKILL.md, README, LICENSE, plugin.json, marketplace.json, valid install commands |
| `repo_structure_validation` | Correct directory structure with .claude-plugin, skills/, LICENSE |
| `awesome_list_submission` | Fork workflow, alphabetical ordering, categories, description length, no test plan in PR |
| `client_data_audit` | Sanitization, git history warning, orphan branch cleanup, visual asset scanning |
| `update_existing_repo` | Version bump across all 7 locations (SKILL.md, nested copy, plugin.json, marketplace.json, README) |
| `screenshot_generation` | Puppeteer usage, docs/ output, node_modules cleanup, generic demo scenarios |
| `threshold_verification` | Grounded vs heuristic labeling, ranking-based thresholds |
| `portability_check` | Flags vendor-specific references, suggests placeholder names |
| `review_panel` | Multi-agent review invocation, screenshot and limitations checks |
| `link_verification` | Broken link detection, fork vs upstream attribution |
| `hook_bundling` | hooks/ directory, settings.json config, timeout guidance, merge-friendly advice |
| `version_bump_completeness` | All update locations bumped, stale version string check |
</details>

<details>
<summary><b>Edge cases (16)</b> — error paths, permissions, and unusual inputs</summary>

| Edge case | Category |
|---|---|
| `no_skill_md_found` | missing_deps |
| `skill_with_no_frontmatter` | malformed_input |
| `huge_skill_md` | scale_extreme |
| `repo_already_exists` | invalid_path |
| `skill_with_sensitive_data` | dangerous_input |
| `no_github_cli` | missing_deps |
| `unicode_skill_name` | unicode |
| `empty_skill_md` | minimal_input |
| `fork_contributor_permissions` | permissions |
| `multiple_skills_batch` | scale_extreme |
| `network_failure_mid_publish` | missing_deps |
| `yaml_frontmatter_conflict` | malformed_input |
| `marketplace_name_collision` | conflict |
| `skill_with_hooks_already` | existing_content |
| `repo_not_owned_by_user` | permissions |
| `puppeteer_not_available` | missing_deps |
</details>

### Repo tests

`npm test` runs 266 assertions across four suites — manifest consistency,
eval-suite integrity, trigger classification, and the **skill-description cap
gate**. The gate (`plugins/publish-skill/scripts/check_skill_descriptions.py`,
vendored from [context-police](https://github.com/wan-huiyan/context-police))
fails the build if any SKILL.md description exceeds Claude Code's 1,536-char
skill-listing cap or loses a quoted trigger phrase to truncation. It also runs as
its own CI step so it can never silently skip.

It lives **inside the plugin source dir**, not at repo-root `scripts/`, because
`marketplace.json` ships only what is under `source: ./plugins/publish-skill`. The
skill's REQUIRED Description Cap Gate step resolves it as
`$CLAUDE_PLUGIN_ROOT/scripts/check_skill_descriptions.py`, so it is runnable for
installed users and not just for people who cloned the repo. A test asserts that
invariant against `marketplace.json`.

```bash
npm test
python3 plugins/publish-skill/scripts/check_skill_descriptions.py . --triggers
```

## Related Skills

- [skill-creator](https://docs.anthropic.com/en/docs/claude-code/skills) — for creating skills from scratch
- claudeception — for extracting skills from work sessions (built-in skill, no separate repo)
- [agent-review-panel](https://github.com/wan-huiyan/agent-review-panel) — for stress-testing skills before publishing

## Limitations

- Requires an existing SKILL.md before use — does not create skills from scratch (use skill-creator for that)
- Screenshot generation requires Puppeteer; skipped automatically if not installed
- Does not submit to awesome-claude-skills automatically — the PR step requires manual review

## Origin

Extracted via Claudeception from a multi-session publishing workflow that included:
- Publishing [ai-trust-evaluation](https://github.com/wan-huiyan/ai-trust-evaluation) through v1.0 → v2.0 → v3.0
- Publishing [agent-review-panel](https://github.com/wan-huiyan/agent-review-panel) through v2.0 → v2.5
- Submitting both to [ComposioHQ/awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills) and [travisvn/awesome-claude-code](https://github.com/travisvn/awesome-claude-code)
- Debugging auto-closed PRs, fixing formatting, and learning the hard way about GitHub fork behavior

## Version History

| Version | Date | Changes |
|---|---|---|
| 2.4.0 | 2026-08-04 | Trim the frontmatter description from 2,385 → 1,489 chars (was 849 over the 1,536-char skill-listing cap, silently truncated mid-word); restore the `Do NOT use for` precision list to the visible region; add the REQUIRED **Description Cap Gate** stage + the vendored gate at `plugins/publish-skill/scripts/check_skill_descriptions.py` (inside the shipped plugin source dir, resolved via `$CLAUDE_PLUGIN_ROOT`), wired into tests and CI, propagated to generated repos by Step 5c, and declared as a `python3` dependency |
| 2.3.0 | 2026-07-17 | Add "Renaming a Published Skill" variant (repo rename → identifier sweep → major bump → dual-separator cross-ref grep) + Pattern-B manifest-test gotcha note |
| 2.2.0 | 2026-06-01 | Sync accumulated local SKILL.md updates |
| 2.1.0 | 2026-04-07 | Extend description triggers to semantic-match plugin-install failure errors |
| 2.0.0 | 2026-04-07 | BREAKING: canonical `plugins/<name>/` layout, `marketplace.json` inside `.claude-plugin/` |
| 1.6.0 | 2026-03-31 | Add "update SKILL.md first" lesson after metadata-only version bump missed the skill itself |
| 1.5.0 | 2026-03-31 | Expand eval suite: 35→45 triggers, 6→12 test cases, 8→16 edge cases; strengthen assertions on existing tests |
| 1.4.0 | 2026-03-24 | Enrich trigger description, add eval suite, add composability metadata |
| 1.3.0 | 2026-03-24 | Add hooks bundling, multi-section screenshots, fork guidance, Why MIT rationale, pitfalls restructuring |
| 1.2.0 | 2026-03-23 | Add awesome-claude-skills submission guidelines, domain-distance guidance |
| 1.1.0 | 2026-03-22 | Add Step 0 client data audit, PR editing workflow |
| 1.0.0 | 2026-03-21 | Initial release |

## Acknowledgements

Trigger accuracy and eval suite improved using [schliff](https://github.com/Zandereins/schliff) — an autonomous skill scoring and improvement framework.

## License

MIT
