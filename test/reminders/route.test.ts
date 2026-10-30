import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/cron/reminders/route";
import { getWeeklySummary } from "@/lib/data/reminders";
import { db } from "@/lib/db";
import { home, logEntry, reminderSent, task, user } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { createTestHome } from "../data/fixtures";

vi.mock("@/lib/email", () => ({ sendEmail: vi.fn() }));

const TODAY = "2026-11-02"; // Monday
const homes: Awaited<ReturnType<typeof createTestHome>>[] = [];
const send = vi.mocked(sendEmail);

async function newHome(options: {
  emailReminders?: boolean;
  weeklySummary?: boolean;
  lastWeeklySummaryOn?: string | null;
  timeZone?: string;
} = {}) {
  const fixture = await createTestHome({ today: TODAY });
  homes.push(fixture);
  const { timeZone = "America/New_York", ...preferences } = options;
  if (Object.keys(preferences).length > 0) {
    await db.update(home).set(preferences).where(eq(home.id, fixture.home.id));
  }
  await db.update(user).set({ timeZone }).where(eq(user.id, fixture.user.id));
  return fixture;
}

async function addTask(homeId: string, title = "Check furnace", dueDate = TODAY, completedAt: string | null = null) {
  const [row] = await db.insert(task).values({ homeId, title, dueDate, completedAt }).returning();
  return row;
}

const request = (query = "", authorization: string | null = "Bearer test-cron-secret") => GET(new Request(
  `http://localhost:3108/api/cron/reminders${query}`,
  { headers: authorization === null ? {} : { authorization } },
));

describe("reminder cron with the test database", () => {
  beforeEach(() => {
    vi.stubEnv("CRON_SECRET", "test-cron-secret");
    vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3108");
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-02T13:00:00Z"));
    send.mockReset();
    send.mockResolvedValue({ id: "email-test", skipped: false });
  });

  afterEach(async () => {
    for (const fixture of homes.splice(0)) await fixture.cleanup();
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("rejects absent, wrong, and malformed authorization before sending", async () => {
    for (const header of [null, "Bearer wrong", "test-cron-secret", "bearer test-cron-secret"]) {
      expect((await request("", header)).status).toBe(401);
    }
    vi.stubEnv("CRON_SECRET", "");
    expect((await request("", "Bearer ")).status).toBe(401);
    vi.stubEnv("CRON_SECRET", undefined);
    expect((await request("", "Bearer undefined")).status).toBe(401);
    expect(send).not.toHaveBeenCalled();
  });

  it("batches eligible tasks per home, marks the local date, and sends nothing on a repeat call", async () => {
    const a = await newHome();
    const b = await newHome();
    const off = await newHome({ emailReminders: false, weeklySummary: false });
    const overdue = await addTask(a.home.id, "Overdue", "2026-10-01");
    const cutoff = await addTask(a.home.id, "Three days away", "2026-11-05");
    await addTask(a.home.id, "Too far away", "2026-11-06");
    await addTask(a.home.id, "Already done", "2026-10-01", "2026-11-01");
    await addTask(b.home.id);
    await addTask(off.home.id);

    const response = await request();
    expect(response.status).toBe(200);
    expect((await response.json()).counts).toMatchObject({
      homesChecked: 2, reminderEmails: 2, reminderTasks: 3, sentEmails: 2, skippedEmails: 0,
    });
    expect(send).toHaveBeenCalledTimes(2);
    const sentToA = send.mock.calls.map(([input]) => input).find((input) => input.to === a.user.email)!;
    expect(sentToA.text).toContain("Overdue by 5 weeks");
    expect(sentToA.text).toContain("Due in 3 days");
    expect(sentToA.text).not.toContain("Too far away");
    expect(sentToA.react).toBeDefined();
    const markers = await db.select().from(reminderSent);
    expect(markers).toEqual(expect.arrayContaining([
      { taskId: overdue.id, sentOn: TODAY }, { taskId: cutoff.id, sentOn: TODAY },
    ]));

    send.mockClear();
    expect((await (await request()).json()).counts).toMatchObject({ reminderEmails: 0, reminderTasks: 0, sentEmails: 0 });
    expect(send).not.toHaveBeenCalled();

    vi.setSystemTime(new Date("2026-11-03T13:00:00Z"));
    expect((await (await request()).json()).counts).toMatchObject({ reminderEmails: 2, reminderTasks: 4 });
  });

  it("honors weekly-only preferences and records Monday summaries even for empty homes", async () => {
    const fixture = await newHome({ emailReminders: false, weeklySummary: true });
    await addTask(fixture.home.id);
    const empty = await newHome({ emailReminders: false, weeklySummary: true });
    expect((await (await request()).json()).counts).toMatchObject({ reminderEmails: 0, weeklySummaries: 2, sentEmails: 2 });
    expect(send.mock.calls.every(([input]) => input.subject.includes("weekly"))).toBe(true);
    expect((await db.select().from(home).where(eq(home.id, empty.home.id)))[0].lastWeeklySummaryOn).toBe(TODAY);
    send.mockClear();
    expect((await (await request()).json()).counts.weeklySummaries).toBe(0);
    expect(send).not.toHaveBeenCalled();
  });

  it("uses each user's local date for the Monday decision, task cutoff, and markers", async () => {
    vi.setSystemTime(new Date("2026-11-02T00:30:00Z"));
    const la = await newHome({ weeklySummary: true, timeZone: "America/Los_Angeles" });
    const tokyo = await newHome({ weeklySummary: true, timeZone: "Asia/Tokyo" });
    await addTask(la.home.id, "Outside Sunday cutoff", "2026-11-05");
    const laTask = await addTask(la.home.id, "Sunday task", "2026-11-04");
    await addTask(tokyo.home.id, "Inside Monday cutoff", "2026-11-05");
    const body = await (await request()).json();
    expect(body.counts).toMatchObject({ reminderEmails: 2, reminderTasks: 2, weeklySummaries: 1, sentEmails: 3 });
    expect((await db.select().from(reminderSent).where(eq(reminderSent.taskId, laTask.id)))[0].sentOn).toBe("2026-11-01");
    const summaryEmail = send.mock.calls.find(([input]) => input.subject.includes("weekly"))![0];
    expect(summaryEmail.to).toBe(tokyo.user.email);
  });

  it("dry runs return selected tasks and weekly details without sending or changing either marker", async () => {
    const fixture = await newHome({ weeklySummary: true });
    const row = await addTask(fixture.home.id);
    const first = await request("?dryRun=1");
    expect(first.status).toBe(200);
    const body = await first.json();
    expect(body.dryRun).toBe(true);
    expect(body.counts).toMatchObject({ reminderEmails: 1, reminderTasks: 1, weeklySummaries: 1, sentEmails: 0 });
    expect(body.deliveries[0]).toMatchObject({ homeId: fixture.home.id, today: TODAY, tasks: [{ id: row.id, title: row.title }] });
    expect(body.deliveries[0].weeklySummary).toMatchObject({ completed: [], spentCents: 0 });
    expect(send).not.toHaveBeenCalled();
    expect(await db.select().from(reminderSent)).toEqual([]);
    expect((await db.select().from(home).where(eq(home.id, fixture.home.id)))[0].lastWeeklySummaryOn).toBeNull();
    expect(await (await request("?dryRun=1")).json()).toEqual(body);
  });

  it("weekly summaries use the previous seven days of work and spend, plus upcoming and overdue tasks", async () => {
    const fixture = await newHome({ emailReminders: false, weeklySummary: true });
    await db.insert(logEntry).values([
      { homeId: fixture.home.id, title: "First day", date: "2026-10-26", costCents: 12345 },
      { homeId: fixture.home.id, title: "Last day", date: "2026-11-01", costCents: 55 },
      { homeId: fixture.home.id, title: "No cost", date: "2026-10-30", costCents: null },
      { homeId: fixture.home.id, title: "Too early", date: "2026-10-25", costCents: 999999 },
      { homeId: fixture.home.id, title: "Today", date: TODAY, costCents: 999999 },
    ]);
    await addTask(fixture.home.id, "Overdue", "2026-11-01");
    await addTask(fixture.home.id, "Today", TODAY);
    await addTask(fixture.home.id, "Seventh day", "2026-11-09");
    await addTask(fixture.home.id, "Beyond", "2026-11-10");
    await addTask(fixture.home.id, "Done", TODAY, TODAY);
    const summary = await getWeeklySummary(fixture.home.id, TODAY);
    expect(summary.completed).toHaveLength(3);
    expect(summary.spentCents).toBe(12400);
    expect(summary.upcoming.map((t) => t.title)).toEqual(["Today", "Seventh day"]);
    expect(summary.overdue.map((t) => t.title)).toEqual(["Overdue"]);
    expect((await request()).status).toBe(200);
    const input = send.mock.calls[0][0];
    expect(input.text).toContain("3 completed");
    expect(input.text).toContain("$124.00");
    expect(input.text).not.toContain("Too early");
  });

  it("leaves failed deliveries unmarked for retry while other emails still succeed", async () => {
    const fixture = await newHome({ weeklySummary: true });
    await addTask(fixture.home.id);
    vi.spyOn(console, "error").mockImplementation(() => {});
    send.mockRejectedValueOnce(new Error("Resend unavailable"));
    const first = await request();
    expect(first.status).toBe(500);
    expect((await first.json()).counts).toMatchObject({ failedEmails: 1, sentEmails: 1 });
    expect(await db.select().from(reminderSent)).toEqual([]);
    expect((await db.select().from(home).where(eq(home.id, fixture.home.id)))[0].lastWeeklySummaryOn).toBe(TODAY);
    send.mockClear();
    expect((await request()).status).toBe(200);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0].subject).not.toContain("weekly");
  });

  it("keeps failed weekly summaries retryable without re-sending successful reminders", async () => {
    const fixture = await newHome({ weeklySummary: true });
    await addTask(fixture.home.id);
    vi.spyOn(console, "error").mockImplementation(() => {});
    send.mockResolvedValueOnce({ id: "daily", skipped: false }).mockRejectedValueOnce(new Error("Try later"));
    expect((await request()).status).toBe(500);
    expect((await db.select().from(home).where(eq(home.id, fixture.home.id)))[0].lastWeeklySummaryOn).toBeNull();
    send.mockClear();
    expect((await (await request()).json()).counts).toMatchObject({ reminderEmails: 0, weeklySummaries: 1, sentEmails: 1 });
  });

  it("does not consume delivery markers when email is unconfigured in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const fixture = await newHome({ weeklySummary: true });
    await addTask(fixture.home.id);
    vi.spyOn(console, "error").mockImplementation(() => {});
    send.mockResolvedValue({ id: null, skipped: true });
    const response = await request();
    expect(response.status).toBe(500);
    expect((await response.json()).counts).toMatchObject({ sentEmails: 0, skippedEmails: 2, failedEmails: 2 });
    expect(await db.select().from(reminderSent)).toEqual([]);
    expect((await db.select().from(home).where(eq(home.id, fixture.home.id)))[0].lastWeeklySummaryOn).toBeNull();
  });

  it("counts local logged deliveries as skipped and records them so repeat calls do not log them again", async () => {
    const fixture = await newHome({ weeklySummary: true });
    await addTask(fixture.home.id);
    send.mockResolvedValue({ id: null, skipped: true });
    expect((await (await request()).json()).counts).toMatchObject({ sentEmails: 0, skippedEmails: 2 });
    send.mockClear();
    expect((await (await request()).json()).counts).toMatchObject({ reminderEmails: 0, weeklySummaries: 0, skippedEmails: 0 });
    expect(send).not.toHaveBeenCalled();
  });
});
