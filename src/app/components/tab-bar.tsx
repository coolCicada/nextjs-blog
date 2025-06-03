'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import clsx from 'clsx'
import Image from 'next/image';
import Home from '@/app/static/svg/home.svg';
import Match from '@/app/static/svg/match.svg';
import Person from '@/app/static/svg/person.svg';
import Config from '@/app/static/svg/config.svg';

const tabs = [
  { label: <Image className='w-6' src={Home} alt="Home" />, path: '/' },
  { label: <Image className='w-6' src={Match} alt="Match" />, path: '/matches' },
  { label: <Image className='w-6' src={Person} alt="Person" />, path: '/personal' },
  { label: <Image className='w-6' src={Config} alt="Config" />, path: '/own-configs' },
]

export default function TabBar() {
  const router = useRouter()
  const pathname = usePathname()

  const handleClick = useCallback((path: string) => {
    router.push(path)
  }, [router])

  return (
    <div className="bottom-0 h-14 w-full bg-white border-t flex justify-around py-2">
      {tabs.map((tab) => (
        <button
          key={tab.path}
          onClick={() => handleClick(tab.path)}
          className={clsx(
            'flex justify-center',
            pathname === tab.path ? 'text-blue-600 font-bold' : 'text-gray-500'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
