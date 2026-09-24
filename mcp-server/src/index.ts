import express from 'express';
import cors from 'cors';
import { createFoodHttpHandler } from './servers/food';
import { createDineoutHttpHandler } from './servers/dineout';
import { createInstamartHttpHandler } from './servers/instamart';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
// express.json() is safe here — StreamableHTTPServerTransport.handleRequest()
// accepts the pre-parsed body as its third argument, so it never tries to
// re-read the request stream.
app.use(express.json());

// ─── Auth Middleware ──────────────────────────────────────────────────────────
function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header. Expected: Bearer <token>' });
    return;
  }
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) {
    res.status(401).json({ error: 'Empty Bearer token' });
    return;
  }
  next();
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    transport: 'StreamableHTTP',
    servers: ['swiggy-food', 'swiggy-dineout', 'swiggy-instamart'],
    timestamp: new Date().toISOString(),
  });
});

// ─── Swiggy Food MCP ──────────────────────────────────────────────────────────
// Single POST endpoint — handles initialize, tools/list, tools/call
const foodHandler = createFoodHttpHandler();
app.post('/mcp/v1/food', requireAuth, (req, res) => foodHandler.handle(req, res));

// ─── Swiggy Dineout MCP ───────────────────────────────────────────────────────
const dineoutHandler = createDineoutHttpHandler();
app.post('/mcp/v1/dineout', requireAuth, (req, res) => dineoutHandler.handle(req, res));

// ─── Swiggy Instamart MCP ─────────────────────────────────────────────────────
const instamartHandler = createInstamartHttpHandler();
app.post('/mcp/v1/instamart', requireAuth, (req, res) => instamartHandler.handle(req, res));

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🟠 Swiggy MCP Mock Server running at http://localhost:${PORT}`);
  console.log(`   Transport: StreamableHTTP (POST only, no SSE stream lifecycle)`);
  console.log(`   ✅ Food Delivery:  POST http://localhost:${PORT}/mcp/v1/food`);
  console.log(`   ✅ Dineout:        POST http://localhost:${PORT}/mcp/v1/dineout`);
  console.log(`   ✅ Instamart:      POST http://localhost:${PORT}/mcp/v1/instamart`);
  console.log(`   ✅ Health:         GET  http://localhost:${PORT}/health\n`);
});

export default app;
