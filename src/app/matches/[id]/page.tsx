import { getMatchById } from "@/app/db/matches";
import dayjs from 'dayjs';
import JumpToEdit from "./components/jump-to-edit";
import TopBar from "@/app/components/top-bar";

export const dynamic = 'force-dynamic';

interface Params {
    id: string;
}

const Detail = async ({ params }: { params: Promise<Params> }) => {
    const r = await getMatchById((await params).id)
    return (
        <div className="h-full flex flex-col px-4 py-2">
            <TopBar title="比赛详情"/>
            <div className="flex-1">
                {r && <>
                    <p>{r.match_name}</p>
                    <p>{dayjs(r.match_time).format('YYYY-MM-DD HH:mm:ss')}</p>
                </>}
            </div>
            <div>
                <JumpToEdit />
            </div>
        </div>
    )
}

export default Detail;