import React from "react";
import { notFound } from "next/navigation";
import { Plus, Wrench } from "lucide-react";
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  Field,
  FilterChips,
  FormError,
  IconTile,
  Input,
  ListRow,
  Menu,
  Modal,
  PageHeader,
  SearchInput,
  Select,
  SideNav,
  StatCard,
  StatusPill,
  Textarea,
  Toggle,
} from "@/app/ui";

const fakeUser = {
  name: "Alex Morgan",
  address: "123 Maple St.",
  image: null,
};

async function fakeSignOut() {
  "use server";
}

export default function KitPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col md:flex-row">
      <SideNav user={fakeUser} signOut={fakeSignOut} />

      <main className="flex-1 bg-bg p-5 md:p-[40px] min-w-0 space-y-8">
        {/* 1. PageHeader + SearchInput + Primary Button */}
        <PageHeader
          title="UI Kit & Shell"
          subtitle="Every HomeKeeper primitive, token, and component variant in one place."
          actions={
            <>
              <SearchInput placeholder="Search tasks..." />
              <Button variant="secondary" href="/kit?modal=demo">
                Open Modal
              </Button>
              <Button variant="primary">
                <Plus className="w-4 h-4" />
                Add Task
              </Button>
            </>
          }
        />

        {/* 2. StatCards (4-column grid matching home.png) */}
        <section aria-labelledby="kit-stats">
          <h2 id="kit-stats" className="text-[16px] font-bold text-ink mb-3">
            Stat Cards
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              label="Upcoming Tasks"
              value="8"
              sublabel="Next 30 days"
              tone="ink"
            />
            <StatCard
              label="Overdue"
              value="2"
              sublabel="Needs attention"
              tone="overdue"
            />
            <StatCard
              label="Completed This Month"
              value="14"
              sublabel="+3 vs last month · $285 spent"
              tone="completed"
            />
            <StatCard
              label="Home Health Score"
              value="92%"
              sublabel="Looking good"
              tone="primary"
            />
          </div>
        </section>

        {/* 3. FilterChips + StatusPills + Buttons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card className="space-y-5">
            <div>
              <h2 className="text-[16px] font-bold text-ink mb-3">
                Filter Chips (URL-driven)
              </h2>
              <FilterChips
                param="status"
                defaultValue="all"
                options={[
                  { value: "all", label: "All", count: 12 },
                  { value: "overdue", label: "Overdue", count: 2 },
                  { value: "due_soon", label: "Due Soon", count: 3 },
                  { value: "scheduled", label: "Scheduled", count: 5 },
                  { value: "completed", label: "Completed", count: 2 },
                ]}
              />
            </div>

            <div>
              <h2 className="text-[16px] font-bold text-ink mb-3">
                Buttons & Sizes
              </h2>
              <div className="flex flex-wrap items-center gap-2.5">
                <Button variant="primary">+ Add Task</Button>
                <Button variant="secondary">Save Changes</Button>
                <Button variant="ghost">Cancel</Button>
                <Button variant="danger">Delete Account</Button>
                <Button variant="primary" size="sm">
                  Small
                </Button>
                <Button variant="primary" size="lg">
                  Large
                </Button>
                <Button variant="primary" disabled>
                  Disabled
                </Button>
              </div>
            </div>
          </Card>

          <Card className="space-y-5">
            <div>
              <h2 className="text-[16px] font-bold text-ink mb-3">
                Status Pills & System Dot Pills
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill status="overdue" />
                <StatusPill status="due_soon" />
                <StatusPill status="scheduled" />
                <StatusPill status="completed" />
                <StatusPill status="good" />
                <StatusPill status="needs_service" />
                <StatusPill status="good" dot>
                  Good
                </StatusPill>
                <StatusPill status="needs_attention" dot>
                  Needs Attention
                </StatusPill>
              </div>
            </div>

            <div>
              <h2 className="text-[16px] font-bold text-ink mb-3">
                Trade Pills & Icon Tiles
              </h2>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <StatusPill status="plumbing" />
                <StatusPill status="electrical" />
                <StatusPill status="hvac" />
                <StatusPill status="landscaping" />
                <StatusPill status="general" />
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <IconTile tone="overdue" />
                <IconTile tone="due_soon" />
                <IconTile tone="scheduled" />
                <IconTile tone="completed" />
                <IconTile tone="general" />
              </div>
            </div>
          </Card>
        </div>

        {/* 4. ListRow + Home Systems matching home.png & tasks.png */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card padding="none" className="lg:col-span-2 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-divider">
              <h2 className="text-[16px] font-bold text-ink">
                Upcoming Maintenance (ListRow)
              </h2>
              <span className="text-[13px] font-semibold text-primary">
                View all
              </span>
            </div>
            <div>
              <ListRow
                tone="overdue"
                title="Flush Water Heater"
                meta="Basement • Overdue by 2 days"
                trailing={<StatusPill status="overdue" />}
                href="/kit?edit=1"
              />
              <ListRow
                tone="due_soon"
                title="Replace HVAC Filter"
                meta="Living Room • Due in 3 days"
                trailing={<StatusPill status="due_soon" />}
                href="/kit?edit=2"
              />
              <ListRow
                tone="scheduled"
                title="Clean Gutters"
                meta="Exterior • Due in 1 week"
                trailing={<StatusPill status="scheduled" />}
                href="/kit?edit=3"
              />
              <ListRow
                tone="completed"
                title="Winterize Sprinkler System"
                meta="Yard • Completed Sep 28"
                trailing={<StatusPill status="completed" />}
                href="/kit?edit=4"
              />
            </div>
          </Card>

          <Card className="space-y-4">
            <h2 className="text-[16px] font-bold text-ink">Home Systems</h2>
            <div className="divide-y divide-divider">
              {[
                { name: "HVAC", status: "good" as const, label: "Good" },
                { name: "Roof", status: "good" as const, label: "Good" },
                {
                  name: "Plumbing",
                  status: "needs_attention" as const,
                  label: "Needs Attention",
                },
                { name: "Electrical", status: "good" as const, label: "Good" },
              ].map((sys) => (
                <div
                  key={sys.name}
                  className="py-3 first:pt-0 last:pb-0 flex items-center justify-between"
                >
                  <span className="text-[14px] font-medium text-ink">
                    {sys.name}
                  </span>
                  <StatusPill status={sys.status} dot>
                    {sys.label}
                  </StatusPill>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* 5. Inventory Card, Vendor Card with Avatar & Contact Menu */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="space-y-3">
            <IconTile tone="good" />
            <div>
              <h3 className="text-[15px] font-bold text-ink">HVAC System</h3>
              <p className="text-[13px] text-muted">Carrier Infinity 24</p>
            </div>
            <div className="pt-2 flex items-center justify-between">
              <span className="text-[12px] text-muted-2">Installed 2019</span>
              <StatusPill status="good" />
            </div>
          </Card>

          <Card className="space-y-3">
            <IconTile tone="needs_service" />
            <div>
              <h3 className="text-[15px] font-bold text-ink">Water Heater</h3>
              <p className="text-[13px] text-muted">
                Rheem Performance Platinum
              </p>
            </div>
            <div className="pt-2 flex items-center justify-between">
              <span className="text-[12px] text-muted-2">Installed 2021</span>
              <StatusPill status="needs_service" />
            </div>
          </Card>

          <Card className="space-y-3">
            <div className="flex items-center gap-3">
              <Avatar name="Mike's Plumbing Co." tone="ink" />
              <div className="min-w-0">
                <h3 className="text-[15px] font-bold text-ink truncate">
                  Mike&apos;s Plumbing Co.
                </h3>
                <StatusPill status="plumbing" className="mt-1" />
              </div>
            </div>
            <div className="space-y-1 text-[13px] text-muted">
              <div className="font-semibold text-ink">★ 4.9 rating</div>
              <div>(555) 212-3344</div>
              <div className="text-[12px] text-muted-2">
                Last hired: Jan 2026
              </div>
            </div>
            <Menu
              label="Contact"
              phone="(555) 212-3344"
              email="mike@plumbing.example.com"
            />
          </Card>
        </div>

        {/* 6. Form Fields (Input, Select, Textarea, FormError) & Toggles */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card className="space-y-4">
            <h2 className="text-[16px] font-bold text-ink">
              Form Controls (Field, Input, Select, Textarea, FormError)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                defaultValue="Alex Morgan"
                placeholder="Your full name"
              />
              <Select
                label="Home Type"
                defaultValue="Single Family"
                options={[
                  { value: "Single Family", label: "Single Family" },
                  { value: "Townhouse", label: "Townhouse" },
                  { value: "Condo", label: "Condo" },
                ]}
              />
            </div>
            <Field
              label="Task Title (with validation error)"
              error="Task title is required."
            >
              <Input
                defaultValue=""
                placeholder="e.g., Flush Water Heater"
                error="Task title is required."
              />
            </Field>
            <Textarea
              label="Notes"
              rows={2}
              defaultValue="Check pressure relief valve and drain 2 gallons."
            />
            <FormError message="Unable to save changes. Please check the highlighted fields." />
          </Card>

          <div className="space-y-5">
            <Card className="space-y-4">
              <h2 className="text-[16px] font-bold text-ink">
                Notification Toggles
              </h2>
              <div className="divide-y divide-divider">
                <div className="py-3 first:pt-0">
                  <Toggle
                    label="Email Reminders"
                    description="Get an email before each maintenance task is due."
                    defaultChecked={true}
                  />
                </div>
                <div className="py-3">
                  <Toggle
                    label="Weekly Summary"
                    description="A Monday recap of completed and upcoming tasks."
                    defaultChecked={false}
                  />
                </div>
                <div className="py-3 last:pb-0">
                  <Toggle
                    label="Push Notifications"
                    description="Receive mobile push alerts for overdue tasks."
                    defaultChecked={false}
                    disabled
                    comingSoon
                  />
                </div>
              </div>
            </Card>

            <EmptyState
              icon={<Wrench className="w-5 h-5" />}
              title="No maintenance tasks found"
              description="Get started by adding your first recurring home maintenance task."
              action={<Button variant="primary">+ Add Task</Button>}
            />
          </div>
        </div>

        {/* 7. URL-driven Modal (?modal=demo) */}
        <Modal
          param="modal"
          paramValue="demo"
          title="Add Maintenance Task"
          subtitle="Schedule a one-time or recurring maintenance task."
          footer={
            <>
              <Button variant="secondary" href="/kit">
                Cancel
              </Button>
              <Button variant="primary">Save Task</Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input label="Task Title" defaultValue="Flush Water Heater" />
            <Input label="Location" defaultValue="Basement" />
          </div>
        </Modal>
      </main>
    </div>
  );
}
