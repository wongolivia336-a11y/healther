import { Capacitor } from "@capacitor/core";
import { CapacitorSQLite, SQLiteConnection, type SQLiteDBConnection } from "@capacitor-community/sqlite";
import type { Medication, MedicationEvent } from "../types";

const STORAGE_KEY = "healther.mobile.medications.v1";
const EVENT_KEY = "healther.mobile.events.v1";
const sqlite = new SQLiteConnection(CapacitorSQLite);
let db: SQLiteDBConnection | null = null;

const seedMedications: Medication[] = [
  {
    id: "med-euthyrox",
    name: "优甲乐",
    dosage: "1 片",
    notes: "口服 · 空腹",
    kind: "thyroid",
    time: "07:30",
    repeatIntervalMinutes: 15,
    repeatCount: 2,
    defaultSnoozeMinutes: 15,
    startDate: new Date().toISOString().slice(0, 10),
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "med-methylprednisolone",
    name: "甲泼尼龙",
    dosage: "按当前方案",
    notes: "口服 · 餐后",
    kind: "steroid",
    time: "08:00",
    repeatIntervalMinutes: 20,
    repeatCount: 2,
    defaultSnoozeMinutes: 15,
    startDate: new Date().toISOString().slice(0, 10),
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

async function getNativeDb(): Promise<SQLiteDBConnection> {
  if (db) return db;
  const consistency = await sqlite.checkConnectionsConsistency();
  const existing = await sqlite.isConnection("healther", false);
  db = consistency.result && existing.result
    ? await sqlite.retrieveConnection("healther", false)
    : await sqlite.createConnection("healther", false, "no-encryption", 1, false);
  await db.open();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS medications (
      id TEXT PRIMARY KEY NOT NULL,
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS medication_events (
      id TEXT PRIMARY KEY NOT NULL,
      medication_id TEXT NOT NULL,
      scheduled_for TEXT NOT NULL,
      payload TEXT NOT NULL
    );
  `);
  return db;
}

function readWeb<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) as T : fallback;
}

export async function listMedications(): Promise<Medication[]> {
  if (!Capacitor.isNativePlatform()) {
    const values = readWeb<Medication[]>(STORAGE_KEY, seedMedications);
    if (!localStorage.getItem(STORAGE_KEY)) localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    return values;
  }
  const nativeDb = await getNativeDb();
  const result = await nativeDb.query("SELECT payload FROM medications ORDER BY updated_at DESC");
  if (!result.values?.length) {
    for (const medication of seedMedications) await saveMedication(medication);
    return seedMedications;
  }
  return result.values.map(row => JSON.parse(String(row.payload)) as Medication);
}

export async function saveMedication(medication: Medication): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    const items = readWeb<Medication[]>(STORAGE_KEY, []);
    const index = items.findIndex(item => item.id === medication.id);
    if (index >= 0) items[index] = medication;
    else items.push(medication);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    return;
  }
  const nativeDb = await getNativeDb();
  await nativeDb.run(
    "INSERT OR REPLACE INTO medications (id, payload, updated_at) VALUES (?, ?, ?)",
    [medication.id, JSON.stringify(medication), medication.updatedAt]
  );
}

export async function listEvents(): Promise<MedicationEvent[]> {
  if (!Capacitor.isNativePlatform()) return readWeb<MedicationEvent[]>(EVENT_KEY, []);
  const nativeDb = await getNativeDb();
  const result = await nativeDb.query("SELECT payload FROM medication_events ORDER BY scheduled_for DESC");
  return (result.values ?? []).map(row => JSON.parse(String(row.payload)) as MedicationEvent);
}

export async function saveEvent(event: MedicationEvent): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    const items = readWeb<MedicationEvent[]>(EVENT_KEY, []);
    const index = items.findIndex(item => item.id === event.id);
    if (index >= 0) items[index] = event;
    else items.push(event);
    localStorage.setItem(EVENT_KEY, JSON.stringify(items));
    return;
  }
  const nativeDb = await getNativeDb();
  await nativeDb.run(
    "INSERT OR REPLACE INTO medication_events (id, medication_id, scheduled_for, payload) VALUES (?, ?, ?, ?)",
    [event.id, event.medicationId, event.scheduledFor, JSON.stringify(event)]
  );
}
