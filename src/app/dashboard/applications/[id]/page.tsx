import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/server/get-session";
import { formatDisplayDate } from "@/lib/format";
import { getApplication } from "@/server/data/applications";
import { getResumeText, getResumeTextMeta } from "@/server/data/resumes";
import { storedJdAnalysisSchema } from "@/lib/schemas/jd-analysis";
import { matchSkills } from "@/lib/skills";
import { fitBand } from "@/components/ui/fit-score";
import { buttonClass } from "@/components/ui/button";
import { cardClass } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge, badgeClass } from "@/components/ui/badge";
import { SectionNav, type Section } from "@/components/applications/section-nav";
import { getResumeFitScores } from "@/server/data/embeddings";
import { Sparkles } from "lucide-react";
import { StatusBadge } from "@/components/applications/status-badge";
import { DeleteApplicationButton } from "@/components/applications/delete-application-button";
import { AnalyzeButton } from "@/components/applications/analyze-button";
import { ComputeFitButton } from "@/components/applications/compute-fit-button";
import { TailorBullets } from "@/components/applications/tailor-bullets";
import { InterviewPrep } from "@/components/applications/interview-prep";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const session = await requireSession();
  const application = await getApplication(id, session.user.id);

  if (!application) {
    return { title: "Application not found" };
  }
  return { title: `${application.role} at ${application.company}` };
}

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const userId = session.user.id;

  // These three reads are independent (each keyed only by userId/id), so run
  // them in parallel instead of waterfalling three DB round-trips.
  const [application, resumes, fitScores] = await Promise.all([
    getApplication(id, userId),
    getResumeTextMeta(userId),
    getResumeFitScores(id, userId),
  ]);

  if (!application) {
    notFound();
  }

  // Parse the stored AI analysis (it was validated before saving, but the DB
  // column is untyped JSON, so validate again on the way out).
  const analysisResult = storedJdAnalysisSchema.safeParse(application.analysis);
  const analysis = analysisResult.success ? analysisResult.data : null;

  // `skillMatches` is stored by the analyzer, so the normal path already knows
  // the answer. Only an analysis predating that field falls back to lexical
  // matching here — the one case that needs the resume text itself, and the one
  // case worth a second round-trip for it.
  const gap = analysis
    ? analysis.skillMatches
      ? {
          matched: analysis.requiredSkills.filter((s) =>
            analysis.skillMatches?.includes(s),
          ),
          missing: analysis.requiredSkills.filter(
            (s) => !analysis.skillMatches?.includes(s),
          ),
        }
      : matchSkills(analysis.requiredSkills, await getResumeText(userId))
    : null;
  const analysisStale =
    analysis?.skillMatches !== undefined &&
    application.analyzedAt !== null &&
    resumes.some((r) => r.createdAt > application.analyzedAt!);

  const hasJd = Boolean(application.jobDescription?.trim());
  const sections: Section[] = [
    ...(application.jobDescription
      ? [{ id: "job-description", label: "Job description" }]
      : []),
    { id: "skills-analysis", label: "Skills analysis" },
    { id: "resume-fit", label: "Resume fit" },
    ...(hasJd
      ? [
          { id: "tailor-bullets", label: "Tailor bullets" },
          { id: "interview-prep", label: "Interview prep" },
        ]
      : []),
    ...(application.notes ? [{ id: "notes", label: "Notes" }] : []),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/dashboard/applications"
          className="text-body font-sans font-bold text-ink-mute hover:text-ink transition-colors"
        >
          ← Applications
        </Link>
        <div className="mt-2 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="font-display-md text-ink tracking-tight">
              {application.role}
            </h1>
            <p className="mt-2 font-sans text-body-lg text-ink-mute">{application.company}</p>
          </div>
          <div className="flex w-full sm:w-auto items-center gap-2">
            <Link
              href={`/dashboard/applications/${application.id}/edit`}
              className={buttonClass({
                variant: "secondary",
                className: "flex-1 sm:flex-none",
              })}
            >
              Edit
            </Link>
            <div className="flex-1 sm:flex-none *:w-full">
              <DeleteApplicationButton id={application.id} />
            </div>
          </div>
        </div>
      </div>

      <SectionNav sections={sections} />

      <dl className={cardClass("grid gap-4 p-8 sm:grid-cols-2")}>
        <div>
          <dt className="text-body font-sans font-medium text-ink-mute">
            Status
          </dt>
          <dd className="mt-2">
            <StatusBadge status={application.status} />
          </dd>
        </div>
        <div>
          <dt className="text-body font-sans font-medium text-ink-mute">
            Deadline
          </dt>
          <dd className="mt-2 text-body-lg font-sans font-bold text-ink">
            {application.deadline
              ? formatDisplayDate(application.deadline)
              : "—"}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-body font-sans font-medium text-ink-mute">
            Job URL
          </dt>
          <dd className="mt-2 text-body-lg font-sans">
            {application.jobUrl ? (
              <a
                href={application.jobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all font-bold text-link-blue underline-offset-4 hover:underline hover:text-link-hover"
              >
                {application.jobUrl}
              </a>
            ) : (
              <span className="text-ink-mute">—</span>
            )}
          </dd>
        </div>
      </dl>

      {application.jobDescription && (
        <section id="job-description" className="scroll-mt-20">
          <h2 className="text-title font-sans font-bold text-ink">
            Job description
          </h2>
          <p className="mt-4 whitespace-pre-wrap text-body-lg font-sans text-ink">
            {application.jobDescription}
          </p>
        </section>
      )}

      <section id="skills-analysis" className="scroll-mt-20 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-title font-sans font-bold text-ink">
            Skills analysis
          </h2>
          {application.jobDescription?.trim() && (
            <div className="w-full sm:w-auto">
              <AnalyzeButton
                id={application.id}
                label={analysis ? "Re-analyze" : "Analyze job description"}
              />
            </div>
          )}
        </div>

        {!application.jobDescription?.trim() ? (
          <div className="rounded-2xl border border-hairline p-8 text-center bg-canvas-lavender flex flex-col items-center justify-center gap-2 shadow-sm">
            <Sparkles size={24} className="text-primary" aria-hidden="true" />
            <p className="font-sans text-body-lg text-ink">
              <b>Unlock AI Skills Analysis</b>
            </p>
            <p className="font-sans text-body text-ink-mute">
              Edit this application and paste the Job Description to automatically extract required skills.
            </p>
            <Link
              href={`/dashboard/applications/${application.id}/edit`}
              className="mt-2 inline-flex items-center justify-center bg-canvas text-link-blue font-sans font-bold text-body py-2 px-4 rounded-pill border border-hairline hover:bg-hairline transition-colors"
            >
              Add Job Description
            </Link>
          </div>
        ) : !analysis ? (
          <EmptyState className="p-8">
            Not analyzed yet — run “Analyze job description”.
          </EmptyState>
        ) : (
          <div className={cardClass("flex flex-col gap-6 p-8")}>
            <div>
              <p className="text-body-lg font-sans text-ink">
                {analysis.summary}
              </p>
              <p className="mt-2 text-body font-sans text-ink-mute">
                Seniority:{" "}
                <span className="font-bold text-ink">
                  {analysis.seniority}
                </span>
              </p>
            </div>

            <div>
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-body font-sans font-medium text-ink-mute">
                  Required skills
                </h3>
                {gap && resumes.length > 0 && (
                  <span className="text-body font-sans text-ink-mute">
                    {gap.matched.length}/{analysis.requiredSkills.length} in your
                    resume
                  </span>
                )}
              </div>
              <ul className="mt-3 flex flex-wrap gap-2">
                {analysis.requiredSkills.map((skill) => {
                  const matched = gap?.matched.includes(skill);
                  const tone =
                    resumes.length === 0
                      ? "neutral"
                      : matched
                        ? "success"
                        : "error";
                  return (
                    <li key={skill} className={badgeClass({ tone, size: "md" })}>
                      {skill}
                      {resumes.length > 0 && (matched ? " ✓" : " ✗")}
                    </li>
                  );
                })}
              </ul>
              {resumes.length === 0 && (
                <p className="mt-3 text-body font-sans text-ink-mute">
                  Upload a resume to see which skills you’re missing.
                </p>
              )}
            </div>

            {analysis.niceToHave.length > 0 && (
              <div>
                <h3 className="text-body font-sans font-medium text-ink-mute">
                  Nice to have
                </h3>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {analysis.niceToHave.map((skill) => (
                    <li
                      key={skill}
                      className={badgeClass({ tone: "neutral", size: "md" })}
                    >
                      {skill}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {gap && resumes.length > 0 && gap.missing.length > 0 && (
              <p className="text-body-lg font-sans text-ink-mute">
                <span className="font-bold text-ink">
                  Gap:
                </span>{" "}
                consider adding {gap.missing.join(", ")} to your resume.
              </p>
            )}

            {analysisStale && (
              <p className="rounded-lg bg-semantic-warning-tint px-4 py-3 text-body font-sans font-medium text-ink">
                You&rsquo;ve uploaded resumes since this analysis — re-analyze
                to refresh the skill matching.
              </p>
            )}
          </div>
        )}
      </section>

      <section id="resume-fit" className="scroll-mt-20 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-title font-sans font-bold text-ink">
            Resume fit
          </h2>
          {application.jobDescription?.trim() && (
            <div className="w-full sm:w-auto">
              <ComputeFitButton
                id={application.id}
                label={fitScores.length ? "Recompute fit" : "Compute resume fit"}
              />
            </div>
          )}
        </div>

        {!application.jobDescription?.trim() ? (
          <div className="rounded-2xl border border-hairline p-8 text-center bg-canvas-lavender flex flex-col items-center justify-center gap-2 shadow-sm">
            <Sparkles size={24} className="text-primary" aria-hidden="true" />
            <p className="font-sans text-body-lg text-ink">
              <b>Unlock AI Fit Scoring</b>
            </p>
            <p className="font-sans text-body text-ink-mute">
              Paste the Job Description to rank your uploaded resumes and find your best match.
            </p>
          </div>
        ) : fitScores.length === 0 ? (
          <EmptyState className="p-8">
            {resumes.some((r) => r.hasText)
              ? "No fit scores yet — run “Compute resume fit” to rank your resumes against this JD."
              : "Upload a resume with readable text, then compute fit."}
          </EmptyState>
        ) : (
          <div className="flex flex-col gap-3">
            <ul className="flex flex-col gap-3">
              {fitScores.map((fit, i) => {
                const band = fitBand(fit.score);
                return (
                  <li
                    key={fit.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-hairline bg-canvas px-6 py-4"
                  >
                    <Link
                      href={`/dashboard/resumes/${fit.id}`}
                      className="min-w-0 truncate font-sans font-bold text-link-blue hover:text-link-hover hover:underline"
                    >
                      {fit.label}
                    </Link>
                    <div className="flex shrink-0 items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-none border-hairline pt-3 sm:pt-0">
                      {i === 0 && fitScores.length > 1 && (
                        <Badge tone="primary" size="sm">
                          Best match
                        </Badge>
                      )}
                      <Badge tone={band.tone} size="sm">
                        {band.label}
                      </Badge>
                      <span className="font-display-md text-ink tabular-nums">
                        {Math.round(fit.score * 100)}%
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="font-sans text-body text-ink-mute">
              Scores are the cosine similarity between this job description and
              each resume&rsquo;s embedding, computed in Postgres with pgvector.
              Use them to compare your resume versions — the percentage is
              relative, not a hiring probability.
            </p>
          </div>
        )}
      </section>

      {application.jobDescription?.trim() && (
        <section id="tailor-bullets" className="scroll-mt-20 flex flex-col gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-title font-sans font-bold text-ink">
              <Sparkles size={18} className="text-primary" aria-hidden="true" />
              Tailor resume bullets
            </h2>
            <p className="mt-2 font-sans text-body-lg text-ink-mute">
              Paste an experience and the AI rewrites it as bullets tuned to this
              job — streamed live.
            </p>
          </div>
          <TailorBullets
            id={application.id}
            initialExperience={application.tailoredExperience ?? ""}
            initialOutput={application.tailoredBullets ?? ""}
          />
        </section>
      )}

      {application.jobDescription?.trim() && (
        <section id="interview-prep" className="scroll-mt-20 flex flex-col gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-title font-sans font-bold text-ink">
              <Sparkles size={18} className="text-primary" aria-hidden="true" />
              Interview prep
            </h2>
            <p className="mt-2 font-sans text-body-lg text-ink-mute">
              Generate likely technical and behavioral questions for this job,
              with pointers on what strong answers cover.
            </p>
          </div>
          <InterviewPrep
            id={application.id}
            initialOutput={application.interviewPrep ?? ""}
          />
        </section>
      )}

      {application.notes && (
        <section id="notes" className="scroll-mt-20">
          <h2 className="text-title font-sans font-bold text-ink">
            Notes
          </h2>
          <p className="mt-4 whitespace-pre-wrap text-body-lg font-sans text-ink">
            {application.notes}
          </p>
        </section>
      )}
    </div>
  );
}
