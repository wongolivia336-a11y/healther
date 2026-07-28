import { useEffect, useState } from "react";
import type { UserProfile } from "./types";
import { getUserProfile, saveUserProfile } from "./data/healthRepository";

export function Profile({ medicationCount, announce, onOpenTreatment }: { medicationCount: number; announce: (message: string) => void; onOpenTreatment: () => void }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
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
        <button onClick={() => announce("备份与换机功能将在下一阶段接入")}><span>备份、恢复与换机</span><small>›</small></button>
        <button onClick={() => announce("所有健康数据仅保存在本机")}><span>隐私与数据说明</span><small>›</small></button>
        <button onClick={() => announce("当前使用正常字体")}><span>字体大小</span><small>正常 ›</small></button>
      </ProfileSection>
      {editing && <ProfileEditor profile={profile} onClose={() => setEditing(false)} onSave={save} />}
    </>
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
