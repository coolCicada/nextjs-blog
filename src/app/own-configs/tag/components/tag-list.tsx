import { Tag } from "@/app/db/tags";
import { use } from "react";

export default function TagList({ tagsPromise }: { tagsPromise: Promise<Tag[]> }) {
    const tags = use(tagsPromise)
    return (
        <div>
            {
                tags.map(item => (
                    <div key={item.id}>
                        {item.name}
                    </div>
                ))
            }
        </div>
    )
}