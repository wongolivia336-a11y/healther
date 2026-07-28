import { useEffect, useState } from "react";
import type { UserProfile } from "./types";
import { getUserProfile, saveUserProfile } from "./data/healthRepository";
import { exportEncryptedBackup, restoreEncryptedBackup } from "./services/backupService";
import { illustrations } from "./visualAssets";
import { Icon } from "./Icon";
import { checkForContentUpdates } from "./services/contentUpdateService";
import { useContentSnapshot } from "./hooks/useContentSnapshot";

export function Profile({ medicationCount, announce, onOpenTreatment }: { medicationCount: number; announce: (message: string) => void; onOpenTreatment: () => void }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);
  const [contentOpen, setContentOpen] = useState(false);
  const content = useContentSnapshot();
  useEffect(() => { void getUserProfile().then(setProfile); }, []);
  if (!profile) return <div className="empty-panel">正在加载本地资料…</div>;

  async function save(next: UserProfile) {
    await saveUserProfile(next);
    setProfile(next);
    setEditing(false);
    announce("健康资料已保存到本机");
  }

  return (
    <>
      <header className="topbar"><div><small>个人资料与本地数据</small><h1>我的</h1></div></header>
      <article className="mobile-profile-card">
        <span>{profile.name.slice(0, 1)}</span><div><h2>{profile.name}的健康助手</h2><p>资料只保存在这台手机</p></div><b>本地模式</b>
      </article>
      <ProfileSection title="健康资料">
        <button onClick={() => setEditing(true)}><span>基础疾病与手术史</span><small>{profile.conditions.length} 项 ›</small></button>
        <button onClick={() => setEditing(true)}><span>过敏与紧急联系人</span><small>编辑 ›</small></button>
        <button onClick={() => setEditing(true)}><span>常用医院和医生</span><small>{profile.doctor || "未填写"} ›</small></button>
      </ProfileSection>
      <ProfileSection title="当前治疗">
        <button onClick={onOpenTreatment}><span>当前用药方案</span><small>{medicationCount} 种药物 ›</small></button>
        <button onClick={onOpenTreatment}><span>用药与复查提醒</span><small>管理 ›</small></button>
      </ProfileSection>
      <ProfileSection title="数据与应用">
        <button onClick={() => setContentOpen(true)}><span>饮食与科普内容更新</span><small>v{content.version} ›</small></button>
        <button onClick={() => setBackupOpen(true)}><span>备份、恢复与换机</span><small>加密备份 ›</small></button>
        <button onClick={() => announce("所有健康数据仅保存在本机")}><span>隐私与数据说明</span><small>›</small></button>
        <button onClick={() => announce("当前使用正常字体")}><span>字体大小</span><small>正常 ›</small></button>
      </ProfileSection>
      {editing && <ProfileEditor profile={profile} onClose={() => setEditing(false)} onSave={save} />}
      {backupOpen && <BackupManager onClose={() => setBackupOpen(false)} announce={announce} />}
      {contentOpen && <ContentManager onClose={() => setContentOpen(false)} announce={announce} />}
    </>
  );
}

function ContentManager({ onClose, announce }: { onClose: () => void; announce: (message: string) => void }) {
  const content = useContentSnapshot();
  const [busy, setBusy] = useState(false);
  const published = new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "short", day: "numeric" }).format(new Date(content.publishedAt));
  const checked = content.checkedAt
    ? new Intl.DateTimeFormat("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(content.checkedAt))
    : "尚未检查";

  async function checkNow() {
    setBusy(true);
    const result = await checkForContentUpdates(true);
    setBusy(false);
    if (result.status === "updated") announce(`内容已更新到 v${result.snapshot.version}`);
    else if (result.status === "current") announce("当前已经是最新审核内容");
    else announce("暂时无法联网，继续使用本机内容");
  }

  return (
    <div className="sheet-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="editor-sheet content-sheet">
        <div className="handle" />
        <header><div><small>只下载公开内容 · 不上传健康资料</small><h2>内容更新</h2></div><button onClick={onClose}>×</button></header>
        <div className="content-status-hero">
          <span><Icon name="privacy" size={22} /></span>
          <div><b>已审核内容 v{content.version}</b><p>{content.source === "downloaded" ? "已同步并保存在本机" : "正在使用安装包内置内容"}</p></div>
        </div>
        <dl className="content-stats">
          <div><dt>食物条目</dt><dd>{content.foods.length}</dd></div>
          <div><dt>科普文章</dt><dd>{content.articles.length}</dd></div>
          <div><dt>内容发布日期</dt><dd>{published}</dd></div>
          <div><dt>上次检查</dt><dd>{checked}</dd></div>
        </dl>
        <div className="content-boundary"><b>更新安全边界</b><p>新内容必须先在 GitHub 完成人工审核。同步失败不会删除旧内容，也不会改变用药、报告或提醒。</p></div>
        <button className="save-button icon-button" disabled={busy} onClick={() => void checkNow()}>
          <Icon name="refresh" size={17} />{busy ? "正在检查…" : "立即检查更新"}
        </button>
      </section>
    </div>
  );
}

function BackupManager({ onClose, announce }: { onClose: () => void; announce: (message: string) => void }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const validPassword = password.length >= 6;

  async function exportBackup() {
    if (!validPassword || password !== confirmation) {
      announce("请设置至少 6 位且两次一致的备份密码");
      return;
    }
    setBusy(true);
    try {
      await exportEncryptedBackup(password);
      announce("加密备份已生成，请妥善保存密码");
    } catch {
      announce("备份生成失败，请检查存储或分享权限");
    } finally {
      setBusy(false);
    }
  }

  async function restoreBackup() {
    if (!file || !validPassword) {
      announce("请选择备份文件并输入密码");
      return;
    }
    if (!window.confirm("恢复会覆盖这台手机当前的药物、记录、资料和报告图片。确定继续吗？")) return;
    setBusy(true);
    try {
      await restoreEncryptedBackup(file, password);
      announce("恢复完成，正在重新载入本地资料");
      window.setTimeout(() => location.reload(), 900);
    } catch {
      announce("恢复失败：密码错误、文件损坏或格式不支持");
      setBusy(false);
    }
  }

  return (
    <div className="sheet-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="editor-sheet backup-sheet">
        <div className="handle" />
        <header><div><small>本地加密 · 不上传服务器</small><h2>备份、恢复与换机</h2></div><button onClick={onClose}>×</button></header>
        <img className="backup-illustration" src={illustrations.privateBackup} alt="" />
        <div className="backup-warning">备份包含健康资料和报告图片。密码无法找回，请与备份文件分开妥善保存。</div>
        <h3>导出加密备份</h3>
        <label>设置备份密码（至少 6 位）<input type="password" value={password} onChange={event => setPassword(event.target.value)} /></label>
        <label>再次输入密码<input type="password" value={confirmation} onChange={event => setConfirmation(event.target.value)} /></label>
        <button className="save-button" disabled={busy || !validPassword || password !== confirmation} onClick={() => void exportBackup()}>{busy ? "正在处理…" : "生成并保存备份文件"}</button>
        <div className="backup-divider"><span>或</span></div>
        <h3>从备份恢复</h3>
        <label className="backup-file"><b>{file ? file.name : "选择 .healther 备份文件"}</b><input type="file" accept=".healther,application/json" onChange={event => setFile(event.target.files?.[0] ?? null)} /></label>
        <p className="backup-note">在上方“备份密码”中输入该文件的密码，然后恢复。当前本机数据会被覆盖。</p>
        <button className="restore-button" disabled={busy || !file || !validPassword} onClick={() => void restoreBackup()}>确认恢复并覆盖本机数据</button>
      </section>
    </div>
  );
}

function ProfileSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="profile-section"><h2>{title}</h2><div>{children}</div></section>;
}

function ProfileEditor({ profile, onClose, onSave }: { profile: UserProfile; onClose: () => void; onSave: (profile: UserProfile) => Promise<void> }) {
  const [draft, setDraft] = useState(profile);
  const update = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => setDraft(current => ({ ...current, [key]: value }));
  return (
    <div className="sheet-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="editor-sheet">
        <div className="handle" />
        <header><div><small>可随时修改</small><h2>编辑健康资料</h2></div><button onClick={onClose}>×</button></header>
        <label>称呼<input value={draft.name} onChange={event => update("name", event.target.value)} /></label>
        <label>基础疾病（每行一项）<textarea value={draft.conditions.join("\n")} onChange={event => update("conditions", event.target.value.split("\n").filter(Boolean))} /></label>
        <label>手术史（每行一项）<textarea value={draft.surgeries.join("\n")} onChange={event => update("surgeries", event.target.value.split("\n").filter(Boolean))} /></label>
        <label>过敏史<input value={draft.allergies} onChange={event => update("allergies", event.target.value)} /></label>
        <label>常用医院<input value={draft.hospitals} onChange={event => update("hospitals", event.target.value)} /></label>
        <label>常用医生<input value={draft.doctor} onChange={event => update("doctor", event.target.value)} /></label>
        <label>紧急联系人<input value={draft.emergencyContact} onChange={event => update("emergencyContact", event.target.value)} /></label>
        <button className="save-button" disabled={!draft.name.trim()} onClick={() => void onSave({ ...draft, updatedAt: new Date().toISOString() })}>保存健康资料</button>
      </section>
    </div>
  );
}
