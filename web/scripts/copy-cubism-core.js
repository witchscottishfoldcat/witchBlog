/**
 * 维护 public/scripts/live2dcubismcore.min.js（看板娘运行时）
 *
 * 该文件随仓库提交，是 Cubism 5 Core；Sherry 模型是 moc3 v5，只有 5.x Core 能解析。
 * npm 包 live2dcubismcore@1.x 只提供 Cubism 4.2 Core（最高支持 moc3 v4），
 * 用它覆盖会让模型加载抛 "Unknown error"，因此仅在 node_modules 确实是 5.x 时才覆盖。
 */
const fs = require('fs')
const path = require('path')

const corePackage = path.join(process.cwd(), 'node_modules', 'live2dcubismcore')
const outDir = path.join(process.cwd(), 'public', 'scripts')
const outFile = path.join(outDir, 'live2dcubismcore.min.js')

// Cubism 5 Core 才导出的枚举，用它判断能否加载 moc3 v5 模型
const CUBISM5_MARKER = 'MocVersion_50'

const candidateCoreFiles = [
  path.join(corePackage, 'dist', 'live2dcubismcore.min.js'),
  path.join(corePackage, 'live2dcubismcore.min.js'),
  path.join(corePackage, 'index.min.js'),
]

const supportsMoc3V5 = (file) => {
  try {
    return fs.readFileSync(file, 'utf8').includes(CUBISM5_MARKER)
  } catch {
    return false
  }
}

const coreFile = candidateCoreFiles.find((p) => fs.existsSync(p) && supportsMoc3V5(p))

if (coreFile) {
  try {
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
    fs.copyFileSync(coreFile, outFile)
    console.log('copy-cubism-core: public/scripts/live2dcubismcore.min.js updated from node_modules.')
  } catch (err) {
    console.error('copy-cubism-core error:', err.message)
    process.exit(1)
  }
} else if (supportsMoc3V5(outFile)) {
  console.log('copy-cubism-core: node_modules 仅含 Cubism 4 Core，保留仓库内的 Cubism 5 Core。')
} else {
  console.warn('copy-cubism-core: 未找到支持 moc3 v5 的 Cubism 5 Core，看板娘将无法加载。')
}
