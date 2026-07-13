import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/server/prisma";
import { rateLimit } from "@/server/rate-limit";
import { sendEmail } from "@/server/email";
import { DEMO_EMAIL } from "@/lib/constants/demo";

const SESSION_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 7;
const SESSION_REFRESH_AFTER_SECONDS = 60 * 60 * 24;
const RESET_TOKEN_EXPIRES_IN_SECONDS = 60 * 60;
const VERIFICATION_TOKEN_EXPIRES_IN_SECONDS = 60 * 60 * 24;

// Better Auth's rate limiter defaults to an in-memory store, which is
// per-instance and so does nothing on serverless. Backing `consume` with the
// same atomic Postgres upsert the AI limiter uses makes the limit hold across
// instances, and supplying `consume` opts out of Better Auth's non-atomic
// check-then-increment fallback.
const postgresRateLimitStorage = {
  get: async () => null,
  set: async () => {},
  consume: async (key: string, rule: { window: number; max: number }) => {
    const { ok, resetAt } = await rateLimit(
      `auth:${key}`,
      rule.max,
      rule.window * 1000,
    );
    if (ok) return { allowed: true, retryAfter: null };
    const retryAfter = Math.max(
      1,
      Math.ceil((resetAt.getTime() - Date.now()) / 1000),
    );
    return { allowed: false, retryAfter };
  },
};

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    resetPasswordTokenExpiresIn: RESET_TOKEN_EXPIRES_IN_SECONDS,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your Job Tracker password",
        text: `Someone asked to reset the password for this account.\n\nReset it here (the link expires in 1 hour):\n${url}\n\nIf this wasn't you, ignore this email — your password stays unchanged.`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: VERIFICATION_TOKEN_EXPIRES_IN_SECONDS,
    sendVerificationEmail: async ({ user, url }) => {
      if (user.email === DEMO_EMAIL) return;
      await sendEmail({
        to: user.email,
        subject: "Verify your email for Job Tracker",
        text: `Welcome to Job Tracker.\n\nConfirm this address here (the link expires in 24 hours):\n${url}\n\nIf you didn't create this account, ignore this email.`,
      });
    },
  },
  session: {
    expiresIn: SESSION_EXPIRES_IN_SECONDS,
    updateAge: SESSION_REFRESH_AFTER_SECONDS,
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 60,
    customRules: {
      "/sign-in/email": { window: 300, max: 10 },
      "/sign-up/email": { window: 3600, max: 5 },
      "/request-password-reset": { window: 3600, max: 5 },
      "/forget-password": { window: 3600, max: 5 },
      "/reset-password": { window: 3600, max: 10 },
      "/send-verification-email": { window: 3600, max: 5 },
    },
    customStorage: postgresRateLimitStorage,
  },
  // nextCookies() must be the LAST plugin — it lets Better Auth set cookies
  // from Next.js server actions/route handlers.
  plugins: [nextCookies()],
});
