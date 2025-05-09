"use client";
import { Button } from '@/components/ui/button';
import {use, useCallback, useState} from 'react';

export interface Game {
    id: string;
    match_time: Date;
    match_name: string;
}

interface GamesProps {
    gamesPromise: Promise<Game[]>; // Replace 'any' with the actual type if known
}

const Games = ({ gamesPromise }: GamesProps) => {
    const games = use(gamesPromise)
    const [data, setData] = useState<Game[]>([]);
    const getData = useCallback(async () => {
        const r = await fetch('/api/test')
        setData(await r.json());
    }, [setData]);
    return (
        <div>
            <div>Games</div>
            {
                games.map(item => (
                    <div key={item.id}>
                        <div>{item.match_name}</div>
                        <div>{item.match_time.toDateString()}</div>
                    </div>
                ))
            }
            <Button onClick={() => getData()}>获取数据</Button>
            <div>
                {data.map(item => (
                    <div key={item.id}>{item.match_name}</div>
                ))}
            </div>
        </div>
    )
}

export default Games;