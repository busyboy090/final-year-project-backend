import test from "node:test";
import assert from "node:assert/strict";
import { Readable, Writable } from "node:stream";

import app from "../../src/app.ts";

type TestResponse = {
  status: number;
  headers: Record<string, string | string[]>;
  body: any;
  text: string;
};

function requestApp({
  method = "GET",
  url,
  headers = {},
  body,
}: {
  method?: string;
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
}): Promise<TestResponse> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const payload = body === undefined ? undefined : JSON.stringify(body);
    const req = new Readable({
      read() {
        if (payload) this.push(payload);
        this.push(null);
      },
    }) as any;
    const res = new Writable({
      write(chunk, _encoding, callback) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        callback();
      },
    }) as any;

    const responseHeaders: Record<string, string | string[]> = {};

    req.method = method;
    req.url = url;
    req.originalUrl = url;
    req.headers = {
      host: "localhost",
      ...(payload ? { "content-type": "application/json" } : {}),
      ...headers,
    };
    req.connection = { encrypted: false };
    req.socket = { remoteAddress: "127.0.0.1", encrypted: false };

    res.statusCode = 200;
    res.headersSent = false;
    res.setHeader = (name: string, value: string | string[]) => {
      responseHeaders[name.toLowerCase()] = value;
    };
    res.getHeader = (name: string) => responseHeaders[name.toLowerCase()];
    res.getHeaders = () => responseHeaders;
    res.removeHeader = (name: string) => {
      delete responseHeaders[name.toLowerCase()];
    };
    res.writeHead = (statusCode: number, headers?: Record<string, string>) => {
      res.statusCode = statusCode;
      if (headers) {
        Object.entries(headers).forEach(([name, value]) => {
          responseHeaders[name.toLowerCase()] = value;
        });
      }
      res.headersSent = true;
      return res;
    };
    res.end = (chunk?: any) => {
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      const text = Buffer.concat(chunks).toString("utf8");
      let parsed: any = text;
      try {
        parsed = text ? JSON.parse(text) : undefined;
      } catch {
        parsed = text;
      }
      resolve({
        status: res.statusCode,
        headers: responseHeaders,
        body: parsed,
        text,
      });
      return res;
    };
    res.on("error", reject);

    app.handle(req, res, reject);
  });
}

test("GET /health returns liveness payload without authentication", async () => {
  const response = await requestApp({ url: "/health" });

  assert.equal(response.status, 200);
  assert.equal(response.body.status, "ok");
  assert.equal(typeof response.body.uptime, "number");
  assert.equal(typeof response.body.timestamp, "string");
});

test("GET /api/csrf-token returns a token and sets CSRF cookie", async () => {
  const response = await requestApp({ url: "/api/csrf-token" });

  assert.equal(response.status, 200);
  assert.equal(typeof response.body.csrfToken, "string");
  assert.ok(response.body.csrfToken.length > 10);
  assert.ok(String(response.headers["set-cookie"]).includes("_csrf"));
});

test("POST /api/v1/auth/logout is rejected without CSRF token", async () => {
  const response = await requestApp({
    method: "POST",
    url: "/api/v1/auth/logout",
  });

  assert.equal(response.status, 403);
  assert.equal(response.body.status, "fail");
  assert.match(response.body.message, /csrf/i);
});

test("GET /api/v1/events is rejected without access token", async () => {
  const response = await requestApp({ url: "/api/v1/events" });

  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
  assert.equal(response.body.code, "UNAUTHORIZED");
});

test("GET /api-docs/openapi.json exposes OpenAPI document", async () => {
  const response = await requestApp({ url: "/api-docs/openapi.json" });

  assert.equal(response.status, 200);
  assert.equal(response.body.openapi, "3.0.0");
  assert.equal(response.body.info.title, "Adun EMS API");
});

test("unknown route returns JSON 404", async () => {
  const response = await requestApp({ url: "/does-not-exist" });

  assert.equal(response.status, 404);
  assert.equal(response.body.status, "error");
  assert.match(response.body.message, /not found/i);
});
