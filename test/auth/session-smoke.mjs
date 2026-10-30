// Run against the lane dev server: node test/auth/session-smoke.mjs
// Uses the seeded demo login. Prints no session tokens or secrets.
import assert from "node:assert/strict";

const base = process.argv[2] ?? "http://localhost:3101";
const jar = new Map();
async function request(path, options = {}) {
  const response = await fetch(new URL(path, base), {
    ...options,
    redirect: "manual",
    headers: { origin: base, cookie: [...jar].map(([k, v]) => `${k}=${v}`).join("; "), ...options.headers },
  });
  for (const cookie of response.headers.getSetCookie()) {
    const pair = cookie.split(";")[0];
    const equals = pair.indexOf("=");
    jar.set(pair.slice(0, equals), pair.slice(equals + 1));
  }
  return response;
}
const decode = (text) => text.replaceAll("&quot;", '"').replaceAll("&#x27;", "'").replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&");
const html = await (await request("/")).text();
const form = new FormData();
for (const input of html.matchAll(/<input\b([^>]+)>/g)) {
  const attrs = Object.fromEntries([...input[1].matchAll(/([\w-]+)="([^"]*)"/g)].map((m) => [m[1], decode(m[2])]));
  if (attrs.type === "hidden") form.append(attrs.name, attrs.value ?? "");
}
form.set("email", "alex.morgan@email.com");
form.set("password", "homekeeper-demo");
const login = await request("/", { method: "POST", body: form });
assert.equal(login.headers.get("location"), "/home", "Sign-in should redirect to /home");
assert.ok(jar.has("better-auth.session_token"), "Sign-in should set the session cookie");
console.log("PASS: server action redirects to /home and sets its session cookie");
const session = await (await request("/api/auth/get-session")).json();
console.log(`API can resolve action-created session: ${Boolean(session)}`);
assert.ok(session, "Shared DB blocker: API cannot see the action-created session");
const page = await request("/?expired=1");
assert.equal(page.headers.get("location"), "/home", "Server component should resolve the same signed-in session");
console.log("PASS: API and server component resolve the same session");
await request("/api/auth/sign-out", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
assert.equal((await request("/tasks")).headers.get("location"), `${base}/`);
console.log("PASS: signed-out /tasks redirects to /");
