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

test("deployment loads CI-built images without registry access on the server", async () => {
  const [workflow, compose, deployScript] = await Promise.all([
    readFile(new URL("../.github/workflows/deploy.yml", import.meta.url), "utf8"),
    readFile(new URL("../docker-compose.yml", import.meta.url), "utf8"),
    readFile(new URL("../ops/deploy-media.sh", import.meta.url), "utf8"),
  ]);
  assert.match(workflow, /docker save/);
  assert.match(workflow, /media-platform-images-\$\{GITHUB_SHA\}\.tar\.gz/);
  assert.match(workflow, /tailscale\/github-action@v4/);
  assert.match(compose, /MEDIA_IMAGE_TAG/);
  assert.match(compose, /pull_policy:\s*never/);
  assert.match(deployScript, /docker load -i/);
  assert.match(deployScript, /--no-build --pull never/);
  assert.doesNotMatch(deployScript, /up -d --build/);
});

test("form redirects stay on the public browser origin", async () => {
  const request = await readFile(new URL("../lib/request.ts", import.meta.url), "utf8");
  const login = await readFile(new URL("../app/api/auth/login/route.ts", import.meta.url), "utf8");
  assert.match(request, /headers:\s*\{\s*Location:/);
  assert.doesNotMatch(login, /new URL\([^)]*request\.url/);
});

test("platform credentials are encrypted and never returned to the account page", async () => {
  const [credentials, accountPage] = await Promise.all([
    readFile(new URL("../lib/credentials.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/accounts/[id]/page.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(credentials, /aes-256-gcm/);
  assert.match(credentials, /PLATFORM_CREDENTIAL_SECRET/);
  assert.doesNotMatch(accountPage, /encryptedCredential/);
  assert.doesNotMatch(accountPage, /defaultValue=.*password/i);
});

test("content import accepts xlsx and normalizes spreadsheet dates", async () => {
  const [route, helper, page] = await Promise.all([
    readFile(new URL("../app/api/accounts/[id]/contents/import/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/tabular-upload.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/accounts/[id]/page.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(route, /readUploadedTable/);
  assert.match(helper, /extension === "xlsx"/);
  assert.match(helper, /serial - 25569/);
  assert.match(page, /accept="\.xlsx,\.csv/);
});
