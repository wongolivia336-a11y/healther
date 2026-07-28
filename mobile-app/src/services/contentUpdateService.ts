import { foods as bundledFoods, type FoodItem } from "../content/foodData";
import { learnArticles as bundledArticles, type LearnArticle } from "../content/learnData";

export type ContentManifest = {
  schemaVersion: 1;
  contentVersion: number;
  publishedAt: string;
  minimumAppVersion: number;
  foods: string;
  articles: string;
};

export type ContentSnapshot = {
  version: number;
  publishedAt: string;
  checkedAt: string | null;
  foods: FoodItem[];
  articles: LearnArticle[];
  source: "bundled" | "downloaded";
};

export type ContentUpdateResult =
  | { status: "updated"; snapshot: ContentSnapshot }
  | { status: "current"; snapshot: ContentSnapshot }
  | { status: "offline"; snapshot: ContentSnapshot; message: string };

const STORAGE_KEY = "healther-content-v1";
const CHECKED_KEY = "healther-content-checked-at";
const CONTENT_EVENT = "healther-content-updated";
const PRIMARY_MANIFEST = "https://wongolivia336-a11y.github.io/healther/content/manifest.json";
const FALLBACK_MANIFEST = "https://raw.githubusercontent.com/wongolivia336-a11y/healther/main/mobile-app/public/content/manifest.json";

function bundledSnapshot(): ContentSnapshot {
  return {
    version: 1,
    publishedAt: "2026-07-28T00:00:00+08:00",
    checkedAt: localStorage.getItem(CHECKED_KEY),
    foods: bundledFoods,
    articles: bundledArticles,
    source: "bundled"
  };
}

function isFood(value: unknown): value is FoodItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<FoodItem>;
  return typeof item.id === "string" && typeof item.name === "string" &&
    typeof item.category === "string" && ["suitable", "portion", "cautious"].includes(String(item.rating)) &&
    typeof item.portion === "string" && typeof item.summary === "string" &&
    Array.isArray(item.reasons) && Array.isArray(item.alternatives) && Array.isArray(item.meals);
}

function isArticle(value: unknown): value is LearnArticle {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<LearnArticle>;
  return typeof item.id === "string" && typeof item.title === "string" &&
    typeof item.takeaway === "string" && Array.isArray(item.explanation) &&
    Array.isArray(item.doctorQuestions) && Boolean(item.source?.organization) &&
    Boolean(item.source?.url) && ["A", "B", "C"].includes(String(item.source?.level));
}

function parseStored(value: string | null): ContentSnapshot | null {
  if (!value) return null;
  try {
    const snapshot = JSON.parse(value) as ContentSnapshot;
    if (!Number.isInteger(snapshot.version) || !Array.isArray(snapshot.foods) || !Array.isArray(snapshot.articles)) return null;
    if (!snapshot.foods.every(isFood) || !snapshot.articles.every(isArticle)) return null;
    return { ...snapshot, checkedAt: localStorage.getItem(CHECKED_KEY), source: "downloaded" };
  } catch {
    return null;
  }
}

export function getContentSnapshot(): ContentSnapshot {
  return parseStored(localStorage.getItem(STORAGE_KEY)) ?? bundledSnapshot();
}

async function fetchJson<T>(url: string, timeoutMs = 10_000): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { cache: "no-store", signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json() as T;
  } finally {
    window.clearTimeout(timer);
  }
}

function resolveContentUrl(path: string, manifestUrl: string): string {
  return new URL(path, manifestUrl).toString();
}

async function loadManifest(): Promise<{ manifest: ContentManifest; url: string }> {
  let lastError: unknown;
  for (const url of [PRIMARY_MANIFEST, FALLBACK_MANIFEST]) {
    try {
      const manifest = await fetchJson<ContentManifest>(url);
      if (manifest.schemaVersion !== 1 || !Number.isInteger(manifest.contentVersion)) throw new Error("内容版本格式不支持");
      return { manifest, url };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError ?? new Error("无法连接内容源");
}

export async function checkForContentUpdates(force = false): Promise<ContentUpdateResult> {
  const current = getContentSnapshot();
  const lastChecked = localStorage.getItem(CHECKED_KEY);
  if (!force && lastChecked && Date.now() - new Date(lastChecked).getTime() < 24 * 60 * 60 * 1000) {
    return { status: "current", snapshot: current };
  }

  const checkedAt = new Date().toISOString();
  localStorage.setItem(CHECKED_KEY, checkedAt);
  try {
    const { manifest, url } = await loadManifest();
    if (manifest.contentVersion <= current.version) {
      return { status: "current", snapshot: { ...current, checkedAt } };
    }

    const [foods, articles] = await Promise.all([
      fetchJson<unknown>(resolveContentUrl(manifest.foods, url)),
      fetchJson<unknown>(resolveContentUrl(manifest.articles, url))
    ]);
    if (!Array.isArray(foods) || foods.length < 1 || !foods.every(isFood)) throw new Error("饮食内容校验失败");
    if (!Array.isArray(articles) || articles.length < 1 || !articles.every(isArticle)) throw new Error("科普内容校验失败");

    const snapshot: ContentSnapshot = {
      version: manifest.contentVersion,
      publishedAt: manifest.publishedAt,
      checkedAt,
      foods,
      articles,
      source: "downloaded"
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    window.dispatchEvent(new CustomEvent(CONTENT_EVENT));
    return { status: "updated", snapshot };
  } catch (error) {
    return {
      status: "offline",
      snapshot: { ...current, checkedAt },
      message: error instanceof Error ? error.message : "暂时无法检查内容更新"
    };
  }
}

export function subscribeToContentUpdates(listener: () => void): () => void {
  window.addEventListener(CONTENT_EVENT, listener);
  return () => window.removeEventListener(CONTENT_EVENT, listener);
}
