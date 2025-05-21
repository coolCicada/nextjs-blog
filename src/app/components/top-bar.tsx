'use client';
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const TopBar = ({ title }: { title: string }) => {
    const router = useRouter()
    return (
        <div className="flex items-center justify-center relative h-12 mb-4">
            <div className="absolute left-0">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ChevronLeft />
                </Button>
            </div>
            <h2>{title}</h2>
        </div>
    )
}

export default TopBar; 