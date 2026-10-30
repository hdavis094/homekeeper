import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/app/ui/auth/auth-form";
import { Button } from "@/app/ui/button";
import { Card } from "@/app/ui/card";
import { getSession } from "@/lib/session";

const features = [
  { title: "Smart Reminders", description: "Get notified before small issues become big, expensive repairs.", color: "bg-scheduled-bg" },
  { title: "Task Tracking", description: "Log every repair, replacement, and inspection in one timeline.", color: "bg-completed-bg" },
  { title: "Home Systems Health", description: "See the status of your HVAC, plumbing, roof, and electrical at a glance.", color: "bg-[#FEF3C7]" },
  { title: "Vendor Directory", description: "Keep trusted contractors and full service history organized.", color: "bg-danger-bg" },
];
const steps = [
  { title: "Add your home details", description: "Tell us about your rooms, systems, and appliances." },
  { title: "Build your maintenance schedule", description: "Add your tasks and set a schedule that works for your home." },
  { title: "Stay ahead, effortlessly", description: "Get reminders, log completed work, and track your progress." },
];

export default async function WelcomePage({ searchParams }: { searchParams: Promise<{ reset?: string | string[] }> }) {
  if (await getSession()) redirect("/home");
  const query = await searchParams;
  return (
    <main id="main-content">
      <section aria-labelledby="welcome-title" className="mx-auto grid max-w-[1440px] items-start gap-10 px-5 py-10 sm:px-10 sm:py-14 lg:grid-cols-[1fr_400px] lg:gap-20 lg:px-[60px]">
        <div>
          <p className="inline-block rounded-full bg-scheduled-bg px-3 py-1.5 text-[12px] font-bold leading-[15px] text-primary">HOME MAINTENANCE, SIMPLIFIED</p>
          <h1 id="welcome-title" className="mt-5 max-w-[550px] text-[36px] leading-[1.17] font-extrabold tracking-tight sm:text-[42px]">Take control of your<br className="hidden sm:block" /> home&apos;s upkeep.</h1>
          <p className="mt-5 max-w-[480px] text-[16px] leading-6 text-muted">HomeKeeper tracks every system in your house, reminds you before small problems become expensive ones, and keeps your maintenance history all in one place.</p>
          <ul className="mt-5 space-y-2 text-[14px] leading-5">
            {["Automated maintenance reminders for every room and system", "Track repairs, replacements, and inspections in one timeline", "See your home’s overall health score at a glance"].map((text) => <li key={text} className="flex items-start gap-2.5"><span aria-hidden="true" className="mt-0.5 h-[18px] w-[18px] shrink-0 rounded-full bg-completed-bg" />{text}</li>)}
          </ul>
          <div className="mt-5 flex flex-wrap items-center gap-4"><Button href="/signup" size="lg" className="h-[46px]">Create free account</Button><Link href="#login" className="text-[14px] font-semibold text-muted hover:text-primary">Already a member? Log in →</Link></div>
        </div>
        <Card id="login" padding="none" className="w-full scroll-mt-6 rounded-[16px] p-6 shadow-sm sm:p-8">
          <h2 className="text-[21px] leading-[26px] font-bold tracking-tight">Welcome back</h2>
          <p className="mt-1 text-[13px] leading-5 text-muted">Log in to your HomeKeeper account</p>
          <AuthForm mode="login" resetSuccess={query.reset === "success"} />
        </Card>
      </section>
      <section id="features" aria-labelledby="features-title" className="bg-bg">
        <div className="mx-auto max-w-[1440px] px-5 py-14 sm:px-10 sm:py-[70px] lg:px-[60px]">
          <h2 id="features-title" className="text-center text-[28px] leading-9 font-bold tracking-tight">Everything you need to maintain your home</h2>
          <p className="mt-1 text-center text-[15px] leading-6 text-muted">One place to plan, track, and stay ahead of every repair.</p>
          <div className="mt-10 grid items-start gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => <Card key={feature.title} padding="lg" className="shadow-sm"><div aria-hidden="true" className={`h-10 w-10 rounded-[10px] ${feature.color}`} /><h3 className="mt-2.5 text-[16px] font-bold tracking-tight">{feature.title}</h3><p className="mt-2.5 max-w-[230px] text-[13px] leading-[18px] text-muted">{feature.description}</p></Card>)}
          </div>
        </div>
      </section>
      <section id="how-it-works" aria-labelledby="how-title" className="mx-auto max-w-[1440px] px-5 py-14 sm:px-10 sm:py-[70px] lg:px-[60px]">
        <h2 id="how-title" className="text-center text-[28px] leading-9 font-bold tracking-tight">How HomeKeeper works</h2>
        <ol className="mt-10 grid gap-8 md:grid-cols-3 md:gap-10">
          {steps.map((step, index) => <li key={step.title}><span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-ink text-[16px] font-semibold text-white">{index + 1}</span><h3 className="mt-2 text-[16px] font-bold tracking-tight">{step.title}</h3><p className="mt-2 max-w-[250px] text-[13px] leading-[18px] text-muted">{step.description}</p></li>)}
        </ol>
      </section>
    </main>
  );
}
