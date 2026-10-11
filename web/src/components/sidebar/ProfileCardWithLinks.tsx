import type { PublicSiteConfig } from '@/lib/api'
import ResourceLinksIcons from '@/components/ResourceLinksIcons'
import { ProfileCard } from '@/components/Sidebar'
import { profileConfig } from '@/config/assets'

export function buildProfileFallback(siteConfig: PublicSiteConfig) {
  return {
    name: siteConfig.site_name || profileConfig.name,
    // 只使用接口传来的头像，不做默认回退
    avatar: siteConfig.profile_image || '',
    motto: siteConfig.site_signature || profileConfig.motto,
    links: profileConfig.links,
    resourceLinks: [] as Array<{ title: string; url: string; icon: string }>,
  }
}

export async function ProfileCardWithLinks({ siteConfig }: { siteConfig: PublicSiteConfig }) {
  const resourceLinksIcons = await ResourceLinksIcons({ limit: 10 })
  const profileData = {
    name: siteConfig.site_name || profileConfig.name,
    // 只使用接口传来的头像，不做默认回退
    avatar: siteConfig.profile_image || '',
    motto: siteConfig.site_signature || profileConfig.motto,
    links: profileConfig.links,
    resourceLinks: resourceLinksIcons,
  }
  return <ProfileCard {...profileData} />
}
