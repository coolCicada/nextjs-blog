import { getMatchById } from "@/app/db/matches";
import Form from "./Form";
import { Suspense } from "react";


export const dynamic = 'force-dynamic';

interface Params {
    id: string;
}

const DetailEdit = async ({ params }: { params: Promise<Params> }) => {
    const r = getMatchById((await params).id)
    return (
        <Suspense fallback={<p>Loading Comments...</p>}>
            <Form formPromise={r} />
        </Suspense>
    )
}

export default DetailEdit;