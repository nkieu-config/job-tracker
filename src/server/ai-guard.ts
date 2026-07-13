import "server-only";

import type { ApplicationModel } from "@/generated/prisma/models";
import { prisma } from "@/server/prisma";
import { checkAiRateLimit } from "@/server/rate-limit";

// A denial carries both wordings a caller might need: Server Actions surface
// `message` in their form state, Route Handlers pair it with `status`.
export type AiDenial = { message: string; status: 400 | 404 | 429 };

// `jobDescription` rides along already narrowed to a non-empty string: the
// guard is the thing that proved it, so no call site needs a `!` to use it.
export type AiGuardResult =
  | { ok: true; application: ApplicationModel; jobDescription: string }
  | { ok: false; denial: AiDenial };

export const AI_RATE_LIMITED: AiDenial = {
  message: "AI rate limit reached. Please try again later.",
  status: 429,
};

export function aiDenial(message: string, status: 400 | 404 | 429): AiDenial {
  return { message, status };
}

// Does this application belong to the caller, and is there a job description to
// work from? Every AI feature asks exactly this before it does anything, and
// answering it here is what keeps four call sites from drifting into four
// different wordings of the same refusal.
export async function requireApplicationWithJd(
  applicationId: string,
  userId: string,
  verb: string,
): Promise<AiGuardResult> {
  const application = await prisma.application.findFirst({
    where: { id: applicationId, userId },
  });
  if (!application) {
    return { ok: false, denial: aiDenial("Application not found.", 404) };
  }

  const jobDescription = application.jobDescription?.trim();
  if (!jobDescription) {
    return {
      ok: false,
      denial: aiDenial(`Add a job description before ${verb}.`, 400),
    };
  }

  return { ok: true, application, jobDescription };
}

export async function requireAiBudget(userId: string): Promise<AiDenial | null> {
  return (await checkAiRateLimit(userId)) ? null : AI_RATE_LIMITED;
}

// The whole preamble for a feature that always spends a token: ownership, then
// a job description, then the caller's own input, and only then the budget — so
// a request that was going to be rejected anyway never burns a slice of it.
//
// `computeResumeFit` composes the two halves above by hand instead, because it
// can finish successfully without calling the model at all (nothing to embed),
// and must not charge the user for that.
export async function guardAiRequest(
  applicationId: string,
  userId: string,
  options: {
    verb: string;
    validate?: () => AiDenial | null | Promise<AiDenial | null>;
  },
): Promise<AiGuardResult> {
  const found = await requireApplicationWithJd(
    applicationId,
    userId,
    options.verb,
  );
  if (!found.ok) return found;

  const invalid = await options.validate?.();
  if (invalid) return { ok: false, denial: invalid };

  const denied = await requireAiBudget(userId);
  if (denied) return { ok: false, denial: denied };

  return found;
}
