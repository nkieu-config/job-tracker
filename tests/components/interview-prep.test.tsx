import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { encodeStreamEnd, type StreamEnd } from "@/lib/stream-protocol";

const saveInterviewPrep = vi.fn();
vi.mock("@/actions/applications", () => ({
  saveInterviewPrep: (...args: unknown[]) => saveInterviewPrep(...args),
}));

const toast = vi.fn();
vi.mock("@/components/ui/toast", () => ({ useToast: () => toast }));

const { InterviewPrep } = await import("@/components/applications/interview-prep");

function respondWith(parts: string[]) {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const part of parts) controller.enqueue(encoder.encode(part));
      controller.close();
    },
  });
  const fetch = vi.fn().mockResolvedValue(new Response(body, { status: 200 }));
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

function respondWithPrep(text: string, end: StreamEnd) {
  return respondWith([text, encodeStreamEnd(end)]);
}

function generate() {
  render(<InterviewPrep id="app-1" />);
  fireEvent.click(screen.getByRole("button", { name: /generate prep sheet/i }));
}

beforeEach(() => {
  saveInterviewPrep.mockReset().mockResolvedValue({ error: null });
  toast.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("InterviewPrep", () => {
  it("posts to its own endpoint and saves the prep sheet on success", async () => {
    const fetch = respondWithPrep("Q1. Why this role?", { ok: true });
    generate();

    await waitFor(() => expect(saveInterviewPrep).toHaveBeenCalledTimes(1));
    expect(fetch.mock.calls[0][0]).toBe("/api/applications/app-1/interview");
    expect(saveInterviewPrep).toHaveBeenCalledWith("app-1", "Q1. Why this role?");
    expect(toast).toHaveBeenCalledWith("Interview prep saved to this application.");
  });

  it("does not persist a truncated response when the stream reports failure", async () => {
    respondWithPrep("Q1. Why this ro", {
      ok: false,
      error: "The AI stopped responding before it finished.",
    });
    generate();

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/stopped responding/i),
    );
    expect(saveInterviewPrep).not.toHaveBeenCalled();
  });
});
