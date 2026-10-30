const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const usdWhole = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** Money is stored as integer cents. */
export function formatCents(cents: number, options: { whole?: boolean } = {}): string {
  return (options.whole ? usdWhole : usd).format(cents / 100);
}

/** "$1,234.5" → 123450. Returns null for anything that isn't a non-negative amount with ≤2 decimals. */
export function dollarsToCents(input: string): number | null {
  const cleaned = input.trim().replace(/^\$/, "").replaceAll(",", "");
  const m = /^(\d+)(?:\.(\d{1,2}))?$/.exec(cleaned);
  if (!m) return null;
  return Number(m[1]) * 100 + Number((m[2] ?? "").padEnd(2, "0"));
}

/** "Alex Morgan" → "AM" (avatar fallback). */
export function initials(name: string): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join("");
  return letters || "?";
}
