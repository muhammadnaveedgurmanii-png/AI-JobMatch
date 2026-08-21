import express, { type ErrorRequestHandler, type Express } from "express";
import { createRequire } from "node:module";
import type { pinoHttp as PinoHttp } from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware.js";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";

const require = createRequire(import.meta.url);
const pinoHttp: typeof PinoHttp = require("pino-http");

const app: Express = express();

// Structured request logging — mount first so all subsequent handlers have req.log
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          // Strip query string to avoid leaking sensitive params in logs
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// Clerk proxy — must run BEFORE body parsers (streams raw bytes)
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Resolve publishable key from incoming request host so the same server can
// serve multiple Clerk custom domains. Falls back to CLERK_PUBLISHABLE_KEY.
app.use(
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY,
    ),
  })),
);

app.use("/api", router);
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "API route not found" });
});

const apiErrorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const errorRecord =
    error && typeof error === "object"
      ? (error as Record<string, unknown>)
      : undefined;
  const errorCode =
    typeof errorRecord?.code === "string" ? errorRecord.code : undefined;
  const errorName =
    error instanceof Error ? error.name : "UnknownError";

  req.log.error({ errorName, errorCode }, "Unhandled API error");

  if (errorCode === "23505") {
    res.status(409).json({
      error: "Profile data conflicts with an existing account.",
    });
    return;
  }

  res.status(500).json({ error: "Internal server error" });
};

app.use(apiErrorHandler);

export default app;
