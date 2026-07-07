import { Router } from "express";
import { z } from "zod";
import { AiError } from "@job-tracker/shared/errors";
import { analyzeJobDescription } from "../services/analyze-jd.js";

const router = Router();

const bodySchema = z.object({
  jobDescription: z.string().min(1),
});

router.post("/", async (req, res) => {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "jobDescription is required." });
    return;
  }

  try {
    const analysis = await analyzeJobDescription(parsed.data.jobDescription);
    res.json(analysis);
  } catch (err) {
    if (err instanceof AiError) {
      res.status(502).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: "Analysis failed." });
  }
});

export default router;
