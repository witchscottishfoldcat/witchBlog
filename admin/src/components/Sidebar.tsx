import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  FileText,
  Archive,
  BookOpen,
  Link2,
  Library,
  Clock,
  Users,
  Lightbulb,
  Rocket,
  Tv,
  Music2,
  Gamepad2,
  Image as ImageIcon,
  CalendarClock,
  Info,
  Settings,
  Shield,
  ChevronRight,
  Globe2,
  Radio,
  HeartHandshake,
  type LucideIcon,
} from 'lucide-react';
import { Service } from '../services';
import './Sidebar.css';

interface MenuItem {
  path: string;
  label: string;
  icon: LucideIcon;
  // 后端读接口即要求超管权限的页面，非超管用户不展示
  superuserOnly?: boolean;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    title: '总览',
    items: [
      { path: '/dashboard', label: '仪表板', icon: LayoutDashboard },
      { path: '/visitors', label: '访客分析', icon: Globe2, superuserOnly: true },
      { path: '/live-logs', label: '实时日志', icon: Radio, superuserOnly: true },
      { path: '/profile', label: '个人资料', icon: User },
    ],
  },
  {
    title: '内容管理',
    items: [
      { path: '/md-files', label: '博客文章', icon: FileText },
      { path: '/archives', label: '归档管理', icon: Archive },
      { path: '/diaries', label: '日记', icon: BookOpen },
      { path: '/links', label: '链接', icon: Link2 },
      { path: '/resource-links', label: '资源链接', icon: Library },
      { path: '/timelines', label: '时间线', icon: Clock },
      { path: '/skills', label: '技能管理', icon: Lightbulb },
      { path: '/projects', label: '项目管理', icon: Rocket },
    ],
  },
  {
    title: '兴趣收藏',
    items: [
      { path: '/anime-watchlist', label: '追番追剧', icon: Tv },
      { path: '/albums', label: '相册', icon: ImageIcon },
      { path: '/music', label: '音乐馆', icon: Music2 },
      { path: '/games', label: '游戏', icon: Gamepad2 },
      { path: '/sponsors', label: '赞助鸣谢', icon: HeartHandshake },
    ],
  },
  {
    title: '系统',
    items: [
      { path: '/users', label: '用户管理', icon: Users, superuserOnly: true },
      { path: '/scheduled-tasks', label: '定时任务', icon: CalendarClock, superuserOnly: true },
      { path: '/about-files', label: '关于文件', icon: Info, superuserOnly: true },
      { path: '/site-config', label: '网站配置', icon: Settings, superuserOnly: true },
      { path: '/admin', label: '系统管理', icon: Shield, superuserOnly: true },
    ],
  },
];

interface SidebarProps {
  isExpanded: boolean;
  onToggle: () => void;
  isSuperuser: boolean;
}

export default function Sidebar({ isExpanded, onToggle, isSuperuser }: SidebarProps) {
  const location = useLocation();
  const [siteIcon, setSiteIcon] = useState<string | null>(null);

  useEffect(() => {
    Service.readActiveSiteConfigApiV1SiteConfigActiveGet()
      .then((res) => {
        if (res?.site_icon) {
          setSiteIcon(res.site_icon);
        }
      })
      .catch(() => {});
  }, []);

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  // 非超管用户过滤掉超管专属菜单；整组为空时隐藏该组标题
  const visibleGroups = menuGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.superuserOnly || isSuperuser),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <aside className={`sidebar-glass ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="sidebar-header">
        <Link to="/dashboard" className="sidebar-brand">
          {siteIcon && (
            <div className="sidebar-brand-icon">
              <img src={siteIcon} alt="Site Icon" className="sidebar-site-icon-img" />
            </div>
          )}
          {isExpanded && (
            <div className="sidebar-brand-text">
              <span className="brand-title">WitchCat</span>
            </div>
          )}
        </Link>
        <button
          className="sidebar-toggle-btn"
          onClick={onToggle}
          title={isExpanded ? '收起侧边栏' : '展开侧边栏'}
        >
          <ChevronRight size={16} className="toggle-icon" />
        </button>
      </div>

      <div className="sidebar-scroll-area">
        <div className="sidebar-nav">
          {visibleGroups.map((group, gIdx) => (
            <div key={gIdx} className="sidebar-group">
              {isExpanded && <h4 className="sidebar-group-title">{group.title}</h4>}
              {(!isExpanded && gIdx > 0) && <div className="sidebar-group-divider" />}
              <ul className="sidebar-menu">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        className={`sidebar-menu-item ${active ? 'active' : ''}`}
                        title={!isExpanded ? item.label : undefined}
                      >
                        <Icon size={18} className="menu-icon" />
                        {isExpanded && <span className="menu-label">{item.label}</span>}
                        {active && isExpanded && <div className="menu-active-indicator" />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
