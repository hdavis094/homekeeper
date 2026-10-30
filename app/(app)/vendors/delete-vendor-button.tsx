"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/ui/button";
import { deleteVendor } from "@/lib/actions/vendors";

export function DeleteVendorButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="danger"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!window.confirm("Delete this vendor? This cannot be undone.")) return;
        startTransition(async () => {
          await deleteVendor(id);
          router.refresh();
        });
      }}
    >
      {pending ? "Deleting..." : "Delete"}
    </Button>
  );
}
