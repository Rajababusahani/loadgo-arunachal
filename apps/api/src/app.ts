import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import { env } from "./config/env";
import { authenticate } from "./middleware/auth";
import { errorHandler } from "./middleware/error-handler";
import { notFound } from "./middleware/not-found";
import { apiRouter } from "./routes";

export const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.use(
  rateLimit({
    windowMs: env.JWT_RATE_LIMIT_WINDOW_MS,
    limit: env.JWT_RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "loadgo-api" });
});

app.use("/v1", authenticate, apiRouter);
app.use(notFound);
app.use(errorHandler);
