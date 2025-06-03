import TopBar from "@/app/components/top-bar";
import { getAllTags } from "@/app/db/tags";
import { Suspense } from "react";
import TagList from "./components/tag-list";

const Tag = () => {
    const getAllTagsPromise = getAllTags();
    return (
        <div className="h-full flex flex-col px-4 py-2">
            <div className="shrink-0">
                <TopBar title="标签列表" />
            </div>
            <Suspense fallback={<p>列表加载中...</p>}>
                <TagList tagsPromise={getAllTagsPromise} />
            </Suspense>
        </div>
    );
}

export default Tag;