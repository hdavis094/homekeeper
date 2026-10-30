// The demo dataset from the wireframes (docs/design/*.png), with dates relative to `today`.
// Pure: lib/db/seed.ts writes it.
import type { HomeType, ItemCategory, ItemCondition, Recurrence, VendorTrade } from "@/lib/domain/constants";
import { addDays, addMonths } from "@/lib/domain/dates";

export const DEMO_USER = {
  name: "Alex Morgan",
  email: "alex.morgan@email.com",
  password: "homekeeper-demo",
  phone: "(555) 123-4567",
  timeZone: "America/New_York",
};

export type SeedItem = {
  name: string;
  model: string;
  category: ItemCategory;
  installedYear: number;
  condition: ItemCondition;
  notes: string | null;
};

export type SeedVendor = {
  name: string;
  trade: VendorTrade;
  phone: string;
  email: string | null;
  rating: number;
  notes: string | null;
};

export type SeedTask = {
  title: string;
  location: string;
  dueDate: string;
  recurrence: Recurrence | null;
  completedAt: string | null;
  itemName: string | null;
  vendorName: string | null;
  notes: string | null;
};

export type SeedLogEntry = {
  title: string;
  date: string;
  costCents: number | null;
  vendorName: string | null;
  itemName: string | null;
  taskTitle: string | null;
  notes: string | null;
};

export type SeedData = {
  home: {
    address: string;
    homeType: HomeType;
    yearBuilt: number;
    squareFeet: number;
    emailReminders: boolean;
    weeklySummary: boolean;
  };
  items: SeedItem[];
  vendors: SeedVendor[];
  tasks: SeedTask[];
  log: SeedLogEntry[];
};

const yearly: Recurrence = { every: 1, unit: "year" };
const quarterly: Recurrence = { every: 3, unit: "month" };
const twiceYearly: Recurrence = { every: 6, unit: "month" };

export function buildSeedData(today: string): SeedData {
  const monthStart = `${today.slice(0, 7)}-01`;
  /** Day `day` of the month `monthsAgo` months back, never after today. */
  const monthDay = (monthsAgo: number, day: number) => {
    const start = addMonths(monthStart, -monthsAgo);
    const end = addDays(addMonths(start, 1), -1);
    const date = addDays(start, day - 1);
    const inMonth = date > end ? end : date;
    return inMonth > today ? today : inMonth;
  };

  const items: SeedItem[] = [
    { name: "HVAC System", model: "Carrier Infinity 24", category: "hvac", installedYear: 2019, condition: "good", notes: null },
    {
      name: "Water Heater",
      model: "Rheem Performance Platinum",
      category: "plumbing",
      installedYear: 2021,
      condition: "needs_service",
      notes: "50 gal. Anode rod due for inspection.",
    },
    { name: "Refrigerator", model: "LG French Door", category: "kitchen", installedYear: 2020, condition: "good", notes: null },
    { name: "Washer", model: "Samsung Front Load", category: "laundry", installedYear: 2022, condition: "good", notes: null },
    { name: "Dryer", model: "Samsung Front Load", category: "laundry", installedYear: 2022, condition: "good", notes: null },
    {
      name: "Roof",
      model: "Asphalt Shingle",
      category: "roof",
      installedYear: 2015,
      condition: "needs_service",
      notes: "A few lifted shingles on the north side.",
    },
    { name: "Water Softener", model: "Culligan Gen 2", category: "plumbing", installedYear: 2020, condition: "good", notes: null },
    {
      name: "Sump Pump",
      model: "Zoeller M53",
      category: "plumbing",
      installedYear: 2018,
      condition: "needs_service",
      notes: "Float switch sticks occasionally.",
    },
    { name: "Smoke Detectors (x6)", model: "First Alert", category: "safety", installedYear: 2023, condition: "good", notes: null },
  ];

  const vendors: SeedVendor[] = [
    { name: "Mike's Plumbing Co.", trade: "plumbing", phone: "(555) 212-3344", email: "service@mikesplumbing.example.com", rating: 4.9, notes: null },
    { name: "BrightSpark Electric", trade: "electrical", phone: "(555) 998-2211", email: "hello@brightspark.example.com", rating: 4.8, notes: null },
    { name: "CoolBreeze HVAC", trade: "hvac", phone: "(555) 334-7765", email: "booking@coolbreeze.example.com", rating: 4.7, notes: "Annual service plan." },
    { name: "GreenScape Landscaping", trade: "landscaping", phone: "(555) 887-1123", email: null, rating: 4.6, notes: null },
    { name: "Reliable Roofing Co.", trade: "general", phone: "(555) 442-9087", email: "office@reliableroofing.example.com", rating: 4.9, notes: null },
    { name: "Precision Pest Control", trade: "general", phone: "(555) 665-3321", email: null, rating: 4.5, notes: "Quarterly treatment." },
    { name: "ClearView Window Cleaning", trade: "general", phone: "(555) 221-6654", email: null, rating: 4.8, notes: null },
    { name: "Apex Appliance Repair", trade: "general", phone: "(555) 778-0099", email: "repairs@apex.example.com", rating: 4.7, notes: null },
    { name: "Northside Chimney Sweep", trade: "general", phone: "(555) 556-4432", email: null, rating: 4.6, notes: null },
  ];

  const open = (
    title: string,
    location: string,
    days: number,
    recurrence: Recurrence | null,
    links: { itemName?: string; vendorName?: string; notes?: string } = {},
  ): SeedTask => ({
    title,
    location,
    dueDate: addDays(today, days),
    recurrence,
    completedAt: null,
    itemName: links.itemName ?? null,
    vendorName: links.vendorName ?? null,
    notes: links.notes ?? null,
  });

  const sprinklerDone = monthDay(1, 28);
  const igniterDone = monthDay(1, 20);

  const tasks: SeedTask[] = [
    open("Flush Water Heater", "Basement", -2, yearly, { itemName: "Water Heater", notes: "Drain until the water runs clear." }),
    open("Inspect Sump Pump", "Basement", -5, quarterly, { itemName: "Sump Pump" }),
    open("Replace HVAC Filter", "Living Room", 3, quarterly, { itemName: "HVAC System", notes: "16x25x1 MERV 11." }),
    open("Clean Range Hood Filter", "Kitchen", 4, quarterly),
    open("Check Fire Extinguisher", "Garage", 6, yearly),
    open("Clean Gutters", "Exterior", 8, twiceYearly, { vendorName: "GreenScape Landscaping" }),
    open("Test Smoke Detectors", "Whole Home", 14, twiceYearly, { itemName: "Smoke Detectors (x6)" }),
    open("Clean Dryer Vent", "Laundry Room", 21, yearly, { itemName: "Dryer" }),
    open("Service Water Softener", "Basement", 35, yearly, { itemName: "Water Softener", vendorName: "Mike's Plumbing Co." }),
    open("Pressure Wash Driveway", "Exterior", 42, yearly),
    {
      title: "Winterize Sprinkler System",
      location: "Yard",
      dueDate: sprinklerDone,
      recurrence: null,
      completedAt: sprinklerDone,
      itemName: null,
      vendorName: null,
      notes: null,
    },
    {
      title: "Replace Furnace Igniter",
      location: "Basement",
      dueDate: igniterDone,
      recurrence: null,
      completedAt: igniterDone,
      itemName: "HVAC System",
      vendorName: "CoolBreeze HVAC",
      notes: null,
    },
  ];

  const entry = (
    title: string,
    date: string,
    dollars: number | null,
    links: { vendorName?: string; itemName?: string; taskTitle?: string; notes?: string } = {},
  ): SeedLogEntry => ({
    title,
    date,
    costCents: dollars === null ? null : Math.round(dollars * 100),
    vendorName: links.vendorName ?? null,
    itemName: links.itemName ?? null,
    taskTitle: links.taskTitle ?? null,
    notes: links.notes ?? null,
  });

  const log: SeedLogEntry[] = [
    // Completed tasks (last month).
    entry("Winterize Sprinkler System", sprinklerDone, 35, { taskTitle: "Winterize Sprinkler System", notes: "Blew out lines, DIY." }),
    entry("Replace Furnace Igniter", igniterDone, 245, {
      taskTitle: "Replace Furnace Igniter",
      vendorName: "CoolBreeze HVAC",
      itemName: "HVAC System",
    }),
    // This month (so the dashboard shows a positive delta and spend).
    entry("Quarterly pest treatment", monthDay(0, 3), 95, { vendorName: "Precision Pest Control" }),
    entry("Re-caulk master bathtub", monthDay(0, 5), 18),
    entry("Touch up exterior trim paint", monthDay(0, 8), 42),
    entry("Replace kitchen faucet cartridge", monthDay(0, 12), 27.5),
    // Vendor history ("Last hired" months match vendors.png relative to its Mar 2026 "today").
    entry("Repair kitchen sink leak", monthDay(2, 10), 185, { vendorName: "Mike's Plumbing Co." }),
    entry("Dishwasher drain pump repair", monthDay(3, 14), 165, { vendorName: "Apex Appliance Repair" }),
    entry("Install outdoor GFCI outlets", monthDay(4, 9), 240, { vendorName: "BrightSpark Electric" }),
    entry("Fall yard cleanup", monthDay(5, 18), 320, { vendorName: "GreenScape Landscaping" }),
    entry("Exterior window cleaning", monthDay(6, 6), 180, { vendorName: "ClearView Window Cleaning" }),
    entry("Chimney sweep and inspection", monthDay(7, 22), 225, { vendorName: "Northside Chimney Sweep" }),
    entry("Roof inspection and shingle repair", monthDay(9, 15), 450, {
      vendorName: "Reliable Roofing Co.",
      itemName: "Roof",
    }),
    entry("Water heater thermostat replacement", monthDay(11, 4), 210, {
      vendorName: "Mike's Plumbing Co.",
      itemName: "Water Heater",
    }),
  ];

  return {
    home: {
      address: "123 Maple St, Springfield",
      homeType: "single_family",
      yearBuilt: 1998,
      squareFeet: 2400,
      emailReminders: true,
      weeklySummary: false,
    },
    items,
    vendors,
    tasks,
    log,
  };
}
