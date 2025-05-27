'use client';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from 'next/navigation'

const JumpToAdd = () => {
    const router = useRouter()
    return (
        <Button variant="default" size="icon" onClick={() => router.push('/matches/add')}>
            <Plus />
        </Button>
    )
}

export default JumpToAdd;