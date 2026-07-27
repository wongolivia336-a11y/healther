export type MedicationKind = "thyroid" | "steroid" | "liver" | "diabetes" | "other";
export type MedicationStatus = "pending" | "taken" | "skipped" | "snoozed";

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  notes: string;
  kind: MedicationKind;
  time: string;
  repeatIntervalMinutes: number;
  repeatCount: number;
  defaultSnoozeMinutes: number;
  startDate: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MedicationEvent {
  id: string;
  medicationId: string;
  scheduledFor: string;
  handledAt: string | null;
  status: MedicationStatus;
  snoozedUntil: string | null;
}

export interface NotificationCapability {
  platform: "android" | "web";
  permission: PermissionState | "unavailable";
  exactAlarm: PermissionState | "unavailable";
  message: string;
}

export type MedicationDraft = Omit<Medication, "id" | "createdAt" | "updatedAt">;
import type { PermissionState } from "@capacitor/core";
