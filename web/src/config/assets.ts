/**
 * 资源文件配置
 * Assets Configuration
 */

// Banner 配置
export const bannerConfig = {
  // 是否启用轮播
  enabled: true,
  // 轮播间隔时间（毫秒）
  interval: 5000,
  // 桌面端 Banner 图片
  desktop: {
    light: [
      '/assets/desktop-banner/d4.webp',
      '/assets/desktop-banner/d1.webp',
      '/assets/desktop-banner/d2.webp',
      '/assets/desktop-banner/d3.webp',
      '/assets/desktop-banner/d5.webp',
      '/assets/desktop-banner/d6.webp',
      '/assets/desktop-banner/d7.webp',
      '/assets/desktop-banner/d8.webp',
    ],
    dark: [
      '/assets/desktop-banner/d4-dark.webp',
      '/assets/desktop-banner/d1-dark.webp',
      '/assets/desktop-banner/d2-dark.webp',
      '/assets/desktop-banner/d3-dark.webp',
      '/assets/desktop-banner/d5-dark.webp',
      '/assets/desktop-banner/d6-dark.webp',
      '/assets/desktop-banner/d7-dark.webp',
      '/assets/desktop-banner/d8-dark.webp',
    ],
  },
  // 移动端 Banner 图片
  mobile: {
    light: [
      '/assets/mobile-banner/m4.webp',
      '/assets/mobile-banner/m1.webp',
      '/assets/mobile-banner/m2.webp',
      '/assets/mobile-banner/m3.webp',
      '/assets/mobile-banner/m5.webp',
      '/assets/mobile-banner/m6.webp',
      '/assets/mobile-banner/m7.webp',
      '/assets/mobile-banner/m8.webp',
    ],
    dark: [
      '/assets/mobile-banner/m4.webp',
      '/assets/mobile-banner/m1.webp',
      '/assets/mobile-banner/m2.webp',
      '/assets/mobile-banner/m3.webp',
      '/assets/mobile-banner/m5.webp',
      '/assets/mobile-banner/m6.webp',
      '/assets/mobile-banner/m7.webp',
      '/assets/mobile-banner/m8.webp',
    ],
  },
  // Banner 标题和副标题（支持多语言）
  items: [
    {
      id: 4,
      title: {
        zh: '创意与灵感',
        en: 'Creativity & Inspiration',
        ja: '創造性とインスピレーション',
        ko: '창의성과 영감',
      },
      subtitle: {
        zh: '让想法变成现实',
        en: 'Turn ideas into reality',
        ja: 'アイデアを現実に',
        ko: '아이디어를 현실로',
      },
      gradient: 'from-green-400 via-emerald-500 to-teal-600',
    },
    {
      id: 1,
      title: {
        zh: '欢迎来到我的博客',
        en: 'Welcome to My Blog',
        ja: '私のブログへようこそ',
        ko: '내 블로그에 오신 것을 환영합니다',
      },
      subtitle: {
        zh: '分享生活与技术的点点滴滴',
        en: 'Sharing life and technology',
        ja: '生活と技術のあれこれを共有',
        ko: '생활과 기술의 모든 것을 공유',
      },
      gradient: 'from-transparent via-transparent to-transparent',
    },
    {
      id: 2,
      title: {
        zh: '探索无限可能',
        en: 'Explore Infinite Possibilities',
        ja: '無限の可能性を探る',
        ko: '무한한 가능성 탐구',
      },
      subtitle: {
        zh: '记录每一个精彩瞬间',
        en: 'Record every wonderful moment',
        ja: 'すべての素晴らしい瞬間を記録',
        ko: '모든 멋진 순간 기록',
      },
      gradient: 'from-blue-400 via-cyan-500 to-teal-600',
    },
    {
      id: 3,
      title: {
        zh: '动漫风格设计',
        en: 'Anime Style Design',
        ja: 'アニメスタイルデザイン',
        ko: '애니메이션 스타일 디자인',
      },
      subtitle: {
        zh: '美丽而现代的界面',
        en: 'Beautiful and modern interface',
        ja: '美しく現代的なインターフェース',
        ko: '아름답고 현대적인 인터페이스',
      },
      gradient: 'from-orange-400 via-red-500 to-pink-600',
    },
    {
      id: 5,
      title: {
        zh: '技术分享',
        en: 'Tech Sharing',
        ja: '技術共有',
        ko: '기술 공유',
      },
      subtitle: {
        zh: '学习与成长',
        en: 'Learn and grow',
        ja: '学びと成長',
        ko: '학습과 성장',
      },
      gradient: 'from-purple-400 via-pink-500 to-rose-600',
    },
    {
      id: 6,
      title: {
        zh: '生活记录',
        en: 'Life Records',
        ja: '生活記録',
        ko: '생활 기록',
      },
      subtitle: {
        zh: '每一天都值得纪念',
        en: 'Every day is worth remembering',
        ja: '毎日が記念すべき日',
        ko: '매일이 기념할 만한 날',
      },
      gradient: 'from-indigo-400 via-blue-500 to-cyan-600',
    },
    {
      id: 7,
      title: {
        zh: '艺术与美学',
        en: 'Art & Aesthetics',
        ja: '芸術と美学',
        ko: '예술과 미학',
      },
      subtitle: {
        zh: '追求完美的视觉体验',
        en: 'Pursue perfect visual experience',
        ja: '完璧な視覚体験を追求',
        ko: '완벽한 시각적 경험 추구',
      },
      gradient: 'from-yellow-400 via-orange-500 to-red-600',
    },
    {
      id: 8,
      title: {
        zh: '未来已来',
        en: 'The Future is Here',
        ja: '未来はここに',
        ko: '미래가 여기에',
      },
      subtitle: {
        zh: '拥抱变化，创造未来',
        en: 'Embrace change, create the future',
        ja: '変化を受け入れ、未来を創造',
        ko: '변화를 받아들이고 미래를 창조',
      },
      gradient: 'from-violet-400 via-purple-500 to-fuchsia-600',
    },
  ],
}

// Logo 配置
export const logoConfig = {
  // 导航栏 Logo
  navbar: '/assets/home/home.png',
  // Logo 文字（如果使用文字 Logo）
  text: 'WitchCatUI',
  // Logo emoji
  emoji: '🎀',
}

// 用户头像配置
export const avatarConfig = {
  // 头像路径（src 目录，Next.js 需要使用相对路径或 import）
  default: '/src/assets/images/avatar.webp',
  // 备用头像路径（public 目录，如果存在）
  public: '/assets/images/avatar.webp',
}

// Favicon 配置
export const faviconConfig = {
  light: {
    32: '/favicon/favicon-light-32.png',
    128: '/favicon/favicon-light-128.png',
    180: '/favicon/favicon-light-180.png',
    192: '/favicon/favicon-light-192.png',
  },
  dark: {
    32: '/favicon/favicon-dark-32.png',
    128: '/favicon/favicon-dark-128.png',
    180: '/favicon/favicon-dark-180.png',
    192: '/favicon/favicon-dark-192.png',
  },
}

// 其他资源
export const otherAssets = {
  sakura: '/sakura.png',
}

// 用户资料配置
export const profileConfig = {
  name: 'Site Owner',
  avatar: '/assets/images/avatar.webp',
  motto: 'The world is big, you have to go and see',
  links: [
    { name: 'GitHub', icon: 'fa6-brands:github', url: 'https://github.com/...' },
    { name: 'Discord', icon: 'fa6-brands:discord', url: 'https://discord.gg/...' },
    { name: 'GitLab', icon: 'fa6-brands:gitlab', url: 'https://gitlab.com/...' },
    { name: 'Twitch', icon: 'fa6-brands:twitch', url: 'https://twitch.tv/...' },
    { name: 'Git', icon: 'mdi:git', url: 'https://...' },
  ],
}

