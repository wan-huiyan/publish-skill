# Publish Skill - Claude Code Skill

A Claude Code skill that handles the full workflow of publishing other skills to GitHub and optionally submitting them to awesome-claude-skills marketplace lists. Encodes hard-won lessons from real publishing attempts — the kind of mistakes you only make once.

## How It Works

```
Step 0: Client Data Audit     → Scan for company names, amounts, field names in
                                SKILL.md, README, screenshots, git history

Step 1: Repo Structure         → .claude-plugin packaging, skills/ directory, LICENSE
                                (MIT — with independent rationale, not self-referential)

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

## Related Skills

- [skill-creator](https://github.com/anthropics/claude-code) — for creating skills from scratch
- [claudeception](https://github.com/wan-huiyan/ai-trust-evaluation) — for extracting skills from work sessions
- [agent-review-panel](https://github.com/wan-huiyan/agent-review-panel) — for stress-testing skills before publishing

## Origin

Extracted via [Claudeception](https://github.com/wan-huiyan/ai-trust-evaluation) from a multi-session publishing workflow that included:
- Publishing [ai-trust-evaluation](https://github.com/wan-huiyan/ai-trust-evaluation) through v1.0 → v2.0 → v3.0
- Publishing [agent-review-panel](https://github.com/wan-huiyan/agent-review-panel) through v2.0 → v2.5
- Submitting both to [ComposioHQ/awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills) and [travisvn/awesome-claude-code](https://github.com/travisvn/awesome-claude-code)
- Debugging auto-closed PRs, fixing formatting, and learning the hard way about GitHub fork behavior

## Version History

| Version | Date | Changes |
|---|---|---|
| 1.3.0 | 2026-03-24 | Add hooks bundling, multi-section screenshots, fork guidance, Why MIT rationale, pitfalls restructuring |
| 1.2.0 | 2026-03-23 | Add awesome-claude-skills submission guidelines, domain-distance guidance |
| 1.1.0 | 2026-03-22 | Add Step 0 client data audit, PR editing workflow |
| 1.0.0 | 2026-03-21 | Initial release |

## License

MIT
