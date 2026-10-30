import "server-only";
import { and, asc, eq, ilike, max, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { logEntry, vendor, type Vendor } from "@/lib/db/schema";
import { VENDOR_TRADES, type VendorTrade } from "@/lib/domain/constants";
import { formatMonthYear } from "@/lib/domain/dates";
import { type LogRow, selectLog } from "./log";
import { currentScope, type HomeScope, likePattern, isUuid } from "./scope";

export type VendorRow = Vendor & {
  /** Date of the latest log entry with this vendor, or null. */
  lastHired: string | null;
  /** "Last hired: Jan 2026" / "Never hired" */
  lastHiredText: string;
};

export type VendorCounts = Record<"all" | VendorTrade, number>;
export type VendorFilters = { trade?: VendorTrade | "all"; q?: string };

function toVendorRow(v: Vendor, lastHired: string | null): VendorRow {
  return {
    ...v,
    lastHired,
    lastHiredText: lastHired ? `Last hired: ${formatMonthYear(lastHired)}` : "Never hired",
  };
}

function selectVendors(homeId: string) {
  const hires = db
    .select({ vendorId: logEntry.vendorId, lastHired: max(logEntry.date).as("last_hired") })
    .from(logEntry)
    .where(eq(logEntry.homeId, homeId))
    .groupBy(logEntry.vendorId)
    .as("hires");
  return db
    .select({ vendor, lastHired: hires.lastHired })
    .from(vendor)
    .leftJoin(hires, eq(hires.vendorId, vendor.id));
}

/**
 * Vendors page, by name, filtered by trade and a search over name/phone/email/notes.
 * `counts` reflect the search but not the trade filter.
 */
export async function listVendors(filters: VendorFilters = {}) {
  return listVendorsFor(await currentScope(), filters);
}

export async function listVendorsFor(
  scope: HomeScope,
  filters: VendorFilters = {},
): Promise<{ vendors: VendorRow[]; counts: VendorCounts }> {
  const q = filters.q?.trim();
  const rows = await selectVendors(scope.homeId)
    .where(
      and(
        eq(vendor.homeId, scope.homeId),
        q
          ? or(
              ilike(vendor.name, likePattern(q)),
              ilike(vendor.phone, likePattern(q)),
              ilike(vendor.email, likePattern(q)),
              ilike(vendor.notes, likePattern(q)),
            )
          : undefined,
      ),
    )
    .orderBy(asc(vendor.name));
  const all = rows.map((r) => toVendorRow(r.vendor, r.lastHired));
  const counts = Object.fromEntries(["all", ...VENDOR_TRADES].map((k) => [k, 0])) as VendorCounts;
  for (const v of all) {
    counts.all += 1;
    counts[v.trade] += 1;
  }
  const trade = filters.trade && filters.trade !== "all" ? filters.trade : undefined;
  return { vendors: trade ? all.filter((v) => v.trade === trade) : all, counts };
}

export type VendorDetail = VendorRow & { log: LogRow[]; totalSpentCents: number };

export async function getVendor(id: string) {
  return getVendorFor(await currentScope(), id);
}

export async function getVendorFor(scope: HomeScope, id: string): Promise<VendorDetail | null> {
  if (!isUuid(id)) return null;
  const [row] = await selectVendors(scope.homeId)
    .where(and(eq(vendor.id, id), eq(vendor.homeId, scope.homeId)))
    .limit(1);
  if (!row) return null;
  const log = await selectLog(and(eq(logEntry.homeId, scope.homeId), eq(logEntry.vendorId, id)));
  return {
    ...toVendorRow(row.vendor, row.lastHired),
    log,
    totalSpentCents: log.reduce((sum, e) => sum + (e.costCents ?? 0), 0),
  };
}

export type VendorOption = { id: string; name: string; trade: VendorTrade };

/** For vendor selects (Add Task, Complete, Log a Repair). */
export async function listVendorOptions() {
  return listVendorOptionsFor(await currentScope());
}

export async function listVendorOptionsFor(scope: HomeScope): Promise<VendorOption[]> {
  return db
    .select({ id: vendor.id, name: vendor.name, trade: vendor.trade })
    .from(vendor)
    .where(eq(vendor.homeId, scope.homeId))
    .orderBy(asc(vendor.name));
}
