import { publicSiteConfig } from '@/config/public-site'

export default function Footer() {
  return (
    <footer className="mt-10 px-4 pb-24 pt-4 sm:mt-16 md:pb-8">
      <div className="container mx-auto max-w-[1600px]">
        <div
          className="relative overflow-hidden rounded-2xl border px-6 py-6 text-center shadow-sm"
          style={{
            backgroundColor: 'var(--theme-card-bg)',
            borderColor: 'var(--theme-card-border)',
            color: 'var(--theme-text-secondary)',
          }}
        >
          <div
            aria-hidden="true"
            className="absolute inset-x-1/4 top-0 h-px bg-gradient-to-r from-transparent via-[var(--theme-primary-400)] to-transparent opacity-70"
          />

          <div className="flex flex-col items-center gap-3">
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
              <span
                className="text-sm font-semibold tracking-wide"
                style={{ color: 'var(--theme-text-primary)' }}
              >
                © {new Date().getFullYear()} {publicSiteConfig.owner}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs">
              <a
                href={publicSiteConfig.licenseUrl}
                target="_blank"
                rel="license noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium transition-colors hover:bg-[var(--theme-primary-100)] hover:text-[var(--theme-primary-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary-400)]"
                aria-label="Project code and documentation licensed under CC BY-NC-SA 4.0"
              >
                <span
                  className="rounded border px-1 py-px text-[9px] font-bold leading-none"
                  style={{ borderColor: 'var(--theme-primary-300)' }}
                  aria-hidden="true"
                >
                  CC
                </span>
                CC BY-NC-SA 4.0
              </a>

              <a
                href={publicSiteConfig.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full px-2.5 py-1 transition-colors hover:text-[var(--theme-primary-700)]"
              >
                查看本站源码
              </a>

              <span className="hidden h-3 w-px bg-[var(--theme-card-border)] sm:block" aria-hidden="true" />

              <a
                href="https://beian.miit.gov.cn/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 transition-colors hover:bg-[var(--theme-primary-100)] hover:text-[var(--theme-primary-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary-400)]"
              >
                <svg
                  aria-hidden="true"
                  className="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M12 3 5 6v5c0 4.6 2.9 8.4 7 10 4.1-1.6 7-5.4 7-10V6l-7-3Z" />
                  <path d="m9.5 12 1.7 1.7 3.6-3.8" />
                </svg>
                {publicSiteConfig.icpNumber}
              </a>
            </div>

            <div
              className="h-px w-16"
              style={{ backgroundColor: 'var(--theme-card-border)' }}
              aria-hidden="true"
            />

            <div className="flex items-center justify-center gap-2 text-[11px] opacity-75">
              <span>Powered by</span>
              <a
                href={publicSiteConfig.projectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium transition-colors hover:text-[var(--theme-primary-700)]"
              >
                WitchCat
              </a>
              <span className="opacity-40">·</span>
              <a
                href="https://react.dev/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium transition-colors hover:text-[#087ea4]"
              >
                React
              </a>
              <span className="opacity-40">×</span>
              <a
                href="https://fastapi.tiangolo.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium transition-colors hover:text-[#009688]"
              >
                FastAPI
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
