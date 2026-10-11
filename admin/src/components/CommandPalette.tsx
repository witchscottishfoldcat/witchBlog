import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
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
  Image,
  Tv,
  Music2,
  Gamepad2,
  CalendarClock,
  Info,
  Settings,
  Shield,
  Plus,
  Sun,
  Moon,
  type LucideIcon,
} from 'lucide-react';
import { getTheme, setTheme } from '../utils/theme';
import './CommandPalette.css';

interface CommandItem {
  id: string;
  title: string;
  category: string;
  icon: LucideIcon;
  action: () => void;
  // 超管专属页面的导航项，非超管用户不展示
  superuserOnly?: boolean;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  isSuperuser: boolean;
}

export default function CommandPalette({ isOpen, onClose, isSuperuser }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const runAndClose = (fn: () => void) => {
    fn();
    onClose();
  };

  const commands: CommandItem[] = [
    // 快速动作
    {
      id: 'action-new-md',
      title: '新建文章 (Markdown)',
      category: '快速动作',
      icon: Plus,
      action: () => runAndClose(() => navigate('/md-files/new')),
    },
    {
      id: 'action-new-diary',
      title: '写新日记',
      category: '快速动作',
      icon: Plus,
      action: () => runAndClose(() => navigate('/diaries/new')),
    },
    {
      id: 'action-theme-toggle',
      title: '切换深色 / 浅色模式',
      category: '系统快捷',
      icon: getTheme() === 'dark' ? Sun : Moon,
      action: () =>
        runAndClose(() => {
          const next = getTheme() === 'dark' ? 'light' : 'dark';
          setTheme(next);
        }),
    },
    // 总览
    {
      id: 'nav-dashboard',
      title: '仪表板 (Dashboard)',
      category: '页面导航',
      icon: LayoutDashboard,
      action: () => runAndClose(() => navigate('/dashboard')),
    },
    {
      id: 'nav-profile',
      title: '个人资料 (Profile)',
      category: '页面导航',
      icon: User,
      action: () => runAndClose(() => navigate('/profile')),
    },
    // 内容管理
    {
      id: 'nav-md-files',
      title: '博客文章 (Markdown)',
      category: '页面导航',
      icon: FileText,
      action: () => runAndClose(() => navigate('/md-files')),
    },
    {
      id: 'nav-archives',
      title: '归档管理 (Archives)',
      category: '页面导航',
      icon: Archive,
      action: () => runAndClose(() => navigate('/archives')),
    },
    {
      id: 'nav-diaries',
      title: '日记 (Diaries)',
      category: '页面导航',
      icon: BookOpen,
      action: () => runAndClose(() => navigate('/diaries')),
    },
    {
      id: 'nav-links',
      title: '友情链接 (Links)',
      category: '页面导航',
      icon: Link2,
      action: () => runAndClose(() => navigate('/links')),
    },
    {
      id: 'nav-resource-links',
      title: '资源链接 (Resource Links)',
      category: '页面导航',
      icon: Library,
      action: () => runAndClose(() => navigate('/resource-links')),
    },
    {
      id: 'nav-timelines',
      title: '时间线 (Timelines)',
      category: '页面导航',
      icon: Clock,
      action: () => runAndClose(() => navigate('/timelines')),
    },
    {
      id: 'nav-skills',
      title: '技能管理 (Skills)',
      category: '页面导航',
      icon: Lightbulb,
      action: () => runAndClose(() => navigate('/skills')),
    },
    {
      id: 'nav-projects',
      title: '项目管理 (Projects)',
      category: '页面导航',
      icon: Rocket,
      action: () => runAndClose(() => navigate('/projects')),
    },
    // 兴趣收藏
    {
      id: 'nav-anime',
      title: '追番追剧 (Anime Watchlist)',
      category: '页面导航',
      icon: Tv,
      action: () => runAndClose(() => navigate('/anime-watchlist')),
    },
    {
      id: 'nav-albums',
      title: '相册 (Albums)',
      category: '页面导航',
      icon: Image,
      action: () => runAndClose(() => navigate('/albums')),
    },
    {
      id: 'nav-music',
      title: '音乐馆 (Music)',
      category: '页面导航',
      icon: Music2,
      action: () => runAndClose(() => navigate('/music')),
    },
    {
      id: 'nav-games',
      title: '游戏库 (Games)',
      category: '页面导航',
      icon: Gamepad2,
      action: () => runAndClose(() => navigate('/games')),
    },
    // 系统
    {
      id: 'nav-users',
      title: '用户管理 (Users)',
      category: '页面导航',
      icon: Users,
      superuserOnly: true,
      action: () => runAndClose(() => navigate('/users')),
    },
    {
      id: 'nav-tasks',
      title: '定时任务 (Scheduled Tasks)',
      category: '页面导航',
      icon: CalendarClock,
      superuserOnly: true,
      action: () => runAndClose(() => navigate('/scheduled-tasks')),
    },
    {
      id: 'nav-about',
      title: '关于文件 (About Files)',
      category: '页面导航',
      icon: Info,
      superuserOnly: true,
      action: () => runAndClose(() => navigate('/about-files')),
    },
    {
      id: 'nav-config',
      title: '全局网站配置 (Site Config)',
      category: '页面导航',
      icon: Settings,
      superuserOnly: true,
      action: () => runAndClose(() => navigate('/site-config')),
    },
    {
      id: 'nav-admin',
      title: '系统管理 (Admin)',
      category: '页面导航',
      icon: Shield,
      superuserOnly: true,
      action: () => runAndClose(() => navigate('/admin')),
    },
  ];

  const filtered = commands.filter(
    (cmd) =>
      (!cmd.superuserOnly || isSuperuser) &&
      (cmd.title.toLowerCase().includes(query.toLowerCase()) ||
        cmd.category.toLowerCase().includes(query.toLowerCase()))
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="cmd-palette-backdrop" onClick={onClose}>
      <div
        className="cmd-palette-dialog"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="cmd-palette-header">
          <Search size={18} className="cmd-palette-icon" />
          <input
            ref={inputRef}
            type="text"
            className="cmd-palette-input"
            placeholder="搜索页面或输入命令..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <span className="cmd-palette-shortcut-badge">ESC 关闭</span>
        </div>

        <div className="cmd-palette-list">
          {filtered.length === 0 ? (
            <div className="wc-empty" style={{ padding: '2rem 1rem' }}>
              未找到匹配的命令或页面
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  className={`cmd-palette-item ${isSelected ? 'selected' : ''}`}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className="cmd-palette-item-left">
                    <span className="cmd-palette-item-icon">
                      <Icon size={16} />
                    </span>
                    <span>{item.title}</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', opacity: 0.6 }}>{item.category}</span>
                </div>
              );
            })
          )}
        </div>

        <div className="cmd-palette-footer">
          <div className="cmd-palette-keys">
            <span>
              <span className="cmd-key">↑</span> <span className="cmd-key">↓</span> 选择
            </span>
            <span>
              <span className="cmd-key">↵</span> 跳转
            </span>
          </div>
          <span>WitchCat Command Palette</span>
        </div>
      </div>
    </div>
  );
}
