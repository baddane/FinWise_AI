import type { NextApiRequest, NextApiResponse } from "next";
import { Readable } from "stream";

export const config = {
  api: { bodyParser: false },
};

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk: Buffer | string) =>
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    );
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
  const segments = Array.isArray(req.query.proxy) ? req.query.proxy : [req.query.proxy as string];
  const targetPath = "/api/" + segments.join("/");

  const params = new URLSearchParams();
  Object.entries(req.query).forEach(([key, value]) => {
    if (key !== "proxy") {
      if (Array.isArray(value)) value.forEach((v) => params.append(key, v));
      else if (value) params.append(key, value);
    }
  });
  const qs = params.toString();
  const url = `${backendUrl}${targetPath}${qs ? "?" + qs : ""}`;

  const forwardHeaders: Record<string, string> = {};
  if (req.headers["content-type"]) forwardHeaders["content-type"] = req.headers["content-type"];
  if (req.headers["authorization"])
    forwardHeaders["authorization"] = req.headers["authorization"] as string;

  let body: Buffer | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await streamToBuffer(req as unknown as Readable);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: req.method,
      headers: forwardHeaders,
      body: body ? (body as unknown as BodyInit) : undefined,
    });
  } catch {
    res.status(502).json({ detail: "Backend service unreachable. Check BACKEND_URL configuration." });
    return;
  }

  res.status(response.status);
  const ct = response.headers.get("content-type");
  if (ct) res.setHeader("content-type", ct);
  const setCookie = response.headers.get("set-cookie");
  if (setCookie) res.setHeader("set-cookie", setCookie);

  res.end(Buffer.from(await response.arrayBuffer()));
}
