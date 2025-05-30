import { Suspense } from 'react';
import Image from 'next/image';
import Users from './users/index'
import WTT from '@/app/static/image.png'
import TabBar from './components/tab-bar';

export const dynamic = 'force-dynamic';

export default function Blog() {
    return (
        <div className="flex flex-col items-center gap-2 p-7 pb-0 md:gap-8 rounded-2xl h-full">
            <div className='max-w-94 mx-auto h-[131px]'>
                <Image placeholder="blur" width={327} height={131} className="shadow-xl rounded-md w-full" src={WTT} alt="123" />
            </div>
            <div className='flex-1 overflow-y-auto flex flex-col'>
                <div className="flex flex-col items-center mb-5">
                    <span className="text-2xl font-medium">世界排名</span>
                    <span className="font-medium text-sky-500">🏓</span>
                    <span className="flex gap-2 font-medium text-gray-600 dark:text-gray-400">
                        {new Date().toUTCString()}
                    </span>
                </div>
                <div className='flex-1 overflow-y-auto'>
                    <Suspense fallback={<div>loading...</div>}>
                        <Users />
                    </Suspense>
                </div>
            </div>
            <div className='w-full flex flex-col'>
                <div className='mb-auto'></div>
                <TabBar />
            </div>
        </div>
    )
}