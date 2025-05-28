import TopBar from "@/app/components/top-bar";
import Image from 'next/image';
import Tag from '@/app/static/svg/tag.svg';

const OwnConfigs = () => {
    return (
        <div className="h-full flex flex-col px-4 py-2">
            <div className="shrink-0">
                <TopBar title="配置" />
            </div>
            <div className="flex p-2 bg-gray-50 rounded-md">
                <div className="flex flex-col items-center">
                    <Image className='w-6' src={Tag} alt="Tag" />
                    <p>标签</p>
                </div>
            </div>
        </div>
    )
}

export default OwnConfigs;