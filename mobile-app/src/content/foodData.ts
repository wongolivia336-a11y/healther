export type FoodRating = "suitable" | "portion" | "cautious";
export type FoodCategory = "主食" | "肉蛋豆" | "蔬菜" | "水果" | "奶类" | "零食饮料";

export type FoodItem = {
  id: string;
  name: string;
  category: FoodCategory;
  rating: FoodRating;
  portion: string;
  summary: string;
  reasons: { label: string; text: string }[];
  alternatives: string[];
  meals: ("早餐" | "午餐" | "晚餐" | "加餐")[];
};

export const foodCategories: ("全部" | FoodCategory)[] = ["全部", "主食", "肉蛋豆", "蔬菜", "水果", "奶类", "零食饮料"];
export const mealOptions = ["早餐", "午餐", "晚餐", "加餐"] as const;

export const foodRatingMeta: Record<FoodRating, { label: string; hint: string }> = {
  suitable: { label: "更适合", hint: "可以作为日常搭配的一部分" },
  portion: { label: "注意份量", hint: "不是不能吃，控制一次的量" },
  cautious: { label: "谨慎选择", hint: "偶尔少量，优先考虑替代项" }
};

export const foods: FoodItem[] = [
  {
    id: "oats", name: "原味燕麦", category: "主食", rating: "suitable", portion: "干燕麦约 30–40 克，煮成一小碗",
    summary: "选择无额外加糖的原味燕麦，搭配鸡蛋或无糖奶更完整。",
    reasons: [
      { label: "血糖", text: "比甜味麦片更容易控制添加糖，仍需要计入主食份量。" },
      { label: "血脂", text: "可溶性膳食纤维适合作为日常主食的一部分。" },
      { label: "肝胆", text: "采用清淡煮法，不额外加入大量糖和奶油。" }
    ],
    alternatives: ["全麦面包", "杂粮粥"], meals: ["早餐"]
  },
  {
    id: "wholegrain-rice", name: "杂粮饭", category: "主食", rating: "suitable", portion: "熟饭约半碗到一小碗",
    summary: "白米和全谷杂豆搭配，比单独一大碗白米饭更容易控制份量。",
    reasons: [
      { label: "血糖", text: "仍属于主食，重点是半碗到一小碗，并搭配蔬菜和蛋白质。" },
      { label: "血脂", text: "全谷和杂豆能增加膳食纤维。" }
    ],
    alternatives: ["糙米饭", "小米饭"], meals: ["午餐", "晚餐"]
  },
  {
    id: "white-rice", name: "白米饭", category: "主食", rating: "portion", portion: "先盛半碗，不够再少量添加",
    summary: "可以吃，不需要完全戒掉；避免把一大碗米饭作为一餐的主体。",
    reasons: [
      { label: "血糖", text: "白米饭容易吃得过量，和蔬菜、鱼肉蛋豆同吃更合适。" },
      { label: "焦虑提醒", text: "一次吃米饭不会决定长期血糖，关注长期份量和规律。" }
    ],
    alternatives: ["杂粮饭", "燕麦米饭"], meals: ["午餐", "晚餐"]
  },
  {
    id: "steamed-bun", name: "白馒头", category: "主食", rating: "portion", portion: "中等大小约半个到一个，按同餐其他主食调整",
    summary: "馒头体积看起来不大，但仍是一份主食，不和粥、面条重复叠加。",
    reasons: [{ label: "血糖", text: "精制面食需要注意一次份量，避免配甜饮料或甜粥。" }],
    alternatives: ["全麦馒头", "杂粮窝头"], meals: ["早餐", "午餐", "晚餐"]
  },
  {
    id: "sweet-porridge", name: "甜粥／加糖八宝粥", category: "主食", rating: "cautious", portion: "若选择，少量并取消同餐其他甜食",
    summary: "粥煮得软烂又额外加糖，不适合作为经常性的早餐。",
    reasons: [
      { label: "血糖", text: "液体或软烂主食容易进食较快，加糖后负担进一步增加。" },
      { label: "替代方法", text: "选择不加糖杂粮粥，并加入鸡蛋、豆腐等蛋白质。" }
    ],
    alternatives: ["无糖杂粮粥", "原味燕麦"], meals: ["早餐"]
  },
  {
    id: "steamed-fish", name: "清蒸鱼", category: "肉蛋豆", rating: "suitable", portion: "去骨鱼肉约一掌心大小",
    summary: "少油清蒸，酱油不要倒得过多，是比较稳妥的蛋白质选择。",
    reasons: [
      { label: "血脂", text: "替代肥肉和油炸肉类，有助于减少饱和脂肪摄入。" },
      { label: "肝胆", text: "清蒸比油炸和重油红烧更清淡。" }
    ],
    alternatives: ["炖鱼", "白灼虾"], meals: ["午餐", "晚餐"]
  },
  {
    id: "chicken", name: "去皮鸡肉", category: "肉蛋豆", rating: "suitable", portion: "熟肉约一掌心大小",
    summary: "选择蒸、煮、炖，去掉明显鸡皮，避免裹粉油炸。",
    reasons: [
      { label: "血脂", text: "去皮瘦肉通常比肥肉和加工肉制品脂肪更少。" },
      { label: "血糖", text: "搭配半盘非淀粉蔬菜，有助于形成完整一餐。" }
    ],
    alternatives: ["鱼肉", "豆腐"], meals: ["午餐", "晚餐"]
  },
  {
    id: "egg", name: "水煮蛋／蒸蛋", category: "肉蛋豆", rating: "suitable", portion: "通常一次 1 个，结合医生和营养师建议",
    summary: "做法比是否吃鸡蛋更重要，少油的水煮蛋和蒸蛋更稳妥。",
    reasons: [{ label: "血脂", text: "避免同时搭配培根、香肠和大量油脂。" }],
    alternatives: ["嫩豆腐", "无糖酸奶"], meals: ["早餐", "加餐"]
  },
  {
    id: "tofu", name: "豆腐", category: "肉蛋豆", rating: "suitable", portion: "约半盒嫩豆腐或一掌心大小",
    summary: "选择家常炖、蒸或做汤，注意不要被重油酱汁掩盖。",
    reasons: [
      { label: "血脂", text: "可以替代一部分肥肉和加工肉。" },
      { label: "用药间隔", text: "优甲乐的服用间隔按医生或药师要求执行，不根据本页自行停吃豆制品。" }
    ],
    alternatives: ["豆干少量", "鱼肉"], meals: ["午餐", "晚餐"]
  },
  {
    id: "processed-meat", name: "香肠／腊肉／午餐肉", category: "肉蛋豆", rating: "cautious", portion: "不作为日常主要肉类，偶尔少量",
    summary: "加工肉通常盐和脂肪较高，优先换成新鲜鱼、禽、蛋或豆腐。",
    reasons: [
      { label: "血脂", text: "部分产品饱和脂肪较高。" },
      { label: "整体饮食", text: "盐分较高，容易和重口味调料叠加。" }
    ],
    alternatives: ["去皮鸡肉", "清蒸鱼", "水煮蛋"], meals: ["早餐", "午餐", "晚餐"]
  },
  {
    id: "leafy-greens", name: "绿叶蔬菜", category: "蔬菜", rating: "suitable", portion: "一餐至少一到两拳，少油烹调",
    summary: "作为餐盘中占比最大的一部分，清炒、白灼或做汤都可以。",
    reasons: [
      { label: "血糖", text: "非淀粉蔬菜有助于增加饱腹感，不替代主食和蛋白质。" },
      { label: "血脂", text: "增加膳食纤维，适合日常多样轮换。" }
    ],
    alternatives: ["西兰花", "菜花", "菌菇"], meals: ["午餐", "晚餐"]
  },
  {
    id: "broccoli", name: "西兰花／菜花", category: "蔬菜", rating: "suitable", portion: "一到两拳，蒸煮或少油快炒",
    summary: "不用担心所谓“甲状腺患者绝对不能吃十字花科”的网络说法，保持正常熟食份量。",
    reasons: [
      { label: "甲状腺", text: "甲状腺全切后的用药管理应听医生指导，本页不设置蔬菜禁忌。" },
      { label: "血糖血脂", text: "属于适合增加餐盘体积的非淀粉蔬菜。" }
    ],
    alternatives: ["绿叶菜", "菌菇"], meals: ["午餐", "晚餐"]
  },
  {
    id: "potato", name: "土豆／山药／芋头", category: "蔬菜", rating: "portion", portion: "约一拳，同时减少米饭、馒头或面条",
    summary: "它们更接近主食，不要当成不计量的普通蔬菜。",
    reasons: [{ label: "血糖", text: "与米饭同吃时需要替换部分主食，而不是额外增加。" }],
    alternatives: ["绿叶菜", "西兰花"], meals: ["午餐", "晚餐"]
  },
  {
    id: "pickles", name: "咸菜／腌菜", category: "蔬菜", rating: "cautious", portion: "只作少量调味，不当作一盘蔬菜",
    summary: "咸菜不能替代新鲜蔬菜，容易让一餐盐分过高。",
    reasons: [{ label: "整体饮食", text: "减少腌制食品，优先新鲜蔬菜和清淡做法。" }],
    alternatives: ["凉拌黄瓜少盐", "白灼青菜"], meals: ["早餐", "午餐", "晚餐"]
  },
  {
    id: "apple", name: "苹果／梨", category: "水果", rating: "suitable", portion: "一次一个小果或半个大果",
    summary: "吃完整水果，不榨汁；尽量放在两餐之间。",
    reasons: [
      { label: "血糖", text: "水果仍含天然糖，一次一份，不边看电视边连续吃。" },
      { label: "血脂", text: "完整水果保留膳食纤维。" }
    ],
    alternatives: ["橙子", "猕猴桃"], meals: ["加餐"]
  },
  {
    id: "berries", name: "草莓／蓝莓", category: "水果", rating: "suitable", portion: "草莓约一小碗，蓝莓约一小把",
    summary: "选择新鲜原果，不蘸糖、不搭配甜奶油。",
    reasons: [{ label: "血糖", text: "仍需作为一份水果计量，不使用果酱替代。" }],
    alternatives: ["小苹果", "橙子"], meals: ["加餐"]
  },
  {
    id: "grapes", name: "葡萄／荔枝", category: "水果", rating: "portion", portion: "预先取出一小份，不端整盆连续吃",
    summary: "不是禁食水果，但个头小、容易不知不觉吃多。",
    reasons: [{ label: "血糖", text: "先分装再吃，比边吃边取更容易控制总量。" }],
    alternatives: ["小苹果", "草莓"], meals: ["加餐"]
  },
  {
    id: "juice", name: "果汁／鲜榨果汁", category: "零食饮料", rating: "cautious", portion: "不作为日常饮料",
    summary: "即使不额外加糖，果汁也比完整水果更容易快速喝入较多糖。",
    reasons: [{ label: "血糖", text: "优先吃完整水果，口渴选择白水或无糖茶。" }],
    alternatives: ["白水", "完整水果"], meals: ["早餐", "加餐"]
  },
  {
    id: "plain-milk", name: "纯牛奶／无糖酸奶", category: "奶类", rating: "suitable", portion: "牛奶约一杯，酸奶一小杯",
    summary: "查看配料和营养标签，优先无额外加糖产品。",
    reasons: [
      { label: "骨骼", text: "激素治疗和更年期阶段应关注钙、维生素 D 与骨骼健康，具体补充量听医生建议。" },
      { label: "用药间隔", text: "优甲乐与含钙食物或补充剂的间隔按医生或药师要求执行。" }
    ],
    alternatives: ["无糖豆浆", "原味酸奶"], meals: ["早餐", "加餐"]
  },
  {
    id: "sweet-yogurt", name: "风味酸奶／乳酸菌饮料", category: "奶类", rating: "cautious", portion: "查看标签，避免把含糖饮料当作奶制品",
    summary: "“酸奶味”或“乳酸菌”不等于无糖，部分产品添加糖较多。",
    reasons: [{ label: "血糖", text: "比较营养标签和配料表，优先原味无糖产品。" }],
    alternatives: ["无糖酸奶", "纯牛奶"], meals: ["早餐", "加餐"]
  },
  {
    id: "nuts", name: "原味坚果", category: "零食饮料", rating: "portion", portion: "一天一小把，不反复续添",
    summary: "选择原味、非油炸，坚果有营养但能量密度高。",
    reasons: [{ label: "血脂", text: "可替代饼干和油炸零食，但份量仍然重要。" }],
    alternatives: ["小份水果", "无糖酸奶"], meals: ["加餐"]
  },
  {
    id: "sweet-drink", name: "奶茶／含糖饮料", category: "零食饮料", rating: "cautious", portion: "不作为日常饮料；若选择，尽量小杯、低糖且不加小料",
    summary: "液体糖容易摄入过多，小料还会叠加额外淀粉和糖。",
    reasons: [
      { label: "血糖", text: "优先白水、无糖茶或黑咖啡，不能用“少冰”代替“少糖”。" },
      { label: "血脂", text: "部分奶茶还含较多饱和脂肪。" }
    ],
    alternatives: ["白水", "无糖茶"], meals: ["加餐"]
  },
  {
    id: "fried-food", name: "油条／炸鸡／薯条", category: "零食饮料", rating: "cautious", portion: "降低频率，偶尔少量并搭配清淡食物",
    summary: "油炸食品容易同时带来较多油脂、精制淀粉和盐。",
    reasons: [
      { label: "血脂", text: "优先蒸、煮、炖、烤的替代做法。" },
      { label: "肝胆", text: "清淡均衡比所谓“保肝食品”更可靠。" }
    ],
    alternatives: ["烤鸡胸", "蒸红薯少量", "水煮蛋"], meals: ["早餐", "午餐", "晚餐", "加餐"]
  },
  {
    id: "alcohol", name: "酒精饮品", category: "零食饮料", rating: "cautious", portion: "肝病期间不要自行判断“少量没关系”",
    summary: "存在自免肝、胆汁淤积和肝功能异常时，应直接向肝病医生确认是否需要完全避免。",
    reasons: [
      { label: "肝胆", text: "酒精可能增加肝脏负担，本工具不提供安全饮酒量。" },
      { label: "用药", text: "同时使用多种药物时，不根据网络经验自行饮酒。" }
    ],
    alternatives: ["无糖气泡水", "淡茶", "白水"], meals: ["午餐", "晚餐"]
  }
];

export const foodSources = [
  { label: "USDA FoodData Central", url: "https://fdc.nal.usda.gov/" },
  { label: "NIDDK：糖尿病饮食与营养", url: "https://www.niddk.nih.gov/health-information/diabetes/overview/diet-eating-physical-activity" },
  { label: "NIDDK：自身免疫性肝炎", url: "https://www.niddk.nih.gov/health-information/liver-disease/autoimmune-hepatitis/eating-diet-nutrition" }
];
