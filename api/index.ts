// Vercel serverless function handler
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { default: app } = await import('../dist/index.mjs');
  return app(req, res);
}
