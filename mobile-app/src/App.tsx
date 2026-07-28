import { useEffect, useMemo, useRef, useState } from "react";
import type { ActionPerformed } from "@capacitor/local-notifications";
import type { Medication, MedicationDraft, MedicationEvent, NotificationCapability } from "./types";
import { listEvents, listMedications, saveEvent, saveMedication } from "./data/medicationRepository";
import {
  cancelMedicationForDate,
  initializeNotifications,
  requestExactAlarm,
  scheduleMedication,
  snoozeMedication
} from "./services/notificationService";
import { HealthRecords } from "./HealthRecords";
import { Profile } from "./Profile";

const kindMeta = {
  thyroid: { label: "甲状腺用药", icon: "thyroid", color: "purple" },
  steroid: { label: "激素类药物", icon: "pill", color: "orange" },
  liver: { label: "肝胆相关用药", icon: "liver", color: "green" },
  diabetes: { label: "血糖相关用药", icon: "blood-drop", color: "blue" },
  other: { label: "其他药物", icon: "pill", color: "gray" }
} as const;

const emptyCapability: NotificationCapability = {
  platform: "web",
  permission: "unavailable",
  exactAlarm: "unavailable",
  message: "正在检查提醒能力…"
};

function todayAt(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

function todayKey(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function draftFromMedication(item: Medication): MedicationDraft {
  const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...draft } = item;
  return draft;
}

export default function App() {
  const pageNames = ["today", "records", "food", "learn", "mine"] as const;
  type PageName = typeof pageNames[number];
  const initialPage = pageNames.includes(location.hash.slice(1) as PageName) ? location.hash.slice(1) as PageName : "today";
  const [page, setPage] = useState<PageName>(initialPage);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [events, setEvents] = useState<MedicationEvent[]>([]);
  const [capability, setCapability] = useState(emptyCapability);
  const [editing, setEditing] = useState<Medication | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toast, setToast] = useState("");
  const medicationRef = useRef<Medication[]>([]);

  const eventByMedication = useMemo(() => {
    const map = new Map<string, MedicationEvent>();
    const key = todayKey();
    for (const event of events) {
      if (event.id.endsWith(key)) map.set(event.medicationId, event);
    }
    return map;
  }, [events]);

  useEffect(() => {
    medicationRef.current = medications;
  }, [medications]);
  useEffect(() => {
    history.replaceState(null, "", `#${page}`);
  }, [page]);

  useEffect(() => {
    void Promise.all([listMedications(), listEvents()]).then(([meds, storedEvents]) => {
      setMedications(meds.sort((a, b) => a.time.localeCompare(b.time)));
      setEvents(storedEvents);
    });
    void initializeNotifications(handleNotificationAction).then(setCapability);
  }, []);

  function announce(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  }

  async function handleNotificationAction(action: ActionPerformed) {
    const medicationId = String(action.notification.extra?.medicationId ?? "");
    const medication = medicationRef.current.find(item => item.id === medicationId);
    if (!medication) return;
    if (action.actionId === "snooze") {
      await snoozeMedication(medication);
      announce(`已在 ${medication.defaultSnoozeMinutes} 分钟后再次提醒`);
      return;
    }
    await recordStatus(medication, action.actionId === "skip" ? "skipped" : "taken");
  }

  async function recordStatus(medication: Medication, status: "taken" | "skipped") {
    const now = new Date().toISOString();
    const event: MedicationEvent = {
      id: `${medication.id}-${new Date().toISOString().slice(0, 10)}`,
      medicationId: medication.id,
      scheduledFor: todayAt(medication.time),
      handledAt: now,
      status,
      snoozedUntil: null
    };
    await saveEvent(event);
    await cancelMedicationForDate(medication.id);
    setEvents(current => [...current.filter(item => item.medicationId !== medication.id), event]);
    announce(status === "taken" ? "已记录服用" : "已记录跳过");
  }

  async function handleSnooze(medication: Medication) {
    const until = new Date(Date.now() + medication.defaultSnoozeMinutes * 60_000).toISOString();
    const event: MedicationEvent = {
      id: `${medication.id}-${new Date().toISOString().slice(0, 10)}`,
      medicationId: medication.id,
      scheduledFor: todayAt(medication.time),
      handledAt: new Date().toISOString(),
      status: "snoozed",
      snoozedUntil: until
    };
    await saveEvent(event);
    await snoozeMedication(medication);
    setEvents(current => [...current.filter(item => item.medicationId !== medication.id), event]);
    announce(`已在 ${medication.defaultSnoozeMinutes} 分钟后再次提醒`);
  }

  async function saveDraft(draft: MedicationDraft) {
    const now = new Date().toISOString();
    const medication: Medication = editing
      ? { ...editing, ...draft, updatedAt: now }
      : { ...draft, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
    await saveMedication(medication);
    await scheduleMedication(medication);
    setMedications(current => [...current.filter(item => item.id !== medication.id), medication].sort((a, b) => a.time.localeCompare(b.time)));
    setSheetOpen(false);
    announce("药物与提醒规则已保存");
  }

  const pending = medications.filter(item => !["taken", "skipped"].includes(eventByMedication.get(item.id)?.status ?? ""));
  const completed = medications.filter(item => ["taken", "skipped"].includes(eventByMedication.get(item.id)?.status ?? ""));

  return (
    <main className="app-shell">
      {page === "today" && <>
      <header className="topbar">
        <div><small>{new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "long" }).format(new Date())}</small><h1>今日</h1></div>
        <button className="round-button" aria-label="提醒设置" onClick={() => void requestExactAlarm()}>◉</button>
      </header>

      <section className={`capability ${capability.permission === "granted" && capability.exactAlarm === "granted" ? "ready" : ""}`}>
        <span>{capability.platform === "android" ? "安卓提醒" : "浏览器预览"}</span>
        <p>{capability.message}</p>
        {capability.platform === "android" && capability.exactAlarm !== "granted" && (
          <button onClick={() => void requestExactAlarm()}>开启精确闹钟</button>
        )}
      </section>

      <section className="hero">
        <div><span>{pending.length} 项待处理</span><h2>今日用药</h2><p>每种药都可以设置自己的重复提醒规则</p></div>
        <img src="/assets/illustrations/medication-hero-v2.png" alt="" />
      </section>

      <div className="section-title"><h2>待处理</h2><button onClick={() => { setEditing(null); setSheetOpen(true); }}>＋ 新增药物</button></div>
      <section className="medication-list">
        {pending.map(medication => (
          <MedicationCard
            key={medication.id}
            medication={medication}
            event={eventByMedication.get(medication.id)}
            onEdit={() => { setEditing(medication); setSheetOpen(true); }}
            onTaken={() => void recordStatus(medication, "taken")}
            onSkipped={() => void recordStatus(medication, "skipped")}
            onSnooze={() => void handleSnooze(medication)}
          />
        ))}
      </section>

      {completed.length > 0 && (
        <>
          <div className="section-title completed-title"><h2>今日已完成</h2><span>{completed.length} 项</span></div>
          <section className="medication-list completed-list">
            {completed.map(medication => (
              <MedicationCard key={medication.id} medication={medication} event={eventByMedication.get(medication.id)} />
            ))}
          </section>
        </>
      )}
      </>}

      {page === "records" && <HealthRecords announce={announce} />}
      {page === "food" && <ComingSoon title="饮食助手" description="正式食物数据与保守筛选功能将在后续里程碑接入。" />}
      {page === "learn" && <ComingSoon title="安心科普" description="权威来源的患者科普内容将在后续里程碑接入。" />}
      {page === "mine" && <Profile medicationCount={medications.length} announce={announce} onOpenTreatment={() => setPage("today")} />}

      <nav className="bottom-nav">
        <button className={page === "today" ? "active" : ""} onClick={() => setPage("today")}><i className="icon home" />今日</button>
        <button className={page === "records" ? "active" : ""} onClick={() => setPage("records")}><i className="icon records" />健康档案</button>
        <button className={page === "food" ? "active" : ""} onClick={() => setPage("food")}><i className="icon food" />饮食助手</button>
        <button className={page === "learn" ? "active" : ""} onClick={() => setPage("learn")}><i className="icon learn" />安心科普</button>
        <button className={page === "mine" ? "active" : ""} onClick={() => setPage("mine")}><i className="icon mine" />我的</button>
      </nav>

      {sheetOpen && (
        <MedicationEditor
          medication={editing}
          onClose={() => setSheetOpen(false)}
          onSave={saveDraft}
        />
      )}
      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}

function ComingSoon({ title, description }: { title: string; description: string }) {
  return <><header className="topbar"><div><small>功能开发中</small><h1>{title}</h1></div></header><div className="empty-panel">{description}</div></>;
}

function MedicationCard({
  medication, event, onEdit, onTaken, onSkipped, onSnooze
}: {
  medication: Medication;
  event?: MedicationEvent;
  onEdit?: () => void;
  onTaken?: () => void;
  onSkipped?: () => void;
  onSnooze?: () => void;
}) {
  const meta = kindMeta[medication.kind];
  return (
    <article className={`medication-card ${event?.status ?? ""}`}>
      <button className={`med-icon ${meta.color}`} onClick={onEdit} aria-label={`编辑 ${medication.name}`}>
        <i className={`health-icon ${meta.icon}`} />
      </button>
      <div className="med-main">
        <div className="med-heading"><div><h3>{medication.name}</h3><p>{medication.dosage} · {medication.notes}</p></div><time>{medication.time}</time></div>
        <span className="type-label">{meta.label}</span>
        <p className="repeat-rule">每 {medication.repeatIntervalMinutes} 分钟再提醒，最多 {medication.repeatCount} 次</p>
        {onTaken ? (
          <div className="actions">
            <button onClick={onSnooze}>稍后</button>
            <button onClick={onSkipped}>跳过</button>
            <button className="primary" onClick={onTaken}>已服</button>
          </div>
        ) : (
          <div className={`status-label ${event?.status}`}>{event?.status === "skipped" ? "已跳过" : "已服用"}</div>
        )}
      </div>
    </article>
  );
}

function MedicationEditor({
  medication, onClose, onSave
}: {
  medication: Medication | null;
  onClose: () => void;
  onSave: (draft: MedicationDraft) => Promise<void>;
}) {
  const initial: MedicationDraft = medication ? draftFromMedication(medication) : {
    name: "", dosage: "", notes: "口服", kind: "other", time: "08:00",
    repeatIntervalMinutes: 15, repeatCount: 2, defaultSnoozeMinutes: 15,
    startDate: new Date().toISOString().slice(0, 10), enabled: true
  };
  const [draft, setDraft] = useState(initial);
  const update = <K extends keyof MedicationDraft>(key: K, value: MedicationDraft[K]) => setDraft(current => ({ ...current, [key]: value }));
  return (
    <div className="sheet-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="editor-sheet">
        <div className="handle" />
        <header><div><small>{medication ? "编辑用药方案" : "新增药物"}</small><h2>提醒规则</h2></div><button onClick={onClose}>×</button></header>
        <label>药物名称<input value={draft.name} onChange={e => update("name", e.target.value)} /></label>
        <div className="field-grid">
          <label>剂量<input value={draft.dosage} onChange={e => update("dosage", e.target.value)} /></label>
          <label>提醒时间<input type="time" value={draft.time} onChange={e => update("time", e.target.value)} /></label>
        </div>
        <label>备注<input value={draft.notes} onChange={e => update("notes", e.target.value)} /></label>
        <label>药物类别<select value={draft.kind} onChange={e => update("kind", e.target.value as MedicationDraft["kind"])}>
          {Object.entries(kindMeta).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
        </select></label>
        <div className="rule-box">
          <h3>未处理时重复提醒</h3>
          <div className="field-grid">
            <label>重复间隔<input type="number" min="10" max="240" value={draft.repeatIntervalMinutes} onChange={e => update("repeatIntervalMinutes", Number(e.target.value))} /><span>分钟</span></label>
            <label>最多重复<input type="number" min="0" max="10" value={draft.repeatCount} onChange={e => update("repeatCount", Number(e.target.value))} /><span>次</span></label>
          </div>
          <label>“稍后”默认时间<input type="number" min="10" max="240" value={draft.defaultSnoozeMinutes} onChange={e => update("defaultSnoozeMinutes", Number(e.target.value))} /><span>分钟</span></label>
        </div>
        <label className="toggle"><span><b>启用提醒</b><small>停用后保留历史记录</small></span><input type="checkbox" checked={draft.enabled} onChange={e => update("enabled", e.target.checked)} /></label>
        <button className="save-button" disabled={!draft.name.trim()} onClick={() => void onSave(draft)}>保存并安排提醒</button>
      </section>
    </div>
  );
}
