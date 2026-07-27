const defaultMedications = [
  { id: 1, name: "优甲乐", detail: "1 片 · 口服 · 空腹", time: "07:30", kind: "thyroid", type: "甲状腺用药", icon: "thyroid", overdue: true },
  { id: 2, name: "甲泼尼龙", detail: "按当前方案 · 口服 · 餐后", time: "08:00", kind: "steroid", type: "激素类药物", icon: "pill", overdue: true },
  { id: 3, name: "优思弗", detail: "1 粒 · 口服 · 餐后", time: "12:30", kind: "liver", type: "肝胆相关用药", icon: "liver" },
  { id: 4, name: "二甲双胍", detail: "按当前记录 · 口服 · 餐后", time: "20:00", kind: "diabetes", type: "血糖相关用药", icon: "blood-drop" }
];
let medications = JSON.parse(localStorage.getItem("healther-medications") || "null") || defaultMedications;

const pending = [...medications];
const completed = [];
const pendingBox = document.querySelector("#pending-medications");
const completedBox = document.querySelector("#completed-medications");
const pendingCount = document.querySelector("#pending-count");
const completedCount = document.querySelector("#completed-count");

function medicationCard(item, status) {
  const node = document.createElement("article");
  node.className = `med-card ${item.overdue ? "overdue" : ""} ${status ? `completed ${status}` : ""}`;
  if (status) {
    node.innerHTML = `
      <div class="med-card-top">
        <span class="med-icon ${item.kind}"><span class="vendor-icon health-${item.icon}"></span></span>
        <div><h3>${item.name}</h3><p>${item.detail}</p><span class="med-type">${item.type}</span></div>
        <span class="med-time">${item.time}</span>
      </div>
      <div class="completion-label">${status === "skipped" ? "已跳过 · 可补充原因" : "已服 · 已记录实际时间"}</div>`;
    return node;
  }
  node.innerHTML = `
    <div class="med-card-top">
      <span class="med-icon ${item.kind}"><span class="vendor-icon health-${item.icon}"></span></span>
      <div><h3>${item.name}</h3><p>${item.detail}</p><span class="med-type">${item.type}</span></div>
      <span class="med-time">${item.time}${item.overdue ? "<small>待处理</small>" : ""}</span>
    </div>
    <div class="med-actions">
      <button data-action="snooze" data-id="${item.id}">稍后</button>
      <button data-action="skip" data-id="${item.id}">跳过</button>
      <button data-action="taken" data-id="${item.id}">已服</button>
    </div>`;
  return node;
}

function renderMedications() {
  pendingBox.innerHTML = "";
  completedBox.innerHTML = "";
  pending.sort((a, b) => a.time.localeCompare(b.time)).forEach(item => pendingBox.append(medicationCard(item)));
  completed.forEach(item => completedBox.append(medicationCard(item, item.status)));
  pendingCount.textContent = `${pending.length} 项`;
  completedCount.textContent = completed.length;
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 1800);
}

pendingBox.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const id = Number(button.dataset.id);
  const itemIndex = pending.findIndex(item => item.id === id);
  const item = pending[itemIndex];
  if (button.dataset.action === "snooze") {
    activeSnoozeId = item.id;
    document.querySelector("#snooze-med-name").textContent = item.name;
    openSheet("snooze");
    return;
  }
  pending.splice(itemIndex, 1);
  completed.unshift({ ...item, status: button.dataset.action === "skip" ? "skipped" : "taken" });
  renderMedications();
  showToast(button.dataset.action === "skip" ? "已标记为跳过" : "已记录服用");
});

document.querySelector("#completed-toggle").addEventListener("click", () => {
  completedBox.hidden = !completedBox.hidden;
});

document.querySelectorAll("[data-tab]").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-tab]").forEach(item => item.classList.toggle("active", item === button));
    document.querySelectorAll(".screen").forEach(screen => screen.classList.toggle("active", screen.dataset.screen === button.dataset.tab));
    document.querySelector(".app-content").scrollTo({ top: 0, behavior: "smooth" });
  });
});

const sheets = {
  prep: document.querySelector("#prep-sheet"),
  postvisit: document.querySelector("#postvisit-sheet"),
  article: document.querySelector("#article-sheet"),
  settings: document.querySelector("#settings-sheet"),
  medication: document.querySelector("#medication-sheet"),
  snooze: document.querySelector("#snooze-sheet"),
  appointment: document.querySelector("#appointment-sheet")
};
const backdrop = document.querySelector("#sheet-backdrop");

function openSheet(name) {
  Object.values(sheets).forEach(sheet => sheet.classList.remove("open"));
  sheets[name].classList.add("open");
  sheets[name].setAttribute("aria-hidden", "false");
  backdrop.classList.add("open");
}
function closeSheets() {
  Object.values(sheets).forEach(sheet => {
    sheet.classList.remove("open");
    sheet.setAttribute("aria-hidden", "true");
  });
  backdrop.classList.remove("open");
}
document.querySelectorAll("[data-open]").forEach(button => button.addEventListener("click", () => openSheet(button.dataset.open)));
backdrop.addEventListener("click", closeSheets);
document.querySelectorAll("[data-toast]").forEach(button => button.addEventListener("click", () => showToast(button.dataset.toast)));

const prepSteps = [
  { title: "最近身体有什么变化？", subtitle: "请选择最接近的情况，也可以补充说明。", options: ["没有明显变化", "有一些不适", "症状比之前加重", "其他"] },
  { title: "最近用药情况怎么样？", subtitle: "系统已经整理了已服和跳过记录。", options: ["没有自行调整", "有药物跳过", "有剂量或时间变化", "记不清，需要问医生"] },
  { title: "有没有特别想告诉医生的异常？", subtitle: "这部分来自本人回忆，会在摘要中明确标注。", options: ["没有", "睡眠变化", "乏力或胃口变化", "皮肤或消化不适"] },
  { title: "检查资料准备好了吗？", subtitle: "近期已有 3 张报告，可以返回原图核对。", options: ["资料齐全", "还有报告未上传", "有检查尚未完成"] },
  { title: "这次最想问医生什么？", subtitle: "写下最重要的问题，见到医生时不遗漏。", textarea: true }
];
let prepStep = 0;
const prepContent = document.querySelector("#prep-content");
const prepLabel = document.querySelector("#prep-step-label");
const prepProgress = document.querySelector("#prep-progress");
const prepBack = document.querySelector("#prep-back");
const prepNext = document.querySelector("#prep-next");

function renderPrep() {
  const step = prepSteps[prepStep];
  prepLabel.textContent = `${prepStep + 1} / ${prepSteps.length}`;
  prepProgress.style.width = `${((prepStep + 1) / prepSteps.length) * 100}%`;
  prepBack.style.visibility = prepStep === 0 ? "hidden" : "visible";
  prepNext.textContent = prepStep === prepSteps.length - 1 ? "生成复诊摘要" : "下一步";
  prepContent.innerHTML = `<h2>${step.title}</h2><p>${step.subtitle}</p>` + (step.textarea
    ? `<textarea class="prep-textarea" placeholder="例如：最近指标是否需要调整复查频率？"></textarea>`
    : `<div class="prep-options">${step.options.map((option, index) =>
        `<label><input type="radio" name="prep-${prepStep}" ${index === 0 ? "checked" : ""}> ${option}</label>`).join("")}</div>`);
}
prepBack.addEventListener("click", () => { if (prepStep > 0) { prepStep--; renderPrep(); } });
prepNext.addEventListener("click", () => {
  if (prepStep < prepSteps.length - 1) { prepStep++; renderPrep(); return; }
  closeSheets();
  showToast("复诊摘要已生成");
  prepStep = 0;
  renderPrep();
});

const foodEmoji = { "米饭": "🍚", "馒头": "🥟", "鸡蛋": "🥚", "苹果": "🍎", "牛奶": "🥛", "鱼": "🐟" };
const foodData = {
  "苹果": { emoji:"🍎", calories:52, carbs:"13.8g", protein:"0.3g", fat:"0.2g", fiber:"2.4g", rating:"更适合", diabetes:"含天然糖，建议按一份水果控制食用量。", lipid:"脂肪含量低，可替代高脂零食。", liver:"普通份量通常可选，不宣称治疗作用。", portion:"每次约一个拳头大小，避免一次吃太多。" },
  "米饭": { emoji:"🍚", calories:130, carbs:"28.2g", protein:"2.7g", fat:"0.3g", fiber:"0.4g", rating:"注意份量", diabetes:"碳水化合物是主要关注点，应结合整餐控制份量。", lipid:"本身脂肪低，但不能替代蔬菜和优质蛋白。", liver:"通常可作为主食，具体份量需结合医生建议。", portion:"先从一小碗开始，并搭配蔬菜和蛋白质食物。" },
  "馒头": { emoji:"🥟", calories:223, carbs:"47.0g", protein:"7.0g", fat:"1.1g", fiber:"1.5g", rating:"注意份量", diabetes:"碳水较集中，需要控制单次食用量。", lipid:"脂肪通常不高，注意夹馅和搭配。", liver:"普通馒头通常可选，避免高油高糖加工版本。", portion:"先选择半个到一个小馒头，结合整餐主食量。" },
  "鸡蛋": { emoji:"🥚", calories:155, carbs:"1.1g", protein:"12.6g", fat:"10.6g", fiber:"0g", rating:"注意份量", diabetes:"碳水较低，可作为蛋白质来源之一。", lipid:"含膳食胆固醇，应结合总体饮食和医生意见。", liver:"优先水煮、蒸等少油做法，不宣称护肝。", portion:"以水煮或蒸蛋为主，频率结合整体饮食安排。" },
  "牛奶": { emoji:"🥛", calories:61, carbs:"4.8g", protein:"3.2g", fat:"3.3g", fiber:"0g", rating:"更适合", diabetes:"需要计入乳糖和总碳水，避免加糖乳饮料。", lipid:"如需控制脂肪，可选择低脂或脱脂版本。", liver:"普通份量通常可选，留意额外添加糖。", portion:"优先无添加糖牛奶，一次约一杯。" },
  "鱼": { emoji:"🐟", calories:120, carbs:"0g", protein:"20.5g", fat:"4.0g", fiber:"0g", rating:"更适合", diabetes:"几乎不含碳水，可作为蛋白质来源。", lipid:"优先清蒸、炖煮，避免油炸和重油酱汁。", liver:"选择新鲜食材和少油烹调，不宣称治疗作用。", portion:"一次约一掌心大小，优先清蒸或炖煮。" }
};
function renderFood(name) {
  const data = foodData[name] || { emoji:"◉", calories:"—", carbs:"待查询", protein:"待查询", fat:"待查询", fiber:"待查询", rating:"等待数据", diabetes:"尚未匹配可靠食物条目。", lipid:"尚未匹配可靠食物条目。", liver:"尚未匹配可靠食物条目。", portion:"请先选择标准食物条目，避免根据名称猜测。" };
  document.querySelector("#food-name").textContent = name;
  document.querySelector("#food-emoji").textContent = data.emoji;
  document.querySelector("#food-calories").textContent = data.calories;
  document.querySelector("#food-carbs").textContent = data.carbs;
  document.querySelector("#food-protein").textContent = data.protein;
  document.querySelector("#food-fat").textContent = data.fat;
  document.querySelector("#food-fiber").textContent = data.fiber;
  document.querySelector("#food-rating").textContent = data.rating;
  document.querySelector("#food-diabetes").textContent = data.diabetes;
  document.querySelector("#food-lipid").textContent = data.lipid;
  document.querySelector("#food-liver").textContent = data.liver;
  document.querySelector("#food-portion").textContent = data.portion;
}
document.querySelectorAll("[data-food]").forEach(button => button.addEventListener("click", () => {
  renderFood(button.dataset.food);
  document.querySelector("#food-result").scrollIntoView({ behavior: "smooth", block: "start" });
}));
document.querySelector("#food-input").addEventListener("keydown", event => {
  if (event.key !== "Enter" || !event.target.value.trim()) return;
  renderFood(event.target.value.trim());
  document.querySelector("#food-result").scrollIntoView({ behavior: "smooth", block: "start" });
});

document.querySelectorAll(".filter-row").forEach(row => row.addEventListener("click", event => {
  const filter = event.target.closest(".filter");
  if (!filter) return;
  row.querySelectorAll(".filter").forEach(item => item.classList.toggle("active", item === filter));
}));

renderMedications();
renderPrep();

const iconByKind = { thyroid:"thyroid", steroid:"pill", liver:"liver", diabetes:"blood-drop" };
const typeByKind = { thyroid:"甲状腺用药", steroid:"激素类药物", liver:"肝胆相关用药", diabetes:"血糖相关用药" };
const medSelect = document.querySelector("#med-select");
function loadMedicationEditor(id = medications[0].id) {
  medSelect.innerHTML = medications.map(item => `<option value="${item.id}">${item.name} · ${item.time}</option>`).join("");
  medSelect.value = String(id);
  const item = medications.find(med => med.id === Number(id));
  document.querySelector("#med-id").value = item.id;
  document.querySelector("#med-name").value = item.name;
  document.querySelector("#med-time").value = item.time;
  document.querySelector("#med-detail").value = item.detail;
  document.querySelector("#med-kind").value = item.kind;
}
medSelect.addEventListener("change", () => loadMedicationEditor(medSelect.value));
document.querySelector("#medication-form").addEventListener("submit", event => {
  event.preventDefault();
  const id = Number(document.querySelector("#med-id").value);
  const item = medications.find(med => med.id === id);
  const kind = document.querySelector("#med-kind").value;
  Object.assign(item, {
    name: document.querySelector("#med-name").value.trim(),
    time: document.querySelector("#med-time").value,
    detail: document.querySelector("#med-detail").value.trim(),
    kind, type: typeByKind[kind], icon: iconByKind[kind]
  });
  localStorage.setItem("healther-medications", JSON.stringify(medications));
  const pendingItem = pending.find(med => med.id === id);
  if (pendingItem) Object.assign(pendingItem, item);
  renderMedications();
  closeSheets();
  showToast("用药时间已保存到本机");
});
loadMedicationEditor();

let activeSnoozeId = null;
let snoozeMinutes = 15;
document.querySelectorAll("[data-minutes]").forEach(button => button.addEventListener("click", () => {
  document.querySelectorAll("[data-minutes]").forEach(item => item.classList.toggle("selected", item === button));
  snoozeMinutes = Number(button.dataset.minutes);
  document.querySelector("#snooze-time").value = "";
}));
document.querySelector("#save-snooze").addEventListener("click", () => {
  const custom = document.querySelector("#snooze-time").value;
  closeSheets();
  showToast(custom ? `已设置 ${custom} 再次提醒` : `已设置 ${snoozeMinutes} 分钟后提醒`);
});

const defaultAppointment = {
  title:"消化内科复查", datetime:"2026-07-28T09:00",
  place:"上海市第一人民医院 · 张医生", tests:"肝功能、血脂、血糖等 4 项"
};
let appointment = JSON.parse(localStorage.getItem("healther-appointment") || "null") || defaultAppointment;
function renderAppointment() {
  const date = new Date(appointment.datetime);
  document.querySelector("#review-day").textContent = date.getDate();
  document.querySelector("#review-month").textContent = `${date.getMonth() + 1} 月`;
  document.querySelector("#review-title").textContent = appointment.title;
  document.querySelector("#review-place").textContent = appointment.place;
  document.querySelector("#review-tests").textContent = appointment.tests;
  document.querySelector("#appointment-title").value = appointment.title;
  document.querySelector("#appointment-datetime").value = appointment.datetime;
  document.querySelector("#appointment-place").value = appointment.place;
  document.querySelector("#appointment-tests").value = appointment.tests;
}
document.querySelector("#appointment-form").addEventListener("submit", event => {
  event.preventDefault();
  appointment = {
    title:document.querySelector("#appointment-title").value.trim(),
    datetime:document.querySelector("#appointment-datetime").value,
    place:document.querySelector("#appointment-place").value.trim(),
    tests:document.querySelector("#appointment-tests").value.trim()
  };
  localStorage.setItem("healther-appointment", JSON.stringify(appointment));
  renderAppointment();
  closeSheets();
  showToast("复查时间已保存到本机");
});
renderAppointment();
