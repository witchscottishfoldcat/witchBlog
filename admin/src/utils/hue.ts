/*
 * 动态主题色相工具（主站签名系统）
 * 整站主色由 CSS 变量 --hue 驱动（见 design-tokens.css），
 * 此处负责持久化到 localStorage 并在运行时实时切换。
 */

const HUE_KEY = 'witchcat-hue';
export const DEFAULT_HUE = 350;

/** 配色升级：旧存储值（蓝紫系默认）一次性迁移到新默认色相；之后用户手动改色则尊重 */
const MIGRATION_KEY = 'witchcat-hue-migrated-v3';

/** 未迁移过则把存储的色相升级为新默认色相。返回最终生效的存储值 */
function migrateLegacyHue(raw: string | null): string | null {
  if (raw === null) return raw;
  try {
    if (localStorage.getItem(MIGRATION_KEY)) return raw;
    localStorage.setItem(MIGRATION_KEY, '1');
    localStorage.setItem(HUE_KEY, String(DEFAULT_HUE));
    return String(DEFAULT_HUE);
  } catch {
    return raw;
  }
}

export interface HuePreset {
  hue: number;
  name: string;
}

export const HUE_PRESETS: HuePreset[] = [
  { hue: 350, name: '玫红' },
  { hue: 330, name: '樱粉' },
  { hue: 25, name: '橘橙' },
  { hue: 160, name: '松绿' },
  { hue: 190, name: '青碧' },
  { hue: 215, name: '雾蓝' },
  { hue: 250, name: '靛紫' },
  { hue: 285, name: '紫罗兰' },
];

export function getHue(): number {
  try {
    const raw = migrateLegacyHue(localStorage.getItem(HUE_KEY));
    if (raw === null) return DEFAULT_HUE;
    const v = Number(raw);
    return Number.isFinite(v) && v >= 0 && v <= 360 ? v : DEFAULT_HUE;
  } catch {
    return DEFAULT_HUE;
  }
}

export function applyHue(hue: number): void {
  document.documentElement.style.setProperty('--hue', String(hue));
}

export function setHue(hue: number): void {
  const h = Math.round(((hue % 360) + 360) % 360);
  try {
    localStorage.setItem(HUE_KEY, String(h));
  } catch {
    /* 隐私模式下忽略写入失败 */
  }
  applyHue(h);
}
