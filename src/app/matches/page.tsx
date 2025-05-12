import { Suspense } from "react";
import Games from "./components/games";
import { getAllMatches } from "../db";

export const dynamic = 'force-dynamic';

const Matches = async () => {
    const gamesPromise = getAllMatches()
    return (
        <div className="flex flex-col p-7 pb-0">
            <div className="text-center text-2xl">比赛</div>
            <Suspense fallback={<p>Loading Comments...</p>}>
                <Games gamesPromise={gamesPromise} />
            </Suspense>
        </div>
    )
}

export default Matches;