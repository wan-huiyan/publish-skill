---
name: publish-skill
description: |
  Publish a Claude Code skill to GitHub and optionally submit to awesome-claude-skills
  lists. Use when: (1) user says "publish this skill", "put this on GitHub", or
  "share this skill", (2) a skill is ready for public distribution, (3) user wants
  to submit to awesome-claude-skills marketplaces. Covers the full workflow: repo
  creation, README writing, LICENSE, GitHub topics, and awesome-list PR formatting.
  Encodes hard-won lessons: no test-plan sections in doc PRs, never create multiple
  PRs from the same fork to the same upstream, always update README before publishing,
  interactive skills need process-flow examples not static dumps.
author: wan-huiyan
version: 1.0.0
date: 2026-03-20
---

# Publish Skill to GitHub

## Problem

Publishing a Claude Code skill involves multiple steps with non-obvious pitfalls:
creating the repo, writing a good README, choosing topics for discoverability,
and optionally submitting to awesome-lists. Each step has gotchas learned from
real publishing attempts.

## Context / Trigger Conditions

Use this skill when:
- A skill exists locally at `~/.claude/skills/<name>/SKILL.md` and needs publishing
- User says "publish this skill", "put this on GitHub", "share this skill"
- User wants to submit to awesome-claude-skills lists
- User wants to update an already-published skill's GitHub presence

## Process

### Phase 1: Pre-Flight Check

Before publishing, verify the skill is ready:

1. **Read the SKILL.md** — understand what the skill does
2. **Check version** — is this v1.0.0 (new) or an update?
3. **Check for interactive process** — does the skill have a phased process,
   or is it a static reference doc? If static, warn the user:
   > "This skill reads like a reference document. Skills that work best have
   > an interactive process (diagnose → tailor → recommend). Want to add one
   > before publishing?"
4. **Check for sensitive content** — no internal URLs, credentials, or
   company-specific references that shouldn't be public

### Phase 2: Create GitHub Repository

Ask: "Do you have a GitHub repo for this already, or should I create one?"

#### If creating new:

```bash
# Create the repo
gh repo create <skill-name> --public --description "<one-line description>"

# Clone it
cd /tmp && git clone https://github.com/<username>/<skill-name>.git
cd <skill-name>

# Copy the skill
cp ~/.claude/skills/<skill-name>/SKILL.md .

# Add LICENSE (MIT is standard for skills)
# Create README.md (see Phase 3)
# Add topics for discoverability
gh repo edit --add-topic claude-code,claude-code-skill,ai,automation
# Add domain-specific topics based on the skill content
```

#### If repo exists:

```bash
cd /tmp && git clone <repo-url>
# Copy updated SKILL.md, update README, commit, push
```

### Phase 3: Write the README

The README is the skill's landing page. It must answer three questions in 10 seconds:
**What does it do? How does it work? How do I install it?**

#### README Structure

```markdown
# <Skill Name> - Claude Code Skill

<One paragraph: what it does and why it exists>

## How It Works

<If interactive skill: show the process flow>
```
Phase 0: Auto-Detect  → Scans project for relevant signals
Phase 1: Understand    → Targeted questions
Phase 2: Diagnose      → Maps situation to knowledge base
Phase 3: Recommend     → Tailored action plan
```

<If static skill: show what it produces>

## When to Use

- <Bullet list of trigger conditions>

## What It Covers

<Key features/sections — keep scannable>

## Example Output

<CRITICAL: Show what the skill actually produces when invoked>

<For interactive skills: show a realistic multi-phase conversation
with collapsible sections (<details>). Show how outputs differ based
on user context — this proves it's not a static doc dump.>

<For static skills: show a representative output sample>

## Key Insights

> <2-3 quotable findings or principles the skill encodes>

## Installation

```bash
git clone https://github.com/<user>/<skill>.git ~/.claude/skills/<skill>
```

Or manually copy `SKILL.md` to `~/.claude/skills/<skill>/SKILL.md`.

## Origin

<How the skill was created — methodology, research foundations, etc.>

<IMPORTANT: Add hyperlinks to all referenced papers, tools, and repos.
Bare references without URLs look incomplete. Use this format:>

| Paper | Venue | Contribution |
|-------|-------|-------------|
| [Name](url) | Venue Year | What it contributes |

## License

MIT
```

#### README Pitfalls (learned from experience)

- **No links in Origin section** — always add arxiv/DOI/GitHub URLs for
  referenced papers and tools. Bare text references look incomplete.
- **Static example output** — if the skill is interactive (v3.0+), the
  Example Output must show the interactive flow, not a static taxonomy dump.
  Use collapsible `<details>` blocks showing each phase with realistic
  user responses.
- **Missing "How It Works" process flow** — for interactive skills, show
  the phase diagram upfront so users understand it's a diagnostic, not a doc.

### Phase 4: Commit and Push

```bash
git add SKILL.md README.md LICENSE
git commit -m "Initial release: <skill-name> v<version>

<1-2 sentence description>

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"

git push origin <branch>
```

**After pushing, verify:**
- README renders correctly on GitHub (tables, collapsible sections, links)
- Topics appear on the repo page
- SKILL.md is accessible

### Phase 5: Submit to Awesome Lists (Optional)

Only proceed if the user explicitly asks to submit to awesome-claude-skills.

There are two main lists:
1. **ComposioHQ/awesome-claude-skills** — larger, more established
2. **travisvn/awesome-claude-code** — newer, growing

#### Critical Rules for Awesome-List PRs

These rules were learned from real incidents:

1. **NO "Test plan" section in PR body** — these are documentation PRs, not
   code PRs. A test plan checklist is inappropriate and looks automated.
   Use this PR format instead:

   ```bash
   gh pr create --title "Add <skill-name> skill" --body "$(cat <<'EOF'
   ## Summary
   - Adds [<skill-name>](repo-url) to the list
   - <One sentence: what the skill does>
   - <One sentence: why it's valuable / what gap it fills>

   🤖 Generated with [Claude Code](https://claude.com/claude-code)
   EOF
   )"
   ```

2. **NEVER create multiple PRs from the same fork to the same upstream repo**
   — if you fork `upstream/awesome-claude-skills` to `user/awesome-claude-skills`
   and create PR #1 from branch A, then create PR #2 from branch B, pushing
   branch B will force-push and CLOSE PR #1 automatically. This is because
   GitHub forks share a single default branch for PRs.

   **Fix:** If submitting multiple skills to the same list, combine them into
   ONE PR with ONE commit. Or use separate branches with explicit `--head` flags.

3. **If a PR gets auto-closed**, it leaves a permanent "Quickdraw" badge on
   your GitHub profile (closed within 5 minutes of opening). GitHub PRs cannot
   be deleted — only repo admins can, and even then rarely. Add a "Superseded
   by #<new-PR>" comment to any orphaned PRs.

4. **Check the list's format** before submitting. Each awesome-list has its
   own table/list format. Match it exactly:

   ```bash
   # Read the existing format
   gh api repos/<org>/awesome-claude-skills/contents/README.md \
     --jq '.content' | base64 -d | tail -20
   ```

5. **Add the entry alphabetically** within the appropriate category.

#### Submission Workflow

```bash
# Fork the awesome-list repo
gh repo fork <org>/awesome-claude-skills --clone

# Create a branch
cd awesome-claude-skills
git checkout -b add-<skill-name>

# Edit README.md — add your skill entry in the correct format/position
# Match the existing table/list format exactly

# Commit
git add README.md
git commit -m "Add <skill-name> skill"

# Push and create PR
git push -u origin add-<skill-name>
gh pr create --repo <org>/awesome-claude-skills \
  --title "Add <skill-name> skill" \
  --body "$(cat <<'EOF'
## Summary
- Adds [<skill-name>](repo-url) to the list
- <description>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

**If submitting to both lists:** Do them sequentially. Each is a separate
fork → branch → PR. Do NOT try to reuse branches or forks across different
upstream repos.

### Phase 6: Post-Publish Verification

After publishing:
1. **Visit the repo URL** — verify README renders, links work
2. **Test install** — `git clone <url> ~/.claude/skills/<name>` works
3. **Check PRs** — if submitted to awesome-lists, verify PRs are open and
   correctly formatted
4. **Update local skill** — if the GitHub version diverged during README
   writing, sync back: `cp /tmp/<repo>/SKILL.md ~/.claude/skills/<name>/`

## Verification Checklist

- [ ] SKILL.md is in the repo root
- [ ] README has: description, how it works, when to use, example output,
      installation, origin with links, license
- [ ] LICENSE file exists (MIT recommended)
- [ ] GitHub topics include `claude-code` and `claude-code-skill`
- [ ] All paper/tool references in Origin have hyperlinks
- [ ] Example output shows interactive flow (if applicable), not static dump
- [ ] No sensitive content (internal URLs, credentials, company names)
- [ ] Awesome-list PR has no "Test plan" section
- [ ] Only one PR per fork to the same upstream

## Notes

- This skill was extracted from publishing `ai-trust-evaluation` (3 versions)
  and `agent-review-panel` (5 versions) to GitHub, plus submitting both to
  two awesome-claude-skills lists
- The multi-PR-from-same-fork issue caused an auto-closed PR and an
  irremovable "Quickdraw" GitHub badge — a permanent reminder
- README quality directly impacts adoption — the Example Output section is
  the most important part for convincing users to install
- See also: `skill-creator` (for creating skills), `claudeception` (for
  extracting skills from sessions)
