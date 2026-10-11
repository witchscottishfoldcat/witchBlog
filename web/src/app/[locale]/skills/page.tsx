import { Suspense } from 'react'
import Navbar from '@/components/Navbar'
import ArchiveHeroBanner from '@/components/ArchiveHeroBanner'
import PageLayout from '@/components/PageLayout'
import AppSidebarLeft from '@/components/AppSidebarLeft'
import SkillList, { Skill } from '@/components/SkillList'
import {
  SkillsCategoryCard,
  SkillsLearningCard,
  SkillsLevelCard,
  SkillsProjectCard,
  SkillsSummaryCard,
} from '@/components/sidebar/SkillsStatsCards'
import { getSkills, convertApiSkillToSkill } from '@/lib/api'
import { isValidLocale } from '@/i18n'
import { resolveNestedMessage } from '@/lib/i18n-utils'
import type { Messages } from '@/types/messages'
import { logger } from '@/lib/logger'
import MobilePageHeader from '@/components/mobile/MobilePageHeader'
import { LeftSidebarFallback, RightSidebarFallback } from '@/components/layout/PageSidebarFallback'
import { getTranslations } from 'next-intl/server'

async function loadMessages(locale: string): Promise<Messages> {
  try {
    const messages = (await import(`@/messages/${locale}.json`)).default
    return messages as Messages
  } catch (error) {
    logger.error(`[SkillsPage] Failed to load messages for locale: ${locale}`, error)
    const defaultMessages = (await import(`@/messages/zh.json`)).default
    return defaultMessages as Messages
  }
}

export default async function SkillsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const validLocale = isValidLocale(locale) ? locale : 'zh'
  const navT = await getTranslations('nav')
  const messages = await loadMessages(validLocale)
  const skillsMessages = messages.skills

  const skillsT = (key: string) => resolveNestedMessage(skillsMessages, key)

  const apiSkills = await getSkills({ skip: 0, limit: 100 })
  const skills: Skill[] = apiSkills.map((apiSkill) => convertApiSkillToSkill(apiSkill, locale))

  const totalSkills = skills.length
  const levelStats = {
    expert: skills.filter((skill) => skill.level === 'expert').length,
    advanced: skills.filter((skill) => skill.level === 'advanced').length,
    intermediate: skills.filter((skill) => skill.level === 'intermediate').length,
    beginner: skills.filter((skill) => skill.level === 'beginner').length,
  }
  const categoryStats = {
    frontend: skills.filter((s) => s.category === 'frontend').length,
    backend: skills.filter((s) => s.category === 'backend').length,
    database: skills.filter((s) => s.category === 'database').length,
    tools: skills.filter((s) => s.category === 'tools').length,
    other: skills.filter((s) => s.category === 'other').length,
  }
  const averageExperience = totalSkills
    ? skills.reduce((total, skill) => total + skill.experience.years + skill.experience.months / 12, 0) / totalSkills
    : 0
  const totalLearningDays = apiSkills.reduce((total, skill) => total + (skill.total_learning_days || 0), 0)
  const projectLinks = skills.reduce((total, skill) => total + skill.projects, 0)
  const coveredSkills = skills.filter((skill) => skill.projects > 0).length
  const longestSkill = skills.reduce<Skill | null>((longest, skill) => {
    if (!longest) return skill
    const currentMonths = skill.experience.years * 12 + skill.experience.months
    const longestMonths = longest.experience.years * 12 + longest.experience.months
    return currentMonths > longestMonths ? skill : longest
  }, null)
  const longestExperience = longestSkill
    ? `${longestSkill.experience.years}${skillsT('year')}${longestSkill.experience.months ? ` ${longestSkill.experience.months}${skillsT('month')}` : ''}`
    : `0${skillsT('year')}`
  return (
    <div
      className="min-h-screen bg-gradient-to-b max-md:bg-[var(--theme-bg-middle)]"
      style={{
        background: `linear-gradient(to bottom, var(--theme-bg-start), var(--theme-bg-middle), var(--theme-bg-end))`,
      }}
    >
      <Navbar />
      <div className="max-md:hidden">
        <ArchiveHeroBanner />
      </div>

        <PageLayout
          forceThreeColumn
          leftSidebar={
            <Suspense fallback={<LeftSidebarFallback />}>
              <AppSidebarLeft locale={locale} showAnnouncement={false}>
                <SkillsSummaryCard
                  total={totalSkills}
                  average={averageExperience}
                  totalLabel={skillsT('totalSkills')}
                  averageLabel={skillsT('averageExperience')}
                />
                <SkillsLevelCard
                  title={skillsT('byLevel')}
                  total={totalSkills}
                  stats={levelStats}
                  labels={{
                    expert: skillsT('levels.expert'),
                    advanced: skillsT('levels.advanced'),
                    intermediate: skillsT('levels.intermediate'),
                    beginner: skillsT('levels.beginner'),
                  }}
                />
              </AppSidebarLeft>
            </Suspense>
          }
          rightSidebar={
            <Suspense fallback={<RightSidebarFallback />}>
              <SkillsLearningCard
                title={skillsT('learningOverview')}
                totalDays={totalLearningDays}
                totalDaysLabel={skillsT('cumulativeLearning')}
                longestSkill={longestSkill?.name || '-'}
                longestExperience={longestExperience}
                longestLabel={skillsT('longestExperience')}
              />
              <SkillsCategoryCard
                title={skillsT('byCategory')}
                stats={categoryStats}
                labels={{
                  frontend: skillsT('categories.frontend'),
                  backend: skillsT('categories.backend'),
                  database: skillsT('categories.database'),
                  tools: skillsT('categories.tools'),
                  other: skillsT('categories.other'),
                }}
              />
              <SkillsProjectCard
                title={skillsT('projectOverview')}
                projectLinks={projectLinks}
                projectLinksLabel={skillsT('projectLinks')}
                coveredSkills={coveredSkills}
                totalSkills={totalSkills}
                coveredSkillsLabel={skillsT('coveredSkills')}
              />
            </Suspense>
          }
          content={
            <div className="space-y-3 sm:space-y-4">
              <MobilePageHeader
                title={skillsT('title')}
                subtitle={skillsT('subtitle')}
                backHref={`/${locale}`}
                backLabel={navT('skills')}
              />
              <SkillList
                skills={skills}
                stats={{ totalSkills }}
                categoryStats={categoryStats}
                labels={{
                  title: skillsT('title'),
                  subtitle: skillsT('subtitle'),
                  allSkills: skillsT('allSkills'),
                  knowledgeBrain: skillsT('knowledgeBrain'),
                  mapHint: skillsT('mapHint'),
                  levelLabels: {
                    expert: skillsT('levels.expert'),
                    advanced: skillsT('levels.advanced'),
                    intermediate: skillsT('levels.intermediate'),
                    beginner: skillsT('levels.beginner'),
                  },
                  categoryLabels: {
                    frontend: skillsT('categories.frontend'),
                    backend: skillsT('categories.backend'),
                    database: skillsT('categories.database'),
                    tools: skillsT('categories.tools'),
                    other: skillsT('categories.other'),
                  },
                  locale,
                }}
              />
            </div>
          }
        />
    </div>
  )
}
