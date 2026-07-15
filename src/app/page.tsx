import Link from "next/link";
import Image from "next/image";
import { Sparkles, Target, MessagesSquare } from "lucide-react";
import { DemoButton } from "@/components/auth/demo-button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SkipLink } from "@/components/ui/skip-link";
import { Reveal } from "@/components/ui/reveal";

const METRICS = [
  {
    value: "4",
    label: "AI features",
    hint: "every one measured, not just shipped",
  },
  {
    value: "250+",
    label: "Automated tests",
    hint: "plus a 3-suite AI eval harness",
  },
  {
    value: "+8.3",
    label: "Points of recall",
    hint: "from the semantic-matching layer",
  },
  {
    value: "768-d",
    label: "Vector embeddings",
    hint: "pgvector cosine ranking, HNSW index",
  },
];

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI job-description analysis",
    body: "Paste a JD and Gemini extracts required skills, seniority, and a summary — then semantically matches every skill against your resume to reveal your gaps.",
  },
  {
    icon: Target,
    title: "Resume fit scoring",
    body: "Every resume version is embedded and ranked against the job with pgvector cosine similarity, labeled Strong / Moderate / Weak so you always send the right one.",
  },
  {
    icon: MessagesSquare,
    title: "Interview prep & tailored bullets",
    body: "Generate likely technical and behavioral questions from the JD, and rewrite your experience into tailored resume bullets — streamed live, saved to the application.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-canvas">
      <SkipLink />
      <header className="flex items-center justify-between px-4 py-4 md:px-12 lg:px-24 bg-canvas z-10 relative">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center shrink-0">
            <span className="text-on-primary font-bold text-xl leading-none">J</span>
          </div>
          <span className="font-display-sm text-primary tracking-tight">Job Tracker</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 font-sans font-medium text-ink">
          <Link href="#features" className="hover:text-primary transition-colors">
            Features
          </Link>
          <a
            href="https://github.com/nkieu-config/job-tracker-app-project"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            GitHub
          </a>
        </nav>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link
            href="/sign-in"
            className="hidden sm:inline-flex items-center justify-center font-sans font-bold text-body-lg text-ink hover:text-primary transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="inline-flex items-center justify-center bg-primary text-on-primary font-sans font-bold text-body sm:text-body-lg tracking-[0.2px] py-2.5 px-5 sm:py-3.5 sm:px-7 rounded-pill transition-colors hover:bg-primary-press whitespace-nowrap"
          >
            Try For Free
          </Link>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        <section className="flex flex-col items-center bg-pastel-mesh pt-16 pb-24 px-6 overflow-hidden relative">
          <div className="max-w-[1000px] w-full flex flex-col items-center text-center z-10">
            <h1 className="font-display-xxl text-ink mb-6 max-w-4xl">
              Track your applications.<br />Land your dream job.
            </h1>
            <p className="font-sans text-title text-ink max-w-2xl leading-[1.55] mb-10">
              Drag your pipeline forward on a kanban board while AI analyzes job
              descriptions, scores your resumes, and preps you for the interview.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link
                href="/sign-up"
                className="w-full sm:w-auto inline-flex items-center justify-center bg-primary text-on-primary font-sans font-bold text-body-lg sm:text-title py-3.5 sm:py-4.5 px-6 sm:px-9 rounded-pill shadow-[0_5px_20px_rgba(0,0,0,0.1)] transition-transform hover:scale-105 whitespace-nowrap"
              >
                Get started for free
              </Link>
              <DemoButton
                label="Try Live Demo"
                className="w-full sm:w-auto inline-flex items-center justify-center bg-canvas-lavender text-primary border-2 border-primary font-sans font-bold text-body-lg sm:text-title py-3 sm:py-4 px-6 sm:px-9 rounded-pill transition-transform hover:scale-105 whitespace-nowrap"
              />
            </div>
          </div>

          <div className="mt-16 w-full max-w-5xl bg-canvas rounded-2xl shadow-[0_20px_60px_rgba(74,21,75,0.1)] border border-hairline overflow-hidden z-10 flex flex-col">
            <div className="h-12 border-b border-hairline flex items-center px-4 gap-2 bg-canvas-lavender">
              <div className="w-3 h-3 rounded-full bg-semantic-error-tint border border-semantic-error"></div>
              <div className="w-3 h-3 rounded-full bg-semantic-warning-tint border border-semantic-warning"></div>
              <div className="w-3 h-3 rounded-full bg-semantic-success-tint border border-semantic-success"></div>
            </div>
            <Image
              src="/landing/board-light.png"
              alt="The Job Tracker application board, with roles grouped into Saved, Applied, Interview and Offer columns"
              width={2560}
              height={1600}
              className="block h-auto w-full dark:hidden"
            />
            <Image
              src="/landing/board-dark.png"
              alt=""
              aria-hidden="true"
              width={2560}
              height={1600}
              className="hidden h-auto w-full dark:block"
            />
          </div>
        </section>

        <section className="bg-canvas-lavender px-6 py-20 md:px-12">
          <div className="mx-auto w-full max-w-5xl">
            <Reveal className="mx-auto max-w-2xl text-center">
              <h2 className="font-display-md text-ink">
                Not just AI features — measured ones
              </h2>
              <p className="mt-3 font-sans text-body-lg leading-relaxed text-ink-mute">
                Every model call is evaluated, not assumed. The rule this
                project held to: an AI feature that isn&rsquo;t measured
                doesn&rsquo;t ship.
              </p>
            </Reveal>
            <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
              {METRICS.map((metric, i) => (
                <Reveal key={metric.label} delay={i * 80} className="h-full">
                  <div className="flex h-full flex-col gap-1 rounded-2xl border border-hairline bg-canvas p-6 text-center shadow-sm">
                    <span className="font-display-md text-primary tabular-nums">
                      {metric.value}
                    </span>
                    <span className="font-sans text-body font-bold text-ink">
                      {metric.label}
                    </span>
                    <span className="font-sans text-caption leading-snug text-ink-mute">
                      {metric.hint}
                    </span>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="scroll-mt-24 bg-canvas px-6 py-24 md:px-12">
          <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-12">
            <Reveal className="max-w-2xl text-center">
              <h2 className="font-display-lg text-ink">
                Your job hunt, with an AI copilot
              </h2>
              <p className="mt-4 font-sans text-title leading-[1.55] text-ink-mute">
                Four AI features built on Gemini and pgvector do the tedious
                parts, so you can focus on interviews.
              </p>
            </Reveal>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {FEATURES.map((feature, i) => (
                <Reveal key={feature.title} delay={i * 100} className="h-full">
                  <div className="flex h-full flex-col gap-4 rounded-2xl border border-hairline bg-canvas-lavender p-8">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-on-primary">
                      <feature.icon size={22} aria-hidden="true" />
                    </span>
                    <h3 className="font-sans text-title font-bold text-ink">
                      {feature.title}
                    </h3>
                    <p className="font-sans text-body-lg leading-relaxed text-ink-mute">
                      {feature.body}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-surface-aubergine text-on-primary py-24 px-6 md:px-12 flex flex-col items-center text-center">
        <h2 className="font-display-lg mb-8 max-w-3xl">
          Ready to simplify your job search?
        </h2>
        <Link
            href="/sign-up"
            className="inline-flex items-center justify-center bg-canvas text-primary font-sans font-bold text-body-lg sm:text-title py-3.5 sm:py-4.5 px-8 sm:px-12 rounded-pill shadow-lg transition-transform hover:scale-105 whitespace-nowrap"
          >
            Start tracking now
          </Link>
        <div className="mt-16 pt-8 border-t border-primary-tint w-full max-w-5xl flex flex-col md:flex-row justify-between items-center text-on-aubergine-mute text-body font-sans">
          <p>© 2026 Job Tracker. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a
              href="https://github.com/nkieu-config/job-tracker-app-project"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-on-primary underline"
            >
              View source on GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
