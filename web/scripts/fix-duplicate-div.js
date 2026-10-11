const fs = require('fs');
const path = require('path').join(__dirname, '..', 'src', 'components', 'Live2DViewer.tsx');
let c = fs.readFileSync(path, 'utf8');

// Fix duplicate <div> on line 400-401
const oldText = '        <div\n        <div\n          className="live2d-widget group/live2d relative';
const newText = '        <div\n          className="live2d-widget group/live2d relative';

if (c.includes(oldText)) {
  c = c.replace(oldText, newText);
  fs.writeFileSync(path, c);
  console.log('Fixed duplicate div');
} else {
  console.log('Pattern not found, trying alternative');
  // Try removing the extra <div> line
  const lines = c.split('\n');
  for (let i = 0; i < lines.length - 1; i++) {
    if (lines[i].trim() === '<div' && lines[i+1].trim() === '<div') {
      console.log('Found duplicate div at lines', i+1, 'and', i+2);
      lines.splice(i, 1);
      fs.writeFileSync(path, lines.join('\n'));
      console.log('Removed duplicate div');
      break;
    }
  }
}
