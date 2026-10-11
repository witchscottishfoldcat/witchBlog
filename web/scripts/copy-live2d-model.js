/**
 * 将 Sherry 看板娘 Live2D 模型从下载目录复制到 public/live2d/sherry/
 * 请先下载模型到 Downloads 或修改下方 SOURCE 路径后执行: node scripts/copy-live2d-model.js
 */
const fs = require('fs');
const path = require('path');

const SOURCE = path.join(
  process.env.USERPROFILE || process.env.HOME,
  'Downloads',
  'Sherry橘雪莉_-_Mandou',
  'SherryModel'
);
const DEST = path.join(__dirname, '..', 'public', 'live2d', 'sherry');

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) {
    console.error('源目录不存在:', src);
    process.exit(1);
  }
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const e of entries) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) {
      copyRecursive(s, d);
    } else {
      fs.copyFileSync(s, d);
      console.log('Copied:', e.name);
    }
  }
}

// 复制整个 SherryModel 到 public/live2d/sherry
copyRecursive(SOURCE, DEST);

// 写一份无 DisplayInfo 的 model3.json，避免缺少 cdi3 文件报错
const model3Path = path.join(DEST, 'Sherry - Model.model3.json');
if (fs.existsSync(model3Path)) {
  const json = JSON.parse(fs.readFileSync(model3Path, 'utf8'));
  if (json.FileReferences && json.FileReferences.DisplayInfo) {
    delete json.FileReferences.DisplayInfo;
    fs.writeFileSync(model3Path, JSON.stringify(json, null, 0));
    console.log('Updated model3.json (removed optional DisplayInfo)');
  }
}
console.log('Done. Model is at public/live2d/sherry/');
