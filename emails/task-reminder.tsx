import { Text } from "@react-email/components";
import { EmailLayout, emailStyles, type EmailTask, TaskList } from "./layout";

export type TaskReminderProps = {
  name: string;
  today: string;
  tasks: readonly EmailTask[];
  appUrl: string;
};

export default function TaskReminder({ name, today, tasks, appUrl }: TaskReminderProps) {
  const count = tasks.length;
  return (
    <EmailLayout appUrl={appUrl} title="A little care for your home" preview={`${count} maintenance task${count === 1 ? "" : "s"} overdue or due in the next 3 days.`}>
      <Text style={emailStyles.text}>Hi {name},</Text>
      <Text style={emailStyles.text}>
        You have {count} maintenance task{count === 1 ? "" : "s"} overdue or due in the next 3 days.
      </Text>
      <TaskList tasks={tasks} today={today} emptyText="You're all caught up. No tasks need a reminder today." />
    </EmailLayout>
  );
}
