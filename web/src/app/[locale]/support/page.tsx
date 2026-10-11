import type { Metadata } from 'next'
import { Icon } from '@iconify/react'
import Navbar from '@/components/Navbar'
import ArchiveHeroBanner from '@/components/ArchiveHeroBanner'
import PageLayout from '@/components/PageLayout'
import { SidebarCard } from '@/components/Sidebar'
import SupportPaymentChooser from '@/components/SupportPaymentChooser'
import MobilePageHeader from '@/components/mobile/MobilePageHeader'
import PageIntroCard from '@/components/PageIntroCard'
import { isValidLocale, type Locale } from '@/i18n'
import { getSponsors } from '@/lib/api'

type Copy = {
  metaTitle: string
  metaDescription: string
  eyebrow: string
  title: string
  description: string
  badge: string
  chooseTitle: string
  chooseDescription: string
  alipay: string
  wechat: string
  recommended: string
  scan: string
  viewQr: string
  close: string
  qrAlt: string
  impactTitle: string
  impactItems: [string, string, string]
  noteTitle: string
  note: string
  thanks: string
  promise: string
  acknowledgementsTitle: string
  acknowledgementsEmpty: string
  anonymousSponsor: string
  alternativeTitle: string
  alternativeItems: [string, string, string]
  flowTitle: string
  flowItems: [string, string, string]
  tipsTitle: string
  tipItems: [string, string, string]
}

const copy: Record<Locale, Copy> = {
  zh: {
    metaTitle: '赞助与支持｜梦如白镜之花',
    metaDescription: '用支付宝或微信赞助女巫猫的小站，支持服务器、域名与持续创作。',
    eyebrow: '给女巫猫投喂一颗星星',
    title: '给WitchCat投喂一颗星星',
    description: '你的每一份心意，都会变成维持小站运转的魔力，也让我能继续认真写字、分享与创造。',
    badge: 'Support Witchcat',
    chooseTitle: '选择你的赞助方式',
    chooseDescription: '打开对应 App 扫描二维码即可。请量力而行，一句鼓励也同样珍贵。',
    alipay: '支付宝',
    wechat: '微信支付',
    recommended: '推荐',
    scan: '打开 App · 扫一扫',
    viewQr: '查看收款码',
    close: '关闭',
    qrAlt: '赞助收款二维码',
    impactTitle: '你的星光会落在哪里？',
    impactItems: ['服务器与域名续费', '文章、图片与内容创作', '小站体验与功能维护'],
    noteTitle: '一份小小约定',
    note: '赞助完全自愿，不会解锁付费内容，也不代表任何额外服务或承诺。可以在备注里写下想跟 UP 说的话。',
    thanks: '你的心意，已经被星星记住啦。',
    promise: '感谢每一次阅读、留言、转发与支持。',
    acknowledgementsTitle: '鸣谢列表',
    acknowledgementsEmpty: '暂无hhh',
    anonymousSponsor: '匿名小天使',
    alternativeTitle: '不赞助，也能帮到小站',
    alternativeItems: ['阅读喜欢的文章', '留下一句评论或建议', '分享给感兴趣的朋友'],
    flowTitle: '赞助流程',
    flowItems: ['在下方选择支付方式', '弹出收款码后打开对应 App', '扫码完成，也可以留下一句话'],
    tipsTitle: '扫码前的小提示',
    tipItems: ['金额随心，请量力而行', '支付前请核对收款方式', '备注里可以写想对 UP 说的话'],
  },
  en: {
    metaTitle: 'Support Witchcat',
    metaDescription: 'Support this little blog and help cover hosting, domains, and future creative work.',
    eyebrow: 'Send Witchcat a little starlight',
    title: 'Thank you for keeping this tiny universe glowing',
    description: 'Every bit of support becomes magic for hosting, writing, sharing, and making this corner of the web a little lovelier.',
    badge: 'Support Witchcat',
    chooseTitle: 'Choose a way to support',
    chooseDescription: 'Open the corresponding app and scan. Please only give what feels comfortable—kind words matter just as much.',
    alipay: 'Alipay',
    wechat: 'WeChat Pay',
    recommended: 'Recommended',
    scan: 'Open app · Scan QR',
    viewQr: 'View QR code',
    close: 'Close',
    qrAlt: 'Support payment QR code',
    impactTitle: 'Where your starlight goes',
    impactItems: ['Hosting and domain costs', 'Writing, artwork, and new stories', 'Site improvements and maintenance'],
    noteTitle: 'A small promise',
    note: 'Support is entirely optional. It does not unlock paid content or imply extra services. Feel free to leave the creator a message in the payment note.',
    thanks: 'Your kindness is now part of this constellation.',
    promise: 'Thank you for every visit, message, share, and bit of support.',
    acknowledgementsTitle: 'Acknowledgements',
    acknowledgementsEmpty: 'Nothing here yet hhh',
    anonymousSponsor: 'Anonymous Star',
    alternativeTitle: 'Other ways to help',
    alternativeItems: ['Read an article you enjoy', 'Leave a comment or suggestion', 'Share the site with a friend'],
    flowTitle: 'How it works',
    flowItems: ['Choose a payment method below', 'Open the matching app when the QR appears', 'Scan to finish and leave a note if you like'],
    tipsTitle: 'Before you scan',
    tipItems: ['Choose any amount that feels comfortable', 'Check the payment method before paying', 'Leave the creator a note if you like'],
  },
  ja: {
    metaTitle: '応援する｜Witchcat',
    metaDescription: 'サーバー・ドメイン・これからの創作を支えるための応援ページです。',
    eyebrow: '魔女猫に星をひとつ',
    title: 'この小さな世界を照らしてくれて、ありがとう',
    description: 'いただいた応援は、サイトの運営や文章、作品づくりを続けるための魔法になります。',
    badge: 'Support Witchcat',
    chooseTitle: '応援方法を選ぶ',
    chooseDescription: '対応アプリを開いてQRコードを読み取ってください。無理のない範囲で、ひと言の応援も同じくらい嬉しいです。',
    alipay: 'Alipay',
    wechat: 'WeChat Pay',
    recommended: 'おすすめ',
    scan: 'アプリを開く · スキャン',
    viewQr: 'QRコードを見る',
    close: '閉じる',
    qrAlt: '応援用決済QRコード',
    impactTitle: '星の光の行き先',
    impactItems: ['サーバーとドメイン費用', '文章・イラスト・コンテンツ制作', 'サイトの改善とメンテナンス'],
    noteTitle: '小さなお約束',
    note: '応援は完全に任意です。有料コンテンツや追加サービスを提供するものではありません。備考欄にUPへのメッセージも書けます。',
    thanks: 'あなたの気持ちは、星空に届きました。',
    promise: '訪問、コメント、シェア、そして応援のすべてに感謝します。',
    acknowledgementsTitle: '謝辞リスト',
    acknowledgementsEmpty: 'まだありません hhh',
    anonymousSponsor: '匿名の星',
    alternativeTitle: '応援は寄付だけではありません',
    alternativeItems: ['気になる記事を読む', 'コメントや感想を残す', '友だちにサイトを紹介する'],
    flowTitle: '応援の流れ',
    flowItems: ['下から支払い方法を選ぶ', 'QRコードが表示されたら対応アプリを開く', 'スキャンして、よければメッセージを残す'],
    tipsTitle: 'スキャン前のヒント',
    tipItems: ['無理のない金額を選んでください', '支払い方法を確認してください', '備考欄にUPへのメッセージを書けます'],
  },
  ko: {
    metaTitle: '후원하기｜Witchcat',
    metaDescription: '서버, 도메인, 그리고 앞으로의 창작을 응원하는 페이지입니다。',
    eyebrow: '마녀 고양이에게 별빛 한 조각',
    title: '이 작은 세계를 밝혀 주셔서 고마워요',
    description: '보내 주신 마음은 사이트 운영과 글쓰기, 새로운 창작을 이어 가는 마법이 됩니다。',
    badge: 'Support Witchcat',
    chooseTitle: '후원 방법을 선택하세요',
    chooseDescription: '해당 앱에서 QR 코드를 스캔해 주세요. 무리하지 마세요. 따뜻한 한마디도 똑같이 소중합니다。',
    alipay: 'Alipay',
    wechat: 'WeChat Pay',
    recommended: '추천',
    scan: '앱 열기 · QR 스캔',
    viewQr: 'QR 코드 보기',
    close: '닫기',
    qrAlt: '후원 결제 QR 코드',
    impactTitle: '별빛이 닿는 곳',
    impactItems: ['서버 및 도메인 비용', '글, 그림, 콘텐츠 제작', '사이트 개선과 유지보수'],
    noteTitle: '작은 약속',
    note: '후원은 전적으로 자율입니다. 유료 콘텐츠나 추가 서비스를 제공하는 것은 아닙니다. 결제 메모에 운영자에게 전하고 싶은 말을 남겨도 좋아요.',
    thanks: '당신의 마음은 이제 이 별자리의 일부예요。',
    promise: '방문과 댓글, 공유와 모든 응원에 감사드립니다。',
    acknowledgementsTitle: '감사 명단',
    acknowledgementsEmpty: '아직 없어요 hhh',
    anonymousSponsor: '익명의 별',
    alternativeTitle: '후원하지 않아도 힘이 돼요',
    alternativeItems: ['마음에 드는 글 읽기', '댓글이나 의견 남기기', '친구에게 사이트 공유하기'],
    flowTitle: '후원 방법',
    flowItems: ['아래에서 결제 수단을 선택하세요', 'QR 코드가 열리면 해당 앱을 실행하세요', '스캔 후 원한다면 메시지를 남겨 주세요'],
    tipsTitle: '스캔 전 안내',
    tipItems: ['부담 없는 금액을 선택해 주세요', '결제 전에 결제 수단을 확인해 주세요', '메모에 운영자에게 전할 말을 남길 수 있어요'],
  },
}

const paymentMethods = [
  {
    key: 'alipay',
    image: '/assets/support/payment-placeholder.svg',
    icon: 'simple-icons:alipay',
    accent: '#1677ff',
  },
  {
    key: 'wechat',
    image: '/assets/support/payment-placeholder.svg',
    icon: 'simple-icons:wechat',
    accent: '#07c160',
  },
] as const

const impactIcons = ['mdi:server', 'mdi:file-document-edit', 'mdi:tools'] as const
// const alternativeIcons = ['mdi:book-open-page-variant-outline', 'mdi:message-text-outline', 'mdi:share-variant-outline'] as const
const flowIcons = ['mdi:cursor-default-click-outline', 'mdi:qrcode-scan', 'mdi:message-processing-outline'] as const
const tipIcons = ['mdi:cash-multiple', 'mdi:shield-check-outline', 'mdi:message-processing-outline'] as const

const sponsorSourceIcons: Record<string, string> = {
  alipay: 'simple-icons:alipay',
  wechat: 'simple-icons:wechat',
  other: 'mdi:hand-heart-outline',
}

function getCopy(locale: string) {
  return copy[isValidLocale(locale) ? locale : 'zh']
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = getCopy(locale)
  return { title: t.metaTitle, description: t.metaDescription }
}

export default async function SupportPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = getCopy(locale)
  const sponsors = await getSponsors()
  const localizedPaymentMethods = paymentMethods.map((method) => ({
    ...method,
    name: method.key === 'alipay' ? t.alipay : t.wechat,
  }))
  const paymentChooserCopy = {
    scanLabel: t.scan,
    recommendedLabel: t.recommended,
    viewQrLabel: t.viewQr,
    closeLabel: t.close,
    qrAlt: t.qrAlt,
    noteTitle: t.noteTitle,
    note: t.note,
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-b max-md:bg-[var(--theme-bg-middle)]"
      style={{
        background: 'linear-gradient(to bottom, var(--theme-bg-start), var(--theme-bg-middle), var(--theme-bg-end))',
      }}
    >
      <Navbar />
      <div className="max-md:hidden">
        <ArchiveHeroBanner />
      </div>

      <PageLayout
        forceThreeColumn
        leftSidebar={
          <>
            <SidebarCard title={t.impactTitle}>
              <ul className="space-y-2.5">
                {t.impactItems.map((item, index) => (
                  <li key={item} className="flex items-center gap-2.5 rounded-xl border p-2.5" style={{ borderColor: 'var(--theme-card-border)' }}>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--theme-primary-100)] text-[var(--theme-primary-600)]">
                      <Icon icon={impactIcons[index]} className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="text-xs font-medium leading-5 text-gray-700 dark:text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </SidebarCard>

            <SidebarCard title={t.thanks}>
              <p className="text-xs leading-6 text-gray-600 dark:text-gray-400">{t.promise}</p>
            </SidebarCard>

            {/* “不赞助，也能帮到小站”卡片暂时隐藏，保留代码便于后续恢复。
            <SidebarCard title={t.alternativeTitle}>
              <ul className="space-y-3">
                {t.alternativeItems.map((item, index) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--theme-primary-100)] text-[var(--theme-primary-600)]">
                      <Icon icon={alternativeIcons[index]} className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="text-xs leading-5 text-gray-600 dark:text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </SidebarCard>
            */}
          </>
        }
        rightSidebar={
          <>
            <SidebarCard title={t.flowTitle}>
              <ol className="space-y-3">
                {t.flowItems.map((item, index) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--theme-primary-100)] text-[var(--theme-primary-600)]">
                      <Icon icon={flowIcons[index]} className="h-4 w-4" aria-hidden />
                      <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--theme-primary-600)] px-1 text-[9px] font-bold text-white">
                        {index + 1}
                      </span>
                    </span>
                    <span className="text-xs leading-5 text-gray-600 dark:text-gray-300">{item}</span>
                  </li>
                ))}
              </ol>
            </SidebarCard>

            <SidebarCard title={t.noteTitle}>
              <div className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300">
                  <Icon icon="mdi:hand-heart-outline" className="h-4 w-4" aria-hidden />
                </span>
                <p className="text-xs leading-6 text-gray-600 dark:text-gray-400">{t.note}</p>
              </div>
            </SidebarCard>

            <SidebarCard title={t.tipsTitle}>
              <ul className="space-y-3">
                {t.tipItems.map((item, index) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--theme-primary-100)] text-[var(--theme-primary-600)]">
                      <Icon icon={tipIcons[index]} className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="text-xs leading-5 text-gray-600 dark:text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </SidebarCard>
          </>
        }
        content={
          <main className="space-y-3 sm:space-y-5">
            <MobilePageHeader title={t.chooseTitle} subtitle={t.description} />

            <PageIntroCard
              title={t.title}
              subtitle={t.description}
              actions={
                <a
                  href="#payment-methods"
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--theme-primary-600)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[var(--theme-primary-700)]"
                >
                  <Icon icon="mdi:qrcode-scan" className="h-4 w-4" aria-hidden />
                  {t.chooseTitle}
                  <Icon icon="mdi:arrow-down" className="h-4 w-4" aria-hidden />
                </a>
              }
            />

            <section
              id="payment-methods"
              className="mobile-app-section max-md:mobile-page-card scroll-mt-20 rounded-2xl border p-3 shadow-sm sm:rounded-3xl sm:p-5 lg:p-6"
              style={{
                backgroundColor: 'var(--theme-card-bg-90)',
                borderColor: 'var(--theme-card-border)',
              }}
            >
              <div className="mb-4 flex items-start gap-3 px-1 sm:mb-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--theme-primary-100)] text-[var(--theme-primary-600)]">
                  <Icon icon="mdi:wallet-outline" className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 sm:text-xl">{t.chooseTitle}</h2>
                  <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400 sm:text-sm">{t.chooseDescription}</p>
                </div>
              </div>

              <SupportPaymentChooser methods={localizedPaymentMethods} variant="cards" {...paymentChooserCopy} />

              <div
                className="mt-3 flex gap-2.5 rounded-xl border p-3 lg:hidden"
                style={{ backgroundColor: 'var(--theme-card-bg-80)', borderColor: 'var(--theme-card-border)' }}
              >
                <Icon icon="mdi:hand-heart-outline" className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden />
                <p className="text-[11px] leading-5 text-gray-500 dark:text-gray-400">{t.note}</p>
              </div>
            </section>

            <section
              className="mobile-app-section max-md:mobile-page-card rounded-2xl border p-3 shadow-sm sm:rounded-3xl sm:p-5 lg:p-6"
              style={{
                backgroundColor: 'var(--theme-card-bg-90)',
                borderColor: 'var(--theme-card-border)',
              }}
            >
              <div className="mb-4 flex items-center gap-3 px-1 sm:mb-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--theme-primary-100)] text-[var(--theme-primary-600)]">
                  <Icon icon="mdi:account-heart-outline" className="h-4 w-4" aria-hidden />
                </span>
                <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 sm:text-xl">{t.acknowledgementsTitle}</h2>
              </div>
              <div
                className="flex min-h-24 flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-5 text-center"
                style={{ backgroundColor: 'var(--theme-card-bg-80)', borderColor: 'var(--theme-card-border)' }}
              >
                {sponsors.length === 0 ? (
                  <>
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--theme-primary-100)] text-[var(--theme-primary-600)]">
                      <Icon icon="mdi:account-heart-outline" className="h-5 w-5" aria-hidden />
                    </span>
                    <p className="mt-2 text-xs font-medium text-gray-500 dark:text-gray-400">{t.acknowledgementsEmpty}</p>
                  </>
                ) : (
                  <ul className="grid w-full grid-cols-1 gap-2 text-left sm:grid-cols-2">
                    {sponsors.map((sponsor) => {
                      const displayName = sponsor.is_anonymous ? t.anonymousSponsor : sponsor.name
                      const displayDate = sponsor.sponsored_at
                        ? new Intl.DateTimeFormat(isValidLocale(locale) ? locale : 'zh', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                          }).format(new Date(sponsor.sponsored_at))
                        : null
                      return (
                        <li
                          key={sponsor.id}
                          className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5"
                          style={{ borderColor: 'var(--theme-card-border)', backgroundColor: 'var(--theme-card-bg-80)' }}
                          title={sponsor.message || undefined}
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--theme-primary-100)] text-[11px] font-bold text-[var(--theme-primary-600)]">
                            {sponsor.is_anonymous ? (
                              <Icon icon="mdi:star-four-points-outline" className="h-3 w-3" aria-hidden />
                            ) : (
                              displayName.slice(0, 1).toUpperCase()
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-semibold text-gray-900 dark:text-gray-100">
                              {displayName}
                            </span>
                            {sponsor.message && (
                              <span className="block truncate text-[11px] leading-4 text-gray-500 dark:text-gray-400">
                                {sponsor.message}
                              </span>
                            )}
                          </span>
                          <span className="flex shrink-0 items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
                            <Icon
                              icon={sponsorSourceIcons[sponsor.source] || sponsorSourceIcons.other}
                              className="h-3 w-3"
                              aria-hidden
                            />
                            {displayDate}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </section>
          </main>
        }
      />
    </div>
  )
}
