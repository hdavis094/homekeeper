"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { Button } from "@/app/ui/button";
import { Field } from "@/app/ui/field";
import { Input } from "@/app/ui/input";
import { Select } from "@/app/ui/select";
import { Textarea } from "@/app/ui/textarea";
import { FormError } from "@/app/ui/form-error";
import { VENDOR_TRADES, VENDOR_TRADE_LABELS, type VendorTrade } from "@/lib/domain/constants";

type ActionFn = (prev: unknown, formData: FormData) => Promise<{ success?: boolean; fieldErrors?: Record<string, string>; formError?: string } | void>;

export function VendorForm({
  action,
  vendorId,
  defaultValues,
  defaultTrade,
}: {
  action: ActionFn;
  vendorId?: string;
  defaultValues?: {
    name: string;
    trade: string;
    phone: string;
    email: string;
    rating: string;
    notes: string;
  };
  defaultTrade?: VendorTrade;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, null);

  useEffect(() => {
    if (state && state.success) {
      router.push("/vendors", { scroll: false });
    }
  }, [state, router]);

  const fe = (state && !state.success ? state.fieldErrors : {}) ?? {};
  const formError = state && !state.success ? state.formError : undefined;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {vendorId && <input type="hidden" name="id" value={vendorId} />}
      <FormError message={formError} />

      <Field label="Name" required error={fe.name}>
        <Input name="name" defaultValue={defaultValues?.name ?? ""} required />
      </Field>

      <Field label="Trade" required error={fe.trade}>
        <Select
          name="trade"
          defaultValue={defaultValues?.trade ?? defaultTrade ?? "general"}
          options={VENDOR_TRADES.map((t) => ({
            value: t,
            label: VENDOR_TRADE_LABELS[t],
          }))}
        />
      </Field>

      <Field label="Phone" error={fe.phone}>
        <Input name="phone" defaultValue={defaultValues?.phone ?? ""} />
      </Field>

      <Field label="Email" error={fe.email}>
        <Input name="email" type="email" defaultValue={defaultValues?.email ?? ""} />
      </Field>

      <Field label="Rating (0–5)" error={fe.rating} hint="One decimal place, e.g. 4.9">
        <Input
          name="rating"
          type="number"
          step="0.1"
          min="0"
          max="5"
          defaultValue={defaultValues?.rating ?? ""}
        />
      </Field>

      <Field label="Notes" error={fe.notes}>
        <Textarea name="notes" defaultValue={defaultValues?.notes ?? ""} rows={3} />
      </Field>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : vendorId ? "Save Changes" : "Add Vendor"}
        </Button>
      </div>
    </form>
  );
}
