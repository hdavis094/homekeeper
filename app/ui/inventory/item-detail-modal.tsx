"use client";

import React, { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Modal, Card, Button, StatusPill, IconTile } from "@/app/ui";
import { deleteItem } from "@/lib/actions/inventory";
import { ITEM_CATEGORY_LABELS } from "@/lib/domain/constants";
import type { ItemDetail } from "@/lib/data/items";
import { Wrench } from "lucide-react";

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function ItemDetailModal({ detail }: { detail: ItemDetail }) {
  const router = useRouter();
  const { item, tasks, log, totalCostCents } = detail;

  const submit = async (_prev: unknown, fd: FormData) => deleteItem(item.id);
  const [state, formAction, pending] = useActionState(submit, null);

  useEffect(() => {
    if (state && state.success) {
      router.push("/inventory", { scroll: false });
    }
  }, [state, router]);

  const conditionTone = item.condition === "good" ? "good" : "needs_service";

  return (
    <Modal param="item" paramValue={item.id} title={item.name} clearParams={["item"]} size="lg">
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-3">
          <IconTile tone={conditionTone} size="lg">
            <Wrench className="w-5 h-5" />
          </IconTile>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusPill tone={conditionTone}>
                {item.condition === "good" ? "Good" : "Needs Service"}
              </StatusPill>
              <StatusPill tone="neutral">{ITEM_CATEGORY_LABELS[item.category]}</StatusPill>
            </div>
            {item.model && <p className="text-[13px] text-muted mt-2">Model: {item.model}</p>}
            {item.installedYear && (
              <p className="text-[13px] text-muted">Installed: {item.installedYear}</p>
            )}
            {item.notes && <p className="text-[13px] text-ink mt-2">{item.notes}</p>}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[14px] font-bold text-ink">Linked tasks</h3>
            <Button
              href={`/inventory?edit=${item.id}`}
              variant="secondary"
              size="sm"
            >
              Edit item
            </Button>
          </div>
          {tasks.length === 0 ? (
            <p className="text-[13px] text-muted">No linked tasks.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {tasks.map((t) => (
                <Link
                  key={t.id}
                  href={`/tasks?edit=${t.id}`}
                  className="flex items-center justify-between gap-3 p-3 rounded-[8px] border border-border hover:bg-bg transition-colors"
                >
                  <span className="text-[13px] font-medium text-ink truncate">{t.title}</span>
                  <StatusPill tone={t.status as never}>{t.status.replace("_", " ")}</StatusPill>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-[14px] font-bold text-ink mb-2">Log history</h3>
          {log.length === 0 ? (
            <p className="text-[13px] text-muted">No log entries.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {log.map((e) => (
                <Card key={e.id} padding="sm" className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-ink truncate">{e.title}</p>
                    <p className="text-[12px] text-muted">{e.date}{e.vendorName ? ` · ${e.vendorName}` : ""}</p>
                  </div>
                  {e.costCents != null && (
                    <span className="text-[13px] font-semibold text-ink">{money(e.costCents)}</span>
                  )}
                </Card>
              ))}
            </div>
          )}
          <p className="text-[13px] font-bold text-ink mt-3">Total: {money(totalCostCents)}</p>
        </div>

        <form action={formAction} className="flex justify-end">
          <input type="hidden" name="id" value={item.id} />
          <Button type="submit" variant="danger" size="sm" disabled={pending}>
            {pending ? "Deleting…" : "Delete item"}
          </Button>
        </form>
      </div>
    </Modal>
  );
}
