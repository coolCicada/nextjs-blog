import { Suspense } from "react";
import Games from "./components/games";
import { getAllMatches } from "@/app/db/matches";
import TopBar from "../components/top-bar";
import JumpToAdd from "./components/jump-to-add";

export const dynamic = 'force-dynamic';

const Matches = async () => {
    const gamesPromise = getAllMatches()
    return (
        <div className="h-full flex flex-col px-4 py-2">
            <div className="shrink-0">
                <TopBar title="比赛列表" />
            </div>
            <div className="overflow-y-auto -mx-4 px-4">
                <Suspense fallback={<p>列表加载中...</p>}>
                    <Games gamesPromise={gamesPromise} />
                </Suspense>
            </div>
            <div className="fixed bottom-4 right-4">
                <JumpToAdd />
            </div>
        </div>
    )
}

export default Matches;