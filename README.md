# Publish Skill - Claude Code Skill

A Claude Code skill that handles the full workflow of publishing other skills to GitHub and optionally submitting them to awesome-claude-skills marketplace lists. Encodes hard-won lessons from real publishing attempts — the kind of mistakes you only make once.

## How It Works

```
Phase 1: Pre-Flight Check    → Verify skill is ready, check for sensitive content,
                                warn if it's a static doc (not interactive)

Phase 2: Create GitHub Repo   → gh repo create, copy SKILL.md, add LICENSE, set topics

Phase 3: Write README          → Structured template with links, example output,
                                interactive process flow (not static dumps)

Phase 4: Commit & Push         → Standard git workflow with verification

Phase 5: Awesome Lists         → (Optional) Submit PRs to ComposioHQ and/or travisvn
                                lists with correct formatting

Phase 6: Post-Publish Verify   → Check renders, test install, verify PRs
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
| Never multi-PR from same fork | Two PRs to the same upstream from one fork — second push auto-closed the first, leaving an irremovable "Quickdraw" badge |
| Always add links in Origin | Bare paper references without URLs look incomplete — always add arxiv/DOI/GitHub links |
| Interactive skills need process examples | Example Output showing a static taxonomy dump contradicts the claim that the skill is an "interactive diagnostic" |
| Check list format before submitting | Each awesome-list has its own table/list format — match it exactly |
| Combine related submissions | Multiple skills going to the same list → one PR, one commit |
| GitHub can't delete PRs | Only repo admins can delete PRs, and even then rarely — be careful with what you open |

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

```bash
# Clone to your skills directory
git clone https://github.com/wan-huiyan/publish-skill.git ~/.claude/skills/publish-skill
```

Or manually copy `SKILL.md` to `~/.claude/skills/publish-skill/SKILL.md`.

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

## License

MIT
