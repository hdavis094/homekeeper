"use client";

import { useState } from "react";
import { Button } from "@/app/ui/button";
import { FormError } from "@/app/ui/form-error";
import { Input } from "@/app/ui/input";
import { Modal } from "@/app/ui/modal";
import { Select } from "@/app/ui/select";
import { Textarea } from "@/app/ui/textarea";
import { logRepair } from "@/lib/actions/tasks";
import { type NamedOption, selectOptions } from "./options";
import { ReceiptField } from "./receipt-field";
import { useModalForm } from "./use-modal-form";

const PARAMS = ["log"] as const;
const FORM_ID = "log-repair-form";

/** Log a Repair (`?log=1`): one-off work with cost, vendor, item and receipt, not tied to a task. */
export function LogRepairModal({
  today,
  items,
  vendors,
}: {
  today: string;
  items: NamedOption[];
  vendors: NamedOption[];
}) {
  const { state, pending, onSubmit, errors, close } = useModalForm(logRepair, PARAMS);
  const [uploading, setUploading] = useState(false);

  return (
    <Modal
      param="log"
      title="Log a Repair"
      subtitle="Record work that wasn't a scheduled task."
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} disabled={pending || uploading}>
            {pending ? "Saving…" : uploading ? "Uploading…" : "Log Repair"}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <FormError error={state?.formError} />
        <Input
          name="title"
          label="What was fixed?"
          placeholder="e.g. Fix leaking kitchen faucet"
          error={errors.title}
          required
          autoFocus
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            name="date"
            type="date"
            label="Date"
            defaultValue={today}
            max={today}
            error={errors.date}
            required
          />
          <Input name="cost" label="Cost" inputMode="decimal" placeholder="$0.00" error={errors.cost} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            name="vendorId"
            label="Vendor"
            defaultValue=""
            options={selectOptions(vendors, "Did it myself")}
            error={errors.vendorId}
          />
          <Select
            name="itemId"
            label="Item"
            defaultValue=""
            options={selectOptions(items, "No item")}
            error={errors.itemId}
          />
        </div>
        <ReceiptField error={errors.receiptUrl} onUploadingChange={setUploading} />
        <Textarea name="notes" label="Notes" placeholder="Parts used, warranty info…" error={errors.notes} />
      </form>
    </Modal>
  );
}
