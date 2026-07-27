const medications = [
  { id: 1, name: "优甲乐", detail: "1 片 · 口服 · 空腹", time: "07:30", kind: "thyroid", type: "甲状腺用药", icon: "i-thyroid", overdue: true },
  { id: 2, name: "甲泼尼龙", detail: "按当前方案 · 口服 · 餐后", time: "08:00", kind: "steroid", type: "激素类药物", icon: "i-sun", overdue: true },
  { id: 3, name: "优思弗", detail: "1 粒 · 口服 · 餐后", time: "12:30", kind: "liver", type: "肝胆相关用药", icon: "i-liver" },
  { id: 4, name: "二甲双胍", detail: "按当前记录 · 口服 · 餐后", time: "20:00", kind: "diabetes", type: "血糖相关用药", icon: "i-drop" }
];

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
        <span class="med-icon ${item.kind}"><svg><use href="#${item.icon}"/></svg></span>
        <div><h3>${item.name}</h3><p>${item.detail}</p><span class="med-type">${item.type}</span></div>
        <span class="med-time">${item.time}</span>
      </div>
      <div class="completion-label">${status === "skipped" ? "已跳过 · 可补充原因" : "已服 · 已记录实际时间"}</div>`;
    return node;
  }
  node.innerHTML = `
    <div class="med-card-top">
      <span class="med-icon ${item.kind}"><svg><use href="#${item.icon}"/></svg></span>
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
    showToast(`${item.name}：已设置 15 分钟后提醒`);
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
  settings: document.querySelector("#settings-sheet")
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
document.querySelectorAll("[data-food]").forEach(button => button.addEventListener("click", () => {
  document.querySelector("#food-name").textContent = button.dataset.food;
  document.querySelector("#food-emoji").textContent = foodEmoji[button.dataset.food];
  document.querySelector("#food-result").scrollIntoView({ behavior: "smooth", block: "start" });
}));
document.querySelector("#food-input").addEventListener("keydown", event => {
  if (event.key !== "Enter" || !event.target.value.trim()) return;
  document.querySelector("#food-name").textContent = event.target.value.trim();
  document.querySelector("#food-emoji").textContent = "◉";
  document.querySelector("#food-result").scrollIntoView({ behavior: "smooth", block: "start" });
});

document.querySelectorAll(".filter-row").forEach(row => row.addEventListener("click", event => {
  const filter = event.target.closest(".filter");
  if (!filter) return;
  row.querySelectorAll(".filter").forEach(item => item.classList.toggle("active", item === filter));
}));

renderMedications();
renderPrep();
