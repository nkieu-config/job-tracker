import "server-only";

import type { StoredJdAnalysis } from "@/lib/schemas/jd-analysis";
import { matchSkills } from "@/lib/skills";
import { getResumeText } from "@/server/data/resumes";

// `skillMatches` is stored by the analyzer, so the normal path already knows
// the answer. Only an analysis predating that field falls back to lexical
// matching here — the one case that needs the resume text itself, and the one
// case worth a second round-trip for it.
export async function resolveSkillGap(
  analysis: StoredJdAnalysis | null,
  userId: string,
): Promise<{ matched: string[]; missing: string[] } | null> {
  if (!analysis) return null;
  const stored = analysis.skillMatches;
  if (!stored) {
    return matchSkills(analysis.requiredSkills, await getResumeText(userId));
  }
  return {
    matched: analysis.requiredSkills.filter((s) => stored.includes(s)),
    missing: analysis.requiredSkills.filter((s) => !stored.includes(s)),
  };
}
