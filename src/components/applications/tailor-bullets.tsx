"use client";

import { useState } from "react";
import { inputClass } from "@/components/ui/form-styles";
import { saveTailoredBullets } from "@/actions/applications";
import { useAiStream } from "@/components/applications/use-ai-stream";

export function TailorBullets({
  id,
  initialExperience = "",
  initialOutput = "",
}: {
  id: string;
  initialExperience?: string;
  initialOutput?: string;
}) {
  const [experience, setExperience] = useState(initialExperience);
  const { output, loading, error, setError, generate, copyOutput } = useAiStream(
    {
      url: `/api/applications/${id}/tailor`,
      initialOutput,
      requestFailed: "Failed to generate bullets.",
      onSave: (text) => saveTailoredBullets(id, experience, text),
      savedMessage: "Bullets saved to this application.",
      saveFailedMessage: "Bullets generated but could not be saved.",
    },
  );

  function submit() {
    if (!experience.trim()) {
      setError("Describe your experience first.");
      return;
    }
    generate({ experience });
  }

  return (
    <div className="flex flex-col gap-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex flex-col gap-3"
      >
        <textarea
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          rows={4}
          placeholder="Paste a rough description of a project or role you want to tailor…"
          aria-label="Experience to tailor"
          className={inputClass}
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center bg-primary text-on-primary font-sans font-bold text-body-lg tracking-[0.2px] py-2.5 px-5 rounded-pill transition-colors hover:bg-primary-press disabled:opacity-60"
        >
          {loading ? "Tailoring…" : output ? "Regenerate bullets" : "Tailor bullets"}
        </button>
      </form>

      {error && (
        <p role="alert" className="text-body font-sans text-semantic-error">
          {error}
        </p>
      )}

      {(output || loading) && (
        <div className="flex flex-col gap-2">
          <div
            aria-live="polite"
            className="whitespace-pre-wrap rounded-xl border border-hairline bg-canvas p-6 font-sans text-body-lg text-ink"
          >
            {output}
            {loading && <span className="animate-pulse">▍</span>}
          </div>
          {output && !loading && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={copyOutput}
                className="inline-flex items-center justify-center bg-canvas text-ink font-sans font-bold text-body py-2 px-4 rounded-pill border border-hairline transition-colors hover:bg-canvas-lavender"
              >
                Copy bullets
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
