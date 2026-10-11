const fs = require('fs');
const path = require('path').join(__dirname, '..', 'src', 'components', 'GalleryList.tsx');
let c = fs.readFileSync(path, 'utf8');

// 1. Add PhotoStack import
if (!c.includes('import PhotoStack')) {
  c = c.replace(
    "import { getImageUrl, shouldUseNativeImg } from '@/lib/image-utils'",
    "import { getImageUrl, shouldUseNativeImg } from '@/lib/image-utils'\nimport PhotoStack from '@/components/PhotoStack'"
  );
}

// 2. Add samplePhotos field to GalleryEntry interface
if (!c.includes('samplePhotos?: string[]')) {
  c = c.replace(
    '  coverImage: string',
    '  coverImage: string\n  samplePhotos?: string[]'
  );
}

// 3. Replace desktop card image section with PhotoStack
const oldDesktopImage = `              <div className=\"relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-700\">
                <GalleryCoverThumb
                  coverImage={entry.coverImage}
                  title={entry.title}
                  noCoverLabel={t('noCover')}
                />
                {/* 照片数量角标 */}
                <div className=\"absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white\">
                  {entry.photoCount} {t('photos')}
                </div>
              </div>`;

const newDesktopImage = `              <div className=\"relative aspect-[4/3] overflow-hidden rounded-xl\">
                <PhotoStack
                  photos={entry.samplePhotos || [entry.coverImage]}
                  title={entry.title}
                  className=\"h-full w-full\"
                />
                {/* 照片数量角标 */}
                <div className=\"absolute bottom-2 right-2 z-10 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white\">
                  {entry.photoCount} {t('photos')}
                </div>
              </div>`;

if (c.includes(oldDesktopImage)) {
  c = c.replace(oldDesktopImage, newDesktopImage);
  console.log('Replaced desktop image with PhotoStack');
} else {
  console.log('Desktop image pattern not found');
}

fs.writeFileSync(path, c);
console.log('Updated GalleryList.tsx');
