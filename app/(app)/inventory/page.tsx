import Link from "next/link";
import { getCurrentHome } from "@/lib/session";
import { listItems, getItem } from "@/lib/data/items";
import { ITEM_CATEGORIES, ITEM_CATEGORY_LABELS, type ItemCategory } from "@/lib/domain/constants";
import { PageHeader, FilterChips, Card, EmptyState, Button, IconTile, StatusPill } from "@/app/ui";
import { Droplets, Fan, House, Refrigerator, ShieldCheck, Trees, WashingMachine, Zap } from "lucide-react";

const CATEGORY_ICONS = {
  hvac: Fan,
  kitchen: Refrigerator,
  laundry: WashingMachine,
  exterior: Trees,
  safety: ShieldCheck,
  plumbing: Droplets,
  electrical: Zap,
  roof: House,
} satisfies Record<ItemCategory, unknown>;

function CategoryIcon({ category }: { category: ItemCategory }) {
  const Icon = CATEGORY_ICONS[category];
  return <Icon className="w-5 h-5" aria-hidden />;
}
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

  await getCurrentHome();
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
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col">
                  <IconTile tone={conditionTone} size="lg">
                    <CategoryIcon category={it.category} />
                  </IconTile>
                  <h3 className="mt-4 text-[16px] font-bold text-ink truncate">{it.name}</h3>
                  <p className="mt-1 text-[13px] text-muted truncate">{it.model || "\u00a0"}</p>
                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-divider pt-3">
                    <span className="text-[12px] text-muted">
                      {it.installedYear ? `Installed ${it.installedYear}` : "Install year unknown"}
                    </span>
                    <StatusPill tone={conditionTone}>
                      {it.condition === "good" ? "Good" : "Needs Service"}
                    </StatusPill>
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
