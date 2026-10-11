'use client'

interface PostPageWrapperProps {
  children: React.ReactNode
}

export default function PostPageWrapper({ children }: PostPageWrapperProps) {
  return <>{children}</>
}
