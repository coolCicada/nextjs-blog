'use client';
import { showAlertDialog } from '@/app/components/alert-dialog';
import { Button } from '@/components/ui/button';
import { useRouter } from "next/navigation";

const Delete = ({ id }: { id: string }) => {
    const router = useRouter()
    const deleteById = async () => {
        await showAlertDialog({
            title: '提示',
            content: '确认删除吗?',
        })
        await fetch(`/api/matches/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
        });
        router.back();
        setTimeout(() => {
            router.refresh();
        }, 100);
    }
    return (
        <Button className='w-full' onClick={deleteById}>删除</Button>
    )
}

export default Delete;