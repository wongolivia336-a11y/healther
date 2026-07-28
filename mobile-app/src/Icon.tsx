import type { CSSProperties } from "react";

export const iconCatalog = {
  home: "home",
  records: "file-text",
  food: "utensils",
  learn: "book-open",
  mine: "settings",
  back: "arrow-left",
  next: "chevron-right",
  add: "plus",
  close: "x",
  bell: "bell",
  calendar: "calendar",
  time: "clock",
  camera: "camera",
  gallery: "image",
  upload: "upload",
  download: "download",
  microphone: "mic",
  stop: "square",
  play: "play",
  pause: "pause",
  trend: "chart-line",
  database: "database",
  privacy: "shield-check",
  refresh: "refresh-cw",
  external: "external-link",
  info: "info",
  visit: "notebook-tabs",
  tag: "tag",
  success: "circle-check",
  warning: "triangle-alert",
  lock: "lock-keyhole",
  edit: "pencil",
  delete: "trash-2",
  more: "ellipsis",
  checklist: "clipboard-list"
} as const;

export type IconName = keyof typeof iconCatalog;

export function Icon({ name, size = 20, className = "" }: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  const style = {
    width: size,
    height: size,
    "--icon-url": `url("/assets/icons/lucide/${iconCatalog[name]}.svg")`
  } as CSSProperties;
  return <i className={`ui-icon ${className}`} style={style} aria-hidden="true" />;
}
