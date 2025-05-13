import { getMatchById } from "@/app/db";
import { Input } from "@/components/ui/input";
import dayjs from 'dayjs';

export const dynamic = 'force-dynamic';

interface Params {
    id: string;
}

const DetailEdit = async({ params }: { params: Promise<Params> }) => {
    const r = await getMatchById((await params).id)
    return (
        <div>
            {r && <>
                <p>
                    <Input defaultValue={r.match_name}/>
                </p>
                <p>{dayjs(r.match_time).format('YYYY-MM-DD HH:mm:ss')}</p>
            </>}
        </div>
    )
}

export default DetailEdit;