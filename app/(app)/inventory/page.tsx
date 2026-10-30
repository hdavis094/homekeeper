import Link from "next/link";
import { getCurrentHome } from "@/lib/session";
import { listItems, getItem } from "@/lib/data/items";
import { ITEM_CATEGORIES, ITEM_CATEGORY_LABELS, type ItemCategory } from "@/lib/domain/constants";
import { PageHeader, FilterChips, Card, EmptyState, Button, IconTile, StatusPill } from "@/app/ui";
import { Wrench } from "lucide-react";
import { AddEditItemModal } from "@/app/ui/inventory/item-modal";
import { ItemDetailModal } from "@/app/ui/inventory/item-detail-modal";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const categoryParam = (Array.isArray(sp.category) ? sp.category[0] : sp.category) ?? "all";
  const category = categoryParam === "all" ? "all" : (categoryParam as ItemCategory);

  const { } = await getCurrentHome();
  const { items, counts } = await listItems({ category: category === "all" ? "all" : category });

  const editId = Array.isArray(sp.edit) ? sp.edit[0] : sp.edit;
  const itemId = Array.isArray(sp.item) ? sp.item[0] : sp.item;
  const isNew = (Array.isArray(sp.new) ? sp.new[0] : sp.new) === "1";

  const editingItem = editId ? await getItem(editId) : null;
  const detailItem = itemId ? await getItem(itemId) : null;

  // Ensure base categories always shown even if 0? brief: plus Plumbing/Electrical/Roof only when items exist.
  // FilterChips hides 0-count categories except the five base ones.
  const baseSet = new Set(["hvac", "kitchen", "laundry", "exterior", "safety"]);
  const filteredChips = [
    { value: "all", label: "All Items", count: counts.all },
    ...ITEM_CATEGORIES.map((c) => ({ value: c, label: ITEM_CATEGORY_LABELS[c], count: counts[c] }))
      .filter((o) => baseSet.has(o.value) || (counts[o.value as ItemCategory] ?? 0) > 0),
  ];

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Track the systems and appliances in your home."
        actions={
          <Button href="/inventory?new=1" variant="primary">
            + Add Item
          </Button>
        }
      />

      <div className="mb-6">
        <FilterChips param="category" options={filteredChips} defaultValue="all" />
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="No items yet"
          description="Add your first home item to get started."
          action={<Button href="/inventory?new=1">Add Item</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {items.map((it) => {
            const conditionTone = it.condition === "good" ? "good" : "needs_service";
            return (
              <Link key={it.id} href={`/inventory?item=${it.id}`} className="block">
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <div className="flex items-start gap-3">
                    <IconTile tone={conditionTone} size="md">
                      <Wrench className="w-4 h-4" />
                    </IconTile>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-[15px] font-bold text-ink truncate">{it.name}</h3>
                        <StatusPill tone={conditionTone}>
                          {it.condition === "good" ? "Good" : "Needs Service"}
                        </StatusPill>
                      </div>
                      {it.model && <p className="text-[13px] text-muted mt-0.5 truncate">{it.model}</p>}
                      <p className="text-[12px] text-muted-2 mt-2">
                        {it.installedYear ? `Installed ${it.installedYear}` : "Installed —"}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <AddEditItemModal open={isNew || Boolean(editingItem)} editing={editingItem?.item ?? null} />
      {detailItem && <ItemDetailModal detail={detailItem} />}
    </div>
  );
}
