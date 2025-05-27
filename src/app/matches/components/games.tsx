"use client";
// import { Button } from '@/components/ui/button';
import { use } from 'react';
import Image from 'next/image';
import LeaderBoard from '@/app/static/leaderboard.svg';
import dayjs from 'dayjs';
import Link from 'next/link';

export interface Game {
    id?: string;
    match_time: Date;
    match_name: string;
}

interface GamesProps {
    gamesPromise: Promise<Game[]>; // Replace 'any' with the actual type if known
}

const Games = ({ gamesPromise }: GamesProps) => {
    const games = use(gamesPromise)
    return (
        <div>
            {
                games.map(item => (
                    <div key={item.id} className='flex border-b'>
                        <div className='w-24 h-24 flex items-center justify-center'>
                            <Image className='w-8' src={LeaderBoard} alt="LeaderBoard" />
                        </div>
                        <div className='flex flex-col justify-center'>
                            <Link href={`/matches/${item.id}`} className="text-blue-500 text-sm hover:underline">{item.match_name}</Link>
                            <div>{dayjs(item.match_time).format('YYYY-MM-DD HH:mm:ss')}</div>
                        </div>
                    </div>
                ))
            }
        </div>
    )
}

export default Games;