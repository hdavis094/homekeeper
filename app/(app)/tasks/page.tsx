import type { Metadata } from "next";
import { ClipboardList, Plus, Wrench } from "lucide-react";
import { Button } from "@/app/ui/button";
import { EmptyState } from "@/app/ui/empty-state";
import { FilterChips } from "@/app/ui/filter-chips";
import { PageHeader } from "@/app/ui/page-header";
import { SearchInput } from "@/app/ui/search-input";
import { CompleteModal } from "@/app/ui/tasks/complete-modal";
import { LogRepairModal } from "@/app/ui/tasks/log-repair-modal";
import type { TaskFormValues } from "@/app/ui/tasks/options";
import { TaskFormModal } from "@/app/ui/tasks/task-form-modal";
import { TaskList } from "@/app/ui/tasks/task-list";
import { listItemOptions } from "@/lib/data/items";
import { getTask, listTasks, type TaskRow } from "@/lib/data/tasks";
import { listVendorOptions } from "@/lib/data/vendors";
import { TASK_STATUS_LABELS, TASK_STATUSES, type TaskStatus } from "@/lib/domain/constants";
import { getCurrentHome } from "@/lib/session";
import { requiredId } from "@/lib/validation/fields";

export const metadata: Metadata = { title: "Tasks · HomeKeeper" };

function param(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseStatus(value: string | undefined): TaskStatus | "all" {
  return TASK_STATUSES.includes(value as TaskStatus) ? (value as TaskStatus) : "all";
}

/** A task id from the URL, or null (bad ids would otherwise reach Postgres as invalid uuids). */
function parseId(value: string | undefined): string | null {
  const parsed = requiredId.safeParse(value);
  return parsed.success ? parsed.data : null;
}

function formValues(t: TaskRow): TaskFormValues {
  return {
    id: t.id,
    title: t.title,
    location: t.location,
    dueDate: t.dueDate,
    recurrence: t.recurrence,
    itemId: t.itemId,
    vendorId: t.vendorId,
    notes: t.notes,
    completed: t.status === "completed",
  };
}

export default async function TasksPage({ searchParams }: PageProps<"/tasks">) {
  const sp = await searchParams;
  const status = parseStatus(param(sp.status));
  const q = param(sp.q)?.trim() ?? "";
  const isNew = Boolean(param(sp.new));
  const isLog = Boolean(param(sp.log));
  const editId = parseId(param(sp.edit));
  const completeId = parseId(param(sp.complete));
  const needsOptions = isNew || isLog || editId !== null || completeId !== null;

  const [{ today }, { tasks, counts }, items, vendors, editing, completing] = await Promise.all([
    getCurrentHome(),
    listTasks({ status, q }),
    needsOptions ? listItemOptions() : [],
    needsOptions ? listVendorOptions() : [],
    editId ? getTask(editId) : null,
    completeId ? getTask(completeId) : null,
  ]);

  /** `/tasks` with the current filters plus `extra` (opens a modal without losing the list state). */
  function hrefFor(extra: Record<string, string> = {}) {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (q) params.set("q", q);
    for (const [k, v] of Object.entries(extra)) params.set(k, v);
    const qs = params.toString();
    return qs ? `/tasks?${qs}` : "/tasks";
  }

  const filtered = status !== "all" || q !== "";

  return (
    <>
      <PageHeader title="Tasks" subtitle="Manage every maintenance task for your home.">
        <SearchInput placeholder="Search tasks..." aria-label="Search tasks" className="w-full sm:w-auto" />
        <Button variant="secondary" href={hrefFor({ log: "1" })} className="max-sm:flex-1">
          <Wrench aria-hidden="true" className="w-4 h-4" />
          Log Repair
        </Button>
        <Button href={hrefFor({ new: "1" })} className="max-sm:flex-1">
          <Plus aria-hidden="true" className="w-4 h-4" />
          Add Task
        </Button>
      </PageHeader>

      <FilterChips
        param="status"
        defaultValue="all"
        className="mb-6"
        options={[
          { value: "all", label: "All", count: counts.all },
          ...TASK_STATUSES.map((s) => ({ value: s, label: TASK_STATUS_LABELS[s], count: counts[s] })),
        ]}
      />

      {tasks.length > 0 ? (
        <TaskList tasks={tasks} hrefFor={hrefFor} />
      ) : (
        <EmptyState
          icon={<ClipboardList aria-hidden="true" className="w-5 h-5" />}
          title={filtered ? "No tasks match" : "No tasks yet"}
          description={
            filtered
              ? q
                ? `Nothing ${status === "all" ? "" : `${TASK_STATUS_LABELS[status].toLowerCase()} `}matches “${q}”.`
                : `You have no ${TASK_STATUS_LABELS[status as TaskStatus].toLowerCase()} tasks.`
              : "Add your first maintenance task and HomeKeeper will keep track of when it's due."
          }
          action={
            filtered ? (
              <Button variant="secondary" href="/tasks">
                Clear filters
              </Button>
            ) : (
              <Button href="/tasks?new=1">
                <Plus aria-hidden="true" className="w-4 h-4" />
                Add Task
              </Button>
            )
          }
        />
      )}

      {isNew && <TaskFormModal today={today} items={items} vendors={vendors} />}
      {editing && (
        <TaskFormModal
          key={editing.id}
          task={formValues(editing)}
          today={today}
          items={items}
          vendors={vendors}
          completeHref={hrefFor({ complete: editing.id })}
        />
      )}
      {completing && completing.status !== "completed" && (
        <CompleteModal key={completing.id} task={formValues(completing)} today={today} vendors={vendors} />
      )}
      {isLog && <LogRepairModal today={today} items={items} vendors={vendors} />}
    </>
  );
}
