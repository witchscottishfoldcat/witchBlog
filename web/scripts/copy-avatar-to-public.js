/**
 * 将 src 中的头像复制到 public，供启动加载页使用
 * 保证启动加载图与导航栏头像是同一张图
 */

const fs = require('fs')
const path = require('path')

const srcAvatar = path.join(process.cwd(), 'src', 'assets', 'images', 'avatar.webp')
const outDir = path.join(process.cwd(), 'public', 'assets', 'images')
const outAvatar = path.join(outDir, 'avatar.webp')

if (!fs.existsSync(srcAvatar)) {
  console.warn('copy-avatar: src/assets/images/avatar.webp not found, skip.')
  process.exit(0)
}

try {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }
  fs.copyFileSync(srcAvatar, outAvatar)
  console.log('copy-avatar: public/assets/images/avatar.webp updated.')
} catch (err) {
  console.error('copy-avatar error:', err.message)
  process.exit(1)
}
