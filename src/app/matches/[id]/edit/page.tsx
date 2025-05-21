import { getMatchById } from "@/app/db/matches";
import Form from "./Form";
import { Suspense } from "react";
import TopBar from "@/app/components/top-bar";


export const dynamic = 'force-dynamic';

interface Params {
    id: string;
}

const DetailEdit = async ({ params }: { params: Promise<Params> }) => {
    const r = getMatchById((await params).id)
    return (
        <div className="h-full px-4 py-2 flex flex-col">
            <div className="shrink-0">
                <TopBar title="比赛详情编辑" />
            </div>
            <Suspense fallback={<p>加载比赛详情...</p>}>
                <Form formPromise={r} />
            </Suspense>
        </div>
    )
}

export default DetailEdit;