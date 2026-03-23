---
name: publish-skill
description: |
  Publish a Claude Code skill to GitHub as a polished, adoptable open-source repo. Use when
  the user says "publish this skill", "put this on GitHub", "share this skill", or wants to
  update an existing published skill repo. Covers: repo structure (.claude-plugin packaging,
  skills/ directory, LICENSE), README generation with demo screenshots via puppeteer,
  multi-agent review panel for README quality, research verification of thresholds/claims,
  visual distinction of grounded vs heuristic thresholds, GitHub repo metadata (description,
  topics), PR submission to awesome-claude-skills, and PDF output for HTML-generating skills.
  Also use when updating an existing published skill repo (version bump, README improvement,
  commit squashing).
---

# Publish Skill to GitHub

Turn a local Claude Code skill into a polished, adoptable open-source GitHub repo.

## When to Use

- User says "publish this skill", "share this skill", "put this on GitHub"
- User wants to update an already-published skill repo
- User asks to submit a skill to awesome-claude-skills or a marketplace

## Step 0: Client Data Audit (CRITICAL — do this FIRST)

Before publishing ANYTHING, scan for client-identifying data. Skills built from
real engagements often contain details that can identify clients:

**What to scan for:**
```
Grep: company names, brand names, institution names
Grep: specific dollar/pound amounts from real engagements
Grep: real people's names, employer emails
Grep: internal URLs, project codes, Jira tickets
Grep: field names from client databases (e.g., merit_award_scholarship_tier)
```

**Combination risk:** Even individually innocuous details (a campaign type +
currency + dates + industry) can identify a client when combined. "Free delivery
promo, £297K uplift, Jan 2026, UK retail" narrows to a handful of companies.

**Check ALL of these:**
- SKILL.md (methodology sections often reference real cases)
- README.md (quick start examples, origin sections)
- Demo screenshots/HTML (field names, amounts, dates visible in images)
- marketplace.json (author email — don't use employer email)
- Supporting files (references/, docs/, examples/)

**Sanitization checklist:**
- [ ] Replace client/institution names with generic labels ("a retail client", "a university")
- [ ] Change specific amounts to synthetic numbers AND switch currency
- [ ] Replace employer email with personal email or remove
- [ ] Regenerate screenshots from sanitized HTML source
- [ ] Clean git history — old data lives in previous commits even after editing!
      Use orphan branch + force-push to remove: `git checkout --orphan clean && ...`
- [ ] Add disclaimer: "All examples use synthetic data"
- [ ] Check demo screenshots for visible field names that could identify a domain
- [ ] Verify demo scenario is domain-distant (see below)

**Choosing demo scenarios — domain distance matters:**

Even after sanitizing names and amounts, a demo in the same DOMAIN as real client
work raises questions internally. "SaaS customer churn" is generic to the public
but not to a team that builds churn models for clients. Sanitizing the data isn't
enough — you need to swap the entire domain.

**Safe demo scenarios** (far from typical consultancy work):
- NYC taxi trip duration prediction (public TLC dataset)
- City speed limit impact on traffic accidents (public safety)
- Weather station sensor anomaly detection
- Movie rating prediction (MovieLens dataset)
- Equipment failure prediction (manufacturing IoT)
- Public transit ridership forecasting
- Air quality index prediction

**Generally safe** (common enough to be generic):
- E-commerce revenue / conversion / churn
- Campaign ROI / marketing attribution
- Retail demand forecasting
- SaaS subscription metrics

**Avoid these** (identifiable when combined with specific field names/amounts):
- Enrollment / admissions prediction (ties to specific institution clients)
- Any scenario using real client field names, even with synthetic data
- Niche industry verticals where your team has few clients (easy to narrow down)

**Rule of thumb:** Common domains (e-commerce, churn, retail) are fine for demos
because they're universal. The risk is when you combine a niche domain with
specific field names, amounts, or dates that could narrow to a particular client.
Enrollment prediction with `merit_award_scholarship_tier` identifies one client;
"e-commerce churn" with `days_since_last_purchase` identifies nobody.

**Why git history matters:** Even if you sanitize the current files, `git log -p`
shows every previous version. Client names, amounts, and screenshots in old commits
are still accessible. For sensitive data removal, create an orphan branch with only
the clean version and force-push.

## Step 1: Locate the Skill

Find the SKILL.md to publish:
```
~/.claude/skills/{skill-name}/SKILL.md
```

Read the frontmatter to extract: name, description, version, author.

## Step 2: Create Repo Structure

```
skill-name/
├── .claude-plugin/
│   └── plugin.json           # Plugin manifest (name, version, description)
├── marketplace.json            # Marketplace index (at root, NOT inside .claude-plugin)
├── skills/
│   └── skill-name/
│       └── SKILL.md          # Installable copy
├── docs/                     # Screenshots (if visual output)
│   ├── demo-{name}.html      # HTML source for screenshots
│   └── demo-{name}.png       # Generated screenshot
├── SKILL.md                  # Root copy (same content as skills/)
├── README.md
└── LICENSE                   # MIT
```

**plugin.json template:**
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

**marketplace.json template** (place at repo ROOT, not inside .claude-plugin):
```json
{
  "name": "{username}-{skill-name}",
  "owner": { "name": "{user's name}" },
  "plugins": [{
    "name": "{skill-name}",
    "source": ".",
    "description": "{one-line}",
    "version": "{version}"
  }]
}
```

**CRITICAL:** marketplace.json `name` becomes the marketplace identifier. Users will
run `/plugin install {skill-name}@{marketplace-name}`, so use a descriptive name like
`wan-huiyan-ai-trust-evaluation`.

## Step 3: Write the README

Follow this structure (order matters for first-time visitor conversion):

1. **Title + one-line descriptor** — what it IS, factual. Not a scenario.
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
5. **What You Get** — concrete, tangible outputs
6. **Comparison table** — "Typical Ad-Hoc vs With Skill" (realistic baseline, not strawman)
7. **How It Works** — step table
8. **Key Design Decisions** — the non-obvious architectural choices
9. **Limitations** — what it does NOT do. Builds trust with technical audiences.
10. **Dependencies** — required vs optional. Explain what happens *without* each.
11. **Quality Checklist** in `<details>` — what the skill guarantees
12. **Related Skills** — cross-link companion skills with hyperlinks
13. **Research/References** in `<details>` — citations with hyperlinks, if applicable
14. **Version History** — even 3 lines. Trust signal that it's maintained.
15. **License** — MIT

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

If the skill addresses pitfalls or common mistakes, structure them in two tiers:

**Tier 1: Strategic pitfalls** (lead with these — they're the selling points):
- Problems that cost teams *weeks* (wrong assumptions, missed opportunities, silent degradation)
- Model-agnostic or broadly applicable — don't narrow the audience prematurely
- Written as "you think X, but actually Y" — the reader should feel the pain

**Tier 2: Implementation pitfalls** (follow with these — they show thoroughness):
- Specific code-level traps (`.fillna(0)`, sentinel values, off-by-one errors)
- Framework-specific details (XGBoost NaN routing, sklearn CV leakage)
- These impress *after* the reader is already sold, but repel if they lead

**Why this order matters:** Strategic pitfalls answer "do I need this tool?" Implementation pitfalls answer "is this tool thorough?" Leading with Tier 2 makes the skill look like a tips-and-tricks collection for one framework, when the real value is the structured diagnostic.

**Apply the same principle to ALL list/table sections**, not just pitfalls:
- **"What worked" tables** — lead with broadly applicable techniques (covariate safety audit, pre-period selection), then domain-specific methods (RDiT, conformal CIs)
- **"Key Lessons" lists** — strategic lessons first ("subtract before you add", "two methods > one"), tactical lessons second ("nseasons=7 makes DoW redundant")
- **"What You Get" bullets** — high-level outcomes first (go/no-go verdict, client-ready deliverable), diagnostic details second

**When the README already has strong narrative sections** (e.g., a "Journey" story showing real problem-solving), don't restructure those — they're effective as-is. Instead, *add* a "What This Catches" section as a scannable entry point that a first-time visitor can skim in 10 seconds. The narrative convinces people who are already interested; the scannable list catches people who are still deciding.

### Narrative Sections ("Journey", "Case Study", "How We Got Here")

Narrative sections that show real problem-solving (e.g., "p=0.223 → p=0.039 through systematic improvements") are powerful selling devices — they prove the skill was battle-tested, not theoretical. But they can read as narrow anecdotes if framed wrong.

**Frame as methodology, not anecdote.** The intro should make clear the story illustrates the skill's *systematic process*, not one lucky outcome:
- **Bad:** "Starting from the same 4 days of campaign data, systematic improvements achieved significance"
- **Good:** "Every causal analysis follows the same pattern: a promising-but-not-significant first result, then systematic improvements that either find the real signal or confirm there isn't one. Here's what that looks like:"

The difference: "bad" says "here's what happened once." "Good" says "this is what the skill does every time, illustrated by one run." The reader infers their analysis would follow the same disciplined process.

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
3. Clean up `node_modules/`, `package.json`, `package-lock.json` before committing

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

**Examples of good vs bad descriptions:**

| Too long (flagged by reviewer) | Shortened (approved) |
|-------------------------------|---------------------|
| "Multi-agent adversarial review panel where Claude Code subagents with different perspectives review work, debate, reach consensus, then a supreme judge renders the final verdict. Based on ChatEval, AutoGen, MachineSoM, and DebateLLM research." | "Multi-agent adversarial review panel where Claude Code subagents debate from different perspectives before a supreme judge renders the final verdict." |
| "Assess whether an ML training window can be extended by adding a new data source. Covers per-output label validity, drift-aware validation (PSI), purged temporal CV with embargo, XGBoost NaN handling for missing feature blocks, and companion model vs extended training architecture decisions." | "Evaluate ML training window extensions with per-output label validity, drift checks, and architecture recommendations." |

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

## Step 9: Sync Local Skill

After publishing, ensure the local installation matches:
```bash
cp {repo}/skills/{skill-name}/SKILL.md ~/.claude/skills/{skill-name}/SKILL.md
```

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

1. Update SKILL.md (both root and `skills/` copy)
2. Bump version in `plugin.json` and `marketplace.json`
3. Update README if user-facing behavior changed
4. For clean history: `git reset --soft HEAD~N && git commit` then `git push --force-with-lease`
5. Sync local: `cp skills/{name}/SKILL.md ~/.claude/skills/{name}/SKILL.md`

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
