# Healther 视觉资产系统

本目录是品牌、插画和 SVG 图标的设计源。`mobile-app/public/assets/` 是运行时副本，不应单独修改。

## 目录

```text
assets/
├─ brand/                  品牌标志、启动器前景和规范
├─ icons/
│  ├─ lucide/              通用界面动作图标（ISC）
│  └─ healthicons/         医疗语义图标（CC0）
└─ illustrations/          Healther 专用 2.5D 插画
```

执行以下脚本将设计源同步到正式应用：

```powershell
cd "E:\OneDrive\文档\mum\mobile-app"
.\scripts\sync-assets.ps1
```

Android 一键构建脚本会自动先执行同步。

## 插画母版

所有插画遵守同一视觉语言：

- 现代极简 2.5D 软陶渲染；
- 圆角几何体、哑光陶瓷与柔触塑料材质；
- 柔和漫射日光，只保留轻微接触阴影；
- 主体集中在右侧约 55%，左侧保留界面文案空间；
- 使用轻微俯视的等距视角；
- 主色：`#6F8FDC`、`#8BB0F2`、`#72CDBD`、`#F4F8FF`；
- 珊瑚色只能作为很小的状态点缀；
- 不使用人物、红十字、针头、病弱形象、玻璃高光、霓虹或夸张医疗科技意象；
- 不在图片中生成可读文字、Logo 或水印。

通用生成提示母版：

```text
Modern minimal 2.5D mobile health app hero illustration.
Premium soft clay render, matte rounded geometric forms.
Warm off-white seamless studio background with a subtle cool tint.
Objects grouped in the right 55 percent, generous empty space on the left.
Soft diffused daylight and delicate contact shadows.
Palette: #6F8FDC, #8BB0F2, #72CDBD, #F4F8FF and warm white.
No people, no red cross, no readable text, no logo, no watermark.
Avoid photorealism, glass, metal shine, neon, clutter and dramatic shadows.
```

## 插画目录

| 语义名称 | 文件 | 状态 |
| --- | --- | --- |
| medication | `medication-hero-v2.png` | 已使用 |
| foodGuide | `food-guide-v2.png` | 已使用 |
| learningPath | `learning-path-v2.png` | 已使用 |
| recordsOrganizer | `records-organizer-v1.png` | 已使用 |
| privateBackup | `private-backup-v1.png` | 已使用 |
| labTrends | `lab-trends-v1.png` | 为指标趋势预留 |
| visitAudio | `visit-audio-v1.png` | 为就诊录音预留 |
| trustedUpdates | `trusted-updates-v1.png` | 为内容更新预留 |

正式应用统一从 `mobile-app/src/visualAssets.ts` 引用，不在组件中散写文件路径。

## 图标使用规则

- 通用动作、导航、文件和状态使用 Lucide；
- 器官、药物和医疗概念使用 Health Icons；
- 默认线性图标视觉尺寸为 18–20px；
- 紧凑标签可使用 12–16px，主操作入口可使用 22–24px；
- 图标继承文字颜色，不在 SVG 文件中写业务颜色；
- 同一按钮不混用实心和线性图标；
- 必须提供按钮文字或 `aria-label`，不能只依赖图形猜测含义。

正式应用使用 `mobile-app/src/Icon.tsx` 的语义名称。例如：

```tsx
<Icon name="camera" />
<Icon name="trend" />
<Icon name="privacy" />
```

当前语义覆盖导航、返回、增删改、报告、相册、上传下载、录音播放、趋势、备份、外链、警告和成功状态。

## 版本管理

- 新插画使用 `<semantic-name>-v1.png`；
- 视觉内容发生明显变化时新增 `v2`，不要覆盖旧版；
- 仅压缩体积、不改变视觉时保持文件名，并在提交说明中记录；
- 组件只通过 `visualAssets.ts` 切换版本，便于回退；
- 新增 Lucide 图标保留上游原始文件名；
- 每次新增或替换资产必须同步、运行正式构建并检查 APK 体积；
- Lucide 和 Health Icons 的许可证文件必须随发布资产一起保留。
