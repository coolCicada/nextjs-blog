import { Suspense } from "react";
import Games from "./components/games";
import { getAllMatches } from "../db";

const Matches = async () => {
    const gamesPromise = getAllMatches()
    return (
        <div>
            <div>比赛</div>
            <Suspense fallback={<p>Loading Comments...</p>}>
                <Games gamesPromise={gamesPromise} />
            </Suspense>
        </div>
    )
}

export default Matches;