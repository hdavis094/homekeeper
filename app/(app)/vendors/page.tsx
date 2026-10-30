import React from "react";
import Link from "next/link";
import { getCurrentHome } from "@/lib/session";
import { createVendor, updateVendor } from "@/lib/actions/vendors";
import { listVendors, getVendor } from "@/lib/data/vendors";
import { VENDOR_TRADES, VENDOR_TRADE_LABELS, type VendorTrade } from "@/lib/domain/constants";
import { Button } from "@/app/ui/button";
import { Card } from "@/app/ui/card";
import { Avatar } from "@/app/ui/avatar";
import { StatusPill } from "@/app/ui/status-pill";
import { FilterChips } from "@/app/ui/filter-chips";
import { SearchInput } from "@/app/ui/search-input";
import { PageHeader } from "@/app/ui/page-header";
import { Menu } from "@/app/ui/menu";
import { Modal } from "@/app/ui/modal";
import { EmptyState } from "@/app/ui/empty-state";
import { Star } from "lucide-react";
import { VendorForm } from "./vendor-form";
import { DeleteVendorButton } from "./delete-vendor-button";

type SearchParams = {
  trade?: string;
  q?: string;
  new?: string;
  edit?: string;
};

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  await getCurrentHome();
  const trade = (sp.trade ?? "all") as "all" | VendorTrade;
  const { vendors, counts } = await listVendors({ trade, q: sp.q });

  const chipOptions = [
    { value: "all", label: "All Trades", count: counts.all },
    ...VENDOR_TRADES.map((t) => ({
      value: t,
      label: VENDOR_TRADE_LABELS[t],
      count: counts[t],
    })),
  ];

  const editing = sp.edit ? await getVendor(sp.edit) : null;

  return (
    <div>
      <PageHeader
        title="Vendors"
        subtitle="Manage the people and companies you hire for home work."
        actions={
          <>
            <SearchInput param="q" placeholder="Search vendors..." defaultValue={sp.q ?? ""} />
            <Button href={buildNewHref(sp)}>Add Vendor</Button>
          </>
        }
      />

      <div className="mb-6">
        <FilterChips param="trade" options={chipOptions} defaultValue="all" />
      </div>

      {vendors.length === 0 ? (
        <EmptyState
          title="No vendors yet"
          description="Add your first vendor to keep track of who you hire."
          action={<Button href="/vendors?new=1">Add Vendor</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {vendors.map((v) => (
            <Card key={v.id} padding="md" className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <Avatar name={v.name} size="md" tone="ink" />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/vendors?edit=${v.id}`}
                    className="block text-[15px] font-bold text-ink truncate hover:text-primary"
                    title={`Edit ${v.name}`}
                  >
                    {v.name}
                  </Link>
                  <div className="mt-1">
                    <StatusPill tone={v.trade}>{VENDOR_TRADE_LABELS[v.trade]}</StatusPill>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[13px] text-ink">
                <Star className="w-3.5 h-3.5 text-[#D97706] fill-[#D97706]" aria-hidden />
                <span>{v.rating !== null ? `${v.rating.toFixed(1)} rating` : "No rating"}</span>
              </div>

              <div className="border border-divider rounded-[8px] px-3 py-2 text-[13px] text-muted space-y-1">
                <p className="truncate">{v.phone || v.email || "No contact info"}</p>
                <p>{v.lastHiredText}</p>
              </div>

              <div className="mt-auto">
                <Menu phone={v.phone} email={v.email} label="Contact" />
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        param="new"
        title="Add Vendor"
        subtitle="Track a person or company you hire for home work."
      >
        <VendorForm
          action={createVendor}
          defaultTrade={sp.trade && sp.trade !== "all" ? (sp.trade as VendorTrade) : undefined}
        />
      </Modal>

      {editing && (
        <Modal param="edit" paramValue={sp.edit} title="Edit Vendor">
          <VendorForm
            action={updateVendor}
            vendorId={editing.id}
            defaultValues={{
              name: editing.name,
              trade: editing.trade,
              phone: editing.phone ?? "",
              email: editing.email ?? "",
              rating: editing.rating !== null ? String(editing.rating) : "",
              notes: editing.notes ?? "",
            }}
          />
          <div className="mt-4 border-t border-divider pt-4 flex items-center justify-between gap-3">
            <p className="text-[13px] text-muted">Remove this vendor. Past work stays in your history.</p>
            <DeleteVendorButton id={editing.id} />
          </div>
        </Modal>
      )}
    </div>
  );
}

function buildNewHref(sp: SearchParams) {
  const params = new URLSearchParams();
  if (sp.trade && sp.trade !== "all") params.set("trade", sp.trade);
  if (sp.q) params.set("q", sp.q);
  params.set("new", "1");
  return `/vendors?${params.toString()}`;
}

