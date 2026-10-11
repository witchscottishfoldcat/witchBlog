import { useState, useRef, useEffect } from 'react';
import {
  Search,
  Palette,
  Sun,
  Moon,
  User,
  Check,
  Sparkles,
  LogOut,
  Minus,
} from 'lucide-react';
import { logout } from '../utils/auth';
import type { User as UserModel } from '../services/models/User';
import type { Theme } from '../utils/theme';
import { HUE_PRESETS } from '../utils/hue';
import './TopIsland.css';

interface TopIslandProps {
  onOpenCmd: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  hue: number;
  onHueChange: (next: number) => void;
  user: UserModel | null;
}

type IslandState = 'idle' | 'hue' | 'user';
type IslandMode = 'ball' | 'panel';

interface BallPos {
  x: number;
  y: number;
}

const BALL_SIZE = 48;
const BALL_POS_KEY = 'island-ball-pos';
/** 拖拽视为移动（而非点击）的位移阈值 */
const DRAG_THRESHOLD = 4;

function clampBall(pos: BallPos): BallPos {
  const maxX = Math.max(8, window.innerWidth - BALL_SIZE - 8);
  const maxY = Math.max(8, window.innerHeight - BALL_SIZE - 8);
  return {
    x: Math.min(Math.max(8, pos.x), maxX),
    y: Math.min(Math.max(8, pos.y), maxY),
  };
}

function defaultBallPos(): BallPos {
  // 默认停在屏幕顶部居中（灵动岛位置），展开时面板向下弹出
  return {
    x: (window.innerWidth - BALL_SIZE) / 2,
    y: 16,
  };
}

function loadBallPos(): BallPos {
  try {
    const raw = localStorage.getItem(BALL_POS_KEY);
    if (raw) return clampBall(JSON.parse(raw) as BallPos);
  } catch {
    // 本地存储不可用时使用默认位置
  }
  return defaultBallPos();
}

/** 悬浮球展开为面板时的位置：面板以球为水平中心向下弹出，整体钳制在视口内 */
function panelPosForBall(ball: BallPos): BallPos {
  return {
    x: Math.min(Math.max(16, ball.x + BALL_SIZE / 2 - 160), Math.max(16, window.innerWidth - 336)),
    y: Math.min(Math.max(16, ball.y + BALL_SIZE - 24), Math.max(16, window.innerHeight - 240)),
  };
}

export default function TopIsland({
  onOpenCmd,
  theme,
  onToggleTheme,
  hue,
  onHueChange,
  user,
}: TopIslandProps) {
  const [islandState, setIslandState] = useState<IslandState>('idle');
  const [mode, setMode] = useState<IslandMode>('ball');
  const [ballPos, setBallPos] = useState<BallPos>(loadBallPos);
  const [panelPos, setPanelPos] = useState<BallPos>(defaultBallPos);
  const [dragging, setDragging] = useState(false);
  const islandRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
  });

  // 点击外部关闭展开的岛屿
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (islandRef.current && !islandRef.current.contains(e.target as Node)) {
        setIslandState('idle');
      }
    };
    if (mode === 'panel' && islandState !== 'idle') {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mode, islandState]);

  const toggleState = (target: IslandState) => {
    setIslandState(prev => (prev === target ? 'idle' : target));
  };

  const onBallPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current = {
      active: true,
      moved: false,
      startX: e.clientX,
      startY: e.clientY,
      origX: ballPos.x,
      origY: ballPos.y,
    };
    setDragging(true);
  };

  const onBallPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragState.current;
    if (!drag.active) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (!drag.moved && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) {
      drag.moved = true;
    }
    if (drag.moved) {
      setBallPos(clampBall({ x: drag.origX + dx, y: drag.origY + dy }));
    }
  };

  const onBallPointerUp = () => {
    const drag = dragState.current;
    if (!drag.active) return;
    drag.active = false;
    setDragging(false);
    if (drag.moved) {
      // 拖拽结束：记住位置，下次进入保持
      try {
        localStorage.setItem(BALL_POS_KEY, JSON.stringify(ballPos));
      } catch {
        // 本地存储不可用时忽略
      }
    } else {
      // 原地点击：展开为工具条面板
      setPanelPos(panelPosForBall(ballPos));
      setMode('panel');
    }
  };

  if (mode === 'ball') {
    return (
      <div
        className={`island-fab${dragging ? ' dragging' : ''}`}
        style={{ left: ballPos.x, top: ballPos.y, width: BALL_SIZE, height: BALL_SIZE }}
        onPointerDown={onBallPointerDown}
        onPointerMove={onBallPointerMove}
        onPointerUp={onBallPointerUp}
        title="拖拽移动 · 点击展开"
      >
        <Sparkles size={20} />
      </div>
    );
  }

  return (
    <div
      className={`dynamic-island ${islandState !== 'idle' ? 'expanded' : ''} state-${islandState}`}
      style={{ left: panelPos.x, top: panelPos.y, right: 'auto', width: 320 }}
      ref={islandRef}
    >
      {/* 默认栏：左侧搜索，右侧操作 */}
      <div className="island-base-bar">
        <button
          className="island-search-btn"
          onClick={onOpenCmd}
          title="搜索命令 (Ctrl+K)"
        >
          <Search size={14} className="text-secondary" />
          <span className="search-placeholder">Search...</span>
        </button>

        <div className="island-actions">
          <button
            className={`island-icon-btn ${islandState === 'hue' ? 'active' : ''}`}
            onClick={() => toggleState('hue')}
            title="主题色相"
          >
            <Palette size={15} />
          </button>

          <button
            className="island-icon-btn"
            onClick={onToggleTheme}
            title={theme === 'dark' ? '切换浅色' : '切换深色'}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          <button
            className={`island-user-btn ${islandState === 'user' ? 'active' : ''}`}
            onClick={() => toggleState('user')}
          >
            <div className="island-avatar">
              <User size={14} />
            </div>
          </button>

          <button
            className="island-icon-btn"
            onClick={() => setMode('ball')}
            title="收起为悬浮球"
          >
            <Minus size={15} />
          </button>
        </div>
      </div>

      {/* 扩展区域：色相调整 */}
      <div className="island-expanded-content hue-content">
        <div className="hue-header">
          <span>Theme Hue</span>
          <span className="hue-value">{hue}°</span>
        </div>
        <input
          type="range"
          min={0}
          max={360}
          value={hue}
          onChange={(e) => onHueChange(Number(e.target.value))}
          className="hue-slider-island"
        />
        <div className="hue-presets-island">
          {HUE_PRESETS.map((preset) => (
            <button
              key={preset.hue}
              className={`hue-dot-island ${hue === preset.hue ? 'active' : ''}`}
              style={{ background: `hsl(${preset.hue}, 70%, 60%)` }}
              onClick={() => onHueChange(preset.hue)}
              title={preset.name}
            >
              {hue === preset.hue && <Check size={10} />}
            </button>
          ))}
        </div>
      </div>

      {/* 扩展区域：用户信息 */}
      <div className="island-expanded-content user-content">
        <div className="user-profile-header">
          <div className="user-profile-avatar">
            <User size={24} />
          </div>
          <div className="user-profile-info">
            <p className="user-name">{user?.username || 'Admin User'}</p>
            <p className="user-role"><Sparkles size={10} /> 管理员</p>
          </div>
          <button className="island-logout-btn" onClick={() => logout()} title="退出登录">
            <LogOut size={15} />
            <span>退出</span>
          </button>
        </div>
      </div>
    </div>
  );
}
