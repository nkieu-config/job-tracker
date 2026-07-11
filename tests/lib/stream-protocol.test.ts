import { describe, it, expect, vi } from "vitest";
import {
  STREAM_END_SENTINEL,
  encodeStreamEnd,
  readAiStream,
} from "@/lib/stream-protocol";

function streamOf(parts: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const part of parts) controller.enqueue(encoder.encode(part));
      controller.close();
    },
  });
}

describe("readAiStream", () => {
  it("returns the text and ok=true when the stream ends cleanly", async () => {
    const { text, end } = await readAiStream(
      streamOf(["- one\n", "- two", encodeStreamEnd({ ok: true })]),
      () => {},
    );
    expect(text).toBe("- one\n- two");
    expect(end).toEqual({ ok: true });
  });

  it("never leaks the sentinel or status frame into the text", async () => {
    const seen: string[] = [];
    const { text } = await readAiStream(
      streamOf(["hello", encodeStreamEnd({ ok: true })]),
      (t) => seen.push(t),
    );
    expect(text).not.toContain(STREAM_END_SENTINEL);
    expect(text).not.toContain('"ok"');
    for (const partial of seen) {
      expect(partial).not.toContain(STREAM_END_SENTINEL);
      expect(partial).not.toContain('"ok"');
    }
  });

  it("surfaces a server-reported mid-stream failure", async () => {
    const { text, end } = await readAiStream(
      streamOf(["partial", encodeStreamEnd({ ok: false, error: "boom" })]),
      () => {},
    );
    expect(text).toBe("partial");
    expect(end).toEqual({ ok: false, error: "boom" });
  });

  it("reports a truncated stream that never sent a status frame", async () => {
    const { text, end } = await readAiStream(
      streamOf(["half a respo"]),
      () => {},
    );
    expect(text).toBe("half a respo");
    expect(end.ok).toBe(false);
  });

  it("handles a status frame split across chunk boundaries", async () => {
    const frame = encodeStreamEnd({ ok: true });
    const { text, end } = await readAiStream(
      streamOf(["body", frame.slice(0, 3), frame.slice(3)]),
      () => {},
    );
    expect(text).toBe("body");
    expect(end).toEqual({ ok: true });
  });

  it("treats a malformed status frame as a failure", async () => {
    const { end } = await readAiStream(
      streamOf(["body", STREAM_END_SENTINEL, "{not json"]),
      () => {},
    );
    expect(end.ok).toBe(false);
  });

  it("streams progressive text to the caller as chunks arrive", async () => {
    const onText = vi.fn();
    await readAiStream(
      streamOf(["a", "b", "c", encodeStreamEnd({ ok: true })]),
      onText,
    );
    expect(onText.mock.calls.map((c) => c[0])).toEqual(["a", "ab", "abc", "abc"]);
  });
});
