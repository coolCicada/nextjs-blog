'use client';
import { Button } from '@/components/ui/button';
import { useRouter, usePathname } from 'next/navigation'

const JumpToEdit = () => {
    const router = useRouter()
    const pathname = usePathname();
    return (
       <Button className='w-full' onClick={() => router.push(`${pathname}/edit`)}>编辑</Button> 
    )
}

export default JumpToEdit;