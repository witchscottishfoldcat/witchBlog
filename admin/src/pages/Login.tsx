import { useEffect, useState } from 'react';
import LoginForm from '../components/login-form';
import { Service } from '../services';
import './Login.css';

export default function Login() {
  const [siteIcon, setSiteIcon] = useState<string | null>(null);

  // 读取后端站点图标（公开接口，免登录）：有则用站点配置的图标，无则回退品牌默认图标
  useEffect(() => {
    Service.readPublicSiteConfigApiV1SiteConfigPublicGet()
      .then((res) => {
        if (res?.site_icon) setSiteIcon(res.site_icon);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="login-page-container">
      {/* 主站风格装饰光斑（纯视觉层） */}
      <div className="login-orb login-orb-1" aria-hidden="true" />
      <div className="login-orb login-orb-2" aria-hidden="true" />
      <div className="login-orb login-orb-3" aria-hidden="true" />

      {/* 主站 Hero 同款底部多层波浪（纯视觉层） */}
      <div className="login-waves" aria-hidden="true">
        <svg className="login-wave login-wave-1" viewBox="0 0 2880 120" preserveAspectRatio="none">
          <path d="M0,64 C240,96 480,32 720,64 C960,96 1200,32 1440,64 C1680,96 1920,32 2160,64 C2400,96 2640,32 2880,64 L2880,120 L0,120 Z" />
        </svg>
        <svg className="login-wave login-wave-2" viewBox="0 0 2880 120" preserveAspectRatio="none">
          <path d="M0,72 C240,44 480,100 720,72 C960,44 1200,100 1440,72 C1680,44 1920,100 2160,72 C2400,44 2640,100 2880,72 L2880,120 L0,120 Z" />
        </svg>
        <svg className="login-wave login-wave-3" viewBox="0 0 2880 120" preserveAspectRatio="none">
          <path d="M0,56 C240,88 480,40 720,56 C960,88 1200,40 1440,56 C1680,88 1920,40 2160,56 C2400,88 2640,40 2880,56 L2880,120 L0,120 Z" />
        </svg>
        <svg className="login-wave login-wave-4" viewBox="0 0 2880 120" preserveAspectRatio="none">
          <path d="M0,68 C240,52 480,92 720,68 C960,52 1200,92 1440,68 C1680,52 1920,92 2160,68 C2400,52 2640,92 2880,68 L2880,120 L0,120 Z" />
        </svg>
      </div>

      <div className="login-content">
        {/* 品牌标识 */}
        <div className="login-brand">
          {siteIcon && (
            <div className="login-brand-logo">
              <img src={siteIcon} alt="Site Icon" className="login-brand-site-icon" />
            </div>
          )}
          <span className="login-brand-name">WitchCat</span>
          <span className="login-brand-sub">博客管理后台</span>
        </div>

        {/* 登录表单 */}
        <LoginForm />

        <p className="login-footer">WitchCat Blog · 管理你的内容与世界</p>
      </div>
    </div>
  );
}
