export const RESUMES = [
  {
    id: "demo_resume_3",
    label: "Backend-focused v3 (senior)",
    ageDays: 10,
    content: `Jordan Lee — Senior Backend Engineer
jordan.lee@example.com · github.com/jordanlee-dev · Bangkok / Remote (UTC+7)

SKILLS
TypeScript, Node.js, PostgreSQL, REST APIs, AWS, Docker, Redis, CI/CD, Terraform, Express, Prisma, Git

EXPERIENCE
Senior Backend Engineer, Globex (2024–2026)
- Designed and scaled the core REST APIs in Node.js and TypeScript from 1M to 5M+ requests/day across three product lines.
- Tuned PostgreSQL schemas, indexes and connection pooling for sub-50ms p95 reads on the hottest endpoints.
- Introduced Redis caching for session and catalog reads, cutting database load by roughly 40%.
- Ran containerised workloads in production on AWS with autoscaling and zero-downtime deploys.
- Mentored two junior engineers through their first production incidents and on-call rotations.

Backend Engineer, Initech (2022–2024)
- Built REST APIs backed by PostgreSQL and Redis caching layers for the billing and reporting teams.
- Owned the CI/CD pipelines and moved infrastructure definitions to Terraform.
- Cut deploy time from 25 minutes to 8 by parallelising the test and build stages.

PROJECTS
- open-ledger — an open-source double-entry bookkeeping API in TypeScript + PostgreSQL; 300+ GitHub stars.
- pgpool-primer — a write-up and benchmark suite on PostgreSQL connection pooling under serverless load.

EDUCATION
B.Sc. Computer Science`,
  },
  {
    id: "demo_resume_1",
    label: "Backend-focused v2",
    ageDays: 30,
    content: `Jordan Lee — Software Engineer
jordan.lee@example.com · github.com/jordanlee-dev

SKILLS
TypeScript, JavaScript, Node.js, Express, React, Next.js, PostgreSQL, Prisma, Docker, AWS, Git, REST APIs

EXPERIENCE
Backend Engineer, Globex (2023–2025)
- Built and maintained Node.js + TypeScript services backed by PostgreSQL.
- Designed REST APIs serving 2M+ requests/day; cut p95 latency by 35%.
- Containerised services with Docker and deployed on AWS behind an application load balancer.
- Wrote integration tests against a real database in CI, raising coverage on the payments path to 90%.

Full-Stack Developer, Initech (2021–2023)
- Shipped React/Next.js features end to end, from Prisma schema to UI.
- Introduced Prisma and repeatable database migrations to the team.
- Built an internal admin dashboard used daily by 30+ support staff.

PROJECTS
- open-ledger — double-entry bookkeeping API in TypeScript + PostgreSQL.

EDUCATION
B.Sc. Computer Science`,
  },
  {
    id: "demo_resume_2",
    label: "Frontend-focused v1",
    ageDays: 45,
    content: `Jordan Lee — Frontend Engineer
jordan.lee@example.com · github.com/jordanlee-dev

SKILLS
React, Next.js, TypeScript, JavaScript, Tailwind CSS, HTML5, CSS3, Redux, Figma, Git

EXPERIENCE
Frontend Developer, Initech (2023–2025)
- Built responsive user interfaces with React, Next.js and Tailwind CSS for a B2B analytics product.
- Collaborated with designers in Figma to implement pixel-accurate components and a shared token system.
- Improved Core Web Vitals from failing to green on the three highest-traffic pages.
- Added keyboard navigation and screen-reader labels across the checkout flow.

Junior Developer, Globex (2021–2023)
- Maintained legacy React applications and led the migration to Next.js.
- Developed a reusable UI component library adopted by three internal teams.

PROJECTS
- kanban-lite — a drag-and-drop task board in React with optimistic updates.

EDUCATION
B.Sc. Computer Science`,
  },
];

const acmeJd = `About Acme Corp
Acme builds logistics software that moves freight for 4,000+ businesses across Southeast Asia. Our core booking and tracking APIs are the backbone of the product, and the team that owns them is growing.

The role
We are hiring a Senior Backend Engineer to design and scale these core APIs. You will own services end to end — design, implementation, deployment and operations — and work directly with product and data teams.

What you'll do
- Design and evolve REST APIs consumed by web, mobile and 40+ enterprise integrations.
- Scale Node.js + TypeScript services that currently handle ~3M requests/day.
- Model and tune PostgreSQL schemas for high-write tracking workloads.
- Operate services on Kubernetes on AWS, including on-call in a humane rotation.
- Review designs and mentor mid-level engineers.

What we're looking for
- 5+ years building backend services, with strong TypeScript and Node.js.
- Deep, practical PostgreSQL experience — indexing, query plans, migrations at scale.
- A track record of designing and operating REST APIs at scale.
- Production experience with Kubernetes and AWS.

Nice to have
- GraphQL, Kafka, or event-driven architectures.
- Experience in logistics, marketplaces or other high-throughput domains.

What we offer
- ฿180,000–240,000/month depending on experience, plus equity.
- Hybrid: 2 days/week in our Bangkok office (BTS Asok), the rest remote.
- Private health insurance, annual learning budget, 20 days PTO.

Apply with your CV. The process: recruiter call → technical interview → system design → team fit. We reply to every application within a week.`;

const globexJd = `About Globex
Globex runs a B2B commerce platform processing $200M in annual order volume. We are a 60-person engineering org organised in small product squads.

The role — Full-Stack Developer (Squad: Checkout)
You will ship features across the stack: React/Next.js on the front, Node.js services behind a GraphQL gateway on the back. The squad owns checkout conversion end to end.

Responsibilities
- Build and ship user-facing features in React and Next.js with TypeScript.
- Design and extend the GraphQL schema that fronts our order services.
- Write Node.js resolvers and services, backed by PostgreSQL.
- Own quality: tests, monitoring and gradual rollouts for everything you ship.
- Participate in squad planning and quarterly roadmap shaping.

Requirements
- 3+ years of professional experience with React and modern JavaScript.
- Solid Next.js and TypeScript in production.
- Experience building Node.js backend services.
- Working knowledge of GraphQL (schema design, resolvers, caching).

Nice to have
- PostgreSQL performance tuning, Redis, feature-flag driven development.

Compensation & benefits
- $70,000–95,000/year (remote, contractor) or Thai employment with equivalent package.
- Fully remote within UTC+5 to UTC+9; quarterly team on-sites.
- Home-office budget and 4-day onboarding week in Singapore.

Interview process: intro call → live coding (pairing, not leetcode) → system walkthrough → offer. Typically two weeks end to end.`;

const hooliJd = `About Hooli
Hooli's consumer products reach 40M monthly users. The Design Platform team builds the component system and marketing surfaces used by every product squad.

The role — Frontend Engineer, Design Platform
We are looking for a frontend engineer who sweats the details: motion, accessibility, rendering performance. You will work in a tight loop with design.

What you'll do
- Build and maintain our React + Next.js component library and marketing pages.
- Translate Figma specs into pixel-accurate, accessible components.
- Own state patterns (Redux) across a codebase touched by 8 squads.
- Drive Tailwind CSS conventions and design-token architecture.
- Profile and fix rendering and bundle-size regressions.

Requirements
- Deep expertise in React and Next.js.
- Proficiency with Tailwind CSS or an equivalent utility-first system.
- Experience with Redux or comparable state management at scale.
- Comfort working directly in Figma with designers.

Nice to have
- Accessibility (a11y) auditing experience, testing with Jest/Cypress, Storybook.

Package
- ฿120,000–170,000/month + annual bonus.
- Bangkok office (Phrom Phong) with flexible hybrid.
- Health insurance for you and dependents, gym stipend, 18 days PTO.

We review applications daily; the loop is a portfolio review, a practical UI build (take-home, 3 hours max, paid), and two conversations.`;

const piedPiperJd = `Pied Piper — Backend Engineer (Node.js)

We are a 15-person startup building a compression-as-a-service API used by 900+ developers. Our middle-out pipeline is written in Node.js and we are hiring our fourth backend engineer.

What you'll work on
- The public REST API: rate limiting, usage metering, developer keys.
- Ingest services in Node.js + Express that stream files through the compression pipeline.
- Our MongoDB-backed metadata store (schema design, indexes, migration tooling).
- Docker-based local dev and our deployment pipeline.

You should have
- 2+ years with Node.js and Express in production.
- Experience operating MongoDB — data modelling, indexes, profiling.
- Comfort with Docker and container-based deploys.
- The instinct to measure before optimising.

Nice to have
- Streams/backpressure experience, Redis, gRPC.

Details
- $60,000–85,000/year + meaningful early-stage equity (0.1–0.4%).
- Fully remote, async-first; core overlap 14:00–17:00 UTC+7.
- 15 days PTO + local holidays. Annual hardware budget.

Send a short note about the gnarliest production bug you've fixed instead of a cover letter.`;

const aviatoJd = `Aviato — Senior Full-Stack Engineer

Aviato builds market intelligence for the travel industry. Our platform ingests airline and booking data and turns it into dashboards our customers check every morning. We are hiring a senior engineer to lead a pod of three.

The work
- Own features end to end: React front end, Node.js services, PostgreSQL underneath, all on AWS.
- Lead technical design for the pod — you will write the RFCs and review the code.
- Pair with our data engineers on ingestion APIs handling ~50GB/day.
- Set the bar on testing, observability and deployment hygiene.
- Mentor two mid-level engineers; you will not manage, but you will lead.

Must have
- 5+ years across the stack with deep React and Node.js experience.
- Strong PostgreSQL skills — you have designed schemas that lived for years.
- Production AWS experience (ECS or EKS, RDS, S3, IAM).
- Evidence of technical leadership: RFCs, mentoring, incident command.

Nice to have
- Team leadership, travel-industry data, Kafka or Kinesis.

Compensation
- $110,000–140,000/year, remote-first (we are 9 people across 6 time zones).
- 25 days PTO, annual meet-up (last one: Lisbon), $2,000 learning budget.

Process: intro (30m) → technical deep-dive on a past project (60m) → paid work sample (4h) → founder chat.`;

const vandelayJd = `Vandelay Industries — Backend Engineer, Order Platform

Vandelay is modernising a 30-year-old import/export business into an API-first trading platform. The Order Platform team owns the services every trade flows through.

Responsibilities
- Build event-driven services in Node.js + TypeScript on top of Kafka.
- Model orders, shipments and settlements in PostgreSQL.
- Operate workloads on our Kubernetes clusters (EKS) with the platform team.
- Instrument everything: metrics, tracing and alerting are part of done.
- Take part in a light on-call rotation (one week in six).

Requirements
- 3+ years of backend development in Node.js and TypeScript.
- Hands-on Kafka experience: producers, consumers, schema evolution.
- Solid PostgreSQL data modelling.
- Familiarity with Kubernetes-based deployment workflows.

Nice to have
- Go, Terraform, domain experience in logistics or fintech.

What we offer
- ฿150,000–200,000/month, 13th-month bonus.
- Hybrid Bangkok (Sathorn): 3 office days.
- Health + dental, provident fund matching, 15 days PTO growing to 20.

Interviews: recruiter screen → coding interview → event-driven design session → hiring-manager conversation.`;

const tyrellJd = `Tyrell Corporation — Site Reliability Engineer

Tyrell runs replication infrastructure trusted by regulated enterprises. The SRE team keeps a fleet of 400+ services within SLO while the org ships daily.

What you'll do
- Own reliability for services running on Kubernetes across three AWS regions.
- Codify infrastructure in Terraform; review every change that touches production topology.
- Build and tune CI/CD pipelines so deploys stay boring.
- Run blameless incident reviews and drive the follow-ups to done.
- Push Docker image hygiene, resource limits and autoscaling policies.

Requirements
- 4+ years in SRE/platform/infrastructure roles.
- Production Kubernetes operations: upgrades, capacity, debugging workloads.
- Strong Terraform and AWS (VPC, IAM, EKS, RDS).
- Solid CI/CD design experience and Docker fundamentals.

Nice to have
- Golang for tooling, service mesh experience, SOC2/ISO27001 environments.

Package
- $95,000–130,000/year, fully remote (±3h UTC).
- On-call is paid, capped and staffed at n+2.
- 22 days PTO, wellness budget, annual retreat.

We interview in two weeks flat: screen → Linux/K8s troubleshooting lab → infra design → values.`;

const cyberdyneJd = `Cyberdyne Systems — Platform Engineer

Cyberdyne provides ML infrastructure to industrial customers. The platform team builds the paved road every product team deploys on.

The role
- Build and operate our Kubernetes-based internal developer platform.
- Write and maintain the Terraform modules that define our AWS footprint.
- Keep PostgreSQL fleets (RDS) healthy: backups, upgrades, performance baselines.
- Improve golden-path templates so a new service ships to production in under a day.
- Harden container builds and Docker image supply chain.

You bring
- 3+ years of platform/DevOps/backend-infra experience.
- Real Kubernetes operations experience, not just deployments to it.
- Terraform in anger: modules, state management, drift control.
- Working AWS knowledge and solid PostgreSQL administration.
- Docker fundamentals: multi-stage builds, image scanning.

Nice to have
- Helm, ArgoCD, Python or TypeScript for platform tooling.

Offer
- ฿160,000–210,000/month + annual bonus, Bangkok hybrid (2 office days, Rama 9).
- Health insurance incl. family, provident fund, 20 days PTO.

Process: recruiter call → platform design interview → hands-on lab (provided cluster) → team conversations.`;

const soylentJd = `Soylent Corp — Full-Stack Engineer, Subscriptions

Soylent's subscription business is 70% of revenue. This team owns the storefront, the subscription lifecycle and the internal tools behind both.

What you'll do
- Ship customer-facing features in React with a Node.js backend.
- Extend our GraphQL API used by web, iOS and Android clients.
- Model subscription state (pauses, swaps, dunning) in PostgreSQL.
- Build internal tooling that customer support actually enjoys using.
- Watch the funnel dashboards and propose experiments.

Requirements
- 3+ years full-stack experience with React and Node.js.
- Production GraphQL experience — schema design and performance.
- Confident SQL and PostgreSQL data modelling.
- Product sense: you ask why before building what.

Nice to have
- Stripe or other billing-system experience, Next.js, A/B testing frameworks.

Compensation
- $85,000–115,000/year, remote (Americas/Asia overlap friendly).
- Health stipend, 20 days PTO, annual company week.

Our process takes ~10 days: intro → practical pairing on a real (sanitised) ticket → architecture conversation → offer.`;

const oscorpJd = `Oscorp — API Platform Engineer

Oscorp's public API powers 2,000+ partner integrations in life sciences. The API Platform team owns the gateway, event streams and developer experience.

Responsibilities
- Design and evolve REST APIs consumed by external partners under strict compatibility guarantees.
- Operate and extend our Kafka event backbone (200M events/day).
- Build gateway features in Node.js: auth, quotas, request shaping.
- Keep Redis-backed rate limiting and caching layers fast and observable.
- Write the docs and SDK snippets partners rely on.

Requirements
- 4+ years of backend engineering with Node.js.
- Strong REST API design experience, including versioning and deprecation.
- Hands-on Kafka in production.
- GraphQL familiarity — we expose a read-side graph to partners.
- Redis experience for caching or rate limiting.

Nice to have
- gRPC, API security (OAuth2, mTLS), developer-relations exposure.

Package
- $100,000–135,000/year, remote-first with a NYC hub.
- 401(k)/provident equivalents by region, 21 days PTO, conference budget.

Process: screen → API design interview → distributed-systems conversation → partner-scenario roleplay (fun, we promise).`;

export const APPS = [
  { id: "demo_app_1", company: "Acme Corp", role: "Senior Backend Engineer", status: "INTERVIEW", jd: acmeJd, deadlineInDays: 5, ageDays: 12, notes: "Referred by Sam (ex-Globex). Recruiter call with Priya went well — she flagged that the team cares about PostgreSQL depth. System design round scheduled; reviewing their public eng blog on tracking-event fan-out. Salary band confirmed ฿180-240k.", jobUrl: "https://careers.acme.example/jobs/senior-backend-engineer" },
  { id: "demo_app_2", company: "Globex", role: "Full-Stack Developer", status: "APPLIED", jd: globexJd, deadlineInDays: 9, ageDays: 8, notes: "Applied via careers page. I worked at Globex 2023-2025 (different org) — mentioned internal referral from Anan in the application. GraphQL is the gap to talk around; my resolver experience is thin.", jobUrl: "https://globex.example/careers/full-stack-developer" },
  { id: "demo_app_3", company: "Initech", role: "Platform Engineer", status: "OFFER", jd: null, deadlineInDays: 3, ageDays: 25, notes: "OFFER: ฿165k/month + provident fund, 18 days PTO. Responding by Friday. Asked for ฿180k citing Acme band — Nina (recruiter) taking it to the hiring manager. Team seemed great in the final loop; main hesitation is the on-call load they described.", jobUrl: null },
  { id: "demo_app_4", company: "Hooli", role: "Frontend Engineer", status: "SAVED", jd: hooliJd, deadlineInDays: 7, ageDays: 3, notes: "Strong design-system role — fits the frontend resume. Paid take-home (rare, good sign). Apply after the Acme system-design round is done.", jobUrl: "https://jobs.hooli.example/frontend-engineer" },
  { id: "demo_app_5", company: "Stark Industries", role: "DevOps Engineer", status: "REJECTED", jd: null, deadlineInDays: null, ageDays: 30, notes: "Rejected after final round — feedback: strong coding, wanted deeper Kubernetes production experience. Same gap as Vandelay screen. This keeps coming up; prioritising a k8s home-lab project.", jobUrl: null },
  { id: "demo_app_6", company: "Wayne Enterprises", role: "Software Engineer", status: "APPLIED", jd: null, deadlineInDays: 1, ageDays: 6, notes: "Deadline tomorrow — application submitted, confirmation email received. Big-corp process, expecting 2-3 weeks of silence per Glassdoor.", jobUrl: "https://careers.wayne.example/software-engineer" },
  { id: "demo_app_7", company: "Pied Piper", role: "Backend Engineer (Node.js)", status: "APPLIED", jd: piedPiperJd, deadlineInDays: 12, ageDays: 4, notes: "Sent the 'gnarliest bug' note about the connection-pool exhaustion incident instead of a cover letter — exactly their style. MongoDB is a gap; everything else matches well.", jobUrl: null },
  { id: "demo_app_8", company: "Aviato", role: "Senior Full-Stack Engineer", status: "INTERVIEW", jd: aviatoJd, deadlineInDays: 2, ageDays: 15, notes: "Technical deep-dive done (walked through open-ledger). Paid work sample due Thursday — 4h cap, building an ingestion endpoint with tests. Erlich (founder) joins the final chat. They liked the RFC writing samples.", jobUrl: "https://aviato.example/join/senior-full-stack-engineer" },
  { id: "demo_app_9", company: "Raviga", role: "Software Engineer, Payments", status: "SAVED", jd: null, deadlineInDays: 14, ageDays: 1, notes: "From Monica's LinkedIn post. Payments experience is light — worth applying anyway, JD not published yet, waiting for the full posting.", jobUrl: null },
  { id: "demo_app_10", company: "Umbrella Corp", role: "Site Reliability Engineer", status: "SAVED", jd: null, deadlineInDays: null, ageDays: 2, notes: null, jobUrl: null },
  { id: "demo_app_11", company: "Massive Dynamic", role: "Staff Engineer", status: "REJECTED", jd: null, deadlineInDays: null, ageDays: 40, notes: "Auto-rejection after 2 weeks. Staff was a stretch at this point — no regrets, calibration data.", jobUrl: null },
  { id: "demo_app_12", company: "Vandelay Industries", role: "Backend Engineer, Order Platform", status: "APPLIED", jd: vandelayJd, deadlineInDays: 10, ageDays: 18, notes: "Recruiter screen done with Kob — friendly, asked mostly about event-driven experience. Honest about Kafka being new to me; she said the design round weighs modelling over tool trivia. Waiting on scheduling.", jobUrl: "https://vandelay.example/careers/backend-order-platform" },
  { id: "demo_app_13", company: "Bluth Company", role: "Junior Full-Stack Developer", status: "REJECTED", jd: null, deadlineInDays: null, ageDays: 47, notes: "Applied early on when calibrating level — rejected as overqualified. Correctly so.", jobUrl: null },
  { id: "demo_app_14", company: "Tyrell Corporation", role: "Site Reliability Engineer", status: "APPLIED", jd: tyrellJd, deadlineInDays: 8, ageDays: 21, notes: "Their two-week loop appeals. Terraform and CI/CD match well; Kubernetes operations depth is the honest gap — the troubleshooting lab will expose it. Doing k8s-the-hard-way this weekend.", jobUrl: "https://tyrell.example/jobs/sre" },
  { id: "demo_app_15", company: "Wonka Industries", role: "Software Engineer", status: "APPLIED", jd: null, deadlineInDays: null, ageDays: 23, notes: null, jobUrl: "https://wonka.example/careers/software-engineer" },
  { id: "demo_app_16", company: "Gekko & Co", role: "Backend Developer", status: "REJECTED", jd: null, deadlineInDays: null, ageDays: 52, notes: "Rejected at CV screen. Fintech shop wanting exchange experience.", jobUrl: null },
  { id: "demo_app_17", company: "Cyberdyne Systems", role: "Platform Engineer", status: "INTERVIEW", jd: cyberdyneJd, deadlineInDays: 6, ageDays: 9, notes: "Passed the platform design interview — interviewer liked the Terraform drift-control answer. Hands-on lab next Tuesday on their provided cluster. Need reps on kubectl debugging: rehearsing crashloop/oomkill/dns scenarios.", jobUrl: "https://cyberdyne.example/careers/platform-engineer" },
  { id: "demo_app_18", company: "Duff Beverages", role: "Full-Stack Engineer", status: "APPLIED", jd: null, deadlineInDays: null, ageDays: 27, notes: "Referral from Moe. No response in 3+ weeks — nudged the referrer once, will close it out at the one-month mark.", jobUrl: null },
  { id: "demo_app_19", company: "Sterling Cooper Digital", role: "Frontend Developer", status: "REJECTED", jd: null, deadlineInDays: null, ageDays: 58, notes: "Agency work, rejected after intro call — mutual mismatch on client-rotation model.", jobUrl: null },
  { id: "demo_app_20", company: "Soylent Corp", role: "Full-Stack Engineer, Subscriptions", status: "APPLIED", jd: soylentJd, deadlineInDays: 15, ageDays: 11, notes: "Practical pairing round is on a real sanitised ticket — refreshing. GraphQL required here too (third posting this month). Their process fits around Aviato's timeline.", jobUrl: "https://soylent.example/jobs/full-stack-subscriptions" },
  { id: "demo_app_21", company: "Oceanic Airlines", role: "Software Engineer", status: "APPLIED", jd: null, deadlineInDays: null, ageDays: 33, notes: null, jobUrl: "https://oceanic.example/careers/6815" },
  { id: "demo_app_22", company: "Nakatomi Trading", role: "Backend Engineer", status: "REJECTED", jd: null, deadlineInDays: null, ageDays: 63, notes: "Position filled internally after two rounds. Interviewer connected on LinkedIn — keep warm for next opening.", jobUrl: null },
  { id: "demo_app_23", company: "Oscorp", role: "API Platform Engineer", status: "APPLIED", jd: oscorpJd, deadlineInDays: 13, ageDays: 7, notes: "Dream-adjacent role: public API design + partner docs. Kafka and GraphQL both required — the pattern across my rejections. open-ledger's versioned API is the portfolio piece to lead with.", jobUrl: "https://oscorp.example/careers/api-platform" },
  { id: "demo_app_24", company: "Weyland Industries", role: "Node.js Developer", status: "APPLIED", jd: null, deadlineInDays: null, ageDays: 38, notes: "No response in 5 weeks. Marking as ghosted at day 45.", jobUrl: null },
  { id: "demo_app_25", company: "Prestige Worldwide", role: "Web Engineer", status: "SAVED", jd: null, deadlineInDays: 11, ageDays: 5, notes: null, jobUrl: "https://prestige.example/join/web-engineer" },
  { id: "demo_app_26", company: "Dinoco", role: "Software Engineer, Internal Tools", status: "APPLIED", jd: null, deadlineInDays: null, ageDays: 70, notes: "Applied at the very start of the search. Never heard back — the application that started this tracker.", jobUrl: null },
  { id: "demo_app_27", company: "Monsters Inc", role: "Integrations Engineer", status: "APPLIED", jd: null, deadlineInDays: null, ageDays: 44, notes: null, jobUrl: null },
  { id: "demo_app_28", company: "Virtucon", role: "Full-Stack Developer", status: "REJECTED", jd: null, deadlineInDays: null, ageDays: 76, notes: "Take-home returned with kind, detailed feedback: solid code, wanted more tests. Fixed that habit — every take-home since ships with a test suite.", jobUrl: null },
  { id: "demo_app_29", company: "InGen", role: "Backend Engineer", status: "APPLIED", jd: null, deadlineInDays: null, ageDays: 49, notes: null, jobUrl: "https://ingen.example/careers/backend" },
  { id: "demo_app_30", company: "Zorg Industries", role: "Software Engineer", status: "SAVED", jd: null, deadlineInDays: 21, ageDays: 0, notes: "Saved from this morning's job-board sweep. Read JD tonight.", jobUrl: "https://zorg.example/jobs/swe-2" },
  { id: "demo_app_31", company: "Paper Street Soap Co", role: "Web Developer", status: "REJECTED", jd: null, deadlineInDays: null, ageDays: 84, notes: "First application of the search. Rejected in 3 days with a form email. Onwards.", jobUrl: null },
  { id: "demo_app_32", company: "Initrode", role: "Full-Stack Developer", status: "SAVED", jd: null, deadlineInDays: 18, ageDays: 4, notes: null, jobUrl: null },
];

export const ANALYSES: Record<
  string,
  { summary: string; seniority: string; requiredSkills: string[]; niceToHave: string[] }
> = {
  demo_app_1: {
    summary: "Senior backend role owning and scaling logistics REST APIs on Node.js, PostgreSQL, Kubernetes and AWS, with mentoring responsibilities.",
    seniority: "senior",
    requiredSkills: ["TypeScript", "Node.js", "PostgreSQL", "REST APIs", "Kubernetes", "AWS"],
    niceToHave: ["GraphQL", "Kafka"],
  },
  demo_app_2: {
    summary: "Full-stack squad role shipping checkout features in React/Next.js over a GraphQL gateway backed by Node.js and PostgreSQL.",
    seniority: "mid",
    requiredSkills: ["React", "Next.js", "Node.js", "TypeScript", "GraphQL"],
    niceToHave: ["PostgreSQL", "Redis"],
  },
  demo_app_4: {
    summary: "Design-platform frontend role building an accessible React/Next.js component system in tight collaboration with Figma-based designers.",
    seniority: "mid",
    requiredSkills: ["React", "Next.js", "Tailwind CSS", "Redux", "Figma"],
    niceToHave: ["Accessibility", "Jest", "Cypress", "Storybook"],
  },
  demo_app_7: {
    summary: "Backend role at a small startup building a public compression API with Node.js/Express, MongoDB and Docker-based deploys.",
    seniority: "mid",
    requiredSkills: ["Node.js", "Express", "MongoDB", "Docker"],
    niceToHave: ["Redis", "gRPC"],
  },
  demo_app_8: {
    summary: "Senior full-stack role leading a pod: React and Node.js over PostgreSQL on AWS, with RFC-driven design and mentoring.",
    seniority: "senior",
    requiredSkills: ["React", "Node.js", "PostgreSQL", "AWS"],
    niceToHave: ["Team leadership", "Kafka"],
  },
  demo_app_12: {
    summary: "Event-driven backend role on an order platform: Node.js/TypeScript services on Kafka and Kubernetes with PostgreSQL modelling.",
    seniority: "mid",
    requiredSkills: ["Node.js", "TypeScript", "Kafka", "Kubernetes", "PostgreSQL"],
    niceToHave: ["Go", "Terraform"],
  },
  demo_app_14: {
    summary: "SRE role keeping a large service fleet within SLO: Kubernetes operations across AWS regions, Terraform-codified infrastructure and CI/CD ownership.",
    seniority: "senior",
    requiredSkills: ["Kubernetes", "AWS", "Terraform", "CI/CD", "Docker"],
    niceToHave: ["Golang", "Service mesh"],
  },
  demo_app_17: {
    summary: "Platform engineering role building a Kubernetes-based internal developer platform with Terraform-managed AWS and PostgreSQL fleets.",
    seniority: "mid",
    requiredSkills: ["Kubernetes", "Terraform", "AWS", "PostgreSQL", "Docker"],
    niceToHave: ["Helm", "ArgoCD", "TypeScript"],
  },
  demo_app_20: {
    summary: "Full-stack subscriptions role: React storefront and Node.js services behind a GraphQL API with PostgreSQL subscription-state modelling.",
    seniority: "mid",
    requiredSkills: ["React", "Node.js", "GraphQL", "PostgreSQL"],
    niceToHave: ["Stripe", "Next.js"],
  },
  demo_app_23: {
    summary: "Senior API-platform role: partner-facing REST API design, a high-volume Kafka event backbone and Redis-backed gateway features in Node.js.",
    seniority: "senior",
    requiredSkills: ["Node.js", "REST APIs", "Kafka", "GraphQL", "Redis"],
    niceToHave: ["gRPC", "OAuth2"],
  },
};

export const COACH_ADVICE = {
  headline:
    "A steady pipeline with real interview traction — but Kubernetes keeps deciding which senior roles you get, and GraphQL is close behind.",
  focusSkill: "Kubernetes",
  recommendations: [
    {
      title: "Close the Kubernetes gap first",
      detail:
        "It is required in 4 of your 10 analyzed roles — including two live interviews — and your resumes don't cover it. A small production-style cluster project would remove the objection that already cost you the Stark Industries final round.",
    },
    {
      title: "Decide on GraphQL",
      detail:
        "Required in 3 analyzed roles (Globex, Soylent, Oscorp). Either invest a weekend adding a GraphQL layer to open-ledger, or stop applying to gateway-centric roles and lean into your REST depth.",
    },
    {
      title: "Convert the interviews you already have",
      detail:
        "With 3 roles in the interview stage and an offer on the table at Initech, preparation hours beat new applications this week. Your ~46% response rate says the top of the funnel is healthy enough to pause.",
    },
  ],
};

export const TAILORED = {
  applicationId: "demo_app_1",
  experience:
    "Maintained node.js services at Globex, fixed bugs and helped with deployments.",
  bullets: `- Operated and maintained high-performance Node.js services, ensuring continuous availability for critical backend operations.
- Diagnosed and resolved complex production issues, improving system stability and p95 latency.
- Streamlined the deployment pipeline, supporting reliable releases across environments.`,
};

export const INTERVIEW_PREP: Record<string, string> = {
  demo_app_1: `Technical questions
- How would you design a REST API that serves millions of requests per day on Node.js and PostgreSQL?
  Strong answers cover: API contract design, connection pooling, caching layers, read replicas, pagination, and monitoring.
- How do you approach database schema changes on a live PostgreSQL system?
  Strong answers cover: backwards-compatible migrations, deploy order, locking behaviour, and rollback plans.
- What does a production-ready Kubernetes deployment look like for a Node.js service?
  Strong answers cover: liveness/readiness probes, resource limits, horizontal pod autoscaling, and rolling updates.
- How do you keep TypeScript types honest at service boundaries?
  Strong answers cover: schema validation (e.g. Zod), generated clients, and runtime checks on external input.
- Describe how you would debug elevated p95 latency in an API.
  Strong answers cover: tracing, database query analysis, event-loop blocking, and load-testing hypotheses.

Behavioral questions
- Tell me about a time you led a technical decision that others disagreed with.
  Strong answers cover: trade-off analysis, stakeholder communication, and measurable outcomes.
- Describe a production incident you owned end to end.
  Strong answers cover: detection, mitigation, root cause, and the follow-up that prevented recurrence.
- How do you mentor less experienced engineers?
  Strong answers cover: code review culture, pairing, and growing ownership.

Questions to ask the interviewer
- What does the on-call rotation and incident culture look like for this team?
- Which part of the API platform is under the most scaling pressure right now?
- How do you measure success for this role in the first six months?`,
  demo_app_8: `Technical questions
- How would you structure a full-stack feature that spans a React frontend and a Node.js/PostgreSQL backend?
  Strong answers cover: API contract first, shared validation, optimistic UI, and end-to-end error handling.
- How do you keep a React application fast as it grows?
  Strong answers cover: rendering strategy, memoization boundaries, bundle splitting, and measuring before optimising.
- Walk through designing a PostgreSQL schema you expect to live for years.
  Strong answers cover: normalisation trade-offs, index strategy, migration discipline, and how requirements change.
- What does technical leadership look like without formal authority?
  Strong answers cover: RFCs, review culture, mentoring rhythms, and disagreement handled in the open.
- How would you design an ingestion API handling tens of gigabytes a day?
  Strong answers cover: batching vs streaming, idempotency, backpressure, and observability from day one.

Behavioral questions
- Tell me about mentoring an engineer through something hard.
  Strong answers cover: diagnosis of the gap, concrete support, and what changed afterwards.
- Describe an RFC of yours that changed after review.
  Strong answers cover: openness to input, what the feedback caught, and the better outcome.
- When did you push back on a deadline, and how?
  Strong answers cover: risk framing, alternatives offered, and the relationship surviving intact.

Questions to ask the interviewer
- How does the pod balance product delivery against platform investment?
- What has made previous senior hires succeed or struggle here?
- Where does the data-ingestion pipeline hurt the most today?`,
};
