import { Suspense } from "react";
import Games from "./components/games";
import { getAllMatches } from "@/app/db/matches";
import TopBar from "../components/top-bar";

export const dynamic = 'force-dynamic';

const Matches = async () => {
    const gamesPromise = getAllMatches()
    return (
        <div className="flex flex-col px-4 py-2">
            <div className="shrink-0">
                <TopBar title="比赛列表" />
            </div>
            <Suspense fallback={<p>列表加载中...</p>}>
                <Games gamesPromise={gamesPromise} />
            </Suspense>
        </div>
    )
}

export default Matches;