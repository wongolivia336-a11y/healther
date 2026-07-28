# Healther Mobile

![Healther Mobile 现代简约 2.5D 预览](mobile-preview-v2.png)

Healther 的正式 React + Capacitor 安卓工程。根目录的静态页面继续作为设计原型，本目录用于真实功能开发。

正式品牌图标已经接入网页 favicon、Android Adaptive Icon、传统 launcher 图标、圆形图标、通知栏小图标和启动画面。源文件与规范位于 [`../assets/brand/`](../assets/brand/)。

## 第一里程碑

当前已经实现可靠用药提醒、健康档案和个人资料管理。用药闭环为：

```text
新增或编辑药物
    ↓
设置时间、重复间隔、次数和稍后时长
    ↓
保存到本地数据库
    ↓
安排未来 14 天安卓本地通知
    ↓
已服 / 跳过 / 稍后
    ↓
记录用药事件
```

健康档案支持就诊、检查、用药和复查分类 Tab；新增记录后按业务日期排序，点击时间线卡片进入二级详情。检查报告可以直接拍照或从相册选择，压缩后保存在本机并支持查看原图。

正式端“就诊后整理”使用五步引导填写就诊信息、医生意见、诊断变化、用药变化与复查计划。完成后会生成关联的就诊、用药变化和复查记录；复查在 Android 上安排前一天 19:00 和当天 07:30 两次本地提醒。记录的用药变化不会自动修改服药方案，需要用户再次核对确认。

整理过程中每次修改都会自动保存草稿；退出或被系统中断后重新进入，会恢复上次内容。每一步必须明确填写，或者选择“没有变化 / 医生未安排 / 记不清”，避免生成内容空白但看似完整的就诊记录。

通用新增记录与五步整理共用同一套档案服务：填写下次复查日期时，会生成独立复查记录并安排提醒；删除复查记录时同步取消尚未触发的通知。

点击复查系统通知后，应用会切换到“健康档案”并自动打开对应复查详情；记录已被删除时会给出明确提示。

“我的”支持自定义基础疾病、手术史、过敏史、常用医院、医生和紧急联系人。

| 健康档案 | 我的 |
| --- | --- |
| ![正式端健康档案](records-mobile-preview.png) | ![正式端我的](mine-mobile-preview.png) |

## 已实现

- React + TypeScript + Vite 正式工程；
- Capacitor Android 原生工程；
- 浏览器预览使用本地存储；
- Android 使用 SQLite；
- 药物与用药事件数据模型；
- 每种药单独设置：
  - 首次提醒时间；
  - 重复间隔；
  - 最大重复次数；
  - 默认稍后时长；
  - 类别、剂量、备注和启用状态；
- 通知操作：已服、跳过、稍后；
- 未来 14 天滚动通知窗口；
- 点击已服或跳过时仅取消当天剩余提醒，不删除未来日期；
- 稍后会重新安排当天的提醒序列；
- Android 通知频道、通知权限、精确闹钟设置检查；
- 重启恢复由 Capacitor Local Notifications 插件接收系统启动事件；
- 禁止 Android 系统自动云备份本地健康数据库。
- 健康档案分类筛选、时间线与记录详情；
- 就诊、检查报告、用药调整和复查记录的新增与删除；
- 报告拍照、相册多选、本地压缩和原图查看；
- Android 报告图片写入 App 私有文件目录，SQLite 仅保存相对引用；旧版内嵌图片在打开健康档案时自动迁移；
- “我的”健康资料编辑与本地持久化。
- 使用用户设置的密码生成 AES-GCM 加密 `.healther` 备份包，包含药物、事件、档案、个人资料和报告图片；
- Android 通过系统分享保存或发送备份文件，并支持从文件选择器恢复；恢复前明确确认覆盖本机数据。
- 饮食助手离线首版：按餐次和食物类别浏览 24 种常见食物，展示“更适合 / 注意份量 / 谨慎选择”、通用份量、多疾病理由和替代选择；
- 安心科普离线首版：8 篇来自 NIDDK、AASLD 等权威来源的中文大白话内容，支持主题筛选、来源等级、原文链接和复诊问题；
- 饮食与科普均不提供诊断、个体处方或自动用药调整，首版内容完成来源核对但尚未经过临床专业人员审稿。
- 可扩展视觉资产系统：8 个统一风格的 2.5D 插画场景、35 个 Lucide 通用 SVG、4 个 Health Icons 医疗 SVG，以及集中式 `Icon` / `visualAssets` 语义目录；
- 资产同步脚本会在 Android 构建前自动将根目录设计源复制到正式应用，避免版本遗漏。

## 数据存储

### Android

使用 `@capacitor-community/sqlite`：

- `medications`：保存药物方案 JSON；
- `medication_events`：保存每天的处理结果。
- `health_records`：保存就诊、报告、用药调整、复查及报告图片；
- `user_profile`：保存用户自定义的基础疾病、手术史和常用就医资料。

### 浏览器

使用 `localStorage` 作为开发预览适配层。浏览器不会触发真实安卓系统通知。

## 通知可靠性

项目使用 `@capacitor/local-notifications`：

- Android 13+ 请求通知权限；
- Android 12+ 检查精确闹钟设置；
- `AndroidManifest.xml` 声明 `SCHEDULE_EXACT_ALARM`；
- 使用 `allowWhileIdle` 尽量在 Doze 状态下触发；
- 插件负责接收设备重启广播并恢复本地通知。

OPPO 真机仍需单独验证：

- 通知权限；
- 精确闹钟权限；
- 后台运行和电池优化；
- 自启动或关联启动设置；
- 重启后恢复；
- 锁屏通知操作。

## 本地开发

```powershell
cd "E:\OneDrive\文档\mum\mobile-app"
pnpm install
pnpm run typecheck
pnpm run build
pnpm run dev
```

浏览器预览：

```text
http://127.0.0.1:3001/
```

同步 Android：

```powershell
pnpm run build
npx cap sync android
```

## APK 构建环境

当前 Windows 开发机的 Android 工具链全部安装在 `E:\AndroidDev`，避免占用 C 盘：

- Eclipse Temurin JDK 21；
- Android SDK Command-line Tools；
- Android SDK Platform 36；
- Android Build Tools 35/36；
- Android Platform Tools；
- Gradle 与 npm 缓存。

不要把 `JAVA_HOME`、`ANDROID_HOME` 或 Gradle 缓存改回 C 盘。仓库提供了一键构建脚本，会临时设置全部环境变量：

```powershell
cd "E:\OneDrive\文档\mum\mobile-app"
.\scripts\build-android-e.ps1
```

构建完成后，可安装的调试包会复制到：

```text
E:\AndroidDev\output\Healther-v0.1.0-debug.apk
```

首个已验证安装包：

- 包名：`com.wongolivia.healther`
- 版本：`1.0`（versionCode 1）
- minSdk：24
- targetSdk：36
- 签名：Android debug certificate，APK Signature Scheme v2
- SHA-256：`A3AA68630276D936906522BC1D383838B8AEAB1CFFAFF009F0C1BE0149B72491`

调试签名仅用于家庭真机测试。对外正式分发前需要创建并离线保存正式签名密钥，生成 release APK 或 AAB。

## 下一步

1. 在 OPPO 真机安装首个 APK；
2. 验证通知、精确闹钟、后台运行、自启动和电池优化权限；
3. 验证服药处理、重启恢复、报告拍照和加密备份；
4. 根据真机走查结果修复问题；
5. 创建正式签名并生成家庭分发版 release APK；
6. 接入公共食物数据及权威科普内容后台。
