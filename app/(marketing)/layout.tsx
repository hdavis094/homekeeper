import Link from "next/link";
import { Button } from "@/app/ui/button";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-card text-ink">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:p-3">Skip to content</a>
      <header className="border-b border-border">
        <div className="mx-auto flex min-h-[84px] max-w-[1440px] flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-10 lg:px-[60px]">
          <Link href="/" aria-label="HomeKeeper home" className="flex items-center gap-2.5 text-[18px] font-bold tracking-tight"><span aria-hidden="true" className="h-8 w-8 rounded-[8px] bg-primary" />HomeKeeper</Link>
          <nav aria-label="Main navigation" className="flex items-center gap-5 text-[14px] text-muted sm:gap-8">
            <Link href="/#features" className="hidden hover:text-ink sm:block">Features</Link>
            <Link href="/#how-it-works" className="hidden hover:text-ink sm:block">How It Works</Link>
            <Button href="/signup">Get Started</Button>
          </nav>
        </div>
      </header>
      {children}
      <footer className="bg-sidebar text-muted-2">
        <div className="mx-auto flex min-h-[72px] max-w-[1440px] flex-wrap items-center justify-between gap-5 px-5 py-6 text-[13px] sm:px-10 lg:px-[60px]">
          <p>© {new Date().getFullYear()} HomeKeeper</p>
          <nav aria-label="Footer" className="flex gap-6"><a href="#" className="hover:text-white">Privacy</a><a href="#" className="hover:text-white">Terms</a><a href="#" className="hover:text-white">Contact</a></nav>
        </div>
      </footer>
    </div>
  );
}
