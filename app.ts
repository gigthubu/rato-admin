import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import features from "./features/index.js";

export const app = express();

app.use(
  cors({
    origin: ["https://www.ratokhata.com", "www.ratokhata.com", "ratokhata.com"],
    credentials: true,
  }),
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (_req, res) => {
  res.json({ status: "ok", service: "rato-khata-api" });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api", features);

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error("[api] error", err);
    res.status(500).json({ status: false, message: "Unexpected error" });
  },
);
