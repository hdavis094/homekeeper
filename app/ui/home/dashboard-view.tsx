import React from "react";
import Link from "next/link";
import { Wrench } from "lucide-react";
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  ListRow,
  PageHeader,
  StatCard,
  StatusPill,
} from "@/app/ui";
import type { HomeViewModel } from "./view-model";

export interface HomeDashboardViewProps {
  viewModel: HomeViewModel;
  user: {
    name: string;
    image?: string | null;
  };
}

export function HomeDashboardView({ viewModel, user }: HomeDashboardViewProps) {
  const { greeting, statCards, upcomingMaintenance, systems, quickActions, isEmpty } =
    viewModel;

  return (
    <div className="space-y-5">
      <PageHeader
        title={greeting.title}
        subtitle={greeting.subtitle}
        actions={
          <>
            <form action="/tasks" method="get" role="search" className="w-full sm:w-auto">
              <input
                type="search"
                name="q"
                placeholder="Search tasks..."
                aria-label="Search tasks"
                className="h-9 w-full sm:w-[220px] px-3 bg-card border border-border rounded-[8px] text-[13px] text-ink placeholder:text-muted-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </form>
            <Button variant="primary" href="/tasks?new=1">
              + Add Task
            </Button>
            <Avatar name={user.name} image={user.image} tone="ink" size="md" />
          </>
        }
      />

      {/* 4 Stat Cards */}
      <section aria-label="Home summary statistics">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {statCards.map((card) => (
            <StatCard
              key={card.id}
              label={card.label}
              value={card.value}
              sublabel={card.sublabel}
              tone={card.tone}
            />
          ))}
        </div>
      </section>

      {/* Main 2-column body at 1440px, single column at 390px */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Upcoming Maintenance (left 2/3 column) */}
        <Card padding="none" className="lg:col-span-2 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-divider">
            <h2 className="text-[16px] font-bold text-ink">
              Upcoming Maintenance
            </h2>
            <Link
              href="/tasks"
              className="text-[13px] font-semibold text-primary hover:underline"
            >
              View all
            </Link>
          </div>

          {isEmpty.tasks ? (
            <EmptyState
              icon={<Wrench className="w-5 h-5" />}
              title="No upcoming maintenance tasks"
              description="Add your first maintenance task to stay on top of seasonal upkeep and home repairs."
              action={
                <Button variant="primary" size="sm" href="/tasks?new=1">
                  + Add Task
                </Button>
              }
              className="border-0 rounded-none"
            />
          ) : (
            <div>
              {upcomingMaintenance.map((task) => (
                <ListRow
                  key={task.id}
                  tone={task.status}
                  title={task.title}
                  meta={task.meta}
                  trailing={<StatusPill status={task.status} />}
                  href={task.href}
                />
              ))}
            </div>
          )}
        </Card>

        {/* Right 1/3 column: Home Systems + Quick Actions */}
        <div className="space-y-5">
          <Card className="space-y-4">
            <h2 className="text-[16px] font-bold text-ink">Home Systems</h2>
            <div className="divide-y divide-divider">
              {systems.map((sys) => (
                <div
                  key={sys.system}
                  className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                >
                  <span className="text-[14px] font-medium text-ink">
                    {sys.label}
                  </span>
                  <StatusPill status={sys.status} dot>
                    {sys.pillLabel}
                  </StatusPill>
                </div>
              ))}
            </div>

            {isEmpty.items && (
              <div className="pt-3 border-t border-divider">
                <div className="rounded-[8px] bg-bg p-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-ink">
                      No systems or items tracked yet
                    </p>
                    <p className="text-[12px] text-muted mt-0.5">
                      Add your appliances and systems to monitor their condition.
                    </p>
                  </div>
                  <Button variant="secondary" size="sm" href="/inventory?new=1">
                    + Add Item
                  </Button>
                </div>
              </div>
            )}
          </Card>

          <Card className="space-y-3.5">
            <h2 className="text-[16px] font-bold text-ink">Quick Actions</h2>
            <div className="flex flex-col gap-2.5">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-3 h-9 px-3.5 rounded-[8px] border border-border bg-card text-[13px] font-medium text-ink hover:bg-bg/60 transition-colors"
                >
                  <span
                    aria-hidden="true"
                    className="w-2 h-2 rounded-[2px] shrink-0"
                    style={{ backgroundColor: action.bulletColor }}
                  />
                  <span>{action.label}</span>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default HomeDashboardView;
