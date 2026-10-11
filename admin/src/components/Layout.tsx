import { useEffect, useState } from 'react';
import CommandPalette from './CommandPalette';
import { getCurrentUser } from '../utils/auth';
import { getTheme, setTheme, type Theme } from '../utils/theme';
import { getHue, setHue } from '../utils/hue';
import type { User as UserModel } from '../services/models/User';
import Sidebar from './Sidebar';
import TopIsland from './TopIsland';
import './Layout.css';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [cmdOpen, setCmdOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  
  const [user, setUser] = useState<UserModel | null>(null);
  const [theme, setThemeState] = useState<Theme>(() => getTheme());
  const [hue, setHueState] = useState<number>(() => getHue());

  useEffect(() => {
    getCurrentUser().then(setUser).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleTheme = () => {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    setThemeState(next);
  };

  const handleHueChange = (next: number) => {
    setHue(next);
    setHueState(next);
  };

  return (
    <div className="layout">
      {/* 悬浮侧边栏 */}
      <Sidebar
        isExpanded={sidebarExpanded}
        onToggle={() => setSidebarExpanded(!sidebarExpanded)}
        isSuperuser={!!user?.is_superuser}
      />

      {/* 顶部动态岛 (原右上方操作组) */}
      <TopIsland
        onOpenCmd={() => setCmdOpen(true)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        hue={hue}
        onHueChange={handleHueChange}
        user={user}
      />

      {/* 命令盘 / 快捷导航 Modal */}
      <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} isSuperuser={!!user?.is_superuser} />

      {/* 居中内容容器 */}
      <main className={`main-content ${sidebarExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
        <div className="content-wrapper">{children}</div>
      </main>
    </div>
  );
}
