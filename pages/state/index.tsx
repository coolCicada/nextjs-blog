import Four from "@/components/state/Four";
import One from "@/components/state/One";
import { memo } from "react";
import Style from '@/components/state/index.module.scss';

interface Props {

}

const CountryC: React.FC<Props> = () => {
    return (
        <div className={Style.container}>
            <One />
            <Four />
        </div>
    )
}

export default memo(CountryC);