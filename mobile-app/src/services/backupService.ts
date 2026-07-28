import { Capacitor } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import type { HealthRecord, Medication, MedicationEvent, UserProfile } from "../types";
import { getUserProfile, listHealthRecords, replaceHealthRecords, saveUserProfile, clearPostVisitDraft } from "../data/healthRepository";
import { listEvents, listMedications, replaceEvents, replaceMedications } from "../data/medicationRepository";
import { deleteStoredImages, exportImageAsDataUrl, persistImageDataUrl } from "./imageStorage";
import { refreshMedicationSchedules, scheduleReviewReminder } from "./notificationService";

type BackupPayload = {
  schemaVersion: 1;
  createdAt: string;
  medications: Medication[];
  events: MedicationEvent[];
  records: HealthRecord[];
  profile: UserProfile;
};

type EncryptedBackup = {
  format: "healther-encrypted-backup";
  version: 1;
  algorithm: "AES-GCM";
  iterations: 150000;
  salt: string;
  iv: string;
  ciphertext: string;
};

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return Uint8Array.from(bytes).buffer;
}

async function deriveKey(password: string, salt: Uint8Array, iterations: number) {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: toArrayBuffer(salt), iterations, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptPayload(payload: BackupPayload, password: string): Promise<EncryptedBackup> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const iterations = 150000;
  const key = await deriveKey(password, salt, iterations);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv) },
    key,
    new TextEncoder().encode(JSON.stringify(payload))
  );
  return {
    format: "healther-encrypted-backup",
    version: 1,
    algorithm: "AES-GCM",
    iterations,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(encrypted))
  };
}

async function decryptBackup(raw: string, password: string): Promise<BackupPayload> {
  const envelope = JSON.parse(raw) as EncryptedBackup;
  if (envelope.format !== "healther-encrypted-backup" || envelope.version !== 1) throw new Error("不支持的备份格式");
  const salt = base64ToBytes(envelope.salt);
  const iv = base64ToBytes(envelope.iv);
  const key = await deriveKey(password, salt, envelope.iterations);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv) },
    key,
    toArrayBuffer(base64ToBytes(envelope.ciphertext))
  );
  const payload = JSON.parse(new TextDecoder().decode(decrypted)) as BackupPayload;
  if (payload.schemaVersion !== 1 || !Array.isArray(payload.medications) || !Array.isArray(payload.records)) {
    throw new Error("备份内容不完整");
  }
  return payload;
}

async function collectPayload(): Promise<BackupPayload> {
  const [medications, events, storedRecords, profile] = await Promise.all([
    listMedications(), listEvents(), listHealthRecords(), getUserProfile()
  ]);
  const records: HealthRecord[] = [];
  for (const record of storedRecords) {
    records.push({ ...record, images: await Promise.all(record.images.map(exportImageAsDataUrl)) });
  }
  return { schemaVersion: 1, createdAt: new Date().toISOString(), medications, events, records, profile };
}

export async function exportEncryptedBackup(password: string): Promise<void> {
  const envelope = await encryptPayload(await collectPayload(), password);
  const content = JSON.stringify(envelope);
  const date = new Date().toISOString().slice(0, 10);
  const filename = `Healther-backup-${date}.healther`;
  if (!Capacitor.isNativePlatform()) {
    const url = URL.createObjectURL(new Blob([content], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    return;
  }
  const path = `backups/${filename}`;
  await Filesystem.writeFile({
    path,
    data: content,
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
    recursive: true
  });
  const { uri } = await Filesystem.getUri({ path, directory: Directory.Cache });
  await Share.share({ title: "Healther 加密备份", text: "请妥善保存此备份文件和密码。", url: uri, dialogTitle: "保存或发送备份文件" });
}

export async function restoreEncryptedBackup(file: File, password: string): Promise<void> {
  const payload = await decryptBackup(await file.text(), password);
  const currentRecords = await listHealthRecords();
  const records: HealthRecord[] = [];
  for (const record of payload.records) {
    records.push({
      ...record,
      images: await Promise.all(record.images.map(image => image.startsWith("data:") ? persistImageDataUrl(image) : Promise.resolve(image)))
    });
  }
  await Promise.all([
    replaceMedications(payload.medications),
    replaceEvents(payload.events),
    replaceHealthRecords(records),
    saveUserProfile(payload.profile),
    clearPostVisitDraft()
  ]);
  await deleteStoredImages(currentRecords.flatMap(record => record.images));
  await refreshMedicationSchedules(payload.medications);
  await Promise.allSettled(records.filter(record => record.kind === "review").map(review => scheduleReviewReminder({
    id: review.id,
    date: review.date,
    title: review.title,
    items: review.details["需要检查"] || review.summary
  })));
}
