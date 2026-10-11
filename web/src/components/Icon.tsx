'use client'

import { Icon as IconifyIcon } from '@iconify/react'

interface IconProps {
  name: string
  className?: string
}

export default function Icon({ name, className = '' }: IconProps) {
  return <IconifyIcon icon={name} className={className} />
}

