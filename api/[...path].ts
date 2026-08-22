import type { VercelRequest, VercelResponse } from "@vercel/node";
import { app } from "../server";

// Catch all API paths so Express receives /api/auth/login and every other API route.
export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req, res);
}
