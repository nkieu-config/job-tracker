import type { NextFunction, Request, Response } from "express";

export function requireInternalKey(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const expected = process.env.INTERNAL_API_KEY;
  if (!expected) {
    res.status(503).json({ error: "AI service is not configured." });
    return;
  }

  const key = req.headers["x-internal-key"];
  if (key !== expected) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
}
