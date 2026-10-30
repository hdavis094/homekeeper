"use client";

import { useState } from "react";
import { Button } from "@/app/ui/button";
import { FormError } from "@/app/ui/form-error";
import { Input } from "@/app/ui/input";
import { Modal } from "@/app/ui/modal";
import { Select } from "@/app/ui/select";
import { Textarea } from "@/app/ui/textarea";
import { completeTask } from "@/lib/actions/tasks";
import { formatShortDate, isValidDateString } from "@/lib/domain/dates";
import { nextDueDate, recurrenceText } from "@/lib/domain/tasks";
import { type NamedOption, selectOptions, type TaskFormValues } from "./options";
import { ReceiptField } from "./receipt-field";
import { useModalForm } from "./use-modal-form";

const PARAMS = ["complete"] as const;
const FORM_ID = "complete-task-form";

/** Complete modal (`?complete=<id>`): logs date, cost, vendor, receipt and notes for the task. */
export function CompleteModal({
  task,
  today,
  vendors,
}: {
  task: TaskFormValues;
  today: string;
  vendors: NamedOption[];
}) {
  const { state, pending, onSubmit, errors, close } = useModalForm(completeTask, PARAMS);
  const [date, setDate] = useState(today);
  const [uploading, setUploading] = useState(false);

  const outcome = task.recurrence
    ? isValidDateString(date)
      ? `${recurrenceText(task.recurrence)}. Next due ${formatShortDate(nextDueDate(task.dueDate, task.recurrence, date), today)}.`
      : recurrenceText(task.recurrence)
    : "This one-off task will be marked completed.";

  return (
    <Modal
      param="complete"
      title="Complete Task"
      subtitle={task.location ? `${task.title} • ${task.location}` : task.title}
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} disabled={pending || uploading}>
            {pending ? "Saving…" : uploading ? "Uploading…" : "Mark Complete"}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <FormError error={state?.formError} />
        <input type="hidden" name="taskId" value={task.id} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            name="date"
            type="date"
            label="Date completed"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={today}
            error={errors.date}
            hint={outcome}
            required
          />
          <Input
            name="cost"
            label="Cost"
            inputMode="decimal"
            placeholder="$0.00"
            error={errors.cost}
            hint="Leave blank if it was free"
          />
        </div>
        <Select
          name="vendorId"
          label="Vendor"
          defaultValue={task.vendorId ?? ""}
          options={selectOptions(vendors, "Did it myself")}
          error={errors.vendorId}
        />
        <ReceiptField error={errors.receiptUrl} onUploadingChange={setUploading} />
        <Textarea name="notes" label="Notes" placeholder="What was done?" error={errors.notes} />
      </form>
    </Modal>
  );
}
