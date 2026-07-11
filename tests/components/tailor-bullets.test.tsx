import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { encodeStreamEnd, type StreamEnd } from "@/lib/stream-protocol";

const saveTailoredBullets = vi.fn();
vi.mock("@/actions/applications", () => ({
  saveTailoredBullets: (...args: unknown[]) => saveTailoredBullets(...args),
}));

const toast = vi.fn();
vi.mock("@/components/ui/toast", () => ({ useToast: () => toast }));

const { TailorBullets } = await import("@/components/applications/tailor-bullets");

function respondWith(parts: string[]) {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const part of parts) controller.enqueue(encoder.encode(part));
      controller.close();
    },
  });
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(body, { status: 200 })),
  );
}

function respondWithBullets(text: string, end: StreamEnd) {
  respondWith([text, encodeStreamEnd(end)]);
}

function generate() {
  render(<TailorBullets id="app-1" initialExperience="Built a thing" />);
  fireEvent.click(screen.getByRole("button", { name: /tailor bullets/i }));
}

beforeEach(() => {
  saveTailoredBullets.mockReset().mockResolvedValue({ error: null });
  toast.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("TailorBullets", () => {
  it("saves the bullets when the stream reports success", async () => {
    respondWithBullets("- Shipped a thing", { ok: true });
    generate();

    await waitFor(() => expect(saveTailoredBullets).toHaveBeenCalledTimes(1));
    expect(saveTailoredBullets).toHaveBeenCalledWith(
      "app-1",
      "Built a thing",
      "- Shipped a thing",
    );
    expect(toast).toHaveBeenCalledWith("Bullets saved to this application.");
  });

  it("does not persist a truncated response when the stream reports failure", async () => {
    respondWithBullets("- Shipped a th", {
      ok: false,
      error: "The AI stopped responding before it finished.",
    });
    generate();

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        /stopped responding/i,
      ),
    );
    expect(saveTailoredBullets).not.toHaveBeenCalled();
    expect(toast).not.toHaveBeenCalled();
  });

  it("does not persist when the connection drops before the status frame", async () => {
    respondWith(["- Shipped a th"]);
    generate();

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(saveTailoredBullets).not.toHaveBeenCalled();
    expect(toast).not.toHaveBeenCalled();
  });

  it("does not persist an empty but successful response", async () => {
    respondWithBullets("   ", { ok: true });
    generate();

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/empty response/i),
    );
    expect(saveTailoredBullets).not.toHaveBeenCalled();
  });
});
