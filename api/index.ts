import type { VercelRequest, VercelResponse } from "@vercel/node";
// Keep this import extensionless so Vercel's function bundler traces and
// transpiles the TypeScript module. A literal `.ts` import is left in the
// generated runtime code, where Node cannot load `/var/task/server.ts`.
import { app } from "../server";

export default function handler(req: VercelRequest, res: VercelResponse) {
	return app(req, res);
}
