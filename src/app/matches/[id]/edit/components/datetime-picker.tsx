'use client';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { zhTW } from 'date-fns/locale';
const DateTimePickerC = ({ date, onChange }: { date: Date, onChange: (date: Date | undefined) => void }) => {
    return <DateTimePicker locale={zhTW} value={date} onChange={onChange} />
}

export default DateTimePickerC;