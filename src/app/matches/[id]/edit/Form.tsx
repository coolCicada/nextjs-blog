'use client';
import { Input } from "@/components/ui/input";
import DateTimePickerC from './components/datetime-picker';
import { Game } from "../../components/games";
import { use, useCallback, useState } from "react";
import { Button } from '@/components/ui/button';
import { useRouter } from "next/navigation";

const Form = ({ formPromise }: { formPromise: Promise<Game | null> }) => {
    const r = use(formPromise);
    const [matchInfo, setMatchInfo] = useState<Game>(r || { match_name: '', match_time: new Date(), id: '' });
    const [loading, setLoading] = useState(false);
    const router = useRouter()
    const save = useCallback(async () => {
        setLoading(true);
        const response = await fetch(`/api/matches/${matchInfo.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(matchInfo),
          });
        const res = await response.json();
        if (res.msg === 'success') {
            router.replace('../')
        } else {
            alert(res.msg)
        }
        setLoading(false);
    }, [matchInfo, router]);
    return (
        <div className="h-full px-4 py-2 flex flex-col">
            <div className="flex-1">
                {r && <>
                    <p className="py-2">
                        <label className="text-sm pb-2">比赛名称</label>
                        <Input defaultValue={matchInfo?.match_name} onBlur={e => setMatchInfo({ ...matchInfo, match_name: e.target.value })} />
                    </p>
                    <p className="py-2">
                        <label className="text-sm pb-2">比赛时间</label>
                        <DateTimePickerC date={matchInfo?.match_time} onChange={e => setMatchInfo({ ...matchInfo, match_time: e || new Date() })} />
                    </p>
                </>}
            </div>
            <div>
                <Button className="w-full" disabled={loading} onClick={save}>保存</Button>
            </div>
        </div>
    )
}

export default Form;