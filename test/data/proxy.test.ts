import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { proxy } from "@/proxy";

function request(path: string, signedIn: boolean) {
  const headers = new Headers();
  if (signedIn) headers.set("cookie", "better-auth.session_token=abc.def");
  return new NextRequest(new URL(path, "http://localhost:3000"), { headers });
}

const location = (res: Response) => res.headers.get("location");

describe("proxy", () => {
  it.each(["/home", "/tasks", "/tasks?status=overdue", "/schedule", "/inventory", "/vendors", "/settings"])(
    "sends signed-out visitors on %s to /",
    (path) => {
      expect(location(proxy(request(path, false)))).toBe("http://localhost:3000/");
    },
  );

  it("lets signed-in users through to app routes", () => {
    expect(location(proxy(request("/tasks", true)))).toBeNull();
  });

  it("sends signed-in users on / to /home", () => {
    expect(location(proxy(request("/", true)))).toBe("http://localhost:3000/home");
  });

  it("shows the landing page to signed-out visitors and to stale sessions (?expired=1)", () => {
    expect(location(proxy(request("/", false)))).toBeNull();
    expect(location(proxy(request("/?expired=1", true)))).toBeNull();
  });

  it("recognizes the __Secure- cookie used over https", () => {
    const headers = new Headers({ cookie: "__Secure-better-auth.session_token=abc.def" });
    const req = new NextRequest(new URL("https://homekeeper.app/"), { headers });
    expect(location(proxy(req))).toBe("https://homekeeper.app/home");
  });

  it("does not treat look-alike paths as app routes", () => {
    expect(location(proxy(request("/homework", false)))).toBeNull();
  });
});
