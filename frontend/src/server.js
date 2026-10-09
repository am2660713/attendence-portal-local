import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "..", "public");
const PORT = Number(process.env.PORT || 3001);
const API_TARGET_HOST = process.env.API_TARGET_HOST || "localhost";
const API_TARGET_PORT = Number(process.env.API_TARGET_PORT || 4000);

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
};

const server = http.createServer((req, res) => {
  if (req.url?.startsWith("/api/")) {
    const proxyReq = http.request(
      {
        hostname: API_TARGET_HOST,
        port: API_TARGET_PORT,
        path: req.url,
        method: req.method,
        headers: {
          ...req.headers,
          host: `${API_TARGET_HOST}:${API_TARGET_PORT}`,
        },
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
        proxyRes.pipe(res);
      }
    );

    proxyReq.on("error", () => {
      res.writeHead(502, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ message: "Backend API is unavailable." }));
    });

    req.pipe(proxyReq);
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url || "/", "http://localhost").pathname);
  } catch {
    res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Bad request");
    return;
  }
  const reqPath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.resolve(publicDir, `.${path.posix.normalize(reqPath)}`);
  if (filePath !== publicDir && !filePath.startsWith(publicDir + path.sep)) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "text/plain; charset=utf-8" });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Attendance frontend running at http://localhost:${PORT}`);
});
