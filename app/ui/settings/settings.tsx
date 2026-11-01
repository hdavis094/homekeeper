"use client";

import { Suspense, useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import clsx from "clsx";
import { Avatar, Button, Card, FormError, Input, Select, Toggle } from "@/app/ui";
import { changePassword, deleteAccount, removeAvatar, updateAvatar, updateHome, updateNotifications, updateProfile, type SettingsState } from "@/lib/actions/settings";
import { UPLOAD_ACCEPT, UPLOAD_CONTENT_TYPES, UPLOAD_MAX_BYTES, uploadFile } from "@/lib/blob";
import type { Profile } from "@/lib/data/home";
import type { Home } from "@/lib/db/schema";
import { HOME_TYPES, HOME_TYPE_LABELS, TIME_ZONES } from "@/lib/domain/constants";
import { ThemeToggle } from "../theme-toggle";

const sections = [
  ["profile", "Profile"],
  ["home-details", "Home Details"],
  ["notifications", "Notifications"],
  ["security", "Security"],
  ["danger-zone", "Danger Zone"],
] as const;

function Feedback({ state }: { state: SettingsState }) {
  if (!state.message) return null;
  return state.success
    ? <p role="status" className="text-[13px] text-completed-fg">{state.message}</p>
    : <FormError message={state.message} />;
}

function SaveFooter({ state, pending, label = "Save Changes" }: { state: SettingsState; pending: boolean; label?: string }) {
  return (
    <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
      <Feedback state={state} />
      <Button type="submit" disabled={pending}>{pending ? "Saving…" : label}</Button>
    </div>
  );
}

function SectionNav() {
  const [active, setActive] = useState("profile");
  useEffect(() => {
    const sync = () => setActive(window.location.hash.slice(1) || "profile");
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  return (
    <nav aria-label="Settings sections" className="flex gap-1 overflow-x-auto rounded-[12px] border border-border bg-card p-2 lg:sticky lg:top-6 lg:flex-col">
      {sections.map(([id, label]) => (
        <a key={id} href={`#${id}`} onClick={() => setActive(id)} aria-current={active === id ? "location" : undefined}
          className={clsx("shrink-0 rounded-[8px] px-3.5 py-2 text-[14px] whitespace-nowrap focus-visible:outline-2 focus-visible:outline-primary", active === id ? "bg-scheduled-bg font-semibold text-primary" : "text-ink hover:bg-bg")}>
          {label}
        </a>
      ))}
    </nav>
  );
}

function Photo({ user }: { user: Profile }) {
  const input = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<SettingsState>({});
  const [pending, startTransition] = useTransition();

  function uploadPhoto(file?: File) {
    if (!file) return;
    if (file.size > UPLOAD_MAX_BYTES || !UPLOAD_CONTENT_TYPES.avatars.includes(file.type)) {
      setState({ success: false, message: "Choose a JPG, PNG or WebP image smaller than 10 MB." });
      return;
    }
    setState({});
    startTransition(async () => {
      try {
        // Keep the user prefix within uploadFile's 80-character safe filename limit.
        const photo = new File([file], `${user.id}-${file.name.slice(-40)}`, { type: file.type });
        const uploaded = await uploadFile(photo, "avatars");
        const form = new FormData();
        form.set("url", uploaded.url);
        setState(await updateAvatar({}, form));
      } catch {
        setState({ success: false, message: "Photo upload is unavailable right now. Please try again later. Your profile can still be saved." });
      }
    });
  }

  return (
    <div className="mb-5 space-y-3">
      <div className="flex flex-wrap items-center gap-4">
        <Avatar name={user.name} image={user.image} size="lg" className="h-16 w-16 text-[20px]" />
        <input ref={input} type="file" accept={UPLOAD_ACCEPT.avatars} aria-label="Profile photo" className="sr-only" disabled={pending}
          onChange={(event) => { uploadPhoto(event.target.files?.[0]); event.target.value = ""; }} />
        <Button variant="secondary" size="sm" disabled={pending} onClick={() => input.current?.click()}>{pending ? "Updating photo…" : "Upload new photo"}</Button>
        <Button variant="danger-ghost" size="sm" disabled={pending || !user.image}
          onClick={() => startTransition(async () => { setState(await removeAvatar()); })}>Remove</Button>
      </div>
      <Feedback state={state} />
    </div>
  );
}

function ProfileForm({ user }: { user: Profile }) {
  const [state, action, pending] = useActionState(updateProfile, {});
  const [values, setValues] = useState({ name: user.name, phone: user.phone ?? "", timeZone: user.timeZone });
  const zones = TIME_ZONES.some((zone) => zone.value === user.timeZone) ? [...TIME_ZONES] : [{ value: user.timeZone, label: user.timeZone }, ...TIME_ZONES];
  return (
    <Card id="profile" padding="lg" className="scroll-mt-6 shadow-sm">
      <h2 className="mb-5 text-[16px] font-bold">Profile</h2>
      <Photo user={user} />
      <form action={action} aria-label="Profile" noValidate>
        <fieldset disabled={pending} className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
          <Input label="Full Name" name="name" autoComplete="name" value={values.name} onChange={(e) => setValues((current) => ({ ...current, name: e.target.value }))} error={state.fieldErrors?.name} required maxLength={80} />
          <Input label="Email" type="email" value={user.email} readOnly autoComplete="email" />
          <Input label="Phone" name="phone" type="tel" autoComplete="tel" value={values.phone} onChange={(e) => setValues((current) => ({ ...current, phone: e.target.value }))} error={state.fieldErrors?.phone} />
          <Select label="Time Zone" name="timeZone" options={zones} value={values.timeZone} onChange={(e) => setValues((current) => ({ ...current, timeZone: e.target.value }))} error={state.fieldErrors?.timeZone} />
          <div className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100">
            <ThemeToggle/>
          </div>
        </fieldset>
        
        
        <SaveFooter state={state} pending={pending} />
      </form>
    </Card>
  );
}

function HomeForm({ home }: { home: Home }) {
  const [state, action, pending] = useActionState(updateHome, {});
  const [values, setValues] = useState({ address: home.address ?? "", homeType: home.homeType ?? "", yearBuilt: String(home.yearBuilt ?? ""), squareFeet: String(home.squareFeet ?? "") });
  return (
    <Card id="home-details" padding="lg" className="scroll-mt-6 shadow-sm">
      <h2 className="mb-5 text-[16px] font-bold">Home Details</h2>
      <form action={action} aria-label="Home details" noValidate>
        <fieldset disabled={pending} className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
          <Input label="Home Address" name="address" autoComplete="street-address" value={values.address} onChange={(e) => setValues((current) => ({ ...current, address: e.target.value }))} error={state.fieldErrors?.address} maxLength={200} />
          <Select label="Home Type" name="homeType" value={values.homeType} onChange={(e) => setValues((current) => ({ ...current, homeType: e.target.value }))} error={state.fieldErrors?.homeType}
            options={[{ value: "", label: "Select home type" }, ...HOME_TYPES.map((value) => ({ value, label: HOME_TYPE_LABELS[value] }))]} />
          <Input label="Year Built" name="yearBuilt" inputMode="numeric" placeholder="e.g. 1998" value={values.yearBuilt} onChange={(e) => setValues((current) => ({ ...current, yearBuilt: e.target.value }))} error={state.fieldErrors?.yearBuilt} />
          <Input label="Square Footage" name="squareFeet" inputMode="numeric" placeholder="e.g. 2,400" value={values.squareFeet} onChange={(e) => setValues((current) => ({ ...current, squareFeet: e.target.value }))} error={state.fieldErrors?.squareFeet} />
        </fieldset>
        <SaveFooter state={state} pending={pending} />
      </form>
    </Card>
  );
}

function Notifications({ home }: { home: Home }) {
  const [state, setState] = useState<SettingsState>({});
  const [pending, startTransition] = useTransition();
  // Values come from the refreshed server props, so failed saves leave the saved toggle unchanged.
  function save(key: "emailReminders" | "weeklySummary", checked: boolean) {
    const form = new FormData();
    form.set("emailReminders", String(key === "emailReminders" ? checked : home.emailReminders));
    form.set("weeklySummary", String(key === "weeklySummary" ? checked : home.weeklySummary));
    startTransition(async () => { setState(await updateNotifications({}, form)); });
  }
  return (
    <Card id="notifications" padding="lg" className="scroll-mt-6 shadow-sm">
      <h2 className="mb-4 text-[16px] font-bold">Notification Preferences</h2>
      <div className="divide-y divide-divider">
        <Toggle label="Email Reminders" description="Get an email before each maintenance task is due." checked={home.emailReminders} disabled={pending} comingSoon={false} onChange={(checked) => save("emailReminders", checked)} className="py-4" />
        <Toggle label="Push Notifications" description="Receive mobile push alerts for overdue tasks." disabled comingSoon className="py-4" />
        <Toggle label="Weekly Summary" description="A Monday recap of completed and upcoming tasks." checked={home.weeklySummary} disabled={pending} comingSoon={false} onChange={(checked) => save("weeklySummary", checked)} className="py-4" />
        <Toggle label="Vendor Recommendations" description="Occasional suggestions for trusted local vendors." disabled comingSoon className="py-4" />
      </div>
      <div aria-live="polite">{pending ? <p className="text-[13px] text-muted">Saving preferences…</p> : <Feedback state={state} />}</div>
    </Card>
  );
}

function Security() {
  const [state, action, pending] = useActionState(changePassword, {});
  return (
    <Card id="security" padding="lg" className="scroll-mt-6 shadow-sm">
      <h2 className="mb-5 text-[16px] font-bold">Security</h2>
      <form action={action} aria-label="Change password" noValidate>
        <fieldset disabled={pending} className="grid gap-4 sm:grid-cols-2">
          <Input label="Current Password" type="password" name="currentPassword" autoComplete="current-password" required error={state.fieldErrors?.currentPassword} />
          <Input label="New Password" type="password" name="newPassword" autoComplete="new-password" required minLength={8} maxLength={128} hint="Use at least 8 characters." error={state.fieldErrors?.newPassword} />
        </fieldset>
        <SaveFooter state={state} pending={pending} label="Update Password" />
      </form>
    </Card>
  );
}

function DeleteDialog() {
  const params = useSearchParams();
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [confirmation, setConfirmation] = useState("");
  const [state, action, pending] = useActionState(deleteAccount, {});
  const isOpen = params.get("delete") === "1";
  function close() {
    if (pending) return;
    const next = new URLSearchParams(params);
    next.delete("delete");
    router.push(`/settings${next.size ? `?${next}` : ""}#danger-zone`, { scroll: false });
  }
  useEffect(() => {
    const element = dialog.current;
    if (isOpen && element && !element.open) element.showModal();
    if (!isOpen && element?.open) element.close();
  }, [isOpen]);
  return (
    <dialog onClose={() => setConfirmation("")} ref={dialog} aria-labelledby="delete-title" aria-describedby="delete-description" onCancel={(e) => { e.preventDefault(); close(); }}
      onClick={(e) => { if (e.target === dialog.current) close(); }}
      className="fixed inset-0 m-auto max-h-[85vh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-[12px] border border-border bg-card p-6 text-ink shadow-xl backdrop:bg-ink/40">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 id="delete-title" className="text-[18px] font-bold text-danger">Delete your account?</h2>
        <Button variant="ghost" size="sm" onClick={close} disabled={pending} aria-label="Close modal"><X size={18} /></Button>
      </div>
      <p id="delete-description" className="mb-5 text-[14px] text-muted">This permanently deletes your profile, home, tasks, inventory, vendors, and maintenance history. This cannot be undone.</p>
      <form action={action} className="space-y-4" noValidate>
        <Input label="Type DELETE to confirm" name="confirmation" autoComplete="off" autoFocus value={confirmation} onChange={(e) => setConfirmation(e.target.value)} disabled={pending} error={state.fieldErrors?.confirmation} />
        <Feedback state={state} />
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="secondary" onClick={close} disabled={pending}>Cancel</Button>
          <Button type="submit" variant="danger" disabled={pending || confirmation !== "DELETE"}>{pending ? "Deleting…" : "Delete Account"}</Button>
        </div>
      </form>
    </dialog>
  );
}

export function Settings({ home, user }: { home: Home; user: Profile }) {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <SectionNav />
      <div className="min-w-0 space-y-6">
        <ProfileForm user={user} />
        <HomeForm home={home} />
        <Notifications home={home} />
        <Security />
        <Card id="danger-zone" padding="lg" className="scroll-mt-6 border-danger-bg shadow-sm">
          <h2 className="mb-3 text-[16px] font-bold text-danger">Danger Zone</h2>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-[14px] font-semibold">Delete Account</p>
              <p className="text-[13px] text-muted">Permanently delete your account and all maintenance history.</p>
            </div>
            <Button variant="danger" href="/settings?delete=1" size="sm">Delete Account</Button>
          </div>
        </Card>
      </div>
      <Suspense fallback={null}><DeleteDialog key={user.id} /></Suspense>
    </div>
  );
}
