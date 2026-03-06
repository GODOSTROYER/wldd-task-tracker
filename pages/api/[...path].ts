import type { NextApiRequest, NextApiResponse } from 'next';
import app from '../../server/src/app';
import { ensureConnections } from '../../server/src/config';

type NextHandler = (req: NextApiRequest, res: NextApiResponse, next: (err?: unknown) => void) => void;
const expressHandler = app as unknown as NextHandler;

function makeRequestId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const requestId = makeRequestId();
  const startedAt = Date.now();

  console.info(`[api-bridge:${requestId}] Incoming ${req.method} ${req.url}`);
  res.on('finish', () => {
    const elapsedMs = Date.now() - startedAt;
    console.info(`[api-bridge:${requestId}] Completed with ${res.statusCode} in ${elapsedMs}ms`);
  });

  try {
    console.info(`[api-bridge:${requestId}] Ensuring MongoDB/Redis connections`);
    await ensureConnections();
    console.info(`[api-bridge:${requestId}] Dispatching request to Express app`);
    await new Promise<void>((resolve, reject) => {
      expressHandler(req, res, (err?: unknown) => {
        if (err) reject(err);
        else resolve();
      });
    });
  } catch (error) {
    console.error(`[api-bridge:${requestId}] API bootstrap error:`, error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Server initialization failed' });
    }
  }
}
