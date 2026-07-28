import type { HealthRecord } from "../types";
import { deleteHealthRecord, saveHealthRecord } from "../data/healthRepository";
import { cancelReviewReminder, scheduleReviewReminder } from "./notificationService";

export async function saveHealthRecordBundle(records: HealthRecord[]): Promise<{
  reminderFailures: string[];
}> {
  for (const record of records) await saveHealthRecord(record);
  const reviews = records.filter(record => record.kind === "review");
  const results = await Promise.allSettled(reviews.map(review => scheduleReviewReminder({
    id: review.id,
    date: review.date,
    title: review.title,
    items: review.details["需要检查"] || review.summary
  })));
  return {
    reminderFailures: results.flatMap((result, index) => result.status === "rejected" ? [reviews[index].title] : [])
  };
}

export async function removeHealthRecord(record: HealthRecord): Promise<void> {
  if (record.kind === "review") await cancelReviewReminder(record.id);
  await deleteHealthRecord(record.id);
}
