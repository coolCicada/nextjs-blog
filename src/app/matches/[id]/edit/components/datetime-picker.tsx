'use client';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { zhTW } from 'date-fns/locale';
const DateTimePickerC = ({ value, onChange }: { value?: Date, onChange?: (date: Date | undefined) => void }) => {
    return <DateTimePicker locale={zhTW} value={value} onChange={onChange} />
}

export default DateTimePickerC;