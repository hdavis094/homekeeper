"use client";

import React, { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Modal, Field, Input, Select, Textarea, Button, FormError } from "@/app/ui";
import { createItem, updateItem } from "@/lib/actions/inventory";
import { ITEM_CATEGORIES, ITEM_CATEGORY_LABELS, ITEM_CONDITIONS, ITEM_CONDITION_LABELS } from "@/lib/domain/constants";
import type { Item } from "@/lib/db/schema";

export function AddEditItemModal({
  open,
  editing,
}: {
  open: boolean;
  editing: Item | null;
}) {
  const router = useRouter();
  const isEdit = Boolean(editing);
  const submit = async (_prev: unknown, fd: FormData) =>
    isEdit ? updateItem(editing!.id, fd) : createItem(fd);

  const [state, formAction, pending] = useActionState(submit, null);

  useEffect(() => {
    if (state && state.success) {
      router.push("/inventory", { scroll: false });
    }
  }, [state, router]);

  const fieldErrors = (state && !state.success ? state.fieldErrors : {}) ?? {};
  const formError = state && !state.success ? state.formError : undefined;

  return (
    <Modal
      param={isEdit ? "edit" : "new"}
      paramValue={isEdit ? editing!.id : "1"}
      title={isEdit ? "Edit Item" : "Add Item"}
      clearParams={["new", "edit"]}
      open={open}
      size="md"
      footer={
        <>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/inventory", { scroll: false })}
          >
            Cancel
          </Button>
          <Button type="submit" form="item-form" variant="primary" disabled={pending}>
            {pending ? "Saving…" : isEdit ? "Save changes" : "Add Item"}
          </Button>
        </>
      }
    >
      <form id="item-form" action={formAction} className="flex flex-col gap-4">
        <FormError message={formError} />
        <Field label="Name" required error={fieldErrors.name}>
          <Input name="name" defaultValue={editing?.name ?? ""} required />
        </Field>
        <Field label="Model" error={fieldErrors.model}>
          <Input name="model" defaultValue={editing?.model ?? ""} />
        </Field>
        <Field label="Category" required error={fieldErrors.category}>
          <Select
            name="category"
            defaultValue={editing?.category ?? "hvac"}
            options={ITEM_CATEGORIES.map((c) => ({ value: c, label: ITEM_CATEGORY_LABELS[c] }))}
          />
        </Field>
        <Field label="Installed year" error={fieldErrors.installedYear}>
          <Input
            name="installedYear"
            type="number"
            defaultValue={editing?.installedYear ?? ""}
          />
        </Field>
        <Field label="Condition" error={fieldErrors.condition}>
          <Select
            name="condition"
            defaultValue={editing?.condition ?? "good"}
            options={ITEM_CONDITIONS.map((c) => ({ value: c, label: ITEM_CONDITION_LABELS[c] }))}
          />
        </Field>
        <Field label="Notes" error={fieldErrors.notes}>
          <Textarea name="notes" defaultValue={editing?.notes ?? ""} rows={3} />
        </Field>
        {isEdit && <input type="hidden" name="id" value={editing!.id} />}
      </form>
    </Modal>
  );
}
