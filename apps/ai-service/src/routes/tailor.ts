import { GoogleGenAI } from "@google/genai";
import { Router } from "express";
import { z } from "zod";

const router = Router();

const bodySchema = z.object({
  jobDescription: z.string().min(1),
  experience: z.string().min(1),
});

router.post("/", async (req, res) => {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).send("jobDescription and experience are required.");
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(503).send("AI is not configured.");
    return;
  }

  const { jobDescription, experience } = parsed.data;
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are an expert resume writer. Rewrite the candidate's experience into 3-5 strong, tailored resume bullet points for the target job.

Rules:
- Start each bullet with "- " on its own line.
- Lead with a strong action verb; quantify impact where the input allows.
- Emphasise skills and keywords relevant to the job description.
- Do NOT invent facts, numbers, or technologies not implied by the experience.
- Output only the bullet points, nothing else.

Target job description:
"""
${jobDescription.slice(0, 6000)}
"""

Candidate's experience:
"""
${experience.slice(0, 4000)}
"""`;

  let stream;
  try {
    stream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { temperature: 0.6 },
    });
  } catch {
    res.status(502).send("The AI service failed. Please try again.");
    return;
  }

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  try {
    for await (const chunk of stream) {
      if (chunk.text) res.write(chunk.text);
    }
  } catch {
    res.write("\n\n[The stream was interrupted.]");
  } finally {
    res.end();
  }
});

export default router;
