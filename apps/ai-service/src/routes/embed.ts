import { Router } from "express";
import { z } from "zod";
import { AiError } from "@job-tracker/shared/errors";
import { embedText, type EmbeddingTask } from "../services/embeddings.js";

const router = Router();

const taskTypes = [
  "RETRIEVAL_QUERY",
  "RETRIEVAL_DOCUMENT",
  "SEMANTIC_SIMILARITY",
] as const;

const bodySchema = z.object({
  text: z.string().min(1),
  taskType: z.enum(taskTypes).optional(),
});

router.post("/", async (req, res) => {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "text is required." });
    return;
  }

  try {
    const vector = await embedText(
      parsed.data.text,
      (parsed.data.taskType ?? "SEMANTIC_SIMILARITY") as EmbeddingTask,
    );
    res.json({ vector });
  } catch (err) {
    if (err instanceof AiError) {
      res.status(502).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: "Embedding failed." });
  }
});

export default router;
