const fs = require('fs');
const path = require('path').join(__dirname, '..', 'src', 'components', 'GalleryList.tsx');
let c = fs.readFileSync(path, 'utf8');

// Find the desktop section and replace it line by line
const lines = c.split('\n');

// Find the line with "Desktop — horizontal card"
const desktopStartIdx = lines.findIndex(l => l.includes('Desktop — horizontal card'));
if (desktopStartIdx >= 0) {
  console.log('Found desktop section at line', desktopStartIdx + 1);
  
  // Find the div with aspect-[4/3] within the next 15 lines
  let aspectIdx = -1;
  for (let i = desktopStartIdx; i < Math.min(desktopStartIdx + 15, lines.length); i++) {
    if (lines[i].includes('aspect-[4/3]')) {
      aspectIdx = i;
      break;
    }
  }
  
  if (aspectIdx >= 0) {
    console.log('Found aspect div at line', aspectIdx + 1);
    
    // Find the closing </div> for this div (should be around 10 lines later)
    let closeIdx = -1;
    let depth = 1;
    for (let i = aspectIdx + 1; i < lines.length; i++) {
      if (lines[i].includes('<div')) depth++;
      if (lines[i].includes('</div>')) {
        depth--;
        if (depth === 0) {
          closeIdx = i;
          break;
        }
      }
    }
    
    if (closeIdx >= 0) {
      console.log('Found closing div at line', closeIdx + 1);
      
      // Replace the entire block
      const newLines = [
        '              <div className="relative aspect-[4/3] overflow-hidden rounded-xl">',
        '                <PhotoStack',
        '                  photos={entry.samplePhotos || [entry.coverImage]}',
        '                  title={entry.title}',
        '                  className="h-full w-full"',
        '                />',
        '                {/* 照片数量角标 */}',
        '                <div className="absolute bottom-2 right-2 z-10 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">',
        '                  {entry.photoCount} {t(\'photos\')}',
        '                </div>',
        '              </div>'
      ];
      
      const before = lines.slice(0, aspectIdx);
      const after = lines.slice(closeIdx + 1);
      const result = [...before, ...newLines, ...after];
      fs.writeFileSync(path, result.join('\n'));
      console.log('Replaced with PhotoStack');
    } else {
      console.log('Could not find closing div');
    }
  } else {
    console.log('Could not find aspect-[4/3] div');
  }
} else {
  console.log('Could not find desktop section');
}
