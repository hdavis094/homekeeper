"use client";

import { type FormEvent, startTransition, useActionState, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { TaskActionState } from "@/lib/actions/tasks";

type Action = (prev: TaskActionState, formData: FormData) => Promise<NonNullable<TaskActionState>>;

/** Navigates to the current URL minus the modal's params (closes a URL-driven `Modal`). */
export function useCloseModal(params: readonly string[]) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return useCallback(() => {
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    for (const p of params) next.delete(p);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [params, pathname, router, searchParams]);
}

/**
 * Runs a task action from a modal form and closes the modal on success. Submits through `onSubmit`
 * (not `<form action>`) so React doesn't reset the fields when validation fails.
 */
export function useModalForm(action: Action, closeParams: readonly string[]) {
  const close = useCloseModal(closeParams);
  const [state, formAction, pending] = useActionState<TaskActionState, FormData>(async (prev, formData) => {
    const result = await action(prev, formData);
    if (result.ok) close();
    return result;
  }, null);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  return { state, pending, onSubmit, errors: state?.fieldErrors ?? {}, close };
}
