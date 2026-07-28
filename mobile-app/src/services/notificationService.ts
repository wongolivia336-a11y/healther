import { Capacitor } from "@capacitor/core";
import {
  LocalNotifications,
  type ActionPerformed,
  type LocalNotificationSchema
} from "@capacitor/local-notifications";
import type { Medication, NotificationCapability } from "../types";

const ACTION_TYPE = "MEDICATION_ACTIONS";
const CHANNEL_ID = "medication-reminders";
const REVIEW_CHANNEL_ID = "review-reminders";

function notificationId(key: string): number {
  let hash = 0;
  for (const char of key) hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
  return Math.abs(hash % 2_000_000_000);
}

function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function occurrenceForDay(dayOffset: number, time: string, offsetMinutes = 0): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hours, minutes + offsetMinutes, 0, 0);
  return date;
}

export async function initializeNotifications(
  onAction: (action: ActionPerformed) => void
): Promise<NotificationCapability> {
  if (!Capacitor.isNativePlatform()) {
    return {
      platform: "web",
      permission: "unavailable",
      exactAlarm: "unavailable",
      message: "浏览器预览不会触发安卓系统通知；安装到安卓后启用。"
    };
  }

  await LocalNotifications.registerActionTypes({
    types: [{
      id: ACTION_TYPE,
      actions: [
        { id: "taken", title: "已服" },
        { id: "skip", title: "跳过", destructive: true },
        { id: "snooze", title: "稍后" }
      ]
    }]
  });
  await LocalNotifications.createChannel({
    id: CHANNEL_ID,
    name: "用药提醒",
    description: "按药物方案提醒，并支持已服、跳过和稍后",
    importance: 5,
    visibility: 1,
    vibration: true
  });
  await LocalNotifications.createChannel({
    id: REVIEW_CHANNEL_ID,
    name: "复查与就诊提醒",
    description: "在复查前一天和当天提醒检查项目与就诊安排",
    importance: 4,
    visibility: 1,
    vibration: true
  });
  await LocalNotifications.removeAllListeners();
  await LocalNotifications.addListener("localNotificationActionPerformed", onAction);

  let permission = await LocalNotifications.checkPermissions();
  if (permission.display === "prompt") permission = await LocalNotifications.requestPermissions();
  const exact = await LocalNotifications.checkExactNotificationSetting();
  return {
    platform: "android",
    permission: permission.display,
    exactAlarm: exact.exact_alarm,
    message: permission.display !== "granted"
      ? "需要允许通知权限，药物提醒才能出现。"
      : exact.exact_alarm !== "granted"
        ? "通知已允许；还需要开启精确闹钟权限。"
        : "通知与精确闹钟权限已就绪。"
  };
}

export async function requestExactAlarm(): Promise<void> {
  if (Capacitor.isNativePlatform()) await LocalNotifications.changeExactNotificationSetting();
}

export async function scheduleMedication(medication: Medication): Promise<void> {
  if (!Capacitor.isNativePlatform() || !medication.enabled) return;
  await cancelMedication(medication.id);
  const notifications: LocalNotificationSchema[] = [];
  for (let dayOffset = 0; dayOffset < 14; dayOffset += 1) {
    const day = occurrenceForDay(dayOffset, medication.time);
    const dateKey = localDateKey(day);
    for (let index = 0; index <= medication.repeatCount; index += 1) {
      const offset = index * medication.repeatIntervalMinutes;
      const at = occurrenceForDay(dayOffset, medication.time, offset);
      if (at.getTime() <= Date.now()) continue;
      notifications.push({
        id: notificationId(`${medication.id}-${dateKey}-${index}`),
        title: index === 0 ? `该服用 ${medication.name} 了` : `${medication.name} 仍待处理`,
        body: `${medication.dosage} · ${medication.notes}`,
        channelId: CHANNEL_ID,
        actionTypeId: ACTION_TYPE,
        ongoing: true,
        autoCancel: false,
        schedule: { at, allowWhileIdle: true },
        extra: {
          medicationId: medication.id,
          dateKey,
          scheduledTime: medication.time,
          repeatIndex: index
        }
      });
    }
  }
  await LocalNotifications.schedule({ notifications });
}

export async function refreshMedicationSchedules(medications: Medication[]): Promise<{
  scheduled: number;
  failed: string[];
}> {
  if (!Capacitor.isNativePlatform()) return { scheduled: 0, failed: [] };
  const enabled = medications.filter(item => item.enabled);
  const results = await Promise.allSettled(enabled.map(scheduleMedication));
  return {
    scheduled: results.filter(result => result.status === "fulfilled").length,
    failed: results.flatMap((result, index) => result.status === "rejected" ? [enabled[index].name] : [])
  };
}

export async function cancelMedication(medicationId: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  const pending = await LocalNotifications.getPending();
  const notifications = pending.notifications
    .filter(item => item.extra?.medicationId === medicationId)
    .map(item => ({ id: item.id }));
  if (notifications.length) await LocalNotifications.cancel({ notifications });
}

export async function cancelMedicationForDate(medicationId: string, dateKey = localDateKey()): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  const pending = await LocalNotifications.getPending();
  const notifications = pending.notifications
    .filter(item => item.extra?.medicationId === medicationId && item.extra?.dateKey === dateKey)
    .map(item => ({ id: item.id }));
  if (notifications.length) await LocalNotifications.cancel({ notifications });
}

export async function snoozeMedication(medication: Medication, dateKey = localDateKey()): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  await cancelMedicationForDate(medication.id, dateKey);
  const startAt = Date.now() + medication.defaultSnoozeMinutes * 60_000;
  const notifications: LocalNotificationSchema[] = [];
  for (let index = 0; index <= medication.repeatCount; index += 1) {
    const at = new Date(startAt + index * medication.repeatIntervalMinutes * 60_000);
    notifications.push({
      id: notificationId(`${medication.id}-${dateKey}-snooze-${index}`),
      title: index === 0 ? `稍后提醒：${medication.name}` : `${medication.name} 仍待处理`,
      body: `${medication.dosage} · ${medication.notes}`,
      channelId: CHANNEL_ID,
      actionTypeId: ACTION_TYPE,
      ongoing: true,
      autoCancel: false,
      schedule: { at, allowWhileIdle: true },
      extra: { medicationId: medication.id, dateKey, snoozed: true, repeatIndex: index }
    });
  }
  await LocalNotifications.schedule({
    notifications
  });
}

export async function scheduleReviewReminder(review: {
  id: string;
  date: string;
  title: string;
  items: string;
}): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  const pending = await LocalNotifications.getPending();
  const old = pending.notifications.filter(item => item.extra?.reviewId === review.id).map(item => ({ id: item.id }));
  if (old.length) await LocalNotifications.cancel({ notifications: old });

  const reviewDay = new Date(`${review.date}T07:30:00`);
  const previousDay = new Date(`${review.date}T19:00:00`);
  previousDay.setDate(previousDay.getDate() - 1);
  const notifications: LocalNotificationSchema[] = [];
  if (previousDay.getTime() > Date.now()) notifications.push({
    id: notificationId(`${review.id}-previous-day`),
    title: `明天：${review.title}`,
    body: review.items || "打开健康档案确认需要准备的资料",
    channelId: REVIEW_CHANNEL_ID,
    schedule: { at: previousDay, allowWhileIdle: true },
    extra: { reviewId: review.id, reminderStage: "previous-day" }
  });
  if (reviewDay.getTime() > Date.now()) notifications.push({
    id: notificationId(`${review.id}-same-day`),
    title: `今天：${review.title}`,
    body: review.items || "请带好报告和近期用药记录",
    channelId: REVIEW_CHANNEL_ID,
    schedule: { at: reviewDay, allowWhileIdle: true },
    extra: { reviewId: review.id, reminderStage: "same-day" }
  });
  if (notifications.length) await LocalNotifications.schedule({ notifications });
}

export async function cancelReviewReminder(reviewId: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  const pending = await LocalNotifications.getPending();
  const notifications = pending.notifications
    .filter(item => item.extra?.reviewId === reviewId)
    .map(item => ({ id: item.id }));
  if (notifications.length) await LocalNotifications.cancel({ notifications });
}
