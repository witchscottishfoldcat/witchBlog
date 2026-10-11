const fs = require('fs');
const path = require('path').join(__dirname, '..', 'src', 'components', 'Live2DViewer.tsx');
let c = fs.readFileSync(path, 'utf8');

// 1. Add Icon import
if (!c.includes("import { Icon }")) {
  c = c.replace(
    "import Script from 'next/script'",
    "import Script from 'next/script'\nimport { Icon } from '@iconify/react'"
  );
}

// 2. Add isHovered state
if (!c.includes('const [isHovered, setIsHovered]')) {
  c = c.replace(
    '  const [hasAppeared, setHasAppeared] = useState(false)',
    '  const [hasAppeared, setHasAppeared] = useState(false)\n  const [isHovered, setIsHovered] = useState(false)'
  );
}

// 3. Replace widget container
const oldWidget = `        <div
          className="live2d-widget relative flex items-center justify-center overflow-hidden rounded-tl-lg bg-transparent w-[min(92px,26vw)] h-[min(108px,18vh)] min-w-[84px] min-h-[96px] max-w-[min(104px,28vw)] max-h-[min(120px,22vh)] sm:w-[min(200px,22vw)] sm:h-[min(240px,32vh)] sm:min-w-[180px] sm:min-h-[220px] sm:max-w-[min(240px,28vw)] sm:max-h-[min(280px,38vh)]"
        >
          <div
            ref={containerRef}
            className="absolute inset-0"
            style={{ width: '100%', height: '100%' }}
          />
          {/* \u4E0D\u518D\u663E\u793A\u52A0\u8F7D\u4E2D\u6587\u5B57\uFF0C\u6A21\u578B\u5728\u540E\u53F0\u9759\u9ED8\u52A0\u8F7D\uFF0C\u5C31\u7EEA\u540E\u76F4\u63A5\u64AD\u653E\u5165\u573A\u52A8\u753B */}
        </div>`;

const newWidget = `        <div
          className="live2d-widget group/live2d relative flex items-center justify-center overflow-hidden rounded-tl-lg bg-transparent w-[min(92px,26vw)] h-[min(108px,18vh)] min-w-[84px] min-h-[96px] max-w-[min(104px,28vw)] max-h-[min(120px,22vh)] sm:w-[min(200px,22vw)] sm:h-[min(240px,32vh)] sm:min-w-[180px] sm:min-h-[220px] sm:max-w-[min(240px,28vw)] sm:max-h-[min(280px,38vh)]"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div
            ref={containerRef}
            className="absolute inset-0"
            style={{ width: '100%', height: '100%' }}
          />
          {/* \u60AC\u505C\u65F6\u5934\u9876\u663E\u793A\u5C0F\u6309\u94AE */}
          <button
            type="button"
            onClick={() => setVisible(false)}
            className={\`pointer-events-auto absolute left-1/2 top-1 -translate-x-1/2 rounded-full bg-black/40 p-1.5 text-white/90 backdrop-blur-sm transition-all duration-200 hover:bg-black/60 sm:top-2 sm:p-2 dark:bg-white/30 dark:text-black/90 dark:hover:bg-white/50 \${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'}\`}
            title="\u9690\u85CF\u770B\u677F\u5A18"
          >
            <Icon icon="mdi:eye-off-outline" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        </div>`;

c = c.replace(oldWidget, newWidget);

fs.writeFileSync(path, c);
console.log('Updated Live2DViewer.tsx');
