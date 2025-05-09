// components/TabBar.tsx
'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import clsx from 'clsx'

const tabs = [
  { label: '主页', path: '/' },
  { label: '比赛', path: '/matches' },
  { label: '个人', path: '/personal' },
]

export default function TabBar() {
  const router = useRouter()
  const pathname = usePathname()

  const handleClick = useCallback((path: string) => {
    router.push(path)
  }, [router])

  return (
    <div className="bottom-0 w-full bg-white border-t flex justify-around py-2">
      {tabs.map((tab) => (
        <button
          key={tab.path}
          onClick={() => handleClick(tab.path)}
          className={clsx(
            'flex-1 text-center py-2',
            pathname === tab.path ? 'text-blue-600 font-bold' : 'text-gray-500'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
