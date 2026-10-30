import { Heading, Section, Text } from "@react-email/components";
import { addDays, formatShortDate } from "@/lib/domain/dates";
import { formatCents } from "@/lib/domain/format";
import { EmailLayout, emailStyles, type EmailTask, TaskList } from "./layout";

export type WeeklySummaryData = {
  completed: readonly { id: string; title: string; date: string; costCents: number | null }[];
  spentCents: number;
  upcoming: readonly EmailTask[];
  overdue: readonly EmailTask[];
};

export type WeeklySummaryProps = {
  name: string;
  today: string;
  summary: WeeklySummaryData;
  appUrl: string;
};

export default function WeeklySummary({ name, today, summary, appUrl }: WeeklySummaryProps) {
  return (
    <EmailLayout appUrl={appUrl} title="Your home, this week" preview={`${summary.completed.length} completed last week · ${formatCents(summary.spentCents)} spent · ${summary.upcoming.length} upcoming.`}>
      <Text style={emailStyles.text}>Hi {name}, here&apos;s your weekly maintenance summary.</Text>
      <Heading as="h2" style={emailStyles.sectionHeading}>Completed last week</Heading>
      <Text style={emailStyles.text}>{formatShortDate(addDays(today, -7), today)} – {formatShortDate(addDays(today, -1), today)}</Text>
      <Text style={{ color: "#16A34A", fontSize: "16px", fontWeight: 600, lineHeight: "24px", margin: "12px 0" }}>
        {summary.completed.length} completed · {formatCents(summary.spentCents)} spent
      </Text>
      {summary.completed.length === 0 ? (
        <Text style={emailStyles.text}>No completed work was logged last week.</Text>
      ) : summary.completed.map((entry) => (
        <Section key={entry.id} style={emailStyles.row}>
          <Text style={{ color: "#111827", fontSize: "14px", fontWeight: 600, margin: "0 0 4px" }}>{entry.title}</Text>
          <Text style={{ ...emailStyles.text, margin: 0 }}>
            {formatShortDate(entry.date, today)}{entry.costCents === null ? "" : ` · ${formatCents(entry.costCents)}`}
          </Text>
        </Section>
      ))}
      <Heading as="h2" style={emailStyles.sectionHeading}>Upcoming in the next 7 days</Heading>
      <TaskList tasks={summary.upcoming} today={today} emptyText="No upcoming maintenance. Enjoy the week ahead." />
      <Heading as="h2" style={emailStyles.sectionHeading}>Overdue</Heading>
      <TaskList tasks={summary.overdue} today={today} emptyText="Nothing overdue. Your home is in good hands." />
    </EmailLayout>
  );
}
