/*
 * 站点品牌：标签页标题与 favicon。
 * 标题固定为完整名称；favicon 取自「网站配置」公开接口的 site_icon（免登录，
 * 登录页同样生效），拉取失败时保留 index.html 中的默认图标。
 */
import { Service } from '../services';

export const SITE_TITLE = 'WitchCat博客后台管理系统';

export async function applySiteBranding(): Promise<void> {
  document.title = SITE_TITLE;

  try {
    const config = await Service.readPublicSiteConfigApiV1SiteConfigPublicGet();
    const icon = config?.site_icon;
    if (icon) {
      setFavicon(icon);
    }
  } catch {
    /* 配置不可用时保持默认图标 */
  }
}

function setFavicon(href: string): void {
  // 移除既有 icon 链接（含 media/sizes 限定），换成配置的图标
  document.querySelectorAll('link[rel~="icon"]').forEach((el) => el.remove());
  const link = document.createElement('link');
  link.rel = 'icon';
  link.href = href;
  document.head.appendChild(link);
}
