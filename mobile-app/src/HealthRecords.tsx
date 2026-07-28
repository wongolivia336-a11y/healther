import { useEffect, useMemo, useState } from "react";
import type { HealthRecord, HealthRecordKind, PostVisitDraft } from "./types";
import {
  clearPostVisitDraft,
  getPostVisitDraft,
  listHealthRecords,
  savePostVisitDraft
} from "./data/healthRepository";
import { removeHealthRecord, saveHealthRecordBundle } from "./services/healthRecordService";

const kindMeta: Record<HealthRecordKind, { label: string; icon: string; color: string }> = {
  visit: { label: "就诊", icon: "医", color: "blue" },
  report: { label: "检查", icon: "检", color: "green" },
  medication: { label: "用药", icon: "药", color: "orange" },
  review: { label: "复查", icon: "复", color: "purple" }
};

const tabs: Array<{ value: "all" | HealthRecordKind; label: string }> = [
  { value: "all", label: "全部" },
  { value: "visit", label: "就诊" },
  { value: "report", label: "检查" },
  { value: "medication", label: "用药" },
  { value: "review", label: "复查" }
];

export function HealthRecords({ announce }: { announce: (message: string) => void }) {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [tab, setTab] = useState<"all" | HealthRecordKind>("all");
  const [detail, setDetail] = useState<HealthRecord | null>(null);
  const [adding, setAdding] = useState(false);
  const [postVisit, setPostVisit] = useState(false);

  useEffect(() => { void listHealthRecords().then(setRecords); }, []);
  const visible = useMemo(
    () => records.filter(item => tab === "all" || item.kind === tab).sort((a, b) => b.date.localeCompare(a.date)),
    [records, tab]
  );

  async function save(nextRecords: HealthRecord[]) {
    const result = await saveHealthRecordBundle(nextRecords);
    setRecords(current => [...current.filter(item => !nextRecords.some(next => next.id === item.id)), ...nextRecords]);
    setAdding(false);
    announce(result.reminderFailures.length ? "记录已保存；部分复查提醒安排失败" : "健康记录与复查提醒已保存");
  }
  async function savePostVisit(nextRecords: HealthRecord[]) {
    const result = await saveHealthRecordBundle(nextRecords);
    const review = nextRecords.some(item => item.kind === "review");
    setRecords(current => [...current.filter(item => !nextRecords.some(next => next.id === item.id)), ...nextRecords]);
    setPostVisit(false);
    announce(review ? result.reminderFailures.length ? "记录已保存；请检查复查通知权限" : "就诊整理已保存，复查提醒已安排" : "就诊整理已保存");
  }

  async function remove(record: HealthRecord) {
    if (!window.confirm(`确定删除“${record.title}”吗？原始图片也会从本机记录中移除。`)) return;
    await removeHealthRecord(record);
    setRecords(current => current.filter(item => item.id !== record.id));
    setDetail(null);
    announce("记录已删除");
  }

  return (
    <>
      <header className="topbar">
        <div><small>统一健康时间线</small><h1>健康档案</h1></div>
        <button className="round-button" aria-label="新增健康记录" onClick={() => setAdding(true)}>＋</button>
      </header>
      <div className="record-tabs">
        {tabs.map(item => <button key={item.value} className={tab === item.value ? "active" : ""} onClick={() => setTab(item.value)}>{item.label}</button>)}
      </div>
      <section className="records-summary">
        <div><b>{records.length}</b><span>全部记录</span></div>
        <div><b>{records.filter(item => item.kind === "report").length}</b><span>报告组</span></div>
        <button onClick={() => setAdding(true)}>拍照或相册上传</button>
      </section>
      <button className="postvisit-entry" onClick={() => setPostVisit(true)}><span>＋</span><div><b>就诊后整理</b><small>按医生意见、诊断、用药和复查逐步填写</small></div><i>约 5 分钟 ›</i></button>
      <section className="health-timeline">
        {visible.length ? visible.map(record => {
          const meta = kindMeta[record.kind];
          return (
            <article key={record.id} className="health-record" onClick={() => setDetail(record)}>
              <span className={`record-icon ${meta.color}`}>{meta.icon}</span>
              <div><time>{record.date}</time><h2>{record.title}</h2><p>{record.summary}</p>
                {record.images.length > 0 && <span className="image-count">▧ {record.images.length} 张原图</span>}
              </div><i>›</i>
            </article>
          );
        }) : <div className="empty-panel">这个分类还没有记录。点击右上角“＋”添加。</div>}
      </section>
      {detail && <RecordDetail record={detail} onClose={() => setDetail(null)} onDelete={() => void remove(detail)} />}
      {adding && <RecordEditor onClose={() => setAdding(false)} onSave={save} />}
      {postVisit && <PostVisitWizard onClose={() => setPostVisit(false)} onSave={savePostVisit} />}
    </>
  );
}

const postVisitSteps = [
  ["这次去了哪里看诊？", "填写日期、医院、科室和医生。"],
  ["医生主要说了什么？", "用自己的话记录即可，不需要复述专业术语。"],
  ["诊断和身体有什么变化？", "没有变化也可以明确写下“无变化”。"],
  ["用药方案如何调整？", "这里只记录医嘱，保存后仍需在用药方案中二次确认。"],
  ["下一步什么时候复查？", "复查计划会进入健康档案，并安排前一天和当天提醒。"]
];

function PostVisitWizard({ onClose, onSave }: { onClose: () => void; onSave: (records: HealthRecord[]) => Promise<void> }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [restored, setRestored] = useState(false);
  const [validation, setValidation] = useState("");
  const [draft, setDraft] = useState<PostVisitDraft>({
    date: new Date().toISOString().slice(0, 10), hospital: "", doctor: "", advice: "",
    diagnosis: "", medication: "", reviewStatus: "", reviewDate: "", reviewItems: "", question: "", images: [],
    savedAt: new Date().toISOString()
  });
  const update = <K extends keyof PostVisitDraft>(key: K, value: PostVisitDraft[K]) => {
    setValidation("");
    setDraft(current => ({ ...current, [key]: value }));
  };

  useEffect(() => {
    void getPostVisitDraft().then(stored => {
      if (stored) {
        setDraft(stored);
        setRestored(true);
      }
      setHydrated(true);
    });
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => {
      void savePostVisitDraft({ ...draft, savedAt: new Date().toISOString() });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [draft, hydrated]);

  async function pickImages(files: FileList | null) {
    if (!files?.length) return;
    setSaving(true);
    try {
      const images = await Promise.all([...files].map(compressImage));
      update("images", [...draft.images, ...images].slice(0, 8));
    } finally {
      setSaving(false);
    }
  }

  async function finish() {
    setSaving(true);
    const time = new Date().toISOString();
    const groupId = crypto.randomUUID();
    const records: HealthRecord[] = [{
      id: `visit-${groupId}`, kind: "visit", date: draft.date,
      title: `${draft.hospital || "门诊"}就诊`,
      summary: [draft.doctor, draft.advice].filter(Boolean).join(" · ") || "就诊后已整理",
      details: {
        "医院与科室": draft.hospital,
        "医生": draft.doctor,
        "医生主要意见": draft.advice,
        "诊断与身体变化": draft.diagnosis,
        "用药变化": draft.medication,
        "下次想问医生": draft.question
      },
      images: draft.images, createdAt: time, updatedAt: time
    }];
    if (draft.medication.trim()) records.push({
      id: `medication-${groupId}`, kind: "medication", date: draft.date,
      title: "本次就诊的用药变化", summary: draft.medication,
      details: {
        "医生交代的变化": draft.medication,
        "确认状态": "尚未同步到用药提醒，请在当前用药方案中核对后确认。"
      },
      images: [], createdAt: time, updatedAt: time
    });
    if (draft.reviewDate) records.push({
      id: `review-${groupId}`, kind: "review", date: draft.reviewDate,
      title: `${draft.hospital || "门诊"}复查`,
      summary: draft.reviewItems || "检查项目待确认",
      details: {
        "医院与科室": draft.hospital,
        "需要检查": draft.reviewItems,
        "提醒安排": "复查前一天 19:00、复查当天 07:30",
        "下次想问医生": draft.question
      },
      images: [], createdAt: time, updatedAt: time
    });
    try {
      await onSave(records);
      await clearPostVisitDraft();
    } finally {
      setSaving(false);
    }
  }

  function validateStep(): boolean {
    const error =
      step === 0 && (!draft.date || !draft.hospital.trim() || !draft.doctor.trim()) ? "请填写就诊日期、医院科室和医生；记不清可直接写“记不清”。" :
      step === 1 && !draft.advice.trim() ? "请记录医生主要意见；记不清可选择下方快捷项。" :
      step === 2 && !draft.diagnosis.trim() ? "请明确填写有无诊断或身体变化。" :
      step === 3 && !draft.medication.trim() ? "请明确填写用药有无变化。" :
      step === 4 && !draft.reviewStatus ? "请选择医生是否安排了下次复查。" :
      step === 4 && draft.reviewStatus === "scheduled" && (!draft.reviewDate || !draft.reviewItems.trim()) ? "已安排复查时，需要填写日期和检查项目。" :
      step === 4 && !draft.question.trim() ? "请填写下次想问医生的问题；没有可以填写“暂时没有”。" : "";
    setValidation(error);
    return !error;
  }

  function next() {
    if (!validateStep()) return;
    if (step < 4) setStep(current => current + 1);
    else void finish();
  }

  return (
    <div className="sheet-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="editor-sheet postvisit-sheet">
        <div className="handle" />
        <header><div><small>就诊后整理 · {step + 1} / 5</small><h2>{postVisitSteps[step][0]}</h2></div><button onClick={onClose}>×</button></header>
        <div className="wizard-progress"><i style={{ width: `${(step + 1) * 20}%` }} /></div>
        {restored && <div className="draft-restored">已恢复上次未完成的整理草稿</div>}
        <p className="wizard-help">{postVisitSteps[step][1]}</p>
        {step === 0 && <>
          <div className="field-grid"><label>就诊日期<input type="date" value={draft.date} onChange={event => update("date", event.target.value)} /></label><label>医生<input value={draft.doctor} onChange={event => update("doctor", event.target.value)} placeholder="例如：张医生" /></label></div>
          <label>医院与科室<input value={draft.hospital} onChange={event => update("hospital", event.target.value)} placeholder="例如：第一人民医院 · 消化内科" /></label>
          <div className="native-upload"><label><b>拍照</b><span>病历、处方或检查单</span><input type="file" accept="image/*" capture="environment" onChange={event => void pickImages(event.target.files)} /></label><label><b>相册</b><span>最多保存 8 张</span><input type="file" accept="image/*" multiple onChange={event => void pickImages(event.target.files)} /></label></div>
          {draft.images.length > 0 && <div className="selected-images">已选择 {draft.images.length} 张原始资料</div>}
        </>}
        {step === 1 && <><label>医生主要意见<textarea value={draft.advice} onChange={event => update("advice", event.target.value)} placeholder="例如：目前指标总体稳定，继续当前方案" /></label><div className="quick-options"><button onClick={() => update("advice", "医生建议继续当前方案，暂不调整。")}>继续当前方案</button><button onClick={() => update("advice", "记不清具体意见，下次需要向医生确认。")}>记不清</button></div></>}
        {step === 2 && <><label>诊断与身体变化<textarea value={draft.diagnosis} onChange={event => update("diagnosis", event.target.value)} placeholder="例如：诊断无变化；近期睡眠不太好" /></label><div className="quick-options"><button onClick={() => update("diagnosis", "诊断和身体状况没有明确变化。")}>没有变化</button><button onClick={() => update("diagnosis", "记不清是否有变化，下次需要向医生确认。")}>记不清</button></div></>}
        {step === 3 && <><label>本次用药变化<textarea value={draft.medication} onChange={event => update("medication", event.target.value)} placeholder="例如：甲泼尼龙调整为……；其他药物不变" /></label><div className="quick-options"><button onClick={() => update("medication", "医生未调整当前用药方案。")}>没有变化</button><button onClick={() => update("medication", "记不清具体用药调整，需要根据处方或向医生确认。")}>记不清</button></div><div className="safety-note">记录不会直接修改服药提醒。保存后请在“当前用药方案”中核对并确认。</div></>}
        {step === 4 && <>
          <div className="review-status"><button className={draft.reviewStatus === "scheduled" ? "active" : ""} onClick={() => update("reviewStatus", "scheduled")}>已安排复查</button><button className={draft.reviewStatus === "not-scheduled" ? "active" : ""} onClick={() => update("reviewStatus", "not-scheduled")}>医生未安排</button><button className={draft.reviewStatus === "uncertain" ? "active" : ""} onClick={() => update("reviewStatus", "uncertain")}>记不清</button></div>
          {draft.reviewStatus === "scheduled" && <><label>下次复查日期<input type="date" value={draft.reviewDate} onChange={event => update("reviewDate", event.target.value)} /></label>
          <label>需要检查的项目<textarea value={draft.reviewItems} onChange={event => update("reviewItems", event.target.value)} placeholder="例如：肝功能、血脂、空腹血糖" /></label></>}
          <label>下次想问医生<input value={draft.question} onChange={event => update("question", event.target.value)} /></label>
        </>}
        {validation && <div className="validation-error">{validation}</div>}
        <div className="wizard-actions">
          <button disabled={step === 0 || saving} onClick={() => setStep(current => current - 1)}>上一步</button>
          <button className="save-button" disabled={saving || !hydrated} onClick={next}>{saving ? "正在保存…" : step === 4 ? "完成整理" : "保存并继续"}</button>
        </div>
      </section>
    </div>
  );
}

function RecordDetail({ record, onClose, onDelete }: { record: HealthRecord; onClose: () => void; onDelete: () => void }) {
  return (
    <div className="sheet-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="editor-sheet record-detail-sheet">
        <div className="handle" />
        <header><div><small>{kindMeta[record.kind].label}详情 · {record.date}</small><h2>{record.title}</h2></div><button onClick={onClose}>×</button></header>
        <p className="detail-lead">{record.summary}</p>
        <dl className="detail-list">
          {Object.entries(record.details).filter(([, value]) => value).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
        </dl>
        {record.images.length > 0 && <><h3 className="gallery-title">原始报告 · {record.images.length} 张</h3><div className="record-gallery">
          {record.images.map((image, index) => <button key={index} onClick={() => window.open(image, "_blank")}><img src={image} alt={`报告第 ${index + 1} 张`} /></button>)}
        </div></>}
        <button className="danger-button" onClick={onDelete}>删除这条记录</button>
      </section>
    </div>
  );
}

function RecordEditor({ onClose, onSave }: { onClose: () => void; onSave: (records: HealthRecord[]) => Promise<void> }) {
  const [kind, setKind] = useState<HealthRecordKind>("visit");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [hospital, setHospital] = useState("");
  const [doctor, setDoctor] = useState("");
  const [advice, setAdvice] = useState("");
  const [nextReview, setNextReview] = useState("");
  const [reviewItems, setReviewItems] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [savingImages, setSavingImages] = useState(false);

  async function pickImages(files: FileList | null) {
    if (!files?.length) return;
    setSavingImages(true);
    try {
      const values = await Promise.all([...files].map(compressImage));
      setImages(current => [...current, ...values].slice(0, 8));
    } finally {
      setSavingImages(false);
    }
  }

  function submit() {
    const time = new Date().toISOString();
    const id = crypto.randomUUID();
    const baseRecord: HealthRecord = {
      id, kind, date,
      title: title.trim() || `${kindMeta[kind].label}记录`,
      summary: summary.trim() || "已完成记录",
      details: {
        "医院与科室": hospital.trim(),
        "医生": doctor.trim(),
        "医生主要意见或备注": advice.trim(),
        "需要检查": kind === "review" ? reviewItems.trim() : "",
        "下一次复查": kind !== "review" ? nextReview : ""
      },
      images, createdAt: time, updatedAt: time
    };
    const records = [baseRecord];
    if (kind !== "review" && nextReview) records.push({
      id: `${id}-review`,
      kind: "review",
      date: nextReview,
      title: `${hospital.trim() || title.trim() || "门诊"}复查`,
      summary: reviewItems.trim() || "检查项目待确认",
      details: {
        "医院与科室": hospital.trim(),
        "需要检查": reviewItems.trim(),
        "关联记录": baseRecord.title,
        "提醒安排": "复查前一天 19:00、复查当天 07:30"
      },
      images: [],
      createdAt: time,
      updatedAt: time
    });
    void onSave(records);
  }

  return (
    <div className="sheet-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="editor-sheet">
        <div className="handle" />
        <header><div><small>保存后进入健康时间线</small><h2>新增健康记录</h2></div><button onClick={onClose}>×</button></header>
        <label>记录类型<select value={kind} onChange={event => setKind(event.target.value as HealthRecordKind)}>
          {Object.entries(kindMeta).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
        </select></label>
        <div className="field-grid"><label>业务日期<input type="date" value={date} onChange={event => setDate(event.target.value)} /></label><label>医生<input value={doctor} onChange={event => setDoctor(event.target.value)} placeholder="选填" /></label></div>
        <label>标题<input value={title} onChange={event => setTitle(event.target.value)} placeholder="例如：消化内科复诊" /></label>
        <label>一句话摘要<input value={summary} onChange={event => setSummary(event.target.value)} placeholder="例如：继续当前治疗方案" /></label>
        <label>医院与科室<input value={hospital} onChange={event => setHospital(event.target.value)} placeholder="例如：第一人民医院 · 消化内科" /></label>
        <label>医生主要意见或备注<textarea value={advice} onChange={event => setAdvice(event.target.value)} placeholder="记录医生说了什么、诊断或用药变化" /></label>
        {kind === "review" ? <label>需要检查的项目<textarea value={reviewItems} onChange={event => setReviewItems(event.target.value)} placeholder="例如：肝功能、血脂、空腹血糖" /></label> : <>
          <label>下次复查日期<input type="date" value={nextReview} onChange={event => setNextReview(event.target.value)} /></label>
          {nextReview && <label>复查项目<textarea value={reviewItems} onChange={event => setReviewItems(event.target.value)} placeholder="保存后会生成独立复查计划并安排提醒" /></label>}
        </>}
        <div className="native-upload">
          <label><b>拍照</b><span>拍摄纸质报告</span><input type="file" accept="image/*" capture="environment" onChange={event => void pickImages(event.target.files)} /></label>
          <label><b>相册</b><span>最多保存 8 张</span><input type="file" accept="image/*" multiple onChange={event => void pickImages(event.target.files)} /></label>
        </div>
        {(savingImages || images.length > 0) && <div className="selected-images">{savingImages ? "正在压缩图片…" : `已选择 ${images.length} 张图片`}</div>}
        <button className="save-button" disabled={!date || savingImages} onClick={submit}>保存健康记录</button>
      </section>
    </div>
  );
}

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const image = new Image();
      image.onerror = reject;
      image.onload = () => {
        const max = 1280;
        const scale = Math.min(1, max / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", .76));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
