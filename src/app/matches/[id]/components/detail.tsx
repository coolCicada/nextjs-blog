import { use } from "react";
import { Game } from "../../components/games";
import dayjs from "dayjs";

const Detail = ({ gamePromise }: { gamePromise: Promise<Game | null> }) => {
    const game = use(gamePromise);
    return (
        <div className="flex-1">
            {game && <>
                <p>{game.match_name}</p>
                <p>{dayjs(game.match_time).format('YYYY-MM-DD HH:mm:ss')}</p>
            </>}
        </div>
    )
}

export default Detail;