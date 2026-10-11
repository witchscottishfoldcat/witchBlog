# WitchCat 后台设计系统（主站风格版）

博客后台的现行设计系统，视觉整体移植自主站前端（witchcat-web）：
柔和浅色 + 蓝紫渐变 + 玻璃拟态 + 大圆角卡片。一套设计 tokens 支撑两个主题：

| 主题 | 启用方式 |
| --- | --- |
| 浅色（默认） | `:root`（无属性） |
| 暗色 | `<html data-theme="dark">` |

主题选择持久化在 `localStorage["witchcat-theme"]`，由 `index.html` 内联脚本在渲染前恢复（防闪烁），运行时通过 `src/utils/theme.ts` 切换。

---

## 1. 设计语言

- **主站同源**：色板、渐变配方、卡片/按钮/chip/输入框样式均照搬主站（蓝 `hsl(215,70%,L)` 主色阶 + 紫罗兰 `hsl(270,70%,60%)` 辅色）。
- **动态主题色相（主站签名系统）**：整套主色由 CSS 变量 `--hue` 驱动（`--primary-50~900 = hsl(var(--hue),45%,L)` 低饱和哑光，辅色 = `hue+55`），顶栏调色板按钮提供彩虹滑块 + 8 个预设色（默认玫红 350），拖动实时改变整站主题色。持久化 `localStorage["witchcat-hue"]`，`index.html` 内联脚本防闪烁恢复，运行时 API 为 `src/utils/hue.ts`（含旧配色的一次性迁移）。
- **极光流动背景 + 点阵纹理**：页面背景为低饱和纵向渐变，`body::before` 是三团 hue 联动的径向光斑（36s 缓慢漂移），`body::after` 是主站同款 22px 点阵（向底部渐隐）。
- **玻璃拟态**：侧边栏、顶栏、登录卡片、悬浮播放器为 `backdrop-blur` 半透明玻璃面。
- **圆角规律**：按钮 8px / 输入框 12px / 卡片 16px / 大容器 24px / chip 全圆角。
- **渐变是核心装饰**：渐变主按钮、渐变标题竖条（页面标题左侧 4px 竖条）、渐变文字、渐变分割线。
- **微交互**：列表行/统计卡错落入场（nth-child stagger）；主按钮 hover 流光扫过；卡片 hover 浮现 1px 渐变描边（mask 技术）；渐变块（logo/头像/统计图标/激活导航）8s 缓慢流动；全部遵守 `prefers-reduced-motion`。
- 单一主题源：所有组件只引用语义化 CSS 变量，禁止在页面 CSS 中硬编码色值。

## 2. 色彩 Tokens（`src/styles/design-tokens.css`）

### 主色阶（hue 驱动，两主题共用）

- `--hue`：整站色相源变量（默认 **350 玫红**——与全站暖红背景插画融合，渐变终点 = hue+55 ≈ 45 暖橙；旧默认 215 经一次性迁移升级，运行时由 `utils/hue.ts` 改写）
- `--primary-50 ~ 900`：`hsl(var(--hue), 45%, 95%→25%)` 11 级（45% 低饱和哑光质感，去荧光）
- `--secondary` / `--secondary-light`：`hsl(calc(var(--hue) + 55), …)`，渐变终点
- 渐变配方：`--gradient-primary`（主按钮）、`--gradient-primary-br`（头像/logo 块）、`--gradient-accent-bar`（标题竖条）、`--gradient-text`（渐变文字）、`--gradient-divider`（分割线）
- 状态色 success/error/warning 为固定色相（不随 --hue 变化），info 跟随主色

### 语义色（按主题取值）

- 表面：`--bg-page(-start/-end)`、`--bg-card`（小控件实色）、`--bg-card-raised`（55% 半透明软底块：描述条/统计小块/媒体占位，融于玻璃语系）、`--bg-hover`、`--bg-active`、`--bg-tag`、`--bg-code`
- 文本：`--text-primary / --text-secondary / --text-tertiary / --text-on-primary`
- 边界：`--border`（常规）、`--hairline`（分隔线）
- 玻璃：`--glass-bg / --glass-border / --glass-blur`；聚焦光环 `--ring`
- 玻璃平板/浮起分区/弹窗：`--bg-card-glass`（整页内容平板 `.content-wrapper`，清透可见背景）、`--bg-inset` / `--border-inset`（平板内的浮起分区：卡片/统计/面板/表格/列表，亮主题更亮、暗主题微亮，形成层次）、`--bg-modal-glass`（弹窗/登录卡）、`--card-blur`（3px，近无形）/ `--inset-blur`（6px，分区托文字）/ `--modal-blur`（20px）；小控件仍用实色 `--bg-card`
- 状态：`--state-success/error/warning/info` 各含 `*-surface`（底）与 `*-foreground`（字）
- 阴影：`--shadow-sm/md/lg/xl/modal`（slate 系；暗色主题为深黑投影）

## 3. 字体

- 正文：`--font-sans`（系统字体栈 + PingFang/微软雅黑）
- 展示：`--font-display`（ZCOOL KuaiLe，Google Fonts CDN 引入，失败回退系统字体），仅用于品牌标识（侧边栏/登录页站名）
- 代码/日志/调度表达式：`--font-mono`

## 4. 组件规范（`src/styles/witchcat-admin.css`，`wc-*` 前缀）

- **页面骨架**：`.wc-page`（进入动画）+ `.wc-page-header`（标题块 `.wc-page-heading` 垫磨砂底衬小胶囊；**标题与描述并排同一行基线对齐**（`.wc-page-title` 1.3rem + `.wc-page-subtitle` 内联），`.wc-accent-bar` 渐变竖条 1.6rem）+ 右侧 `.wc-page-actions`——操作区按钮/选项卡统一压缩为一排小胶囊：`.wc-btn` 0.78rem 字 + radius-full + 14px 图标，`.wc-tabs/.wc-tab` 同步收窄；**主按钮弱化**：`.wc-page-actions .wc-btn-primary` 呈现为 secondary 同款（`--bg-active` 底 + primary 字、无渐变无流光）
- **按钮**：`.wc-btn-primary`（哑光渐变 + 阴影，hover 上浮）、`.wc-btn-secondary`（primary-100 底 + primary-700 字）、`.wc-btn-ghost`（描边）、`.wc-btn-danger`；尺寸 `.wc-btn-sm`；图标按钮 `.wc-icon-btn(-danger)`（胶囊底 `--bg-card-raised` + 圆形，插画上也可读）；active 统一 `scale(0.95/0.9)`
- **卡片**：`.wc-card`（平板上的浮起分区：`--bg-inset` + `--border-inset` + 轻阴影），`.wc-card-hover`（hover 上浮）、`.wc-card-pad`、`.wc-card-header`（`.wc-card-title`/`.wc-card-subtitle`）+ `.wc-card-body`；区块小标题 `.wc-section-title`（自带渐变竖条）
- **列表**：`.wc-list`（浮起分区：`--bg-inset` + `--border-inset`）+ `.wc-list-row(-main/-title/-desc/-meta/-actions)`（行垫 `--bg-inset` 磨砂底衬；标题/元信息为 `--bg-card-raised` **胶囊底**（负 margin 抵消行高），行间 hairline 分隔、hover 变 `--bg-hover`），行封面 `.wc-list-row-media`
- **表单**：`.wc-form` / `.wc-form-grid`（两列，`.wc-field-span` 跨列）；`.wc-input/.wc-textarea/.wc-select`（聚焦 = primary 描边 + `--ring` 光环；select 自定义下拉箭头）；`.wc-input-group`（输入+按钮内联）；`.wc-check/.wc-check-row`（复选）；`.wc-form-actions`、`.wc-help`、`.wc-error-text`、`.wc-required`
- **标签/徽章**：`.wc-tag`（主站 chip 配方）、`.wc-badge-success/warning/danger/info/muted`；可点筛选 `.wc-chip(-active)` + `.wc-chip-row`
- **工具栏**：`.wc-toolbar`、`.wc-search`（图标内嵌）+ `.wc-search-input`
- **统计**：`.wc-stats-grid` + `.wc-stat`（`.wc-stat-icon` 渐变块 / `-body` / `-value` / `-label`）
- **折叠面板**：`.wc-panel` + `.wc-panel-header`（`.open` 时 `.wc-panel-toggle` 箭头旋转）+ `.wc-panel-body`
- **分页**：`.wc-pagination-btn`（`.active` 为渐变实心）、`.wc-pagination-info`
- **空态/加载/骨架**：`.wc-empty(-icon)` / `.wc-loading`（配 `.wc-spinner`）/ `.wc-skeleton`（shimmer）
- **选项卡**：`.wc-tabs` + `.wc-tab(-active)`（激活为渐变实心）
- **模态框**：`.wc-modal-overlay`（backdrop blur）> `.wc-modal` > `-header/-body/-footer`，进入为 scale-in 回弹动画
- **表格**：`.wc-table-wrap` + `.wc-table`
- **提示横幅**：`.wc-alert-error/-success/-info`
- **工具**：`.wc-divider`（渐变线）、`.wc-link`、`.wc-gradient-text`

## 5. 布局组件（主站骨架）

- **浮动骨架**（`Layout.css`）：无传统侧栏/顶栏，三件式悬浮玻璃组件——左上 `.float-brand` 品牌胶囊（流动渐变 logo + 渐变站名，hover 上浮）、右上 `.float-actions` 操作组（主题色相选择器 / 明暗切换 / 用户菜单，玻璃圆形按钮 + `wc-scale-in` 弹层）、右下 `.nav-dock` **悬浮导航盘**。品牌图标为 `src/components/WitchCatIcon.tsx`（女巫帽剪影 SVG：高挑锥帽、尖梢弯折、宽帽檐，整体倾斜 10°），**无底块、图标本体填充主题渐变**（SVG defs 引用 `var(--primary-500)`/`var(--secondary)`，每实例独立渐变 id），登录品牌 / 品牌胶囊 / FAB 三处共用
- **导航盘**：玻璃圆形 FAB（呼吸光环），常态半藏在右下角（`translate(16%,16%) scale(.92)` 只露一部分），中央为渐变 WitchCat 图标；可悬停设备 hover 即展开，触屏设备点击 FAB 锁定展开（图标 WitchCatIcon ↔ X）。点击固定后点菜单项跳页仍保持展开，只有再点 FAB 或点遮罩才收起。菜单为**同心环形扇出**：4 个分组按项数升序套入 4 层圆环（半径 5.2/8.2/11.2/14.2rem），沿左上对角线（225°）对称展开，角步长按「相邻项弦长 ≈ 2.9rem」反推、单环张角 ≤84°（几何计算在 `Layout.tsx` 的 `ringItems`）；菜单项收拢时缩在 FAB 中心，展开带错落延迟（每项 22ms 递增），收拢延迟 260ms 容错指针过隙。图标圆形玻璃按钮，当前页渐变实心 + `wc-shimmer` 流光，hover 项抬层级并浮出文字标签；容器 `pointer-events: none` 只让按钮/菜单项响应，避免扇形区遮挡页面
- **内容区**：整页内容置于一块**固定满高的近无形玻璃平板**（`.content-wrapper`：`--bg-card-glass`（亮 .07 / 暗 .15）+ 3px 微模糊 + 玻璃描边 + radius-xl + 大阴影，max-width 1400px 居中），背景插画近乎直出；**页面无滚动条**（`.main-content` 100vh + overflow hidden + flex），长内容在平板内部滚动（`flex:1 + min-height:0 + overflow-y:auto`）；平板内的卡片/统计/面板/表格/列表用 `--bg-inset` + 6px 分区模糊浮起，托住文字并形成层次（平板 < 分区 < 控件三级）。音乐页悬浮播放器（`.music-player-fixed`）抬高至 `bottom: 5.75rem` 并降级 `z-index: 50`，避让 FAB 与环形展开区
- **移动端**（≤640px）：胶囊与按钮收窄、品牌副标题隐藏，导航盘点击展开全宽面板
- **登录页**（`Login.css` / `login-form.css`）：全站背景插画 + 纱层 + 淡色漂浮光斑（hue 联动，不喧宾夺主）+ **底部 4 层 SVG 波浪动画**（主站 Hero 同款，7s/10s/13s/20s 交错漂移）+ 居中毛玻璃卡片（`--bg-modal-glass`）+ 渐变主按钮；品牌为渐变 logo 块 + ZCOOL KuaiLe 渐变站名

## 6. 工具类（`src/index.css`）

- `.glass`、`.text-gradient`、`.animate-in`（上浮淡入）、`.skeleton-pulse`
- 全局：`::selection` 主色、细滚动条（hover 变 primary-300）、背景插画在 `body::before` 固定伪元素层（`inset: -6%` 负边距，永远铺满视口——比 `background-attachment: fixed` 可靠，长页面底部不露画布白边）+ `bg-drift` Ken Burns 漂移动效（36s 往返，轻微平移 + 1.06→1.12 缩放，负边距防露边，`prefers-reduced-motion` 关闭）。注意 `body` 必须带 `isolation: isolate`，否则负 z-index 背景层会被 body 实色背景盖住（整页发白）；直接压在插画上的文字用柔光托底（`text-shadow` 双层，渐变文字用 `filter: drop-shadow`）
- 微交互（`witchcat-admin.css`）：`.wc-list`/`.wc-stats-grid` 子项错落入场、`.wc-btn-primary::after` 流光、`.wc-card-hover::before` 渐变描边、`.wc-stat-icon` 与品牌渐变块 `gradient-pan` 流动

## 7. 新增/修改规范

1. 新组件一律使用语义化 token，禁止硬编码 hex/rgb/hsl 色值（recharts 等 JS/SVG 场景用 `var(--primary-500)` 形式的 var() 引用）。
2. 需要主题差异化时，在 `[data-theme='dark']` 块内覆盖，不要写两套组件样式。
3. 页面级样式放页面 CSS 并 `@import '../styles/witchcat-admin.css'`，优先复用共享 `wc-*` 类。
4. 图标统一使用 lucide-react，禁止 emoji 图标。
