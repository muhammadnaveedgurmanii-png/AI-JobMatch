import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";

/**
 * Typed requireAuth middleware using Clerk getAuth.
 * Attaches the authenticated Clerk userId to req.clerkUserId.
 * Returns 401 if no valid session is present.
 *
 * NEVER logs cookies, auth headers, secrets, resume content, or query strings.
 */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  // Attach to request for downstream handlers
  (req as Request & { clerkUserId: string }).clerkUserId = userId;
  next();
}
