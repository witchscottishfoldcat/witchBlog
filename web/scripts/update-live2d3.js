const fs = require('fs');
const path = require('path').join(__dirname, '..', 'src', 'components', 'Live2DViewer.tsx');
let c = fs.readFileSync(path, 'utf8');

// Replace the widget div with hover events and floating button
const oldWidget = `        <div
          className="live2d-widget relative flex items-center justify-center overflow-hidden rounded-tl-lg bg-transparent w-[min(92px,26vw)] h-[min(108px,18vh)] min-w-[84px] min-h-[96px] max-w-[min(104px,28vw)] max-h-[min(120px,22vh)] sm:w-[min(200px,22vw)] sm:h-[min(240px,32vh)] sm:min-w-[180px] sm:min-h-[220px] sm:max-w-[min(240px,28vw)] sm:max-h-[min(280px,38vh)]"
        >
          <div
            ref={containerRef}
            className="absolute inset-0"
            style={{ width: '100%', height: '100%' }}
          />
          {/* 不再显示加载中文字，模型在后台静默加载，就绪后直接播放入场动画 */}
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
          {/* 悬停时头顶显示小按钮 */}
          <button
            type="button"
            onClick={() => setVisible(false)}
            className={\`pointer-events-auto absolute left-1/2 top-1 -translate-x-1/2 rounded-full bg-black/40 p-1.5 text-white/90 backdrop-blur-sm transition-all duration-200 hover:bg-black/60 sm:top-2 sm:p-2 dark:bg-white/30 dark:text-black/90 dark:hover:bg-white/50 \${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'}\`}
            title="隐藏看板娘"
          >
            <Icon icon="mdi:eye-off-outline" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        </div>`;

if (c.includes(oldWidget)) {
  c = c.replace(oldWidget, newWidget);
  fs.writeFileSync(path, c);
  console.log('Updated successfully');
} else {
  console.log('Old widget not found, trying line-by-line replacement');
  
  // Try to find the exact lines and replace
  const lines = c.split('\n');
  const startIdx = lines.findIndex(l => l.includes('live2d-widget relative flex items-center'));
  if (startIdx >= 0) {
    console.log('Found widget at line', startIdx + 1);
    // Find the closing div
    let endIdx = startIdx;
    let depth = 1;
    for (let i = startIdx + 1; i < lines.length; i++) {
      if (lines[i].includes('<div')) depth++;
      if (lines[i].includes('</div>')) depth--;
      if (depth === 0) { endIdx = i; break; }
    }
    console.log('Widget ends at line', endIdx + 1);
    
    const newLines = [
      '        <div',
      '          className="live2d-widget group/live2d relative flex items-center justify-center overflow-hidden rounded-tl-lg bg-transparent w-[min(92px,26vw)] h-[min(108px,18vh)] min-w-[84px] min-h-[96px] max-w-[min(104px,28vw)] max-h-[min(120px,22vh)] sm:w-[min(200px,22vw)] sm:h-[min(240px,32vh)] sm:min-w-[180px] sm:min-h-[220px] sm:max-w-[min(240px,28vw)] sm:max-h-[min(280px,38vh)]"',
      '          onMouseEnter={() => setIsHovered(true)}',
      '          onMouseLeave={() => setIsHovered(false)}',
      '        >',
      '          <div',
      '            ref={containerRef}',
      '            className="absolute inset-0"',
      '            style={{ width: \'100%\', height: \'100%\' }}',
      '          />',
      '          {/* 悬停时头顶显示小按钮 */}',
      '          <button',
      '            type="button"',
      '            onClick={() => setVisible(false)}',
      '            className={`pointer-events-auto absolute left-1/2 top-1 -translate-x-1/2 rounded-full bg-black/40 p-1.5 text-white/90 backdrop-blur-sm transition-all duration-200 hover:bg-black/60 sm:top-2 sm:p-2 dark:bg-white/30 dark:text-black/90 dark:hover:bg-white/50 ${isHovered ? \'opacity-100 translate-y-0\' : \'opacity-0 -translate-y-1\'}`}',
      '            title="隐藏看板娘"',
      '          >',
      '            <Icon icon="mdi:eye-off-outline" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />',
      '          </button>',
      '        </div>'
    ];
    
    const before = lines.slice(0, startIdx);
    const after = lines.slice(endIdx + 1);
    const result = [...before, ...newLines, ...after];
    fs.writeFileSync(path, result.join('\n'));
    console.log('Replaced using line-based approach');
  } else {
    console.log('Could not find widget div');
  }
}
