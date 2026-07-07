import "dotenv/config";
import express from "express";
import analyzeRouter from "./routes/analyze.js";
import embedRouter from "./routes/embed.js";
import tailorRouter from "./routes/tailor.js";
import { requireInternalKey } from "./middleware/internal-auth.js";

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(requireInternalKey);
app.use("/analyze", analyzeRouter);
app.use("/embed", embedRouter);
app.use("/tailor", tailorRouter);

app.listen(port, () => {
  console.log(`AI service listening on http://localhost:${port}`);
});
