import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("deployment keeps secrets outside source", async () => {
  const [envExample, gitignore, auth] = await Promise.all([
    readFile(new URL("../.env.example", import.meta.url), "utf8"),
    readFile(new URL("../.gitignore", import.meta.url), "utf8"),
    readFile(new URL("../lib/auth.ts", import.meta.url), "utf8"),
  ]);
  assert.match(gitignore, /^\.env\*/m);
  assert.doesNotMatch(envExample, /sk-[A-Za-z0-9]{20,}/);
  assert.match(auth, /httpOnly:\s*true/);
  assert.match(auth, /sameSite:\s*"lax"/);
  assert.match(auth, /sha256/);
  assert.match(auth, /COOKIE_SECURE/);
});

test("form redirects stay on the public browser origin", async () => {
  const request = await readFile(new URL("../lib/request.ts", import.meta.url), "utf8");
  const login = await readFile(new URL("../app/api/auth/login/route.ts", import.meta.url), "utf8");
  assert.match(request, /headers:\s*\{\s*Location:/);
  assert.doesNotMatch(login, /new URL\([^)]*request\.url/);
});
