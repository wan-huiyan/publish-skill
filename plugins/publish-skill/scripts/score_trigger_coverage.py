#!/usr/bin/env python3
"""Score a description rewrite against this repo's eval-suite trigger prompts.

Adapted from wan-huiyan/agent-review-panel (scripts/score_trigger_coverage.py).
Re-vendor from upstream rather than editing locally, so every skill repo that
quotes coverage numbers computes them the same way.

WHY THIS IS COMMITTED
    A PR that trims trigger text and cites coverage numbers is asking the reviewer to
    take those numbers on faith unless the harness ships with it. This is that harness.
    Run it and you get the same figures the PR quotes.

WHAT IT MEASURES
    For each prompt in eval-suite.json, the fraction of its content words that appear in
    the description the model can actually see.

    The baseline is the crux: BEFORE is `old_description[:1535]`, NOT the full old text.
    The harness truncates at the cap, so scoring against the full oversized source
    compares the new description to text the model never read, and makes every honest
    trim look like a regression.

WHAT IT CANNOT MEASURE  (read this before trusting a green result)
    This is word-overlap. It is structurally BLIND to trigger-condition restructuring:
    rewriting `trigger on X -- separately, watch for Y` into `trigger on X WHOSE Y` keeps
    the identical word set and scores identically, while the trigger now only fires for
    users who already diagnosed Y.

    Use `check_skill_descriptions.py --compare OLD NEW` for that class, and read the
    NARROWED/REWORDED rows yourself. Do not clear them with this number.

    It also cannot tell "mentions X" from "excludes X". A restored `Do NOT use for ...`
    list raises measured coverage of the NEGATIVE prompts it names, while its actual
    effect is the opposite. `--strip-not-list` recomputes with that clause removed from
    both sides so the two readings can be reported side by side.

USAGE
    python3 scripts/score_trigger_coverage.py \
        --old  main:plugins/publish-skill/SKILL.md \
        --new  plugins/publish-skill/SKILL.md \
        --eval eval-suite.json

    python3 scripts/score_trigger_coverage.py ... --strip-not-list
    python3 scripts/score_trigger_coverage.py ... --json
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys

CAP = 1536

# Deliberately small and explicit: a large stopword list is a free parameter that can be
# tuned until the numbers look good. Keep it to function words only, and keep it here in
# the repo so a reviewer can see exactly what was excluded.
STOP = set("""
a an the this that these those i my me you your can could do does did is are was were be
been am on in of to for with and or but if it its as at by from want need get got have has
make please before after so we our us they them then than about just really sure into out
up down over all any some no not
""".split())


def words(s: str) -> set:
    return {w for w in re.findall(r"[a-z][a-z-]{2,}", s.lower())} - STOP


def read_description(spec: str) -> str:
    """Read a SKILL.md description from a path or a `git-ref:path` spec."""
    if ":" in spec:
        ref, _, path = spec.partition(":")
        r = subprocess.run(["git", "show", f"{ref}:{path}"], capture_output=True, text=True)
        text = r.stdout if r.returncode == 0 else ""
    else:
        text = open(spec, encoding="utf-8").read()
    if not text.startswith("---"):
        sys.exit(f"no frontmatter in {spec}")
    fm = text[4:4 + re.search(r"^---\s*$", text[4:], re.M).start()]
    m = re.search(r"^description:\s*[|>]\s*\n((?:[ \t]+.*\n?)*)", fm, re.M)
    if not m:
        sys.exit(f"no folded/block description in {spec}")
    body = " ".join(l.strip() for l in m.group(1).splitlines() if l.strip())
    return re.sub(r"\s+", " ", body).strip()


def strip_not_list(desc: str) -> str:
    """Drop the trailing `Do NOT use for ...` clause.

    Word overlap reads that clause as evidence the skill is ABOUT the things it
    excludes, so leaving it in inflates negative-prompt coverage for a change whose
    real effect is to suppress false firing. Removing it from both sides gives the
    pessimistic-for-the-trim reading of the same rewrite.
    """
    m = re.search(r"\bDo NOT use for\b", desc)
    return desc[:m.start()].strip() if m else desc


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--old", required=True, help="path or git-ref:path of the pre-trim SKILL.md")
    ap.add_argument("--new", required=True, help="path of the post-trim SKILL.md")
    ap.add_argument("--eval", required=True, help="path to eval-suite.json")
    ap.add_argument("--strip-not-list", action="store_true",
                    help="recompute with the `Do NOT use for ...` clause removed from both sides")
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args()

    old_full, new = read_description(a.old), read_description(a.new)
    # The whole point: compare against what was VISIBLE, not what was authored.
    old = old_full if len(old_full) <= CAP else old_full[:CAP - 1]

    if a.strip_not_list:
        old, new = strip_not_list(old), strip_not_list(new)

    suite = json.load(open(a.eval, encoding="utf-8"))
    triggers = suite.get("triggers", [])
    pos = [t for t in triggers if t.get("should_trigger")]
    neg = [t for t in triggers if not t.get("should_trigger")]
    ow, nw = words(old), words(new)

    def cov(t, w):
        pwords = words(t["prompt"])
        return len(pwords & w) / len(pwords) if pwords else 0.0

    rows = [(t["prompt"], cov(t, ow), cov(t, nw)) for t in pos]
    better = sum(1 for _, o, n in rows if n > o + 1e-3)
    worse = sum(1 for _, o, n in rows if n < o - 1e-3)
    same = len(rows) - better - worse

    pm_o = sum(o for _, o, _ in rows) / len(rows) if rows else 0
    pm_n = sum(n for _, _, n in rows) / len(rows) if rows else 0
    nm_o = sum(cov(t, ow) for t in neg) / len(neg) if neg else 0
    nm_n = sum(cov(t, nw) for t in neg) / len(neg) if neg else 0

    result = {
        "strip_not_list": bool(a.strip_not_list),
        "old_chars_authored": len(old_full),
        "old_chars_scored": len(old),
        "new_chars_scored": len(new),
        "positives": len(pos), "negatives": len(neg),
        "better": better, "same": same, "worse": worse,
        "positive_mean": {"before": round(pm_o, 4), "after": round(pm_n, 4)},
        "negative_mean": {"before": round(nm_o, 4), "after": round(nm_n, 4)},
        "separation": {"before": round(pm_o - nm_o, 4), "after": round(pm_n - nm_n, 4)},
        "improved": [{"prompt": p, "before": round(o, 3), "after": round(n, 3)}
                     for p, o, n in rows if n > o + 1e-3],
        "regressions": [{"prompt": p, "before": round(o, 3), "after": round(n, 3)}
                        for p, o, n in rows if n < o - 1e-3],
    }

    if a.json:
        print(json.dumps(result, indent=2))
        return 0

    label = "  (Do NOT list stripped from both sides)" if a.strip_not_list else ""
    print(f"authored {len(old_full):,} chars, but only {min(len(old_full), CAP - 1):,} were "
          f"VISIBLE (cap {CAP})  ->  now {len(new):,} scored{label}\n")
    print(f"  positives ({len(pos)}):  {better} better · {same} same · {worse} worse")
    print(f"  positive mean coverage   {pm_o:.4f} -> {pm_n:.4f}")
    print(f"  negative mean coverage   {nm_o:.4f} -> {nm_n:.4f}   (lower is better)")
    print(f"  separation               {pm_o - nm_o:+.4f} -> {pm_n - nm_n:+.4f}")
    if result["improved"]:
        print("\n  improved:")
        for r in result["improved"]:
            print(f"    {r['before']:.3f} -> {r['after']:.3f}  {r['prompt'][:70]}")
    if result["regressions"]:
        print("\n  regressions:")
        for r in result["regressions"]:
            print(f"    {r['before']:.3f} -> {r['after']:.3f}  {r['prompt'][:70]}")
    print("\n  NOTE: word overlap cannot see trigger-condition restructuring. Run\n"
          "  check_skill_descriptions.py --compare and read the NARROWED rows too.\n"
          "  Getting under the cap means NOT TRUNCATED, not GUARANTEED VISIBLE — the\n"
          "  shared skillListingBudgetFraction can still collapse an entry to a bare name.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
