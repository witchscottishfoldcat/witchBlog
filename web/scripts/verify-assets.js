/**
 * 资源文件验证脚本
 * 验证所有配置的资源文件是否存在
 */

const fs = require('fs')
const path = require('path')

const publicDir = path.join(process.cwd(), 'public')
const srcDir = path.join(process.cwd(), 'src')

// 需要验证的资源文件
const assetsToVerify = {
  banner: {
    desktop: [
      '/assets/desktop-banner/d4.webp',
      '/assets/desktop-banner/d1.webp',
      '/assets/desktop-banner/d2.webp',
      '/assets/desktop-banner/d3.webp',
      '/assets/desktop-banner/d5.webp',
      '/assets/desktop-banner/d6.webp',
      '/assets/desktop-banner/d7.webp',
      '/assets/desktop-banner/d8.webp',
      '/assets/desktop-banner/d4-dark.webp',
      '/assets/desktop-banner/d1-dark.webp',
      '/assets/desktop-banner/d2-dark.webp',
      '/assets/desktop-banner/d3-dark.webp',
      '/assets/desktop-banner/d5-dark.webp',
      '/assets/desktop-banner/d6-dark.webp',
      '/assets/desktop-banner/d7-dark.webp',
      '/assets/desktop-banner/d8-dark.webp',
    ],
    mobile: Array.from({ length: 8 }, (_, i) => `/assets/mobile-banner/m${i + 1}.webp`),
  },
  logo: '/assets/home/home.png',
  avatar: [
    '/assets/images/avatar.webp',
    '/src/assets/images/avatar.webp',
  ],
  favicon: {
    light: [
      '/favicon/favicon-light-32.png',
      '/favicon/favicon-light-128.png',
      '/favicon/favicon-light-180.png',
      '/favicon/favicon-light-192.png',
    ],
    dark: [
      '/favicon/favicon-dark-32.png',
      '/favicon/favicon-dark-128.png',
      '/favicon/favicon-dark-180.png',
      '/favicon/favicon-dark-192.png',
    ],
  },
  sakura: '/sakura.png',
}

function checkFile(filePath, baseDir = publicDir) {
  const fullPath = path.join(baseDir, filePath.replace(/^\//, ''))
  return fs.existsSync(fullPath)
}

function verifyAssets() {
  console.log('🔍 开始验证资源文件...\n')
  
  let allPassed = true
  let passedCount = 0
  let failedCount = 0

  // 验证 Banner 图片
  console.log('📸 验证 Banner 图片:')
  assetsToVerify.banner.desktop.forEach((file) => {
    const exists = checkFile(file)
    if (exists) {
      console.log(`  ✅ ${file}`)
      passedCount++
    } else {
      console.log(`  ❌ ${file} - 文件不存在`)
      failedCount++
      allPassed = false
    }
  })
  
  assetsToVerify.banner.mobile.forEach((file) => {
    const exists = checkFile(file)
    if (exists) {
      console.log(`  ✅ ${file}`)
      passedCount++
    } else {
      console.log(`  ❌ ${file} - 文件不存在`)
      failedCount++
      allPassed = false
    }
  })

  // 验证 Logo
  console.log('\n🎨 验证 Logo:')
  const logoExists = checkFile(assetsToVerify.logo)
  if (logoExists) {
    console.log(`  ✅ ${assetsToVerify.logo}`)
    passedCount++
  } else {
    console.log(`  ❌ ${assetsToVerify.logo} - 文件不存在`)
    failedCount++
    allPassed = false
  }

  // 验证头像
  console.log('\n👤 验证头像:')
  let avatarFound = false
  assetsToVerify.avatar.forEach((file) => {
    const baseDir = file.startsWith('/src/') ? srcDir : publicDir
    const filePath = file.replace(/^\/(src\/)?/, '')
    const exists = checkFile(filePath, baseDir)
    if (exists) {
      console.log(`  ✅ ${file}`)
      passedCount++
      avatarFound = true
    } else {
      console.log(`  ⚠️  ${file} - 文件不存在`)
    }
  })
  if (!avatarFound) {
    failedCount++
    allPassed = false
  }

  // 验证 Favicon
  console.log('\n🔖 验证 Favicon:')
  Object.entries(assetsToVerify.favicon).forEach(([theme, files]) => {
    console.log(`  ${theme === 'light' ? '☀️' : '🌙'} ${theme}:`)
    files.forEach((file) => {
      const exists = checkFile(file)
      if (exists) {
        console.log(`    ✅ ${file}`)
        passedCount++
      } else {
        console.log(`    ❌ ${file} - 文件不存在`)
        failedCount++
        allPassed = false
      }
    })
  })

  // 验证其他资源
  console.log('\n🌸 验证其他资源:')
  const sakuraExists = checkFile(assetsToVerify.sakura)
  if (sakuraExists) {
    console.log(`  ✅ ${assetsToVerify.sakura}`)
    passedCount++
  } else {
    console.log(`  ⚠️  ${assetsToVerify.sakura} - 文件不存在（可选）`)
  }

  // 总结
  console.log('\n' + '='.repeat(50))
  console.log(`✅ 通过: ${passedCount}`)
  console.log(`❌ 失败: ${failedCount}`)
  console.log('='.repeat(50))
  
  if (allPassed) {
    console.log('\n🎉 所有必需资源文件验证通过！')
    process.exit(0)
  } else {
    console.log('\n⚠️  部分资源文件缺失，请检查上述列表')
    process.exit(1)
  }
}

verifyAssets()

