import { useEffect, useMemo, useState } from "react";
import type { HealthRecord, HealthRecordKind } from "./types";
import { deleteHealthRecord, listHealthRecords, saveHealthRecord } from "./data/healthRepository";

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

  useEffect(() => { void listHealthRecords().then(setRecords); }, []);
  const visible = useMemo(
    () => records.filter(item => tab === "all" || item.kind === tab).sort((a, b) => b.date.localeCompare(a.date)),
    [records, tab]
  );

  async function save(record: HealthRecord) {
    await saveHealthRecord(record);
    setRecords(current => [...current.filter(item => item.id !== record.id), record]);
    setAdding(false);
    announce("健康记录已保存到本机");
  }

  async function remove(record: HealthRecord) {
    if (!window.confirm(`确定删除“${record.title}”吗？原始图片也会从本机记录中移除。`)) return;
    await deleteHealthRecord(record.id);
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
    </>
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

function RecordEditor({ onClose, onSave }: { onClose: () => void; onSave: (record: HealthRecord) => Promise<void> }) {
  const [kind, setKind] = useState<HealthRecordKind>("visit");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [hospital, setHospital] = useState("");
  const [doctor, setDoctor] = useState("");
  const [advice, setAdvice] = useState("");
  const [nextReview, setNextReview] = useState("");
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
    void onSave({
      id: crypto.randomUUID(), kind, date,
      title: title.trim() || `${kindMeta[kind].label}记录`,
      summary: summary.trim() || "已完成记录",
      details: {
        "医院与科室": hospital.trim(),
        "医生": doctor.trim(),
        "医生主要意见或备注": advice.trim(),
        "下一次复查": nextReview
      },
      images, createdAt: time, updatedAt: time
    });
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
        <label>下次复查日期<input type="date" value={nextReview} onChange={event => setNextReview(event.target.value)} /></label>
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
