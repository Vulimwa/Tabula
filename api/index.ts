import type { VercelRequest, VercelResponse } from "@vercel/node";

let serverPromise: Promise<any> | undefined;

export default async function handler(
	req: VercelRequest,
	res: VercelResponse,
) {
	try {
		serverPromise ??= import("../server").then(({ app }) => app);
		const app = await serverPromise;
		return app(req, res);
	} catch (error) {
		console.error("Vercel API initialization failed:", error);
		return res.status(503).json({
			error: "API service initialization failed. Check the Vercel function logs.",
		});
	}
}
