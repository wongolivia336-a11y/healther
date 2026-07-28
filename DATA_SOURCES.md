# Healther 数据来源与收录策略

本文档定义饮食助手和安心科普未来接入后台时的数据来源、置信度和审核边界。

## 1. 食物数据

### 1.1 通用食物

首选 [USDA FoodData Central](https://fdc.nal.usda.gov/)：

- 提供 Food Search 和 Food Details API；
- 可获取能量、蛋白质、脂肪、碳水化合物、膳食纤维、糖、钠等营养素；
- 数据属于公共领域，并以 CC0 1.0 发布；
- 正式后台不得把 API key 放在前端或提交到 GitHub；
- 保存 `fdcId`、数据类型、发布版本和同步时间，方便追溯。

正式数据结构建议：

```json
{
  "id": "food_internal_id",
  "name_zh": "苹果",
  "source": "USDA_FDC",
  "source_id": "fdcId",
  "basis": "per_100_g",
  "nutrients": {
    "energy_kcal": 0,
    "carbohydrate_g": 0,
    "protein_g": 0,
    "fat_g": 0,
    "fiber_g": 0,
    "sugar_g": 0,
    "sodium_mg": 0
  },
  "source_release": "",
  "synced_at": ""
}
```

### 1.2 包装食品

可辅助使用 [Open Food Facts](https://openfoodfacts.github.io/documentation/)：

- 通过条码获取营养标签、配料、过敏原和产品图片；
- 使用 Open Database License，图片和部分内容另有许可要求；
- 数据来自志愿者贡献，官方明确不保证准确、完整或可靠；
- 不能把 Open Food Facts 单独作为医疗相关筛选结论的依据；
- 页面必须展示“包装标签众包数据，请以实物标签为准”。

### 1.3 中国常见食物

正式上线前还需要评估中国疾病预防控制中心或权威《中国食物成分表》的合法数字化授权和可用接口。未经确认授权，不应抓取并复制付费或受版权保护的整套食物成分表。

## 2. 饮食筛选规则

营养数据和疾病建议是两个不同层级：

1. 数据层回答“这个食物通常含有什么”；
2. 规则层回答“为什么需要注意份量”；
3. 展示层用“更适合 / 注意份量 / 谨慎选择”表达。

规则不能仅凭单个营养素自动得出医疗结论。每条规则应保存：

```json
{
  "condition": "diabetes",
  "food_or_category": "example",
  "rating": "portion_attention",
  "plain_language_reason": "",
  "source_url": "",
  "source_organization": "",
  "published_at": "",
  "reviewed_by": "",
  "reviewed_at": "",
  "status": "draft"
}
```

只有 `status = approved` 的规则可以进入正式版。

## 3. 安心科普来源白名单

### 第一层：优先收录

- 国家级政府卫生机构和公共卫生机构；
- 专业医学学会正式指南和患者指南；
- 指南对应的正式期刊版本；
- 医院官方、由专科团队署名并可核验的患者教育内容。

当前重点来源：

- [NIDDK Autoimmune Hepatitis](https://www.niddk.nih.gov/health-information/liver-disease/autoimmune-hepatitis)
- [NIDDK Primary Biliary Cholangitis](https://www.niddk.nih.gov/health-information/liver-disease/primary-biliary-cholangitis/definition-facts)
- [AASLD Primary Biliary Cholangitis Guidance](https://www.aasld.org/practice-guidelines/primary-biliary-cholangitis)
- [EASL 2025 Autoimmune Hepatitis Guidelines](https://easl.eu/news/easl-cpgs-autoimmune-hepatitis-2025/)

### 第二层：辅助理解

- 有编辑审核制度的患者组织；
- 大学或医学中心发布的患者教育；
- 系统评价和同行评议综述。

第二层内容不能覆盖或改写第一层指南结论。

### 不收录

- 自媒体和无署名文章；
- 搜索引擎聚合页；
- 以个案经历推断普遍治疗效果的内容；
- 营销软文、药品推广页；
- 无法确定发布日期、作者或来源的内容；
- 直接建议用户自行停药、换药或改变剂量的内容。

## 4. 抓取与同步流程

不建议“爬全网相关文章”。建议使用来源白名单执行定时同步：

```text
来源白名单
    ↓
检查 robots.txt、许可和页面更新
    ↓
只提取标题、摘要所需段落、发布日期和原文 URL
    ↓
正文解析与去重
    ↓
机器翻译和大白话初稿
    ↓
来源一致性检查
    ↓
人工审核
    ↓
发布到妈妈端
```

不能绕过登录、付费墙或站点访问限制。对于不允许复制全文的来源，只保存元数据、短摘要和原文链接。

## 5. 文章置信度

建议不要展示模糊的 AI “92% 置信度”，而是显示可解释等级：

| 等级 | 条件 | 前端显示 |
| --- | --- | --- |
| A | 政府卫生机构或正式专业指南，且已人工复核 | 权威来源 · 已复核 |
| B | 大学医学中心或患者组织，且与 A 级来源一致 | 可靠科普 · 已复核 |
| C | 新研究或单篇论文，尚未进入指南 | 研究进展 · 不改变当前治疗 |
| D | 来源或结论无法充分核验 | 不发布 |

## 6. 文章后台字段

```json
{
  "title_zh": "",
  "summary_zh": "",
  "what_it_means_now": "",
  "questions_for_doctor": [],
  "source_title": "",
  "source_organization": "",
  "source_url": "",
  "source_language": "en",
  "published_at": "",
  "fetched_at": "",
  "translated_at": "",
  "reviewed_at": "",
  "review_status": "pending",
  "confidence_level": "A",
  "changes_current_treatment": false
}
```

## 7. 当前实现说明

Android 正式工程已接入第一版离线内容包：

- 饮食助手包含 24 种常见食物的保守通用筛选，不提供开放搜索和个体营养处方；
- 安心科普包含 8 篇基于 NIDDK、AASLD 患者资料或指南入口整理的大白话内容；
- 每篇科普保留来源机构、原文链接、来源等级和核对日期；
- 当前仅完成来源一致性核对，尚未经过临床或注册营养专业人员审稿；
- 当前食物条目尚未逐条绑定 FoodData Central 的 `fdcId` 和精确营养值，因此不显示伪精确热量。

下一阶段应为食物条目建立 `fdcId`、中国常见份量映射和审核记录，再启用营养数值展示。爬虫只运行在内容生产端，用来发现白名单来源更新，不在妈妈手机上运行，也不自动发布未经人工核对的内容。
