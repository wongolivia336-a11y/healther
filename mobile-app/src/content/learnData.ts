export type LearnTopic = "认识疾病" | "治疗与复查" | "饮食与生活" | "研究进展";
export type ConfidenceLevel = "A" | "B" | "C";

export type LearnArticle = {
  id: string;
  topic: LearnTopic;
  title: string;
  takeaway: string;
  explanation: string[];
  now: string;
  doctorQuestions: string[];
  source: {
    organization: string;
    title: string;
    url: string;
    reviewedAt: string;
    level: ConfidenceLevel;
  };
};

export const learnTopics: ("全部" | LearnTopic)[] = ["全部", "认识疾病", "治疗与复查", "饮食与生活", "研究进展"];

export const confidenceMeta: Record<ConfidenceLevel, string> = {
  A: "权威来源 · 来源已核对",
  B: "可靠科普 · 来源已核对",
  C: "研究进展 · 不改变当前治疗"
};

export const learnArticles: LearnArticle[] = [
  {
    id: "aih-chronic",
    topic: "认识疾病",
    title: "自免肝是一种可以长期管理的慢性病",
    takeaway: "它需要规律治疗和复查，但“慢性”不等于每天都在恶化。",
    explanation: [
      "自身免疫性肝炎是免疫系统错误攻击肝脏、引起炎症的疾病。有些人会疲劳、关节不适，也有不少人没有明显症状，是在血液检查中发现异常。",
      "医生会结合病史、血液检查、影像检查，有时还包括肝穿刺来判断；没有一项单独的检查能够说明全部情况。",
      "规范治疗可以减轻炎症并降低进一步肝损伤的风险。复查的意义是确认治疗是否有效、有没有副作用，而不是每次都在寻找坏消息。"
    ],
    now: "继续按医生方案服药和复查，不因为一次感觉良好或一次指标波动自行停药。",
    doctorQuestions: ["目前判断治疗有效主要看哪些指标？", "下次复查需要检查 ALT、AST、IgG 或哪些项目？"],
    source: {
      organization: "NIDDK / NIH",
      title: "Autoimmune Hepatitis",
      url: "https://www.niddk.nih.gov/health-information/liver-disease/autoimmune-hepatitis",
      reviewedAt: "2026-07-28",
      level: "A"
    }
  },
  {
    id: "aih-treatment",
    topic: "治疗与复查",
    title: "为什么自免肝治疗不能自己突然停药",
    takeaway: "感觉好转不代表炎症已经稳定，减量和停药都需要医生根据复查结果安排。",
    explanation: [
      "自免肝常使用糖皮质激素或其他免疫抑制药物，目的是降低免疫系统对肝脏的攻击。",
      "医生通常会根据肝酶、IgG、症状和副作用调整剂量，并寻找能够维持效果的较低剂量。",
      "部分人在停药后会复发，肝损伤可能重新出现。因此，漏服、减量、停药或换药都应先联系医生。"
    ],
    now: "APP 里的用药记录只负责提醒和回顾，不能替代医生调整甲泼尼龙等药物剂量。",
    doctorQuestions: ["这次剂量调整的依据是什么？", "如果漏服一次应该如何处理？", "出现哪些副作用需要尽快联系医生？"],
    source: {
      organization: "NIDDK / NIH",
      title: "Treatment for Autoimmune Hepatitis",
      url: "https://www.niddk.nih.gov/health-information/liver-disease/autoimmune-hepatitis/treatment",
      reviewedAt: "2026-07-28",
      level: "A"
    }
  },
  {
    id: "pbc-basics",
    topic: "认识疾病",
    title: "原发性胆汁性胆管炎（PBC）是什么",
    takeaway: "PBC 主要影响肝内小胆管，规范随访是为了观察胆汁淤积和肝脏状态。",
    explanation: [
      "PBC 是一种慢性胆管疾病，肝内小胆管受到损伤后，胆汁排出会受到影响。",
      "一些人会有疲劳、皮肤瘙痒或口眼干，也有人在常规验血时才发现相关异常。",
      "医生会结合胆汁淤积相关指标、抗体、影像等信息判断，并排除结石或其他胆道问题。"
    ],
    now: "把每次 ALP、GGT、胆红素等结果和用药变化保存好，复诊时比反复搜索严重病例更有帮助。",
    doctorQuestions: ["目前哪些指标最能反映 PBC 的治疗反应？", "是否需要检查骨密度或脂溶性维生素？"],
    source: {
      organization: "NIDDK / NIH",
      title: "Primary Biliary Cholangitis",
      url: "https://www.niddk.nih.gov/health-information/liver-disease/primary-biliary-cholangitis",
      reviewedAt: "2026-07-28",
      level: "A"
    }
  },
  {
    id: "ursodiol",
    topic: "治疗与复查",
    title: "优思弗在 PBC 治疗中起什么作用",
    takeaway: "熊去氧胆酸可以减缓部分患者的肝损伤进展，但需要规律服用并通过复查评价反应。",
    explanation: [
      "熊去氧胆酸也常称为 ursodiol，是 PBC 常用治疗药物。它不是立即消除所有症状的药，也不表示吃了以后就不需要复查。",
      "医生会结合血液指标和随访时间判断治疗反应。不同人的反应并不完全相同。",
      "如果效果不充分，是否增加或更换治疗必须由肝病医生判断。"
    ],
    now: "按处方记录和服用优思弗；APP 不根据单次化验结果自动改变剂量。",
    doctorQuestions: ["目前优思弗的剂量和体重是否匹配？", "计划在服药多久后评估治疗反应？"],
    source: {
      organization: "NIDDK / NIH",
      title: "Treatment of Primary Biliary Cholangitis",
      url: "https://www.niddk.nih.gov/health-information/liver-disease/primary-biliary-cholangitis/treatment",
      reviewedAt: "2026-07-28",
      level: "A"
    }
  },
  {
    id: "steroid-bone",
    topic: "饮食与生活",
    title: "使用激素时，为什么要关注骨骼健康",
    takeaway: "长期使用糖皮质激素可能影响骨骼，绝不是简单“多喝牛奶”就能完全解决。",
    explanation: [
      "医生可能会根据激素剂量、使用时间、更年期状态和既往情况评估骨质疏松风险。",
      "均衡饮食、适合自己的负重活动、钙和维生素 D 状态都可能被纳入管理，但补充剂不是越多越好。",
      "钙剂还可能需要与优甲乐错开，因此补充方式和时间要让医生或药师一起确认。"
    ],
    now: "不要自行大量购买钙片；下次复诊可主动询问是否需要骨密度和维生素 D 评估。",
    doctorQuestions: ["目前激素方案是否需要骨密度检查？", "钙或维生素 D 是否需要补充，怎样与优甲乐错开？"],
    source: {
      organization: "NIDDK / NIH",
      title: "Eating, Diet, & Nutrition for Autoimmune Hepatitis",
      url: "https://www.niddk.nih.gov/health-information/liver-disease/autoimmune-hepatitis/eating-diet-nutrition",
      reviewedAt: "2026-07-28",
      level: "A"
    }
  },
  {
    id: "balanced-diet",
    topic: "饮食与生活",
    title: "肝病饮食的重点不是寻找一种“保肝神奇食物”",
    takeaway: "规律、均衡、少酒精和不乱用保健品，通常比追逐单一食物更重要。",
    explanation: [
      "权威患者资料建议自免肝患者保持健康均衡的饮食，并没有列出一种能够替代治疗的食物。",
      "网络上的草药、偏方和保健品不一定安全；天然不等于对肝脏没有风险。",
      "如果同时管理血糖和血脂，最实用的做法是控制主食和甜饮份量、增加蔬菜、选择较少油脂的蛋白质。"
    ],
    now: "饮食助手只提供保守筛选。对酒精、草药和补充剂拿不准时，记录产品名称并询问医生。",
    doctorQuestions: ["目前是否有需要完全避免的酒精、草药或保健品？", "我的体重和营养状态是否需要营养科评估？"],
    source: {
      organization: "NIDDK / NIH",
      title: "Eating, Diet, & Nutrition for Autoimmune Hepatitis",
      url: "https://www.niddk.nih.gov/health-information/liver-disease/autoimmune-hepatitis/eating-diet-nutrition",
      reviewedAt: "2026-07-28",
      level: "A"
    }
  },
  {
    id: "lab-fluctuation",
    topic: "治疗与复查",
    title: "一次化验异常，不等于所有事情突然变严重",
    takeaway: "医生更关注连续变化、异常程度、相关指标和用药背景，而不是孤立看一个箭头。",
    explanation: [
      "同一个指标可能受到疾病活动、用药、感染、饮食、运动和实验室差异等多种因素影响。",
      "趋势有助于复诊沟通，但趋势图本身不能诊断复发或判断药物是否有效。",
      "把报告日期、参考范围、当时用药和身体变化一起记录，医生更容易还原情况。"
    ],
    now: "遇到异常先保存报告并按医生安排复查；如果出现医生交代过的紧急症状，应及时就医而不是等待 APP 判断。",
    doctorQuestions: ["这项异常需要多久后复查？", "哪些指标应该放在一起看？"],
    source: {
      organization: "NIDDK / NIH",
      title: "Diagnosis of Autoimmune Hepatitis",
      url: "https://www.niddk.nih.gov/health-information/liver-disease/autoimmune-hepatitis/diagnosis",
      reviewedAt: "2026-07-28",
      level: "A"
    }
  },
  {
    id: "research-context",
    topic: "研究进展",
    title: "看到“新药研究”时，先分清研究和指南",
    takeaway: "一项新研究值得关注，但通常不能直接改变正在执行的治疗方案。",
    explanation: [
      "研究可能处在实验室、早期临床试验、较大临床试验或长期随访等不同阶段。",
      "正式指南会综合多项研究、疗效、副作用和适用人群。新闻标题往往不会完整说明这些限制。",
      "安心科普只把新研究作为与医生沟通的背景，不发布“马上换药”“治愈”一类结论。"
    ],
    now: "继续当前医嘱；如果看到感兴趣的进展，把来源保存下来，在复诊时询问是否与自己的情况有关。",
    doctorQuestions: ["这项研究适用于我的诊断和目前阶段吗？", "它是否已经进入正式指南？"],
    source: {
      organization: "AASLD",
      title: "Practice Guidelines",
      url: "https://www.aasld.org/practice-guidelines",
      reviewedAt: "2026-07-28",
      level: "C"
    }
  }
];
