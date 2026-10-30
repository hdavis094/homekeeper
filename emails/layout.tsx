import type { CSSProperties, ReactNode } from "react";
import { Body, Button, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text } from "@react-email/components";
import { dueText, type TaskLike } from "@/lib/domain/tasks";

export type EmailTask = TaskLike & { id: string; title: string; location: string | null };

export const emailStyles = {
  heading: { color: "#111827", fontSize: "28px", fontWeight: 700, lineHeight: "34px", margin: "24px 0 12px" },
  sectionHeading: { color: "#111827", fontSize: "16px", fontWeight: 700, margin: "24px 0 12px" },
  text: { color: "#6B7280", fontSize: "14px", lineHeight: "22px", margin: "8px 0" },
  row: { borderBottom: "1px solid #F0F1F3", padding: "12px 0" },
} satisfies Record<string, CSSProperties>;

export function EmailLayout({ preview, title, appUrl, children }: {
  preview: string;
  title: string;
  appUrl: string;
  children: ReactNode;
}) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: "#F3F4F6", color: "#111827", fontFamily: "'Inter Tight', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif", margin: 0, padding: "24px 12px" }}>
        <Container style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "12px", maxWidth: "560px", padding: "28px 24px" }}>
          <Text style={{ color: "#2563EB", fontSize: "18px", fontWeight: 700, margin: 0 }}>HomeKeeper</Text>
          <Heading as="h1" style={emailStyles.heading}>{title}</Heading>
          {children}
          <Section style={{ marginTop: "24px" }}>
            <Button href={new URL("/tasks", appUrl).toString()} style={{ backgroundColor: "#2563EB", borderRadius: "8px", color: "#FFFFFF", fontSize: "14px", fontWeight: 600, padding: "12px 20px", textDecoration: "none" }}>
              Open HomeKeeper
            </Button>
          </Section>
          <Hr style={{ borderColor: "#E5E7EB", margin: "28px 0 16px" }} />
          <Text style={{ ...emailStyles.text, fontSize: "12px", lineHeight: "18px" }}>
            You receive this email because notifications are enabled for your home.{" "}
            <Link href={new URL("/settings#notifications", appUrl).toString()} style={{ color: "#2563EB" }}>Manage notifications</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export function TaskList({ tasks, today, emptyText }: { tasks: readonly EmailTask[]; today: string; emptyText: string }) {
  if (tasks.length === 0) return <Text style={emailStyles.text}>{emptyText}</Text>;
  return tasks.map((task) => (
    <Section key={task.id} style={emailStyles.row}>
      <Text style={{ color: "#111827", fontSize: "14px", fontWeight: 600, lineHeight: "20px", margin: "0 0 4px" }}>{task.title}</Text>
      <Text style={{ ...emailStyles.text, margin: 0 }}>
        {task.location ? `${task.location} · ` : ""}
        <span style={{ color: task.dueDate < today ? "#DC2626" : "#D97706" }}>{dueText(task, today)}</span>
      </Text>
    </Section>
  ));
}
