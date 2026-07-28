import { Capacitor } from "@capacitor/core";
import type { HealthRecord, PostVisitDraft, UserProfile } from "../types";
import { getNativeDb } from "./medicationRepository";

const RECORD_KEY = "healther.mobile.health-records.v1";
const PROFILE_KEY = "healther.mobile.profile.v1";
const POST_VISIT_DRAFT_KEY = "healther.mobile.post-visit-draft.v1";

const now = new Date().toISOString();
const seedRecords: HealthRecord[] = [
  {
    id: "record-review",
    kind: "review",
    date: "2026-07-28",
    title: "消化内科复查计划",
    summary: "肝功能、血脂、空腹血糖等 4 项",
    details: { "医院与科室": "上海市第一人民医院 · 消化内科", "需要检查": "肝功能、血脂、空腹血糖等 4 项" },
    images: [],
    createdAt: now,
    updatedAt: now
  },
  {
    id: "record-visit",
    kind: "visit",
    date: "2026-07-15",
    title: "消化内科就诊",
    summary: "张医生 · 就诊后已整理",
    details: {
      "医院与科室": "上海市第一人民医院 · 消化内科",
      "医生": "张医生",
      "医生主要意见": "继续按当前方案治疗，复查后再评估剂量。",
      "用药变化": "甲泼尼龙剂量已更新。"
    },
    images: [],
    createdAt: now,
    updatedAt: now
  },
  {
    id: "record-medication",
    kind: "medication",
    date: "2026-07-15",
    title: "药物方案调整",
    summary: "甲泼尼龙剂量已更新",
    details: { "调整内容": "甲泼尼龙剂量已更新，历史记录保持不变。" },
    images: [],
    createdAt: now,
    updatedAt: now
  }
];

const seedProfile: UserProfile = {
  name: "妈妈",
  conditions: ["糖尿病", "甲状腺全切", "更年期", "胆固醇高", "自免肝 / 原发性胆汁淤积"],
  surgeries: ["甲状腺全切"],
  allergies: "尚未填写",
  hospitals: "上海市第一人民医院",
  doctor: "张医生",
  emergencyContact: "尚未填写",
  updatedAt: now
};

function readWeb<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) as T : fallback;
}

async function ensureTables() {
  const db = await getNativeDb();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS health_records (
      id TEXT PRIMARY KEY NOT NULL,
      record_date TEXT NOT NULL,
      kind TEXT NOT NULL,
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS user_profile (
      id TEXT PRIMARY KEY NOT NULL,
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS app_state (
      id TEXT PRIMARY KEY NOT NULL,
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  return db;
}

export async function listHealthRecords(): Promise<HealthRecord[]> {
  if (!Capacitor.isNativePlatform()) {
    const records = readWeb(RECORD_KEY, seedRecords);
    if (!localStorage.getItem(RECORD_KEY)) localStorage.setItem(RECORD_KEY, JSON.stringify(records));
    return records.sort((a, b) => b.date.localeCompare(a.date));
  }
  const db = await ensureTables();
  const result = await db.query("SELECT payload FROM health_records ORDER BY record_date DESC, updated_at DESC");
  if (!result.values?.length) {
    for (const record of seedRecords) await saveHealthRecord(record);
    return seedRecords;
  }
  return result.values.map(row => JSON.parse(String(row.payload)) as HealthRecord);
}

export async function saveHealthRecord(record: HealthRecord): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    const records = readWeb<HealthRecord[]>(RECORD_KEY, []);
    const next = [...records.filter(item => item.id !== record.id), record];
    localStorage.setItem(RECORD_KEY, JSON.stringify(next));
    return;
  }
  const db = await ensureTables();
  await db.run(
    "INSERT OR REPLACE INTO health_records (id, record_date, kind, payload, updated_at) VALUES (?, ?, ?, ?, ?)",
    [record.id, record.date, record.kind, JSON.stringify(record), record.updatedAt]
  );
}

export async function deleteHealthRecord(id: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    localStorage.setItem(RECORD_KEY, JSON.stringify(readWeb<HealthRecord[]>(RECORD_KEY, []).filter(item => item.id !== id)));
    return;
  }
  const db = await ensureTables();
  await db.run("DELETE FROM health_records WHERE id = ?", [id]);
}

export async function getUserProfile(): Promise<UserProfile> {
  if (!Capacitor.isNativePlatform()) {
    const profile = readWeb(PROFILE_KEY, seedProfile);
    if (!localStorage.getItem(PROFILE_KEY)) localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    return profile;
  }
  const db = await ensureTables();
  const result = await db.query("SELECT payload FROM user_profile WHERE id = 'owner'");
  if (!result.values?.length) {
    await saveUserProfile(seedProfile);
    return seedProfile;
  }
  return JSON.parse(String(result.values[0].payload)) as UserProfile;
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    return;
  }
  const db = await ensureTables();
  await db.run(
    "INSERT OR REPLACE INTO user_profile (id, payload, updated_at) VALUES ('owner', ?, ?)",
    [JSON.stringify(profile), profile.updatedAt]
  );
}

export async function getPostVisitDraft(): Promise<PostVisitDraft | null> {
  if (!Capacitor.isNativePlatform()) return readWeb<PostVisitDraft | null>(POST_VISIT_DRAFT_KEY, null);
  const db = await ensureTables();
  const result = await db.query("SELECT payload FROM app_state WHERE id = 'post-visit-draft'");
  return result.values?.length ? JSON.parse(String(result.values[0].payload)) as PostVisitDraft : null;
}

export async function savePostVisitDraft(draft: PostVisitDraft): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    localStorage.setItem(POST_VISIT_DRAFT_KEY, JSON.stringify(draft));
    return;
  }
  const db = await ensureTables();
  await db.run(
    "INSERT OR REPLACE INTO app_state (id, payload, updated_at) VALUES ('post-visit-draft', ?, ?)",
    [JSON.stringify(draft), draft.savedAt]
  );
}

export async function clearPostVisitDraft(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    localStorage.removeItem(POST_VISIT_DRAFT_KEY);
    return;
  }
  const db = await ensureTables();
  await db.run("DELETE FROM app_state WHERE id = 'post-visit-draft'");
}

export async function replaceHealthRecords(records: HealthRecord[]): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    localStorage.setItem(RECORD_KEY, JSON.stringify(records));
    return;
  }
  const db = await ensureTables();
  await db.execute("DELETE FROM health_records;");
  for (const record of records) await saveHealthRecord(record);
}
