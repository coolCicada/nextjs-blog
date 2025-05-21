'use client';
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const TopBar = ({ title }: { title: string }) => {
    const router = useRouter()
    return (
        <div className="flex items-center justify-center relative h-14 mb-4 -mx-4 -mt-2 px-4 bg-gray-100">
            <div className="absolute left-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ChevronLeft />
                </Button>
            </div>
            <h2>{title}</h2>
        </div>
    )
}

export default TopBar; 