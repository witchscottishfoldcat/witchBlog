import { withContentlayer } from 'next-contentlayer';
import createNextIntlPlugin from 'next-intl/plugin';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

const isProd = process.env.NODE_ENV === 'production';
// 与 src/lib/env.ts 保持一致，避免 rewrite 代理指向错误的后端地址
// 本地默认 127.0.0.1；部署时通过 NEXT_PUBLIC_API_URL 覆盖
const backendApiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
const backendApiOrigin = new URL(backendApiBaseUrl).origin;
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  // dev 下 react-refresh 运行时依赖 eval，缺少 'unsafe-eval' 会抛 EvalError，
  // 导致水合永不启动、首屏遮罩卡死；prod 保持严格不放行
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: http: https:",
  "font-src 'self' data:",
  // 网易云音乐 CDN 的音频地址是 http，且媒体源未单独声明时会回退到 default-src 被拦截
  "media-src 'self' http: https: blob:",
  `connect-src 'self' ${backendApiOrigin} https: wss:`,
  "worker-src 'self' blob:",
].join('; ');

// 内网/自建图片服务器列表（host 或 host:port，逗号分隔）从环境变量读取，
// 避免把真实 IP 硬编码进仓库；本地开发在 .env.local 中配置
const imageServerHosts = (process.env.IMAGE_SERVER_HOSTS || '')
  .split(',')
  .map((host) => host.trim())
  .filter(Boolean);

// 生成 remotePatterns（按 host:port 去重，避免重复条目）
// 条目格式仅支持 host / host:port，不处理 IPv6
const imageServerRemotePatterns = [];
const seenImagePatternKeys = new Set();
for (const entry of imageServerHosts) {
  const colonIndex = entry.lastIndexOf(':');
  const hostname = colonIndex > 0 ? entry.slice(0, colonIndex) : entry;
  const port = colonIndex > 0 ? entry.slice(colonIndex + 1) : '';
  const key = `${hostname}:${port}`;
  if (seenImagePatternKeys.has(key)) continue; // 去重
  seenImagePatternKeys.add(key);
  imageServerRemotePatterns.push({
    protocol: 'http',
    hostname,
    ...(port ? { port } : {}),
    pathname: '/**',
  });
}

const nextConfig = {
  reactStrictMode: true,

  // Backend-generated OSS URLs may be relative. Proxy this safe, fixed path so
  // browsers and the Next.js image optimizer do not request it from port 3000.
  async rewrites() {
    return [
      {
        source: '/api/v1/proxy/oss/:path*',
        destination: `${backendApiBaseUrl}/api/v1/proxy/oss/:path*`,
      },
    ];
  },
  
  // 性能优化配置
  compress: true, // 启用 Gzip 压缩
  poweredByHeader: false, // 移除 X-Powered-By 头
  generateEtags: true, // 启用 ETag 缓存

  // 安全响应头（全站生效）
  // 注：HSTS 待站点启用 HTTPS 后再开启
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy', value: contentSecurityPolicy },
        ],
      },
    ];
  },

  // 开发模式优化：加快启动速度
  ...(isProd ? {} : {}),

  // 输出配置优化
  output: 'standalone', // 优化生产构建输出
  // 避免误用上级目录的 lockfile 作为 workspace root
  outputFileTracingRoot: path.join(process.cwd()),
  
  // TypeScript 类型检查
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // 图片优化配置
  images: { 
    // 启用图片优化以提升性能
    formats: ['image/avif', 'image/webp'], // 优先使用现代格式
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60, // 图片缓存时间（秒）
    // 图片质量配置（Next.js 16 要求）
    qualities: [75, 85, 100],
    remotePatterns: [
      // 掘金图标等资源
      {
        protocol: 'https',
        hostname: 'juejin.cn',
        pathname: '/**',
      },
      // CSS-Tricks 图标等资源
      {
        protocol: 'https',
        hostname: 'css-tricks.com',
        pathname: '/**',
      },
      // Bilibili 图标等资源
      {
        protocol: 'https',
        hostname: 'www.bilibili.com',
        pathname: '/**',
      },
      // Stack Overflow CDN 图标等资源
      {
        protocol: 'https',
        hostname: 'cdn.sstatic.net',
        pathname: '/**',
      },
      // GitHub 图标等资源
      {
        protocol: 'https',
        hostname: 'github.com',
        pathname: '/**',
      },
      // GitHub 头像等资源
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/**',
      },
      // QQ 头像等资源
      {
        protocol: 'http',
        hostname: 'q.qlogo.cn',
        pathname: '/**',
      },
      // Loopback sources are development-only and never enter a production build.
      ...(isProd ? [] : [
        {
          protocol: 'http',
          hostname: '127.0.0.1',
          port: '8000',
          pathname: '/**',
        },
        {
          protocol: 'http',
          hostname: 'localhost',
          port: '8000',
          pathname: '/**',
        },
      ]),
      // 内网/自建图片服务器（MinIO 等）：从 IMAGE_SERVER_HOSTS 环境变量生成
      ...imageServerRemotePatterns,
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      // Simple Icons CDN for skill logos
      {
        protocol: 'https',
        hostname: 'cdn.simpleicons.org',
        pathname: '/**',
      },
      // jsDelivr CDN for Simple Icons
      {
        protocol: 'https',
        hostname: 'cdn.jsdelivr.net',
        pathname: '/**',
      },
    ],
  },
  
  // 服务器外部包配置（从 experimental 移出）
  serverExternalPackages: ['contentlayer'],
  
  // 实验性功能优化
  experimental: {
    // 优化包导入：减少初始包大小
    optimizePackageImports: ['@iconify/react', 'date-fns', 'react-markdown', 'next-intl'],
  },

  // 构建时运行 ESLint
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  webpack: (config, { isServer, dev }) => {
    // Add alias for contentlayer/generated
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      'contentlayer/generated': path.join(process.cwd(), '.contentlayer/generated'),
    };
    // Ensure .mjs extensions are resolved
    if (!config.resolve.extensions) {
      config.resolve.extensions = ['.js', '.jsx', '.json'];
    }
    if (!config.resolve.extensions.includes('.mjs')) {
      config.resolve.extensions.push('.mjs');
    }
    
    // 开发模式优化：加快启动速度
    if (dev) {
      // 减少缓存检查，加快启动
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
      };
    }
    
    // 生产环境优化（仅客户端），dev 环境保持 Next 默认配置以加快启动速度
    if (!isServer && !dev) {
      // 保留 Next.js 默认的 splitChunks 配置，只添加自定义的 cacheGroups
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic', // 稳定的模块 ID
        splitChunks: {
          ...config.optimization.splitChunks,
          chunks: 'all',
          minSize: 20000, // 最小 chunk 大小 20KB
          maxSize: 244000, // 最大 chunk 大小 244KB
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            // 分离大型库
            react: {
              name: 'react',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              priority: 30,
              reuseExistingChunk: true,
            },
            // 分离图标库
            iconify: {
              name: 'iconify',
              chunks: 'all',
              test: /[\\/]node_modules[\\/]@iconify[\\/]/,
              priority: 25,
              reuseExistingChunk: true,
            },
            // 分离 Markdown 相关库
            markdown: {
              name: 'markdown',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](react-markdown|remark|rehype)[\\/]/,
              priority: 20,
              reuseExistingChunk: true,
            },
            // 分离日期处理库
            dateFns: {
              name: 'date-fns',
              chunks: 'all',
              test: /[\\/]node_modules[\\/]date-fns[\\/]/,
              priority: 15,
              reuseExistingChunk: true,
            },
            // 默认 vendor chunk
            default: {
              minChunks: 2,
              priority: -10,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    
    return config;
  },
};

export default withNextIntl(withContentlayer(nextConfig));

