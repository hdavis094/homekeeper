"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/app/ui/button";
import { FormError } from "@/app/ui/form-error";
import { Input } from "@/app/ui/input";
import { Modal } from "@/app/ui/modal";
import { Select } from "@/app/ui/select";
import { Textarea } from "@/app/ui/textarea";
import { createTask, deleteTask, updateTask } from "@/lib/actions/tasks";
import type { RecurrenceUnit } from "@/lib/domain/constants";
import { type NamedOption, REPEAT_OPTIONS, selectOptions, type TaskFormValues } from "./options";
import { useModalForm } from "./use-modal-form";

const NEW_PARAMS = ["new"] as const;
const EDIT_PARAMS = ["edit"] as const;
const FORM_ID = "task-form";

/**
 * Add Task (`?new=1`) and Edit Task (`?edit=<id>`). Edit also offers Mark Complete (→ `?complete=<id>`)
 * and Delete with a confirm step.
 */
export function TaskFormModal({
  task,
  today,
  items,
  vendors,
  completeHref,
}: {
  /** Omit for Add Task. */
  task?: TaskFormValues;
  today: string;
  items: NamedOption[];
  vendors: NamedOption[];
  completeHref?: string;
}) {
  const editing = task !== undefined;
  const { state, pending, onSubmit, errors, close } = useModalForm(
    editing ? updateTask : createTask,
    editing ? EDIT_PARAMS : NEW_PARAMS,
  );
  const [unit, setUnit] = useState<RecurrenceUnit | "none">(task?.recurrence?.unit ?? "none");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, startDelete] = useTransition();

  function onDelete() {
    if (!task) return;
    startDelete(async () => {
      const result = await deleteTask(task.id);
      if (result.ok) close();
      else setDeleteError(result.formError ?? "Couldn't delete this task");
    });
  }

  const busy = pending || deleting;

  const footer = confirmingDelete ? (
    <>
      <p className="mr-auto text-[13px] font-medium text-ink">Delete this task? Its history stays in the log.</p>
      <Button variant="secondary" onClick={() => setConfirmingDelete(false)} disabled={deleting}>
        Cancel
      </Button>
      <Button variant="danger" onClick={onDelete} disabled={deleting}>
        {deleting ? "Deleting…" : "Delete"}
      </Button>
    </>
  ) : (
    <>
      {editing && (
        <Button
          variant="danger-ghost"
          onClick={() => setConfirmingDelete(true)}
          disabled={busy}
          className="mr-auto"
        >
          <Trash2 aria-hidden="true" className="w-4 h-4" />
          Delete
        </Button>
      )}
      {editing && completeHref && !task.completed && (
        <Button variant="secondary" href={completeHref}>
          Mark Complete
        </Button>
      )}
      {!editing && (
        <Button variant="secondary" onClick={close} disabled={busy}>
          Cancel
        </Button>
      )}
      <Button type="submit" form={FORM_ID} disabled={busy}>
        {pending ? "Saving…" : editing ? "Save Changes" : "Add Task"}
      </Button>
    </>
  );

  return (
    <Modal
      param={editing ? "edit" : "new"}
      title={editing ? "Edit Task" : "Add Task"}
      subtitle={editing ? undefined : "Schedule a one-off or recurring maintenance task."}
      footer={<div className="flex flex-wrap items-center justify-end gap-3 w-full">{footer}</div>}
    >
      <form id={FORM_ID} onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <FormError error={state?.formError ?? deleteError} />
        {task && <input type="hidden" name="id" value={task.id} />}
        <Input
          name="title"
          label="Title"
          placeholder="e.g. Replace HVAC Filter"
          defaultValue={task?.title}
          error={errors.title}
          required
          autoFocus={!editing}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            name="location"
            label="Location"
            placeholder="e.g. Basement"
            defaultValue={task?.location ?? ""}
            error={errors.location}
          />
          <Input
            name="dueDate"
            type="date"
            label="Due date"
            defaultValue={task?.dueDate ?? today}
            error={errors.dueDate}
            required
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            name="recurrenceUnit"
            label="Repeats"
            value={unit}
            onChange={(e) => setUnit(e.target.value as RecurrenceUnit | "none")}
            options={REPEAT_OPTIONS}
            error={errors.recurrenceUnit}
          />
          {unit !== "none" && (
            <Input
              name="recurrenceEvery"
              type="number"
              min={1}
              max={365}
              inputMode="numeric"
              label={`Repeat every (${unit}s)`}
              defaultValue={task?.recurrence?.every ?? 1}
              error={errors.recurrenceEvery}
            />
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            name="itemId"
            label="Linked item"
            defaultValue={task?.itemId ?? ""}
            options={selectOptions(items, "No item")}
            error={errors.itemId}
          />
          <Select
            name="vendorId"
            label="Vendor"
            defaultValue={task?.vendorId ?? ""}
            options={selectOptions(vendors, "No vendor")}
            error={errors.vendorId}
          />
        </div>
        <Textarea
          name="notes"
          label="Notes"
          placeholder="Parts, filter sizes, anything to remember"
          defaultValue={task?.notes ?? ""}
          error={errors.notes}
        />
      </form>
    </Modal>
  );
}
