import TopBar from "@/app/components/top-bar";
import Form from "../[id]/edit/Form";

export const dynamic = 'force-dynamic';

const MatchAdd = async () => {
    return (
        <div className="h-full px-4 py-2 flex flex-col">
            <div className="shrink-0">
                <TopBar title="新增比赛" />
            </div>
            <Form formPromise={Promise.resolve({ match_name: '', match_time: new Date() })} />
        </div>
    )
}

export default MatchAdd;