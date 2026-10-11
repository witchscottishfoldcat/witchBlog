'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Icon } from '@iconify/react'
import { useTranslations } from 'next-intl'
import { flushSync } from 'react-dom'

export interface Skill {
  id: string
  name: string
  description: string
  level: 'expert' | 'advanced' | 'intermediate' | 'beginner'
  category: 'frontend' | 'backend' | 'database' | 'tools' | 'other'
  experience: { years: number; months: number }
  projects: number
  icon?: string
  color?: string
  locale: string
}

interface SkillListProps {
  skills: Skill[]
  stats: { totalSkills: number }
  categoryStats: Record<Skill['category'], number>
  labels: {
    title: string
    subtitle: string
    allSkills: string
    knowledgeBrain: string
    mapHint: string
    levelLabels: Record<Skill['level'], string>
    categoryLabels: Record<Skill['category'], string>
    locale: string
  }
}

type CategoryFilter = 'all' | Skill['category']
type Point = { x: number; y: number }
type SkillMapNode = { skill: Skill; category: Skill['category']; point: Point; escapedOverlap?: boolean }

const MAP_WIDTH = 1000
const MAP_HEIGHT = 720
const BRAIN_POINT: Point = { x: 500, y: 350 }
const OVERVIEW_BRAIN_POINT: Point = { x: 205, y: 350 }

const levelStyles = {
  expert: { score: 100, background: 'var(--theme-primary-100)', color: 'var(--theme-primary-800)' },
  advanced: { score: 82, background: 'var(--theme-primary-100)', color: 'var(--theme-primary-700)' },
  intermediate: { score: 62, background: 'var(--theme-primary-50)', color: 'var(--theme-primary-700)' },
  beginner: { score: 38, background: 'var(--theme-primary-50)', color: 'var(--theme-primary-600)' },
} as const

const categoryStyles = {
  backend: {
    icon: 'mdi:server-outline',
    accent: 'hsl(var(--theme-hue) 70% 56%)',
    anchor: { x: 445, y: 155 },
  },
  frontend: {
    icon: 'mdi:monitor-dashboard',
    accent: 'hsl(calc(var(--theme-hue) + 65) 68% 56%)',
    anchor: { x: 825, y: 150 },
  },
  database: {
    icon: 'mdi:database-outline',
    accent: 'hsl(calc(var(--theme-hue) + 130) 62% 47%)',
    anchor: { x: 560, y: 380 },
  },
  tools: {
    icon: 'mdi:tools',
    accent: 'hsl(calc(var(--theme-hue) + 205) 68% 57%)',
    anchor: { x: 825, y: 520 },
  },
  other: {
    icon: 'mdi:shape-outline',
    accent: 'hsl(calc(var(--theme-hue) + 275) 64% 58%)',
    anchor: { x: 515, y: 625 },
  },
} as const

const UPPER_BRANCH_POINT: Point = { x: 455, y: 245 }
const MIDDLE_BRANCH_POINT: Point = { x: 400, y: 350 }
const LOWER_BRANCH_POINT: Point = { x: 455, y: 485 }

const brainBranchSegments: Array<{ from: Point; to: Point; bend: number }> = [
  { from: OVERVIEW_BRAIN_POINT, to: MIDDLE_BRANCH_POINT, bend: 0 },
  { from: MIDDLE_BRANCH_POINT, to: UPPER_BRANCH_POINT, bend: -18 },
  { from: MIDDLE_BRANCH_POINT, to: LOWER_BRANCH_POINT, bend: 18 },
]

const categoryBranchOrigins: Record<Skill['category'], Point> = {
  backend: UPPER_BRANCH_POINT,
  frontend: UPPER_BRANCH_POINT,
  database: MIDDLE_BRANCH_POINT,
  tools: LOWER_BRANCH_POINT,
  other: LOWER_BRANCH_POINT,
}

type BrandIconConfig = {
  slug: string
  color: string
  preferredSources?: string[]
}

const brandIcons: Record<string, BrandIconConfig> = {
  'node.js': { slug: 'nodedotjs', color: '5FA04E' },
  nodejs: { slug: 'nodedotjs', color: '5FA04E' },
  java: {
    slug: 'openjdk',
    color: 'ED8B00',
    preferredSources: ['https://api.iconify.design/devicon-plain/java.svg?color=%23ED8B00'],
  },
  python: { slug: 'python', color: '3776AB' },
  'c#': { slug: 'sharp', color: '512BD4' },
  go: { slug: 'go', color: '00ADD8' },
  rust: { slug: 'rust', color: '000000' },
  react: { slug: 'react', color: '149ECA' },
  'vue.js': { slug: 'vuedotjs', color: '42B883' },
  vue: { slug: 'vuedotjs', color: '42B883' },
  mysql: { slug: 'mysql', color: '4479A1' },
  redis: { slug: 'redis', color: 'DC382D' },
  git: { slug: 'git', color: 'F05032' },
  docker: { slug: 'docker', color: '2496ED' },
  typescript: { slug: 'typescript', color: '3178C6' },
  javascript: { slug: 'javascript', color: 'F7DF1E' },
  spring: { slug: 'spring', color: '6DB33F' },
  fastapi: { slug: 'fastapi', color: '009688' },
  postgresql: { slug: 'postgresql', color: '4169E1' },
  mongodb: { slug: 'mongodb', color: '47A248' },
}

const categoryOrder: Skill['category'][] = ['backend', 'frontend', 'database', 'tools', 'other']

export default function SkillList({ skills, stats, categoryStats, labels }: SkillListProps) {
  const t = useTranslations('skills')
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all')
  const [hoveredCategory, setHoveredCategory] = useState<Skill['category'] | null>(null)
  const [showAllSkills, setShowAllSkills] = useState(false)
  const [brainBloomed, setBrainBloomed] = useState(false)

  const availableCategories = categoryOrder.filter((category) => categoryStats[category] > 0)
  const skillsByCategory = useMemo(
    () => Object.fromEntries(categoryOrder.map((category) => [category, skills.filter((skill) => skill.category === category)])) as Record<Skill['category'], Skill[]>,
    [skills]
  )
  const focusedMapNodes = useMemo(
    () => activeCategory === 'all' ? [] : buildFocusedMapNodes(skillsByCategory[activeCategory], activeCategory),
    [activeCategory, skillsByCategory]
  )
  const bloomMapNodes = useMemo(
    () => brainBloomed ? buildBloomMapNodes(skillsByCategory) : [],
    [brainBloomed, skillsByCategory]
  )
  const focusCategory = hoveredCategory ?? activeCategory
  const activeCategoryStyle = activeCategory === 'all' ? null : categoryStyles[activeCategory]
  const displayedBrainPoint = activeCategory === 'all' && !brainBloomed ? OVERVIEW_BRAIN_POINT : BRAIN_POINT

  const runViewTransition = (update: () => void) => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const viewTransitionDocument = document as Document & {
      startViewTransition?: (callback: () => void) => void
    }

    if (!reducedMotion && viewTransitionDocument.startViewTransition) {
      viewTransitionDocument.startViewTransition(() => flushSync(update))
      return
    }
    update()
  }

  const selectCategory = (category: CategoryFilter) => {
    runViewTransition(() => {
      setShowAllSkills(false)
      setBrainBloomed(false)
      setActiveCategory((current) => current === category && category !== 'all' ? 'all' : category)
    })
  }

  const handleBrainClick = () => {
    runViewTransition(() => {
      setShowAllSkills(false)
      if (activeCategory !== 'all') {
        setActiveCategory('all')
        setBrainBloomed(false)
        return
      }
      setBrainBloomed((current) => !current)
    })
  }

  const toggleAllSkills = () => {
    runViewTransition(() => {
      setShowAllSkills((current) => !current)
      setActiveCategory('all')
      setBrainBloomed(false)
    })
  }

  const formatExperience = (experience: Skill['experience']) => {
    const parts: string[] = []
    if (experience.years > 0) parts.push(`${experience.years}${t('year')}`)
    if (experience.months > 0) parts.push(`${experience.months}${t('month')}`)
    return parts.join(' ') || t('zeroMonths')
  }

  return (
    <section
      className="overflow-hidden rounded-2xl border px-3 py-4 shadow-sm sm:px-5 sm:py-6 lg:px-6"
      style={{ backgroundColor: 'var(--theme-card-bg-90)', borderColor: 'var(--theme-card-border)' }}
    >
      <header className="hidden items-start justify-between gap-4 md:flex">
        <div className="flex items-start gap-3">
          <span className="mt-1 h-10 w-1 shrink-0 rounded-full bg-[var(--theme-primary-500)]" aria-hidden />
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 lg:text-3xl">{labels.title}</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 lg:text-base">{labels.subtitle}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full bg-[var(--theme-primary-50)] px-3 py-1.5 text-xs text-[var(--theme-primary-600)] 2xl:inline-flex">
            <Icon icon="mdi:gesture-tap" className="h-4 w-4" aria-hidden />
            {labels.mapHint}
          </span>
          <button
            type="button"
            onClick={toggleAllSkills}
            aria-expanded={showAllSkills}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--theme-primary-200)] bg-[var(--theme-card-bg)] px-3 py-1.5 text-xs font-bold text-[var(--theme-primary-600)] shadow-sm transition hover:-translate-y-0.5 hover:bg-[var(--theme-primary-50)] hover:shadow-md"
          >
            <Icon icon={showAllSkills ? 'mdi:brain' : 'mdi:unfold-more-horizontal'} className="h-4 w-4" aria-hidden />
            {showAllSkills ? t('backToMindMap') : t('expandAll')}
            <span className="rounded-full bg-[var(--theme-primary-100)] px-1.5 py-0.5 text-[9px]">{stats.totalSkills}</span>
          </button>
        </div>
      </header>

      <div className="mt-0 hidden md:mt-4 xl:block">
        {showAllSkills ? (
          <ExpandedSkillsGrid
            availableCategories={availableCategories}
            skillsByCategory={skillsByCategory}
            labels={labels}
            formatExperience={formatExperience}
          />
        ) : (
        <div className="skill-mindmap-stage relative mx-auto aspect-[25/18] min-h-[610px] w-full" role="group" aria-label={labels.mapHint}>
          <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} preserveAspectRatio="none" aria-hidden>
            <defs>
              <filter id="skill-neural-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            {activeCategory === 'all' && !brainBloomed && brainBranchSegments.map((branch, index) => {
              const path = curvedPath(branch.from, branch.to, branch.bend)
              return (
                <g key={`${branch.from.x}-${branch.to.x}-${branch.to.y}`} opacity="0.72">
                  <path d={path} fill="none" stroke="var(--theme-primary-400)" strokeWidth="14" strokeLinecap="round" opacity="0.09" vectorEffect="non-scaling-stroke" />
                  <path
                    className="skill-neural-path"
                    pathLength="1"
                    d={path}
                    fill="none"
                    stroke="var(--theme-primary-400)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                    style={{ animationDelay: `${index * 100}ms` }}
                  />
                </g>
              )
            })}
            {activeCategory === 'all' ? availableCategories.map((category, index) => {
              const style = categoryStyles[category]
              const visible = focusCategory === 'all' || focusCategory === category
              const branchOrigin = categoryBranchOrigins[category]
              const path = curvedPath(branchOrigin, style.anchor, categoryBranchBend(category))
              return (
                <g key={category} style={{ opacity: visible ? 1 : 0.12, transition: 'opacity 240ms ease' }}>
                  {!brainBloomed && (
                    <>
                      <path d={path} fill="none" stroke={style.accent} strokeWidth="12" strokeLinecap="round" opacity="0.1" vectorEffect="non-scaling-stroke" />
                      <path
                        className="skill-neural-path"
                        pathLength="1"
                        d={path}
                        fill="none"
                        stroke={style.accent}
                        strokeWidth="3"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                        style={{ animationDelay: `${index * 90}ms` }}
                      />
                      <path className="skill-neural-flow" d={path} fill="none" stroke={style.accent} strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                    </>
                  )}
                  {brainBloomed && bloomMapNodes.filter((node) => node.category === category).map((node, nodeIndex) => (
                    <path
                      key={node.skill.id}
                      className="skill-neural-path"
                      pathLength="1"
                      d={curvedPath(BRAIN_POINT, node.point, nodeIndex % 2 === 0 ? 18 : -18)}
                      fill="none"
                      stroke={style.accent}
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      opacity="0.55"
                      vectorEffect="non-scaling-stroke"
                      style={{ animationDelay: `${Math.min(nodeIndex, 20) * 40 + 60}ms` }}
                    />
                  ))}
                  <circle cx={style.anchor.x} cy={style.anchor.y} r="8" fill={style.accent} filter="url(#skill-neural-glow)" />
                </g>
              )
            }) : focusedMapNodes.map((node, nodeIndex) => (
              <path
                key={node.skill.id}
                className="skill-neural-focus-path skill-neural-path"
                pathLength="1"
                d={curvedPath(BRAIN_POINT, node.point, nodeIndex % 2 === 0 ? 20 : -20)}
                fill="none"
                stroke={activeCategoryStyle?.accent}
                strokeWidth="2"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                style={{ animationDelay: `${nodeIndex * 45 + 90}ms` }}
              />
            ))}
          </svg>

          <button
            type="button"
            onClick={handleBrainClick}
            aria-pressed={activeCategory === 'all'}
            aria-expanded={activeCategory === 'all' && brainBloomed}
            className="skill-brain-node absolute z-20 flex h-36 w-36 -translate-x-1/2 -translate-y-1/2 select-none flex-col items-center justify-center rounded-full border-[5px] text-center caret-transparent shadow-xl transition-transform duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--theme-primary-200)] 2xl:h-40 2xl:w-40"
            style={{
              left: `${displayedBrainPoint.x / 10}%`,
              top: `${displayedBrainPoint.y / 7.2}%`,
              background: activeCategoryStyle
                ? `radial-gradient(circle at 35% 28%, var(--theme-card-bg), color-mix(in srgb, ${activeCategoryStyle.accent} 20%, var(--theme-primary-50)))`
                : 'radial-gradient(circle at 35% 28%, var(--theme-card-bg), var(--theme-primary-100))',
              borderColor: activeCategoryStyle?.accent || 'var(--theme-primary-300)',
              color: activeCategoryStyle?.accent || 'var(--theme-primary-700)',
            }}
          >
            <span className="pointer-events-none absolute -inset-4 rounded-full border border-dashed border-[var(--theme-primary-200)]" aria-hidden />
            <span className="pointer-events-none absolute -inset-8 rounded-full border border-[var(--theme-primary-100)]" aria-hidden />
            <span className="mb-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70 shadow-sm dark:bg-gray-900/60">
              <Icon icon={activeCategoryStyle?.icon || 'mdi:brain'} className="h-9 w-9" aria-hidden />
            </span>
            <span className="max-w-[116px] truncate text-sm font-black">
              {activeCategory === 'all' ? labels.knowledgeBrain : labels.categoryLabels[activeCategory]}
            </span>
            <span className="mt-0.5 text-[10px] opacity-70">
              {activeCategory === 'all' ? stats.totalSkills : categoryStats[activeCategory]} {labels.allSkills}
            </span>
          </button>

          {activeCategory === 'all' && !brainBloomed && availableCategories.map((category, index) => {
            const style = categoryStyles[category]
            const visible = focusCategory === 'all' || focusCategory === category
            const percentage = stats.totalSkills > 0 ? Math.round(categoryStats[category] / stats.totalSkills * 100) : 0
            const preview = skillsByCategory[category].slice(0, 3).map((skill) => skill.name).join(' · ')
            return (
              <button
                key={category}
                type="button"
                onClick={() => selectCategory(category)}
                onMouseEnter={() => setHoveredCategory(category)}
                onMouseLeave={() => setHoveredCategory(null)}
                onFocus={() => setHoveredCategory(category)}
                onBlur={() => setHoveredCategory(null)}
                aria-pressed={false}
                className="skill-map-category absolute z-20 w-[190px] -translate-x-1/2 -translate-y-1/2 rounded-[22px] border px-4 py-3 text-left text-gray-800 shadow-sm transition-all duration-300 hover:-translate-y-[54%] hover:scale-[1.03] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary-300)] dark:text-gray-100 2xl:w-[210px]"
                style={{
                  left: `${style.anchor.x / 10}%`,
                  top: `${style.anchor.y / 7.2}%`,
                  background: `linear-gradient(135deg, var(--theme-card-bg) 38%, color-mix(in srgb, ${style.accent} 9%, var(--theme-card-bg)))`,
                  borderColor: style.accent,
                  opacity: visible ? 1 : 0.28,
                  animationDelay: `${index * 70 + 100}ms`,
                  boxShadow: `0 12px 32px color-mix(in srgb, ${style.accent} 10%, transparent)`,
                }}
              >
                <span className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                    style={{ color: style.accent, backgroundColor: `color-mix(in srgb, ${style.accent} 13%, transparent)` }}
                  >
                    <Icon icon={style.icon} className="h-6 w-6" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-black">{labels.categoryLabels[category]}</span>
                    <span className="mt-0.5 block text-[10px] text-gray-400 dark:text-gray-500">{categoryStats[category]} {labels.allSkills}</span>
                  </span>
                  <span className="text-lg font-black" style={{ color: style.accent }}>{percentage}%</span>
                </span>
                <span className="mt-2 block truncate text-[10px] text-gray-400 dark:text-gray-500">{preview}</span>
                <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <span className="block h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: style.accent }} />
                </span>
              </button>
            )
          })}

          {activeCategory === 'all' && brainBloomed && bloomMapNodes.map((node, index) => {
            const style = categoryStyles[node.category]
            const visible = focusCategory === 'all' || focusCategory === node.category
            return (
              <Link
                key={node.skill.id}
                href={`/${labels.locale}/skills/${node.skill.id}`}
                onMouseEnter={() => setHoveredCategory(node.category)}
                onMouseLeave={() => setHoveredCategory(null)}
                onFocus={() => setHoveredCategory(node.category)}
                onBlur={() => setHoveredCategory(null)}
                className="skill-map-leaf absolute z-10 flex w-[clamp(88px,13%,118px)] -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-xl border p-1.5 shadow-sm transition-all duration-300 hover:z-30 hover:-translate-y-[54%] hover:scale-105 hover:shadow-lg focus-visible:z-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary-300)]"
                style={{
                  left: `${node.point.x / 10}%`,
                  top: `${node.point.y / 7.2}%`,
                  backgroundColor: 'var(--theme-card-bg)',
                  borderColor: `color-mix(in srgb, ${style.accent} 38%, var(--theme-card-border))`,
                  opacity: visible ? 1 : 0.16,
                  animationDelay: `${Math.min(index, 24) * 35 + 150}ms`,
                  viewTransitionName: `skill-card-${node.skill.id}`,
                }}
              >
                <SkillBrandIcon skill={node.skill} compact />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[10px] font-bold text-gray-900 dark:text-gray-100">{node.skill.name}</span>
                  <span className="mt-0.5 block truncate text-[9px] text-gray-400 dark:text-gray-400">{formatExperience(node.skill.experience)}</span>
                  <span className="mt-1 block h-1 overflow-hidden rounded-full bg-[var(--theme-primary-50)] dark:bg-gray-800">
                    <span className="block h-full rounded-full" style={{ width: `${levelStyles[node.skill.level].score}%`, backgroundColor: brandColor(node.skill, style.accent) }} />
                  </span>
                </span>
              </Link>
            )
          })}

          {focusedMapNodes.map((node, index) => {
            const style = categoryStyles[node.category]
            const visible = focusCategory === 'all' || focusCategory === node.category
            return (
              <Link
                key={node.skill.id}
                href={`/${labels.locale}/skills/${node.skill.id}`}
                onMouseEnter={() => setHoveredCategory(node.category)}
                onMouseLeave={() => setHoveredCategory(null)}
                onFocus={() => setHoveredCategory(node.category)}
                onBlur={() => setHoveredCategory(null)}
                className="skill-map-leaf absolute z-10 flex w-[clamp(96px,16%,142px)] -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-xl border p-2 shadow-sm transition-all duration-300 hover:z-30 hover:-translate-y-[54%] hover:scale-105 hover:shadow-lg focus-visible:z-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary-300)]"
                style={{
                  left: `${node.point.x / 10}%`,
                  top: `${node.point.y / 7.2}%`,
                  backgroundColor: 'var(--theme-card-bg)',
                  borderColor: `color-mix(in srgb, ${style.accent} 38%, var(--theme-card-border))`,
                  opacity: visible ? 1 : 0.16,
                  animationDelay: `${Math.min(index, 12) * 55 + 180}ms`,
                  viewTransitionName: `skill-card-${node.skill.id}`,
                }}
              >
                <SkillBrandIcon skill={node.skill} compact />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-bold text-gray-900 dark:text-gray-100">{node.skill.name}</span>
                  <span className="mt-0.5 block truncate text-[9px] text-gray-400 dark:text-gray-500">{formatExperience(node.skill.experience)}</span>
                  <span className="mt-1 block h-1 overflow-hidden rounded-full bg-[var(--theme-primary-50)] dark:bg-gray-800">
                    <span className="block h-full rounded-full" style={{ width: `${levelStyles[node.skill.level].score}%`, backgroundColor: brandColor(node.skill, style.accent) }} />
                  </span>
                </span>
              </Link>
            )
          })}
        </div>
        )}
      </div>

      <div className="mt-0 md:mt-5 xl:hidden">
        <button
          type="button"
          onClick={() => selectCategory('all')}
          className="mx-auto flex h-24 w-24 flex-col items-center justify-center rounded-full border-4 shadow-lg transition-transform active:scale-95"
          style={{ backgroundColor: 'var(--theme-primary-100)', borderColor: 'var(--theme-primary-300)', color: 'var(--theme-primary-700)' }}
        >
          <Icon icon="mdi:brain" className="h-9 w-9" aria-hidden />
          <span className="mt-1 max-w-20 truncate text-[11px] font-bold">{labels.knowledgeBrain}</span>
          <span className="text-[9px] opacity-70">{stats.totalSkills}</span>
        </button>

        <div className="relative mt-5 space-y-4 before:absolute before:bottom-6 before:left-1/2 before:top-0 before:w-px before:-translate-x-1/2 before:bg-[var(--theme-primary-200)]">
          {availableCategories.map((category) => {
            const style = categoryStyles[category]
            const open = activeCategory === 'all' || activeCategory === category
            return (
              <section key={category} className="relative">
                <button
                  type="button"
                  onClick={() => selectCategory(category)}
                  aria-expanded={open}
                  className="relative z-10 mx-auto flex min-w-32 items-center justify-center gap-2 rounded-full border px-4 py-2 text-xs font-bold text-gray-800 shadow-sm dark:text-gray-100"
                  style={{ backgroundColor: 'var(--theme-card-bg)', borderColor: style.accent }}
                >
                  <Icon icon={style.icon} className="h-4 w-4" style={{ color: style.accent }} aria-hidden />
                  {labels.categoryLabels[category]}
                  <span className="opacity-60">{categoryStats[category]}</span>
                </button>
                {open && (
                  <div className="relative z-10 mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {skillsByCategory[category].map((skill, index) => (
                      <MobileSkillNode
                        key={skill.id}
                        skill={skill}
                        locale={labels.locale}
                        experience={formatExperience(skill.experience)}
                        levelLabel={labels.levelLabels[skill.level]}
                        accent={style.accent}
                        index={index}
                      />
                    ))}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function ExpandedSkillsGrid({
  availableCategories,
  skillsByCategory,
  labels,
  formatExperience,
}: {
  availableCategories: Skill['category'][]
  skillsByCategory: Record<Skill['category'], Skill[]>
  labels: SkillListProps['labels']
  formatExperience: (experience: Skill['experience']) => string
}) {
  return (
    <div className="skill-card-enter space-y-4 rounded-[26px] border border-[var(--theme-primary-100)] bg-[var(--theme-primary-50)]/35 p-3 sm:p-4">
      <div className="flex items-center justify-between rounded-2xl bg-[var(--theme-card-bg)] px-4 py-3 shadow-sm">
        <span className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--theme-primary-100)] text-[var(--theme-primary-600)]">
            <Icon icon="mdi:brain" className="h-6 w-6" aria-hidden />
          </span>
          <span>
            <span className="block text-sm font-black text-gray-900 dark:text-gray-100">{labels.knowledgeBrain}</span>
            <span className="block text-[10px] text-gray-400 dark:text-gray-500">{labels.allSkills}</span>
          </span>
        </span>
        <span className="text-2xl font-black text-[var(--theme-primary-600)]">
          {availableCategories.reduce((total, category) => total + skillsByCategory[category].length, 0)}
        </span>
      </div>

      {availableCategories.map((category) => {
        const style = categoryStyles[category]
        const categorySkills = skillsByCategory[category]
        return (
          <section
            key={category}
            className="overflow-hidden rounded-[22px] border bg-[var(--theme-card-bg)] shadow-sm"
            style={{ borderColor: `color-mix(in srgb, ${style.accent} 30%, var(--theme-card-border))` }}
          >
            <header
              className="flex items-center justify-between border-b px-4 py-3"
              style={{ borderColor: `color-mix(in srgb, ${style.accent} 18%, var(--theme-card-border))`, backgroundColor: `color-mix(in srgb, ${style.accent} 6%, var(--theme-card-bg))` }}
            >
              <span className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ color: style.accent, backgroundColor: `color-mix(in srgb, ${style.accent} 13%, transparent)` }}>
                  <Icon icon={style.icon} className="h-5 w-5" aria-hidden />
                </span>
                <span className="text-sm font-black text-gray-900 dark:text-gray-100">{labels.categoryLabels[category]}</span>
              </span>
              <span className="rounded-full px-2.5 py-1 text-xs font-black" style={{ color: style.accent, backgroundColor: `color-mix(in srgb, ${style.accent} 11%, transparent)` }}>
                {categorySkills.length}
              </span>
            </header>
            <div className="grid grid-cols-2 gap-2.5 p-3 2xl:grid-cols-3">
              {categorySkills.map((skill, index) => (
                <ExpandedSkillCard
                  key={skill.id}
                  skill={skill}
                  locale={labels.locale}
                  experience={formatExperience(skill.experience)}
                  levelLabel={labels.levelLabels[skill.level]}
                  accent={style.accent}
                  index={index}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function ExpandedSkillCard({
  skill,
  locale,
  experience,
  levelLabel,
  accent,
  index,
}: {
  skill: Skill
  locale: string
  experience: string
  levelLabel: string
  accent: string
  index: number
}) {
  const level = levelStyles[skill.level]
  return (
    <Link
      href={`/${locale}/skills/${skill.id}`}
      className="skill-card-enter group min-w-0 rounded-2xl border p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
      style={{
        background: `linear-gradient(145deg, var(--theme-card-bg), color-mix(in srgb, ${accent} 4%, var(--theme-card-bg)))`,
        borderColor: `color-mix(in srgb, ${accent} 24%, var(--theme-card-border))`,
        animationDelay: `${Math.min(index, 12) * 35}ms`,
        viewTransitionName: `skill-card-${skill.id}`,
      }}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <SkillBrandIcon skill={skill} compact />
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <span className="truncate text-xs font-black text-gray-900 dark:text-gray-100">{skill.name}</span>
            <span className="shrink-0 rounded-md px-1.5 py-0.5 text-[8px]" style={{ backgroundColor: level.background, color: level.color }}>{levelLabel}</span>
          </span>
          <span className="mt-0.5 block text-[9px] text-gray-400 dark:text-gray-500">{experience}</span>
        </span>
      </span>
      <span className="mt-2 line-clamp-2 min-h-7 text-[10px] leading-3.5 text-gray-500 dark:text-gray-400">
        {skill.description || skill.name}
      </span>
      <span className="mt-2 block h-1 overflow-hidden rounded-full bg-[var(--theme-primary-50)] dark:bg-gray-800">
        <span className="block h-full rounded-full" style={{ width: `${level.score}%`, backgroundColor: brandColor(skill, accent) }} />
      </span>
    </Link>
  )
}

function MobileSkillNode({
  skill,
  locale,
  experience,
  levelLabel,
  accent,
  index,
}: {
  skill: Skill
  locale: string
  experience: string
  levelLabel: string
  accent: string
  index: number
}) {
  const level = levelStyles[skill.level]
  return (
    <Link
      href={`/${locale}/skills/${skill.id}`}
      className="skill-card-enter group flex min-w-0 items-center gap-3 rounded-2xl border p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
      style={{
        backgroundColor: 'var(--theme-card-bg)',
        borderColor: `color-mix(in srgb, ${accent} 34%, var(--theme-card-border))`,
        animationDelay: `${index * 55}ms`,
        viewTransitionName: `skill-card-${skill.id}`,
      }}
    >
      <SkillBrandIcon skill={skill} />
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className="truncate text-sm font-bold text-gray-900 dark:text-gray-100">{skill.name}</span>
          <span className="shrink-0 rounded-md px-2 py-0.5 text-[9px]" style={{ backgroundColor: level.background, color: level.color }}>{levelLabel}</span>
        </span>
        <span className="mt-1 block truncate text-[10px] text-gray-400 dark:text-gray-500">{experience}</span>
        <span className="mt-2 block h-1 overflow-hidden rounded-full bg-[var(--theme-primary-50)] dark:bg-gray-800">
          <span className="block h-full rounded-full" style={{ width: `${level.score}%`, backgroundColor: brandColor(skill, accent) }} />
        </span>
      </span>
    </Link>
  )
}

function SkillBrandIcon({ skill, compact = false }: { skill: Skill; compact?: boolean }) {
  const sources = useMemo(() => buildBrandIconSources(skill), [skill])
  const [sourceIndex, setSourceIndex] = useState(0)
  const sizeClass = compact ? 'h-8 w-8 rounded-lg p-1.5' : 'h-11 w-11 rounded-xl p-2'
  const monogram = skill.name
    .split(/[\s.\-_]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  useEffect(() => {
    setSourceIndex(0)
  }, [sources])

  const source = sources[sourceIndex]

  if (!source) {
    return (
      <span className={`flex shrink-0 items-center justify-center bg-[var(--theme-primary-100)] text-[9px] font-black text-[var(--theme-primary-700)] ${sizeClass}`}>
        {monogram}
      </span>
    )
  }

  return (
    <span className={`flex shrink-0 items-center justify-center bg-[var(--theme-primary-50)] ${sizeClass}`}>
      <img
        src={source}
        alt={`${skill.name} logo`}
        className="h-full w-full object-contain"
        loading="lazy"
        onError={() => setSourceIndex((current) => current + 1)}
      />
    </span>
  )
}

function buildBrandIconSources(skill: Skill) {
  const normalizedName = skill.name.trim().toLowerCase()
  const brand = brandIcons[normalizedName]
  const guessedSlug = normalizeBrandSlug(skill.name)
  const color = brand?.color || normalizeHexColor(skill.color) || '64748B'
  const sources = [
    ...(brand?.preferredSources || []),
  ]

  if (brand) {
    sources.push(`https://cdn.simpleicons.org/${encodeURIComponent(brand.slug)}/${color}`)
  }

  if (guessedSlug) {
    const encodedSlug = encodeURIComponent(guessedSlug)
    const encodedColor = encodeURIComponent(`#${color}`)
    sources.push(
      `https://cdn.simpleicons.org/${encodedSlug}`,
      `https://api.iconify.design/logos/${encodedSlug}.svg`,
      `https://api.iconify.design/devicon-plain/${encodedSlug}.svg?color=${encodedColor}`,
      `https://api.iconify.design/devicon/${encodedSlug}.svg`,
      `https://api.iconify.design/skill-icons/${encodedSlug}-dark.svg`,
    )
  }

  return Array.from(new Set(sources))
}

function normalizeBrandSlug(name: string) {
  return name
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

function normalizeHexColor(color?: string) {
  if (!color) return null
  const normalized = color.trim().replace(/^#/, '')
  return /^[0-9a-f]{6}$/i.test(normalized) ? normalized.toUpperCase() : null
}

function buildBloomMapNodes(skillsByCategory: Record<Skill['category'], Skill[]>): SkillMapNode[] {
  const allSkills = categoryOrder.flatMap((category) =>
    skillsByCategory[category].map((skill) => ({ skill, category })))
  const total = allSkills.length
  if (total === 0) return []

  // 全部技能围绕大脑放射：多圈同心环，纵向压扁以贴合宽画布比例
  const ringRadii = [150, 225, 300, 372, 438]
  const ringCapacities = [6, 11, 16, 21, Number.POSITIVE_INFINITY]
  const ySquash = 0.72
  const nodes: SkillMapNode[] = []
  let skillIndex = 0

  ringCapacities.forEach((capacity, ringIndex) => {
    const remaining = total - skillIndex
    const ringCount = Math.min(capacity, remaining)
    if (ringCount <= 0) return

    const angleOffset = -90 + ringIndex * 14
    for (let index = 0; index < ringCount; index += 1) {
      const { skill, category } = allSkills[skillIndex]
      const angleJitter = (stableSkillValue(skill, 17 + ringIndex) - 0.5) * (360 / ringCount) * 0.4
      const angle = angleOffset + index * (360 / ringCount) + angleJitter
      const radians = angle * Math.PI / 180
      nodes.push({
        skill,
        category,
        point: {
          x: roundCoordinate(clampCoordinate(BRAIN_POINT.x + Math.cos(radians) * ringRadii[ringIndex], 62, 938)),
          y: roundCoordinate(clampCoordinate(BRAIN_POINT.y + Math.sin(radians) * ringRadii[ringIndex] * ySquash, 42, 678)),
        },
      })
      skillIndex += 1
    }
  })

  return nodes
}

function buildFocusedMapNodes(skills: Skill[], category: Skill['category']): SkillMapNode[] {
  const ringCapacities = [6, 8, Number.POSITIVE_INFINITY]
  const ringRadii = [150, 245, 330]
  const nodes: SkillMapNode[] = []
  let skillIndex = 0

  ringCapacities.forEach((capacity, ringIndex) => {
    const remaining = skills.length - skillIndex
    const ringCount = Math.min(capacity, remaining)
    if (ringCount <= 0) return

    const angleOffset = -90 + ringIndex * 12
    for (let index = 0; index < ringCount; index += 1) {
      const angle = angleOffset + index * (360 / ringCount)
      const radians = angle * Math.PI / 180
      nodes.push({
        skill: skills[skillIndex],
        category,
        point: {
          x: roundCoordinate(BRAIN_POINT.x + Math.cos(radians) * ringRadii[ringIndex]),
          y: roundCoordinate(BRAIN_POINT.y + Math.sin(radians) * ringRadii[ringIndex]),
        },
      })
      skillIndex += 1
    }
  })

  return nodes
}

function curvedPath(from: Point, to: Point, bend: number) {
  const midpointX = (from.x + to.x) / 2
  const midpointY = (from.y + to.y) / 2
  const dx = to.x - from.x
  const dy = to.y - from.y
  const length = Math.max(Math.hypot(dx, dy), 1)
  const controlX = midpointX - dy / length * bend
  const controlY = midpointY + dx / length * bend
  return `M ${roundCoordinate(from.x)} ${roundCoordinate(from.y)} Q ${roundCoordinate(controlX)} ${roundCoordinate(controlY)} ${roundCoordinate(to.x)} ${roundCoordinate(to.y)}`
}

function categoryBranchBend(category: Skill['category']) {
  const bends: Record<Skill['category'], number> = {
    backend: -24,
    database: 28,
    other: -34,
    frontend: 26,
    tools: -28,
  }
  return bends[category]
}

function stableSkillValue(skill: Skill, salt = 0) {
  let hash = (2166136261 ^ salt) >>> 0
  const input = `${skill.id}:${skill.name}`
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 16777619) >>> 0
  }
  return hash / 4294967295
}

function clampCoordinate(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum)
}

function brandColor(skill: Skill, fallback: string) {
  const brand = brandIcons[skill.name.toLowerCase()]
  return brand ? `#${brand.color}` : fallback
}

function roundCoordinate(value: number) {
  return Number(value.toFixed(3))
}
