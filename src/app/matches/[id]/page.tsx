import { getMatchById } from "@/app/db/matches";
import JumpToEdit from "./components/jump-to-edit";
import TopBar from "@/app/components/top-bar";
import Detail from "./components/detail";
import { Suspense } from "react";
import Delete from "./components/delete";

export const dynamic = 'force-dynamic';

interface Params {
    id: string;
}

const DetailPage = async ({ params }: { params: Promise<Params> }) => {
    const id = (await params).id;
    const gamePromise = getMatchById(id)
    return (
        <div className="h-full flex flex-col px-4 py-2">
            <TopBar title="比赛详情" />
            <Suspense fallback={<p>详情加载中...</p>}>
                <Detail gamePromise={gamePromise} />
            </Suspense>
            <div className="mt-auto flex gap-2">
                <div className="flex-1">
                    <JumpToEdit />
                </div>
                <div className="flex-1">
                    <Delete id={id} />
                </div>
            </div>
        </div>
    )
}

export default DetailPage;